/*
 * Library for storing and editing data
 */

// Dependencies
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

// Container for module (to be exported)
var lib = {};

function hasWhiteSpace(s) {
  return (/\s/).test(s);
}
function hasNull(s) {
  // /\$\d+/g
  let pattern = /\x04/;
  let _Flag1 = s.match(/\x00/i) === null ? false:true
  let _Flag2 = s.match(/\x04/i) === null ? false:true
  return _Flag1 || _Flag2;
}
function hasHexCharactor(s) {
  return (/\x04/).test(s);
}

// Base directory of data folder
lib.baseDir = path.join(__dirname,'/../.data/');

// Write data to a file
lib.create = function(dir,file,data,callback){  
  // ---------------------------------------
  if (dir === null | file === null ) {
    callback("FILE OR DIRECTORY NOT DEFINED");
    return;
  }
  // -------------
  let _filePathName = lib.baseDir+dir+'/'+file+'.json';
  let _WhiteSpace = hasWhiteSpace(_filePathName);
  let _Isnull = hasNull(_filePathName);
  if (_Isnull) {
    callback(`.[${"DATA.JS".yellow}] ..${"LIB.CREATE".red}.. NULL <${_Isnull}> IN FILEPATHNAME ${_filePathName}`);
    return;
  }
  // ---------------------------------------
  if (!_WhiteSpace) {
    // ------
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'w+', function(err, fileDescriptor){
      // ------------------------
      if(!err && fileDescriptor){
        // Convert data to string
        var stringData = JSON.stringify(data);
        // Write to file and close it
        fs.writeFile(fileDescriptor, stringData,function(err){
          if(!err){
            fs.close(fileDescriptor,function(err){
              // -------
              if(!err){
                callback(false);
                return;
              } else {
                callback('Error closing new file');
                return;
              }
            });
          } else {
            console.log('[DATA.JS].. LIB.CREATE ..Error writing to new file'.yellow,dir)
            callback('Error writing to new file');
            return;
          }
        });
      } else {
        callback('Could not create new file, it may already exist');
        return;
      }
    });
  } else {
    console.log(`[${"DATA.JS".yellow}] ..${"LIB.CREATE".red}.. WHITESPACE IN IN FILEPATHNAME ${_filePathName}`);
  }
};

