// routes/gpio.js
/*
 * GPIO CONTROL ENDPOINT
 *
 * Wraps AT-command writes over the active TCP socket connections.
 *
 * AT-COMMAND REFERENCE (F8L10ST DTU):
 *   SET GPIO state  : AT+NS1={DTUID},{GPIO},{STATE}\r\n
 *                       STATE: 1 = ON,  0 = OFF
 *   GET GPIO status : AT+NV1={DTUID}\r\n
 *                       Returns current state of all GPIO ports on the DTU
 *
 * ROUTES:
 *   POST /api/gpio/control  - Set a GPIO port ON or OFF
 *   POST /api/gpio/alert    - Internal: auto-trigger GPIO ON when alert fires
 *   GET  /api/gpio/status   - Query current GPIO state from DTU
 */

const express = require('express');
const router  = express.Router();
const cors    = require('cors');
const auth    = require('../middleware/auth');
const _logs   = require('../lib/logs');

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
// Helper: find all active sockets for a given site / portId
// siteName matches the FileName used in startTCPServer(FileName, …)
// ---------------------------------------------------------------
function findSockets(siteName, portId) {
  const arr = getSocketArr();
  if (!arr || arr.length === 0) return [];
  if (siteName) {
    // Match by the TCP port's FileName tag stored in the gatewayData
    // server.socketArr entries: { PORT, GATEWAYID, ADDRESS, TIMESTAMP, SOCKET }
    // PORT here is the TCP listen port number, not the GPIO port number
    return arr.filter(
      (s) => s.SOCKET && typeof s.SOCKET.write === 'function'
    );
  }
  return arr.filter((s) => s.SOCKET && typeof s.SOCKET.write === 'function');
}

// ---------------------------------------------------------------
// Helper: write an AT command to ONE or ALL matching sockets
// Returns an array of results: [ { GATEWAYID, command, sent } ]
// ---------------------------------------------------------------
function writeATCommand(sockets, atCommand) {
  const results = [];
  sockets.forEach((s) => {
    try {
      s.SOCKET.write(atCommand);
      results.push({ GATEWAYID: s.GATEWAYID, command: atCommand.trim(), sent: true });
      console.log(
        `[GPIO.JS] ✅ SENT => GATEWAY=${s.GATEWAYID} CMD=[${atCommand.trim()}]`
      );
      _logs.append('_GPIO', `[GPIO.JS] SENT GATEWAY=${s.GATEWAYID} CMD=${atCommand.trim()}`, () => {});
    } catch (err) {
      results.push({ GATEWAYID: s.GATEWAYID, command: atCommand.trim(), sent: false, error: err.message });
      console.error(`[GPIO.JS] ❌ FAILED => GATEWAY=${s.GATEWAYID}`, err.message);
      _logs.append('_GPIO', `[GPIO.JS] FAILED GATEWAY=${s.GATEWAYID} CMD=${atCommand.trim()} ERR=${err.message}`, () => {});
    }
  });
  return results;
}

// ==============================================================
// POST /api/gpio/control
// Body: { dtuid, portId, state, siteName }
//   dtuid    : number  – DTU ID of the gateway device
//   portId   : number  – GPIO port number (1, 2, 3 …)
//   state    : boolean – true = ON, false = OFF
//   siteName : string  – optional, e.g. "IKN_OPROOM"
//
// Writes: AT+NS1={dtuid},{portId},{0|1}\r\n
// ==============================================================
router.post('/control', auth, (req, res) => {
  const { dtuid, portId, state, siteName } = req.body;

  if (dtuid === undefined || portId === undefined || state === undefined) {
    return res.status(400).json({
      error: 'Missing required fields: dtuid, portId, state',
    });
  }

  const stateVal = state ? 1 : 0;
  // AT+NS1={DTUID},{GPIO},{STATE}\r\n
  const atCommand = `AT+NS1=${dtuid},${portId},${stateVal}\r\n`;

  const sockets = findSockets(siteName);
  if (sockets.length === 0) {
    console.warn(`[GPIO.JS] ⚠️ No active sockets found (siteName=${siteName})`);
    return res.status(503).json({
      error: 'No active gateway sockets available',
      atCommand: atCommand.trim(),
    });
  }

  const results = writeATCommand(sockets, atCommand);
  const anySent  = results.some((r) => r.sent);

  return res.status(anySent ? 200 : 502).json({
    success : anySent,
    command : atCommand.trim(),
    dtuid,
    portId,
    state   : stateVal,
    sockets : results,
  });
});

// ==============================================================
// GET /api/gpio/status
// Query: ?dtuid=102&siteName=IKN_OPROOM
//
// Sends: AT+NV1={dtuid}\r\n
// (Queries the DTU for current GPIO state of all ports)
// The DTU will respond asynchronously over the TCP data channel.
// This endpoint just fires the AT command and returns immediately.
// ==============================================================
router.get('/status', auth, (req, res) => {
  const { dtuid, siteName } = req.query;

  if (!dtuid) {
    return res.status(400).json({ error: 'Missing required query param: dtuid' });
  }

  // AT+NV1={DTUID}\r\n  – note: NV1, not NS1
  const atCommand = `AT+NV1=${dtuid}\r\n`;

  const sockets = findSockets(siteName);
  if (sockets.length === 0) {
    return res.status(503).json({
      error: 'No active gateway sockets available',
      atCommand: atCommand.trim(),
    });
  }

  const results = writeATCommand(sockets, atCommand);
  const anySent  = results.some((r) => r.sent);

  return res.status(anySent ? 200 : 502).json({
    success  : anySent,
    command  : atCommand.trim(),
    dtuid,
    note     : 'GPIO state will be returned asynchronously via the TCP data channel',
    sockets  : results,
  });
});

// ==============================================================
// POST /api/gpio/alert
// INTERNAL endpoint — called by DISPATCH_ALERT in server.js
// when an alert is triggered, to turn the physical alarm ON.
//
// Body: { dtuid, portId, siteName }
//   Uses state = 1 (ON) always — alert fires = GPIO ON
//
// Also used to turn OFF: body includes { state: false }
// ==============================================================
router.post('/alert', (req, res) => {
  const { dtuid, portId, siteName, state } = req.body;

  if (dtuid === undefined || portId === undefined) {
    return res.status(400).json({ error: 'Missing required fields: dtuid, portId' });
  }

  const stateVal  = (state === false || state === 0) ? 0 : 1;
  const atCommand = `AT+NS1=${dtuid},${portId},${stateVal}\r\n`;

  const sockets = findSockets(siteName);
  if (sockets.length === 0) {
    console.warn(`[GPIO.JS] ⚠️ /alert: No active sockets (siteName=${siteName})`);
    return res.status(503).json({
      error: 'No active gateway sockets',
      atCommand: atCommand.trim(),
    });
  }

  const results = writeATCommand(sockets, atCommand);
  const anySent  = results.some((r) => r.sent);

  return res.status(anySent ? 200 : 502).json({
    success: anySent,
    command: atCommand.trim(),
    dtuid,
    portId,
    state  : stateVal,
    sockets: results,
  });
});

module.exports = router;
