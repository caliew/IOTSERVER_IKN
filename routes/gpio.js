// routes/gpio.js
/*
 * GPIO CONTROL ENDPOINT
 *
 * Supports both:
 *   1. Modbus RTU Binary Frames with 0xFD Byte-Escaping (from DTU_MODBUS_SERVER)
 *   2. AT-command writes (F8L10ST DTU ASCII Mode)
 *
 * MODBUS REFERENCE (Coil Write Function 0x05):
 *   Port 1 ON  : 01 05 00 01 FF 00 DD FA (Escaped over socket)
 *   Port 1 OFF : 01 05 00 01 00 00 9C 0A (Escaped over socket)
 *
 * AT-COMMAND REFERENCE (F8L10ST DTU):
 *   SET GPIO state  : AT+NS1={DTUID},{GPIO},{STATE}\r\n
 *   GET GPIO status : AT+NV1={DTUID}\r\n
 *
 * ROUTES:
 *   POST /api/gpio/control  - Set a GPIO port ON or OFF (protocol: 'modbus' | 'at')
 *   POST /api/gpio/alert    - Internal: auto-trigger GPIO ON when alert fires
 *   GET  /api/gpio/status   - Query current GPIO state / supported frames
 */

const express = require('express');
const router  = express.Router();
const cors    = require('cors');
const auth    = require('../middleware/auth');
const _logs   = require('../lib/logs');

/* ============================================================== 
 * Protocol Constants & Escaping (DTU_MODBUS_SERVER)
 * ============================================================== */
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

/* ============================================================== 
 * Pre-defined Modbus Binary Frames & Dynamic Generator
 * ============================================================== */
