/*
 * Library for storing and rotating logs
 *
 */

// Dependencies
const { check } = require('express-validator');
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var helpers = require('./helpers');
var { parse } = require('date-fns');
const lodash = require('lodash');

// Container for module (to be exported)
var lib = {};';'

// Base directory of data folder
lib.baseDir = path.join(__dirname,'/../.logs/');

function hasWhiteSpace(s) {
  return (/\s/).test(s);
}

// ----------
// FORMATTING
// ----------
const formatDate = (date) => {
  let d = new Date(date);
  let month = (d.getMonth() + 1).toString();
  let day = d.getDate().toString();
  let year = d.getFullYear()% 100;
  if (month.length < 2) {
    month = '0' + month;
  }
  if (day.length < 2) {
    day = '0' + day;
  }
  return [day, month, year].join('/');
}
const isNotDate = (date) => {
  if (!date) return false;
  return !(date instanceof Date) || isNaN(date.getTime());
}

// Append a string to a file. Create the file if it does not exist
lib.append = function(file, str, callback) {
  try {
    // Open the file for appending
    let _filePathName = lib.baseDir + file + '.log'
    let _WhiteSpace = hasWhiteSpace(_filePathName)
    // --------------
    if (!_WhiteSpace) {
      fs.open(lib.baseDir + file + '.log', 'a', function(err, fileDescriptor) {
        if (!err && fileDescriptor) {
          // Append to file and close it
          fs.appendFile(fileDescriptor, str + '\n', function(err) {
            if (!err) {
              fs.close(fileDescriptor, function(err) {
                if (!err) {
                  callback(false);
                  return;
                } else {
                  callback('Error closing file that was being appended');
                  return;
                }
              });
            } else {
              lib.append('ERROR', `ERROR APPEND FILE [${lib.baseDir + file + '.log'}]`, () => { });
              callback('Error appending to file');
              return;
            }
          });
        } else {
          callback('Could open file for appending');
          return;
        }
      });
    } else {
      callback(`LOGS.JS >> LIB.APPEND .. WHITESPACE IN IN FILEPATHNAME ${_filePathName}`);
      return;
    }
  } catch (err) {
    console.error(err);
    callback('Error appending to file: ' + err.message);
    return;
  }
};

// List all the logs, and optionally include the compressed logs
lib.list = function(includeCompressedLogs,callback){
  // -------------
  let _filePathName = lib.baseDir;
  let _WhiteSpace = hasWhiteSpace(_filePathName)
  // --------------
  if (!_WhiteSpace) {
    fs.readdir(lib.baseDir, function(err,data){
      // ---------------------------------
      if(!err && data && data.length > 0) {
        var trimmedFileNames = [];
        data.forEach(function(fileName){
          // Add the .log files
          if(fileName.indexOf('.log') > -1){
            trimmedFileNames.push(fileName.replace('.log',''));
          }
          // Add the .gz files
          if(fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs){
            trimmedFileNames.push(fileName.replace('.gz.b64',''));
          }
        });
        callback(false,trimmedFileNames);
        return;
      } else {
        callback(err,data);
        return;
      }
    });
  } else {
    callback(`LOGS.JS >> LIB.LIST .. WHITESPACE IN IN FILEPATHNAME ${_filePathName}`);
    return;
  }
};

// --------
// Read data from a file
lib.read = function(file, nLINES, date0, date1, debugMODE, callback) {
  // Constants and configuration
  const MAX_DAYS_SPAN = 100;
  const DEFAULT_LINES = 2000;
  const DAY_IN_MS = 24 * 60 * 60 * 1000;

  // Validate and normalize input file path
  const _filePathName = `${lib.baseDir}/${file}.log`;
  if (hasWhiteSpace(_filePathName)) {
    return callback(`LOGS.JS >> LIB.READ >> Whitespace in filepath: ${_filePathName}`);
  }

  // Process and validate date parameters
  const { startDate, endDate } = processDateRange(date0, date1);  

  // Read and process the log file
  fs.readFile(_filePathName, 'utf8', (err, data) => {
    if (err) {
      return callback(false, []);
    }

    const dataObjects = processLogData(data, file, nLINES, startDate, endDate, debugMODE);
    const lastNLines = lodash.takeRight(dataObjects,nLINES);
    
    logDebugInfo(file, nLINES, startDate, endDate, lastNLines, debugMODE);
    callback(true, lastNLines);
  });

  // Debug logging

  // Helper functions
  function processDateRange(date0, date1) {
    const hasDateRange = Boolean(date0 && date1);
  
    let startDate = hasDateRange ? new Date(date0) : null;
    let endDate   = hasDateRange ? new Date(date1) : null;
  
    if (hasDateRange) {
      const timeSpan = endDate.getTime() - startDate.getTime();
      const lapsedDays = timeSpan / DAY_IN_MS;
  
      if (lapsedDays > MAX_DAYS_SPAN || lapsedDays <= 0) {
        startDate = new Date(endDate.getTime() - DAY_IN_MS);
      }
    }
  
    return { startDate, endDate, hasDateRange };
  }

  function processLogData(data, file, nLINES, startDate, endDate, hasDateRange, debugMODE) {
    if (!data) return [];
  
    const lines = data.split(/\r?\n/);
    const lineLimit = nLINES > -1 ? nLINES : DEFAULT_LINES;
    const dataObjects = [];
  
    if (hasDateRange) {
      for (const line of lines) {
        const objItem = helpers.parseJsonToObject(line, file, 'log.js');
        if (!objItem) continue;
  
        const logDate = new Date(objItem.TIMESTAMP);
        if (logDate >= startDate && logDate <= endDate) {
          dataObjects.push(objItem);
        }
      }
    } else {
      for (let i = Math.max(0, lines.length - lineLimit); i < lines.length; i++) {
        const objItem = helpers.parseJsonToObject(lines[i], file, 'logs.js');
        if (objItem) dataObjects.push(objItem);
      }
    }
  
    return dataObjects;
  }
  function logDebugInfo(file, nTotalLines, startDate, endDate, dataObjects, debugMODE) {
    if (!debugMODE) return;
    
    console.log(`[${'LOGS.JS'.blue}] File: ${file.yellow}`);
    console.log(`  Date range: ${formatDate(startDate).cyan} to ${formatDate(endDate).cyan}`);
    const timeSpan = endDate.getTime() - startDate.getTime();
    console.log(`  TOTAL LINES: ${nTotalLines}`);
    console.log(`  Timespan: ${(timeSpan / DAY_IN_MS).toFixed(1)} days`);
    console.log(dataObjects[0],dataObjects.length,dataObjects[dataObjects.length-1]);
  }
  function logProcessingStats(file, totalLines, filteredCount, startDate, endDate) {
    console.log(`[${'LOGS.JS'.blue}] [${file.green}] ` +
      `Date range: [${formatDate(startDate).yellow}] - [${formatDate(endDate).yellow}] ` +
      `Total: ${totalLines} Filtered: ${filteredCount.toString().red}`);
  }
};

