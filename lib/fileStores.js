/*
 * Library for storing and aggregating pre-computed sensor data & incident records
 * Structure:
 *   .data/fileStores/<siteName>/<macId>/<year>.json  (Weekly, Monthly, Yearly rollups)
 *   .data/fileStores/<siteName>/incidents_<year>_<month>.json (Incident verification logs)
 */

const fs = require('fs');
const path = require('path');

const lib = {};

// Base directory for fileStores
lib.baseDir = path.join(__dirname, '/../.data/fileStores/');

// Helper: Ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Helper: Get ISO Week string (e.g. "W37")
function getISOWeekString(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `W${String(weekNo).padStart(2, '0')}`;
}

// Helper: Get sanitized site name
function sanitizeName(str) {
  return String(str || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
}

// Helper: Find directory case-insensitively and flexibly matching delimiters (:-_)
function findMatchingSubdir(parentDir, targetName) {
  if (!targetName || !fs.existsSync(parentDir)) return null;

  const sanitized = sanitizeName(targetName);
  const normalize = (str) => String(str || '').toLowerCase().replace(/[:_\s]/g, '-');
  const targetNorm = normalize(targetName);

  try {
    const entries = fs.readdirSync(parentDir);
    // 1. Direct match with exact sanitized name
    for (const entry of entries) {
      if (entry === sanitized) return entry;
    }
    // 2. Case and delimiter insensitive match
    for (const entry of entries) {
      if (normalize(entry) === targetNorm) return entry;
    }
    // 3. Match ignoring all hyphens/delimiters (e.g. B0BC82C4C441 vs b0-bc-82-c4-c4-41)
    const targetClean = targetNorm.replace(/-/g, '');
    for (const entry of entries) {
      if (normalize(entry).replace(/-/g, '') === targetClean) return entry;
    }
  } catch (err) {
    console.error(`[FILESTORES.JS] Error searching directory ${parentDir}:`, err.message);
  }
  return null;
}

// Helper: Safe JSON read
function readJsonFile(filePath, defaultVal = null) {
  try {
    if (!fs.existsSync(filePath)) return defaultVal;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`[FILESTORES.JS] Error reading ${filePath}:`, err.message);
    return defaultVal;
  }
}

// Helper: Safe JSON write
function writeJsonFile(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    ensureDir(dir);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`[FILESTORES.JS] Error writing ${filePath}:`, err.message);
    return false;
  }
}

// Helper: Update Min/Max/Average metrics object
function updateMetricBucket(bucket, value) {
  if (value === undefined || value === null || isNaN(value)) return;
  const numVal = Number(value);

  if (bucket.count === 0 || bucket.min === undefined) {
    bucket.min = numVal;
    bucket.max = numVal;
    bucket.sum = numVal;
    bucket.count = 1;
    bucket.avg = numVal;
  } else {
    bucket.min = Math.min(bucket.min, numVal);
    bucket.max = Math.max(bucket.max, numVal);
    bucket.sum += numVal;
    bucket.count += 1;
    bucket.avg = Number((bucket.sum / bucket.count).toFixed(2));
  }
}

/**
 * Record a telemetry payload for a sensor into Weekly, Monthly, and Yearly rollups.
 * @param {string} rawSiteName - Site name (e.g. "ikn_hospital", "AEROSOFT")
 * @param {string} rawMacId - Sensor MAC / Device ID (e.g. "B0-BC-82-C4-C4-41")
 * @param {Object} readings - Parsed telemetry values or eval results
 * @param {boolean} isAlert - Whether this reading triggered an alert
 */
