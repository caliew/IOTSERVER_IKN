const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
// ------------------------------------
const User = require('../models/User');
const Sensor = require('../models/Sensor');
const cors = require('cors');
const lodash = require('lodash');
const fs = require('fs');
const path = require('path');
// -------------------------
const _debugENDPOINT = false;
const maxLOGS = 100000;
// -------------------------
const _data = require("../lib/data");
const _logs = require('../lib/logs');
// 
const endpointConfigs = {  
  AEROSOFT : {
    settingFiles: ['AEROSOFT'],
    logFile: '_AEROSOFT',
    alertFile: '_AEROSOFTALERTS',
  },
  TEAWAREHOUSE: {
    settingFiles: ['TEAWAREHOUSE'],
    logFile: '_TEAWAREHOUSE',
    alertFile: '_TEAWAREHOUSEALERTS',
  },
  TDKJOHOR : {
    settingFiles: ['TDKJOHOR'],
    logFile: '_TDKJOHOR',
    alertFile: '_TDKJOHORALERTS',
  },
  EPSON: {
    settingFiles: ['EPSON'],
    logFile: '_EPSON',
    alertFile: '_EPSONALERTS',
  },
  SNOWCITY: {
    settingFiles: ['SNOWCITY'],
    logFile: '_SNOWCITY',
    alertFile: '_SNOWCITYALERTS',
  },
  IKNOPSROOM: {
    settingFiles: ['IKN_OPROOM'],
    logFile: '_IKN_OPROOM',
    alertFile: '_IKN_OPROOMALERTS',
  },
  IKNHOSPITAL: {
    settingFiles: ['IKN_HOSPITAL'],
    logFile: '_IKN_HOSPITAL',
    alertFile: '_IKN_HOSPITALALERTS',
  },
  SHINKO: {
    settingFiles: ['SHINKO'],
    logFile: '_SHINKO',
    alertFile: '_SHINKOALERTS',
  },
  MRE: {
    settingFiles: ['MRE'],
    logFile: '_MRE',
    alertFile: '_MREALERTS',
  },
  KAYAKU: {
    settingFiles: ['KAYAKU'],
    logFile: '_KAYAKU',
    alertFile: '_KAYAKUALERTS',
  },
  INDOGUNA: {
    settingFiles: ['INDOGUNA'],
    logFile: '_INDOGUNA',
    alertFile: '_INDOGUNAALERTS',
  },
  MCST: {
    settingFiles: ['MCST'],
    logFile: '_MCST',
    alertFile: '_MCSTALERTS',
  },
  NEGMWGT: {
    settingFiles: ['NIPPONGLASS_BOILER'],
    logFile: '_NIPPONGLASS',
    alertFile: '_NIPPONGLASSALERTS',
    updateFiles: ['NIPPONGLASS', 'NIPPONGLASS_BOILER'],
  },
  NIPPONGLASS: {
    settingFiles: ['NIPPONGLASS_TRANSF'],
    logFile: '_NIPPONGLASS',
    alertFile: '_NIPPONGLASSALERTS',
    updateFiles: ['NIPPONGLASS', 'NIPPONGLASS_TRANSF'],
  }
};
// ----------
const formatDate = (date) => {
  let d = new Date(date);
  let month = (d.getMonth() + 1).toString();
  let day = d.getDate().toString();
  let year = d.getFullYear()% 100;
  if (month.length < 2) {
    month = '0' + month;
  }
  if (day.length < 2) {
    day = '0' + day;
  }
  return [day, month, year].join('/');
}

