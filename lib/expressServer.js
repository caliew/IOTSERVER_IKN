// lib/expressServer.js
/*
 * EXPRESS SERVER RELATED TASKS (REFACTORED)
 *
 */

const express = require('express');
const config = require('./config');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const _logs = require('../lib/logs');

// instantiate server module object
var server = {};

// helper: safe readLogs (wraps lib.logs.read into a Promise)
function safeReadLogs(fileName, nTotalLines = 2000, date0 = null, date1 = null, debug = false) {
  return new Promise((resolve) => {
    let called = false;
    // timeout just in case logs.read never calls back
    const timer = setTimeout(() => {
      if (!called) {
        called = true;
        console.warn(`⏰ Timeout reading logs for ${fileName}`);
        resolve([]);
      }
    }, 30000);

    try {
      _logs.read(fileName, nTotalLines, date0, date1, debug, (ok, data) => {
        clearTimeout(timer);
        if (called) return;
        called = true;
        // Note: your logs.read uses (true, data) on success and (false, []) on failure
        if (ok) {
          resolve(Array.isArray(data) ? data : []);
        } else {
          resolve([]);
        }
      });
    } catch (err) {
      clearTimeout(timer);
      if (!called) {
        called = true;
        console.error(`Error calling _logs.read for ${fileName}:`, err && err.stack ? err.stack : err);
        resolve([]);
      }
    }
  });
}

server.init = function () {
  const app = express();

  // --------------------------
  // 1) Middleware ordering
  // --------------------------
  app.use(cors({ origin: '*' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(express.json({ limit: '10mb' }));

  // --------------------------
  // 2) Mount routes (API)
  // --------------------------
  // keep relative paths same as before
  app.use('/api/auth', require('../routes/auth'));
  app.use('/api/users', require('../routes/users'));
  app.use('/api/alerts', require('../routes/alerts'));
  app.use('/api/maintEvents', require('../routes/maintEvents'));
  app.use('/api/sensors', require('../routes/sensors'));
  app.use('/api/companies', require('../routes/companies'));
  app.use('/api/contacts', require('../routes/contacts'));

  // --------------------------
  // 3) Lightweight internal endpoints that used to cause races
  //    These are converted to async/await and use safeReadLogs
  // --------------------------

  // GET /data (aggregated example)
  app.get('/data', async (req, res) => {
    try {
      // use safeReadLogs so we always resolve with an array
      const sensorData = await safeReadLogs('_NIPPONDEMO', 10, null, null, false);
      const pwrmtr = await safeReadLogs('50-101', 10, null, null, false);
      const pwrmtrState = await safeReadLogs('50-101_STATE', 10, null, null, false);

      return res.status(200).json({
        sensorData,
        PWRMTR: pwrmtr,
        PWRMTR1: pwrmtrState,
      });
    } catch (err) {
      console.error('Error in /data:', err && err.stack ? err.stack : err);
      if (!res.headersSent) return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // simple health-ish route
  app.get('/data1', (req, res) => res.json({ statusCode: 200, payload: { sensor: 'PRESS-01' } }));

  // named endpoints
  app.get('/teawarehouse', async (req, res) => {
    try {
      const sensorData = await safeReadLogs('_TEAWAREHOUSE', 30, null, null, false);
      return res.status(200).send({ sensorData });
    } catch (err) {
      console.error('Error in /teawarehouse', err);
      if (!res.headersSent) return res.status(500).send({ error: 'Internal server error' });
    }
  });

  app.get('/shinko', async (req, res) => {
    try {
      const sensorData = await safeReadLogs('_SHINKO', 30, null, null, false);
      return res.status(200).send({ sensorData });
    } catch (err) {
      console.error('Error in /shinko', err);
      if (!res.headersSent) return res.status(500).send({ error: 'Internal server error' });
    }
  });

  // send log file directly - keep as sendFile (no res override)
  app.get('/pddata', (req, res) => {
    const filePath = path.join(__dirname, 'logs', 'pddata.log');
    return res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending pddata.log', err);
        if (!res.headersSent) res.status(500).send('Error reading log file');
      }
    });
  });

  // --------------------------
  // 5) handle 404 for API (must be after API routes, before global error handler)
  // --------------------------
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    next();
  });

  // --------------------------
  // 6) global error handler (last)
  // --------------------------
  app.use((err, req, res, next) => {
    console.error('🔥 Global error handler:', err && err.stack ? err.stack : err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      next(err);
    }
  });

  // start listening
  const PORT = process.env.PORT || config.RESTAPIPort || 5000;
  app.listen(PORT, () => console.log(`[EXPRESSSERVER] REST API Server INIT On PORT ${String(PORT)}`));
};

module.exports = server;
