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
const flagSCREENOutput_WISENSOR1 = false;
const flagSCREENOutput_WISENSOR2 = false;
const flagSCREENOutput_485SENSOR = false;

const DEBUG_INTOUTPUT  = false;
const DEBUG_ATCMND     = false;

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
      callback(401,{"Message":`[DECODEWISENSOR] URIError URI Malformed at decodeURIComponent ..${_key} ${_data}`});
      return;
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
        callback(401,{"Message":"URIError URI Malformed at decodeURIComponent"});
        return;
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
    decoders.CheckAlert(sensorData,function(errorCode,message) {
      if (errorCode == 200) {
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
              if (err) {
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
          if ( flagSCREENOutput_WISENSOR1 && String(PortID) === '1008' ) console.log(`[${"DECODERS.JS".blue}] <${_TIMESTAMP}> <${String(PortID).green}> ${'WI-SENSOR1'.red} APPEND LOG <${String(fileName).toUpperCase().green}>`);
          if ( flagSCREENOutput_WISENSOR1 && String(PortID) === '1009' ) console.log(`[${"DECODERS.JS".blue}] <${_TIMESTAMP}> <${String(PortID).yellow}> ${'WI-SENSOR1'.red} APPEND LOG <${String(fileName).toUpperCase().green}>`);
          if ( flagSCREENOutput_WISENSOR1 && String(PortID) === '1010' ) console.log(`[${"DECODERS.JS".blue}] <${_TIMESTAMP}> <${String(PortID).red}> ${'WI-SENSOR1'.red} APPEND LOG <${String(fileName).toUpperCase().green}>`);
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
      } else {
        callback(401,message);
      }
    });
  } else {
    callback(401,null);
  }
};
decoders.decodeWISensorV2 = function (PortID, Buffer, callback) {
  // ----------------
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
    callback(402,{"Message":"URIError URI Malformed at decodeURIComponent"})
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
  decoders.CheckAlert(sensorData,function(errorCode,message) {

    if (errorCode == 200) {
      // console.log('decodeWISensorV2',errorCode,message.name,message.dtuId,message.sensorId,message.alertPoints,message.reading);
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
        if ( flagSCREENOutput_WISENSOR2 && String(PortID) === '1008' ) console.log(`[${"DECODERS.JS".blue}] <${_TIMESTAMP}> <${String(PortID).green}> ${'WI-SENSOR2'.yellow} APPEND LOG <${String(fileName).toUpperCase().green}>`);
        if ( flagSCREENOutput_WISENSOR2 && String(PortID) === '1009' ) console.log(`[${"DECODERS.JS".blue}] <${_TIMESTAMP}> <${String(PortID).yellow}> ${'WI-SENSOR2'.yellow} APPEND LOG <${String(fileName).toUpperCase().green}>`);
        if ( flagSCREENOutput_WISENSOR2 && String(PortID) === '1010' ) console.log(`[${"DECODERS.JS".blue}] <${_TIMESTAMP}> <${String(PortID).red}> ${'WI-SENSOR2'.yellow} APPEND LOG <${String(fileName).toUpperCase().green}>`);
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
    } else {
      callback(402,message);
    }
  });
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
  // --------------------------
  let DataArr1 = DataArr[0].split("2C");
  if (DataArr1.length > 2) DataArr1[1] = `${DataArr1[1]}2C${DataArr1[2]}`;
  let DataArr2 = DataArr1[0].split("3A");
  //  ------------------------------
  if (DataArr1.length < 2) {
    console.log(`[${'DECODERS.JS'.green}] .. ***`)
    console.log(`[${'DECODERS.JS'.green}] .. [0D|${DataArr.length}]=<${DataArr}>`)
    console.log(`[${'DECODERS.JS'.green}] .. [2C|${DataArr1.length}]=<${DataArr1}>`);
    console.log(`[${'DECODERS.JS'.green}] .. ***`)
    callback(4031,`DATAARR1 LENGTH < 2 ..${DataArr}`);
    return;
  }
  // --------------------------------
  if ( DataArr1.length > 0 && DataArr2.length > 0) {
    let DTUID, SENSORID,FUNCID,NDATA,TIMESTAMP
    try
    {
      const _dateTime = new Date();
      DTUID = decodeURIComponent(DataArr2[1].replace(/(..)/g, "%$1"));
      SENSORID = parseInt(DataArr[0].substr(index+2,2), 16);
      FUNCID = parseInt(DataContent.substring(2, 4), 16);
      NDATA = parseInt(DataContent.substring(4, 6), 16) / 2;
      DATESTAMP = `${_dateTime.getDate()}/${_dateTime.getMonth()+1}`
      TIMESTAMP = `${String(_dateTime.getHours()).padStart(2,"0")}:${String(_dateTime.getMinutes()).padStart(2,"0")}`
      // --------------
      if (FUNCID !== 3)
      {
        console.log(`[${'DECODERS.JS'.green}] ..${'DECODE485SENSOR'.red}.. PORT=${String(PortID).yellow} .[${FUNCID}][401]..<${hex_to_ascii(DataHEADER)}|${hex_to_ascii(DataContent)}>.. `);
        _logs.append('_ERROR',`[DECODERS.JS] ..DECODE485SENSOR.. PORT=${PortID} [401]..<${hex_to_ascii(DataHEADER)}|${hex_to_ascii(DataContent)}>.. `,()=>{});
        callback(4032,`FUNCID !== 3 ...${FUNCID}`);
        return;
      }
    }
    catch (err){
      _logs.append('_ERROR',`[DECODERS.JS] ..DECODE485SENSOR.. PORT=${PortID} .[1].${hex_to_ascii(DataHEADER)}|${hex_to_ascii(DataContent)}..`,()=>{});
      _logs.append('_ERROR',`[DECODERS.JS] ..DECODE485SENSOR..PORT=${PortID} [402]..<${DataHEADER}>.. `,()=>{});
      callback(4033,{DTUID,SENSORID,FUNCID,RCV_BYTES:[],NDATA:0,DATAS:[]});
      return;
    }
    //  -------------------
    let sensorDataArr = []
    let sensorDataFloatArr = []
    let sensorDataIntArr = [];
    let RCV_BYTES = [];
    // ----------------
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
        console.log(`[${'DECODERS.JS'.green}] ..${'DECODE485SENSOR'.red}.. PORT=${String(PortID).yellow} .[4] ConvDATA IS NULL ${ConvDATA}`)
        return;
      } else {
        sensorDataArr.push(ConvDATA);
      }
    }
    // -------------
    // GET THE FLOAT
    // -------------
    if (RCV_BYTES.length%2 == 0) {
      // -------------------------
      for (let i = 0; i < RCV_BYTES.length/2; i++) {
        // ---------------
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
    // ------------
    if(typeof fileName === "undefined" || hasNull(fileName)){
      // ----------
      _logs.append('_ERROR',`[DECODERS.JS] PORT=${String(PortID).green} .... FILENAME=${String(fileName)} IS UNDEFINED OR IS NULL`,()=>{});
      callback(4034,`[DECODERS.JS] PORT=${String(PortID).green} .... FILENAME=${String(fileName)} IS UNDEFINED OR IS NULL`)
      return;
    }
    // -----------------------------------------------------
    // CHECK ATCMND_SENT1 AND REMOVE IF ANY MATCHED AN UPDATE
    // -----------------------------------------------------
    _data.read("rawData",'ATCMND_SENT2',function(err,CMD_SENT) {
      // --------
      DEBUG_INTOUTPUT && console.log(`[${'DECODERS.JS'.green}] ..${'DECODE485SENSOR'.red}.. PORT=${String(PortID).yellow} .....[4]..DATA READ ATCMND_SENT2 =<${String(err).green}>..`);
      DEBUG_INTOUTPUT && _logs.append('_ERROR',`[DECODERS.JS] ..DECODE485SENSOR.. PORT=${PortID} .....[4]..DATA READ ATCMND_SENT2 =<${err}>..`,()=>{});
      // --------
      if (!err || err) {
        // -------------------
        DEBUG_INTOUTPUT && console.log(`[${'DECODERS.JS'.green}] ..${'DECODE485SENSOR'.red}.. PORT=${String(PortID).yellow} .....[5]..CMD_SENT = <${String(typeof CMD_SENT).green}>..`);
        DEBUG_INTOUTPUT && _logs.append('_ERROR',`[DECODERS.JS] ..DECODE485SENSOR.. PORT=${PortID} .....[5]..CMD_SENT = <${typeof CMD_SENT}>..`,()=>{});
        // ---------------------------------------
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
            // -------
            ObjData['SENSORTYPE'] = CHECKOBJS[0].SENSORTYPE;
            sensorData['SENSORTYPE'] = CHECKOBJS[0].SENSORTYPE;
            // --------
            if (CHECKOBJS[0].EXTFILE && CHECKOBJS[0].EXTFILE === 'STATE') { 
              fileName = `${fileName}_${CHECKOBJS[0].EXTFILE}`;
              _KEY = `${_KEY}A`
            }
          } else {
            console.log(`[${'DECODERS.JS'.green}] ..${'DECODE485SENSOR'.red}.. PORT=${String(PortID).yellow} ..decoders.GET_ATCMND=${String(CHECKOBJS.length).red} ..FILENAME=${String(fileName).green} `);
            _logs.append('_ERROR',`[DECODERS.JS] ..DECODE485SENSOR.. PORT=${PortID} .. decoders.GET_ATCMND=${CHECKOBJS.length} ..FILENAME=${fileName}`,()=>{});
          }
          // --------
          if ( decoders.sensors.hasOwnProperty(_KEY)){
            delete decoders.sensors[_KEY];
          }
          decoders.sensors[_KEY] = ObjData;
          // ------------------------------
          // UPDATE ATCMND_SENT1
          // UPDATE _485SENSORS
          // ------------------
          // ---------
          DEBUG_INTOUTPUT && console.log(`[${'DECODERS.JS'.green}] ..${'DECODE485SENSOR'.red}.. PORT=${String(PortID).yellow} .....[6]..DATA UPDATE _485SENSORS =<${err.green}>..`);
          DEBUG_INTOUTPUT && _logs.append('_ERROR',`[DECODERS.JS] ..DECODE485SENSOR.. PORT=${PortID} .....[6]..DATA UPDATE _485SENSORS =<${err}>..`,()=>{});
          // --------
          _data.update('rawData','_485SENSORS',decoders.sensors,function(err) {} );
          // ------
        }
        // ---------------------------------------
        DEBUG_INTOUTPUT && console.log(`[${'DECODERS.JS'.green}] ..${'DECODE485SENSOR'.red}.. PORT=${String(PortID).yellow} .....[7]..DATA READ SENSOR FILE =<${String(fileName).green}>..`);
        DEBUG_INTOUTPUT && _logs.append('_ERROR',`[DECODERS.JS] ..DECODE485SENSOR.. PORT=${PortID} .....[7]..DATA READ SENSOR FILE=<${fileName}>..`,()=>{});
        // ----------
        _data.read("sensors",fileName,function(err,sensorObj) {
          // ----------------------
          if (NDATA == 50) sensorData["DATAS2"] = sensorObj["DATAS2"];      
          if (NDATA == 35) sensorData["DATAS1"] = sensorObj["DATAS1"];
          // --------------------------------------------
          // CREATE NEW SENSOR IF SENSOR IS NOT AVAILABLE
          // --------------------------------------------
          DEBUG_INTOUTPUT && console.log(`[${'DECODERS.JS'.green}] ..${'DECODE485SENSOR'.red}.. PORT=${String(PortID).yellow} .....[8]..DATA UPDATE SENSOR FILE =<${String(fileName).green}>..`);
          DEBUG_INTOUTPUT && _logs.append('_ERROR',`[DECODERS.JS] ..DECODE485SENSOR.. PORT=${PortID} .....[8]..DATA UPDATE SENSOR FILE=<${fileName}>..`,()=>{});
          // ----------
          _data.update("sensors", fileName, sensorData, function (err) {
            // -------------------
            if (err) { 
              // CREATE NEW FILE IF SENSOR RETURN TRUE IN UPDATE - ERROR IN UPDATING
              _data.create("sensors", fileName, sensorData, function (err) {
                if (!err) {
                  console.log(`[${'DECODERS.JS'.green}] ${'DECODE485SENSOR'.blue} COULD NOT CREATE 485 SENSOR <${fileName.red}>`);
                  callback(4035,`[${'DECODERS.JS'.green}] ${'DECODE485SENSOR'.blue} COULD NOT CREATE 485 SENSOR <${fileName.red}>`)
                  return;
                } else {
                  console.log(`[${'DECODERS.JS'.green}] ${'DECODE485SENSOR'.blue} DATA.CREATE <${String(fileName).toUpperCase().green}> STATUS <${String(err).yellow}>`)
                }
              });
            } 
          });
          // ----------------------------
          // Convert the data to a string
          // ----------------------------
          var logString = JSON.stringify(sensorData);
          let _now = new Date();
          let _TIMESTAMP = `${_now.getDate()}/${_now.getMonth()+1}/${_now.getFullYear()} ${_now.getHours()}:${_now.getMinutes()}`
          if ( flagSCREENOutput_485SENSOR && String(PortID) === '1008' ) console.log(`[${'DECODERS.JS'.green}] <${_TIMESTAMP}> <${String(PortID).green}> ${'DECODE485SENSOR'.blue} APPEND LOG <${String(fileName).toUpperCase().green}>`);
          if ( flagSCREENOutput_485SENSOR && String(PortID) === '1009' ) console.log(`[${'DECODERS.JS'.green}] <${_TIMESTAMP}> <${String(PortID).yellow}> ${'DECODE485SENSOR'.blue} APPEND LOG <${String(fileName).toUpperCase().green}>`);
          if ( flagSCREENOutput_485SENSOR && String(PortID) === '1010' ) console.log(`[${'DECODERS.JS'.green}] <${_TIMESTAMP}> <${String(PortID).red}> ${'DECODE485SENSOR'.blue} APPEND LOG <${String(fileName).toUpperCase().green}>`);
          // --------------
          // Stored in Logs
          // --------------
          if (sensorData.SENSORTYPE === null) {
            // console.log(`[${'DECODERS.JS'.green}] ..${'DECODE485SENSOR'.red}.. PORT=${String(PortID).yellow} ..SENSORTYPE=${String(sensorData.SENSORTYPE).red} ..FILENAME=${String(fileName).green} `);
            // _logs.append('_ERROR',`[DECODERS.JS] ..DECODE485SENSOR.. PORT=${PortID} .. SENSORTYPE=${sensorData.SENSORTYPE} ..FILENAME=${fileName}`,()=>{});
            callback(4037,`FILENAME=${fileName}  ... SENSOR.TYPE=${String(sensorData.SENSORTYPE).toUpperCase()}`);
            return;
          }
          // --------
          _logs.append(fileName, logString, function (err) {
            // console.log(`[${'DECODERS.JS'.green}] ..${'DECODE485SENSOR'.red}.. PORT=${String(PortID).yellow} ..... FILE=<${String(fileName).green}> .... TYPE=<${String(sensorData.SENSORTYPE).red}>`);
            if (!err) {
              debug("Logging to file succeeded");
            } else {
              debug("Logging to file failed");
            }
          });
          // -------------------------
          // CALL TO CHECK ON ALERTING
          //  ------------------------
          decoders.CheckAlert(sensorData,function(errorCode,message) {
            // ---------------------
            if (errorCode !== 200) {
              callback(4038,`..CHECKALERT.. ${message}`)
              return;
            }
            callback(200,sensorData)
            return;
          });
        })
      }
    })
    // ------
  } else {
    // ----------------
    console.log(`[DECODERS.JS] ..DECODE485SENSOR.. CALLBACK 404...`);
    _logs.append('_ERROR',`[DECODERS.JS] ..DECODE485SENSOR..PORT=${PortID} [404]..<>.. `,()=>{});
    callback(4039,'ERROR...');
    return;
    // ----------------
  }
};
// -----------
// F8LST (DTU)
// -----------
function getSensorObj(PORTID,DTUID,MODE,SENSORID,RCV_BYTES) {
  let sensorObj = {};
  sensorObj['TIMESTAMP'] = new Date();
  sensorObj['PORT.ID'] = PORTID;
  sensorObj['MODE'] = MODE,
  sensorObj['DTU.ID'] = DTUID;
  sensorObj['SENSOR.ID'] = SENSORID;
  sensorObj['RCV.BYTES'] = RCV_BYTES;
  let nDATA = RCV_BYTES.length/2/2;
  for (let i = 0; i < nDATA; i++) {
    let _BYTE = RCV_BYTES.substr(i*4,4);
    let _DATA = parseInt(_BYTE,16);
    if (i==0) sensorObj['RH']= _DATA;
    if (i==1) sensorObj['TEMP']= _DATA;
    if (i==2) sensorObj['CO2']= _DATA;
  }
  return sensorObj;
}
decoders.decodeF8L10ST= function(PortID,buffer,callback) {
  // -------------------------
  const _dateTime = new Date();
  const hourNow = String(_dateTime.getHours()).padStart(2, "0");
  const minuteNow = String(_dateTime.getMinutes()).padStart(2, "0");
  // ------------
  let _DATE = `${_dateTime.getDate()}/${_dateTime.getMonth()+1}`
  let _TIME = `${hourNow}:${minuteNow}`;
  let _PRE = String(buffer).toUpperCase().substring(0,12);
  let _DATA = String(buffer).toUpperCase().substring(12);
  // ------------
  let _HEADER = _PRE.substr(0,2);
  let _BIT1 = _PRE.substr(8,2);
  let _BIT2 = _PRE.substr(10,2);
  let _DTUID = parseInt(_BIT2+_BIT1,16);
  let _LENGTH = parseInt(_DATA.substr(2,2),16);
  let _CMND = parseInt(_DATA.substr(4,2),16);
  let _NDATA = parseInt(_DATA.substr(10,2),16);
  let _DATAHEX = _DATA.substr(12,_NDATA*2);
  let _SENSORID = parseInt(_DATA.substr(6,2),16);;
  let _FUNCTID = parseInt(_DATA.substr(8,2),16);;
  // ---------------------------------------------
  // _logs.append('_ERROR', `[SERVER.JS]  ..DECODEF8L10ST...${_PRE}...[${_BIT1}${_BIT2}]...<${_BIT2+_BIT1}>=${_DTUID}...`,()=>{});
  let _CRC = _DATA.substr(14,2);
  // -------
  let _READING1,_READING2
  let _MODE,_TYPE,_PORT;
  switch (Number(_CMND)) {
    case 0:
      _MODE = "RESERVE";
      break;
    case 1:
      _MODE = "RS232";
      break;
    case 2:
      _MODE = "RS485";
      break;
    case 3: 
      _MODE = "IO";
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
      break;
    case 4:
      _MODE = "DATA.ACQ"
      break;
    case 5:
      _MODE = "IO.CTRTL";
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
      break;
    case 6:
      _MODE = 'POWER-ON';
      _FUNCTID = -1
      _DATAHEX = _DATA.substr(6,8);
      break;
    case 7:
      _MODE = 'HEART-BEAT'
      _FUNCTID = -1
      _DATAHEX = _DATA.substr(6,8);
      break;
    case 8:
      _MODE = 'POWER-OFF';
      _FUNCTID = -1
      _DATAHEX = _DATA.substr(6,8);
      break;
    default:
      _MODE = 'RESERVE'
      break;
  }
  // -------------------------------
  _data.read('teawarehouse','settings',function(err,settingData) {
    // console.log(`[DECODEF8L10ST]..CHECK...DTU=<${_DTUID}> DATA=${_DATA}...DATAHEX=${_DATAHEX} ...CMND=${_CMND} ..MODE=${_MODE}  FUNCT=${_FUNCTID}`)
    if (settingData.hasOwnProperty(_DTUID)) {
      let _limits = settingData[_DTUID];
      let ObjSensor = getSensorObj(PortID,_DTUID,_MODE,_SENSORID,_DATAHEX);
      let WhatsAppGroup = 'BALAKONG茶仓温控监管中心';
      if (ObjSensor.MODE === 'RS485') {
        let _NAME = _limits.NAME;
        let _TEMP = ObjSensor.TEMP/10.0;
        let _RH = ObjSensor.RH/10.0;
        let _CO2 = ObjSensor.CO2 + _limits.CO2.offset;
        const _FLAG = new Array(6).fill(0);
        if (_TEMP > _limits.Temperature.max)  {
          _FLAG[0] = 1;
        }
        if (_TEMP < _limits.Temperature.min)  {
          _FLAG[1] = 1;
        }
        if (_RH > _limits.Humidity.max)       {
          _FLAG[2] = 1;
        }
        if (_RH < _limits.Humidity.min)       {
          _FLAG[3] = 1;
        }
        if (_CO2 > _limits.CO2.max)           {
          _FLAG[4] = 1;
        }
        if (_CO2 < _limits.CO2.min)           {
          _FLAG[5] = 1;
        }
        // ----------
        let _AlertObject = { TIMESTAMP:new Date(), DTU:_DTUID, NAME:_NAME, TEMP:_TEMP, RH:_RH, CO2:_CO2, FLAG:_FLAG, LIMITS: _limits }
        var jsonPayload = JSON.stringify(_AlertObject);
        _FLAG.some(flag=>flag==1) && _logs.append('_TEAWAREHOUSEALERTS',jsonPayload,()=>{});
      }
    } 
  })
  if (_CMND <= 8) {
    callback(200,{ _DATE, _TIME, PortID, _DTUID, _SENSORID, _FUNCTID, _NDATA, _DATA, _MODE, _PORT, _TYPE, _DATAHEX, _READING1, _READING2 });
  } else {
    callback(404, { _DATE, _TIME, PortID, _DTUID, _SENSORID, _FUNCTID, _NDATA, _DATA, _MODE, _PORT, _TYPE, _DATAHEX, _READING1, _READING2 });
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
    callback(200,{ _DATE, _TIME, _DTUID, _DATA, _MODE, _PORT, _TYPE, _DATAHEX, _DATAINT, _READING2 });
  } else {
    callback(405, null);
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
    const sensorIDLabel = sensorData.modelID ? String(sensorData.modelID).toUpperCase() : `${sensorData.DTUID}-${sensorData.SENSORID}`;
    // -----------------------
    if (sensorIDLabel === "") {
      callback(406,'STATUS CODE=406 ...SENSOR ID LABEL INVALID...');
      return;
    }
    const query = sensorData.modelID ? {sensorId : sensorIDLabel} : { dtuId :sensorData.DTUID, sensorId : sensorData.SENSORID };
    if (sensorData.modelType !== 'Wi-SHT10' && sensorData.modelType !== 'Wi-SHT10A') {
      // console.log(`[${"DECODERS.JS".green}] CHECK ALERT...[${sensorIDLabel.red}]...${query}`);
    }
    // ----------------------------------------
    Sensor.find(query).exec( (error,sensors) => {
      // ------------
      let name, dtuId, sensorId, type, sensorType, reading, sign, alertPoints;
      name = sensors.length > 0 ? sensors[0].name : '';
      dtuId = sensors.length > 0 ? sensors[0].dtuId : null;
      sensorId = sensors.length > 0 ? sensorIDLabel : null;
      type = 'warning';
      sign = '=';
      // ----------
      if (sensors.length > 0 && sensors[0].type==='WISENSOR') {
        // -----------------------------
        let limitTEMPMIN = Number(sensors[0].limits['TEMPERATURE_MIN']) < Number(sensors[0].limits['TEMPERATURE_MAX']) ? Number(sensors[0].limits['TEMPERATURE_MIN']) : Number(sensors[0].limits['TEMPERATURE_MAX']);
        let limitTEMPMAX = Number(sensors[0].limits['TEMPERATURE_MAX']) > Number(sensors[0].limits['TEMPERATURE_MIN']) ? Number(sensors[0].limits['TEMPERATURE_MAX']) : Number(sensors[0].limits['TEMPERATURE_MIN']);
        let limitHUMDMAX = Number(sensors[0].limits['HUMIDITY_MAX']) > Number(sensors[0].limits['HUMIDITY_MAX']) ? Number(sensors[0].limits['HUMIDITY_MAX']) : Number(sensors[0].limits['HUMIDITY_MAX']);
        let limitHUMDMIN = Number(sensors[0].limits['HUMIDITY_MIN']) > Number(sensors[0].limits['HUMIDITY_MIN']) ? Number(sensors[0].limits['HUMIDITY_MIN']) : Number(sensors[0].limits['HUMIDITY_MIN']);
        const _TEMP = Number(sensorData['Temperature']).toFixed(2);
        const _HUMD = sensorData.hasOwnProperty('Humidity') ? Number(sensorData['Humidity']).toFixed(2) : -1;
        // -------------------
        reading = _TEMP;
        alertPoints = (sensors && sensors[0] && sensors[0].alertpoint) ? sensors[0].alertpoint : 1;
        // -----------------
        // :BA-75-79-51-2B-0D :B0-F6-BF-85-9E-13 
        if (_TEMP < 0) {
          type = 'TEMPERATURE';
          sign = '<';
          _logs.append('_ALERTCX',`[DECODERS.JS] ${sensorIDLabel} ${_TEMP}`,()=>{{}});
          if ( !sensorIDLabel.includes('BA-75-79-51-2B-0D')  && !sensorIDLabel.includes('B0-F6-BF-85-9E-13')) {
            _logs.append('_ALERTCX',`[DECODERS.JS] ${sensorIDLabel} ${_TEMP}`,()=>{{}});
            console.log(`[DECODERS.JS] <${name}> ..${String(sensorData.modelID).toUpperCase()} ${_TEMP}`)
            callback(406,{"statusCode":406,name,sensorIDLabel,reading,limitTEMPMIN,limitTEMPMAX});
            return;
          }
        }
        if (_TEMP > 0.0 && (sensorIDLabel.includes('BA-75-79-51-2B-0D') || sensorIDLabel.includes('B0-F6-BF-85-9E-13'))) {
          type = 'TEMPERATURE'
          callback(406,{"statusCode":406,name,sensorIDLabel,reading,limitTEMPMIN,limitTEMPMAX});
          return;
        }
        if (_TEMP > limitTEMPMAX) {
          try {
            // -------------
            sensorType = 'TEMPERATURE';
            sign = '>';
            const newAlert = new Alert({name,dtuId,sensorId,type,sensorType,reading,limit:limitTEMPMAX});
            newAlert.save();
            // -------------
            let _AlertObject = { TIMESTAMP:new Date(), TYPE:type, sensorType:'TEMP', sign, DTU:dtuId, SENSORID:sensorId, NAME:name, VALUE:_TEMP, LIMITS: limitTEMPMAX }
            var jsonPayload = JSON.stringify(_AlertObject);
            _logs.append('_TDKALERTS',jsonPayload,()=>{});
            // -------------
            decoders.sendWhatsApp(sensors[0],`${sensors[0].name} TEMPERATURE=${_TEMP}C > LIMIT ${limitTEMPMAX}C`,alertPoints,_AlertObject);
            callback(200,newAlert)
            return;
            // -------------
          } catch (err) {
            callback(406,{"statusCode":406,err})
            return;
          }
        } 
        if (_TEMP < limitTEMPMIN) {
          try {
            // -------------
            sign = '<';
            sensorType = 'TEMPERATURE';
            const newAlert = new Alert({name,dtuId,sensorId,type,sensorType,reading,limit:limitTEMPMIN});
            newAlert.save();
            // -------------
            let _AlertObject = { TIMESTAMP:new Date(), TYPE:type, sensorType:'TEMP', sign, DTU:dtuId, SENSORID:sensorId, NAME:name, VALUE:_TEMP, LIMITS: limitTEMPMIN }
            var jsonPayload = JSON.stringify(_AlertObject);
            _logs.append('_TDKALERTS',jsonPayload,()=>{});
            // -------------
            decoders.sendWhatsApp(sensors[0],`${sensors[0].name} TEMPERATURE=${_TEMP}C < LIMIT ${limitTEMPMIN}C`,alertPoints,_AlertObject)
            callback(200,newAlert);
            return;
            // -------------
          } catch (err) {
            callback(406,{"statusCode":406,err})
            return;
          }
        }
        // -----
        if (_HUMD > 0 ) {
          sensorType = 'HUMIDITY';
          reading = _HUMD;
          if (_HUMD > limitHUMDMAX) {
            try {
              // -------------
              sign = '>';
              const newAlert = new Alert({name,dtuId,sensorId,type,sensorType,reading,limit:limitHUMDMAX});
              newAlert.save();
              // -------------
              let _AlertObject = { TIMESTAMP:new Date(), TYPE:type, sensorType:'RH', sign, DTU:dtuId, SENSORID:sensorId, NAME:name, VALUE:_HUMD, LIMITS: limitHUMDMAX }
              var jsonPayload = JSON.stringify(_AlertObject);
              _logs.append('_TDKALERTS',jsonPayload,()=>{});
              // -------------
              decoders.sendWhatsApp(sensors[0],`${sensors[0].name} HUMIDITY=${_HUMD}% > LIMIT ${limitHUMDMAX}%`,alertPoints,_AlertObject);
              callback(200,newAlert)
              return;
              // -------------
            } catch (err) {
              callback(406,{"statusCode":406,err})
              return;
            }
          } 
          if (_HUMD < limitHUMDMIN) {
            try {
              // -------------
              sign = '<';
              const newAlert = new Alert({name,dtuId,sensorId,type,sensorType,reading,limit:limitHUMDMIN});
              newAlert.save();
              // -------------
              let _AlertObject = { TIMESTAMP:new Date(), TYPE:type, sensorType:'RH', sign, DTU:dtuId, SENSORID:sensorId, NAME:name, VALUE:_HUMD, LIMITS: limitHUMDMIN }
              var jsonPayload = JSON.stringify(_AlertObject);
              _logs.append('_TDKALERTS',jsonPayload,()=>{});
              // -------------
              decoders.sendWhatsApp(sensors[0],`${sensors[0].name} HUMIDITY=${_HUMD}% < LIMIT ${limitHUMDMIN}%`,alertPoints,_AlertObject);
              callback(200,newAlert)
              return;
              // -------------
            } catch (err) {
              callback(406,{"statusCode":406,err})
              return;
            }
          } 
        }
        callback(200,{name,dtuId,sensorId,alertPoints,reading})
      }
      if (sensors.length > 0 && sensors[0].type!=='WISENSOR'){
        let AlertFlag= false;
        let value;
        let label;
        sign = '<';
        let _LIMIT;
        alertPoints = (sensors && sensors[0] && sensors[0].alertpoint) ? sensors[0].alertpoint : 1;
        sensorType = sensorData.SENSORTYPE;
        switch (sensorData.SENSORTYPE) {
          case 'AIRFLOW-VEL':
            label = 'AIR FLOW VELOCITY';
            value = (Number(sensorData.DATAS[0])/10).toFixed(2);
            if (value < 0.01) AlertFlag = true;
            // console.log(`[${"DECODERS.JS".green}] <${sensorData.SENSORTYPE.yellow}> [${sensorData.DTUID.red}-${String(sensorData.SENSORID).red}] <${String(sensors.length).yellow}> NAME=<${String(name).green}> LABEL=<${String(label).red}>  VALUE=<${String(value).green}> ALERT=${String(AlertFlag).toUpperCase().yellow}`);
            break;
          case 'AIR-PRES':
            label = 'AIR PRESSURE';
            value = (Number(parseFloat(`0x${sensorData.RCV_BYTES[0]}${sensorData.RCV_BYTES[1]}`)/100)).toFixed(2);
            if (value < 0.01) AlertFlag = true;
            // console.log(`[${"DECODERS.JS".green}] <${sensorData.SENSORTYPE.yellow}> [${sensorData.DTUID.red}-${String(sensorData.SENSORID).red}] <${String(sensors.length).yellow}> NAME=<${String(name).green}> LABEL=<${String(label).red}>  VALUE=<${String(value).green}> ALERT=${String(AlertFlag).toUpperCase().yellow}`);
            break;
          case 'WATER-PRES':
            label = 'WATER PRESSURE';
            value = (Number(parseFloat(`0x${sensorData.RCV_BYTES[0]}${sensorData.RCV_BYTES[1]}`)/100)).toFixed(2);
            if (value < 0.01) AlertFlag = true;
            // console.log(`[${"DECODERS.JS".green}] <${sensorData.SENSORTYPE.yellow}> [${sensorData.DTUID.red}-${String(sensorData.SENSORID).red}] <${String(sensors.length).yellow}> NAME=<${String(name).green}> LABEL=<${String(label).red}>  VALUE=<${String(value).green}> ALERT=${String(AlertFlag).toUpperCase().yellow}`);
            break;
          case 'WATER-TEMP':
            label = 'WATER TEMPERATURE';
            value = (Number(sensorData.DATAS[1])/10).toFixed(2);
            // console.log(`[${"DECODERS.JS".green}] <${sensorData.SENSORTYPE.yellow}> [${sensorData.DTUID.red}-${String(sensorData.SENSORID).red}] <${String(sensors.length).yellow}> NAME=<${String(name).green}> LABEL=<${String(label).red}>  VALUE=<${String(value).green} C> ALERT=${String(AlertFlag).toUpperCase().yellow}`);
            break;
          case 'AIRFLOW-TEMP':
            label = 'AIR TEMPERATURE';
            let _TEMP = (Number(sensorData.DATAS[1])/10).toFixed(2);
            let _RH = (Number(sensorData.DATAS[0])/10).toFixed(2);
            // console.log(`[${"DECODERS.JS".green}] <${sensorData.SENSORTYPE.yellow}> [${sensorData.DTUID.red}-${String(sensorData.SENSORID).red}] <${String(sensors.length).yellow}> NAME=<${String(name).green}> LABEL=<${String(label).red}>  VALUE=<${String(_RH).green} %/${String(_TEMP).green} C> ALERT=${String(AlertFlag).toUpperCase().yellow}`);
            break;
          case 'PWR-METER-STATE':
            break;
          case 'PWR-METER-POWER':
            break;
          default:
            console.log(sensorData);
            // console.log(sensors[0])
            break;
        }
        if (AlertFlag) {
          const newAlert = new Alert({name,dtuId,sensorId,type,sensorType,reading,limit:0});
          newAlert.save();
          // -------------
          let _AlertObject = { TIMESTAMP:new Date(), TYPE:type, sensorType, sign, DTU:dtuId, SENSORID:sensorId, NAME:name, VALUE:value, LIMITS: 0.01 }
          var jsonPayload = JSON.stringify(_AlertObject);
          _logs.append('_TDKALERTS',jsonPayload,()=>{});
          // -------------
          decoders.sendWhatsApp(sensors[0],`${sensors[0].name} ${label}=0.0`,alertPoints,_AlertObject)
          callback(200,newAlert);
        }
        // -------------
        return;
      }
    })
  } catch (err) {
    callback(406,{"statusCode":406,err});
    return;
  }
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
decoders.sendWhatsApp = function(sensor,str,alertPoints,newAlert) {
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
    if (alerts.length > 1) {
      // --------
      const endDate = new Date(alerts[0].date);
      const lastDateTime = `${endDate.getDate()}/${endDate.getMonth()+1} ${endDate.getHours()}:${endDate.getMinutes()}`
      // -------------------
      const endDate1 = new Date(alerts[1].date);
      const lastDateTime1 = `${endDate1.getDate()}/${endDate1.getMonth()+1} ${endDate1.getHours()}:${endDate1.getMinutes()}`
      minutes = parseInt(Math.abs(endDate.getTime() - today.getTime()) / (1000 * 60) );
      const record = `.. INTERVAL=[${minutes}] MIN`;
      // str = str + ` LAST ALERT=[${lastDateTime}]` + record;
      if (alertPoints > 1 && minutes > 6.0) return;
    }
    // ------------------------------------------
    try {
      decoders.sendWhatsAppMessage(sensor,str,newAlert,minutes);
      // ----------
    } catch (err) {
      console.log(`[DECODERS.JS] [WHAT'S APP..SEND MESSAGE] ERROR FOUND <${err}>`);
      _logs.append('_ERROR',`[DECODERS.JS] [WHATSAPP..SEND MESSAGE] ERROR FOUND <${err}>`,()=>{{}});
    }
  });
	// -----------------
}
decoders.sendWhatsAppMessage = function(sensor,str,newAlert,minutes) {
  // -----------
  let label = sensor.type === 'WISENSOR' ? sensor.sensorId : `${sensor.dtuId}_${sensor.sensorId}`;
  console.log(`[${"DECODERS.JS".green}] ALERT .[${label.red}]. ${str.yellow}`)
  // ---------
  _data.read('alerts','settings',function(err,alertsData) {
    // console.log(alertsData);
  });
  // -------
  AlertGroup.find({}).exec((error,alertgroups) => {
    // ------------------------------
    alertgroups.forEach( group => {
      // --------------------------
      let nIndex = group.sensor.indexOf(label);
      // -----------------
      if ( nIndex > -1) {
        var jsonPayload = JSON.stringify(newAlert);
        // decoders.WhatMateMessage(group.name,str);
        var alertData = {
          "datetime": new Date(),
          "message": str
        }
        var logString = JSON.stringify(alertData);
        // ---------------------------------------------
        _logs.append(group.name, jsonPayload, function (err) {
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
  console.log(`[${"DECODERS.JS".yellow}] <${whatsAppGroup.green}> ..<${message.yellow}>..`);
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
        console.log(`[${'DECODERS.JS'.yellow}] ...${_TIMESTAMP}...STATUS CODE=${response.statusCode}
         ..${message}.. RESPONSE RECEIVED FROM WhatsMate WA GATEWAY: 
         RESULT<${String(result).toUpperCase().yellow}>..ID<${String(id).green}>`);
         _logs.append('_WHATSAPP',`[DECODERS.JS] WA GATEWAY : <${_TIMESTAMP}> STATUS CODE=${response.statusCode} RESULT<${String(result).toUpperCase()}>..ID<${String(id).toUpperCase()}>`,()=>{{}});
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
