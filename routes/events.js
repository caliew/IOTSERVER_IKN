const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {check, validationResult} = require('express-validator');

const User = require('../models/User');
const Sensor = require('../models/Sensor');
const Contact = require('../models/Contact');

const _data = require("../lib/data");
const _logs = require('../lib/logs');

const cors = require('cors');
router.use( cors({ origin:'*'}) );

// @route     GET api/sensors
// @desc      Get all users contacts
// @access    Private
router.get('/', auth, async (req, res) => {
  // -------------------------------------
  // AUTH MIDDLEWARE WILL VERIFY THE TOKEN
  //  ------------------------------------
  // ------------------------------------
  try {
    const sensors = await Sensor.find({dtuId : {$gte:-1}}).sort({
      date: -1,
    });
    //  --------------------
    //  ABSTRACT SENSOR DATA
    //  --------------------
    let nCOUNT = 0;
    let updatedSensors = [];
    // --------------------
    let totalLines = Number(req.query.totalLines);
    // ---------------------
    sensors.forEach( sensor  => {
      let key = sensor.dtuId === '-1' ? `${sensor.sensorId}` : `${sensor.dtuId}-${sensor.sensorId}`
      _logs.read(key,totalLines,null,null,false,function(err,sensorData) {
        nCOUNT ++;
        sensor['logsdata'] = sensorData;
        updatedSensors.push(sensor);
        // -------------------------
        if ( nCOUNT === sensors.length) {
          res.status(200).json(updatedSensors);
        }
      })
    })
    // -------------
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     POST api/sensors
// @desc      Add new contact
// @access    Private
router.post('/',[auth,[
    check('name', 'Please add name').not().isEmpty(),
    check('dtuId', 'Please add DTU ID').not().isEmpty(),
    check('sensorId', 'Please add SENSOR ID').not().isEmpty(),
    check('type', 'Please define SENSOR TYPE').not().isEmpty() ],],
  async (req, res) => {
    // ----------------------------------
    console.log(`... API/SENSORS [POST]`)
    // ----------------------------------
    const errors = validationResult(req);
    // ---------------------
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    const {name, dtuId, sensorId, type, ratingMin, ratingMax,variables,limits } = req.body;

    try {
      const newSensor = new Sensor({
        name,
        dtuId,
        sensorId,
        type,
        ratingMin,
        ratingMax,
        variables,
        limits
      });
      const sensor = await newSensor.save();
      res.json(sensor);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },
);

// @route     PUT api/sensors/:id
// @desc      Update contact
// @access    Private
router.put('/:id', auth, async (req, res) => {
  // ----------------------------------
  console.log(`... API/SENSORS [PUT]`)
  // ----------------------------------
  const {name, dtuId, sensorId, type, ratingMin, ratingMax,variables,limits,location } = req.body;
  // --------------------
  // BUILD SENSOR OBJECT
  // --------------------
  const sensorFields = {};
  if (type)       sensorFields.type = type;
  if (name)       sensorFields.name = name;
  if (dtuId)      sensorFields.dtuId = dtuId;
  if (limits)     sensorFields.limits = limits;
  if (location)   sensorFields.location = location;
  if (sensorId)   sensorFields.sensorId = sensorId;
  if (ratingMin)  sensorFields.ratingMin = ratingMin;
  if (ratingMax)  sensorFields.ratingMax = ratingMax;
  if (variables)  sensorFields.variables = variables;

  try {
    let sensor = await Sensor.findById(req.params.id);

    if (!sensor) return res.status(404).json({msg: 'Sensor not found'});
    sensor = await Sensor.findByIdAndUpdate(
      req.params.id,
      {$set: sensorFields},
      {new: true},
    );
    console.log(sensor)

    res.json(sensor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     DELETE api/sensors/:id
// @desc      Delete contact
// @access    Private
router.delete('/:id', auth, async (req, res) => {
  // -------------------------------------
  // AUTH MIDDLEWARE WILL VERIFY THE TOKEN
  //  ------------------------------------
  console.log('..API/SENSORS [DELETE] USER OBJECT ID = ',req.user.id);
  console.log('..API/SENSORS [DELETE]       PARAM ID = ',req.params.id);
  // ------------------------------------
  try {
    let sensor = await Sensor.findById(req.params.id);

    if (!sensor) return res.status(404).json({msg: 'Sensor not found'});

    await Sensor.findByIdAndRemove(req.params.id);

    res.json({msg: 'Sensor removed'});
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
