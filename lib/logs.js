/*
 * Library for storing and rotating logs
 * REFACTORED: Streaming, async/await, 50MB+ file support
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const readline = require('readline');
const { pipeline } = require('stream');
const helpers = require('./helpers');

// Container for module
const lib = {};

// Base directory
lib.baseDir = path.join(__dirname, '/../.logs/');

// ==================
// UTILITY FUNCTIONS
// ==================

/**
 * Check for whitespace in path (security check)
 */
function hasWhiteSpace(s) {
  return /\s/.test(s);
}

/**
 * Validate file name - prevent directory traversal
 */
function validateFileName(file) {
  if (!file || typeof file !== 'string') {
    return { valid: false, error: 'Invalid file name type' };
  }
  if (file.includes('..') || file.includes('/') || file.includes('\\')) {
    return { valid: false, error: 'Path traversal detected' };
  }
  if (hasWhiteSpace(file)) {
    return { valid: false, error: 'Whitespace in file name' };
  }
  return { valid: true };
}

/**
 * Format date for logging
 */
const formatDate = (date) => {
  const d = new Date(date);
  let month = (d.getMonth() + 1).toString();
  let day = d.getDate().toString();
  const year = d.getFullYear();
  
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  
  return [year, month, day].join('-');
};

// ==================
// CORE FUNCTIONS
// ==================

/**
 * Append a string to a log file
 * @param {string} file - File name (without extension)
 * @param {string} str - Data to append
 * @param {function} callback - Callback(err)
 */
lib.append = function(file, str, callback) {
  const validation = validateFileName(file);
  if (!validation.valid) {
    return callback(validation.error);
  }

  const filePath = path.join(lib.baseDir, file + '.log');
  
  // Ensure directory exists
  fs.mkdir(lib.baseDir, { recursive: true }, (err) => {
    if (err) return callback('Error creating directory: ' + err.message);
    
    // Append with safe flags
    fs.appendFile(filePath, str + '\n', 'utf8', (err) => {
      if (err) {
        lib.append('ERROR', `APPEND FAILED: ${filePath} - ${err.message}`, () => {});
        return callback('Error appending to file: ' + err.message);
      }
      callback(false);
    });
  });
};

/**
 * Read data from a file with streaming support
 * @param {string} file - File name
 * @param {number} nLINES - Number of lines to read (last N lines)
 * @param {Date} date0 - Start date filter
 * @param {Date} date1 - End date filter
 * @param {boolean} debugMODE - Debug logging
 * @param {function} callback - Callback(success, dataObjects)
 */
lib.read = function(file, nLINES, date0, date1, debugMODE, callback) {
  const validation = validateFileName(file);
  if (!validation.valid) {
    return callback(validation.error, []);
  }

  const filePath = path.join(lib.baseDir, file + '.log');
  
  debugMODE && console.log(
    `[${'LOGS.JS'.green}] Reading: ${file.yellow} | ` +
    `Lines: ${nLINES} | Date: ${formatDate(date0)} to ${formatDate(date1)}`
  );

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return callback(false, []);
    }

    // Determine read strategy
    if (date0 === null && date1 === null) {
      // Read last N lines (most common case)
      readLastNLines(filePath, nLINES, debugMODE, callback);
    } else {
      // Read with date range filtering
      readWithDateFilter(filePath, date0, date1, debugMODE, callback);
    }
  });
};

/**
 * Read last N lines from file without loading entire file
 * Uses reverse reading for efficiency
 */
function readLastNLines(filePath, nLines, debugMODE, callback) {
  const maxLines = nLines > 0 ? nLines : 999999;
  const dataObjects = [];
  
  fs.stat(filePath, (err, stats) => {
    if (err) return callback(false, []);
    
    const fileSize = stats.size;
    const CHUNK_SIZE = 64 * 1024; // 64KB chunks
    
    // For small files, just read normally
    if (fileSize < CHUNK_SIZE * 2) {
      readNormalFile(filePath, maxLines, debugMODE, callback);
      return;
    }

    // For large files, read in reverse chunks
    readFileReverse(filePath, fileSize, CHUNK_SIZE, maxLines, debugMODE, callback);
  });
}

