#!/usr/bin/env node
'use strict';

const fs = require('fs');
const net = require('net');
const readline = require('readline');

/* ========================= 
Configuration
========================= */
const CONFIG = {
  PORT: 2001,
  CONFIG_FILE: './settings.json',
  SCAN_INTERVAL: 5 * 60 * 1000, // 5 minutes
  HEARTBEAT_TIMEOUT: 15 * 1000, // 15 seconds
  HEARTBEAT_CHECK_INTERVAL: 5000 // 5 seconds
};

/* ========================= 
Protocol Constants & Utilities
========================= */
const PROTOCOL = {
  ESCAPE_MARKER: 0xFD,
  ESCAPE_SEQUENCES: {
    0xFD: 0xED,
    0xFE: 0xEE
  },
  
  unescape(buf) {
    const out = [];
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === this.ESCAPE_MARKER && i + 1 < buf.length) {
        const nextByte = buf[i + 1];
        if (nextByte === this.ESCAPE_SEQUENCES[0xFD]) {
          out.push(0xFD);
          i++;
        } else if (nextByte === this.ESCAPE_SEQUENCES[0xFE]) {
          out.push(0xFE);
          i++;
        } else {
          out.push(buf[i]);
        }
      } else {
        out.push(buf[i]);
      }
    }
    return Buffer.from(out);
  },

  escape(buf) {
    const out = [];
    for (const b of buf) {
      if (b === this.ESCAPE_MARKER) {
        out.push(this.ESCAPE_MARKER, this.ESCAPE_SEQUENCES[0xFD]);
      } else if (b === 0xFE) {
        out.push(this.ESCAPE_MARKER, this.ESCAPE_SEQUENCES[0xFE]);
      } else {
        out.push(b);
      }
    }
    return Buffer.from(out);
  }
};

/* ========================= 
GPIO Frame Definitions
========================= */
const GPIO_FRAMES = {
  "1": {
    on: Buffer.from([0x01, 0x05, 0x00, 0x01, 0xFF, 0x00, 0xDD, 0xFA]),
    off: Buffer.from([0x01, 0x05, 0x00, 0x01, 0x00, 0x00, 0x9C, 0x0A])
  }
  // TODO: Add port 2 when ready
  // "2": {
  //   on: Buffer.from([...]),
  //   off: Buffer.from([...])
  // }
};

/* ========================= 
Logger
========================= */
class Logger {
  static formatTime() {
    return new Date().toISOString();
  }

  static formatHex(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return 'INVALID BUFFER';
    }
    return buffer.toString('hex').toUpperCase().match(/.{1,2}/g)?.join(' ') || '';
  }

  static info(message) {
    console.log(`[${this.formatTime()}] ${message}`);
  }

  static error(message, error = null) {
    const errorMsg = error ? `: ${error.message}` : '';
    console.error(`[${this.formatTime()}] ERROR ${message}${errorMsg}`);
  }

  static warn(message) {
    console.warn(`[${this.formatTime()}] WARN ${message}`);
  }
}

