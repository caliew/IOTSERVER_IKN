/*
 * Decoders for TCP Received BYTES
 */

// Dependencies
var _data = require("./data");
var _logs = require("./logs");
var util = require("util");
var debug = util.debuglog("workers");

var http = require('http');
var https = require('https');

const Sensor = require('../models/Sensor');
const AlertGroup = require('../models/AlertGroup');
const Alert = require('../models/Alert');

// ---------------------------------

const nodemailer = require("nodemailer");
const { getDate } = require("date-fns");
const whatsAppClient = require("@green-api/whatsapp-api-client");

let COUNTER_485 = 0;
const _DEBUG = false;
const _FALSELIMITS = {
  'Temperature': { "MIN": -90, "MAX": 200 },
  'Humidity': { "MIN": 0, "MAX": 100 },
  "Pressure": { "MIN": -100, "MAX": 100 }
}
const _CHECKID = ['BA-82-D1-99-71-79'];

const flagSCREENOutput_WISENSOR1 = false;
const flagSCREENOutput_WISENSOR2 = false;
const flagSCREENOutput_485SENSOR = false;

const DEBUG_INTOUTPUT = false;
const DEBUG_ATCMND = false;

// -----------------
// Utility Functions
// -----------------
function hasNull(s) {
  // /\$\d+/g
  let pattern = /\x04/;
  let _Flag1 = true;
  let _Flag2 = true;
  try {
    _Flag1 = s.match(/\x00/i) === null ? false : true
    _Flag2 = s.match(/\x04/i) === null ? false : true
  } catch (err) {
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
    for (var i = str.length - 1; i >= 0; i -= 1) {
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
  for (i = 0; i < mantissa.length; i += 1) {
    float += parseInt(mantissa[i]) ? Math.pow(2, exp) : 0;
    exp--;
  }
  return float * sign;
}
function getDateTimeStamp() {
  let _now = new Date();
  let _TIMESTAMP = `${_now.getDate()}/${_now.getMonth() + 1}/${_now.getFullYear()} ${_now.getHours()}:${_now.getMinutes()}`
  return _TIMESTAMP
}
// -------------------------------------
// Instantiate the Decoder module object
// -------------------------------------
var decoders = {};
let sensorsData = {};
// --------
// WiSENSOR
// --------
function truncateString(str, length) {
  let StrUC = str.toUpperCase();
  if (StrUC.length <= length) return StrUC;
  const truncated = StrUC.toUpperCase().substring(0, length - 4) + '...' + StrUC.substring(StrUC.length - 4);
  return truncated;
}
decoders.decodeWISensorV1 = function (PortID, blnDEBUG, DataArr, callback) {
  // --------
  let Temp, Humd, modelType, Batt, Interval, modelID = -1;
  Humd = -99;
  blnDEBUG && console.log(`  >>[${'DECODERS.JS'.black.bgWhite}] LINE:124 PORT=<${String(PortID).red}> ..${'DECODEWISENSORV1'.bgRed}.. DATA=<${truncateString(DataArr.join(''), 20).green}>`);
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
      // let _TEMP = (_DATA.substr(48,2) == '20' ) ? hexToSignedInt(_DATA.substr(50,04))/100 : -99;    // 20
      // let _HUMD = (_DATA.substr(54,2) == '21') ? hexToSignedInt(_DATA.substr(56,04))/100 : -99;    // 21
      // -----
      if (strData.length > 4 && strData.substring(0, 4) == "0410") Temp = Number(decodeURIComponent(strData.substring(4).replace(/(..)/g, "%$1")));
      if (strData.length > 4 && strData.substring(0, 4) == "0411") Humd = Number(decodeURIComponent(strData.substring(4).replace(/(..)/g, "%$1")));
      if (strData.length > 4 && strData.substring(0, 4) == "0512") Interval = Number(decodeURIComponent(strData.substring(4).replace(/(..)/g, "%$1")));
      if (strData.length > 4 && strData.substring(0, 4) == "0514") Batt = Number(decodeURIComponent(strData.substring(4).replace(/(..)/g, "%$1")));
      // ---------------
      if (strData.length > 4 && strData.substring(0, 4) == "0513") {
        try {
          modelType = decodeURIComponent(strData.substring(4).replace(/(..)/g, "%$1"));
        }
        catch (err) {
        }
      }
      // ------------
    } catch (err) {
      // ----------
      console.log(`URIError URI Malformed at decodeURIComponent ..${_key}-${_data}`)
      _logs.append('_ERROR', `[DECODERS.JS] DECODEWISENSORV1 ..URIError URI Malformed at decodeURIComponent ..${_key}-${_data}`, () => { });
      // ---------
      callback(401, { "Message": `[DECODEWISENSOR] URIError URI Malformed at decodeURIComponent ..${_key} ${_data}` });
      return;
    }
    // ---------------
    if (strData.length >= 8 && hex_to_ascii(strData.substring(0, 8)) == "+RCV") {
      try {
        CheckIND = decodeURIComponent(strData.substring(0, 10).replace(/(..)/g, "%$1"));
        // ---------
        // if (strData.length == 56) {
        //   modelID = decodeURIComponent( strData.substring(22).replace(/(11)/g, "").replace(/(..)/g, "%$1") );
        //   // modelID = decodeURIComponent( strData.substring(22).replace(/(..)/g, "%$1") );
        // }
        // else {
        modelID = decodeURIComponent(strData.substring(22).replace(/(11)/g, "").replace(/(..)/g, "%$1"));
        // } 
      }
      catch (err) {
        callback(401, { "Message": "URIError URI Malformed at decodeURIComponent" });
        return;
      }
    }
    // ------------
  }
  // ---------
  if (Temp && Humd && modelType && modelID) {
    // ----------------------
    let _NOW = new Date();
    let hours = _NOW.getHours().toString().padStart(2, '0');
    let minutes = _NOW.getMinutes().toString().padStart(2, '0');
    let seconds = _NOW.getSeconds().toString().padStart(2, '0');

    let _MACID = String(modelID).replace(/-/g, '').toUpperCase();
    _logs.append('_DECODEWISENSORV1', `[${PortID}] .${getDateTimeStamp()}. <${_MACID}> ${Temp}C ${Humd}%`, () => { });
    let SENSOR_ADJ = ['B0BC82C4C441'];
    if (SENSOR_ADJ.includes(_MACID)) {
      // console.log(`.. ${_MACID} ....BEF ADJUST TEMP [${Temp}]`);
      Temp += 1.5;
      // console.log(`.. ${_MACID} ....AFT ADJUST TEMP [${Temp}]`);
    }
    // ---------------
    var sensorData = {
      modelID,
      modelType,
      DATAS: ["Temperature", "Humidity"],
      "Temperature": Number(Temp).toFixed(2),
      "Humidity": Number(Humd - Humd * 0.04).toFixed(0),
      TIMESTAMP: _NOW,
      BATT: Batt,
      INTERVAL: Interval
    };
    // -------
    if (Temp < Number(_FALSELIMITS?.['Temperature']?.['MIN'] ?? -90)) callback(404, 'FAULTY DATA')
    if (Temp > Number(_FALSELIMITS?.['Temperature']?.['MAX'] ?? 200)) callback(404, 'FAULTY DATA')
    // if (Batt < 10) console.log("....200...",DataArr,sensorData);
    // -------------------------
    // CALL TO CHECK ON ALERTING
    //  ------------------------
    let fileName = sensorData.modelID;
    var logString = JSON.stringify(sensorData);
    _logs.append(fileName, logString, function (err) { });
    return callback(407, { ...sensorData });
  } else {
    callback(400, null);
  }
};
decoders.decodeWISensorV2 = function (PortID, blnDEBUG, BUFFERDATA, callback) {
  // ----------------
  const INDEX = String(BUFFERDATA).toUpperCase().indexOf('80');
  let _DATA = String(BUFFERDATA).substring(INDEX);
  let _PORTIDFile = '_' + PortID;
  blnDEBUG && console.log(`  >>[${'DECODERS.JS'.black.bgWhite}] LINE:232 PORT=<${String(PortID).red}> ..${'DECODEWISENSORV2'.bgCyan}.. DATA=<${truncateString(_DATA, 20).green}>`);
  blnDEBUG && _logs.append(_PORTIDFile, `..${PortID}..DECODE WISENSOR V2 DATA=<${_DATA}>`, () => { });
  // [MACID]=${_MACID.replace(/(.{2})/g,"$1-").slice(0,-1)} [0D]=<${DataArr.length}> 
  let _HEADER = _DATA.substr(0, 2).toString("UTF-8").toUpperCase();
  let _CMND = _DATA.substr(2, 2).toString("UTF-8").toUpperCase();
  let _MACID = (_DATA.substr(8, 2) == '10') ? _DATA.substr(10, 12) : "000000000000";  // 10
  // -------------
  let _TYPE = (_DATA.substr(22, 2) == '16') ? _DATA.substr(24,02) : "NA";    // 16
  let _INT = (_DATA.substr(32, 2) == '19') ? hexToSignedInt(_DATA.substr(34,04)) : null;     // 19
  let _BATT = (String(_DATA.substr(38, 2)).toUpperCase() == '1B') ? hexToSignedInt(_DATA.substr(40,02)) : null;    // 1B
  let _LORAFREQ = (_DATA.substr(42, 2) == '1C') ? hexToSignedInt(_DATA.substr(44,04)) : -99;// 1C
  let _TEMP = (_DATA.substr(48, 2) == '20') ? hexToSignedInt(_DATA.substr(50,04)) / 100 : null;    // 20
  let _HUMD = (_DATA.substr(54, 2) == '21') ? hexToSignedInt(_DATA.substr(56,04)) / 100 : null;    // 21
  // ------------
  var sensorData = {
    modelID: `${_MACID.substr(0, 2)}-${_MACID.substr(2, 2)}-${_MACID.substr(4, 2)}-${_MACID.substr(6, 2)}-${_MACID.substr(8, 2)}-${_MACID.substr(10, 2)}`,
    modelType: 'Wi-SHT10A',
    DATAS: ["Temperature", "Humidity"],
    "Temperature": Number(_TEMP).toFixed(2),
    "Humidity": Number(_HUMD - _HUMD * 0.04).toFixed(0),
    SENSOR_TYPE: _TYPE,
    TIMESTAMP: new Date(),
    BATT: _BATT,
    INTERVAL: _INT
  };
  let _CHECKFLAG = _CHECKID.includes(String(sensorData?.modelID).toUpperCase());
  false && _CHECKFLAG && console.log('DECODERS.JS: -250-', String(sensorData?.modelID).toUpperCase(), 'FOUND=', _CHECKFLAG);
  // ----------------
  if (_TEMP < Number(_FALSELIMITS?.['Temperature']?.['MIN'] ?? -90)) callback(404, 'FAULTY SIGNAL')
  if (_TEMP > Number(_FALSELIMITS?.['Temperature']?.['MAX'] ?? 200)) callback(404, 'FAULTY SIGNAL')

  if (_TEMP == null) {
    callback(409, { PORT: PortID, MACID: _MACID, TEMP: _TEMP, HUMD: _HUMD, NOTE: `WI-SENSOR V2 TEMP INVALID NULL` });
    return;
  }
  if (_HUMD < 0) {
    callback(409, { PORT: PortID, MACID: _MACID, TEMP: _TEMP, HUMD: _HUMD, NOTE: `WI-SENSOR V2 HUMD INVALID NULL` });
    return;
  }
  //  ------------
  if (_MACID.length != 12) {
    callback(402, { message: 'MAC ID INCOMPLETE' });
    _logs.append('_1012', `.${getDateTimeStamp()}. WI-SENSOR V2 [${PortID}] <${_CMND}>..INCOMPLETE MAC ID.. MAC ID=<${_MACID}>..`, () => { })
    return;
  }
  // ---------
  // ------------
  // -HEADER- -CMND- -LENGTH-  ----MAC ID ---------  --TYPE-- -VERSION--  --INT--- -BATT--  -LORA FREQ- ---TEMP--- -HUMIDITY-
  //    80      A0    00 1B    10 XX XX XX XX XX XX    16 01   17 XX XX   19 XX XX  1B 64    1C XX XX    20 XX XX   21 XX XX
  // 16 TYPE            17 VERSION      19 INTERVAL   1B BATTERY 
  // 1C LORA FREQUENCY
  // 20 TEMPERATURE     21 HUMIDITY
  // --------------------------
  // CALL TO CHECK ON ALERTING
  //  ------------------------
  let fileName = sensorData?.modelID;
  // ---------------
  _logs.append('_DECODEWISENSORV2', `[${PortID}] .${getDateTimeStamp()}. <${_MACID}> ${_TEMP}C ${_HUMD}%`, () => { })
  var logString = JSON.stringify(sensorData);
  // --------------
  _logs.append(fileName, logString, function (err) { });
  // -------------
  return callback(407, { ...sensorData });
};
// --------------------
// HONEYWELL FIRE SMOKE
// --------------------
decoders.decodeHONEYWELLFireSmoke = function (data, callback) { };
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
  let DataHEADER = DataArr[0].substring(0, index)
  let DataContent = DataArr[0].substring(index + 2)
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
    callback(4031, `DATAARR1 LENGTH < 2 ..${DataArr}`);
    return;
  }
  // --------------------------------
  if (DataArr1.length > 0 && DataArr2.length > 0) {
    let DTUID, SENSORID, FUNCID, NDATA, TIMESTAMP
    try {
      const _dateTime = new Date();
      DTUID = decodeURIComponent(DataArr2[1].replace(/(..)/g, "%$1"));
      SENSORID = parseInt(DataArr[0].substr(index + 2, 2), 16);
      FUNCID = parseInt(DataContent.substring(2, 4), 16);
      NDATA = parseInt(DataContent.substring(4, 6), 16) / 2;
      DATESTAMP = `${_dateTime.getDate()}/${_dateTime.getMonth() + 1}`
      TIMESTAMP = `${String(_dateTime.getHours()).padStart(2, "0")}:${String(_dateTime.getMinutes()).padStart(2, "0")}`
      // --------------
      if (FUNCID !== 3) {
        callback(4032, `FUNCID !== 3 ...${FUNCID}`);
        return;
      }
    }
    catch (err) {
      _logs.append('_ERROR', `[DECODERS.JS] ..DECODE485SENSOR.. PORT=${PortID} [4033]..<${DataHEADER}>.. `, () => { });
      callback(4033, { DTUID, SENSORID, FUNCID, RCV_BYTES: [], NDATA: 0, DATAS: [] });
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
      ConvDATA = hexToSignedInt(DataContent.substring(6 + 4 * i, 10 + 4 * i));
      RCV_BYTES.push(DataContent.substring(6 + 4 * i, 10 + 4 * i))
      let StrBYTE = DataContent.substring(6 + 4 * i, 10 + 4 * i);
      if (Number.isNaN(ConvDATA)) {
        // sensorDataArr.push(0);
        // console.log(`[${'DECODERS.JS'.green}] <${String(PortID).yellow}> ..${'DECODE485SENSOR'.red}.. [4] ConvDATA IS NULL ${ConvDATA}`)
        return;
      } else {
        sensorDataArr.push(ConvDATA);
      }
    }
    // -------------
    // GET THE FLOAT
    // -------------
    if (RCV_BYTES.length % 2 == 0) {
      // -------------------------
      for (let i = 0; i < RCV_BYTES.length / 2; i++) {
        // ---------------
        sensorDataFloatArr.push(parseFloat(`0x${RCV_BYTES[2 * i]}${RCV_BYTES[2 * i + 1]}`).toFixed(4));
        let _Int4 = hexToSignedInt(`${RCV_BYTES[2 * i]}${RCV_BYTES[2 * i + 1]}`);
        sensorDataIntArr.push(hexToSignedInt(`${RCV_BYTES[2 * i]}${RCV_BYTES[2 * i + 1]}`));
      }
    }
    // -------------
    var sensorData = {
      DTUID,
      SENSORID,
      FUNCID,
      NDATA,
      SENSORTYPE: null,
      RCV_BYTES,
      DATAS: [],
      DATAS1: [],
      DATAS2: [],
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
    var fileName = sensorData.DTUID + '-' + sensorData.SENSORID;
    // ------------
    if (typeof fileName === "undefined" || hasNull(fileName)) {
      // ----------
      _logs.append('_ERROR', `[DECODERS.JS] ..DECODE485SENSOR.. LINE 474 PORT=${String(PortID).green} .... FILENAME=${String(fileName)} IS UNDEFINED OR IS NULL`, () => { });
      callback(4034, `[DECODERS.JS] PORT=${String(PortID).green} .... FILENAME=${String(fileName)} IS UNDEFINED OR IS NULL`)
      return;
    }
    // -----------------------------------------------------
    // CHECK ATCMND_SENT1 AND REMOVE IF ANY MATCHED AN UPDATE
    // -----------------------------------------------------
    COUNTER_485 += 1;
    // ----------------
    let ObjData = {
      DTUID, SENSORID, FUNCID, NDATA, RCV_BYTES,
      sensorDataArr, sensorDataFloatArr, sensorDataIntArr,
      TIMESTAMP,
      DATESTAMP
    };
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
      // ---
      // console.log(`..${COUNTER_485}..1..<${CHECKOBJS[0].SENSORTYPE}> DTU=${DTUID} SENSOR=${SENSORID} ...LOG=<${CHECKOBJS[0].LOG}> ..BYPASS=<${CHECKOBJS[0].BYPASS}> ..`)
      CHECKOBJS[0]?.BYPASS && console.log(`..${COUNTER_485}..LOG..DTU=${DTUID} SENSOR=${SENSORID} MODBUS=<${CHECKOBJS[0].MODBUS}> RCV.BYTE=${RCV_BYTES}..`);
      CHECKOBJS[0]?.LOG && _logs.append('_ERROR', `[DECODERS.JS] ..PORT=${PortID} .${COUNTER_485}. DTU=${DTUID} SENSOR=${SENSORID} RCV.BYTE=${RCV_BYTES}`, () => { });
      if (CHECKOBJS[0]?.BYPASS) return;
      if (CHECKOBJS[0].EXTFILE && CHECKOBJS[0].EXTFILE === 'STATE') {
        fileName = `${fileName}_${CHECKOBJS[0].EXTFILE}`;
        _KEY = `${_KEY}A`
      }
    } else {
      false && console.log(`[${'DECODERS.JS'.green}] <${String(PortID).yellow}> ..${'DECODE485SENSOR'.red}.. decoders.GET_ATCMND=${String(CHECKOBJS.length).red} ..FILENAME=${String(fileName).green} `);
      false && _logs.append('_ERROR', `[DECODERS.JS] ..DECODE485SENSOR.. LINE 510 PORT=${PortID} .. decoders.GET_ATCMND=${CHECKOBJS.length} ..FILENAME=${fileName}`, () => { });
    }
    // --------
    let Keys = Object.keys(sensorsData);
    if (sensorsData.hasOwnProperty(_KEY)) delete sensorsData[_KEY];
    sensorsData[_KEY] = ObjData;
    //  --------------
    _data.update('rawData', '_485SENSORS', sensorsData, function (err) { });
    // ------
    _data.read("sensors", fileName, function (err, sensorObj) {
      // ----------------------
      if (NDATA == 50) sensorData["DATAS2"] = sensorObj["DATAS2"];
      if (NDATA == 35) sensorData["DATAS1"] = sensorObj["DATAS1"];
      sensorData['BUFFER'] = DataArr[0];
      // --------------------------------------------
      // CREATE NEW SENSOR IF SENSOR IS NOT AVAILABLE
      // --------------------------------------------
      if (err) {
        // CREATE NEW FILE IF READ RETURN ERROR=TRUE...
        _data.create("sensors", fileName, sensorData, function (err) {
          if (!err) {
            console.log(`[${'DECODERS.JS'.green}] ${'DECODE485SENSOR'.blue} COULD NOT CREATE 485 SENSOR <${fileName.red}>`);
            callback(4035, `[${'DECODERS.JS'.green}] ${'DECODE485SENSOR'.blue} COULD NOT CREATE 485 SENSOR <${fileName.red}>`)
            return;
          } else {
            console.log(`[${'DECODERS.JS'.green}] ${'DECODE485SENSOR'.blue} DATA.CREATE <${String(fileName).toUpperCase().green}> STATUS <${String(err).yellow}>`)
          }
        });
      }
      // ----------------------------
      // Convert the data to a string
      // ----------------------------
      var logString = JSON.stringify(sensorData);
      // --------------
      // Stored in Logs
      // --------------
      if (sensorData.SENSORTYPE === null) {
        false && _logs.append('_ERROR', `[DECODERS.JS] ..DECODE485SENSOR.. LINE 547 PORT=${PortID} .. SENSORTYPE=${sensorData.SENSORTYPE} ..FILENAME=${fileName}`, () => { });
        callback(4037, `FILENAME=${fileName}  ... SENSOR.TYPE=${String(sensorData.SENSORTYPE).toUpperCase()}`);
        return;
      }
      // --------
      // _logs.append('_DECODE485SENSOR',`[${PortID}] .${TIMESTAMP}. ..<${String(sensorData.DTUID).padStart(3,"0")}_${String(sensorData.SENSORID).padStart(2,"0")}>.. RECEIVE DATA=<${RCV_BYTES}>`,()=>{})
      // --------
      _logs.append(fileName, logString, function (err) {
        if (flagSCREENOutput_485SENSOR && String(PortID) === '1008') console.log(`[${'DECODERS.JS'.green}] <${getDateTimeStamp()}> <${String(PortID).green}> ${'DECODE485SENSOR'.blue} APPEND LOG [${String(err).red}] <${String(fileName).toUpperCase().green}>`);
        if (flagSCREENOutput_485SENSOR && String(PortID) === '1009') console.log(`[${'DECODERS.JS'.green}] <${getDateTimeStamp()}> <${String(PortID).yellow}> ${'DECODE485SENSOR'.blue} APPEND LOG [${String(err).red}] <${String(fileName).toUpperCase().green}>`);
        if (flagSCREENOutput_485SENSOR && String(PortID) === '1010') console.log(`[${'DECODERS.JS'.green}] <${getDateTimeStamp()}> <${String(PortID).red}> ${'DECODE485SENSOR'.blue} APPEND LOG [${String(err).red}] <${String(fileName).toUpperCase().green}>`);
        if (!err) {
          debug("Logging to file succeeded");
        } else {
          debug("Logging to file failed");
        }
      });
      // -------------------------
      // CALL TO CHECK ON ALERTING
      //  ------------------------
      return callback(407, { ...sensorData });
    })
    // ------
  } else {
    // ----------------
    console.log(`[DECODERS.JS] ..DECODE485SENSOR.. CALLBACK 404...`);
    _logs.append('_ERROR', `[DECODERS.JS] ..DECODE485SENSOR.. PORT=${PortID} [404]..<>.. `, () => { });
    callback(4039, 'ERROR...');
    return;
    // ----------------
  }
};
// -----------
// F8LST (DTU)
// -----------
function GetTIMEStamp() {
  let datetimeNow = new Date();
  let hourNow = String(datetimeNow.getHours()).padStart(2, "0");
  let minuteNow = String(datetimeNow.getMinutes()).padStart(2, "0");
  return `${hourNow}:${minuteNow}`;
}
function getSensorObj(PORTID, DTUID, MODE, SENSORID, RCV_BYTES) {
  let sensorObj = {};
  sensorObj['TIMESTAMP'] = new Date();
  sensorObj['PORT.ID'] = PORTID;
  sensorObj['MODE'] = MODE,
    sensorObj['DTU.ID'] = DTUID;
  sensorObj['SENSOR.ID'] = SENSORID;
  sensorObj['RCV.BYTES'] = RCV_BYTES;
  let nDATA = RCV_BYTES?.length / 2 / 2;
  for (let i = 0; i < nDATA; i++) {
    let _BYTE = RCV_BYTES.substr(i * 4, 4);
    let _DATA = parseInt(_BYTE, 16);
    if (i == 0) sensorObj['RH'] = _DATA;
    if (i == 1) sensorObj['TEMP'] = _DATA;
    if (i == 2) sensorObj['CO2'] = _DATA;
  }
  return sensorObj;
}
function trimStartingZeros(str) {
  if (str.startsWith("00")) {
    return "0" + str.substring(2);
  }
  return str;
}

