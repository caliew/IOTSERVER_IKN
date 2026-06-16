/*
 * CRC16 Modbus — Native Implementation
 *
 * Replaces the unsupported `node-crc16` npm package.
 * Computes CRC16 using the Modbus polynomial (0xA001).
 * Returns a 2-byte little-endian checksum as an uppercase hex string.
 *
 * Usage:
 *   const crc16 = require('./crc16');
 *   const checksum = crc16.checkSum('0103006C0027'); // e.g. "A5C1"
 *
 * Drop-in replacement for: crc16.checkSum(hexStr).toUpperCase()
 */

/**
 * Compute CRC16-Modbus of a hex string.
 * @param {string} hexStr - Uppercase hex string (e.g. '0A030003000C')
 * @returns {string} 2-byte CRC as uppercase hex, little-endian (low byte first)
 */
function checkSum(hexStr) {
  // Convert hex string to byte buffer
  const buf = Buffer.from(hexStr, 'hex');
  let crc = 0xFFFF;

  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 0x0001) {
        crc = (crc >> 1) ^ 0xA001;
      } else {
        crc >>= 1;
      }
    }
  }

  // Return little-endian (low byte first), uppercase hex
  const lo = (crc & 0xFF).toString(16).padStart(2, '0').toUpperCase();
  const hi = ((crc >> 8) & 0xFF).toString(16).padStart(2, '0').toUpperCase();
  return lo + hi;
}

module.exports = { checkSum };
