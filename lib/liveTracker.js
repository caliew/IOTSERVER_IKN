/*
 * Live Sensor Tracking Logger Module
 * Monitors specified sensors in config/trackedSensors.json and writes structured JSON tracking files to .logs/_TRACKING_<MACID>.json
 *
 * Terminal Layout (uses ANSI cursor positioning):
 *   Row -N...-2  : One fixed row per tracked sensor — overwrites in-place
 *   Row -1       : [SERVER ALIVE] heartbeat — overwrites in-place
 *   Alerts/Dispatches scroll UP above the fixed block (forceNewline true = move above)
 */

const fs = require('fs');
const path = require('path');
const _logs = require('./logs');

const CONFIG_PATH = path.join(__dirname, '../config/trackedSensors.json');

let totalPacketsReceived = 0;
let lastPacketSummary = 'Waiting for incoming telemetry...';

// Store current state of tracked sensors (keyed by normalized MAC)
const trackedSensorStates = {};

// Map normalized MAC => assigned row index (0 = first tracked sensor row)
const trackedRowIndex = {};

// Total number of reserved rows: tracked sensor rows + 1 [SERVER ALIVE] row
// This is calculated on first render from the config
let _reservedRows = 0;
let _blockInitialized = false;

// ─── String Utilities ───────────────────────────────────────────────────────

function normalizeStr(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[:-_\/\s]/g, '').toUpperCase();
}

function normalizeMac(mac) {
  if (mac === null || mac === undefined) return '';
  return String(mac).replace(/[:-]/g, '').toUpperCase();
}

function formatMac(mac) {
  if (mac === null || mac === undefined || mac === '') return 'N/A';
  const macStr = String(mac).trim();
  if (macStr.includes('-') || macStr.length < 12) {
    return macStr.toUpperCase();
  }
  return macStr.replace(/(.{2})(?=.)/g, '$1-').toUpperCase();
}

function padEnd(str, len) {
  const s = String(str || '');
  return s.length >= len ? s.substring(0, len) : s + ' '.repeat(len - s.length);
}

// ─── Config ─────────────────────────────────────────────────────────────────

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
          return { site: normalizeStr(parts[0]), macId: normalizeMac(parts[1]), raw: entry };
        }
        return { site: null, macId: normalizeMac(trimmed), raw: entry };
      } else if (typeof entry === 'object' && entry !== null) {
        const site = entry.site || entry.siteName || entry.company || null;
        const macId = entry.macId || entry.sensorId || entry.mac || null;
        return { site: site ? normalizeStr(site) : null, macId: macId ? normalizeMac(macId) : null, raw: entry };
      }
      return null;
    }).filter(Boolean);
  } catch (err) {
    return [];
  }
}

function getTrackedSensors() {
  return getTrackedSensorRules();
}

function isSensorTracked(sensorId, siteName = null) {
  if (sensorId === null || sensorId === undefined) return false;
  const normMac = normalizeMac(sensorId);
  const normSite = siteName ? normalizeStr(siteName) : null;
  const rules = getTrackedSensorRules();
  return rules.some((rule) => {
    if (!rule.macId || rule.macId !== normMac) return false;
    if (rule.site && normSite) return rule.site === normSite;
    return true;
  });
}

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
  } catch (err) { /* silent */ }
  return null;
}

// ─── ANSI Terminal Block Rendering ──────────────────────────────────────────

/**
 * Initialise the fixed display block by printing blank placeholder lines.
 * Called once on first render. Tracked sensors get row[0..N-1], SERVER ALIVE gets the last row.
 */
function extractDataHex(parsedValues) {
  if (!parsedValues) return '';
  if (parsedValues._DATAHEX) return String(parsedValues._DATAHEX).toUpperCase();
  if (parsedValues.hex) return String(parsedValues.hex).toUpperCase();
  if (parsedValues._HEX) return String(parsedValues._HEX).toUpperCase();
  if (Array.isArray(parsedValues.RCV_BYTES)) return parsedValues.RCV_BYTES.join('').toUpperCase();
  if (typeof parsedValues.RCV_BYTES === 'string') return parsedValues.RCV_BYTES.toUpperCase();
  return '';
}