function breakHexString(hexString, separators, minLength) {
  let index = -1;
  for (const separator of separators) {
    const currentIndex = hexString.indexOf(separator, minLength);
    if (currentIndex !== -1 && (index === -1 || currentIndex < index)) {
      index = currentIndex;
    }
  }
  if (index === -1) {
    return { PRE: hexString, POST: '' };
  } else {
    return { PRE: hexString.substring(0, index), POST: hexString.substring(index) };
  }
}
decoders.decodeF8L10ST_APIMODE = function (PORTID, buffer, blnDEBUG, callback) {
  // -------------------------
  const _dateTime = new Date();
  const hourNow = String(_dateTime.getHours()).padStart(2, "0");
  const minuteNow = String(_dateTime.getMinutes()).padStart(2, "0");
  // ------------
  let _PORTIDFile = '_' + PORTID;
  let _DATE = `${_dateTime.getDate()}/${_dateTime.getMonth() + 1}`
  let _TIME = `${hourNow}:${minuteNow}`;
  const { PRE: _PRE, POST: _DATA } = breakHexString(String(buffer).toUpperCase(), ['FA', '80'], 12);
  // let _PRE = String(buffer).toUpperCase().substring(0,12);
  // let _DATA = trimStartingZeros(String(buffer).toUpperCase().substring(12));
  // console.log(String(buffer).toUpperCase());
  // console.log('BRK.HEX:',_PRE1,'-',_POST1);
  // console.log('       :',_PRE,'-',_DATA)
  // const _PRE = PRE;
  // const _DATA = POST;
  false && blnDEBUG && console.log(`[${"DECODERS.JS".green}] PORT=<${String(PORTID).red}> LINE:578 ..DECODEF8L10ST.. BUFFER=<${String(buffer).green}>`);
  false && blnDEBUG && console.log(`[${"DECODERS.JS".green}] PORT=<${String(PORTID).red}> LINE:579 ..DECODEF8L10ST.. PRE=<${String(_PRE).red}> DATA=<${String(_DATA).yellow}`);
  false && blnDEBUG && console.log(`[${"DECODERS.JS".green}] PORT=<${String(PORTID).red}> LINE:580 ..DECODEF8L10ST.. PRE=<${String(_PRE).red}> <${String(_DATA.length).yellow}|${truncateString(_DATA, 20).green}>`);
  blnDEBUG && _logs.append(_PORTIDFile, `..${PORTID}..${getDateTimeStamp()} PORT=<${PORTID}> BYTE=<${_PRE}>..<${_DATA}>`, () => { });
  // ------------------------------
  let _HEADER = _PRE.substr(0, 2);
  let _BIT1 = _PRE.substr(8, 2);
  let _BIT2 = _PRE.substr(10, 2);
  let _DTUID = parseInt(_BIT2 + _BIT1, 16);
  let _CMND = parseInt(_DATA.substr(4, 2), 16);
  let _IOPORT = parseInt(_DATA.substr(6, 2), 16);
  let _IOTYPE = parseInt(_DATA.substr(8, 2), 16);
  let _NDATA = parseInt(_DATA.substr(10, 2), 16);
  let _DATAHEX = _DATA.substr(12, _NDATA * 2);
  let _SENSORID = parseInt(_DATA.substr(6, 2), 16);
  let _FUNCTID = parseInt(_DATA.substr(8, 2), 16);
  //  -------------
  if (_DATA.substring(0, 2) == '80') {
    // -------------
    // UNDER AP MODE - WISENSOR DATA IS PASSING THRU HERE.
    // -------------
    decoders.decodeWISensorV2(PORTID, blnDEBUG, _DATA, function (statusCode, payload) {
      const { modelID, modelType, Temperature, Humidity, BATT, INTERVAL } = payload;
      _logs.append('_DECODEF8L10ST', `..${PORTID}..${GetTIMEStamp()} PORT=<${PORTID}> WISENSOR=<${modelType}|${modelID}> <${Temperature}/${Humidity}/${BATT}/${INTERVAL}>`, () => { });
      // --------
      if (statusCode == 200) {
        callback(200, { _DATE, _TIME, PORTID, modelID, Temperature, Humidity, BATT, INTERVAL });
      } else {
        callback(statusCode, { _DATE, _TIME, PORTID, modelID, Temperature, Humidity, BATT, INTERVAL });
      }
    })
    return;
  }
  if (_DATA.substring(0, 2) != 'FA') {
    return;
  }
  // ------------
  let _CRC = _DATA.substr(14, 2);
  // -------
  let _READING1, _READING2
  let _MODE, _TYPE, _PORT;
  let _BATT = null;
  blnDEBUG && console.log(`[${"DECODERS.JS".green}] PORT=<${String(PORTID).red}> LINE:619 ..DECODEF8L10ST.. DATAHEX=${String(_DATAHEX).red}`)
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
      switch (_IOTYPE) {
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
      _DATAHEX = _DATA.substr(10, 4);
      break;
    case 4:
      _MODE = "DATA.ACQ";
      _DATAHEX = _DATA.substr(10, 4);
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
      _DATAHEX = _DATA.substr(6, 8);
      break;
    case 7:
      _MODE = 'HEART-BEAT';
      _FUNCTID = -1;
      _BATT = parseInt(_DATA.substr(6, 2), 16);

      let idx03 = -1;
      for (let pos = 8; pos <= _DATA.length - 6; pos += 2) {
        if (_DATA.substring(pos, pos + 2) === '03') {
          const candidateByteCount = parseInt(_DATA.substring(pos + 2, pos + 4), 16);
          if (candidateByteCount > 0 && candidateByteCount <= 64 && pos + 4 + candidateByteCount * 2 <= _DATA.length) {
            idx03 = pos;
            break;
          }
        }
      }

      if (idx03 !== -1) {
        _MODE = 'RS485';
        _SENSORID = 1;
        const byteCount = parseInt(_DATA.substring(idx03 + 2, idx03 + 4), 16);
        _DATAHEX = _DATA.substring(idx03 + 4, idx03 + 4 + byteCount * 2);
      } else {
        _DATAHEX = _DATA.substr(6, 8);
      }
      blnDEBUG && console.log(`[${"DECODERS.JS".green}] PORT=<${String(PORTID).red}> LINE:683 ..DECODEF8L10ST.. BATT=${String(_BATT).yellow} DATAHEX=${String(_DATAHEX).red}`);
      // _DTUID = null;
      // _SENSORID = null;
      break;
    case 8:
      _MODE = 'POWER-OFF';
      _FUNCTID = -1
      _DATAHEX = _DATA.substr(6, 8);
      break;
    default:
      _MODE = 'RESERVE'
      break;
  }
  // -------------------------------
  const ObjSENSOR = {
    _DATE, _TIME, PORTID, _DTUID, _SENSORID, _FUNCTID, _NDATA, _DATA, _MODE, _PORT, _TYPE, _DATAHEX, _READING1, _READING2, ...(_BATT != null ? { _BATT } : {})
  }
  false && console.log('decodeF8L10ST_APIMODE ', PORTID, ' PRE=', _PRE, 'DTUID=', ObjSENSOR._DTUID, 'DATA=', _DATA, ObjSENSOR._FUNCTID, ObjSENSOR._SENSORID, ObjSENSOR._NDATA, ObjSENSOR._DATAHEX);
  blnDEBUG && console.log(`[${"DECODERS.JS".green}] PORT=<${String(PORTID).red}> LINE:697 ..DECODEF8L10ST.. COMMAND=<${String(_CMND).yellow}> MODE=${_MODE} TYPE=${_TYPE} PORT=${_PORT} DATAHEX=${_DATAHEX} BATT=${_BATT}`);
  if (_CMND <= 8) {
    callback(407, ObjSENSOR);
  } else {
    callback(201, ObjSENSOR);
  }
  // ----------
}
decoders.decodeF8L10ST_ATMODE = function (PORTID, buffer, blnDEBUG, callback) {
  // -------------------------
  var _dateTime = new Date();
  var hourNow = String(_dateTime.getHours()).padStart(2, "0");
  var minuteNow = String(_dateTime.getMinutes()).padStart(2, "0");
  // ------------  
  let _PORTIDFile = '_' + PORTID;
  let _DATE = `${_dateTime.getDate()}/${_dateTime.getMonth() + 1}`
  let _TIME = `${hourNow}:${minuteNow}`;
  // -----------------------------------
  var DataArr = buffer.toString("hex").toUpperCase().split("0D");
  // -------------------------------
  DataArr1 = DataArr[0].split("2C");
  const { PRE, POST } = breakHexString(String(buffer).toUpperCase(), ['FA'], 12);
  // let _PRE = DataArr1[0].toUpperCase();
  // let _DATA = DataArr1[1].toUpperCase();
  const _PRE = PRE;
  const _DATA = POST;
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
  //         FA 0B 02 01 03 04 00 00 00 00 FA 33 42
  // ---------------------------------------------
  let _HEADER = _PRE.substr(0, 2);
  let _BIT1 = _PRE.substr(8, 2);
  let _BIT2 = _PRE.substr(10, 2);
  let _DTUID = parseInt(_BIT2 + _BIT1, 16);
  let _CMND = parseInt(_DATA.substr(4, 2), 16);
  let _IOPORT = parseInt(_DATA.substr(6, 2), 16);
  let _IOTYPE = parseInt(_DATA.substr(8, 2), 16);
  let _NDATA = parseInt(_DATA.substr(10, 2), 16);
  let _DATAHEX = _DATA.substr(12, _NDATA * 2);
  let _SENSORID = parseInt(_DATA.substr(6, 2), 16);
  let _FUNCTID = parseInt(_DATA.substr(8, 2), 16);
  //  -------------
  if (_DATA.substring(0, 2) == '80') {
    // -------------
    // UNDER AP MODE - WISENSOR DATA IS PASSING THRU HERE.
    // -------------
    decoders.decodeWISensorV2(PORTID, blnDEBUG, _DATA, function (statusCode, payload) {
      const { modelID, modelType, Temperature, Humidity, BATT, INTERVAL } = payload;
      // blnDEBUG && console.log(`[${"DECODERS.JS".green}] PORT=<${String(PORTID).red}> =decodeWISensorV2=  STATUS CODE=<${String(statusCode).yellow}>`);
      _logs.append('_DECODEF8L10ST', `..${PORTID}..${GetTIMEStamp()} PORT=<${PORTID}> WISENSOR=<${modelType}|${modelID}> <${Temperature}/${Humidity}/${BATT}/${INTERVAL}>`, () => { });
      // --------
      if (statusCode == 200) {
        callback(200, { _DATE, _TIME, PORTID, modelID, Temperature, Humidity, BATT, INTERVAL });
      } else {
        callback(statusCode, { _DATE, _TIME, PORTID, modelID, Temperature, Humidity, BATT, INTERVAL });
      }
    })
    return;
  }
  if (_DATA.substring(0, 2) != 'FA') {
    return;
  }
  // ------------
  let _CRC = _DATA.substr(14, 2);
  // -------
  let _READING1, _READING2;
  let _MODE, _TYPE, _PORT;
  let _BATT = null;
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
      switch (_IOTYPE) {
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
      _DATAHEX = _DATA.substr(10, 4);
      break;
    case 4:
      _MODE = "DATA.ACQ";
      _DATAHEX = _DATA.substr(10, 4);
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
      _DATAHEX = _DATA.substr(6, 8);
      break;
    case 7:
      _MODE = 'HEART-BEAT'
      _FUNCTID = -1
      _DATAHEX = _DATA.substr(6, 8);
      _BATT = parseInt(_DATA.substr(6, 2), 16)
      // _DTUID = null;
      // _SENSORID = null;
      break;
    case 8:
      _MODE = 'POWER-OFF';
      _FUNCTID = -1
      _DATAHEX = _DATA.substr(6, 8);
      break;
    default:
      _MODE = 'RESERVE'
      break;
  }
  const ObjSENSOR = {
    _DATE, _TIME, PORTID, _DTUID, _SENSORID, _FUNCTID, _NDATA, _DATA, _MODE, _PORT, _TYPE, _DATAHEX, ...(_BATT != null ? { _BATT } : {}), _READING1, _READING2
  }
  // _DATE, _TIME, PORTID, _DTUID, _SENSORID, _FUNCTID, _NDATA, _DATA, _MODE, _PORT, _TYPE, _DATAHEX, _READING1, _READING2
  // --------------------
  if (Number(_CMND) > 0) {
    callback(200, ObjSENSOR);
  } else {
    callback(405, null);
  }
  // ----------
}
// ----------
// AT COMMAND
// ----------
let ATCMNDArr = [];
// ---------------------
decoders.ADD_ATCMND = function (ATCMDObj) {
  ATCMNDArr.push(ATCMDObj);
}
decoders.GET_ATCMND = function (ATCMDObj) {
  // ---------
  let BYTE_LEN = ATCMDObj?.RCV_BYTES?.length;
  // ----------------------------------------------
  // MATCHING LENGTH OF RETURN BYTES WITH CMND SEND
  //  ---------------------------------------------
  let CheckATCMND = ATCMNDArr.filter(_ATCMND => {
    let MOD_LEN = parseInt(_ATCMND.MODBUS.substr(-2), 16)
    let status = (Number(_ATCMND.DTUID) == Number(ATCMDObj.DTUID)) && (Number(_ATCMND.SENSORID) == Number(ATCMDObj.SENSORID)
      && (Number(MOD_LEN) == Number(BYTE_LEN)));
    return (status);
  })
  return CheckATCMND;
}
decoders.RESET_ATCMND = function () {
  ATCMNDArr = [];
  COUNTER_485 = 0;
}
// --------------------------
// COMPUTE ABSOLUTE HUMIDITY
// -------------------------
const CalculateHUMDABS = (_Temp, _RH) => 6.12 * Math.exp((17.67 * _Temp) / (_Temp + 243.50)) * _RH * 2.1674 / (273.15 + _Temp);
// -------------------------
// CHECK ALERTS FROM MONGODB
// -------------------------
decoders.GetAllSensors = function (callback) {
  var counter = 0;
  var sensorsArr = [];
  decoders.GetAllUsers(function (err, payload) {
    // -----------------------------------
    payload.forEach(function (user, index) {
      // -------
      counter++;
      // ---------------
      if (user.sensors) {
        // -------------
        user.sensors.forEach(function (sensorId, index) {
          // -------------
          if (sensorsArr.indexOf(sensorId) == -1) {
            // -----------
            sensorsArr.push(sensorId);
            // -----------
          }
        });
      }
      if (counter == payload.length) callback(err, sensorsArr);
    })
  })
}
decoders.GetAllUsers = function (callback) {
  var counter = 0;
  var usersArr = [];
  _data.list('users', function (err, userIds) {
    if (!err && userIds && userIds.length > 0) {
      userIds.forEach(function (userId, index) {
        _data.read('users', userId, function (err, userData) {
          counter++;
          if (!err && userData) {
            usersArr.push(userData)
            if (counter == userIds.length)
              callback(err, usersArr);
          }
        });
      });
    }
  });
}
//  -----------------
//  WHATSMATE GATEWAY 
//  [10]. TELEGRAM GATEWAY (TelegramGateway1) - WhatsMateAccount1 - TDK
//  [12]. TELEGRAM GATEWAY (TelegramGateway2) - WhatsMateAccount6 - 
//  [24]. WHATSAPP GATEWAY (WhatsAppGateway3) - WhatsMateAccount2 - BALAKONG TEA WAREHOUSE, IJN, SNOWCITY
//  [20]. WHATSAPP GATEWAY (WhatsAppGateway2) - WhatsMateAccount3 - SYSTEM INFO, MRE, SHINKO (MOVE TO WhatsAppGateway4)
//  [28]. WHATSAPP GATEWAY - TO REPLACE [24] :: 852 6351 0723 WhatsMateAccount4
//  [30]. WHATSAPP GATEWAY (WhatsAppGateway4) - WhatsMateAccount5 - EPSON, SHINKO
// --------------------
const MessengingGateway = {
  "WhatsMateAccount1": {
    instanceId: "10",
    clientId: "caliew888@gmail.com",
    clientSecret: "74656835e5b04cb0b4e240bc6cd56009",
    gateway: 'TELEGRAM'
  },
  "WhatsMateAccount2": {
    instanceId: "28",
    instanceId_OLD: "24",
    clientId: "jameslee@affluentengg.com",
    clientSecret: "6a1c9eeb79674e7ba477572b326458b2",
    gateway: 'WHATSAPP',
    remark: 'TO BE REPLACE BY CLIENT ID 28 - WhatsMateAccount4. CHANGE THE INSTANCEID FROM 24 TO 28'
  },
  "WhatsMateAccount3": {
    instanceId: "20",
    clientId: "ahkongchai77@gmail.com",
    clientSecret: "f55fb1dd4f9f4ea2a90044119f317f02",
    gateway: 'WHATAPP',
    remark: 'WHATS APP BANNED - (+852 5436 6577) TO BE REPLACE BY CLIENT ID 12 - WhatsMateAccount6.'
  },
  "WhatsMateAccount4": {
    instanceId: "28",
    clientId: "jameslee@affluentengg.com",
    clientSecret: "6a1c9eeb79674e7ba477572b326458b2",
    gateway: 'WHATSAPP',
    remark: '(+852 6351 0723) TO REPLACE CLIENT ID 24 (+852 5662 5426)- WhatsMateAccount2'
  },
  "WhatsMateAccount5": {
    instanceId: "30",
    clientId: "affdemo77@gmail.com",
    clientSecret: "1344bf2871b141eab5bda0900ca15142",
    gateway: 'WHATSAPP',
    remark: 'NEW EPSON'
  },
  "WhatsMateAccount6": {
    instanceId: "12",
    clientId: "ahkongchai77@gmail.com",
    clientSecret: "f55fb1dd4f9f4ea2a90044119f317f02",
    gateway: 'TELEGRAM',
    remark: "(+852 9476 4404) TO REPLACE INSTANCE 20 - WhatsMateAccount3"
  },
  "TelegramBot": {
    token: "8710642614:AAEx_iqjc0S6kW5yQRcxGvv2fBFg7iJi4HE",
    gateway: 'TELEGRAM_BOT',
    remark: 'Direct Telegram Bot API'
  }
}
//  -----------------
//  SEND TEST MESSAGE TO WHAT'S APP
//  -----------------
decoders.sendWhatsApp = function (sensor, str, alertPoints, _AlertObject) {
  // ------------------
  // NEW LOGICS CONTINUOUS 
  // ------------------
  const query = { dtuId: sensor.dtuId, sensorId: sensor.sensorId };
  Alert.find(query).sort({ date: -1 }).exec((error, alerts) => {
    // ---------------------
    let minutes = 0;
    const today = new Date();
    // --------------------
    if (alerts.length > 1) {
      // --------
      const endDate = new Date(alerts[0].date);
      const lastDateTime = `${endDate.getDate()}/${endDate.getMonth() + 1} ${endDate.getHours()}:${endDate.getMinutes()}`
      // -------------------
      const endDate1 = new Date(alerts[1].date);
      const lastDateTime1 = `${endDate1.getDate()}/${endDate1.getMonth() + 1} ${endDate1.getHours()}:${endDate1.getMinutes()}`
      minutes = parseInt(Math.abs(endDate.getTime() - today.getTime()) / (1000 * 60));
      const record = `.. INTERVAL=[${minutes}] MIN`;
      if (alertPoints > 1 && minutes > 6.0) return;
    }
    // ------------------------------------------
    try {
      decoders.sendWhatsAppMessage(sensor, str, _AlertObject, minutes);
      // ----------
    } catch (err) {
      console.log(`[DECODERS.JS] [WHAT'S APP..SEND MESSAGE] ERROR FOUND <${err}>`);
      _logs.append('_ERROR', `[DECODERS.JS] [WHATSAPP..SEND MESSAGE] ERROR FOUND <${err}>`, () => { { } });
    }
  });
  // -----------------
}
decoders.sendWhatsAppMessage = function (sensor, str, _AlertObject, minutes) {
  // -----------
  let label = sensor.type === 'WISENSOR' ? sensor.sensorId : `${sensor.dtuId}_${sensor.sensorId}`;
  // console.log('    .... SENSWHATSAPPMESSAGE...',label);
  // -------
  AlertGroup.find({}).exec((error, alertgroups) => {
    // ------------------------------
    if (alertgroups.length == 0) return;
    // ------------------------------
    alertgroups.forEach((group, index) => {
      // --------------------------
      let nIndex = group.sensor.indexOf(label);
      // -----------------
      if (nIndex > -1) {
        // console.log('    ...',index,nIndex,group.name);
        var jsonPayload = JSON.stringify(_AlertObject);
        // -----
        console.log(`WHATSAPP GROUP => ${group.name}..`);
        switch (group.name) {
          case 'NipponGlass IOT Monitoring System':
            decoders.WhatsAppGateway2(group.name, str);
            break;
          case 'L1 Medical Store':
          case 'L3 CDR':
          case 'L3 Outpatient Farmasi':
          case 'L3 Oncologi':
          case 'L4 Daycare':
          case 'L5 CDR':
          case 'L5 Inpatient Farmasi':
          case 'IKN OPS ROOM':
            decoders.WhatsAppGateway1(group.name, str);
            break;
          case 'MRE IOT Monitoring System':
            _DEBUG && console.log(`  >> [${group.name}] :: ${str}`);
            // decoders.WhatsAppGateway2(group.name, str);
            decoders.Telegrambot(group.name, str);
            break;
          case 'Shinko IOT Monitoring System':
            decoders.WhatsAppGateway4(group.name, str);
            break;
          case 'TDK IOT Alert Group':
            _logs.append('_TDKALERTS', jsonPayload, () => { });
            break;
          case 'EPSON FACILITY GROUP':
            _DEBUG && console.log(group.name, str);
            decoders.WhatsAppGateway4(group.name, str);
            break;
          default:
            break;
        }
        // -----
        var alertData = {
          "datetime": new Date(),
          "message": str
        }
        // ------------------
        // APPEND TO LOG FILE
        // ------------------
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
//  ------------------
//  WHATS MATE GATEWAY
//  ------------------
decoders.WhatsMateResponse = function (_Gateway, _WhatsAppGroup, _JSONObject) {
  _DEBUG && console.log(`  >>[DECODERS.JS] LINE:1101 WHATSMATE RESPONSE..${_Gateway} [${_WhatsAppGroup}]`)
  _DEBUG && _JSONObject?.error_message && console.log("  >>[DECODERS.JS] LINE:1102 ", _JSONObject?.error_message);
}
decoders.TelegramGateway10 = function (whatsAppGroup, message) {
  // --------------------------
  _DEBUG && console.log(`  >>[DECODERS.JS] LINE:1101 [${getDateTimeStamp()}] DECODERS =>${String("TELEGRAMGATEWAY10").yellow} [${whatsAppGroup.red}] ..${message.blue}`)
  var jsonPayload = JSON.stringify({
    group_admin: "6597668621", // TODO: Specify the WhatsApp number of the group creator, including the country code
    group_name: whatsAppGroup,   // TODO:  Specify the name of the group
    message: message  // TODO: Specify the content of your message
  });
  // ----------------------
  var whatAppOptions = {
    port: 80,
    hostname: "api.whatsmate.net",
    path1: "/v3/whatsapp/group/text/message/" + MessengingGateway.WhatsMateAccount1.instanceId,
    path: "/v3/telegram/group/text/message/" + MessengingGateway.WhatsMateAccount1.instanceId,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-WM-CLIENT-ID": MessengingGateway.WhatsMateAccount1.clientId,
      "X-WM-CLIENT-SECRET": MessengingGateway.WhatsMateAccount1.clientSecret,
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
        try {
          let JSONObject = JSON.parse(chunk);
          decoders.WhatsMateResponse('TELEGRAMGATEWAY10', whatsAppGroup, JSONObject);
          _logs.append('_WHATSMATE_TELEGRAM10', `[WHATSMATE ACCOUNT 1] ${getDateTimeStamp()} ${whatsAppGroup} ..${object?.id}/${object?.result}`, () => { });
        } catch (err) {
          console.log('[TELEGRAMGATEWAY10] ERROR PARSING JSON:', err?.message)
        }
      });
    });
  } catch (err) {
    console.log(`[${'DECODERS.JS'.yellow}] .. SEND WHATSMATE ACCOUNT 1 (TELEGRAM) ERROR <${err}>`)
  }
}
decoders.TelegramGateway12 = function (whatsAppGroup, message) {
  // --------------------------
  _DEBUG && console.log(`  >>[DECODERS.JS] LINE:1144 [${getDateTimeStamp()}] DECODERS =>${String("TELEGRAMGATEWAY12").yellow} [${whatsAppGroup.red}] ..${message.blue}`)
  var jsonPayload = JSON.stringify({
    group_admin: "6597668621", // TODO: Specify the WhatsApp number of the group creator, including the country code
    group_name: whatsAppGroup,   // TODO:  Specify the name of the group
    message: message  // TODO: Specify the content of your message
  });
  // ----------------------
  var whatAppOptions = {
    port: 80,
    hostname: "api.whatsmate.net",
    path1: "/v3/whatsapp/group/text/message/" + MessengingGateway.WhatsMateAccount6.instanceId,
    path: "/v3/telegram/group/text/message/" + MessengingGateway.WhatsMateAccount6.instanceId,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-WM-CLIENT-ID": MessengingGateway.WhatsMateAccount6.clientId,
      "X-WM-CLIENT-SECRET": MessengingGateway.WhatsMateAccount6.clientSecret,
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
        try {
          let JSONObject = JSON.parse(chunk);
          decoders.WhatsMateResponse('TELEGRAMGATEWAY12', whatsAppGroup, JSONObject);
          _logs.append('_WHATSMATE_TELEGRAM12', `[WHATSMATE ACCOUNT 2] ${getDateTimeStamp()} ${whatsAppGroup} ..${JSONObject?.id}/${JSONObject?.result}`, () => { });
        } catch (err) {
          console.log('  >> [TELEGRAMGATEWAY12] ERROR PARSING JSON:', err?.message);
        }
      });
    });
  } catch (err) {
    console.log(`[${'DECODERS.JS'.yellow}] .. SEND WHATSMATE ACCOUNT 2 (TELEGRAM) ERROR <${err}>`)
  }
}

