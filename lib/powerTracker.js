/*
 * Proactive Power & Offline Status Tracker for Gateways and Sensors
 * File storage: .data/powerTracker.json
 */

const fs = require('fs');
const path = require('path');
const fileStores = require('./fileStores');

const lib = {};

lib.storageFile = path.join(__dirname, '/../.data/powerTracker.json');

// Helper: Read storage
function readState() {
  try {
    if (!fs.existsSync(lib.storageFile)) return {};
    const content = fs.readFileSync(lib.storageFile, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('[POWERTRACKER.JS] Error reading state:', err.message);
    return {};
  }
}

// Helper: Write storage
function writeState(state) {
  try {
    const dir = path.dirname(lib.storageFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(lib.storageFile, JSON.stringify(state, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[POWERTRACKER.JS] Error writing state:', err.message);
    return false;
  }
}

/**
 * Record a heartbeat / incoming packet for a gateway or sensor.
 * @param {string} siteName - Site identifier (e.g. "ikn_hospital")
 * @param {string} id - MAC ID or Gateway ID
 * @param {string} entityType - "GATEWAY" or "SENSOR"
 */
lib.updateHeartbeat = function(siteName, id, entityType = 'SENSOR') {
  if (!siteName || !id) return;

  const key = `${siteName}::${id}`.toUpperCase();
  const state = readState();
  const now = Date.now();
  const prevStatus = state[key]?.status || 'UNKNOWN';

  state[key] = {
    siteName: siteName,
    id: id,
    entityType: entityType,
    lastSeen: now,
    lastSeenIso: new Date(now).toISOString(),
    status: 'ONLINE',
    lastAlertSent: prevStatus === 'OFFLINE' ? null : (state[key]?.lastAlertSent || null)
  };

  if (prevStatus === 'OFFLINE') {
    console.log(`[POWERTRACKER.JS] ✅ RECOVERED ONLINE: ${siteName} / ${id} (${entityType})`);
    // Record recovery event in fileStores incident log
    fileStores.recordIncident(siteName, {
      macId: id,
      sensorName: `${entityType} ${id}`,
      alertType: 'POWER_RESTORED',
      message: `[POWER RESTORED] ${entityType} ${id} re-connected and is ONLINE.`
    });
  }

  writeState(state);
};

/**
 * Periodically scan all tracked devices and detect power loss / offline events.
 * @param {number} thresholdMinutes - Minutes without packet before flagging offline (default: 15)
 * @param {Function} alertCallback - Callback function (siteName, alertObj) when offline event is detected
 */
lib.checkOfflineStatus = function(thresholdMinutes = 15, alertCallback = null) {
  const state = readState();
  const now = Date.now();
  const thresholdMs = thresholdMinutes * 60 * 1000;
  let stateChanged = false;
  const offlineEvents = [];

  for (const [key, item] of Object.entries(state)) {
    const elapsed = now - item.lastSeen;
    const isOverdue = elapsed > thresholdMs;

    if (isOverdue && item.status !== 'OFFLINE') {
      item.status = 'OFFLINE';
      item.lastAlertSent = new Date(now).toISOString();
      stateChanged = true;

      const elapsedMins = Math.round(elapsed / (1000 * 60));
      const alertMsg = `⚠️ [POWER LOSS / OFFLINE] ${item.entityType} "${item.id}" at site [${item.siteName.toUpperCase()}] unreachable for ${elapsedMins} mins.`;

      console.warn(`[POWERTRACKER.JS] ${alertMsg}`);

      // Record in fileStores incident log with initial isChecked=false, isVerified=false
      fileStores.recordIncident(item.siteName, {
        macId: item.id,
        sensorName: `${item.entityType} ${item.id}`,
        alertType: 'POWER_LOSS_OR_OFFLINE',
        message: alertMsg,
        timestamp: new Date(now).toISOString()
      });

      const alertObj = {
        TYPE: 'POWER_LOSS_OR_OFFLINE',
        DTU: item.id,
        NAME: `${item.entityType} ${item.id}`,
        GROUP: item.siteName,
        MESSAGE: alertMsg,
        TIMESTAMP: new Date(now)
      };

      offlineEvents.push({ siteName: item.siteName, alertObj });

      if (typeof alertCallback === 'function') {
        try {
          alertCallback(item.siteName, alertObj);
        } catch (err) {
          console.error(`[POWERTRACKER.JS] Error executing alert callback:`, err.message);
        }
      }
    }
  }

  if (stateChanged) {
    writeState(state);
  }

  return offlineEvents;
};

/**
 * Get online/offline summary for a site or all sites.
 */
lib.getSummary = function(siteNameFilter = null) {
  const state = readState();
  const summary = {
    total: 0,
    online: 0,
    offline: 0,
    devices: []
  };

  for (const item of Object.values(state)) {
    if (siteNameFilter && item.siteName.toLowerCase() !== siteNameFilter.toLowerCase()) continue;

    summary.total += 1;
    if (item.status === 'ONLINE') summary.online += 1;
    else summary.offline += 1;

    summary.devices.push(item);
  }

  return summary;
};

module.exports = lib;
