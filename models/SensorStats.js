const mongoose = require('mongoose');

const SensorStatsSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  dtuId: {
    type: String,
    required: true
  },
  sensorId: {
    type: String
  },
  type: {
    type: String,
  },
  variables : {
    type: Object
  },
  statsdata : {
    type: Object
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('sensorstats', SensorStatsSchema);
