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
  const rawBufferRecorder = require('./rawBufferRecorder');
  const fileStores = require('./fileStores');
  const powerTracker = require('./powerTracker');

  // GET /api/fileStores/rollups
  app.get('/api/fileStores/rollups', (req, res) => {
    try {
      const site = req.query.site || req.query.siteName;
      const macId = req.query.macId;
      const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();

      if (!site || !macId) {
        return res.status(400).json({ error: 'Missing required query parameters: site and macId' });
      }

      const rollup = fileStores.getTelemetryRollup(site, macId, year);
      if (!rollup) {
        return res.status(404).json({ error: 'Rollup data not found' });
      }
      return res.status(200).json(rollup);
    } catch (err) {
      console.error('Error in GET /api/fileStores/rollups:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // GET /api/incidents
  app.get('/api/incidents', (req, res) => {
    try {
      const site = req.query.site || req.query.siteName;
      const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
      const isChecked = req.query.isChecked;
      const isVerified = req.query.isVerified;
      const macId = req.query.macId;
      const alertType = req.query.alertType || req.query.type;
      const month = req.query.month;
      const day = req.query.day;
      const week = req.query.week;

      if (!site) {
        return res.status(400).json({ error: 'Missing required query parameter: site' });
      }

      const filters = {};
      if (isChecked !== undefined) filters.isChecked = isChecked === 'true';
      if (isVerified !== undefined) filters.isVerified = isVerified === 'true';
      if (macId) filters.macId = macId;
      if (alertType) filters.alertType = alertType;
      if (month) filters.month = month;
      if (day) filters.day = day;
      if (week) filters.week = week;

      const incidents = fileStores.getIncidents(site, year, filters);
      return res.status(200).json(incidents);
    } catch (err) {
      console.error('Error in GET /api/incidents:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // PUT /api/incidents
  app.put('/api/incidents', (req, res) => {
    try {
      const payload = req.body || {};
      const site = payload.site || payload.siteName || req.query.site;
      const year = payload.year || req.query.year || new Date().getFullYear();
      const incidentId = payload.incidentId || req.query.incidentId;

      if (!site || !incidentId) {
        return res.status(400).json({ error: 'Missing required fields: site and incidentId' });
      }

      const updated = fileStores.updateIncidentVerification(site, year, incidentId, payload);
      if (updated) {
        return res.status(200).json({ Success: true, message: 'Incident verification updated' });
      } else {
        return res.status(404).json({ error: 'Incident ID not found or update failed' });
      }
    } catch (err) {
      console.error('Error in PUT /api/incidents:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // GET /api/powerTracker/status
  app.get('/api/powerTracker/status', (req, res) => {
    try {
      const site = req.query.site || req.query.siteName;
      const summary = powerTracker.getSummary(site);
      return res.status(200).json(summary);
    } catch (err) {
      console.error('Error in GET /api/powerTracker/status:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

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

  // GET /api/rawBuffers - List raw buffer history per open port (max 20 entries per port)
  app.get('/api/rawBuffers', (req, res) => {
    rawBufferRecorder.getBuffers(null, (err, data) => {
      if (err) return res.status(500).json({ error: 'Failed to read raw buffers' });
      return res.status(200).json({ statusCode: 200, ports: data });
    });
  });

  // GET /api/rawBuffers/:portId - Get raw buffer history for a specific port
  app.get('/api/rawBuffers/:portId', (req, res) => {
    const { portId } = req.params;
    rawBufferRecorder.getBuffers(portId, (err, data) => {
      if (err) return res.status(500).json({ error: `Failed to read raw buffers for port ${portId}` });
      return res.status(200).json({ statusCode: 200, portId: Number(portId), count: data.length, records: data });
    });
  });

  // POST /api/rawBuffers/retest - Offline re-test a raw buffer packet
  app.post('/api/rawBuffers/retest', (req, res) => {
    const { portId, buffer, siteName, sensorSetting } = req.body;
    rawBufferRecorder.retestBuffer({ portId, buffer, siteName, sensorSetting }, (err, result) => {
      if (err) return res.status(400).json({ error: err });
      return res.status(200).json({ statusCode: 200, ...result });
    });
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
