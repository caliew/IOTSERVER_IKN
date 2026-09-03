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
const evaluator = require('./evaluator');
const liveTracker = require('./liveTracker');
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
const filterLIMITS = {
  'TEMPERATURE_MAX': 100,
  'TEMPERATURE_MIN': -100,
  'HUMIDITY_MIN': 20,
  'CURRENT_MAX': 1000,
  'CURRENT_MIN': -1,
  'PRESSURE_MAX': 10,
  'PRESSURE_MIN': -10,
  'DIFF_PRESSURE_MAX': 100,
}
//  -----------------
//  Utility Functions
//  -----------------
function getSensorObj(PORTID, DTUID, MODE, SENSORID, RCV_BYTES, BATT) {
  let sensorObj = {};
  sensorObj['TIMESTAMP'] = new Date();
  sensorObj['PORT.ID'] = PORTID;
  sensorObj['MODE'] = MODE,
    sensorObj['DTU.ID'] = DTUID;
  sensorObj['SENSOR.ID'] = SENSORID;
  sensorObj['RCV.BYTES'] = RCV_BYTES;
  if (BATT != null)
    sensorObj['BATT'] = BATT;
  // let nDATA = RCV_BYTES?.length/2/2;
  // for (let i = 0; i < nDATA; i++) {
  //   let _BYTE = RCV_BYTES.substr(i*4,4);
  //   let _DATA = parseInt(_BYTE,16);
  //   if (i==0) sensorObj['RH']= _DATA;
  //   if (i==1) sensorObj['TEMP']= _DATA;
  //   if (i==2) sensorObj['CO2']= _DATA;
  // }
  return sensorObj;
}
// ---------
// MQQT PORT
// ---------
server.tcpServer1883 = net.createServer(function (socket) {
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
    _logs.append(_PortIDFile, `[SERVER.JS] ${helpers.GetTIMEStamp()} <${String(_PortID)}> BUFFER <${buffer}>`, () => { });
  });
  //  -----------------------------
  //  When Data Transmission End...
  //  -----------------------------
  socket.once("end", function () {
    console.log(`[${'SERVER.JS'.yellow}] ${helpers.GetTIMEStamp()} <${String(_PortID).yellow}> ...${'GATEWAY SOCKET END'.red}...`);
    _logs.append('_ERROR', `[SERVER.JS] ${helpers.GetTIMEStamp()} <${String(_PortID)}> SOCKET END ...${clientAddress}`, () => { });
  });
  //  --------------------------
  //  When Connection Closed ...
  //  --------------------------
  socket.once("close", function () {
    try {
      // ------
      console.log(`[${'SERVER.JS'.yellow}] ${helpers.GetTIMEStamp()} <${String(_PortID).green}> ...${'GATEWAY SOCKET CLOSE'.red}...`);
      _logs.append('_ERROR', `[SERVER.JS] ${helpers.GetTIMEStamp()} <${String(_PortID)}> SOCKET CLOSE ...${clientAddress}`, () => { });
      // ------
      server.socketArr.pop(Socket);
    } catch (e) { }
    // --------
  });
  //  -------------------------
  //  When There Is An Error...
  //  -------------------------
  socket.on("error", function (err) {
    socket.destroy();
  });
  // 
  socket.setTimeout(1000 * 60 * 30, function () {
    console.log(`.....[${String(_PortID)}] DISCONNECTING CLIENT ...`);
    socket.end(`.....[${String(_PortID)}] DISCONNECTING CLIENT ...`);
  });
})
server.tcpServer8883 = net.createServer(function (socket) {
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
    _logs.append(_PortIDFile, `[SERVER.JS] ${helpers.GetTIMEStamp()} <${String(_PortID)}> BUFFER <${buffer}>`, () => { });
  });
  //  -----------------------------
  //  When Data Transmission End...
  //  -----------------------------
  socket.once("end", function () {
    console.log(`[${'SERVER.JS'.yellow}] ${helpers.GetTIMEStamp()} <${String(_PortID).green}> ...${'GATEWAY SOCKET END'.red}...`);
    _logs.append('_ERROR', `[SERVER.JS] ${helpers.GetTIMEStamp()} <${String(_PortID)}> SOCKET END ...${clientAddress}`, () => { });
  });
  //  --------------------------
  //  When Connection Closed ...
  //  --------------------------
  socket.once("close", function () {
    try {
      // ------
      console.log(`[${'SERVER.JS'.yellow}] ${helpers.GetTIMEStamp()} <${String(_PortID).green}> ...${'GATEWAY SOCKET CLOSE'.red}...`);
      _logs.append('_ERROR', `[SERVER.JS] ${helpers.GetTIMEStamp()} <${String(_PortID)}>  SOCKET CLOSE ...${clientAddress}`, () => { });
      // ------
      server.socketArr.pop(Socket);
    } catch (e) { }
    // --------
  });
  //  -------------------------
  //  When There Is An Error...
  //  -------------------------
  socket.on("error", function (err) {
    socket.destroy();
  });
  // 
  socket.setTimeout(1000 * 60 * 30, function () {
    console.log(`.....[${String(_PortID)}] DISCONNECTING CLIENT ...`);
    socket.end(`.....[${String(_PortID)}] DISCONNECTING CLIENT ...`);
  });
})
// ----------------------------------------------
// INSTANTIATE GENERIC TCP SERVER ON GENERIC PORT
// ----------------------------------------------
function startTCPServer(FileName, PortID, blnDEBUG) {
  // ----------------------------------------
  // FileName = USE IN AP MODE AS DOMAIN NAME
  // ----------------------------------------
  const CLOG_SOURCE = (_FILENAME) => `<${_FILENAME}>`;
  const CLOG_FLAG = (_FLAG) => `[F:${String(_FLAG).toUpperCase().bgYellow}]`
  const CLOG_MODE = (_MODE) => `[M:${String(_MODE).toUpperCase().bgCyan}]`
  const CLOG_ALERT = (_ALERT) => `[B:${String(_ALERT).toUpperCase().bgYellow.white}]`;
  const CLOG_GMODE = (_MODE) => `<${String(_MODE).toUpperCase().bgRed.white}>`;
  const CLOG_PORTID = (_PORTID) => `<${String(_PORTID).toUpperCase().bgWhite.blue}>`;
  const CLOG_STATUSCODE = (_STATUSCODE) => `<${String(_STATUSCODE).bgMagenta.black}>`;
  // ------
  const tcpServer = net.createServer(function (socket) {
    // --------
    let buffer;
    let _GMODE = '';
    let _DEBUGINT = true;
    let _SOCKETADDRESS = socket.address();
    let _PORTID = _SOCKETADDRESS.port;
    let _PORTIDFile = `_${_PORTID}`;
    let _RAWFile = `_${FileName}`;
    let _PortALERTFILE = `_${FileName}ALERTS`;
    let _REGISTERKEYS = {
      1008: ["88888888", "78563412", "50512412", "37518050", "83709728", "2345678901"],
      1010: ["50512412", "37518050", "83709728", "53485431"],
      1009: [""],
      1088: ['88888888', "64011120"]
    };
    // ---------------------------------------------------------------------------------------
    const _CHECKSENSORS = [];
    var decoder = new StringDecoder("hex");
    var clientAddress = `${socket.remoteAddress}>${socket.remotePort}`;
    //  ---------------------
    //  ON DATA RECEIVED ....
    //  ---------------------             
    const blnSKIPWISENSOR1 = false;
    const blnSKIPWISENSOR2 = false;
    const blnSKIP485SENSOR = false;
    // ------------------------------
    socket.on("data", function (data) {
      // --------------------------
      buffer = decoder.write(data);
      buffer = buffer.replace("undefined", "");
      // --------------------------------------
      if (buffer.length > 4) {
        // -----------
        const MATCHKEY = buffer.substring(0, 8).toString("UTF-8").toUpperCase();
        let _APKEY = buffer.substring(0, 2).toString("UTF-8").toUpperCase();
        (blnDEBUG && (_APKEY != "0D")) && _logs.append(_PORTIDFile, `[SERVER.JS] ${helpers.GetTIMEStamp()} <${_PORTID}> LINE:227 APKEY=[${_APKEY}] REGKEY=${MATCHKEY} BUFFER=[${buffer.length}]${buffer}`, () => { });
        (blnDEBUG && (_APKEY != "0D")) && console.log(`[SERVER.JS] ${helpers.GetTIMEStamp()} ${CLOG_PORTID(_PORTID)} LINE:228 APKEY=[${String(_APKEY).red}] REGKEY=[${String(MATCHKEY).green}] BUFFER=[${String(buffer.length).yellow}] ${String(helpers.truncateString(buffer, 35)).bgGreen}`);
        // -----------------------------------
        if (_REGISTERKEYS?.[_PORTID] && _REGISTERKEYS?.[_PORTID].includes(MATCHKEY)) {
          //  ------------------------------
          //  IDENTIFIY GATEWAY REGISTRATION
          //  ------------------------------
          let DEVICEID = helpers.hex_to_ascii(buffer.substring(10, 30));
          blnDEBUG && console.log(`[${"SERVER.JS".yellow}] ${helpers.GetTIMEStamp()} ${CLOG_PORTID(_PORTID)} LINE:235 DEVICE=${DEVICEID.green} [${String(_RAWFile).toUpperCase().bgCyan}].. REGKEY=[${MATCHKEY.cyan}] APKEY=[${_APKEY.yellow}]`);
          _logs.append(_PORTIDFile, `[SERVER.JS] ${helpers.GetTIMEStamp()} <${_PORTID}> LINE:235 DEVICE=${DEVICEID} REGKEY=${MATCHKEY} APKEY=${_APKEY}`, () => { });
          // -------------
          if (DEVICEID) {
            const nArray = server.socketArr.indexOf(socket);
            let gatewayData = {
              PORT: _PORTID,
              MATCHKEY: MATCHKEY,
              GATEWAYID: DEVICEID,
              ADDRESS: clientAddress,
              TIMESTAMP: new Date(),
              SOCKET: socket
            }
            if (nArray > -1) {
              server.socketArr.pop(nArray);
              // ---------------------------
            }
            server.socketArr.push(gatewayData);
            gatewayTracker.INSERT(gatewayData);
            // ----------
          } else {
            console.log("ERROR PROCESSING PACKET [%s] FROM LORA GATEWAY[%s] >>", buffer, clientAddress);
          }
        } else if (["2B", "80"].includes(_APKEY)) {  // TRANS MODE
          // ---------------
          // AT (TRANS) MODE ASCIIKEY == "+RCV" -- 2B524356
          // ---------------
          _GMODE = 'TRANS'
          var DataArr = buffer.toString("hex").toUpperCase().split("0D");
          // -------------------------------
          let DataArr2C = DataArr[0].split("2C");
          // -----------------------
          DataArr2C = DataArr.length > 2 ? (DataArr[0] + '0D' + DataArr[1]).split("2C") : DataArr[0].split("2C");
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
              //  ----------------------
              //  F8L10ST - SELF BATTERY
              //  ----------------------
              blnDEBUG && blnDEBUG && console.log(`[SERVER.JS] ${helpers.GetTIMEStamp()} ${CLOG_PORTID(_PORTID)} ${CLOG_GMODE(_GMODE)} HEADER=${String(_HEADER).green} DATAARR=[${String(DataArr.length).yellow}]`);
              // ---------------------
              const DTUIDMap = {
                11: 102,
                1: 2
              }
              decoders.decodeF8L10ST_ATMODE(_PORTID, buffer, blnDEBUG, function (statusCode, payload) {
                // ------
                const _SENSORID = payload._SENSORID ?? '0';
                const _DTUID = DTUIDMap[_SENSORID] ?? _SENSORID;
                const _HEXSTR = payload._DATAHEX;
                const _BATT = pyaload?._BATT ?? 'na';
                const _RAWFILENAME = `${_DTUID}-${_SENSORID}`;
                const _ARRAY = Array(Math.ceil(_HEXSTR.length / 4)).fill().map((_, i) => _HEXSTR.substring(i * 4, (i + 1) * 4));
                if (_SENSORID < 1 || _ARRAY.length > 10) return;
                blnDEBUG && console.log(`[SERVER.JS] ${String(PortID).yellow} LINE:308 ${'DECODEF8L10ST_ATMODE'.bgMagenta} ${CLOG_STATUSCODE(statusCode)} DTU.ID=${_DTUID} SENSOR.ID=${_SENSORID} <${_RAWFILENAME}> HEX_DATA=${payload._DATAHEX} ${_ARRAY}`);
                // ------
                const ObjSENSOR = {
                  DTUID: _DTUID,
                  SENSORID: _SENSORID,
                  SENSORTYPE: "PWR-METER-POWER",
                  FUNCID: 3,
                  NDATA: 2,
                  RCV_BYTES: _ARRAY,
                  BATT: _BATT,
                  DATAS: [56, -15701],
                  TIMESTAMP: new Date(),
                }
                payloadString = JSON.stringify(ObjSENSOR);
                blnDEBUG && _logs.append(_PORTIDFile, String(buffer), () => { });
                blnDEBUG && _logs.append(_PORTIDFile, payloadString, () => { });
                const IS_SENSORREGISTERED = _CHECKSENSORS.includes(String(modelID).toUpperCase());
                if (statusCode == 200) {
                  // -------------------------
                  (IS_SENSORREGISTERED || blnDEBUG) && console.log(`..${_PORTID}...${'DECODEF8L10ST_ATMODE'.bgMagenta} STATUS CODE=[${statusCode}] LOG APPEND=<${_RAWFILENAME}>`)
                  _logs.append(_RAWFILENAME, `${payloadString}`, (err) => {
                    // console.log(err)
                  });
                  // console.log(payload);
                }
              })
              // --------    
            } else if (["80", "01", "FD"].includes(_APKEY) || _HEADER == '80') {
              // -------------------------------------------------------------
              // WISENSOR NEW PROTOCOL V2.10 HEADER = '80' > CALL NEW DECODER
              // -------------------------------------------------------------
              blnDEBUG && !blnSKIPWISENSOR2 && blnDEBUG && console.log(`  >>[SERVER.JS] LINE:326 ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} HEADER=${String(_HEADER).yellow} [${String(DataArr?.length).red}][${String(helpers.trimHexArray(DataArr)).magenta}]`);
              blnDEBUG && !blnSKIPWISENSOR2 && blnDEBUG && _logs.append(_PORTIDFile, `  >>[SERVER.JS] LINE:327 ${CLOG_PORTID(_PORTID)} [${_GMODE}] HEADER=${String(_HEADER)} [${DataArr?.length}][${String(helpers.trimHexArray(DataArr2C))}]`, () => { });
              let _DATA = (DataArr2C.length == 2) ? DataArr2C[1] : DataArr2C.slice(2).join('2C');
              _DATA = _DATA.substring(0, 2) == "80" ? _DATA : DataArr2C.join('2C');
              const _JOINBLOCK = [DataArr2C[1], ...DataArr2C.slice(2)].join('2C');
              // ---------
              decoders.decodeWISensorV2(_PORTID, blnDEBUG, buffer, function (statusCode, payload) {
                const { modelID, modelType, Temperature, Humidity, BATT, INTERVAL } = payload || {};
                if (modelID) {
                  liveTracker.recordTelemetryEvent({ portId: _PORTID, siteName: FileName, macId: modelID, rawBuffer: buffer, parsedValues: payload });
                }
                liveTracker.updateLiveStatus({ portId: _PORTID, siteName: FileName, macId: modelID, tempVal: Temperature });
                // ------
                const IS_SENSORREGISTERED = _CHECKSENSORS.includes(String(modelID).toUpperCase());
                !blnSKIPWISENSOR2 && liveTracker.trackedLog(String(modelID ?? '').toUpperCase(), `[SERVER.JS] DECODEWISENSORV2 ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} ${CLOG_SOURCE(FileName)} STATUS=${statusCode} HEADER=${_HEADER} TYPE=${modelType} TEMP=${Temperature} HUM=${Humidity} BATT=${BATT}`);
                // (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:342 ${'DECODEWISENSORV2'.bgCyan} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} ${CLOG_STATUSCODE(statusCode)} MODELID=${String(modelID).toUpperCase()} MODELTYPE=${modelType} TEMP=${Temperature} HUM=${Humidity} BATT=${BATT} INTERVAL=${INTERVAL}`);
                // ------
                if (statusCode == 407) {
                  _data.read(FileName, 'settings', function (err, settingData) {
                    //  ------------------------
                    let _DTUID = String(payload?.modelID ?? '').toUpperCase();
                    let _MODE = payload._MODE ?? 'NA';
                    let _HEX = payload._DATAHEX;
                    let _FoundSensor = settingData?.["IOT_SENSORS"]?.[_DTUID] ? settingData["IOT_SENSORS"][_DTUID] : null;
                    if (_FoundSensor == null) return;
                    if (!_FoundSensor.hasOwnProperty("1")) return;
                    _FoundSensor = _FoundSensor["1"];
                    //  -------------------------
                    let _TYPE = _FoundSensor.TYPE;
                    let _ALERT = _FoundSensor.ALERT ? _FoundSensor.ALERT : false;
                    let _ALERTFLAG = _FoundSensor?.ALERTFLAG ?? 0;
                    
                    const evalResult = evaluator.evaluateSensorReadings({
                      type: _TYPE,
                      sensorSetting: _FoundSensor,
                      readings: { ...payload, Temperature, Humidity, hex: _HEX }
                    });

                    if (!evalResult || evalResult.isFalseSignal) return;

                    liveTracker.recordTelemetryEvent({
                      portId: _PORTID,
                      siteName: FileName,
                      macId: _DTUID,
                      rawBuffer: buffer,
                      parsedValues: payload,
                      sensorConfig: _FoundSensor,
                      evalResult: evalResult,
                    });

                    liveTracker.trackedLog(_DTUID, `[SERVER.JS] DECODEWISENSORV2 EVAL PORT=${_PORTID} ALERT=${_ALERT}|FLAG=${evalResult.isAlert}|MODE=${_MODE} MSG=${evalResult.message}`);

                    if (evalResult.isAlert) {
                      _FoundSensor.DTUID = _DTUID;
                      liveTracker.updateLiveStatus({ portId: _PORTID, siteName: FileName, macId: _DTUID, sensorName: _FoundSensor.NAME || _TYPE, tempVal: Temperature, isAlert: true, message: evalResult.message });
                      liveTracker.trackedLog(_DTUID, `[SERVER.JS] DECODEWISENSORV2 ⚠️ ALERT TRIGGERED <${_TYPE}> ${evalResult.message}`);
                      DISPATCH_ALERT(FileName, _PortALERTFILE, _FoundSensor, evalResult.alertObj, _ALERTFLAG, _ALERT);
                    }
                  });
                }
              });
              // --------------
            } else {
              // ------------------
              blnDEBUG && blnDEBUG && console.log(`  >>[SERVER.JS] LINE:483 ${helpers.GetTIMEStamp()} ${CLOG_PORTID(_PORTID)} ${CLOG_GMODE(_GMODE)} HEADER=${String(_HEADER).green} DATAARR=[${String(DataArr.length).yellow}]`);
              // ---------------------  
              blnDEBUG && !blnSKIP485SENSOR && blnDEBUG && console.log(`  >>[SERVER.JS] LINE:485 ${helpers.GetTIMEStamp()} ${CLOG_PORTID(_PORTID)} ${CLOG_GMODE(_GMODE)} HEADER=${String(_HEADER).yellow} [${String(helpers.trimHexArray(DataArr)).magenta}]`);
              decoders.decode485Sensor(_PORTID, DataArr, function (statusCode, payload) {
                // ------
                if (statusCode == 200) {
                  const { FUNCID, DTUID, SENSORID, SENSORTYPE, NDATA, RCV_BYTES, DATAS, } = payload || {};
                  const macStr = DTUID ? `${DTUID}-${SENSORID}` : '485';
                  liveTracker.recordTelemetryEvent({ portId: _PORTID, siteName: FileName, macId: macStr, rawBuffer: buffer, parsedValues: payload });
                  liveTracker.updateLiveStatus({ portId: _PORTID, siteName: FileName, macId: macStr, sensorName: SENSORTYPE });
                  false && console.log(_PORTID, statusCode, buffer);
                  false && console.log(payload);
                  const IS_SENSORREGISTERED = _CHECKSENSORS.includes(String(modelID).toUpperCase());
                  !blnSKIP485SENSOR && liveTracker.trackedLog(String(DTUID ?? '').toUpperCase(), `[SERVER.JS] DECODE485SENSOR ${CLOG_GMODE(_GMODE)} PORT=${_PORTID} STATUS=${statusCode} HEADER=${_HEADER} DTUID=${payload.DTUID}|SENSORID=${payload.SENSORID}|TYPE=${payload.SENSORTYPE}`);
                } else {
                  false && _logs.append(_PORTIDFile, `[SERVER.JS] ${helpers.GetTIMEStamp()}  <${_PORTID}> ${CLOG_GMODE(_GMODE)} ${'DECODE485SENSOR'.bgCyan} HEADER=[${_HEADER}] <${statusCode}> ..`, () => { });
                }
              });
            }
            // ---------------
          } else if (DataArr.length > 4) {
            // --------
            blnDEBUG && !blnSKIPWISENSOR1 && blnDEBUG && console.log(`  >>[SERVER.JS] LINE:503 ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} HEADER=${String(_HEADER).yellow} [${String(DataArr?.length).red}][${String(helpers.trimHexArray(DataArr)).magenta}]`);
            decoders.decodeWISensorV1(_PORTID, blnDEBUG, DataArr, function (statusCode, payload) {
              // ------
              const { modelID, modelType, Temperature, Humidity, BATT, INTERVAL } = payload || {};
              if (modelID) {
                liveTracker.recordTelemetryEvent({ portId: _PORTID, siteName: FileName, macId: modelID, rawBuffer: buffer, parsedValues: payload });
              }
              liveTracker.updateLiveStatus({ portId: _PORTID, siteName: FileName, macId: modelID, tempVal: Temperature });
              let _MODELID = modelID ?? '';
              let _MODELTYPE = modelType ?? '';
              let _TEMP = Temperature ?? '';
              let _HUMD = Humidity ?? '';
              const IS_SENSORREGISTERED = _CHECKSENSORS.includes(String(_MODELID).toUpperCase());
              !blnSKIPWISENSOR1 && liveTracker.trackedLog(String(_MODELID ?? '').toUpperCase(), `[SERVER.JS] DECODEWISENSORV1 ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} ${CLOG_SOURCE(FileName)} STATUS=${statusCode} HEADER=${_HEADER} TYPE=${_MODELTYPE} TEMP=${_TEMP} HUM=${_HUMD}`);
              // ------
              if (statusCode == 407) {
                _data.read(FileName, 'settings', function (err, settingData) {
                  //  ------------------------
                  let _DTUID = String(payload?.modelID ?? '').toUpperCase();
                  let _MODE = payload._MODE ?? 'NA';
                  let _HEX = payload._DATAHEX;
                  let _FoundSensor = settingData?.["IOT_SENSORS"]?.[_DTUID] ? settingData["IOT_SENSORS"][_DTUID] : null;
                  if (_FoundSensor == null) return;
                  if (!_FoundSensor.hasOwnProperty("1")) return;
                  _FoundSensor = _FoundSensor["1"];
                  //  -------------------------
                  let _TYPE = _FoundSensor.TYPE;
                  let _ALERT = _FoundSensor.ALERT ? _FoundSensor.ALERT : false;
                  let _ALERTFLAG = _FoundSensor?.ALERTFLAG ?? 0;

                  const evalResult = evaluator.evaluateSensorReadings({
                    type: _TYPE,
                    sensorSetting: _FoundSensor,
                    readings: { ...payload, Temperature, Humidity, hex: _HEX }
                  });

                  if (!evalResult || evalResult.isFalseSignal) return;

                  liveTracker.recordTelemetryEvent({
                    portId: _PORTID,
                    siteName: FileName,
                    macId: _DTUID,
                    rawBuffer: buffer,
                    parsedValues: payload,
                    sensorConfig: _FoundSensor,
                    evalResult: evalResult,
                  });

                  liveTracker.trackedLog(_DTUID, `[SERVER.JS] DECODEWISENSORV1 EVAL PORT=${_PORTID} ALERT=${_ALERT}|FLAG=${evalResult.isAlert} <${_TYPE}:${_DTUID}> MSG=${evalResult.message}`);

                  if (evalResult.isAlert) {
                    _FoundSensor.DTUID = _DTUID;
                    liveTracker.updateLiveStatus({ portId: _PORTID, siteName: FileName, macId: _DTUID, sensorName: _FoundSensor.NAME || _TYPE, tempVal: Temperature, isAlert: true, message: evalResult.message });
                    liveTracker.trackedLog(_DTUID, `[SERVER.JS] DECODEWISENSORV1 ⚠️ ALERT TRIGGERED <${_TYPE}> ${evalResult.message}`);
                    DISPATCH_ALERT(FileName, _PortALERTFILE, _FoundSensor, evalResult.alertObj, _ALERTFLAG, _ALERT, _ALERT);
                  }
                });
              }
            });
          }
        } else if (["FA", "FE", "FD"].includes(_APKEY)) { // AP MODE
          // ------------
          // AP MODE ----
          // F8L10ST (BATTERY POWERED DTU) -----
          // -----------------------------------
          _GMODE = 'APMOD'
          blnDEBUG && blnDEBUG && console.log(`  >>[SERVER.JS] LINE:655 ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} APKEY=${String(_APKEY).green} CHECK [FA,FE,FD]...`)
          decoders.decodeF8L10ST_APIMODE(_PORTID, buffer, blnDEBUG, function (statusCode, payload) {
            // ---------------------
            let _TYPE = 'TBD';
            let _NAME = 'TBD';
            let _DTUID = payload._DTUID ? payload._DTUID : payload.modelID;
            if (_DTUID) {
              liveTracker.recordTelemetryEvent({ portId: _PORTID, siteName: FileName, macId: _DTUID, rawBuffer: buffer, parsedValues: payload });
            }
            liveTracker.updateLiveStatus({ portId: _PORTID, siteName: FileName, macId: _DTUID, sensorName: payload._MODE });
            let _MODE = payload._MODE ?? 'NA';
            let _HEX = payload._DATAHEX ?? '';
            let _BATT = payload?._BATT ?? null;
            const IS_SENSORREGISTERED = _CHECKSENSORS.includes(String(_DTUID).toUpperCase());
            (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:666 ${'DECODEF8L10ST_APIMODE'.bgYellow} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} ${CLOG_SOURCE(FileName)} ${CLOG_STATUSCODE(statusCode)} ${CLOG_MODE(_MODE)} APKEY=[${String(_APKEY).green}] MAC ID=[${String(_DTUID).blue}]`)
            // -------------------------
            // if (String(payload._DATAHEX??'').length < 4) return;
            let sensorObj = getSensorObj(payload.PORTID, payload._DTUID, payload._MODE, payload._SENSORID, _HEX, _BATT);
            !blnSKIP485SENSOR && blnDEBUG && (statusCode != 407) && console.log(`  >>[SERVER.JS] LINE:671 ${'DECODEF8L10ST_APIMODE'.bgYellow} MODE=[${String(_MODE).bgMagenta}] ${_DEBUGINT}/${blnDEBUG} ${CLOG_PORTID(_PORTID)} ${CLOG_SOURCE(FileName)} ${CLOG_STATUSCODE(statusCode)} ${String(_MODE).red}|${String(_TYPE).blue}|${String(_DTUID).magenta}|${String(_NAME).cyan}`);
            // -----
            if (statusCode == 407) {
              if (_MODE == 'HEART-BEAT') {
                // ---------------
                // HEART BEAT INFO
                // ---------------
                var jsonPayload = JSON.stringify(sensorObj);
                if (payload._SENSORID >= 0) _logs.append(_RAWFile, jsonPayload, () => { });
              } else {
                // ------------
                // CHECK ALERTS
                // ------------
                // (_PORTID == '1088') && console.log('>> decodeF8L10ST [RS485]',statusCode,payload._MODE);
                _data.read(FileName, 'settings', function (err, settingData) {
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
                  let _ALERT = _FoundSensor.ALERT ? _FoundSensor.ALERT : false;
                  let _ALERTFLAG = _FoundSensor?.ALERTFLAG ?? 0;

                  (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:729 ${'DECODEF8L10ST_APIMODE'.bgYellow} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} ${CLOG_SOURCE(FileName)} ID=[${String(_DTUID).cyan}] TYPE=${String(_TYPE).magenta} ALERTFLAG=[${String(_ALERTFLAG).yellow}]`);

                  const evalResult = evaluator.evaluateSensorReadings({
                    type: _TYPE,
                    sensorSetting: _FoundSensor,
                    readings: { ...payload, hex: _HEX, useCtRatio: true }
                  });

                  if (!evalResult || evalResult.isFalseSignal) return;

                  liveTracker.recordTelemetryEvent({
                    portId: _PORTID,
                    siteName: FileName,
                    macId: _DTUID,
                    rawBuffer: buffer,
                    parsedValues: payload,
                    sensorConfig: _FoundSensor,
                    evalResult: evalResult,
                  });

                  (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:898 ${'DECODEF8L10ST_APIMODE'.bgYellow} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} <${String(_TYPE).yellow}:${_DTUID}> ${CLOG_ALERT(_ALERT)}|${CLOG_FLAG(evalResult.isAlert)} MESSAGE=${String(evalResult.message).bgGreen}`);
                  
                  // -- WRITE TO LOGS
                  var jsonPayload = JSON.stringify(sensorObj);
                  if (payload._SENSORID >= 0) _logs.append(_RAWFile, jsonPayload, () => { });
                  
                  // -- CHECK ALERTS
                  if (evalResult.isAlert) {
                    liveTracker.updateLiveStatus({ portId: _PORTID, siteName: FileName, macId: _DTUID, sensorName: _FoundSensor.NAME || _TYPE, isAlert: true, message: evalResult.message });
                    DISPATCH_ALERT(FileName, _PortALERTFILE, _FoundSensor, evalResult.alertObj, _ALERTFLAG, _ALERT);
                  }
                  // -------
                  (IS_SENSORREGISTERED || blnDEBUG) && !blnSKIP485SENSOR && console.log(`  >>[SERVER.JS] LINE:908 ${'DECODEF8L10ST_APIMODE'.bgYellow} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} ${CLOG_SOURCE(FileName)} ${CLOG_STATUSCODE(statusCode)} |${String(_MODE).red}|${String(_TYPE).blue}|${String(_DTUID).magenta}|${String(_NAME).cyan}||${_READINGCURRENT ?? '-'}A|${_READINGPRESSURE ?? '-'}Pa|${_READINGTEMP ?? '-'}C|${_READINGRH ?? '-'}%|${_READINGDEW ?? '-'}C|`);
                  (IS_SENSORREGISTERED || blnDEBUG) && !blnSKIP485SENSOR && console.log(`  >>[SERVER.JS] LINE:909 ${'DECODEF8L10ST_APIMODE'.bgYellow} ${CLOG_GMODE(_GMODE)} ${CLOG_ALERT(_ALERT)}|${CLOG_FLAG(_FLAG)} MESSAGE=${String(_MESSAGE).cyan}`);
                  // -------
                });
              }
            }
          })
        } else {
          if (MATCHKEY == '0D0A4F4B') return;
          blnDEBUG && console.log(`[${'SERVER.JS'}] LINE:929 ${CLOG_PORTID(_PORTID)} ${helpers.GetTIMEStamp()} ${String('LINE:981 !!!MISSING GATEWAY!!! ..REG KEY..').yellow} ${CLOG_PORTID(_PORTID)} REGKEY=${MATCHKEY.yellow} _APKEY=${String(_APKEY).blue}`);
          blnDEBUG && console.log(`[${'SERVER.JS'}] LINE:930 ${CLOG_PORTID(_PORTID)} ${helpers.GetTIMEStamp()} ${String(buffer).rainbow}`);
          _logs.append(_PORTIDFile, `[SERVER.JS] ${helpers.GetTIMEStamp()} <${String(_PORTID)}> MISS-MATCH REGKEY <${MATCHKEY}> _APKEY <${_APKEY}>`, () => { });
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
      blnDEBUG && console.log(`[${'SERVER.JS'.yellow}] LINE:944 ${helpers.GetTIMEStamp()} ${CLOG_PORTID(_PORTID)}  ...${'GATEWAY SOCKET END'.red}...`);
      _logs.append('_SERVER', `[SERVER.JS]  ${helpers.GetTIMEStamp()} <${String(_PORTID)}> SOCKET END ...${clientAddress}`, () => { });
    });
    //  --------------------------
    //  When Connection Closed ...
    //  --------------------------
    socket.once("close", function () {
      try {
        // ------
        blnDEBUG && console.log(`[${'SERVER.JS'.yellow}] ${helpers.GetTIMEStamp()} LINE:953 ${CLOG_PORTID(_PORTID)} ...${'GATEWAY SOCKET CLOSE'.red}...`);
        _logs.append('_SERVER', `[SERVER.JS]  ${helpers.GetTIMEStamp()} <${String(_PORTID)}>  SOCKET CLOSE ...${clientAddress}`, () => { });
        // ------
        server.socketArr.pop(Socket);
      } catch (e) { }
      // --------
    });
    //  -------------------------
    //  When There Is An Error...
    //  -------------------------
    socket.on("error", function (err) {
      blnDEBUG && console.log(`[${'SERVER.JS'.yellow}] ${helpers.GetTIMEStamp()} LINE:964 ${CLOG_PORTID(_PORTID)} ...${'GATEWAY SOCKET ERROR'}..${err.errno}|${err.code}..`);
      _logs.append('_SERVER', `[SERVER.JS]  ${helpers.GetTIMEStamp()} <${String(_PORTID)}>  SOCKET ERROR ..${err.errno}|${err.code}..`, () => { });
      socket.destroy();
    });
    // 
    socket.setTimeout(1000 * 60 * 30, function () {
      socket.end(() => console.log(`.....${CLOG_PORTID(_PORTID)} ...${String('DISCONNECTING CLIENT').random}... `));
    });
  })
  // ------------------------------------
  // START LISTENING ON THE SPECIFIC PORT
  // ------------------------------------
  tcpServer.listen(PortID, function () {
    const debugText = String(blnDEBUG).padEnd(5, ' ');
    console.log(
      `[${'SERVER.JS'.yellow}] INIT TCP SERVER PORT .${String(debugText).toUpperCase()[blnDEBUG ? 'green' : 'red']}. ${String(PortID).yellow}:${CLOG_SOURCE(FileName)}`
    );
  });
}
function DISPATCH_ALERT(FileName, _PortALERTFILE, _FoundSensor, _ALERTObj, _ALERTFLAG, _ALERT) {

  const deBUG = false;
  let jsonPayload = JSON.stringify(_ALERTObj);
  _PortALERTFILE && _logs.append(_PortALERTFILE, jsonPayload, () => { });

  _logs.read(_PortALERTFILE, 10, null, null, false, function (err, alertsdata) {
    const now = new Date();
    const interval = 30;
    const twentyMinutesAgo = new Date(now - interval * 60 * 1000);
    let filteredData = [];
    deBUG && console.log(`  >>[SERVER.JS] LINE:985 <${String('DISPATCH ALERT').green}> ${CLOG_SOURCE(FileName)} .[${String(_FoundSensor.ALERTGROUP).yellow}]. -FLAG=${String(_ALERTFLAG).green}|${_ALERT}|${_ALERTObj.MESSAGE.red}-`)
    if (_ALERTFLAG > 0) {
      filteredData = alertsdata.filter(obj => {
        const alertTime = new Date(obj.TIMESTAMP);
        return alertTime >= twentyMinutesAgo && obj.DTU === _FoundSensor.DTUID;
      });
      const AlertCount = filteredData.length;
      deBUG && console.log(`  >>[SERVER.JS] LINE:992 ${CLOG_SOURCE(FileName)} ..#ALERTS COUNT=${AlertCount}  FLAG=${_ALERTFLAG}`);
      if (AlertCount <= _ALERTFLAG) {
        false && console.log(`  >>[SERVER.JS] LINE:994 COUNT [${AlertCount}] < FLAG [${_ALERTFLAG}]`)
        return;
      }
    }
    deBUG && console.log(`  >>[SERVER.JS] LINE:998 ${CLOG_SOURCE(FileName)} ${CLOG_ALERT(_ALERT)} ALERT.GROUP=[${String(_FoundSensor.ALERTGROUP).yellow}] `)
    if (!_ALERT) return;
    const _SENSOR_DTUID = _FoundSensor.DTUID || '';
    let dispatchedGateway = '';
    switch (FileName) {
      case 'MRE':
        dispatchedGateway = 'Telegrambot';
        liveTracker.trackedLog(_SENSOR_DTUID, `[SERVER.JS] DISPATCH_ALERT ${FileName} => Telegrambot GROUP=${_FoundSensor.ALERTGROUP} MSG=${_ALERTObj.MESSAGE}`);
        decoders.Telegrambot(_FoundSensor.ALERTGROUP, _ALERTObj.MESSAGE);
        break;
      case 'NIPPONGLASS_BOILER':
      case 'NIPPONGLASS':
        dispatchedGateway = 'WhatsAppGateway30';
        liveTracker.trackedLog(_SENSOR_DTUID, `[SERVER.JS] DISPATCH_ALERT ${FileName} => WhatsAppGateway30 GROUP=${_FoundSensor.ALERTGROUP} MSG=${_ALERTObj.MESSAGE}`);
        decoders.WhatsAppGateway30(_FoundSensor.ALERTGROUP, _ALERTObj.MESSAGE);
        break;
      case 'SNOWCITY':
      case 'IKN_OPROOM':
      case 'IKN_HOSPITAL':
      case 'INDOGUNA':
        dispatchedGateway = 'WhatsAppGateway28';
        liveTracker.trackedLog(_SENSOR_DTUID, `[SERVER.JS] DISPATCH_ALERT ${FileName} => WhatsAppGateway28 GROUP=${_FoundSensor.ALERTGROUP} MSG=${_ALERTObj.MESSAGE}`);
        decoders.WhatsAppGateway28(_FoundSensor.ALERTGROUP, _ALERTObj.MESSAGE);
        break;
      case 'KAYAKU':
      case 'EPSON':
      case 'SHINKO':
        dispatchedGateway = 'WhatsAppGateway30';
        liveTracker.trackedLog(_SENSOR_DTUID, `[SERVER.JS] DISPATCH_ALERT ${FileName} => WhatsAppGateway30 GROUP=${_FoundSensor.ALERTGROUP} MSG=${_ALERTObj.MESSAGE}`);
        decoders.WhatsAppGateway30(_FoundSensor.ALERTGROUP, _ALERTObj.MESSAGE);
        break;
      default:
        liveTracker.trackedLog(_SENSOR_DTUID, `[SERVER.JS] DISPATCH_ALERT MISSING GATEWAY for ${FileName} GROUP=${_FoundSensor.ALERTGROUP}`);
        break;
    }

    if (dispatchedGateway && _FoundSensor.DTUID) {
      liveTracker.recordDispatchEvent({
        siteName: FileName,
        macId: _FoundSensor.DTUID,
        alertGroup: _FoundSensor.ALERTGROUP,
        gatewayName: dispatchedGateway,
        message: _ALERTObj.MESSAGE,
      });
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
server.httpsServer = https.createServer(server.httpsServerOptions, function (req, res) {
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
      payload: helpers.parseJsonToObject(buffer, '', 'server.js'),
    };
    // Route the request to the handler specified in the router
    try {
      chosenHandler(data, function (statusCode, payload, contentType) {
        server.processHandlerResponse(res, method, trimmedPath, statusCode, payload, contentType);
      });
    } catch (e) {
      debug(e);
      server.processHandlerResponse(res, method, trimmedPath, 500, { Error: "Unknown Error Has Occured" }, "json");
    }
  });
};
// -------------------------------------
// Process the response from the handler
// -------------------------------------
server.processHandlerResponse = function (res, method, trimmedPath, statusCode, payload, contentType) {
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
    try {
      res.setHeader("Content-Type", "application/json");
      payload = typeof payload == "object" ? payload : {};
      payloadString = JSON.stringify(payload);
    } catch (e) {
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
  } catch (e) {
  }

  // If the response is 200, print green, otherwise print red
  if (statusCode == 200) {
    debug("\x1b[32m%s\x1b[0m", method.toUpperCase() + " /" + trimmedPath + " " + statusCode);
  } else {
    debug("\x1b[31m%s\x1b[0m", method.toUpperCase() + " /" + trimmedPath + " " + statusCode);
  }
};
// -------------------------
// Define the request router
// -------------------------
server.router = {
  "": handlers.index,
  "view/cardView": handlers.viewCardList,
  "view/systemView": handlers.viewSystemList,
  "schedules/all": handlers.schedulesList,
  "account/create": handlers.accountCreate,
  "account/edit": handlers.accountEdit,
  "account/deleted": handlers.accountDeleted,
  "session/create": handlers.sessionCreate,
  "session/deleted": handlers.sessionDeleted,
  "systems/create": handlers.systemsCreate,
  "sensors/create": handlers.sensorsCreate,
  "sensors/edit": handlers.sensorsEdit,
  "sensors/deleted": handlers.sensorsDeleted,
  "checks/all": handlers.checksList,
  "checks/create": handlers.checksCreate,
  "checks/edit": handlers.checksEdit,
  "ping": handlers.ping,
  "api/mapbox/token": handlers.mapbox,
  "api/mapbox/data": handlers.mapbox,
  "api/ESP32CAM": handlers.esp32CAM,
  "api/accounts": handlers.accounts,
  "api/users": handlers.users,
  "api/tokens": handlers.tokens,
  "api/checks": handlers.checks,
  "api/sensors": handlers.sensors,
  "api/sensors/type": handlers.sensors,
  "api/sensors/data": handlers.sensors,
  "api/gateways": handlers.gateways,
  "api/systems": handlers.systems,
  "api/alerts": handlers.alerts,
  "favicon.ico": handlers.favicon,
  "public": handlers.public,
  "examples/Error": handlers.exampleError,
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
  blnFLAG && startTCPServer('TDK_JOHOR', config.tcpPort1008, false);     // AT
  blnFLAG && startTCPServer('IKN_HOSPITAL', config.tcpPort1010, false);  // AT
  blnFLAG && startTCPServer('MRE', config.tcpPort1020, false);           // AT
  blnFLAG && startTCPServer('INDOGUNA', config.tcpPort1021, false);           // AT
  blnFLAG && startTCPServer('SNOWCITY', config.tcpPort1012, false);      // TRANS
  blnFLAG && startTCPServer('IKN_OPROOM', config.tcpPort1009, false);    // API

  blnFLAG && startTCPServer('SHINKO', config.tcpPort1011, false);         // AP
  blnFLAG && startTCPServer('NIPPONGLASS', config.tcpPort1013, false);    // AP
  blnFLAG && startTCPServer('EPSON', config.tcpPort1014, false);          // AP
  blnFLAG && startTCPServer('EPSONOSHA', config.tcpPort1015, false);      // AP

  !blnFLAG && startTCPServer('CAMPBELL', config.tcpPort1016, false);         // AP
  blnFLAG && startTCPServer('AEROSOFT', config.tcpPort1088, false);           // TRANS
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
