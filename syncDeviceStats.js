#!/usr/bin/env node

/**
 * Utility script to synchronize device stats rollup files (<year>.json)
 * with incident records logged in incidents_<year>_<month>.json files.
 *
 * Usage:
 *   node syncDeviceStats.js
 *   node syncDeviceStats.js --site=IKN_OPROOM
 *   node syncDeviceStats.js --year=2026
 *   node syncDeviceStats.js --site=SNOWCITY --year=2026
 */

const path = require('path');
const fileStores = require('./lib/fileStores');

// Parse CLI arguments
const args = process.argv.slice(2);
let site = null;
let year = null;
let showHelp = false;

for (const arg of args) {
  if (arg === '--help' || arg === '-h') {
    showHelp = true;
  } else if (arg.startsWith('--site=')) {
    site = arg.split('=')[1];
  } else if (arg.startsWith('-s=')) {
    site = arg.split('=')[1];
  } else if (arg.startsWith('--year=')) {
    year = arg.split('=')[1];
  } else if (arg.startsWith('-y=')) {
    year = arg.split('=')[1];
  } else if (!arg.startsWith('-')) {
    if (!site) site = arg;
    else if (!year) year = arg;
  }
}

if (showHelp) {
  console.log(`
🔄 Device Stats Incident Sync Utility

Usage:
  node syncDeviceStats.js [options]

Options:
  --site=<siteName>, -s=<siteName>   Specific site to sync (default: all sites)
  --year=<year>, -y=<year>           Specific year to sync (default: all years)
  --help, -h                         Display this help message

Examples:
  node syncDeviceStats.js
  node syncDeviceStats.js --site=IKN_OPROOM
  node syncDeviceStats.js --site=SNOWCITY --year=2026
`);
  process.exit(0);
}

console.log('----------------------------------------------------');
console.log('🔄 STARTING DEVICE STATS INCIDENT SYNC');
console.log(`   Target Site: ${site || 'ALL SITES'}`);
console.log(`   Target Year: ${year || 'ALL YEARS'}`);
console.log('----------------------------------------------------');

const startTime = Date.now();
const result = fileStores.syncDeviceStats(site, year);
const duration = Date.now() - startTime;

if (!result.success) {
  console.error(`❌ Sync Failed: ${result.error}`);
  process.exit(1);
}

console.log('\n📊 SYNC SUMMARY:');
console.log(`   Sites Processed : ${result.sitesProcessed.join(', ') || 'None'}`);
console.log(`   Devices Updated : ${result.totalDevicesUpdated}`);
console.log(`   Incidents Synced: ${result.totalIncidentsSynced}`);
console.log(`   Execution Time  : ${duration} ms\n`);

if (result.details && result.details.length > 0) {
  console.log('📋 DEVICE DETAILS:');
  result.details.forEach(d => {
    console.log(`   [${d.site}] Device: ${d.macId.padEnd(20)} Year: ${d.year} => Breaches: ${d.limitBreaches} (Incidents: ${d.incidentsCount})`);
  });
} else {
  console.log('   No device files needed updating.');
}

console.log('----------------------------------------------------');
console.log('✅ DEVICE STATS INCIDENT SYNC COMPLETE');
console.log('----------------------------------------------------');
