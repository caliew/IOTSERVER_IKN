/*
 * Decoders for TCP Received BYTES
 */

// Dependencies
var _data = require("./data");
var _logs = require("./logs");
var util = require("util");
var debug = util.debuglog("workers");

var http = require('http');

const Sensor = require('../models/Sensor');
const AlertGroup = require('../models/AlertGroup');
const Alert = require('../models/Alert');

const { createBrotliCompress } = require("zlib");
const { decode } = require("punycode");

const nodemailer = require("nodemailer");
const flagSCREENOutput = false;

// -----------------
// Utility Functions
// -----------------
function hasNull(s) {
  // /\$\d+/g
  let pattern = /\x04/;
  let _Flag1 = true;
  let _Flag2 = true;
  try
  {
    _Flag1 = s.match(/\x00/i) === null ? false:true
    _Flag2 = s.match(/\x04/i) === null ? false:true
  }  catch (err) {
    _Flag1 = true;
    _Flag2 = true;
  }
  return _Flag1 || _Flag2;
}
function hex_to_ascii(str1) {
  var hex = str1.toString();
  var str = "";
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}
function hexToSignedInt(hex) {
  if (hex.length % 2 != 0) {
    hex = "0" + hex;
  }
  var num = parseInt(hex, 16);
  var maxVal = Math.pow(2, (hex.length / 2) * 8);
  if (num > maxVal / 2 - 1) {
    num = num - maxVal;
  }
  return num;
}
function parseFloat(str) {
  var float = 0, sign, order, mantissa, exp,
  int = 0, multi = 1;
  if (/^0x/.exec(str)) {
      int = parseInt(str, 16);
  }
  else {
      for (var i = str.length -1; i >=0; i -= 1) {
          if (str.charCodeAt(i) > 255) {
              console.log('Wrong string parameter');
              return false;
          }
          int += str.charCodeAt(i) * multi;
          multi *= 256;
      }
  }
  sign = (int >>> 31) ? -1 : 1;
  exp = (int >>> 23 & 0xff) - 127;
  mantissa = ((int & 0x7fffff) + 0x800000).toString(2);
  for (i=0; i<mantissa.length; i+=1) {
      float += parseInt(mantissa[i]) ? Math.pow(2, exp) : 0;
      exp--;
  }
  return float*sign;
}
// -------------------------------------
// Instantiate the Decoder module object
// -------------------------------------
var decoders = {};
decoders.sensors = {};
// --------
// WiSENSOR
// --------
decoders.decodeWISensorV1 = function (PortID, DataArr, callback) {
  // --------
  let Temp, Humd, modelType, Batt, Interval, modelID = -1;
  Humd = -999;
  //   ------------------------------
  for (i = 0; i < DataArr.length; i++) {
    const strData = DataArr[i];
    // ------------------------------------------------
    // Conversion Non-UniCode to HEX   .."".split("").reduce((hex,c)=>hex+=c.charCodeAt(0).toString(16).padStart(2,"0"),""));
    // Conversion Hex-String to String .."".match(/.{1,2}/g).reduce((acc,char)=>acc+String.fromCharCode(parseInt(char, 16)),""));
    // convertText                     ..decodeURIComponent(strData.substring(4).replace(/(..)/g, '%$1'));
    //  -----------------------------------------------
    // 04 10 - TEMERATURE   04 11 - HUMIDITY  05 12 - INTERVAL
    // 05 13 - WI-SHT10     05 14 - BATT
    // ---------------------------------
    let _key = strData.substring(0, 4);
    let _data = strData.substring(4);
    // -----------------------------
    try {
      // i> 0 && console.log(`[${i}] .. KEY=${_key}-${_data} ..${strData.substring(4).replace(/(..)/g, "%$1")} ..${decodeURIComponent(strData.substring(4).replace(/(..)/g, "%$1"))}`)
      if (strData.length > 4 && strData.substring(0, 4) == "0410") Temp = Number( decodeURIComponent(strData.substring(4).replace(/(..)/g, "%$1")) );
      if (strData.length > 4 && strData.substring(0, 4) == "0411") Humd = Number( decodeURIComponent(strData.substring(4).replace(/(..)/g, "%$1")) );
      if (strData.length > 4 && strData.substring(0, 4) == "0512") Interval = Number( decodeURIComponent(strData.substring(4).replace(/(..)/g, "%$1")) );
      if (strData.length > 4 && strData.substring(0, 4) == "0514") Batt = Number( decodeURIComponent(strData.substring(4).replace(/(..)/g, "%$1")) );
      // ---------------
      if (strData.length > 4 && strData.substring(0, 4) == "0513") {
        try {
          modelType = decodeURIComponent( strData.substring(4).replace(/(..)/g, "%$1") );
        }
        catch (err){        
        }
      }
      // ------------
    } catch(err) {
      // ----------
      console.log(`URIError URI Malformed at decodeURIComponent ..${_key}-${_data}`)
      _logs.append('_ERROR',`[DECODERS.JS] URIError URI Malformed at decodeURIComponent ..${_key}-${_data}`,()=>{});
      // ---------
      callback(403,{"Message":`[DECODEWISENSOR] URIError URI Malformed at decodeURIComponent ..${_key} ${_data}`})
    }
    // ---------------
    if ( strData.length >= 8 && hex_to_ascii(strData.substring(0, 8)) == "+RCV" ) {
      try {
        CheckIND = decodeURIComponent( strData.substring(0, 10).replace(/(..)/g, "%$1") );
        // ---------
        // if (strData.length == 56) {
        //   modelID = decodeURIComponent( strData.substring(22).replace(/(11)/g, "").replace(/(..)/g, "%$1") );
        //   // modelID = decodeURIComponent( strData.substring(22).replace(/(..)/g, "%$1") );
        // }
        // else {
          modelID = decodeURIComponent( strData.substring(22).replace(/(11)/g, "").replace(/(..)/g, "%$1") );
        // } 
      }
      catch (err) {
        callback(403,{"Message":"URIError URI Malformed at decodeURIComponent"})
      }
    }
    // ------------
  }
  // ---------
  if (Temp && Humd && modelType && modelID) {
    // ----------------------
    var sensorData = {
      modelID,
      modelType,
      // RAWDATA: DataArr1,
      DATAS : ["Temperature","Humidity"],
      "Temperature": Temp,
      "Humidity": Humd - Humd*0.04,
      TIMESTAMP: new Date(),
      BATT : Batt,
      INTERVAL : Interval
    };
    // -------------------------
    // CALL TO CHECK ON ALERTING
    //  ------------------------
    decoders.CheckAlert(sensorData);
    //  ---------------------
    // Append to Data File
    // ----------------------
    let fileName = sensorData.modelID;
    if (typeof fileName === "undefined" || hasNull(fileName)) {
      console.log(`[${'DECODERS.JS'.blue}] ${'WI-SENSOR1'.red} PORT=${String(PortID).green} FILENAME=${String(fileName).yellow} IS UNDEFINED OR IS NULL`)
      return;
    }
    _data.update("sensors", fileName, sensorData, function (err) {
      // ----------
      if (err) { 
        _data.create("sensors", fileName, sensorData, function (err) {
          if (!err) {
            console.log(sensorData);
            console.log(`[${"DECODERS.JS".blue}] ${'WI-SENSOR1'.red} CREATED  <${String(err).yellow}><${String(fileName).red}>`);
            _logs.append('_ERROR',`[DECODERS.JS] NEW SENSOR CREATED =${String(fileName)} `,()=>{});
          } else {
            console.log(`[${"DECODERS.JS".blue}] ${'WI-SENSOR1'.red} CREATE..<${String(fileName)}> ERROR CODE < <${String(err).yellow}>`)
          }
        });
      }
      // ----------------------------
      // Convert the data to a string
      // ----------------------------
      var logString = JSON.stringify(sensorData);
      let _now = new Date();
      let _TIMESTAMP = `${_now.getDate()}/${_now.getMonth()+1}/${_now.getFullYear()} ${_now.getHours()}:${_now.getMinutes()}`
      if ( flagSCREENOutput && String(PortID) === '1008' ) console.log(`[${"DECODERS.JS".blue}] <${_TIMESTAMP}> <${String(PortID).green}> ${'WI-SENSOR1'.red} APPEND LOG <${String(fileName).toUpperCase().green}>`);
      if ( flagSCREENOutput && String(PortID) === '1009' ) console.log(`[${"DECODERS.JS".blue}] <${_TIMESTAMP}> <${String(PortID).yellow}> ${'WI-SENSOR1'.red} APPEND LOG <${String(fileName).toUpperCase().green}>`);
      if ( flagSCREENOutput && String(PortID) === '1010' ) console.log(`[${"DECODERS.JS".blue}] <${_TIMESTAMP}> <${String(PortID).red}> ${'WI-SENSOR1'.red} APPEND LOG <${String(fileName).toUpperCase().green}>`);
      // --------------
      // Stored in Logs
      // --------------
      _logs.append(fileName, logString, function (err) {
        if (!err) {
          debug("Logging to file succeeded");
        } else {
          debug("Logging to file failed");
        }
      });
    });
    // ---------------------
    callback(200,sensorData);
    return;
    //  --------------------
  } else {
    callback(404,null);
  }
};
decoders.decodeWISensorV2 = function (PortID, Buffer, callback) {
  // ----------------
  let Temp, Humd, modelType, Batt, Interval, modelID = -999;
  // 2B 52 43 56 3A 33 30 2C
  let _CHECK = hex_to_ascii(Buffer.substring(0, 8));
  let _HEADER = Buffer.substr(16,2);  //
  let _MACID = Buffer.substr(26,12);  // 10
  let _TYPE = Buffer.substr(38,4);    // 16
  let _INT = hexToSignedInt(Buffer.substr(50,4));     // 19
  let _BATT = hexToSignedInt(Buffer.substr(56,2));    // 1B
  let _LORAFREQ = hexToSignedInt(Buffer.substr(60,4));// 1C
  let _TEMP = hexToSignedInt(Buffer.substr(66,4))/100;    // 20
  let _HUMD = (Buffer.substr(72,4));    // 21
  // --------------------------------
  if (_CHECK !== '+RCV' || Buffer.length > 84) {
    callback(403,{"Message":"URIError URI Malformed at decodeURIComponent"})
    return;
  }
  var sensorData = {
    modelID : `${_MACID.substring(0,2)}-${_MACID.substring(2,4)}-${_MACID.substring(4,6)}-${_MACID.substring(6,8)}-${_MACID.substring(8,10)}-${_MACID.substring(10,12)}`,
    modelType : 'Wi-SHT10A',
    // RAWDATA: DataArr1,
    DATAS : ["Temperature","Humidity"],
    "Temperature": _TEMP,
    "Humidity": _HUMD - _HUMD*0.04,
    TIMESTAMP: new Date(),
    BATT : _BATT,
    INTERVAL : _INT
  };
  // ----------------------------------------
  // -HEADER- -CMND- -LENGTH-  ----MAC ID ---------  --TYPE-- -VERSION--  --INT--- -BATT--  -LORA FREQ- ---TEMP--- -HUMIDITY-
  //    80      A0    00 1B    10 XX XX XX XX XX XX    16 01   17 XX XX   19 XX XX  1B 64    1C XX XX    20 XX XX   21 XX XX
  // 16 TYPE            17 VERSION      19 INTERVAL   1B BATTERY 
  // 1C LORA FREQUENCY
  // 20 TEMPERATURE     21 HUMIDITY
  // --------------------------
  // CALL TO CHECK ON ALERTING
  //  ------------------------
  decoders.CheckAlert(sensorData);
  let fileName = sensorData.modelID;
  if (typeof fileName === "undefined" || hasNull(fileName)) {
    console.log(`[${'DECODERS.JS'.blue}] ${'WI-SENSOR2'.yellow} PORT=${String(PortID).green} FILENAME=${String(fileName).yellow} IS UNDEFINED OR IS NULL`)
    return;
  }
  //  ---------------------
  // Append to Data File
  // ----------------------
  _data.update("sensors", fileName, sensorData, function (err) {
    // ----------
    if (err) { 
      _data.create("sensors", fileName, sensorData, function (err) {
        if (!err) {
          console.log(`[${"DECODERS.JS".blue}] ${'WI-SENSOR2'.yellow} CREATED <${String(err).yellow}><${String(fileName).green}>`);
          console.log(sensorData);
          _logs.append('_ERROR',`[DECODERS.JS] NEW SENSOR CREATED =${String(fileName)} `,()=>{});
        } else {
          console.log(`[${"DECODERS.JS".blue}] ${'WI-SENSOR2'.yellow} CREATE..<${String(fileName).red}> ERROR CODE < <${String(err).yellow}>`)
        }
      });
    }
    // ----------------------------
    // Convert the data to a string
    // ----------------------------
    var logString = JSON.stringify(sensorData);
    let _now = new Date();
    let _TIMESTAMP = `${_now.getDate()}/${_now.getMonth()+1}/${_now.getFullYear()} ${_now.getHours()}:${_now.getMinutes()}`
    if ( flagSCREENOutput && String(PortID) === '1008' ) console.log(`[${"DECODERS.JS".blue}] <${_TIMESTAMP}> <${String(PortID).green}> ${'WI-SENSOR2'.yellow} APPEND LOG <${String(fileName).toUpperCase().green}>`);
    if ( flagSCREENOutput && String(PortID) === '1009' ) console.log(`[${"DECODERS.JS".blue}] <${_TIMESTAMP}> <${String(PortID).yellow}> ${'WI-SENSOR2'.yellow} APPEND LOG <${String(fileName).toUpperCase().green}>`);
    if ( flagSCREENOutput && String(PortID) === '1010' ) console.log(`[${"DECODERS.JS".blue}] <${_TIMESTAMP}> <${String(PortID).red}> ${'WI-SENSOR2'.yellow} APPEND LOG <${String(fileName).toUpperCase().green}>`);
    // --------------
    // Stored in Logs
    // --------------
    _logs.append(fileName, logString, function (err) {
      if (!err) {
        debug("Logging to file succeeded");
      } else {
        debug("Logging to file failed");
      }
    });
  });
  // ---------------------
  callback(200,sensorData);
  // ----------------------
};
// --------------------
// HONEYWELL FIRE SMOKE
// --------------------
decoders.decodeHONEYWELLFireSmoke = function (data, callback) {};
// ----------
// 485 SENSOR
// ----------------
decoders.decode485Sensor = function (PortID, DataArr, callback) {
  // -----------
  // 485 SENSORS - +RCV:ID,DATA IN BYTE
  // -----------
  if (DataArr.length > 2) DataArr[0] = `${DataArr[0]}0D${DataArr[1]}`;
  // ------
  let index = DataArr[0].indexOf("2C");
  // ----------------------------------3
  let DataHEADER = DataArr[0].substring(0,index)
  let DataContent = DataArr[0].substring(index+2)
  let DataArr1 = DataArr[0].split("2C");
  if (DataArr1.length > 2) DataArr1[1] = `${DataArr1[1]}2C${DataArr1[2]}`;
  let DataArr2 = DataArr1[0].split("3A");
  // -------------------------------
  if (DataArr1.length < 2) {
    console.log(`[${'DECODERS.JS'.green}] .. ***`)
    console.log(`[${'DECODERS.JS'.green}] .. [0D|${DataArr.length}]=<${DataArr}>`)
    console.log(`[${'DECODERS.JS'.green}] .. [2C|${DataArr1.length}]=<${DataArr1}>`);
    console.log(`[${'DECODERS.JS'.green}] .. ***`)
    return;
  }
  // --------------------------------
  if ( DataArr1.length > 0 && DataArr2.length > 0) {
    // ---------------------------------------
    let DTUID, SENSORID,FUNCID,NDATA,TIMESTAMP
    // ---------------------------------------
    try
    {
      const _dateTime = new Date();
      DTUID = decodeURIComponent(DataArr2[1].replace(/(..)/g, "%$1"));
      SENSORID = parseInt(DataArr[0].substr(index+2,2), 16);
      // FUNCID = parseInt(DataArr1[1].substring(2, 4), 16);
      // NDATA = parseInt(DataArr1[1].substring(4, 6), 16) / 2;
      FUNCID = parseInt(DataContent.substring(2, 4), 16);
      NDATA = parseInt(DataContent.substring(4, 6), 16) / 2;
      DATESTAMP = `${_dateTime.getDate()}/${_dateTime.getMonth()+1}`
      TIMESTAMP = `${String(_dateTime.getHours()).padStart(2,"0")}:${String(_dateTime.getMinutes()).padStart(2,"0")}`
      // --------------
      if (FUNCID !== 3)
      {
        _logs.append('_ERROR',`[DECODERS.JS] SERVER ID=${PortID} ..<${DataArr.length}>=<${DataArr[0]}>|<${DataArr[1]}>..FUNCID=[${FUNCID}] ..DTU.ID=[${String(DTUID).padStart(2,"0")}]..SNR.ID=[${String(SENSORID).padStart(2,"0")}].. `,()=>{});
        callback(403,{DTUID,SENSORID,FUNCID,RCV_BYTES:[],NDATA:0,DATAS:[]});
        return;
      }
    }
    catch (err){
      callback(404,{DTUID,SENSORID,FUNCID,RCV_BYTES:[],NDATA:0,DATAS:[]});
      return;
    }
    //  -------------------
    let sensorDataArr = []
    let sensorDataFloatArr = []
    let sensorDataIntArr = [];
    let RCV_BYTES = [];
    // ---------------------------
    for (i = 0; i < NDATA; i++) {
      // ConvDATA = hexToSignedInt( DataArr1[1].substring(6 + 4 * i, 10 + 4 * i) );
      // RCV_BYTES.push(DataArr1[1].substring(6 + 4 * i, 10 + 4 * i))
      // let StrBYTE = DataArr1[1].substring(6 + 4 * i, 10 + 4 * i);
      ConvDATA = hexToSignedInt( DataContent.substring(6 + 4 * i, 10 + 4 * i) );
      RCV_BYTES.push(DataContent.substring(6 + 4 * i, 10 + 4 * i))
      let StrBYTE = DataContent.substring(6 + 4 * i, 10 + 4 * i);
      // if (StrBYTE != '0000') console.log(`...decode485Sensor ...[${i}] => ${StrBYTE}..`)
      // console.log(`...decode485Sensor ... ${DataArr1[1].substring(6 + 4 * i, 10 + 4 * i)}..`)
      // console.log('[%s]..%s ..%s',i,DataArr1[1].substring(6+4*i,10+4*i),ConvDATA)
      if (Number.isNaN(ConvDATA)) {
        sensorDataArr.push(0);
        console.log(`[${'DECODERS.JS'.green}] ${'DECODE485SENSOR'.blue} PORT=${String(PortID).green} ConvDATA IS NULL ${ConvDATA}`)
        return;
      } else {
        sensorDataArr.push(ConvDATA);
      }
    }
    // -------------
    // GET THE FLOAT
    // -------------
    if (RCV_BYTES.length%2 == 0) {
      for (let i = 0; i < RCV_BYTES.length/2; i++) {
        sensorDataFloatArr.push(parseFloat(`0x${RCV_BYTES[2*i]}${RCV_BYTES[2*i+1]}`).toFixed(4));
        let _Int4 = hexToSignedInt(`${RCV_BYTES[2*i]}${RCV_BYTES[2*i+1]}`);
        sensorDataIntArr.push(hexToSignedInt(`${RCV_BYTES[2*i]}${RCV_BYTES[2*i+1]}`));
      }
    }
    // -------------
    var sensorData = {
      DTUID,
      SENSORID,
      FUNCID,
      NDATA,
      SENSORTYPE : null,
      RCV_BYTES,
      DATAS : [],
      DATAS1 : [],
      DATAS2 : [],
      TIMESTAMP: new Date(),
    };
    // -------------------------------    
    if (NDATA <= 30) sensorData["DATAS"] = sensorDataArr;
    // ---------------------------------------------------
    if (NDATA > 30 && NDATA <= 40) sensorData["DATAS2"] = sensorDataArr;
    if (NDATA > 40) sensorData["DATAS1"] = sensorDataArr;
    // ---------------------
    // Append to Sensor File
    // ----------------------
    var fileName = sensorData.DTUID+'-'+sensorData.SENSORID;
    if(typeof fileName === "undefined" || hasNull(fileName)){
      console.log(`[${'DECODERS.JS'.green}] ${'DECODE485SENSOR'.blue} PORT=${String(PortID).green} FILENAME=${String(fileName).yellow} IS UNDEFINED OR IS NULL`)
      return;
    }
    // -----------------------------------------------------
    // CHECK ATCMND_SENT1 AND REMOVE IF ANY MATCHED AN UPDATE
    // -----------------------------------------------------
    _data.read("rawData",'ATCMND_SENT2',function(err,CMD_SENT) {
      // --------
      if (!err) {
        // -------------------
        if (typeof CMD_SENT === 'object') {
          // ----------------
          let ObjData = { DTUID, SENSORID, FUNCID, NDATA, RCV_BYTES, sensorDataArr, sensorDataFloatArr, sensorDataIntArr, TIMESTAMP, DATESTAMP};
          let CHECKOBJS = decoders.GET_ATCMND(ObjData);
          // ------------------------
          // APPEND TO THE TEST FILE
          // -----------------------
          let _KEY = `${sensorData.DTUID}_${sensorData.SENSORID}`;
          // ----------------------
          if (CHECKOBJS.length > 0) {
            ObjData['SENSORTYPE'] = CHECKOBJS[0].SENSORTYPE;
            sensorData['SENSORTYPE'] = CHECKOBJS[0].SENSORTYPE;
            if (CHECKOBJS[0].EXTFILE && CHECKOBJS[0].EXTFILE === 'STATE') { 
              fileName = `${fileName}_${CHECKOBJS[0].EXTFILE}`;
              _KEY = `${_KEY}A`
            }
          }
          // --------
          if ( decoders.sensors.hasOwnProperty(_KEY)){
            delete decoders.sensors[_KEY];
          }
          decoders.sensors[_KEY] = ObjData;
          // ------------------
          // UPDATE ATCMND_SENT1
          // UPDATE _485SENSORS
          // ------------------
          _data.update('rawData','_485SENSORS',decoders.sensors,function(err) {
          } );
          // ------
        }
        // ---------------------------------------
        _data.read("sensors",fileName,function(err,sensorObj) {
          // ----------------------
          if (NDATA == 50) sensorData["DATAS2"] = sensorObj["DATAS2"];      
          if (NDATA == 35) sensorData["DATAS1"] = sensorObj["DATAS1"];
          // --------------------------------------------
          // CREATE NEW SENSOR IF SENSOR IS NOT AVAILABLE
          // --------------------------------------------
          _data.update("sensors", fileName, sensorData, function (err) {
            // -------------------
            if (err && fileName) { 
              // CREATE NEW FILE IF SENSOR RETURN TRUE IN UPDATE - ERROR IN UPDATING
              _data.create("sensors", fileName, sensorData, function (err) {
                console.log(`[${'DECODERS.JS'.green}] ${'DECODE485SENSOR'.blue} DATA.CREATE <${String(fileName).toUpperCase().green}> STATUS <${String(err).yellow}>`)
                if (err) {
                  console.log(`[${'DECODERS.JS'.green}] ${'DECODE485SENSOR'.blue} COULD NOT CREATE 485 SENSOR <${fileName.red}>`);
                  return;
                }
              });
            } else {
              // console.log(`[${'DECODERS.JS'.green}] DECODE485SENSOR .. 5.COULD NOT UPDATE 485 SENSOR <${fileName.red}>`);
            }
          });
          // ----------------------------
          // Convert the data to a string
          // ----------------------------
          var logString = JSON.stringify(sensorData);
          let _now = new Date();
          let _TIMESTAMP = `${_now.getDate()}/${_now.getMonth()+1}/${_now.getFullYear()} ${_now.getHours()}:${_now.getMinutes()}`
          if ( flagSCREENOutput && String(PortID) === '1008' ) console.log(`[${'DECODERS.JS'.green}] <${_TIMESTAMP}> <${String(PortID).green}> ${'DECODE485SENSOR'.blue} APPEND LOG <${String(fileName).toUpperCase().green}>`);
          if ( flagSCREENOutput && String(PortID) === '1009' ) console.log(`[${'DECODERS.JS'.green}] <${_TIMESTAMP}> <${String(PortID).yellow}> ${'DECODE485SENSOR'.blue} APPEND LOG <${String(fileName).toUpperCase().green}>`);
          if ( flagSCREENOutput && String(PortID) === '1010' ) console.log(`[${'DECODERS.JS'.green}] <${_TIMESTAMP}> <${String(PortID).red}> ${'DECODE485SENSOR'.blue} APPEND LOG <${String(fileName).toUpperCase().green}>`);
          // --------------
          // Stored in Logs
          // --------------
          _logs.append(fileName, logString, function (err) {
            if (!err) {
              debug("Logging to file succeeded");
            } else {
              debug("Logging to file failed");
            }
          });
          // -------------------------
          // CALL TO CHECK ON ALERTING
          //  ------------------------
          decoders.CheckAlert(sensorData);
          // -----------------------------
          callback(200,sensorData)
          return;
          //  ----------------------------
        })
        // ------
      }
    })
    // ----
  } else {
    // ----------------
    console.log(`[DECODERS.JS] ... CALLBACK 404...`);
    callback(404,null);
    return;
    // ----------------
  }
};
// -----------
// F8LST (DTU)
// -----------
decoders.decodeF8L10ST= function(PortID,buffer,callback) {
  // -------------------------
  var _dateTime = new Date();
  var hourNow = String(_dateTime.getHours()).padStart(2, "0");
  var minuteNow = String(_dateTime.getMinutes()).padStart(2, "0");
  // ------------
  let _PRE = buffer.substring(0,14).toUpperCase();
  let _DATA = buffer.substring(14).toUpperCase();
  // ---------------------------------------------
  // _DATA : FA LENGTH  04 IO-PORT   IO-TYPE     00XH   01XH   CRC(1-BYTE)
  //                        0B=D1   01-ANALOG
  //                        09=D2   02-GPIO INPUT
  //                        0A=A1   03=GPIO OUTPUT
  //                        0B=A2     
  // ---------------------------------
  // parseInt(DataArr[0].substr(index+2,2), 16);
  // _DATA = FA 06 04 0B 01 0026 3C CC
  //         FA 06 04 0B 01 01 DB F2
  //         FA 0B 02 01 03 04 3D 6D 91 68 0A 3C FE
  //         FA 0B 02 01 03 04 3D 6D 91 68 0A 3C FE
  //         _CMND.02
  //                  01 03 04 BD 7D F3 B6
  //            -DATA.01 03 04 3D 6D 91 68
  //       -SENSOR ID=01 -- -- -- -- -- --
  //             -FUNCID=03 -- -- -- -- --
  //            -DATALENGTH=04 -- -- -- --
  //                  -DATAHEX=3D 6D -- --
  // ---------------------------------------------
  let _DATE = `${_dateTime.getDate()}/${_dateTime.getMonth()+1}`
  let _TIME = `${hourNow}:${minuteNow}`;
  // let _HEADER = _DATA.substr(0,2)
  // let _LENGTH = parseInt(_DATA.substr(2,2),16);
  // let _CMND = buffer.substr(4,2);
  // let _DATA = buffer.substring(6,(_LENGTH-1)*2).toUpperCase();
  let _DTUID = parseInt(_PRE.substr(10,2),16);
  let _HEADER = _DATA.substr(0,2);
  let _LENGTH = _DATA.substr(2,2);
  let _CMND = _DATA.substr(4,2);
  let _IOPORT = _DATA.substr(6,2);
  let _IOTYPE = _DATA.substr(8,2);
  let _DATAHEX = _DATA.substr(10,4);
  let _DATAINT = parseInt(_DATAHEX,16);
  let _SENSORID = parseInt(_DATA.substr(0,2),16);;
  let _FUNCTID = parseInt(_DATA.substr(2,2),16);;
  // ----------------------------
  let _READING1 = `${Number(_DATAINT * 3.3 * 20.3 / (4095.0 * 12.1) ).toFixed(2)} V`;
  let _READING2 = `${Number(_DATAINT * 3.3 * 1000 / (4095.0 * 150.0)).toFixed(2)} mA`;
  // Number(parseFloat(`0x${logsdata[0].RCV_BYTES[0]}${logsdata[0].RCV_BYTES[1]}`)/100).toFixed(2) + 'bar': 'bar';
  // ---------  
  let _CRC = _DATA.substr(14,2);
  // -------
  let _MODE,_TYPE,_PORT;
  switch (Number(_CMND)) {
    case 4:
      _MODE = "DATA.ACQ"
      break;
    case 5:
      _MODE = "IO.CTRTL";
      break;
    case 6:
      _MODE = 'POWER-ON';
      break;
    case 7:
      _MODE = 'HEART-BEAT'
      break;
    case 8:
      _MODE = 'POWER-OFF'
      break;
    default:
      _MODE = 'RESERVE'
      break;
  }
  switch(_IOTYPE) {
    case '01':
      _TYPE = 'ANALOG INPUT'
      break;
    case '02':
      _TYPE = 'GPIO INPUT'
      break;
    case '03':
      _TYPE = 'GPIO OUTPUT'
      break;
    default:
      break;
  }
  switch (_IOPORT) {
    case '08':
      _PORT = 'D1'
      break;
    case '09':
      _PORT = 'D2'
      break;
    case '0A':
      _PORT = 'A1';
      break;
    case '0B':
      _PORT = 'A2';
      break;
    default:
      break;
  }
  // -------------------------------
  let checkObject = {
    "BUFFER":String(buffer).toUpperCase(),
    "PRE":_PRE,
    "DATA":_DATA,
    "HEADER"    : _HEADER,
    "DTU_ID"    : _DTUID,
    "SENSOR_ID" : _SENSORID,
    "CMND_ID"   : _CMND,
    "FUNCT_ID"  : _FUNCTID,
    "MODE"      : _MODE,
    "TYPE"      : _TYPE,
    "PORT"      : _PORT,
    "DATALENGTH": _LENGTH,
    "DATAHEX"   : _DATAHEX,
    "DATAINT"   : _DATAINT,
    "READING1"  : _READING1,
    "READING2"  : _READING2,
  }
  // let _READING = `${Number(_DATAINT * 3.3 * 1000 / (4095.0 * 150.0) / 20.0 * 100.0 ).toFixed(2)} A`;
  // console.log(`[${"DECODERS.JS".rainbow}]  ${"decodeF8L10ST".blue} .${_TIME}.`)
  // console.log(checkObject)  
  // -------------------------------
  if (_CMND > 0 ) {
    callback(400,{ _DATE, _TIME, PortID, _DTUID, _SENSORID, _FUNCTID,  _DATA, _MODE, _PORT, _TYPE, _DATAHEX, _DATAINT, _READING1, _READING2 });
  } else {
    callback(403, null);
  }
  // ----------
}
decoders.decodeF8L10ST_ATMODE= function(PortID,buffer,callback) {
  // -------------------------
  var _dateTime = new Date();
  var hourNow = String(_dateTime.getHours()).padStart(2, "0");
  var minuteNow = String(_dateTime.getMinutes()).padStart(2, "0");
  // ------------
  var DataArr = buffer.toString("hex").toUpperCase().split("0D");
  // -------------------------------
  DataArr1 = DataArr[0].split("2C");
  let _PRE = DataArr1[0].toUpperCase();
  let _DATA = DataArr1[1].toUpperCase();
  // ---------------------------------------------
  // _DATA : FA LENGTH  04 IO-PORT   IO-TYPE     00XH   01XH   CRC(1-BYTE)
  //                        0B=D1   01-ANALOG
  //                        09=D2   02-GPIO INPUT
  //                        0A=A1   03=GPIO OUTPUT
  //                        0B=A2     
  // ---------------------------------
  // parseInt(DataArr[0].substr(index+2,2), 16);
  // _DATA = FA 06 04 0B 01 0026 3C CC  <-- PWR MTR
  //         FA 06 04 0B 01 0046 5C CC  <-- PRESS
  // ---------------------------------------------
  let _DATE = `${_dateTime.getDate()}/${_dateTime.getMonth()+1}`
  let _TIME = `${hourNow}:${minuteNow}`;
  // -----------------------------------
  let _DTUID = parseInt(_PRE.substr(10,2),16);
  let _HEADER = _DATA.substr(0,2)
  let _LENGTH = _DATA.substr(2,2)
  let _CMND = _DATA.substr(4,2)
  let _IOPORT = _DATA.substr(6,2)
  let _IOTYPE = _DATA.substr(8,2)
  // ----------------------------
  let _DATAHEX = _DATA.substr(10,4)
  let _DATAINT = parseInt(_DATAHEX,16);
  let _READING1 = `${Number(_DATAINT * 3.3 * 20.3 / (4095.0 * 12.1) ).toFixed(2)} A`;
  let _READING2 = `${Number(_DATAINT * 3.3 * 1000 / (4095.0 * 150.0) / 20.0 * 100.0 / 20.0 ).toFixed(2)} A`;
  // FA 06 04 0B 01 01 DB F2
  // FA 06 04 0B 01 00 03 19..<06> .0100..256
  // FA 06 04 0B 01 00 02 18..<06> .0002..2
  // FA 06 04 0B 01 00 46 5C CC
  console.log(`[DECODERS.JS]  decodeF8L10ST_ATMODE DATA=<${_DATA}>..`)
  console.log(`[DECODERS.JS]  decodeF8L10ST_ATMODE HEADER=${_HEADER}..DTU ID=<${_DTUID}> ..CMND=${_CMND}..IO PORT=${_IOPORT}..IO TYPE=${_IOTYPE}`)
  console.log(`[DECODERS.JS]  decodeF8L10ST_ATMODE ${_DATA}..<${_LENGTH}> .${_DATAHEX}..${_DATAINT}`)
  // -------
  let _MODE,_TYPE,_PORT;
  switch (Number(_CMND)) {
    case 4:
      _MODE = "DATA.ACQ"
      break;
    case 5:
      _MODE = "IO.CTRTL";
      break;
    case 6:
      _MODE = 'POWER-ON';
      break;
    case 7:
      _MODE = 'HEART-BEAT'
      break;
    case 8:
      _MODE = 'POWER-OFF'
      break;
    default:
      _MODE = 'RESERVE'
      break;
  }
  switch(_IOTYPE) {
    case '01':
      _TYPE = 'ANALOG INPUT'
      break;
    case '02':
      _TYPE = 'GPIO INPUT'
      break;
    case '03':
      _TYPE = 'GPIO OUTPUT'
      break;
    default:
      break;
  }
  switch (_IOPORT) {
    case '08':
      _PORT = 'D1'
      break;
    case '09':
      _PORT = 'D2'
      break;
    case '0A':
      _PORT = 'A1';
      break;
    case '0B':
      _PORT = 'A2';
      break;
    default:
      break;
  }
  // -------------------------------
  if (Number(_CMND) > 0 ) {
    callback(400,{ _DATE, _TIME, _DTUID, _DATA, _MODE, _PORT, _TYPE, _DATAHEX, _DATAINT, _READING2 });
  } else {
    callback(403, null);
  }
  // ----------
}
// ----------
// AT COMMAND
// ----------
decoders.ATCMNDArr = [];
// ---------------------
decoders.ADD_ATCMND = function(ATCMDObj) {
  decoders.ATCMNDArr.push(ATCMDObj);
}
decoders.GET_ATCMND = function(ATCMDObj) {
  // ---------
  let BYTE_LEN = ATCMDObj.RCV_BYTES.length;
  // ---------
  return decoders.ATCMNDArr.filter(_ATCMND => {
    let MOD_LEN = parseInt(_ATCMND.MODBUS.substr(-2), 16)
    let status = (Number(_ATCMND.DTUID) == Number(ATCMDObj.DTUID)) && (Number(_ATCMND.SENSORID) == Number(ATCMDObj.SENSORID) && (Number(MOD_LEN) == Number(BYTE_LEN)) );
    if (status) {
      // console.log(`[DECODERS.JS] <${status}> <${_ATCMND.DTUID}_${ATCMDObj.DTUID}> ..|${MOD_LEN}|<${ATCMDObj.RCV_BYTES}>`)
    }
    return (status);
  })
}
decoders.REMOVE_ATCMND1 = function(ATCMDObj) {
  // console.log(`[DECODERS.JS] ..REMOVE_ATCMND1.. ${ATCMDObj.DTUID}|${ATCMDObj.SENSORID} <${ATCMDObj.RCV_BYTES}>`);
  // console.log(`[DECODERS.JS] ..AT CMND [${decoders.ATCMNDArr}]`);
  // let BYTE_LEN = ATCMDObj.RCV_BYTES.length;
  // // ------------
  // console.log(`[DECODERS.JS] ...AFTER REMOVE_ATCMND ${ATCMNDArr.length}`);
  // decoders.ATCMNDArr = decoders.ATCMNDArr.filter(_ATCMND => {
  //   let MOD_LEN = parseInt(_ATCMND.MODBUS.substr(-2), 16)
  //   let status = (Number(_ATCMND.DTUID) == Number(ATCMDObj.DTUID)) && (Number(_ATCMND.SENSORID) == Number(ATCMDObj.SENSORID));
  //   // status && console.log(`[DECODERS.JS] <${_ATCMND.MODBUS}> <${_ATCMND.MODBUS.substr(-2)}> <${MOD_LEN}> <${ATCMDObj.RCV_BYTES}>`)
  //   return (!status);
  // })
  // console.log(`[DECODERS.JS] ...AFTER REMOVE_ATCMND ${ATCMNDArr.length}`);
}
decoders.REMOVE_ATCMND = function(ATCMDObj) {
  // ------------
  console.log(`[DECODERS.JS] ...REMOVE ATCMND <${ATCMDObj.DTUID}|${_ATCMND.SENSORID}> <${ATCMDObj.RCV_BYTES}>`);
  console.log(`[DECODERS.JS] ...AT CMND [${decoders.ATCMNDArr}]`);
  let BYTE_LEN = ATCMDObj.RCV_BYTES.length;
  // ------------
  decoders.ATCMNDArr = decoders.ATCMNDArr.filter(_ATCMND => {
    let MOD_LEN = parseInt(_ATCMND.MODBUS.substr(-2), 16)
    let status = (Number(_ATCMND.DTUID) == Number(ATCMDObj.DTUID)) && (Number(_ATCMND.SENSORID) == Number(ATCMDObj.SENSORID) && (Number(MOD_LEN) == Number(BYTE_LEN)) );
    // status && console.log(`[DECODERS.JS] <${_ATCMND.MODBUS}> <${_ATCMND.MODBUS.substr(-2)}> <${MOD_LEN}> <${ATCMDObj.RCV_BYTES}>`)
    return (!status);
  })
  // ----------
  console.log(`[DECODERS.JS] ...AFTER REMOVE_ATCMND ${ATCMNDArr.length}`);
  // ----------
}
decoders.RESET_ATCMND = function() {
  // console.log(`.[${'DECODERS.JS'.grey}] AT COMMAND WITH NO RESPONSE <${decoders.ATCMNDArr.length}> ..${'AT COMMAND LIST RESET'.yellow}.. `)
  decoders.ATCMNDArr = [];
}
// --------------
// CHECK ALERTING
// --------------
decoders.CheckAlert = function(sensorData,callback) {
  //  --------
  //  CHECK ON MONGODB DATABASE
  //  --------
  try {
    const sensorIDLabel = sensorData.modelID ? String(sensorData.modelID).toUpperCase() : "";
    if (sensorIDLabel === "") {
      // console.log(sensorData);
      return;
    } 
    const query = { sensorId : sensorIDLabel };
    // ----------------------------------------
    Sensor.find(query).exec( (error,sensors) => {
      // ------------
      if (sensors.length >0 && sensors[0].type=='WISENSOR') {
        // -----------------------------
        let limitMIN = Number(sensors[0].limits['TEMPERATURE_MIN']) < Number(sensors[0].limits['TEMPERATURE_MAX']) ? Number(sensors[0].limits['TEMPERATURE_MIN']) : Number(sensors[0].limits['TEMPERATURE_MAX']);
        let limitMAX = Number(sensors[0].limits['TEMPERATURE_MAX']) > Number(sensors[0].limits['TEMPERATURE_MIN']) ? Number(sensors[0].limits['TEMPERATURE_MAX']) : Number(sensors[0].limits['TEMPERATURE_MIN']);
        const _TEMP = Number(sensorData['Temperature']);
        // -------------------
        let name = sensors[0].name;
        let dtuId = sensors[0].dtuId;
        let sensorId = sensorIDLabel;
        let type = 'warning';
        let reading = _TEMP;
        let alertPoints = (sensors && sensors[0] && sensors[0].alertpoint) ? sensors[0].alertpoint : 1;
        // -----------------
        if (_TEMP > limitMAX) {
          try {
            // -------------
            const newAlert = new Alert({name,dtuId,sensorId,type,reading,limit:limitMAX});
            newAlert.save();
            // -------------
            decoders.sendWhatsApp(sensors[0],`${sensors[0].name} TEMPERATURE=${_TEMP}C > LIMIT ${limitMAX}C`,alertPoints);
            // -------------
          } catch (err) {
            return;
          }
        } else if (_TEMP < limitMIN) {
          try {
            // -------------
            const newAlert = new Alert({name,dtuId,sensorId,type,reading,limit:limitMIN});
            newAlert.save();
            // -------------
            decoders.sendWhatsApp(sensors[0],`${sensors[0].name} TEMPERATURE=${_TEMP}C < LIMIT ${limitMIN}C`,alertPoints)
            // -------------
          } catch (err) {
          }
          // -------------
        }
      }
    })
  } catch (err) {
    console.log(err);
  } 
  //  ------------------
  //  GET ALL SENSORS LISTS (NOT WISENSOR)
  //  ------------------
  sensorData.DTUID && sensorData.SENSORID && decoders.GetAllSensors(function(err,payload){
    //  --------------------------------------
    payload.forEach(function(sensorId,index) {
      // -------------------
      _data.read('sensors',sensorId,function(err,sensorObj){
        let ALERT;
        let TRIGGERED;
        TRIGGERED = false;
        //  ------------------
        let cond1,cond2;
        let label1,label2;
        let dbLimit1,dbLimit2
        // ------------------
        if (sensorObj && sensorObj.dtuid == sensorData.DTUID && sensorObj.sensorid == sensorData.SENSORID) {
          // -------------------------------
          switch (sensorObj.sensortype) {
            case 'WATER TEMPERATURE (485)':
              break;
            case 'WATER PRESSURE (485)':
              break;
            case 'WATER LEAK SENSOR (485)':
              // -----------------------
              // WATER LEAK SENSOR (485)
              // -----------------------
              cond1 = (sensorData.DATAS[0] >= parseInt(sensorObj.upperlimit1) ) ? `WATER DETECTED`:`NIL`
              ALERT = `${sensorObj.sensorname}... ${cond1}`;
              if ( sensorData.DATAS[0] >= sensorObj.upperlimit1 && sensorObj.alerts.indexOf("ALERT1") > -1) 
              TRIGGERED = true;
              break;
            case 'RH SENSOR (485)':
              // ---------------
              // RH SENSOR (485)
              // ---------------
              label1 = sensorObj.label1;
              label2 = sensorObj.label2;
              let dbHumidity = sensorData.DATAS[0]/10.0;
              let dbTemperature = sensorData.DATAS[1]/10.0;
              // -------------------------------------------
              try {
                dbLimit1 = parseFloat(sensorObj.upperlimit1);
                dbLimit2 = parseFloat(sensorObj.upperlimit2);
              } catch(err) {
                console.log(err);
              }
              try {
                cond1 = dbHumidity > dbLimit1 ? `${label1}=${dbHumidity}C > ${dbLimit1}C`:`${label1}=${dbHumidity}C`;
                cond2 = dbTemperature > dbLimit2 ? `${label2}=${dbTemperature}C > ${dbLimit2}C`:`${label2}=${dbTemperature}C`;
              } catch (err) {
                console.log(err);
              }
              // -----------------------------------------------------
              ALERT = `${sensorObj.sensorname}... ${cond1}|${cond2}`;
              if (sensorData.DATAS[0]/10.0 > sensorObj.upperlimit1 && sensorObj.alerts.indexOf("ALERT1") > -1) TRIGGERED = true;
              if (sensorData.DATAS[1]/10.0 > sensorObj.upperlimit2 && sensorObj.alerts.indexOf("ALERT2") > -1) TRIGGERED = true;
              // --------------------------
              break;
            case 'POWER METER SENSOR (485)':
              // ------------------------
              // POWER METER SENSOR (485)
              // ------------------------
              let UA = sensorData.DATAS2[0];
              let UB = sensorData.DATAS2[1];
              let UC = sensorData.DATAS2[2];
              // --------------------------------
              // console.log(`${typeof UA}..${typeof UB}..${typeof UC} : ${UA} | ${UB} | ${UC}`);
              try {
                UA = UA/10.0;
                UB = UB/10.0;
                UC = UC/10.0;
                dbLimit1 = parseFloat(sensorObj.upperlimit1);
                dbLimit2 = parseFloat(sensorObj.upperlimit2);
                cond1 = (UA > dbLimit1 || UB > dbLimit1 || UC > dbLimit1) ? `UA|UB|UC(V)=${UA}|${UB}|${UC} > ${sensorObj.upperlimit1}V`: `UA|UB|UC(V)=${UA}|${UB}|${UC}`;
              } catch (err){
                console.log(err);
              }
              // -------------------------
              try{
                let IA = sensorData.DATAS2[3]*100 + sensorData.DATAS2[4];
                let IB = sensorData.DATAS2[5]*100 + sensorData.DATAS2[6];
                let IC = sensorData.DATAS2[7]*100 + sensorData.DATAS2[8];
                // ------------------------------
                IA = typeof IA == "number" ? isNaN(IA) ? 0.0 : (IA/1000*20).toFixed(2) : 0.0;
                IB = typeof IB == "number" ? isNaN(IB) ? 0.0 : (IB/1000*20).toFixed(2) : 0.0;
                IC = typeof IC == "number" ? isNaN(IC) ? 0.0 : (IC/1000*20).toFixed(2) : 0.0;
                cond2 = IA > dbLimit2 || IB > dbLimit2 || IC > dbLimit2 ? `IA|IB|IC(A)=${IA}|${IB}|${IC} > ${sensorObj.upperlimit2}A`: `IA|IB|IC(A)=${IA}|${IB}|${IC}`;
                ALERT = `${sensorObj.sensorname}... \t\n${cond1}\t\n${cond2}`;
                if (sensorObj.alerts.indexOf("ALERT1") > -1 && (UA > dbLimit1 || UB > dbLimit1 || UC > dbLimit1))  TRIGGERED = true;
                if (sensorObj.alerts.indexOf("ALERT2") > -1 && (IA > dbLimit2 || IB > dbLimit2 || IC > dbLimit2))  TRIGGERED = true;
              } catch (err) {
                console.log(err);
              }
              // -----------------------
              break;
            case 'ADC CONVERTOR (485)':
              // -------------------
              // ADC CONVERTOR (485)
              // -------------------	
              ALERT = `${sensorObj.sensorname}... ${sensorObj.label1}:${sensorData.DATAS[0]/10.0}|${sensorObj.label2}:${sensorData.DATAS[1]/10.0}`;
              if ( sensorData.DATAS[0] == 0 ||sensorData.DATAS[1] == 0  ) TRIGGERED = true;
              break;
            default:
              console.log(`....${sensorObj.sensortype}...`);
              break;
          }
        } else {
        }
        // -----------
        if (TRIGGERED) {
          console.log(`>>..>>..>> `)
          console.log(`${ALERT}`);
          console.log(`        >>..>>..>> `)
          // -----------
          try {
            decoders.sendWhatsApp(sensorObj,ALERT,1)
          } catch(err) {
          }
          // ------------

        }
        //  ------------------
      })
    })
  })
  // ---------------------
}
decoders.GetAllSensors = function(callback){
  var counter =0;
  var sensorsArr = [];
  decoders.GetAllUsers(function(err,payload){
    // -----------------------------------
    payload.forEach(function(user,index){
      // -------
      counter++;
      // ---------------
      if (user.sensors){
        // -------------
        user.sensors.forEach(function(sensorId,index){
          // -------------
          if (sensorsArr.indexOf(sensorId) == -1){
            // -----------
            sensorsArr.push(sensorId);
            // -----------
          }
        });
      }
      if (counter == payload.length) callback(err,sensorsArr);
    })
  })
}
decoders.GetAllUsers = function(callback){
  var counter=0;
  var usersArr = [];
  _data.list('users',function(err,userIds){
    if(!err && userIds && userIds.length > 0){
      userIds.forEach(function(userId, index){
        _data.read('users',userId,function(err,userData){
          counter ++;
         if(!err && userData){
            usersArr.push(userData)
            if (counter == userIds.length)
              callback(err,usersArr);
          }
        });
      });
    }
  });
}

