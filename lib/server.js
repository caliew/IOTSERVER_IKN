/*
 * HTTP/HTTPS SERVER RELATED TASKS
 *
 */

// Dependencies
var net = require("net");
var http = require("http");
var https = require("https");

var formidable = require('formidable');
var url = require("url");
var StringDecoder = require("string_decoder").StringDecoder;
var fs = require("fs");
var sub = require("date-fns");

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

var debug = util.debuglog("server");

const AlertGroup = require('../models/AlertGroup');
const { CONNREFUSED } = require("dns");
const { Socket } = require("dgram");

// import * as echarts from 'echarts';

// Instantiate the server module object
var server = {}

const CONSOLE_PRINT_BUFFER = false;
const LOG_PRINT_BUFFER = false;

//  ------------------------------
//  Track Active Socket Connection
//  ------------------------------
server.socketArr = [];
server.AlertArr = {};
//  -----------------
//  Utility Functions
//  -----------------
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
function getBYTESTRING(RCV_BYTES) {
  let strLINE = ":"
  let nCOUNT = 0
  RCV_BYTES.forEach(_BYTE => {
    nCOUNT += 1;
    // strLINE += `${_BYTE}.`;
    if ( nCOUNT < 10 ) {
      strLINE += `${_BYTE}.`;
    } else {
      if (nCOUNT < 15) strLINE += `>`;
    }
  })
  console.log(RCV_BYTES,RCV_BYTES.length,strLINE)
  return strLINE;
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
// ---------------------------
// INSTANTIATE TCP SERVER 1008
// TDK GATEWAY
// ---------------------------
server.tcpServer1008 = net.createServer(function (socket) {
  // --------
  let buffer;
  let _LOGS_SENSORS_RCV = false;
  let _REGISTERKEYS = ["88888888","78563412","50512412","37518050","83709728"];
  // -----------------------------
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
    // ----------------------------------------
    // SENDING BYTE TO 485 MODBUS (485 SENSORS)
    // ----------------------------------------
    if (buffer.length > 4) {
      // -----------
      const MATCHKEY = buffer.substring(0, 8).toString("UTF-8").toUpperCase();
      let _CHECKAPKEY = buffer.substring(0, 2).toString("UTF-8").toUpperCase();
      // -----------------------------------
      if (_REGISTERKEYS.includes(MATCHKEY)) {
        // ---------------------------------------------------
        let deviceID = hex_to_ascii(buffer.substring(10, 30));
        console.log(`[${'SERVER.JS'.yellow}] ${hourNow}:${minuteNow} <${'1008'.green}> DEVICE=<${deviceID.green}> KEY=<${MATCHKEY.green}> REMOTE=<${String(socket.remotePort).green}:${String(socket.remoteAddress)}>`);
        _logs.append('_1008', `[SERVER.JS] ${hourNow}:${minuteNow} <${'1008'}> DEVICE=<${deviceID}> KEY=<${MATCHKEY}> REMOTE=<${String(socket.remotePort)}:${String(socket.remoteAddress)}>`,()=>{});
        // -------------
        if (deviceID) {
          const nArray = server.socketArr.indexOf(socket);
          let gatewayData = {
            PORT : 1008,
            MATCHKEY : MATCHKEY,
            GATEWAYID: deviceID,
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
        // -----------------
        // AT MODE - DATA PACKET ARRAY
        // ----------------
        var DataArr = buffer.toString("hex").toUpperCase().split("0D");
        // -------------------------------
        let DataArr1 = DataArr[0].split("2C");
        if (DataArr1.length<2) {
          _logs.append('_1008', `[SERVER.JS] ${hourNow}:${minuteNow} ERROR SPLICE '2C' NO VALUE <${DataArr}> ${DataArr1}..`,()=>{});
          return;
        }
        DataArr1 = DataArr.length > 2 ? (DataArr[0]+'0D'+DataArr[1]).split("2C") : DataArr[0].split("2C");
        // -----------------------
        let _HEADER = DataArr1[1].substring(0, 2).toString("UTF-8").toUpperCase();
        // -------
        if (DataArr.length < 4) {
          if (_HEADER === 'FA') {
            // F8L10ST - SELF BATTERY
            decoders.decodeF8L10ST_ATMODE(1008,buffer,function(statusCode,payload) {
              // -------------
              _logs.append('_NIPPONDEMO',`${payloadString}`,()=>{});
              if (statusCode == 200) {
                // -------------------------
                payloadString = JSON.stringify(payload);
                console.log(`..1008...DECODE F8L10ST (ATMODE)...${statusCode }`)
                _logs.append('_NIPPONDEMO',`${payloadString}`,()=>{});
                // console.log(payload);
              }
            })
            // --------    
          } else if (_HEADER === '80') {
            // -------------------------------------------------------------
            // WISENSOR NEW PROTOCOL V2.10 HEADER = '80' > CALL NEW DECODER
            // -------------------------------------------------------------
            decoders.decodeWISensorV2(1008,buffer,function (statusCode, payload) {
              // -----------------
              if (statusCode != 200 )  {
                try
                {
                  const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                  _logs.append('_1008', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V2 <${statusCode}> ${modelID}..`,()=>{});
                } catch (err) {
                  _logs.append('_1008', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V2 <${statusCode}> ${err}..`,()=>{});
                }
              }
            });
            // --------------
          } else {
            decoders.decode485Sensor(1008,DataArr,function(statusCode,payload) {
              // ------------------
              if (statusCode != 200)  {
                try {
                  const {FUNCID,DTUID,SENSORID,NDATA,RCV_BYTES,DATAS,} = payload;
                  _logs.append('_1008', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE 485 SENSOR <${statusCode}> ${DTUID}|${SENSORID}`,()=>{});
                } catch (err) {
                  _logs.append('_1008', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE 485 SENSOR <${statusCode}> ${err}`,()=>{});
                }
              }
            });
          }
          // ---------------
        } else if ( DataArr.length > 4 ) {
          // --------
          decoders.decodeWISensorV1(1008,DataArr,function (statusCode, payload) {
            if (statusCode != 200)  {
              try
              {
                const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                _logs.append('_1008', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V1 <${statusCode}> ${modelID}..`,()=>{});
              } catch (err) {
                _logs.append('_1008', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V1 <${statusCode}> ${err}..`,()=>{});
              }
            }
          });
        }
      } else if (["FE"].includes(_CHECKAPKEY)) {
        // ----------------------------------
        // HONEYWELL FIRE SMOKE DETECTOR DATA
        // ----------------------------------
        IDCount = parseInt(buffer.substring(2, 4), 16);
        ID = buffer.substr(10, (IDCount - 6) * 2);
        FREQ = parseInt(buffer.substring(4, 8), 16);
        // --- CMND ---
        // 6X - NORMAL HEART BEAT X=1 FIRE ALERT X=2 DISMANTLING ALERT X=3 BOTH FIRE AND DISMANTLING
        // 0X - ACTIVATED         X=1 FIRE ALERT X=2 DISMANTLING ALERT X=3 BOTH FIRE AND DISMANTLING
        CMND = parseInt(buffer.substring(8, 10), 16);
        // -----------------------------------------
        RSI = parseInt(buffer.substr(buffer.length - 4, 2), 16);
        BATT = parseInt(buffer.substr(buffer.length - 8, 4), 16);
        // -----------------------------------------
        if (RSI && BATT && CMND && FREQ && ID) {
          // console.log( "FIRE SMOKE DETECTOR ..<" + ID + "> ::" + CMND + ":: ..FREQ[" + FREQ + "] ..RSI[" + RSI + "] .. BATT[" + BATT + "]" );
        } else {
          console.log("ERROR PROCESSING FIRE SMOKE DETECTOR >>" + buffer);
        }
      } else {
        // _logs.append('_1008', `[SERVER.JS] ${hourNow}:${minuteNow} <${'1008'}> MISS-MATCH KEY<${MATCHKEY}> BUFFER<${buffer}>`,()=>{});
        return;
      }
    } else {
      // ----------------
      // GATEWAY HEARBEAT
      // ----------------
    }
  });
  //  -----------------------------
  //  When Data Transmission End...
  //  -----------------------------
  socket.once("end", function () {
    console.log(`[${'SERVER.JS'.yellow}] PORT ID <${"1008".green}> ...${'GATEWAY SOCKET END'.red}...`);
    _logs.append('_ERROR', `[SERVER.JS]  PORT ID <${'1008'}> SOCKET END ...${clientAddress}`,()=>{});
  });
  //  --------------------------
  //  When Connection Closed ...
  //  --------------------------
  socket.once("close", function () {
    try {
      // ------
      console.log(`[${'SERVER.JS'.yellow}] PORT ID <${"1008".green}> ...${'GATEWAY SOCKET CLOSE'.red}...`);
      _logs.append('_ERROR', `[SERVER.JS]  PORT ID <${'1008'}> SOCKET CLOSE ...${clientAddress}`,()=>{});
      // ------
      server.socketArr.pop(Socket);
    } catch (e) {}
    // --------
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
    console.log(".....[TIMER 1008] DISCONNECTING CLIENT ...".rainbow);
    socket.end(".....[TIMER 1008] DISCONNECTING CLIENT ...");
  });
});
// ---------------------------
// INSTANTIATE TCP SERVER 1009
// TEAWAREHOUSE GATEWAY
// ---------------------------
server.tcpServer1009 = net.createServer(function (socket) {
  // --------
  let buffer;
  let _LOGS_SENSORS_RCV = false;
  let _SHINKOIDs = [11,552,553,'11','552','553']
  let _REGISTERKEYS = ["32004851","2345678901","83709728","71589301","50512412","78563412"]
  // -----------------------------
  var decoder = new StringDecoder("hex");
  var clientAddress = `${socket.remoteAddress}>${socket.remotePort}`;
  //  ---------------------
  //  When Data Received...
  //  --------------------- 
  socket.on("data", function (data) {
    // -------------------------
    buffer = decoder.write(data);
    buffer = buffer.replace("undefined", "");
    // ----------------------------------------
    var datetimeNow = new Date();
    var hourNow = String(datetimeNow.getHours()).padStart(2, "0");
    var minuteNow = String(datetimeNow.getMinutes()).padStart(2, "0");
    // ----------------------------------------
    // SENDING BYTE TO 485 MODBUS (485 SENSORS)
    // ----------------------------------------
    if (buffer.length > 4) {
      // --------
      const MATCHKEY = buffer.substring(0, 8).toString("UTF-8").toUpperCase();
      let _CHECKAPKEY = buffer.substring(0, 2).toString("UTF-8").toUpperCase();      
      // -------------------------------------
      // 78563412 - TDK, 71589301 - JAMES HOME
      // -------------------------------------
      if (_REGISTERKEYS.includes(MATCHKEY)) {
        // ---------
        let deviceID = hex_to_ascii(buffer.substring(10, 30));
        console.log(`[${"SERVER.JS".yellow}] ${hourNow}:${minuteNow} <${'1009'.yellow}> DEVICE=<${deviceID.yellow}> KEY=<${MATCHKEY.yellow}> REMOTE=<${String(socket.remotePort).yellow}:${String(socket.remoteAddress)}>`);
        _logs.append('_1009', `[SERVER.JS]  PORT ID <${'1009'}> DEVICE ID <${deviceID}> KEY <${MATCHKEY}> PORT ID <${String(socket.remotePort)}><${String(socket.remoteAddress)}>`,()=>{});
        // ----------
        if (deviceID) {
          const nArray = server.socketArr.indexOf(socket);
          let gatewayData = {
            PORT : 1009,
            MATCHKEY : MATCHKEY,
            GATEWAYID: deviceID,
            ADDRESS  : clientAddress,
            TIMESTAMP: new Date(),
            SOCKET   : socket
          }
          if (nArray > -1) {
            server.socketArr.pop(nArray);
            // ---------------------------
          } 
          server.socketArr.push(gatewayData);
          gatewayTracker.INSERT(gatewayData)
        } else {
          console.log("ERROR PROCESSING PACKET [%s] FROM LORA GATEWAY[%s] >>",buffer,clientAddress);
        }
      } else if (hex_to_ascii(MATCHKEY) == "+RCV") {        
        // -----------------
        // AT MODE - DATA PACKET ARRAY
        // ----------------
        var DataArr = buffer.toString("hex").toUpperCase().split("0D");
        // -------------------------------
        let DataArr1 = DataArr[0].split("2C");        
        if (DataArr1.length<2) {
          _logs.append('_1009', `[SERVER.JS] ${hourNow}:${minuteNow} ERROR SPLICE '2C' NO VALUE <${DataArr}> ${DataArr1}..`,()=>{});
          return;
        }
        DataArr1 = DataArr.length > 2 ? (DataArr[0]+'0D'+DataArr[1]).split("2C") : DataArr[0].split("2C");
        // --------------------------------------
        let _HEADER = DataArr1[1].substring(0, 2).toString("UTF-8").toUpperCase();
        // -------
        if (DataArr.length < 4) {
          if (_HEADER === 'FA') {
            decoders.decodeF8L10ST_ATMODE(1009,buffer,function(statusCode,payload) {
              if (statusCode == 200) {
                // -------------------------
                payloadString = JSON.stringify(payload);
                console.log(`..1009...DECODE F8L10ST (ATMODE)...${statusCode }`)
                // console.log(payload);
              _logs.append('_NIPPONDEMO',`${payloadString}`,()=>{});
              }
            })
            // --------    
          } else {
            // ---------------------------
            // WISENSOR NEW PROTOCOL V2.10
            // HEADER = '80' > CALL NEW DECODER
            // --------------------------------
            if (_HEADER === '80') {
              // ---------------------------------------------------------------------
              decoders.decodeWISensorV2(1009,buffer,function (statusCode, payload) {
                // -----------------
                if (statusCode != 200 )  {
                  try {
                    const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                    _logs.append('_1009', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V2 <${statusCode}> ${modelID}..`,()=>{});
                  } catch (err) {
                    _logs.append('_1009', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V2 <${statusCode}> ${err}..`,()=>{});
                  }
                }
              });
              // --------------
            } else {
              decoders.decode485Sensor(1009,DataArr,function(statusCode,payload) {
                // ------------------
                if (statusCode != 200)  {
                  try {
                    const {FUNCID,DTUID,SENSORID,NDATA,RCV_BYTES,DATAS,} = payload;
                    _logs.append('_1009', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE 485 SENSOR <${statusCode}> ${DTUID}|${SENSORID}`,()=>{});
                  } catch (err) {
                    _logs.append('_1009', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE 485 SENSOR <${statusCode}> ${err}`,()=>{});
                  }
                }
              });
            }
          }
          // ---------------
        } else if ( DataArr.length > 4 ) {
          // --------
          decoders.decodeWISensorV1(1009,DataArr,function (statusCode, payload) {
            if (statusCode != 200 )  {
              try
              {
                const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                _logs.append('_1009', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V1 <${statusCode}> ${modelID}..`,()=>{});
              } catch (err) {
                _logs.append('_1009', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V1 <${statusCode} ${err}`,()=>{});
              }
            }
          });
        }
        // --------
      } else if (["FA","FE"].includes(_CHECKAPKEY)) {
        // -------------
        // AP MODE -----
        // -------------
        decoders.decodeF8L10ST(1009,buffer,function(statusCode,payload) {
          // -------------
          if (statusCode == 200) {
            // ------------------------
            payloadString = JSON.stringify(payload);
            let sensorObj = getSensorObj(payload.PORTID,payload._DTUID,payload._MODE,payload._SENSORID,payload._DATAHEX);
            var jsonPayload = JSON.stringify(sensorObj);
            //  -----------
            _logs.append('_1009', `[SERVER.JS] ${hourNow}:${minuteNow} <${'1009'}> F8L10ST DTU.ID<${payload._DTUID}> MODE<${payload._MODE}>`,()=>{});
            if (_SHINKOIDs.includes(Number(payload._DTUID))) {
              _logs.append('_SHINKO',jsonPayload,()=>{});
            }
            else {
              _logs.append('_TEAWAREHOUSE',jsonPayload,()=>{});
            }
          }
        })
        // -----------
      } else {
        if (MATCHKEY == '0D0A4F4B') {
          return;
        }
        console.log(`[${'SERVER.JS'.yellow}] PORT ID <${'1009'.yellow}> MISS-MATCH KEY <${MATCHKEY.red}>`);
        _logs.append('_ERROR', `[SERVER.JS]  PORT ID <${'1009'}> MISS-MATCH KEY <${MATCHKEY}>`,()=>{});
        // console.log(">>" +hourNow + ":" +minuteNow+ " [%s]",clientAddress.magenta,hex_to_ascii(buffer).replace(/[\n\r]+/g, '').replace(/\s{2,}/g,' ').replace(/^\s+|\s+$/,'') );
      }
    } else {
    }
  });
  //  -----------------------------
  //  When Data Transmission End...
  //  -----------------------------
  socket.once("end", function () {});
  //  --------------------------
  //  When Connection Closed ...
  //  --------------------------
  socket.once("close", function () {
    try {
      // ------
      console.log(`[${'SERVER.JS'.yellow}] PORT ID <${"1009".yellow}> ...${'GATEWAY DISCONNECTED'.red}...`);
      _logs.append('_ERROR', `[SERVER.JS]  PORT ID <1009> GATEWAY DISCONNECTED...${clientAddress}`,()=>{});
      // ------
      server.socketArr.pop(Socket);
    } catch (e) {}
    // ----------
    console.log(`[${'SERVER.JS'.yellow}] PORT ID <${"1009".yellow}> ....${'GATEWAY DISCONNECTED'.red}...`);
  });
  //  -------------------------
  //  When There Is An Error...
  //  -------------------------
  socket.on("error", function (err) {
    socket.destroy();
  });
  // 
  socket.setTimeout(1000*60*30, function () {
    console.log();
    console.log(".....[TIMER 1009] DISCONNECTING CLIENT ...".rainbow);
    socket.end(".....[TIMER 1009] DISCONNECTING CLIENT ...");
  });
});
// --------------------------
// Instantiate the TCP Server 1010
// IKN GATEWAY
// --------------------------
server.tcpServer1010 = net.createServer(function (socket) {
  //
  let buffer;
  let _LOGS_SENSORS_RCV = false;
  var decoder = new StringDecoder("hex");
  let _REGISTERKEYS = ["80A0001B","37518050","83709728","78563412","50512412"];
  // ---------------------------
  var clientAddress = `${socket.remoteAddress}>${socket.remotePort}`;
  //  ---------------------
  //  When Data Received...
  //  --------------------- 
  socket.on("data", function (data) {
    buffer = decoder.write(data);
    buffer = buffer.replace("undefined", "");
    // ----------------------------------------
    // SENDING BYTE TO 485 MODBUS (485 SENSORS)
    // ----------------------------------------
    var datetimeNow = new Date();
    var hourNow = String(datetimeNow.getHours()).padStart(2, "0");
    var minuteNow = String(datetimeNow.getMinutes()).padStart(2, "0");
    // --------------------------------------
    if (buffer.length > 4) {
      // -----------
      const MATCHKEY = buffer.substring(0, 8).toString("UTF-8").toUpperCase();
      let _CHECKAPKEY = buffer.substring(0, 2).toString("UTF-8").toUpperCase();
      // ------------
      if (_REGISTERKEYS.includes(MATCHKEY)) {
        // -----------
        let deviceID = hex_to_ascii(buffer.substring(10, 30));
        console.log(`[${"SERVER.JS".yellow}] ${hourNow}:${minuteNow} <${'1010'.red}> DEVICE=<${deviceID.red}> KEY=<${MATCHKEY.red}> REMOTE=<${String(socket.remotePort).red}:${String(socket.remoteAddress)}>`);
        _logs.append('_1010', `[SERVER.JS] ${hourNow}:${minuteNow} <${'1010'}> DEVICE=<${deviceID}> KEY=<${MATCHKEY}> REMOTE=<${String(socket.remotePort)}:${String(socket.remoteAddress)}>`,()=>{});
        // -------------
        if (deviceID) {
          const nArray = server.socketArr.indexOf(socket);
          let gatewayData = {
            PORT : 1010,
            MATCHKEY : MATCHKEY,
            GATEWAYID: deviceID,
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
        } else {
          console.log("ERROR PROCESSING PACKET [%s] FROM LORA GATEWAY[%s] >>",buffer,clientAddress);
        }
      } else if (hex_to_ascii(MATCHKEY) == "+RCV") {
        // -----------------
        // AT MODE - DATA PACKET ARRAY
        // ----------------
        var DataArr = buffer.toString("hex").toUpperCase().split("0D");
        // -------------------------------
        let DataArr1 = DataArr[0].split("2C");        
        if (DataArr1.length<2) {
          _logs.append('_1010', `[SERVER.JS] ${hourNow}:${minuteNow} ERROR SPLICE '2C' NO VALUE <${DataArr}> ${DataArr1}..`,()=>{});
          return;
        }
        DataArr1 = DataArr.length > 2 ? (DataArr[0]+'0D'+DataArr[1]).split("2C") : DataArr[0].split("2C");
        // -----------------------
        let _HEADER = DataArr1[1].substring(0, 2).toString("UTF-8").toUpperCase();
        // -------
        if (DataArr.length < 4) {
          if (_HEADER === 'FA') {
            // F8L10ST - SELF BATTERY
            decoders.decodeF8L10ST_ATMODE(1010,buffer,function(statusCode,payload) {
              // -------------
              if (statusCode == 200) {
                // -------------------------
                payloadString = JSON.stringify(payload);
                console.log(`..1010...DECODE F8L10ST (ATMODE)...${statusCode }`)
                // console.log(payload);
                _logs.append('_NIPPONDEMO',`${payloadString}`,()=>{});
              }
            })
            // --------    
          } else {
            // ---------------------------
            // WISENSOR NEW PROTOCOL V2.10
            // HEADER = '80' > CALL NEW DECODER
            // --------------------------------
            if (_HEADER === '80') {
              // ---------------------------------------------------------------------
              decoders.decodeWISensorV2(1010,buffer,function (statusCode, payload) {
                // -----------------
                if (statusCode != 200 )  {
                  try {
                    const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                    _logs.append('_1010', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V2 <${statusCode}> ${modelID}..`,()=>{});
                  } catch (err) {
                    _logs.append('_1010', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V2 <${statusCode}> ${err}..`,()=>{});
                  }
                }
              });
              // --------------
            } else {
              decoders.decode485Sensor(1010,DataArr,function(statusCode,payload) {
                // ------------------
                if (statusCode != 200)  {
                  try {
                    const {FUNCID,DTUID,SENSORID,NDATA,RCV_BYTES,DATAS,} = payload;
                    _logs.append('_1010', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE 485 SENSOR <${statusCode}> ${DTUID}|${SENSORID}`,()=>{});
                  } catch (err) {
                    _logs.append('_1010', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE 485 SENSOR <${statusCode}> ${err}`,()=>{});
                  }
                }
              });
            }
          }
          // ---------------
        } else if ( DataArr.length > 4 ) {
          // --------
          decoders.decodeWISensorV1(1010,DataArr,function (statusCode, payload) {
            if (statusCode != 200 )  {
              try
              {
                const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                _logs.append('_1010', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V1 <${statusCode}> ${modelID}..`,()=>{});
              } catch (err) {
                _logs.append('_1010', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V1 <${statusCode} ${err}`,()=>{});
              }
            }
          });
        }
      } else if (["FE"].includes(_CHECKAPKEY)) {
        // ----------------------------------
        // HONEYWELL FIRE SMOKE DETECTOR DATA
        // ----------------------------------
        IDCount = parseInt(buffer.substring(2, 4), 16);
        ID = buffer.substr(10, (IDCount - 6) * 2);
        FREQ = parseInt(buffer.substring(4, 8), 16);
        // --- CMND ---
        // 6X - NORMAL HEART BEAT X=1 FIRE ALERT X=2 DISMANTLING ALERT X=3 BOTH FIRE AND DISMANTLING
        // 0X - ACTIVATED         X=1 FIRE ALERT X=2 DISMANTLING ALERT X=3 BOTH FIRE AND DISMANTLING
        CMND = parseInt(buffer.substring(8, 10), 16);
        // -----------------------------------------
        RSI = parseInt(buffer.substr(buffer.length - 4, 2), 16);
        BATT = parseInt(buffer.substr(buffer.length - 8, 4), 16);
        // -----------------------------------------
        if (RSI && BATT && CMND && FREQ && ID) {
          // console.log( "FIRE SMOKE DETECTOR ..<" + ID + "> ::" + CMND + ":: ..FREQ[" + FREQ + "] ..RSI[" + RSI + "] .. BATT[" + BATT + "]" );
        } else {
          console.log("ERROR PROCESSING FIRE SMOKE DETECTOR >>" + buffer);
        }
      } else if (["FA","FD"].includes(_CHECKAPKEY)) {
        // ------------------------------------------------------
        // AP MODE -----
        // -------------
        decoders.decodeF8L10ST(1010,buffer,function(statusCode,payload) {
          // -------------
          if (statusCode == 200) {
            // -------------------------
            payloadString = JSON.stringify(payload);
            console.log(`..1010...DECODE F8L10ST...${statusCode }`)
            // console.log(payload)
            // console.log(`[${"SERVER.JS".green}] ${statusCode} ..${payload._MODE}.. <${payload.PortID}|${payload._SENSORID}|${payload._DTUID}>. ...<${payload._DATA.toString().yellow}>..<${payload._READING.toString().red}>`)
            _logs.append('_NIPPONDEMO',`${payloadString}`,()=>{});
          }
        })
        // -----------
      } else {
        if (MATCHKEY == '0D0A4F4B') {
          return;
        }
        console.log(`[${'SERVER.JS'.yellow}] PORT ID <${'1010'.red}> MISS-MATCH KEY <${MATCHKEY.red}>`);
        _logs.append('_ERROR', `[SERVER.JS]  PORT ID <${'1010'}> MISS-MATCH KEY <${MATCHKEY}>`,()=>{});
      }
    } else {
   }
  });
  //  -----------------------------
  //  When Data Transmission End...
  //  -----------------------------
  socket.once("end", function () {});
  //  --------------------------
  //  When Connection Closed ...
  //  --------------------------
  socket.once("close", function () {
    try {
      // -----
      console.log(`[${'SERVER.JS'.yellow}] PORT ID <${"1010".red}> ...${'GATEWAY DISCONNECTED'.red}...`);
      _logs.append('_ERROR', `[SERVER.JS]  PORT ID <1010> GATEWAY DISCONNECTED...${clientAddress}`,()=>{});
      // ------
      server.socketArr.pop(Socket);
    } catch (e) {}
    // -----------
    console.log(`[${'SERVER.JS'.yellow}] PORT ID <${'1010'.red}> ...${'GATEWAY DISCONNECTED'.red}...`);
  });
  //  -------------------------
  //  When There Is An Error...
  //  -------------------------
  socket.on("error", function (err) {
    socket.destroy();
  });
  // 
  socket.setTimeout(1000*60*30, function () {
    console.log();
    console.log(".....[TIMER 1010] DISCONNECTING CLIENT ...".rainbow);
    socket.end(".....[TIMER 1010] DISCONNECTING CLIENT ...");
  });
});
// ---------------------------
// INSTANTIATE TCP SERVER 1011
// SHINKO GATEWAY
// ---------------------------
server.tcpServer1011 = net.createServer(function (socket) {
  // --------
  let buffer;
  let _SHINKOIDs = [
    11,552,553,1010,1020,1030,1041,1052,1063,1073,1083,55,
    3010,3020,3031,3041,5010,5020,5031
  ]
  let _SNOWCITYIDs = [1633,1634,1635,1636]
  let _REGISTERKEYS = ["32004851","2345678901","83709728","71589301","50512412","78563412"];
  // -----------------------------
  var decoder = new StringDecoder("hex");
  var clientAddress = `${socket.remoteAddress}>${socket.remotePort}`;
  //  ---------------------
  //  When Data Received...
  //  --------------------- 
  socket.on("data", function (data) {
    // -------------------------
    buffer = decoder.write(data);
    buffer = buffer.replace("undefined", "");
    // ----------------------------------------
    var datetimeNow = new Date();
    var hourNow = String(datetimeNow.getHours()).padStart(2, "0");
    var minuteNow = String(datetimeNow.getMinutes()).padStart(2, "0");

    // ----------------------------------------
    // SENDING BYTE TO 485 MODBUS (485 SENSORS)
    // ----------------------------------------
    if (buffer.length > 4) {
      // --------
      const MATCHKEY = buffer.substring(0, 8).toString("UTF-8").toUpperCase();
      let _CHECKAPKEY = buffer.substring(0, 2).toString("UTF-8").toUpperCase();
      // -------------------------------------
      // 78563412 - TDK, 71589301 - JAMES HOME
      // -------------------------------------
      if (_REGISTERKEYS.includes(MATCHKEY)) {
        // ---------
        let deviceID = hex_to_ascii(buffer.substring(10, 30));
        console.log(`[${"SERVER.JS".blue}] ${hourNow}:${minuteNow} <${'1011'.blue}> DEVICE=<${deviceID.blue}> KEY=<${MATCHKEY.blue}> REMOTE=<${String(socket.remotePort).blue}:${String(socket.remoteAddress)}>`);
        _logs.append('_1011', `[SERVER.JS] ${hourNow}:${minuteNow} <${'1011'}> DEVICE=<${deviceID}> KEY=<${MATCHKEY}> REMOTE=<${String(socket.remotePort)}:${String(socket.remoteAddress)}>`,()=>{});
        // ----------
        if (deviceID) {
          const nArray = server.socketArr.indexOf(socket);
          let gatewayData = {
            PORT : 1011,
            MATCHKEY : MATCHKEY,
            GATEWAYID: deviceID,
            ADDRESS  : clientAddress,
            TIMESTAMP: new Date(),
            SOCKET   : socket
          }
          if (nArray > -1) {
            server.socketArr.pop(nArray);
            // ---------------------------
          } 
          server.socketArr.push(gatewayData);
          gatewayTracker.INSERT(gatewayData)
        } else {
          console.log("ERROR PROCESSING PACKET [%s] FROM LORA GATEWAY[%s] >>",buffer,clientAddress);
        }
      } else if (hex_to_ascii(MATCHKEY) == "+RCV") {
        // -----------------
        // AT MODE - DATA PACKET ARRAY
        // ----------------
        var DataArr = buffer.toString("hex").toUpperCase().split("0D");
        // -------------------------------
        let DataArr1 = DataArr[0].split("2C");
        if (DataArr1.length<2) {
          _logs.append('_1011', `[SERVER.JS] ${hourNow}:${minuteNow} ERROR SPLICE '2C' NO VALUE <${DataArr}> ${DataArr1}..`,()=>{});
          return;
        }
        DataArr1 = DataArr.length > 2 ? (DataArr[0]+'0D'+DataArr[1]).split("2C") : DataArr[0].split("2C");
        // -----------------------
        let _HEADER = DataArr1[1].substring(0, 2).toString("UTF-8").toUpperCase();
        // -------
        if (DataArr.length < 4) {
          if (_HEADER === 'FA') {
            _logs.append('_1011',`[SERVER.JS] ${hourNow}:${minuteNow} DECODE F8L10ST ATMODE`,()=>{})
            decoders.decodeF8L10ST_ATMODE(1011,buffer,function(statusCode,payload) {
              if (statusCode == 200) {
                payloadString = JSON.stringify(payload);
                console.log(`..1011...DECODE F8L10ST (ATMODE)...${statusCode }`)
                // console.log(payload);
                _logs.append('_NIPPONDEMO',`${payloadString}`,()=>{});
              }
            })
            // --------    
          } else if (_HEADER === '80') {
            decoders.decodeWISensorV2(1011,buffer,function (statusCode, payload) {
              if (statusCode != 200 )  {
                try
                {
                  const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                  _logs.append('_1011', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V2 <${statusCode}> ${modelID}..`,()=>{});
                } catch (err) {
                  _logs.append('_1011', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V2 <${statusCode}> ${err}..`,()=>{});
                }
              }
            });
          } else {
            decoders.decode485Sensor(1008,DataArr,function(statusCode,payload) {
              if (statusCode != 200)  {
                try {
                  const {FUNCID,DTUID,SENSORID,NDATA,RCV_BYTES,DATAS,} = payload;
                  _logs.append('_1011', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE 485 SENSOR <${statusCode}> ${DTUID}|${SENSORID}`,()=>{});
                } catch (err) {
                  _logs.append('_1011', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE 485 SENSOR <${statusCode}> ${err}`,()=>{});
                }
              }
            });
          }
          // ---------------
        } else if ( DataArr.length > 4 ) {
          decoders.decodeWISensorV1(1011,DataArr,function (statusCode, payload) {
            if (statusCode != 200)  {
              try
              {
                const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                _logs.append('_1011', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V1 <${statusCode}> ${modelID}..`,()=>{});
              } catch (err) {
                _logs.append('_1011', `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V1 <${statusCode}> ${err}..`,()=>{});
              }
            }
          });
        }
      } else if (["FA","FE"].includes(_CHECKAPKEY) ) {
        // -------------
        // AP MODE -----
        // -------------
        decoders.decodeF8L10ST(1011,buffer,function(statusCode,payload) {              
          if (statusCode == 200) {
            //  ------------------------------------
            payloadString = JSON.stringify(payload);
            let sensorObj = getSensorObj(payload.PORTID,payload._DTUID,payload._MODE,payload._SENSORID,payload._DATAHEX);
            var jsonPayload = JSON.stringify(sensorObj);
            //  -----------
            if (_SHINKOIDs.includes(Number(payload._DTUID))) {
              //  ---------------
              //  CHECK ALERTS ..
              //  ---------------
              _data.read('shinko','settings',function(err,settingData) {
                //  ------------------------
                let _DTUID = payload._DTUID;
                let _MODE = payload._MODE;
                let _HEX = payload._DATAHEX;
                let _FoundSensor = settingData[_DTUID];
                if (_FoundSensor == null) {
                  return;
                }
                if (!_FoundSensor.hasOwnProperty("1")) {
                  return;
                }
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
                  case 'TEMP & RH':
                    _READINGTEMP = hexToSignedInt(_HEX.slice(4,8))/10;
                    _READINGRH = hexToSignedInt(_HEX.slice(0,4))/10;
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
                if (_MODE != 'RS485') return;
                if (_ALERT && _FLAG) {
                  _ALERTObj['MESSAGE'] = _MESSAGE;
                  let jsonPayload = JSON.stringify(_ALERTObj);
                  _logs.append('_SHINKOALERTS',jsonPayload,()=>{});
                  decoders.WhatMateMessageGateway2('Shinko IOT Monitoring System',_MESSAGE)
                }
              })      
              if (payload._SENSORID != 0) _logs.append('_SHINKO',jsonPayload,()=>{});
            } else 
            if (_SNOWCITYIDs.includes(Number(payload._DTUID))) {
              console.log('...PORT 1011...SNOW CITY...',payload)
              if (payload._SENSORID != 0) _logs.append('_SNOWCITY',jsonPayload,()=>{});
            } 
            else {
              _logs.append('_TEAWAREHOUSE',jsonPayload,()=>{});
            }
          }
        })
        // -----------
      } else {
        if (MATCHKEY == '0D0A4F4B') {
          return;
        }
        console.log(`[${'SERVER.JS'.yellow}] PORT ID <${'1011'.yellow}> MISS-MATCH KEY <${MATCHKEY.red}>`);
        _logs.append('_1011', `[SERVER.JS]  PORT ID <${'1011'}> MISS-MATCH KEY <${MATCHKEY}>`,()=>{});
      }
    } 
  });
  //  -----------------------------
  //  When Data Transmission End...
  //  -----------------------------
  socket.once("end", function () {});
  //  --------------------------
  //  When Connection Closed ...
  //  --------------------------
  socket.once("close", function () {
    try {
      // ------
      console.log(`[${'SERVER.JS'.yellow}] PORT ID <${"1011".yellow}> ...${'GATEWAY DISCONNECTED'.red}...`);
      _logs.append('_ERROR', `[SERVER.JS]  PORT ID <1011> GATEWAY DISCONNECTED...${clientAddress}`,()=>{});
      // ------
      server.socketArr.pop(Socket);
    } catch (e) {}
    // ----------
    console.log(`[${'SERVER.JS'.yellow}] PORT ID <${"1011".yellow}> ....${'GATEWAY DISCONNECTED'.red}...`);
  });
  //  -------------------------
  //  When There Is An Error...
  //  -------------------------
  socket.on("error", function (err) {
    socket.destroy();
  });
  // 
  socket.setTimeout(1000*60*30, function () {
    console.log();
    console.log(".....[TIMER 1011] DISCONNECTING CLIENT ...".rainbow);
    socket.end(".....[TIMER 1011] DISCONNECTING CLIENT ...");
  });
});
// ---------------------------
// INSTANTIATE TCP SERVER 1012
// SNOWCITY GATEWAY
// ---------------------------
server.tcpServer1012= net.createServer(function (socket) {
  // --------
  let buffer;
  let _PortID = 1012;
  let _PortIDFIle = '_1012';
  let _SNOWCITYIDs = [1633,1634,1635,1636,1637,1638];
  let _REGISTERKEYS = ["32004851","2345678901","83709728","71589301","50512412","78563412","12345678"];
  // -----------------------------
  var decoder = new StringDecoder("hex");
  var clientAddress = `${socket.remoteAddress}>${socket.remotePort}`;
  //  ---------------------
  //  When Data Received...
  //  ---------------------
  socket.on("data", function (data) {
    // -------------------------
    buffer = decoder.write(data);
    buffer = buffer.replace("undefined", "");
    // ----------------------------------------
    var datetimeNow = new Date();
    var hourNow = String(datetimeNow.getHours()).padStart(2, "0");
    var minuteNow = String(datetimeNow.getMinutes()).padStart(2, "0");
    // ----------------------------------------
    // SENDING BYTE TO 485 MODBUS (485 SENSORS)
    // ----------------------------------------
    if (buffer.length > 4) {
      // --------
      const MATCHKEY = buffer.substring(0, 8).toString("UTF-8").toUpperCase();
      let _CHECKAPKEY = buffer.substring(0, 2).toString("UTF-8").toUpperCase();
      // -------------------------------------
      // 78563412 - TDK, 71589301 - JAMES HOME
      // -------------------------------------
      // _logs.append(_PortIDFIle,`[SERVER.JS] ${hourNow}:${minuteNow} CHECK MATCHKEY=[${MATCHKEY}] APIKEY=[${_CHECKAPKEY}] <${buffer.length}>`,()=>{})
      // ---------
      if (_REGISTERKEYS.includes(MATCHKEY)) {
        // ---------
        let deviceID = hex_to_ascii(buffer.substring(10, 30));
        // ------
        _logs.append(_PortIDFIle,`[SERVER.JS] ${hourNow}:${minuteNow} ..REGISTERKEYS MATCHED.. DEVICEID=${deviceID}`,()=>{})
        // ------
        console.log(`[${"SERVER.JS".blue}] ${hourNow}:${minuteNow} <${_PortID}> DEVICE=<${deviceID.cyan}> KEY=<${MATCHKEY.blue}> REMOTE=<${String(socket.remotePort).blue}:${String(socket.remoteAddress)}>`);
        // ----------
        if (deviceID) {
          const nArray = server.socketArr.indexOf(socket);
          let gatewayData = {
            PORT : _PortID,
            MATCHKEY : MATCHKEY,
            GATEWAYID: deviceID,
            ADDRESS  : clientAddress,
            TIMESTAMP: new Date(),
            SOCKET   : socket
          }
          if (nArray > -1) {
            server.socketArr.pop(nArray);
            // ---------------------------
          } 
          server.socketArr.push(gatewayData);
          gatewayTracker.INSERT(gatewayData)
        } else {
          console.log("ERROR PROCESSING PACKET [%s] FROM LORA GATEWAY[%s] >>",buffer,clientAddress);
        }
      } else if (hex_to_ascii(MATCHKEY) == "+RCV") {
        // -----------------
        // AT MODE - DATA PACKET ARRAY
        // ----------------
        var DataArr = buffer.toString("hex").toUpperCase().split("0D");
        // -------------------------------
        let DataArr1 = DataArr[0].split("2C");
        if (DataArr1.length<2) {
          _logs.append(_PortID, `[SERVER.JS] ${hourNow}:${minuteNow} ERROR SPLICE '2C' NO VALUE <${DataArr}> ${DataArr1}..`,()=>{});
          return;
        }
        // -----------------------
        let _HEADER = DataArr1[1].substring(0, 2).toString("UTF-8").toUpperCase();
        _logs.append(_PortIDFIle,`[SERVER.JS] ${hourNow}:${minuteNow} ..${hex_to_ascii(MATCHKEY)} == +RCV`,()=>{})
        // -------
        if (DataArr.length < 4) {
          if (_HEADER === 'FA') {
            _logs.append(_PortIDFIle,`[SERVER.JS] ${hourNow}:${minuteNow} DECODE F8L10ST ATMODE`,()=>{})
            decoders.decodeF8L10ST_ATMODE(_PortID,buffer,function(statusCode,payload) {
              if (statusCode == 200) {
                payloadString = JSON.stringify(payload);
                console.log(`..${_PortID}...DECODE F8L10ST (ATMODE)...${statusCode }`)
                // console.log(payload);
                // _logs.append('_NIPPONDEMO',`${payloadString}`,()=>{});
              }
            })
            // --------    
          } else if (_HEADER === '80') {
            decoders.decodeWISensorV2(_PortID,buffer,function (statusCode, payload) {
              if (statusCode != 200 )  {
                try
                {
                  const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                  _logs.append(_PortIDFIle `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V2 <${statusCode}> ${modelID}..`,()=>{});
                } catch (err) {
                  _logs.append(_PortIDFIle, `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V2 <${statusCode}> ${err}..`,()=>{});
                }
              }
            });
          } else {
            decoders.decode485Sensor(1008,DataArr,function(statusCode,payload) {
              if (statusCode != 200)  {
                try {
                  const {FUNCID,DTUID,SENSORID,NDATA,RCV_BYTES,DATAS,} = payload;
                  _logs.append(_PortIDFIle, `[SERVER.JS] ${hourNow}:${minuteNow} DECODE 485 SENSOR <${statusCode}> ${DTUID}|${SENSORID}`,()=>{});
                } catch (err) {
                  _logs.append(_PortIDFIle, `[SERVER.JS] ${hourNow}:${minuteNow} DECODE 485 SENSOR <${statusCode}> ${err}`,()=>{});
                }
              }
            });
          }
          // ---------------
        } else if ( DataArr.length > 4 ) {
          decoders.decodeWISensorV1(_PortID,DataArr,function (statusCode, payload) {
            if (statusCode != 200)  {
              try
              {
                const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                _logs.append(_PortIDFIle, `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V1 <${statusCode}> ${modelID}..`,()=>{});
              } catch (err) {
                _logs.append(_PortIDFIle, `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V1 <${statusCode}> ${err}..`,()=>{});
              }
            }
          });
        }
      } else if (["FA","FE"].includes(_CHECKAPKEY) ) {
        // -------------
        // AP MODE -----
        // -------------
        decoders.decodeF8L10ST(_PortID,buffer,function(statusCode,payload) {
          // -------------------
          if (statusCode == 200) {
            //  ------------------------------------
            payloadString = JSON.stringify(payload);
            let sensorObj = getSensorObj(payload.PORTID,payload._DTUID,payload._MODE,payload._SENSORID,payload._DATAHEX);
            var jsonPayload = JSON.stringify(sensorObj);
            _logs.append(_PortIDFIle,`[SERVER.JS] ${hourNow}:${minuteNow} CHECKAPKEY <${_CHECKAPKEY}> DTU.ID=${payload._DTUID} ` +
                                     `<${buffer.length}|${buffer}> HEX=${payload._DATAHEX}`,()=>{})
            //  -----------
            if (_SNOWCITYIDs.includes(Number(payload._DTUID))) {
              //  ---------------
              //  CHECK ALERTS ..
              //  ---------------
              _data.read('snowcity','settings',function(err,settingData) {
                //  ------------------------
                let _DTUID = payload._DTUID;
                let _MODE = payload._MODE;
                let _HEX = payload._DATAHEX;
                let _FoundSensor = settingData[_DTUID];
                if (_FoundSensor == null) {
                  return;
                }
                if (!_FoundSensor.hasOwnProperty("1")) {
                  return;
                }
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
                  case 'TEMP & RH':
                    _READINGTEMP = hexToSignedInt(_HEX.slice(4,8))/10;
                    _READINGRH = hexToSignedInt(_HEX.slice(0,4))/10;
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
                if (_MODE != 'RS485') return;
                if (_ALERT && _FLAG) {
                  _ALERTObj['MESSAGE'] = _MESSAGE;
                  let jsonPayload = JSON.stringify(_ALERTObj);
                  _logs.append('_SNOWCITYALERTS',jsonPayload,()=>{});
                  decoders.WhatMateMessageGateway2('SNOWCITY IOT Monitoring System',_MESSAGE)
                }
              })      
              if (payload._SENSORID != 0) _logs.append('_SNOWCITY',jsonPayload,()=>{});
            } 
          } else {
            // const {modelID,modelType,Temperature,Humidity} = payload
            // _logs.append(_PortIDFIle,`[SERVER.JS] ${hourNow}:${minuteNow} WISENSOR<${modelID}> <${Temperature}|${Humidity}> ..`,()=>{})
          }
        })
        // -----------
      } else {
        if (MATCHKEY == '0D0A4F4B') {
          return;
        }
        // -----
        _logs.append(_PortIDFIle,`[SERVER.JS] ${hourNow}:${minuteNow} BUFFER=<${buffer}>`,()=>{})
        // -----
        console.log(`[${'SERVER.JS'.yellow}] PORT ID <${_PortID}> MISS-MATCH KEY <${MATCHKEY.red}>`);
        _logs.append(_PortIDFIle, `[SERVER.JS]  ${hourNow}:${minuteNow} PORT ID <${_PortID}> MISS-MATCH KEY <${MATCHKEY}>`,()=>{});
      }
    } 
  });
  //  -----------------------------
  //  When Data Transmission End...
  //  -----------------------------
  socket.once("end", function () {});
  //  --------------------------
  //  When Connection Closed ...
  //  --------------------------
  socket.once("close", function () {
    try {
      // ------
      console.log(`[${'SERVER.JS'.yellow}] PORT ID <${_PortID}> ...${'GATEWAY DISCONNECTED'.red}...`);
      _logs.append('_ERROR', `[SERVER.JS]  PORT ID <${_PortID}> GATEWAY DISCONNECTED...${clientAddress}`,()=>{});
      // ------
      server.socketArr.pop(Socket);
    } catch (e) {}
    // ----------
    console.log(`[${'SERVER.JS'.yellow}] PORT ID <${_PortID}> ....${'GATEWAY DISCONNECTED'.red}...`);
  });
  //  -------------------------
  //  When There Is An Error...
  //  -------------------------
  socket.on("error", function (err) {
    socket.destroy();
  });
  // 
  socket.setTimeout(1000*60*30, function () {
    console.log();
    socket.end(`.....[TIMER] <${_PortID}> DISCONNECTING CLIENT ...`);
  });
});
// ---------------------------
// INSTANTIATE TCP SERVER 1020
// IJN GATEWAY
// ---------------------------
server.tcpServer1020= net.createServer(function (socket) {
  // --------
  let buffer;
  let _PortID = 1020;
  let _PortIDFile = `_${_PortID}`;
  let _LOGFle = '_IJN';
  let _DTUIDs = [11];
  let _REGISTERKEYS = ["32004851","2345678901","83709728","71589301","50512412","78563412","12345678"];
  // -----------------------------
  var decoder = new StringDecoder("hex");
  var clientAddress = `${socket.remoteAddress}>${socket.remotePort}`;
  //  ---------------------
  //  When Data Received...
  //  ---------------------
  socket.on("data", function (data) {
    // -------------------------
    buffer = decoder.write(data);
    buffer = buffer.replace("undefined", "");
    // ----------------------------------------
    var datetimeNow = new Date();
    var hourNow = String(datetimeNow.getHours()).padStart(2, "0");
    var minuteNow = String(datetimeNow.getMinutes()).padStart(2, "0");
    // ----------------------------------------
    // SENDING BYTE TO 485 MODBUS (485 SENSORS)
    // ----------------------------------------
    if (buffer.length > 4) {
      // --------
      const MATCHKEY = buffer.substring(0, 8).toString("UTF-8").toUpperCase();
      let _CHECKAPKEY = buffer.substring(0, 2).toString("UTF-8").toUpperCase();
      console.log(`[${"SERVER.JS".blue}] ${hourNow}:${minuteNow} <${_PortID.toString().magenta}> ..<${MATCHKEY.red}>..${buffer}.`);
      // -------------------------------------
      // 78563412 - TDK, 71589301 - JAMES HOME
      // -------------------------------------
      if (_REGISTERKEYS.includes(                                                                                                       )) {
        // ---------
        let deviceID = hex_to_ascii(buffer.substring(10, 30));
        // ----------
        if (deviceID) {
          const nArray = server.socketArr.indexOf(socket);
          let gatewayData = {
            PORT : _PortID,
            MATCHKEY : MATCHKEY,
            GATEWAYID: deviceID,
            ADDRESS  : clientAddress,
            TIMESTAMP: new Date(),
            SOCKET   : socket
          }
          if (nArray > -1) {
            server.socketArr.pop(nArray);
            // ---------------------------
          } 
          server.socketArr.push(gatewayData);
          gatewayTracker.INSERT(gatewayData)
        } else {
          console.log("ERROR PROCESSING PACKET [%s] FROM LORA GATEWAY[%s] >>",buffer,clientAddress);
        }
      } else if (hex_to_ascii(MATCHKEY) == "+RCV") {
        // -----------------
        // AT MODE - DATA PACKET ARRAY
        // ----------------
        var DataArr = buffer.toString("hex").toUpperCase().split("0D");
        // -------------------------------
        let DataArr1 = DataArr[0].split("2C");
        if (DataArr1.length<2) {
          _logs.append(_PortIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} ERROR SPLICE '2C' NO VALUE <${DataArr}> ${DataArr1}..`,()=>{});
          return;
        }
        // -----------------------
        let _HEADER = DataArr1[1].substring(0, 2).toString("UTF-8").toUpperCase();
        // -------
        if (DataArr.length < 4) {
          if (_HEADER === 'FA') {
            _logs.append(_PortIDFile,`[SERVER.JS] ${hourNow}:${minuteNow} DECODE F8L10ST ATMODE`,()=>{})
            decoders.decodeF8L10ST_ATMODE(_PortID,buffer,function(statusCode,payload) {
              if (statusCode == 200) {
                payloadString = JSON.stringify(payload);
                console.log(`..<${_PortID}>...DECODE F8L10ST (ATMODE)...${statusCode }`)
                // console.log(payload);
                // _logs.append('_NIPPONDEMO',`${payloadString}`,()=>{});
              }
            })
            // --------    
          } else if (_HEADER === '80') {
            decoders.decodeWISensorV2(_PortID,buffer,function (statusCode, payload) {
              if (statusCode != 200 )  {
                try
                {
                  const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                  _logs.append(_PortIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V2 <${statusCode}> ${modelID}..`,()=>{});
                } catch (err) {
                  _logs.append(_PortIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V2 <${statusCode}> ${err}..`,()=>{});
                }
              }
            });
          } else {
            decoders.decode485Sensor(_PortID,DataArr,function(statusCode,payload) {
              if (statusCode != 200)  {
                try {
                  const {FUNCID,DTUID,SENSORID,NDATA,RCV_BYTES,DATAS,} = payload;
                  _logs.append(_PortIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} DECODE 485 SENSOR <${statusCode}> ${DTUID}|${SENSORID}`,()=>{});
                } catch (err) {
                  _logs.append(_PortIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} DECODE 485 SENSOR <${statusCode}> ${err}`,()=>{});
                }
              }
            });
          }
          // ---------------
        } else if ( DataArr.length > 4 ) {
          decoders.decodeWISensorV1(_PortID,DataArr,function (statusCode, payload) {
            if (statusCode != 200)  {
              try
              {
                const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                _logs.append(_PortIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V1 <${statusCode}> ${modelID}..`,()=>{});
              } catch (err) {
                _logs.append(_PortIDFile, `[SERVER.JS] ${hourNow}:${minuteNow} DECODE WISENSOR V1 <${statusCode}> ${err}..`,()=>{});
              }
            }
          });
        }
      } else if (["FA","FE"].includes(_CHECKAPKEY) ) {
        // -------------
        // AP MODE -----
        console.log(`[${"SERVER.JS".blue}] ${hourNow}:${minuteNow} <${_PortID.toString().magenta}> ..<${_CHECKAPKEY.red}>..`);
        // -------------
        decoders.decodeF8L10ST(_PortID,buffer,function(statusCode,payload) {              
          if (statusCode == 200) {
            //  ------------------------------------
            payloadString = JSON.stringify(payload);
            let sensorObj = getSensorObj(payload.PORTID,payload._DTUID,payload._MODE,payload._SENSORID,payload._DATAHEX);
            var jsonPayload = JSON.stringify(sensorObj);
            console.log(`[${"SERVER.JS".blue}] ${hourNow}:${minuteNow} <${_PortID.toString().magenta}> ..<${payload._DTUID}>..`);
            //  -----------
            if (_DTUIDs.includes(Number(payload._DTUID))) {
              //  ---------------
              //  CHECK ALERTS ..
              //  ---------------
              _data.read('IJN','settings',function(err,settingData) {
                //  ------------------------
                let _DTUID = payload._DTUID;
                let _MODE = payload._MODE;
                let _HEX = payload._DATAHEX;
                let _FoundSensor = settingData[_DTUID];
                if (_FoundSensor == null) {
                  return;
                }
                if (!_FoundSensor.hasOwnProperty("1")) {
                  return;
                }
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
                  case 'TEMP & RH':
                    _READINGTEMP = hexToSignedInt(_HEX.slice(4,8))/10;
                    _READINGRH = hexToSignedInt(_HEX.slice(0,4))/10;
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
                if (_MODE != 'RS485') return;
                if (_ALERT && _FLAG) {
                  _ALERTObj['MESSAGE'] = _MESSAGE;
                  let jsonPayload = JSON.stringify(_ALERTObj);
                  _logs.append('_IJNALERTS',jsonPayload,()=>{});
                  decoders.WhatMateMessageGateway2('IJN IOT Monitoring System',_MESSAGE)
                }
              });
              if (payload._SENSORID != 0) _logs.append(_LOGFle,jsonPayload,()=>{});
            } 
          }
        })
        // -----------
      } else {
        if (MATCHKEY == '0D0A4F4B') {
          return;
        }
        console.log(`[${'SERVER.JS'.yellow}] PORT ID <${_PortID}> MISS-MATCH KEY <${MATCHKEY.red}>`);
        _logs.append(_PortIDFile, `[SERVER.JS]  PORT ID <${_PortID}> MISS-MATCH KEY <${MATCHKEY}>`,()=>{});
      }
    } 
  });
  //  -----------------------------
  //  When Data Transmission End...
  //  -----------------------------
  socket.once("end", function () {});
  //  --------------------------
  //  When Connection Closed ...
  //  --------------------------
  socket.once("close", function () {
    try {
      // ------
      console.log(`[${'SERVER.JS'.yellow}] PORT ID <${_PortID}> ...${'GATEWAY DISCONNECTED'.red}...`);
      _logs.append('_ERROR', `[SERVER.JS]  PORT ID <${_PortID}> GATEWAY DISCONNECTED...${clientAddress}`,()=>{});
      // ------
      server.socketArr.pop(Socket);
    } catch (e) {}
    // ----------
    console.log(`[${'SERVER.JS'.yellow}] PORT ID <${_PortID}> ....${'GATEWAY DISCONNECTED'.red}...`);
  });
  //  -------------------------
  //  When There Is An Error...
  //  -------------------------
  socket.on("error", function (err) {
    socket.destroy();
  });
  // 
  socket.setTimeout(1000*60*30, function () {
    console.log();
    socket.end(`.....[TIMER] <${_PortID}> DISCONNECTING CLIENT ...`);
  });
});
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
}).listen(8081);

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
  // --------------------
  // Start the TCP server
  // --------------------
  // START TCP SERVER 1008 - TDK IOT NETWORK
  // START TCP SERVER 1009 - TEAWAREHOUSE NETWORK AND TESTING
  // START TCP SERVER 1010 - HOSPITAL IOT NETWORK
  server.tcpServer1008.listen(config.tcpPort1008, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.tcpPort1008).green}`); });
  server.tcpServer1009.listen(config.tcpPort1009, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.tcpPort1009).yellow}`); });
  server.tcpServer1010.listen(config.tcpPort1010, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.tcpPort1010).red}`) });
  // START TCP SERVER 1011 - SHINKO
  server.tcpServer1011.listen(config.tcpPort1011, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.tcpPort1011).blue}`); });
  // START TCP SERVER 1012 - SNOW CITY
  server.tcpServer1012.listen(config.tcpPort1012, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.tcpPort1012).cyan}`); });
  // START TCP SERVER 1020 - IJN
  server.tcpServer1020.listen(config.tcpPort1020, function () {console.log(`[${'SERVER.JS'.yellow}]  INIT TCP SERVER PORT ${String(config.tcpPort1020).magenta}`); });

};

// Export the module
module.exports = server;