/**
 * Normal file read (for small files)
 */
function readNormalFile(filePath, maxLines, debugMODE, callback) {
  const dataObjects = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  const lines = [];
  
  rl.on('line', (line) => {
    lines.push(line);
  });

  rl.on('close', () => {
    // Get last N lines
    const start = Math.max(0, lines.length - maxLines);
    for (let i = start; i < lines.length; i++) {
      const parsed = helpers.parseJsonToObject(lines[i], path.basename(filePath));
      if (parsed) dataObjects.push(parsed);
    }
    
    debugMODE && console.log(`[${'LOGS.JS'.green}] Read ${dataObjects.length} lines`);
    callback(true, dataObjects);
  });

  rl.on('error', (err) => {
    debugMODE && console.log(`[${'LOGS.JS'.red}] Read error: ${err.message}`);
    callback(false, []);
  });
}

/**
 * Reverse file read for large files
 */
function readFileReverse(filePath, fileSize, chunkSize, maxLines, debugMODE, callback) {
  const dataObjects = [];
  let buffer = Buffer.alloc(chunkSize);
  let lineBuffer = '';
  let position = fileSize;
  let fd;

  fs.open(filePath, 'r', (err, fileDescriptor) => {
    if (err) return callback(false, []);
    fd = fileDescriptor;
    readNextChunk();
  });

  function readNextChunk() {
    if (dataObjects.length >= maxLines || position <= 0) {
      fs.close(fd, () => {
        callback(true, dataObjects);
      });
      return;
    }

    const bytesToRead = Math.min(chunkSize, position);
    position -= bytesToRead;

    fs.read(fd, buffer, 0, bytesToRead, position, (err, bytesRead) => {
      if (err) {
        fs.close(fd, () => callback(false, dataObjects));
        return;
      }

      const chunk = buffer.toString('utf8', 0, bytesRead);
      lineBuffer = chunk + lineBuffer;
      const lines = lineBuffer.split('\n');
      lineBuffer = lines[0]; // Keep incomplete line

      // Process lines in reverse
      for (let i = lines.length - 1; i > 0; i--) {
        if (dataObjects.length >= maxLines) break;
        
        const parsed = helpers.parseJsonToObject(lines[i], path.basename(filePath));
        if (parsed) dataObjects.unshift(parsed);
      }

      readNextChunk();
    });
  }
}

/**
 * Read with date range filtering using streams
 */
function readWithDateFilter(filePath, date0, date1, debugMODE, callback) {
  const dataObjects = [];
  const checkDate0 = new Date(date0);
  const checkDate1 = new Date(date1);

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  rl.on('line', (line) => {
    const parsed = helpers.parseJsonToObject(line, path.basename(filePath));
    
    if (parsed && parsed.TIMESTAMP) {
      const lineDate = new Date(parsed.TIMESTAMP);
      if (lineDate >= checkDate0 && lineDate <= checkDate1) {
        dataObjects.push(parsed);
      }
    }
  });

  rl.on('close', () => {
    debugMODE && console.log(`[${'LOGS.JS'.green}] Filtered ${dataObjects.length} records by date`);
    callback(true, dataObjects);
  });

  rl.on('error', (err) => {
    debugMODE && console.log(`[${'LOGS.JS'.red}] Filter error: ${err.message}`);
    callback(false, []);
  });
}

/**
 * Read the last record from file
 */
