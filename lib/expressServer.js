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
const pdf = require('html-pdf');

const Sensor = require('../models/Sensor');
const _logs = require('../lib/logs');
const pdfTemplate = require('./reports/ikn'); // keep or replace with your template

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
  const { trackSensor } = require('./tracker');

  // GET /api/sensors/track/:site/:macId - Sensor diagnostic & dispatch tracker
  app.get('/api/sensors/track/:site/:macId', async (req, res) => {
    try {
      const { site, macId } = req.params;
      const report = await trackSensor(site, macId);
      return res.status(200).json(report);
    } catch (err) {
      console.error('Error tracking sensor:', err);
      return res.status(500).json({ error: 'Failed to track sensor' });
    }
  });

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

  // PDF creation endpoint - safe Promise.all based implementation
  app.post('/create-pdf', async (req, res) => {
    try {
      const sensorIDs = Array.isArray(req.body.reportSensors) ? req.body.reportSensors : [];
      if (sensorIDs.length === 0) return res.status(400).send({ error: 'Missing reportSensors' });

      // fetch sensors in parallel
      const sensorPromises = sensorIDs.map(id => Sensor.findById(id).sort({ date: -1 }).exec());
      const sensors = await Promise.all(sensorPromises);

      const sensorsArr = sensors
        .filter(Boolean)
        .map(s => (s.sensorId ? s.sensorId : null))
        .filter(Boolean);

      const sensorsData = { sensorIDs, sensorsArr };

      // create PDF - wrap in a Promise
      await new Promise((resolve, reject) => {
        pdf.create(pdfTemplate(sensorsData), {}).toFile('./lib/reports/report.pdf', (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      return res.send('PDF created');
    } catch (err) {
      console.error('Error in /create-pdf:', err && err.stack ? err.stack : err);
      if (!res.headersSent) return res.status(500).send('Error creating PDF');
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

  // old static PDF shortcuts (if you still need them)
  app.get('/fetch-pdf-NOV2021', (req, res) =>
    res.sendFile(path.join(__dirname, 'reports', 'NOV 2021 Monthly Report.pdf'))
  );
  app.get('/fetch-pdf-DEC2021', (req, res) =>
    res.sendFile(path.join(__dirname, 'reports', 'DEC 2021 Monthly Report.pdf'))
  );
  app.get('/fetch-pdf-JAN2022', (req, res) =>
    res.sendFile(path.join(__dirname, 'reports', 'JAN 2022 Monthly Report.pdf'))
  );
  app.get('/fetch-pdf-FEB2022', (req, res) =>
    res.sendFile(path.join(__dirname, 'reports', 'FEB 2022 Monthly Report.pdf'))
  );

  // --------------------------
  // 4) Serve static React files (only once, and only if used)
  // --------------------------
  if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, 'client', 'build');
    app.use(express.static(clientBuildPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  }

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
