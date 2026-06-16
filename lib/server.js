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
                    let _READINGCURRENT, _READINGPRESSURE, _READINGTEMP, _READINGRH, _READINGDEW;
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
                    let _MESSAGE = `${helpers.GetTIMEStamp()} [${_NAME.toUpperCase()}] `;
                    //  --------------
                    switch (_TYPE) {
                      case 'WATER LEVEL':
                      case 'AC CURRENT':
                        let _FLAGCURR = false;
                        _READINGCURRENT = Number(helpers.hexToSignedInt(_HEX) / 100);
                        _FLAG = (_AMPMAX == null) ? false : (_READINGCURRENT > _AMPMAX) ? true : false;
                        _FLAG && (_MESSAGE += ` CURRENT=${_READINGCURRENT}>${_AMPMAX}A`);
                        _FLAGCURR = _FLAGCURR || _FLAG;
                        _FLAG = (_AMPMIN == null) ? false : (_READINGCURRENT < _AMPMIN) ? true : false;
                        _FLAG && (_MESSAGE += ` CURRENT=${_READINGCURRENT}<${_AMPMIN}A`);
                        _FLAG = _FLAGCURR || _FLAG;
                        _ALERTObj['CURRENT'] = _READINGCURRENT;
                        break;
                      case 'AIR PRESSURE':
                        let _FLAGPRESS = false;
                        _READINGPRESSURE = helpers.parseFloat(`0x${_HEX.slice(4, 8)}${_HEX.slice(0, 4)}`);
                        _READINGPRESSURE = _UNITSYSTEM == 'BAR' ? _READINGPRESSURE : (_READINGPRESSURE * 1.0E-5).toFixed(2);
                        _PRESSMAX = _UNITSYSTEM == 'BAR' ? _PRESSMAX : (_PRESSMAX * 1.0E-5).toFixed(2);
                        _PRESSMIN = _UNITSYSTEM == 'BAR' ? _PRESSMIN : (_PRESSMIN * 1.0E-5).toFixed(2);
                        // ------
                        _FALSESIGNAL = _READINGPRESSURE > Number(filterLIMITS['PRESSURE_MAX']);
                        if (_FALSESIGNAL) return;
                        // ------
                        _FLAG = (_PRESSMAX == null) ? false : (_READINGPRESSURE > _PRESSMAX) ? true : false;
                        _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE}>${_PRESSMAX} ${_UNITSYSTEM}`);
                        _FLAGPRESS = _FLAGPRESS || _FLAG;
                        _FLAG = (_PRESSMIN == null) ? false : (_READINGPRESSURE < _PRESSMIN) ? true : false;
                        _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE}<${_PRESSMIN} ${_UNITSYSTEM}`);
                        _FLAG = _FLAG || _FLAGPRESS;
                        _ALERTObj['PRESSURE'] = _READINGPRESSURE;
                        break;
                      case 'WISENSOR':
                      case 'TEMP & RH':
                        let _FLAGTEMPRH = false;
                        _READINGTEMP = Number(Temperature);
                        _READINGRH = Number(Humidity);
                        _ALERTObj['TEMP'] = _READINGTEMP;
                        _ALERTObj['RH'] = _READINGRH;
                        _FALSESIGNAL = _READINGTEMP > Number(filterLIMITS['TEMPERATURE_MAX']) || _READINGTEMP < Number(filterLIMITS['TEMPERATURE_MIN']);
                        (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:421 ${'DECODEWISENSORV2'.bgCyan} ${_READINGTEMP} => ${Number(filterLIMITS['TEMPERATURE_MAX'])}/${Number(filterLIMITS['TEMPERATURE_MIN'])} [${String(_FALSESIGNAL).toUpperCase().bgRed}]`);
                        if (_FALSESIGNAL) return;
                        // ---------
                        _FLAG = (_TEMPMAX == null) ? false : (Number(_READINGTEMP) > Number(_TEMPMAX)) ? true : false;
                        _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP}>${_TEMPMAX}C`);
                        false && console.log(` TEMP=${_READINGTEMP}>${_TEMPMAX}C`, _FLAG, _FLAGTEMPRH);
                        _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                        _FLAG = (_TEMPMIN == null) ? false : (Number(_READINGTEMP) < Number(_TEMPMIN)) ? true : false;
                        _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP}<${_TEMPMIN}C`);
                        false && console.log(` TEMP=${_READINGTEMP}<${_TEMPMIN}C`, _FLAG, _FLAGTEMPRH);
                        _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                        false && console.log(_FLAGTEMPRH);
                        if (Number(_READINGRH) > 0) {
                          _FLAG = (_RHMAX == null) ? false : (Number(_READINGRH) > Number(_RHMAX)) ? true : false;
                          _FLAG && (_MESSAGE += ` RH=${_READINGRH}>${_RHMAX}%`);
                          _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                          _FLAG = (_RHMIN == null) ? false : (Number(_READINGRH) < Number(_RHMIN)) ? true : false;
                          _FLAG && (_MESSAGE += ` RH=${_READINGRH}<${_RHMIN}%`);
                        }
                        _FLAG = _FLAGTEMPRH || _FLAG;
                        break;
                      case 'DEW PT.METER':
                        let _FLAGDEW = false;
                        _READINGRH = helpers.hexToSignedInt(_HEX.slice(0, 4)) / 10;
                        _READINGDEW = helpers.hexToSignedInt(_HEX.slice(4, 8)) / 10;
                        _READINGTEMP = helpers.hexToSignedInt(_HEX.slice(8, 12)) / 10;
                        _ALERTObj['TEMP'] = _READINGTEMP;
                        _ALERTObj['RH'] = _READINGRH;
                        _ALERTObj['DEW'] = _READINGDEW;
                        _FLAG = (_TEMPMAX == null) ? false : (_READINGTEMP > _TEMPMAX) ? true : false;
                        _FLAG && (_MESSAGE += ` TEMP ${_READINGTEMP}>${_TEMPMAX}C`);
                        _FLAGDEW = _FLAG || _FLAGDEW;
                        _FLAG = (_TEMPMIN == null) ? false : (_READINGTEMP < _TEMPMIN) ? true : false;
                        _FLAG && (_MESSAGE += ` TEMP ${_READINGTEMP}<${_TEMPMIN}C`);
                        _FLAGDEW = _FLAG || _FLAGDEW;
                        _FLAG = (_RHMAX == null) ? false : (_READINGRH > _RHMAX) ? true : false;
                        _FLAG && (_MESSAGE += ` RH ${_READINGRH}>${_RHMAX}%`);
                        _FLAGDEW = _FLAG || _FLAGDEW;
                        _FLAG = (_RHMIN == null) ? false : (_READINGRH < _RHMIN) ? true : false;
                        _FLAG && (_MESSAGE += ` RH ${_READINGRH}<${_RHMIN}%`);
                        _FLAGDEW = _FLAG || _FLAGDEW;
                        _FLAG = (_DEWMAX == null) ? false : (_READINGDEW > _DEWMAX) ? true : false;
                        _FLAG && (_MESSAGE += ` DEW ${_READINGDEW}>${_DEWMAX}C`);
                        _FLAGDEW = _FLAG || _FLAGDEW;
                        _FLAG = (_DEWMIN == null) ? false : (_READINGDEW < _DEWMIN) ? true : false;
                        _FLAG && (_MESSAGE += ` DEW ${_READINGDEW}<${_DEWMIN}C`);
                        _FLAG = _FLAG || _FLAGDEW;
                        break;
                      default:
                        break;
                    }
                    //  -------------
                    (IS_SENSORREGISTERED || blnDEBUG) && !blnSKIPWISENSOR2 && console.log(`  >>[SERVER.JS] LINE:471 ${'DECODEWISENSORV2'.bgCyan} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} ${CLOG_ALERT(_ALERT)}|${CLOG_FLAG(_FLAG)}|${CLOG_MODE(_MODE)}] MESSAGE=${_MESSAGE}`);
                    if (_FLAG) {
                      _ALERTObj['MESSAGE'] = _MESSAGE;
                      // FileName,PortID
                      blnDEBUG && console.log(`${String('DECODEWISENSORV2').green} LINE:474 ${CLOG_PORTID(_PORTID)} ${CLOG_SOURCE(FileName)} ${CLOG_ALERT(_ALERT)}|${CLOG_FLAG(_FLAG)} [${_UNITSYSTEM.green}] <${_TYPE.green}> ${_MESSAGE.red} `)
                      DISPATCH_ALERT(FileName, _PortALERTFILE, _FoundSensor, _ALERTObj, _ALERTFLAG, _ALERT);
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
                  let _READINGCURRENT, _READINGPRESSURE, _READINGTEMP, _READINGRH, _READINGDEW;
                  let _ALERT = _FoundSensor.ALERT ? _FoundSensor.ALERT : false;
                  let _ALERTFLAG = _FoundSensor?.ALERTFLAG ?? 0;
                  //  --------------
                  (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:546 ${'DECODEWISENSORV1'.bgRed} ${_TYPE}`);
                  let _FLAG = false;
                  let _FALSESIGNAL = false;
                  let _ALERTObj = {};
                  _ALERTObj['TYPE'] = _TYPE;
                  _ALERTObj['DTU'] = _DTUID;
                  _ALERTObj['NAME'] = _NAME;
                  _ALERTObj['GROUP'] = _GROUP;
                  _ALERTObj['TIMESTAMP'] = new Date();
                  let _MESSAGE = `${helpers.GetTIMEStamp()} [${_NAME.toUpperCase()}] `;
                  //  --------------
                  switch (_TYPE) {
                    case 'WATER LEVEL':
                    case 'AC CURRENT':
                      let _FLAGCURR = false;
                      _READINGCURRENT = Number(helpers.hexToSignedInt(_HEX) / 100);
                      _FLAG = (_AMPMAX == null) ? false : (_READINGCURRENT > _AMPMAX) ? true : false;
                      _FLAG && (_MESSAGE += ` CURRENT=${_READINGCURRENT}>${_AMPMAX}A`);
                      _FLAGCURR = _FLAGCURR || _FLAG;
                      _FLAG = (_AMPMIN == null) ? false : (_READINGCURRENT < _AMPMIN) ? true : false;
                      _FLAG && (_MESSAGE += ` CURRENT=${_READINGCURRENT}<${_AMPMIN}A`);
                      _FLAG = _FLAGCURR || _FLAG;
                      _ALERTObj['CURRENT'] = _READINGCURRENT;
                      break;
                    case 'AIR PRESSURE':
                      let _FLAGPRESS = false;
                      _READINGPRESSURE = helpers.parseFloat(`0x${_HEX.slice(4, 8)}${_HEX.slice(0, 4)}`);
                      _READINGPRESSURE = _UNITSYSTEM == 'BAR' ? _READINGPRESSURE : (_READINGPRESSURE * 1.0E-5).toFixed(2);
                      _PRESSMAX = _UNITSYSTEM == 'BAR' ? _PRESSMAX : (_PRESSMAX * 1.0E-5).toFixed(2);
                      _PRESSMIN = _UNITSYSTEM == 'BAR' ? _PRESSMIN : (_PRESSMIN * 1.0E-5).toFixed(2);
                      // ------
                      _FLAG = (_PRESSMAX == null) ? false : (_READINGPRESSURE > _PRESSMAX) ? true : false;
                      _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE}>${_PRESSMAX} ${_UNITSYSTEM}`);
                      _FLAGPRESS = _FLAGPRESS || _FLAG;
                      _FLAG = (_PRESSMIN == null) ? false : (_READINGPRESSURE < _PRESSMIN) ? true : false;
                      _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE}<${_PRESSMIN} ${_UNITSYSTEM}`);
                      _FLAG = _FLAG || _FLAGPRESS;
                      _ALERTObj['PRESSURE'] = _READINGPRESSURE;
                      break;
                    case 'WISENSOR':
                    case 'TEMP & RH':
                      _READINGTEMP = Number(Temperature);
                      _READINGRH = Number(Humidity);
                      _ALERTObj['TEMP'] = _READINGTEMP;
                      _ALERTObj['RH'] = _READINGRH;
                      let _FLAGTEMPRH = false;
                      _FALSESIGNAL = _READINGTEMP > Number(filterLIMITS['TEMPERATURE_MAX']) || _READINGTEMP < Number(filterLIMITS['TEMPERATURE_MIN']);
                      (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:593 ${'DECODEWISENSORV1'.bgRed} ${_READINGTEMP} => ${Number(filterLIMITS['TEMPERATURE_MAX'])}/${Number(filterLIMITS['TEMPERATURE_MIN'])} [${String(_FALSESIGNAL).toUpperCase().bgRed}]`);
                      if (_FALSESIGNAL) return;
                      //  ---------------
                      _FLAG = (_TEMPMAX == null) ? false : (Number(_READINGTEMP) > Number(_TEMPMAX)) ? true : false;
                      _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP}>${_TEMPMAX}C`);
                      (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:596 TEMP=${_READINGTEMP}>${_TEMPMAX}C`, _FLAG, _FLAGTEMPRH);
                      _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                      _FLAG = (_TEMPMIN == null) ? false : (Number(_READINGTEMP) < Number(_TEMPMIN)) ? true : false;
                      _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP}<${_TEMPMIN}C`);
                      (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:600 TEMP=${_READINGTEMP}<${_TEMPMIN}C`, _FLAG, _FLAGTEMPRH);
                      _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                      if (Number(_READINGRH) > 0) {
                        _FLAG = (_RHMAX == null) ? false : (Number(_READINGRH) > Number(_RHMAX)) ? true : false;
                        _FLAG && (_MESSAGE += ` RH=${_READINGRH}>${_RHMAX}%`);
                        _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                        _FLAG = (_RHMIN == null) ? false : (Number(_READINGRH) < Number(_RHMIN)) ? true : false;
                        _FLAG && (_MESSAGE += ` RH=${_READINGRH}<${_RHMIN}%`);
                      }
                      _FLAG = _FLAGTEMPRH || _FLAG;
                      (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:610 ${_FLAG} MESSAGE=${_MESSAGE}`);
                      break;
                    case 'DEW PT.METER':
                      let _FLAGDEW = false;
                      _READINGRH = helpers.hexToSignedInt(_HEX.slice(0, 4)) / 10;
                      _READINGDEW = helpers.hexToSignedInt(_HEX.slice(4, 8)) / 10;
                      _READINGTEMP = helpers.hexToSignedInt(_HEX.slice(8, 12)) / 10;
                      _ALERTObj['TEMP'] = _READINGTEMP;
                      _ALERTObj['RH'] = _READINGRH;
                      _ALERTObj['DEW'] = _READINGDEW;
                      _FLAG = (_TEMPMAX == null) ? false : (_READINGTEMP > _TEMPMAX) ? true : false;
                      _FLAG && (_MESSAGE += ` TEMP ${_READINGTEMP}>${_TEMPMAX}C`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_TEMPMIN == null) ? false : (_READINGTEMP < _TEMPMIN) ? true : false;
                      _FLAG && (_MESSAGE += ` TEMP ${_READINGTEMP}<${_TEMPMIN}C`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_RHMAX == null) ? false : (_READINGRH > _RHMAX) ? true : false;
                      _FLAG && (_MESSAGE += ` RH ${_READINGRH}>${_RHMAX}%`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_RHMIN == null) ? false : (_READINGRH < _RHMIN) ? true : false;
                      _FLAG && (_MESSAGE += ` RH ${_READINGRH}<${_RHMIN}%`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_DEWMAX == null) ? false : (_READINGDEW > _DEWMAX) ? true : false;
                      _FLAG && (_MESSAGE += ` DEW ${_READINGDEW}>${_DEWMAX}C`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_DEWMIN == null) ? false : (_READINGDEW < _DEWMIN) ? true : false;
                      _FLAG && (_MESSAGE += ` DEW ${_READINGDEW}<${_DEWMIN}C`);
                      _FLAG = _FLAG || _FLAGDEW;
                      break;
                    default:
                      break;
                  }
                  //  -------------
                  (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:643 ${'DECODEWISENSORV1'.bgRed} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} ${CLOG_STATUSCODE(statusCode)} ${CLOG_ALERT(_ALERT)}|${CLOG_FLAG(_FLAG)} <${String(_TYPE).yellow}:${_DTUID}> ::${String(_MESSAGE).bgGreen}`);
                  if (_FLAG) {
                    _ALERTObj['MESSAGE'] = _MESSAGE;
                    (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:644 ${'DECODEWISENSORV1'.bgRed} ${CLOG_GMODE(_GMODE)} ${CLOG_ALERT(_ALERT)}|${CLOG_FLAG(_FLAG)}|${CLOG_MODE(_MODE)}> [${_UNITSYSTEM.green}] <${_TYPE.green}> ${_MESSAGE.red} `)
                    DISPATCH_ALERT(FileName, _PortALERTFILE, _FoundSensor, _ALERTObj, _ALERTFLAG, _ALERT, _ALERT);
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
                  let _ALERTObj = {};
                  let HEX1, HEX2, newHEX;
                  let _OFFSET_RH, _OFFSET_TEMP, _FLAGTEMPRH;
                  _ALERTObj['TYPE'] = _TYPE;
                  _ALERTObj['DTU'] = _DTUID;
                  _ALERTObj['NAME'] = _NAME;
                  _ALERTObj['GROUP'] = _GROUP;
                  _ALERTObj['TIMESTAMP'] = new Date();
                  let _MESSAGE = `${helpers.GetTIMEStamp()} [${_NAME.toUpperCase()}] `;
                  (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:729 ${'DECODEF8L10ST_APIMODE'.bgYellow} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} ${CLOG_SOURCE(FileName)} ID=[${String(_DTUID).cyan}] TYPE=${String(_TYPE).magenta} UNIT=<${_UNITSYSTEM}> ALERTFLAG=[${String(_ALERTFLAG).yellow}]`);
                  //  --------------
                  switch (_TYPE) {
                    case 'WATER LEVEL':
                      let _FLAGWTRLVL = false;
                      _READINGWTRLVL = parseInt(_HEX, 16);
                      // ----
                      _FLAG = (_WTRLVLMAX == null) ? false : (_READINGWTRLVL > _WTRLVLMAX) ? true : false;
                      _FLAG && (_MESSAGE += ` WATER LEVEL=${_READINGWTRLVL} > ${_WTRLVLMAX}MM`);
                      _FLAGWTRLVL = _FLAGWTRLVL || _FLAG;
                      _FLAG = (_WTRLVLMIN == null) ? false : (_READINGWTRLVL < _WTRLVLMIN) ? true : false;
                      _FLAG && (_MESSAGE += ` WATER LEVEL=${_READINGWTRLVL} < ${_WTRLVLMIN}MM`);
                      _FLAG = _FLAGWTRLVL || _FLAG;
                      _ALERTObj['WATERLEVEL'] = _READINGWTRLVL;
                      break;
                    case 'AC CURRENT':
                      let _FLAGCURR = false;
                      _READINGCURRENT = _CTRATIO != 1 ? Math.abs(helpers.hexToDecimal(_HEX)) * _CTRATIO / 5.0 : Math.abs(helpers.HEXTOINT(_HEX) / 100.0);
                      // console.log('LINE:826 HEX',_TYPE,_HEX,_CTRATIO,_READINGCURRENT);
                      _READINGCURRENT = Number(_READINGCURRENT).toFixed(0);
                      if (_READINGCURRENT > 1000) {
                        false && console.log(`>>[SERVER.JS] LINE:819 PORT ID=[${_PORTID}] [${_GROUP}][${_NAME}][${_TYPE}] <${_HEX}> [${_CTRATIO}] ..${_READINGCURRENT}=${_AMPMAX}|${_AMPMIN}`);
                        return;
                      }
                      // ----
                      _FLAG = (_AMPMAX == null) ? false : (_READINGCURRENT > _AMPMAX) ? true : false;
                      _FLAG && (_MESSAGE += ` CURRENT=${_READINGCURRENT} > ${_AMPMAX}A`);
                      _FLAGCURR = _FLAGCURR || _FLAG;
                      _FLAG = (_AMPMIN == null) ? false : (_READINGCURRENT < _AMPMIN) ? true : false;
                      _FLAG && (_MESSAGE += ` CURRENT=${_READINGCURRENT} < ${_AMPMIN}A`);
                      _FLAG = _FLAGCURR || _FLAG;
                      _ALERTObj['CURRENT'] = _READINGCURRENT;
                      blnDEBUG && console.log(`  >>[SERVER.JS] LINE:763 ${'DECODEF8L10ST_APIMODE'.bgYellow} PORT ID=[${_PORTID}] [${_GROUP}][${_NAME}][${_TYPE}] <${_HEX}> [${_CTRATIO}] ..${_READINGCURRENT}=${_AMPMAX}|${_AMPMIN}`);
                      break;
                    case 'DIFF PRESS':
                      // _READINGPRESSURE = parseInt(_HEX,16)/10.0 + _OFFSET_PRESS;
                      let value = parseInt(_HEX, 16);
                      if (value > 0x7FFF) {
                        value -= 0x10000;
                        value = value * 10.0;
                      }
                      _READINGPRESSURE = value / 10.0 + _OFFSET_PRESS;
                      _READINGPRESSURE = (_UNITSYSTEM == 'BAR') ? (_READINGPRESSURE * 1.0E-5).toFixed(2) : _READINGPRESSURE;
                      _PRESSMAX = _UNITSYSTEM == 'BAR' ? (_PRESSMAX * 1.0E-5).toFixed(2) : _PRESSMAX;
                      _PRESSMIN = _UNITSYSTEM == 'BAR' ? (_PRESSMIN * 1.0E-5).toFixed(2) : _PRESSMIN;
                      // ----
                      _FALSESIGNAL = _READINGPRESSURE > Number(filterLIMITS['DIFF_PRESSURE_MAX']);
                      _FALSESIGNAL && console.log('LINE782 DECODEF8L10ST -MIN,MAX,LIMITS', _PRESSMIN, _PRESSMAX, filterLIMITS['PRESSURE_MAX'], 'FALSE_SIGNAL', String(_FALSESIGNAL).toUpperCase(0), _READINGPRESSURE);
                      if (_FALSESIGNAL) return;
                      // ---------
                      _FLAG = (_PRESSMAX == null) ? false : (_READINGPRESSURE > _PRESSMAX) ? true : false;
                      _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE} > ${_PRESSMAX} ${_UNITSYSTEM}`);
                      _FLAGPRESS = _FLAGPRESS || _FLAG;
                      _FLAG = (_PRESSMIN == null) ? false : (_READINGPRESSURE < _PRESSMIN) ? true : false;
                      _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE} < ${_PRESSMIN} ${_UNITSYSTEM}`);
                      _FLAG = _FLAG || _FLAGPRESS;
                      _ALERTObj['PRESSURE'] = _READINGPRESSURE;
                      break;
                    case 'AIR PRESSURE':
                      _FLAGPRESS = false;
                      HEX1 = _HEX.slice(0, 4);
                      HEX2 = _HEX.slice(4, 8);
                      newHEX = HEX2 + HEX1;
                      if (_HEX.length == 8) { _READINGPRESSURE = helpers.parseFloat(`0x${newHEX}`) }
                      else { _READINGPRESSURE = parseInt(_HEX, 16) * 1000; }
                      _READINGPRESSURE += Number(_OFFSET_PRESS);
                      _READINGPRESSURE = (_UNITSYSTEM == 'BAR') ? (_READINGPRESSURE * 1.0E-5).toFixed(2) : _READINGPRESSURE;
                      _PRESSMAX = _UNITSYSTEM == 'BAR' ? _PRESSMAX : (_PRESSMAX * 1.0E-5).toFixed(2);
                      _PRESSMIN = _UNITSYSTEM == 'BAR' ? _PRESSMIN : (_PRESSMIN * 1.0E-5).toFixed(2);
                      // -----
                      _FALSESIGNAL = _READINGPRESSURE > Number(filterLIMITS['PRESSURE_MAX']);
                      false && console.log('LINE806 DECODEF8L10ST', _READINGPRESSURE, _PRESSMIN, _PRESSMAX, filterLIMITS['PRESSURE_MAX'], 'FALSE_SIGNAL', _FALSESIGNAL);
                      if (_FALSESIGNAL) return;
                      // ----
                      _FLAG = (_PRESSMAX == null) ? false : (_READINGPRESSURE > _PRESSMAX) ? true : false;
                      _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE} > ${_PRESSMAX} ${_UNITSYSTEM}`);
                      _FLAGPRESS = _FLAGPRESS || _FLAG;
                      _FLAG = (_PRESSMIN == null) ? false : (_READINGPRESSURE < _PRESSMIN) ? true : false;
                      _FLAG && (_MESSAGE += ` PRESS=${_READINGPRESSURE} < ${_PRESSMIN} ${_UNITSYSTEM}`);
                      _FLAG = _FLAG || _FLAGPRESS;
                      (false && (PortID == '101')) && console.log(`${CLOG_SOURCE(FileName)} --${_ALERT}|${_FLAG}-- [${_GROUP}/${String(_NAME).toUpperCase()}|${_TYPE}] <${_HEX}> [${_UNITSYSTEM}] ..${_READINGPRESSURE}=${_PRESSMIN}|${_PRESSMAX}`);
                      _ALERTObj['PRESSURE'] = _READINGPRESSURE;
                      break;
                    case 'WISENSOR':
                      const { modelID, modelType, Temperature, Humidity, BATT, INTERVAL } = payload || {};
                      _READINGTEMP = Temperature ?? 0;
                      _READINGRH = Humidity ?? 0;
                      _OFFSET_RH = _FoundSensor?._OFFSET_RH ? _FoundSensor._OFFSET_RH : 0;
                      _OFFSET_TEMP = _FoundSensor?.OFFSET_Temp ? _FoundSensor.OFFSET_Temp : 0;
                      _READINGTEMP += _OFFSET_TEMP;
                      _READINGRH += _OFFSET_RH;
                      _READINGRH = _READINGRH / 10.0;
                      _ALERTObj['TEMP'] = Number(_READINGTEMP).toFixed(2);
                      _ALERTObj['RH'] = Number(_READINGRH).toFixed(0);
                      _FLAGTEMPRH = false;
                      _FLAG = (_TEMPMAX == null) ? false : (_READINGTEMP > _TEMPMAX) ? true : false;
                      _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP} > ${_TEMPMAX}C`);
                      _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                      _FLAG = (_TEMPMIN == null) ? false : (_READINGTEMP < _TEMPMIN) ? true : false;
                      _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP} < ${_TEMPMIN}C`);
                      _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                      _FLAG = (_RHMAX == null) ? false : (_READINGRH > _RHMAX) ? true : false;
                      _FLAG && (_MESSAGE += ` RH=${_READINGRH}% > ${_RHMAX}%`);
                      _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                      _FLAG = (_RHMIN == null) ? false : (_READINGRH < _RHMIN) ? true : false;
                      _FLAG && (_MESSAGE += ` RH=${_READINGRH}% < ${_RHMIN}%`);
                      _FLAG = _FLAGTEMPRH || _FLAG;
                      (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:836 ${'DECODEF8L10ST_APIMODE'.bgYellow} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} ${CLOG_FLAG(_FLAG)} MESSAGE=${String(_MESSAGE).green}`)
                      break;
                    case 'TEMP & RH':
                      _READINGTEMP = helpers.hexToSignedInt(_HEX.slice(4, 8)) / 10;
                      _READINGRH = helpers.hexToSignedInt(_HEX.slice(0, 4)) / 10;
                      _OFFSET_RH = _FoundSensor?._OFFSET_RH ? _FoundSensor._OFFSET_RH : 0;
                      _OFFSET_TEMP = _FoundSensor?.OFFSET_Temp ? _FoundSensor.OFFSET_Temp : 0;
                      _READINGTEMP += _OFFSET_TEMP;
                      _READINGTEMP = Number(_READINGTEMP).toFixed(2);
                      _READINGRH += _OFFSET_RH;
                      _READINGRH = Number(_READINGRH).toFixed(0);
                      _ALERTObj['TEMP'] = Number(_READINGTEMP).toFixed(2);
                      _ALERTObj['RH'] = Number(_READINGRH).toFixed(0);
                      _FLAGTEMPRH = false;
                      _FALSESIGNAL = _READINGTEMP > Number(filterLIMITS['TEMPERATURE_MAX']) || _READINGTEMP < Number(filterLIMITS['TEMPERATURE_MIN']);
                      (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:857 ${'DECODEF8L10ST_APIMODE'.bgYellow} ${_READINGTEMP} => ${Number(filterLIMITS['TEMPERATURE_MAX'])}/${Number(filterLIMITS['TEMPERATURE_MIN'])} [${String(_FALSESIGNAL).toUpperCase().bgRed}]`);
                      if (_FALSESIGNAL) return;
                      //  ---------------
                      _FLAG = (_TEMPMAX == null) ? false : (_READINGTEMP > _TEMPMAX) ? true : false;
                      _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP} > ${_TEMPMAX}C`);
                      _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                      _FLAG = (_TEMPMIN == null) ? false : (_READINGTEMP < _TEMPMIN) ? true : false;
                      _FLAG && (_MESSAGE += ` TEMP=${_READINGTEMP} < ${_TEMPMIN}C`);
                      _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                      _FLAG = (_RHMAX == null) ? false : (_READINGRH > _RHMAX) ? true : false;
                      _FLAG && (_MESSAGE += ` RH=${_READINGRH} > ${_RHMAX}%`);
                      _FLAGTEMPRH = _FLAGTEMPRH || _FLAG;
                      _FLAG = (_RHMIN == null) ? false : (_READINGRH < _RHMIN) ? true : false;
                      _FLAG && (_MESSAGE += ` RH=${_READINGRH} < ${_RHMIN}%`);
                      _FLAG = _FLAGTEMPRH || _FLAG;
                      break;
                    case 'DEW PT.METER':
                      let _FLAGDEW = false;
                      _READINGRH = helpers.hexToSignedInt(_HEX.slice(0, 4)) / 10;
                      _READINGDEW = helpers.hexToSignedInt(_HEX.slice(4, 8)) / 10;
                      _READINGTEMP = helpers.hexToSignedInt(_HEX.slice(8, 12)) / 10;
                      if (_READINGRH > 100 || _READINGDEW > 100) return;
                      _ALERTObj['TEMP'] = _READINGTEMP;
                      _ALERTObj['RH'] = _READINGRH;
                      _ALERTObj['DEW'] = _READINGDEW;
                      _FLAG = (_TEMPMAX == null) ? false : (_READINGTEMP > _TEMPMAX) ? true : false;
                      _FLAG && (_MESSAGE += ` TEMP ${_READINGTEMP} > ${_TEMPMAX}C`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_TEMPMIN == null) ? false : (_READINGTEMP < _TEMPMIN) ? true : false;
                      _FLAG && (_MESSAGE += ` TEMP ${_READINGTEMP} < ${_TEMPMIN}C`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_RHMAX == null) ? false : (_READINGRH > _RHMAX) ? true : false;
                      _FLAG && (_MESSAGE += ` RH ${_READINGRH} > ${_RHMAX}%`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_RHMIN == null) ? false : (_READINGRH < _RHMIN) ? true : false;
                      _FLAG && (_MESSAGE += ` RH ${_READINGRH} < ${_RHMIN}%`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_DEWMAX == null) ? false : (_READINGDEW > _DEWMAX) ? true : false;
                      _FLAG && (_MESSAGE += ` DEW ${_READINGDEW} > ${_DEWMAX}C`);
                      _FLAGDEW = _FLAG || _FLAGDEW;
                      _FLAG = (_DEWMIN == null) ? false : (_READINGDEW < _DEWMIN) ? true : false;
                      _FLAG && (_MESSAGE += ` DEW ${_READINGDEW} < ${_DEWMIN}C`);
                      _FLAG = _FLAG || _FLAGDEW;
                      (false && PortID == '1011') && console.log(`${CLOG_SOURCE(FileName)} --${_FLAG}-- [${_GROUP}/${_NAME}/${_TYPE}] <${_HEX}> ..${_READINGTEMP}=${_TEMPMIN}|${_TEMPMAX} ..${_READINGRH}=${_RHMIN}|${_RHMAX} ..${_READINGDEW}=${_DEWMIN}|${_DEWMAX}`);
                      break;
                    default:
                      break;
                  }
                  (IS_SENSORREGISTERED || blnDEBUG) && console.log(`  >>[SERVER.JS] LINE:898 ${'DECODEF8L10ST_APIMODE'.bgYellow} ${CLOG_GMODE(_GMODE)} ${CLOG_PORTID(_PORTID)} <${String(_TYPE).yellow}:${_DTUID}> ${CLOG_ALERT(_ALERT)}|${CLOG_FLAG(_FLAG)} MESSAGE=${String(_MESSAGE).bgGreen}`);
                  // -- WRITE TO LOGS
                  var jsonPayload = JSON.stringify(sensorObj);
                  if (payload._SENSORID >= 0) _logs.append(_RAWFile, jsonPayload, () => { });
                  // -- CHECK ALERTS
                  if (_FLAG) {
                    _ALERTObj['MESSAGE'] = _MESSAGE;
                    false && console.log(`${String('DECODEF8L10ST').green} LINE:916 ${CLOG_PORTID(_PORTID)} ${CLOG_SOURCE(FileName)} ${CLOG_ALERT(_ALERT)}|${CLOG_FLAG(_FLAG)} [${_UNITSYSTEM.green}] <${_TYPE.green}> ${_MESSAGE.red} `)
                    DISPATCH_ALERT(FileName, _PortALERTFILE, _FoundSensor, _ALERTObj, _ALERTFLAG, _ALERT)
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
