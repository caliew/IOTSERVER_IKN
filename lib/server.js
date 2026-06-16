/*
 * TCP SERVER RELATED TASKS
*/
// Dependencies
var net = require("net");
var StringDecoder = require("string_decoder").StringDecoder;
var colors = require('colors');
var util = require("util");

var crc16 = require('./crc16');
var _data = require("./data");
var _logs = require("./logs");
var config = require("./config");
var decoders = require("./decoders");
var helpers = require("./helpers");
var gatewayTracker = require('./gatewayTracker');

var debug = util.debuglog("server");

// Instantiate the server module object
var server = {};

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

function getSensorObj(PORTID, DTUID, MODE, SENSORID, RCV_BYTES, BATT) {
  let sensorObj = {};
  sensorObj['TIMESTAMP'] = new Date();
  sensorObj['PORT.ID'] = PORTID;
  sensorObj['MODE'] = MODE;
  sensorObj['DTU.ID'] = DTUID;
  sensorObj['SENSOR.ID'] = SENSORID;
  sensorObj['RCV.BYTES'] = RCV_BYTES;
  if (BATT != null)
    sensorObj['BATT'] = BATT;
  return sensorObj;
}

/**
 * checkSensorAlerts
 *
 * Unified alert threshold evaluator. Called after all byte-decoding and
 * value-computation is done. Each caller pre-computes readings and passes
 * them in via opts.
 *
 * @param {object} opts
 *   FileName, _PortALERTFILE, _FoundSensor, _ALERTFLAG, _ALERT  — routing
 *   _TYPE, _DTUID, _NAME, _GROUP, _UNITSYSTEM                    — metadata
 *   readings: { current, pressure, temp, rh, dew, waterLevel }   — pre-computed values (any can be undefined)
 *   limits:   { ampMax, ampMin, pressMax, pressMin, tempMax, tempMin, rhMax, rhMin, dewMax, dewMin, wtrMax, wtrMin }
 *   _timestamp                                                    — timestamp string for the message
 */
