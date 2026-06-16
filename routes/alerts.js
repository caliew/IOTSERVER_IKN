/*
 * routes/alerts.js — File-based Alerts retrieval
 *
 * Reads alert entries from log files like _AEROSOFTALERTS, _TDKJOHORALERTS etc.
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const cors = require('cors');
const _logs = require('../lib/logs');
const helpers = require('../lib/helpers');

router.use(cors({ origin: '*' }));

const alertFiles = [
  '_AEROSOFTALERTS',
  '_TEAWAREHOUSEALERTS',
  '_TDKJOHORALERTS',
  '_EPSONALERTS',
  '_SNOWCITYALERTS',
  '_IKN_OPROOMALERTS',
  '_IKN_HOSPITALALERTS',
  '_SHINKOALERTS',
  '_MREALERTS',
  '_KAYAKUALERTS',
  '_INDOGUNAALERTS',
  '_MCSTALERTS',
  '_NIPPONGLASSALERTS'
];

function getAlertFileForCompany(companyname) {
  if (!companyname) return null;
  const normalized = companyname.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normalized.includes('AEROSOFT')) return '_AEROSOFTALERTS';
  if (normalized.includes('TEAWAREHOUSE')) return '_TEAWAREHOUSEALERTS';
  if (normalized.includes('TDK')) return '_TDKJOHORALERTS';
  if (normalized.includes('EPSON')) return '_EPSONALERTS';
  if (normalized.includes('SNOWCITY')) return '_SNOWCITYALERTS';
  if (normalized.includes('OPROOM')) return '_IKN_OPROOMALERTS';
  if (normalized.includes('HOSPITAL')) return '_IKN_HOSPITALALERTS';
  if (normalized.includes('SHINKO')) return '_SHINKOALERTS';
  if (normalized.includes('MRE')) return '_MREALERTS';
  if (normalized.includes('KAYAKU')) return '_KAYAKUALERTS';
  if (normalized.includes('INDOGUNA')) return '_INDOGUNAALERTS';
  if (normalized.includes('MCST')) return '_MCSTALERTS';
  if (normalized.includes('NIPPON')) return '_NIPPONGLASSALERTS';
  return null;
}

function readAlertLogFile(fileName, totalLines) {
  return new Promise((resolve) => {
    _logs.read(fileName, totalLines, null, null, false, (err, data) => {
      if (!err && Array.isArray(data)) {
        resolve(data);
      } else {
        resolve([]);
      }
    });
  });
}

// @route     GET api/alerts
// @desc      Get recent alerts for the user's company (or all if superuser)
// @access    Private
router.get('/', auth, async (req, res) => {
  try {
    let totalLines = Number(req.query.totalLines);
    if (isNaN(totalLines) || totalLines <= 0) {
      totalLines = 100;
    }

    const companyname = req.user.companyname || '';
    const isSuperuser = (req.user.name && req.user.name.toLowerCase() === 'superuser') || companyname.toLowerCase() === 'admin';

    let filesToRead = [];
    if (isSuperuser) {
      filesToRead = alertFiles;
    } else {
      const specificFile = getAlertFileForCompany(companyname);
      if (specificFile) {
        filesToRead = [specificFile];
      } else {
        // Fallback: search all if no matching company file found
        filesToRead = alertFiles;
      }
    }

    const promises = filesToRead.map(file => readAlertLogFile(file, totalLines));
    const results = await Promise.all(promises);

    // Flatten and merge
    let allAlerts = results.flat();

    // Sort by date/timestamp descending
    allAlerts.sort((a, b) => {
      const dateA = new Date(a.TIMESTAMP || a.date || 0);
      const dateB = new Date(b.TIMESTAMP || b.date || 0);
      return dateB - dateA;
    });

    // Limit to totalLines
    allAlerts = allAlerts.slice(0, totalLines);

    // Map fields to match what the React client expects (Mongoose Alert equivalents)
    const mappedAlerts = allAlerts.map(alert => {
      const alertId = alert._id || alert.id || helpers.createRandomString(20);
      return {
        _id: alertId,
        id: alertId,
        name: alert.name || alert.MESSAGE || 'Alert',
        date: alert.TIMESTAMP || alert.date || new Date().toISOString(),
        dtuId: alert.DTU || alert.dtuId || '',
        sensorId: alert.SENSOR || alert.sensorId || '',
        type: alert.type || 'ALERT',
        sensorType: alert.sensorType || alert.SENSORTYPE || '',
        reading: alert.READING !== undefined ? alert.READING : (alert.reading !== undefined ? alert.reading : 0),
        limit: alert.LIMIT !== undefined ? alert.LIMIT : (alert.limit !== undefined ? alert.limit : 0),
        readFlag: alert.readFlag || false
      };
    });

    res.status(200).json(mappedAlerts);
  } catch (err) {
    console.error('Error in alerts GET route:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
