const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
// ------------------------------------
const cors = require('cors');
const fs = require('fs');
const path = require('path');
// -------------------------
const _debugENDPOINT = false;
const maxLOGS = 100000;
// -------------------------
const _data = require("../lib/data");
const _logs = require('../lib/logs');
const helpers = require('../lib/helpers');
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

    const mergedData = deepMerge(JSON.parse(JSON.stringify(existingData)), body);

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

// Helper function to ensure sensors are imported from settings if empty
function ensureSensorsImported() {
  return new Promise((resolve) => {
    _data.list('sensors', (err, list) => {
      if (!err && list && list.length > 0) {
        return resolve();
      }
      
      const defaultSensorsPath = path.join(__dirname, '../.data/settings/sensors.json');
      if (fs.existsSync(defaultSensorsPath)) {
        try {
          const raw = fs.readFileSync(defaultSensorsPath, 'utf8');
          const sensors = JSON.parse(raw);
          if (Array.isArray(sensors)) {
            console.log(`[SENSORS] Importing ${sensors.length} sensors from settings/sensors.json...`);
            let count = 0;
            sensors.forEach(sensor => {
              const sensorId = sensor.id || sensor._id?.$oid || helpers.createRandomString(20);
              const cleanSensor = {
                ...sensor,
                _id: sensorId,
                id: sensorId,
                date: sensor.date?.$date || sensor.date || new Date().toISOString()
              };
              _data.create('sensors', sensorId, cleanSensor, () => {
                count++;
                if (count === sensors.length) {
                  resolve();
                }
              });
            });
            return;
          }
        } catch (e) {
          console.error('[SENSORS] Error importing default sensors:', e);
        }
      }
      resolve();
    });
  });
}

// @route     GET api/sensors
// @desc      Get all sensors for the user's company (or all if superuser)
// @access    Private
router.get('/', auth, async (req, res) => {
  try {
    await ensureSensorsImported();

    const companyname = req.user.companyname || '';
    const isSuperuser = (req.user.name && req.user.name.toLowerCase() === 'superuser') || companyname.toLowerCase() === 'admin';

    _data.list('sensors', (err, sensorFiles) => {
      if (err || !sensorFiles || sensorFiles.length === 0) {
        return res.status(200).json([]);
      }

      const sensors = [];
      let count = 0;

      sensorFiles.forEach((sensorId) => {
        _data.read('sensors', sensorId, async (err, sensorData) => {
          count++;
          if (!err && sensorData) {
            let isAllowed = isSuperuser;
            if (!isAllowed && Array.isArray(sensorData.company)) {
              isAllowed = sensorData.company.includes(companyname);
            } else if (!isAllowed && typeof sensorData.company === 'string') {
              isAllowed = sensorData.company === companyname;
            }

            if (isAllowed) {
              sensors.push(sensorData);
            }
          }

          if (count === sensorFiles.length) {
            // Sort by date newest first
            sensors.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

            const totalLines = Math.min(Math.max(parseInt(req.query.totalLines) || 10, 1), 100000);
            const date0 = req.query.date0 ? req.query.date0 : null;
            const date1 = req.query.date1 ? req.query.date1 : null;

            const updatedSensors = [];
            let logCount = 0;

            if (sensors.length === 0) {
              return res.status(200).json([]);
            }

            sensors.forEach(sensor => {
              let key = sensor.dtuId === '-1' ? `${sensor.sensorId}` : `${sensor.dtuId}-${sensor.sensorId}`;
              
              _logs.read(key, totalLines, date0, date1, false, (err, sensorData) => {
                logCount++;
                sensor.logsdata = Array.isArray(sensorData) ? sensorData : [];
                updatedSensors.push(sensor);

                if (logCount === sensors.length) {
                  res.status(200).json(updatedSensors);
                }
              });
            });
          }
        });
      });
    });
  } catch (err) {
    console.error('Error in main sensor route:', err.message);
    if (!res.headersSent) {
      res.status(500).send('Server Error');
    }
  }
});

