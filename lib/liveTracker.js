/*
 * Live Sensor Tracking Logger Module
 * Monitors specified sensors in config/trackedSensors.json and writes structured JSON tracking files to .logs/_TRACKING_<MACID>.json
 */

const fs = require('fs');
const path = require('path');
const _logs = require('./logs');

const CONFIG_PATH = path.join(__dirname, '../config/trackedSensors.json');

/**
 * Normalizes MAC ID strings for comparison (e.g. B0-BC-82-C4-C4-41 -> B0BC82C4C441)
 */
function normalizeMac(mac) {
  if (!mac || typeof mac !== 'string') return '';
  return mac.replace(/[:-]/g, '').toUpperCase();
}

/**
 * Returns current list of tracked MAC IDs from config/trackedSensors.json
 */
function getTrackedSensors() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return [];
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.TRACKED_SENSORS)
      ? parsed.TRACKED_SENSORS.map((m) => normalizeMac(m))
      : [];
  } catch (err) {
    console.error('[LIVETRACKER] Failed to read tracking config:', err.message);
    return [];
  }
}

/**
 * Checks if a given sensor ID is currently tracked
 */
function isSensorTracked(sensorId) {
  if (!sensorId) return false;
  const normId = normalizeMac(sensorId);
  const trackedList = getTrackedSensors();
  return trackedList.includes(normId);
}

/**
 * Records a live telemetry event to .logs/_TRACKING_<MACID>.json
 */
function recordTelemetryEvent({
  portId,
  siteName,
  macId,
  rawBuffer,
  parsedValues,
  sensorConfig,
  evalResult,
}) {
  const normId = normalizeMac(macId);
  if (!isSensorTracked(normId)) return;

  const formattedMac = macId.includes('-')
    ? macId.toUpperCase()
    : macId.replace(/(.{2})(?=.)/g, '$1-').toUpperCase();

  const fileName = `_TRACKING_${formattedMac}`;

  const eventRecord = {
    timestamp: new Date().toISOString(),
    portReceivedOn: portId || 'N/A',
    siteName: siteName || 'N/A',
    macId: formattedMac,
    sensorName: sensorConfig?.NAME || 'UNKNOWN',
    sensorType: sensorConfig?.TYPE || 'UNKNOWN',
    alertGroup: sensorConfig?.ALERTGROUP || 'N/A',
    configuredLimits: {
      tempMin: sensorConfig?.TEMP_MIN ?? null,
      tempMax: sensorConfig?.TEMP_MAX ?? null,
      ampMin: sensorConfig?.AMP_MIN ?? null,
      ampMax: sensorConfig?.AMP_MAX ?? null,
      pressMin: sensorConfig?.PRESS_MIN ?? null,
      pressMax: sensorConfig?.PRESS_MAX ?? null,
    },
    rawBuffer: rawBuffer || '',
    receivedValues: parsedValues || {},
    alertEvaluation: {
      isAlertTriggered: evalResult?.isAlert || false,
      isFalseSignal: evalResult?.isFalseSignal || false,
      message: evalResult?.message || '',
    },
  };

  const jsonString = JSON.stringify(eventRecord);
  _logs.append(fileName, jsonString, (err) => {
    if (err) {
      console.error(`[LIVETRACKER] Error writing tracking log for ${formattedMac}:`, err);
    } else {
      console.log(
        `📌 [LIVE TRACKER] Recorded telemetry for ${formattedMac} (Port ${portId}, Alert=${eventRecord.alertEvaluation.isAlertTriggered})`
      );
    }
  });
}

/**
 * Records a messaging dispatch event (WhatsApp / Telegram) to .logs/_TRACKING_<MACID>.json
 */
function recordDispatchEvent({ siteName, macId, alertGroup, gatewayName, message }) {
  const normId = normalizeMac(macId);
  if (!isSensorTracked(normId)) return;

  const formattedMac = macId.includes('-')
    ? macId.toUpperCase()
    : macId.replace(/(.{2})(?=.)/g, '$1-').toUpperCase();

  const fileName = `_TRACKING_${formattedMac}`;

  const dispatchRecord = {
    timestamp: new Date().toISOString(),
    eventType: 'MESSAGING_DISPATCH',
    siteName: siteName || 'N/A',
    macId: formattedMac,
    alertGroup: alertGroup || 'N/A',
    messagingGateway: gatewayName || 'UNKNOWN',
    messageContent: message || '',
    status: 'DISPATCHED_TO_GATEWAY',
  };

  const jsonString = JSON.stringify(dispatchRecord);
  _logs.append(fileName, jsonString, (err) => {
    if (err) {
      console.error(`[LIVETRACKER] Error writing dispatch log for ${formattedMac}:`, err);
    } else {
      console.log(
        `📲 [LIVE TRACKER] Recorded ${gatewayName} dispatch for ${formattedMac} (Group: ${alertGroup})`
      );
    }
  });
}

/**
 * Gated console.log — only prints if sensorId is in trackedSensors.json.
 * Use this instead of raw console.log for per-sensor debug output in server.js / decoders.js.
 * @param {string} sensorId - MAC ID to check (e.g. 'B0-BC-82-C4-C4-41')
 * @param {...any} args - Arguments passed to console.log
 */
function trackedLog(sensorId, ...args) {
  if (isSensorTracked(sensorId)) {
    console.log(`🔍 [TRACK:${sensorId}]`, ...args);
  }
}

module.exports = {
  isSensorTracked,
  trackedLog,
  recordTelemetryEvent,
  recordDispatchEvent,
  getTrackedSensors,
};