const TelegramChatMap = {
  "LoRa IOT Group": "-4234611374",
  "MRE IOT Monitoring System": "-1004471079020"
};
decoders.Telegrambot = function (targetChat, message) {
  // --------------------------  
  var chatId = TelegramChatMap[targetChat] || targetChat;
  _DEBUG && console.log(`  >>[DECODERS.JS] [${getDateTimeStamp()}] DECODERS =>${String("TELEGRAMBOT").yellow} [${String(targetChat).red}]=${chatId} ..${String(message).blue}`);
  var jsonPayload = JSON.stringify({
    chat_id: chatId,
    text: message
  });
  // ----------------------
  var token = MessengingGateway?.TelegramBot?.token || "8710642614:AAEx_iqjc0S6kW5yQRcxGvv2fBFg7iJi4HE";
  var options = {
    hostname: "api.telegram.org",
    port: 443,
    path: "/bot" + token + "/sendMessage",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(jsonPayload)
    }
  };
  // -----------
  try {
    var request = https.request(options, function (response) {
      response.setEncoding('utf8');
      var responseString = '';
      response.on('data', function (chunk) {
        responseString += chunk;
      });
      response.on('end', function () {
        try {
          let JSONObject = JSON.parse(responseString);
          _DEBUG && console.log(`  >>[DECODERS.JS] TELEGRAMBOT RESPONSE ok=${JSONObject?.ok} result=${JSONObject?.result?.message_id || JSONObject?.description}`);
          _logs.append('_TELEGRAM_BOT', `[TELEGRAM BOT] ${getDateTimeStamp()} ${targetChat} (${chatId}) ..ok:${JSONObject?.ok}/${JSONObject?.description || JSONObject?.result?.message_id}`, () => { });
        } catch (err) {
          console.log('[TELEGRAMBOT] ERROR PARSING JSON:', err?.message);
        }
      });
    });
    request.on('error', function (err) {
      console.log(`[${'DECODERS.JS'.yellow}] .. SEND TELEGRAM BOT ERROR <${err.message || err}>`);
      _logs.append('_ERROR', `[DECODERS.JS] SEND TELEGRAM BOT ERROR <${err.message || err}>`, () => { });
    });
    request.end(jsonPayload);
  } catch (err) {
    console.log(`[${'DECODERS.JS'.yellow}] .. SEND TELEGRAM BOT EXCEPTION <${err.message || err}>`);
  }
}

