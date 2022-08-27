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

const DEBUG_BUFFER_CONSOLE = false;
const DEBUG_BUFFER_LOG = false;

//  ------------------------------
//  Track Active Socket Connection
//  ------------------------------
server.socketArr = [];
server.sensorsArr = {};
server.AlertArr = {};

// Utility Functions
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
function getDATAFROMHEX(RCV_BYTES) {
  let strINFO = `BYTES=${RCV_BYTES}.. .`;
  let nDATA = RCV_BYTES.length/2/2;
  for (let i = 0; i < nDATA; i++) {
    let _BYTE = RCV_BYTES.substr(i*4,4);
    strINFO += `${_BYTE}<${parseInt(_BYTE,16)}>.`;
  }
  return strINFO;
}
function getSensorObj(PORTID,DTUID,MODE,SENSORID,RCV_BYTES) {
  let sensorObj = {};
  sensorObj['DATETIME'] = new Date();
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
// ---------------------------
// INSTANTIATE TCP SERVER 1008
// TDK GATEWAY
// ---------------------------
server.tcpServer1008 = net.createServer(function (socket) {
  // --------
  let buffer;
  let _RCV_CONSOLEOUTPUT = false;
  let _LOGS_SENSORS_RCV = false;
  // -----------------------------
  var decoder = new StringDecoder("hex");
  var clientAddress = `${socket.remoteAddress}>${socket.remotePort}`;
  // --------------------------------------------------
  server.tcpServer1008.getConnections(function (error, count) {
    // ----------------------------
    server.socketArr.push(socket);
    // ----------------------------
  });
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
      DEBUG_BUFFER_CONSOLE && (buffer.length) > 35 && (buffer.length) < 50 && console.log(`[${'SERVER.JS'.yellow}]  PORT <${'1008'.green}> BUFFER <${String(buffer.length).blue}>:<${String(buffer).substring(0,15).rainbow}...> MATCHKEY=${String(MATCHKEY).substring(0,15).rainbow}..HEX STR=<${hex_to_ascii(MATCHKEY).substring(0,15).yellow}..>`);
      DEBUG_BUFFER_LOG && (buffer.length) > 35 && (buffer.length) < 50 && _logs.append('_ERROR', `[SERVER.JS]  PORT <1008> BUFFER <${String(buffer.length)}>:<${String(buffer).substring(0,15)}...> MATCHKEY=${String(MATCHKEY).substring(0,15)}..HEX STR=<${hex_to_ascii(MATCHKEY).substring(0,15)}..>`,()=>{});
      // -----------------------------------
      if (MATCHKEY == "88888888" || MATCHKEY == "78563412" || MATCHKEY == "50512412" ) {
        // ---------------------------------------------------
        let deviceID = hex_to_ascii(buffer.substring(10, 30));
        console.log(`[${'SERVER.JS'.yellow}] PORT <${'1008'.green}> DEVICE ID <${deviceID.green}> KEY <${MATCHKEY.green}> PORT <${String(socket.remotePort).green}><${String(socket.remoteAddress).blue}>`);
        _logs.append('_ERROR', `[SERVER.JS]  PORT <${'1008'}> DEVICE ID <${deviceID}> KEY <${MATCHKEY}> PORT <${String(socket.remotePort)}><${String(socket.remoteAddress)}>`,()=>{});
        // -------------
        if (deviceID) {
          const nArray = server.socketArr.indexOf(socket);
          if (nArray > -1) {
            gatewayData = {
              PORT : 1008,
              MATCHKEY : MATCHKEY,
              GATEWAYID: deviceID,
              ADDRESS  : clientAddress,
              TIMESTAMP: new Date(),
              SOCKET   : socket
            }
            server.socketArr.pop(nArray);
            server.socketArr.push(gatewayData);
            gatewayTracker.INSERT(gatewayData)
            // ---------------------------
          }
        } else {
          console.log("ERROR PROCESSING PACKET [%s] FROM LORA GATEWAY[%s] >>",buffer,clientAddress);
        }
      } else if (hex_to_ascii(MATCHKEY) == "+RCV") {
        // -----------------
        // DATA PACKET ARRAY
        // -----------------
        var DataArr = buffer.toString("hex").toUpperCase().split("0D");
        // -------------------------------
        let DataArr1 = DataArr[0].split("2C");
        let DataArr2 = DataArr1[0].split("3A");
        // ------------------
        if (DataArr.length < 4) {
          //  ------------------------
          let strINFO = `[SERVER.JS] ${"1008".green}.+RCV.${hourNow}:${minuteNow}. `;
          // -------------------------
          decoders.decode485Sensor(1008,DataArr,function(statusCode,payload) {
            // ---------------
            let strKEY = null;
            // -----------------------------
            if (statusCode == 200)  {
              // ---------
              const {FUNCID,DTUID,SENSORID,NDATA,RCV_BYTES,DATAS,} = payload;
              try {
                _LOGS_SENSORS_RCV && _logs.append('_ERROR', `[SERVER.JS]  1008 <${hourNow}:${minuteNow}> ..<${status}|${FUNCID}>  ` + 
                                                            `..DTU.ID=[${String(DTUID).padStart(3,"0")}] ` + 
                                                            `..SNR.ID=[${String(SENSORID).padStart(2,"0")}]...|${getBYTESTRING(RCV_BYTES)}|<${DATAS}>`,
                                                            ()=>{});
              } catch (err) {
                console.log(err);
                return;
              }
              // --------------------------------
              strKEY = `${DTUID}_${String(SENSORID).padStart(2,"0")}`;
              if (server.sensorsArr.hasOwnProperty(strKEY)) { 
                delete server.sensorsArr[strKEY];
              }
              // ---------
              try {
                strINFO += `<${status}|${FUNCID}>  DTU.ID=[${String(DTUID).padStart(3,"0")}] ` + 
                           `SNR.ID=[${String(SENSORID).padStart(2,"0")}]...KEY=<${strKEY}> |${getBYTESTRING(RCV_BYTES)}|<${DATAS}>`;
              } catch (err) {
                console.log(err);
                return;
              }
            } else {
              console.log(`[SERVER.JS] ${"1008".green} DECODERS.DECODE485SENSOR STATUS CODE=<${statusCode}> ${payload}`)
            }
            // --------------------------------------------------
            if (strKEY) server.sensorsArr[strKEY] = `${hourNow}:${minuteNow} .....${strINFO}`
            _RCV_CONSOLEOUTPUT && console.log(`${strINFO}`)
          });
          // -------------------------------
        } else {
          // ------------
          // LORA SENSORS - +RCV:ID,DATA IN BYTE
          // ------------------
          if ( DataArr.length > 4 ){
            // -------------
            decoders.decodeWISensorV1(1008,DataArr,function (statusCode, payload) {
              // ------------------------
              if (statusCode == 200)  {
                // -----------
                const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                let strKEY = `${modelID}`
                // ----------------------
                if (server.sensorsArr.hasOwnProperty(strKEY)) { 
                  delete server.sensorsArr[strKEY];
                }
                try {
                  server.sensorsArr[strKEY] = `TIME:${hourNow}:${minuteNow} ...READING..<${payload["Temperature"]}>`
                  _RCV_CONSOLEOUTPUT && console.log(`[SERVER.JS] ${"1008".green} +RCV:${hourNow}:${minuteNow}. READING..<${String(modelID).toUpperCase()}> ..<.${String(payload["Temperature"]).padStart(2,"0")}C.|.${String(payload["Humidity"]).padStart(2,"0")}%.>`)
                } catch (err) {
                  _RCV_CONSOLEOUTPUT && console.log(`[SERVER.JS] ${"1008".green} +RCV:${hourNow}:${minuteNow}. READING..<${err}>..`)
                }
              } else {
                console.log('[SERVER.JS] 1008-decodeWISensorV1',statusCode,payload)
              }
            });
          }
          return;
          // ---------------
        }
      } else if (buffer.substring(0, 2).toString("UTF-8").toUpperCase() == "FE") {
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
        if (MATCHKEY == '0D0A4F4B') {
          return;
        }
        console.log(`[${'SERVER.JS'.yellow}] PORT <${'1008'.green}> MISS-MATCH KEY <${MATCHKEY.red}>`);
        _logs.append('_ERROR', `[SERVER.JS]  PORT <${'1008'.green}> MISS-MATCH KEY <${MATCHKEY}>`,()=>{});
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
      console.log(`[${'SERVER.JS'.yellow}] PORT <${"1008".green}> ...${'GATEWAY DISCONNECTED'.red}...`);
      _logs.append('_ERROR', `[SERVER.JS]  PORT <${'1008'}> GATEWAY DISCONNECTED...${clientAddress}`,()=>{});
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
// NIPPON GLASS & TESTING GATEWAY
// ---------------------------
server.tcpServer1009 = net.createServer(function (socket) {
  // --------
  let buffer;
  let _RCV_CONSOLEOUTPUT = false;
  let _LOGS_SENSORS_RCV = false;
  // -----------------------------
  var decoder = new StringDecoder("hex");
  var clientAddress = `${socket.remoteAddress}>${socket.remotePort}`;
  // --------------------------------------------------
  server.tcpServer1009.getConnections(function (error, count) {
    // ---------------------------
    server.socketArr.push(socket);
    // ---------------------------
  });
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
      DEBUG_BUFFER_CONSOLE && (buffer.length) > 35 && (buffer.length) < 50 && console.log(`[${'SERVER.JS'.yellow}]  PORT <${'1009'.yellow}> BUFFER <${String(buffer.length).blue}>:<${String(buffer).substring(0,15).rainbow}...> MATCHKEY=${String(MATCHKEY).substring(0,15).rainbow}..HEX STR=<${hex_to_ascii(MATCHKEY).substring(0,15).yellow}..>`);
      DEBUG_BUFFER_LOG && (buffer.length) > 35 && (buffer.length) < 50 && _logs.append('_ERROR', `[SERVER.JS]  PORT <1009> BUFFER <${String(buffer.length)}>:<${String(buffer).substring(0,15)}...> MATCHKEY=${String(MATCHKEY).substring(0,15)}..HEX STR=<${hex_to_ascii(MATCHKEY).substring(0,15)}..>`,()=>{});
      // ------
      // 78563412 - TDK
      // 71589301 - JAMES HOME
      if (MATCHKEY == '32004851' || MATCHKEY == '2345678901' ||MATCHKEY == "83709728" || MATCHKEY == "71589301" || MATCHKEY == "50512412" ) {
        // ---------
        let deviceID = hex_to_ascii(buffer.substring(10, 30));
        console.log(`[${"SERVER.JS".yellow}] PORT <${'1009'.yellow}> DEVICE ID <${deviceID.yellow}> KEY <${MATCHKEY.yellow}> PORT <${String(socket.remotePort).yellow}><${String(socket.remoteAddress).blue}>`);
        _logs.append('_ERROR', `[SERVER.JS]  PORT <${'1009'}> DEVICE ID <${deviceID}> KEY <${MATCHKEY}> PORT <${String(socket.remotePort)}><${String(socket.remoteAddress)}>`,()=>{});
        // ----------
        if (deviceID) {
          const nArray = server.socketArr.indexOf(socket);
          if (nArray > -1) {
            gatewayData = {
              PORT : 1009,
              MATCHKEY : MATCHKEY,
              GATEWAYID: deviceID,
              ADDRESS  : clientAddress,
              TIMESTAMP: new Date(),
              SOCKET   : socket
            }
            server.socketArr.pop(nArray);
            server.socketArr.push(gatewayData);
            gatewayTracker.INSERT(gatewayData)
            // ---------------------------
          }
        } else {
          console.log("ERROR PROCESSING PACKET [%s] FROM LORA GATEWAY[%s] >>",buffer,clientAddress);
        }
      } else if (hex_to_ascii(MATCHKEY) == "+RCV") {
        // -----------------
        // DATA PACKET ARRAY
        // ----------------
        _logs.append('_ERROR',`[SERVER.JS] <1009> <${hourNow}:${minuteNow}> .+RCV...${buffer.toString("UTF-8")}`,()=>{});
        var DataArr = buffer.toString("hex").toUpperCase().split("0D");
        // --------------------------------
        let DataArr1 = DataArr[0].split("2C");
        let DataArr2 = DataArr1[0].split("3A");
        // ------------------
        if (DataArr.length < 4) {
          //  -------------------------
          decoders.decode485Sensor(1009,DataArr,function(statusCode,payload) {
            // ------------------
            if (payload)  {
              const {FUNCID,DTUID,SENSORID,NDATA,RCV_BYTES,DATAS,DATAS1,DATAS2} = payload;
              // --------------------------------
              let strKEY = `${DTUID}_${SENSORID}`
              if (server.sensorsArr.hasOwnProperty(strKEY)) { 
                delete server.sensorsArr[strKEY];
              }
              server.sensorsArr[strKEY] = `${hourNow}:${minuteNow} ...|${DATAS}|`;
              payloadString = JSON.stringify(payload);
              _logs.append('_NIPPONDEMO',`${payloadString}`,()=>{});
              // --------------------------------------------------
            }
          });
          // -------------------------------
        } else {
          // ------------
          // LORA SENSORS - +RCV:ID,DATA IN BYTE
          // ------------------
          if ( DataArr.length > 4 ){
            // -------------
            decoders.decodeWISensorV1(1009,DataArr,function (statusCode, payload) {
              // ------------------------
              if (statusCode == 200)  {
                const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                // --------------------------------
                let strKEY = `${modelID}`
                if (server.sensorsArr.hasOwnProperty(strKEY)) { 
                  delete server.sensorsArr[strKEY];
                }
                server.sensorsArr[strKEY] = `TIME:${hourNow}:${minuteNow} ...READING..<${payload["Temperature"]}>`
                return;
                // --------------------------------------------------
              } else {
                console.log('1009-decodeWISensorV1',statusCode,payload)
              }
            });
          }
          return;
          // ---------------
        }
        // --------
      } else if (buffer.substring(0, 2).toString("UTF-8").toUpperCase() == "FA" || buffer.substring(0, 2).toString("UTF-8").toUpperCase() == "FE" ) {
        // -------------
        // AP MODE -----
        // -------------
        decoders.decodeF8L10ST(1009,buffer,function(statusCode,payload) {
          // -------------
          if (statusCode == 200) {
            // ------------------------
            /*
            console.log(`[${"SERVER.JS".green}] <${'1009'.yellow}> STATUS CODE=${statusCode} ...decodeF8L10ST... MODE=<${payload._MODE}>.. 
            ...<${payload.PortID}|${payload._DTUID}|${payload._SENSORID}>. <${String(payload._DATA).yellow}> 
            ...NDATA=${payload._NDATA} HEX=${payload._DATAHEX}..<${getDATAFROMHEX(payload._DATAHEX)}>`)
            */            
            // _logs.append('_NIPPONDEMO',`${payloadString}`,()=>{});
            payloadString = JSON.stringify(payload);
            let sensorObj = getSensorObj(payload.PortID,payload._DTUID,payload._MODE,payload._SENSORID,payload._DATAHEX);
            var jsonPayload = JSON.stringify(sensorObj);
            _logs.append('_TEAWAREHOUSE',jsonPayload,()=>{});
          }
        })
        // -----------
      } else {
        if (MATCHKEY == '0D0A4F4B') {
          return;
        }
        console.log(`[${'SERVER.JS'.yellow}] PORT <${'1009'.yellow}> MISS-MATCH KEY <${MATCHKEY.red}>`);
        _logs.append('_ERROR', `[SERVER.JS]  PORT <${'1009'}> MISS-MATCH KEY <${MATCHKEY}>`,()=>{});
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
      console.log(`[${'SERVER.JS'.yellow}] PORT <${"1009".yellow}> ...${'GATEWAY DISCONNECTED'.red}...`);
      _logs.append('_ERROR', `[SERVER.JS]  PORT <1009> GATEWAY DISCONNECTED...${clientAddress}`,()=>{});
      // ------
      server.socketArr.pop(Socket);
    } catch (e) {}
    // ----------
    console.log(`[${'SERVER.JS'.yellow}] PORT <${"1009".yellow}> ....${'GATEWAY DISCONNECTED'.red}...`);
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
  // ---------------------------
  var clientAddress = `${socket.remoteAddress}>${socket.remotePort}`;
  // --------------------------------------------------
  server.tcpServer1010.getConnections(function (error, count) {
    // ---------------------------
    server.socketArr.push(socket);
    // ---------------------------
  });
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
      // ------------
      if (MATCHKEY=='80A0001B' || MATCHKEY == "37518050" || MATCHKEY == "83709728" || MATCHKEY == "78563412" || MATCHKEY == "50512412" ) {
        // -----------
        let deviceID = hex_to_ascii(buffer.substring(10, 30));
        console.log(`[${'SERVER.JS'.yellow}] PORT <${'1010'.red}> DEVICE ID <${deviceID.red}> KEY <${MATCHKEY.red}> PORT <${String(socket.remotePort).red}><${String(socket.remoteAddress).blue}>`);
        _logs.append('_ERROR', `[SERVER.JS]  PORT <${'1010'}> DEVICE ID <${deviceID}> KEY <${MATCHKEY}> PORT <${String(socket.remotePort)}><${String(socket.remoteAddress)}>`,()=>{});
        // -------------
        if (deviceID) {
          const nArray = server.socketArr.indexOf(socket);
          if (nArray > -1) {
            gatewayData = {
              PORT : 1010,
              GATEWAYID: deviceID,
              ADDRESS  : clientAddress,
              TIMESTAMP: new Date(),
              SOCKET   : socket
            }
            server.socketArr.pop(nArray);
            server.socketArr.push(gatewayData);
            gatewayTracker.INSERT(gatewayData);
            // ---------------------------
            // console.log(`[${'SERVER.JS'.yellow}] PORT <${'1010'.red}> TCP SERVER ${'1010'.red} SOCKET ARRAY=[${server.socketArr.length}]`);
            // ---------------------------
          }
        } else {
          console.log("ERROR PROCESSING PACKET [%s] FROM LORA GATEWAY[%s] >>",buffer,clientAddress);
        }
      } else if (hex_to_ascii(MATCHKEY) == "+RCV") {
        // -----------------
        // AT MOODE
        // DATA PACKET ARRAY
        // ----------------
        var DataArr = buffer.toString("hex").toUpperCase().split("0D");
        // -------------------------------
        let DataArr1 = DataArr[0].split("2C");
        let DataArr2 = DataArr1[0].split("3A");
        // -----------------------
        let _HEADER = DataArr1[1].substring(0, 2).toString("UTF-8").toUpperCase();
        // console.log(`..${"1010".red}...MATCHKEY=<${MATCHKEY.yellow}:${hex_to_ascii(MATCHKEY).green}> HEADER=<${_HEADER.green}> DATAARR LENGTH=<${DataArr.length.toString().red}>`);
        // -------
        if (DataArr.length < 4) {
          // ---------------------------
          if (_HEADER === 'FA') {
            // ------------
            // F8L10ST - SELF BATTERY
            decoders.decodeF8L10ST_ATMODE(1010,buffer,function(statusCode,payload) {
              // -------------
              if (statusCode == 200) {
                // -------------------------
                payloadString = JSON.stringify(payload);
                console.log(`..1010...decodeF8L10ST_ATMODE...${statusCode }`)
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
                if (statusCode==200)  {
                  const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                  // --------------------------------
                  let strKEY = `${modelID}`
                  if (server.sensorsArr.hasOwnProperty(strKEY)) { 
                    delete server.sensorsArr[strKEY];
                  }
                  server.sensorsArr[strKEY] = `TIME:${hourNow}:${minuteNow} ...READING..<${payload["Temperature"]}>`
                  // --------------------------------------------------
                } else {
                  console.log('1010-decodeWISensorV2',statusCode,payload)
                }
              });
              // --------------
            } else {
              decoders.decode485Sensor(1010,DataArr,function(statusCode,payload) {
                // ------------------
                if (statusCode == 200)  {
                  // ---------
                  const {FUNCID,DTUID,SENSORID,NDATA,RCV_BYTES,DATAS,} = payload;
                  // --------------------------------
                  let strKEY = `${DTUID}_${SENSORID}`
                  if (server.sensorsArr.hasOwnProperty(strKEY)) { 
                    delete server.sensorsArr[strKEY];
                  }
                  try {
                    server.sensorsArr[strKEY] = `${hourNow}:${minuteNow} .....<${status}|${FUNCID}>  ` + 
                                                `DTU.ID=[${DTUID.toString().padStart(3,"0")}] ` + 
                                                `SNR.ID=[${SENSORID.toString().padStart(2,"0")}]...|${getBYTESTRING(RCV_BYTES)}|<${DATAS}>`
                  } catch (err) {
                    console.log(`1010 ${err}`);
                    return;
                  }
                } else {
                  console.log(`${statusCode}..<1010> DECODERS.DECODE485SRNSOR DTU.ID=${payload.DTUID}  SENSOR.ID=${payload.SENSORID} FUNC.ID=${payload.FUNCID} RCV_BYTES=${payload.RCV_BYRES}`)
                }
              });
            }
          }
          // ---------------
        } else {
          // ------------
          // LORA SENSORS - +RCV:ID,DATA IN BYTE
          // ------------------
          if ( DataArr.length > 4 ){
            decoders.decodeWISensorV1(1010,DataArr,function (statusCode, payload) {
              // ------------------------
              if (statusCode=200)  {
                const {modelID,modelType,Temperature,Humidity,BATT,INTERVAL} = payload;
                // --------------------------------
                let strKEY = `${modelID}`
                if (server.sensorsArr.hasOwnProperty(strKEY)) { 
                  delete server.sensorsArr[strKEY];
                }
                server.sensorsArr[strKEY] = `TIME:${hourNow}:${minuteNow} ...READING..<${payload["Temperature"]}>`
                // --------------------------------------------------
              } else {
                console.log('1010-decodeWISensorV1',statusCode,payload)
              }
            });
          }
          return;
          // ---------------
        }
        // -------
      } else if (buffer.substring(0, 2).toString("UTF-8").toUpperCase() == "FE") {
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
      } else if (buffer.substring(0, 2).toString("UTF-8").toUpperCase() == "FA" || buffer.substring(0, 2).toString("UTF-8").toUpperCase() == "FD" ) {
        // ------------------------------------------------------
        // AP MODE -----
        // -------------
        decoders.decodeF8L10ST(1010,buffer,function(statusCode,payload) {
          // -------------
          if (statusCode == 200) {
            // -------------------------
            payloadString = JSON.stringify(payload);
            console.log(`..1010...decodeF8L10ST...${statusCode }`)
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
        console.log(`[${'SERVER.JS'.yellow}] PORT <${'1010'.red}> MISS-MATCH KEY <${MATCHKEY.red}>`);
        _logs.append('_ERROR', `[SERVER.JS]  PORT <${'1010'}> MISS-MATCH KEY <${MATCHKEY}>`,()=>{});
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
      console.log(`[${'SERVER.JS'.yellow}] PORT <${"1010".red}> ...${'GATEWAY DISCONNECTED'.red}...`);
      _logs.append('_ERROR', `[SERVER.JS]  PORT <1010> GATEWAY DISCONNECTED...${clientAddress}`,()=>{});
      // ------
      server.socketArr.pop(Socket);
    } catch (e) {}
    // -----------
    console.log(`[${'SERVER.JS'.yellow}] PORT <${'1010'.red}> ...${'GATEWAY DISCONNECTED'.red}...`);
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
    debug(
      "\x1b[32m%s\x1b[0m",
      method.toUpperCase() + " /" + trimmedPath + " " + statusCode
    );
  } else {
    debug(
      "\x1b[31m%s\x1b[0m",
      method.toUpperCase() + " /" + trimmedPath + " " + statusCode
    );
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
  // ---------------------------
  // checkSumaccept three params, the first two params (input, [encoding]) construct a Buffer
  // Default Econding is HEX
  // array, two unsigned char number of the returned sum
  // int，one unsigned short number of the returned sum
  // buffer，Buffer type of the returned sum
  // ---------------------------------------
  // START TCP SERVER 1008 - TDK IOT NETWORK
  server.tcpServer1008.listen(config.tcpPort1008, function () {console.log(`[${'SERVER.JS'.yellow}]... ... .. TCP Server Is Running On PORT ${String(config.tcpPort1008).green}`); });
  
  // START TCP SERVER 1009 - NIPPON GLASS & TEST IOT NETWORK
  server.tcpServer1009.listen(config.tcpPort1009, function () {console.log(`[${'SERVER.JS'.yellow}]... ... .. TCP Server Is Running On PORT ${String(config.tcpPort1009).yellow}`); });

  // START TCP SERVER 1010 - HOSPITAL IOT NETWORK
  server.tcpServer1010.listen(config.tcpPort1010, function () { console.log(`[${'SERVER.JS'.yellow}]... ... .. TCP Server Is Running On PORT ${String(config.tcpPort1010).red}`) });

  /*
  server.httpServer.listen(config.httpPort, function () {
    console.log("\x1b[35m%s\x1b[0m","The HTTP server is running on port " + config.httpPort);
  });

  // Start the HTTPS server
  server.httpsServer.listen(config.httpsPort, function () {
    console.log("\x1b[36m%s\x1b[0m","The HTTPS server is running on port " + config.httpsPort);
  });
  */
};

// Export the module
module.exports = server;