/**
 * Initialise the fixed display block by printing blank placeholder lines.
 * Called once on first render. Tracked sensors get row[0..N-1], SERVER ALIVE gets the last row.
 */
function formatSensorReading(sensorType, unitSystem, parsedValues, evalResult) {
  const normType = String(sensorType || '').toUpperCase();
  const unit = String(unitSystem || '').toUpperCase();
  const alertObj = evalResult?.alertObj || {};
  const dataHex = extractDataHex(parsedValues);
  const hexTag = dataHex ? ` [Hex: ${dataHex}]` : '';

  if (normType.includes('PRESS')) {
    const pressVal = alertObj.PRESSURE ?? parsedValues?.PRESSURE ?? parsedValues?.pressure ?? parsedValues?._READINGPRESSURE;
    const displayUnit = unit || 'BAR';
    const valStr = pressVal !== undefined && pressVal !== null && pressVal !== '' ? pressVal : 'N/A';
    return `Press: ${valStr} ${displayUnit}${hexTag}`;
  }

  if (normType.includes('CURRENT') || normType.includes('PWR') || normType.includes('AC')) {
    const currVal = alertObj.CURRENT ?? parsedValues?.CURRENT ?? parsedValues?.current ?? parsedValues?._READINGCURRENT;
    const displayUnit = unit || 'A';
    const valStr = currVal !== undefined && currVal !== null && currVal !== '' ? currVal : 'N/A';
    return `Current: ${valStr} ${displayUnit}${hexTag}`;
  }

  if (normType.includes('WATER') || normType.includes('LEVEL')) {
    const wtrVal = alertObj.WATERLEVEL ?? parsedValues?.WATERLEVEL ?? parsedValues?.waterlevel;
    const displayUnit = unit || 'MM';
    const valStr = wtrVal !== undefined && wtrVal !== null && wtrVal !== '' ? wtrVal : 'N/A';
    return `WaterLvl: ${valStr} ${displayUnit}${hexTag}`;
  }

  // Default: Temperature / WiSensor / Temp & RH
  const tempVal = alertObj.TEMP ?? parsedValues?.Temperature ?? parsedValues?.TEMP ?? parsedValues?.temp
    ?? (Array.isArray(parsedValues?.DATAS) ? parsedValues.DATAS[0] : null);
  const displayUnit = unit || '°C';
  const valStr = tempVal !== undefined && tempVal !== null && tempVal !== '' ? `${tempVal}${displayUnit}` : 'N/A';
  return `Temp: ${valStr}${hexTag}`;
}

/**
 * Initialise the fixed display block by printing blank placeholder lines.
 * Called once on first render. Tracked sensors get row[0..N-1], SERVER ALIVE gets the last row.
 */
function initDisplayBlock(numTracked) {
  if (_blockInitialized) return;
  _reservedRows = numTracked + 1; // N tracked rows + 1 SERVER ALIVE row
  // Print N+1 blank lines to reserve the space
  process.stdout.write('\n'.repeat(_reservedRows));
  _blockInitialized = true;

  // Pre-render initial rows based on site settings.json
  const rules = getTrackedSensors();
  rules.forEach((rule) => {
    if (!rule.macId) return;
    const formattedMac = formatMac(rule.macId);
    const normMac = normalizeMac(rule.macId);
    if (!trackedSensorStates[formattedMac]) {
      const config = getSensorConfigFromDataStore(rule.site, rule.macId) || {};
      const sensorType = config.TYPE || '';
      const unitSystem = config.UNITSYSTEM || '';
      const readingSummary = formatSensorReading(sensorType, unitSystem, null, null);

      trackedSensorStates[formattedMac] = {
        timestamp: 'Waiting...',
        portId: 'N/A',
        siteName: rule.site || 'N/A',
        sensorName: config.NAME || formattedMac,
        macId: formattedMac,
        readingSummary,
        humdVal: 'N/A',
        battVal: 'N/A',
        statusTag: '⏳ WAITING',
      };
      renderTrackedSensorRow(normMac, trackedSensorStates[formattedMac]);
    }
  });
}