// Deep merge function for CHECKLIST route
const deepMerge = (target, source) => {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const updateSettings = async (file,body) => {
  try {
    const existingData = await new Promise((resolve, reject) => {
      _data.read(file, 'settings', (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') return resolve({});
          return reject(err);
        }
        resolve(data || {});
      });
    });

    const mergedData = lodash.merge({}, existingData, body);

    await new Promise((resolve, reject) => {
      _data.update(file, 'settings', mergedData, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

  } catch (err) {
    console.error(err);
    throw new Error(`Error updating settings for ${file}`);
  }
}

const readSettings = async (fileName) => {
  return new Promise((resolve, reject) => {
    _data.read(fileName, 'settings', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// SAFE readLogs function - prevents multiple callbacks
const readLogs = (fileName, nTotalLines, date0, date1) => {
  return new Promise((resolve) => {
    let callbackCalled = false;

    const timer = setTimeout(() => {
      if (!callbackCalled) {
        _debugENDPOINT && console.log(`⏰ Timeout reading logs for ${fileName}`);
        callbackCalled = true;
        resolve([]);
      }
    }, 30000);

    _logs.read(fileName, nTotalLines, date0, date1, false, (err, data) => {
      clearTimeout(timer);

      if (callbackCalled) {
        _debugENDPOINT && console.warn(`⚠️ Duplicate callback for ${fileName}, ignoring`);
        return;
      }

      callbackCalled = true;

      _debugENDPOINT && console.log(`✅ Read logs for ${fileName}   err=${err}  data=${data ? 'TRUE':'FALSE'}`);

      // ✅ Use data if present even when err is truthy
      if (data && data.length > 0) {
        if (err) _debugENDPOINT && console.warn(`⚠️ Non-fatal read error for ${fileName}, using available data`);
        resolve(data);
      } else {
        if (err) _debugENDPOINT && console.error(`❌ Error reading logs for ${fileName}:`, err);
        resolve([]);
      }
    });
  });
};


// -----
router.use(cors({origin:'*'}));

// @route     GET api/sensors
// @desc      Get all sensors
// @access    Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.query.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    let username = user.name ?? '';
    let companyname = user.companyname ?? '';
    const sensors = await Sensor.find({ company: { $in: [`${companyname}`] } }).sort({
      date: -1,
    });
    
    if (sensors.length === 0) {
      return res.status(200).json([]);
    }
    
    // ✅ FIX: Add validation for query parameters
    const totalLines = Math.min(Math.max(parseInt(req.query.totalLines) || 10, 1), 100000);
    
    const date0Param = req.query.date0 ? new Date(req.query.date0) : null;
    const date1Param = req.query.date1 ? new Date(req.query.date1) : null;
    
    // Validate dates
    if (date0Param && isNaN(date0Param.getTime())) {
      return res.status(400).json({ error: 'Invalid date0 format (use ISO8601)' });
    }
    if (date1Param && isNaN(date1Param.getTime())) {
      return res.status(400).json({ error: 'Invalid date1 format (use ISO8601)' });
    }
    
    let date1 = date1Param ?? new Date();
    let date0 = date0Param ?? new Date();
    
    // Process sensors sequentially to avoid issues
    const updatedSensors = [];

    for (const sensor of sensors) {
      let key = sensor.dtuId === '-1' ? `${sensor.sensorId}` : `${sensor.dtuId}-${sensor.sensorId}`;
      let nIndex = (user.name === 'superuser') ? 99 : sensor.company.indexOf(companyname);
      
      if (nIndex > -1) {
        const logs = await readLogs(key, totalLines, date0, date1);
        sensor.logsdata = logs;
        updatedSensors.push(sensor);
      }
    }
    
    res.status(200).json(updatedSensors);
    
  } catch (err) {
    console.error('Error in main sensor route:', err.message);
    if (!res.headersSent) {
      res.status(500).send('Server Error');
    }
  }
});

// FIXED handleRawData function
// In your sensors.js, update the handleRawData function:
async function handleRawData(req, res, config) {
  _debugENDPOINT && console.log(`=== START handleRawData for ${req.path} ===`);
  
  // CRITICAL FIX: Check if response already sent
  if (res.headersSent || res.finished) {
    _debugENDPOINT && console.log('⚠️ Response already sent, aborting');
    return;
  }
  
  try {
    const ObjData = req.query;
    const SettingFile = config.settingFiles[0];
    const LOGFile = config.logFile;
    const ALERTFile = config.alertFile; // ← MISSING: Added this back

    const nTotalLines = ObjData.totalLines !== undefined && Number(ObjData.totalLines) !== -1
      ? ObjData.totalLines
      : maxLOGS;

    const _date0 = ObjData.date0 ?? null;
    const _date1 = ObjData.date1 ?? null;

    _debugENDPOINT && console.log(`Reading settings from ${SettingFile}`);
    const settingData = await readSettings(SettingFile);
    ObjData.settings = settingData;

    // Read sensor plot data
    let sensorPlotData = {};
    if (settingData?.IOT_SENSORS) {
      const keys = Object.keys(settingData.IOT_SENSORS);
      _debugENDPOINT && console.log(`Reading ${keys.length} sensor logs`);
      
      // You can choose either approach for reading sensor data:

      // APPROACH 1: Sequential (from refactored code)
      for (const key of keys) {
        const data = await readLogs(key, nTotalLines, _date0, _date1);
        sensorPlotData[key] = data;
      }
      
      // OR APPROACH 2: Parallel (from original code - faster)
      // const sensorData = await Promise.all(
      //   keys.map((key) => readLogs(key, nTotalLines, _date0, _date1))
      // );
      // keys.forEach((key, index) => {
      //   sensorPlotData[key] = sensorData[index];
      // });
    }
    ObjData.WISensor = sensorPlotData;
    _debugENDPOINT && console.log('Sensor plot data:', sensorPlotData); // ← Added logging back

    // Read main logs
    _debugENDPOINT && console.log(`Reading main logs from ${LOGFile}`);
    ObjData.sensorData = await readLogs(LOGFile, nTotalLines, _date0, _date1);

    // Read alerts (today only) - ← MISSING: This entire section was missing
    _debugENDPOINT && console.log(`Reading alerts from ${ALERTFile}`);
    let _today0 = new Date();
    let _today1 = new Date();
    _today0.setHours(0, 0, 0);
    _today1.setHours(23, 59, 59);
    ObjData.alerts = await readLogs(ALERTFile, nTotalLines, _today0, _today1);

    _debugENDPOINT && console.log(`Successfully processed ${req.path}, sending response...`);
    
    // FINAL CHECK before sending
    if (!res.headersSent && !res.finished) {
      res.status(200).send(ObjData);
      _debugENDPOINT && console.log(`✅ Response sent for ${req.path}`);
    } else {
      _debugENDPOINT && console.log(`⚠️ Cannot send - response already sent`);
    }
    
  } catch (err) {
    _debugENDPOINT && console.error(`Error in handleRawData for ${req.path}:`, err.message);
    if (!res.headersSent && !res.finished) {
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }
}

// FIXED handleUpdateSettings function
async function handleUpdateSettings(req, res, config) {
  _debugENDPOINT && console.log(`=== START handleUpdateSettings for ${req.path} ===`);
  
  if (res.headersSent) {
    _debugENDPOINT && console.log('⚠️ Response already sent, aborting handleUpdateSettings');
    return;
  }

  try {
    const { body } = req;
    const files = config.updateFiles ?? config.settingFiles;

    await Promise.all(files.map(file => updateSettings(file, body)));
    
    _debugENDPOINT && console.log(`✅ Settings updated for ${req.path}`);
    res.status(200).send({ message: 'Settings updated successfully' });
    
  } catch (err) {
    _debugENDPOINT && console.error(`Error updating settings for ${req.path}:`, err);
    if (!res.headersSent) {
      res.status(500).send({ message: 'Error updating settings' });
    }
  }
}

// Register routes with simple handlers
Object.entries(endpointConfigs).forEach(([routeName, config]) => {

  router.get(`/${routeName}/rawdata`, auth, async (req, res) => {
    _debugENDPOINT && console.log(`\n📞 ROUTE NAME: ${routeName} REQUEST: ${req.path}`);
    try {
      await handleRawData(req, res, config);
    } catch (err) {
      _debugENDPOINT && console.error(`Unhandled error for ${req.path}:`, err);
      if (!res.headersSent) res.status(500).send({ error: 'Internal Server Error' });
    }
  });

  router.put(`/${routeName}/settings`, auth, async (req, res) => {
    _debugENDPOINT && console.log(`\n📞 REQUEST: ${req.path}`);
    try {
      await handleUpdateSettings(req, res, config);
    } catch (err) {
      console.error(`Unhandled error for ${req.path}:`, err);
      if (!res.headersSent) res.status(500).send({ error: 'Internal Server Error' });
    }
  });
  
});

// ------------
// MCST Routes
// ------------
router.get('/MCST/Checklist', auth, async (req, res) => {
  _debugENDPOINT && console.log(`\n📞 REQUEST: GET /MCST/Checklist`);
  
  if (res.headersSent) {
    _debugENDPOINT && console.log('⚠️ Response already sent');
    return;
  }

  try {
    const SettingFile = 'MCST_CHECKLIST';
    const ChecklistHistory = await readSettings(SettingFile);
    
    _debugENDPOINT && console.log(`✅ Sending checklist data`);
    res.status(200).send(ChecklistHistory);
    
  } catch (err) {
    _debugENDPOINT && console.error(err);
    if (!res.headersSent) {
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }
});

router.put('/MCST/Checklist', auth, async (req, res) => {
  _debugENDPOINT && console.log(`\n📞 REQUEST: PUT /MCST/Checklist`);
  
  if (res.headersSent) {
    _debugENDPOINT && console.log('⚠️ Response already sent');
    return;
  }

  try {
    const { body } = req;
    const settingFiles = ['MCST_CHECKLIST'];

    await Promise.all(settingFiles.map(file => updateSettings(file, body)));
    
    _debugENDPOINT && console.log(`✅ Checklist updated`);
    res.status(200).send({ message: 'Settings updated successfully' });
    
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).send({ message: 'Error updating settings' });
    }
  }
});

//  ---------
//  CHECKLIST
//  ---------
router.put('/CHECKLIST', auth, (req, res) => {
  _debugENDPOINT && console.log(`\n📞 REQUEST: PUT /CHECKLIST`);
  
  if (res.headersSent) {
    _debugENDPOINT && console.log('⚠️ Response already sent');
    return;
  }

  const { payload } = req.body;
  const CHECKLIST_FILE = path.join(__dirname, 'checklist.json');

  // ✅ ADD validation
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  
  // ✅ ADD size limit
  const payloadSize = JSON.stringify(payload).length;
  if (payloadSize > 1000000) {
    return res.status(413).json({ error: 'Payload too large (max 1MB)' });
  }

  // Read existing checklist data
  let existingData = {};
  if (fs.existsSync(CHECKLIST_FILE)) {
    try {
      const raw = fs.readFileSync(CHECKLIST_FILE, 'utf-8');
      existingData = raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error('Error reading checklist file:', err);
      existingData = {};
    }
  }

  // Merge incoming payload
  const mergedData = deepMerge(existingData, payload);

  // Save back to file
  try {
    fs.writeFileSync(CHECKLIST_FILE, JSON.stringify(mergedData, null, 2), 'utf-8');
    _debugENDPOINT && console.log(`✅ Checklist saved`);
    res.json({ success: true, data: mergedData });
  } catch (err) {
    console.error('Error writing checklist file:', err);
    res.status(500).json({ error: 'Failed to save checklist' });
  }
});

// -------------
// Data Download
// -------------
let app = {};
// AJAX Client (for RESTful API)
app.client = {};
// Interface for making API calls
app.client.request = function (headers,path,method,queryStringObject,payload,callback) {
  // Set defaults
  headers = typeof headers == "object" && headers !== null ? headers : {};
  path = typeof path == "string" ? path : "/";
  method = typeof method == "string" && ["POST", "GET", "PUT", "DELETE"].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : "GET";
  queryStringObject = typeof queryStringObject == "object" && queryStringObject !== null ? queryStringObject : {};
  payload = typeof payload == "object" && payload !== null ? payload : {};
  callback = typeof callback == "function" ? callback : false;

  // For each query string parameter sent, add it to the path
  var requestUrl = path + "?";
  var counter = 0;
  
  for (var queryKey in queryStringObject) {
    if (queryStringObject.hasOwnProperty(queryKey)) {
      counter++;
      if (counter > 1) {
        requestUrl += "&";
      }
      requestUrl += queryKey + "=" + queryStringObject[queryKey];
    }
  }
  
  // Note: This function seems incomplete - it doesn't actually make a request
  // You might want to implement the actual HTTP request logic here
};

module.exports = router;