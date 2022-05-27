/*
 * CLI-related tasks
 */

 // Dependencies
 var readline = require('readline');
 var util = require('util');
 var debug = util.debuglog('cli');
 var events = require('events');
 class _events extends events{};
 var e = new _events();
 var os = require('os');
 var v8 = require('v8');
 var _data = require('./data');
 var _logs = require('./logs');
 var _server = require('./server');
 var helpers = require('./helpers');
 var crc16 = require('node-crc16');
 var http = require('http');
 
 // Instantiate the cli module object
 var cli = {};
 
 // Utility Functions
 function hex_to_ascii(str1) {
   var hex = str1.toString();
   var str = "";
   for (var n = 0; n < hex.length; n += 2) {
     str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
   }
   return str;
 }
 
 // Input handlers
 e.on('man',function(str)               { cli.responders.help(); });
 e.on('help',function(str)              { cli.responders.help();  });
 e.on('exit',function(str)              { cli.responders.exit();  });
 e.on('stats',function(str)             { cli.responders.stats(); });
 e.on('list sockets',function(str)      { cli.responders.listSockets(); })
 e.on('list users',function(str)        { cli.responders.listUsers(); });
 e.on('more user info',function(str)    { cli.responders.moreUserInfo(str); });
 e.on('list checks',function(str)       { cli.responders.listChecks(str); });
 e.on('list sensors',function(str)      { cli.responders.listSensors(str);  });
 e.on('list gateways',function(str)     { cli.responders.listGateways(str); });
 e.on('more check info',function(str)   { cli.responders.moreCheckInfo(str);  });
 e.on('list logs',function(str)         { cli.responders.listLogs();  });
 e.on('read file',function(str)         { cli.responders.readfile(str); });
 e.on('send testsockets',function(str)  { cli.responders.sendSockets();  });
 e.on('send testdtu',function(str)      { cli.responders.senddtu(str); })
 e.on('send whatsapp',function(str)     { cli.responders.sendWhatsApp(str); })
 e.on('more log info',function(str)     { cli.responders.moreLogInfo(str);  });
 
 // Responders object
 cli.responders = {};
 
 // Help / Man
 cli.responders.help = function(){
   // Codify the commands and their explanations
   var commands = {
     'exit' : 'Kill the CLI (and the rest of the application)',
     'man' : 'Show this help page',
     'help' : 'Alias of the "man" command',
     'stats' : 'Get statistics on the underlying operating system and resource utilization',
     'list users' : 'Show a list of all the registered (undeleted) users in the system',
     'more user info --{userId}' : 'Show details of a specified user',
     'list gateways' : 'Show a list of all  gateways',
     'list checks --up --down' : 'Show a list of all the active checks in the system, including their state. The "--up" and "--down flags are both optional."',
     'list sensors' : 'Sjow a list of all sensors in the system.',
     'more check info --{checkId}' : 'Show details of a specified check',
     'list logs' : 'Show a list of all the log files available to be read (compressed and uncompressed)',
     'more log info --{logFileName}' : 'Show details of a specified log file',
     'read file --{directory}--{filename}': 'Read Objects in FIle',
     'list sockets' : 'LISTS CONNECTED SOCKETS',
     'send testsockets' : 'SEND HEX TO OPEN SOCKETS',
     'send testdtu --{dtuid}' : 'Send test content to a specified dtu',
     'send whatsapp --{Message}': 'SEND TEST MESSAGE TO WHATS APP'
   };
   // Show a header for the help page that is as wide as the screen
   cli.horizontalLine();
   cli.centered('CLI MANUAL');
   cli.horizontalLine();
   cli.verticalSpace(0);
   // Show each command, followed by its explanation, in white and yellow respectively
   for(var key in commands){
      if(commands.hasOwnProperty(key)){
         var value = commands[key];
         var line = '>\x1b[33m'+key+'\x1b[0m';
         var padding = 40 - line.length;
         for (i = 0; i < padding; i++) { line+=' '; }
         line+=value;
         console.log(line);
         cli.verticalSpace(0);
      }
   }
   cli.verticalSpace(0);
   // End with another horizontal line
   cli.horizontalLine();
 };
 
 // Create a vertical space
 cli.verticalSpace = function(lines){
   lines = typeof(lines) == 'number' && lines > 0 ? lines : 0;
   for (i = 0; i < lines; i++) {
       console.log('');
   }
 };
 
 // Create a horizontal line across the screen
 cli.horizontalLine = function(){
   // Get the available screen size
   var width = process.stdout.columns/2;
   // Put in enough dashes to go across the screen
   var line = '';
   for (i = 0; i < width; i++) {
       line+='-';
   }
   console.log(line);
 };
 
 // Create centered text on the screen
 cli.centered = function(str){
   str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : '';
   // Get the available screen size
   var width = process.stdout.columns/2;
   // Calculate the left padding there should be
   var leftPadding = Math.floor((width - str.length) / 2);
   // Put in left padded spaces before the string itself
   var line = '';
   for (i = 0; i < leftPadding; i++) {
       line+=' ';
   }
   line+= str;
   console.log(line);
 };
 
 // Exit
 cli.responders.exit = function(){
   process.exit(0);
 };
 
 // Stats
 cli.responders.stats = function(){
   // Compile an object of stats
   var stats = {
     'Load Average' : os.loadavg().join(' '),
     'CPU Count' : os.cpus().length,
     'Free Memory' : os.freemem(),
     'Current Malloced Memory' : v8.getHeapStatistics().malloced_memory,
     'Peak Malloced Memory' : v8.getHeapStatistics().peak_malloced_memory,
     'Allocated Heap Used (%)' : Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
     'Available Heap Allocated (%)' : Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
     'Uptime' : os.uptime()+' Seconds'
   };
   // Create a header for the stats
   cli.horizontalLine();
   cli.centered('SYSTEM STATISTICS');
   cli.horizontalLine();
   cli.verticalSpace(0);
   // Log out each stat
   for(var key in stats){
      if(stats.hasOwnProperty(key)){
         var value = stats[key];
         var line = '  \x1b[33m '+key+' \x1b[0m';
         var padding = 41 - line.length;
         for (i = 0; i < padding; i++) {
             line+=' ';
         }
         line+=value;
         console.log(line);
         cli.verticalSpace(0);
      }
   }
   // Create a footer for the stats
   cli.verticalSpace();
   cli.horizontalLine();
 };
 
 // LIST SOCKETS 
 cli.responders.listSockets = function() {
   // Create a header for the stats
   cli.horizontalLine();
   cli.centered('LIST OF CONNECTIONS SOCKETS...');
   cli.verticalSpace(0);
   // Log out each Sockets in Server
   if (_server.socketArr){
     _server.socketArr.forEach((socket,index) => {
       var line = '  \x1b[33m '+socket.GATEWAYID+'   \x1b[0m' + socket.ADDRESS; 
       console.log(line);
     })
   }
   // Create a footer for the stats
   cli.verticalSpace();
   cli.horizontalLine();
 }
 
 // READ FILE
 cli.responders.readfile = function(str) {
  // ------------------
  // Get MESSAGE from string
  var arr = str.split('--');
  var filename;
  var directory;
  try {
    directory = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
    filename = typeof(arr[1]) == 'string' && arr[2].trim().length > 0 ? arr[2].trim() : false;
  } catch (err) {

  }
   // ------------------
   cli.horizontalLine();
   cli.centered('READING FILE/S..')
   if (directory && filename) {
     _data.read(directory,filename,function(err,payload){
       console.log(payload);
     })
   }
   if (directory && !filename) {
     _data.list(directory,function(err,payload){
       if (!err) console.log(payload);
     })
   }
   cli.verticalSpace(0);
   // ------------------
 }

 // SEND PACKETS TO SOCKETS
 cli.responders.sendSockets = function() {
  // ---------------------------------
  let today = new Date();
  let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  let time = today.getHours() + ":" + today.getMinutes();
   // Create a header for the stats
   cli.horizontalLine();
   cli.centered('SENDING TO CONNECTIONS SOCKETS...');
   cli.verticalSpace(0);
   // -------------------
   // SEND MODBUS CALLING COMMAND TO EACH ACTIVE SOCKETS IN SERVER
   // -------------------
   if (_server.socketArr) {
    // --------------------------------
    _server.socketArr.forEach((socket) => {
      let line = '  \x1b[33m '+socket.GATEWAYID+'   \x1b[0m' + socket.ADDRESS; 
      console.log(line);
      _logs.append('ERROR',`[WORKERS.JS] .${date}-${time}. .${socket.GATEWAYID}>>${socket.ADDRESS}.`,()=>{});
    });
     _server.socketArr.forEach((socket,index) => {
       var line = '  \x1b[33m '+socket.GATEWAYID+'   \x1b[0m' + socket.ADDRESS; 
       console.log(line);
       var ATCMNDArr = cli.responders.TESTATCMNDArr();
       // console.log(ATCMNDArr[0]);
       // --------------------
       if (socket.SOCKET){
         let nCOUNTER = 0;
         let interval;
         interval = setInterval(function(){
           socket.SOCKET.write(ATCMNDArr[nCOUNTER].BYTES());
           console.log(`[CLI.JS] .${time}.  ${socket.GATEWAYID}.[${ATCMNDArr[nCOUNTER].DTUID}][${ATCMNDArr[nCOUNTER].SENSORID}] CMND=[${ATCMNDArr[nCOUNTER].BYTES().substr(0,ATCMNDArr[nCOUNTER].BYTES().length-2)}]`);
           _logs.append('ERROR',`[CLI.JS] .. ${socket.GATEWAYID} [${ATCMNDArr[nCOUNTER].DTUID}] SENSOR ID=[${ATCMNDArr[nCOUNTER].SENSORID}] MODNUS CMND=[${ATCMNDArr[nCOUNTER].BYTES().substr(0,ATCMNDArr[nCOUNTER].BYTES().length-2)}]`,()=>{});
           nCOUNTER ++;
           if (nCOUNTER >= ATCMNDArr.length) clearInterval(interval);
         },1000*1.5)
       }
     })
   }
   // Create a footer for the stats
   cli.horizontalLine();
 }
 
  // ------------------------
  // SEND TEST CONTENT TO DTU
  // ------------------------
  cli.responders.senddtu = function(str) {
    // ---------------------------------
    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    let time = today.getHours() + ":" + today.getMinutes();
    // ------------------------------
    // Create a header for the stats
    console.log(`...${str.rainbow}....`);
    // Get ID from string
    let arr = str.split('--');
    let dtuId = typeof(arr[1]) == 'string' && arr[1].trim().length < 4 ? parseInt(arr[1].trim()) : false;
    // -----------------
    if (dtuId)
    {
      // ---------------------------------
      if (_server.socketArr.length > 0 ) {
        // --------------------------------
        _server.socketArr.forEach((socket) => {
          let line = '  \x1b[33m '+socket.GATEWAYID+'   \x1b[0m' + socket.ADDRESS; 
          console.log(line);
          _logs.append('ERROR',`[WORKERS.JS] .${date}-${time}. .${socket.GATEWAYID}>>${socket.ADDRESS}.`,()=>{});
        });
        // ----------------
        console.log('............. . . . ...  ..... .... ..... .. . .'.rainbow);
        _data.read("atcommands",'_ATCOMMANDS',function(err,ATCMNDSObj) {
          // --------------
          if(err) {
            console.log('[CLI.JS].ATCOMMANDS..FILE MISSING...');
            return;
          }
          // --------------
          let nCOUNTER = 0;
          let LoopInterval1;
          LoopInterval1 = setInterval(function() {
            // ---------------------------------
            let BYTES = "";
            let item = ATCMNDSObj[nCOUNTER];
            let HEXID = (item.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase();
            switch (item.TYPE.toUpperCase()) {
              case "485":
                let CRC = crc16.checkSum( HEXID + item.MODBUS).toUpperCase();
                BYTES = `AT+TXH=${item.DTUID},${HEXID + item.MODBUS + CRC}\r\n`;
                break;
              case "SYSTEM":
                BYTES = `AT+TST=${item.DTUID},87654321\r\n`
                break;
              default :
                break;
            }
            // ---------------
            _server.socketArr.forEach((socket,index) => {
              var line = '  \x1b[33m '+socket.GATEWAYID+'   \x1b[0m' + socket.ADDRESS; 
              // console.log(line);
              // console.log(ATCMNDArr[0]);
              // --------------------
              if (socket.SOCKET){
                socket.SOCKET.write(BYTES);
                console.log(`[${item.TYPE}] ${BYTES.substr(0,BYTES.length-2)} : ${item.NAME} ${item.DTUID} ${item.SENSORID}`);
                _logs.append('ERROR',`[CLI.JS] .. ${socket.GATEWAYID} [${item.DTUID}] SENSOR ID=[${item.SENSORID}] MODNUS CMND=[${BYTES.substr(0,BYTES.length-2)}]`,()=>{});
              }
            })
            nCOUNTER ++;
            if (nCOUNTER > ATCMNDSObj.length -1) 
                clearInterval(LoopInterval1);
            // let CRC = crc16.checkSum( HEXID + item.MODBUS);
            // if (item.MODBUS != "")
            //  BYTES = 'AT+TXH=' + item.DTUID + ',' + HEXID + item.MODBUS + CRC() + "\r\n";
            // console.log(`${HEXID}..${CRC}...${BYTES}`);
          },1000 * 1.5);
        });
      }
    }
  }
  // -------------------
  cli.responders.senddtu1 = function(str) {
  // ---------------------------------
  let today = new Date();
  let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  let time = today.getHours() + ":" + today.getMinutes();
  // ------------------------------
   // Create a header for the stats
   console.log('...' + str + '....');
   // -------------------------------
   // Get ID from string
   let arr = str.split('--');
   let dtuId = typeof(arr[1]) == 'string' && arr[1].trim().length < 4 ? parseInt(arr[1].trim()) : false;
   if (dtuId)
   {
    const CHECKSTATUSOFDTU = {
      TYPE:"GATEWAY CHECKING",
      DTUID : dtuId,
      SENSORID : 999,
      MODBUS : '',
      MODBUS1 : '03006C0027',
      HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
      CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
      BYTES : function() { return `AT+TST=${this.DTUID},87654321\r\n`;}
    }
    // ---------------
    if (_server.socketArr.length > 0 ) {
      // --------------------------------
      _server.socketArr.forEach((socket) => {
        let line = '  \x1b[33m '+socket.GATEWAYID+'   \x1b[0m' + socket.ADDRESS; 
        console.log(line);
        _logs.append('ERROR',`[WORKERS.JS] .${date}-${time}. .${socket.GATEWAYID}>>${socket.ADDRESS}.`,()=>{});
      });
      // ----------------
      _server.socketArr.forEach((socket,index) => {
        var line = '  \x1b[33m '+socket.GATEWAYID+'   \x1b[0m' + socket.ADDRESS; 
        console.log(line);
        // console.log(ATCMNDArr[0]);
        // --------------------
        if (socket.SOCKET){
            socket.SOCKET.write(CHECKSTATUSOFDTU.BYTES());
            console.log(`[CLI.JS] .${time}.  ${socket.GATEWAYID}.[${CHECKSTATUSOFDTU.DTUID}][${CHECKSTATUSOFDTU.SENSORID}] CMND=[${CHECKSTATUSOFDTU.BYTES().substr(0,CHECKSTATUSOFDTU.BYTES().length-2)}]`);
            _logs.append('ERROR',`[CLI.JS] .. ${socket.GATEWAYID} [${CHECKSTATUSOFDTU.DTUID}] SENSOR ID=[${CHECKSTATUSOFDTU.SENSORID}] MODNUS CMND=[${CHECKSTATUSOFDTU.BYTES().substr(0,CHECKSTATUSOFDTU.BYTES().length-2)}]`,()=>{});
          }
      })
    }
   }
  }

 // TEST AT COMMAND ARRAY
 cli.responders.TESTATCMNDArr = function(){
  var ATCMNDArr = [];
  // HEADER
  const strHEADER = 'AT+TXH=107,';
  // ----------
  // ADC SENSOR
  // ----------
  const strHEXSEND1 = '0A030003000C';
  // var sumBUF = crc16.checkSum(strHEXSEND1, {retType : 'buffer'});
  const strsumHEX1 = crc16.checkSum(strHEXSEND1);
  const ADCSensor = {
    TYPE: "485 ADC SENSOR",
    DTUID : 107,
    SENSORID : 10,
    MODBUS : '030003000C',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  // ---------
  // RH SENSOR  // 140300000002
  // ---------
  const RHSensor102_02 = {
    TYPE:"485 RH SENSOR",
    DTUID : 102,
    SENSORID : 20,
    MODBUS : '0300000002',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  // ----------    
  // WATER LEAK // 280300020001
  //  2B 52 43 56 3A 31 30 30 2C 28 03 02 00 01 24 42 0D 0A
  // ----------
  // POWER METER
  // -----------
  // const strHEXSEND4A = '010300A00032';
  // AT,PWR MTR-1,100,1,03 00 6C 00 27,TRUE
  // const strHEXSEND4B = '0103006C0027';
  // AT,PWR MTR-2,100,1,03 00 A0 00 32,FALSE
  // ------------
  // AIR VELOCITY (ID=60)
  // ------------
  const AIRVELSensor001_60 = {
    TYPE:"485 AIRFLOW VELOCITY SENSOR",
    DTUID : 1,
    SENSORID : 60,
    MODBUS : '0300000002',
    HEXID : function() { return this.SENSORID.toString(16); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  // ------------
  // AIR VELOCITY (ID=61)
  // ------------
  const AIRVELSensor002_61 = {
    TYPE:"485 AIRFLOW VELOCITY SENSOR",
    DTUID : 2,
    SENSORID : 61,
    MODBUS : '0300000002',
    HEXID : function() { return this.SENSORID.toString(16); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  // ------------
  // AIR VELOCITY (ID=62)
  // ------------
  const AIRVELSensor003_62 = {
    TYPE:"485 AIRFLOW VELOCITY SENSOR",
    DTUID : 3,
    SENSORID : 62,
    MODBUS : '0300000002',
    HEXID : function() { return this.SENSORID.toString(16); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  //----------------------
  const SETGPIO102 = {
    TYPE: "SET GPIO",
    DTUID : 102,
    GPIO  : 1,
    STATE : 1,
    SENSORID : 999,
    MODBUS : '',
    MODBUS1 : '03006C0027',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return `AT+NS1=${this.DTUID},${this.GPIO},${this.STATE}\r\n` }
  }
  const SETGPIO107 = {
    TYPE: "SET GPIO",
    DTUID : 107,
    GPIO  : 1,
    STATE : 1,
    SENSORID : 999,
    MODBUS : '',
    MODBUS1 : '03006C0027',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return `AT+NS1=${this.DTUID},${this.GPIO},${this.STATE}\r\n` }
  }
  const GETGPIO102 = {
    TYPE: "SET GPIO",
    DTUID : 102,
    GPIO  : 1,
    STATE : 1,
    SENSORID : 999,
    MODBUS : '',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return `AT+NV1=${this.DTUID}\r\n` }
  }
  const GETGPIO107 = {
    TYPE: "SET GPIO",
    DTUID : 107,
    GPIO  : 1,
    STATE : 1,
    SENSORID : 999,
    MODBUS : '',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return `AT+NV1=${this.DTUID}\r\n` }
  }
  // ------------------------
  const PWRMTR107_01A = {
    TYPE:"485 POWER METER",
    DTUID : 107,
    SENSORID : 1,
    MODBUS : '0300A00032',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  const PWRMTR107_01B = {
    TYPE:"485 POWER METER",
    DTUID : 107,
    SENSORID : 1,
    MODBUS : '03006C0023',
    MODBUS1 : '03006C0027',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  // ----------------------
  const RESETDTU = {
    TYPE:"HARDWARE SETTING",
    DTUID : 999,
    SENSORID : 999,
    MODBUS : '',
    MODBUS1 : '03006C0027',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXA=102,AT+SRS\r\n';}
  };
  const CHECKSTATUSOFGATEWAY = {
    TYPE:"GATEWAY CHECKING",
    DTUID : 1156333088,
    SENSORID : 999,
    MODBUS : '',
    MODBUS1 : '03006C0027',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return `AT+TST=${this.DTUID},12345678\r\n`;}
  };
  const CHECKSTATUSOFDTU102 = {
    TYPE:"GATEWAY CHECKING",
    DTUID : 102,
    SENSORID : 999,
    MODBUS : '',
    MODBUS1 : '03006C0027',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return `AT+TST=${this.DTUID},87654321\r\n`;}
  };
  // --------------------------------
  const DTUCHECK_102 = {
    TYPE:"485 LORA DTU",
    DTUID : 107,
    SENSORID : 0,
    MODBUS  : '2B2B2B',
    MODBUS1 : '0300000002',
    HEXID   : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC     : function() { return crc16.checkSum( this.MODBUS); },
    CRC1    : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES   : function() { return 'AT+TXH=' + this.DTUID + ',' + this.MODBUS + this.CRC() + "\r\n";},
    BYTES1  : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  const CHECKDTUCONN = {
    TYPE:"LORA DTU CONNECTION",
    DTUID : 102,
    SENSORID : 999,
    MODBUS : '2B2B2B',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.MODBUS); },
    BYTES : function() { return `AT+TXH=${this.DTUID},${this.MODBUS + this.CRC()}\r\n`;}
  }
  const RESETPWRMETR = {
    TYPE      :'485 POWER METER',
    DTUID     :107,
    SENSORID  : 1,
    MODBUS    : '1000A000020400000000',
    HEXID     : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC       : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES     : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  // ---------------------------------
  const WTRLEAKSensor102_40 = {
    TYPE:"485 WATER LEAK SENSOR",
    DTUID : 102,
    SENSORID : 40,
    MODBUS : '0300020001',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return `AT+TXH=${this.DTUID},${this.HEXID() + this.MODBUS + this.CRC()}\r\n`;}
  }
  // -------------------------
  // ATCMNDArr.push(RESETDTU);
  // ATCMNDArr.push(CHECKSTATUSOFGATEWAY);
  // ATCMNDArr.push(GETGPIO102);
  // ATCMNDArr.push(SETGPIO1);
  // ATCMNDArr.push(GETGPIO107);
  // ATCMNDArr.push(GETGPIO2);
  // ATCMNDArr.push(DTUCHECK_102);
  //ATCMNDArr.push(SETGPIO1);
  //ATCMNDArr.push(SETGPIO2);
  //ATCMNDArr.push(CHECKDTUCONN);
  // ATCMNDArr.push(RHSensor102_02);
  //ATCMNDArr.push(WTRLEAKSensor102_40);
  // --------------------------
  ATCMNDArr.push(CHECKSTATUSOFDTU102);
  // ATCMNDArr.push(RESETPWRMETR);
  ATCMNDArr.push(PWRMTR107_01A);
  ATCMNDArr.push(PWRMTR107_01B);
  // ----------------------------
  const PWRMTR100_01A = {
    TYPE:"485 POWER METER",
    DTUID : 100,
    SENSORID : 1,
    MODBUS : '0300A00032',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }  
  const PWRMTR100_01B = {
    TYPE:"485 POWER METER",
    DTUID : 100,
    SENSORID : 1,
    MODBUS : '03006C0023',
    MODBUS1 : '03006C0027',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  const PWRMTR101_02A = {
    TYPE:"485 POWER METER",
    DTUID : 101,
    SENSORID : 2,
    MODBUS : '0300A00032',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }  
  const PWRMTR101_02B = {
    TYPE:"485 POWER METER",
    DTUID : 101,
    SENSORID : 2,
    MODBUS : '03006C0023',
    MODBUS1 : '03006C0027',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  // ---------------------------  
  const WTRPRESSURE200_01 = {
    TYPE:"485 WATER PRESSURE",
    DTUID : 200,
    SENSORID : 01,
    MODBUS1 : '0300000002',
    MODBUS : '0300020002',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }  
  const WTRPRESSURE201_02 = {
    TYPE:"485 WATER PRESSURE",
    DTUID : 201,
    SENSORID : 02,
    MODBUS1 : '0300000002',
    MODBUS : '0300020002',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  const WTRPRESSURE202_03 = {
    TYPE:"485 WATER PRESSURE",
    DTUID : 202,
    SENSORID : 03,
    MODBUS : '0300020002',
    MODBUS1 : '0300000002',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  const WTRPRESSURE203_13 = {
    TYPE:"485 WATER PRESSURE",
    DTUID : 203,
    SENSORID : 13,
    MODBUS  : '0300000002',
    MODBUS1 : '0300020002',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  // ------------------------
  // ATCMNDArr.push(WTRPRESSURE200_01);
  // ---------------------------
  const WTRPRESSURE213_41SET = {
    TYPE:"485 WATER PRESSURE",
    DTUID : 213,
    SENSORID : 41,
    MODBUS  : '1001040002043FC00000',
    MODBUS1 : '0300000002',
    MODBUS2 : '0300020002',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  // ------------------------
  const WTRPRESSURE213_41 = {
    TYPE:"485 WATER PRESSURE",
    DTUID : 213,
    SENSORID : 41,
    MODBUS0  : '1001040002043FC00000',
    MODBUS1 : '0300000002',
    MODBUS2 : '0300020002',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  // ------------------------------
  // ATCMNDArr.push(WTRPRESSURE213_41SET);
  // ATCMNDArr.push(WTRPRESSURE203_13);
  // ---------------------------
  const PWRMTR102_03A = {
    TYPE:"485 POWER METER",
    DTUID : 102,
    SENSORID : 3,
    MODBUS : '0300A00032',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }  
  const PWRMTR102_03B = {
    TYPE:"485 POWER METER",
    DTUID : 102,
    SENSORID : 3,
    MODBUS : '03006C0023',
    MODBUS1 : '03006C0027',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  const PWRMTR103_04A = {
    TYPE:"485 POWER METER",
    DTUID : 103,
    SENSORID : 4,
    MODBUS : '0300A00032',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }  
  const PWRMTR103_04B = {
    TYPE:"485 POWER METER",
    DTUID : 103,
    SENSORID : 4,
    MODBUS : '03006C0023',
    MODBUS1 : '03006C0027',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  const PWRMTR104_05A = {
    TYPE:"485 POWER METER",
    DTUID : 104,
    SENSORID : 5,
    MODBUS : '0300A00032',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }  
  const PWRMTR104_05B = {
    TYPE:"485 POWER METER",
    DTUID : 104,
    SENSORID : 5,
    MODBUS : '03006C0023',
    MODBUS1 : '03006C0027',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  // --------------------
  const PWRMTR105_06A = {
    TYPE:"485 POWER METER",
    DTUID : 105,
    SENSORID : 6,
    MODBUS : '0300A00032',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }  
  const PWRMTR105_06B = {
    TYPE:"485 POWER METER",
    DTUID : 105,
    SENSORID : 6,
    MODBUS : '03006C0023',
    MODBUS1 : '03006C0027',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  const PWRMTR106_07A = {
    TYPE:"485 POWER METER",
    DTUID : 106,
    SENSORID : 7,
    MODBUS : '0300A00032',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }  
  const PWRMTR106_07B = {
    TYPE:"485 POWER METER",
    DTUID : 106,
    SENSORID : 7,
    MODBUS : '03006C0023',
    MODBUS1 : '03006C0027',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  const PWRMTR107_08A = {
    TYPE:"485 POWER METER",
    DTUID : 107,
    SENSORID : 1,
    MODBUS : '0300A00032',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }  
  const PWRMTR107_08B = {
    TYPE:"485 POWER METER",
    DTUID : 107,
    SENSORID : 1,
    MODBUS : '03006C0023',
    MODBUS1 : '03006C0027',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  // -----------------------------
  // ----------------------------
  const PWRMTR108_09A = {
    TYPE:"485 POWER METER",
    DTUID : 108,
    SENSORID : 9,
    MODBUS : '0300A00032',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }  
  const PWRMTR108_09B = {
    TYPE:"485 POWER METER",
    DTUID : 108,
    SENSORID : 9,
    MODBUS : '03006C0023',
    MODBUS1 : '03006C0027',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  const PWRMTR109_10A = {
    TYPE:"485 POWER METER",
    DTUID : 109,
    SENSORID : 10,
    MODBUS : '0300A00032',
    MODBUS1  : '06000500FF',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  const PWRMTR109_10B = {
    TYPE:"485 POWER METER",
    DTUID : 109,
    SENSORID : 10,
    MODBUS : '03006C0023',
    MODBUS1 : '03006C0027',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }  
  // -----------------------
  const PWRMTR200_01 = {
    TYPE:"485 WATER PRESSURE",
    DTUID : 200,
    SENSORID : 01,
    MODBUS : '0300000002',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }  
  const PWRMTR201_02 = {
    TYPE:"485 WATER PRESSURE",
    DTUID : 201,
    SENSORID : 02,
    MODBUS : '0300000002',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }  
  const PWRMTR202_03 = {
    TYPE:"485 WATER PRESSURE",
    DTUID : 202,
    SENSORID : 03,
    MODBUS : '0300000002',
    HEXID : function() { return (this.SENSORID + 0x10000).toString(16).substr(-2).toUpperCase(); },
    CRC : function() { return crc16.checkSum( this.HEXID() + this.MODBUS); },
    BYTES : function() { return 'AT+TXH=' + this.DTUID + ',' + this.HEXID() + this.MODBUS + this.CRC() + "\r\n";}
  }
  // --------------------------
  /*
  ATCMNDArr.push(PWRMTR200_01);
  ATCMNDArr.push(PWRMTR201_02);
  ATCMNDArr.push(PWRMTR202_03);
  */
  // --------------------------
  /*
  ATCMNDArr.push(ADCSensor);
  ATCMNDArr.push(RHSensor107_02);
  ATCMNDArr.push(CHECKDTUCONN);
  ATCMNDArr.push(AIRVELSensor001_60);
  ATCMNDArr.push(AIRVELSensor002_61);
  ATCMNDArr.push(AIRVELSensor003_62);
  // ATCMNDArr.push(PWRMTR100_01A);
  // ATCMNDArr.push(PWRMTR100_01B);
  /*
  ATCMNDArr.push(PWRMTR101_02A);
  ATCMNDArr.push(PWRMTR101_02B);
  ATCMNDArr.push(PWRMTR102_03A);
  ATCMNDArr.push(PWRMTR102_03B);
  ATCMNDArr.push(PWRMTR103_04A);
  ATCMNDArr.push(PWRMTR103_04B);
  ATCMNDArr.push(PWRMTR104_05A);
  ATCMNDArr.push(PWRMTR104_05B);
  */
  // ATCMNDArr.push(PWRMTR105_06A);
  // ATCMNDArr.push(PWRMTR105_06B);
  // ATCMNDArr.push(PWRMTR106_07A);
  // ATCMNDArr.push(PWRMTR106_07B);
  // ATCMNDArr.push(PWRMTR107_08A);
  // ATCMNDArr.push(PWRMTR107_08B);
  //ATCMNDArr.push(PWRMTR108_09A);
  //ATCMNDArr.push(PWRMTR108_09B);
  //ATCMNDArr.push(PWRMTR109_10A);
  //ATCMNDArr.push(PWRMTR109_10B);
  return ATCMNDArr;
 }

 // SEND TEST MESSAGE TO WHAT'S APP
 cli.responders.sendWhatsApp = function(str) {
  // ------------------
  // Get MESSAGE from string
  var arr = str.split('--');
  var Message = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
   // ------------------
   cli.horizontalLine();
   cli.centered('SENDING TEST MESSAGE TO WHATS APP..')
   cli.verticalSpace(0);
   // ------------------
   var instanceId = "26"; // TODO: Replace it with your gateway instance ID here
   var clientId = "caliew888@gmail.com"; // TODO: Replace it with your Forever Green client ID here
   var clientSecret = "74656835e5b04cb0b4e240bc6cd56009";  // TODO: Replace it with your Forever Green client secret here
   // ------------------------------
   var jsonPayload = JSON.stringify({
       group_admin: "6597668621", // TODO: Specify the WhatsApp number of the group creator, including the country code
       group_name: "IOT Monitoring Update",   // TODO:  Specify the name of the group
       message: Message  // TODO: Specify the content of your message
   });
   var options = {
     hostname: "api.whatsmate.net",
     port: 80,
     path: "/v3/whatsapp/group/text/message/" + instanceId,
     method: "POST",
     headers: {
         "Content-Type": "application/json",
         "X-WM-CLIENT-ID": clientId,
         "X-WM-CLIENT-SECRET": clientSecret,
         "Content-Length": Buffer.byteLength(jsonPayload)
     }
   };
   // ------------------------------------------
   var request = new http.ClientRequest(options);
   request.end(jsonPayload);  
   request.on('response', function (response) {
       console.log('Heard back from the WhatsMate WA Gateway:');
       console.log('Status code: ' + response.statusCode);
       response.setEncoding('utf8');
       response.on('data', function (chunk) {
           console.log(chunk);
           cli.horizontalLine();
       });
   }); 
 }
 
 // List Users
 cli.responders.listUsers = function(){
   cli.horizontalLine();
   _data.list('users',function(err,userIds){
     if(!err && userIds && userIds.length > 0){
       cli.verticalSpace(0);
       userIds.forEach(function(userId, index){
         _data.read('users',userId,function(err,userData){
           if(!err && userData){
             console.log(userData)
             cli.verticalSpace(0);
           }
         });
       });
       console.log('....')
     }
   });
 };
 
 // More user info
 cli.responders.moreUserInfo = function(str){
   cli.horizontalLine();
   // Get ID from string
   var arr = str.split('--');
   console.log(arr[1]);
   var userId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
   if(userId){
     // Lookup the user
     _data.read('users',userId,function(err,userData){
       if(!err && userData){
         // Remove the hashed password
         delete userData.hashedPassword;
 
         // Print their JSON object with text highlighting
         cli.verticalSpace();
         console.dir(userData,{'colors' : true});
         cli.verticalSpace();
       }
       cli.horizontalLine();
     });
   }
 };
 
 // List Checks
 cli.responders.listChecks = function(str){
   _data.list('checks',function(err,checkIds){
     if(!err && checkIds && checkIds.length > 0){
       cli.verticalSpace();
       checkIds.forEach(function(checkId){
         _data.read('checks',checkId,function(err,checkData){
           if(!err && checkData){
             console.log(checkData);
           }
         });
       });
     }
   });
 };
 
 // List Sensors
 cli.responders.listSensors = function(str){
   _data.list('sensors',function(err,checkIds){
     if(!err && checkIds && checkIds.length > 0){
       cli.verticalSpace();
       checkIds.forEach(function(checkId){
         _data.read('sensors',checkId,function(err,checkData){
           if(!err && checkData){
             console.log(checkData);
           }
         });
       });
     }
   });
 };
 
 // More check info
 cli.responders.moreCheckInfo = function(str){
   // Get ID from string
   var arr = str.split('--');
   var checkId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
   if(checkId){
     // Lookup the user
     _data.read('checks',checkId,function(err,checkData){
       if(!err && checkData){
 
         // Print their JSON object with text highlighting
         cli.verticalSpace();
         console.dir(checkData,{'colors' : true});
         cli.verticalSpace();
       }
     });
   }
 };
 
 // List Logs
 cli.responders.listLogs = function(){
   _logs.list(true,function(err,logFileNames){
     if(!err && logFileNames && logFileNames.length > 0){
       cli.verticalSpace();
       logFileNames.forEach(function(logFileName){
         if(logFileName.indexOf('-') > -1){
           console.log(logFileName);
           cli.verticalSpace();
         }
       });
     }
   });
 };
 
 // List Gateways
 cli.responders.listGateways = function() {
   var ActiveGateways = []
   if (_server.socketArr.length > 0 ){
     _server.socketArr.forEach( socket => {
       ActiveGateways.push(socket.GATEWAYID)
     })
   }
   // -----------------------------
   _data.list('gateways',function(err,checkIds){
     if(!err && checkIds && checkIds.length > 0){
       cli.verticalSpace();
       checkIds.forEach(function(checkId){
         _data.read('gateways',checkId,function(err,checkData){
           if(!err && checkData){
             if (ActiveGateways.indexOf(checkData.GATEWAYID) > -1)
               checkData.ACTIVE = 'ON';
             console.log(checkData);
           }
         });
       });
     }
   });
 }
 
 // More logs info
 cli.responders.moreLogInfo = function(str){
   // Get logFileName from string
   var arr = str.split('--');
   var logFileName = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
   if(logFileName){
     cli.verticalSpace();
     // Decompress it
     _logs.decompress(logFileName,function(err,strData){
       if(!err && strData){
         // Split it into lines
         var arr = strData.split('\n');
         arr.forEach(function(jsonString){
           var logObject = helpers.parseJsonToObject(jsonString);
           if(logObject && JSON.stringify(logObject) !== '{}'){
             console.dir(logObject,{'colors' : true});
             cli.verticalSpace();
           }
         });
       }
     });
   }
 };
 
 // Input processor
 cli.processInput = function(str){
   str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : false;
   // Only process the input if the user actually wrote something, otherwise ignore it
   if(str){
     // Codify the unique strings that identify the different unique questions allowed be the asked
     var uniqueInputs = [
       'man',
       'help',
       'exit',
       'stats',
       'list users',
       'more user info',
       'list gateways',
       'list checks',
       'list sensors',
       'more check info',
       'list logs',
       'list timers',
       'set timers on',
       'set timers off',
       'more log info',
       'list sockets',
       'read file',
       'send testsockets',
       'send testdtu',
       'send whatsapp'
     ];
     // Go through the possible inputs, emit event when a match is found
     var matchFound = false;
     var counter = 0;
     uniqueInputs.some(function(input){
       if(str.toLowerCase().indexOf(input) > -1){
         matchFound = true;
         // Emit event matching the unique input, and include the full string given
         e.emit(input,str);
         return true;
       }
     });
     // If no match is found, tell the user to try again
     if(!matchFound){
       console.log("COMMAND NOT VALID".red);
     }
   }
 };
 
 // Init script
 cli.init = function(){
 
   // Start the interface
   var _interface = readline.createInterface({
     input: process.stdin,
     output: process.stdout,
     prompt: '',
     terminal:false
   });
 
   // Create an initial prompt
   _interface.prompt();
 
   // Handle each line of input separately
   _interface.on('line', function(str){
     // Send to the input processor
     cli.processInput(str);
     // Re-initialize the prompt afterwards
     _interface.prompt();
   });
 
   // If the user stops the CLI, kill the associated process
   _interface.on('close', function(){
     process.exit(0);
   });
 
 };
 
 // Export the module
 module.exports = cli;
 