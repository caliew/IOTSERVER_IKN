const mongoose = require('mongoose');

const EventSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  date : {
    type : Date,
    default: Date.now
  },
  location: {
    type: String
  },
  description: {
    type: String
  },
  readFlag: {
    type: Boolean,
    default: false,
    required: true
  }
});

module.exports = mongoose.model('event', EventSchema);
