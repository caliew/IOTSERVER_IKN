const mongoose = require('mongoose');

const AlertSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  date : {
    type : Date,
    default: Date.now
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
  reading: {
    type: Number,
  },
  limit: {
    type: Number,
  },
  readFlag: {
    type: Boolean,
    default: false,
    required: true
  }
});

module.exports = mongoose.model('alert', AlertSchema);
