/*
 * Configuration — Create and export configuration variables
 */

var environments = {};

// -------------------
// Staging Environment
// -------------------
environments.staging = {
  // -----------------------------------------
  // TCP SERVERS — IoT Gateway Ports
  // Each entry: { name, port, active }
  // Set active: false to disable without deleting
  // -----------------------------------------
  'tcpServers': [
    { name: 'TDK_JOHOR',    port: 1008, active: true  },  // TDK Johor
    { name: 'IKN_OPROOM',   port: 1009, active: true  },  // IKN Operating Room
    { name: 'IKN_HOSPITAL', port: 1010, active: true  },  // IKN Hospital
    { name: 'SHINKO',       port: 1011, active: true  },  // Shinko
    { name: 'SNOWCITY',     port: 1012, active: true  },  // Snow City
    { name: 'NIPPONGLASS',  port: 1013, active: true  },  // Nippon Glass
    { name: 'EPSON',        port: 1014, active: true  },  // Epson
    { name: 'KAYAKU',       port: 1015, active: false },  // Kayaku (trial ended)
    { name: 'CAMPBELL',     port: 1016, active: false },  // Campbell (trial ended)
    { name: 'MRE',          port: 1020, active: true  },  // MRE
    { name: 'INDOGUNA',     port: 1021, active: true  },  // Indoguna
    { name: 'AEROSOFT',     port: 1088, active: true  },  // Aerosoft (internal)
  ],
  // Legacy individual port refs — kept for backward compatibility in workers/cli
  'tcpPort1088'   : 1088,
  'tcpPort1008'   : 1008,
  'tcpPort1009'   : 1009,
  'tcpPort1010'   : 1010,
  'tcpPort1011'   : 1011,
  'tcpPort1012'   : 1012,
  'tcpPort1013'   : 1013,
  'tcpPort1014'   : 1014,
  'tcpPort1015'   : 1015,
  'tcpPort1016'   : 1016,
  'tcpPort1020'   : 1020,
  'tcpPort1021'   : 1021,
  // -----------------------------------------
  // REST API
  // -----------------------------------------
  'RESTAPIPort'   : 5000,
  // -----------------------------------------
  // App settings
  // -----------------------------------------
  'envName'       : 'staging',
  'hashingSecret' : process.env.HASHING_SECRET || 'iotserver_staging_secret',
  'maxChecks'     : 5,
  'maxSensors'    : 200,
  'mapBoxGLToken' : process.env.MAPBOX_TOKEN,
  'mapBoxGLTokenP': process.env.MAPBOX_TOKEN_P,
  'twilio'        : {
    'accountSid'  : process.env.TWILIO_SID    || '',
    'authToken'   : process.env.TWILIO_TOKEN  || '',
    'fromPhone'   : process.env.TWILIO_PHONE  || ''
  },
  'templateGlobals' : {
    'appName'     : 'AeroSOFT_IOTApp',
    'companyName' : 'AeroSOFT Technologies Pte Ltd',
    'yearCreated' : '2021',
    'baseUrl'     : 'http://localhost:5000/'
  }
};

// ----------------------
// Production Environment
// ----------------------
environments.production = {
  'tcpServers': [
    { name: 'TDK_JOHOR',    port: 1008, active: true  },
    { name: 'IKN_OPROOM',   port: 1009, active: true  },
    { name: 'IKN_HOSPITAL', port: 1010, active: true  },
    { name: 'SHINKO',       port: 1011, active: true  },
    { name: 'SNOWCITY',     port: 1012, active: true  },
    { name: 'NIPPONGLASS',  port: 1013, active: true  },
    { name: 'EPSON',        port: 1014, active: true  },
    { name: 'KAYAKU',       port: 1015, active: false },
    { name: 'CAMPBELL',     port: 1016, active: false },
    { name: 'MRE',          port: 1020, active: true  },
    { name: 'INDOGUNA',     port: 1021, active: true  },
    { name: 'AEROSOFT',     port: 1088, active: true  },
  ],
  // Legacy individual port refs
  'tcpPort1088'   : 1088,
  'tcpPort1008'   : 1008,
  'tcpPort1009'   : 1009,
  'tcpPort1010'   : 1010,
  'tcpPort1011'   : 1011,
  'tcpPort1012'   : 1012,
  'tcpPort1013'   : 1013,
  'tcpPort1014'   : 1014,
  'tcpPort1015'   : 1015,
  'tcpPort1016'   : 1016,
  'tcpPort1020'   : 1020,
  'tcpPort1021'   : 1021,
  'RESTAPIPort'   : 5000,
  'envName'       : 'production',
  'hashingSecret' : process.env.HASHING_SECRET || 'iotserver_production_secret',
  'maxChecks'     : 10,
  'maxSensors'    : 200,
  'twilio'        : {
    'accountSid'  : process.env.TWILIO_SID    || '',
    'authToken'   : process.env.TWILIO_TOKEN  || '',
    'fromPhone'   : process.env.TWILIO_PHONE  || ''
  },
  'templateGlobals' : {
    'appName'     : 'AeroSOFT_IOTApp',
    'companyName' : 'AeroSOFT Technologies Pte Ltd',
    'yearCreated' : '2021',
    'baseUrl'     : 'http://localhost:5000/'
  }
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string'
  ? process.env.NODE_ENV.toLowerCase()
  : '';

// Default to staging if not matched
var environmentToExport = typeof(environments[currentEnvironment]) == 'object'
  ? environments[currentEnvironment]
  : environments.staging;

module.exports = environmentToExport;