// @route     POST api/sensors
// @desc      Add new sensor
// @access    Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Please add name').not().isEmpty(),
      check('dtuId', 'Please add DTU ID').not().isEmpty(),
      check('sensorId', 'Please add SENSOR ID').not().isEmpty(),
      check('type', 'Please define SENSOR TYPE').not().isEmpty()
    ],
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, dtuId, sensorId, type, ratingMin, ratingMax, variables, limits, company } = req.body;
    const generatedId = helpers.createRandomString(20);

    const newSensor = {
      _id: generatedId,
      id: generatedId,
      name,
      dtuId,
      sensorId,
      type,
      ratingMin: ratingMin || '-1',
      ratingMax: ratingMax || '-1',
      variables: Array.isArray(variables) ? variables : [],
      limits: limits || {},
      company: Array.isArray(company) ? company : [req.user.companyname],
      date: new Date().toISOString()
    };

    _data.create('sensors', generatedId, newSensor, (err) => {
      if (err) {
        console.error('[SENSORS] Error saving sensor file:', err);
        return res.status(500).json({ msg: 'Server Error' });
      }
      res.json(newSensor);
    });
  }
);

// @route     PUT api/sensors/:id
// @desc      Update sensor
// @access    Private
router.put('/:id', auth, (req, res) => {
  const sensorId = req.params.id;

  const { name, dtuId, sensorId: deviceId, type, ratingMin, ratingMax, variables, limits, location, company } = req.body;

  _data.read('sensors', sensorId, (err, sensorData) => {
    if (err || !sensorData) {
      return res.status(404).json({ msg: 'Sensor not found' });
    }

    const userCompany = req.user.companyname || '';
    const isSuperuser = (req.user.name && req.user.name.toLowerCase() === 'superuser') || userCompany.toLowerCase() === 'admin';
    let isAllowed = isSuperuser;
    if (!isAllowed && Array.isArray(sensorData.company)) {
      isAllowed = sensorData.company.includes(userCompany);
    } else if (!isAllowed && typeof sensorData.company === 'string') {
      isAllowed = sensorData.company === userCompany;
    }

    if (!isAllowed) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    if (name !== undefined) sensorData.name = name;
    if (dtuId !== undefined) sensorData.dtuId = dtuId;
    if (deviceId !== undefined) sensorData.sensorId = deviceId;
    if (type !== undefined) sensorData.type = type;
    if (ratingMin !== undefined) sensorData.ratingMin = ratingMin;
    if (ratingMax !== undefined) sensorData.ratingMax = ratingMax;
    if (variables !== undefined) sensorData.variables = variables;
    if (limits !== undefined) sensorData.limits = limits;
    if (location !== undefined) sensorData.location = location;
    if (company !== undefined) sensorData.company = Array.isArray(company) ? company : [company];

    _data.update('sensors', sensorId, sensorData, (err) => {
      if (err) {
        console.error('[SENSORS] Error updating sensor file:', err);
        return res.status(500).json({ msg: 'Server Error' });
      }
      res.json(sensorData);
    });
  });
});

// @route     DELETE api/sensors/:id
// @desc      Delete sensor
// @access    Private
router.delete('/:id', auth, (req, res) => {
  const sensorId = req.params.id;

  _data.read('sensors', sensorId, (err, sensorData) => {
    if (err || !sensorData) {
      return res.status(404).json({ msg: 'Sensor not found' });
    }

    const userCompany = req.user.companyname || '';
    const isSuperuser = (req.user.name && req.user.name.toLowerCase() === 'superuser') || userCompany.toLowerCase() === 'admin';
    let isAllowed = isSuperuser;
    if (!isAllowed && Array.isArray(sensorData.company)) {
      isAllowed = sensorData.company.includes(userCompany);
    } else if (!isAllowed && typeof sensorData.company === 'string') {
      isAllowed = sensorData.company === userCompany;
    }

    if (!isAllowed) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    _data.delete('sensors', sensorId, (err) => {
      if (err) {
        console.error('[SENSORS] Error deleting sensor file:', err);
        return res.status(500).json({ msg: 'Server Error' });
      }
      res.json({ msg: 'Sensor removed' });
    });
  });
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