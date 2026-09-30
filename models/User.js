const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  companyname: {
    type: String
  },
  phone: {
    type: Number
  },
  password: {
    type: String,
    required: true
  },
  usertype: {
    type: String,
    default: 'user'
  },
  role: {
    type: String,
    enum: ['CHECKER', 'VERIFIER', 'ADMIN', 'USER'],
    default: 'CHECKER'
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

module.exports = mongoose.model('user', UserSchema);
