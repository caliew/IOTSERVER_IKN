/*
 * Frontend Logic for application
 *
 */
// Container for frontend application

let app = {};
let sensortypeKEY = [];
let sensorGroup;
let sensorTypeMap;
let sensorDataMap;
// ---------------
// Config
app.config = { sessionToken: false };
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
  var xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader("Content-type", "application/json");
  // -------------------------------------------
  // For each header sent, add it to the request
  // -------------------------------------------
  for (var headerKey in headers) {
    if (headers.hasOwnProperty(headerKey)) {
      xhr.setRequestHeader(headerKey, headers[headerKey]);
    }
  }
  // -------------------------------------------------------------
  // If there is a current session token set, add that as a header
  // -------------------------------------------------------------
  if (app.config.sessionToken) {
    xhr.setRequestHeader("token", app.config.sessionToken.id);
  }
  // ------------------------------------------------
  // When the request comes back, handle the response
  // ------------------------------------------------
  xhr.onreadystatechange = function () {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      var statusCode = xhr.status;
      var responseReturned = xhr.responseText;
      // Callback if requested
      if (callback) {
        try {
          var parsedResponse = JSON.parse(responseReturned);
          callback(statusCode, parsedResponse);
        } catch (e) {
          callback(statusCode, false);
        }
      }
    }
  };
  // ------------------------
  // Send the payload as JSON
  // ------------------------
  var payloadString = JSON.stringify(payload);
  xhr.send(payloadString);
};

// ----------------------
// Bind the logout button
// ----------------------
app.bindLogoutButton = function () {
  // --------------------------------------------
  console.log('..[APP.JS].. INIT > app.bindLogoutButton')
  // --------------------------------------------
  document
    .getElementById("logoutButton")
    .addEventListener("click", function (e) {
      // Stop it from redirecting anywhere
      e.preventDefault();
      // Log the user out
      console.log("1..app.logUserOut");
      app.logUserOut();
    });
};

// -----------------------------------
// Log the user out then redirect them
// -----------------------------------
app.logUserOut = function (redirectUser) {
  // --------------------------------------------
  console.log("..[APP.JS].. INIT > APP.logUserOut");
  // --------------------------------------------
  // Set redirectUser to default to true
  redirectUser = typeof redirectUser == "boolean" ? redirectUser : true;
  // Get the current token id
  var tokenId = typeof app.config.sessionToken.id == "string" ? app.config.sessionToken.id : false;
  // Send the current token to the tokens endpoint to delete it
  var queryStringObject = {
    id: tokenId,
  };
  app.client.request(undefined,"api/tokens","DELETE",queryStringObject,undefined,function (statusCode, responsePayload) {
      // Set the app.config token as false
      app.setSessionToken(false);
      // Send the user to the logged out page
      if (redirectUser) {
        console.log("2..app/tokens DELETE...");
        window.location = "/session/deleted";
      }
    }
  );
};

// --------------
// Bind the forms
// --------------
app.bindForms = function () {
  // --------------------------------------------
  console.log("..[APP.JS].. INIT > app.bindForms");
  // --------------------------------------------
  if (document.querySelector("form")) {
    var allForms = document.querySelectorAll("form");
    for (var i = 0; i < allForms.length; i++) {
      allForms[i].addEventListener("submit", function (e) {
        // -----------------------
        // Stop it from submitting
        // -----------------------
        e.preventDefault();
        var formId = this.id;
        var path = this.action;
        var method = this.method.toUpperCase();
        // -----------------------
        // Hide the error message (if it's currently shown due to a previous error)
        // ----------------------
        document.querySelector("#" + formId + " .formError").style.display = "none";
        // ------------------------
        // Hide the success message (if it's currently shown due to a previous error)
        // ------------------------
        if (document.querySelector("#" + formId + " .formSuccess")) {
          document.querySelector("#" + formId + " .formSuccess").style.display = "none";
        }
        // ------------------------------
        // Turn the inputs into a payload
        // ------------------------------
        var payload = {};
        var elements = this.elements;
        for (var i = 0; i < elements.length; i++) {
          if (elements[i].type !== "submit") {
            // ----------------------------------------------------
            // Determine class of element and set value accordingly
            // ----------------------------------------------------
            var classOfElement = typeof elements[i].classList.value == "string" && elements[i].classList.value.length > 0
                ? elements[i].classList.value : "";
            var valueOfElement = elements[i].type == "checkbox" && classOfElement.indexOf("multiselect") == -1
                ? elements[i].checked : classOfElement.indexOf("intval") == -1 ? elements[i].value : parseInt(elements[i].value);
            var elementIsChecked = elements[i].checked;
            // --------------------------------------------------------------
            // Override the method of the form if the input's name is _method
            // --------------------------------------------------------------
            var nameOfElement = elements[i].name;
            if (nameOfElement == "_method") {
              method = valueOfElement;
            } else {
              // ----------------------------------------------------------------------------------
              // Create an payload field named "method" if the elements name is actually httpmethod
              // ----------------------------------------------------------------------------------
              if (nameOfElement == "httpmethod") {
                nameOfElement = "method";
              }
              // -----------------------------------------------------------------------
              // Create an payload field named "id" if the elements name is actually uid
              // -----------------------------------------------------------------------
              if (nameOfElement == "uid") {
                nameOfElement = "id";
              }
              // -----------------------------------------------------------------------------
              // If the element has the class "multiselect" add its value(s) as array elements
              // -----------------------------------------------------------------------------
              if (classOfElement.indexOf("multiselect") > -1) {
                if (elementIsChecked) {
                  payload[nameOfElement] = typeof payload[nameOfElement] == "object" && payload[nameOfElement] instanceof Array
                      ? payload[nameOfElement] : [];
                  payload[nameOfElement].push(valueOfElement);
                }
              } else {
                payload[nameOfElement] = valueOfElement;
              }
            }
          }
        }
        // --------------------------------------------------------------------------
        // If the method is DELETE, the payload should be a queryStringObject instead
        // --------------------------------------------------------------------------
        var queryStringObject = method == "DELETE" ? payload : {};
        // ------------
        // Call the API
        // ------------
        app.client.request(undefined,path,method,queryStringObject,payload,function (statusCode, responsePayload) {
            // --------------------------------------
            // Display an error on the form if needed
            // --------------------------------------
            if (statusCode !== 200) {
              if (statusCode == 403) {
                // ----------------
                // log the user out
                // ----------------
                console.log("2...app.logUserOut");
                // app.logUserOut();
              } else {
                // -----------------------------------------------------------------
                // Try to get the error from the api, or set a default error message
                // -----------------------------------------------------------------
                var error = typeof responsePayload.Error == "string" ? responsePayload.Error : "An error has occured, please try again";
                // -------------------------------------------
                // Set the formError field with the error text
                // -------------------------------------------
                document.querySelector("#" + formId + " .formError").innerHTML = error;
                // ----------------------------------------------
                // Show (unhide) the form error field on the form
                // ----------------------------------------------
                document.querySelector("#" + formId + " .formError").style.display = "block";
              }
            } else {
              // ----------------------------------------------
              // If successful, send to form response processor
              // ----------------------------------------------
              app.formResponseProcessor(formId, payload, responsePayload);
            }
          }
        );
      });
    }
  }
};

// -----------------------
// Form response processor
// -----------------------
app.formResponseProcessor = function (formId, requestPayload, responsePayload) {
  // --------------------------------------------
  console.log("..[APP.JS].. INIT > app.formResponseProcessor");
  // --------------------------------------------
  var functionToCall = false;
  // If account creation was successful, try to immediately log the user in
  console.log("..[app.js].. formId..%", formId);
  // ------------------------------
  if (formId == "accountCreate") {
    // Take the phone and password, and use it to log the user in
    var newPayload = {
      phone: requestPayload.phone,
      password: requestPayload.password,
    };
    app.client.request(undefined,"api/tokens","POST",undefined,newPayload,function (newStatusCode, newResponsePayload) {
        // Display an error on the form if needed
        if (newStatusCode !== 200) {
          // Set the formError field with the error text
          document.querySelector("#" + formId + " .formError").innerHTML =
            "Sorry, an error has occured. Please try again.";
          // Show (unhide) the form error field on the form
          document.querySelector("#" + formId + " .formError").style.display =
            "block";
        } else {
          // If successful, set the token and redirect the user
          app.setSessionToken(newResponsePayload);
          window.location = "/checks/all";
        }
      }
    );
  }
  // If login was successful, set the token in localstorage and redirect the user
  if (formId == "sessionCreate") {
    app.setSessionToken(responsePayload);
    // Divert to Home Page
    window.location = "/";
  }
  // If forms saved successfully and they have success messages, show them
  var formsWithSuccessMessages = [
    "accountEdit1",
    "accountEdit2",
    "checksEdit1",
    "sensorsEdit1",
  ];
  // ----------------
  if (formsWithSuccessMessages.indexOf(formId) > -1) {
    document.querySelector("#" + formId + " .formSuccess").style.display =
      "block";
  }
  // If the user just deleted their account, redirect them to the account-delete page
  if (formId == "accountEdit4") {
    console.log("3..app.logUserOut");
    // app.logUserOut(false);
    window.location = "/account/deleted";
  }
  // If the user just created a new check successfully, redirect back to the dashboard
  if (formId == "checksCreate") {
    window.location = "/checks/all";
  }
  // If the user just deleted a check, redirect them to the dashboard
  if (formId == "checksEdit1") {
    window.location = "/checks/all";
  }
  // If the user just edit a check, redirect them to the dashboard
  if (formId == "checksEdit2") {
    // window.location = '/checks/all';
  }
  // If the user just created a new sensor sucessfully, redirect back to the dashboard
  if (formId == "sensorsCreate") {
    window.location = "checks/all";
  }
  // If the user just edit a new sensor sucessfully, redirect back to the dashboard
  if (formId == "sensorsEdit1") {
    window.location = "/";
  }
  // If the user just deleted a sensor, redirect back to the dashboard
  if (formId == "sensorsEdit2") {
    window.location = "checks/all";
  }
};

// ---------------------------------------------------------------------------
// Get the session token from localstorage and set it in the app.config object
// ---------------------------------------------------------------------------
app.getSessionToken = function () {
  // --------------------------------------------
  console.log('..[APP.JS].. INIT > app.getSessionToken')
  // --------------------------------------------
  var tokenString = localStorage.getItem("token");
  if (typeof tokenString == "string") {
    try {
      var token = JSON.parse(tokenString);
      app.config.sessionToken = token;
      if (typeof token == "object") {
        app.setLoggedInClass(true);
      } else {
        app.setLoggedInClass(false);
      }
    } catch (e) {
      app.config.sessionToken = false;
      app.setLoggedInClass(false);
    }
  }
};

// ------------------------------------------------
// Set (or remove) the loggedIn class from the body
// ------------------------------------------------
app.setLoggedInClass = function (add) {
  // --------------------------------------------
  console.log("..[APP.JS].. INIT > app.setLoggedInClass");
  // FETCH THE USER DATA
  if (app.config.sessionToken) {
    app.client.request(undefined,"api/users","GET",app.config.sessionToken,undefined,function (statusCode, responsePayload) {
        var userType = responsePayload.type;
        var headerDashboard = document.getElementsByClassName("loggedInAdmin");
        if (headerDashboard[0]) {
          if (statusCode == 200) {
            if (userType == "admin")
              headerDashboard[0].style.display = "inine-block";
            else headerDashboard[0].style.display = "none";
          }
        }
      }
    );
  }
  // --------------------------------------------
  var target = document.querySelector("body");
  if (add) {
    target.classList.add("loggedIn");
  } else {
    console.log("target.classList.remove(loggedIn)");
    target.classList.remove("loggedIn");
    //target.classList.remove('loggedInAdmin');
  }
};

// ----------------------------------------------------------------------
// Set the session token in the app.config object as well as localstorage
// ----------------------------------------------------------------------
app.setSessionToken = function (token) {
  // --------------------------------------------
  console.log("..[app.js].. app.setSessionToken");
  // --------------------------------------------
  app.config.sessionToken = token;
  var tokenString = JSON.stringify(token);
  localStorage.setItem("token", tokenString);
  if (typeof token == "object") {
    app.setLoggedInClass(true);
  } else {
    app.setLoggedInClass(false);
  }
};

// ---------------
// Renew the token
// ---------------
app.renewToken = function (callback) {
  // --------------------------------------------
  console.log("..[app.js].. app.renewToken");
  // --------------------------------------------
  var currentToken = typeof app.config.sessionToken == "object" ? app.config.sessionToken : false;
  if (currentToken) {
    // Update the token with a new expiration
    var payload = {
      id: currentToken.id,
      extend: true,
    };
    app.client.request(undefined,"api/tokens","PUT",undefined,payload,function (statusCode, responsePayload) {
        // Display an error on the form if needed
        if (statusCode == 200) {
          // Get the new token details
          var queryStringObject = { id: currentToken.id };
          app.client.request(undefined,"api/tokens","GET",queryStringObject,undefined,function (statusCode, responsePayload) {
              // Display an error on the form if needed
              if (statusCode == 200) {
                app.setSessionToken(responsePayload);
                callback(false);
              } else {
                app.setSessionToken(false);
                callback(true);
              }
            }
          );
        } else {
          app.setSessionToken(false);
          callback(true);
        }
      }
    );
  } else {
    app.setSessionToken(false);
    callback(true);
  }
};

// ---------------------
// Load data on the page
// ---------------------
app.loadDataOnPage = function () {
  // --------------------------------------------
  console.log("..[APP.JS].. INIT > app.loadDataOnPage");
  // ----------------------------------------
  // Get the current page from the body class
  // ----------------------------------------
  var bodyClasses = document.querySelector("body").classList;
  var primaryClass = typeof bodyClasses[0] == "string" ? bodyClasses[0] : false;
  //  --------------------
  console.log(`..[APP.JS].. LOADDATAONPAGE ..<${primaryClass.toUpperCase()}>..`);
  // Logic for Index Page
  switch (primaryClass) {
    case "index":
      app.LoadIndexPage();
      break;
    case "cardView":
      app.LoadCardViewPage();
      break;
    case 'systemView':
      app.LoadSystemViewPage();
      break;
    case "schedulesList":
      app.LoadSchedulePage();
      break;
    case "accountEdit":
      app.loadAccountEditPage();
      break;
    case "checksList":
      app.loadChecksListPage();
      break;
    case "checksEdit":
      app.loadChecksEditPage();
      break;
    case "sensorsCreate":
      app.loadSensorsCreatePage();
      break;
    case "sensorsEdit":
      app.loadSensorsEditPage();
      break;
    default:
      break;
  }
};

