const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
// ------------------------------------
const User = require('../models/User');
const Sensor = require('../models/Sensor');
const cors = require('cors');
const lodash = require('lodash');
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
const updateSettings = async (file,body) => {
  try {
    // 1. Read existing settings
    const existingData = await new Promise((resolve, reject) => {
      _data.read(file, 'settings', (err, data) => {
        if (err) {
          // If file not found, treat as empty object
          if (err.code === 'ENOENT') return resolve({});
          return reject(err);
        }
        resolve(data || {});
      });
    });

    // 2. Deep merge old + new
    const mergedData = lodash.merge({}, existingData, body);

    // 3. Save merged settings back
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
const readLogs = async (fileName, nTotalLines, date0, date1) =>{
  return new Promise((resolve) => {
    _logs.read(fileName, nTotalLines, date0, date1, false, (err, data) => {
      resolve(data);
    });
  });
}
// -----
router.use( cors({origin:'*'}) );
// @route     GET api/sensors
// @desc      Get all sensors
// @access    Private
router.get('/', auth, async (req, res) => {
  // -------------------------------------
  // AUTH MIDDLEWARE WILL VERIFY THE TOKEN
  //  ------------------------------------
  let userId = req.query.id;
  const url = req.path;
  // -------
  try {
    // ----------
    const user = await User.findById(req.query.id).select('-password');
    let username = user.name ?? '';
    let companyname = user.companyname?? '';
    const sensors = await Sensor.find({ company: { $in:[`${companyname}`]}}).sort({
      date: -1,
    });
    //  --------------------
    //  ABSTRACT SENSOR DATA
    //  --------------------
    let nCOUNT = 0;
    let updatedSensors = [];
    // --------------------
    let totalLines = Number(req.query.totalLines);
    totalLines = isNaN(parseFloat(totalLines)) ? 10 : totalLines;
    let date1 = req.query.date1 ?? new Date();
    let date0 = req.query.date0 ?? new Date();
    // ------------
    _debugENDPOINT && console.log(`<${'SENSORS.JS'.magenta}> [${req.method.green}] ${url.toUpperCase().yellow} ..<${String(userId).red}>..${String(username).blue}|${String(companyname).yellow}|${String(sensors.length).green} ..${formatDate(date0)} ${formatDate(date1)}`);
    // -------------
    sensors.forEach( (sensor,_index)  => {
      // -----------------
      let nIndex = (user.name === 'superuser') ? 99 : sensor.company.indexOf(companyname);
      let key = sensor.dtuId === '-1' ? `${sensor.sensorId}` : `${sensor.dtuId}-${sensor.sensorId}`
      // -------------------------------------------------
      _logs.read(key,totalLines,date0,date1,false,function(err,sensorData) {
        // -------
        nCOUNT ++;
        sensor['logsdata'] = sensorData;
        // -----------------------------
        if (nIndex > -1) updatedSensors.push(sensor);
        // -------------------------
        if ( nCOUNT === sensors.length) {
          false && console.log(`[${String('SENSOR.JS').yellow}] LINE:61 ..TOTAL SENSORS READ:${sensors.length}/${updatedSensors.length}`);
          res.status(200).json(updatedSensors);
        }
      })
    })
    // -------------
  } catch (err) {
    // ------------------------
    console.error(err.message);
    res.status(500).send('Server Error');
    // ----------------------------------
  }
});
// ----
Object.entries(endpointConfigs).forEach(([routeName, config]) => {
  router.get(`/${routeName}/rawdata`, auth, (req, res) => handleRawData(req, res, config));
  router.put(`/${routeName}/settings`, auth, (req, res) => handleUpdateSettings(req, res, config));
});
// ------------
// MCST
// ------------
router.get('/MCST/Checklist',auth,async(req,res) => {  
  try {
    const ObjData = req.query;
    const SettingFile = 'MCST_CHECKLIST';
    const ChecklistHistory = await readSettings(SettingFile);
    res.status(200).send(ChecklistHistory);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  }
})
router.put('/MCST/Checklist',auth,async(req,res) => {
  const { body } = req;
  const settingFiles = ['MCST_CHECKLIST'];
  try {
    await Promise.all(settingFiles.map(file => updateSettings(file,body)));
    res.status(200).send({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Error updating settings' });
  }
});
//  ---------
//  CHECKLIST
//  ---------
router.put('/CHECKLIST', (req, res) => {
  const { payload } = req.body; // { [title]: { [date]: {...} } }
  consoel.log('/CHECKLIST',payload);
  const CHECKLIST_FILE = path.join(__dirname, 'checklist.json');
  if (!payload) {
    return res.status(400).json({ error: 'Missing payload' });
  }

  // Read existing checklist data
  let existingData = {};
  if (fs.existsSync(CHECKLIST_FILE)) {
    const raw = fs.readFileSync(CHECKLIST_FILE, 'utf-8');
    existingData = raw ? JSON.parse(raw) : {};
  }

  // Merge incoming payload
  const mergedData = deepMerge(existingData, payload);

  // Save back to file
  fs.writeFileSync(CHECKLIST_FILE, JSON.stringify(mergedData, null, 2), 'utf-8');

  res.json({ success: true, data: mergedData });
});

// -------------
// Data Download
// -------------
let app = {};
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
  // console.log(`.. <${'SENSORS.JS'.magenta}> ..${req.baseUrl.toUpperCase().yellow} [${req.method.green}]  PARAMS ID <${req.params.id}>`)
  // console.log('.....CHECK POINT (1).....')
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
};
// --------
async function handleRawData(req, res, config) {
  try {
    const ObjData = req.query;
    const SettingFile = config.settingFiles[0]; // first file used for reading
    const LOGFile = config.logFile;
    const ALERTFile = config.alertFile;

    const nTotalLines = ObjData.totalLines !== undefined && Number(ObjData.totalLines) !== -1
      ? ObjData.totalLines
      : maxLOGS;

    const _date0 = ObjData.date0 ?? null;
    const _date1 = ObjData.date1 ?? null;

    const settingData = await readSettings(SettingFile);
    ObjData.settings = settingData;

    // Read sensor plot data
    let sensorPlotData = {};
    if (settingData?.IOT_SENSORS) {
      const keys = Object.keys(settingData.IOT_SENSORS);
      const sensorData = await Promise.all(
        keys.map((key) => readLogs(key, nTotalLines, _date0, _date1))
      );
      keys.forEach((key, index) => {
        sensorPlotData[key] = sensorData[index];
      });
    }
    ObjData.WISensor = sensorPlotData;
    console.log(sensorPlotData);

    // Read logs
    ObjData.sensorData = await readLogs(LOGFile, nTotalLines, _date0, _date1);

    // Read alerts (today only)
    let _today0 = new Date();
    let _today1 = new Date();
    _today0.setHours(0, 0, 0);
    _today1.setHours(23, 59, 59);
    ObjData.alerts = await readLogs(ALERTFile, nTotalLines, _today0, _today1);

    res.status(200).send(ObjData);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  }
}
async function handleUpdateSettings(req, res, config) {
  const { body } = req;
  const files = config.updateFiles ?? config.settingFiles;

  try {
    await Promise.all(files.map(file => updateSettings(file, body)));
    res.status(200).send({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Error updating settings' });
  }
}

module.exports = router;