lib.recordTelemetry = function(rawSiteName, rawMacId, readings = {}, isAlert = false) {
  if (!rawSiteName || !rawMacId) return;

  const siteName = sanitizeName(rawSiteName);
  const macId = sanitizeName(rawMacId);
  const now = new Date();
  const year = now.getFullYear();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const dayStr = String(now.getDate()).padStart(2, '0');
  const hourStr = String(now.getHours()).padStart(2, '0');
  const dayKey = `${monthStr}-${dayStr}`;
  const weekStr = getISOWeekString(now);

  const filePath = path.join(lib.baseDir, siteName, macId, `${year}.json`);

  let store = readJsonFile(filePath, {
    site: siteName,
    macId: macId,
    year: year,
    lastUpdated: now.toISOString(),
    yearly: { sampleCount: 0, limitBreaches: 0, metrics: {} },
    monthly: {},
    weekly: {},
    daily: {}
  });

  if (!store.daily) store.daily = {};

  store.lastUpdated = now.toISOString();
  store.yearly.sampleCount += 1;
  if (isAlert) store.yearly.limitBreaches += 1;

  // Ensure month bucket
  if (!store.monthly[monthStr]) {
    store.monthly[monthStr] = { sampleCount: 0, limitBreaches: 0, metrics: {} };
  }
  store.monthly[monthStr].sampleCount += 1;
  if (isAlert) store.monthly[monthStr].limitBreaches += 1;

  // Ensure week bucket
  if (!store.weekly[weekStr]) {
    store.weekly[weekStr] = { sampleCount: 0, limitBreaches: 0, metrics: {} };
  }
  store.weekly[weekStr].sampleCount += 1;
  if (isAlert) store.weekly[weekStr].limitBreaches += 1;

  // Ensure daily & hourly bucket
  if (!store.daily[dayKey]) {
    store.daily[dayKey] = { date: `${year}-${monthStr}-${dayStr}`, sampleCount: 0, limitBreaches: 0, metrics: {}, hourly: {} };
  }
  if (!store.daily[dayKey].hourly) store.daily[dayKey].hourly = {};

  store.daily[dayKey].sampleCount += 1;
  if (isAlert) store.daily[dayKey].limitBreaches += 1;

  if (!store.daily[dayKey].hourly[hourStr]) {
    store.daily[dayKey].hourly[hourStr] = { sampleCount: 0, limitBreaches: 0, metrics: {} };
  }
  store.daily[dayKey].hourly[hourStr].sampleCount += 1;
  if (isAlert) store.daily[dayKey].hourly[hourStr].limitBreaches += 1;

  // Extract numerical telemetry values
  const valuesToTrack = {
    temperature: readings.Temperature ?? readings.temperature ?? readings.TEMP ?? null,
    humidity: readings.Humidity ?? readings.humidity ?? readings.RH ?? null,
    current: readings.current ?? readings.CURRENT ?? null,
    pressure: readings.pressure ?? readings.PRESSURE ?? null,
    dew: readings.dew ?? readings.DEW ?? null,
    waterLevel: readings.waterlevel ?? readings.waterLevel ?? readings.WATERLEVEL ?? null
  };

  // Update metrics for Year, Month, Week, Day, Hour
  for (const [key, val] of Object.entries(valuesToTrack)) {
    if (val !== null && val !== undefined && !isNaN(val)) {
      // Yearly
      if (!store.yearly.metrics[key]) store.yearly.metrics[key] = { min: 0, max: 0, sum: 0, count: 0, avg: 0 };
      updateMetricBucket(store.yearly.metrics[key], val);

      // Monthly
      if (!store.monthly[monthStr].metrics[key]) store.monthly[monthStr].metrics[key] = { min: 0, max: 0, sum: 0, count: 0, avg: 0 };
      updateMetricBucket(store.monthly[monthStr].metrics[key], val);

      // Weekly
      if (!store.weekly[weekStr].metrics[key]) store.weekly[weekStr].metrics[key] = { min: 0, max: 0, sum: 0, count: 0, avg: 0 };
      updateMetricBucket(store.weekly[weekStr].metrics[key], val);

      // Daily
      if (!store.daily[dayKey].metrics[key]) store.daily[dayKey].metrics[key] = { min: 0, max: 0, sum: 0, count: 0, avg: 0 };
      updateMetricBucket(store.daily[dayKey].metrics[key], val);

      // Hourly
      if (!store.daily[dayKey].hourly[hourStr].metrics[key]) store.daily[dayKey].hourly[hourStr].metrics[key] = { min: 0, max: 0, sum: 0, count: 0, avg: 0 };
      updateMetricBucket(store.daily[dayKey].hourly[hourStr].metrics[key], val);
    }
  }

  writeJsonFile(filePath, store);
};

/**
 * Record an alarm incident into the site's monthly incident log (incidents_YYYY_MM.json).
 * Initial state includes isChecked = false, isVerified = false.
 */
