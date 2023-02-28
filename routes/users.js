const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../middleware/auth');
const {check, validationResult} = require('express-validator');

const User = require('../models/User');
const Company = require('../models/Company');

const cors = require('cors');
router.use( cors({ origin:'*'}) );
// @route     POST api/users
// @desc      Regiter a user
// @access    Public
router.post('/',
  [
    check('name', 'Please add name').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('companyname', 'Please add company name').not().isEmpty(),
    check('phone', 'Please add phone number').not().isEmpty(),
    check('usertype', 'Please account type').not().isEmpty(),
    check('status', 'Please active status').not().isEmpty(),
    check('password','Please enter a password with 6 or more characters',).isLength({min: 6}),
  ],
  async (req, res) => {
    // ----------------------------
    console.log(`.. <${'USERS.JS'.magenta}> ..${req.originalUrl.toUpperCase().yellow} [${req.method.green}]`)
    // -----------------------------
    const errors = validationResult(req);
    console.log(errors);
    // ----------------------------------
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
    // -----------------------
    const {name, email, companyname, phone, password} = req.body;
    try {
      let user = await User.findOne({email});
      console.log(user);
      if (user) {
        console.log('...USER EXISTS...')
        return res.status(400).json({msg: 'User already exists'});
      }
      user = new User({
        name,
        email : email.toUpperCase(),
        companyname,
        phone,
        password,
      });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      const payload = {
        user: {
          id: user.id,
        },
      };
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        {
          expiresIn: 360000,
        },
        (err, token) => {
          if (err) throw err;
          res.json({token});
        },
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },
);

// @route     PUT api/sensors/:id
// @desc      Update sensor
// @access    Private
router.put('/:id', auth, async (req, res) => {
  // ----------------------------------
  console.log(`.. <${'USERS.JS'.magenta}> ..${req.originalUrl.toUpperCase().yellow} [${req.method.green}]`)
  const {name, email, companyname, phone, usertype, status, password } = req.body;  
  // --------------------
  // BUILD SENSOR OBJECT
  // --------------------
  const userFields = {};
  if (name)         userFields.name = name;
  if (email)        userFields.email = email;
  if (companyname)  userFields.companyname = companyname;
  if (phone)        userFields.phone = phone;
  if (usertype)     userFields.usertype = usertype;
  if (password)     userFields.password = password;
  // ------------------------
  userFields.status = status;
  // ----------------------------------
  try {
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({msg: 'User not found'});
    // ---------------------
    user = await User.findByIdAndUpdate(
      req.params.id,
      {$set: userFields},
      {new: true},
    );
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     GET api/users
// @desc      Get all registered users
// @access    Private
router.get('/', auth, async (req, res) => {
  // -------------------------------------
  // AUTH MIDDLEWARE WILL VERIFY THE TOKEN
  // -------------------------------------
  console.log(`.. <${'USERS.JS'.magenta}> ..${req.originalUrl.toUpperCase().yellow} [${req.method.green}]`)
  // ----------------------------
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route     GET api/users
// @desc      Get all registered companies
// @access    Private
router.get('/companies', auth, async (req, res) => {
  // -------------------------------------
  // AUTH MIDDLEWARE WILL VERIFY THE TOKEN
  // -------------------------------------
  // console.log(`..API/USERS/COMPANIES [GET]`)
  // ----------------------------
  try {
    const users = await User.find({});
    let arraycompanies = [...new Set(users.map( x => x.companyname))];
    console.log(`.. <${'USERS.JS'.magenta}> ..${req.originalUrl.toUpperCase().yellow} [${req.method.green}]`)
    // -----------------------------------------------
    // UPDATE COMPANY TABLE BASE ON UPDATED USER LISTS
    // -----------------------------------------------
    arraycompanies.map( comp => {
      let searchname = comp;
      let query = {companyname:searchname}
      Company.findOne(query).exec( (error,company)  => {
        if (!company) {
          console.log('..NEW COMPANY .... TO CREATE NEW ENTRY..',query)
            company = new Company({
              companyname : comp,
              status: true,
            });
            company.save();
        }
      });
    })
    // ----------------------------------
    const companies = await Company.find({})
    res.status(200).json(companies);
    // ----------------------------------
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