// --------------------------------
// Load the index page specifically
// --------------------------------
app.LoadIndexPage = function () {
  // --------------------------------------
  console.log("..[APP.JS].. <LoadIndexPage>");
  // --------------------------------------
  // Get the phone number from the current token, or log the user out if none is there
  let loading = document.getElementById('loading');
  var phone = typeof app.config.sessionToken.phone == "string" ? app.config.sessionToken.phone : false;
  if (phone) {
    // ------------
    // NOTICE BOARD
    // ------------
    app.client.request(undefined,"api/alerts","GET",app.config.sessionToken,undefined,function (statusCode, responsePayload) {
      // -------------------
      if (statusCode == 403) {
        let sessionStop = document.createElement("div");
        sessionStop.innerHTML = `<img src="../public/icons/clock.png" style='text-align:center'></img><h1>SESSION ENDED. PLEASE LOGIN AGAIN</h1>`
        loading.after(sessionStop);
        if (loading) {
          loading.remove();
        }
        return;
      }
      // -------------------
      var message;
      let _dateTime0;
      message = "<hr>NOTICE BOARD : ALERT MESSAGES<hr>";
      var noticeboard = document.getElementsByClassName("blurb-TITLE");
      //  ----------------------------------------------
      for (i = 0; i < responsePayload.data.length; i++) {
        let _dateTime = new Date(responsePayload.data[i].datetime);
        if (i == 0) {
          message += _dateTime.toLocaleDateString("en-GB") + "<br> ";
          _dateTime0 = _dateTime;
        }
        if (_dateTime0.toDateString() !== _dateTime.toDateString()) {
          _dateTime0 = _dateTime;
          message += _dateTime.toLocaleDateString("en-GB") + "<br> ";
        }
        message += `${_dateTime.toLocaleTimeString([], {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })} 
                  ${responsePayload.data[i].message} <br>`;
        if (i > 3) i = responsePayload.length;
      }
      noticeboard[0].innerHTML = message;
    });
    // ----------------------------------------------
    let loading = document.getElementById('loading');
    // -----------------------------
    // LISTING OF CHECKS AND SENSORS
    // -----------------------------
    sensorDataMap = {};
    sensorTypeMap = {};
    sensorGroup;
    // ----------------
    sensortypeKEY = [];
    // -------------
    const promise = new Promise((resolve, reject) => {
      app.client.request(undefined,"api/users","GET",app.config.sessionToken,undefined,function (statusCode, responsePayload) {
        if (statusCode != 200) {
          reject(403);
          return;
        }
        if (!responsePayload)
          return
        // -----------------------------------
        // DETERMINE SENSORS OWNED BY THE USER
        // -----------------------------------
        let allSensors = typeof responsePayload.sensors == "object" && responsePayload.sensors instanceof Array && responsePayload.sensors.length > 0 ? responsePayload.sensors : [];
        //  -------------------------------------------------
        //  Show each created SENSOR as a new row in the table
        //  -------------------------------------------------
        let counter = 0;
        let allSensorsObjects = [];
        // ------------------------------------
        allSensors.forEach(function (sensorId) {
          //  ------------------------------------------
          //  Get the data for the SENSOR ASSIGN TO USER
          //  ------------------------------------------
          var newQueryStringObject = { id: sensorId };
          app.client.request(undefined,"api/sensors","GET",newQueryStringObject,undefined,function (statusCode, responsePayload) {
              if (statusCode == 200) {
                allSensorsObjects.push(responsePayload);
                ++counter;
                if (counter >= allSensors.length) {
                  // -----------------------------------
                  // GROUPING OF SENSORS BY SENSOR TYPES
                  // -----------------------------------
                  sensorGroup = allSensorsObjects.reduce((acc, value) => {
                    // Group initialization
                    if (!acc[value.sensortype]) {
                      acc[value.sensortype] = [];
                      sensortypeKEY.push(value.sensortype);
                    }
                    // Grouping
                    acc[value.sensortype].push(value);
                    return acc;
                  }, {});
                  // ------
                  console.log(`..[APP.JS].. <LoadIndexPage> SENSOR=<${allSensors.length}> MAP GROUP=[${sensortypeKEY.length}]`)
                  resolve(200);
                }
              } else {
                console.log("Error trying to load check ID: ", sensorId);
              }
            }
          );
        });
      });
    });
    promise.then((response) => {
      // ------------------
      sensortypeKEY.sort();
      // insertSensorVisibilityGroup(sensortypeKEY);
      // ----------------------------------------
      // POPULATE THROUGH GROUPING OF SENSOR TYPE
      //  ---------------------------------------
      var table = document.getElementById("sensorsListTable");
      table.style.display = "block";
      table.style.marginLeft = "auto";
      table.style.marginRight = "auto";
      var x = document.createElement("TBODY");
      table.appendChild(x);
      // -------------------
      var sensorCounter = 0;
      let nSensorGroup = 0;
      sensortypeKEY.forEach((key) => {
        // ----------------------------
        var Sensors = sensorGroup[key];
        let nCountSensor = 0;
        // ----------------------------
        Sensors.forEach((sensor) => {
          let strSensorLabel;
          let highlight = false;
          if (sensor.dtuid > 0)
            strSensorLabel = sensor.dtuid + "-" + sensor.sensorid;
          else strSensorLabel = sensor.sensorid;
          //  -----------------
          //  POPULATE THE TABLE
          //  -----------------
          let sensorDataQueryString = { id: strSensorLabel };
          app.client.request(undefined,"api/sensors","GET",sensorDataQueryString,undefined, function (statusCode1, responsePayload1) {
            // ---------------
            ++nCountSensor;
            if (statusCode1== 200 && responsePayload1) {
              sensorTypeMap[strSensorLabel] = sensor;
              let sensorData = sensor;
              let factor  = 1;
              //  ------------------------------------
              //  Make the check data into a table row
              //  ------------------------------------
              var tr = x.insertRow(-1);
              tr.setAttribute('id',`${sensorData.dtuid}_${sensorData.sensorid}`)
              //  --------------
              //  td0 = Index       td1 = DateTime    td2 = SensorType  td3 = SensorName
              //  td4 = Reading     td7 = Sparkline   td8 = Functions
              //  --------------
              var td0 = tr.insertCell(0);
              var td1 = tr.insertCell(1);
              var td2 = tr.insertCell(2);
              var td3 = tr.insertCell(3);
              var td4 = tr.insertCell(4);
              var td5 = tr.insertCell(5);
              var td6 = tr.insertCell(6);
              var td7 = tr.insertCell(7);
              var td8 = tr.insertCell(8);
              var td9 = tr.insertCell(9);
              // ------------------------
              sensorCounter++;
              //  -------------
              let _sensorType;
              td3.innerHTML = sensor.dtuid;
              td4.innerHTML = String(sensor.sensorid).toUpperCase();
              td5.innerHTML = (sensor.ratingMIN && sensor.ratingMAX) ? `${sensor.sensorname}<BR>RATING=${sensor.ratingMAX}|${sensor.ratingMIN}` : `${sensor.sensorname}<BR>RATING=1|1`
              // -------------------------------
              _sensorType = "-";
              _sensorReading = "-";
              // ------------------
              var _Date = new Date(responsePayload1.TIMESTAMP);
              let timeDiff = (new Date() - _Date) / 1000 / 60 / 60;
              //  ----------------------------
              getDataCardView(sensor,responsePayload1,function(data){
                // -------------------
                td0.innerHTML = timeDiff > 2.0 ? sensorCounter + '<img src="../public/icons/broken-link.png"/>' : sensorCounter;
                td1.innerHTML = _Date.toLocaleDateString([], {hour12: false, hour: "2-digit",minute: "2-digit"});
                td2.innerHTML = data._sensorType;
                td6.innerHTML = data._sensorReading;
                //  ------------
                //  ALERT LIMITS
                //  ------------
                if (sensorData.upperlimit1) {
                  let alertText;
                  if (
                    sensor.sensortype == "WATER LEAK SENSOR (485)" ||
                    sensor.sensortype == "AIR FLOW VELOCITY SENSOR (485)"
                  ) {
                    alertText = `${sensorData.label1}:${sensorData.lowerlimit1}/${sensorData.upperlimit1}<br>`;
                  } else {
                    alertText = `${sensorData.label1}:${sensorData.lowerlimit1}/${sensorData.upperlimit1}<br>
                  ${sensorData.label2}:${sensorData.lowerlimit2}/${sensorData.upperlimit2}`;
                  }
                  td7.innerHTML = `${alertText}`;
                }
                // ---------------
                // SPARKLINE PLOTS
                // ---------------
                let sparklinePlot = `<span id=${sensor.id}A></span>`;
                if (sensorData.sensortype == "POWER METER SENSOR (485)")
                  sparklinePlot += `<br><span id=${sensor.id}B></span><br><span id=${sensor.id}C></span>`;
                //  --------------
                td8.innerHTML = sparklinePlot;
                td9.innerHTML =
                  `<a href="/sensors/edit?id=${sensor.id}"><img src="../public/icons/edit.png"></a>` +
                  `<img src="../public/icons/save-file-option.png" onClick="(function() {DownLoadData('${strSensorLabel}');})()">` +
                  `<img src="../public/icons/analytics.png" onClick="(function() {DataAnalysis('${strSensorLabel}','${sensor.dtuid}_${sensor.sensorid}');})()">`;
                //  --------------------
                //  SENSOR DATA FOR PLOT
                //  --------------------
                app.client.request(undefined,"api/sensors/data","GET",sensorDataQueryString,undefined,function (statusCode, sensorData) {
                  if (statusCode != 200)
                    return
                  if (!sensorData)
                    return;
                  //  --------------------
                  sensorDataMap[strSensorLabel] = [];
                  getSparkLineData(sensor,sensorData,function(data){
                    // ----------------------------------------
                    sensorDataMap[strSensorLabel].push(data.data1C);
                    sensorDataMap[strSensorLabel].push(data.data2C);
                    sensorDataMap[strSensorLabel].push(data.data3C);
                    sensorDataMap[strSensorLabel].push(data.data4C);
                    sensorDataMap[strSensorLabel].push(data.data5C);
                    sensorDataMap[strSensorLabel].push(data.data6C);
                    sensorDataMap[strSensorLabel].push(data.data7C);
                    sensorDataMap[strSensorLabel].push(data.data8C);
                    sensorDataMap[strSensorLabel].push(data.data9C);
                    // ---------------------------------------------
                    const config1A = getConfig1A(PARAM1A1,PARAM1A2,sensor.lowerlimit,sensor.upperlimit);
                    const config1B = getConfig1B(PARAM1B1, PARAM1B2);
                    const config1C = getConfig1C(PARAM1C1, PARAM1C2);
                    $(`#${sensor.id}A`).sparkline(data.data1, config1A).sparkline(data.data2, config1B).sparkline(data.data3, config1C);
                    // --------------------
                    if (data4.length > 0) {
                      const config2A = getConfig1A(PARAM2A1,PARAM2A2,sensor.lowerlimit,sensor.upperlimit);
                      const config2B = getConfig1B(PARAM2B1, PARAM2B2);
                      const config2C = getConfig1C(PARAM2C1, PARAM2C2);
                      const config3A = getConfig1A(PARAM3A1,PARAM3A2,sensor.lowerlimit,sensor.upperlimit);
                      const config3B = getConfig1B(PARAM3B1, PARAM3B2);
                      const config3C = getConfig1C(PARAM3C1, PARAM3C2);
                      $(`#${sensor.id}B`).sparkline(data.data4, config2A).sparkline(data.data5, config2B).sparkline(data.data6, config2C);
                      $(`#${sensor.id}C`).sparkline(data.data7, config3A).sparkline(data.data8, config3B).sparkline(data.data9, config3C);
                    }
                  });
                  if (data._highlight == true) tr.classList.add("highlight");
                });
                //  ------------
              })
            }
            if (nCountSensor > Sensors.length-1 ) {
              ++nSensorGroup;
            }
          });
        });
      });
    })
    .then((response1) => {
      let loading = document.getElementById('loading');
      if (loading) {
        loading.remove();
      }
    })
    .catch((response) => {
      let sessionStop = document.createElement("div");
      sessionStop.innerHTML = `<img src="../public/icons/clock.png" style='text-align:center'></img><h1>SESSION ENDED. PLEASE LOGIN AGAIN</h1>`
      loading.after(sessionStop);
      if (loading) {
        loading.remove();
      }
      return;
    });
  } else {
    let sessionStop = document.createElement("div");
    sessionStop.innerHTML = `<img src="../public/icons/clock.png" style='text-align:center'></img><h1>SESSION ENDED. PLEASE LOGIN AGAIN</h1>`
    loading.after(sessionStop);
    if (loading) {
      console.log('.....loading.....')
      loading.remove();
    }
    console.log('..FAILED TO LOGIN DUE TO INVALID LOGIN ID ...');
  }
  // --------------
  let reportWebVitals = require('./reportWebVitals');
};

