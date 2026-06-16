/*
 * routes/users.js — File-based User management
 *
 * Stores user files in: .data/users/[EMAIL_UPPERCASE].json
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const cors = require('cors');
const _data = require('../lib/data');

router.use(cors({ origin: '*' }));

// ------------------------------------------------------------------
// @route     POST /api/users
// @desc      Register a new user
// @access    Public (or admin CLI)
// ------------------------------------------------------------------
router.post(
  '/',
  [
    check('name', 'Please add name').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('companyname', 'Please add company name').not().isEmpty(),
    check('phone', 'Please add phone number').not().isEmpty(),
    check('usertype', 'Please select account type').not().isEmpty(),
    check('status', 'Please select active status').not().isEmpty(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    console.log(`[USERS] POST ${req.originalUrl}`);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, companyname, phone, usertype, status, password } = req.body;
    const emailKey = email.toUpperCase();

    _data.read('users', emailKey, async (err, existingUser) => {
      if (!err && existingUser) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
          id: emailKey,
          name,
          email: emailKey,
          companyname,
          phone,
          usertype,
          status: status === 'true' || status === true,
          password: hashedPassword,
        };

        _data.create('users', emailKey, newUser, (err) => {
          if (err) {
            console.error('[USERS] Error saving user file:', err);
            return res.status(500).json({ msg: 'Server Error' });
          }

          const payload = {
            user: {
              id: emailKey,
              name,
              companyname,
            },
          };

          jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 360000 },
            (err, token) => {
              if (err) throw err;
              res.json({ token });
            }
          );
        });
      } catch (err) {
        console.error('[USERS] Password hashing error:', err.message);
        res.status(500).send('Server Error');
      }
    });
  }
);

// ------------------------------------------------------------------
// @route     PUT /api/users/:id
// @desc      Update user
// @access    Private
// ------------------------------------------------------------------
router.put('/:id', auth, async (req, res) => {
  const emailKey = req.params.id.toUpperCase();
  console.log(`[USERS] PUT ${emailKey}`);

  const { name, email, companyname, phone, usertype, status, password } = req.body;

  _data.read('users', emailKey, async (err, userData) => {
    if (err || !userData) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update fields
    if (name) userData.name = name;
    if (companyname) userData.companyname = companyname;
    if (phone) userData.phone = phone;
    if (usertype) userData.usertype = usertype;
    if (status !== undefined) userData.status = (status === 'true' || status === true);

    try {
      if (password && password.length >= 6) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(password, salt);
      }

      _data.update('users', emailKey, userData, (err) => {
        if (err) {
          console.error('[USERS] Error updating user file:', err);
          return res.status(500).json({ msg: 'Server Error' });
        }
        const { password, ...userWithoutPassword } = userData;
        res.json(userWithoutPassword);
      });
    } catch (err) {
      console.error('[USERS] Hash error during update:', err.message);
      res.status(500).send('Server Error');
    }
  });
});

// ------------------------------------------------------------------
// @route     GET /api/users
// @desc      Get all registered users
// @access    Private
// ------------------------------------------------------------------
router.get('/', auth, (req, res) => {
  _data.list('users', (err, userList) => {
    if (err || !userList || userList.length === 0) {
      return res.status(200).json([]);
    }

    const users = [];
    let count = 0;

    userList.forEach((emailKey) => {
      _data.read('users', emailKey, (err, userData) => {
        count++;
        if (!err && userData) {
          const { password, ...userWithoutPassword } = userData;
          users.push(userWithoutPassword);
        }

        if (count === userList.length) {
          res.json(users);
        }
      });
    });
  });
});

// ------------------------------------------------------------------
// @route     GET /api/users/companies
// @desc      Get all unique companies
// @access    Private
// ------------------------------------------------------------------
router.get('/companies', auth, (req, res) => {
  _data.list('users', (err, userList) => {
    if (err || !userList || userList.length === 0) {
      return res.status(200).json([]);
    }

    const companyNamesSet = new Set();
    let count = 0;

    userList.forEach((emailKey) => {
      _data.read('users', emailKey, (err, userData) => {
        count++;
        if (!err && userData && userData.companyname) {
          companyNamesSet.add(userData.companyname);
        }

        if (count === userList.length) {
          const companiesArray = Array.from(companyNamesSet).map((name) => ({
            companyname: name,
            status: true,
          }));
          res.json(companiesArray);
        }
      });
    });
  });
});

module.exports = router;
