const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {check, validationResult} = require('express-validator');

const Alerts = require('../models/Alert');

const _logs = require('../lib/logs');

// @route     GET api/alerts
// @desc      Get all alerts
// @access    Private
router.get('/', auth, async (req, res) => {
  // -------------------------------------
  // AUTH MIDDLEWARE WILL VERIFY THE TOKEN
  //  ------------------------------------
  try {
    let totalLines = Number(req.query.totalLines);
    // -------
    const query = { };
    Alerts.find(query).exec((error,alerts) => {
      res.status(200).json(alerts);
    })
    // --------
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


let app = {};

// AJAX Client (for RESTful API)
app.client = {};
// Interface for making API calls
app.client.request = function (headers,path,method,queryStringObject,payload,callback) {
  // ------------
  // Set defaults
  // app.client.request(undefined,"api/sensors","GET",sensorDataQueryString,undefined,function
  //----------------------------------------------------------------------
  headers = typeof headers == "object" && headers !== null ? headers : {};
  path = typeof path == "string" ? path : "/";
  method = typeof method == "string" && ["POST", "GET", "PUT", "DELETE"].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : "GET";
  queryStringObject = typeof queryStringObject == "object" && queryStringObject !== null ? queryStringObject : {};
  payload = typeof payload == "object" && payload !== null ? payload : {};
  callback = typeof callback == "function" ? callback : false;
  // --------------
  console.log('.....CHECK POINT (1).....')
  // For each query string parameter sent, add it to the path
  var requestUrl = path + "?";
  var counter = 0;
  // -------------
  for (var queryKey in queryStringObject) {
    if (queryStringObject.hasOwnProperty(queryKey)) {
      counter++;
      // If at least one query string parameter has already been added, preprend new ones with an ampersand
      if (counter > 1) {
        requestUrl += "&";
      }
      // Add the key and value
      requestUrl += queryKey + "=" + queryStringObject[queryKey];
    }
  }
  // ------------------------------------
  // Form the http request as a JSON type
  // ------------------------------------
  console.log('.....CHECK POINT (2).....')
  // --------------------------------
  //  XMLHttpRequest is built-in in browsers environments, but it's not built-in in a Node environment, 
  //  so it's not defined, thus the error. You'll have to install the xmlhttprequest package 
  //  through NPM to use it with Node.
  // ---------------------------------
  // var xhr = new XMLHttpRequest();
  // xhr.open(method, requestUrl, true);
  // xhr.setRequestHeader("Content-type", "application/json");
  // -------------------------------------------
  // For each header sent, add it to the request
  // -------------------------------------------
  // for (var headerKey in headers) {
  //   if (headers.hasOwnProperty(headerKey)) {
  //     xhr.setRequestHeader(headerKey, headers[headerKey]);
  //   }
  // }
  console.log('.....CHECK POINT (3).....')
  // -------------------------------------------------------------
  // If there is a current session token set, add that as a header
  // -------------------------------------------------------------
  // if (app.config.sessionToken) {
  //   xhr.setRequestHeader("token", app.config.sessionToken.id);
  // }
  console.log('.....CHECK POINT (4).....')
  // ------------------------------------------------
  // When the request comes back, handle the response
  // ------------------------------------------------
  // xhr.onreadystatechange = function () {
  //   if (xhr.readyState == XMLHttpRequest.DONE) {
  //     var statusCode = xhr.status;
  //     var responseReturned = xhr.responseText;
  //     // Callback if requested
  //     if (callback) {
  //       try {
  //         var parsedResponse = JSON.parse(responseReturned);
  //         callback(statusCode, parsedResponse);
  //       } catch (e) {
  //         callback(statusCode, false);
  //       }
  //     }
  //   }
  // };
  // ------------------------
  // Send the payload as JSON
  // ------------------------
  // var payloadString = JSON.stringify(payload);
  // xhr.send(payloadString);
};
function DownLoadData(strSensorLabel) {
  // ------------------------
  let downloadDataQueryString = { id: strSensorLabel };
  app.client.request(undefined,"api/sensors/data","GET",downloadDataQueryString,undefined,function (statusCode, sensorData) {
    // -------------
    if (!sensorData && statusCode != 200)
      return;
    // -----------------
    let exportData = [];
    let sensor = sensorTypeMap[strSensorLabel];
    let factor = (sensor.ratingMIN && sensor.ratingMAX) ? sensor.ratingMAX/sensor.ratingMIN : 1.0;
    console.log('....[' + sensor.sensortype + ']....');
    // -----------------
    if (sensorData.data) {
      sensorData.data.forEach((data) => {
        var _Date = new Date(data.TIMESTAMP);
        _Date = _Date.toLocaleDateString([], {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        });
        // -----------
        let variables = [];
        let readings = [];
        // --------------------
        switch (sensor.sensortype) {
          case 'POWER METER SENSOR (485)':        // 485 POWER METER
            // PConsumption = (responsePayload1.DATAS1[1]/100*100/5).toFixed(2);
            // P  = `${responsePayload1.DATAS2[9]}${responsePayload1.DATAS2[10]}`;
            // Q  = `${responsePayload1.DATAS2[11]}${responsePayload1.DATAS2[12]}`;
            // S  = `${responsePayload1.DATAS2[13]}${responsePayload1.DATAS2[14]}`;
            // PF = `${responsePayload1.DATAS2[15]}`;
            // F  = `${responsePayload1.DATAS2[16]}`;
            // PA = `${responsePayload1.DATAS2[17]}${responsePayload1.DATAS2[18]}`;
            // PB = `${responsePayload1.DATAS2[19]}${responsePayload1.DATAS2[20]}`;
            // PC = `${responsePayload1.DATAS2[21]}${responsePayload1.DATAS2[22]}`;
            variables.push("A-VOLTAGE");
            variables.push("B-VOLTAGE");
            variables.push("C-VOLTAGE");
            variables.push("A-CURRENT");
            variables.push("B-CURRENT");
            variables.push("C-CURRENT");
            variables.push("ELECT.ENERGY");
            variables.push("FREQ");
            variables.push("POWER FACTOR");
            readings.push(data.DATAS2[0] / 10.0);
            readings.push(data.DATAS2[1] / 10.0);
            readings.push(data.DATAS2[2] / 10.0);
            readings.push(((data.DATAS2[3] * 100 + data.DATAS2[4]) / 1000) * factor);
            readings.push(((data.DATAS2[5] * 100 + data.DATAS2[6]) / 1000) * factor);
            readings.push(((data.DATAS2[7] * 100 + data.DATAS2[8]) / 1000) * factor);
            readings.push(((data.DATAS1[1] / 100) * 100) / 5);
            readings.push(data.DATAS2[16] / 10.0);
            readings.push(data.DATAS2[15] / 100.0);
            break;
          case 'ADC CONVERTOR (485)':             // 485 ADC
            variables.push("GPIO1");
            variables.push("GPIO2");
            variables.push("GPIO3");
            variables.push("GPIO4");
            readings.push(data.DATAS[0]);
            readings.push(data.DATAS[1]);
            readings.push(data.DATAS[2]);
            readings.push(data.DATAS[3]);
            break;
          case 'WI-SENSOR RH SENSOR (LORA)':
            variables.push("TEMPERATURE");
            variables.push("HUMIDITY");
            readings.push(data.Temperature);
            readings.push(data.Humidity);       
            break;
          case 'RH SENSOR (485)':                 // 485 RH SENSORS
            variables.push("TEMPERATURE C");
            variables.push("HUMIDITY %");
            readings.push(data.DATAS[0] / 10.0);
            readings.push(data.DATAS[1] / 10.0);
            break;
          case 'AIR FLOW RH SENSOR (485)':        // 485 AIRFLOW TEMPERATURE
            variables.push("TEMPERATURE C");
            variables.push("HUMIDITY %");
            readings.push(data.DATAS[1] / 10.0);
            readings.push(data.DATAS[0] / 10.0);
            break;
          case 'AIR FLOW VELOCITY SENSOR (485)':  // 485 AIRFLOW VELOCITY
            variables.push('VELOCITY [1]m/s');
            variables.push('FLOW RATE[2]m3/hr');
            readings.push(data.DATAS[0] / 10.0);
            readings.push(data.DATAS[1] / 10.0);
            break;
          case 'WATER LEAK SENSOR (485)':         // 485 WATER LEAK DETECTOR
            variables.push("WATER DETECTED");
            readings.push(data.DATAS[0]);
            break;
          case 'WATER TEMPERATURE (485)':         // 485 WATER TEMPERATURE
            variables.push('TEMPERATURE[1]');
            variables.push('TEMPERATURE[2]');
            readings.push(data.DATAS[0] / 10.0);
            readings.push(data.DATAS[1] / 10.0);
            break;
          case 'WATER PRESSURE (485)':            // 485 WATER PRESSURE
            variables.push('PRESSURE[1]');
            variables.push('PRESSURE[2]');
            readings.push(data.DATAS[0] / 10.0);
            readings.push(data.DATAS[1] / 10.0);
            break;
          default:
            break;
        }
        // -----------------------------
        let count = 0;
        let dataObject = {};
        dataObject["TIMESTAMP"] = _Date;
        variables.forEach((variable) => {
          dataObject[variable] = readings[count];
          count += 1;
        });
        // -------------------------
        exportData.push(dataObject);
      });
      // -------------
      console.log(exportData[0]);
      var stringData = JSON.stringify(exportData);
      var csv = this.convertToCSV(stringData);
      // -------------
      var exportedFilenmae = strSensorLabel + ".csv" || "export.csv";
      // -------------
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, exportedFilenmae);
      } else {
        var link = document.createElement("a");
        if (link.download !== undefined) {
          // feature detection
          // Browsers that support HTML5 download attribute
          var url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", exportedFilenmae);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    }
  });
}

module.exports = router;
