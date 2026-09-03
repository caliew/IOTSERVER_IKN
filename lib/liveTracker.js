/*
 * Live Sensor Tracking Logger Module
 * Monitors specified sensors in config/trackedSensors.json and writes structured JSON tracking files to .logs/_TRACKING_<MACID>.json
 * Provides an active heartbeat & single-line terminal status overwriter.
 */

const fs = require('fs');
const path = require('path');
const _logs = require('./logs');

const CONFIG_PATH = path.join(__dirname, '../config/trackedSensors.json');

let totalPacketsReceived = 0;
let lastPacketSummary = 'Waiting for incoming telemetry...';
let lastPacketTime = null;

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
    console.error('\n[LIVETRACKER] Failed to read tracking config:', err.message);
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
 * Overwrites the current terminal line in-place using carriage return (\r) and clear-line ANSI (\x1b[K).
 * @param {string} text - Status text to print
 * @param {boolean} [forceNewline=false] - If true, appends a newline so important logs stay in history.
 */
function renderLiveStatusLine(text, forceNewline = false) {
  if (forceNewline) {
    process.stdout.write(`\n${text}\n`);
  } else {
    process.stdout.write(`\r${text}\x1b[K`);
  }
}

/**
 * Renders the periodic heartbeat / status bar
 */
function renderHeartbeat() {
  const timeStr = new Date().toLocaleTimeString();
  const trackedCount = getTrackedSensors().length;
  const statusText = `📌 [SERVER ALIVE] ${timeStr} | Tracked: ${trackedCount} | Rx Packets: ${totalPacketsReceived} | Last Rx: ${lastPacketSummary}`;
  renderLiveStatusLine(statusText, false);
}

// Start auto-heartbeat tick every 3 seconds to keep terminal clock alive
let heartbeatTimer = setInterval(renderHeartbeat, 3000);

/**
 * Updates single-line status bar for any sensor currently being processed.
 */
function updateLiveStatus({ portId, siteName, macId, sensorName, tempVal, isAlert, message }) {
  totalPacketsReceived++;
  const timeStr = new Date().toLocaleTimeString();
  lastPacketTime = timeStr;

  const displayMac = macId ? (macId.includes('-') ? macId : macId.replace(/(.{2})(?=.)/g, '$1-').toUpperCase()) : 'N/A';
  const tempStr = (tempVal !== undefined && tempVal !== null && tempVal !== '') ? `${tempVal}°C` : 'N/A';
  const siteStr = siteName || 'N/A';

  lastPacketSummary = `[Port ${portId || '?'}] ${siteStr} - ${displayMac} (${tempStr})`;

  const alertTag = isAlert ? '⚠️ ALERT' : '✅ OK';
  const trackedCount = getTrackedSensors().length;

  const statusText = `📌 [SERVER ALIVE] ${timeStr} | Tracked: ${trackedCount} | Rx Packets: ${totalPacketsReceived} | Last Rx: ${lastPacketSummary} | ${alertTag}${message ? ' (' + message + ')' : ''}`;

  renderLiveStatusLine(statusText, !!isAlert);
}

/**
 * Records a live telemetry event to .logs/_TRACKING_<MACID>.json and updates terminal in-place.
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
      console.error(`\n[LIVETRACKER] Error writing tracking log for ${formattedMac}:`, err);
    } else {
      totalPacketsReceived++;
      const timeStr = new Date().toLocaleTimeString();
      const tempVal = parsedValues?.Temperature ?? parsedValues?.TEMP ?? parsedValues?.temp ?? (Array.isArray(parsedValues?.DATAS) ? parsedValues.DATAS[0] : null) ?? 'N/A';
      const isAlert = eventRecord.alertEvaluation.isAlertTriggered;
      const alertTag = isAlert ? '⚠️ ALERT' : '✅ NORMAL';
      const sensorLabel = eventRecord.sensorName !== 'UNKNOWN' ? `${eventRecord.sensorName} (${formattedMac})` : formattedMac;

      lastPacketSummary = `[Port ${portId}] ${siteName} - ${formattedMac} (${tempVal}°C)`;

      const statusText = `📌 [TRACKED SENSOR] ${timeStr} | Rx: ${totalPacketsReceived} | Port: ${portId} | Site: ${siteName} | Sensor: ${sensorLabel} | Temp: ${tempVal}°C | ${alertTag}`;

      renderLiveStatusLine(statusText, isAlert);
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
      console.error(`\n[LIVETRACKER] Error writing dispatch log for ${formattedMac}:`, err);
    } else {
      const timeStr = new Date().toLocaleTimeString();
      const statusText = `📲 [DISPATCHED] ${timeStr} | Site: ${siteName} | MAC: ${formattedMac} | Gateway: ${gatewayName} | Group: ${alertGroup}`;
      renderLiveStatusLine(statusText, true);
    }
  });
}

/**
 * Gated console log — updates line in-place for tracked sensor status or prints newline on alerts.
 */
function trackedLog(sensorId, ...args) {
  if (isSensorTracked(sensorId)) {
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    const isAlertMsg = msg.includes('ALERT') || msg.includes('⚠️');
    renderLiveStatusLine(`🔍 [TRACK:${sensorId}] ${msg}`, isAlertMsg);
  }
}

module.exports = {
  isSensorTracked,
  trackedLog,
  recordTelemetryEvent,
  recordDispatchEvent,
  getTrackedSensors,
  renderLiveStatusLine,
  updateLiveStatus,
};
