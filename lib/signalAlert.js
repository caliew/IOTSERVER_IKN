/*
 * Signal Alert Intermediary — lib/signalAlert.js
 *
 * Centralized service that sits between the TCP decode pipeline and the
 * remote GPIO controller at http://202.59.9.164:5000/api/gpio/control
 *
 * Architecture:
 *   TCP Server (server.js)
 *     │  decodes bytes → evaluates thresholds
 *     │
 *     ▼
 *   signalAlert.notify(siteName, macId, sensorConfig, isAlert, message, socketArr)
 *     │
 *     ├─ Loads registry.json  →  site → { tcpPort, ports[] }
 *     ├─ Tracks alert state per sensor  (IN_ALERT / NORMAL)
 *     │
 *     ├─ State change NORMAL → IN_ALERT:
 *     │     ├─ POST http://202.59.9.164:5000/api/gpio/control { state:"ON"  }
 *     │     └─ Send Modbus coil ON  frame to socket matching registry.tcpPort
 *     │
 *     └─ State change IN_ALERT → NORMAL:
 *           ├─ POST http://202.59.9.164:5000/api/gpio/control { state:"OFF" }
 *           └─ Send Modbus coil OFF frame to socket matching registry.tcpPort
 *
 * Registry file:  .data/signalAlert/registry.json
 *
 *   {
 *     "IKN_PATHOLOGY": {
 *       "enabled": true,
 *       "tcpPort": 2001,            ← which Modbus TCP port this site's DTU connects on
 *       "ports": [
 *         { "port": 1, "name": "SIREN 1", "onAlert": true, "onClear": true },
 *         { "port": 2, "name": "SIREN 2", "onAlert": true, "onClear": true }
 *       ]
 *     },
 *     "FUTURE_SITE": {
 *       "enabled": true,
 *       "tcpPort": 2002,            ← different DTU port for a different site
 *       "ports": [{ "port": 1, "name": "ALARM", "onAlert": true, "onClear": true }]
 *     }
 *   }
 *
 * Log file: .logs/_SIGNALALERT.log
 */

'use strict';

const http       = require('http');
const fs         = require('fs');
const path       = require('path');
const _logs      = require('./logs');
const fileStores = require('./fileStores');

// ─────────────────────────────────────────────────────────────────────────────
// GPIO HTTP Server config (tested & working endpoint)
// ─────────────────────────────────────────────────────────────────────────────
const GPIO_HTTP = {
  hostname: '202.59.9.164',
  port:     5000,
  path:     '/api/gpio/control',
  method:   'POST',
  timeout:  8000   // ms
};

