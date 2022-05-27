/*
 * Request Handlers
 */

// Dependencies
var _data = require("./data");
var _logs = require("./logs");
var helpers = require("./helpers");
var config = require("./config");
const { createBrotliCompress } = require("zlib");
const { log } = require("console");

// Define all the handlers
var handlers = {};

/* --------------------------
   HTML HANDLERS - ROUTER URL
   --------------------------
INDEX             handlers.index,
view/CardView     handlers.viewCardList,
view/SystemView   handlers.viewSystemList,
schedules/all     handlers.schedulesList
account/create    handlers.accountCreate,
account/edit      handlers.accountEdit,
account/deleted   handlers.accountDeleted,
systems/create    handlers.systemsCreate,
session/create    handlers.sessionCreate,
session/deleted   handlers.sessionDeleted,
sensors/create    handlers.sensorsCreate,
sensors/edit      handlers.sensorsEdit,
checks/all        handlers.checksList,
checks/create     handlers.checksCreate,
checks/edit       handlers.checksEdit,
*/

// -----
// Index
// -----
handlers.index = function (data, callback) {
  console.log('[Handlers.js] .. Index'.red)
  // -----------------------
  // Reject any request that isn't a GET
  // -----------------------
  if (data.method == "get") {
    // ------------------------------
    // Prepare data for interpolation
    // ------------------------------
    var templateData = {
      "head.title": "IOT PLATFORM",
      "head.description":
        "The platform offer free, simple uptime monitoring for HTTP/HTTPS sites all kinds. When your site goes down, we'll send you a text to let you know",
      "body.class": "index",
    };
    // ------------------------------
    // Read in a template as a string
    // ------------------------------
    helpers.getTemplate("index", templateData, function (err, str) {
      if (!err && str) {
        // -----------------------------------
        // Add the universal header and footer
        // -----------------------------------
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // ------------------------
            // Return that page as HTML
            // ------------------------
            callback(200, str, "html");
            // ------------------------
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

// --------
// CardView
// --------
handlers.viewCardList = function (data, callback) {    
  console.log('[Handlers.js] .. viewCardList'.red)
  // -----------------------
  // Reject any request that isn't a GET
  // -----------------------
  if (data.method == "get") {
    // ------------------------------
    // Prepare data for interpolation
    // ------------------------------
    var templateData = {
      "head.title": "IOT PLATFORM (CARD VIEW)",
      "head.description": "The platform offer free, simple uptime monitoring for HTTP/HTTPS sites all kinds. When your site goes down, we'll send you a text to let you know",
      "body.class": "cardView",
    };
    // ------------------------------
    // Read in a template as a string
    // ------------------------------
    helpers.getTemplate("cardView", templateData, function (err, str) {
      if (!err && str) {
        // -----------------------------------
        // Add the universal header and footer
        // -----------------------------------
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // ------------------------
            // Return that page as HTML
            // ------------------------
            callback(200, str, "html");
            // ------------------------
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

// ----------
// SystemView
// ----------
handlers.viewSystemList = function(data,callback) {
  console.log('[Handlers.js] .. viewSystemList'.red)
  // -----------------------
  // Reject any request that isn't a GET
  // -----------------------
  if (data.method == "get") {
    // ------------------------------
    // Prepare data for interpolation
    // ------------------------------
    var templateData = {
      "head.title": "IOT PLATFORM (CARD VIEW)",
      "head.description": "The platform offer free, simple uptime monitoring for HTTP/HTTPS sites all kinds. When your site goes down, we'll send you a text to let you know",
      "body.class": "systemView",
    };
    // ------------------------------
    // Read in a template as a string
    // ------------------------------
    helpers.getTemplate("systemView", templateData, function (err, str) {
      if (!err && str) {
        // -----------------------------------
        // Add the universal header and footer
        // -----------------------------------
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // ------------------------
            // Return that page as HTML
            // ------------------------
            callback(200, str, "html");
            // ------------------------
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
}

// --------------
// Create Account
// --------------
handlers.accountCreate = function (data, callback) {
  // -------------------------------------------
  console.log("[handlers.js] accountCreate..%s".red, data.payload);
  // -------------------------------------------
  // Reject any request that isn't a GET
  if (data.method == "get") {
    // Prepare data for interpolation
    var templateData = {
      "head.title": "Create an Account",
      "head.description": "Signup is easy and only takes a few seconds.",
      "body.class": "accountCreate",
    };
    // Read in a template as a string
    helpers.getTemplate("accountCreate", templateData, function (err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, "html");
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

// ------------------
// Create New Session
// ------------------
handlers.sessionCreate = function (data, callback) {
  // ------------------------------------------
  console.log("[handlers.js] sessionCreate..%s".red, data.payload);
  // ------------------------------------------
  // Reject any request that isn't a GET
  if (data.method == "get") {
    // Prepare data for interpolation
    var templateData = {
      "head.title": "Login to your account.",
      "head.description":
        "Please enter your phone number and password to access your account.",
      "body.class": "sessionCreate",
    };
    // Read in a template as a string
    helpers.getTemplate("sessionCreate", templateData, function (err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, "html");
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

// -----------------
// Edit Your Account
// -----------------
handlers.accountEdit = function (data, callback) {
  // ----------------------------------------
  console.log("[handlers.js] accountEdit..%s".red, data.payload);
  // ----------------------------------------
  // Reject any request that isn't a GET
  if (data.method == "get") {
    // Prepare data for interpolation
    var templateData = {
      "head.title": "Account Settings",
      "body.class": "accountEdit",
    };
    // Read in a template as a string
    helpers.getTemplate("accountEdit", templateData, function (err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, "html");
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

// ------------------------
// Session has been deleted
// ------------------------
handlers.sessionDeleted = function (data, callback) {
  // -------------------------------------------
  console.log("[handlers.js] sessionDeleted..%s".red, data.payload);
  // -------------------------------------------
  // Reject any request that isn't a GET
  if (data.method == "get") {
    // Prepare data for interpolation
    var templateData = {
      "head.title": "Logged Out",
      "head.description": "You have been logged out of your account.",
      "body.class": "sessionDeleted",
    };
    // Read in a template as a string
    helpers.getTemplate("sessionDeleted", templateData, function (err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, "html");
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

// ------------------------
// Account has been deleted
// ------------------------
handlers.accountDeleted = function (data, callback) {
  // -------------------------------------------
  console.log("[handlers.js] accountDeleted..%s".red, data.payload);
  // -------------------------------------------
  // Reject any request that isn't a GET
  if (data.method == "get") {
    // Prepare data for interpolation
    var templateData = {
      "head.title": "Account Deleted",
      "head.description": "Your account has been deleted.",
      "body.class": "accountDeleted",
    };
    // Read in a template as a string
    helpers.getTemplate("accountDeleted", templateData, function (err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, "html");
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

// -------------------
// Create a new system
// -------------------
handlers.systemsCreate = function(data, callback) {
  // -------------------------
  console.log("[handlers.js] systemsCreate..%s".red, data.payload);
  // -------------------------
  // Reject any request that isn't a GET
  if (data.method == "get") {
    // Prepare data for interpolation
    var templateData = {
      "head.title": "Create a New System",
      "body.class": "systemsCreate",
    };
    // Read in a template as a string
    helpers.getTemplate("systemsCreate", templateData, function (err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, "html");
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
}

// -------------------
// Create a new sensor
// -------------------
handlers.sensorsCreate = function (data, callback) {
  // -------------------------
  console.log("[handlers.js] sensorsCreate..%s".red, data.payload);
  // -------------------------
  // Reject any request that isn't a GET
  if (data.method == "get") {
    // Prepare data for interpolation
    var templateData = {
      "head.title": "Create a New Sensor",
      "body.class": "sensorsCreate",
    };
    // Read in a template as a string
    helpers.getTemplate("sensorsCreate", templateData, function (err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, "html");
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

// -------------
// Edit a Sensor
// -------------
handlers.sensorsEdit = function (data, callback) {
  // -----------------------
  console.log("[handlers.js] ..sensorsEdit..".red);
  // -----------------------
  // Reject any request that isn't a GET
  if (data.method == "get") {
    // Prepare data for interpolation
    var templateData = {
      "head.title": "Sensor Details",
      "body.class": "sensorsEdit",
    };
    // Read in a template as a string
    helpers.getTemplate("sensorsEdit", templateData, function (err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, "html");
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

// ------------------------------
// Dashboard (view all Schedules)
// ------------------------------
handlers.schedulesList = function(data,callback){
  // -------------------------
  console.log("[handlers.js] schedulesList..".red);
  // -------------------------
  // Reject any request that isn't a GET
  if (data.method == "get") {
    // Prepare data for interpolation
    var templateData = {
      "head.title": "Dashboard",
      "body.class": "schedulesList",
    };
    // Read in a template as a string
    helpers.getTemplate("schedulesList", templateData, function (err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, "html");
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }

}

// ------------------
// Create a new check
// ------------------
handlers.checksCreate = function (data, callback) {
  // -----------------------
  console.log("[handlers.js] checksCreate..%s".red, data.payload);
  // -----------------------
  // Reject any request that isn't a GET
  if (data.method == "get") {
    // Prepare data for interpolation
    var templateData = {
      "head.title": "Create a New Check",
      "body.class": "checksCreate",
    };
    // Read in a template as a string
    helpers.getTemplate("checksCreate", templateData, function (err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, "html");
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

// ---------------------------
// Dashboard (view all checks)
// ---------------------------
handlers.checksList = function (data, callback) {
  // -------------------------
  console.log("[handlers.js] checksList..%s".red, data.payload);
  // -------------------------
  // Reject any request that isn't a GET
  if (data.method == "get") {
    // Prepare data for interpolation
    var templateData = {
      "head.title": "Dashboard",
      "body.class": "checksList",
    };
    // Read in a template as a string
    helpers.getTemplate("checksList", templateData, function (err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, "html");
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

// ------------
// Edit a Check
// ------------
handlers.checksEdit = function (data, callback) {
  // -------------------------
  console.log("[handlers.js] checksEdit..%s".red, data.payload);
  // -------------------------
  // Reject any request that isn't a GET
  if (data.method == "get") {
    // Prepare data for interpolation
    var templateData = {
      "head.title": "Check Details",
      "body.class": "checksEdit",
    };
    // Read in a template as a string
    helpers.getTemplate("checksEdit", templateData, function (err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function (err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, "html");
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

// -------
// Favicon
// -------
handlers.favicon = function (data, callback) {
  // -------------------------------------
  console.log("[handlers.js] favicon..%s".red, data.payload);
  // ------------------------------------
  // Reject any request that isn't a GET
  if (data.method == "get") {
    // Read in the favicon's data
    helpers.getStaticAsset("favicon.ico", function (err, data) {
      if (!err && data) {
        // Callback the data
        callback(200, data, "favicon");
      } else {
        callback(500);
      }
    });
  } else {
    callback(405);
  }
};

// -------------
// Public assets
// -------------
handlers.public = function (data, callback) {
  // Reject any request that isn't a GET
  if (data.method == "get") {
    // Get the filename being requested
    var trimmedAssetName = data.trimmedPath.replace("public/", "").trim();
    // -------------------------------
    if (trimmedAssetName.length > 0) {
      // Read in the asset's data
      helpers.getStaticAsset(trimmedAssetName, function (err, data) {
        if (!err && data) {
          // Determine the content type (default to plain text)
          var contentType = "plain";
          if (trimmedAssetName.indexOf(".css") > -1) {
            contentType = "css";
          }
          if (trimmedAssetName.indexOf(".png") > -1) {
            contentType = "png";
          }
          if (trimmedAssetName.indexOf(".jpg") > -1) {
            contentType = "jpg";
          }
          if (trimmedAssetName.indexOf(".ico") > -1) {
            contentType = "favicon";
          }
          // Callback the data
          callback(200, data, contentType);
        } else {
          callback(404);
        }
      });
    } else {
      callback(404);
    }
  } else {
    callback(405);
  }
};

/*
 * JSON API HANDLERS
 */
// Example Error
handlers.exampleError = function (data, callback) {
  console.log("[handlers.js] exampleError..%s", data.payload);
  var err = new Error("This Is An Example Error..");
  throw err;
};

// Ping
handlers.ping = function (data, callback) {
  console.log("[handlers.js] ping..%s", data.payload);
  callback(200,{'Message':'OK'});
};

// Not-Found
handlers.notFound = function (data, callback) {
  // console.log("[handlers.js] notFound..%s", data.payload);
  callback(404, undefined, "html");
};

// -----
// Users
// -----
handlers.users = function (data, callback) {
  // -----------------------
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};
// Container for all the users methods
handlers._users = {};
// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function (data, callback) {
  // -----------------------------------------------
  console.log("[handlers.js] api/users.. [POST]..");
  // -----------------------------------------------
  //  Check that all required fields are filled out 
  //  (SEND UNDER BODY FOR PAYLOAD NOT PARAM)
  // ----------------------------------------
  var firstName = typeof data.payload.firstname == "string" && data.payload.firstname.trim().length > 0 ? data.payload.firstname.trim() : false;
  var lastName = typeof data.payload.lastname == "string" && data.payload.lastname.trim().length > 0 ? data.payload.lastname.trim() : false;
  var phone = typeof data.payload.phone == "string" && data.payload.phone.trim().length >= 10 ? data.payload.phone.trim() : false;
  var password = typeof data.payload.password == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof data.payload.tosAgreement == "boolean" && data.payload.tosAgreement == true ? true : false;
  // --------------------------------------------------------------
  if (firstName && lastName && phone && password && tosAgreement) {
    // 
    // Make sure the user doesnt already exist
    _data.read("users", phone, function (err, data) {
      if (err) {
        // Hash the password
        var hashedPassword = helpers.hash(password);

        // Create the user object
        if (hashedPassword) {
          var userObject = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            hashedPassword: hashedPassword,
            tosAgreement: true,
            sensors: [],
            checks: []
          };

          // Store the user
          _data.create("users", phone, userObject, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: "Could not create the new user" });
            }
          });
        } else {
          callback(500, { Error: "Could not hash the user's password." });
        }
      } else {
        // User alread exists
        callback(400, {
          Error: "A user with that phone number already exists",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields in user creation" });
  }
};
// Required data: phone
// Optional data: none
handlers._users.get = function (data, callback) {
  //  ----------------------
  // Check that phone number is valid
  var phone = typeof data.queryStringObject.phone == "string" && data.queryStringObject.phone.trim().length >= 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    // Get token from headers
    var token = typeof data.headers.token == "string" ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    // -------------------------
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        var selPhone = typeof data.queryStringObject.SelAccount == "string" && data.queryStringObject.SelAccount.trim().length >= 10 ? data.queryStringObject.SelAccount.trim() : false;
        if (selPhone)
          phone = selPhone
        //  --------------
        _data.read("users", phone, function (err, data) {
          if (!err && data) {
            // Remove the hashed password from the user user object before returning it to the requester
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header, or token is invalid.",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = function (data, callback) {
  // ---------------------------------------
  console.log("[handlers.js] api/users.. PUT..");
  // ---------------------------------------
  // Check for required field
  var phone = typeof data.payload.phone == "string" && data.payload.phone.trim().length >= 10 ? data.payload.phone.trim() : false;
  // Check for optional fields
  var firstName = typeof data.payload.firstName == "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof data.payload.lastName == "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof data.payload.password == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var sensorIds = typeof data.payload.sensorIds == "object" && data.payload.sensorIds instanceof Array && data.payload.sensorIds.length > 0 ? data.payload.sensorIds : [];
  // Error if phone is invalid
  if (phone) {
    // Error if nothing is sent to update
    if (firstName || lastName || password || sensorIds)  {
      // Get token from headers
      var token = typeof data.headers.token == "string" ? data.headers.token : false;
      // Verify that the given token is valid for the phone number
      handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
        if (tokenIsValid) {
          // Lookup the user
          var selPhone = typeof data.payload.Selphone == "string" && data.payload.Selphone.trim().length >= 10 ? data.payload.Selphone.trim() : false;
          if (selPhone) 
            phone = selPhone
          // ---------------
          _data.read("users", phone, function (err, userData) {
            if (!err && userData) {
              // Update the fields if necessary
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }
              if (sensorIds) {
                userData.sensors = sensorIds
              }
              // Store the new updates
              _data.update("users", phone, userData, function (err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { Error: "Could not update the user." });
                }
              });
            } else {
                callback(400, { Error: "Specified user does not exist." });
            }
          });
        } else {
          callback(403, {
            Error: "Missing required token in header, or token is invalid.",
          });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update." });
    }
  } else {
    callback(400, { Error: "Missing required field." });
  }
};
// Required data: phone
// Cleanup old checks associated with the user
handlers._users.delete = function (data, callback) {
  console.log("[handlers.js] api/users.. DELETE..%s", data.payload);
  // Check that phone number is valid
  var phone = typeof data.queryStringObject.phone == "string" && data.queryStringObject.phone.trim().length >= 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    // Get token from headers
    var token = typeof data.headers.token == "string" ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read("users", phone, function (err, userData) {
          if (!err && userData) {
            // Delete the user's data
            _data.delete("users", phone, function (err) {
              if (!err) {
                // Delete each of the checks associated with the user
                var userChecks = typeof userData.checks == "object" && userData.checks instanceof Array ? userData.checks : [];
                var checksToDelete = userChecks.length;
                if (checksToDelete > 0) {
                  var checksDeleted = 0;
                  var deletionErrors = false;
                  // Loop through the checks
                  userChecks.forEach(function (checkId) {
                    // Delete the check
                    _data.delete("checks", checkId, function (err) {
                      if (err) {
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      if (checksDeleted == checksToDelete) {
                        if (!deletionErrors) {
                          callback(200);
                        } else {
                          callback(500, {
                            Error:
                              "Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully.",
                          });
                        }
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500, { Error: "Could not delete the specified user" });
              }
            });
          } else {
            callback(400, { Error: "Could not find the specified user." });
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header, or token is invalid.",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// ------
// Tokens
// ------
handlers.tokens = function (data, callback) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};
// Container for all the tokens methods
handlers._tokens = {};
// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function (data, callback) {
  // -------------------------------------
  // console.log("[handlers.js] api/tokens.. POST");
  // ----------------------
  var phone = typeof data.payload.phone == "string" && data.payload.phone.trim().length >= 10 ? data.payload.phone.trim() : false;
  var password = typeof data.payload.password == "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  // -------------------
  if (phone && password) {
    // Lookup the user who matches that phone number
    _data.read("users", phone, function (err, userData) {
      if (!err && userData) {
        // Hash the sent password, and compare it to the password stored in the user object
        var hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            phone: phone,
            id: tokenId,
            expires: expires,
          };

          // Store the token
          _data.create("tokens", tokenId, tokenObject, function (err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: "Could not create the new token" });
            }
          });
        } else {
          callback(400, {
            Error:
              "Password did not match the specified user's stored password",
          });
        }
      } else {
        callback(400, { Error: "Could not find the specified user." });
      }
    });
  } else {
    callback(400, { Error: "Missing required field(s)." });
  }
};
// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function (data, callback) {
  // --------
  // console.log("[handlers.js] api/tokens/GET  ..[%s]", data.queryStringObject.id);
  // Check that id is valid
  var id = typeof data.queryStringObject.id == "string" && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  // ----------------------
  if (id) {
    // Lookup the token
    _data.read("tokens", id, function (err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field, or field invalid" });
  }
};
// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function (data, callback) {
  // -------------
  // console.log("[handlers.js] api/tokens.. PUT..");
  // -------------
  // Check that id is valid
  var id = typeof data.payload.id == "string" && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof data.payload.extend == "boolean" && data.payload.extend == true ? true : false;
  // ----------------
  if (id && extend) {
    // Lookup the existing token
    _data.read("tokens", id, function (err, tokenData) {
      if (!err && tokenData) {
        // Check to make sure the token isn't already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          // Store the new updates
          _data.update("tokens", id, tokenData, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, {
                Error: "Could not update the token's expiration.",
              });
            }
          });
        } else {
          callback(400, {
            Error: "The token has already expired, and cannot be extended.",
          });
        }
      } else {
        callback(400, { Error: "Specified user does not exist." });
      }
    });
  } else {
    callback(400, {
      Error: "Missing required field(s) or field(s) are invalid.",
    });
  }
};
// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function (data, callback) {
  console.log("[handlers.js] api/tokens.. DELETE..%s", data.payload);
  // Check that id is valid
  var id = typeof data.queryStringObject.id == "string" && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  // -------
  if (id) {
    // Lookup the token
    _data.read("tokens", id, function (err, tokenData) {
      if (!err && tokenData) {
        // Delete the token
        _data.delete("tokens", id, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Could not delete the specified token" });
          }
        });
      } else {
        callback(400, { Error: "Could not find the specified token." });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};
// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function (id, phone, callback) {
  // Lookup the token
  _data.read("tokens", id, function (err, tokenData) {
    if (!err && tokenData) {
      // Check that the token is for the given user and has not expired
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });

};

// ------
// Alerts
// ------
handlers.alerts = function(data,callback){
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._alerts[data.method](data, callback);
  } else {
    callback(405);
  }
}
// Container for all the alerts methid
handlers._alerts = {};
// Alerts - get
// Requried data : id
// Optional data : none
handlers._alerts.get = function(data,callback) {  
  // -----------------------------------------
  console.log("[handlers.js] api/alerts/GET ..[" +data.headers.token.rainbow+ "]");

  //  ----------------------
  // Check that phone number is valid
  var phone = typeof data.queryStringObject.phone == "string" && data.queryStringObject.phone.trim().length >= 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    // Get token from headers
    var token = typeof data.headers.token == "string" ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      console.log("[handlers.js] api/users/GET  ..VERIFIED [" +tokenIsValid+ "]");
      if (tokenIsValid) {
        // Lookup the user
        _logs.read('ALERT_SENT',-1,null,null,false,function(err,alertsdata){
          callback(200,{ data: alertsdata})
        })    
      } else {
        callback(403, {Error: "Missing required token in header, or token is invalid."});
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }  
}

// --------
// Gateways
// --------
handlers.gateways = function(data,callback){
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._gateways[data.method](data, callback);
  } else {
    callback(405);
  }
}
// Container for all the gateways method
handlers._gateways = {};
// Gateways - get
// Requried data : id
// Optional data : none
handlers._gateways.get = function(data,callback) {
  // -----------------------------------------
  console.log("[handlers.js] api/gateways.. GET.");
  // -----------------------------------------
  // Get the token that sent the request
  var token = typeof data.headers.token == "string" ? data.headers.token : false;
  var id = typeof data.queryStringObject.id == "string" && data.queryStringObject.id.trim().length > 9 ? data.queryStringObject.id.trim() : false;
  // ------------------
  if (token) {    
    // Return gateway data
    var gatewayDatas = [];
    _data.list("gateways", function (err, gatewayIds) {
      if (!err && gatewayIds && gatewayIds.length > 0) {
        let counter = 0;
        gatewayIds.forEach(function (gatewayId) {
          _data.read("gateways", gatewayId, function (err, gatewayData) {
            gatewayDatas.push(gatewayData);
            ++counter;
            if (counter == gatewayIds.length) {
              callback(200, gatewayDatas);
            }
          });
        });
      } else {
        callback(200, { Message: "No Data Available" });
      }
    });
  }
}

// --------
// Accounts
// --------
handlers.accounts = function(data,callback){
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._accounts[data.method](data, callback);
  } else {
    callback(405);
  }
}
// Container for all the accounts method
handlers._accounts = {};
// Accounts - get
// Required data : id
// Optional data : none
handlers._accounts.get = function(data,callback){
  // -----------------------------------------
  console.log("[handlers.js] api/accounts.. GET.");
  // -----------------------------------------
  // Get the token that sent the request
  var token = typeof data.headers.token == "string" ? data.headers.token : false;
  var id = typeof data.queryStringObject.id == "string" && data.queryStringObject.id.trim().length > 9 ? data.queryStringObject.id.trim() : false;
  // ---------------
  if (token && id == false) {
    // Return user data
    var userDatas = [];
    _data.list("users", function (err, userDatas) {
      if (!err && userDatas) {
        callback(200, userDatas);
      } else {
        callback(404);
      }
    });

  } else {
    callback(400, { Error: "Missing Required TOKEN Field, Or Field Invalid" });
  }
}

// ---------
// Utilities
// ---------
const getLastItem = thePath => thePath.substring(thePath.lastIndexOf('/') + 1)

// -------
// Sensors
// -------
handlers.sensors = function (data,callback) {
  const lastItem = getLastItem(data.trimmedPath)
  const strArr = data.trimmedPath.split('/');
  var acceptableMethods = ["post", "get", "put", "delete"];
  // -----------------------------------------------
  if (acceptableMethods.indexOf(data.method) > -1) {
    if (strArr.length == 2) handlers._sensors[data.method](data, callback);
    if (strArr.length == 3) {
      handlers._sensors_data[data.method](data,callback);
    }
  } else {
    callback(405);
  }
};
// Container for all the sensors methods
handlers._sensors = {};
handlers._sensorstypes = {};
handlers._sensors_data = {};
// Sensors - post
// Required data: DTUID, SENSORID, SENSORTYPE, FEATURES, NOTIFICATION MODES, INTERVAL
// Optional data: none
handlers._sensors.post = function (data,callback) {
  // -------------------------------------------
  console.log("[HANDLERS.JS] api/sensors.. POST");
  // -----------------------
  // Get the token that sent the request
  var dtuid         = typeof data.payload.dtuid == "string" && parseInt(data.payload.dtuid) < 256 ? parseInt(data.payload.dtuid) : false;
  var sensorid      = typeof data.payload.sensorid == "string" && data.payload.sensorid.length > 0 ? data.payload.sensorid : false;
  var sensortype    = typeof data.payload.sensortype == "string" && data.payload.sensortype.length > 0 ? data.payload.sensortype : false;
  var sensorname    = typeof data.payload.sensorname == "string" && data.payload.sensorname.length > 0 ? data.payload.sensorname : "";
  // -----------
  var ratingMIN     = typeof data.payload.ratingMIN == "string" ? data.payload.ratingMIN : false;
  var ratingMAX     = typeof data.payload.ratingMAX == "string" ? data.payload.ratingMAX : false;
  // ----------
  var label1        = typeof data.payload.label1 == "string" ? data.payload.label1 : false;
  var lowerlimit1    = typeof data.payload.lowerlimit1 == "string" ? data.payload.lowerlimit1 : false;
  var upperlimit1    = typeof data.payload.upperlimit1 == "string" ? data.payload.upperlimit1 : false;
  var label2        = typeof data.payload.label2 == "string" ? data.payload.label2 : false;
  var lowerlimit2    = typeof data.payload.lowerlimit2 == "string" ? data.payload.lowerlimit2 : false;
  var upperlimit2    = typeof data.payload.upperlimit2 == "string" ? data.payload.upperlimit2 : false;
  var label3        = typeof data.payload.label3 == "string" ? data.payload.label3 : false;
  var lowerlimit3    = typeof data.payload.lowerlimit3 == "string" ? data.payload.lowerlimit3 : false;
  var upperlimit3    = typeof data.payload.upperlimit3 == "string" ? data.payload.upperlimit3 : false;
  var label4        = typeof data.payload.label4 == "string" ? data.payload.label4 : false;
  var lowerlimit4    = typeof data.payload.lowerlimit4 == "string" ? data.payload.lowerlimit4 : false;
  var upperlimit4    = typeof data.payload.upperlimit4 == "string" ? data.payload.upperlimit4 : false;
  var features      = typeof data.payload.features == "object" && data.payload.features instanceof Array && data.payload.features.length > 0 ? data.payload.features : [];
  var notifications = typeof data.payload.notification == "object" && data.payload.notification instanceof Array && data.payload.notification.length > 0 ? data.payload.notification : [];
  var alerts        = typeof data.payload.alert == "object" && data.payload.alert instanceof Array && data.payload.alert.length > 0 ? data.payload.alert : [];
  var interval      = typeof data.payload.interval == "number" && data.payload.interval % 1 === 0 && data.payload.interval >= 0 && data.payload.interval <= 60 ? data.payload.interval : false;
  // -------------
  if (sensortype != "WI-SENSOR RH SENSOR (LORA)") {
    sensorid = typeof parseInt(data.payload.sensorid) == "number" && parseInt(data.payload.sensorid) < 256 ? parseInt(data.payload.sensorid) : false;
    dtuid    = typeof parseInt(data.payload.dtuid) == "number" && parseInt(data.payload.dtuid) < 256 ? parseInt(data.payload.dtuid) : false;
  }
  // ----------------------------------------------
  if (dtuid && sensorid && sensortype && interval) {
    // Get token from headers
    var token = typeof data.headers.token == "string" ? data.headers.token : false;
    // Lookup the user phone by reading the token
    _data.read("tokens", token, function (err, tokenData) {
      if (!err && tokenData) {
        var userPhone = tokenData.phone;
        // Lookup the user data
        _data.read("users", userPhone, function (err, userData) {
          if (!err && userData) {
            var userSensors = typeof userData.sensors == "object" && userData.sensors instanceof Array ? userData.sensors : [];
            if (userSensors.length < config.maxSensors) {
              // Create random id for check
              var checkId = helpers.createRandomString(20);
              // Create check object including userPhone
              var checkObject = {
                id: checkId,
                dtuid: dtuid,
                sensorid: sensorid,
                sensortype,
                sensorname,
                features: features,
                notifications: notifications,
                ratingMIN,
                ratingMAX,
                label1,
                lowerlimit1,
                upperlimit1,
                label2,
                lowerlimit2,
                upperlimit2,
                label3,
                lowerlimit3,
                upperlimit3,
                label4,
                lowerlimit4,
                upperlimit4,
                alerts,
                userPhone: userPhone,
                interval: interval,
              };
              // Save the object
              _data.create("sensors", checkId, checkObject, function (err) {
                if (!err) {
                  // Add check id to the user's object
                  userData.sensors = userSensors;
                  userData.sensors.push(checkId);
                  // Save the new user data
                  _data.update("users", userPhone, userData, function (err) {
                    if (!err) {
                      // Return the data about the new check
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        Error: "Could not update the user with the new sensor.",
                      });
                    }
                  });
                } else {
                  callback(500, { Error: "Could not create the new sensor" });
                }
              });
            } else {
              callback(400, { Error: "The user already has the maximum number of sensors (" + config.maxChecks + ").",
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { Error: "Missing required inputs, or inputs are invalid" });
  }
};
// Sensors - get
// Required data: id
// Optional data: none
handlers._sensors.get = function (data,callback) {
  // -----------------------------------------
  // Get the token that sent the request
  var token = typeof data.headers.token == "string" ? data.headers.token : false;
  var id = typeof data.queryStringObject.id == "string" && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;
  //  -------------------------------
  // IF id is provided - search within SENSORS directory with filename that match id as... _data.read
  // IF id is not provoded = FALSE - return full List as... _data.list
  if (id && token) {
    // Lookup the check
    _data.read("sensors", id, function (err, sensorData) {
      if (!err && sensorData) {
        // Return check data
        callback(200, sensorData);
      } else {
        callback(403);
      }
    });
  } else if (token) {
    // Return check data
    _data.list("sensors", function (err, sensorIds) {
      if (!err && sensorIds && sensorIds.length > 0) {
        let counter = 0;
        var sensorDatas = [];
        sensorIds.forEach(function (sensorId) {
          _data.read("sensors", sensorId, function (err, sensorData) {
            try{
              handlers._tokens.verifyToken(token,sensorData.userPhone,function (tokenIsValid) {
                  if (tokenIsValid) {
                    sensorDatas.push(sensorData);
                  }
                  ++counter;
                  if (counter == sensorIds.length) {
                    callback(200, sensorDatas);
                  }
                }
              );
            }
            catch(err){
            }
          });
        });
      } else {
        callback(200, { Message: "No Data Available" });
      }
    });
  } else {
    callback(400, { Error: "Missing Required TOKEN Field, Or Field Invalid" });
  }
};
// Sensors - put
// Required data: id
// Optional data: DTUID, SENSORID, SENSORTYPE, FEATURES, NOTIFICATION MODES, INTERVAL (one must be sent)
handlers._sensors.put = function (data,callback) {
  // --------------------------------------------
  console.log("[handlers.js] api/sensors.. PUT.");
  console.log(data.payload);
  // ------------------------
  // Check for required field
  // ------------------------
  var id            = typeof data.payload.id == "string" && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var dtuid         = typeof parseInt(data.payload.dtuId) == "number" && parseInt(data.payload.dtuId) < 256 ? parseInt(data.payload.dtuId) : false;
  var sensorid      = typeof data.payload.sensorId == "string" && data.payload.sensorId.length > 0 ? data.payload.sensorId : false;
  var sensortype    = typeof data.payload.sensortype == "string" && data.payload.sensortype.length > 0 ? data.payload.sensortype : false;
  var sensorname    = typeof data.payload.sensorname == "string" && data.payload.sensorname.length > 0 ? data.payload.sensorname : "";
  // -----------
  var ratingMIN     = typeof data.payload.ratingMIN == "string" ? data.payload.ratingMIN : false;
  var ratingMAX     = typeof data.payload.ratingMAX == "string" ? data.payload.ratingMAX : false;
  // ----------
  var label1        = typeof data.payload.label1 == "string" ? data.payload.label1 : false;
  var lowerlimit1   = typeof data.payload.lowerlimit1 == "string" ? data.payload.lowerlimit1 : false;
  var upperlimit1   = typeof data.payload.upperlimit1 == "string" ? data.payload.upperlimit1 : false;
  var label2        = typeof data.payload.label2 == "string" ? data.payload.label2 : false;
  var lowerlimit2   = typeof data.payload.lowerlimit2 == "string" ? data.payload.lowerlimit2 : false;
  var upperlimit2   = typeof data.payload.upperlimit2 == "string" ? data.payload.upperlimit2 : false;
  var label3        = typeof data.payload.label3 == "string" ? data.payload.label3 : false;
  var lowerlimit3   = typeof data.payload.lowerlimit3 == "string" ? data.payload.lowerlimit3 : false;
  var upperlimit3   = typeof data.payload.upperlimit3 == "string" ? data.payload.upperlimit3 : false;
  var label4        = typeof data.payload.label4 == "string" ? data.payload.label4 : false;
  var lowerlimit4   = typeof data.payload.lowerlimit4 == "string" ? data.payload.lowerlimit4 : false;
  var upperlimit4   = typeof data.payload.upperlimit4 == "string" ? data.payload.upperlimit4 : false;
  var features      = typeof data.payload.features == "object" && data.payload.features instanceof Array && data.payload.features.length > 0 ? data.payload.features : [];
  var notifications = typeof data.payload.notification == "object" && data.payload.notification instanceof Array && data.payload.notification.length > 0 ? data.payload.notification : [];
  var alerts        = typeof data.payload.alert == "object" && data.payload.alert instanceof Array && data.payload.alert.length > 0 ? data.payload.alert : [];
  var interval      = typeof data.payload.interval == "number" && data.payload.interval % 1 === 0 && data.payload.interval >= 0 && data.payload.interval <= 60 ? data.payload.interval : false;
  // ----------------------
  // Error if id is invalid
  // ----------------------
  if (id) {
    // Error if nothing is sent to update
    if (dtuid || sensorid || sensortype || interval) {
      // Lookup the check
      _data.read("sensors", id, function (err, sensorData) {
        if (!err && sensorData) {
          // Get the token that sent the request
          var token = typeof data.headers.token == "string" ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken( token,sensorData.userPhone,function (tokenIsValid) {
            //  ---------------------------------
            if (tokenIsValid || !tokenIsValid) {
              // Update check data where necessary
              if (dtuid) { sensorData.dtuid = dtuid; }
              if (sensorid) { sensorData.sensorid = sensorid; }
              if (sensortype) { sensorData.sensortype = sensortype; }
              if (interval) { sensorData.interval = interval; }
              sensorData.features = features;
              sensorData.notifications = notifications;
              sensorData.sensorname = sensorname;
              // ---------------------------------
              sensorData.ratingMIN = ratingMIN;
              sensorData.ratingMAX = ratingMAX;
              sensorData.label1 = label1;
              sensorData.lowerlimit1 = lowerlimit1;
              sensorData.upperlimit1 = upperlimit1;
              sensorData.label2 = label2;
              sensorData.lowerlimit2 = lowerlimit2;
              sensorData.upperlimit2 = upperlimit2;
              sensorData.label3 = label3;
              sensorData.lowerlimit3 = lowerlimit3;
              sensorData.upperlimit3 = upperlimit3;
              sensorData.label4 = label4;
              sensorData.lowerlimit4 = lowerlimit4;
              sensorData.upperlimit4 = upperlimit4;
              sensorData.alerts = alerts,
              // Store the new updates
              _data.update("sensors", id, sensorData, function (err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { Error: "Could not update the sensor." });
                }
              });
            } else {
              callback(403);
            }
          });
        } else {
          callback(400, { Error: "SENSOR ID did not exist." });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update." });
    }
  } else {
    callback(400, { Error: "Missing required field." });
  }
};
// Sensors - delete
// Required data : id
// Optional data : none
handlers._sensors.delete = function (data,callback) {
  // ------------------------------------------------
  console.log("[handlers.js] api/sensors.. DELETE..");
  // -----------------------
  // Check that id is valid
  var id = typeof data.queryStringObject.id == "string" && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the check
    _data.read("sensors", id, function (err, checkData) {
      if (!err && checkData) {
        // Get the token that sent the request
        var token = typeof data.headers.token == "string" ? data.headers.token : false;
        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken( token, checkData.userPhone, function (tokenIsValid) {
            if (tokenIsValid) {
              // Delete the check data
              _data.delete("sensors", id, function (err) {
                if (!err) {
                  // Lookup the user's object to get all their checks
                  _data.read( "users", checkData.userPhone, function (err, userData) {
                      if (!err) {
                        var userSensors = typeof userData.sensors == "object" && userData.sensors instanceof Array ? userData.sensors : [];
                        // Remove the deleted check from their list of checks
                        var sensorPosition = userSensors.indexOf(id);
                        if (sensorPosition > -1) {
                          userSensors.splice(sensorPosition, 1);
                          // Re-save the user's data
                          userData.sensors = userSensors;
                          _data.update( "users",checkData.userPhone, userData, function (err) {
                              if (!err) {
                                callback(200);
                              } else {
                                callback(500, { Error: "Could not update the user.",
                                });
                              }
                            }
                          );
                        } else {
                          callback(500, { Error: "Could not find the sensor on the user's object, so could not remove it.",
                          });
                        }
                      } else {
                        callback(500, { Error: "Could not find the user who created the sensor, so could not remove the sensor from the list of sensors on their user object.",
                        });
                      }
                    }
                  );
                } else {
                  callback(500, { Error: "Could not delete the sensor data." });
                }
              });
            } else {
              callback(403);
            }
          }
        );
      } else {
        callback(400, { Error: "The check ID specified could not be found" });
      }
    });
  } else {
    callback(400, { Error: "Missing valid id" });
  }
};
// SensorsTypes - get
// Required data : id
handlers._sensorstypes.get = function(data,callback){
  callback(400,{Error: "Function Incomplete"});
}
// Sensors - data - get
// Required data: id
handlers._sensors_data.get = function(data,callback) {
  // -----------------------------------
  // Get the token that sent the request
  // -----------------------------------
  var token = typeof data.headers.token == "string" ? data.headers.token : false;
  var id = typeof data.queryStringObject.id == "string" && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;
  //  ------------------------------------
  if ( id && token) {
    const filename = data.queryStringObject.id;
    _logs.read(filename,88,null,null,false,function(err,sensordatas){
      callback(200,{ data: sensordatas})
    })
  } else {
    callback(400, { Error: "Missing Required TOKEN Field, Or Field Invalid" });
  }
}

//  --------
//  Systems
//  -------
handlers.systems = function(data,callback){
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._systems[data.method](data, callback);
  } else {
    callback(405);
  }
};
//  Container for all the System methods
handlers._systems = {};
//  System - get
//  Required data : id
//  Optional data : none
handlers._systems.get = function(data,callback){
  // -----------------------------------------
  // Get the token that sent the request
  var token = typeof data.headers.token == "string" ? data.headers.token : false;
  var id = typeof data.queryStringObject.id == "string" && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false;
  // IF id is provided - search within SENSORS directory with filename that match id as... _data.read
  // IF id is not provoded = FALSE - return full List as... _data.list
  console.log(token);
  console.log(id);
  // ---------------
  if (id && token) {
    _data.read("systems", 'environments', function (err, checkData) {
      // --------------
      if (!err && checkData) {
        callback(200, checkData);
      } else {
        callback(404);
      }
    });
  } else if (token) {
    // Return check data
    _data.list("sensors", function (err, sensorIds) {
      if (!err && sensorIds && sensorIds.length > 0) {
        let counter = 0;
        var sensorDatas = [];
        sensorIds.forEach(function (sensorId) {
          _data.read("sensors", sensorId, function (err, sensorData) {
            try{
              handlers._tokens.verifyToken(token,sensorData.userPhone,function (tokenIsValid) {
                  if (tokenIsValid) {
                    sensorDatas.push(sensorData);
                  }
                  ++counter;
                  if (counter == sensorIds.length) {
                    callback(200, sensorDatas);
                  }
                }
              );
            }
            catch(err){
            }
          });
        });
      } else {
        callback(200, { Message: "No Data Available" });
      }
    });
  } else {
    callback(400, { Error: "Missing Required TOKEN Field, Or Field Invalid" });
  }
}

// --------
// MAPBOX
// --------
handlers.mapbox = function(data,callback) {
  // ------------------
  var acceptableMethods = ["post", "get", "put", "delete"];
  // ------------------
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._mapbox[data.method](data, callback);
  } else {
    callback(405);
  }
};
// Container for all the esp32CAM methods
handlers._mapbox = {};
// mapbox - get
// Required data: id
// Optional data: none
handlers._mapbox.get = function (data,callback) {
  // -----------------------------------------------
  const lastItem = getLastItem(data.trimmedPath)
  const strArr = data.trimmedPath.split('/');
  const key = strArr[strArr.length-1];
  console.log("[handlers.js] api/mapbox.. GET..[" + key.toUpperCase() + "]");
  // -----------------------------------
  // Get the token that sent the request
  var token = typeof data.headers.token == "string" ? data.headers.token : false;
  var id = typeof data.queryStringObject.id == "string" ? data.queryStringObject.id.trim() : false;
  // ---------------
  if (id && token) {
    let checkData;
    let tokenData = { 'token' : config.mapBoxGLToken }
    switch (key.toUpperCase()) {
      case "TOKEN":
        callback(200,tokenData);
        break;
      case "DATA":
        _data.read("maps", 'attractions', function (err, checkData) {
          // ---------------------
          callback(200,checkData);
        });
        break;
      default:
        callback(200,checkData);
        break;
    }
  } else {
    callback(400, { Error: "Missing Required TOKEN Field, Or Field Invalid" });
  }
}

// --------
// ESP32CAM
// --------
handlers.esp32CAM = function(data,callback) {
  // ------------------
  var acceptableMethods = ["post", "get", "put", "delete"];
  // ------------------
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._esp32CAM[data.method](data, callback);
  } else {
    callback(405);
  }
};
// Container for all the esp32CAM methods
handlers._esp32CAM = {};
// ESP32CAM - get
// Required data: id
// Optional data: none
handlers._esp32CAM.get = function (data,callback) {
  // -----------------------------------------------
  // Get the token that sent the request
  var token = typeof data.headers.token == "string" ? data.headers.token : false;
  var id = typeof data.queryStringObject.id == "string" ? data.queryStringObject.id.trim() : false;
  // ---------------
  if (id && token) {
    // ----------------
    // Lookup the check
    _data.read("uploads", id, function (err, checkData) {
      // --------------
      if (!err && checkData) {
        callback(200, checkData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing Required TOKEN Field, Or Field Invalid" });
  }
}

// ------
// CHECKS
// ------
handlers.checks = function (data,callback) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};
// Container for all the Checks methods
handlers._checks = {};
// Checks - post
// Required data: protocol,url,method,successCodes,timeoutSeconds
// Optional data: none
handlers._checks.post = function (data,callback) {
  // -----------------------------------------
  console.log("[handlers.js] api/checks.. POST");
  // -----------------------------------------
  // Validate inputs
  var protocol        = typeof data.payload.protocol == "string" && ["https", "http"].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  var url             = typeof data.payload.url == "string" && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method          = typeof data.payload.method == "string" && ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  var successCodes    = typeof data.payload.successCodes == "object" && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  var timeoutSeconds  = typeof data.payload.timeoutSeconds == "number" && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
  // --------------------------------------------------------------
  if (protocol && url && method && successCodes && timeoutSeconds) {
    // Get token from headers
    var token = typeof data.headers.token == "string" ? data.headers.token : false;
    // Lookup the user phone by reading the token
    _data.read("tokens", token, function (err, tokenData) {
      if (!err && tokenData) {
        var userPhone = tokenData.phone;
        // Lookup the user data
        _data.read("users", userPhone, function (err, userData) {
          if (!err && userData) {
            var userChecks = typeof userData.checks == "object" && userData.checks instanceof Array ? userData.checks : [];
            // Verify that user has less than the number of max-checks per user
            if (userChecks.length < config.maxChecks) {
              // Create random id for check
              var checkId = helpers.createRandomString(20);
              // Create check object including userPhone
              var checkObject = {
                id: checkId,
                userPhone: userPhone,
                protocol: protocol,
                url: url,
                method: method,
                successCodes: successCodes,
                timeoutSeconds: timeoutSeconds,
              };
              // Save the object
              _data.create("checks", checkId, checkObject, function (err) {
                if (!err) {
                  // Add check id to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);
                  // Save the new user data
                  _data.update("users", userPhone, userData, function (err) {
                    if (!err) {
                      // Return the data about the new check
                      callback(200, checkObject);
                    } else {
                      callback(500, {Error: "Could not update the user with the new check.",
                      });
                    }
                  });
                } else {
                  callback(500, { Error: "Could not create the new check" });
                }
              });
            } else {
              callback(400, {Error:"The user already has the maximum number of checks (" +config.maxChecks + ").",
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { Error: "Missing required inputs, or inputs are invalid" });
  }
};
// Checks - get
// Required data: id
// Optional data: none
handlers._checks.get = function (data,callback) {
  // -------------------------------
  console.log("[handlers.js] api/checks.. GET..");
  // -----------------------
  // Get the token that sent the request
  var token = typeof data.headers.token == "string" ? data.headers.token : false;
  var id = typeof data.queryStringObject.id == "string" && data.queryStringObject.id.trim().length > 9 ? data.queryStringObject.id.trim() : false;
  // ---------------
  if (id && token) {
    // Lookup the check
    _data.read("checks", id, function (err, checkData) {
      if (!err && checkData) {
        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token,checkData.userPhone,function (tokenIsValid) {
            if (tokenIsValid) {
              // Return check data
              callback(200, checkData);
            } else {
              callback(403);
            }
          }
        );
      } else {
        callback(404);
      }
    });
  } else if (token) {
    // Return check data
    var checkDatas = [];
    _data.list("checks", function (err, checkIds) {
      if (!err && checkIds && checkIds.length > 0) {
        let counter = 0;
        checkIds.forEach(function (checkId) {
          _data.read("checks", checkId, function (err, checkData) {
            handlers._tokens.verifyToken(
              token,
              checkData.userPhone,
              function (tokenIsValid) {
                if (tokenIsValid) {
                  checkDatas.push(checkData);
                }
                ++counter;
                if (counter == checkIds.length) {
                  callback(200, checkDatas);
                }
              }
            );
          });
        });
      } else {
        callback(200, { Message: "No Data Available" });
      }
    });
  } else {
    callback(400, { Error: "Missing Required TOKEN Field, Or Field Invalid" });
  }
};
// Checks - put
// Required data: id
// Optional data: protocol,url,method,successCodes,timeoutSeconds (one must be sent)
handlers._checks.put = function (data,callback) {
  //---------------------------------------
  console.log("[handlers.js] api/checks.. PUT");
  // -----------------------
  // Check for required field
  var id = typeof data.payload.id == "string" && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  // Check for optional fields
  var protocol = typeof data.payload.protocol == "string" && ["https", "http"].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  var url = typeof data.payload.url == "string" && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method = typeof data.payload.method == "string" && ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  var successCodes = typeof data.payload.successCodes == "object" && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  var timeoutSeconds = typeof data.payload.timeoutSeconds == "number" && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

  // Error if id is invalid
  if (id) {
    // Error if nothing is sent to update
    if (protocol || url || method || successCodes || timeoutSeconds) {
      // Lookup the check
      _data.read("checks", id, function (err, checkData) {
        if (!err && checkData) {
          // Get the token that sent the request
          var token =
            typeof data.headers.token == "string" ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(
            token,
            checkData.userPhone,
            function (tokenIsValid) {
              if (tokenIsValid) {
                // Update check data where necessary
                if (protocol) {
                  checkData.protocol = protocol;
                }
                if (url) {
                  checkData.url = url;
                }
                if (method) {
                  checkData.method = method;
                }
                if (successCodes) {
                  checkData.successCodes = successCodes;
                }
                if (timeoutSeconds) {
                  checkData.timeoutSeconds = timeoutSeconds;
                }
                // Store the new updates
                _data.update("checks", id, checkData, function (err) {
                  if (!err) {
                    callback(200);
                  } else {
                    callback(500, { Error: "Could not update the check." });
                  }
                });
              } else {
                callback(403);
              }
            }
          );
        } else {
          callback(400, { Error: "Check ID did not exist." });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update." });
    }
  } else {
    callback(400, { Error: "Missing required field." });
  }
};
// Checks - delete
// Required data: id
// Optional data: none
handlers._checks.delete = function (data,callback) {
  // ------------------------
  console.log("[handlers.js] api/checks.. DELETE");
  // -----------------------
  // Check that id is valid
  var id = typeof data.queryStringObject.id == "string" && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the check
    _data.read("checks", id, function (err, checkData) {
      if (!err && checkData) {
        // Get the token that sent the request
        var token = typeof data.headers.token == "string" ? data.headers.token : false;
        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token,checkData.userPhone,function (tokenIsValid) {
            if (tokenIsValid) {
              // Delete the check data
              _data.delete("checks", id, function (err) {
                if (!err) {
                  // Lookup the user's object to get all their checks
                  _data.read("users",checkData.userPhone,function (err, userData) {
                      if (!err) {
                        var userChecks = typeof userData.checks == "object" && userData.checks instanceof Array ? userData.checks : [];
                        // Remove the deleted check from their list of checks
                        var checkPosition = userChecks.indexOf(id);
                        if (checkPosition > -1) {
                          userChecks.splice(checkPosition, 1);
                          // Re-save the user's data
                          userData.checks = userChecks;
                          _data.update("users",checkData.userPhone,userData,function (err) {
                              if (!err) {
                                callback(200);
                              } else {
                                callback(500, {Error: "Could not update the user.",
                                });
                              }
                            }
                          );
                        } else {
                          callback(500, {Error:"Could not find the check on the user's object, so could not remove it.",
                          });
                        }
                      } else {
                        callback(500, {Error:"Could not find the user who created the check, so could not remove the check from the list of checks on their user object.",
                        });
                      }
                    }
                  );
                } else {
                  callback(500, { Error: "Could not delete the check data." });
                }
              });
            } else {
              callback(403);
            }
          }
        );
      } else {
        callback(400, { Error: "The check ID specified could not be found" });
      }
    });
  } else {
    callback(400, { Error: "Missing valid id" });
  }
};

// -------------------
// Export the handlers
// -------------------
module.exports = handlers;