// Append a string to a file. Create the file if it does not exist
lib.append = function(dir,file,str,callback){
  // ----------------------------------------
  if (dir === null | file === null ) callback("FILE OR DIRECTORY NOT DEFINED")
  // -------------
  let _filePathName = lib.baseDir+dir+'/'+file+'.json'
  let _WhiteSpace = hasWhiteSpace(_filePathName)
  let _Isnull = hasNull(_filePathName);
  if (_Isnull) {
    callback(`[${DATA.JS.yellow}] ..${"LIB.APPEND".red}.. NULL IN FILEPATHNAME ${_filePathName}`);
    retrun;
  }
  console.log('.[DATA.JS]..  LIB.APPEND ..<%s/%s>'.yellow,dir.toUpperCase().white,file.toUpperCase().green)
  // ---------------------------
  // Open the file for appending
  // ---------------------------
  if (!_WhiteSpace) {
    // -----
    fs.open(lib.baseDir+file+'.json', 'a', function(err, fileDescriptor){
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
            lib.append('ERROR',`ERROR APPEND FILE [${lib.baseDir+file+'..json'}]`,()=>{});
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
    callback(`[${DATA.JS.yellow}] ..${"LIB.APPEND".red}.. WHITESPACE IN IN FILEPATHNAME ${_filePathName}`);
    return;
  }
};

// Read data from a file
lib.read = function(dir,file,callback){
  // -----------------------------------------
  let _filePathName = lib.baseDir+dir+'/'+file+'.json'
  let _WhiteSpace = hasWhiteSpace(_filePathName)
  let _Isnull = hasNull(_filePathName);
  // ----------------------------------
  if (dir === null | file === null ) {
    callback("FILE OR DIRECTORY NOT DEFINED")
    return;
  }
  // -------------
  if (_Isnull) {
    callback(`[${"DATA.JS".yellow}] ..${"LIB.READ".red}.. NULL IN FILEPATHNAME ${_filePathName}`);
    return;
  }
  // console.log('.[DATA.JS]..  LIB.READ  ..<%s/%s>'.yellow,dir.toUpperCase().white,file.toUpperCase().green)
  // -----------------------------------------
  if (!_WhiteSpace) {
    // -----
    fs.readFile(_filePathName, 'utf8', function(err,data){
      // --------------
      if(!err && data){
        let parsedData = {};
        try{
          // --------------
          parsedData = helpers.parseJsonToObject(data);
          // console.log(`[${'DATA.JS'.yellow}] ..FILENAME=<${_filePathName.yellow}>.. DATA SIZE=<${parsedData.length}>`)
          callback(false,parsedData);
          return;
          // ------------------------
        } catch (err){
          console.log(`[${'DATA.JS'.yellow}] ..FILENAME=<${_filePathName.yellow}>.. ERROR <${String(err).red}> `)
          callback(true,data);
          return;
        }
      } else {
        callback(true,data);
        return;
      }
    });
  } else {
    // callback(`[${DATA.JS.yellow}] ..${"LIB.READ".red}.. WHITESPACE IN IN FILEPATHNAME ${_filePathName}`);
    return;
  }
};

// Update data in a file
lib.update = function(dir,file,data,callback){
  // -----------------------------------------
  if (dir === null | file === null ) {
    callback("FILE OR DIRECTORY NOT DEFINED")
    return;
  }
  // ---------------
  let _filePathName = lib.baseDir + dir + '/' + file +'.json'
  let _WhiteSpace = hasWhiteSpace(_filePathName)
  let _Isnull = hasNull(_filePathName);
  if (_Isnull) {
    callback(`[${"DATA.JS".yellow}] ..${"LIB.UPDATE".red}.. NULL IN FILEPATHNAME ${_filePathName}`);
    return;
  }
  // console.log(`.[${"DATA.JS".red}]..  LIB.UPDATE..<${dir.toUpperCase().yellow}> FILE=<${file.toUpperCase().green}>`);
  // -----
  // Open the file for writing
  // -------------------------
  if (!_WhiteSpace) {
    // ------
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', function(err, fileDescriptor){
      // ------------------------
      // console.log(`.[${"DATA.JS".red}]..  LIB.UPDATE..FS.OPEN=<${String(err).yellow}>`);
      if(!err && fileDescriptor){
        // ----------------------
        // Convert data to string
        var stringData = JSON.stringify(data);
        // -----------------
        // console.log(`.[${"DATA.JS".red}]..  LIB.UPDATE..<${'FALSE'.yellow}> CONVERT DATA TO STRING=<${data}>`);
        // Truncate the file
        fs.ftruncate(fileDescriptor,function(err){
          if(!err){
            // --------------------------
            // Write to file and close it
            // --------------------------
            if (stringData) {
              fs.writeFile(fileDescriptor, stringData,function(err){
                // -------
                if(!err){
                  fs.close(fileDescriptor,function(err){
                    if(!err){
                      callback(false);
                      return;
                    } else {
                      callback('Error closing existing file');
                      return;
                    }
                  });
                } else {
                  callback('Error writing to existing file');
                  return;
                }
              });
            } else {
              console.log(`..[DATA.JS] LIB.UPDATE ${file} FAILED... INVALID DATA=${stringData} `)
            }
          } else {
            callback('Error truncating file');
            return;
          }
        });
      } else {
        callback('Could not open file for updating, it may not exist yet');
        // console.log(`.[${"DATA.JS".red}]..  LIB.UPDATE..<${String(err).yellow}> <Could not open file for updating, it may not exist yet>`);
        return;
      }
    });
  } else {
    // ------
    callback(`[${"DATA.JS".yellow}] ..${"LIB.UPDATE".red}.. WHITESPACE IN IN FILEPATHNAME ${_filePathName}`);
    return;
  }
};

// Delete a file
lib.delete = function(dir,file,callback){
  // -----------------------------------------
  if (dir === null | file === null ) {
    callback("FILE OR DIRECTORY NOT DEFINED");
    return;
  }
  // console.log('.[DATA.JS]..  LIB.DELETE..<%s/%s>'.yellow,dir.toUpperCase().white,file.toUpperCase().green)
  // -----------------------------------------  let _filePathName = lib.baseDir+dir+'/'+file+'.json'
  let _filePathName = lib.baseDir+dir+'/'+file+'.json'
  let _WhiteSpace = hasWhiteSpace(_filePathName)
  let _Isnull = hasNull(_filePathName);
  if (_Isnull) {
    callback(`[${DATA.JS.yellow}] ..${"LIB.DELETE".red}.. NULL IN FILEPATHNAME ${_filePathName}`);
    return;
  }
  // --------
  if (!_WhiteSpace) {
    // Unlink the file from the filesystem
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', function(err){
      callback(err);
      return;
    });    
  } else {
    callback(`[${DATA.JS.yellow}] ..${"LIB.DELETE".red}.. WHITESPACE IN IN FILEPATHNAME ${_filePathName}`);
    return;
  }
};

// List all the items in a directory
lib.list = function(dir,callback){
  // ---------------
  let _directoryPathName = lib.baseDir+dir+'/';
  let _WhiteSpace = hasWhiteSpace(_directoryPathName);
  // ---------------------------------------
  if (!_WhiteSpace) {
    fs.readdir(lib.baseDir+dir+'/', function(err,data){
      if(!err && data && data.length > 0){
        var trimmedFileNames = [];
        data.forEach(function(fileName){
          trimmedFileNames.push(fileName.replace('.json',''));
        });
        callback(false,trimmedFileNames);
        return;
      } else {
        callback(err,data);
        return;
      }
    });
  }
};

// Export the module
module.exports = lib;