// ─────────────────────────────────────────────────────────────────────────────
// Modbus coil ON / OFF frames
//   Port 1: Coil 0x0001   Port 2: Coil 0x0002
//   Standard Modbus FC05 (Write Single Coil)
// ─────────────────────────────────────────────────────────────────────────────
const MODBUS_FRAMES = {
  ON: {
    1: [
      Buffer.from([0x01, 0x05, 0x00, 0x01, 0xFF, 0x00, 0xDD, 0xFA]),
      Buffer.from([0x01, 0x05, 0x00, 0x00, 0xFF, 0x00, 0x8C, 0x3A])
    ],
    2: Buffer.from([0x01, 0x05, 0x00, 0x02, 0xFF, 0x00, 0x2D, 0xFA])
  },
  OFF: {
    1: [
      Buffer.from([0x01, 0x05, 0x00, 0x01, 0x00, 0x00, 0x9C, 0x0A]),
      Buffer.from([0x01, 0x05, 0x00, 0x00, 0x00, 0x00, 0xCD, 0xCA])
    ],
    2: Buffer.from([0x01, 0x05, 0x00, 0x02, 0x00, 0x00, 0x6C, 0x0A])
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Registry — maps site names to GPIO config including which tcpPort to use
//
// Loaded from: .data/signalAlert/registry.json
// Auto-reloaded every 60 s so changes take effect without server restart.
// ─────────────────────────────────────────────────────────────────────────────
const REGISTRY_PATH = path.join(__dirname, '/../.data/signalAlert/registry.json');

let _registry         = {};
let _registryLastLoad = 0;
const REGISTRY_TTL_MS = 60 * 1000;

function _loadRegistry(forceReload) {
  const now = Date.now();
  if (!forceReload && (now - _registryLastLoad < REGISTRY_TTL_MS) && Object.keys(_registry).length > 0) {
    return _registry;
  }
  try {
    if (fs.existsSync(REGISTRY_PATH)) {
      const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
      _registry = JSON.parse(raw);
      _registryLastLoad = now;
      // console.log('[SIGNALALERT.JS] Registry loaded — ' + Object.keys(_registry).length + ' site(s): [' + Object.keys(_registry).join(', ') + ']');
    }
  } catch (err) {
    console.error('[SIGNALALERT.JS] Registry load error:', err.message);
  }
  return _registry;
}

function _saveRegistry(data) {
  try {
    const dir = path.dirname(REGISTRY_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2), 'utf8');
    _registry = data;
    _registryLastLoad = Date.now();
  } catch (err) {
    console.error('[SIGNALALERT.JS] Registry save error:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Alert state tracker
//   Key: `SITENAME::MACID`
//   Value: { inAlert, since, lastMessage }
// ─────────────────────────────────────────────────────────────────────────────
const _alertState = {};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────
const lib = {};

// ─────────────────────────────────────────────────────────────────────────────
// lib.notify
//
//  Main entry point.  Called from server.js after every sensor evaluation.
//
//  @param {string}  siteName      - Site key  e.g. 'IKN_PATHOLOGY'
//  @param {string}  macId         - Sensor MAC ID or DTU-SENSORID key
//  @param {Object}  sensorConfig  - Sensor config block from settings.json
//  @param {boolean} isAlert       - true = threshold breached, false = normal
//  @param {string}  [message]     - Alert message text
//  @param {Array}   [socketArr]   - server.socketArr (live TCP sockets)
// ─────────────────────────────────────────────────────────────────────────────
lib.notify = function(siteName, macId, sensorConfig, isAlert, message, socketArr) {
  if (!siteName || !macId) return;
  socketArr = socketArr || [];

  const registry  = _loadRegistry();
  const siteEntry = registry[siteName] || null;

  // Track state regardless of registry (future registration may happen)
  const stateKey  = String(siteName).toUpperCase() + '::' + String(macId).toUpperCase();
  const prevState = _alertState[stateKey];
  const wasAlert  = prevState ? prevState.inAlert : false;

  const transitionToAlert  = isAlert  && !wasAlert;
  const transitionToNormal = !isAlert && wasAlert;

  // Always update state
  _alertState[stateKey] = {
    siteName:    siteName,
    macId:       macId,
    inAlert:     isAlert,
    since:       new Date().toISOString(),
    lastMessage: message || ''
  };

  if (!transitionToAlert && !transitionToNormal) return;  // no change

  if (!siteEntry || !siteEntry.enabled) {
    _logs.append('_SIGNALALERT',
      '[SIGNALALERT.JS] Site not in registry or disabled: ' + siteName +
      ' isAlert=' + isAlert + ' macId=' + macId,
      function() {});
    return;
  }

  const tcpPort = siteEntry.tcpPort || null;
  const ports   = siteEntry.ports   || [];
  const state   = transitionToAlert ? 'ON' : 'OFF';
  const logMsg  = transitionToAlert
    ? (message || ('ALERT from ' + macId + ' at ' + siteName))
    : ('CLEAR: ' + macId + ' at ' + siteName + ' returned to normal');

  console.log('[SIGNALALERT.JS] STATE CHANGE → ' + state +
    ' site=' + siteName + ' macId=' + macId +
    ' tcpPort=' + (tcpPort || 'NONE') +
    ' ports=[' + ports.map(function(p) { return p.port; }).join(',') + ']');

  _logs.append('_SIGNALALERT',
    '[SIGNALALERT.JS] ' + state + ' site=' + siteName +
    ' macId=' + macId + ' tcpPort=' + tcpPort + ' msg=' + logMsg,
    function() {});

  ports.forEach(function(portCfg) {
    if (!portCfg.port) return;
    const shouldFire = (state === 'ON' && portCfg.onAlert !== false) ||
                       (state === 'OFF' && portCfg.onClear !== false);
    if (!shouldFire) return;

    // ── 1. HTTP endpoint (remote GPIO server) ──
    _callHTTPEndpoint(siteName, portCfg.port, state, logMsg, sensorConfig);

    // ── 2. Modbus TCP socket (local DTU, routed by tcpPort) ──
    if (tcpPort && socketArr.length > 0) {
      _sendModbusGPIO(siteName, tcpPort, portCfg.port, state, socketArr);
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// lib.forceGPIO
//
//  Manually fire ON or OFF for a site/port regardless of alert state.
//  Useful for testing or manual override via API.
//
//  @param {string} siteName
//  @param {number} port       - GPIO port number (1, 2, …)
//  @param {string} state      - 'ON' or 'OFF'
//  @param {Array}  socketArr  - server.socketArr
//  @param {string} [reason]
// ─────────────────────────────────────────────────────────────────────────────
lib.forceGPIO = function(siteName, port, state, socketArr, reason) {
  const normalState = String(state).toUpperCase() === 'ON' ? 'ON' : 'OFF';
  socketArr = socketArr || [];
  const registry  = _loadRegistry();
  const siteEntry = registry[siteName] || {};
  const tcpPort   = siteEntry.tcpPort  || null;

  _callHTTPEndpoint(siteName, port, normalState, reason || 'MANUAL OVERRIDE', null);
  if (tcpPort && socketArr.length > 0) {
    _sendModbusGPIO(siteName, tcpPort, port, normalState, socketArr);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// lib.getState      — in-memory alert state map (for API/debug)
// lib.getRegistry   — force-reload registry from disk
// lib.registerSite  — add/update a site and persist to disk
// lib.deregisterSite— remove a site and persist to disk
// ─────────────────────────────────────────────────────────────────────────────
lib.getState = function() {
  const copy = {};
  Object.keys(_alertState).forEach(function(k) { copy[k] = Object.assign({}, _alertState[k]); });
  return copy;
};

lib.getRegistry = function() {
  return _loadRegistry(true);
};

lib.registerSite = function(siteName, config) {
  const reg = _loadRegistry();
  reg[siteName] = Object.assign({ enabled: true, tcpPort: null, ports: [] }, config);
  _saveRegistry(reg);
  console.log('[SIGNALALERT.JS] Site registered:', siteName, JSON.stringify(reg[siteName]));
};

lib.deregisterSite = function(siteName) {
  const reg = _loadRegistry();
  delete reg[siteName];
  _saveRegistry(reg);
  console.log('[SIGNALALERT.JS] Site deregistered:', siteName);
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE — HTTP endpoint call
// ─────────────────────────────────────────────────────────────────────────────
function _callHTTPEndpoint(siteName, port, state, message, sensorConfig) {
  const body = JSON.stringify({
    site:    siteName,
    port:    port,
    state:   state,
    sensor:  (sensorConfig && sensorConfig.NAME) ? sensorConfig.NAME : siteName,
    message: message || '',
    ts:      new Date().toISOString()
  });

  const options = {
    hostname: GPIO_HTTP.hostname,
    port:     GPIO_HTTP.port,
    path:     GPIO_HTTP.path,
    method:   GPIO_HTTP.method,
    timeout:  GPIO_HTTP.timeout,
    headers: {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const tag = '[SIGNALALERT.JS] HTTP ' + state + ' site=' + siteName + ' port=' + port;
  console.log(tag + ' → ' + GPIO_HTTP.hostname + ':' + GPIO_HTTP.port + GPIO_HTTP.path);

  try {
    const req = http.request(options, function(res) {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', function(chunk) { raw += chunk; });
      res.on('end', function() {
        let parsed = {};
        try { parsed = JSON.parse(raw); } catch (_) { parsed = { raw: raw }; }
        const result = tag + ' HTTP=' + res.statusCode + ' resp=' + JSON.stringify(parsed);
        console.log(result);
        _logs.append('_SIGNALALERT', result, function() {});

        if (res.statusCode >= 200 && res.statusCode < 300 && state === 'ON') {
          try {
            fileStores.recordIncident(siteName, {
              macId:      String(port),
              sensorName: (sensorConfig && sensorConfig.NAME) ? sensorConfig.NAME : ('Port ' + port),
              alertType:  'GPIO_ALERT_ON',
              message:    message || '',
              timestamp:  new Date().toISOString()
            });
          } catch (e) {
            console.error('[SIGNALALERT.JS] fileStores.recordIncident error:', e.message);
          }
        }
      });
    });

    req.on('timeout', function() {
      console.warn(tag + ' TIMEOUT');
      _logs.append('_SIGNALALERT', tag + ' TIMEOUT', function() {});
      req.destroy();
    });
    req.on('error', function(err) {
      const msg = tag + ' ERROR=' + err.message;
      console.error(msg);
      _logs.append('_SIGNALALERT', msg, function() {});
    });

    req.write(body);
    req.end();
  } catch (err) {
    const msg = tag + ' EXCEPTION=' + err.message;
    console.error(msg);
    _logs.append('_SIGNALALERT', msg, function() {});
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE — Modbus TCP socket GPIO frame
//
//  Selects sockets from socketArr where socket.PORT === tcpPort, then sends
//  the appropriate Modbus FC05 coil ON/OFF frame.
//  Falls back to AT command string if no Modbus-framed socket is available.
//
//  @param {string} siteName
//  @param {number} tcpPort   - Registry-defined TCP port (e.g. 2001, 2002)
//  @param {number} coilPort  - GPIO coil number (1 or 2)
//  @param {string} state     - 'ON' or 'OFF'
//  @param {Array}  socketArr - server.socketArr
// ─────────────────────────────────────────────────────────────────────────────
function _sendModbusGPIO(siteName, tcpPort, coilPort, state, socketArr) {
  const tag = '[SIGNALALERT.JS] MODBUS ' + state +
    ' site=' + siteName + ' tcpPort=' + tcpPort + ' coil=' + coilPort;

  // Filter live sockets by the registered tcpPort
  const matched = (socketArr || []).filter(function(s) {
    return Number(s.PORT) === Number(tcpPort) &&
           s.SOCKET &&
           typeof s.SOCKET.write === 'function';
  });

  if (matched.length === 0) {
    console.warn(tag + ' — NO ACTIVE SOCKET on port ' + tcpPort);
    _logs.append('_SIGNALALERT', tag + ' NO_SOCKET', function() {});
    return;
  }

  // Pick the Modbus frame for this coil (default to coil 1 if not mapped)
  const frameBank = state === 'ON' ? MODBUS_FRAMES.ON : MODBUS_FRAMES.OFF;
  const rawFrame  = frameBank[coilPort] || frameBank[1];
  const frameList = Array.isArray(rawFrame) ? rawFrame : [rawFrame];

  matched.forEach(function(s) {
    frameList.forEach(function(f) {
      const escaped = _escapeModbus(f);
      try {
        s.SOCKET.write(escaped);
        const ok = tag + ' SENT GW=' + (s.GATEWAYID || '?') + ' HEX=' + f.toString('hex').toUpperCase();
        console.log(ok);
        _logs.append('_SIGNALALERT', ok, function() {});
      } catch (e) {
        const fail = tag + ' WRITE_ERROR GW=' + (s.GATEWAYID || '?') + ' err=' + e.message;
        console.error(fail);
        _logs.append('_SIGNALALERT', fail, function() {});
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE — Modbus byte escape
//   FD → FD ED,  FE → FD EE  (mirrors MODBUS_PROTOCOL.escape in server.js)
// ─────────────────────────────────────────────────────────────────────────────
function _escapeModbus(buf) {
  const out = [];
  for (var i = 0; i < buf.length; i++) {
    var b = buf[i];
    if      (b === 0xFD) { out.push(0xFD, 0xED); }
    else if (b === 0xFE) { out.push(0xFD, 0xEE); }
    else                 { out.push(b); }
  }
  return Buffer.from(out);
}

// Bootstrap — load registry immediately on module init
_loadRegistry();

module.exports = lib;