/* ========================= 
DTU Connection Manager
========================= */
class DtuConnection {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.lastSeen = 0;
    this.heartbeatTimer = null;
    this.lastGpioStates = {}; // Track last sent status for each port
  }

  connect(socket) {
    this.socket = socket;
    this.connected = true;
    this.lastSeen = Date.now();
    this.lastGpioStates = {};
    
    Logger.info(`DTU CONNECTED (IP: ${socket.remoteAddress}, Port: ${socket.remotePort})`);
    
    this.startHeartbeatMonitor();
  }

  disconnect() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    
    this.connected = false;
    Logger.info('DTU DISCONNECTED');
  }

  startHeartbeatMonitor() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.heartbeatTimer = setInterval(() => {
      if (!this.connected) return;
      
      const timeSinceLastSeen = Date.now() - this.lastSeen;
      if (timeSinceLastSeen > CONFIG.HEARTBEAT_TIMEOUT) {
        Logger.warn(`DTU heartbeat timeout (${timeSinceLastSeen / 1000}s). Disconnecting...`);
        this.disconnect();
      }
    }, CONFIG.HEARTBEAT_CHECK_INTERVAL);
  }

  updateLastSeen() {
    this.lastSeen = Date.now();
  }

  sendFrame(frame, description) {
    if (!this.connected || !this.socket) {
      Logger.warn('Cannot send frame: No DTU connected');
      return false;
    }

    try {
      // Ensure frame is a Buffer
      if (!Buffer.isBuffer(frame)) {
        Logger.error(`Invalid frame type: ${typeof frame}`);
        return false;
      }
      
      const escaped = PROTOCOL.escape(frame);
      this.socket.write(escaped);
      Logger.info(`SENT >>> ${description}`);
      Logger.info(` Original HEX: ${Logger.formatHex(frame)}`);
      Logger.info(` Escaped HEX: ${Logger.formatHex(escaped)}`);
      return true;
    } catch (error) {
      Logger.error('Failed to send frame', error);
      return false;
    }
  }

  sendGpioFrame(portId, status) {
    // Convert portId to string for consistency
    const portKey = String(portId);
    const frameSet = GPIO_FRAMES[portKey];
    
    if (!frameSet) {
      Logger.warn(`No frame definition for port ${portId}`);
      return false;
    }

    // Check if state changed
    if (this.lastGpioStates[portKey] === status) {
      Logger.info(`GPIO Port ${portId} status unchanged (${status ? 'ON' : 'OFF'}), skipping send`);
      return false; // No change
    }

    const frame = status ? frameSet.on : frameSet.off;
    const description = `GPIO Port ${portId} ${status ? 'ON' : 'OFF'}`;
    
    const success = this.sendFrame(frame, description);
    if (success) {
      this.lastGpioStates[portKey] = status;
      Logger.info(`Updated last GPIO state for port ${portId}: ${status ? 'ON' : 'OFF'}`);
    }
    
    return success;
  }

  // Get current GPIO states from memory
  getCurrentGpioStates() {
    return { ...this.lastGpioStates };
  }

  handleData(data) {
    this.updateLastSeen();
    const decoded = PROTOCOL.unescape(data);
    
    // Handle heartbeat
    if (decoded.length === 1 && decoded[0] === 0xFE) {
      Logger.info('RECV >>> HEARTBEAT');
      return;
    }

    // Try to parse as register message
    const registerInfo = this.parseRegisterMessage(decoded);
    if (registerInfo) {
      Logger.info(`RECV >>> REGISTER deviceId=${registerInfo.deviceId} phone=${registerInfo.phone}`);
    } else {
      Logger.info(`RECV HEX >>> ${Logger.formatHex(decoded)}`);
    }
  }

  parseRegisterMessage(buf) {
    if (buf.length < 21 || buf[15] !== 0x00) return null;
    
    return {
      deviceId: buf.readUInt32LE(0),
      phone: buf.slice(4, 15).toString('ascii').replace(/\0/g, '')
    };
  }
}

/* ========================= 
Configuration Manager with State Tracking
========================= */
class ConfigManager {
  constructor() {
    this.lastConfigHash = null; // Track last config state
    this.lastGpioStates = {}; // Track last parsed GPIO states
  }

