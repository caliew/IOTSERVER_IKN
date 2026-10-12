const express = require('express');
const router = express.Router();
const cors = require('cors');
const auth = require('../middleware/auth');
const fileStores = require('../lib/fileStores');
const TelemetryClearance = require('../models/TelemetryClearance');

router.use(cors({ origin: '*' }));

// @route     POST api/telemetry/clearance
// @desc      Clearance endpoint for Checker; also accepts verifiedBy/verifiedAt from Verifier path
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

    // --- CHECKER identity ---
    // Priority: explicit checkedBy in body > JWT username > fallback
    const reqCheckedBy =
      req.body?.checkedBy ||
      req.body?.clearedBy ||
      req.body?.cleared_by;
    const jwtUsername = req.user?.username && req.user.username !== 'DEFAULT_USER' ? req.user.username : null;
    const jwtName = req.user?.name && req.user.name !== 'Bypass User' ? req.user.name : null;

    const checkedBy = String(
      reqCheckedBy ||
      jwtUsername ||
      jwtName ||
      (req.user?.id && !String(req.user.id).startsWith('usr_') && req.user.id !== 'DEFAULT_USER' ? req.user.id : null) ||
      req.user?.username ||
      req.user?.id ||
      'usr_101'
    );
    const checkedAt = req.body?.checkedAt || req.body?.clearedAt || req.body?.cleared_at || new Date().toISOString();

    // --- VERIFIER identity (distinct from Checker) ---
    // Only present when this clearance update is triggered from the Verifier path
    const verifiedBy = req.body?.verifiedBy || req.body?.verified_by || null;
    const verifiedAt = req.body?.verifiedAt || req.body?.verified_at || null;

    const clearanceData = {
      telemetryKey,
      macId,
      dateStr,
      hourStr: formattedHour,
      reason: reason || '',
      notes: notes || '',
      // Checker fields
      checkedBy,
      checkedAt,
      // Verifier fields (null when called from pure Checker path)
      verifiedBy,
      verifiedAt,
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
          { ...clearanceData, checkedAt: new Date(checkedAt) },
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


// @route     GET api/telemetry/clearance/list
// @desc      List all clearance records for a site (optionally filtered by year)
// @access    Private
// @query     site  {string} required - site name (e.g. IKNPATHOLOGY)
// @query     year  {number} optional - 4-digit year to filter (e.g. 2026)
router.get('/clearance/list', auth, async (req, res) => {
  try {
    const site = req.query.site || req.user?.site || 'IKNHOSPITAL';
    const year = req.query.year ? parseInt(req.query.year, 10) : null;

    // Read the flat clearances store for this site
    const path = require('path');
    const fs = require('fs');
    const sanitize = (s) => String(s || '').replace(/[^a-zA-Z0-9_\-]/g, '').toUpperCase();
    const siteDir = path.join(fileStores.baseDir, sanitize(site));
    const filePath = path.join(siteDir, 'clearances.json');

    let clearances = [];
    if (fs.existsSync(filePath)) {
      try {
        clearances = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!Array.isArray(clearances)) clearances = [];
      } catch (e) {
        clearances = [];
      }
    }

    // Filter by year if provided (match against dateStr field: "YYYY-MM-DD")
    if (year) {
      clearances = clearances.filter(c => {
        if (c.dateStr && c.dateStr.startsWith(String(year))) return true;
        if (c.cleared_at && new Date(c.cleared_at).getFullYear() === year) return true;
        return false;
      });
    }

    // Sort newest-first by checkedAt
    clearances.sort((a, b) => new Date(b.checkedAt || b.cleared_at || 0) - new Date(a.checkedAt || a.cleared_at || 0));

    // Normalise: ensure canonical camelCase fields for the frontend.
    // Records stored by saveTelemetryClearance now use checkedBy/checkedAt/verifiedBy/verifiedAt.
    // Older records may have snake_case cleared_by/cleared_at and no verifiedBy — bridge those here.
    const normalizedClearances = clearances.map(c => {
      // --- Checker fields ---
      const checkedBy = c.checkedBy || c.cleared_by || null;
      const checkedAt = c.checkedAt || c.cleared_at || null;

      // --- Verifier fields ---
      // Try the stored field first; fall back to parsing from notes/reason for old records
      let verifiedBy = c.verifiedBy || c.verified_by || null;
      let verifiedAt = c.verifiedAt || c.verified_at || null;

      if (!verifiedBy) {
        // Pattern 1: notes = "...Verified & Closed by Verifier {username} ..."
        if (c.notes) {
          const m = String(c.notes).match(/by\s+Verifier\s+(\S+)/i);
          if (m) verifiedBy = m[1];
        }
        // Pattern 2: reason = "Verified ({username})"
        if (!verifiedBy && c.reason) {
          const m = String(c.reason).match(/^Verified\s+\((\S+)\)$/i);
          if (m) verifiedBy = m[1];
        }
      }

      return {
        ...c,
        checkedBy,
        checkedAt,
        verifiedBy,
        verifiedAt,
      };
    });

    return res.status(200).json({
      success: true,
      site,
      year: year || 'all',
      total: normalizedClearances.length,
      clearances: normalizedClearances
    });
  } catch (err) {
    console.error('Error in GET /api/telemetry/clearance/list:', err);
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
