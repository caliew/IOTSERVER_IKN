const express = require('express');
const router = express.Router();
const cors = require('cors');
const auth = require('../middleware/auth');
const fileStores = require('../lib/fileStores');
const TelemetryClearance = require('../models/TelemetryClearance');

router.use(cors({ origin: '*' }));

// @route     POST api/telemetry/clearance
// @desc      Clearance endpoint for Checker
// @access    Private (CHECKER or ADMIN role)
router.post('/clearance', auth, auth.requireRole('CHECKER'), async (req, res) => {
  try {
    const { macId, dateStr, hourStr, reason, notes } = req.body || {};
    const site = req.body?.site || req.user?.site || req.query?.site || 'IKNHOSPITAL';

    if (!macId || !dateStr || hourStr === undefined || hourStr === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: macId, dateStr, hourStr'
      });
    }

    const formattedHour = String(hourStr).padStart(2, '0');
    const telemetryKey = `${macId}_${dateStr}_${formattedHour}`;
    const cleared_by = req.user.id || req.user.username || 'usr_101';
    const cleared_at = new Date().toISOString();

    const clearanceData = {
      telemetryKey,
      macId,
      dateStr,
      hourStr: formattedHour,
      reason: reason || '',
      notes: notes || '',
      cleared_by,
      cleared_at,
      site,
      status: 'CLEARED'
    };

    // Save to FileStores JSON store
    const fileResult = fileStores.saveTelemetryClearance(site, clearanceData);

    // Save to Mongoose DB if connected
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await TelemetryClearance.findOneAndUpdate(
          { telemetryKey },
          { ...clearanceData, cleared_at: new Date(cleared_at) },
          { upsert: true, new: true }
        );
      } catch (e) {
        console.warn('[TELEMETRY] MongoDB update skipped/failed:', e.message);
      }
    }

    return res.status(200).json({
      success: true,
      clearance: fileResult || clearanceData
    });
  } catch (err) {
    console.error('Error in POST /api/telemetry/clearance:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// @route     GET api/telemetry/clearance
// @desc      Get telemetry clearance status
// @access    Private
router.get('/clearance', auth, async (req, res) => {
  try {
    const site = req.query.site || req.user?.site || 'IKNHOSPITAL';
    const { telemetryKey, macId, dateStr, hourStr } = req.query;

    const record = fileStores.getTelemetryClearance(site, telemetryKey, macId, dateStr, hourStr);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Clearance record not found' });
    }

    return res.status(200).json({ success: true, clearance: record });
  } catch (err) {
    console.error('Error in GET /api/telemetry/clearance:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