  loadConfig(filePath) {
    try {
      // Check if file exists and is readable
      if (!fs.existsSync(filePath)) {
        Logger.error(`Config file not found: ${filePath}`);
        return null;
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      
      // Calculate hash of current config to detect changes
      const currentHash = this.calculateHash(raw);
      
      // Check if config has actually changed
      if (currentHash === this.lastConfigHash) {
        Logger.info('Config unchanged, using cached values');
        return { data, changed: false, hash: currentHash };
      }
      
      Logger.info('Config changed, updating...');
      this.lastConfigHash = currentHash;
      return { data, changed: true, hash: currentHash };
      
    } catch (error) {
      Logger.error(`Failed to load config from ${filePath}`, error);
      return null;
    }
  }

  getGpioStates(configData) {
    try {
      const gpioMap = configData?.IOT_SENSORS?.GPIO;
      
      if (!gpioMap || typeof gpioMap !== 'object') {
        throw new Error('GPIO map not found in config');
      }

      const states = {};
      for (const [portId, gpio] of Object.entries(gpioMap)) {
        // Keep as string for consistency with frame definitions
        const status = Boolean(gpio.STATUS);
        states[portId] = status;
      }
      
      // Check if GPIO states have changed
      const changed = this.hasGpioStatesChanged(states);
      
      if (!changed) {
        Logger.info('GPIO states unchanged');
        return { states: null, changed: false };
      }
      
      // Update last known states
      this.lastGpioStates = { ...states };
      
      return { states, changed: true };
      
    } catch (error) {
      Logger.error('Failed to parse GPIO states', error);
      return { states: null, changed: false };
    }
  }

  // Calculate simple hash of config content
  calculateHash(content) {
    // Simple hash function - you could use crypto for more robust hashing
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Check if GPIO states have changed
  hasGpioStatesChanged(newStates) {
    const oldStates = this.lastGpioStates;
    
    // If no previous states, consider it changed
    if (Object.keys(oldStates).length === 0) {
      return true;
    }
    
    // Check all ports in both old and new states
    const allPorts = new Set([...Object.keys(oldStates), ...Object.keys(newStates)]);
    
    for (const portId of allPorts) {
      if (oldStates[portId] !== newStates[portId]) {
        Logger.info(`GPIO state changed for port ${portId}: ${oldStates[portId]} -> ${newStates[portId]}`);
        return true;
      }
    }
    
    return false;
  }

  // Get current GPIO states from cache
  getCachedGpioStates() {
    return { ...this.lastGpioStates };
  }
}

/* ========================= 
Application Main Class
========================= */
class DtuServer {
  constructor() {
    this.dtuConnection = new DtuConnection();
    this.configManager = new ConfigManager();
    this.server = null;
    this.scanInterval = null;
    this.rl = null;
    this.initialConfigSent = false; // Track if initial config has been sent
  }

  start() {
    this.setupTcpServer();
    this.startConfigScanner();
    this.setupCommandInterface();
  }

  setupTcpServer() {
    this.server = net.createServer((socket) => {
      this.dtuConnection.connect(socket);
      
      socket.on('data', (data) => {
        this.dtuConnection.handleData(data);
      });
      
      socket.on('close', () => {
        this.dtuConnection.disconnect();
      });
      
      socket.on('error', (error) => {
        Logger.error('Socket error', error);
      });
      
      // Send initial GPIO frames on connection
      this.sendInitialGpioFrames();
    });
    
    this.server.on('error', (error) => {
      Logger.error('Server error', error);
    });
    
    this.server.listen(CONFIG.PORT, () => {
      Logger.info(`TCP Server listening on port ${CONFIG.PORT}`);
    });
  }

  startConfigScanner() {
    this.scanInterval = setInterval(() => {
      this.checkAndUpdateGpioStates();
    }, CONFIG.SCAN_INTERVAL);
    
    Logger.info(`Started config scanner (interval: ${CONFIG.SCAN_INTERVAL / 1000}s)`);
  }

  checkAndUpdateGpioStates() {
    Logger.info('Checking for config changes...');
    
    const configResult = this.configManager.loadConfig(CONFIG.CONFIG_FILE);
    if (!configResult) {
      Logger.warn('Failed to load config, skipping update');
      return;
    }
    
    // Only parse GPIO states if config changed
    if (!configResult.changed && this.initialConfigSent) {
      Logger.info('Config file unchanged, skipping GPIO state check');
      return;
    }
    
    const gpioResult = this.configManager.getGpioStates(configResult.data);
    
    // Only apply GPIO states if they changed
    if (gpioResult.changed && gpioResult.states) {
      Logger.info(`Applying ${Object.keys(gpioResult.states).length} GPIO state(s)`);
      this.applyGpioStates(gpioResult.states);
      
      if (!this.initialConfigSent) {
        this.initialConfigSent = true;
        Logger.info('Initial GPIO configuration sent');
      }
    } else if (gpioResult.states === null) {
      Logger.warn('No GPIO states to apply');
    }
  }

  sendInitialGpioFrames() {
    Logger.info('Sending initial GPIO configuration...');
    this.checkAndUpdateGpioStates();
  }

  applyGpioStates(gpioStates) {
    let changesApplied = 0;
    let skipped = 0;
    
    for (const [portId, status] of Object.entries(gpioStates)) {
      // Only send if we have frame definitions for this port
      if (GPIO_FRAMES[portId]) {
        const sent = this.dtuConnection.sendGpioFrame(portId, status);
        if (sent) {
          changesApplied++;
        } else {
          skipped++;
        }
      } else {
        Logger.warn(`No frame definition for port ${portId}, skipping`);
        skipped++;
      }
    }
    
    if (changesApplied > 0) {
      Logger.info(`Applied ${changesApplied} GPIO change(s), skipped ${skipped}`);
    } else if (skipped > 0) {
      Logger.info(`No GPIO changes needed, all ${skipped} port(s) unchanged`);
    }
  }

  setupCommandInterface() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\n' + '='.repeat(40));
    console.log('DTU Control Server');
    console.log('='.repeat(40));
    console.log(`Listening on TCP port ${CONFIG.PORT}`);
    console.log(`Config file: ${CONFIG.CONFIG_FILE}`);
    console.log(`Scan interval: ${CONFIG.SCAN_INTERVAL / 1000} seconds`);
    console.log('='.repeat(40));
    console.log('Commands: on [port] | off [port] | status | exit | help');
    console.log('Example: on 1, off 2, status');
    console.log('='.repeat(40) + '\n');
    
    this.rl.on('line', (line) => {
      this.handleCommand(line.trim());
    });
  }

  handleCommand(commandLine) {
    const parts = commandLine.toLowerCase().split(/\s+/);
    const command = parts[0];
    const portId = parts[1];
    
    switch (command) {
      case 'exit':
      case 'quit':
        this.shutdown();
        break;
        
      case 'status':
        this.showStatus();
        break;
        
      case 'on':
      case 'off':
        this.handleGpioCommand(command, portId);
        break;
        
      case 'help':
        this.showHelp();
        break;
        
      case 'check':
        this.manualConfigCheck();
        break;
        
      case 'states':
        this.showCurrentStates();
        break;
        
      default:
        Logger.warn(`Unknown command: ${command}`);
        this.showHelp();
    }
  }

  handleGpioCommand(command, portId) {
    if (!portId) {
      Logger.warn('Port ID required. Usage: on 1, off 2');
      return;
    }
    
    if (!this.dtuConnection.connected) {
      Logger.warn('No DTU connected');
      return;
    }
    
    const status = command === 'on';
    const success = this.dtuConnection.sendGpioFrame(portId, status);
    
    if (success) {
      Logger.info(`Command sent: Port ${portId} ${command.toUpperCase()}`);
    }
  }

  showStatus() {
    console.log('\n' + '-'.repeat(40));
    console.log('DTU Server Status');
    console.log('-'.repeat(40));
    
    if (!this.dtuConnection.connected) {
      console.log('DTU Status: OFFLINE');
    } else {
      const timeSinceLastSeen = (Date.now() - this.dtuConnection.lastSeen) / 1000;
      console.log('DTU Status: ONLINE');
      console.log(`Last seen: ${timeSinceLastSeen.toFixed(1)} seconds ago`);
    }
    
    // Show current GPIO states
    const currentStates = this.dtuConnection.getCurrentGpioStates();
    const cachedStates = this.configManager.getCachedGpioStates();
    
    console.log('\nCurrent GPIO States:');
    if (Object.keys(currentStates).length === 0) {
      console.log('  No GPIO states sent yet');
    } else {
      for (const [portId, status] of Object.entries(currentStates)) {
        console.log(`  Port ${portId}: ${status ? 'ON' : 'OFF'}`);
      }
    }
    
    console.log('\nCached Config GPIO States:');
    if (Object.keys(cachedStates).length === 0) {
      console.log('  No cached GPIO states');
    } else {
      for (const [portId, status] of Object.entries(cachedStates)) {
        console.log(`  Port ${portId}: ${status ? 'ON' : 'OFF'}`);
      }
    }
    
    console.log('-'.repeat(40) + '\n');
  }

  manualConfigCheck() {
    Logger.info('Manual config check requested...');
    this.checkAndUpdateGpioStates();
  }

  showCurrentStates() {
    const currentStates = this.dtuConnection.getCurrentGpioStates();
    console.log('\nCurrent GPIO States in Memory:');
    for (const [portId, status] of Object.entries(currentStates)) {
      console.log(`  Port ${portId}: ${status ? 'ON' : 'OFF'}`);
    }
    console.log('');
  }

  showHelp() {
    console.log('\nAvailable commands:');
    console.log('  on <port>     - Turn GPIO port ON');
    console.log('  off <port>    - Turn GPIO port OFF');
    console.log('  status        - Show DTU connection and GPIO status');
    console.log('  states        - Show current GPIO states in memory');
    console.log('  check         - Manually check config file for changes');
    console.log('  exit/quit     - Shutdown the server');
    console.log('  help          - Show this help message');
    console.log('\nAvailable ports: ' + Object.keys(GPIO_FRAMES).join(', '));
    console.log(`Config file: ${CONFIG.CONFIG_FILE}`);
    console.log(`Scan interval: ${CONFIG.SCAN_INTERVAL / 1000} seconds\n`);
  }

  shutdown() {
    Logger.info('Shutting down...');
    
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      Logger.info('Config scanner stopped');
    }
    
    if (this.rl) {
      this.rl.close();
      Logger.info('Command interface closed');
    }
    
    this.dtuConnection.disconnect();
    
    if (this.server) {
      this.server.close(() => {
        Logger.info('TCP server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

/* ========================= 
Application Entry Point
========================= */
try {
  const server = new DtuServer();
  server.start();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    server.shutdown();
  });
  
  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    server.shutdown();
  });
  
} catch (error) {
  Logger.error('Failed to start server', error);
  process.exit(1);
}