decoders.WhatsAppGateway1 = function (whatsAppGroup, message) {
  // --------------------------
  _DEBUG && console.log(`  >>[DECODERS.JS] LINE:1187 DECODER =>${String("WHATSAPPGATEWAY1").yellow} [${whatsAppGroup.red}] ..${message.blue}`)
  var jsonPayload = JSON.stringify({
    group_admin: "6597668621", // TODO: Specify the WhatsApp number of the group creator, including the country code
    group_name: whatsAppGroup,   // TODO:  Specify the name of the group
    message: message  // TODO: Specify the content of your message
  });
  // ----------------------
  var whatAppOptions = {
    hostname: "api.whatsmate.net",
    port: 80,
    path: "/v3/whatsapp/group/text/message/" + MessengingGateway.WhatsMateAccount2.instanceId,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-WM-CLIENT-ID": MessengingGateway.WhatsMateAccount2.clientId,
      "X-WM-CLIENT-SECRET": MessengingGateway.WhatsMateAccount2.clientSecret,
      "Content-Length": Buffer.byteLength(jsonPayload)
    }
  };
  // -----------
  try {
    var request = new http.ClientRequest(whatAppOptions);
    request.on('error', function (err) {
      console.log(`[${'DECODERS.JS'.yellow}] .. SEND WHATSMATE ACCOUNT 1 (WHATSAPP) ERROR <${err}>`)
    });
    request.end(jsonPayload);
    request.on('response', function (response) {
      // ------
      response.setEncoding('utf8');
      response.on('data', function (chunk) {
        try {
          let JSONObject = JSON.parse(chunk);
          decoders.WhatsMateResponse('WHATSAPPGATEWAY1', whatsAppGroup, JSONObject);
          _logs.append('_WHATSMATE_WHATSAPP1', `[WHATSMATE ACCOUNT 2] ${getDateTimeStamp()} ${whatsAppGroup} ..${JSONObject?.id}/${JSONObject?.result}`, () => { });
        } catch (err) {
          console.log('[WHATSAPPGATEWAY1] ERROR PARSING JSON:', err?.message)
        }
      });
    });
  } catch (err) {
    console.log(`[${'DECODERS.JS'.yellow}] .. SEND WHATSMATE ACCOUNT 2 (WHATSAPP) ERROR <${err}>`)
  }
}
decoders.WhatsAppGateway2 = function (whatsAppGroup, message) {
  // --------------------------
  _DEBUG && console.log(`  >>[DECODERS.JS] LINE:1232 DECODERS =>${String("WHATSAPPGATEWAY2").yellow} [${whatsAppGroup.red}] ..${message.blue}`);
  var jsonPayload = JSON.stringify({
    group_admin: "6597668621", // TODO: Specify the WhatsApp number of the group creator, including the country code
    group_name: whatsAppGroup,   // TODO:  Specify the name of the group
    message: message  // TODO: Specify the content of your message
  });
  // ----------------------
  var whatAppOptions = {
    hostname: "api.whatsmate.net",
    port: 80,
    path: "/v3/whatsapp/group/text/message/" + MessengingGateway.WhatsMateAccount3.instanceId,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-WM-CLIENT-ID": MessengingGateway.WhatsMateAccount3.clientId,
      "X-WM-CLIENT-SECRET": MessengingGateway.WhatsMateAccount3.clientSecret,
      "Content-Length": Buffer.byteLength(jsonPayload)
    }
  };
  // -----------
  try {
    var request = new http.ClientRequest(whatAppOptions);
    request.on('error', function (err) {
      console.log(`[${'DECODERS.JS'.yellow}] .. SEND WHATSMATE ACCOUNT 2 (WHATSAPP) ERROR <${err}>`)
    });
    request.end(jsonPayload);
    request.on('response', function (response) {
      // ------
      response.setEncoding('utf8');
      response.on('data', function (chunk) {
        try {
          let JSONObject = JSON.parse(chunk);
          decoders.WhatsMateResponse('WHATSAPPGATEWAY2', whatsAppGroup, JSONObject);
          _logs.append('_WHATSMATE_WHATSAPP2', `[WHATSMATE ACCOUNT 2] ${getDateTimeStamp()} ${whatsAppGroup} ..${JSONObject?.id}/${JSONObject?.result}`, () => { });
        } catch (err) {
          console.log('[WHATSAPPGATEWAY2] ERROR PARSING JSON:', err?.message);
        }
      });
    });
  } catch (err) {
    console.log(`[${'DECODERS.JS'.yellow}] .. SEND WHATSMATE ACCOUNT 3 (WHATSAPP) ERROR <${err}>`)
  }
}
decoders.WhatsAppGateway28 = function (whatsAppGroup, message) {
  // --------------------------
  _DEBUG && console.log(`  >>[DECODERS.JS] LINE:1275 [${getDateTimeStamp()}] DECODERS =>${String("WHATSAPPGATEWAY28").yellow} [${whatsAppGroup}] ..${message}`)
  var jsonPayload = JSON.stringify({
    group_admin: "6597668621", // TODO: Specify the WhatsApp number of the group creator, including the country code
    group_name: whatsAppGroup,   // TODO:  Specify the name of the group
    message: message  // TODO: Specify the content of your message
  });
  // ----------------------
  var whatAppOptions = {
    hostname: "api.whatsmate.net",
    port: 80,
    path: "/v3/whatsapp/group/text/message/" + MessengingGateway.WhatsMateAccount4.instanceId,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-WM-CLIENT-ID": MessengingGateway.WhatsMateAccount4.clientId,
      "X-WM-CLIENT-SECRET": MessengingGateway.WhatsMateAccount4.clientSecret,
      "Content-Length": Buffer.byteLength(jsonPayload)
    }
  };
  // -----------
  try {
    var request = new http.ClientRequest(whatAppOptions);
    request.on('error', function (err) {
      console.log(`[${'DECODERS.JS'.yellow}] .. SEND WHATSMATE ACCOUNT 3 (WHATSAPP) ERROR <${err}>`)
    });
    request.end(jsonPayload);
    request.on('response', function (response) {
      // ------
      response.setEncoding('utf8');
      response.on('data', function (chunk) {
        try {
          let JSONObject = JSON.parse(chunk);
          decoders.WhatsMateResponse('WHATSAPPGATEWAY28', whatsAppGroup, JSONObject);
          _logs.append('_WHATSMATE_WHATSAPP28', `[WHATSMATE ACCOUNT 4] ${getDateTimeStamp()} ${whatsAppGroup} ..${JSONObject?.id}/${JSONObject?.result}`, () => { });
        } catch (err) {
          console.log('[WHATSAPPGATEWAY28] ERROR PARSING JSON:', err.message);
        }
      });
    });
  } catch (err) {
    console.log(`[${'DECODERS.JS'.yellow}] .. SEND WHATSMATE ACCOUNT 4 (WHATSAPP) ERROR <${err}>`)
  }
}
decoders.WhatsAppGateway30 = function (whatsAppGroup, message) {
  // --------------------------
  _DEBUG && console.log(`  >>[DECODERS.JS] LINE:1380 [${getDateTimeStamp()}] DECODERS =>${String("WHATSAPPGATEWAY30").yellow} [${whatsAppGroup.red}] ..${message.blue}`)
  var jsonPayload = JSON.stringify({
    group_admin: "6597668621", // TODO: Specify the WhatsApp number of the group creator, including the country code
    group_name: whatsAppGroup,   // TODO:  Specify the name of the group
    message: message  // TODO: Specify the content of your message
  });
  // ----------------------
  var whatAppOptions = {
    hostname: "api.whatsmate.net",
    port: 80,
    path: "/v3/whatsapp/group/text/message/" + MessengingGateway.WhatsMateAccount5.instanceId,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-WM-CLIENT-ID": MessengingGateway.WhatsMateAccount5.clientId,
      "X-WM-CLIENT-SECRET": MessengingGateway.WhatsMateAccount5.clientSecret,
      "Content-Length": Buffer.byteLength(jsonPayload)
    }
  };
  // -----------
  try {
    var request = new http.ClientRequest(whatAppOptions);
    request.on('error', function (err) {
      console.log(`[${'DECODERS.JS'.yellow}] .. SEND WHATSMATE ACCOUNT 4 (WHATSAPP) ERROR <${err}>`)
    });
    request.end(jsonPayload);
    request.on('response', function (response) {
      // ------
      response.setEncoding('utf8');
      response.on('data', function (chunk) {
        try {
          let JSONObject = JSON.parse(chunk);
          decoders.WhatsMateResponse('WHATSAPPGATEWAY30', whatsAppGroup, JSONObject);
          _logs.append('_WHATSMATE_WHATSAPP30', `[WHATSMATE ACCOUNT 4] ${getDateTimeStamp()} ${whatsAppGroup} ..${JSONObject?.id}/${JSONObject?.result}`, () => { });
        } catch (err) {
          console.log('[WHATSAPPGATEWAY30] ERROR PARSING JSON:', err?.message);
        }
      });
    });
  } catch (err) {
    console.log(`[${'DECODERS.JS'.yellow}] .. SEND WHATSMATE ACCOUNT 4 (WHATSAPP) ERROR <${err}>`)
  }
}
//  ---------
//  GREEN-API
//  ---------
decoders.GreenAPI = function (whatsAppGroup, message) {
  const restAPI = whatsAppClient.restAPI(({
    idInstance: 7105322952,
    apiTokenInstance: '3bf1711c9a8b486d84eaca0818a583e9a68290b0eb0c48ad81'
  }))
  restAPI.message.sendMessage("79999999999@c.us", null, "hello world")
    .then((data) => {
      console.log(data);
    });
}
//  ---------------------------
//  SEND TEST MESSAGE VIA EMAIL 
//  ---------------------------
decoders.sendEmail = function (sensor, str) {
  // -----
  let testAccount = nodemailer.createTestAccount();
  // create reusable transporter object using the default SMTP transport
  console.log(`[DECODERS.JS] ... SENDING EMAIL...`);
  // --------
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // use SSL
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
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        // console.log('Email sent: ' + info.response);
      }
    });
  } catch (err) {
    _logs.append('_ERROR', `[DECODERS.JS] [MAILER..SEND EMAIL] <${err}>`, () => { { } });
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