// SEND TEST MESSAGE TO WHAT'S APP
const WhatsMateAccount = {
  instanceId : "26", // TODO: Replace it with your gateway instance ID here
  clientId : "caliew888@gmail.com", // TODO: Replace it with your Forever Green client ID here
  clientSecret : "74656835e5b04cb0b4e240bc6cd56009"  // TODO: Replace it with your Forever Green client secret here
}
decoders.sendWhatsApp = function(sensor,str,alertPoints) {
  // ------------------
  // NEW LOGICS CONTINUOUS 
  // ------------------
  const query = {dtuId:sensor.dtuId,sensorId:sensor.sensorId};
  // ---------------------
  Alert.find(query).sort({date: -1}).exec((error,alerts) => {
    // ---------------------
    let minutes = 0;
    const today = new Date();
    // --------------------
    if (alerts.length == 0) {
      return;
    }
    // --------------------
    const endDate = new Date(alerts[0].date);
    const lastDateTime = `${endDate.getDate()}/${endDate.getMonth()+1} ${endDate.getHours()}:${endDate.getMinutes()}`
    if (alerts.length > 1) {
      // -------------------
      const endDate1 = new Date(alerts[1].date);
      const lastDateTime1 = `${endDate1.getDate()}/${endDate1.getMonth()+1} ${endDate1.getHours()}:${endDate1.getMinutes()}`
      minutes = parseInt(Math.abs(endDate.getTime() - today.getTime()) / (1000 * 60) );
    }
    // --------------------------------------------
    const record = `.. INTERVAL=[${minutes}] MIN`;
    // str = str + ` LAST ALERT=[${lastDateTime}]` + record;
    if (alertPoints > 1 && minutes > 6.0) return;
    // ------------------------------------------
    try {
      decoders.sendWhatsAppMessage(sensor,str,minutes);
      // ----------
    } catch (err) {
      console.log(`[DECODERS.JS] [WHAT'S APP..SEND MESSAGE] ERROR FOUND <${err}>`);
      _logs.append('_ERROR',`[DECODERS.JS] [WHATSAPP..SEND MESSAGE] ERROR FOUND <${err}>`,()=>{{}});
    }
  });
	// -----------------
}
decoders.sendWhatsAppMessage = function(sensor,str,minutes) {
  // -----------
  console.log(`[${"DECODERS.JS".green}] SENDING WHAT'S APP MESSAGES.... <${str}>`)
  _logs.append('_ERROR',`[DECODERS.JS] ...SENDING WHAT'S APP MESSAGES.... ${str}`,()=>{{}});
  // ---------
  AlertGroup.find({}).exec((error,alertgroups) => {
    // ------------------------------
    alertgroups.forEach( group => {
      // --------------------------
      let nIndex = group.sensor.indexOf(sensor.sensorId);
      // -----------------
      if ( nIndex > -1) {
        decoders.WhatMateMessage(group.name,str);
        var alertData = {
          "datetime": new Date(),
          "message": str
        }
        var logString = JSON.stringify(alertData);
        // ---------------------------------------------
        _logs.append("_ALERT_SENT", logString, function (err) {
          if (!err) {
            debug("Logging to file succeeded");
          } else {
            debug("Logging to file failed");
          }
        });
      }
    })
  });
}
decoders.WhatMateMessage = function(whatsAppGroup,message) {
  // --------------------------
  var jsonPayload = JSON.stringify({
    group_admin: "6597668621", // TODO: Specify the WhatsApp number of the group creator, including the country code
    group_name: whatsAppGroup,   // TODO:  Specify the name of the group
    message: message  // TODO: Specify the content of your message
  });
  // ----------------------
  var whatAppOptions = {
    hostname: "api.whatsmate.net",
    port: 80,
    path: "/v3/whatsapp/group/text/message/" + WhatsMateAccount.instanceId,
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-WM-CLIENT-ID": WhatsMateAccount.clientId,
        "X-WM-CLIENT-SECRET": WhatsMateAccount.clientSecret,
        "Content-Length": Buffer.byteLength(jsonPayload)
    }
  };
  // -----------
  console.log(`[${"DECODERS.JS".yellow}] ... WHAT'S APP SENT <${whatsAppGroup.green}|${message.yellow}>`);
  // ---------------------
  try {
    var request = new http.ClientRequest(whatAppOptions);
    request.end(jsonPayload);
    request.on('response', function (response) {
      // ------
      response.setEncoding('utf8');
      response.on('data', function (chunk) {
        let object = JSON.parse(chunk);
        let _now = new Date();
        let _TIMESTAMP = `${_now.getDate()}/${_now.getMonth()+1}/${_now.getFullYear()} ${_now.getHours()}:${_now.getMinutes()}`
        const { id, result } = object;
        console.log(`[${'DECODERS.JS'.yellow}] ...${_TIMESTAMP}...
         ..${message}..
         RESPONSE RECEIVED FROM WhatsMate WA GATEWAY: 
         RESULT<${String(result).toUpperCase().yellow}>..ID<${String(id).green}>`);
         _logs.append('_WHATSAPP',`[DECODERS.JS] WA GATEWAY : <${_TIMESTAMP}> RESULT<${String(result).toUpperCase()}>..ID<${String(id).toUpperCase()}>`,()=>{{}});
      });
    });   
  } catch (err) {
    console.log(`[${'DECODERS.JS'.yellow}] .. SENDWHATS APP ERROR <${err}>`)
  }  
}
// SENE TEST MESSAGE VIA EMAIL 
decoders.sendEmail = function(sensor,str) {
  // -----
  let testAccount = nodemailer.createTestAccount();
  // create reusable transporter object using the default SMTP transport
  console.log(`[DECODERS.JS] ... SENDING EMAIL...`);
  // --------
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port:465,
    secure:true, // use SSL
    auth: {
      user: 'IOTAlertServer@gmail.com', // generated ethereal user (notification-Alert@affluentengg.com)
      pass: 'Aer0$0ft2022', // generated ethereal password (liewCA2022) (jle20207)
    },
  });
  var mailOptions = {
    from: 'notification-Alert@affluentengg.com',
    to: 'notification-Alert@affluentengg.com,caliew888@gmail.com,ahkongchai77@gmail.com',
    subject: 'ALERT SENT FROM IOT PLATFORM',
    text: str
  };
  // ------
  try {
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        // console.log('Email sent: ' + info.response);
      }
    });
  } catch (err) {
  _logs.append('_ERROR',`[DECODERS.JS] [MAILER..SEND EMAIL] <${err}>`,()=>{{}});
  }
  // ------
}
// -------
// GATEWAY
// -------
decoders.decodeGATEWAY = function (data, callback) {
  // LORA GATEWAY HEARTBEAT
  console.log("..INTO..decoders.decodeGATEWAY..");
};

// Export the decoders
module.exports = decoders;
