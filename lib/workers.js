/*
 * Worker-related tasks
 */
 // Dependencies
 var fs = require('fs');
 var _data = require('./data');
 var path = require('path');
 var https = require('https');
 var http = require('http');
 var helpers = require('./helpers');
 var url = require('url');
 var _logs = require('./logs');
 var util = require('util');
 var _server = require('./server');
 var debug = util.debuglog('workers');
 var crc16 = require('node-crc16');
 // --------------------------------
 const decoder = require('./decoders')
 const Sensor = require('../models/Sensor');
 const SensorStats = require('../models/SensorStats');
 const { worker } = require('cluster');
 // ----------------------------------------
 const nTIMER1 = 1;         //  TIMERLOOP1
 const flagTIMER1 = false;  //  TIMERLOOP1
 const nTIMER2 = 5;         //  TDKSENSORSGROUP
 const flagTIMER2 = true;   //  TDKSENSORSGROUP
 const flagPRINTERRORLOG = true;
 const flagPRINTCONSOLE = true;

 const nTIMER3 = 3;  //  STATSANALYSIS
 
 // Instantiate the worker module object
 var workers = {};
 
 // Utility Functions
 
 // Lookup all checks, get their data, send to validator
 workers.gatherAllChecks = function(){
   // ------------------
   // Get all the checks
   // ------------------
   _data.list('checks',function(err,checks){
     if(!err && checks && checks.length > 0){
       checks.forEach(function(check){
         // Read in the check data
         _data.read('checks',check,function(err,originalCheckData){
           if(!err && originalCheckData){
             // Pass it to the check validator, and let that function continue the function or log the error(s) as needed
             workers.validateCheckData(originalCheckData);
           } else {
             debug("Error reading one of the check's data: ",err);
           }
         });
       });
     } else {
       debug('Error: Could not find any checks to process');
     }
   });
 };
 
 // Sanity-check the check-data,
 workers.validateCheckData = function(originalCheckData){
   originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : {};
   originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
   originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length > 9 ? originalCheckData.userPhone.trim() : false;
   originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http','https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
   originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
   originalCheckData.method = typeof(originalCheckData.method) == 'string' &&  ['post','get','put','delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false;
   originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
   originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;
   // Set the keys that may not be set (if the workers have never seen this check before)
   originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up','down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
   originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;
 
   // If all checks pass, pass the data along to the next step in the process
   if(originalCheckData.id &&
   originalCheckData.userPhone &&
   originalCheckData.protocol &&
   originalCheckData.url &&
   originalCheckData.method &&
   originalCheckData.successCodes &&
   originalCheckData.timeoutSeconds){
     workers.performCheck(originalCheckData);
   } else {
     // If checks fail, log the error and fail silently
     debug("Error: one of the checks is not properly formatted. Skipping.");
   }
 };
 
 // Perform the check, send the originalCheck data and the outcome of the check process to the next step in the process
 workers.performCheck = function(originalCheckData){
 
   // Prepare the intial check outcome
   var checkOutcome = {
     'error' : false,
     'responseCode' : false
   };
 
   // Mark that the outcome has not been sent yet
   var outcomeSent = false;
 
   // Parse the hostname and path out of the originalCheckData
   var parsedUrl = url.parse(originalCheckData.protocol+'://'+originalCheckData.url, true);
   var hostName = parsedUrl.hostname;
   var path = parsedUrl.path; // Using path not pathname because we want the query string
 
   // Construct the request
   var requestDetails = {
     'protocol' : originalCheckData.protocol+':',
     'hostname' : hostName,
     'method' : originalCheckData.method.toUpperCase(),
     'path' : path,
     'timeout' : originalCheckData.timeoutSeconds * 1000
   };
 
   // Instantiate the request object (using either the http or https module)
   var _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
   var req = _moduleToUse.request(requestDetails,function(res){
       // Grab the status of the sent request
       var status =  res.statusCode;
 
       // Update the checkOutcome and pass the data along
       checkOutcome.responseCode = status;
       if(!outcomeSent){
         workers.processCheckOutcome(originalCheckData,checkOutcome);
         outcomeSent = true;
       }
   });
 
   // Bind to the error event so it doesn't get thrown
   req.on('error',function(e){
     // Update the checkOutcome and pass the data along
     checkOutcome.error = {'error' : true, 'value' : e};
     if(!outcomeSent){
       workers.processCheckOutcome(originalCheckData,checkOutcome);
       outcomeSent = true;
     }
   });
 
   // Bind to the timeout event
   req.on('timeout',function(){
     // Update the checkOutcome and pass the data along
     checkOutcome.error = {'error' : true, 'value' : 'timeout'};
     if(!outcomeSent){
       workers.processCheckOutcome(originalCheckData,checkOutcome);
       outcomeSent = true;
     }
   });
 
   // End the request
   req.end();
 };
 
 // Process the check outcome, update the check data as needed, trigger an alert if needed
 // Special logic for accomodating a check that has never been tested before (don't alert on that one)
 workers.processCheckOutcome = function(originalCheckData,checkOutcome){
 
   // Decide if the check is considered up or down
   var state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';
 
   // Decide if an alert is warranted
   var alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;
 
   // Log the outcome
   var timeOfCheck = Date.now();
   workers.log(originalCheckData,checkOutcome,state,alertWarranted,timeOfCheck);
 
   // Update the check data
   var newCheckData = originalCheckData;
   newCheckData.state = state;
   newCheckData.lastChecked = timeOfCheck;
 
   // Save the updates
   _data.update('checks',newCheckData.id,newCheckData,function(err){
     //  ----------------------
     if(!err){
       // Send the new check data to the next phase in the process if needed
       if(alertWarranted){
         workers.alertUserToStatusChange(newCheckData);
       } else {
         debug("Check outcome has not changed, no alert needed");
       }
     } else {
       debug("Error trying to save updates to one of the checks");
     }
   });
 };
 
 // Alert the user as to a change in their check status
 workers.alertUserToStatusChange = function(newCheckData){
   var msg = 'Alert: Your check for '+newCheckData.method.toUpperCase()+' '+newCheckData.protocol+'://'+newCheckData.url+' is currently '+newCheckData.state;
   helpers.sendTwilioSms(newCheckData.userPhone,msg,function(err){
     if(!err){
       debug("Success: User was alerted to a status change in their check, via sms: ",msg);
     } else {
       debug("Error: Could not send sms alert to user who had a state change in their check",err);
     }
   });
 };
 
 // Send check data to a log file
 workers.log = function(originalCheckData,checkOutcome,state,alertWarranted,timeOfCheck){
   // Form the log data
   var logData = {
     'check' : originalCheckData,
     'outcome' : checkOutcome,
     'state' : state,
     'alert' : alertWarranted,
     'time' : timeOfCheck
   };
   // Convert the data to a string
   var logString = JSON.stringify(logData);
   // Determine the name of the log file
   var logFileName = originalCheckData.id;
   // Append the log string to the file
   _logs.append(logFileName,logString,function(err){
     if(!err){
       debug("Logging to file succeeded");
     } else {
       debug("Logging to file failed");
     }
   });
 };
 
 // --------------------------------------------------
 // TIMER TO EXECUTE THE WORKER-PROCESS ONCE PER N MIN
 //  2 TIMERS (LOOPS) AT DIFFERENT INTERVAL
 //  --------------------------------------
 workers.TIMERLOOP1 = function(nInterval){
  // --------------
  var LoopInterval;
  // --------------
  LoopInterval = setInterval(function() {
    // ---------------------------------
    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    let time = String(today.getHours()).padStart(2,"0") + ":" + String(today.getMinutes()).padStart(2,"0") + ":" + String(today.getSeconds()).padStart(2,"0");
    // -------------------
    // SEND MODBUS CALLING COMMAND TO EACH ACTIVE SOCKETS IN SERVER
    // -------------------
    flagPRINTCONSOLE && console.log(`[${'WORKERS.JS'.green}]  .. ..`);
    flagPRINTCONSOLE && console.log(`[${'WORKERS.JS'.green}] ${date} ${time.yellow} <${'TIMERLOOP1'.red}> ... SOCKET CONNECTED <${_server.socketArr.length}> ...TIMER <${nInterval}>`);
    // ---------------------------------------
    // TO RESET THE JSON OBJECT
    // decoder.RESET_ATCMND();    
    // -----------------------
    if (_server.socketArr){
      // --------------------------------
      let GATEWAYArr = [];
      let _GATEWAYTEXT; 
      _server.socketArr.forEach((socket) => {
        // --------
        if ( socket.GATEWAYID && socket.ADDRESS) {
          let line = '[' + 'WORKERS.JS'.green + '] \x1b[33m GATEWAYID=<' + socket.GATEWAYID.green +'>   SOCKETS \x1b[0m' + socket.ADDRESS; 
          GATEWAYArr.push(socket.GATEWAYID);
          // console.log(line);
          _GATEWAYTEXT = ` <${socket.GATEWAYID}>:${socket.ADDRESS} |`
        }
      });
      // -------------------
      // AT COMMANDS TIMER2
      // -------------------
      _data.read("ATCOMMANDS",'_ATCOMMANDS_TIMER1',function(err,ATCMNDSObj) {
        // --------------
        if(err) {
          console.log('..._ATCOMMANDS_TIMER1 FILE MISSING...');
          return;
        }
        // -----------------------
         // ABSTRACT ACIVE COMMANDS
         // -----------------------
        let ACTIVE_CMND = ATCMNDSObj.filter( _CMD =>{ return _CMD.FLAG });
        // -----------
        flagPRINTCONSOLE && console.log(`[${'WORKERS.JS'.green}]  .. ..`);
        flagPRINTCONSOLE && console.log(`[${'WORKERS.JS'.green}]  .. AT COMMANDS READ FROM <${'_ATCOMMANDS_TIMER1'.yellow}> .. ACTIVE AT-COMMAND <${ACTIVE_CMND.length}/${ATCMNDSObj.length}>..`);
        // --------------
        let TIMERLOOP1_COUNTER = 0;
        // ---------------
        // DELETE FILE ATCMND_SENT1 IF EXIST
        // BEFORE START THE LOOP
        // ---------------
        _data.read("rawData","_485SENSORS",function(err,CMD_485RCV) {
          // ------------------------------------------------------------------
          // 1. CHECK ON NUMBER OF RETURN 485 SENSORS RESPONSE IN LAST REQUESTS
          // ------------------------------------------------------------------ 
          _logs.append('_ERROR',`[WORKERS.JS] ${time} .. <TIMERLOOP1::ATCMND_SENT1> ..  <${_GATEWAYTEXT}>`,()=>{});
          // --------------
          _data.read("rawData",'ATCMND_SENT1',function(err,CMD_SENT) {
            // --------
            if (!err) {
              _data.delete("rawData",'ATCMND_SENT1',function() {})
            }
            // ---------
            _data.create("rawData", 'ATCMND_SENT1', ACTIVE_CMND, function (err) {
              // ---------
              console.log(`[${'WORKERS.JS'.red}]  .. FILE <${'ATCMND_SENT1'.green}> DELETED & RE-CREATED...`)
              // --------
              if (!err) {
                console.log(`[${'WORKERS.JS'.red}]  .. ATCMND_SENT1 CREATED..`);
              } else {
                console.log(`[WORKERS.JS] .. COULD NOT CREATE FILE .. <ATCMND_SENT1> ..`);
                flagPRINTERRORLOG && _logs.append('_ERROR',`[WORKERS.JS] <TIMERLOOP1> COULD NOT CREATE FILE .. <ATCMND_SENT1> ..`,()=>{});
              }
              // -----------
              let nSTEP = 10;
              if (ACTIVE_CMND.length == 0) return;
              // ------------------
              ATMCMNDLoopInterval = setInterval(function() {
                // ---------------------------------
                let BYTES = "";
                let StrATCMND = "";
                let item = ACTIVE_CMND[TIMERLOOP1_COUNTER];
                // ---------------------
                if (item.FLAG) {
                  // -----------
                  let CRC1;
                  let HEXID = (item.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase();
                  // ----
                  switch (item.TYPE.toUpperCase()) {
                    case "DIRECT":
                      BYTES = `AT+TXH=${item.DTUID},${item.PREMODBUS}\r\n`;
                      StrATCMND = `AT+TXH=${item.DTUID},${item.PREMODBUS}`;
                      break;
                    case "485":
                      let GATEWAYID = item.GATEWAYID;
                      let CRC  = crc16.checkSum( HEXID + item.MODBUS).toUpperCase();
                      let CHECKCMND = `${item.PREMODBUS ? item.PREMODBUS : '' }${HEXID}${item.MODBUS}`;
                       CRC1 = crc16.checkSum( `${item.PREMODBUS ? item.PREMODBUS : '' }${HEXID}${item.MODBUS}`).toUpperCase();
                      // BYTES = `AT+TXH=${item.DTUID},${HEXID + item.MODBUS + CRC}\r\n`;
                      BYTES = `AT+TXH=${item.DTUID},${item.PREMODBUS ? item.PREMODBUS : '' }${HEXID}${item.MODBUS}${CRC1}\r\n`;
                      StrATCMND = `AT+TXH=${item.DTUID},${item.PREMODBUS ? item.PREMODBUS : '' }${HEXID}${item.MODBUS}${CRC1}`;
                      break;
                    case "DTU-STATE":
                      BYTES = `AT+TST=${item.DTUID},SYSTEM CHECK DTU=${item.DTUID}\r\n`;
                      StrATCMND = `AT+TST=${item.DTUID},SYSTEM CHECK DTU=${item.DTUID}`;
                      break;
                    case "SYSTEM":
                        // BYTES = `AT+TST=${item.DTUID},SYSTEM CHECK DTU=${item.DTUID}\r\n`
                      BYTES = `AT+IPR=${item.DTUID},SYSTEM CHECK DTU=${item.DTUID}\r\n`;
                      StrATCMND = `AT+IPR=${item.DTUID},SYSTEM CHECK DTU=${item.DTUID}`;
                      break;
                    default :
                      break;
                  }
                  // ------------------------------------------
                  console.log(`[${'WORKERS.JS'.red}] ..${StrATCMND}..`)
                  flagPRINTERRORLOG && _logs.append('_ERROR',`[WORKERS.JS] <TIMERLOOP1> ${StrATCMND} `,()=>{});
                  // --------------------------------
                  _server.socketArr.forEach((socket,index) => {
                    // ------------------------
                    // FILTER THE GATEWAY WHERE AT-COMMAND IS TO BE SENT
                    // ------------------------
                    if (socket.GATEWAYID == item.GATEWAYID && socket.SOCKET){
                      today = new Date();
                      time = String(today.getHours()).padStart(2,"0") + ":" + String(today.getMinutes()).padStart(2,"0") + ":" + String(today.getSeconds()).padStart(2,"0");;
                      socket.SOCKET.write(BYTES);
                      let _SOCKETCOUNT = _server.socketArr.length;
                      // ---------------------------------
                      // WRITE AT-COMMAND SENT TO LOG FILE
                      // ---------------------------------
                    }
                  })
                  // ---------- 
                  decoder.ADD_ATCMND(item)
                  // ----------
                }
                // ---------
                TIMERLOOP1_COUNTER ++;
                  // ---------------------------------
                if (TIMERLOOP1_COUNTER > ACTIVE_CMND.length -1) {
                  // --------------------------------
                  clearInterval(ATMCMNDLoopInterval);
                  // --------------------------------
                }
                // --------------
              },1000 * nSTEP );
              // -----------
              flagPRINTCONSOLE && console.log(`[${'WORKERS.JS'.green}]  .. ATCMND_SENT1 COMPLETE..`);
              flagPRINTCONSOLE && console.log(`[${'WORKERS.JS'.green}]  .. ..`);
              // -----------
            });
          });
        })
      });
    }
    // -----------------------
    workers.gatherAllChecks();
    // -----------------------
  },1000 * 60 * nInterval);
};
 // --------------------
 // TDK SENSORS SCANNING
 // ---------------------
 workers.TDKSENSORSGROUP = function(nInterval){
   // --------------
   var LoopInterval;
   // --------------
   LoopInterval = setInterval(function() {
     // ---------------------------------
     let today = new Date();
     let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
     let time = String(today.getHours()).padStart(2,"0") + ":" + String(today.getMinutes()).padStart(2,"0") + ":" + String(today.getSeconds()).padStart(2,"0");
     // -------------------
     // SEND MODBUS CALLING COMMAND TO EACH ACTIVE SOCKETS IN SERVER
     // -------------------
     flagPRINTCONSOLE && console.log(`[${'WORKERS.JS'.red}]  .. ..`);
     flagPRINTCONSOLE && console.log(`[${'WORKERS.JS'.red}] ${time.red} <${'TDKSENSORSGROUP'.green}> AT COMMAND LOOPING SOCKET CONNECTED <${_server.socketArr.length}> TIMER <${nInterval}>`);
     // ---------
     // TO RESET THE JSON OBJECT
     // decoder.RESET_ATCMND();
     // --------------------
     if (_server.socketArr){
       // --------------------------------
       let GATEWAYArr = [];
       let _GATEWAYTEXT = '|';
       // ------------------------------------
       _server.socketArr.forEach((socket) => {
				 // --------
				 if ( socket.GATEWAYID && socket.ADDRESS) {
           // ---------------
					 let line = '[' + 'WORKERS.JS'.red + '] \x1b[33m GATEWAYID=<' + socket.GATEWAYID.green +'>   SOCKETS \x1b[0m' + socket.ADDRESS; 
					 console.log(line);
           // ---------------
					 GATEWAYArr.push(socket.GATEWAYID);
           _GATEWAYTEXT += `${socket.GATEWAYID}|`;
          }
        });
       // -------------------
       // AT COMMANDS TIMER2
       // -------------------
       _data.read("ATCOMMANDS",'_ATCOMMANDS_TIMER2',function(err,ATCMNDSObj) {
          // --------------
          if(err) {
					 console.log('..._ATCOMMANDS_TIMER2 FILE MISSING...');
           return;
					}
					// -----------------------
					// ABSTRACT ACIVE COMMANDS
					// -----------------------
					let ACTIVE_CMND = ATCMNDSObj.filter( _CMD =>{ return _CMD.FLAG });
          // -----------
					console.log(`[${'WORKERS.JS'.red}]  .. ..`);
					console.log(`[${'WORKERS.JS'.red}]  .. AT COMMANDS READ FROM <${'_ATCOMMANDS_TIMER2'.yellow}> .. ACTIVE AT-COMMAND <${ACTIVE_CMND.length}/${ATCMNDSObj.length}>..`);
         // --------------
         let TDKSENSORSGROUP_COUNTER = 0;
         // ---------------
         // DELETE FILE ATCMND_SENT2 IF EXIST
         // BEFORE START THE LOOP
         // ---------------
         _data.read("rawData","_485SENSORS",function(err,CMD_485RCV) {
           // ------------------------------------------------------------------
           // 1. CHECK ON NUMBER OF RETURN 485 SENSORS RESPONSE IN LAST REQUESTS
           // ------------------------------------------------------------------
           console.log(`[${'WORKERS.JS'.red}]  .. [1] DATA READ _485SENSORS.JSON <${String(err).toUpperCase().yellow}>`);
           _logs.append('_ERROR',`[WORKERS.JS] ${time} .. <TDKSENSORSGROUP::ATCMND_SENT2> ..  DATA READ _485SENSORS.JSON ..`,()=>{});
           _logs.append('_ERROR',`[WORKERS.JS] ${time} .. <TDKSENSORSGROUP::ATCMND_SENT2> ..  GATEWAY=<${_GATEWAYTEXT}> ..`,()=>{});
           // ------------------
           _data.read("rawData",'ATCMND_SENT2',function(err,CMD_SENT) {
             // ---------
             console.log(`[${'WORKERS.JS'.red}]  .. [2] DATA READ RAWDATA\ATCMND_SENT2.JSON <${String(err).toUpperCase().yellow}>`);
             _logs.append('_ERROR',`[WORKERS.JS] ${time} .. <TDKSENSORSGROUP::ATCMND_SENT2> ..  DATA READ RAWDATA\ATCMND_SENT2.JSON ..`,()=>{});
             // --------                          
              if (!err) {
                // ---------
                _data.delete("rawData",'ATCMND_SENT2',function() {})
                // ---------
              }
              // ---------
              _data.create("rawData", 'ATCMND_SENT2', ACTIVE_CMND, function (err) {
                // ---------
                console.log(`[${'WORKERS.JS'.red}]  .. [3] FILE <${'ATCMND_SENT2'.green}> DELETED & RE-CREATED...`);
                _logs.append('_ERROR',`[WORKERS.JS] ${time} .. <TDKSENSORSGROUP::ATCMND_SENT2> ..  DELETED & RECREATED RAWDATA\ATCMND_SENT2.JSON ..`,()=>{});                
                // ---------
                if (!err) {
                  console.log(`[${'WORKERS.JS'.red}]  .. ATCMND_SENT2 CREATED..`);
                } else {
                  console.log(`[${'WORKERS.JS'.red}] .. COULD NOT CREATE THE NEW SENSOR ...<ATCMND_SENT2>`);
                  flagPRINTERRORLOG && _logs.append('_ERROR',`[WORKERS.JS] <TDKSENSORSGROUP> COULD NOT CREATE FILE .. <ATCMND_SENT2> ..`,()=>{});                  
                }
                // -----------
                let nSTEP = 1;
                if (ACTIVE_CMND.length == 0) return;
                // ------------------
                TDKSENSORSGROUP = setInterval(function() {
                  // ---------------------------------
                  let BYTES = "";
                  let item = ACTIVE_CMND[TDKSENSORSGROUP_COUNTER];
                  // ---------------------
                  if (item && item.FLAG) {
                    // -----------
                    let CRC1;
                    let StrATCMND = '';
                    let HEXID = (item.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase();
                    // -------------------------------
                    switch (item.TYPE.toUpperCase()) {
                      case "DIRECT":
                        BYTES = `AT+TXH=${item.DTUID},${item.PREMODBUS}\r\n`;
                        StrATCMND = `AT+TXH=${item.DTUID},${item.PREMODBUS}`;
                        break;
                      case "485":
                        let GATEWAYID = item.GATEWAYID;
                        let CRC  = crc16.checkSum( HEXID + item.MODBUS).toUpperCase();
                        let CHECKCMND = `${item.PREMODBUS ? item.PREMODBUS : '' }${HEXID}${item.MODBUS}`;
                        CRC1 = crc16.checkSum( `${item.PREMODBUS ? item.PREMODBUS : '' }${HEXID}${item.MODBUS}`).toUpperCase();
                        // BYTES = `AT+TXH=${item.DTUID},${HEXID + item.MODBUS + CRC}\r\n`;
                        BYTES = `AT+TXH=${item.DTUID},${item.PREMODBUS ? item.PREMODBUS : '' }${HEXID}${item.MODBUS}${CRC1}\r\n`;
                        StrATCMND = `AT+TXH=${item.DTUID},${item.PREMODBUS ? item.PREMODBUS : '' }${HEXID}${item.MODBUS}${CRC1}`;
                        break;
                      case "DTU-STATE":
                        BYTES = `AT+TST=${item.DTUID},SYSTEM CHECK DTU=${item.DTUID}\r\n`;
                        StrATCMND = `AT+TST=${item.DTUID},SYSTEM CHECK DTU=${item.DTUID}`;
                        break;
                      case "SYSTEM":
                          // BYTES = `AT+TST=${item.DTUID},SYSTEM CHECK DTU=${item.DTUID}\r\n`
                        BYTES = `AT+IPR=${item.DTUID},SYSTEM CHECK DTU=${item.DTUID}\r\n`
                        StrATCMND = `AT+IPR=${item.DTUID},SYSTEM CHECK DTU=${item.DTUID}`
                        break;
                      default :
                        break;
                    }
                    // ------------------
                    flagPRINTCONSOLE && console.log(`[${'WORKERS.JS'.red}] ..${StrATCMND}..`)
                    flagPRINTERRORLOG && _logs.append('_ERROR',`[WORKERS.JS] <TDKSENSORSGROUP> ${StrATCMND} `,()=>{});
                    // ------------------
                    _server.socketArr.forEach((socket,index) => {
                      // ------------------------
                      // FILTER THE GATEWAY WHERE AT-COMMAND IS TO BE SENT
                      // ------------------------
                      if (socket.GATEWAYID == item.GATEWAYID && socket.SOCKET){
                        today = new Date();
                        time = String(today.getHours()).padStart(2,"0") + ":" + String(today.getMinutes()).padStart(2,"0") + ":" + String(today.getSeconds()).padStart(2,"0");;
                        socket.SOCKET.write(BYTES);
                        let _SOCKETCOUNT = _server.socketArr.length;
                        // ---------------------------------
                        // WRITE AT-COMMAND SENT TO LOG FILE
                        // ---------------------------------
                      }
                    })
                    // ---------- 
                    decoder.ADD_ATCMND(item)
                    // ----------
                  }
                  // ---------
                  TDKSENSORSGROUP_COUNTER ++;
                    // ---------------------------------
                  if (TDKSENSORSGROUP_COUNTER > ACTIVE_CMND.length -1) {
                    // ----------------------------
                    clearInterval(TDKSENSORSGROUP);
                    // ----------------------------
                  }
                  // --------------
                },1000 * nSTEP);
                // -----------
                console.log(`[${'WORKERS.JS'.red}]  .. [4] ATCMND_SENT2 COMPLETE..`);
                _logs.append('_ERROR',`[WORKERS.JS] ${time} .. <TDKSENSORSGROUP::ATCMND_SENT2> ..  ATCMND_SENT2 COMPLETE ..`,()=>{});                
                // ------------
              });
            });
         })
       });
     }
     // -----------------------
     workers.gatherAllChecks();
     // -----------------------
   },1000 * 60 * nInterval);
   // ----------------------
 };
 // -------------
 // SENSORS STATS
 // -------------
 const isToday = (someDate) => {
   const today = new Date();
   return someDate.getDate() == today.getDate() && someDate.getMonth() == today.getMonth() && someDate.getFullYear() == today.getFullYear();
 }
 const getDateTime = (TIMESTAMP) => {
   let _date = new Date(TIMESTAMP);
   let nMONTH = _date.getMonth() + 1;
   let nDAY = _date.getDate();
   return `${nDAY}/${nMONTH}`
 }
 function getSensorName(sensors,dtuId,sensorId) {
   // ----
  //  console.log(sensors);
   let found = sensors.find(element => element.dtuId == dtuId && element.sensorId == sensorId);
   return found ? found.name : 'NOT FOUND..';
 }
 workers.STATSANALYSIS = function(nInterval) {
    // -------
    let LoopInterval;
    // --------------
    // LoopInterval = setInterval(function() {
      // ---------------------------------
      let today = new Date();
      let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
      let time = today.getHours() + ":" + today.getMinutes();
      console.log(`[${'WORKERS.JS'.green}] ${date.yellow} ${time.yellow} <${'STATSANALYSIS'.green}> `);
      // -------------------
      Sensor.find({}).sort({date: -1}).exec( (error,sensors) => {
        // ------------------
        let nCOUNTER = 0;
        console.log(`[${'WORKERS.JS'.green}] ${date.yellow} ${time.yellow} <${'STATSANALYSIS'.green}> ALL SENSORS IN DATABASE <${sensors.length}> `);
        // -----------------------
        // ALL SENSORS IN DATABASE
        // -----------------------
        _data.create("STATS", 'ALLSENSORS', sensors, function (err) {
        })
        // -------
        // PROCESS EACH SENSOR
        // -------
        sensors.map((sensor,index) => {
          // ------------------
          let query = {
            name : sensor.name,
            dtuId : sensor.dtuId,
            sensorId : sensor.sensorId
          }
          // ----------------
          SensorStats.find(query).exec( (error,_sensorStats) => {
            // ------------------------------
            // GET ALL SENSORS IN SENSORSTATS
            // ------------------------------
            let key = sensor.dtuId === '-1' ? `${sensor.sensorId}` : `${sensor.dtuId}-${sensor.sensorId}`
            // -----------------------
            let mapData = new Map();
            let totalLines = -1;
            // --------------------------
            _logs.read(key,totalLines,null,null,false,function(err,sensorData) {
              // -------------
              // DTUID = -1 -> WISENSOR
              // DTUID > 0  -> 485 SENSORS
              // -------------------------
              nCOUNTER += 1;
              let sensorKey = null;
              // ---- POWER METER ---
              if (sensor.type === 'PWRMTR(485)') {
                // --------
                let nCOUNT = sensorData.length;
                sensorKey = `${sensorData[0].DTUID}_${sensorData[0].SENSORID}`
                let _dateTime0 = new Date(sensorData[0].TIMESTAMP);
                let _pwrdata = [];
                let _date0  = -1;
                // --------------
                sensorData.forEach((item,index)=>{
                  let _dateTime = new Date(item.TIMESTAMP);
                  if (_date0 !== _dateTime.getDate()) {
                    _date0 = _dateTime.getDate();
                    let _HEXStr = item.RCV_BYTES[0] + item.RCV_BYTES[1];
                    let _HEXInt = parseInt(_HEXStr,16) * 0.01;
                    _pwrdata.push({
                      day : _date0,
                      month : _dateTime.getMonth()+1,
                      reading : _HEXInt.toFixed(0)
                    })
                    //  _datamap.push({day:_date0,month:_dateTime.getMonth()+1,reading:_HEXInt.toFixed(0)})
                  }
                })
                let _sensordatamap = { sensor: sensorKey, data: _pwrdata };
                // console.log(_sensordatamap);
                // ---------
              } 
              // -------------------------
              if (sensor.dtuId === '-1' ) {
                // -------
                sensorKey = `${sensor.sensorId}`
                mapData = GetWiSENSORDataArray(sensorData,key,index);
                // console.log(`[${'WORKERS.JS'.green}] ${date.yellow} ${time.yellow} ...${sensor.type} ...<${sensorKey.green}>...`);
                // console.log(sensor)
                // console.log(mapData.keys().next().value)
                // -------
              } else {
                // -----------
                // 485 SENSORS
                // console.log(`[${'WORKERS.JS'.green}] ${date.yellow} ${time.yellow} <${'STATSANALYSIS'.green}> <${sensor.dtuId}> `);
                sensorKey = `${sensorData[0].DTUID}_${sensorData[0].SENSORID}`
                const factor = Number(sensor.ratingMax)/Number(sensor.ratingMin);
                // console.log(sensor.type,sensor.variables);
                if (sensor.type ==="RH(485)")				mapData = Get485RHTEMPSENSORDataArray(sensor.type,sensor.variables,sensorData,key,index);
                if (sensor.type ==="WTRTEMP(485)") 	mapData = Get485WTRTEMPSENSORDataArray(sensor.type,sensor.variables,sensorData,key,index);
                if (sensor.type ==="WTRPRS(485)")  	mapData = Get485WTRPRSSENSORDataArray(sensor.type,sensor.variables,sensorData,key,index);
                if (sensor.type ==="AIRFLW(485)") 	mapData = Get485AIRFLWSENSORDataArray(sensor.type,sensor.variables,sensorData,key,index);
                if (sensor.type ==="PWRMTR(485)")		mapData = Get485PWRMTRSENSORDataArray(factor,sensor.type,sensor.variables,sensorData,key,index);
              }
              // -------------
              const dataFields = {
                name:sensor.name,
                dtuId:sensor.dtuId,
                sensorId:sensor.sensorId,
                statsdata:mapData,					 
                variables : sensor.variables,
                date:Date.now(),
                type:sensor.type
              };
              // --------------
              if ( Object.keys(_sensorStats).length === 0) {
                // ----------------
                // CREATE NEW ENTRY
                // ----------------
                const newSensorStats = new SensorStats(dataFields);
                newSensorStats.save();
                // -------------------
              } else {
                // -------------
                // const query = { "_id": _sensorStats[0]._id };
                const update = { "$set": { "statsdata": mapData, "date": Date.now(), "variables": sensor.variables } };
                const options = { "upsert": true };
                // ---------------------------------
                SensorStats.updateOne(query,update,options).then( res => {
                  // ---------
                  // console.log('...SENSOR STATS UPDATED...',query.dtuId,query.sensorId);
                  // ---------
                });
              }
              // ---------------------------------------
              // PROCESS STATISTICAL DATA ON POWER METER
              // ---------------------------------------
              let sensorName = ''
              if (sensorKey) {
                sensorName = getSensorName(sensors,sensor.dtuId,sensor.sensorId);
              }
              if (sensorData[0].SENSORTYPE && sensorData[0].SENSORTYPE == "PWR-METER-POWER") {
                // ------
                sensorKey && ProcessPWRMTR(sensorKey,sensorName,sensorData,sensor.type);
                // --------
              }  else {
                // ------
                sensorKey && ProcessSENSORS(sensorKey,sensorName,sensorData,sensor.type,sensor.dtuId,sensor.sensorId);
              }
            })
            // --------------
          })
        })
      })
    // },1000 * 60 * nInterval);
 };
 // -------
 function ProcessSENSORS(sensorKey,sensorName,sensorData,type,dtuId,sensorId) {
  let nCOUNT = sensorData.length;
  let dateTime0 = new Date(sensorData[0].TIMESTAMP);
  let dateTime1 = new Date(sensorData[nCOUNT-1].TIMESTAMP);
  // let strDateTIme0 = `${dateTime0.getDate()}/${dateTime0.getMonth()+1}`;
  // let strDateTIme1 = `${dateTime1.getDate()}/${dateTime1.getMonth()+1}`;
  // -------
  let _DATA = [];
  let _HOURS = [];
  // ------------
  sensorData.forEach((item,index) => {
    let _date= new Date(item.TIMESTAMP);
    if(isToday(_date)) {
      // --------------
      let nHOUR = String(_date.getHours());
      if (!_HOURS.includes(nHOUR)) _HOURS.push(nHOUR);
      _DATA.push(item);
    }
  });
  // ----------
  let resultObj = { 
    SENSORNAME: sensorName,
    SENSORTYPE: type,
    DTUID : dtuId, 
    SENSORID : sensorId,
    DATE0 : dateTime0,
    DATE1 : dateTime1,
    DAYDATA : _DATA,
    DAYHOURS : _HOURS
   };
   // -------------------
   var logString = JSON.stringify(resultObj);
   let logFileName = `STAT_${sensorKey}`
   // ------------
   _data.create("STATS", logFileName, resultObj, function (err) {
     //  resultObj.DATA.length > 0 && console.log(`${resultObj.SENSORNAME.green}..[${String(resultObj.DATA.length).yellow}].${resultObj.DTUID.red}|${resultObj.SENSORID.green} ..${getDateTime(resultObj.DATA[0].TIMESTAMP)}..${getDateTime(resultObj.DATA[resultObj.DATA.length-1].TIMESTAMP)}`)
   })
   // ----------
 }
 function ProcessPWRMTR(sensorKey,sensorName,sensorData,type) {
   let nCOUNT = sensorData.length;
   let dateTime0 = new Date(sensorData[0].TIMESTAMP);
   let dateTime1 = new Date(sensorData[nCOUNT-1].TIMESTAMP);
   let strDateTIme0 = `${dateTime0.getDate()}/${dateTime0.getMonth()+1}`;
   let strDateTIme1 = `${dateTime1.getDate()}/${dateTime1.getMonth()+1}`;
   let PWRMTR0 = getPWRMETER(sensorData[0].RCV_BYTES);
   let PWRMTR1 = getPWRMETER(sensorData[nCOUNT-1].RCV_BYTES);
   // ---------
   let _DATA = [];
   let _HOURS = [];
   // --------
   sensorData.forEach((item,index) => {
     let _date= new Date(item.TIMESTAMP);
     if ( isToday(_date)) {
       // ------------
      let nHOUR = String(_date.getHours());
      if (!_HOURS.includes(nHOUR)) _HOURS.push(nHOUR);
      _DATA.push(item);
     }
   });
   // ------------
   let resultObj = { 
     SENSORNAME: sensorName,
     SENSORTYPE: type,
     DTUID : sensorData[0].DTUID, 
     SENSORID : sensorData[0].SENSORID,
     PWRMTR0, PWRMTR1,
     DAYDATA : _DATA,
     DAYHOURS : _HOURS
    };
    // --------
   Object.entries(sensorData).map(([index, data]) => {
     // --------
    let dateTime = new Date(data.TIMESTAMP);
    let nDAY = dateTime.getDate();
    let nMONTH = dateTime.getMonth() + 1;
    let nYEAR = dateTime.getFullYear();
    let _READING = getPWRMETER(data.RCV_BYTES);
    let _WeekDay = getWeekDay(dateTime);
    // -----
    let KEY_YEARMONTH = `MNTH-${nYEAR}_${nMONTH}`;
    let KEY_WEEKDAY = `WK${_WeekDay}`;
    // ---------
    if (!resultObj.hasOwnProperty(KEY_YEARMONTH)) resultObj[KEY_YEARMONTH] = _READING;
    if (!resultObj.hasOwnProperty(KEY_WEEKDAY))   resultObj[KEY_WEEKDAY] = _READING;
    // ---------
   })
   // -------------------
   var logString = JSON.stringify(resultObj);
   let logFileName = `STAT_${sensorKey}`
   // ------------
   _data.create("STATS", logFileName, resultObj, function (err) {
      // ----
      //  console.log(`..${logFileName} ...${err} ...C R E A T E D ...`)
      // ----
   })
   // ----
 }
 function getWeekDay(date) {
   // ------    
  var oneJan = new Date(date.getFullYear(),0,1);
  var numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
  var result = Math.ceil(( date.getDay() + 1 + numberOfDays) / 7);
  return result
 }
 function getPWRMETER(RCV_BYTES) {
  let _HEXStr = RCV_BYTES[0] + RCV_BYTES[1];
  let _HEXInt = parseInt(_HEXStr,16) * 0.01;
  let _reading = Number(_HEXInt);
  return _reading.toFixed(0);
} 
 // -------------
 // SERVER STATUS 
 // -------------
 workers.SERVER_STATUS_UPDATE = function(nInterval) {
   // ---------
   LoopInterval = setInterval(function() {
		 // --------------------
     let today = new Date();
		 let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
		 let time = today.getHours() + ":" + today.getMinutes();
		 let strTEXT = `<SERVER STATUS UPDATE> ${date} ${time}`;
		 // -------------
     // 60 MIN UPDATE
     // -------------
     if (today.getMinutes()%60 == 0) {
       // -------
       for (let key in _server.sensorsArr) {
         // keys
         strTEXT += `SENSOR ID = ${key}... ${_server.sensorsArr[key]} \n`
      }
      console.log(`[${'WORKERS.JS'.green}] ${date.yellow} ${time.green} <SERVER_STATUS_UPDATE> .. SEND MAIL..`)
      decoder.WhatMateMessage('IKN LoRa IOT Group',`..HOURLY UPDATE..`)
      // decoder.WhatMateMessage('L1 Medical Store',`HOURLY UPDATE..`);
      // decoder.WhatMateMessage('L3 Oncologi',`HOURLY UPDATE..`);
      // decoder.WhatMateMessage('L3 Outpatient Farmasi',`HOURLY UPDATE..`);
      // decoder.WhatMateMessage('L4 Daycare',`HOURLY UPDATE..`);
      // decoder.WhatMateMessage('L5 Inpatient Farmasi',`HOURLY UPDATE..`);
      try {
        // decoder.sendEmail(null,strTEXT)
      } catch (err) {
        _logs.append('_ERROR',`[WORKERS.JS] [SEND EMAIL] <${err}>`,()=>{{}});
      }
     }
     // -------------
     // 30 MIN UPDATE
     // -------------
     let bypass = true;
     if (today.getMinutes()%30 == 0 && !bypass) {
       // -------
        console.log(`[${'WORKERS.JS'.green}] ${date.yellow} ${time.green} <SERVER_STATUS_UPDATE> .. SEND WHAT'S APP..`)
        decoder.WhatMateMessage(`SERVER UPDATE STATUS`,`..30MIN STATUS UPDATE..`)
        try {
          // decoder.sendEmail(null,strTEXT)
        } catch (err) {
          _logs.append('_ERROR',`[WORKERS.JS] [SEND EMAIL] <${err}>`,()=>{{}});
        }
     }
     // ---------------
   },1000*60*nInterval)
 }
// -------
const GetWiSENSORDataArray = (sensorData,key,index) => {
  // -----------------------------
  const mapDataDate = new Map();
  // ---------------------------
  sensorData.map(_data => {
    let _date = new Date(_data.TIMESTAMP);
    let _Day = _date.getDay();
    let _Month = _date.getMonth() + 1;
    let _Date = _date.getDate();
    let _Year = _date.getFullYear();
    let _key = `${_Date}-${_Month}-${_Year}`;
    // ----------------------------
    let _Temp = _data.Temperature;
    let _Humidity = _data.Humidity;
    // ------------------------
    let _value = mapDataDate.get(_key);
    if (_value === undefined) {
      let dataMinMax = [_Temp,_Temp,_Humidity,_Humidity];
      mapDataDate.set(_key,dataMinMax);
    } else {
      let _TempMin = _Temp < _value[0] ? _Temp : _value[0];
      let _TempMax = _Temp > _value[1] ? _Temp : _value[1];
      let _HumdMin = _Humidity < _value[2] ? _Humidity : _value[2];
      let _HumdMax = _Humidity > _value[3] ? _Humidity : _value[3];
      let newdataMinMax = [_TempMin,_TempMax,_HumdMin,_HumdMax]
      mapDataDate.set(_key,newdataMinMax);
    }
  })
  return mapDataDate;
}
const Get485RHTEMPSENSORDataArray = (type,variables,sensorData,key,index) => {
  // -----------------------------
  const mapDataDate = new Map();
  // -----------------------------
  // console.log(`${index}...KEY=${key}..TYPE=${type}..[${variables}] .... DATA SETS=${sensorData.length} ...${sensorData[0].DATAS}...`);
  // ---------------------
  sensorData.map(_data => {
    let _date = new Date(_data.TIMESTAMP);
    let _Day = _date.getDay();
    let _Month = _date.getMonth() + 1;
    let _Date = _date.getDate();
    let _Year = _date.getFullYear();
    let _key = `${_Date}-${_Month}-${_Year}`;
    let _Temp = _data.DATAS[0]/10.0;
    let _Humidity = _data.DATAS[1]/10.0;
    // ------------------------
    let _value = mapDataDate.get(_key);
    if (_value === undefined) {
      let dataMinMax = [_Temp,_Temp,_Humidity,_Humidity];
      mapDataDate.set(_key,dataMinMax);
    } else {
      let _TempMin = _Temp < _value[0] ? _Temp : _value[0];
      let _TempMax = _Temp > _value[1] ? _Temp : _value[1];
      let _HumidityMin = _Humidity < _value[0] ? _Humidity : _value[0];
      let _HumidityMax = _Humidity > _value[1] ? _Humidity : _value[1];
      let newdataMinMax = [_TempMin,_TempMax]
      mapDataDate.set(_key,newdataMinMax,_HumidityMin,newdataMinMax);
    }
  })
  return mapDataDate;
}
const Get485WTRTEMPSENSORDataArray = (type,variables,sensorData,key,index) => {
  // -----------------------------
  const mapDataDate = new Map();
  // console.log(`${index}...KEY=${key}..TYPE=${type}..[${variables}] .... DATA SETS=${sensorData.length}`);
  // console.log(sensorData[0].DATAS);
  // -----------------------------
  // console.log(`${index}...KEY=${key}..TYPE=${type}..[${variables}] .... DATA SETS=${sensorData.length} ...${sensorData[0].DATAS}...`);
  // ---------------------
  sensorData.map(_data => {
    let _date = new Date(_data.TIMESTAMP);
    let _Day = _date.getDay();
    let _Month = _date.getMonth() + 1;
    let _Date = _date.getDate();			
    let _Year = _date.getFullYear();
    let _key = `${_Date}-${_Month}-${_Year}`;
    let _Temp = _data.DATAS[1]/10.0;
    // ------------------------
    let _value = mapDataDate.get(_key);
    if (_value === undefined) {
      let dataMinMax = [_Temp,_Temp];
      mapDataDate.set(_key,dataMinMax);
    } else {
      let _TempMin = _Temp < _value[0] ? _Temp : _value[0];
      let _TempMax = _Temp > _value[1] ? _Temp : _value[1];
      let newdataMinMax = [_TempMin,_TempMax]
      mapDataDate.set(_key,newdataMinMax);
    }
  })
  return mapDataDate;
}
const Get485WTRPRSSENSORDataArray = (type,variables,sensorData,key,index) => {
  // -----------------------------
  const mapDataDate = new Map();
  if (sensorData.length == 0 ) return;
  // -----------------------------
  // console.log(`${index}...KEY=${key}..TYPE=${type}..[${variables}] .... DATA SETS=${sensorData.length} ...${sensorData[0].DATAS}...`);
  sensorData.map(_data => {
    let _date = new Date(_data.TIMESTAMP);
    let _Day = _date.getDay();
    let _Month = _date.getMonth() + 1;
    let _Date = _date.getDate();
    let _Year = _date.getFullYear();
    let _key = `${_Date}-${_Month}-${_Year}`;
    // ------------------------------
    let _PRESS = _data.DATAS[1]/10.0;
    // ------------------------------
    let _value = mapDataDate.get(_key);
    if (_value === undefined) {
      let dataMinMax = [_PRESS,_PRESS];
      mapDataDate.set(_key,dataMinMax);
    } else {
      let _PRESSMin = _PRESS < _value[0] ? _PRESS : _value[0];
      let _PRESSMax = _PRESS > _value[1] ? _PRESS : _value[1];
      let newdataMinMax = [_PRESSMin,_PRESSMax]
      mapDataDate.set(_key,newdataMinMax);
    }
  })
  return mapDataDate;
}
const Get485AIRFLWSENSORDataArray = (type,variables,sensorData,key,index) => {
  // -----------------------------
  const mapDataDate = new Map();
  if (sensorData.length == 0 ) return;
  // -----------------------------
  // console.log(`${index}...KEY=${key}..TYPE=${type}..[${variables}] .... DATA SETS=${sensorData.length} ...${sensorData[0].DATAS}...`);
  // -------------------------------
  sensorData.map(_data => {
    let _date = new Date(_data.TIMESTAMP);
    let _Day = _date.getDay();
    let _Month = _date.getMonth() + 1;
    let _Date = _date.getDate();
    let _Year = _date.getFullYear();
    let _key = `${_Date}-${_Month}-${_Year}`;
    // ------------------------------
    let _VELOCITY = _data.DATAS[0]/10.0;
    // ------------------------------
    let _value = mapDataDate.get(_key);
    // ------------------------
    if (_value === undefined) {
      let dataMinMax = [_VELOCITY,_VELOCITY];
      mapDataDate.set(_key,dataMinMax);
    } else {
      let _VELOCITYMin = _VELOCITY < _value[0] ? _VELOCITY : _value[0];
      let _VELOCITYMax = _VELOCITY > _value[1] ? _VELOCITY : _value[1];
      let newdataMinMax = [_VELOCITYMin,_VELOCITYMax]
      mapDataDate.set(_key,newdataMinMax);
    }
  })
  return mapDataDate;
}
const Get485PWRMTRSENSORDataArray = (factor,type,variables,sensorData,key,index) => {
  // -----------------------------
  const mapDataDate = new Map();
  if (sensorData.length == 0 ) 
    return mapDataDate;
    // ---------------
  return mapDataDate;
  // -------------------------------
  sensorData.map(_data => {
    let _date = new Date(_data.TIMESTAMP);
    let _Day = _date.getDay();
    let _Month = _date.getMonth() + 1;
    let _Date = _date.getDate();
    let _key = `${_Date}-${_Month}`;
    // ------------------------------
    let VOLTAGE_A = Number(_data.DATAS2[0] / 10.0);
    let VOLTAGE_B = Number(_data.DATAS2[1] / 10.0);
    let VOLTAGE_C = Number(_data.DATAS2[2] / 10.0);
    let CURRENT_A = Number(((_data.DATAS2[3] * 100 + _data.DATAS2[4]) / 1000) * factor);
    let CURRENT_B = Number(((_data.DATAS2[5] * 100 + _data.DATAS2[6]) / 1000) * factor);
    let CURRENT_C = Number(((_data.DATAS2[7] * 100 + _data.DATAS2[8]) / 1000) * factor);
    // -----------
    // let E_ENERGY = Number(((data.DATAS1[1] / 100) * 100) / 5);
    let FREQ = Number(data.DATAS2[16] / 10.0);
    let PFACTOR = Number(data.DATAS2[15] / 100.0);
    // ---------------------------------------------------
    let _VOLTAGE = (VOLTAGE_A + VOLTAGE_B + VOLTAGE_C)/3.0;
    let _CURRENT = CURRENT_A + CURRENT_B + CURRENT_C;
    // let _PCONSUMPTION = _data.DATAS[0]/10.0;
    // ------------------------------
    let _value = mapDataDate.get(_key);
    // ------------------------------
    if (_value === undefined) {
      let dataMinMax = [_VOLTAGE,_VOLTAGE,_CURRENT,_CURRENT];
      mapDataDate.set(_key,dataMinMax);
    } else {
      let _VOLTAGEMin = _VOLTAGE < _value[0] ? _VOLTAGE : _value[0];
      let _VOLTAGEMax = _VOLTAGE > _value[1] ? _VOLTAGE : _value[1];
      let _CURRENTMin = _CURRENT < _value[2] ? _CURRENT : _value[2];
      let _CURRENTMax = _CURRENT > _value[3] ? _CURRENT : _value[3];
      // let _PCONSUMPTIONMin = _PCONSUMPTION < _value[4] ? _PCONSUMPTION : _value[4];
      // let _PCONSUMPTIONMax = _PCONSUMPTION > _value[5] ? _PCONSUMPTION : _value[5];
      let newdataMinMax = [_VOLTAGEMin,_VOLTAGEMax,_CURRENTMin,_CURRENTMax]
      mapDataDate.set(_key,newdataMinMax);
    }
  })
  return mapDataDate;
}
// ---------------------
// TEST AT COMMAND ARRAY
// ---------------------
// -------------------------------
// Rotate (compress) the log files
// -------------------------------
workers.rotateLogs = function(){
  // List all the (non compressed) log files
  _logs.list(false,function(err,logs){
    if(!err && logs && logs.length > 0){
      logs.forEach(function(logName){
        // Compress the data to a different file
        var logId = logName.replace('.log','');
        var newFileId = logId+'-'+Date.now();
        _logs.compress(logId,newFileId,function(err){
          if(!err){
            // Truncate the log
            _logs.truncate(logId,function(err){
              if(!err){
                debug("Success truncating logfile");
              } else {
                debug("Error truncating logfile");
              }
            });
          } else {
            debug("Error compressing one of the log files.",err);
          }
        });
      });
    } else {
      debug('Error: Could not find any logs to rotate');
    }
  });
};
workers.restartApp = function() {
  // ---------
  let today = new Date();
  let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  let time = today.getHours() + ":" + today.getMinutes();
  console.log(`[${'WORKERS.JS'.green}] ${date.yellow} ${time.green} ..${'RESTART APP....'.yellow}..`);
  _logs.append('_ERROR',`[WORKERS.JS] <${time}> [RESTARTAPP]....`,()=>{{}});
  // --------
  let baseDir = path.join(__dirname,'/../');
  fs.open(baseDir+'restartlog.json', 'r+', function(err, fileDescriptor){
  if(!err && fileDescriptor){
    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    let time = today.getHours() + ":" + today.getMinutes(); 
    var dateObj = { 'dateTime' : `${date} ${time}` }
    var stringData = JSON.stringify(dateObj);
    fs.writeFile(fileDescriptor, stringData,function(err){
      if(!err){
        fs.close(fileDescriptor,function(err){
          if(!err){
          } else {
          }
        });
      } else {
      }
    });
  };
  })
}
// --------------------
// TIMER TO EXECUTE THE 
//   RESTART THE SERVER
// --------------------
workers.SERVER_RESTART = function(){
  // --------------------
  console.log(`[WORKERS.JS] ...SERVER_RESTART....`)
  // --------------------
  setInterval(function(){
    // workers.rotateLogs();
    console.log('...RESTART APP...')
    workers.restartApp();
    // -------------------
  },1000 * 60 * 60 * 3 );
}
// -----------
// INIT SCRIPT
// -----------
workers.init = function(){
  // -------     
  let today = new Date();
  let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  let time = today.getHours() + ":" + today.getMinutes();
  console.log(`[${'WORKERS.JS'.green}] ${date.yellow} ${time.green} ..${'INITIALIZATION BACKGROUND WORKERS'.yellow}..`);
  // ----------------------------------
  // EXECUTE ALL THE CHECKS IMMEDIATELY
  // ----------------------------------
  workers.gatherAllChecks();
  // ------------------------------
  // CALL THE LOOP SO THE CHECKS AND MODBUS COMMAND
  // SENDING WILL EXECUGTE LATER ON
  // ----------------------
  // NIPPON GLASS DEMO SITE
  // ----------------------
  flagTIMER1 && workers.TIMERLOOP1(nTIMER1);
  // ------------
  // TDK SENSORS
  // -----------
  flagTIMER2 && workers.TDKSENSORSGROUP(nTIMER2);
  // --------------
  // DAY STATISTICS
  // --------------
  workers.STATSANALYSIS(nTIMER3);
  // -------------
  // INTERNAL SERVER STATS UPDATE
  workers.SERVER_STATUS_UPDATE(1);

  // Compress all the logs immediately
  // workers.rotateLogs();

  // Call the compression loop so checks will execute later on
  workers.SERVER_RESTART();

};

// Export the module
module.exports = workers;
 