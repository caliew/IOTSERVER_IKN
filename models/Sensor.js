const mongoose = require('mongoose');

const SensorSchema = mongoose.Schema({
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
  location: {
    type: String,
  },
  ratingMin: {
    type: String,
  },
  ratingMax: {
    type: String,
  },
  company: {
    type: Array,
  },
  variables: {
    type: Array,
  },
  limits: {
    type: mongoose.Schema.Types.Mixed,
  },
  logsdata : {
    type: Array,
  },
  alertpoint : {
    type: Number,
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('sensor', SensorSchema);
