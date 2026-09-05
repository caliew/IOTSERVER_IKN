/*
 * CLI Retesting Tool for Open Port Raw Buffers
 * Usage:
 *   node retestRawBuffers.js [portId]
 * Examples:
 *   node retestRawBuffers.js         # Lists all captured raw buffers across open ports
 *   node retestRawBuffers.js 1008    # Retests saved raw buffers for port 1008
 */

const rawBufferRecorder = require('./lib/rawBufferRecorder');

const args = process.argv.slice(2);
const targetPort = args[0] ? Number(args[0]) : null;

console.log('====================================================');
console.log('         RAW PORT BUFFER RETESTING TOOL             ');
console.log('====================================================\n');

rawBufferRecorder.getBuffers(targetPort, (err, data) => {
  if (err) {
    console.error('Error fetching raw buffers:', err);
    process.exit(1);
  }

  if (targetPort) {
    const records = Array.isArray(data) ? data : [];
    console.log(`Port ${targetPort} - Found ${records.length} saved raw buffer records:\n`);
    records.forEach((rec, i) => {
      console.log(`--- [Record #${rec.index || i + 1}] ${rec.timestamp} | Site: ${rec.siteName} | Length: ${rec.length} ---`);
      console.log(`RAW BUFFER: ${rec.rawBuffer}`);

      rawBufferRecorder.retestBuffer(
        { portId: rec.port, buffer: rec.rawBuffer, siteName: rec.siteName },
        (retestErr, result) => {
          if (retestErr) {
            console.log(`Decoding Status: Error (${retestErr})`);
          } else {
            console.log(`Decoder Used:   ${result.decoderUsed}`);
            console.log(`Status Code:    ${result.statusCode}`);
            console.log(`Decoded Object:`, JSON.stringify(result.decodedPayload));
          }
          console.log('\n');
        }
      );
    });
  } else {
    console.log('Open Ports with Recorded Raw Buffers:\n');
    const portKeys = Object.keys(data || {});
    if (portKeys.length === 0) {
      console.log('No raw buffers recorded yet. Start the server and receive TCP telemetry to capture buffers.');
    } else {
      portKeys.forEach((p) => {
        const count = Array.isArray(data[p]) ? data[p].length : 0;
        const lastRec = count > 0 ? data[p][count - 1] : null;
        console.log(`  - Port ${p.padEnd(6, ' ')} : ${String(count).padStart(2, ' ')} packets stored | Last Rx: ${lastRec ? lastRec.timeLabel : 'N/A'} (${lastRec ? lastRec.siteName : ''})`);
      });
      console.log('\nTo retest a port, run: node retestRawBuffers.js <portId>');
    }
  }
});
