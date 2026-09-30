const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../middleware/auth');
const {check, validationResult} = require('express-validator');

const User = require('../models/User');
const Company = require('../models/Company');
const userStore = require('../lib/userStore');

const cors = require('cors');
router.use( cors({ origin:'*'}) );

// @route     POST api/users
// @desc      Register a user (saved to .data/settings/users.json)
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
    const {name, email, companyname, phone, password, usertype, status, role} = req.body;
    try {
      let existingUser = userStore.findUser(email);
      if (existingUser) {
        return res.status(400).json({msg: 'User already exists'});
      }

      const savedUser = await userStore.saveOrUpdateUser({
        name,
        email,
        companyname,
        phone,
        password,
        usertype,
        role: role || (usertype === 'administrator' ? 'ADMIN' : (usertype === 'verifier' ? 'VERIFIER' : 'CHECKER')),
        status
      });

      const mongoose = require('mongoose');
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          const dbUser = new User({
            name,
            email: email.toUpperCase(),
            companyname,
            phone,
            password: hashedPassword,
            usertype,
            role: savedUser.role,
            status
          });
          await dbUser.save();
        } catch (e) {}
      }

      const payload = {
        user: {
          id: savedUser.id,
          username: savedUser.username,
          role: savedUser.role
        },
      };

      const secret = config.has('jwtSecret') ? config.get('jwtSecret') : 'secret';
      jwt.sign(
        payload,
        secret,
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token, user: savedUser });
        },
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },
);

// @route     PUT api/users/:id
// @desc      Update user in JSON store
// @access    Private
router.put('/:id', auth, async (req, res) => {
  const {name, email, companyname, phone, usertype, status, password, role } = req.body;  
  try {
    const updated = await userStore.saveOrUpdateUser({
      id: req.params.id,
      name,
      email,
      companyname,
      phone,
      usertype,
      role,
      status,
      password
    });

    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const userFields = {};
        if (name) userFields.name = name;
        if (email) userFields.email = email;
        if (companyname) userFields.companyname = companyname;
        if (phone) userFields.phone = phone;
        if (usertype) userFields.usertype = usertype;
        if (role) userFields.role = role;
        if (status !== undefined) userFields.status = status;
        if (password) {
          const salt = await bcrypt.genSalt(10);
          userFields.password = await bcrypt.hash(password, salt);
        }
        await User.findByIdAndUpdate(req.params.id, {$set: userFields}, {new: true});
      } catch (e) {}
    }

    res.json(updated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     GET api/users
// @desc      Get all registered users (from .data/settings/users.json)
// @access    Private
router.get('/', auth, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const dbUsers = await User.find({});
        if (dbUsers && dbUsers.length > 0) return res.status(200).json(dbUsers);
      } catch (e) {}
    }
    const jsonUsers = userStore.getUsers();
    res.status(200).json(jsonUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     GET api/users/companies
// @desc      Get all registered companies
// @access    Private
router.get('/companies', auth, async (req, res) => {
  try {
    const users = userStore.getUsers();
    let arraycompanies = [...new Set(users.map(x => x.companyname).filter(Boolean))];
    res.status(200).json(arraycompanies.map(c => ({ companyname: c, status: true })));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
