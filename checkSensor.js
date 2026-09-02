/*
 * CLI Tool to Track Sensor Registration, Telemetry Limits & WhatsApp/Telegram Alerts
 * Usage: node checkSensor.js <siteName> <macId>
 * Example: node checkSensor.js ikn_hospital B0-BC-82-C4-C4-41
 */

const { trackSensor } = require('./lib/tracker');

const siteName = process.argv[2] || 'ikn_hospital';
const macId = process.argv[3] || 'B0-BC-82-C4-C4-41';

console.log(`\n======================================================`);
console.log(` SENSOR DIAGNOSTIC & DISPATCH TRACKER`);
console.log(` Site: ${siteName} | Sensor MAC: ${macId}`);
console.log(`======================================================\n`);

trackSensor(siteName, macId)
  .then((report) => {
    if (report.error) {
      console.error(`❌ ERROR: ${report.error}`);
      process.exit(1);
    }

    console.log(`1. REGISTRATION STATUS:`);
    if (report.isRegistered) {
      console.log(`   ✅ REGISTERED`);
      console.log(`   Name:        ${report.sensorConfig.NAME}`);
      console.log(`   Type:        ${report.sensorConfig.TYPE}`);
      console.log(`   Group:       ${report.sensorConfig.GROUP || 'N/A'}`);
      console.log(`   Alert Group: ${report.sensorConfig.ALERTGROUP || 'N/A'}`);
      console.log(`   Alert Enabled: ${report.sensorConfig.ALERT}`);
      console.log(`   Temp Range:  [${report.sensorConfig.TEMP_MIN ?? 'N/A'}°C to ${report.sensorConfig.TEMP_MAX ?? 'N/A'}°C]`);
    } else {
      console.log(`   ❌ NOT REGISTERED`);
      console.log(`   ${report.message}`);
    }

    console.log(`\n2. TELEMETRY & LIMIT BREACH STATUS:`);
    if (report.latestReading) {
      console.log(`   Latest Reading:`, JSON.stringify(report.latestReading));
    } else {
      console.log(`   No recent raw telemetry logs found for file: _logs/${report.macId}`);
    }

    if (report.hasLimitBreached) {
      console.log(`   ⚠️ LIMIT BREACH DETECTED (${report.limitBreachDetails.length} event(s)):`);
      report.limitBreachDetails.forEach((event, idx) => {
        console.log(`      [${idx + 1}] Time: ${event.timestamp} | Condition: ${event.condition}`);
      });
    } else {
      console.log(`   ✅ No limit breaches in recent logs.`);
    }

    console.log(`\n3. MESSAGING DISPATCH STATUS (WhatsApp / Telegram):`);
    console.log(`   WhatsApp Dispatched: ${report.alertsDispatched.whatsappDispatched ? '✅ YES' : '❌ NO'}`);
    console.log(`   Telegram Dispatched: ${report.alertsDispatched.telegramDispatched ? '✅ YES' : '❌ NO'}`);

    if (report.alertsDispatched.dispatchLogs.length > 0) {
      console.log(`   Dispatch Log Entries (${report.alertsDispatched.dispatchLogs.length}):`);
      report.alertsDispatched.dispatchLogs.forEach((entry, idx) => {
        console.log(`      [${idx + 1}] (${entry.sourceLog}): ${entry.details}`);
      });
    } else {
      console.log(`   No WhatsApp / Telegram dispatch records found for Alert Group: "${report.sensorConfig?.ALERTGROUP || 'N/A'}"`);
    }

    console.log(`\n======================================================\n`);
  })
  .catch((err) => {
    console.error('Fatal error during tracking:', err);
  });
