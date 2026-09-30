const express = require('express');
const router = express.Router();
const cors = require('cors');
const auth = require('../middleware/auth');
const fileStores = require('../lib/fileStores');
const IncidentVerification = require('../models/IncidentVerification');

router.use(cors({ origin: '*' }));

// @route     POST api/incidents/verify
// @desc      Incident verification endpoint for Verifier
// @access    Private (VERIFIER or ADMIN role)
router.post('/verify', auth, auth.requireRole('VERIFIER'), async (req, res) => {
  try {
    const { incidentId, telemetryKey, decision, comments } = req.body || {};
    const site = req.body?.site || req.user?.site || req.query?.site || 'IKNHOSPITAL';

    if (!incidentId || !telemetryKey || !decision) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: incidentId, telemetryKey, decision'
      });
    }

    const normalizedDecision = String(decision).toUpperCase();
    if (!['APPROVED', 'REJECTED'].includes(normalizedDecision)) {
      return res.status(400).json({
        success: false,
        error: "Invalid decision value. Must be 'APPROVED' or 'REJECTED'."
      });
    }

    // Check that telemetry key has been cleared by a Checker
    const clearanceRecord = fileStores.getTelemetryClearance(site, telemetryKey);
    if (!clearanceRecord) {
      return res.status(400).json({
        success: false,
        error: `Referenced telemetry key (${telemetryKey}) has not been cleared by a Checker.`
      });
    }

    const verified_by = req.user.id || req.user.username || 'usr_102';
    const verified_at = new Date().toISOString();

    const verificationData = {
      incidentId,
      telemetryKey,
      decision: normalizedDecision,
      comments: comments || '',
      verified_by,
      verified_at,
      site
    };

    // Save verification in fileStores
    const fileResult = fileStores.saveIncidentVerification(site, verificationData);

    // Save to Mongoose DB if connected
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await IncidentVerification.findOneAndUpdate(
          { incidentId },
          { ...verificationData, verified_at: new Date(verified_at) },
          { upsert: true, new: true }
        );
      } catch (e) {
        console.warn('[INCIDENTS] MongoDB update skipped/failed:', e.message);
      }
    }

    return res.status(200).json({
      success: true,
      verification: fileResult || verificationData
    });
  } catch (err) {
    console.error('Error in POST /api/incidents/verify:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// @route     GET api/incidents
// @desc      Get incidents for site
// @access    Public / Private
router.get('/', (req, res) => {
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

// @route     PUT api/incidents
// @desc      Update incident verification status
// @access    Public / Private
router.put('/', (req, res) => {
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

module.exports = router;
