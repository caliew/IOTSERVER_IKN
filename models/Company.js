const mongoose = require('mongoose');

const CompanySchema = mongoose.Schema({
  companyname: {
    type: String
  },
  status: {
    type: Boolean,
    default: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('company', CompanySchema);
