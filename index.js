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
  // -----------
  console.log();
  // ----------------
  // Start the server
  // ----------------
  console.log('... SERVER INIT....')
  server.init();
  expressServer.init();
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