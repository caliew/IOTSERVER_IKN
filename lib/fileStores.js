/*
 * Library for storing and aggregating pre-computed sensor data & incident records
 * Structure:
 *   .data/fileStores/<siteName>/<macId>/<year>.json  (Weekly, Monthly, Yearly rollups)
 *   .data/fileStores/<siteName>/incidents_<year>.json (Incident verification logs)
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

  // Ensure daily bucket
  if (!store.daily[dayKey]) {
    store.daily[dayKey] = { date: `${year}-${monthStr}-${dayStr}`, sampleCount: 0, limitBreaches: 0, metrics: {} };
  }
  store.daily[dayKey].sampleCount += 1;
  if (isAlert) store.daily[dayKey].limitBreaches += 1;

  // Extract numerical telemetry values
  const valuesToTrack = {
    temperature: readings.Temperature ?? readings.temperature ?? readings.TEMP ?? null,
    humidity: readings.Humidity ?? readings.humidity ?? readings.RH ?? null,
    current: readings.current ?? readings.CURRENT ?? null,
    pressure: readings.pressure ?? readings.PRESSURE ?? null,
    dew: readings.dew ?? readings.DEW ?? null,
    waterLevel: readings.waterlevel ?? readings.waterLevel ?? readings.WATERLEVEL ?? null
  };

  // Update metrics for Year, Month, Week, Day
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
    }
  }

  writeJsonFile(filePath, store);
};

/**
 * Record an alarm incident into the site's incident log.
 * Initial state includes isChecked = false, isVerified = false.
 */
lib.recordIncident = function(rawSiteName, incidentData = {}) {
  if (!rawSiteName) return null;

  const siteName = sanitizeName(rawSiteName);
  const now = new Date();
  const year = now.getFullYear();
  const filePath = path.join(lib.baseDir, siteName, `incidents_${year}.json`);

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
    timestamp: incidentData.timestamp || now.toISOString(),
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

  const siteName = sanitizeName(rawSiteName);
  const targetYear = year || new Date().getFullYear();
  const filePath = path.join(lib.baseDir, siteName, `incidents_${targetYear}.json`);

  let incidents = readJsonFile(filePath, []);
  if (!Array.isArray(incidents)) return false;

  const idx = incidents.findIndex(inc => inc.incidentId === incidentId);
  if (idx === -1) return false;

  incidents[idx].isChecked = payload.isChecked !== undefined ? Boolean(payload.isChecked) : true;
  incidents[idx].isVerified = payload.isVerified !== undefined ? Boolean(payload.isVerified) : true;
  incidents[idx].checkedBy = payload.checkedBy || 'operator';
  incidents[idx].checkedAt = new Date().toISOString();
  if (payload.notes !== undefined) incidents[idx].notes = String(payload.notes);

  return writeJsonFile(filePath, incidents);
};

/**
 * Fetch telemetry rollup summary for a sensor.
 */
lib.getRollup = function(rawSiteName, rawMacId, year = new Date().getFullYear()) {
  if (!rawSiteName || !rawMacId) return null;
  const siteName = sanitizeName(rawSiteName);
  const macId = sanitizeName(rawMacId);
  const filePath = path.join(lib.baseDir, siteName, macId, `${year}.json`);
  return readJsonFile(filePath, null);
};

/**
 * Fetch incident list for a site with optional filters.
 */
lib.getIncidents = function(rawSiteName, year = new Date().getFullYear(), filters = {}) {
  if (!rawSiteName) return [];
  const siteName = sanitizeName(rawSiteName);
  const filePath = path.join(lib.baseDir, siteName, `incidents_${year}.json`);
  let incidents = readJsonFile(filePath, []);

  if (!Array.isArray(incidents)) return [];

  return incidents.filter(inc => {
    if (filters.macId && sanitizeName(filters.macId) !== inc.macId) return false;
    if (filters.isChecked !== undefined && Boolean(filters.isChecked) !== inc.isChecked) return false;
    if (filters.isVerified !== undefined && Boolean(filters.isVerified) !== inc.isVerified) return false;
    return true;
  });
};

module.exports = lib;
