const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../middleware/auth');
const {check, validationResult} = require('express-validator');

const User = require('../models/User');
const Company = require('../models/Company');

// @route     PUT api/company/:id
// @desc      Update company
// @access    Private
router.put('/:id', auth, async (req, res) => {
  // ----------------------------------
  console.log(`... API/COMPANY [PUT]`)
  const {companyname, notification_emails, status, date } = req.body;
  console.log(companyname,status,notification_emails,date)
  // --------------------
  // BUILD SENSOR OBJECT
  // --------------------
  const companyFields = {};
  if (companyname)  companyFields.companyname = companyname;
  // ------------------------
  companyFields.status = status;
  companyFields.date = date;
  companyFields.notification_emails = notification_emails;
  // ----------------------------------
  try {
    let company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({msg: 'Company not found'});
    // ---------------------
    company = await Company.findByIdAndUpdate(
      req.params.id,
      {$set: companyFields},
      {new: true},
    );
    console.log(company);
    res.json(company);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/company
// @desc    GET all companies
// @access  Private
router.get('/',auth, async (req,res) => {
  // -------------------------------------
  // AUTH MIDDLEWARE WILL VERIFY THE TOKEN
  // -------------------------------------
  console.log(`..API/COMPANYSENSORS [GET]`)
  // ----------------------------
  try {
    const companies = await Company.find({});
    res.status(200).json(companies);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})


module.exports = router;