function checkSensorAlerts(opts) {
  const {
    FileName, _PortALERTFILE, _FoundSensor, _ALERTFLAG, _ALERT,
    _TYPE, _DTUID, _NAME, _GROUP, _UNITSYSTEM,
    readings = {}, limits = {},
    _timestamp,
  } = opts;

  let _FLAG = false;
  let _MESSAGE = `${_timestamp} [${String(_NAME).toUpperCase()}] `;
  const _ALERTObj = { TYPE: _TYPE, DTU: _DTUID, NAME: _NAME, GROUP: _GROUP, TIMESTAMP: new Date() };

  // Helper: check a single min/max pair
  function checkBound(value, max, min, label, unit = '') {
    let flagged = false;
    if (max != null && value > max) { _MESSAGE += ` ${label}=${value}>${max}${unit}`; flagged = true; }
    if (min != null && value < min) { _MESSAGE += ` ${label}=${value}<${min}${unit}`; flagged = true; }
    return flagged;
  }

  switch (_TYPE) {
    case 'WATER LEVEL': {
      const v = readings.waterLevel;
      if (v !== undefined) {
        _ALERTObj['WATERLEVEL'] = v;
        _FLAG = checkBound(v, limits.wtrMax, limits.wtrMin, 'WATER LEVEL', 'MM') || _FLAG;
      }
      break;
    }
    case 'AC CURRENT': {
      const v = readings.current;
      if (v !== undefined) {
        _ALERTObj['CURRENT'] = v;
        _FLAG = checkBound(v, limits.ampMax, limits.ampMin, 'CURRENT', 'A') || _FLAG;
      }
      break;
    }
    case 'DIFF PRESS':
    case 'AIR PRESSURE': {
      const v = readings.pressure;
      if (v !== undefined) {
        _ALERTObj['PRESSURE'] = v;
        _FLAG = checkBound(v, limits.pressMax, limits.pressMin, 'PRESS', _UNITSYSTEM || '') || _FLAG;
      }
      break;
    }
    case 'WISENSOR':
    case 'TEMP & RH': {
      const t = readings.temp, rh = readings.rh;
      if (t !== undefined) { _ALERTObj['TEMP'] = t; _FLAG = checkBound(t, limits.tempMax, limits.tempMin, 'TEMP', 'C') || _FLAG; }
      if (rh !== undefined && Number(rh) > 0) { _ALERTObj['RH'] = rh; _FLAG = checkBound(rh, limits.rhMax, limits.rhMin, 'RH', '%') || _FLAG; }
      break;
    }
    case 'DEW PT.METER': {
      const t = readings.temp, rh = readings.rh, dew = readings.dew;
      if (t !== undefined)   { _ALERTObj['TEMP'] = t;   _FLAG = checkBound(t,   limits.tempMax, limits.tempMin, 'TEMP', 'C') || _FLAG; }
      if (rh !== undefined)  { _ALERTObj['RH']   = rh;  _FLAG = checkBound(rh,  limits.rhMax,   limits.rhMin,   'RH',   '%') || _FLAG; }
      if (dew !== undefined) { _ALERTObj['DEW']  = dew; _FLAG = checkBound(dew, limits.dewMax,  limits.dewMin,  'DEW',  'C') || _FLAG; }
      break;
    }
    default:
      break;
  }

  if (_FLAG) {
    _ALERTObj['MESSAGE'] = _MESSAGE;
    DISPATCH_ALERT(FileName, _PortALERTFILE, _FoundSensor, _ALERTObj, _ALERTFLAG, _ALERT);
  }
  return _FLAG;
}
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
          console.log(`[${"SERVER.JS".yellow}] ${helpers.GetTIMEStamp()} ${CLOG_PORTID(_PORTID)} LINE:235 DEVICE=${DEVICEID.green} [${String(_RAWFile).toUpperCase().bgCyan}].. REGKEY=[${MATCHKEY.cyan}] APKEY=[${_APKEY.yellow}]`);
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
                // ------
                const IS_SENSORREGISTERED = _CHECKSENSORS.includes(String(modelID).toUpperCase());
                (IS_SENSORREGISTERED || blnDEBUG) && !blnSKIPWISENSOR2 && console.log(`  >>[SERVER.JS] LINE:341 ${'DECODEWISENSORV2'.bgCyan} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} ${CLOG_SOURCE(FileName)} ${CLOG_STATUSCODE(statusCode)} HEADER[${String(_HEADER).red}] |${String(modelType ?? '-').cyan}|${String(modelID ?? '-').toUpperCase().magenta}|${String(Temperature ?? '-').red}|${String(Humidity ?? '-').cyan}|${String(BATT ?? '-').green}|${String(INTERVAL ?? '-').blue}|`);
                // (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:342 ${'DECODEWISENSORV2'.bgCyan} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} ${CLOG_STATUSCODE(statusCode)} MODELID=${String(modelID).toUpperCase()} MODELTYPE=${modelType} TEMP=${Temperature} HUM=${Humidity} BATT=${BATT} INTERVAL=${INTERVAL}`);
                // ------
                if (statusCode == 407) {
                  _data.read(FileName, 'settings', function (err, settingData) {
                    let _DTUID = String(payload?.modelID ?? '').toUpperCase();
                    let _HEX = payload._DATAHEX;
                    let _FoundSensor = settingData?.["IOT_SENSORS"]?.[_DTUID]?.["1"] ?? null;
                    if (!_FoundSensor) return;

                    const _TYPE        = _FoundSensor.TYPE;
                    const _UNITSYSTEM  = _FoundSensor.UNITSYSTEM ? _FoundSensor.UNITSYSTEM.toUpperCase() : null;
                    const _ALERT       = _FoundSensor.ALERT || false;
                    const _ALERTFLAG   = _FoundSensor?.ALERTFLAG ?? 0;

                    // — Byte decoding (unchanged formulas) —
                    let readings = {};
                    if (_TYPE === 'AC CURRENT' || _TYPE === 'WATER LEVEL') {
                      readings.current = Number(helpers.hexToSignedInt(_HEX) / 100);
                    } else if (_TYPE === 'AIR PRESSURE') {
                      let p = helpers.parseFloat(`0x${_HEX.slice(4, 8)}${_HEX.slice(0, 4)}`);
                      p = _UNITSYSTEM === 'BAR' ? p : Number((p * 1.0E-5).toFixed(2));
                      if (p > Number(filterLIMITS['PRESSURE_MAX'])) return; // false signal
                      readings.pressure = p;
                    } else if (_TYPE === 'WISENSOR' || _TYPE === 'TEMP & RH') {
                      const t = Number(Temperature);
                      const rh = Number(Humidity);
                      const falseSig = t > Number(filterLIMITS['TEMPERATURE_MAX']) || t < Number(filterLIMITS['TEMPERATURE_MIN']);
                      (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] ${'DECODEWISENSORV2'.bgCyan} ${_DTUID} TEMP=${t} FALSE_SIGNAL=${String(falseSig).toUpperCase().bgRed}`);
                      if (falseSig) return;
                      readings.temp = t;
                      readings.rh   = rh;
                    } else if (_TYPE === 'DEW PT.METER') {
                      readings.rh   = helpers.hexToSignedInt(_HEX.slice(0, 4)) / 10;
                      readings.dew  = helpers.hexToSignedInt(_HEX.slice(4, 8)) / 10;
                      readings.temp = helpers.hexToSignedInt(_HEX.slice(8, 12)) / 10;
                    }

                    const limits = {
                      ampMax: _FoundSensor.AMP_MAX ?? null,   ampMin: _FoundSensor.AMP_MIN ?? null,
                      pressMax: _UNITSYSTEM === 'BAR' ? (_FoundSensor.PRESS_MAX ?? null) : Number((_FoundSensor.PRESS_MAX ?? 0) * 1.0E-5).toFixed(2),
                      pressMin: _UNITSYSTEM === 'BAR' ? (_FoundSensor.PRESS_MIN ?? null) : Number((_FoundSensor.PRESS_MIN ?? 0) * 1.0E-5).toFixed(2),
                      tempMax: _FoundSensor.TEMP_MAX ?? null, tempMin: _FoundSensor.TEMP_MIN ?? null,
                      rhMax:   _FoundSensor.RH_MAX   ?? null, rhMin:   _FoundSensor.RH_MIN   ?? null,
                      dewMax:  _FoundSensor.DEW_MAX  ?? null, dewMin:  _FoundSensor.DEW_MIN  ?? null,
                    };

                    const flagged = checkSensorAlerts({
                      FileName, _PortALERTFILE, _FoundSensor, _ALERTFLAG, _ALERT,
                      _TYPE, _DTUID, _NAME: _FoundSensor.NAME, _GROUP: _FoundSensor.GROUP, _UNITSYSTEM,
                      readings, limits, _timestamp: helpers.GetTIMEStamp(),
                    });
                    (IS_SENSORREGISTERED || blnDEBUG) && !blnSKIPWISENSOR2 && console.log(`  >>[SERVER.JS] ${'DECODEWISENSORV2'.bgCyan} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} ${CLOG_ALERT(_ALERT)}|[FLAG=${flagged}]`);
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
                  false && console.log(_PORTID, statusCode, buffer);
                  false && console.log(payload);
                  const IS_SENSORREGISTERED = _CHECKSENSORS.includes(String(modelID).toUpperCase());
                  !blnSKIP485SENSOR && (IS_SENSORREGISTERED || blnDEBUG) && console.log(`[${"SERVER.JS".yellow}] ${CLOG_GMODE(_GMODE)} LINE:502 ${CLOG_PORTID(_PORTID)} ${CLOG_STATUSCODE(statusCode)} ${CLOG_SOURCE(FileName)} ${'DECODE485SENSOR'.bgCyan} HEADER[${String(_HEADER).yellow}] |${String(DTUID ?? '-').magenta}|${String(SENSORID ?? '-').red}|`);
                  !blnSKIP485SENSOR && (IS_SENSORREGISTERED || blnDEBUG) && console.log(`[SERVER.JS] ${helpers.GetTIMEStamp()} ${CLOG_PORTID(_PORTID)} ${CLOG_GMODE(_GMODE)} LINE:505 [${'DECODE485SENSOR'.red}] ${CLOG_STATUSCODE(statusCode)} HEADER=[${_HEADER.yellow}]..${payload.DTUID}|${payload.SENSORID}|${payload.SENSORTYPE}`);
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
              let _MODELID = modelID ?? '';
              let _MODELTYPE = modelType ?? '';
              let _TEMP = Temperature ?? '';
              let _HUMD = Humidity ?? '';
              const IS_SENSORREGISTERED = _CHECKSENSORS.includes(String(_MODELID).toUpperCase());
              !blnSKIPWISENSOR1 && (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:515 ${'DECODEWISENSORV1'.bgRed} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} ${CLOG_SOURCE(FileName)} ${CLOG_STATUSCODE(statusCode)} HEADER[${String(_HEADER).red}] |${String(_MODELTYPE ?? '-').cyan}|${String(_MODELID ?? '-').toUpperCase().magenta}|${String(_TEMP ?? '-').red}|${String(_HUMD ?? '-').cyan}|`);
              // ------
              if (statusCode == 407) {
                _data.read(FileName, 'settings', function (err, settingData) {
                  let _DTUID = String(payload?.modelID ?? '').toUpperCase();
                  let _HEX = payload._DATAHEX;
                  let _FoundSensor = settingData?.["IOT_SENSORS"]?.[_DTUID]?.["1"] ?? null;
                  if (!_FoundSensor) return;

                  const _TYPE        = _FoundSensor.TYPE;
                  const _UNITSYSTEM  = _FoundSensor.UNITSYSTEM ? _FoundSensor.UNITSYSTEM.toUpperCase() : null;
                  const _ALERT       = _FoundSensor.ALERT || false;
                  const _ALERTFLAG   = _FoundSensor?.ALERTFLAG ?? 0;

                  (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] ${'DECODEWISENSORV1'.bgRed} ${_TYPE} ID=${_DTUID}`);

                  // — Byte decoding (unchanged formulas) —
                  let readings = {};
                  if (_TYPE === 'AC CURRENT' || _TYPE === 'WATER LEVEL') {
                    readings.current = Number(helpers.hexToSignedInt(_HEX) / 100);
                  } else if (_TYPE === 'AIR PRESSURE') {
                    let p = helpers.parseFloat(`0x${_HEX.slice(4, 8)}${_HEX.slice(0, 4)}`);
                    p = _UNITSYSTEM === 'BAR' ? p : Number((p * 1.0E-5).toFixed(2));
                    readings.pressure = p;
                  } else if (_TYPE === 'WISENSOR' || _TYPE === 'TEMP & RH') {
                    const t = Number(Temperature);
                    const rh = Number(Humidity);
                    const falseSig = t > Number(filterLIMITS['TEMPERATURE_MAX']) || t < Number(filterLIMITS['TEMPERATURE_MIN']);
                    (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] ${'DECODEWISENSORV1'.bgRed} ${_DTUID} TEMP=${t} FALSE_SIGNAL=${String(falseSig).toUpperCase().bgRed}`);
                    if (falseSig) return;
                    readings.temp = t;
                    readings.rh   = rh;
                  } else if (_TYPE === 'DEW PT.METER') {
                    readings.rh   = helpers.hexToSignedInt(_HEX.slice(0, 4)) / 10;
                    readings.dew  = helpers.hexToSignedInt(_HEX.slice(4, 8)) / 10;
                    readings.temp = helpers.hexToSignedInt(_HEX.slice(8, 12)) / 10;
                  }

                  const limits = {
                    ampMax: _FoundSensor.AMP_MAX ?? null,   ampMin: _FoundSensor.AMP_MIN ?? null,
                    pressMax: _UNITSYSTEM === 'BAR' ? (_FoundSensor.PRESS_MAX ?? null) : Number((_FoundSensor.PRESS_MAX ?? 0) * 1.0E-5).toFixed(2),
                    pressMin: _UNITSYSTEM === 'BAR' ? (_FoundSensor.PRESS_MIN ?? null) : Number((_FoundSensor.PRESS_MIN ?? 0) * 1.0E-5).toFixed(2),
                    tempMax: _FoundSensor.TEMP_MAX ?? null, tempMin: _FoundSensor.TEMP_MIN ?? null,
                    rhMax:   _FoundSensor.RH_MAX   ?? null, rhMin:   _FoundSensor.RH_MIN   ?? null,
                    dewMax:  _FoundSensor.DEW_MAX  ?? null, dewMin:  _FoundSensor.DEW_MIN  ?? null,
                  };

                  const flagged = checkSensorAlerts({
                    FileName, _PortALERTFILE, _FoundSensor, _ALERTFLAG, _ALERT,
                    _TYPE, _DTUID, _NAME: _FoundSensor.NAME, _GROUP: _FoundSensor.GROUP, _UNITSYSTEM,
                    readings, limits, _timestamp: helpers.GetTIMEStamp(),
                  });
                  (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] ${'DECODEWISENSORV1'.bgRed} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} <${_TYPE}:${_DTUID}> [FLAG=${flagged}]`);
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
                  if (err) return;
                  let _FoundSensor = settingData?.["IOT_SENSORS"]?.[_DTUID]?.["1"] ?? null;
                  if (!_FoundSensor) return;
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
                  let _READINGCURRENT, _READINGPRESSURE, _READINGTEMP, _READINGRH, _READINGDEW, _READINGWTRLVL;
                  let _ALERT = _FoundSensor.ALERT ? _FoundSensor.ALERT : false;
                  let _CTRATIO = _FoundSensor?.CTRATIO ?? 1;
                  let _ALERTFLAG = _FoundSensor?.ALERTFLAG ?? 0;
                  //  --------------
                  let _FLAG = false;
                  let _FLAGPRESS = false;
                  let _FALSESIGNAL = false;
                  let HEX1, HEX2, newHEX;
                  let _OFFSET_RH, _OFFSET_TEMP, _FLAGTEMPRH;
                  (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] ${'DECODEF8L10ST_APIMODE'.bgYellow} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} ${CLOG_SOURCE(FileName)} ID=[${String(_DTUID).cyan}] TYPE=${String(_TYPE).magenta} UNIT=<${_UNITSYSTEM}> ALERTFLAG=[${String(_ALERTFLAG).yellow}]`);
                  //  --------------
                  // Decode bytes — formulas preserved exactly per sensor type
                  switch (_TYPE) {
                    case 'WATER LEVEL':
                      _READINGWTRLVL = parseInt(_HEX, 16);
                      break;
                    case 'AC CURRENT':
                      _READINGCURRENT = _CTRATIO != 1 ? Math.abs(helpers.hexToDecimal(_HEX)) * _CTRATIO / 5.0 : Math.abs(helpers.HEXTOINT(_HEX) / 100.0);
                      _READINGCURRENT = Number(_READINGCURRENT).toFixed(0);
                      if (_READINGCURRENT > 1000) {
                        false && console.log(`>>[SERVER.JS] PORT ID=[${_PORTID}] [${_GROUP}][${_NAME}][${_TYPE}] <${_HEX}> [${_CTRATIO}] ..${_READINGCURRENT}=${_AMPMAX}|${_AMPMIN}`);
                        return;
                      }
                      blnDEBUG && console.log(`  >>[SERVER.JS] ${'DECODEF8L10ST_APIMODE'.bgYellow} PORT ID=[${_PORTID}] [${_GROUP}][${_NAME}][${_TYPE}] <${_HEX}> [${_CTRATIO}] ..${_READINGCURRENT}=${_AMPMAX}|${_AMPMIN}`);
                      break;
                    case 'DIFF PRESS': {
                      let value = parseInt(_HEX, 16);
                      if (value > 0x7FFF) { value -= 0x10000; value = value * 10.0; }
                      _READINGPRESSURE = value / 10.0 + _OFFSET_PRESS;
                      _READINGPRESSURE = (_UNITSYSTEM == 'BAR') ? (_READINGPRESSURE * 1.0E-5).toFixed(2) : _READINGPRESSURE;
                      _PRESSMAX = _UNITSYSTEM == 'BAR' ? (_PRESSMAX * 1.0E-5).toFixed(2) : _PRESSMAX;
                      _PRESSMIN = _UNITSYSTEM == 'BAR' ? (_PRESSMIN * 1.0E-5).toFixed(2) : _PRESSMIN;
                      _FALSESIGNAL = _READINGPRESSURE > Number(filterLIMITS['DIFF_PRESSURE_MAX']);
                      _FALSESIGNAL && console.log('DECODEF8L10ST DIFF_PRESS false signal -MIN,MAX,LIMITS', _PRESSMIN, _PRESSMAX, filterLIMITS['PRESSURE_MAX'], 'FALSE_SIGNAL', String(_FALSESIGNAL).toUpperCase(), _READINGPRESSURE);
                      if (_FALSESIGNAL) return;
                      break;
                    }
                    case 'AIR PRESSURE': {
                      HEX1 = _HEX.slice(0, 4);
                      HEX2 = _HEX.slice(4, 8);
                      newHEX = HEX2 + HEX1;
                      if (_HEX.length == 8) { _READINGPRESSURE = helpers.parseFloat(`0x${newHEX}`); }
                      else { _READINGPRESSURE = parseInt(_HEX, 16) * 1000; }
                      _READINGPRESSURE += Number(_OFFSET_PRESS);
                      _READINGPRESSURE = (_UNITSYSTEM == 'BAR') ? (_READINGPRESSURE * 1.0E-5).toFixed(2) : _READINGPRESSURE;
                      _PRESSMAX = _UNITSYSTEM == 'BAR' ? _PRESSMAX : (_PRESSMAX * 1.0E-5).toFixed(2);
                      _PRESSMIN = _UNITSYSTEM == 'BAR' ? _PRESSMIN : (_PRESSMIN * 1.0E-5).toFixed(2);
                      _FALSESIGNAL = _READINGPRESSURE > Number(filterLIMITS['PRESSURE_MAX']);
                      false && console.log('DECODEF8L10ST AIR_PRESSURE', _READINGPRESSURE, _PRESSMIN, _PRESSMAX, filterLIMITS['PRESSURE_MAX'], 'FALSE_SIGNAL', _FALSESIGNAL);
                      if (_FALSESIGNAL) return;
                      (false && (PortID == '101')) && console.log(`${CLOG_SOURCE(FileName)} [${_GROUP}/${String(_NAME).toUpperCase()}|${_TYPE}] <${_HEX}> [${_UNITSYSTEM}] ..${_READINGPRESSURE}=${_PRESSMIN}|${_PRESSMAX}`);
                      break;
                    }
                    case 'WISENSOR': {
                      const { Temperature, Humidity } = payload || {};
                      _READINGTEMP = Temperature ?? 0;
                      _READINGRH = Humidity ?? 0;
                      _OFFSET_RH = _FoundSensor?._OFFSET_RH ?? 0;
                      _OFFSET_TEMP = _FoundSensor?.OFFSET_Temp ?? 0;
                      _READINGTEMP += _OFFSET_TEMP;
                      _READINGRH = (_READINGRH + _OFFSET_RH) / 10.0;
                      break;
                    }
                    case 'TEMP & RH': {
                      _OFFSET_RH = _FoundSensor?._OFFSET_RH ?? 0;
                      _OFFSET_TEMP = _FoundSensor?.OFFSET_Temp ?? 0;
                      _READINGTEMP = helpers.hexToSignedInt(_HEX.slice(4, 8)) / 10 + _OFFSET_TEMP;
                      _READINGRH   = helpers.hexToSignedInt(_HEX.slice(0, 4)) / 10 + _OFFSET_RH;
                      _READINGTEMP = Number(_READINGTEMP).toFixed(2);
                      _READINGRH   = Number(_READINGRH).toFixed(0);
                      _FALSESIGNAL = _READINGTEMP > Number(filterLIMITS['TEMPERATURE_MAX']) || _READINGTEMP < Number(filterLIMITS['TEMPERATURE_MIN']);
                      (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] ${'DECODEF8L10ST_APIMODE'.bgYellow} TEMP&RH ${_DTUID} TEMP=${_READINGTEMP} FALSE_SIGNAL=${String(_FALSESIGNAL).toUpperCase().bgRed}`);
                      if (_FALSESIGNAL) return;
                      break;
                    }
                    case 'DEW PT.METER': {
                      _READINGRH   = helpers.hexToSignedInt(_HEX.slice(0, 4)) / 10;
                      _READINGDEW  = helpers.hexToSignedInt(_HEX.slice(4, 8)) / 10;
                      _READINGTEMP = helpers.hexToSignedInt(_HEX.slice(8, 12)) / 10;
                      if (_READINGRH > 100 || _READINGDEW > 100) return;
                      break;
                    }
                    default:
                      break;
                  }
                  // -- WRITE TO LOGS
                  var jsonPayload = JSON.stringify(sensorObj);
                  if (payload._SENSORID >= 0) _logs.append(_RAWFile, jsonPayload, () => { });
                  // -- CHECK ALERTS (unified helper — readings already decoded above)
                  const _readings = {
                    waterLevel: _READINGWTRLVL,
                    current:    _READINGCURRENT,
                    pressure:   _READINGPRESSURE,
                    temp:       (_READINGTEMP !== undefined) ? Number(_READINGTEMP) : undefined,
                    rh:         (_READINGRH !== undefined)   ? Number(_READINGRH)   : undefined,
                    dew:        _READINGDEW,
                  };
                  const _limits = {
                    wtrMax: _WTRLVLMAX, wtrMin: _WTRLVLMIN,
                    ampMax: _AMPMAX,    ampMin: _AMPMIN,
                    pressMax: _PRESSMAX, pressMin: _PRESSMIN,
                    tempMax: _TEMPMAX,  tempMin: _TEMPMIN,
                    rhMax: _RHMAX,      rhMin: _RHMIN,
                    dewMax: _DEWMAX,    dewMin: _DEWMIN,
                  };
                  const flagged = checkSensorAlerts({
                    FileName, _PortALERTFILE, _FoundSensor, _ALERTFLAG, _ALERT,
                    _TYPE, _DTUID, _NAME, _GROUP, _UNITSYSTEM,
                    readings: _readings, limits: _limits,
                    _timestamp: helpers.GetTIMEStamp(),
                  });
                  // -------
                  (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] ${'DECODEF8L10ST_APIMODE'.bgYellow} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} <${String(_TYPE).yellow}:${_DTUID}> ${CLOG_ALERT(_ALERT)}|[FLAG=${flagged}]`);
                  (IS_SENSORREGISTERED || blnDEBUG) && !blnSKIP485SENSOR && console.log(`  >>[SERVER.JS] ${'DECODEF8L10ST_APIMODE'.bgYellow} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} ${CLOG_SOURCE(FileName)} ${CLOG_STATUSCODE(statusCode)} |${String(_MODE).red}|${String(_TYPE).blue}|${String(_DTUID).magenta}|${String(_NAME).cyan}||${_READINGCURRENT ?? '-'}A|${_READINGPRESSURE ?? '-'}Pa|${_READINGTEMP ?? '-'}C|${_READINGRH ?? '-'}%|${_READINGDEW ?? '-'}C|`);
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
    switch (FileName) {
      case 'MRE':
      case 'NIPPONGLASS_BOILER':
      case 'NIPPONGLASS':
        console.log('  >>[SERVER.JS] LINE:1004 WHATSAPPGTEWAY 30 ', FileName, _FoundSensor.ALERTGROUP, _ALERTObj.MESSAGE);
        decoders.WhatsAppGateway30(_FoundSensor.ALERTGROUP, _ALERTObj.MESSAGE);
        break;
      // decoders.TelegramGateway12(_FoundSensor.ALERTGROUP,_ALERTObj.MESSAGE);
      // break;
      case 'SNOWCITY':
      case 'IKN_OPROOM':
      case 'IKN_HOSPITAL':
      case 'INDOGUNA':
        console.log('  >>[SERVER.JS] LINE:1013 WHATSAPPGTEWAY 28 ', FileName, _FoundSensor.ALERTGROUP, _ALERTObj.MESSAGE);
        decoders.WhatsAppGateway28(_FoundSensor.ALERTGROUP, _ALERTObj.MESSAGE);
        break;
      case 'KAYAKU':
      case 'EPSON':
      case 'SHINKO':
        console.log('  >>[SERVER.JS] LINE:1013 WHATSAPPGTEWAY 30 ', FileName, _FoundSensor.ALERTGROUP, _ALERTObj.MESSAGE);
        decoders.WhatsAppGateway30(_FoundSensor.ALERTGROUP, _ALERTObj.MESSAGE);
        break;
      // break;
      default:
        console.log(` ALERT MISSING ...${FileName} ${String(_FoundSensor.ALERTGROUP).yellow}=${String(_ALERTObj.MESSAGE).red}`);
        break;
    }
  })
}
// -----------
// Init script
// -----------
server.init = function () {
  const activeServers = config.tcpServers.filter(s => s.active);
  activeServers.forEach(function (s) {
    startTCPServer(s.name, s.port, false);
  });
};

// Export the module
module.exports = server;
