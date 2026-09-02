/*
 * Sensor Registration, Telemetry & Notification Tracking Utility
 */

const path = require('path');
const _data = require('./data');
const _logs = require('./logs');

/**
 * Tracks status, registration, limit breach history, and messaging dispatch for a sensor.
 * @param {string} siteName - e.g. 'ikn_hospital', 'IKN_HOSPITAL', 'ikn_oproom', 'mre'
 * @param {string} macId - e.g. 'B0-BC-82-C4-C4-41'
 * @returns {Promise<Object>} Diagnostic tracking report
 */
function trackSensor(siteName, macId) {
  return new Promise((resolve) => {
    const formattedSite = siteName.toLowerCase();
    const formattedMac = macId.trim().toUpperCase();

    const report = {
      site: siteName,
      macId: formattedMac,
      isRegistered: false,
      sensorConfig: null,
      latestReading: null,
      hasLimitBreached: false,
      limitBreachDetails: [],
      alertsDispatched: {
        whatsappDispatched: false,
        telegramDispatched: false,
        dispatchLogs: [],
      },
    };

    // 1. Check Registration in settings.json
    _data.read(formattedSite, 'settings', (err, settingsData) => {
      if (err || !settingsData || !settingsData.IOT_SENSORS) {
        report.error = `Could not load settings for site: ${siteName}`;
        return resolve(report);
      }

      const rawSensors = settingsData.IOT_SENSORS;
      const sensorEntry = rawSensors[formattedMac] || rawSensors[formattedMac.replace(/-/g, '')];

      if (!sensorEntry) {
        report.isRegistered = false;
        report.message = `Sensor [${formattedMac}] is NOT registered in site [${siteName}].`;
        return resolve(report);
      }

      report.isRegistered = true;
      const sensorDetail = sensorEntry['1'] || sensorEntry;
      report.sensorConfig = sensorDetail;

      const tempMin = sensorDetail.TEMP_MIN !== undefined && sensorDetail.TEMP_MIN !== '' ? Number(sensorDetail.TEMP_MIN) : null;
      const tempMax = sensorDetail.TEMP_MAX !== undefined && sensorDetail.TEMP_MAX !== '' ? Number(sensorDetail.TEMP_MAX) : null;
      const alertGroup = sensorDetail.ALERTGROUP || '';

      // 2. Read recent raw sensor telemetry logs
      _logs.read(formattedMac, 20, null, null, false, (ok, rawLogs) => {
        if (ok && Array.isArray(rawLogs) && rawLogs.length > 0) {
          report.latestReading = rawLogs[rawLogs.length - 1];

          // Evaluate breaches across recent logs
          rawLogs.forEach((entry) => {
            if (typeof entry === 'object') {
              const temp = Number(entry.Temperature ?? entry.TEMP);
              if (!isNaN(temp)) {
                if (tempMin !== null && temp < tempMin) {
                  report.hasLimitBreached = true;
                  report.limitBreachDetails.push({
                    timestamp: entry.TIMESTAMP || new Date(),
                    reading: temp,
                    condition: `TEMP (${temp}°C) < TEMP_MIN (${tempMin}°C)`,
                  });
                }
                if (tempMax !== null && temp > tempMax) {
                  report.hasLimitBreached = true;
                  report.limitBreachDetails.push({
                    timestamp: entry.TIMESTAMP || new Date(),
                    reading: temp,
                    condition: `TEMP (${temp}°C) > TEMP_MAX (${tempMax}°C)`,
                  });
                }
              }
            }
          });
        }

        // 3. Check WhatsApp & Telegram Dispatch Logs
        const dispatchLogsToCheck = [
          '_WHATSMATE_WHATSAPP28',
          '_WHATSMATE_WHATSAPP30',
          '_WHATSMATE_WHATSAPP1',
          '_WHATSMATE_TELEGRAM10',
          '_WHATSMATE_TELEGRAM12',
        ];

        let checkedCount = 0;
        dispatchLogsToCheck.forEach((logFile) => {
          _logs.read(logFile, 30, null, null, false, (logOk, dispatchEntries) => {
            checkedCount++;
            if (logOk && Array.isArray(dispatchEntries)) {
              dispatchEntries.forEach((logItem) => {
                const logStr = typeof logItem === 'string' ? logItem : JSON.stringify(logItem);
                if (alertGroup && logStr.includes(alertGroup)) {
                  if (logFile.includes('WHATSAPP')) {
                    report.alertsDispatched.whatsappDispatched = true;
                  }
                  if (logFile.includes('TELEGRAM')) {
                    report.alertsDispatched.telegramDispatched = true;
                  }
                  report.alertsDispatched.dispatchLogs.push({
                    sourceLog: logFile,
                    details: logStr,
                  });
                }
              });
            }

            if (checkedCount === dispatchLogsToCheck.length) {
              return resolve(report);
            }
          });
        });
      });
    });
  });
}

module.exports = {
  trackSensor,
};