lib.recordIncident = function(rawSiteName, incidentData = {}) {
  if (!rawSiteName) return null;

  const siteName = sanitizeName(rawSiteName);
  const now = incidentData.timestamp ? new Date(incidentData.timestamp) : new Date();
  const year = now.getFullYear();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const dayStr = String(now.getDate()).padStart(2, '0');
  const weekStr = getISOWeekString(now);

  const filePath = path.join(lib.baseDir, siteName, `incidents_${year}_${monthStr}.json`);

  let incidents = readJsonFile(filePath, []);
  if (!Array.isArray(incidents)) incidents = [];

  const incidentId = `INC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newIncident = {
    incidentId: incidentId,
    siteName: siteName,
    macId: incidentData.macId ? sanitizeName(incidentData.macId) : 'UNKNOWN',
    sensorName: incidentData.sensorName || incidentData.sensorConfig?.NAME || 'UNKNOWN',
    alertType: incidentData.alertType || incidentData.TYPE || 'LIMIT_BREACH',
    message: incidentData.message || incidentData.MESSAGE || '',
    timestamp: now.toISOString(),
    year: year,
    month: monthStr,
    day: dayStr,
    week: weekStr,
    isChecked: false,
    isVerified: false,
    checkedBy: null,
    checkedAt: null,
    notes: ''
  };

  incidents.unshift(newIncident); // Add newest first
  writeJsonFile(filePath, incidents);
  return newIncident;
};

/**
 * Update incident verification state from FE.
 */
lib.updateIncidentVerification = function(rawSiteName, year, incidentId, payload = {}) {
  if (!rawSiteName || !incidentId) return false;

  const siteDirName = findMatchingSubdir(lib.baseDir, rawSiteName) || sanitizeName(rawSiteName);
  const targetYear = year || new Date().getFullYear();
  const siteDir = path.join(lib.baseDir, siteDirName);

  if (!fs.existsSync(siteDir)) return false;

  let monthStr = payload.month ? String(payload.month).padStart(2, '0') : null;

  // Determine target files to search
  let candidateFiles = [];
  if (monthStr) {
    candidateFiles.push(path.join(siteDir, `incidents_${targetYear}_${monthStr}.json`));
  } else {
    // Scan all matching files in siteDir
    try {
      const files = fs.readdirSync(siteDir);
      files.forEach(f => {
        if ((f.startsWith(`incidents_${targetYear}_`) || f === `incidents_${targetYear}.json`) && f.endsWith('.json')) {
          candidateFiles.push(path.join(siteDir, f));
        }
      });
    } catch (err) {
      console.error(`[FILESTORES.JS] Error scanning ${siteDir}:`, err.message);
    }
  }

  for (const filePath of candidateFiles) {
    let incidents = readJsonFile(filePath, []);
    if (!Array.isArray(incidents)) continue;

    const idx = incidents.findIndex(inc => inc.incidentId === incidentId);
    if (idx !== -1) {
      incidents[idx].isChecked = payload.isChecked !== undefined ? Boolean(payload.isChecked) : true;
      incidents[idx].isVerified = payload.isVerified !== undefined ? Boolean(payload.isVerified) : true;
      incidents[idx].checkedBy = payload.checkedBy || 'operator';
      incidents[idx].checkedAt = new Date().toISOString();
      if (payload.notes !== undefined) incidents[idx].notes = String(payload.notes);

      return writeJsonFile(filePath, incidents);
    }
  }

  return false;
};

/**
 * Fetch telemetry rollup summary for a sensor.
 */
lib.getRollup = function(rawSiteName, rawMacId, year = new Date().getFullYear()) {
  if (!rawSiteName || !rawMacId) return null;

  const siteDirName = findMatchingSubdir(lib.baseDir, rawSiteName) || sanitizeName(rawSiteName);
  const siteDir = path.join(lib.baseDir, siteDirName);

  const macDirName = findMatchingSubdir(siteDir, rawMacId) || sanitizeName(rawMacId);
  const sensorDir = path.join(siteDir, macDirName);

  if (!fs.existsSync(sensorDir)) return null;

  const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
  let filePath = path.join(sensorDir, `${targetYear}.json`);

  if (!fs.existsSync(filePath)) {
    // Fallback: look for any year json file in sensorDir (e.g., latest year)
    try {
      const files = fs.readdirSync(sensorDir).filter(f => f.endsWith('.json')).sort().reverse();
      if (files.length > 0) {
        filePath = path.join(sensorDir, files[0]);
      }
    } catch (err) {}
  }

  return readJsonFile(filePath, null);
};

lib.getTelemetryRollup = lib.getRollup;

/**
 * Fetch incident list for a site with optional filters.
 */
lib.getIncidents = function(rawSiteName, year = new Date().getFullYear(), filters = {}) {
  if (!rawSiteName) return [];
  const siteDirName = findMatchingSubdir(lib.baseDir, rawSiteName) || sanitizeName(rawSiteName);
  const siteDir = path.join(lib.baseDir, siteDirName);

  if (!fs.existsSync(siteDir)) return [];

  let incidents = [];
  let monthStr = filters.month ? String(filters.month).padStart(2, '0') : null;

  if (monthStr) {
    const filePath = path.join(siteDir, `incidents_${year}_${monthStr}.json`);
    const monthData = readJsonFile(filePath, []);
    if (Array.isArray(monthData)) incidents = monthData;
  } else {
    // Collect all monthly files for the target year (and legacy year file if present)
    try {
      const files = fs.readdirSync(siteDir);
      files.forEach(f => {
        if ((f.startsWith(`incidents_${year}_`) || f === `incidents_${year}.json`) && f.endsWith('.json')) {
          const fileData = readJsonFile(path.join(siteDir, f), []);
          if (Array.isArray(fileData)) {
            incidents = incidents.concat(fileData);
          }
        }
      });
    } catch (err) {
      console.error(`[FILESTORES.JS] Error reading incident files in ${siteDir}:`, err.message);
    }
  }

  // Sort newest first
  incidents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return incidents.filter(inc => {
    if (filters.macId && sanitizeName(filters.macId) !== inc.macId) return false;
    if (filters.alertType && String(filters.alertType).toUpperCase() !== String(inc.alertType).toUpperCase()) return false;
    if (filters.isChecked !== undefined && Boolean(filters.isChecked) !== inc.isChecked) return false;
    if (filters.isVerified !== undefined && Boolean(filters.isVerified) !== inc.isVerified) return false;
    if (filters.day && String(filters.day).padStart(2, '0') !== inc.day) return false;
    if (filters.week && String(filters.week).toUpperCase() !== inc.week) return false;
    return true;
  });
};

module.exports = lib;

