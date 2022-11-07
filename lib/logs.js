/*
 * Library for storing and rotating logs
 *
 */

// Dependencies
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var helpers = require('./helpers');

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
  let year = d.getFullYear();
  if (month.length < 2) {
    month = '0' + month;
  }
  if (day.length < 2) {
    day = '0' + day;
  }
  return [year, month, day].join('-');
}

// Append a string to a file. Create the file if it does not exist
lib.append = function(file,str,callback){
  // ---------------------------
  // Open the file for appending
  let _filePathName = lib.baseDir + file + '.log'
  let _WhiteSpace = hasWhiteSpace(_filePathName)
  // --------------
  if (!_WhiteSpace) {
    fs.open(lib.baseDir + file + '.log', 'a', function(err, fileDescriptor){
      if(!err && fileDescriptor){
        // Append to file and close it
        fs.appendFile(fileDescriptor, str+'\n',function(err){
          if(!err){
            fs.close(fileDescriptor,function(err){
              if(!err){
                callback(false);
                return;
              } else {
                callback('Error closing file that was being appended');
                return;
              }
            });
          } else {
            lib.append('ERROR',`ERROR APPEND FILE [${lib.baseDir+file+'.log'}]`,()=>{});
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

// Read data from a file
lib.read = function(file,nLINES,date0,date1,debugMODE,callback){
  // -------------------------------
  let _filePathName = lib.baseDir + file + '.log'
  let _WhiteSpace = hasWhiteSpace(_filePathName);
  debugMODE && console.log(`[${"LOGS.JS".green}].. ${file.toString().yellow}....<${String(_WhiteSpace).red}>...<${String(date0).green}>..<${String(date1).blue}>`);
  // ----------------
  if (!_WhiteSpace) {
    fs.readFile(lib.baseDir+'/'+file+'.log', 'utf8', function(err,data){
      // ------------------
      let dataObjects = [];
      let checkDate0 = date0 ? date0 : new Date();    
      let checkDate1 = date1 ? date1 : new Date();
      debugMODE && console.log(`[${"LOGS.JS".green}].. ${checkDate0}.${checkDate1}...<${String(data.length).yellow}>`);
      // -------------------
      if (data) {
        var datas = data.split(/\r?\n/);
        //  -----------------------------
        //  ABSTRACT MAX 88 LINES OF DATA
        //  -----------------------------
        let totalCount = nLINES > -1 ? nLINES : 99999;
        // ---------------
        let _filtered = datas.filter(item => {
          let objItem = helpers.parseJsonToObject(item,file);
          if (objItem) {
            let _dateTime = new Date(objItem.TIMESTAMP);
            let _checkFlag = (_dateTime.getTime() >= new Date(checkDate0).getTime() && _dateTime.getTime() <= new Date(checkDate1).getTime());
            if (_checkFlag) dataObjects.push(objItem);
            return _checkFlag;
          }
          return false;
        })
        // _filtered && console.log(`..${file}...[${nLINES}]..${formatDate(checkDate0)}||${formatDate(checkDate1)}..${datas.length}....${dataObjects.length}`);
        if (datas.length < totalCount) totalCount = datas.length;
        if (date0 === null && date1 === null) {
          for (var i=0; i <= totalCount; i++){
            let _check = false;
            let parsedData
            try {
              if (datas[datas.length-i-1])  parsedData = helpers.parseJsonToObject(datas[datas.length-i-1],file);
              // ----------------------------------------
              if (parsedData) dataObjects.push(parsedData);
            } catch (err) {
              console.log('LOG.JS...',err)
            }
          }
        }
      }
      // ------
      if (err) {
        // console.log(`[${"LOGS.JS".green}].. ReadFile <${file.yellow}> ...<${err}><${dataObjects.length}>`)
        callback(false,dataObjects);
        return;
      }
      // ---------------------
      if(!err && dataObjects){
        try {
          callback(true,dataObjects);
          return;
        } catch (err) {
        }
      }
    });
  } else {
    callback(`LOGS.JS >> LIB.READ .. WHITESPACE IN IN FILEPATHNAME ${_filePathName}`);
    return;
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
      // console.log(`...[LOGS.JS].. ReadFile ${lib.baseDir+'/'+file+'.log'} ...`)
      var dataObjects = [];
      if (data) {
        var datas = data.split(/\r?\n/);
        let parsedData = helpers.parseJsonToObject(datas[datas.length-2],file);
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
