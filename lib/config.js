/*
 * Create and export configuration variables
 */

// Container for all environments
var environments = {};

// Staging (default) environment
environments.staging = {
  'tcpPort1008'   : 1008,
  'tcpPort1009'   : 1009,
  'tcpPort1010'   : 1010,
  'tcpPort1011'   : 1011,
  'tcpPort1012'   : 1012,
  'tcpPort1020'   : 1020,
  'MQQTPort8883'  : 8883,
  'MQQTPort1883'  : 1883,
  'httpPort'      : 2008,
  'httpsPort'     : 2009,
  'RESTAPIPort'   : 5000,
  'envName'       : 'staging',
  'hashingSecret' : 'thisIsASecret',
  'maxChecks'     : 5,
  'maxSensors'    : 200,
  'mapBoxGLToken' : 'pk.eyJ1IjoiY2FsaWV3IiwiYSI6ImNrcGxhNTJnZzNzdTMzMW54eWExdTZoaDMifQ.PICf2g0Ybo7OFcC6NgONUw',
  'mapBoxGLTokenP': 'pk.eyJ1IjoiY2FsaWV3IiwiYSI6ImNrNmtiem0zeTAya3AzbXBhN29sM2FvdDAifQ.6lcFWApgUBtSQgxqtK-bdQ',
  'twilio'        : {
    'accountSid'  : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken'   : '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone'   : '+15005550006'
  },
  'templateGlobals' : {
    'appName'     : 'AeroSOFT_IOTApp',
    'companyName' : 'AeroSOFT Technologies Pte Ltd',
    'yearCreated' : '2021',
    'baseUrl1'     : 'http://localhost:2008/',
    'baseUrl'     : 'http://202.59.9.164:2008/'
  }
};

// Production environment
environments.production = {
  'tcpPort1008'   : 1008,
  'tcpPort1009'   : 1009,
  'tcpPort1010'   : 1010,
  'tcpPort1011'   : 1011,
  'httpPort'      : 3008,
  'httpsPort'     : 3009,
  'RESTAPIPort'   : 5000,
  'envName'       : 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'maxChecks'     : 10,
  'maxSensors'    : 200,
  'twilio'        : {
    'accountSid'  : '',
    'authToken'   : '',
    'fromPhone'   : ''
  },
  'templateGlobals' : {
    'appName'     : 'AeroSOFT_IOTApp',
    'companyName' : 'AeroSOFT Technologies Pte Ltd',
    'yearCreated' : '2021',
    'baseUrl'     : 'http://localhost:3008/'
  }
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
