/*
 * Tracking Gateway Status via Server Connection Socket
 */

// Dependencies
var _data = require("./data");
var _logs = require("./logs");
var util = require("util");
var debug = util.debuglog("workers");

// Instantiate the Decoder module object
var gatewayTracker = {};

gatewayTracker.INSERT = function (gatewayData, callback) {
  //  ---------------------
  // Append to Gateway File
  // ----------------------
  _data.update("gateways", gatewayData.GATEWAYID, gatewayData, function (err) {
    // ---------
    if (err) {
      _data.create("gateways",gatewayData.GATEWAYID,gatewayData,
        function (err) {
          if (!err) {
            console.log("New Gateway Created");
          } else {
            console.log("Could not create the new Gateway");
          }
        }
      );
    }
    // ---------
    // Convert the data to a string
    var _gatewayData = {
      PORT : gatewayData.PORT,
      GATEWAYID: gatewayData.deviceID,
      ADDRESS  : gatewayData.clientAddress,
      TIMESTAMP: gatewayData.TIMESTAMP
    }
    delete _gatewayData.SOCKET;
    var logString = JSON.stringify(_gatewayData);
    // --------------
    // Stored in Logs
    // --------------
    _logs.append(gatewayData.GATEWAYID, logString, function (err) {
      // ---------
      // gatewayData.PORT === 1008 && console.log('.[GATEWAYTRACKER].'.green + 'PORT [' + String(gatewayData.PORT).green + '] GATEWAY ID<' + gatewayData.GATEWAYID.green + '>');
      // gatewayData.PORT === 1009 && console.log('.[GATEWAYTRACKER].'.green + 'PORT [' + String(gatewayData.PORT).yellow + '] GATEWAY ID<' + gatewayData.GATEWAYID.yellow + '>');
      // gatewayData.PORT === 1010 && console.log('.[GATEWAYTRACKER].'.green + 'PORT [' + String(gatewayData.PORT).red + '] GATEWAY ID<' + gatewayData.GATEWAYID.red + '>');
      // ---------
      if (!err) {
        debug("Logging to file succeeded");
      } else {
        debug("Logging to file failed");
      }
    });
  });
};

// Export the decoders
module.exports = gatewayTracker;
