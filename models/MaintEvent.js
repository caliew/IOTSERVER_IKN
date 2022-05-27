const mongoose = require('mongoose');

const MaintEventSchema = mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  date : {
    type : Date,
    default: Date.now
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

module.exports = mongoose.model('maintEvent', MaintEventSchema);