// -------------
// Data Download
// -------------
function DownLoadData(strSensorLabel) {
  // ------------------------
  let downloadDataQueryString = { id: strSensorLabel };
  app.client.request(undefined,"api/sensors/data","GET",downloadDataQueryString,undefined,function (statusCode, sensorData) {
    // -------------
    if (!sensorData && statusCode != 200)
      return;
    // -----------------
    let exportData = [];
    let sensor  = sensorTypeMap[strSensorLabel];
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
// --------------
// Data Analytics
// --------------
function ClosedAnalytics() {
  //  ------------------------------------------------
  let selChart = document.getElementById('FullChart');
  // -----------------------------
  if(selChart)  
    selChart.remove();
}
function DataAnalysis(strSensorLabel,divid) {
  // ------------------------------------
  if (!sensorDataMap[strSensorLabel])
    return;
  // ------------------------------------
  let selRow = document.getElementById(divid);
  let selChart = document.getElementById('FullChart');
  // -----------------------------
  if(selChart)  selChart.remove();
  // ---------------------------------------------------
  let FullChartViewDiv = document.createElement("tr");
  let InsertRow = document.createElement('td');
  let link = document.createElement('div');
  let div = document.createElement("div");
  // ---------------------------------------------
  FullChartViewDiv.setAttribute("id",`FullChart`);
  div.setAttribute("id",`eChart`);
  div.classList.add('echartSystem')
  FullChartViewDiv.classList.add(`chartView-blurb`);
  InsertRow.setAttribute('colspan',10);
  // ----------------------------------
  div.innerHTML = `..CHART..<${divid}>...[${strSensorLabel}]...`;
  // (function() {DataAnalysis('${strSensorLabel}','${sensorData.dtuid}_${sensorData.sensorid}');})()
  link.innerHTML = `<img src="../public/icons/close.png" onClick="(function() { ClosedAnalytics(); })()"></img>`
  link.classList.add('eChartCloseIcon')
  InsertRow.appendChild(link)
  InsertRow.appendChild(div);
  // insertRow.appendChild(link);
  FullChartViewDiv.appendChild(InsertRow);
  selRow.after(FullChartViewDiv);
  // ------------------------
  LoadEchart(strSensorLabel);
  // ------------------------
}
function LoadEchart(strSensorLabel) {
  // --------------------------------
  if (!sensorDataMap[strSensorLabel] || !sensorTypeMap[strSensorLabel])
    return;
    // --------------------------------------
  let sensor = sensorTypeMap[strSensorLabel];
  let PlotData = sensorDataMap[strSensorLabel];
  let _date = [];
  let _data1 = [];
  let _data2 = [];
  let _data3 = [];
  let _data4 = [];
  let _data5 = [];
  let _data6 = [];
  let _data7 = [];
  let _data8 = [];
  let _data9 = [];
  let _label1;
  let _label2;
  let _label3;
  let _label4;
  let _label5;
  let _label6;
  let _label7;
  let _label8;
  let _yAxisIndex1;
  let _yAxisIndex2;
  let _yAxisIndex3;
  let _yAxisIndex4;
  let _yAxisIndex5;
  let _yAxisIndex6;
  let _yAxisIndex7;
  let _yAxisIndex8;
  // ---------------------
  let nCOUNT = 0;
  let nPARAM = 0;
  var stepType;
  // --------------------------
  switch (sensor.sensortype) {
    case 'POWER METER SENSOR (485)':
      nPARAM = 8;
      _label1 = 'VA(V)';
      _label2 = 'VB(V)';
      _label3 = 'VC(V)';
      _label4 = 'IA(A)';
      _label5 = 'IB(A)';
      _label6 = 'IC(A)';
      _label7 = 'ENERGY(kWH)';
      _label8 = 'CONSUMPTION(kWH)';
      _yAxisIndex1 = 0;
      _yAxisIndex2 = 0;
      _yAxisIndex3 = 0;
      _yAxisIndex4 = 1;
      _yAxisIndex5 = 1;
      _yAxisIndex6 = 1;
      _yAxisIndex7 = 2;
      _yAxisIndex8 = 3;
      stepType = 'middle';
      break;
    case 'WI-SENSOR RH SENSOR (LORA)':
      nPARAM = 2;
      _label1 = sensor.label1;
      _label2 = sensor.label2;
      _yAxisIndex1 = 0;
      _yAxisIndex2 = 1;
      break;
    case 'ADC CONVERTOR (485)':
      _label1 = sensor.label1;
      _label2 = sensor.label2;
      _label3 = sensor.label3;
      _label4 = sensor.label4;
      _label5 = sensor.label5;
      _label6 = sensor.label6;
      _yAxisIndex1 = 0;
      _yAxisIndex2 = 0;
      _yAxisIndex3 = 0;
      _yAxisIndex4 = 0;
      _yAxisIndex5 = 0;
      _yAxisIndex6 = 0;
      nPARAM = 6;
      stepType = 'middle';
      break;
    case 'AIR FLOW RH SENSOR (485)':
      _label1 = sensor.label1;
      _label2 = sensor.label2;
      _yAxisIndex1 = 0;
      _yAxisIndex2 = 1;
      nPARAM = 2;
      stepType= null;
      break;
    case 'AIR FLOW VELOCITY SENSOR (485)':
      _label1 = sensor.label1;
      _label2 = sensor.label2;
      _yAxisIndex1 = 0;
      _yAxisIndex2 = 1;
      nPARAM = 2;
      stepType= null;
      break;
    case 'RH SENSOR (485)':
      _label1 = sensor.label1;
      _label2 = sensor.label2;
      _yAxisIndex1 = 0;
      _yAxisIndex2 = 1;
      nPARAM = 2;
      stepType = null;
      break;
    case 'WATER LEAK SENSOR (485)':
      _label1 = sensor.label1;
      _yAxisIndex1 = 0;
      nPARAM = 1;
      stepType = 'middle';
      break;
    case 'WATER TEMPERATURE (485)':
      _label1 = sensor.label1;
      _yAxisIndex1 = 0;
      nPARAM = 1;
      stepType = 'middle';
      break;
    case 'WATER PRESSURE (485)':
      _label1 = sensor.label1;
      _yAxisIndex1 = 0;
      nPARAM = 1;
      stepType = 'middle';
      break;
    default:
      nPARAM = 0;
      stepType = null;
      break;
  }
  // -----------------------------
  PlotData[0].forEach((data) => {
    if (data) {
      _date.push(data[0]);
      if (PlotData[0].length > 0  )  _data1.push(data[1]);
      if (nPARAM > 1 && PlotData[1].length > 0 )  _data2.push(PlotData[1][nCOUNT][1]);
      if (nPARAM > 2 && PlotData[2].length > 0 )  _data3.push(PlotData[2][nCOUNT][1]);
      if (nPARAM > 3 && PlotData[3].length > 0 )  _data4.push(PlotData[3][nCOUNT][1]);
      if (nPARAM > 4 && PlotData[4].length > 0 )  _data5.push(PlotData[4][nCOUNT][1]);
      if (nPARAM > 5 && PlotData[5].length > 0 )  _data6.push(PlotData[5][nCOUNT][1]);
      if (nPARAM > 6 && PlotData[6].length > 0 )  _data7.push(PlotData[6][nCOUNT][1]);
      if (nPARAM > 7 && PlotData[7].length > 0 )  _data8.push(PlotData[7][nCOUNT][1]);
    }
    nCOUNT += 1;
  })
  // --------------------------------------------
  // based on prepared DOM, initialize echarts instance
  var myChart1 = echarts.init(document.getElementById('eChart'));
  // -------------------
  var colors = ['#74226C', '#FF7733', '#2B59C3', '#C03221', '#686963', '#785964', '#000000', '#F55D3E', '#F7CB15'];
  let option1 = {
    color: colors,
    tooltip: {
        trigger: 'none',
        axisPointer: { type: 'cross' }
    },
    legend: { 
      data:[_label1, _label2, _label3, _label4, _label5, _label6, _label7, _label8],
      left: 1,
      width: 380
    },
    grid: { top: 70, bottom: 60 },
    xAxis: [
      {
          type: 'category',
          axisTick: { alignWithLabel: true },
          axisLine: { onZero: false, lineStyle: { color: 'black' } },
          axisPointer: { label: { 
            formatter: function (params) {
              let _DateTime = new Date(params.value);
              let _XLabel = `${_DateTime.toLocaleDateString()}\r\n${_DateTime.toLocaleTimeString()}`
              return _XLabel + (params.seriesData.length ? '：' + params.seriesData[0].data + '|' + params.seriesData[1].data: '');}}},
          data: _date
      }
    ],
    yAxis: [ 
      { name: sensor.label1, type: 'value', 
        min : function(value) { return value.min;},
        max : function(value) { return value.max;} },
      { name: sensor.label2, nameLocation: 'start', type: 'value',
        min : function(value) { return value.min;},
        max : function(value) { return value.max;} },
      { name: sensor.label3, nameLocation: 'start', type: 'value',
        min : function(value) { return value.min;},
        max : function(value) { return value.max;} },
      { name: sensor.label3, nameLocation: 'start', type: 'value',
        min : function(value) { return value.min;},
        max : function(value) { return value.max;} }  
    ],
    toolbox: {
        show: true,
        feature: {
            dataZoom: { yAxisIndex: 'none' },
            dataView: {readOnly: false},
            restore: {},
            saveAsImage: {}
        }
    },
    dataZoom: [{
        type: 'inside',
        start: 0,
        end: 35
    }, {
        start: 0,
        end: 100
    }],
    series: [
      {
          name: _label1,
          type: 'line',
          symbol: 'none',
          sampling: 'lttb',
          yAxisIndex: _yAxisIndex1,
          step : stepType,
          markPoint: { data: [ {type: 'max', name: 'MAX'},{type: 'min', name: 'MIN'} ] },
          markLine: { data: [ {type: 'average', name: 'AVG'} ] },
          data: _data1
      },
      {
          name: _label2,
          type: 'line',
          symbol: 'none',
          sampling: 'lttb',
          yAxisIndex: _yAxisIndex2,
          step : stepType,
          markPoint: { data: [ {type: 'max', name: 'MAX'}, {type: 'min', name: 'MIN'} ] },
          markLine: { data: [{type: 'average', name: 'AVG'}] },
          data: _data2
      },
      {
          name: _label3,
          type: 'line',
          symbol: 'none',
          sampling: 'lttb',
          yAxisIndex: _yAxisIndex3,
          step : stepType,
          markPoint: { data: [ {type: 'max', name: 'MAX'}, {type: 'min', name: 'MIN'} ] },
          markLine: { data: [{type: 'average', name: 'AVG'}] },
          data: _data3
      },
      {
          name: _label4,
          type: 'line',
          symbol: 'none',
          sampling: 'lttb',
          yAxisIndex: _yAxisIndex4,
          step : stepType,
          markPoint: { data: [ {type: 'max', name: 'MAX'}, {type: 'min', name: 'MIN'} ] },
          markLine: { data: [{type: 'average', name: 'AVG'}] },
          data: _data4
      },
      {
          name: _label5,
          type: 'line',
          symbol: 'none',
          sampling: 'lttb',
          yAxisIndex: _yAxisIndex5,
          step : stepType,
          markPoint: { data: [ {type: 'max', name: 'MAX'}, {type: 'min', name: 'MIN'} ] },
          markLine: { data: [{type: 'average', name: 'AVG'}] },
          data: _data5
      },
      {
          name: _label6,
          type: 'line',
          symbol: 'none',
          sampling: 'lttb',
          yAxisIndex: _yAxisIndex6,
          step : stepType,
          markPoint: { data: [ {type: 'max', name: 'MAX'}, {type: 'min', name: 'MIN'} ] },
          markLine: { data: [{type: 'average', name: 'AVG'}] },
          data: _data6
      },
      {
          name: _label7,
          type: 'line',
          symbol: 'none',
          sampling: 'lttb',
          yAxisIndex: _yAxisIndex7,
          step : stepType,
          markPoint: { data: [ {type: 'max', name: 'MAX'}, {type: 'min', name: 'MIN'} ] },
          markLine: { data: [{type: 'average', name: 'AVG'}] },
          data: _data7
      },
      {
          name: _label8,
          type: 'line',
          symbol: 'none',
          sampling: 'lttb',
          yAxisIndex: _yAxisIndex8,
          step : stepType,
          markPoint: { data: [ {type: 'max', name: 'MAX'}, {type: 'min', name: 'MIN'} ] },
          markLine: { data: [{type: 'average', name: 'AVG'}] },
          data: _data8
      }
    ]
  };
  myChart1.setOption(option1);

}
function ReloadData(strSensorLabel,strDivID) {
  // ------------------------------------------------
  var sensorDataQueryString = { id: strSensorLabel };
  // ------------------------------------------------
  app.client.request(undefined,"api/sensors","GET",sensorDataQueryString,undefined,function (statusCode, responsePayload) {
    // --------------------------
    if (!responsePayload && statusCode != 200) 
      return;
    // ---------------
    let highlight = false;
    let _sensorReading;
    let _Date = new Date(responsePayload.TIMESTAMP);
    let timeDiff = (new Date() - _Date) / 1000 / 60 / 60;
    let _timeLabel = _Date.toLocaleDateString([], {hour12: false,hour: "2-digit",minute: "2-digit"});
    let sensor = sensorTypeMap[strSensorLabel];
    //  ---------------------------------------------
    let _flag = timeDiff > 2.0 ? true : false;
    factor = (sensor.ratingMIN && sensor.ratingMAX) ? sensor.ratingMAX/sensor.ratingMIN : 1.0;
    _timeLabel = timeDiff > 2.0 ? _timeLabel + '<img src="../public/icons/broken-link.png"/>' : _timeLabel;
    // LORA SENSOR (WI-SENSOR:Wi-SHT10)
    if (responsePayload.modelType == "Wi-SHT10") {
      // -- WI-SHT100 --
          _sensorReading = `${responsePayload.Temperature}C ${responsePayload.Humidity}%`;
          highlight = responsePayload.Humidity > sensor.upperlimit2 ? true : false;
          highlight = responsePayload.Temperature > sensor.upperlimit1 ? true : false;
      // -- WI-SHT100 --
    } else {
      // 485 SENSORS
      switch (sensor.sensortype) {
        case "WI-SENSOR RH SENSOR (LORA)" :
          break;
        case "AIR FLOW VELOCITY SENSOR (485)":
          // -- 485 AIRFLOW SENSOR -
          _sensorReading = `${responsePayload.DATAS[0] / 10.0} m/s<br>${responsePayload.DATAS[1]}m3/hr`;
          break;
        case "AIR FLOW RH SENSOR (485)":
          // -- 485 AIRFLOW RH SENSOR --
          _sensorReading = `${responsePayload.DATAS[0]/10.0}% ${responsePayload.DATAS[1] / 10.0}C`;
          highlight = responsePayload.DATAS[0] / 10.0 > sensor.upperlimit1 ? true : false;
          highlight = responsePayload.DATAS[1] / 10.0 > sensor.upperlimit2 ? true : false;
          break;
        case "RH SENSOR (485)":
          // -- 485 RH SENSOR --
          let dbHumd = Number(responsePayload.DATAS[0]/10.0);
          let dbTemp = Number(responsePayload.DATAS[1]/10.0);
          _sensorReading = `${dbHumd}% ${dbTemp}C`;
          highlight = responsePayload.DATAS[0] / 10.0 > sensor.upperlimit1 ? true : false;
          highlight = responsePayload.DATAS[1] / 10.0 > sensor.upperlimit2 ? true : false;
          break;
        case "WATER TEMPERATURE (485)":
          // -- 485 ANALOG DIGITAL CONVERTOR --
          _sensorReading = `|${responsePayload.DATAS[0] / 10.0 }|${responsePayload.DATAS[1] / 10.0}|<br>${responsePayload.RCV_BYTES}`;
          highlight = responsePayload.DATAS[0] <= 0.0 ? true : false; 
          highlight = responsePayload.DATAS[1] <= 0.0 ? true : false;
          break;
        case "WATER PRESSURE (485)":
          // -- 485 ANALOG DIGITAL CONVERTOR --
          _sensorReading = `|${responsePayload.DATAS[0] / 10.0 }|${responsePayload.DATAS[1] / 10.0}|<br>${responsePayload.RCV_BYTES}`;
          highlight = responsePayload.DATAS[0] <= 0.0 ? true : false;
          highlight = responsePayload.DATAS[1] <= 0.0 ? true : false;
          break;
        case "ADC CONVERTOR (485)":
          // -- 485 ANALOG DIGITAL CONVERTOR --
          _sensorReading = `|${responsePayload.DATAS[0] / 10.0}|${responsePayload.DATAS[1] / 10.0}|<br>${responsePayload.RCV_BYTES}`;
          highlight = responsePayload.DATAS[0] <= 0.0 ? true : false;
          highlight = responsePayload.DATAS[1] <= 0.0 ? true : false;
          break;
        case "WATER LEAK SENSOR (485)":
          // -- 485 WATER LEAK --
          let state = parseInt(responsePayload.DATAS[0]);
          if (state == 2) _sensorReading = `${state}.. WATER DETECTED<br>${responsePayload.RCV_BYTES}`;
          if (state != 2) _sensorReading = `${state}.. NO WATER DETECTED<br>${responsePayload.RCV_BYTES}`;
          highlight = responsePayload.DATAS[0] >= sensor.upperlimit1 ? true : false;
          break;
        case "POWER METER SENSOR (485)":
          // -- 485 POWER METER --
          let PConsumption, IA, IB, IC;
          let F, UA, UB, UC;
          if (responsePayload.DATAS1)
            PConsumption = (responsePayload.DATAS1[1] / 100).toFixed(2);
          // -----------
          if (sensor.ratingMAX && sensor.ratingMIN) factor = sensor.ratingMAX/sensor.ratingMIN;
          // ----------------------------
          IA = responsePayload.DATAS2[3] * 100 + responsePayload.DATAS2[4];
          IB = responsePayload.DATAS2[5] * 100 + responsePayload.DATAS2[6];
          IC = responsePayload.DATAS2[7] * 100 + responsePayload.DATAS2[8];
          IA = ((IA / 1000) * factor).toFixed(2);
          IB = ((IB / 1000) * factor).toFixed(2);
          IC = ((IC / 1000) * factor).toFixed(2);
          // -------
          F = `${responsePayload.DATAS2[16]}`;
          // -------------
          UA = `${responsePayload.DATAS2[0] / 10.0}`;
          UB = `${responsePayload.DATAS2[1] / 10.0}`;
          UC = `${responsePayload.DATAS2[2] / 10.0}`;
          // -------------
          _sensorReading = `ACT.E=${PConsumption}kWh<BR>FREQ=${F/100.0}Hz<BR>UA=${UA}V IA=${IA}A<BR>UB=${UB}V IB=${IB}A<BR>UC=${UC}V IC=${IC}A`;
          highlight = UA > parseFloat(sensor.upperlimit1) || UC > parseFloat(sensor.upperlimit1) || UC > parseFloat(sensor.upperlimit1)
              ? true : false;
          highlight = IA > parseFloat(sensor.upperlimit2) || IB > parseFloat(sensor.upperlimit2) || IC > parseFloat(sensor.upperlimit2)
              ? true : false;
          break;
        default:
          console.log(`...SENSOR TYPE [${sensor.sensortype}]`)
          // --
          break;
      }
    }    
    // ---------------------------------------------
    let cardViewDiv = document.getElementById(strDivID);
    cardViewDiv.classList.remove('idle');
    cardViewDiv.classList.remove('alert');
    // ----------------------------------------------
    cardViewDiv.childNodes[0].innerHTML = _timeLabel;
    cardViewDiv.childNodes[4].innerHTML = _sensorReading;
    // ------------------------------------------
    if (_flag) cardViewDiv.classList.add("idle");
    if (highlight) cardViewDiv.classList.add("alert");
    // ----------------------------------------------------
    app.client.request(undefined,"api/sensors/data","GET",sensorDataQueryString,undefined,function (statusCode, sensorData) {
      //  ---------------
      if (statusCode == 200 && sensorData) {
        let sensor = sensorTypeMap[strSensorLabel];
        let factor = (sensor.ratingMIN && sensor.ratingMAX) ? sensor.ratingMAX/sensor.ratingMIN : 1.0;
        //  -----------------                      
        if (sensorData.data) {
          //  --------------------
          let data1C = [];
          let data2C = [];
          let data3C = [];
          let data4C = [];
          let data5C = [];
          let data6C = [];
          let data7C = [];
          let data8C = [];
          let data9C = [];
          // ------------
          let data1 = [];
          let data2 = [];
          let data3 = [];
          let data4 = [];
          let data5 = [];
          let data6 = [];
          let data7 = [];
          let data8 = [];
          let data9 = [];
          // ------------
          let dateTime0 = new Date(sensorData.data[0].TIMESTAMP);
          // --------------------
          for (var i = 0; i < sensorData.data.length; i++) {
            let dateTime1 = new Date(sensorData.data[i].TIMESTAMP);
            let dateTimeDIFF = dateTime0 - dateTime1;
            const minuteLapse = parseInt(dateTimeDIFF / 1000 / 60);
            // --------------------
            if (minuteLapse > 35) {
              data1C.push([dateTime1,null]);
              data2C.push([dateTime1,null]);
              data3C.push([dateTime1,null]);
              data4C.push([dateTime1,null]);
              data5C.push([dateTime1,null]);
              data6C.push([dateTime1,null]);
              data7C.push([dateTime1,null]);
              data8C.push([dateTime1,null]);
              data9C.push([dateTime1,null]);
              // --------------------------
              data1.push(null);
              data2.push(null);
              data3.push(null);
              data4.push(null);
              data5.push(null);
              data6.push(null);
              data7.push(null);
              data8.push(null);
              data9.push(null);
            }
            dateTime0 = dateTime1;
            // --------------------------------
            if (sensor.sensortype) {
              // -------------------
              switch (sensor.sensortype) {
                case "WI-SENSOR RH SENSOR (LORA)":
                  PARAM1A1 = "";
                  PARAM1A2 = "C";
                  PARAM1B1 = "";
                  PARAM1B2 = "%";
                  PARAM1C1 = "";
                  PARAM1C2 = "";
                  data1C.push([dateTime1,Number(sensorData.data[i].Temperature)]);
                  data2C.push([dateTime1,Number(sensorData.data[i].Humidity)]);
                  data1.push(Number(sensorData.data[i].Temperature));
                  data2.push(Number(sensorData.data[i].Humidity));
                  PARAM2A1 = "";
                  PARAM2A2 = "";
                  PARAM2B1 = "";
                  PARAM2B2 = "";
                  PARAM2C1 = "";
                  PARAM2C2 = "";
                  break;
                case "RH SENSOR (485)":
                  PARAM1A1 = "";
                  PARAM1A2 = "%";
                  PARAM1B1 = "";
                  PARAM1B2 = "C";
                  PARAM1C1 = "";
                  PARAM1C2 = "";
                  const _Humd = Number(sensorData.data[i].DATAS[0]) / 10.0;
                  const _Temp = Number(sensorData.data[i].DATAS[1]) / 10.0;
                  data1C.push([dateTime1,_Humd]);
                  data2C.push([dateTime1,_Temp]);
                  data1.push(_Humd);
                  data2.push(_Temp);
                  PARAM2A1 = "";
                  PARAM2A2 = "";
                  PARAM2B1 = "";
                  PARAM2B2 = "";
                  PARAM2C1 = "";
                  PARAM2C2 = "";
                  break;
                case "AIR FLOW RH SENSOR (485)":
                  PARAM1A1 = "";
                  PARAM1A2 = "%";
                  PARAM1B1 = "";
                  PARAM1B2 = "C";
                  PARAM1C1 = "";
                  PARAM1C2 = "";
                  data1C.push([dateTime1,Number(sensorData.data[i].DATAS[0]) / 10.0]);
                  data2C.push([dateTime1,Number(sensorData.data[i].DATAS[1]) / 10.0]);
                  data1.push(Number(sensorData.data[i].DATAS[0]) / 10.0);
                  data2.push(Number(sensorData.data[i].DATAS[1]) / 10.0);
                  PARAM2A1 = "";
                  PARAM2A2 = "";
                  PARAM2B1 = "";
                  PARAM2B2 = "";
                  PARAM2C1 = "";
                  PARAM2C2 = "";
                  break;
                case "AIR FLOW VELOCITY SENSOR (485)":
                  PARAM1A1 = "";
                  PARAM1A2 = "";
                  PARAM1B1 = "";
                  PARAM1B2 = "";
                  PARAM1C1 = "";
                  PARAM1C2 = "";
                  data1C.push([dateTime1,Number(sensorData.data[i].DATAS[0]) / 10.0]);
                  data2C.push([dateTime1,Number(sensorData.data[i].DATAS[1])]);
                  data1.push(Number(sensorData.data[i].DATAS[0]) / 10.0);
                  data2.push(Number(sensorData.data[i].DATAS[1]));
                  PARAM2A1 = "";
                  PARAM2A2 = "";
                  PARAM2B1 = "";
                  PARAM2B2 = "";
                  PARAM2C1 = "";
                  PARAM2C2 = "";
                  break;
                case 'WATER PRESSURE (485)':
                  PARAM1A1 = "";
                  PARAM1A2 = "Pa";
                  PARAM1B1 = "";
                  PARAM1B2 = "Pa";
                  PARAM1C1 = "";
                  PARAM1C2 = "";
                  data1C.push([dateTime1,Number(sensorData.data[i].DATAS[0]) / 10.0]);
                  data2C.push([dateTime1,Number(sensorData.data[i].DATAS[1]) / 10.0]);
                  data1.push(Number(sensorData.data[i].DATAS[0]) / 10.0);
                  data2.push(Number(sensorData.data[i].DATAS[1]) / 10.0);
                  PARAM2A1 = "";
                  PARAM2A2 = "";
                  PARAM2B1 = "";
                  PARAM2B2 = "";
                  PARAM2C1 = "";
                  PARAM2C2 = "";
                  break;
                case 'WATER TEMPERATURE (485)':
                  PARAM1A1 = "";
                  PARAM1A2 = "C";
                  PARAM1B1 = "";
                  PARAM1B2 = "C";
                  PARAM1C1 = "";
                  PARAM1C2 = "";
                  data1C.push([dateTime1,Number(sensorData.data[i].DATAS[0]) / 10.0]);
                  data2C.push([dateTime1,Number(sensorData.data[i].DATAS[1]) / 10.0]);
                  data1.push(Number(sensorData.data[i].DATAS[0]) / 10.0);
                  data2.push(Number(sensorData.data[i].DATAS[1]) / 10.0);
                  PARAM2A1 = "";
                  PARAM2A2 = "";
                  PARAM2B1 = "";
                  PARAM2B2 = "";
                  PARAM2C1 = "";
                  PARAM2C2 = "";
                  break;
                case "WATER LEAK SENSOR (485)":
                  PARAM1A1 = "";
                  PARAM1A2 = "";
                  PARAM1B1 = "";
                  PARAM1B2 = "";
                  PARAM1C1 = "";
                  PARAM1C2 = "";
                  data1C.push([dateTime1,Number(sensorData.data[i].DATAS[0])]);
                  data1.push(Number(sensorData.data[i].DATAS[0]));
                  PARAM2A1 = "";
                  PARAM2A2 = "";
                  PARAM2B1 = "";
                  PARAM2B2 = "";
                  PARAM2C1 = "";
                  PARAM2C2 = "";
                  break;
                case "POWER METER SENSOR (485)":
                  PARAM1A1 = "A";
                  PARAM1A2 = "V";
                  PARAM1B1 = "B";
                  PARAM1B2 = "V";
                  PARAM1C1 = "C";
                  PARAM1C2 = "V";
                  PARAM2A1 = "A";
                  PARAM2A2 = "A";
                  PARAM2B1 = "B";
                  PARAM2B2 = "A";
                  PARAM2C1 = "C";
                  PARAM2C2 = "A";
                  // ------------
                  let UA = `${Number(sensorData.data[i].DATAS2[0]) / 10.0}`;
                  let UB = `${Number(sensorData.data[i].DATAS2[1]) / 10.0}`;
                  let UC = `${Number(sensorData.data[i].DATAS2[2]) / 10.0}`;
                  // -------------
                  let IA = Number(sensorData.data[i].DATAS2[3]) * 100 + Number(sensorData.data[i].DATAS2[4]);
                  let IB = Number(sensorData.data[i].DATAS2[5]) * 100 + Number(sensorData.data[i].DATAS2[6]);
                  let IC = Number(sensorData.data[i].DATAS2[7]) * 100 + Number(sensorData.data[i].DATAS2[8]);
                  IA = ((IA / 1000) * factor).toFixed(2);
                  IB = ((IB / 1000) * factor).toFixed(2);
                  IC = ((IC / 1000) * factor).toFixed(2);
                  // ------------------------------------
                  if (isNaN(UA) || isNaN(UB) || isNaN(UC) || isNaN(IA) || isNaN(IB) || isNaN(IC)) {
                        console.log(`..UA=${UA}..UB=${UB}..UC=${UC}`);
                        console.log(`..IA=${IA}..IB=${IB}..IC=${IC}`);
                  }
                  else {
                    data1C.push([dateTime1,UA]);
                    data2C.push([dateTime1,UB]);
                    data3C.push([dateTime1,UC]);
                    data4C.push([dateTime1,IA]);
                    data5C.push([dateTime1,IB]);
                    data6C.push([dateTime1,IC]);
                    data1.push( UA );
                    data2.push( UB );
                    data3.push( UC );
                    data4.push( IA );
                    data5.push( IB );
                    data6.push( IC );
                    // ------------
                    let TP, P;
                    P = 0;
                    TP = ((Number(sensorData.data[i].DATAS1[1]) / 100) * factor ).toFixed(2);
                    data7C.push([dateTime1,parseFloat(TP)]);
                    data7.push(parseFloat(TP));
                    if (i < sensorData.data.length - 1) P = ((Number(sensorData.data[i].DATAS1[1]) - Number(sensorData.data[i + 1].DATAS1[1])) / 100) * factor;
                    data8C.push([dateTime1,parseFloat(P)]);
                    data8.push(parseFloat(P));
                  }
                  PARAM3A1 = "Total";
                  PARAM3A2 = "Kwh";
                  PARAM3B1 = "Cons";
                  PARAM3B2 = "kWh";
                  PARAM3C1 = "";
                  PARAM3C2 = "";
                  break;
                case "ADC CONVERTOR (485)":
                  PARAM1A1 = "";
                  PARAM1A2 = "";
                  PARAM1B1 = "";
                  PARAM1B2 = "";
                  PARAM1C1 = "";
                  PARAM1C2 = "";
                  data1C.push([dateTime1,sensorData.data[i].DATAS[0] / 10.0]);
                  data2C.push([dateTime1,sensorData.data[i].DATAS[1] / 10.0]);
                  data3C.push([dateTime1,sensorData.data[i].DATAS[2] / 10.0]);
                  data4C.push([dateTime1,sensorData.data[i].DATAS[3] / 10.0]);
                  data5C.push([dateTime1,sensorData.data[i].DATAS[4] / 10.0]);
                  data6C.push([dateTime1,sensorData.data[i].DATAS[5] / 10.0]);
                  data1.push([i,sensorData.data[i].DATAS[0] / 10.0]);
                  data2.push([i,sensorData.data[i].DATAS[1] / 10.0]);
                  data3.push([i,sensorData.data[i].DATAS[2] / 10.0]);
                  data4.push([i,sensorData.data[i].DATAS[3] / 10.0]);
                  data5.push([i,sensorData.data[i].DATAS[4] / 10.0]);
                  data6.push([i,sensorData.data[i].DATAS[5] / 10.0]);
                  break;
                default:
                  break;
              }
            }
          }
          // ---------------------
          sensorDataMap[strSensorLabel] = [];
          // ----------------------------------------
          sensorDataMap[strSensorLabel].push(data1C);
          sensorDataMap[strSensorLabel].push(data2C);
          sensorDataMap[strSensorLabel].push(data3C);
          sensorDataMap[strSensorLabel].push(data4C);
          sensorDataMap[strSensorLabel].push(data5C);
          sensorDataMap[strSensorLabel].push(data6C);
          sensorDataMap[strSensorLabel].push(data7C);
          sensorDataMap[strSensorLabel].push(data8C);
          sensorDataMap[strSensorLabel].push(data9C);
          // ----------------------------------------
          const config1A = getConfig1A(
            PARAM1A1,
            PARAM1A2,
            sensor.lowerlimit,
            sensor.upperlimit
          );
          const config1B = getConfig1B(PARAM1B1, PARAM1B2);
          const config1C = getConfig1C(PARAM1C1, PARAM1C2);
          $(`#${sensor.id}A`)
            .sparkline(data1, config1A)
            .sparkline(data2, config1B)
            .sparkline(data3, config1C);
          // --------------------
          if (data4.length > 0) {
            const config2A = getConfig1A(
              PARAM2A1,
              PARAM2A2,
              sensor.lowerlimit,
              sensor.upperlimit
            );
            const config2B = getConfig1B(PARAM2B1, PARAM2B2);
            const config2C = getConfig1C(PARAM2C1, PARAM2C2);
            const config3A = getConfig1A(
              PARAM3A1,
              PARAM3A2,
              sensor.lowerlimit,
              sensor.upperlimit
            );
            const config3B = getConfig1B(PARAM3B1, PARAM3B2);
            const config3C = getConfig1C(PARAM3C1, PARAM3C2);
            $(`#${sensor.id}B`)
              .sparkline(data4, config2A)
              .sparkline(data5, config2B)
              .sparkline(data6, config2C);
            $(`#${sensor.id}C`)
              .sparkline(data7, config3A)
              .sparkline(data8, config3B)
              .sparkline(data9, config3C);
          }
        }
      }
    });
  });
}

// -------------------
// Convert JSON to CSV
function convertToCSV(objArray) {
  var array = typeof objArray != "object" ? JSON.parse(objArray) : objArray;
  var str = "";
  for (var i = 0; i < array.length; i++) {
    var line = "";
    for (var index in array[i]) {
      if (line != "") line += ",";
      line += array[i][index];
    }
    str += line + "\r\n";
  }
  return str;
}
//  Sparkline Plot Config1A, Config1B, Config1C
function getConfig1A(PARAM1A1, PARAM1A2, LOWERLIMIT, UPPERLIMIT) {
  return {
    type: "line",
    height: "40px",
    lineColor: "red",
    normalRangeMin : LOWERLIMIT,
    normalRangeMax : UPPERLIMIT,
    normalRangeColor: "#ffff56",
    drawNormalOnTop: true,
    resize: true,
    barSpacing: "5",
    width: "130px",
    tooltipFormat: $.spformat(PARAM1A1 + " {{y}} " + PARAM1A2),
  };
}
function getConfig1B(PARAM1B1, PARAM1B2) {
  return {
    composite: true,
    lineColor: "blue",
    fillColor: "rgba(45, 153, 153, 0.1)",
    tooltipFormat: $.spformat(PARAM1B1 + " {{y}} " + PARAM1B2),
  };
}
function getConfig1C(PARAM1C1, PARAM1C2) {
  return {
    composite: true,
    lineColor: "green",
    fillColor: "rgba(45, 153, 153, 0.1)",
    tooltipFormat: $.spformat(PARAM1C1 + " {{y}} " + PARAM1C2),
  };
}

// -----------------------------------
// Load the cardView Page Specifically
// -----------------------------------
app.LoadCardViewPage = function () {
  // --------------------------------------
  console.log("..[APP.JS].. <LoadCardViewPage>");
  // console.log(config.mapBoxGLToken);
  // -----------------------------------------
  // Get the phone number from the current token, or log the user out if none is there
  let loading = document.getElementById('loading');
  var phone = typeof app.config.sessionToken.phone == "string" ? app.config.sessionToken.phone : false;
  if (phone) {
    //  -------------------------------------------------
    //  Show each created SENSOR as a new row in the table
    //  -------------------------------------------------    
    sensorDataMap = {};
    sensorTypeMap = {};
    sensorGroup;
    sensortypeKEY = [];
    // ----------------
    // -----------------------------------------------
    const promise = new Promise((resolve, reject) => {
      app.client.request(undefined,"api/users","GET",app.config.sessionToken,undefined,function (statusCode, responsePayload) {
        if (statusCode != 200){
          reject(203)
          return;
        }
        // -----------------------------------
        // DETERMINE SENSORS OWNED BY THE USER
        // -----------------------------------
        let allSensors = typeof responsePayload.sensors == "object" && responsePayload.sensors instanceof Array && responsePayload.sensors.length > 0 ? responsePayload.sensors : [];
        //  -------------------------------------------------
        //  Show each created SENSOR as a new row in the table
        //  -------------------------------------------------
        let counter = 0;
        let allSensorsObjects = [];
        // ------------------------------------
        allSensors.forEach(function (sensorId) {
          //  ------------------------------------------
          //  Get the data for the SENSOR ASSIGN TO USER
          //  ------------------------------------------
          var newQueryStringObject = { id: sensorId };
          app.client.request(undefined,"api/sensors","GET",newQueryStringObject,undefined,function (statusCode, responsePayload) {
            ++counter;
            if (statusCode != 200)
              return;
            if (!responsePayload)
              return;
            // ----------------
            allSensorsObjects.push(responsePayload);
            if (counter >= allSensors.length) {
              // -----------------------------------
              // GROUPING OF SENSORS BY SENSOR TYPES
              // -----------------------------------
              sensorGroup = allSensorsObjects.reduce((acc, value) => {
                // Group initialization
                if (!acc[value.sensortype]) {
                  acc[value.sensortype] = [];
                  sensortypeKEY.push(value.sensortype);
                }
                // Grouping
                acc[value.sensortype].push(value);
                return acc;
              }, {});
              console.log(`..[APP.JS].. <LoadCardViewPage> SENSOR=<${allSensors.length}> MAP GROUP=[${sensortypeKEY.length}]`)
              resolve(200);
            }
          });
        });
        // ------------------------------------
      });
    }).then((response) => {
      // ----------------------------------------
      // POPULATE THROUGH GROUPING OF SENSOR TYPE
      //  ---------------------------------------
      let ncountType = 0;
      sensortypeKEY.sort();
      insertSensorVisibilityGroup(sensortypeKEY);
      // ------------------
      sensortypeKEY.forEach((key) => {
        let Sensors = sensorGroup[key];
        let SensorTypeDiv = document.createElement("div");
        let SensorTypeViewDiv = document.createElement("div");
        SensorTypeDiv.setAttribute('id',`type-${ncountType}`);
        SensorTypeDiv.classList.add('cardView-type');
        SensorTypeViewDiv.classList.add(`cardView-container`);
        // SensorTypeViewDiv.setAttribute('id',`type-${ncountType}`);
        ncountType += 1;
        // -------------------------
        Sensors.forEach((sensor) => {
          let strSensorLabel;
          if (sensor.dtuid > 0)
            strSensorLabel = sensor.dtuid + "-" + sensor.sensorid;
          else strSensorLabel = sensor.sensorid;
          //  -----------------
          //  POPULATE THE TABLE
          //  -----------------
          var highlight = false;
          var sensorDataQueryString = { id: strSensorLabel, key, sensor  };
          // -------------------------------------------------
          app.client.request(undefined,"api/sensors","GET",sensorDataQueryString,undefined,function (statusCode1, responsePayload1) {
            var sensorData = sensor;
            sensorTypeMap[strSensorLabel] = sensor;
            // ---------------
            let factor = 1;
            //  ------------------------------------
            //  Make the check data into a table row
            //  ------------------------------------
            //  td0 = Index       td1 = DateTime    td2 = SensorType  td3 = SensorName
            //  td4 = Reading     td7 = Sparkline   td8 = Functions
            //  --------------
            if (statusCode1 != 200) {
              return;
            }
            if (!responsePayload1) {
              return;
            }
            //  --------------
            getDataCardView(sensorDataQueryString.sensor,responsePayload1,function(data) {
              // ---------------
              // SPARKLINE PLOTS
              // ---------------
              let _SensorUniqueId = sensor.dtuid > 0 ? `DTU [${sensor.dtuid}] ID [${sensor.sensorid}]` : sensor.sensorid.toUpperCase();
              let _sparklinePlot = `<span id=${sensor.id}A></span>`;
              if (sensorData.sensortype == "POWER METER SENSOR (485)")
                _sparklinePlot += `<br><span id=${sensor.id}B></span><br><span id=${sensor.id}C></span>`;
              //  ----------------
              // DTU AND SENSOR ID
              // -----------------
              let _Functions =
                `<a href="/sensors/edit?id=${sensor.id}"><img src="../public/icons/edit.png"></a>` +
                `<img src="../public/icons/save-file-option.png" onClick="(function() {DownLoadData('${strSensorLabel}');})()">` +
                `<img src="../public/icons/analytics.png"    onClick="(function() {DataAnalysis('${strSensorLabel}','${sensor.dtuid}_${sensor.sensorid}');})()">` +
                `<img src='../public/icons/reload-arrow.png' onClick="(function() {ReloadData('${strSensorLabel}','${sensor.dtuid}_${sensor.sensorid}');})()">`;
              // ----------------------------------------
              let cardViewDiv = document.createElement("div");
              cardViewDiv.setAttribute('id',`${sensor.dtuid}_${sensor.sensorid}`)
              let h1 = document.createElement("p");
              let h2 = document.createElement("p");
              let h3 = document.createElement("p");
              let h4 = document.createElement("h3");
              let h5 = document.createElement("p");
              let h6 = document.createElement("p");
              let h7 = document.createElement("p");
              let hr1 = document.createElement("hr");
              let rating = document.createElement("label");
              h1.innerHTML = `${data._timeLabel}`;
              h2.innerHTML = `${data._sensorLabel}`;
              h3.innerHTML = `${data._sensorIcon}`;
              h4.innerHTML = `<hr/>${data._sensorReading}<hr />`;
              h5.innerHTML = `${_sparklinePlot}`;
              h6.innerHTML = `${_SensorUniqueId}`;
              h7.innerHTML = `${_Functions}`;
              rating.innerHTML = (sensor.ratingMIN && sensor.ratingMAX) ? `RATING=[${sensor.ratingMIN}/${sensor.ratingMAX}]`:`RATING=[1/1]`; 
              cardViewDiv.appendChild(h1);
              cardViewDiv.appendChild(h2);
              cardViewDiv.appendChild(h3);
              cardViewDiv.appendChild(rating);
              cardViewDiv.appendChild(h4);
              cardViewDiv.appendChild(h5);
              cardViewDiv.appendChild(h6);
              cardViewDiv.appendChild(hr1);
              cardViewDiv.appendChild(h7);
              cardViewDiv.classList.add("cardView-blurb");
              if (data._flag) cardViewDiv.classList.add("idle");
              if (highlight) cardViewDiv.classList.add("alert");
              // ----------------------------------------------
              let cardViewContainer = document.getElementById("cardView");
              SensorTypeViewDiv.appendChild(cardViewDiv);
              SensorTypeDiv.appendChild(SensorTypeViewDiv);
              cardViewContainer.appendChild(SensorTypeDiv);
              //  --------------------
              //  SENSOR DATA FOR PLOT
              //  --------------------
              app.client.request(undefined,"api/sensors/data","GET",sensorDataQueryString,undefined,function (statusCode2, sensorData) {
                //  ---------------
                if (statusCode2 != 200) return;
                if (!sensorData)  return;
                sensorDataMap[strSensorLabel] = [];
                //  --------------------
                getSparkLineData(sensor,sensorData,function(data){
                  // ----------------------------------------
                  sensorDataMap[strSensorLabel].push(data.data1C);
                  sensorDataMap[strSensorLabel].push(data.data2C);
                  sensorDataMap[strSensorLabel].push(data.data3C);
                  sensorDataMap[strSensorLabel].push(data.data4C);
                  sensorDataMap[strSensorLabel].push(data.data5C);
                  sensorDataMap[strSensorLabel].push(data.data6C);
                  sensorDataMap[strSensorLabel].push(data.data7C);
                  sensorDataMap[strSensorLabel].push(data.data8C);
                  sensorDataMap[strSensorLabel].push(data.data9C);
                  // ---------------------------------------------
                  const config1A = getConfig1A(PARAM1A1,PARAM1A2,sensor.lowerlimit,sensor.upperlimit);
                  const config1B = getConfig1B(PARAM1B1, PARAM1B2);
                  const config1C = getConfig1C(PARAM1C1, PARAM1C2);
                  $(`#${sensor.id}A`).sparkline(data.data1, config1A).sparkline(data.data2, config1B).sparkline(data.data3, config1C);
                  // --------------------
                  if (data.data4.length > 0) {
                    const config2A = getConfig1A(PARAM2A1,PARAM2A2,sensor.lowerlimit,sensor.upperlimit);
                    const config2B = getConfig1B(PARAM2B1, PARAM2B2);
                    const config2C = getConfig1C(PARAM2C1, PARAM2C2);
                    const config3A = getConfig1A(PARAM3A1,PARAM3A2,sensor.lowerlimit,sensor.upperlimit);
                    const config3B = getConfig1B(PARAM3B1, PARAM3B2);
                    const config3C = getConfig1C(PARAM3C1, PARAM3C2);
                    $(`#${sensor.id}B`).sparkline(data.data4, config2A).sparkline(data.data5, config2B).sparkline(data.data6, config2C);
                    $(`#${sensor.id}C`).sparkline(data.data7, config3A).sparkline(data.data8, config3B).sparkline(data.data9, config3C);
                  }
                })
              });
              // -----------------------
              let loading = document.getElementById('loading');
              if (loading) {
                loading.remove();
              }
            })
          // ---------------
          });
        });
      });
      // ---------------------------
    }).catch((response) => {
      let sessionStop = document.createElement("div");
      sessionStop.innerHTML = `<img src="../public/icons/clock.png" style='text-align:center'></img><h1>SESSION ENDED. PLEASE LOGIN AGAIN</h1>`
      loading.after(sessionStop);
      if (loading) {
        loading.remove();
      }
      return;
    });
  } else {
    let sessionStop = document.createElement("div");
    sessionStop.innerHTML = `<img src="../public/icons/clock.png" style='text-align:center'></img><h1>SESSION ENDED. PLEASE LOGIN AGAIN</h1>`
    loading.after(sessionStop);
    if (loading) {
      console.log('.....loading.....')
      loading.remove();
    }
  }
};
// GET DATA PARAMETER FROM SENSOR AND PAYLOAD (CARDVIEW)
//  _sensorReading,_sensorIcon,_highlight,_timeLabel,_sensorLabel
function getDataCardView(sensor,responsePayload1,callback) {
  // ----------------
  let _sensorReading;
  let _sensorIcon;
  let _highlight;
  let _Date = new Date(responsePayload1.TIMESTAMP);
  let _timeDiff = (new Date() - _Date) / 1000 / 60 / 60;
  let _timeLabel = _Date.toLocaleDateString([], {hour12: false,hour: "2-digit",minute: "2-digit"});
  let _sensorLabel = sensor.sensorname;
  let _flag = _timeDiff > 2.0 ? true : false;
  factor = (sensor.ratingMIN && sensor.ratingMAX) ? sensor.ratingMAX/sensor.ratingMIN : 1.0;
  _timeLabel = _timeDiff > 2.0 ? _timeLabel + '<img src="../public/icons/broken-link.png"/>' : _timeLabel;

    // -- WI-SHT100 --
    // 485 SENSORS
    switch (sensor.sensortype) {
      case "WI-SENSOR RH SENSOR (LORA)" :
        _sensorIcon = sensor.sensortype + "<br>" + '<img src="../public/icons/humidity.png"/>';
        _sensorReading = `${responsePayload1.Temperature}C ${responsePayload1.Humidity}%`;
        _highlight = responsePayload1.Humidity > sensor.upperlimit2 ? true : false;
        _highlight = responsePayload1.Temperature > sensor.upperlimit1 ? true : _highlight;
        break;
      case "AIR FLOW VELOCITY SENSOR (485)":
        // -- 485 AIRFLOW SENSOR -
        _sensorIcon = sensor.sensortype + "<br>" + '<img src="../public/icons/air-transmission.png"/>';
        _sensorReading = `${Number(responsePayload1.DATAS[0])/10.0} m/s<br>${responsePayload1.DATAS[1]}m3/hr<br>${responsePayload1.RCV_BYTES}`;
        break;
      case "AIR FLOW RH SENSOR (485)":
        // -- 485 AIRFLOW RH SENSOR --
        _sensorIcon = sensor.sensortype + "<br>" + '<img src="../public/icons/cooler.png"/>';
        _sensorReading = `${responsePayload1.DATAS[0]/10.0}% ${responsePayload1.DATAS[1] / 10.0}C`;
        _highlight = responsePayload1.DATAS[0] / 10.0 > sensor.upperlimit1 ? true : false;
        _highlight = responsePayload1.DATAS[1] / 10.0 > sensor.upperlimit2 ? true : _highlight;
        break;
      case "RH SENSOR (485)":
        // -- 485 RH SENSOR --
        _sensorIcon = sensor.sensortype + "<br>" + '<img src="../public/icons/temperature-control.png"/>';
        _sensorReading = `${Number(responsePayload1.DATAS[0] / 10.0) }% ${Number(responsePayload1.DATAS[1] / 10.0)}C`;
        _highlight = Number(responsePayload1.DATAS[0] / 10.0) > sensor.upperlimit1 ? true : false;
        _highlight = Number(responsePayload1.DATAS[1] / 10.0) > sensor.upperlimit2 ? true : _highlight;
        break;
      case "WATER TEMPERATURE (485)":
        // -- 485 ANALOG DIGITAL CONVERTOR --
        _sensorIcon = sensor.sensortype + "<br>" + '<img width="32px" height="32px" src="../public/icons/pipe-temperature.png"/>';
        _sensorReading = `|${responsePayload1.DATAS[0] / 10.0 }|${responsePayload1.DATAS[1] / 10.0}|<br>${responsePayload1.RCV_BYTES}`;
        _highlight = responsePayload1.DATAS[0] <= 0.0 ? true : false; 
        _highlight = responsePayload1.DATAS[1] <= 0.0 ? true : _highlight;
        break;
      case "WATER PRESSURE (485)":
        // -- 485 ANALOG DIGITAL CONVERTOR --
        _sensorIcon = sensor.sensortype + "<br>" + '<img width="32px" height="32px" src="../public/icons/pipe-pressure.png"/>';
        _sensorReading = `|${responsePayload1.DATAS[2]}|<br>${responsePayload1.RCV_BYTES}`;
        _highlight = responsePayload1.DATAS[0] <= 0.0 ? true : false;
        _highlight = responsePayload1.DATAS[1] <= 0.0 ? true : _highlight;
        break;
      case "ADC CONVERTOR (485)":
        // -- 485 ANALOG DIGITAL CONVERTOR --
        _sensorIcon = sensor.sensortype + "<br>" + '<img width="32px" height="32px" src="../public/icons/switch.png"/>';
        _sensorReading = `|${responsePayload1.DATAS[0] / 10.0}|${responsePayload1.DATAS[1] / 10.0}|<br>${responsePayload1.RCV_BYTES}`;
        _highlight = responsePayload1.DATAS[0] <= 0.0 ? true : false;
        _highlight = responsePayload1.DATAS[1] <= 0.0 ? true : _highlight;
        break;
      case "WATER LEAK SENSOR (485)":
        // -- 485 WATER LEAK --
        let state = parseInt(responsePayload1.DATAS[0]);
        _sensorIcon = sensor.sensortype + "<br>" + '<img src="../public/icons/leak.png"/>';
        if (state == 2) _sensorReading = `${state}.. WATER DETECTED<br>${responsePayload1.RCV_BYTES}`;
        if (state != 2) _sensorReading = `${state}.. NO WATER DETECTED<br>${responsePayload1.RCV_BYTES}`;
        _highlight = responsePayload1.DATAS[0] >= sensor.upperlimit1 ? true : _highlight;
        break;
      case "POWER METER SENSOR (485)":
        // -- 485 POWER METER --
        let PConsumption, IA, IB, IC;
        let P, Q, S, PF, F;
        let PA, PB, PC, UA, UB, UC;
        if (responsePayload1.DATAS1)
          PConsumption = (responsePayload1.DATAS1[1] / 100).toFixed(2);
        // -----------
        if (sensor.ratingMAX && sensor.ratingMIN) factor = sensor.ratingMAX/sensor.ratingMIN;
        // ----------------------------
        IA = responsePayload1.DATAS2[3] * 100 + responsePayload1.DATAS2[4];
        IB = responsePayload1.DATAS2[5] * 100 + responsePayload1.DATAS2[6];
        IC = responsePayload1.DATAS2[7] * 100 + responsePayload1.DATAS2[8];
        IA = ((IA / 1000) * factor).toFixed(2);
        IB = ((IB / 1000) * factor).toFixed(2);
        IC = ((IC / 1000) * factor).toFixed(2);
        F = `${responsePayload1.DATAS2[16]}`;
        UA = `${responsePayload1.DATAS2[0] / 10.0}`;
        UB = `${responsePayload1.DATAS2[1] / 10.0}`;
        UC = `${responsePayload1.DATAS2[2] / 10.0}`;
        // -------------
        _sensorIcon = sensor.sensortype + "<br>" + '<img width="32px" height="32px" src="../public/icons/electric-meter.png"/>';
        _sensorReading = `ACT.E=${PConsumption}kWh<BR>FREQ=${F/100.0}Hz<BR>UA=${UA}V IA=${IA}A<BR>UB=${UB}V IB=${IB}A<BR>UC=${UC}V IC=${IC}A`;
        _highlight = UA > parseFloat(sensor.upperlimit1) || UC > parseFloat(sensor.upperlimit1) || UC > parseFloat(sensor.upperlimit1) ? true : false;
        _highlight = IA > parseFloat(sensor.upperlimit2) || IB > parseFloat(sensor.upperlimit2) || IC > parseFloat(sensor.upperlimit2) ? true : _highlight;
        break;
      default:
        console.log(`..[APP.JS].. UNKNOWN SENSOR TYPE <${sensor.sensortype}>`)
        break;
    }
  // -------
  data = {
    _timeLabel,
    _flag,
    _sensorType : sensor.sensortype,
    _sensorReading,
    _sensorIcon,
    _sensorLabel,
    _highlight };
  // -------------
  callback(data);
}
function getSparkLineData(sensor,sensorData,callback) {
  // -------------
  let data1C = [];
  let data2C = [];
  let data3C = [];
  let data4C = [];
  let data5C = [];
  let data6C = [];
  let data7C = [];
  let data8C = [];
  let data9C = [];
  // ------------
  let data1 = [];
  let data2 = [];
  let data3 = [];
  let data4 = [];
  let data5 = [];
  let data6 = [];
  let data7 = [];
  let data8 = [];
  let data9 = [];
  // ------------
  let dateTime0 = new Date(sensor,sensorData.data[0].TIMESTAMP);
  // --------------------
  for (var i = 0; i < sensorData.data.length; i++) {
    let dateTime1 = new Date(sensorData.data[i].TIMESTAMP);
    let dateTimeDIFF = dateTime0 - dateTime1;
    const minuteLapse = parseInt(dateTimeDIFF / 1000 / 60);
    if (minuteLapse > 60) {
      data1C.push([dateTime1,null]);
      data2C.push([dateTime1,null]);
      data3C.push([dateTime1,null]);
      data4C.push([dateTime1,null]);
      data5C.push([dateTime1,null]);
      data6C.push([dateTime1,null]);
      data7C.push([dateTime1,null]);
      data8C.push([dateTime1,null]);
      data9C.push([dateTime1,null]);
      // --------------------------
      data1.push(null);
      data2.push(null);
      data3.push(null);
      data4.push(null);
      data5.push(null);
      data6.push(null);
      data7.push(null);
      data8.push(null);
      data9.push(null);
    }
    dateTime0 = dateTime1;
    // --------------------------------
    if (sensor.sensortype) {
      // -------------------
      switch (sensor.sensortype) {
        case "WI-SENSOR RH SENSOR (LORA)":
          PARAM1A1 = "";
          PARAM1A2 = "C";
          PARAM1B1 = "";
          PARAM1B2 = "%";
          PARAM1C1 = "";
          PARAM1C2 = "";
          data1C.push([dateTime1,sensorData.data[i].Temperature]);
          data2C.push([dateTime1,sensorData.data[i].Humidity]);
          data1.push(sensorData.data[i].Temperature);
          data2.push(sensorData.data[i].Humidity);
          PARAM2A1 = "";
          PARAM2A2 = "";
          PARAM2B1 = "";
          PARAM2B2 = "";
          PARAM2C1 = "";
          PARAM2C2 = "";
          break;
        case "RH SENSOR (485)":
          PARAM1A1 = "";
          PARAM1A2 = "%";
          PARAM1B1 = "";
          PARAM1B2 = "C";
          PARAM1C1 = "";
          PARAM1C2 = "";
          const _Humd = Number(sensorData.data[i].DATAS[0] / 10.0);
          const _Temp = Number(sensorData.data[i].DATAS[1] / 10.0)
          data1C.push([dateTime1,_Humd]);
          data2C.push([dateTime1,_Temp]);
          data1.push(_Humd);
          data2.push(_Temp);
          PARAM2A1 = "";
          PARAM2A2 = "";
          PARAM2B1 = "";
          PARAM2B2 = "";
          PARAM2C1 = "";
          PARAM2C2 = "";
          break;
        case 'WATER PRESSURE (485)':
          PARAM1A1 = "";
          PARAM1A2 = "Pa";
          PARAM1B1 = "";
          PARAM1B2 = "Pa";
          PARAM1C1 = "";
          PARAM1C2 = "";
          data1C.push([dateTime1,sensorData.data[i].DATAS[0] / 10.0]);
          data2C.push([dateTime1,sensorData.data[i].DATAS[1] / 10.0]);
          data1.push(sensorData.data[i].DATAS[0] / 10.0);
          data2.push(sensorData.data[i].DATAS[1] / 10.0);
          PARAM2A1 = "";
          PARAM2A2 = "";
          PARAM2B1 = "";
          PARAM2B2 = "";
          PARAM2C1 = "";
          PARAM2C2 = "";
          break;
        case 'WATER TEMPERATURE (485)':
          PARAM1A1 = "";
          PARAM1A2 = "C";
          PARAM1B1 = "";
          PARAM1B2 = "C";
          PARAM1C1 = "";
          PARAM1C2 = "";
          data1C.push([dateTime1,sensorData.data[i].DATAS[0] / 10.0]);
          data2C.push([dateTime1,sensorData.data[i].DATAS[1] / 10.0]);
          data1.push(sensorData.data[i].DATAS[0] / 10.0);
          data2.push(sensorData.data[i].DATAS[1] / 10.0);
          PARAM2A1 = "";
          PARAM2A2 = "";
          PARAM2B1 = "";
          PARAM2B2 = "";
          PARAM2C1 = "";
          PARAM2C2 = "";
          break;
        case "AIR FLOW RH SENSOR (485)":
          PARAM1A1 = "";
          PARAM1A2 = "%";
          PARAM1B1 = "";
          PARAM1B2 = "C";
          PARAM1C1 = "";
          PARAM1C2 = "";
          data1C.push([dateTime1,sensorData.data[i].DATAS[0] / 10.0]);
          data2C.push([dateTime1,sensorData.data[i].DATAS[1] / 10.0]);
          data1.push(sensorData.data[i].DATAS[0] / 10.0);
          data2.push(sensorData.data[i].DATAS[1] / 10.0);
          PARAM2A1 = "";
          PARAM2A2 = "";
          PARAM2B1 = "";
          PARAM2B2 = "";
          PARAM2C1 = "";
          PARAM2C2 = "";
          break;
        case "AIR FLOW VELOCITY SENSOR (485)":
          PARAM1A1 = "";
          PARAM1A2 = "";
          PARAM1B1 = "";
          PARAM1B2 = "";
          PARAM1C1 = "";
          PARAM1C2 = "";
          data1C.push([dateTime1,sensorData.data[i].DATAS[0] / 10.0]);
          data2C.push([dateTime1,sensorData.data[i].DATAS[1]]);
          data1.push(sensorData.data[i].DATAS[0] / 10.0);
          data2.push(sensorData.data[i].DATAS[1]);
          PARAM2A1 = "";
          PARAM2A2 = "";
          PARAM2B1 = "";
          PARAM2B2 = "";
          PARAM2C1 = "";
          PARAM2C2 = "";
          break;
        case "WATER LEAK SENSOR (485)":
          PARAM1A1 = "";
          PARAM1A2 = "";
          PARAM1B1 = "";
          PARAM1B2 = "";
          PARAM1C1 = "";
          PARAM1C2 = "";
          data1C.push([dateTime1,sensorData.data[i].DATAS[0]]);
          data1.push(sensorData.data[i].DATAS[0]);
          PARAM2A1 = "";
          PARAM2A2 = "";
          PARAM2B1 = "";
          PARAM2B2 = "";
          PARAM2C1 = "";
          PARAM2C2 = "";
          break;
        case "POWER METER SENSOR (485)":
          PARAM1A1 = "A";
          PARAM1A2 = "V";
          PARAM1B1 = "B";
          PARAM1B2 = "V";
          PARAM1C1 = "C";
          PARAM1C2 = "V";
          PARAM2A1 = "A";
          PARAM2A2 = "A";
          PARAM2B1 = "B";
          PARAM2B2 = "A";
          PARAM2C1 = "C";
          PARAM2C2 = "A";
          // -------------
          let UA = `${sensorData.data[i].DATAS2[0] / 10.0}`;
          let UB = `${sensorData.data[i].DATAS2[1] / 10.0}`;
          let UC = `${sensorData.data[i].DATAS2[2] / 10.0}`;
          // -------------
          let IA = sensorData.data[i].DATAS2[3] * 100 + sensorData.data[i].DATAS2[4];
          let IB = sensorData.data[i].DATAS2[5] * 100 + sensorData.data[i].DATAS2[6];
          let IC = sensorData.data[i].DATAS2[7] * 100 + sensorData.data[i].DATAS2[8];
          IA = ((IA / 1000) * factor).toFixed(2);
          IB = ((IB / 1000) * factor).toFixed(2);
          IC = ((IC / 1000) * factor).toFixed(2);
          // ------------------------------------
          if (isNaN(UA) || isNaN(UB) || isNaN(UC) || isNaN(IA) || isNaN(IB) || isNaN(IC) ) {
              // console.log(`..UA=${UA}..UB=${UB}..UC=${UC}..IA=${IA}..IB=${IB}..IC=${IC}`);
          }
          else {
            dbData1 = [dateTime1,UA];
            dbData2 = [dateTime1,UB];
            dbData3 = [dateTime1,UC];
            dbData4 = [dateTime1,IA];
            dbData5 = [dateTime1,IB];
            dbData6 = [dateTime1,IC];
            data1C.push(dbData1);
            data2C.push(dbData2);
            data3C.push(dbData3);
            data4C.push(dbData4);
            data5C.push(dbData5);
            data6C.push(dbData6);
            data1.push( UA );
            data2.push( UB );
            data3.push( UC );
            data4.push( IA );
            data5.push( IB );
            data6.push( IC );
            // ------------
            let TP, P;
            P = 0;
            TP = ((sensorData.data[i].DATAS1[1] / 100) * factor ).toFixed(2);
            data7C.push([dateTime1,parseFloat(TP)]);
            data7.push(parseFloat(TP));
            if (i < sensorData.data.length - 1) P = ((sensorData.data[i].DATAS1[1] - sensorData.data[i + 1].DATAS1[1]) / 100) * factor;
            data8C.push([dateTime1,parseFloat(P)]);
            data8.push(parseFloat(P));
          }
          PARAM3A1 = "Total";
          PARAM3A2 = "Kwh";
          PARAM3B1 = "Cons";
          PARAM3B2 = "kWh";
          PARAM3C1 = "";
          PARAM3C2 = "";
          break;
        case "ADC CONVERTOR (485)":
          PARAM1A1 = "";
          PARAM1A2 = "";
          PARAM1B1 = "";
          PARAM1B2 = "";
          PARAM1C1 = "";
          PARAM1C2 = "";
          data1C.push([dateTime1,sensorData.data[i].DATAS[0] / 10.0]);
          data2C.push([dateTime1,sensorData.data[i].DATAS[1] / 10.0]);
          data3C.push([dateTime1,sensorData.data[i].DATAS[2] / 10.0]);
          data4C.push([dateTime1,sensorData.data[i].DATAS[3] / 10.0]);
          data5C.push([dateTime1,sensorData.data[i].DATAS[4] / 10.0]);
          data6C.push([dateTime1,sensorData.data[i].DATAS[5] / 10.0]);
          data1.push([i,sensorData.data[i].DATAS[0] / 10.0]);
          data2.push([i,sensorData.data[i].DATAS[1] / 10.0]);
          data3.push([i,sensorData.data[i].DATAS[2] / 10.0]);
          data4.push([i,sensorData.data[i].DATAS[3] / 10.0]);
          data5.push([i,sensorData.data[i].DATAS[4] / 10.0]);
          data6.push([i,sensorData.data[i].DATAS[5] / 10.0]);
          break;
        default:
          break;
      }
    }
  }
  let data = { data1C,data2C,data3C,data4C,data5C,data6C,data7C,data8C,data9C, data1,data2,data3,data4,data5,data6,data7,data8,data9 }
  callback(data)
}
function insertSensorVisibilityGroup(sensortypeKEY){
  let sensorSlectionContainer = document.getElementById("sensorTypeSelectionView");
  console.log('...sensortypeKEY...')
  console.log(sensortypeKEY)
  // -----------------------------------
  sensortypeKEY.forEach((stype,index)=>{
    var divContainer = document.createElement("div");
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = 'SType-' + index;
    checkbox.value = index;
    checkbox.checked = true;
    checkbox.name = "SensorTypes";
    checkbox.classList = "multiselect userSensors";
    var label = document.createElement("label");
    var text = document.createTextNode(`${stype}`);
    label.setAttribute('for','SType-' +index)
    label.appendChild(text);
    divContainer.appendChild(checkbox);
    divContainer.appendChild(label);
    sensorSlectionContainer.appendChild(divContainer);
    // ----------------------------------------
    label.onclick = () => {
      let selGroup = document.getElementById('type-' +index);
      $(selGroup).toggleClass('invisible');
    }
  })
  /*
  // checkbox.innerText = `${sensor.sensortype} [${sensor.dtuid}:${sensor.sensorid}] <<${sensor.sensorname}>>\n`;
  // Text
  sensorCard.classList.add("checkboxLabel");
  // label.innerText = `${sensor.sensortype} [${sensor.dtuid}:${sensor.sensorid}]\n`;
  // ------------------------------------
  */
  // sensorSlectionContainer.appendChild(SensorTypeViewDiv);
}
// ------------------------------------
// Load the systemView Page Specifcally
// ------------------------------------
app.LoadSystemViewPage = function() {
  // -----------------------------------------
  console.log("..[APP.JS].. <LoadSystemViewPage>");
  // -----------------------------------------
  // Get the phone number from the current token, or log the user out if none is there
  let loading = document.getElementById('loading');
  var phone = typeof app.config.sessionToken.phone == "string" ? app.config.sessionToken.phone : false;
  if (phone) {
    // ----------------
    const promise = new Promise((resolve,reject) => {
      app.client.request(undefined,"api/users","GET",app.config.sessionToken,undefined,function (statusCode, responsePayload) {
        if (statusCode != 200) {
          let sessionStop = document.createElement("div");
          sessionStop.innerHTML = `<img src="../public/icons/clock.png" style='text-align:center'></img><h1>SESSION ENDED. PLEASE LOGIN AGAIN</h1>`
          loading.after(sessionStop);
          if (loading) {
            console.log('.....loading.....')
            loading.remove();
          }
          reject(statusCode);
          return;
        }
        // ----------------------------
        if (statusCode == 200 && responsePayload) {
          resolve(200);
        } else {
          reject(403);
        }
      });
    }).then((response) => {
      app.client.request(undefined,"api/systems","GET",app.config.sessionToken,undefined, function (statusCode, responsePayload) {
        // ---------------------------
        if (statusCode != 200 || !responsePayload)
          return;
        // --------------------
        let nSYSTEMCOUNT = 0;
        let sensortypeKEY = [];
        let SystemDiv = document.getElementById('systemView');
        // ---------------------------------
        responsePayload.forEach(system => {      
          // -----------------------------------------
          let cardDiv = document.createElement('div');
          cardDiv.setAttribute('id',`type-${nSYSTEMCOUNT}`);
          cardDiv.classList.add('systemCardView-blurb')
          SystemDiv.appendChild(cardDiv);
          ++nSYSTEMCOUNT;
          //  ---------------
          //  SIDE BAR TITLES
          //  ---------------
          let systemTitle = document.createElement('div');
          let pTitle1 = document.createElement('p');
          let pTitle2 = document.createElement('div');
          systemTitle.setAttribute('id',`type-${nSYSTEMCOUNT}_0`)
          // ------------------------------
          pTitle1.innerHTML = system.Title;
          pTitle2.innerHTML = 'OVERALL PERFORMANCE';
          systemTitle.appendChild(document.createElement('hr'));
          systemTitle.appendChild(pTitle1);
          sensortypeKEY.push(system.Title);
          //  -----------
          //  SIDE HEADER
          //  -----------
          system.SENSOR_TYPES.forEach(_stype => {
            let image1 = document.createElement('img');
            switch(_stype) {
              case 'POWER METER SENSOR (485)':
                image1.setAttribute("src", "../public/icons/electric-meter.png");
                break;
              case 'ADC CONVERTOR (485)':
                image1.setAttribute("src", "../public/icons/switch.png");
                break;
              case 'WI-SENSOR RH SENSOR (LORA)':
                image1.setAttribute("src", "../public/icons/humidity.png");
                break;
              case 'RH SENSOR (485)':
                image1.setAttribute("src", "../public/icons/temperature-control.png");
                break;
              case 'AIR FLOW RH SENSOR (485)':
                image1.setAttribute("src", "../public/icons/cooler.png");
                break;
              case 'AIR FLOW VELOCITY SENSOR (485)':
                image1.setAttribute("src", "../public/icons/air-transmission.png");
                break;
              case 'WATER LEAK SENSOR (485)':
                image1.setAttribute("src", "../public/icons/leak.png");
                break;
              case 'WATER TEMPERATURE (485)':
                image1.setAttribute("src", "../public/icons/pipe-temperature.png");
                break;
              case 'WATER PRESSURE (485)':
                image1.setAttribute("src", "../public/icons/pipe-pressure.png");
                break;
              default:
                break;
            }
            systemTitle.appendChild(image1);
          })
          systemTitle.appendChild(pTitle2);
          // --------------------------------------------------
          systemTitle.appendChild(document.createElement('hr'));
          systemTitle.classList.add('componentTitleView-blurb');
          // -------------------------------
          cardDiv.appendChild(systemTitle);
          //  -----------------
          //  SYSTEM COMPONENTS
          //  -----------------
          let _compData = [];
          let _layer = 0;
          let _countEChart = 0;
          let components = system.COMPONENTS;
          // --------------------------------
          const promise1 = new Promise((resolve,reject) => {
            //  -----------------------------
            components.forEach(component => {
              // --------------
              let items = [ {color:'#DACC3E'},{color:'#78BC61'},{color:'#E9806E'},{color:'#7FDEFF'},{color:'#FEF9E7'},{color:'#B80C09'},
                            {color:'#35D1E6'},{color:'#040F16'},{color:'#81F499'},{color:'#3D348B'},{color:'#000000'}];
              //  ----------------------------
              let sensors = component.SENSORS;
              let _componetChild = [];
              let _component = { value:sensors.count, title: component.TITLE, name:component.TITLE.replace(/ /g, '\r\n'), itemStyle:items[_layer], children:_componetChild };
              //  ---------
              //  CARD VIEW
              //  ---------
              let systemComp = document.createElement('div');
              let compTitle = document.createElement('p');
              systemComp.setAttribute('id',`S_${nSYSTEMCOUNT}_0_${_layer}`)
              compTitle.innerHTML = component.TITLE + ' [' + sensors.length + ']';
              systemComp.classList.add('componentCardView-blurb');
              //  ----------------------------
              systemComp.appendChild(document.createElement('hr'));
              systemComp.appendChild(compTitle);
              systemComp.appendChild(document.createElement('hr'));
              cardDiv.appendChild(systemComp);
              // ------------
              // SENSOR GROUP
              // ------------
              let sensorGroupCardView = document.createElement('div');
              sensorGroupCardView.classList.add('sensorGroupCardView-blurb');
              systemComp.appendChild(sensorGroupCardView);
              // -------------------------------  
              _layer += 1;
              // -----------------------------------------------
              const Promise2 = new Promise((resolve,reject) => {
                let nCOUNTSENSOR = 0;
                sensors.forEach(sensor => {
                  ++nCOUNTSENSOR;
                  let sensorList = document.createElement('li');
                  // -------------------------------------------
                  if (sensor.DTUID > 0) strSensorLabel = sensor.DTUID + "-" + sensor.SENSORID;
                  else strSensorLabel = sensor.SENSORID;
                  //  -----------------
                  //  POPULATE THE TABLE
                  //  -----------------
                  let _reading;
                  let sensorDataQueryString = { id: strSensorLabel };
                  // --------------------------------------------------
                  app.client.request(undefined,"api/sensors","GET",sensorDataQueryString,undefined,function (statusCode1, responsePayload1) {
                    // ---------------------
                    if (responsePayload1){
                      // -------------------
                      switch(sensor.TYPE){
                        case 'WI-SENSOR RH SENSOR (LORA)':
                          _reading = `${responsePayload1.Temperature}C\r\n${responsePayload1.Humidity}%`
                          break;
                        case 'WATER PRESSURE (485)':
                          _reading = `${responsePayload1.DATAS[0] / 10.0}\r\n${responsePayload1.DATAS[1] / 10.0}`;
                          break;
                        case 'WATER TEMPERATURE (485)':
                          _reading = `${responsePayload1.DATAS[0] / 10.0}\r\n${responsePayload1.DATAS[1] / 10.0}`;
                          break;
                        case 'AIR FLOW VELOCITY SENSOR (485)':
                          _reading = `${responsePayload1.DATAS[0] / 10.0}m/s\r\n${responsePayload1.DATAS[1]}m3/hr`
                          break;
                        case 'POWER METER SENSOR (485)':
                          // -- 485 POWER METER --
                          let factor;
                          let PConsumption, IA, IB, IC;
                          let P, Q, S, PF, F;
                          let PA, PB, PC, UA, UB, UC;
                          if (responsePayload1.DATAS1)  PConsumption = (responsePayload1.DATAS1[1] / 100).toFixed(2);
                          factor = (sensor.ratingMIN && sensor.ratingMAX) ? sensor.ratingMAX/sensor.ratingMIN : 1.0;
                          //  PConsumption = (responsePayload1.DATAS1[1]/100*100/5).toFixed(2);
                          // -----------
                          IA = responsePayload1.DATAS2[3] * 100 + responsePayload1.DATAS2[4];
                          IB = responsePayload1.DATAS2[5] * 100 + responsePayload1.DATAS2[6];
                          IC = responsePayload1.DATAS2[7] * 100 + responsePayload1.DATAS2[8];
                          IA = ((IA / 1000) * factor).toFixed(2);
                          IB = ((IB / 1000) * factor).toFixed(2);
                          IC = ((IC / 1000) * factor).toFixed(2);
                          P = `${responsePayload1.DATAS2[9]}${responsePayload1.DATAS2[10]}`;
                          Q = `${responsePayload1.DATAS2[11]}${responsePayload1.DATAS2[12]}`;
                          S = `${responsePayload1.DATAS2[13]}${responsePayload1.DATAS2[14]}`;
                          PF = `${responsePayload1.DATAS2[15]}`;
                          F = `${responsePayload1.DATAS2[16]}`;
                          PA = `${responsePayload1.DATAS2[17]}${responsePayload1.DATAS2[18]}`;
                          PB = `${responsePayload1.DATAS2[19]}${responsePayload1.DATAS2[20]}`;
                          PC = `${responsePayload1.DATAS2[21]}${responsePayload1.DATAS2[22]}`;
                          // -------------
                          UA = `${responsePayload1.DATAS2[0] / 10.0}`;
                          UB = `${responsePayload1.DATAS2[1] / 10.0}`;
                          UC = `${responsePayload1.DATAS2[2] / 10.0}`;
                          // -------------
                          _reading = `V=${UA}|${UB}|${UC}\r\nI=${IA}|${IB}|${IC}`;
                        default:
                          break;
                      }
                    }
                    // --------------
                    let _sensor = { 
                      value:1, name:_reading, 
                      itemStyle: (_reading == null) ? items[10] :items[8], 
                      children:[{value:1, name:sensor.TITLE + `\r\n${sensorDataQueryString.id}`, itemStyle:items[9]}] 
                    };
                    // --------------------------
                    _componetChild.push(_sensor);
                    sensorList.innerHTML = `${sensor.TITLE} [${_reading}]`;
                    sensorGroupCardView.appendChild(sensorList);
                    // ----------------------------------
                    if (_componetChild.length > sensors.length-1) {
                      resolve(sensorDataQueryString.id);
                    }
                  });
                })
              }).then((response) => {
                _compData.push(_component);
                if (_compData.length == components.length) {
                  resolve(system.Title);
                }
              })
              // --------------
            })  
          }).then((response) => {
            // -------------- 
            let title = response;
            title = title.replace(/ /g, '_');
            ++_countEChart;
            //  -------------
            //  SUNBURSH PLOT
            //  -------------
            let systemSBurst = document.createElement('div');
            systemSBurst.classList.add('echartSystem');
            systemSBurst.setAttribute('id',`S_${title}_eChart`)
            cardDiv.appendChild(systemSBurst);
            //  ------------------------------
            let myChart = echarts.init(systemSBurst);
            var option1 = {
              series: {
                radius: ['15%', '80%'],
                type: 'sunburst',
                sort: null,
                emphasis: { focus: 'ancestor' },
                data: _compData,
                label: { rotate: 0 },
                levels: [{},
                         {r0:'15%',r:'35%',label: {rotate: 0, fontSize: 11, show:false, color:'blue'}},
                         {r0:'35%',r:'75%',label: {rotate: 0, fontSize: 11, display:false}},
                         {r0:'75%',r:'80%',label: {position: 'outside', fontSize: 11, display:true, color:'red'}}],
                itemStyle : {}
              }
            };
            myChart.setOption(option1);
            // ------------------------
            if (loading) {
              loading.remove();
            }            
            // -------------------
          })
        })
        // -------------------------------------------
        insertSensorVisibilityGroup(sensortypeKEY);
        // console.log(sensortypeKEY);
        // ------------------------
      });  
    })
    .catch((response) => {
      return;
    });
    // -----------------------------
  } else {
    let sessionStop = document.createElement("div");
    sessionStop.innerHTML = `<img src="../public/icons/clock.png" style='text-align:center'></img><h1>SESSION ENDED. PLEASE LOGIN AGAIN</h1>`
    loading.after(sessionStop);
    if (loading) {
      console.log('.....loading.....')
      loading.remove();
    }
  }
}
// ----------------------------------------
// Load the Schedule List Page Specifically
// ----------------------------------------
app.LoadSchedulePage = function () {
  // --------
  // ESP32CAM
  // --------
  var esp32CAMShot = document.getElementById("ESP32CAM");
  // -------------------
  // Get the phone number from the current token, or log the user out if none is there
  var phone = typeof app.config.sessionToken.phone == "string" ? app.config.sessionToken.phone : false;
  if (phone) {
    // ---------------------
    app.client.request(undefined,"api/users","GET",app.config.sessionToken,undefined,
      function (statusCode, responsePayload) {
        let loading = document.getElementById('loading');
        // ---------------------------------
        if (statusCode == 200 && responsePayload) {
          // Fetch the user data
          var queryStringObject = { id: "ESP32CAMData" };
          // -----------------------------------
          app.client.request(undefined,"api/ESP32CAM","GET",queryStringObject,undefined,
            function (statusCode, responsePayload) {
              if (statusCode == 200 && responsePayload) {
                let photos = responsePayload;
                // --------------------------
                photos.forEach((photo) => {
                  // -----------------------------------
                  let div = document.createElement("div");
                  let hr = document.createElement("hr");
                  let img = document.createElement("img");
                  // ----------------------
                  img.src = "../public/uploads/" + photo.key + ".jpg";
                  img.id = photo.key;
                  img.width = "350";
                  // ----------------------
                  let h1 = document.createElement("p");
                  let h2 = document.createElement("p");
                  let _TimeStamp = new Date(photo.TIMESTAMP);
                  if (_TimeStamp) {
                    h1.innerText = `${photo.key}`;
                    h2.innerHTML = `${_TimeStamp.toLocaleDateString()} ${_TimeStamp.toLocaleTimeString()}`;
                  }
                  // --------------------------
                  div.appendChild(h1);
                  div.appendChild(h2);
                  div.appendChild(img);
                  div.classList.add("ESP32CAM-blurb");
                  esp32CAMShot.appendChild(div);
                  // esp32CAMShot.appendChild(hr);
                });
              }
            }
          );
          // -----------------------------------------
          app.client.request(undefined,"api/mapbox/token","GET",app.config.sessionToken,undefined,
            function (statusCode, responsePayload) {
              // ---------------
              if (statusCode) {
                // --------------
                populateMapBox(responsePayload.token);
                // --------------
              }
              // ---------------------
              // CALENDER - SCHEDULING
              // ---------------------
              var calendarInstance = new calendarJs("myCalendar", {
                exportEventsEnabled: true,
                manualEditingEnabled: true,
                showTimesInMainCalendarEvents: false,
                minimumDayHeight: 0,
                manualEditingEnabled: true,
                organizerName: "Your Name",
                organizerEmailAddress: "your@email.address",
              });
            }
          );
          loading.remove();
        }
        else {
          let sessionStop = document.createElement("div");
          sessionStop.innerHTML = `<img src="../public/icons/clock.png" style='text-align:center'></img><h1>SESSION ENDED. PLEASE LOGIN AGAIN</h1>`
          loading.after(sessionStop);
          if (loading) {
            console.log('.....loading.....')
            loading.remove();
          }
          return;
        }
      }
    );
  }
  // -------------
};
function populateMapBox(token) {
  // ------------
  var size = 200;
  // --------------------------
  L.mapbox.accessToken = token;
  /*
  mapboxgl.accessToken = token;
  var map = new mapboxgl.Map({
    container: 'map', // container id
    style1: 'mapbox://styles/mapbox/light-v10', // style URL
    style: 'mapbox://styles/mapbox/satellite-streets-v11', // style URL
    center: [103.69994862191211,2.0539609488763753], // starting position [lng, lat]
    zoom: 7 // starting zoom
    // 
  });
  */
  var map = L.mapbox.map('map')
  .setView([2.0539609488763753, 103.69994862191211], 8)
  .addLayer(L.mapbox.styleLayer('mapbox://styles/mapbox/satellite-streets-v11'));
  // -------------------------------
  app.client.request(undefined,"api/mapbox/data","GET",app.config.sessionToken,undefined,
    function (statusCode, responsePayload) {
      // ---------------------------------------
      if (statusCode == 200 && responsePayload){
        // ---------------------
        let data = responsePayload;
        // map.featureLayer.setGeoJSON(data);
        // --------------------
        var listings = document.getElementById('listings');
        var locations = L.mapbox.featureLayer().addTo(map);
        locations.setGeoJSON(data);
        // ----------------------------
        function setActive(el) {
          var siblings = listings.getElementsByTagName('div');
          for (var i = 0; i < siblings.length; i++) {
            siblings[i].className = siblings[i].className
              .replace(/active/, '').replace(/\s\s*$/, '');
          }
          el.className += ' active';
        }
        // -----------------------------------
        locations.eachLayer(function(locale) {
          // Shorten locale.feature.properties to `prop` so you don't
          // have to write this long form over and over again.
          var prop = locale.feature.properties;
          // Each marker on the map.
          var popup = '<h3>' + prop.category + '</h3><div>' + prop.name;
          var listing = listings.appendChild(document.createElement('div'));
          listing.className = 'item';
          var link = listing.appendChild(document.createElement('a'));
          // link.href = '#';
          link.className = 'title';
          link.innerHTML = prop.name;
          var details = listing.appendChild(document.createElement('div'));
          details.innerHTML = prop.city;
          if (prop.phone) {
            details.innerHTML += ' · ' + prop.phoneFormatted;
          }
          link.onclick = function() {
            setActive(listing);
            // When a menu item is clicked, animate the map to center
            // its associated locale and open its popup.
            map.setView(locale.getLatLng(), 10);
            locale.openPopup();
            return false;
          };
          // Marker interaction
          locale.on('click', function(e) {
            // 1. center the map on the selected marker.
            map.panTo(locale.getLatLng());
            // 2. Set active the markers associated listing.
            setActive(listing);
          });
          popup += `<img src="../public/imgs/${prop.image}" width="285" height="213"></div>`;
          locale.bindPopup(popup);
          let iconimg;
          iconimg = (prop.category == 'YACHT CLUB') ? 'marker-1.png' : 'marker-2.png';
          iconimg = (prop.category == 'ISLAND') ? 'marker-3.png' : iconimg;
          locale.setIcon(
            L.icon({
              iconUrl:'../public/icons/' + iconimg,
              iconSize:[32,32],
              iconAnchor:[28,28],
              popupAnchor:[0,-34]
            })
          );
        });
      }
    }
  );
  let rotate = () => {
    map.easeTo({ bearing: 40, duration: 10000, pitch: 0, zoom: 18 });
    window.setTimeout(function () {
      map.easeTo({ bearing: 180, duration: 10000, pitch: 0, zoom: 14 });
      window.setTimeout(function () {
        map.easeTo({ bearing: 0, duration: 10000, pitch: 0, zoom: 16 });
        window.setTimeout(function () {
          rotator();
        }, 10000);
      }, 10000);
    }, 10000);
  }
}
function buildLocationList(data) {
  // ---------------
  console.log('...buildLocationLists....')
  let colors = ['yellow','orange','red','pink','violet','blue','green','brown','gray','salmon','lime','lavender','navy','plum','crimson']
  // let marker1 = new mapboxgl.Marker({ color: 'blue',  rotation: 0}).setLngLat([103.84051839870358, 1.247112644140505]).addTo(map);
  // let marker2 = new mapboxgl.Marker({ color: 'green', rotation: 0}).setLngLat([103.81967434263197, 1.470068436223442]).addTo(map);
  // --------------------------------------
  // REMOVE INTO NOTE.TXT #1
}
// ---------------------------------------
// Load the account edit page specifically
// ---------------------------------------
app.loadAccountEditPage = function () {
  // --------------------------------------------
  console.log("..[app.js].. loadDataOnPage > app.loadAccountEditPage");
  // --------------------------------------------
  // Get the phone number from the current token, or log the user out if none is there
  var phone = typeof app.config.sessionToken.phone == "string" ? app.config.sessionToken.phone : false;
  if (phone) {
    // Fetch the user data
    var queryStringObject = { phone: phone };
    // Put the hidden phone field into both forms
    var hiddenIdInputs = document.querySelectorAll("input.hiddenPhoneNumberInput");
    for (var i = 0; i < hiddenIdInputs.length; i++) {
      hiddenIdInputs[i].value = phone;
    }
    // Populate All Accounts Availables
    app.client.request(undefined,"api/accounts","GET",queryStringObject,undefined,function (statusCode, responsePayload) {
      //  Loading Accounts (Users) into DropList Menu
      console.log(`..API/ACCOUNTS/GET...${statusCode}..${responsePayload.length}`)
      if (statusCode == 200) {
        var accountsSelection = document.querySelector("#accountsSelect #userAccount");
        for (var i = 0; i < responsePayload.length; i++) {
          var option = document.createElement("option");
          option.textContent = responsePayload[i];
          accountsSelection.appendChild(option);
        }
      }
    });
    // Populate All Sensors Available
    app.client.request(undefined,"api/sensors","GET",queryStringObject,undefined,function (statusCode, responsePayload) {
        //  -----------------------------
        //  Loading Sensors into Checkbox
        //  -----------------------------
        console.log(`..API/SENSORS/GET...${statusCode}..${responsePayload.length}`)
        if (statusCode == 200) {
          let sensortypeKEY = [];
          let allSensorsObjects = responsePayload;
          let sensorGroup = allSensorsObjects.reduce((acc, value) => {
            // Group initialization
            if (!acc[value.sensortype]) {
              acc[value.sensortype] = [];
              sensortypeKEY.push(value.sensortype);
            }
            // Grouping
            acc[value.sensortype].push(value);
            return acc;
          }, {});
          //  ------------------------------------------------------------------------
          var sensorsSelection = document.querySelector("#accountEdit3 #userSensors");
          // -----------------------------------------------
          sensortypeKEY.sort();
          // -----------------------------
          sensortypeKEY.forEach((key) => {
            let Sensors = sensorGroup[key];
            let sensortypeGroup = document.createElement("div");
            let sensortypeLabel = document.createElement("label");
            sensortypeLabel.innerHTML = `${key}`
            sensortypeLabel.classList.add('inputLabel');
            sensortypeGroup.classList.add("selectionGroupColumnm");
            sensorsSelection.appendChild(sensortypeLabel);
            sensorsSelection.appendChild(sensortypeGroup);
            let divGroup = document.createElement("div");
            divGroup.classList.add('flex-container');
            sensortypeGroup.appendChild(divGroup);
            // ---------------------------
            Sensors.forEach((sensor) => {
              // Checkbox
              var sensorCard = document.createElement("div");
              var checkbox = document.createElement("input");
              checkbox.type = "checkbox";
              checkbox.classList = "multiselect userSensors";
              checkbox.name = "sensorIds";
              checkbox.id = sensor.id;
              checkbox.value = sensor.id;
              // checkbox.innerText = `${sensor.sensortype} [${sensor.dtuid}:${sensor.sensorid}] <<${sensor.sensorname}>>\n`;
              // Text
              var label = document.createElement("label");
              var text = document.createTextNode(`[${sensor.dtuid}:${sensor.sensorid}] \r\n ${sensor.sensorname} `);
              label.setAttribute('for',sensor.id)
              label.appendChild(text);
              sensorCard.classList.add("checkboxLabel");
              // label.innerText = `${sensor.sensortype} [${sensor.dtuid}:${sensor.sensorid}]\n`;
              // ------------------------------------
              sensorCard.appendChild(checkbox);
              sensorCard.appendChild(label);
              // sensortypeGroup.appendChild(sensorCard);
              divGroup.appendChild(sensorCard);
            });
          });
        }
      }
    );
  } else {
    console.log("4..app.logUserOut");
    //app.logUserOut();
  }
};

// ------------------------------------
// Load the dashboard page specifically
// ------------------------------------
app.loadChecksListPage = function () {
  // --------------------------------------------
  console.log("..[app.js].. loadDataOnPage > app.loadChecksListPage");
  // --------------------------------------------
  // Get the phone number from the current token, or log the user out if none is there
  var phone = typeof app.config.sessionToken.phone == "string" ? app.config.sessionToken.phone : false;
  if (phone) {
    // FETCH THE USER DATA
    var queryStringObject = {
      phone: phone,
    };
    // LISTING OF GATEWAYS
    app.client.request(undefined,"api/gateways","GET",queryStringObject,undefined,function (statusCode, responsePayload) {
        if (statusCode == 200) {
          if (responsePayload) {
            var allGateways = typeof responsePayload == "object" && responsePayload instanceof Array &&
              responsePayload.length > 0 ? responsePayload : false;
            //  -------------------
            allGateways.forEach(function (gatewayData) {
              // Make the check data into a table row
              var table = document.getElementById("gatewayListTable");
              var tr = table.insertRow(-1);
              tr.classList.add("checkRow");
              var td0 = tr.insertCell(0);
              var td1 = tr.insertCell(1);
              var td2 = tr.insertCell(2);
              var td3 = tr.insertCell(3);
              td0.innerHTML = gatewayData.GATEWAYID;
              td1.innerHTML = gatewayData.ADDRESS;
              if (gatewayData.TIMESTAMP) {
                var _Date = new Date(gatewayData.TIMESTAMP);
                td2.innerHTML = _Date.toLocaleString();
              } else {
                td2.innerHTML = "NA";
              }
              if (gatewayData.ACTIVE) td3.innerHTML = "ACTIVE";
              else td3.innerHTML = "INACTIVE";
            });
          }
        } else {
        }
      }
    );
    // LISTING OF CHECKS AND SENSORS
    app.client.request(undefined,"api/users","GET",queryStringObject,undefined,function (statusCode, responsePayload) {
      if (statusCode == 200) {
        // ------------------------------------------
        // ENABLE ADD SENSORS AND CHECK IF TYPE=ADMIN
        // ------------------------------------------
        if (responsePayload) {
          if (responsePayload.type != "admin") {
            // Show 'you have no sensors' message
            document.getElementById("createCheckCTA").style.display = "none";
            // document.getElementById("div").remove("createCheckCTA");
          } else {
            document.getElementById("createCheckCTA").style.display = "block";
          }
        }
        // ----------------------------------
        // DETERMINE CHECKS OWNED BY THE USER
        // ----------------------------------
        var allChecks = typeof responsePayload.checks == "object" && responsePayload.checks instanceof Array &&
          responsePayload.checks.length > 0 ? responsePayload.checks : [];
        if (allChecks.length > 0) {
          // Show each created check as a new row in the table
          document.getElementById("noChecksMessage").style.display = "none";
          allChecks.forEach(function (checkId) {
            // Get the data for the check
            var newQueryStringObject = {
              id: checkId,
            };
            app.client.request(undefined,"api/checks","GET",newQueryStringObject,undefined,function (statusCode, responsePayload) {
                if (statusCode == 200) {
                  var checkData = responsePayload;
                  // Make the check data into a table row
                  var table = document.getElementById("checksListTable");
                  var tr = table.insertRow(-1);
                  tr.classList.add("checkRow");
                  var td0 = tr.insertCell(0);
                  var td1 = tr.insertCell(1);
                  var td2 = tr.insertCell(2);
                  var td3 = tr.insertCell(3);
                  var td4 = tr.insertCell(4);
                  td0.innerHTML = responsePayload.method.toUpperCase();
                  td1.innerHTML = responsePayload.protocol + "://";
                  td2.innerHTML = responsePayload.url;
                  var state = typeof responsePayload.state == "string" ? responsePayload.state : "unknown";
                  td3.innerHTML = state;
                  td4.innerHTML = '<a href="/checks/edit?id=' + responsePayload.id + '">View / Edit / Delete</a>';
                } else {
                  console.log("Error trying to load check ID: ", checkId);
                  return;
                }
              }
            );
          });
        }
        if (allChecks.length < 5) {
          // Show the createCheck CTA
          // document.getElementById("createSensorCTA").style.display = 'block';
        }
        // -----------------------------------
        // DETERMINE SENSORS OWNED BY THE USER
        // -----------------------------------
        var allSensors = typeof responsePayload.sensors == "object" && responsePayload.sensors instanceof Array &&
          responsePayload.sensors.length > 0 ? responsePayload.sensors : [];
        if (allSensors.length > 0) {
          // Show each created check as a new row in the table
          var table = document.getElementById("sensorsListTable");
          table.style.display = "block";
          table.style.marginLeft = "auto";
          table.style.marginRight = "auto";
          var x = document.createElement("TBODY");
          table.appendChild(x);
          // -----------
          let count = 0;
          // ------------------------------------
          allSensors.forEach(function (sensorId) {
            // Get the data for the check
            var newQueryStringObject = { id: sensorId };
            app.client.request(undefined,"api/sensors","GET",newQueryStringObject,undefined,function (statusCode, responsePayload) {
                if (statusCode == 200) {
                  var strSensorLabel;
                  if (responsePayload.dtuid > 0) 
                    strSensorLabel = responsePayload.dtuid + "-" + responsePayload.sensorid;
                  else 
                    strSensorLabel = responsePayload.sensorid;
                  // -------------------------------------------------
                  var newQueryStringObject1 = { id: strSensorLabel };
                  app.client.request(undefined,"api/sensors","GET",newQueryStringObject1,undefined,function (statusCode1, responsePayload1) {
                      var sensorData = responsePayload;
                      count += 1;
                      // Make the check data into a table row
                      var tr = x.insertRow(-1);
                      // tr.classList.add('checkRow');
                      var td0 = tr.insertCell(0);
                      var td1 = tr.insertCell(1);
                      var td2 = tr.insertCell(2);
                      var td3 = tr.insertCell(3);
                      var td4 = tr.insertCell(4);
                      var td5 = tr.insertCell(5);
                      var td6 = tr.insertCell(6);
                      var td7 = tr.insertCell(7);
                      var td8 = tr.insertCell(8);
                      var td9 = tr.insertCell(9);
                      var td10 = tr.insertCell(10);
                      var td11 = tr.insertCell(11);
                      td0.innerHTML = count;
                      td1.innerHTML = responsePayload.dtuid;
                      td2.innerHTML = responsePayload.sensorid;
                      td3.innerHTML = responsePayload.sensortype;
                      td4.innerHTML = responsePayload.sensorname;
                      td5.innerHTML = `${responsePayload.label1}<br>${responsePayload.label2}`;
                      td6.innerHTML = `${responsePayload.ratingMIN}<br>${responsePayload.ratingMAX}`;
                      td7.innerHTML = `${responsePayload.lowerlimit1}<br>${responsePayload.lowerlimit2}`;
                      td8.innerHTML = `${responsePayload.upperlimit1}<br>${responsePayload.upperlimit2}`;
                      td9.innerHTML = responsePayload.interval;
                      // -------------
                      if (statusCode1 == 200) {
                        var _Date = new Date(responsePayload1.TIMESTAMP);
                        td10.innerHTML = _Date.toLocaleDateString([], {hour12: false,hour: "2-digit",minute: "2-digit"});
                      } else 
                      td10.innerHTML = "NA";
                      // -------------------
                      td11.innerHTML = '<a href="/sensors/edit?id=' + responsePayload.id + '">View/ Edit/ Delete</a>';
                    }
                  );
                } else {
                  console.log("Error trying to load check ID: ", sensorId);
                }
              }
            );
          });
          if ((allSensors.length = 0)) {
            // Show 'you have no sensors' message
            document.getElementById("noSensorsMessage").style.display =
              "table-row";
          }
          if (allSensors.length < 5) {
            // Show the createCheck CTA
            document.getElementById("createSensorCTA").style.display =
              "block";
          }
        }
        if (allSensors.length < 5) {
          // Show the createCheck CTA
          // document.getElementById("createSensorCTA").style.display = 'block';
        }
      } else {
        // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
        let loading = document.getElementById('loading');
        let sessionStop = document.createElement("div");
        sessionStop.innerHTML = `<img src="../public/icons/clock.png" style='text-align:center'></img><h1>SESSION ENDED. PLEASE LOGIN AGAIN</h1>`
        loading.after(sessionStop);
        if (loading) {
          console.log('.....loading.....')
          loading.remove();
        }
        return;
        //app.logUserOut();
      }
    });
    let loading = document.getElementById('loading');
    if (loading) {
      loading.remove();
    }
  } else {
    console.log("6..app.logUserOut");
    //app.logUserOut();
  }
};

// --------------------------------------
// Load the checks edit page specifically
// --------------------------------------
app.loadChecksEditPage = function () {
  // --------------------------------------------
  console.log("..[app.js].. loadDataOnPage > app.loadChecksListPage");
  // --------------------------------------------
  // Get the check id from the query string, if none is found then redirect back to dashboard
  var id =
    typeof window.location.href.split("=")[1] == "string" &&
    window.location.href.split("=")[1].length > 0
      ? window.location.href.split("=")[1]
      : false;
  if (id) {
    // Fetch the check data
    var queryStringObject = {
      id: id,
    };
    app.client.request(undefined,"api/checks","GET",queryStringObject,undefined,function (statusCode, responsePayload) {
        if (statusCode == 200) {
          // Put the hidden id field into both forms
          var hiddenIdInputs = document.querySelectorAll("input.hiddenIdInput");
          for (var i = 0; i < hiddenIdInputs.length; i++) {
            hiddenIdInputs[i].value = responsePayload.id;
          }
          // Put the data into the top form as values where needed
          document.querySelector("#checksEdit1 .displayIdInput").value = responsePayload.id;
          document.querySelector("#checksEdit1 .displayStateInput").value = responsePayload.state;
          document.querySelector("#checksEdit1 .protocolInput").value = responsePayload.protocol;
          document.querySelector("#checksEdit1 .urlInput").value = responsePayload.url;
          document.querySelector("#checksEdit1 .methodInput").value = responsePayload.method;
          document.querySelector("#checksEdit1 .timeoutInput").value = responsePayload.timeoutSeconds;
          var successCodeCheckboxes = document.querySelectorAll("#checksEdit1 input.successCodesInput");
          for (var i = 0; i < successCodeCheckboxes.length; i++) {
            if (responsePayload.successCodes.indexOf(parseInt(successCodeCheckboxes[i].value)) > -1) {
              successCodeCheckboxes[i].checked = true;
            }
          }
        } else {
          // If the request comes back as something other than 200, redirect back to dashboard
          // window.location = '/checks/all';
        }
      }
    );
  } else {
    // window.location = '/checks/all';
  }
};

// -----------------------------------------
// Load the sensors create page specifically
// -----------------------------------------
app.loadSensorsCreatePage = function () {
  // --------------------------------------------
  console.log("..[app.js].. loadDataOnPage > app.loadSensorsCreatePage");
  // --------------------------------------------
  var sensorTypes = document.querySelector("#sensorsCreate .sensortype");
  // ------------------------------
  var option1 = document.createElement("option");
  var option2 = document.createElement("option");
  var option3 = document.createElement("option");
  var option4 = document.createElement("option");
  var option5 = document.createElement("option");
  var option6 = document.createElement("option");
  var option7 = document.createElement("option");
  var option8 = document.createElement("option");
  var option9 = document.createElement("option");
  var option10 = document.createElement("option");
  var option11 = document.createElement("option");
  //  -----------------------------
  option1.value = "WI-SENSOR RH SENSOR (LORA)";
  option1.innerHTML = "WI-SENSOR RH SENSOR (LORA)";
  sensorTypes.add(option1);
  option2.value = "HONEYWELL FIRE-SMOKE DETECTR SENSOR (LORA)";
  option2.innerHTML = "HONEYWELL FIRE-SMOKE DETECTOR (LORA)";
  sensorTypes.add(option2);
  option3.value = "POWER METER SENSOR (485)";
  option3.innerHTML = "POWER METER (485)";
  sensorTypes.add(option3);
  option4.value = "ADC CONVERTOR (485)";
  option4.innerHTML = "ANALOG DIGITAL CONVERTOR (485)";
  sensorTypes.add(option4);
  option5.value = "WATER LEAK SENSOR (485)";
  option5.innerHTML = "WATER LEAK DETECTOR (485)";
  sensorTypes.add(option5);
  option6.value = "PIR SENSOR (485)";
  option6.innerHTML = "PROXIMITY INFRA-RED SENSOR (485)";
  sensorTypes.add(option6);
  option7.value = "RH SENSOR (485)";
  option7.innerHTML = "RH SENSOR (485)";
  sensorTypes.add(option7);
  option7.value = "AIR FLOW VELOCITY SENSOR (485)";
  option7.innerHTML = "AIR FLOW VELOCITY SENSOR (485)";
  sensorTypes.add(option7);
  option8.value = "AIR FLOW RH SENSOR (485)";
  option8.innerHTML = "AIR FLOW RH SENSOR (485)";
  sensorTypes.add(option8);
  option9.value = "RH SENSOR (485)";
  option9.innerHTML = "RH SENSOR (485)";
  sensorTypes.add(option9);
  option10.value = "WATER TEMPERATURE (485)";
  option10.innerHTML = "WATER TEMPERATURE SENSOR (485)";
  sensorTypes.add(option10);
  option11.value = "WATER PRESSURE (485)";
  option11.innerHTML = "WATER PRESSURE SENSOR (485)";
  sensorTypes.add(option11);
  /*
  <option value="LORA_WI_SENSOR" selected>LORA RH SENSOR (WI-SENSOR)</option>
  <option value="LORA_HONEYELL">LORA FIRE-SMOKE DETECTOR</option>
  <option value="485_PWR_MTR">485 POWER METER</option>
  <option value="485_ADC">485 ANALOG DIGITAL CONVERTOR</option>
  <option value="485_WTR_LEAK">485 WATER LEAK DETECTOR</option>
  <option value="485_PIR">485 PROXIMITY INFRA-RED SENSOR</option>
  <option value="485_RH">485 RH SENSOR</option>
  <option value="485_GPIO1">485 GPIO 1</option>
  <option value="485_GPIO2">485 GPIO 2</option>
  <option value="485_GPIO3">485 GPIO 3</option>
  <option value="485_GPIO4">485 GPIO 4</option>
  <option value="485_GPIO5">485 GPIO 5</option>
  */
};

// ---------------------------------------
// Load the sensors edit page specifically
// ---------------------------------------
app.loadSensorsEditPage = function () {
  // --------------------------------------------
  console.log("..[app.js].. loadDataOnPage > app.loadSensorsEditPage");
  // --------------------------------------------
  // Get the check id from the query string, if none is found then redirect back to dashboard
  var id = typeof window.location.href.split("=")[1] == "string" && window.location.href.split("=")[1].length > 0 ? window.location.href.split("=")[1] : false;
  var modeid = typeof window.location.href.split("=")[2] == "string" && window.location.href.split("=")[2].length > 0 ? window.location.href.split("=")[2] : false;
  // modeid = false : normal user
  // modeid = 3     : admin
  if (id) {
    // Fetch the check data
    var queryStringObject = {id: id,};
    app.client.request(undefined,"api/sensors","GET",queryStringObject,undefined,function (statusCode, responsePayload) {
      if (statusCode != 200)
        return;
      //  ---------------------------------------
      //  Put the hidden id field into both forms
      //  ---------------------------------------
      var hiddenIdInputs = document.querySelectorAll("input.hiddenIdInput");
      for (var i = 0; i < hiddenIdInputs.length; i++) {
        hiddenIdInputs[i].value = responsePayload.id;
      }
      const sensorType = responsePayload.sensortype;
      console.log(".............");
      console.log(`..SENSOR TYPE [${sensorType}]`);
      console.log(".............");
      //  -----------------------------------------------------
      //  Put the data into the top form as values where needed
      //  -----------------------------------------------------
      // input[name=firstname]    displayId   dtuId sensorId
      // document.querySelector("#sensorsEdit1 .displayGUIDInput").value = responsePayload.id;
      document.querySelector("#sensorsEdit1 input[name=displayId]").value = responsePayload.id;
      // document.querySelector("#sensorsEdit1 .displayDTUIDInput").value = responsePayload.dtuid;
      document.querySelector("#sensorsEdit1 input[name=dtuId]").value = responsePayload.dtuid;
      // document.querySelector("#sensorsEdit1 .displaySENSORIDInput").value = responsePayload.sensorid;
      document.querySelector("#sensorsEdit1 input[name=sensorId]").value = responsePayload.sensorid;
      document.querySelector("#sensorsEdit1 .displaySENSORNAMEInput").value = responsePayload.sensorname;
      //  RATING MIN
      //  RATING MAX
      document.querySelector("#sensorsEdit1 input[name=ratingMIN").value = responsePayload.ratingMIN;
      document.querySelector("#sensorsEdit1 input[name=ratingMAX").value = responsePayload.ratingMAX;
      //  CHANNEL 1
      document.querySelector("#sensorsEdit1 .displayLabelInput1").value = responsePayload.label1;
      document.querySelector("#sensorsEdit1 .displayLabelInput1").classList.add("disabled");
      document.querySelector("#sensorsEdit1 .displayLowerLimitInput1").value = responsePayload.lowerlimit1;
      document.querySelector("#sensorsEdit1 .displayupperlimitInput1").value = responsePayload.upperlimit1;
      //  CHANNEL 2
      document.querySelector("#sensorsEdit1 .displayLabelInput2").value = responsePayload.label2;
      document.querySelector("#sensorsEdit1 .displayLabelInput2").classList.add("disabled");
      document.querySelector("#sensorsEdit1 .displayLowerLimitInput2").value = responsePayload.lowerlimit2;
      document.querySelector("#sensorsEdit1 .displayupperlimitInput2").value = responsePayload.upperlimit2;
      //  CHANNEL 3
      document.querySelector("#sensorsEdit1 .displayLabelInput3").value = responsePayload.label3;
      document.querySelector("#sensorsEdit1 .displayLabelInput3").classList.add("disabled");
      document.querySelector("#sensorsEdit1 .displayLowerLimitInput3").value = responsePayload.lowerlimit3;
      document.querySelector("#sensorsEdit1 .displayupperlimitInput3").value = responsePayload.upperlimit3;
      //  CHANNEL 4
      document.querySelector("#sensorsEdit1 .displayLabelInput4").value = responsePayload.label4;
      document.querySelector("#sensorsEdit1 .displayLabelInput4").classList.add("disabled");
      document.querySelector("#sensorsEdit1 .displayLowerLimitInput4").value = responsePayload.lowerlimit4;
      document.querySelector("#sensorsEdit1 .displayupperlimitInput4").value = responsePayload.upperlimit4;
      // -------------------
      document.querySelector("#sensorsEdit1 .displaysensortypeInput").value = responsePayload.sensortype;
      document.querySelector("#sensorsEdit1 .displayscantimeInput").value = responsePayload.interval;
      //  --------------------
      //  HIDE "loggedInAdmin"
      //  --------------------
      var AdminAccessElements = document.getElementsByClassName("loggedInAdmin");
      app.client.request(undefined,"api/users","GET",app.config.sessionToken,undefined,function (statusCode, responsePayload) {
          var userType = responsePayload.type;
          // GET USER TYPE
          for (var i = 0; i < AdminAccessElements.length; i++) {
            if (userType == "admin")
              AdminAccessElements[i].style.display = "inine-block";
            else AdminAccessElements[i].style.display = "none";
          }
        }
      );
      //  --------
      //  FEATURES
      //  --------
      var featuresCheckboxes = document.querySelectorAll("#sensorsEdit1 input.featuresInput");
      for (var i = 0; i < featuresCheckboxes.length; i++) {
        if (responsePayload.features && responsePayload.features.indexOf(featuresCheckboxes[i].value) > -1) 
          featuresCheckboxes[i].checked = true;
      }
      //  -------------
      //  NOTIFICATIONS
      //  -------------
      var notificationsCheckboxes = document.querySelectorAll("#sensorsEdit1 input.notificationsInput");
      for (var i = 0; i < notificationsCheckboxes.length; i++) {
        if (responsePayload.notifications && responsePayload.notifications.indexOf(notificationsCheckboxes[i].value) > -1) 
          notificationsCheckboxes[i].checked = true;
      }
      //  ------
      //  ALERTS
      //  ------
      var alertCheckboxes = document.querySelectorAll("#sensorsEdit1 input.alertInput");
      for (var i = 0; i < alertCheckboxes.length; i++) {
        if (
          responsePayload.alerts &&
          responsePayload.alerts.indexOf(alertCheckboxes[i].value) > -1
        ) {
          alertCheckboxes[i].checked = true;
        }
      }
      }
    );
  } else {
    window.location = "/checks/all";
  }
};

// -------------------------
// Loop to renew token often
// -------------------------
app.tokenRenewalLoop = function () {
  // --------------------------------------------
  console.log('..[APP.JS].. INIT > app.tokenRenewalLoop')
  // --------------------------------------------
  setInterval(function () {
    app.renewToken(function (err) {
      if (!err) {
        console.log("Token renewed successfully @ " + Date.now());
      }
    });
  }, 1000 * 60 * 60);
};

// --------------------
// Init (bootstrapping)
// --------------------
app.init = function () {
  // Bind all form submissions
  app.bindForms();
  // Bind logout logout button
  app.bindLogoutButton();
  // Get the token from localstorage
  app.getSessionToken();
  // Renew token
  app.tokenRenewalLoop();
  // Load data on page
  app.loadDataOnPage();
};

// ----------------------------------------------
// Call the init processes after the window loads
// ----------------------------------------------
window.onload = function () {
  app.init();
};