/**
 * Move cursor up `n` lines, overwrite a single line with `text`, then move back down.
 * rowFromBottom: 1 = last row (SERVER ALIVE), 2 = second from bottom (first tracked sensor), etc.
 */
function writeFixedRow(rowFromBottom, text) {
  const cols = process.stdout.columns || 200;
  const truncated = text.length > cols - 1 ? text.substring(0, cols - 1) : text;
  // Move up, go to column 0, clear line, write, move back down
  process.stdout.write(
    `\x1b[${rowFromBottom}A` +   // move up
    `\r\x1b[K` +                  // clear line
    truncated +
    `\x1b[${rowFromBottom}B`     // move back down
  );
}

/**
 * Print an alert/dispatch event ABOVE the fixed block (scrolls terminal history).
 */
function printScrollingAlert(text) {
  // Move to top of fixed block, insert a new line above it, print text
  process.stdout.write(
    `\x1b[${_reservedRows}A` +   // move to top of fixed block
    `\x1b[L` +                    // insert blank line (scrolls content up)
    `\r\x1b[K` +                  // clear line
    text + '\n' +
    `\x1b[${_reservedRows - 1}B` // move back down (one less because we just inserted)
  );
}

/**
 * Returns the row index (0-based from top of block) assigned to a tracked sensor MAC.
 * Assigns a new row if not yet registered.
 */
