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
    let datetimeNow = new Date();
    let hourNow = String(datetimeNow.getHours()).padStart(2,"0");
    let minuteNow = String(datetimeNow.getMinutes()).padStart(2,"0");
    _logs.append(_PortIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} <${String(_PortID)}> BUFFER <${buffer}>`,()=>{});
  });
  //  -----------------------------
  //  When Data Transmission End...
  //  -----------------------------
  socket.once("end", function () {
    console.log(`[${'SERVER.JS'.yellow}] ${hourNow}:${minuteNow} <${String(_PortID).yellow}> ...${'GATEWAY SOCKET END'.red}...`);
    _logs.append('_ERROR', `[SERVER.JS] ${hourNow}:${minuteNow} <${String(_PortID)}> SOCKET END ...${clientAddress}`,()=>{});
  });
  //  --------------------------
  //  When Connection Closed ...
  //  --------------------------
  socket.once("close", function () {
    try {
      // ------
      console.log(`[${'SERVER.JS'.yellow}] ${hourNow}:${minuteNow} <${String(_PortID).green}> ...${'GATEWAY SOCKET CLOSE'.red}...`);
      _logs.append('_ERROR', `[SERVER.JS] ${hourNow}:${minuteNow} <${String(_PortID)}> SOCKET CLOSE ...${clientAddress}`,()=>{});
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
    let datetimeNow = new Date();
    let hourNow = String(datetimeNow.getHours()).padStart(2,"0");
    let minuteNow = String(datetimeNow.getMinutes()).padStart(2,"0");
    _logs.append(_PortIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} <${String(_PortID)}> BUFFER <${buffer}>`,()=>{});
  });
  //  -----------------------------
  //  When Data Transmission End...
  //  -----------------------------
  socket.once("end", function () {
    console.log(`[${'SERVER.JS'.yellow}] ${hourNow}:${minuteNow} <${String(_PortID).green}> ...${'GATEWAY SOCKET END'.red}...`);
    _logs.append('_ERROR', `[SERVER.JS] ${hourNow}:${minuteNow} <${String(_PortID)}> SOCKET END ...${clientAddress}`,()=>{});
  });
  //  --------------------------
  //  When Connection Closed ...
  //  --------------------------
  socket.once("close", function () {
    try {
      // ------
      console.log(`[${'SERVER.JS'.yellow}] ${hourNow}:${minuteNow} <${String(_PortID).green}> ...${'GATEWAY SOCKET CLOSE'.red}...`);
      _logs.append('_ERROR', `[SERVER.JS] ${hourNow}:${minuteNow} <${String(_PortID)}>  SOCKET CLOSE ...${clientAddress}`,()=>{});
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
function startTCPServer(FileName,PortID,blnDEBUG) {
  // ----------------------------------------
  // FileName = USE IN AP MODE AS DOMAIN NAME
  // ----------------------------------------
  const tcpServer = net.createServer(function(socket) {
    // --------
    let buffer;
    let address = socket.address();
    let _PORTID = address.port;
    let _PORTIDFile = `_${_PORTID}`;
    let _RAWFile = `_${FileName}`;
    let _PortALERTFILE = `_${FileName}ALERTS`;
    let _REGISTERKEYS = {
      1008:["88888888","78563412","50512412","37518050","83709728","2345678901"],
      1010:["50512412","37518050","83709728"]
    };
    // ---------------------------------------------------------------------------------------
    var decoder = new StringDecoder("hex");
    var clientAddress = `${socket.remoteAddress}>${socket.remotePort}`;
    //  ---------------------
    //  When Data Received...
    //  --------------------- 
    socket.on("data", function (data) {
      // ---------------------
      let datetimeNow = new Date();
      let day = String(datetimeNow.getDate()).padStart(2,'0');
      let month = String(datetimeNow.getMonth()+1).padStart(2,'0');
      let year = String(datetimeNow.getFullYear()).slice(-2);
      let hourNow = String(datetimeNow.getHours()).padStart(2,"0");
      let minuteNow = String(datetimeNow.getMinutes()).padStart(2,"0");
      // --------------------------
      buffer = decoder.write(data);
      buffer = buffer.replace("undefined", "");
      // --------------------------------------
      if (buffer.length > 4) {
        // -----------
        const MATCHKEY = buffer.substring(0, 8).toString("UTF-8").toUpperCase();
        let _APKEY = buffer.substring(0, 2).toString("UTF-8").toUpperCase();
        // _PORTID == '1020' && _logs.append(_PORTIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} <${_PORTID}> <KEY=${MATCHKEY}|AP=${_APKEY}>`,()=>{});
        ( true && blnDEBUG ) && console.log(`[${"SERVER.JS".yellow}] ${hourNow}:${minuteNow} <${String(_PORTID).green}> >${String(_RAWFile).cyan}< MATCH KEY=${hex_to_ascii(MATCHKEY)} APKEY=${_APKEY}`);
        // -----------------------------------
        if (_REGISTERKEYS?.[_PORTID] && _REGISTERKEYS?.[_PORTID].includes(MATCHKEY)) {
          // ---------------------------------------------------
          let DEVICEID = hex_to_ascii(buffer.substring(10, 30));
          console.log(`[${"SERVER.JS".yellow}] ${hourNow}:${minuteNow} <${String(_PORTID).green}> DEVICE=<${DEVICEID.green}> >${String(_RAWFile).cyan}< KEY=${MATCHKEY} AP-KEY=${_APKEY} `);
          _logs.append(_PORTIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} <${_PORTID}> DEVICE=<${DEVICEID}> KEY=${MATCHKEY} AP-KEY=${_APKEY} `,()=>{});
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
        } else if (hex_to_ascii(MATCHKEY) == "+RCV") {
          // ---------------
          // AT (TRANS) MODE
          // ---------------
          var DataArr = buffer.toString("hex").toUpperCase().split("0D");
          // -------------------------------
          let DataArr1 = DataArr[0].split("2C");
          if (DataArr1.length<2) {
            _logs.append(_PORTIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} ERROR SPLICE '2C' NO VALUE <${DataArr}> ${DataArr1}..`,()=>{});
            return;
          }
          // -----------------------
          DataArr1 = DataArr.length > 2 ? (DataArr[0]+'0D'+DataArr[1]).split("2C") : DataArr[0].split("2C");
          let _HEADER = DataArr1[1].substring(0, 2).toString("UTF-8").toUpperCase();
          // ------------------------------------------------------
          // DATAARR.LENGTH < 4 HEADER='FA' => decodeF8L10ST_ATMODE
          // DATAARR.LENGTH < 4 HEADER='80' => decodeWISensorV2
          // DATAARR.LENGTH < 4 OTHERS      => decode485Sensor
          // DATAARR.LENGTH > 4 ------      => decodeWISensorV1
          // --------------------------------------------------
          if (DataArr.length < 4) {
            if (_HEADER === 'FA') {
              // F8L10ST - SELF BATTERY
              decoders.decodeF8L10ST_ATMODE(_PORTID,buffer,function(statusCode,payload) {
                // -------------
                blnDEBUG && console.log(`[SERVER.JS] ${hourNow}:${minuteNow} <${String(_PORTID).yellow}> [decodeF8L10ST_ATMODE] HEADER=[${_HEADER}] <${statusCode}>`);
                blnDEBUG && _logs.append(_PORTIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} <${_PORTID}> [decodeF8L10ST_ATMODE] HEADER=[${_HEADER}] <${statusCode}>`,()=>{});
                blnDEBUG && _logs.append(_PORTIDFile, payload,()=>{});
                _logs.append(_RAWDATAFILE,`${payloadString}`,()=>{});
                if (statusCode == 200) {
                  // -------------------------
                  payloadString = JSON.stringify(payload);
                  console.log(`..${_PORTID}...DECODE F8L10ST (ATMODE)...${statusCode }`)
                  _logs.append(_RAWFile,`${payloadString}`,()=>{});
                  // console.log(payload);
                }
              })
              // --------    
            } else if (_HEADER === '80') {
              // -------------------------------------------------------------
              // WISENSOR NEW PROTOCOL V2.10 HEADER = '80' > CALL NEW DECODER
              // -------------------------------------------------------------
              decoders.decodeWISensorV2(_PORTID,buffer,function (statusCode, payload) {
                // -----------------
                const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                blnDEBUG && console.log(`[SERVER.JS] ${hourNow}:${minuteNow} <${String(_PORTID).yellow}> >${String(_RAWFile).cyan}< ..decodeWISensorV2.. HEADER=[${_HEADER}] <${statusCode}> [${modelID}]`);
                blnDEBUG && _logs.append(_PORTIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} <${_PORTID}> [decodeWISensorV2] HEADER=[${_HEADER}] <${statusCode}> [${modelID}]`,()=>{});
                if (statusCode == 407 )  {                  
                  _data.read(FileName,'settings',function(err,settingData) {
                    //  ------------------------
                    let _DTUID = payload.modelID;
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
                    let _AMPMAX = _FoundSensor.AMP_MAX ? Number(_FoundSensor.AMP_MAX) : null;
                    let _AMPMIN = _FoundSensor.AMP_MIN ? Number(_FoundSensor.AMP_MIN) : null;
                    let _PRESSMAX = _FoundSensor.PRESS_MAX ? Number(_FoundSensor.PRESS_MAX) : null;
                    let _PRESSMIN = _FoundSensor.PRESS_MIN ? Number(_FoundSensor.PRESS_MIN) : null;
                    let _TEMPMAX = _FoundSensor.TEMP_MAX ? Number(_FoundSensor.TEMP_MAX) : null;
                    let _TEMPMIN = _FoundSensor.TEMP_MIN ? Number(_FoundSensor.TEMP_MIN) : null;
                    let _RHMAX = _FoundSensor.RH_MAX ? Number(_FoundSensor.RH_MAX) : null;
                    let _RHMIN = _FoundSensor.RH_MIN ? Number(_FoundSensor.RH_MIN) : null;
                    let _DEWMAX = _FoundSensor.DEW_MAX ? Number(_FoundSensor.DEW_MAX) : null;
                    let _DEWMIN = _FoundSensor.DEW_MIN ? Number(_FoundSensor.DEW_MIN) : null;
                    let _UNITSYSTEM = _FoundSensor.UNITSYSTEM ? _FoundSensor.UNITSYSTEM.toUpperCase() : null;
                    let _READINGCURRENT,_READINGPRESSURE,_READINGTEMP,_READINGRH,_READINGDEW;
                    let _ALERT = _FoundSensor.ALERT ? _FoundSensor.ALERT : false;
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
                          _READINGPRESSURE = _UNITSYSTEM == 'BAR' ? (_READINGPRESSURE*1.0E-5).toFixed(2) : _READINGPRESSURE;
                          _PRESSMAX = _UNITSYSTEM == 'BAR' ? (_PRESSMAX*1.0E-5).toFixed(2) : _PRESSMAX;
                          _PRESSMIN = _UNITSYSTEM == 'BAR' ? (_PRESSMIN*1.0E-5).toFixed(2) : _PRESSMIN;
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
                        _READINGRH = 0;
                        _ALERTObj['TEMP'] = _READINGTEMP;
                        _ALERTObj['RH'] = _READINGRH;
                        let _FLAGTEMPRH = false;
                        _FLAG = (_TEMPMAX == null) ? false : (_READINGTEMP > _TEMPMAX) ? true: false;
                        _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP}>${_TEMPMAX}C`);
                        _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                        _FLAG = (_TEMPMIN == null) ? false : (_READINGTEMP < _TEMPMIN) ? true: false;
                        _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP}<${_TEMPMIN}C`);
                        _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                        _FLAG = (_RHMAX == null) ? false : (_READINGRH > _RHMAX) ? true: false;
                        _FLAG && (_MESSAGE += ` RH=${_READINGRH}>${_RHMAX}%`);
                        _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                        _FLAG = (_RHMIN == null) ? false : (_READINGRH < _RHMIN) ? true: false;
                        _FLAG && (_MESSAGE += ` RH=${_READINGRH}<${_RHMIN}%`);
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
                    blnDEBUG && console.log(`[${"SERVER.JS".white}] ${hourNow}:${minuteNow} <${String(_PORTID).green}> >${String(_RAWFile).cyan}< [${statusCode}] ..decodeWISensorV2.. [A|F=${String(_ALERT).yellow}|${String(_FLAG).cyan}] ..MESSAGE=${_MESSAGE}`);
                    if (_ALERT && _FLAG) {
                      _ALERTObj['MESSAGE'] = _MESSAGE;
                      let jsonPayload = JSON.stringify(_ALERTObj);
                      _logs.append(_PortALERTFILE,jsonPayload,()=>{});
                      decoders.WhatsAppGateway2(_FoundSensor.ALERTGROUP,_MESSAGE);
                    }
                  });                
                }
              });
              // --------------
            } else {
              // -----------------------   
              decoders.decode485Sensor(_PORTID,DataArr,function(statusCode,payload) {
                // --------
                // ------------------
                if (statusCode == 200)  {
                  const {FUNCID,DTUID,SENSORID,SENSORTYPE,NDATA,RCV_BYTES,DATAS,} = payload;
                  blnDEBUG && console.log(`[SERVER.JS] ${hourNow}:${minuteNow} <${String(_PORTID).yellow}> [decode485Sensor] HEADER=[${_HEADER}] <${statusCode}> ${SENSORTYPE} [${FUNCID}|${DTUID}|${SENSORID}]`);
                  blnDEBUG && _logs.append(_PORTIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} <${_PORTID}> [decode485Sensor] HEADER=[${_HEADER}] <${statusCode}> ${SENSORTYPE} [${FUNCID}|${DTUID}|${SENSORID}]`,()=>{}); 
                } else {
                  _logs.append(_PORTIDFile, `[SERVER.JS] ${hourNow}:${minuteNow}  <${_PORTID}> [decode485Sensor] HEADER=[${_HEADER}] <${statusCode}> ..`,()=>{});
                }
              });
            }
            // ---------------
          } else if ( DataArr.length > 4 ) {
            // --------
            decoders.decodeWISensorV1(1008,DataArr,function (statusCode, payload) {
              if (statusCode == 200)  {
                const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                blnDEBUG && console.log(`[SERVER.JS] ${hourNow}:${minuteNow} <${String(_PORTID).yellow}> [decodeWISensorV1] HEADER=[${_HEADER}] <${statusCode}> [${modelID}]`);
                blnDEBUG && _logs.append(_PORTIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} <${_PORTID}> [decodeWISensorV1] HEADER=[${_HEADER}] <${statusCode}> [${modelID}]`,()=>{});
              } else {
                _logs.append(_PORTIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} <${_PORTID}> [decodeWISensorV1] HEADER=[${_HEADER}] <${statusCode}>`,()=>{});
              }
            });
          }
        } else if (["FA","FE","FD"].includes(_APKEY)) {
          // ------------
          // AP MODE ----
          // F8L10ST (BATTERY POWERED DTU) -----
          decoders.decodeF8L10ST(_PORTID,buffer,function(statusCode,payload) {     
            if (statusCode == 407) {
              //  ------------------------------------
              payloadString = JSON.stringify(payload);
              let sensorObj = getSensorObj(payload.PORTID,payload._DTUID,payload._MODE,payload._SENSORID,payload._DATAHEX);
              if (payload._MODE == 'HEART-BEAT') {
                // ---------------
                // HEART BEAT INFO
                // ---------------
                var jsonPayload = JSON.stringify(sensorObj);
                if (payload._SENSORID >= 0) _logs.append(_RAWFile,jsonPayload,()=>{});  
              } else {
                // ------------
                // CHECK ALERTS
                // ------------
                _data.read(FileName,'settings',function(err,settingData) {
                  //  ------------------------
                  let _DTUID = payload._DTUID ? payload._DTUID : payload.modelID;
                  let _MODE = payload._MODE;
                  let _HEX = payload._DATAHEX;
                  // -------------------------
                  let _FoundSensor = settingData?.["IOT_SENSORS"]?.[_DTUID] ? settingData["IOT_SENSORS"][_DTUID] : null;
                  if (_FoundSensor == null) return;
                  if (!_FoundSensor.hasOwnProperty("1")) return;
                  _FoundSensor = _FoundSensor["1"];
                  //  -------------------------
                  let _TYPE = _FoundSensor.TYPE;
                  sensorObj['TYPE'] = _TYPE;
                  let _NAME = _FoundSensor.NAME;
                  let _GROUP = _FoundSensor.GROUP;
                  let _AMPMAX = _FoundSensor.AMP_MAX ? Number(_FoundSensor.AMP_MAX) : null;
                  let _AMPMIN = _FoundSensor.AMP_MIN ? Number(_FoundSensor.AMP_MIN) : null;
                  let _PRESSMAX = _FoundSensor.PRESS_MAX ? Number(_FoundSensor.PRESS_MAX) : null;
                  let _PRESSMIN = _FoundSensor.PRESS_MIN ? Number(_FoundSensor.PRESS_MIN) : null;
                  let _TEMPMAX = _FoundSensor.TEMP_MAX ? Number(_FoundSensor.TEMP_MAX) : null;
                  let _TEMPMIN = _FoundSensor.TEMP_MIN ? Number(_FoundSensor.TEMP_MIN) : null;
                  let _RHMAX = _FoundSensor.RH_MAX ? Number(_FoundSensor.RH_MAX) : null;
                  let _RHMIN = _FoundSensor.RH_MIN ? Number(_FoundSensor.RH_MIN) : null;
                  let _DEWMAX = _FoundSensor.DEW_MAX ? Number(_FoundSensor.DEW_MAX) : null;
                  let _DEWMIN = _FoundSensor.DEW_MIN ? Number(_FoundSensor.DEW_MIN) : null;
                  let _UNITSYSTEM = _FoundSensor.UNITSYSTEM ? _FoundSensor.UNITSYSTEM.toUpperCase() : null;
                  let _READINGCURRENT,_READINGPRESSURE,_READINGTEMP,_READINGRH,_READINGDEW;
                  let _ALERT = _FoundSensor.ALERT ? _FoundSensor.ALERT : false;
                  let _CTRATIO = _FoundSensor?.CTRATIO ?? null;
                  //  --------------
                  let _FLAG = false;
                  let _ALERTObj = {};
                  _ALERTObj['TYPE'] = _TYPE;
                  _ALERTObj['DTU'] = _DTUID;
                  _ALERTObj['NAME'] = _NAME;
                  _ALERTObj['GROUP'] = _GROUP;
                  _ALERTObj['TIMESTAMP'] = new Date();
                  let _MESSAGE = `[${_NAME.toUpperCase()}]`;
                  //  --------------
                  switch (_TYPE) {
                    case 'AC CURRENT':
                      let _FLAGCURR = false;
                      // _READINGCURRENT = Number(hexToSignedInt(_HEX)/100);
                      _READINGCURRENT = _CTRATIO != null ? Math.abs(hexToDecimal(_HEX))*_CTRATIO/5.0 : Math.abs(HEXTOINT(_HEX)/100.0);
                      _READINGCURRENT = Number(_READINGCURRENT).toFixed(0);
                      // ----
                      _FLAG = (_AMPMAX == null) ? false : (_READINGCURRENT > _AMPMAX) ? true: false;
                      _FLAG && (_MESSAGE += ` CURRENT=${_READINGCURRENT} > ${_AMPMAX}A`);
                      _FLAGCURR = _FLAGCURR || _FLAG;
                      _FLAG = (_AMPMIN == null) ? false : (_READINGCURRENT < _AMPMIN) ? true: false;
                      _FLAG && (_MESSAGE += ` CURRENT=${_READINGCURRENT} < ${_AMPMIN}A`);
                      _FLAG = _FLAGCURR || _FLAG;
                      (false && PortID == '1013') && console.log(`${FileName} --${_FLAG}-- [${_GROUP}/${_NAME}/${_TYPE}] <${_HEX}> [${_CTRATIO}] ..${_READINGCURRENT}=${_AMPMIN}|${_AMPMAX}`);
                      _ALERTObj['CURRENT'] = _READINGCURRENT;
                      break;
                    case 'AIR PRESSURE':
                        let _FLAGPRESS = false;
                        let HEX1 = _HEX.slice(0,4);
                        let HEX2 = _HEX.slice(4,8);
                        let newHEX = HEX2 + HEX1;
                        _READINGPRESSURE = parseFloat(`0x${newHEX}`);;
                        _READINGPRESSURE = (_UNITSYSTEM == 'BAR') ? (_READINGPRESSURE*1.0E-5).toFixed(2) : _READINGPRESSURE;
                        _PRESSMAX = _UNITSYSTEM == 'BAR' ? (_PRESSMAX*1.0E-5).toFixed(2) : _PRESSMAX;
                        _PRESSMIN = _UNITSYSTEM == 'BAR' ? (_PRESSMIN*1.0E-5).toFixed(2) : _PRESSMIN;
                        // ----
                        _FLAG = (_PRESSMAX == null) ? false : (_READINGPRESSURE > _PRESSMAX) ? true: false;
                        _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE} > ${_PRESSMAX} ${_UNITSYSTEM}`);
                        _FLAGPRESS = _FLAGPRESS || _FLAG;
                        _FLAG = (_PRESSMIN == null) ? false : (_READINGPRESSURE < _PRESSMIN) ? true: false;
                        _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE} < ${_PRESSMIN} ${_UNITSYSTEM}`);
                        _FLAG = _FLAG || _FLAGPRESS;
                        (false && (PortID == '1011' || PortID == '1013')) && console.log(`${FileName} --${_FLAG}-- [${_GROUP}/${String(_NAME).toUpperCase()}|${_TYPE}] <${_HEX}> [${_UNITSYSTEM}] ..${_READINGPRESSURE}=${_PRESSMIN}|${_PRESSMAX}`);
                        _ALERTObj['PRESSURE'] = _READINGPRESSURE;
                      break;
                    case 'TEMP & RH':
                      _READINGTEMP = hexToSignedInt(_HEX.slice(4,8))/10;
                      _READINGRH = hexToSignedInt(_HEX.slice(0,4))/10;
                      let _OFFSET_RH = _FoundSensor?._OFFSET_RH ? _FoundSensor._OFFSET_RH : 0;
                      let _OFFSET_TEMP = _FoundSensor?.OFFSET_Temp ? _FoundSensor.OFFSET_Temp : 0;
                      _READINGTEMP += _OFFSET_TEMP;
                      _READINGRH += _OFFSET_RH;
                      _ALERTObj['TEMP'] = _READINGTEMP;
                      _ALERTObj['RH'] = _READINGRH;
                      let _FLAGTEMPRH = false;
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
                      (false && PortID == '1011') && 
                        console.log(`${FileName} --${_FLAG}-- [${_GROUP}/${_NAME}/${_TYPE}] <${_HEX}|${_OFFSET_TEMP}|${_OFFSET_RH}> ..${_READINGTEMP}=${_TEMPMIN}|${_TEMPMAX} ..${_READINGRH}=${_RHMIN}|${_RHMAX}`);
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
                  (blnDEBUG  && _FLAG) && console.log(`[${"SERVER.JS".white}] ${hourNow}:${minuteNow} <${_PORTID.toString().green}> >${String(_RAWFile).cyan}< [${String(statusCode).yellow}] ..DECODEF8L10ST.. [A|F=${String(_ALERT).yellow}|${String(_FLAG).cyan}] <${String(_TYPE).yellow}:${_DTUID}> ::${String(_MESSAGE).bgGreen}`);
                  if (_ALERT && _FLAG) {
                    _ALERTObj['MESSAGE'] = _MESSAGE;
                    if (statusCode == 407) {
                      //  ---------------------
                      //  SENSOR NOT IN MONGODB
                      //  ---------------------
                      _ALERTObj['MESSAGE'] = _MESSAGE;
                      let jsonPayload = JSON.stringify(_ALERTObj);
                      _logs.append(_PortALERTFILE,jsonPayload,()=>{});
                      decoders.WhatsAppGateway2(_FoundSensor.ALERTGROUP,_MESSAGE)
                    }
                  }
                  var jsonPayload = JSON.stringify(sensorObj);
                  if (payload._SENSORID >= 0) _logs.append(_RAWFile,jsonPayload,()=>{});  
                });
              }
            }
          })
        } else {
          if (MATCHKEY =='0D0A4F4B') return;
          blnDEBUG && console.log(`[${'SERVER.JS'.yellow}] ${hourNow}:${minuteNow} <${String(_PORTID).red}> MISS-MATCH KEY <${MATCHKEY.red}>`);
          _logs.append(_PORTIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} <${String(_PORTID)}> MISS-MATCH KEY <${MATCHKEY}>`,()=>{});
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
      // ---------------------
      let datetimeNow = new Date();
      let hourNow = String(datetimeNow.getHours()).padStart(2,"0");
      let minuteNow = String(datetimeNow.getMinutes()).padStart(2,"0");
      // --------------------------
      blnDEBUG && console.log(`[${'SERVER.JS'.yellow}] ${hourNow}:${minuteNow} <${String(_PORTID).green}>  ...${'GATEWAY SOCKET END'.red}...`);
      _logs.append('_SERVER', `[SERVER.JS]  ${hourNow}:${minuteNow} <${String(_PORTID)}> SOCKET END ...${clientAddress}`,()=>{});
    });
    //  --------------------------
    //  When Connection Closed ...
    //  --------------------------
    socket.once("close", function () {
      // ---------------------
      let datetimeNow = new Date();
      let hourNow = String(datetimeNow.getHours()).padStart(2,"0");
      let minuteNow = String(datetimeNow.getMinutes()).padStart(2,"0");
      // --------------------------
      try {
        // ------
        blnDEBUG && console.log(`[${'SERVER.JS'.yellow}] ${hourNow}:${minuteNow} <${String(_PORTID).green}> ...${'GATEWAY SOCKET CLOSE'.red}...`);
        _logs.append('_SERVER', `[SERVER.JS]  ${hourNow}:${minuteNow} <${String(_PORTID)}>  SOCKET CLOSE ...${clientAddress}`,()=>{});
        // ------
        server.socketArr.pop(Socket);
      } catch (e) {}
      // --------
    });
    //  -------------------------
    //  When There Is An Error...
    //  -------------------------
    socket.on("error", function (err) {
      // ---------------------
      let datetimeNow = new Date();
      let hourNow = String(datetimeNow.getHours()).padStart(2,"0");
      let minuteNow = String(datetimeNow.getMinutes()).padStart(2,"0");
      // --------------------------
      blnDEBUG && console.log(`[${'SERVER.JS'.yellow}] ${hourNow}:${minuteNow} <${String(_PORTID).green}> ...${'GATEWAY SOCKET ERROR'}..${err.errno}|${err.code}..`);
      _logs.append('_SERVER', `[SERVER.JS]  ${hourNow}:${minuteNow} <${String(_PORTID)}>  SOCKET ERROR ..${err.errno}|${err.code}..`,()=>{});
    socket.destroy();
    });
    // 
    socket.setTimeout(1000*60*30, function () {
      console.log(`.....[${String(_PORTID)}] DISCONNECTING CLIENT ...`);
      socket.end(`.....[${String(_PORTID)}] DISCONNECTING CLIENT ...`);
    });
  })
  // ------------------------------------
  // START LISTENING ON THE SPECIFIC PORT
  // ------------------------------------
  tcpServer.listen(PortID,function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(PortID).green} - DOMAIN <${FileName}>`);} );
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
      payload: helpers.parseJsonToObject(buffer),
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
  // server.tcpServer1883.listen(config.MQQTPort1883, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.MQQTPort1883).bgYellow}`); });
  // server.tcpServer8883.listen(config.MQQTPort8883, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.MQQTPort8883).bgYellow}`); });
  // -----------
  // TCP SERVERS
  // -----------
  // START TCP SERVER 1008 - TDK IOT NETWORK
  // ---------------------------------------
  startTCPServer('TDK',config.tcpPort1008,false);
  startTCPServer('IKN',config.tcpPort1010,false);
  startTCPServer('SHINKO',config.tcpPort1011,false);
  startTCPServer('SNOWCITY',config.tcpPort1012,false);
  startTCPServer('NIPPONGLASS',config.tcpPort1013,false);
  startTCPServer('MRE',config.tcpPort1020,false);
  startTCPServer('AEROSOFT',config.tcpPort1088,false);
  // server.tcpServer1008.listen(config.tcpPort1008, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.tcpPort1008).green} - TDK`); });
  // ------------------------------------
  // START TCP SERVER 1009 - TEAWAREHOUSE NETWORK AND TESTING
  // .. SHUTDOWN WAIT FOR SUBSCRIPTION RENEWAL PAYMENT ....
  // .. REOPENED 21.09.2023 ....
  // server.tcpServer1009.listen(config.tcpPort1009, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.tcpPort1009).yellow} - TEWAREHOUSE`); });
  // --------------------------------------------
  // START TCP SERVER 1010 - IKN HOSPITAL IOT NETWORK
  // --------------------------------------------
  // server.tcpServer1010.listen(config.tcpPort1010, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.tcpPort1010).red} - IKN`) });
  // ------------------------------
  // START TCP SERVER 1011 - SHINKO
  // START TCP SERVER 1012 - SNOWCITY
  // START TCP SERVER 1013 - NIPPONGLASS
  // START TCP SERVER 1020 - MRE
  // ------------------------------
  // server.tcpServer1011.listen(config.tcpPort1011, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.tcpPort1011).blue} - SHINKO`); });
  // server.tcpServer1012.listen(config.tcpPort1012, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.tcpPort1012).cyan} - SNOWCITY`); });
  // server.tcpServer1013.listen(config.tcpPort1013, function () {console.log(`[${'SERVER.JS'.white}]  INIT TCP SERVER PORT ${String(config.tcpPort1013).green} - NIPPONGLASS`); });
  // server.tcpServer1020.listen(config.tcpPort1020, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.tcpPort1020).magenta} - MRE`); });
  // -------------------------------------
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