// Delete a file
lib.delete = function(file,callback){
  // -----------------------------------------
  if (file === null ) {
    callback("FILE OR DIRECTORY NOT DEFINED");
    return;
  }
  // -----------------------------------------  let _filePathName = lib.baseDir+dir+'/'+file+'.json'
  let _filePathName = lib.baseDir + file + '.log'
  let _WhiteSpace = hasWhiteSpace(_filePathName)
  // --------
  if (!_WhiteSpace) {
    console.log(`.[${'DATA.JS'.yellow}] ..LIB.DELETE <` + _WhiteSpace.toString().toUpperCase().red + '> ..'+ _filePathName.green + '..');
    // Unlink the file from the filesystem
    fs.unlink(lib.baseDir + file + '.log', function(err){
      callback(err);
      return;
    });    
  } else {
    callback(`LOGS.JS >> LIB.DELETE .. WHITESPACE IN IN FILEPATHNAME ${_filePathName}`);
    return;
  }
};

lib.readLastRecord = function(file,callback){
  // ----------------------------------------
  let _filePathName = lib.baseDir + '/' + file + '.log'
  let _WhiteSpace = hasWhiteSpace(_filePathName)
  // -------------
  if (!_WhiteSpace) {
    fs.readFile(lib.baseDir+'/'+file+'.log', 'utf8', function(err,data) {
      var dataObjects = [];
      if (data) {
        var datas = data.split(/\r?\n/);
        let parsedData = helpers.parseJsonToObject(datas[datas.length-2],file,'logs.js');
        dataObjects.push(parsedData);
      }
      if(!err && dataObjects){
        callback(true,dataObjects);
        return;
      } else {
        callback(err,dataObjects);
        return;
      }
    });
  } else {
    callback(`LOGS.JS >> LIB.READLASTRECORD .. WHITESPACE IN IN FILEPATHNAME ${_filePathName}`);
    return;
  }
}

// Compress the contents of one .log file into a .gz.b64 file within the same directory
lib.compress = function(logId,newFileId,callback){
  var sourceFile = logId+'.log';
  var destFile = newFileId+'.gz.b64';
  // Read the source file
  fs.readFile(lib.baseDir+sourceFile, 'utf8', function(err,inputString){
    if(!err && inputString){
      // Compress the data using gzip
      zlib.gzip(inputString,function(err,buffer){
        if(!err && buffer){
          // Send the data to the destination file
          fs.open(lib.baseDir+destFile, 'wx', function(err, fileDescriptor){
            if(!err && fileDescriptor){
              // Write to the destination file
              fs.writeFile(fileDescriptor, buffer.toString('base64'),function(err){
                if(!err){
                  // Close the destination file
                  fs.close(fileDescriptor,function(err){
                    if(!err){
                      callback(false);
                      return;
                    } else {
                      callback(err);
                      return;
                    }
                  });
                } else {
                  callback(err);
                  return;
                }
              });
            } else {
              callback(err);
              return;
            }
          });
        } else {
          callback(err);
          return;
        }
      });

    } else {
      callback(err);
      return;
    }
  });
};

// Decompress the contents of a .gz file into a string variable
lib.decompress = function(fileId,callback){
  var fileName = fileId+'.gz.b64';
  fs.readFile(lib.baseDir+fileName, 'utf8', function(err,str){
    if(!err && str){
      // Inflate the data
      var inputBuffer = Buffer.from(str, 'base64');
      zlib.unzip(inputBuffer,function(err,outputBuffer){
        if(!err && outputBuffer){
          // Callback
          var str = outputBuffer.toString();
          callback(false,str);
          return;
        } else {
          callback(err);
          return;
        }
      });
    } else {
      callback(err);
      return;
    }
  });
};

// Truncate a log file
lib.truncate = function(logId,callback){
  const fileDescriptor = fs.openSync(lib.baseDir+logId+'.log', 'r+');
  fs.ftruncate(fileDescriptor, function(err){
    if(!err){
      callback(false);
      return;
    } else {
      callback(err);
      return;
    }
  });
};

// Export the module
module.exports = lib;
