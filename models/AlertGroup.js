const mongoose = require('mongoose');

const AlertsGroupSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  company: {
    type: String,
  },
  sensor: {
    type: Array,
  },
  email: {
    type: Array,
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('alertsgroup', AlertsGroupSchema);
