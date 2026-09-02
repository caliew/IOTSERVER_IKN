#!/usr/bin/env node
'use strict'; 
const fs = require('fs'); 
const net = require('net'); 
const readline = require('readline'); 
const PORT = 2001; 
const CONFIG_FILE = './settings.json'; // <- your JSON file path 
const SCAN_INTERVAL = 30 * 60 * 1000; // 30 minute 

/* ========================= 
DTU connection state 
========================= */ 

let dtuSocket = null; 
let dtuConnected = false; 
let lastSeen = 0; 
let heartbeatTimer = null; 
let lastGPIOStatus = null; // track last sent status 

/* ========================= 
Protocol escape / unescape 
========================= */ 
const PROTOCOL = { 
  unescape(buf) { 
    const out = []; 
    for (let i = 0; i < buf.length; i++) { 
      if (buf[i] === 0xFD && i + 1 < buf.length) { 
        if (buf[i + 1] === 0xED) { out.push(0xFD); i++; continue; } 
        if (buf[i + 1] === 0xEE) { out.push(0xFE); i++; continue; } 
      } 
      out.push(buf[i]); 
    } 
    return Buffer.from(out); 
  }, 
  escape(buf) { 
    const out = []; 
    for (const b of buf) { 
      if (b === 0xFD) out.push(0xFD, 0xED); 
      else if (b === 0xFE) out.push(0xFD, 0xEE); 
      else out.push(b); 
    } 
    return Buffer.from(out); 
  } 
}; 

/* ========================= 
Utility functions 
========================= */ 
const utils = { 
  hex(buf) { 
    return buf.toString('hex').toUpperCase().match(/.{1,2}/g).join(' '); 
  }, 
  now() { 
    return new Date().toISOString(); 
  }, 
  tryParseRegister(buf) { 
    if (buf.length < 21 || buf[15] !== 0x00) return null; 
    return { 
      deviceId: buf.readUInt32LE(0), 
      phone: buf.slice(4, 15).toString('ascii').replace(/\0/g, '') 
    }; 
  }, 
  log(msg) { 
    console.log(`[${utils.now()}] ${msg}`); 
  } 
}; 

/* ========================= 
Pre-defined DTU Frames 
========================= */ 
const FRAMES = { 
  on: { 
    payload: Buffer.from([0x01, 0x05, 0x00, 0x01, 0xFF, 0x00, 0xDD, 0xFA]), 
    meaning: 'DO HIGH (ON)' 
  }, 
  off: { 
    payload: Buffer.from([0x01, 0x05, 0x00, 0x01, 0x00, 0x00, 0x9C, 0x0A]), 
    meaning: 'DO LOW (OFF)' 
  } 
}; 

/* ========================= 
Load GPIO Status from JSON 
========================= */ 
function getGPIOStatus(filePath) { 
  try { 
    const raw = fs.readFileSync(filePath, 'utf-8'); 
    const data = JSON.parse(raw); 
    const gpio = data.IOT_SENSORS?.GPIO?.PORT; 
    if (!gpio) throw new Error('GPIO PORT not found in JSON'); 
    return Boolean(gpio.STATUS); 
  } catch (err) { 
    utils.log(`ERROR reading JSON: ${err.message}`); 
    return null; 
  } 
} 

/* ========================= 
Send GPIO frame to DTU 
========================= */ 
function sendGPIOFrame(status) { 
  if (!dtuConnected || !dtuSocket) return; 
  // Only send if status changed 
  if (status === lastGPIOStatus) return; 
  const frame = status ? FRAMES.on : FRAMES.off; 
  const escaped = PROTOCOL.escape(frame.payload); 
  dtuSocket.write(escaped); 
  utils.log(`AUTO-SENT >>> GPIO is ${status ? 'ON' : 'OFF'}`); 
  utils.log(` Original HEX: ${utils.hex(frame.payload)}`); 
  utils.log(` Escaped HEX: ${utils.hex(escaped)}`); 
  lastGPIOStatus = status; 
} 
/* ========================= 
TCP Server ========================= */ 

