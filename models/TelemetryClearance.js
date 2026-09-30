const mongoose = require('mongoose');

const TelemetryClearanceSchema = mongoose.Schema({
  telemetryKey: {
    type: String,
    required: true,
    unique: true
  },
  macId: {
    type: String,
    required: true
  },
  dateStr: {
    type: String,
    required: true
  },
  hourStr: {
    type: String,
    required: true
  },
  reason: {
    type: String
  },
  notes: {
    type: String
  },
  cleared_by: {
    type: String,
    required: true
  },
  cleared_at: {
    type: Date,
    default: Date.now
  },
  site: {
    type: String,
    default: 'IKNHOSPITAL'
  },
  status: {
    type: String,
    default: 'CLEARED'
  }
});

module.exports = mongoose.model('telemetryClearance', TelemetryClearanceSchema);