lib.readLastRecord = function(file, callback) {
  const validation = validateFileName(file);
  if (!validation.valid) {
    return callback(validation.error, []);
  }

  const filePath = path.join(lib.baseDir, file + '.log');
  
  fs.stat(filePath, (err, stats) => {
    if (err) return callback(err, []);

    // Read last 4KB chunk (usually contains last record)
    const chunkSize = 4096;
    const position = Math.max(0, stats.size - chunkSize);
    const buffer = Buffer.alloc(chunkSize);

    fs.open(filePath, 'r', (err, fd) => {
      if (err) return callback(err, []);

      fs.read(fd, buffer, 0, chunkSize, position, (err, bytesRead) => {
        fs.close(fd, () => {
          if (err) return callback(err, []);

          const data = buffer.toString('utf8', 0, bytesRead);
          const lines = data.split(/\r?\n/).filter(line => line.trim());
          const lastLine = lines[lines.length - 1];
          
          const parsed = helpers.parseJsonToObject(lastLine, file);
          callback(false, parsed ? [parsed] : []);
        });
      });
    });
  });
};

/**
 * List all log files
 */
lib.list = function(includeCompressedLogs, callback) {
  const validation = validateFileName('');
  
  fs.readdir(lib.baseDir, (err, files) => {
    if (err) {
      return callback(err, []);
    }

    const trimmedFileNames = [];
    
    files.forEach((fileName) => {
      if (fileName.endsWith('.log')) {
        trimmedFileNames.push(fileName.replace('.log', ''));
      }
      if (fileName.endsWith('.gz.b64') && includeCompressedLogs) {
        trimmedFileNames.push(fileName.replace('.gz.b64', ''));
      }
    });

    callback(false, trimmedFileNames);
  });
};

/**
 * Compress a log file using streams (memory efficient for large files)
 */
lib.compress = function(logId, newFileId, callback) {
  const validation1 = validateFileName(logId);
  const validation2 = validateFileName(newFileId);
  
  if (!validation1.valid || !validation2.valid) {
    return callback('Invalid file names');
  }

  const sourceFile = path.join(lib.baseDir, logId + '.log');
  const destFile = path.join(lib.baseDir, newFileId + '.gz.b64');

  const gzip = zlib.createGzip();
  const source = fs.createReadStream(sourceFile);
  const dest = fs.createWriteStream(destFile);

  // Convert to base64 stream
  const base64Transform = new (require('stream').Transform)({
    transform(chunk, encoding, callback) {
      this.push(chunk.toString('base64'));
      callback();
    }
  });

  pipeline(
    source,
    gzip,
    base64Transform,
    dest,
    (err) => {
      if (err) {
        return callback('Compression error: ' + err.message);
      }
      callback(false);
    }
  );
};

/**
 * Decompress a compressed log file
 */
lib.decompress = function(fileId, callback) {
  const validation = validateFileName(fileId);
  if (!validation.valid) {
    return callback(validation.error);
  }

  const fileName = path.join(lib.baseDir, fileId + '.gz.b64');
  
  const source = fs.createReadStream(fileName, { encoding: 'utf8' });
  const unzip = zlib.createUnzip();
  let output = '';

  source.pipe(unzip)
    .on('data', (chunk) => {
      output += chunk.toString();
    })
    .on('end', () => {
      callback(false, output);
    })
    .on('error', (err) => {
      callback('Decompression error: ' + err.message);
    });
};

/**
 * Delete a log file
 */
lib.delete = function(file, callback) {
  const validation = validateFileName(file);
  if (!validation.valid) {
    return callback(validation.error);
  }

  const filePath = path.join(lib.baseDir, file + '.log');
  
  fs.unlink(filePath, (err) => {
    if (err) {
      return callback('Delete error: ' + err.message);
    }
    callback(false);
  });
};

/**
 * Truncate a log file
 */
lib.truncate = function(logId, callback) {
  const validation = validateFileName(logId);
  if (!validation.valid) {
    return callback(validation.error);
  }

  const filePath = path.join(lib.baseDir, logId + '.log');
  
  fs.truncate(filePath, (err) => {
    if (err) {
      return callback('Truncate error: ' + err.message);
    }
    callback(false);
  });
};

// Export the module
module.exports = lib;