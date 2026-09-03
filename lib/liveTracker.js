/*
 * Live Sensor Tracking Logger Module
 * Monitors specified sensors in config/trackedSensors.json and writes structured JSON tracking files to .logs/_TRACKING_<MACID>.json
 * Provides dedicated tracked sensor status updates and separated new-line alert logs.
 */

const fs = require('fs');
const path = require('path');
const _logs = require('./logs');

const CONFIG_PATH = path.join(__dirname, '../config/trackedSensors.json');

let totalPacketsReceived = 0;
let lastPacketSummary = 'Waiting for incoming telemetry...';

// Store current state of tracked sensors
const trackedSensorStates = {};

/**
 * Normalizes strings for comparison (case-insensitive, strips dashes/colons/slashes/spaces)
 */
function normalizeStr(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[:-_\/\s]/g, '').toUpperCase();
}

/**
 * Normalizes MAC ID or sensor ID strings for comparison (e.g. B0-BC-82-C4-C4-41 -> B0BC82C4C441)
 */
function normalizeMac(mac) {
  if (mac === null || mac === undefined) return '';
  return String(mac).replace(/[:-]/g, '').toUpperCase();
}

/**
 * Formats a MAC address or Sensor ID string safely (handles strings, numbers, etc.)
 */
function formatMac(mac) {
  if (mac === null || mac === undefined || mac === '') return 'N/A';
  const macStr = String(mac).trim();
  if (macStr.includes('-') || macStr.length < 12) {
    return macStr.toUpperCase();
  }
  return macStr.replace(/(.{2})(?=.)/g, '$1-').toUpperCase();
}

/**
 * Parses rules from config/trackedSensors.json.
 * Supports:
 * - Plain MAC string: "BA-92-D1-B4-B5-3A"
 * - Site/Company + MAC string: "ikn_hospital/BA-92-D1-B4-B5-3A" or "ikn_hospital:BA-92-D1-B4-B5-3A"
 * - Object: { "site": "ikn_hospital", "macId": "BA-92-D1-B4-B5-3A" }
 */
function getTrackedSensorRules() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return [];
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed.TRACKED_SENSORS)) return [];

    return parsed.TRACKED_SENSORS.map((entry) => {
      if (typeof entry === 'string') {
        const trimmed = entry.trim();
        if (trimmed.includes('/') || trimmed.includes(':')) {
          const parts = trimmed.split(/[\/:]/);
          return {
            site: normalizeStr(parts[0]),
            macId: normalizeMac(parts[1]),
            raw: entry,
          };
        }
        return {
          site: null,
          macId: normalizeMac(trimmed),
          raw: entry,
        };
      } else if (typeof entry === 'object' && entry !== null) {
        const site = entry.site || entry.siteName || entry.company || null;
        const macId = entry.macId || entry.sensorId || entry.mac || null;
        return {
          site: site ? normalizeStr(site) : null,
          macId: macId ? normalizeMac(macId) : null,
          raw: entry,
        };
      }
      return null;
    }).filter(Boolean);
  } catch (err) {
    return [];
  }
}

/**
 * Returns current list of tracked MAC IDs from config/trackedSensors.json
 */
function getTrackedSensors() {
  return getTrackedSensorRules();
}

/**
 * Checks if a given sensor ID & optional siteName is currently tracked
 */
function isSensorTracked(sensorId, siteName = null) {
  if (sensorId === null || sensorId === undefined) return false;
  const normMac = normalizeMac(sensorId);
  const normSite = siteName ? normalizeStr(siteName) : null;

  const rules = getTrackedSensorRules();
  return rules.some((rule) => {
    if (!rule.macId || rule.macId !== normMac) return false;
    if (rule.site && normSite) {
      return rule.site === normSite;
    }
    return true;
  });
}

/**
 * Reads company sensor config settings from .data/<siteName>/settings.json for a given MAC ID
 */
function getSensorConfigFromDataStore(siteName, macId) {
  if (!siteName || !macId) return null;
  try {
    const normMac = normalizeMac(macId);
    const settingsPath = path.join(__dirname, `../.data/${siteName.toLowerCase()}/settings.json`);
    if (!fs.existsSync(settingsPath)) return null;

    const content = fs.readFileSync(settingsPath, 'utf8');
    const data = JSON.parse(content);
    const sensors = data?.IOT_SENSORS || {};

    for (const key of Object.keys(sensors)) {
      if (normalizeMac(key) === normMac) {
        return sensors[key]?.["1"] || sensors[key] || null;
      }
    }
  } catch (err) {
    // Silent fallback
  }
  return null;
}

/**
 * Overwrites the current terminal line in-place (\r) or forces a new line (\n).
 * @param {string} text - Status text to print
 * @param {boolean} [forceNewline=false] - If true, appends a newline so alert logs stay in history.
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
 * Alerts are printed on dedicated new lines separately from [SERVER ALIVE].
 */
