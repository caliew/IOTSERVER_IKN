/*
 * HTTP/HTTPS SERVER RELATED TASKS
*/
// Dependencies
var net = require("net");
var http = require("http");
var https = require("https");
// ------------------------------------
var formidable = require('formidable');
var url = require("url");
var StringDecoder = require("string_decoder").StringDecoder;
var fs = require("fs");
var sub = require("date-fns");
// ----------------------------
var colors = require('colors');
var path = require("path");
var util = require("util");
// 
// var crc16 = require('node-crc16');
var _data = require("./data");
var _logs = require("./logs");
var config = require("./config");
var handlers = require("./handlers");
var decoders = require("./decoders");
var helpers = require("./helpers");
var gatewayTracker = require('./gatewayTracker');
// ---------------------------------
var debug = util.debuglog("server");
// ---------------------------------
const AlertGroup = require('../models/AlertGroup');
const { CONNREFUSED } = require("dns");
const { Socket } = require("dgram");
// ---------------------------------
// import * as echarts from 'echarts';
// Instantiate the server module object
var server = {};
//  ------------------------------
//  Track Active Socket Connection
//  ------------------------------
server.socketArr = [];
server.AlertArr = {};
//  -----------------
//  Utility Functions
//  -----------------
function HEXTOINT(hex) {
  if (hex.length % 2 != 0) {
      hex = "0" + hex;
  }
  var num = parseInt(hex, 16);
  var maxVal = Math.pow(2, hex.length / 2 * 8);
  if (num > maxVal / 2 - 1) {
      num = num - maxVal
  }
  return num;
}
const hexToDecimal = hex => ((parseInt(hex.slice(0, 2), 16) * 256 + parseInt(hex.slice(2, 4), 16)) / 10000 );
function hex_to_ascii(str1) {
  var hex = String(str1);
  var str = "";
  try
  {
    for (var n = 0; n < hex.length; n += 2) {
      str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
  } catch {
    str = `ERROR... HEX_TO_ASCII <${str1}>`
  }
  return str;
}
function hexToSignedInt(hex) {
  if (hex.length % 2 !== 0) {
    hex = "0" + hex;
  }
  var num = parseInt(hex, 16);
  var maxVal = Math.pow(2, (hex.length / 2) * 8);
  if (num > maxVal / 2 - 1) {
    num = num - maxVal;
  }
  return num;
};
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
function GetTIMEStamp() {
  let datetimeNow = new Date();
  let hourNow = String(datetimeNow.getHours()).padStart(2,"0");
  let minuteNow = String(datetimeNow.getMinutes()).padStart(2,"0");
  return `${hourNow}:${minuteNow}`;
}
function getSensorObj(PORTID,DTUID,MODE,SENSORID,RCV_BYTES) {
  let sensorObj = {};
  sensorObj['TIMESTAMP'] = new Date();
  sensorObj['PORT.ID'] = PORTID;
  sensorObj['MODE'] = MODE,
  sensorObj['DTU.ID'] = DTUID;
  sensorObj['SENSOR.ID'] = SENSORID;
  sensorObj['RCV.BYTES'] = RCV_BYTES;
  let nDATA = RCV_BYTES?.length/2/2;
  for (let i = 0; i < nDATA; i++) {
    let _BYTE = RCV_BYTES.substr(i*4,4);
    let _DATA = parseInt(_BYTE,16);
    if (i==0) sensorObj['RH']= _DATA;
    if (i==1) sensorObj['TEMP']= _DATA;
    if (i==2) sensorObj['CO2']= _DATA;
  }
  return sensorObj;
}
// ---------
// MQQT PORT
// ---------
server.tcpServer1883 = net.createServer(function(socket){
  // --------
  let buffer;  
  let _PortID = 1883;
  let _PortIDFile = `_${_PortID}`;
  var decoder = new StringDecoder("hex");
  var clientAddress = `${socket.remoteAddress}>${socket.remotePort}`;
  //  ---------------------
  //  When Data Received...
  //  --------------------- 
  socket.on("data", function (data) {
    // --------------------------
    buffer = decoder.write(data);
    buffer = buffer.replace("undefined", "");
    // ---------------------
    _logs.append(_PortIDFile, `[SERVER.JS] ${GetTIMEStamp()} <${String(_PortID)}> BUFFER <${buffer}>`,()=>{});
  });
  //  -----------------------------
  //  When Data Transmission End...
  //  -----------------------------
  socket.once("end", function () {
    console.log(`[${'SERVER.JS'.yellow}] ${GetTIMEStamp()} <${String(_PortID).yellow}> ...${'GATEWAY SOCKET END'.red}...`);
    _logs.append('_ERROR', `[SERVER.JS] ${GetTIMEStamp()} <${String(_PortID)}> SOCKET END ...${clientAddress}`,()=>{});
  });
  //  --------------------------
  //  When Connection Closed ...
  //  --------------------------
  socket.once("close", function () {
    try {
      // ------
      console.log(`[${'SERVER.JS'.yellow}] ${GetTIMEStamp()} <${String(_PortID).green}> ...${'GATEWAY SOCKET CLOSE'.red}...`);
      _logs.append('_ERROR', `[SERVER.JS] ${GetTIMEStamp()} <${String(_PortID)}> SOCKET CLOSE ...${clientAddress}`,()=>{});
      // ------
      server.socketArr.pop(Socket);
    } catch (e) {}
    // --------
  });
  //  -------------------------
  //  When There Is An Error...
  //  -------------------------
  socket.on("error", function (err) {
    socket.destroy();
  });
  // 
  socket.setTimeout(1000*60*30, function () {
    console.log(`.....[${String(_PortID)}] DISCONNECTING CLIENT ...`);
    socket.end(`.....[${String(_PortID)}] DISCONNECTING CLIENT ...`);
  });
})
server.tcpServer8883 = net.createServer(function(socket){
  // --------
  let buffer;  
  let _PortID = 8883;
  let _PortIDFile = `_${_PortID}`;
  var decoder = new StringDecoder("hex");
  var clientAddress = `${socket.remoteAddress}>${socket.remotePort}`;
  //  ---------------------
  //  When Data Received...
  //  --------------------- 
  socket.on("data", function (data) {
    // --------------------------
    buffer = decoder.write(data);
    buffer = buffer.replace("undefined", "");
    // ---------------------
    _logs.append(_PortIDFile, `[SERVER.JS] ${GetTIMEStamp()} <${String(_PortID)}> BUFFER <${buffer}>`,()=>{});
  });
  //  -----------------------------
  //  When Data Transmission End...
  //  -----------------------------
  socket.once("end", function () {
    console.log(`[${'SERVER.JS'.yellow}] ${GetTIMEStamp()} <${String(_PortID).green}> ...${'GATEWAY SOCKET END'.red}...`);
    _logs.append('_ERROR', `[SERVER.JS] ${GetTIMEStamp()} <${String(_PortID)}> SOCKET END ...${clientAddress}`,()=>{});
  });
  //  --------------------------
  //  When Connection Closed ...
  //  --------------------------
  socket.once("close", function () {
    try {
      // ------
      console.log(`[${'SERVER.JS'.yellow}] ${GetTIMEStamp()} <${String(_PortID).green}> ...${'GATEWAY SOCKET CLOSE'.red}...`);
      _logs.append('_ERROR', `[SERVER.JS] ${GetTIMEStamp()} <${String(_PortID)}>  SOCKET CLOSE ...${clientAddress}`,()=>{});
      // ------
      server.socketArr.pop(Socket);
    } catch (e) {}
    // --------
  });
  //  -------------------------
  //  When There Is An Error...
  //  -------------------------
  socket.on("error", function (err) {
    socket.destroy();
  });
  // 
  socket.setTimeout(1000*60*30, function () {
    console.log(`.....[${String(_PortID)}] DISCONNECTING CLIENT ...`);
    socket.end(`.....[${String(_PortID)}] DISCONNECTING CLIENT ...`);
  });
})
// ----------------------------------------------
// INSTANTIATE GENERIC TCP SERVER ON GENERIC PORT
// ----------------------------------------------
const formatDate = () => {
  const datetimeNow = new Date();
  const day = String(datetimeNow.getDate()).padStart(2,'0');
  const month = String(datetimeNow.getMonth()+1).padStart(2,'0');
  const year = String(datetimeNow.getFullYear()).slice(-2);
  const hourNow = String(datetimeNow.getHours()).padStart(2,"0");
  const minuteNow = String(datetimeNow.getMinutes()).padStart(2,"0");
  return `${day}/${month}/${year} `
}
function truncateString(str, length) {
  let StrUC = str.toUpperCase();
  if (StrUC.length <= length) return StrUC;
  const truncated = StrUC.toUpperCase().substring(0, length - 4) + '...' + StrUC.substring(StrUC.length - 4);
  return truncated;
}
function trimHexArray(arr) {
  return arr.map(hex => hex.slice(0, 6) + '..');
}
function startTCPServer(FileName,PortID,blnDEBUG) {
  // ----------------------------------------
  // FileName = USE IN AP MODE AS DOMAIN NAME
  // ----------------------------------------
  const tcpServer = net.createServer(function(socket) {
    // --------
    let buffer;
    let _CMODE = '';
    let _DEBUGINT = true;
    let address = socket.address();
    let _PORTID = address.port;
    let _PORTIDFile = `_${_PORTID}`;
    let _RAWFile = `_${FileName}`;
    let _PortALERTFILE = `_${FileName}ALERTS`;
    let _REGISTERKEYS = {
      1008:["88888888","78563412","50512412","37518050","83709728","2345678901"],
      1010:["50512412","37518050","83709728","53485431"],
      1009:[""],
      1088:['88888888',"64011120"]
    };
    // ---------------------------------------------------------------------------------------
    var decoder = new StringDecoder("hex");
    var clientAddress = `${socket.remoteAddress}>${socket.remotePort}`;
    //  ---------------------
    //  ON DATA RECEIVED ....
    //  ---------------------             
    const blnSKIPWISENSOR1 = false;
    const blnSKIPWISENSOR2 = false;
    const blnSKIP485SENSOR = false;
    true && blnDEBUG && _logs.append(_PORTIDFile, `[SERVER.JS] LINE:281 <${_PORTID}> <${clientAddress}>`,()=>{});
    // blnDEBUG && console.log(`[SERVER.JS] <PORT=${_PORTID} PORT FILE=${_PORTIDFile}> <ADDRESS=${clientAddress}>`);
    socket.on("data", function (data) {
      // --------------------------
      buffer = decoder.write(data);
      buffer = buffer.replace("undefined", "");
      // --------------------------------------
      if (buffer.length > 4) {
        // -----------
        const MATCHKEY = buffer.substring(0, 8).toString("UTF-8").toUpperCase();
        const ASCIIKEY = hex_to_ascii(MATCHKEY)
        let _APKEY = buffer.substring(0, 2).toString("UTF-8").toUpperCase();
        ( blnDEBUG && (_APKEY!="0D")) && _logs.append(_PORTIDFile, `[SERVER.JS] ${GetTIMEStamp()} <${_PORTID}> [-293-] APKEY=[${_APKEY}] REGKEY=${MATCHKEY} BUFFER=[${buffer.length}]${buffer}`,()=>{});
        ( blnDEBUG && (_APKEY!="0D")) && console.log(`[SERVER.JS] ${GetTIMEStamp()} <${String(_PORTID).rainbow}> [-294-] APKEY=[${String(_APKEY).red}] REGKEY=[${String(MATCHKEY).green}] BUFFER=[${String(buffer.length).yellow}]${String(truncateString(buffer,35)).rainbow}`);
        // -----------------------------------
        if (_REGISTERKEYS?.[_PORTID] && _REGISTERKEYS?.[_PORTID].includes(MATCHKEY)) {
          // ---------------------------------------------------
          let DEVICEID = hex_to_ascii(buffer.substring(10, 30));
          console.log(`[${"SERVER.JS".yellow}] ${GetTIMEStamp()} <${String(_PORTID).magenta}> DEVICE=${DEVICEID.green} [${String(_RAWFile).cyan}].. REGKEY=[${MATCHKEY.cyan}] APKEY=[${_APKEY.yellow}]`);
          _logs.append(_PORTIDFile, `[SERVER.JS] ${GetTIMEStamp()} <${_PORTID}> DEVICE=${DEVICEID} REGKEY=${MATCHKEY} APKEY=${_APKEY}`,()=>{});
          // -------------
          if (DEVICEID) {
            const nArray = server.socketArr.indexOf(socket);
            let gatewayData = {
              PORT : _PORTID,
              MATCHKEY : MATCHKEY,
              GATEWAYID: DEVICEID,
              ADDRESS  : clientAddress,
              TIMESTAMP: new Date(),
              SOCKET   : socket
            }
            if (nArray > -1) {
              server.socketArr.pop(nArray);
              // ---------------------------
            } 
            server.socketArr.push(gatewayData);
            gatewayTracker.INSERT(gatewayData);
            // ----------
          } else {
            console.log("ERROR PROCESSING PACKET [%s] FROM LORA GATEWAY[%s] >>",buffer,clientAddress);
          }
        } else if (["2B","80"].includes(_APKEY)) {  // TRANS MODE
          // ---------------
          // AT (TRANS) MODE ASCIIKEY == "+RCV" -- 2B524356
          // ---------------
          _CMODE = 'TRANS'
          var DataArr = buffer.toString("hex").toUpperCase().split("0D");
          // -------------------------------
          let DataArr2C = DataArr[0].split("2C");
          // -----------------------
          DataArr2C = DataArr.length > 2 ? (DataArr[0]+'0D'+DataArr[1]).split("2C") : DataArr[0].split("2C");
          let _CHECKHEADERTEXT = DataArr2C[1] ?? DataArr2C[0];
          const _HEADER = _CHECKHEADERTEXT.substring(0, 2).toString("UTF-8").toUpperCase();
          // ------------------------------------------------------
          // DATAARR.LENGTH < 4 HEADER='FA' => decodeF8L10ST_ATMODE
          // DATAARR.LENGTH < 4 HEADER='80' => decodeWISensorV2
          // DATAARR.LENGTH < 4 OTHERS      => decode485Sensor
          // DATAARR.LENGTH > 4 ------      => decodeWISensorV1
          // --------------------------------------------------
          if (DataArr.length < 4) {
            if (_HEADER === 'FA') {
              // F8L10ST - SELF BATTERY
              // -----------------------
              false && blnDEBUG && _logs.append(_PORTIDFile, `[SERVER.JS] ${GetTIMEStamp()} <${_PORTID}> [${String(_CMODE)}] HEADER=${String(_HEADER)} DATAARR=[${String(DataArr.length)}] =decodeF8L10ST_ATMODE=`,()=>{});
              false && blnDEBUG && console.log(`[SERVER.JS] ${GetTIMEStamp()} <${String(_PORTID).yellow}> [${String(_CMODE).red}] HEADER=${String(_HEADER).green} DATAARR=[${String(DataArr.length).yellow}] =decodeF8L10ST_ATMODE=`);
              // ---------------------
              const DTUIDMap = {
                11: 102,
                1: 2
              }
              decoders.decodeF8L10ST_ATMODE(_PORTID,buffer,blnDEBUG,function(statusCode,payload) {
                // ------
                const _SENSORID = payload._SENSORID ?? '0';
                const _DTUID = DTUIDMap[_SENSORID] ?? _SENSORID;
                const _HEXSTR = payload._DATAHEX;
                const _RAWFILENAME = `${_DTUID}-${_SENSORID}`;
                const _ARRAY = Array(Math.ceil(_HEXSTR.length / 4)).fill().map((_, i) => _HEXSTR.substring(i * 4, (i + 1) * 4));
                if (_SENSORID < 1 || _ARRAY.length > 10) return;
                blnDEBUG && console.log(`[${"SERVER.JS".yellow}] [${"TRAN".red}] LINE:350 ${String(_PORTID).yellow} ${String(FileName).green} =decodeF8L10ST_ATMODE= .${String(statusCode).blue}. HEADER[${String(_HEADER).red}]`);
                false && console.log(`[SERVER.JS] ${String(PortID).yellow} RAW_FILE=<${String(_RAWFile).green}> DECODEF8L10ST_ATMODE [LINE:360] STATUS CODE=${String(statusCode).red} DTU.ID=${_DTUID} SENSOR.ID=${_SENSORID} <${_RAWFILENAME}> HEX_DATA=${payload._DATAHEX} ${_ARRAY}`);
                // ------
                const ObjSENSOR = {
                  DTUID:_DTUID,
                  SENSORID: _SENSORID,
                  SENSORTYPE:"PWR-METER-POWER",
                  FUNCID:3,
                  NDATA:2,
                  RCV_BYTES:_ARRAY,
                  DATAS:[56,-15701],
                  TIMESTAMP: new Date(),
                }
                payloadString = JSON.stringify(ObjSENSOR);
                blnDEBUG && _logs.append(_PORTIDFile, String(buffer),()=>{});
                blnDEBUG && _logs.append(_PORTIDFile, payloadString,()=>{});
                if (statusCode == 200) {
                  // -------------------------
                  false && console.log(`..${_PORTID}...DECODE decodeF8L10ST_ATMODE (ATMODE) STATUS CODE=[${statusCode}] LOG APPEND=<${_RAWFILENAME}>`)
                  false && console.log(payloadString)
                  _logs.append(_RAWFILENAME,`${payloadString}`,(err)=>{
                    // console.log(err)
                  });
                  // console.log(payload);
                }
              })
              // --------    
            } else if (["80","01","FD"].includes(_APKEY) || _HEADER=='80') {
              // -------------------------------------------------------------
              // WISENSOR NEW PROTOCOL V2.10 HEADER = '80' > CALL NEW DECODER
              // -------------------------------------------------------------
              false && blnDEBUG && _logs.append(_PORTIDFile, `[SERVER.JS] ${GetTIMEStamp()} <${_PORTID}> [${String(_CMODE)}] HEADER=${String(_HEADER)} DATAARR=[${String(DataArr.length)}] =decodeWISensorV2=`,()=>{});
              false && blnDEBUG && console.log(`[SERVER.JS] ${GetTIMEStamp()} <${String(_PORTID).yellow}> [${String(_CMODE).red}] HEADER=${String(_HEADER).green} DATAARR=[${String(DataArr.length).yellow}] =decodeWISensorV2=`);
              // ---------------------  
              true && !blnSKIPWISENSOR2 && blnDEBUG && console.log(`[SERVER.JS] ${GetTIMEStamp()} <${String(_PORTID).yellow}> [${String(_CMODE).red}] HEADER=${String(_HEADER).yellow} =decodeWISensorV2= [${String(DataArr?.length).red}][${String(trimHexArray(DataArr)).magenta}]`);
              true && !blnSKIPWISENSOR2 && blnDEBUG && _logs.append(_PORTIDFile, `[SERVER.JS] ${GetTIMEStamp()} <${String(_PORTID)}> [${_CMODE}] HEADER=${String(_HEADER)} =decodeWISensorV2= [${DataArr?.length}][${String(trimHexArray(DataArr2C))}]`,()=>{});
              let _DATA = (DataArr2C.length ==2 ) ? DataArr2C[1]: DataArr2C.slice(2).join('2C');
              _DATA = _DATA.substring(0,2) == "80" ? _DATA : DataArr2C.join('2C');
              const _JOINBLOCK = [DataArr2C[1], ...DataArr2C.slice(2)].join('2C');
              // POSIBILITY 
              // 2b5243563a3133 2c 80a0001810ba80b6c5d4a616011708341902581b641c01b6200728bdff0d0a
              // 2b5243563a35   2c 80a0001810ba910e880e2e16011708341902581b641c01b620f79a0dff0d0a
              // 80a0001b10b09ccce7c0b6160117083419012c1b641c01b1200a902120c13eff
              // console.log(DataArr2C.length,_DATA);
              blnDEBUG && console.log(`[SERVER.JS] LINE:403 PORT=${_PORTID} --INITIALIZE DECODEWISENSORV2--`);
              decoders.decodeWISensorV2(_PORTID,blnDEBUG,buffer,function (statusCode, payload) {
                const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload || {};
                // ------
                blnDEBUG && console.log(`[SERVER.JS] LINE:406 DECODEWISENSORV2 PORT=${_PORTID} STATUS CODE=${statusCode} MODELID=${modelID} MODELTYPE=${modelType} TEMP=${Temperature} HUM=${Humidity} BATT=${BATT} INTERVAL=${INTERVAL}`);
                !blnSKIPWISENSOR2 && blnDEBUG && console.log(`[${"SERVER.JS".yellow}] LINE:406 [${String(_CMODE).red}] ${String(_PORTID).yellow} ${String(FileName).green} =decodeWISensorV2= .${String(statusCode).blue}. HEADER[${String(_HEADER).red}] |${String(modelType??'-').cyan}|${String(modelID??'-').toUpperCase().magenta}|${String(Temperature??'-').red}|${String(Humidity??'-').cyan}|${String(BATT??'-').green}|${String(INTERVAL??'-').blue}|`);
                !blnSKIPWISENSOR2 && blnDEBUG && _logs.append(_PORTIDFile, `[SERVER.JS] LINE:407 ${GetTIMEStamp()} <${_PORTID}> [${_CMODE}] =decodeWISensorV2= HEADER=[${_HEADER}] <${statusCode}> [${modelID}]`,()=>{});
                !blnSKIPWISENSOR2 && blnDEBUG && _logs.append(_PORTIDFile, `[${"SERVER.JS"}] LINE:4-8 [${_CMODE}] ${String(_PORTID)} ${String(FileName)} =decodeWISensorV2= .${String(statusCode)}. HEADER[${String(_HEADER)}] |${String(modelType??'-')}|${String(modelID??'-').toUpperCase()}|${String(Temperature??'-')}|${String(Humidity??'-')}|${String(BATT??'-')}|${String(INTERVAL??'-')}|`,()=>{});
                if (_PORTID === 1008) _logs.append(_PORTIDFile, `${String(modelID??'-').toUpperCase()}`,()=>{});
                // ------
                if (statusCode == 407 )  {
                  _data.read(FileName,'settings',function(err,settingData) {
                    //  ------------------------
                    let _DTUID = String(payload?.modelID ?? '').toUpperCase();
                    let _MODE = payload._MODE;
                    let _HEX = payload._DATAHEX;
                    let _FoundSensor = settingData?.["IOT_SENSORS"]?.[_DTUID] ? settingData["IOT_SENSORS"][_DTUID] : null;
                    if (_FoundSensor == null) return;
                    if (!_FoundSensor.hasOwnProperty("1")) return;
                    _FoundSensor = _FoundSensor["1"];
                    //  -------------------------
                    let _TYPE = _FoundSensor.TYPE;
                    let _NAME = _FoundSensor.NAME;
                    let _GROUP = _FoundSensor.GROUP;
                    let _AMPMAX = _FoundSensor.AMP_MAX ?? null;
                    let _AMPMIN = _FoundSensor.AMP_MIN ?? null;
                    let _PRESSMAX = _FoundSensor.PRESS_MAX ?? null;
                    let _PRESSMIN = _FoundSensor.PRESS_MIN ?? null;
                    let _TEMPMAX = _FoundSensor.TEMP_MAX ?? null;
                    let _TEMPMIN = _FoundSensor.TEMP_MIN ?? null;
                    let _RHMAX = _FoundSensor.RH_MAX ?? null;
                    let _RHMIN = _FoundSensor.RH_MIN ?? null;
                    let _DEWMAX = _FoundSensor.DEW_MAX ?? null;
                    let _DEWMIN = _FoundSensor.DEW_MIN ?? null;
                    let _UNITSYSTEM = _FoundSensor.UNITSYSTEM ? _FoundSensor.UNITSYSTEM.toUpperCase() : null;
                    let _READINGCURRENT,_READINGPRESSURE,_READINGTEMP,_READINGRH,_READINGDEW;
                    let _ALERT = _FoundSensor.ALERT ? _FoundSensor.ALERT : false;
                    let _ALERTFLAG = _FoundSensor?.ALERTFLAG ?? 0;                    
                    //  --------------
                    let _FLAG = false;
                    let _ALERTObj = {};
                    _ALERTObj['TYPE'] = _TYPE;
                    _ALERTObj['DTU'] = _DTUID;
                    _ALERTObj['NAME'] = _NAME;
                    _ALERTObj['GROUP'] = _GROUP;
                    _ALERTObj['TIMESTAMP'] = new Date();
                    let _MESSAGE = `..[${_NAME.toUpperCase()}]..`;
                    //  --------------
                    switch (_TYPE) {
                      case 'WATER LEVEL':
                      case 'AC CURRENT':
                        let _FLAGCURR = false;
                        _READINGCURRENT = Number(hexToSignedInt(_HEX)/100);
                        _FLAG = (_AMPMAX == null) ? false : (_READINGCURRENT > _AMPMAX) ? true: false;
                        _FLAG && (_MESSAGE += ` CURRENT=${_READINGCURRENT}>${_AMPMAX}A`);
                        _FLAGCURR = _FLAGCURR || _FLAG;
                        _FLAG = (_AMPMIN == null) ? false : (_READINGCURRENT < _AMPMIN) ? true: false;
                        _FLAG && (_MESSAGE += ` CURRENT=${_READINGCURRENT}<${_AMPMIN}A`);
                        _FLAG = _FLAGCURR || _FLAG;
                        _ALERTObj['CURRENT'] = _READINGCURRENT;
                        break;
                      case 'AIR PRESSURE':
                          let _FLAGPRESS = false;
                          _READINGPRESSURE = parseFloat(`0x${_HEX.slice(4,8)}${_HEX.slice(0,4)}`);
                          _READINGPRESSURE = _UNITSYSTEM == 'BAR' ? _READINGPRESSURE : (_READINGPRESSURE*1.0E-5).toFixed(2);
                          _PRESSMAX = _UNITSYSTEM == 'BAR' ? _PRESSMAX : (_PRESSMAX*1.0E-5).toFixed(2);
                          _PRESSMIN = _UNITSYSTEM == 'BAR' ? _PRESSMIN : (_PRESSMIN*1.0E-5).toFixed(2);
                          false && console.log(_READINGPRESSURE,_PRESSMIN,_PRESSMAX)
                          _FLAG = (_PRESSMAX == null) ? false : (_READINGPRESSURE > _PRESSMAX) ? true: false;
                          _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE}>${_PRESSMAX} ${_UNITSYSTEM}`);
                          _FLAGPRESS = _FLAGPRESS || _FLAG;
                          _FLAG = (_PRESSMIN == null) ? false : (_READINGPRESSURE < _PRESSMIN) ? true: false;
                          _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE}<${_PRESSMIN} ${_UNITSYSTEM}`);
                          _FLAG = _FLAG || _FLAGPRESS;
                          _ALERTObj['PRESSURE'] = _READINGPRESSURE;
                        break;
                      case 'WISENSOR':
                      case 'TEMP & RH':                        
                        _READINGTEMP = Temperature;
                        _READINGRH = Humidity;
                        _ALERTObj['TEMP'] = _READINGTEMP;
                        _ALERTObj['RH'] = _READINGRH;
                        let _FLAGTEMPRH = false;
                        false && console.log('TEMPERATURE=',_TEMPMIN,_READINGTEMP,_TEMPMAX,'HUMIDITY=',_RHMIN,_READINGRH,_RHMAX);
                        _FLAG = (_TEMPMAX == null) ? false : (Number(_READINGTEMP) > Number(_TEMPMAX)) ? true: false;
                        _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP}>${_TEMPMAX}C`);
                        false && console.log(` TEMP=${_READINGTEMP}>${_TEMPMAX}C`,_FLAG,_FLAGTEMPRH);
                        _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                        _FLAG = (_TEMPMIN == null) ? false : (Number(_READINGTEMP) < Number(_TEMPMIN)) ? true: false;
                        _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP}<${_TEMPMIN}C`);
                        false && console.log(` TEMP=${_READINGTEMP}<${_TEMPMIN}C`,_FLAG,_FLAGTEMPRH);
                        _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                        false && console.log(_FLAGTEMPRH);
                        if (Number(_READINGRH) > 0) {
                          _FLAG = (_RHMAX == null) ? false : (Number(_READINGRH) > Number(_RHMAX)) ? true: false;
                          _FLAG && (_MESSAGE += ` RH=${_READINGRH}>${_RHMAX}%`);
                          _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                          _FLAG = (_RHMIN == null) ? false : (Number(_READINGRH) < Number(_RHMIN)) ? true: false;
                          _FLAG && (_MESSAGE += ` RH=${_READINGRH}<${_RHMIN}%`);
                        }
                        _FLAG = _FLAGTEMPRH || _FLAG;                        
                        break;
                      case 'DEW PT.METER':
                        let _FLAGDEW = false;
                        _READINGRH = hexToSignedInt(_HEX.slice(0,4))/10;
                        _READINGDEW = hexToSignedInt(_HEX.slice(4,8))/10;
                        _READINGTEMP = hexToSignedInt(_HEX.slice(8,12))/10;
                        _ALERTObj['TEMP'] = _READINGTEMP;
                        _ALERTObj['RH'] = _READINGRH;
                        _ALERTObj['DEW'] = _READINGDEW;
                        _FLAG = (_TEMPMAX == null) ? false : (_READINGTEMP > _TEMPMAX) ? true: false;
                        _FLAG && (_MESSAGE += ` TEMP ${_READINGTEMP}>${_TEMPMAX}C`);
                        _FLAGDEW = _FLAG || _FLAGDEW;
                        _FLAG = (_TEMPMIN == null) ? false : (_READINGTEMP < _TEMPMIN) ? true: false;
                        _FLAG && (_MESSAGE += ` TEMP ${_READINGTEMP}<${_TEMPMIN}C`);
                        _FLAGDEW = _FLAG || _FLAGDEW;
                        _FLAG = (_RHMAX == null) ? false : (_READINGRH > _RHMAX) ? true: false;
                        _FLAG && (_MESSAGE += ` RH ${_READINGRH}>${_RHMAX}%`);
                        _FLAGDEW = _FLAG || _FLAGDEW;
                        _FLAG = (_RHMIN == null) ? false : (_READINGRH < _RHMIN) ? true: false;
                        _FLAG && (_MESSAGE += ` RH ${_READINGRH}<${_RHMIN}%`);
                        _FLAGDEW = _FLAG || _FLAGDEW;
                        _FLAG = (_DEWMAX == null) ? false : (_READINGDEW > _DEWMAX) ? true: false;
                        _FLAG && (_MESSAGE += ` DEW ${_READINGDEW}>${_DEWMAX}C`);
                        _FLAGDEW = _FLAG || _FLAGDEW;
                        _FLAG = (_DEWMIN == null) ? false : (_READINGDEW < _DEWMIN) ? true: false;
                        _FLAG && (_MESSAGE += ` DEW ${_READINGDEW}<${_DEWMIN}C`);
                        _FLAG = _FLAG || _FLAGDEW;
                        break;
                      default:
                        break;
                    }
                    //  -------------
                    !blnSKIPWISENSOR2 && blnDEBUG && console.log(`[${"SERVER.JS".white}] LINE:532 ${GetTIMEStamp()} <${String(_PORTID).yellow}> [${_CMODE.red}] ..[${String(_RAWFile).cyan}].. [${'decodeWISensorV2'.red}] <${String(statusCode).magenta}> [A|F=${String(_ALERT).yellow}|${String(_FLAG).cyan}] ..MESSAGE=${_MESSAGE}`);
                    if (_FLAG) {
                      _ALERTObj['MESSAGE'] = _MESSAGE;
                      // FileName,PortID
                      true && console.log(`${String('DECODEWISENSORV2').green} LINE:540 [${String(_PORTID).yellow}] <${FileName.red}|${String(_FLAG).toUpperCase()}|${String(_ALERT).toUpperCase()}> [${_UNITSYSTEM.green}] <${_TYPE.green}> ${_MESSAGE.red} `)
                      DISPATCH_ALERT(FileName,_PortALERTFILE,_FoundSensor,_ALERTObj,_ALERTFLAG,_ALERT);
                      }
                  });
                }
              });
              // --------------
            } else {
              // ------------------
              false && blnDEBUG && _logs.append(_PORTIDFile, `[SERVER.JS] ${GetTIMEStamp()} <${_PORTID}> [${String(_CMODE)}] HEADER=${String(_HEADER)} DATAARR=[${String(DataArr.length)}] =decode485Sensor=`,()=>{});
              false && blnDEBUG && console.log(`[SERVER.JS] ${GetTIMEStamp()} <${String(_PORTID).yellow}> [${String(_CMODE).red}] HEADER=${String(_HEADER).green} DATAARR=[${String(DataArr.length).yellow}] =decode485Sensor=`);
              // ---------------------  
              false && !blnSKIP485SENSOR && blnDEBUG && console.log(`[SERVER.JS] ${GetTIMEStamp()} <${String(_PORTID).yellow}> [${_CMODE.red}] HEADER=${String(_HEADER).yellow} =decode485Sensor= [${String(trimHexArray(DataArr)).magenta}]`);
              decoders.decode485Sensor(_PORTID,DataArr,function(statusCode,payload) {
                // ------
                // ------
                if (statusCode == 200)  {
                  const {FUNCID,DTUID,SENSORID,SENSORTYPE,NDATA,RCV_BYTES,DATAS,} = payload || {};
                  false && console.log(_PORTID,statusCode,buffer);
                  false && console.log(payload);
                  !blnSKIP485SENSOR && blnDEBUG && console.log(`[${"SERVER.JS".yellow}] [${_CMODE.red}] LINE:520 ${String(_PORTID).yellow} [${String(_CMODE).red}] ${String(FileName).green} =decode485Sensor= .${String(statusCode).blue}. HEADER[${String(_HEADER).yellow}] |${String(DTUID??'-').magenta}|${String(SENSORID??'-').red}|`);
                  !blnSKIP485SENSOR && blnDEBUG && console.log(`[SERVER.JS] ${GetTIMEStamp()} <${String(_PORTID).yellow}> [${String(_CMODE).red}] LINE:508 [${String(_RAWFile).cyan}] [${'decode485Sensor'.red}] <${String(statusCode).magenta}> HEADER=[${_HEADER.yellow}]..${payload.DTUID}|${payload.SENSORID}|${payload.SENSORTYPE}`);
                  !blnSKIP485SENSOR && blnDEBUG && _logs.append(_PORTIDFile, `[SERVER.JS] ${GetTIMEStamp()} <${_PORTID}> [${_CMODE}] =decode485Sensor= HEADER=[${_HEADER}] <${statusCode}> ${SENSORTYPE} [${FUNCID}|${DTUID}|${SENSORID}]`,()=>{}); 
                } else {
                  false && _logs.append(_PORTIDFile, `[SERVER.JS] ${GetTIMEStamp()}  <${_PORTID}> -${_CMODE}- =decode485Sensor= HEADER=[${_HEADER}] <${statusCode}> ..`,()=>{});
                }
              });
            }
            // ---------------
          } else if ( DataArr.length > 4 ) {
            // --------
            false && blnDEBUG && _logs.append(_PORTIDFile, `[SERVER.JS] ${GetTIMEStamp()} <${_PORTID}> [${String(_CMODE)}] HEADER=${String(_HEADER)} DATAARR=[${String(DataArr.length)}] =decodeWISensorV1=`,()=>{});
            false && blnDEBUG && console.log(`[SERVER.JS] ${GetTIMEStamp()} <${String(_PORTID).yellow}> [${String(_CMODE).red}] HEADER=${String(_HEADER).green} DATAARR=[${String(DataArr.length).yellow}] =decodeWISensorV1=`);
            // ---------------------  
            false && !blnSKIPWISENSOR1 && blnDEBUG && console.log(`[SERVER.JS] ${GetTIMEStamp()} <${String(_PORTID).yellow}> [${_CMODE.red}] HEADER=${String(_HEADER).yellow} =decodeWISensorV1= [${String(DataArr?.length).red}][${String(trimHexArray(DataArr)).magenta}]`);
            false && !blnSKIPWISENSOR1 && blnDEBUG && _logs.append(_PORTIDFile, `[SERVER.JS] ${GetTIMEStamp()} <${String(_PORTID)}> [${_CMODE}] HEADER=${String(_HEADER)} =decodeWISensorV1= [${DataArr?.length}][${String(trimHexArray(DataArr))}]`,()=>{});
            decoders.decodeWISensorV1(1008,DataArr,function (statusCode, payload) {
              // ------
              const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload || {};
              let _MODELID = modelID ?? '';
              let _MODELTYPE = modelType ?? '';
              let _TEMP = Temperature ?? '';
              let _HUMD = Humidity ?? '';
              !blnSKIPWISENSOR1 && blnDEBUG && console.log(`[${"SERVER.JS".yellow}] [${_CMODE.red}] LINE:529 ${String(_PORTID).yellow} ${String(FileName).green} =decodeWISensorV1= .${String(statusCode).blue}. HEADER[${String(_HEADER).red}] |${String(_MODELTYPE??'-').cyan}|${String(_MODELID??'-').toUpperCase().magenta}|${String(_TEMP??'-').red}|${String(_HUMD??'-').cyan}|`);
              !blnSKIPWISENSOR1 && blnDEBUG && _logs.append(_PORTIDFile, `[${"SERVER.JS"}] [${_CMODE}] LINE:529 ${String(_PORTID)} ${String(FileName)} =decodeWISensorV1= .${String(statusCode)}. HEADER[${String(_HEADER)}] |${String(_MODELTYPE??'-')}|${String(_MODELID??'-').toUpperCase()}|${String(_TEMP??'-')}|${String(_HUMD??'-')}|`,()=>{});
              if (_PORTID === 1008) _logs.append(_PORTIDFile, `${String(_MODELID??'-').toUpperCase()}`,()=>{});              
              // ------
              if (statusCode == 407 )  {
                _data.read(FileName,'settings',function(err,settingData) {
                  //  ------------------------
                  let _DTUID = String(payload?.modelID ?? '').toUpperCase();
                  let _MODE = payload._MODE;
                  let _HEX = payload._DATAHEX;
                  let _FoundSensor = settingData?.["IOT_SENSORS"]?.[_DTUID] ? settingData["IOT_SENSORS"][_DTUID] : null;
                  if (_FoundSensor == null) return;
                  if (!_FoundSensor.hasOwnProperty("1")) return;
                  _FoundSensor = _FoundSensor["1"];
                  //  -------------------------
                  let _TYPE = _FoundSensor.TYPE;
                  let _NAME = _FoundSensor.NAME;
                  let _GROUP = _FoundSensor.GROUP;
                  let _AMPMAX = _FoundSensor.AMP_MAX ?? null;
                  let _AMPMIN = _FoundSensor.AMP_MIN ?? null;
                  let _PRESSMAX = _FoundSensor.PRESS_MAX ?? null;
                  let _PRESSMIN = _FoundSensor.PRESS_MIN ?? null;
                  let _TEMPMAX = _FoundSensor.TEMP_MAX ?? null;
                  let _TEMPMIN = _FoundSensor.TEMP_MIN ?? null;
                  let _RHMAX = _FoundSensor.RH_MAX ?? null;
                  let _RHMIN = _FoundSensor.RH_MIN ?? null;
                  let _DEWMAX = _FoundSensor.DEW_MAX ?? null;
                  let _DEWMIN = _FoundSensor.DEW_MIN ?? null;
                  let _UNITSYSTEM = _FoundSensor.UNITSYSTEM ? _FoundSensor.UNITSYSTEM.toUpperCase() : null;
                  let _READINGCURRENT,_READINGPRESSURE,_READINGTEMP,_READINGRH,_READINGDEW;
                  let _ALERT = _FoundSensor.ALERT ? _FoundSensor.ALERT : false;
                  let _ALERTFLAG = _FoundSensor?.ALERTFLAG ?? 0;
                  //  --------------
                  let _FLAG = false;
                  let _ALERTObj = {};
                  _ALERTObj['TYPE'] = _TYPE;
                  _ALERTObj['DTU'] = _DTUID;
                  _ALERTObj['NAME'] = _NAME;
                  _ALERTObj['GROUP'] = _GROUP;
                  _ALERTObj['TIMESTAMP'] = new Date();
                  let _MESSAGE = `..[${_NAME.toUpperCase()}]..`;
                  //  --------------
                  switch (_TYPE) {
                    case 'WATER LEVEL':
                    case 'AC CURRENT':
                      let _FLAGCURR = false;
                      _READINGCURRENT = Number(hexToSignedInt(_HEX)/100);
                      _FLAG = (_AMPMAX == null) ? false : (_READINGCURRENT > _AMPMAX) ? true: false;
                      _FLAG && (_MESSAGE += ` CURRENT=${_READINGCURRENT}>${_AMPMAX}A`);
                      _FLAGCURR = _FLAGCURR || _FLAG;
                      _FLAG = (_AMPMIN == null) ? false : (_READINGCURRENT < _AMPMIN) ? true: false;
                      _FLAG && (_MESSAGE += ` CURRENT=${_READINGCURRENT}<${_AMPMIN}A`);
                      _FLAG = _FLAGCURR || _FLAG;
                      _ALERTObj['CURRENT'] = _READINGCURRENT;
                      break;
                    case 'AIR PRESSURE':
                        let _FLAGPRESS = false;
                        _READINGPRESSURE = parseFloat(`0x${_HEX.slice(4,8)}${_HEX.slice(0,4)}`);
                        _READINGPRESSURE = _UNITSYSTEM == 'BAR' ? _READINGPRESSURE : (_READINGPRESSURE*1.0E-5).toFixed(2);
                        _PRESSMAX = _UNITSYSTEM == 'BAR' ? _PRESSMAX : (_PRESSMAX*1.0E-5).toFixed(2);
                        _PRESSMIN = _UNITSYSTEM == 'BAR' ? _PRESSMIN : (_PRESSMIN*1.0E-5).toFixed(2);
                        false && console.log(_READINGPRESSURE,_PRESSMIN,_PRESSMAX)
                        _FLAG = (_PRESSMAX == null) ? false : (_READINGPRESSURE > _PRESSMAX) ? true: false;
                        _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE}>${_PRESSMAX} ${_UNITSYSTEM}`);
                        _FLAGPRESS = _FLAGPRESS || _FLAG;
                        _FLAG = (_PRESSMIN == null) ? false : (_READINGPRESSURE < _PRESSMIN) ? true: false;
                        _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE}<${_PRESSMIN} ${_UNITSYSTEM}`);
                        _FLAG = _FLAG || _FLAGPRESS;
                        _ALERTObj['PRESSURE'] = _READINGPRESSURE;
                      break;
                    case 'WISENSOR':
                    case 'TEMP & RH':                        
                      _READINGTEMP = Temperature;
                      _READINGRH = Humidity;
                      _ALERTObj['TEMP'] = _READINGTEMP;
                      _ALERTObj['RH'] = _READINGRH;
                      let _FLAGTEMPRH = false;
                      false && console.log('TEMPERATURE=',_TEMPMIN,_READINGTEMP,_TEMPMAX,'HUMIDITY=',_RHMIN,_READINGRH,_RHMAX);
                      _FLAG = (_TEMPMAX == null) ? false : (Number(_READINGTEMP) > Number(_TEMPMAX)) ? true: false;
                      _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP}>${_TEMPMAX}C`);
                      false && console.log(` TEMP=${_READINGTEMP}>${_TEMPMAX}C`,_FLAG,_FLAGTEMPRH);
                      _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                      _FLAG = (_TEMPMIN == null) ? false : (Number(_READINGTEMP) < Number(_TEMPMIN)) ? true: false;
                      _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP}<${_TEMPMIN}C`);
                      false && console.log(` TEMP=${_READINGTEMP}<${_TEMPMIN}C`,_FLAG,_FLAGTEMPRH);
                      _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                      if (Number(_READINGRH) > 0) {
                        _FLAG = (_RHMAX == null) ? false : (Number(_READINGRH) > Number(_RHMAX)) ? true: false;
                        _FLAG && (_MESSAGE += ` RH=${_READINGRH}>${_RHMAX}%`);
                        _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                        _FLAG = (_RHMIN == null) ? false : (Number(_READINGRH) < Number(_RHMIN)) ? true: false;
                        _FLAG && (_MESSAGE += ` RH=${_READINGRH}<${_RHMIN}%`);
                      }
                      _FLAG = _FLAGTEMPRH || _FLAG;
                      false && console.log(_FLAG);
                      break;
                    case 'DEW PT.METER':
                      let _FLAGDEW = false;
                      _READINGRH = hexToSignedInt(_HEX.slice(0,4))/10;
                      _READINGDEW = hexToSignedInt(_HEX.slice(4,8))/10;
                      _READINGTEMP = hexToSignedInt(_HEX.slice(8,12))/10;
                      _ALERTObj['TEMP'] = _READINGTEMP;
                      _ALERTObj['RH'] = _READINGRH;
                      _ALERTObj['DEW'] = _READINGDEW;
                      _FLAG = (_TEMPMAX == null) ? false : (_READINGTEMP > _TEMPMAX) ? true: false;
                      _FLAG && (_MESSAGE += ` TEMP ${_READINGTEMP}>${_TEMPMAX}C`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_TEMPMIN == null) ? false : (_READINGTEMP < _TEMPMIN) ? true: false;
                      _FLAG && (_MESSAGE += ` TEMP ${_READINGTEMP}<${_TEMPMIN}C`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_RHMAX == null) ? false : (_READINGRH > _RHMAX) ? true: false;
                      _FLAG && (_MESSAGE += ` RH ${_READINGRH}>${_RHMAX}%`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_RHMIN == null) ? false : (_READINGRH < _RHMIN) ? true: false;
                      _FLAG && (_MESSAGE += ` RH ${_READINGRH}<${_RHMIN}%`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_DEWMAX == null) ? false : (_READINGDEW > _DEWMAX) ? true: false;
                      _FLAG && (_MESSAGE += ` DEW ${_READINGDEW}>${_DEWMAX}C`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_DEWMIN == null) ? false : (_READINGDEW < _DEWMIN) ? true: false;
                      _FLAG && (_MESSAGE += ` DEW ${_READINGDEW}<${_DEWMIN}C`);
                      _FLAG = _FLAG || _FLAGDEW;
                      break;
                    default:
                      break;
                  }
                  //  -------------
                  if (_FLAG) {
                    _ALERTObj['MESSAGE'] = _MESSAGE;
                    false && console.log(`${String('DECODEWISENSORV1').green} LINE:712 [${String(_PORTID).yellow}] <${FileName.red}|${String(_FLAG).toUpperCase()}|${String(_ALERT).toUpperCase()}> [${_UNITSYSTEM.green}] <${_TYPE.green}> ${_MESSAGE.red} `)
                    DISPATCH_ALERT(FileName,_PortALERTFILE,_FoundSensor,_ALERTObj,_ALERTFLAG,_ALERT,_ALERT);
                  }
                });
              }
            });
          }
        } else if (["FA","FE","FD"].includes(_APKEY)) { // AP MODE
          // ------------
          // AP MODE ----
          // F8L10ST (BATTERY POWERED DTU) -----
          _CMODE = 'APMOD'
          true && blnDEBUG && _logs.append(_PORTIDFile, `[${'SERVER.JS'}] ${GetTIMEStamp()} <${String(_PORTID)}> [${String(_CMODE)}] LINE:724 APKEY=${String(_APKEY)} CHECK [FA,FE,FD]... ENTER <decodeF8L10ST>`,()=>{});
          // true && blnDEBUG && console.log(`[${'SERVER.JS'.red}] LINE:721 ${String(_PORTID).green}> [${String(_CMODE).red}] APKEY=${String(_APKEY).green} CHECK [FA,FE,FD]...`)
          decoders.decodeF8L10ST(_PORTID,buffer,blnDEBUG,function(statusCode,payload) {
            // ---------------------
            let _TYPE = 'TBD';
            let _NAME = 'TBD';
            let _DTUID = payload._DTUID ? payload._DTUID : payload.modelID;
            let _MODE = payload._MODE ?? '';
            let _HEX = payload._DATAHEX ?? '';
            blnDEBUG && console.log(`  >>[SERVER.JS] LINE:733 <${String(_PORTID).green}> [${String(_CMODE).red}] <${FileName}> STATUS CODE=[${String(statusCode).yellow}] MODE=[${_MODE}] APKEY=[${String(_APKEY).green}] MAC ID=[${String(_DTUID).blue}] FILENAME=[${String(FileName).red}] PAYLOAD=${String(_HEX).cyan}`)
            blnDEBUG && _logs.append(_PORTIDFile, ` LINE:734 <${String(_PORTID)}> [${String(_CMODE)}] STATUS CODE=[${statusCode}] MODE=[${_MODE}] APKEY=[${_APKEY}] MAC ID=[${_DTUID}] FILENAME=${String(FileName)} PAYLOAD=${String(_HEX)}`,()=>{});
            // -------------------------
            // if (String(payload._DATAHEX??'').length < 4) return;
            let sensorObj = getSensorObj(payload.PORTID,payload._DTUID,payload._MODE,payload._SENSORID,payload._DATAHEX);
            !blnSKIP485SENSOR && blnDEBUG && (statusCode != 407) && console.log(`[${"SERVER.JS".yellow}] [${String(_CMODE).red}] LINE:733 ${_DEBUGINT}/${blnDEBUG} ${String(_PORTID).green} ${String(FileName).green} =decodeF8L10ST= .${String(statusCode).blue}. ${String(_MODE).red}|${String(_TYPE).blue}|${String(_DTUID).magenta}|${String(_NAME).cyan}`);
            // -----
            if (statusCode == 407) {
              //  ------------------------------------
              payloadString = JSON.stringify(payload);
              if (_MODE == 'HEART-BEAT') {
                // ---------------
                // HEART BEAT INFO
                // ---------------
                var jsonPayload = JSON.stringify(sensorObj);
                if (payload._SENSORID >= 0) _logs.append(_RAWFile,jsonPayload,()=>{});  
              } else {
                // ------------
                // CHECK ALERTS
                // ------------
                // (_PORTID == '1088') && console.log('>> decodeF8L10ST [RS485]',statusCode,payload._MODE);
                _data.read(FileName,'settings',function(err,settingData) {
                  //  ------------------------
                  if (err) return;
                  let _FoundSensor = settingData?.["IOT_SENSORS"]?.[_DTUID] ? settingData["IOT_SENSORS"][_DTUID] : null;
                  // -------------------------
                  if (_FoundSensor == null || !_FoundSensor.hasOwnProperty("1")) return;
                  _FoundSensor = _FoundSensor["1"];
                  //  -------------------------
                  _TYPE = _FoundSensor.TYPE;
                  sensorObj['TYPE'] = _TYPE;
                  _NAME = _FoundSensor.NAME;
                  _FoundSensor['DTUID'] = _DTUID;
                  let _GROUP = _FoundSensor.GROUP;
                  let _WTRLVLMIN = _FoundSensor.WTR_MIN ? Number(_FoundSensor.WTR_MIN) : null;
                  let _WTRLVLMAX = _FoundSensor.WTR_MAX ? Number(_FoundSensor.WTR_MAX) : null;
                  let _AMPMAX = _FoundSensor.AMP_MAX ? Number(_FoundSensor.AMP_MAX) : null;
                  let _AMPMIN = _FoundSensor.AMP_MIN ? Number(_FoundSensor.AMP_MIN) : null;
                  let _PRESSMAX = _FoundSensor.PRESS_MAX ? Number(_FoundSensor.PRESS_MAX) : null;
                  let _PRESSMIN = _FoundSensor.PRESS_MIN ? Number(_FoundSensor.PRESS_MIN) : null;
                  let _OFFSET_PRESS = _FoundSensor.OFFSET_PRESS ? Number(_FoundSensor.OFFSET_PRESS) : 0;
                  let _TEMPMAX = _FoundSensor.TEMP_MAX ? Number(_FoundSensor.TEMP_MAX) : null;
                  let _TEMPMIN = _FoundSensor.TEMP_MIN ? Number(_FoundSensor.TEMP_MIN) : null;
                  let _RHMAX = _FoundSensor.RH_MAX ? Number(_FoundSensor.RH_MAX) : null;
                  let _RHMIN = _FoundSensor.RH_MIN ? Number(_FoundSensor.RH_MIN) : null;
                  let _DEWMAX = _FoundSensor.DEW_MAX ? Number(_FoundSensor.DEW_MAX) : null;
                  let _DEWMIN = _FoundSensor.DEW_MIN ? Number(_FoundSensor.DEW_MIN) : null;
                  let _UNITSYSTEM = _FoundSensor.UNITSYSTEM ? _FoundSensor.UNITSYSTEM.toUpperCase() : null;
                  //
                  let _READINGCURRENT,_READINGPRESSURE,_READINGTEMP,_READINGRH,_READINGDEW,_READINGWTRLVL;
                  let _ALERT = _FoundSensor.ALERT ? _FoundSensor.ALERT : false;
                  let _CTRATIO = _FoundSensor?.CTRATIO ?? 1;
                  let _ALERTFLAG = _FoundSensor?.ALERTFLAG ?? 0;
                  //  --------------
                  let _FLAG = false;
                  let _FLAGPRESS = false;
                  let _ALERTObj = {};
                  let HEX1,HEX2,newHEX;
                  let _OFFSET_RH, _OFFSET_TEMP, _FLAGTEMPRH;
                  _ALERTObj['TYPE'] = _TYPE;
                  _ALERTObj['DTU'] = _DTUID;
                  _ALERTObj['NAME'] = _NAME;
                  _ALERTObj['GROUP'] = _GROUP;
                  _ALERTObj['TIMESTAMP'] = new Date();
                  let _MESSAGE = `[${_NAME.toUpperCase()}]`;
                  blnDEBUG && console.log(`  >>[SERVER.JS] LINE:797 <${String(_PORTID).green}> [${String(FileName).yellow}] ID=[${String(_DTUID).cyan}] TYPE=${String(_TYPE).magenta} UNIT=<${_UNITSYSTEM}> ALERTFLAG=[${String(_ALERTFLAG).yellow}]`);
                  //  --------------
                  switch (_TYPE) {
                    case 'WATER LEVEL':
                      let _FLAGWTRLVL = false;
                      _READINGWTRLVL = parseInt(_HEX,16);
                      // ----
                      _FLAG = (_WTRLVLMAX == null) ? false : (_READINGWTRLVL > _WTRLVLMAX) ? true: false;
                      _FLAG && (_MESSAGE += ` WATER LEVEL=${_READINGWTRLVL} > ${_WTRLVLMAX}MM`);
                      _FLAGWTRLVL = _FLAGWTRLVL || _FLAG;
                      _FLAG = (_WTRLVLMIN == null) ? false : (_READINGWTRLVL < _WTRLVLMIN) ? true: false;
                      _FLAG && (_MESSAGE += ` WATER LEVEL=${_READINGWTRLVL} < ${_WTRLVLMIN}MM`);
                      _FLAG = _FLAGWTRLVL || _FLAG;
                      _ALERTObj['WATERLEVEL'] = _READINGWTRLVL;
                      break;
                    case 'AC CURRENT':
                      let _FLAGCURR = false;
                      // _READINGCURRENT = Number(hexToSignedInt(_HEX)/100);
                      _READINGCURRENT = _CTRATIO != 1 ? Math.abs(hexToDecimal(_HEX))*_CTRATIO/5.0 : Math.abs(HEXTOINT(_HEX)/100.0);
                      _READINGCURRENT = Number(_READINGCURRENT).toFixed(0);
                      if (_READINGCURRENT > 1000) {
                        false && console.log(`>>[SERVER.JS] LINE:819 PORT ID=[${_PORTID}] [${_GROUP}][${_NAME}][${_TYPE}] <${_HEX}> [${_CTRATIO}] ..${_READINGCURRENT}=${_AMPMAX}|${_AMPMIN}`);
                        return;
                      }
                      // ----
                      _FLAG = (_AMPMAX == null) ? false : (_READINGCURRENT > _AMPMAX) ? true: false;
                      _FLAG && (_MESSAGE += ` CURRENT=${_READINGCURRENT} > ${_AMPMAX}A`);
                      _FLAGCURR = _FLAGCURR || _FLAG;
                      _FLAG = (_AMPMIN == null) ? false : (_READINGCURRENT < _AMPMIN) ? true: false;
                      _FLAG && (_MESSAGE += ` CURRENT=${_READINGCURRENT} < ${_AMPMIN}A`);
                      _FLAG = _FLAGCURR || _FLAG;
                      (false && PortID == '1013') && console.log(`[SERVER.JS] [${String(_CMODE).red}] LINE:804 ${String(FileName).green} FLAG=[${String(_FLAG).red}] [${String(_GROUP).blue}/${String(_NAME).green}/${String(_TYPE).red}] <${_HEX}> [${_CTRATIO}] ..${_READINGCURRENT}=${_AMPMIN}|${_AMPMAX}`);
                      (false && PortID == '1013') && console.log(`[SERVER.JS] [${String(_CMODE).red}] LINE:805 ${String(_MESSAGE).green} `);
                      _ALERTObj['CURRENT'] = _READINGCURRENT;
                      break;
                    case 'DIFF PRESS':
                      // _READINGPRESSURE = parseInt(_HEX,16)/10.0 + _OFFSET_PRESS;
                      let value = parseInt(_HEX,16);
                      if (value > 0x7FFF) {
                        value -= 0x10000;
                        value = value*10.0;
                      }
                      _READINGPRESSURE = value/10.0 + _OFFSET_PRESS;
                      _READINGPRESSURE = (_UNITSYSTEM == 'BAR') ? (_READINGPRESSURE*1.0E-5).toFixed(2) : _READINGPRESSURE;
                      _PRESSMAX = _UNITSYSTEM == 'BAR' ? (_PRESSMAX*1.0E-5).toFixed(2) : _PRESSMAX;
                      _PRESSMIN = _UNITSYSTEM == 'BAR' ? (_PRESSMIN*1.0E-5).toFixed(2) : _PRESSMIN;
                      // ----
                      if (_READINGPRESSURE > 1000) {
                        break;
                      }
                      _FLAG = (_PRESSMAX == null) ? false : (_READINGPRESSURE > _PRESSMAX) ? true: false;
                      _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE} > ${_PRESSMAX} ${_UNITSYSTEM}`);
                      _FLAGPRESS = _FLAGPRESS || _FLAG;
                      _FLAG = (_PRESSMIN == null) ? false : (_READINGPRESSURE < _PRESSMIN) ? true: false;
                      _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE} < ${_PRESSMIN} ${_UNITSYSTEM}`);
                      _FLAG = _FLAG || _FLAGPRESS;
                      _ALERTObj['PRESSURE'] = _READINGPRESSURE;
                      break;
                    case 'AIR PRESSURE':
                        _FLAGPRESS = false;
                        HEX1 = _HEX.slice(0,4);
                        HEX2 = _HEX.slice(4,8);
                        newHEX = HEX2 + HEX1;
                        if (_HEX.length == 8) { _READINGPRESSURE = parseFloat(`0x${newHEX}`) } 
                        else { _READINGPRESSURE = parseInt(_HEX,16)*1000; }                        
                        // _READINGPRESSURE = parseFloat(`0x${newHEX}`) + _OFFSET_PRESS;
                        _READINGPRESSURE += Number(_OFFSET_PRESS);
                        _READINGPRESSURE = (_UNITSYSTEM == 'BAR') ? (_READINGPRESSURE*1.0E-5).toFixed(2) : _READINGPRESSURE;
                        _PRESSMAX = _UNITSYSTEM == 'BAR' ? _PRESSMAX : (_PRESSMAX*1.0E-5).toFixed(2);
                        _PRESSMIN = _UNITSYSTEM == 'BAR' ? _PRESSMIN :(_PRESSMIN*1.0E-5).toFixed(2);
                        false  && console.log(_READINGPRESSURE,_PRESSMIN,_PRESSMAX)
                        // ----
                        _FLAG = (_PRESSMAX == null) ? false : (_READINGPRESSURE > _PRESSMAX) ? true: false;
                        _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE} > ${_PRESSMAX} ${_UNITSYSTEM}`);
                        _FLAGPRESS = _FLAGPRESS || _FLAG;
                        _FLAG = (_PRESSMIN == null) ? false : (_READINGPRESSURE < _PRESSMIN) ? true: false;
                        _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE} < ${_PRESSMIN} ${_UNITSYSTEM}`);
                        _FLAG = _FLAG || _FLAGPRESS;
                        (false && (PortID == '101')) && console.log(`${FileName} --${_ALERT}|${_FLAG}-- [${_GROUP}/${String(_NAME).toUpperCase()}|${_TYPE}] <${_HEX}> [${_UNITSYSTEM}] ..${_READINGPRESSURE}=${_PRESSMIN}|${_PRESSMAX}`);
                        _ALERTObj['PRESSURE'] = _READINGPRESSURE;
                      break;
                    case 'WISENSOR':
                      const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload || {};
                      _READINGTEMP = Temperature ?? 0;
                      _READINGRH = Humidity ?? 0;
                      _OFFSET_RH = _FoundSensor?._OFFSET_RH ? _FoundSensor._OFFSET_RH : 0;
                      _OFFSET_TEMP = _FoundSensor?.OFFSET_Temp ? _FoundSensor.OFFSET_Temp : 0;
                      _READINGTEMP += _OFFSET_TEMP;
                      _READINGRH += _OFFSET_RH;
                      _READINGRH = _READINGRH/10.0;
                      _ALERTObj['TEMP'] = Number(_READINGTEMP).toFixed(2);
                      _ALERTObj['RH'] = Number(_READINGRH).toFixed(0);
                      _FLAGTEMPRH = false;
                      _FLAG = (_TEMPMAX == null) ? false : (_READINGTEMP > _TEMPMAX) ? true: false;
                      _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP} > ${_TEMPMAX}C`);
                      _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                      _FLAG = (_TEMPMIN == null) ? false : (_READINGTEMP < _TEMPMIN) ? true: false;
                      _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP} < ${_TEMPMIN}C`);
                      _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                      _FLAG = (_RHMAX == null) ? false : (_READINGRH > _RHMAX) ? true: false;
                      _FLAG && (_MESSAGE += ` RH=${_READINGRH}% > ${_RHMAX}%`);
                      _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                      _FLAG = (_RHMIN == null) ? false : (_READINGRH < _RHMIN) ? true: false;
                      _FLAG && (_MESSAGE += ` RH=${_READINGRH}% < ${_RHMIN}%`);
                      _FLAG = _FLAGTEMPRH || _FLAG;
                      true && blnDEBUG && console.log(`[${'SERVER.JS'.red}] LINE:875 <${String(_PORTID).green}> [${String(_FLAG).red}] MESSAGE=${String(_MESSAGE).green}`)
                      break;
                    case 'TEMP & RH':
                      _READINGTEMP = hexToSignedInt(_HEX.slice(4,8))/10;
                      _READINGRH = hexToSignedInt(_HEX.slice(0,4))/10;
                      _OFFSET_RH = _FoundSensor?._OFFSET_RH ? _FoundSensor._OFFSET_RH : 0;
                      _OFFSET_TEMP = _FoundSensor?.OFFSET_Temp ? _FoundSensor.OFFSET_Temp : 0;
                      _READINGTEMP += _OFFSET_TEMP;
                      _READINGTEMP = Number(_READINGTEMP).toFixed(2);
                      _READINGRH += _OFFSET_RH;
                      _READINGRH = Number(_READINGRH).toFixed(0);
                      _ALERTObj['TEMP'] = Number(_READINGTEMP).toFixed(2);
                      _ALERTObj['RH'] = Number(_READINGRH).toFixed(0);
                      _FLAGTEMPRH = false;
                      _FLAG = (_TEMPMAX == null) ? false : (_READINGTEMP > _TEMPMAX) ? true: false;
                      _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP} > ${_TEMPMAX}C`);
                      _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                      _FLAG = (_TEMPMIN == null) ? false : (_READINGTEMP < _TEMPMIN) ? true: false;
                      _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP} < ${_TEMPMIN}C`);
                      _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                      _FLAG = (_RHMAX == null) ? false : (_READINGRH > _RHMAX) ? true: false;
                      _FLAG && (_MESSAGE += ` RH=${_READINGRH} > ${_RHMAX}%`);
                      _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                      _FLAG = (_RHMIN == null) ? false : (_READINGRH < _RHMIN) ? true: false;
                      _FLAG && (_MESSAGE += ` RH=${_READINGRH} < ${_RHMIN}%`);
                      _FLAG = _FLAGTEMPRH || _FLAG;
                      break;
                    case 'DEW PT.METER':
                      let _FLAGDEW = false;
                      _READINGRH = hexToSignedInt(_HEX.slice(0,4))/10;
                      _READINGDEW = hexToSignedInt(_HEX.slice(4,8))/10;
                      _READINGTEMP = hexToSignedInt(_HEX.slice(8,12))/10;
                      if (_READINGRH > 100 || _READINGDEW > 100) return;
                      _ALERTObj['TEMP'] = _READINGTEMP;
                      _ALERTObj['RH'] = _READINGRH;
                      _ALERTObj['DEW'] = _READINGDEW;
                      _FLAG = (_TEMPMAX == null) ? false : (_READINGTEMP > _TEMPMAX) ? true: false;
                      _FLAG && (_MESSAGE += ` TEMP ${_READINGTEMP} > ${_TEMPMAX}C`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_TEMPMIN == null) ? false : (_READINGTEMP < _TEMPMIN) ? true: false;
                      _FLAG && (_MESSAGE += ` TEMP ${_READINGTEMP} < ${_TEMPMIN}C`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_RHMAX == null) ? false : (_READINGRH > _RHMAX) ? true: false;
                      _FLAG && (_MESSAGE += ` RH ${_READINGRH} > ${_RHMAX}%`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_RHMIN == null) ? false : (_READINGRH < _RHMIN) ? true: false;
                      _FLAG && (_MESSAGE += ` RH ${_READINGRH} < ${_RHMIN}%`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_DEWMAX == null) ? false : (_READINGDEW > _DEWMAX) ? true: false;
                      _FLAG && (_MESSAGE += ` DEW ${_READINGDEW} > ${_DEWMAX}C`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_DEWMIN == null) ? false : (_READINGDEW < _DEWMIN) ? true: false;
                      _FLAG && (_MESSAGE += ` DEW ${_READINGDEW} < ${_DEWMIN}C`);
                      _FLAG = _FLAG || _FLAGDEW;
                      (false && PortID == '1011') && console.log(`${FileName} --${_FLAG}-- [${_GROUP}/${_NAME}/${_TYPE}] <${_HEX}> ..${_READINGTEMP}=${_TEMPMIN}|${_TEMPMAX} ..${_READINGRH}=${_RHMIN}|${_RHMAX} ..${_READINGDEW}=${_DEWMIN}|${_DEWMAX}`);
                      break;
                    default:
                      break;
                  }
                  (blnDEBUG  && _FLAG) && console.log(`[${"SERVER.JS".white}] ${GetTIMEStamp()} <${_PORTID.toString().green}> ..[${String(_RAWFile).cyan}].. [${'DECODEF8L10ST'.red}] <${String(statusCode).magenta}> [A|F=${String(_ALERT).yellow}|${String(_FLAG).cyan}] <${String(_TYPE).yellow}:${_DTUID}> ::${String(_MESSAGE).bgGreen}`);
                  // -- WRITE TO LOGS
                  var jsonPayload = JSON.stringify(sensorObj);
                  if (payload._SENSORID >= 0) _logs.append(_RAWFile,jsonPayload,()=>{});  
                  // -- CHECK ALERTS
                  if (_FLAG) {
                    _ALERTObj['MESSAGE'] = _MESSAGE;
                    false && console.log(`${String('DECODEF8L10ST').green} LINE:968 [${String(_PORTID).yellow}] <${FileName.red}|${String(_FLAG).toUpperCase()}|${String(_ALERT).toUpperCase()}> [${_UNITSYSTEM.green}] <${_TYPE.green}> ${_MESSAGE.red} `)
                    DISPATCH_ALERT(FileName,_PortALERTFILE,_FoundSensor,_ALERTObj,_ALERTFLAG,_ALERT)
                  }
                  // -------
                  false && !blnSKIP485SENSOR && blnDEBUG && console.log(`[${"SERVER.JS".yellow}] [${String(_CMODE).red}] LINE:972 PORT ID=[${String(_PORTID).green}] ${String(FileName).green} =decodeF8L10ST= .${String(statusCode).blue}. |${String(_MODE).red}|${String(_TYPE).blue}|${String(_DTUID).magenta}|${String(_NAME).cyan}||${_READINGCURRENT??'-'}A|${_READINGPRESSURE??'-'}Pa|${_READINGTEMP??'-'}C|${_READINGRH??'-'}%|${_READINGDEW??'-'}C|`);
                  false && !blnSKIP485SENSOR && blnDEBUG && console.log(`[${"SERVER.JS".yellow}] [${String(_CMODE).red}] LINE:973 ALERT=[${String(_ALERT).red}] FLAG=[${String(_FLAG).yellow}] MESSAGE=[${String(_MESSAGE).cyan}]`);
                  // -------
                });
              }
            }
          })
        } else {
          if (MATCHKEY =='0D0A4F4B') return;
          blnDEBUG && console.log(`[${'SERVER.JS'}] <${String(_PORTID).rainbow}> ${GetTIMEStamp()} ${String('LINE:981 !!!MISSING GATEWAY!!! ..REG KEY..').yellow} PORT=${String(_PORTID).green} REGKEY=${MATCHKEY.yellow} _APKEY=${String(_APKEY).blue}`);
          blnDEBUG && console.log(`[${'SERVER.JS'}] <${String(_PORTID).rainbow}> ${GetTIMEStamp()} ${String(buffer).rainbow}`);
          _logs.append(_PORTIDFile, `[SERVER.JS] ${GetTIMEStamp()} <${String(_PORTID)}> MISS-MATCH REGKEY <${MATCHKEY}> _APKEY <${_APKEY}>`,()=>{});
        }
      } else {
        // -----------------
        // GATEWAY HEARTBEAT
        // -----------------
      }
    });
    //  -----------------------------
    //  When Data Transmission End...
    //  -----------------------------
    socket.once("end", function () {
      // --------------------------
      blnDEBUG && console.log(`[${'SERVER.JS'.yellow}] ${GetTIMEStamp()} <${String(_PORTID).green}>  ...${'GATEWAY SOCKET END'.red}...`);
      _logs.append('_SERVER', `[SERVER.JS]  ${GetTIMEStamp()} <${String(_PORTID)}> SOCKET END ...${clientAddress}`,()=>{});
    });
    //  --------------------------
    //  When Connection Closed ...
    //  --------------------------
    socket.once("close", function () {
      try {
        // ------
        blnDEBUG && console.log(`[${'SERVER.JS'.yellow}] ${GetTIMEStamp()} <${String(_PORTID).green}> ...${'GATEWAY SOCKET CLOSE'.red}...`);
        _logs.append('_SERVER', `[SERVER.JS]  ${GetTIMEStamp()} <${String(_PORTID)}>  SOCKET CLOSE ...${clientAddress}`,()=>{});
        // ------
        server.socketArr.pop(Socket);
      } catch (e) {}
      // --------
    });
    //  -------------------------
    //  When There Is An Error...
    //  -------------------------
    socket.on("error", function (err) {
      blnDEBUG && console.log(`[${'SERVER.JS'.yellow}] ${GetTIMEStamp()} <${String(_PORTID).green}> ...${'GATEWAY SOCKET ERROR'}..${err.errno}|${err.code}..`);
      _logs.append('_SERVER', `[SERVER.JS]  ${GetTIMEStamp()} <${String(_PORTID)}>  SOCKET ERROR ..${err.errno}|${err.code}..`,()=>{});
    socket.destroy();
    });
    // 
    socket.setTimeout(1000*60*30, function () {
      socket.end(()=>console.log(`.....[${String(_PORTID).yellow}] ...${String('DISCONNECTING CLIENT').random}... `));
    });
  })
  // ------------------------------------
  // START LISTENING ON THE SPECIFIC PORT
  // ------------------------------------
  tcpServer.listen(PortID,function () {
    console.log(
      `[${'SERVER.JS'.yellow}] INIT TCP SERVER PORT <${String(PortID).yellow}:${FileName.cyan}> .${String(blnDEBUG).toUpperCase()[blnDEBUG ? 'green' : 'red']}.`
    );  
  });
}
function DISPATCH_ALERT(FileName,_PortALERTFILE,_FoundSensor,_ALERTObj,_ALERTFLAG,_ALERT) {

  let jsonPayload = JSON.stringify(_ALERTObj);
  _PortALERTFILE && _logs.append(_PortALERTFILE,jsonPayload,()=>{});

  _logs.read(_PortALERTFILE,10,null,null,false,function(err,alertsdata){
    const now = new Date();
    const interval= 30;
    const twentyMinutesAgo = new Date(now - interval * 60 * 1000);
    let filteredData = [];
    console.log(`${String('DISATCH ALERT').green} <${FileName.red}> .[${String(_FoundSensor.ALERTGROUP).yellow}]. -${_ALERTFLAG.green}|${_ALERT}|${_ALERTObj.MESSAGE.red}-`)
    false && console.log(`..LINE:1045 <${FileName.red}> ALERTFILE=[${_PortALERTFILE.yellow}] DTU.ID=${String(_FoundSensor.DTUID).blue}  FLAG=${String(_ALERTFLAG).red} LOG=${String(alertsdata.length).green}`);
    if (_ALERTFLAG > 0) {
      filteredData = alertsdata.filter(obj => {
        const alertTime = new Date(obj.TIMESTAMP);
        return alertTime >= twentyMinutesAgo && obj.DTU === _FoundSensor.DTUID;
      });
      const AlertCount = filteredData.length;
      false && console.log(`  LINE:1052 <${FileName.red}> ..#ALERTS COUNT=${AlertCount}  FLAG=${_ALERTFLAG}`);
      if ( AlertCount <= _ALERTFLAG){
        false && console.log(`  LINE:1054  COUNT [${AlertCount}] < FLAG [${_ALERTFLAG}]`)
        return;
      }
    }
    false && console.log(`..LINE:1057 <${FileName.red}> ${String(_ALERT).toUpperCase().blue} ALERT.GROUP=[${String(_FoundSensor.ALERTGROUP).yellow}] `)
    if (!_ALERT) return;
    switch (FileName) {
      case 'MRE':
      case 'NIPPONGLASS_BOILER':
      case 'NIPPONGLASS':
        decoders.WhatsAppGateway2(_FoundSensor.ALERTGROUP,_ALERTObj.MESSAGE);
        break;
      case 'SNOWCITY':
      case 'IKN_OPROOM':
      case 'IKN_HOSPITAL':
        decoders.WhatsAppGateway3(_FoundSensor.ALERTGROUP,_ALERTObj.MESSAGE);
        break;
      case 'SHINKO':
      case 'EPSON':
        decoders.WhatsAppGateway4(_FoundSensor.ALERTGROUP,_ALERTObj.MESSAGE);
        break;
      default:
        console.log(` ${String('ALERT MISSING').inverse} ...<${String(FileName).green}> ${String(_FoundSensor.ALERTGROUP).yellow}=${String(_ALERTObj.MESSAGE).red}`);
        break;
    }
  })
}
// ---------------------------
// Instantiate the HTTP Server
// ---------------------------
server.httpServer = http.createServer(function (req, res) {
  server.unifiedServer(req, res);
});
// ----------------------------
// Instantiate the UPLOAD Server
// ----------------------------
server.uploadServer = http.createServer(function (req, res) {
  // --------------
  switch (req.url) {
    case '/upload.php':
      let formESP3CAM = new formidable.IncomingForm();
      formESP3CAM.parse(req, function (err, fields, files) {
        if (!err){
          // ----------------
          const oldpath = files.imageFile.path;
          let key = req.headers.key ? req.headers.key : files.imageFile.name;
          let fileName = key.includes('jpg') ? key : key + '.jpg';
          key = key.includes('.jpg') ? key.replace(/(.jpg)/g,'') :  key
          console.log(':: ESP32CAM :::'.rainbow + key);
          // ----------------
          let datetimeNow = new Date();
          let hourNow = String(datetimeNow.getHours()).padStart(2, "0");
          let minuteNow = String(datetimeNow.getMinutes()).padStart(2, "0");
          const indexLabel = `${datetimeNow.getDate()}.${datetimeNow.getMonth()}_${hourNow}.${minuteNow}`;
          // ---------------------
          if (datetimeNow == null)
            return res.end();
          // ---------------------------------
          // INSERT NEW IMAGE IN UPLOAD FOLDER
          // ---------------------------------
          //  'C:/Users/Administrator/Desktop/IOTSERVER/.data/uploads/' + indexLabel + '_' + imageFile.name;
          const newpath = 'C:/Users/Administrator/Desktop/IOTSERVER/.data/uploads/' + indexLabel + '_' + fileName;
          // -----------------------------------------
          fs.rename(oldpath, newpath, function (err) {
            if (err) throw err;
            res.write('File uploaded and moved!');
            res.end();
            // ------
            // PUBLIC FOLDER
            // ------
            // 'C:/Users/Administrator/Desktop/IOTSERVER/public/uploads/' + files.imageFile.name;
            var publicpath = 'C:/Users/Administrator/Desktop/IOTSERVER/public/uploads/' + fileName;
            // ------------------------------------------
            fs.copyFile(newpath, publicpath, (err) => {
              if (err) {
                console.log("Error Found:", err);
              }
              else {
                console.log(':: ESP32CAM :::'.rainbow + indexLabel.rainbow + `..Copied ${key}.`);
              }
            });
            // ------------
            // PHOTO OBJECT
            // ------------
            let ObjPHOTOS = [];
            let ObjPhoto = {
              TIMESTAMP : new Date(),
              key,
              newpath
            }
            // --------
            _data.read("uploads", "ESP32CAMData", function(err,data) {
              if (!err && data.length > 0) {
                data.forEach( photo => {
                  if (photo.key != ObjPhoto.key)
                    ObjPHOTOS.push(photo);
                })
              }
              ObjPHOTOS.push(ObjPhoto);
              _data.update("uploads", "ESP32CAMData", ObjPHOTOS, function (err) {
                if (err) { _data.create("uploads", "ESP32CAMData", ObjPHOTOS, function (err) {
                    if (!err) {
                      console.log("New ESP32CAMData Created");
                    } else {
                      console.log("Could not create the new ESP32CAMData");
                    }
                  });
                }
              });
            });
            // ------
          });
        }
      });
      break;
    case '/fileupload':
      console.log(`PORT 8080 .. /FILEUPLOAD...`);
      var formFileUpLoad = new formidable.IncomingForm();
      formFileUpLoad.parse(req, function (err, fields, files) {
        if (!err){
          var oldpath = files.filetoupload.path;
          var newpath = 'C:/Users/Administrator/Desktop/IOTSERVER/.data/upload/' + files.filetoupload.name;
          fs.rename(oldpath, newpath, function (err) {
            if (err) throw err;
            res.write('File uploaded and moved!');
            res.end();
          });
        }
      });
      break;
    default:
      // -------------------------------------
      console.log(`PORT 8080 .. ${req.url}`);
      // ------------------------------------
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write('<h1>Uploading Of File [NODE.JS]</h1>')
      res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
      res.write('<input type="file" name="filetoupload"><br>');
      res.write('<input type="submit">');
      res.write('</form>');
      return res.end();
      break;
    }
}).listen(config.INPUTPort);
// ----------------------------
// Instantiate the HTTPS Server
// ----------------------------
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "/../https/cert.pem")),
};
server.httpsServer = https.createServer(server.httpsServerOptions, function (req,res) {
  server.unifiedServer(req, res);
});
// -------------------------------------------------------
// All the server logic for both the http and https server
// -------------------------------------------------------
server.unifiedServer = function (req, res) {
  // Parse the url
  var parsedUrl = url.parse(req.url, true);

  // Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get the query string as an object
  var queryStringObject = parsedUrl.query;

  // Get the HTTP method
  var method = req.method.toLowerCase();

  //Get the headers as an object
  var headers = req.headers;

  // Get the payload,if any
  var decoder = new StringDecoder("utf-8");
  var buffer = "";
  req.on("data", function (data) {
    buffer += decoder.write(data);
  });
  req.on("end", function () {
    buffer += decoder.end();
    // --------------------
    // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
    // --------------------
    var chosenHandler = typeof server.router[trimmedPath] !== "undefined" ? server.router[trimmedPath] : handlers.notFound;
    // ------------------------
    // If the request is within the public directory use to the public handler instead
    // ------------------------
    chosenHandler = trimmedPath.indexOf("public/") > -1 ? handlers.public : chosenHandler;
    // -------------------------
    // Construct the data object to send to the handler
    // -------------------------
    var data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: helpers.parseJsonToObject(buffer,'','server.js'),
    };
    // Route the request to the handler specified in the router
    try {
      chosenHandler(data, function (statusCode, payload, contentType) {
        server.processHandlerResponse(res,method,trimmedPath,statusCode,payload,contentType);
      });
    } catch (e) {
      debug(e);
      server.processHandlerResponse(res,method,trimmedPath,500,{ Error: "Unknown Error Has Occured" },"json");
    }
  });
};
// -------------------------------------
// Process the response from the handler
// -------------------------------------
server.processHandlerResponse = function (res,method,trimmedPath,statusCode,payload,contentType) {
  // -------------------------------------------------
  // Determine the type of response (fallback to JSON)
  // -------------------------------------------------
  contentType = typeof contentType == "string" ? contentType : "json";
  // Use the status code returned from the handler, or set the default status code to 200
  statusCode = typeof statusCode == "number" ? statusCode : 200;
  // Return the response parts that are content-type specific
  var payloadString = "";
  // --------------------
  if (contentType == "json") {
    try{
      res.setHeader("Content-Type", "application/json");
      payload = typeof payload == "object" ? payload : {};
      payloadString = JSON.stringify(payload);
    } catch (e){      
    }
  }
  if (contentType == "html") {
    res.setHeader("Content-Type", "text/html");
    payloadString = typeof payload == "string" ? payload : "";
  }
  if (contentType == "favicon") {
    res.setHeader("Content-Type", "image/x-icon");
    payloadString = typeof payload !== "undefined" ? payload : "";
  }
  if (contentType == "plain") {
    res.setHeader("Content-Type", "text/plain");
    payloadString = typeof payload !== "undefined" ? payload : "";
  }
  if (contentType == "css") {
    res.setHeader("Content-Type", "text/css");
    payloadString = typeof payload !== "undefined" ? payload : "";
  }
  if (contentType == "png") {
    res.setHeader("Content-Type", "image/png");
    payloadString = typeof payload !== "undefined" ? payload : "";
  }
  if (contentType == "jpg") {
    res.setHeader("Content-Type", "image/jpeg");
    payloadString = typeof payload !== "undefined" ? payload : "";
  }
  // Return the response-parts common to all content-types
  try {
    res.writeHead(statusCode);
    res.end(payloadString);
  } catch (e){    
  }

  // If the response is 200, print green, otherwise print red
  if (statusCode == 200) {
    debug("\x1b[32m%s\x1b[0m",method.toUpperCase() + " /" + trimmedPath + " " + statusCode);
  } else {
    debug("\x1b[31m%s\x1b[0m",method.toUpperCase() + " /" + trimmedPath + " " + statusCode);
  }
};
// -------------------------
// Define the request router
// -------------------------
server.router = {
  "": handlers.index,
  "view/cardView"   : handlers.viewCardList,
  "view/systemView" : handlers.viewSystemList,
  "schedules/all"   : handlers.schedulesList,
  "account/create"  : handlers.accountCreate,
  "account/edit"    : handlers.accountEdit,
  "account/deleted" : handlers.accountDeleted,
  "session/create"  : handlers.sessionCreate,
  "session/deleted" : handlers.sessionDeleted,
  "systems/create"  : handlers.systemsCreate,
  "sensors/create"  : handlers.sensorsCreate,
  "sensors/edit"    : handlers.sensorsEdit,
  "sensors/deleted" : handlers.sensorsDeleted,
  "checks/all"      : handlers.checksList,
  "checks/create"   : handlers.checksCreate,
  "checks/edit"     : handlers.checksEdit,
  "ping"            : handlers.ping,
  "api/mapbox/token": handlers.mapbox,
  "api/mapbox/data" : handlers.mapbox,
  "api/ESP32CAM"    : handlers.esp32CAM,
  "api/accounts"    : handlers.accounts,
  "api/users"       : handlers.users,
  "api/tokens"      : handlers.tokens,
  "api/checks"      : handlers.checks,
  "api/sensors"     : handlers.sensors,
  "api/sensors/type": handlers.sensors,
  "api/sensors/data": handlers.sensors,
  "api/gateways"    : handlers.gateways,
  "api/systems"     : handlers.systems,
  "api/alerts"      : handlers.alerts,
  "favicon.ico"     : handlers.favicon,  
  "public"          : handlers.public,
  "examples/Error"  : handlers.exampleError,
};
// -----------
// Init script
// -----------
server.init = function () {
  // -----------
  // MQQT SERVER
  // -----------
  blnFLAG = true;
  // server.tcpServer1883.listen(config.MQQTPort1883, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.MQQTPort1883).bgYellow}`); });
  // server.tcpServer8883.listen(config.MQQTPort8883, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.MQQTPort8883).bgYellow}`); });
  // -----------
  // TCP SERVERS
  // -----------
  // START TCP SERVER 1008 - TDK IOT NETWORK
  // ---------------------------------------
  blnFLAG && startTCPServer('TDK_JOHOR',config.tcpPort1008,false);     // AT
  blnFLAG && startTCPServer('IKN_HOSPITAL',config.tcpPort1010,false);  // AT
  blnFLAG && startTCPServer('MRE',config.tcpPort1020,false);           // AT
  blnFLAG && startTCPServer('SNOWCITY',config.tcpPort1012,false);      // TRANS
  blnFLAG && startTCPServer('IKN_OPROOM',config.tcpPort1009,false);    // API
  
  blnFLAG && startTCPServer('SHINKO',config.tcpPort1011,false);        // AP
  blnFLAG && startTCPServer('NIPPONGLASS',config.tcpPort1013,false);    // AP
  blnFLAG && startTCPServer('KAYAKU',config.tcpPort1015,false);         // AP
  blnFLAG && startTCPServer('EPSON',config.tcpPort1014,false);         // AP
  blnFLAG && startTCPServer('CAMPBELL',config.tcpPort1016,false);         // AP
  
  blnFLAG && startTCPServer('AEROSOFT',config.tcpPort1088,false);      // TRANS
  // server.tcpServer1008.listen(config.tcpPort1008, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.tcpPort1008).green} - TDK`); });
  // ------------------------------------
  // START TCP SERVER 1009 - TEAWAREHOUSE NETWORK AND TESTING
  // .. SHUTDOWN WAIT FOR SUBSCRIPTION RENEWAL PAYMENT ....
  // .. REOPENED 21.09.2023 ....
  // server.tcpServer1009.listen(config.tcpPort1009, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.tcpPort1009).yellow} - TEWAREHOUSE`); });
  // --------------------------------------------
  // START TCP SERVER 1020 - MRE (FORMER SETUP FOR INTERNAL USED IN NIPPON GLASS)
  // server.tcpServer1021.listen(config.tcpPort1021, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.tcpPort1020).magenta}`); });
  // -------------------------------
  // TCP SERVER 1088 - INTERNAL TEST
  // -------------------------------
  // server.tcpServer1088.listen(config.tcpPort1088, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.tcpPort1088).bgGreen} - AEROSOFT`); });
  //
};

// Export the module
module.exports = server;