const server = net.createServer((socket) => { 
  dtuSocket = socket; 
  dtuConnected = true; 
  lastSeen = Date.now(); 
  utils.log(`DTU CONNECTED (IP: ${socket.remoteAddress}, Port: ${socket.remotePort})`); 
  // Heartbeat watchdog 
  heartbeatTimer = setInterval(() => { 
    if (!dtuConnected) return; 
    const diff = (Date.now() - lastSeen) / 1000; 
    if (diff > 15) { 
      utils.log(`[ALERT] DTU heartbeat timeout (${diff.toFixed(1)}s). Disconnecting...`); 
      dtuConnected = false; 
      if (dtuSocket) dtuSocket.destroy(); 
    } 
  }, 5000); 
  // Incoming data 
  socket.on('data', (data) => { 
    lastSeen = Date.now(); 
    const decoded = PROTOCOL.unescape(data); 
    if (decoded.length === 1 && decoded[0] === 0xFE) { 
      utils.log('RECV >>> HEARTBEAT'); 
      return; 
    } 
    const reg = utils.tryParseRegister(decoded); 
    if (reg) { 
      utils.log(`RECV >>> REGISTER deviceId=${reg.deviceId} phone=${reg.phone}`); 
    } else { 
      utils.log(`RECV HEX >>> ${utils.hex(decoded)}`); 
    } 
  }); 
  
  socket.on('close', () => { 
    utils.log('DTU DISCONNECTED'); 
    dtuConnected = false; 
    dtuSocket = null; 
    if (heartbeatTimer) clearInterval(heartbeatTimer); 
    heartbeatTimer = null; 
  }); 
  
  socket.on('error', (err) => utils.log(`SOCKET ERROR: ${err.message}`)); 
  // Send initial GPIO frame at connection 
  const gpioStatus = getGPIOStatus(CONFIG_FILE); 
  if (gpioStatus !== null) sendGPIOFrame(gpioStatus); 
}); 

/* ========================= 
Periodic GPIO file scan 
========================= */ 

setInterval(() => { 
  const status = getGPIOStatus(CONFIG_FILE); 
  if (status !== null) sendGPIOFrame(status); 
}, SCAN_INTERVAL); 

/* ========================= 
Keyboard command interface 
========================= */ 

const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); 
console.log('--------------------------------'); console.log('DTU Control Server'); 
console.log(`Listening on TCP port ${PORT}`); 
console.log('Commands: on | off | status | exit'); 
console.log('--------------------------------'); 

rl.on('line', (line) => { 
  const cmd = line.trim().toLowerCase(); 
  if (cmd === 'exit' || cmd === 'quit') { 
    utils.log('Shutting down...'); 
    if (heartbeatTimer) clearInterval(heartbeatTimer); 
    if (dtuSocket) dtuSocket.destroy(); 
    rl.close(); 
    server.close(); 
    process.exit(0); 
  } 
  if (cmd === 'status') { 
    if (!dtuConnected) utils.log('DTU OFFLINE'); 
    else utils.log(`DTU ONLINE (last seen ${((Date.now() - lastSeen)/1000).toFixed(1)}s ago)`); 
    return; 
  } 
  if (!dtuConnected || !dtuSocket) { 
    utils.log('WARN: No DTU connected'); 
    return; 
  } 
  const frame = FRAMES[cmd]; 
  if (!frame) { 
    utils.log('WARN: Unknown command'); 
    return; 
  } 
  const escaped = PROTOCOL.escape(frame.payload); 
  dtuSocket.write(escaped); 
  utils.log(`SENT >>> ${frame.meaning}`); 
  utils.log(` Original HEX: ${utils.hex(frame.payload)}`); 
  utils.log(` Escaped HEX: ${utils.hex(escaped)}`); 
}); 
/* ========================= 
Start TCP Server 
========================= */ 
server.listen(PORT, () => utils.log(`TCP Server listening on port ${PORT}`));