function updateLiveStatus({ portId, siteName, macId, sensorName, tempVal, isAlert, message }) {
  totalPacketsReceived++;
  const timeStr = new Date().toLocaleTimeString();

  const displayMac = formatMac(macId);
  const tempStr = (tempVal !== undefined && tempVal !== null && tempVal !== '') ? `${tempVal}°C` : 'N/A';
  const siteStr = siteName || 'N/A';

  lastPacketSummary = `[Port ${portId || '?'}] ${siteStr} - ${displayMac} (${tempStr})`;

  if (isAlert) {
    // Dedicated alert line on a new line (NOT part of [SERVER ALIVE])
    const alertLine = `⚠️ [LIMIT ALERT] ${timeStr} | Port: ${portId || 'N/A'} | Site: ${siteStr} | Sensor: ${sensorName || displayMac} (${displayMac}) | Reading: ${tempStr}${message ? ' | Message: ' + message : ''}`;
    renderLiveStatusLine(alertLine, true);
  } else {
    // Normal heartbeat update in-place
    renderHeartbeat();
  }
}

/**
 * Records a live telemetry event to .logs/_TRACKING_<MACID>.json and prints updated tracked sensor state.
 * Automatically resolves sensor config from .data/<siteName>/settings.json if sensorConfig is omitted.
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
  if (!isSensorTracked(macId, siteName)) return;

  const formattedMac = formatMac(macId);
  const fileName = `_TRACKING_${formattedMac}`;

  // Automatically resolve sensor configuration from .data/<siteName>/settings.json if not passed
  const resolvedConfig = sensorConfig || getSensorConfigFromDataStore(siteName, macId) || {};

  const eventRecord = {
    timestamp: new Date().toISOString(),
    portReceivedOn: portId || 'N/A',
    siteName: siteName || 'N/A',
    macId: formattedMac,
    sensorName: resolvedConfig?.NAME || 'UNKNOWN',
    sensorType: resolvedConfig?.TYPE || 'UNKNOWN',
    alertGroup: resolvedConfig?.ALERTGROUP || 'N/A',
    configuredLimits: {
      tempMin: resolvedConfig?.TEMP_MIN ?? null,
      tempMax: resolvedConfig?.TEMP_MAX ?? null,
      ampMin: resolvedConfig?.AMP_MIN ?? null,
      ampMax: resolvedConfig?.AMP_MAX ?? null,
      pressMin: resolvedConfig?.PRESS_MIN ?? null,
      pressMax: resolvedConfig?.PRESS_MAX ?? null,
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
      const humdVal = parsedValues?.Humidity ?? parsedValues?.HUMD ?? parsedValues?.humd ?? null;
      const battVal = parsedValues?.BATT ?? parsedValues?.batt ?? null;
      const isAlert = eventRecord.alertEvaluation.isAlertTriggered;
      const statusTag = isAlert ? '⚠️ ALERT' : '✅ NORMAL';
      const nameStr = eventRecord.sensorName !== 'UNKNOWN' ? eventRecord.sensorName : formattedMac;

      // Update state cache for tracked sensor
      trackedSensorStates[formattedMac] = {
        timestamp: timeStr,
        portId: portId || 'N/A',
        siteName: siteName || 'N/A',
        sensorName: nameStr,
        macId: formattedMac,
        tempVal: tempVal !== 'N/A' ? `${tempVal}°C` : 'N/A',
        humdVal: humdVal !== null ? `${humdVal}%` : 'N/A',
        battVal: battVal !== null ? `${battVal}%` : 'N/A',
        statusTag: statusTag,
      };

      lastPacketSummary = `[Port ${portId}] ${siteName} - ${formattedMac} (${tempVal}°C)`;

      if (isAlert) {
        // Dedicated alert on new line
        const alertMsg = eventRecord.alertEvaluation.message || 'Threshold Breached';
        const alertLine = `⚠️ [TRACKED SENSOR ALERT] ${timeStr} | Site: ${siteName} | Sensor: ${nameStr} (${formattedMac}) | Temp: ${tempVal}°C | ${alertMsg}`;
        renderLiveStatusLine(alertLine, true);
      } else {
        // Updated tracked sensor live state line (in-place)
        const stateStr = `🎯 [TRACKED SENSOR] ${timeStr} | Site: ${siteName} | Name: ${nameStr} | MAC: ${formattedMac} | Temp: ${tempVal}°C${humdVal !== null ? ' | Hum: ' + humdVal + '%' : ''}${battVal !== null ? ' | Batt: ' + battVal + '%' : ''} | Status: ${statusTag}`;
        renderLiveStatusLine(stateStr, false);
      }
    }
  });
}

/**
 * Records a messaging dispatch event (WhatsApp / Telegram) to .logs/_TRACKING_<MACID>.json
 */
function recordDispatchEvent({ siteName, macId, alertGroup, gatewayName, message }) {
  if (!isSensorTracked(macId, siteName)) return;

  const formattedMac = formatMac(macId);
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
      const dispatchLine = `📲 [ALERT DISPATCHED] ${timeStr} | Site: ${siteName} | MAC: ${formattedMac} | Gateway: ${gatewayName} | Group: ${alertGroup} | Msg: ${message}`;
      renderLiveStatusLine(dispatchLine, true);
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
  getSensorConfigFromDataStore,
  renderLiveStatusLine,
  updateLiveStatus,
  trackedSensorStates,
};
