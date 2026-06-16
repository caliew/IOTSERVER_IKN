/*
 * Primary entry point for IoT Server
 *
 * Starts:
 *   1. TCP Server(s)  — receive bytecode from IoT gateways
 *   2. Express Server — REST API on port 5000
 *   3. Workers        — background polling timers
 *   4. CLI            — interactive terminal (last)
 */

var server       = require('./lib/server');
var expressServer = require('./lib/expressServer');
var workers      = require('./lib/workers');
var cli          = require('./lib/cli');

var app = {};

app.init = function () {
  console.log('... ... ...... .... ....');
  console.log('... 1. INIT TCP SERVER(S)');
  console.log('... 2. INIT REST API SERVER (EXPRESS / PORT 5000)');
  console.log('... 3. INIT BACKGROUND WORKERS');
  console.log('... ... ...... .... ....');

  server.init();
  expressServer.init();
  workers.init();

  // Start CLI last (after servers are ready)
  setTimeout(function () {
    cli.init();
  }, 50);
};

app.init();

module.exports = app;