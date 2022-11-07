const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../middleware/auth');
const {check, validationResult} = require('express-validator');

const User = require('../models/User');

// @route     GET api/auth
// @desc      Get logged in user
// @access    Private
router.get('/', auth, async (req, res) => {
  try {
    // -----------
    const user = await User.findById(req.user.id.toUpperCase()).select('-password');
    console.log(`.. <${'AUTH.JS'.magenta}> ..${req.originalUrl.toUpperCase().yellow} [${req.method.green}]  USER ID <${req.user.id.toUpperCase().yellow}> USER NAME <${user.name.toUpperCase().green}>`)
    res.json(user);
    // ------------
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     POST api/auth
// @desc      Auth user & get token
// @access    Public
router.post('/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    // ----------------
    // VALIDATION CHECK
    // ----------------
    const errors = validationResult(req);
    // ------------------
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
    const {email, password} = req.body;
    try {
      // ---------------
      // DATABASE SEARCH
      // ---------------
      let _email = email.toUpperCase();
      let user = await User.findOne({ email: _email });
      console.log(`.. <${'AUTH.JS'.magenta}> ..${req.originalUrl.toUpperCase().yellow} [${req.method.green}]  EMAIL <${req.body.email.toUpperCase().yellow}> PASSWORD <${req.body.password.green}>`)
      if (!user) {
        console.log('...INVALID LOGIN...')
        return res.status(400).json({msg: 'Invalid Login'});
      }
      // --------------
      const isMatch = await bcrypt.compare(password, user.password);
      // --------------
      if (!isMatch) {
        console.log('...INVALID CREDENTIALS...')
        return res.status(400).json({msg: 'Invalid Credentials'});
      }
      // --------------------
      if (!user.status) {
        return res.status(400).json({msg:'Deactivated'});
      }
      // --------------------
      const payload = {
        user: { id: user.id },
      };
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        {
          expiresIn: '365d',
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

module.exports = router;