function calcCRC16(buf) {
  let crc = 0xFFFF;
  for (let pos = 0; pos < buf.length; pos++) {
    crc ^= buf[pos];
    for (let i = 8; i !== 0; i--) {
      if ((crc & 0x0001) !== 0) {
        crc >>= 1;
        crc ^= 0xA001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc;
}

function buildModbusCoilFrame(portId, state, slaveId = 1) {
  const p = Number(portId) || 1;
  const valHigh = state ? 0xFF : 0x00;
  const head = Buffer.from([slaveId, 0x05, (p >> 8) & 0xFF, p & 0xFF, valHigh, 0x00]);
  const crc = calcCRC16(head);
  const lowByte = crc & 0xFF;
  const highByte = (crc >> 8) & 0xFF;
  return Buffer.concat([head, Buffer.from([lowByte, highByte])]);
}

const GPIO_FRAMES = {
  "1": {
    on: Buffer.from([0x01, 0x05, 0x00, 0x01, 0xFF, 0x00, 0xDD, 0xFA]),
    off: Buffer.from([0x01, 0x05, 0x00, 0x01, 0x00, 0x00, 0x9C, 0x0A])
  },
  "2": {
    on: Buffer.from([0x01, 0x05, 0x00, 0x02, 0xFF, 0x00, 0x2D, 0xFA]),
    off: Buffer.from([0x01, 0x05, 0x00, 0x02, 0x00, 0x00, 0x6C, 0x0A])
  }
};

function getModbusFrame(portId, state, slaveId = 1) {
  const portKey = String(portId);
  if (GPIO_FRAMES[portKey]) {
    return state ? GPIO_FRAMES[portKey].on : GPIO_FRAMES[portKey].off;
  }
  return buildModbusCoilFrame(portId, state, slaveId);
}

function formatHex(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) return '';
  return buffer.toString('hex').toUpperCase().match(/.{1,2}/g)?.join(' ') || '';
}

// ----------------------------------------------------------------
// server module is required lazily so circular-dependency is safe.
// gpio.js is mounted after server is fully initialised.
// ----------------------------------------------------------------
function getSocketArr() {
  try {
    return require('../lib/server').socketArr || [];
  } catch (_) {
    return [];
  }
}

router.use(cors({ origin: '*' }));

// ---------------------------------------------------------------
// Helper: find all active sockets for GPIO control
// Bypasses filtering and uses socket connected to port 2001 (4G DTU)
// ---------------------------------------------------------------
function findSockets(siteName, dtuid) {
  const arr = getSocketArr();
  if (!arr || arr.length === 0) return [];
  
  const activeSockets = arr.filter(
    (s) => s.SOCKET && typeof s.SOCKET.write === 'function'
  );
  if (activeSockets.length === 0) return [];

  // Directly target 4G DTU sockets connected on port 2001
  const sockets2001 = activeSockets.filter((s) => s.PORT === 2001);
  if (sockets2001.length > 0) {
    return sockets2001;
  }

  // Fallback to active sockets if port 2001 is not connected yet
  return activeSockets;
}

// ---------------------------------------------------------------
// Helper: write an AT command to matching sockets
// ---------------------------------------------------------------
function writeATCommand(sockets, atCommand) {
  const results = [];
  sockets.forEach((s) => {
    try {
      s.SOCKET.write(atCommand);
      results.push({ GATEWAYID: s.GATEWAYID, command: atCommand.trim(), sent: true });
      console.log(
        `[GPIO.JS] ✅ SENT AT => GATEWAY=${s.GATEWAYID} CMD=[${atCommand.trim()}]`
      );
      _logs.append('_GPIO', `[GPIO.JS] SENT AT GATEWAY=${s.GATEWAYID} CMD=${atCommand.trim()}`, () => {});
    } catch (err) {
      results.push({ GATEWAYID: s.GATEWAYID, command: atCommand.trim(), sent: false, error: err.message });
      console.error(`[GPIO.JS] ❌ FAILED AT => GATEWAY=${s.GATEWAYID}`, err.message);
      _logs.append('_GPIO', `[GPIO.JS] FAILED AT GATEWAY=${s.GATEWAYID} CMD=${atCommand.trim()} ERR=${err.message}`, () => {});
    }
  });
  return results;
}

// ---------------------------------------------------------------
// Helper: write escaped Modbus binary frame to matching sockets
// ---------------------------------------------------------------
function writeModbusCommand(sockets, frame, description) {
  const results = [];
  const escaped = PROTOCOL.escape(frame);
  const hexRaw = formatHex(frame);
  const hexEscaped = formatHex(escaped);

  sockets.forEach((s) => {
    try {
      s.SOCKET.write(escaped);
      results.push({
        GATEWAYID: s.GATEWAYID,
        description,
        hexRaw,
        hexEscaped,
        sent: true
      });
      console.log(
        `[GPIO.JS] ✅ SENT MODBUS => GW=${s.GATEWAYID} DESC=[${description}] RAW=[${hexRaw}] ESCAPED=[${hexEscaped}]`
      );
      _logs.append('_GPIO', `[GPIO.JS] SENT MODBUS GW=${s.GATEWAYID} DESC=${description} HEX=${hexRaw}`, () => {});
    } catch (err) {
      results.push({
        GATEWAYID: s.GATEWAYID,
        description,
        hexRaw,
        hexEscaped,
        sent: false,
        error: err.message
      });
      console.error(`[GPIO.JS] ❌ FAILED MODBUS => GW=${s.GATEWAYID}`, err.message);
      _logs.append('_GPIO', `[GPIO.JS] FAILED MODBUS GW=${s.GATEWAYID} DESC=${description} ERR=${err.message}`, () => {});
    }
  });
  return results;
}

// ==============================================================
// POST /api/gpio/control
// Body: { dtuid, portId, state, siteName, protocol, customFrameHex, slaveId }
//   dtuid          : number|string – optional DTU ID or port (defaults to 2001 or matching socket)
//   portId         : number  – GPIO port number (1, 2 …)
//   state          : boolean – true = ON, false = OFF
//   siteName       : string  – optional, e.g. "AEROSOFT", "IKN_OPROOM"
//   protocol       : string  – "modbus" (default) or "at"
//   customFrameHex : string  – optional hex string if overriding standard Modbus frame
//   slaveId        : number  – optional Modbus slave ID (default 1)
// ==============================================================
router.post('/control', auth, (req, res) => {
  const { dtuid, portId, state, siteName, protocol, customFrameHex, slaveId } = req.body;

  if (portId === undefined || state === undefined) {
    return res.status(400).json({
      error: 'Missing required fields: portId, state',
    });
  }

  const effectiveDtuid = dtuid !== undefined ? dtuid : 2001;
  const sockets = findSockets(siteName, effectiveDtuid);
  if (sockets.length === 0) {
    console.warn(`[GPIO.JS] ⚠️ No active sockets found (siteName=${siteName}, dtuid=${effectiveDtuid})`);
    return res.status(503).json({
      error: 'No active gateway sockets available',
    });
  }

  const useModbus = protocol === 'modbus' || protocol === undefined || customFrameHex;

  if (useModbus) {
    let frame = null;

    if (customFrameHex) {
      frame = Buffer.from(customFrameHex.replace(/\s+/g, ''), 'hex');
    } else {
      frame = getModbusFrame(portId, Boolean(state), Number(slaveId) || 1);
    }

    const description = `GPIO Port ${portId} ${state ? 'ON' : 'OFF'}`;
    const results = writeModbusCommand(sockets, frame, description);
    const anySent = results.some((r) => r.sent);

    return res.status(anySent ? 200 : 502).json({
      success    : anySent,
      protocol   : 'modbus',
      description,
      dtuid,
      portId,
      state      : Boolean(state),
      hexRaw     : formatHex(frame),
      hexEscaped : formatHex(PROTOCOL.escape(frame)),
      sockets    : results,
    });
  } else {
    // Standard AT-Command Mode
    const stateVal = state ? 1 : 0;
    const atCommand = `AT+NS1=${dtuid},${portId},${stateVal}\r\n`;

    const results = writeATCommand(sockets, atCommand);
    const anySent = results.some((r) => r.sent);

    return res.status(anySent ? 200 : 502).json({
      success  : anySent,
      protocol : 'at',
      command  : atCommand.trim(),
      dtuid,
      portId,
      state    : stateVal,
      sockets  : results,
    });
  }
});

// ==============================================================
// GET /api/gpio/status
// Query: ?dtuid=102&siteName=IKN_OPROOM&protocol=at
// ==============================================================
router.get('/status', auth, (req, res) => {
  const { dtuid, siteName, protocol } = req.query;

  if (!dtuid) {
    return res.status(400).json({ error: 'Missing required query param: dtuid' });
  }

  const sockets = findSockets(siteName, dtuid);
  if (sockets.length === 0) {
    return res.status(503).json({
      error: 'No active gateway sockets available',
    });
  }

  if (protocol === 'at') {
    const atCommand = `AT+NV1=${dtuid}\r\n`;
    const results = writeATCommand(sockets, atCommand);
    const anySent = results.some((r) => r.sent);

    return res.status(anySent ? 200 : 502).json({
      success  : anySent,
      protocol : 'at',
      command  : atCommand.trim(),
      dtuid,
      note     : 'GPIO state will be returned asynchronously via the TCP data channel',
      sockets  : results,
    });
  }

  // Default Modbus status info
  return res.status(200).json({
    success         : true,
    protocol        : 'modbus',
    activeSockets   : sockets.length,
    supportedPorts  : Object.keys(GPIO_FRAMES),
    dtuid
  });
});

// ==============================================================
// POST /api/gpio/alert
// INTERNAL endpoint — called by DISPATCH_ALERT in server.js
// Body: { dtuid, portId, siteName, state, protocol }
// ==============================================================
router.post('/alert', (req, res) => {
  const { dtuid, portId, siteName, state, protocol } = req.body;

  if (dtuid === undefined || portId === undefined) {
    return res.status(400).json({ error: 'Missing required fields: dtuid, portId' });
  }

  const sockets = findSockets(siteName, dtuid);
  if (sockets.length === 0) {
    console.warn(`[GPIO.JS] ⚠️ /alert: No active sockets (siteName=${siteName})`);
    return res.status(503).json({
      error: 'No active gateway sockets',
    });
  }

  const stateBool = (state === false || state === 0) ? false : true;
  const useModbus = protocol === 'modbus' || protocol === undefined;

  if (useModbus) {
    const portKey = String(portId);
    const frameSet = GPIO_FRAMES[portKey];
    if (!frameSet) {
      // Fallback to AT command if Modbus frame not defined for port
      const atCommand = `AT+NS1=${dtuid},${portId},${stateBool ? 1 : 0}\r\n`;
      const results = writeATCommand(sockets, atCommand);
      return res.status(results.some((r) => r.sent) ? 200 : 502).json({
        success: results.some((r) => r.sent),
        protocol: 'at_fallback',
        command: atCommand.trim(),
        dtuid,
        portId,
        sockets: results,
      });
    }

    const frame = stateBool ? frameSet.on : frameSet.off;
    const description = `ALERT GPIO Port ${portId} ${stateBool ? 'ON' : 'OFF'}`;
    const results = writeModbusCommand(sockets, frame, description);
    const anySent = results.some((r) => r.sent);

    return res.status(anySent ? 200 : 502).json({
      success    : anySent,
      protocol   : 'modbus',
      description,
      dtuid,
      portId,
      state      : stateBool,
      hexRaw     : formatHex(frame),
      hexEscaped : formatHex(PROTOCOL.escape(frame)),
      sockets    : results,
    });
  } else {
    const atCommand = `AT+NS1=${dtuid},${portId},${stateBool ? 1 : 0}\r\n`;
    const results = writeATCommand(sockets, atCommand);
    const anySent = results.some((r) => r.sent);

    return res.status(anySent ? 200 : 502).json({
      success  : anySent,
      protocol : 'at',
      command  : atCommand.trim(),
      dtuid,
      portId,
      sockets  : results,
    });
  }
});

module.exports = router;

