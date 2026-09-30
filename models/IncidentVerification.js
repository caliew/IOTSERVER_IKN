const mongoose = require('mongoose');

const IncidentVerificationSchema = mongoose.Schema({
  incidentId: {
    type: String,
    required: true,
    unique: true
  },
  telemetryKey: {
    type: String,
    required: true
  },
  decision: {
    type: String,
    enum: ['APPROVED', 'REJECTED'],
    required: true
  },
  comments: {
    type: String
  },
  verified_by: {
    type: String,
    required: true
  },
  verified_at: {
    type: Date,
    default: Date.now
  },
  site: {
    type: String,
    default: 'IKNHOSPITAL'
  }
});

module.exports = mongoose.model('incidentVerification', IncidentVerificationSchema);