function getOrAssignRow(normMac) {
  if (trackedRowIndex[normMac] === undefined) {
    trackedRowIndex[normMac] = Object.keys(trackedRowIndex).length;
  }
  return trackedRowIndex[normMac];
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Renders the [SERVER ALIVE] heartbeat — always on the last fixed row.
 */
function renderHeartbeat() {
  const rules = getTrackedSensors();
  const numTracked = rules.length;
  if (!_blockInitialized) initDisplayBlock(numTracked);

  const timeStr = new Date().toLocaleTimeString();
  const statusText = `📌 [SERVER ALIVE] ${timeStr} | Tracked: ${numTracked} | Rx Packets: ${totalPacketsReceived} | Last Rx: ${lastPacketSummary}`;
  writeFixedRow(1, statusText);
}

// Start auto-heartbeat tick every 3 seconds
let heartbeatTimer = setInterval(renderHeartbeat, 3000);

/**
 * Updates [SERVER ALIVE] bar for any incoming packet (non-tracked).
 * Always overwrites in-place — never scrolls.
 */
function updateLiveStatus({ portId, siteName, macId, sensorName, tempVal }) {
  totalPacketsReceived++;
  const displayMac = formatMac(macId);
  const tempStr = (tempVal !== undefined && tempVal !== null && tempVal !== '') ? `${tempVal}` : 'N/A';
  lastPacketSummary = `[Port ${portId || '?'}] ${siteName || 'N/A'} - ${displayMac} (${tempStr})`;
  renderHeartbeat();
}

/**
 * Renders or updates a single in-place row for a tracked sensor.
 */
function renderTrackedSensorRow(normMac, stateObj) {
  const rules = getTrackedSensors();
  const numTracked = rules.length;
  if (!_blockInitialized) initDisplayBlock(numTracked);

  const rowIdx = getOrAssignRow(normMac);
  // rowFromBottom: SERVER ALIVE is 1, so tracked sensors start at numTracked down to 2
  const rowFromBottom = numTracked - rowIdx + 1;

  const { timestamp, siteName, sensorName, macId, readingSummary, humdVal, battVal, statusTag } = stateObj;
  let readingStr = readingSummary || 'Reading: N/A';
  if (humdVal && humdVal !== 'N/A') readingStr += ` | Hum: ${humdVal}`;
  if (battVal && battVal !== 'N/A') readingStr += ` | Batt: ${battVal}`;

  const stateStr = `🎯 [TRACKED] ${timestamp} | ${padEnd(siteName, 16)} | ${padEnd(sensorName, 24)} | MAC: ${padEnd(macId, 6)} | ${padEnd(readingStr, 24)} | ${statusTag}`;
  writeFixedRow(rowFromBottom, stateStr);
}

/**
 * Records telemetry event to tracking log and updates tracked sensor fixed row.
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
  const normMac = normalizeMac(macId);
  const fileName = `_TRACKING_${formattedMac}`;
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
    sensorDataHex: extractDataHex(parsedValues),
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
      process.stdout.write(`\n[LIVETRACKER] Error writing tracking log for ${formattedMac}: ${err.message}\n`);
      return;
    }

    totalPacketsReceived++;
    const timeStr = new Date().toLocaleTimeString();
    const sensorType = resolvedConfig?.TYPE || '';
    const unitSystem = resolvedConfig?.UNITSYSTEM || '';
    const readingSummary = formatSensorReading(sensorType, unitSystem, parsedValues, evalResult);

    const humdVal = parsedValues?.Humidity ?? parsedValues?.HUMD ?? parsedValues?.humd ?? null;
    const battVal = parsedValues?.BATT ?? parsedValues?.batt ?? null;
    const isAlert = eventRecord.alertEvaluation.isAlertTriggered;
    const statusTag = isAlert ? '⚠️ ALERT' : '✅ NORMAL';
    const nameStr = eventRecord.sensorName !== 'UNKNOWN' ? eventRecord.sensorName : formattedMac;

    // Update cached state
    trackedSensorStates[formattedMac] = {
      timestamp: timeStr,
      portId: portId || 'N/A',
      siteName: siteName || 'N/A',
      sensorName: nameStr,
      macId: formattedMac,
      readingSummary,
      humdVal: humdVal !== null ? `${humdVal}%` : 'N/A',
      battVal: battVal !== null ? `${battVal}%` : 'N/A',
      statusTag,
    };

    lastPacketSummary = `[Port ${portId}] ${siteName} - ${formattedMac} (${readingSummary})`;

    // Always update the in-place row for this tracked sensor
    renderTrackedSensorRow(normMac, trackedSensorStates[formattedMac]);

    if (isAlert) {
      const alertMsg = eventRecord.alertEvaluation.message || 'Threshold Breached';
      printScrollingAlert(`⚠️ [TRACKED ALERT] ${timeStr} | Site: ${siteName} | Sensor: ${nameStr} (${formattedMac}) | ${readingSummary} | ${alertMsg}`);
    }
  });
}

/**
 * Records a messaging dispatch event to tracking log and prints a scrolling alert line.
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
    if (!err) {
      const timeStr = new Date().toLocaleTimeString();
      printScrollingAlert(`📲 [ALERT DISPATCHED] ${timeStr} | Site: ${siteName} | MAC: ${formattedMac} | Gateway: ${gatewayName} | Group: ${alertGroup} | Msg: ${message}`);
    }
  });
}

/**
 * Gated console log for tracked sensor debug output (no-op by default, silent unless explicitly needed).
 */
function trackedLog(sensorId, ...args) {
  // Intentionally silent — tracked sensor state is shown via the fixed row, not via logged lines.
}

module.exports = {
  isSensorTracked,
  trackedLog,
  recordTelemetryEvent,
  recordDispatchEvent,
  getTrackedSensors,
  getSensorConfigFromDataStore,
  renderHeartbeat,
  updateLiveStatus,
  trackedSensorStates,
};
