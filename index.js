/*
 * Primary file for API
 *
 */

// Dependencies
var server = require('./lib/server');
var expressServer = require('./lib/expressServer');
var workers = require('./lib/workers');
var cli = require('./lib/cli');
const connectDB = require('./config/db');

// Declare the app
var app = {};

// Init function
app.init = function () {
  // ----------------
  // Start the server
  // ----------------
  console.log('... ... ...... .... ....');
  console.log('... TCP SERVER INIT ....');
  console.log('... 1. INIT SERVER')
  console.log('... 2. INIT EXPRESS SERVER')
  console.log('... 3. CONNECT DB')
  console.log('... 4. INIT WORKERS')
  server.init();
  expressServer.init();
  console.log('... ... ...... .... ....');
  // ----------------
  // CONNECT DATABASE
  // ----------------
  connectDB();
  // -----------------
  // Start the workers
  // -----------------
  workers.init();
  // Start the CLI, but make sure it starts last
  setTimeout(function () {
    cli.init();
  }, 50);

};

// Self executing
app.init();


// Export the app
module.exports = app;