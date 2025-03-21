/*
 * Create and export configuration variables
 */

// Container for all environments
var environments = {};

// Staging (default) environment
environments.staging = {
  'tcpPort1088'   : 1088, //  INTERNAL TESTING AND SETUP
  'tcpPort1008'   : 1008, //  TDK
  'tcpPort1009'   : 1009, //  TEAWAREHOUSE (STOPPED)
  'tcpPort1010'   : 1010, //  IKN
  'tcpPort1011'   : 1011, //  SHINKO
  'tcpPort1012'   : 1012, //  SNOWCITY
  'tcpPort1013'   : 1013, //  NIPPONGLASS
  'tcpPort1014'   : 1014, //  EPSON
  'tcpPort1015'   : 1015, //  NIPPONGLASS BOILER DEPARTMENT
  'tcpPort1016'   : 1016, //  CAMPBELL
  'tcpPort1020'   : 1020, //  MRE
  'MQQTPort1883'  : 1883, //  MQQT
  'MQQTPort8883'  : 8883, //  MQQT
  'httpPort'      : 2008, //  OLD WEB DESIGN
  'httpsPort'     : 2009, //  OLD WEB DESIGN 
  'RESTAPIPort'   : 5000, //  REST API ACCESS PORT
  'INPUTPort'     : 8001, //  UPLOADING
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
  'tcpPort1088'   : 1088, //  INTERNAL TESTING AND SETUP
  'tcpPort1008'   : 1008, //  TDK
  'tcpPort1009'   : 1009, //  TEAWAREHOUSE
  'tcpPort1010'   : 1010, //  IKN
  'tcpPort1011'   : 1011, //  SHINKO
  'tcpPort1012'   : 1012, //  SNOWCITY
  'tcpPort1013'   : 1013, //  NIPPONGLASS
  'tcpPort1014'   : 1014, //  EPSON
  'tcpPort1015'   : 1015, //  NIPPONGLASS BOILER DEPARTMENT
  'tcpPort1016'   : 1016, //  CAMPBELL
  'tcpPort1020'   : 1020, //  MRE
  'MQQTPort1883'  : 1883, //  MQQT
  'MQQTPort8883'  : 8883, //  MQQT
  'httpPort'      : 2008, //  OLD WEB DESIGN
  'httpsPort'     : 2009, //  OLD WEB DESIGN 
  'RESTAPIPort'   : 5000, //  REST API ACCESS PORT
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
