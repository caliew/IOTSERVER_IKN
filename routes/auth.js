/*
 * routes/auth.js — File-based Authentication
 *
 * Replaces MongoDB User model with file-based user storage.
 * User files are stored in: .data/users/[EMAIL_UPPERCASE].json
 *
 * User file format:
 * {
 *   "id"          : "USER@DOMAIN.COM",
 *   "email"       : "USER@DOMAIN.COM",
 *   "name"        : "Display Name",
 *   "companyname" : "CompanyKey",
 *   "password"    : "$2a$10$...(bcrypt hash)",
 *   "status"      : true
 * }
 *
 * To create a user, use: node generateToken.js (or use the admin CLI)
 */

const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const config   = require('config');
const auth     = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const cors     = require('cors');
const _data    = require('../lib/data');

router.use(cors({ origin: '*' }));

// -------------------------------------------------------
// @route   GET /api/auth
// @desc    Get currently logged-in user (from JWT token)
// @access  Private
// -------------------------------------------------------
router.get('/', auth, (req, res) => {
  // req.user.id is the email key set during login
  _data.read('users', req.user.id, (err, userData) => {
    if (err || !userData) {
      return res.status(404).json({ msg: 'User not found' });
    }
    // Return user data without exposing the password
    const { password, ...userWithoutPassword } = userData;
    res.json(userWithoutPassword);
  });
});

// -------------------------------------------------------
// @route   POST /api/auth
// @desc    Authenticate user & return JWT token
// @access  Public
// -------------------------------------------------------
router.post(
  '/',
  [
    check('email',    'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    // Normalise email to uppercase to match stored key
    const emailKey = email.toUpperCase();

    _data.read('users', emailKey, async (err, userData) => {
      // User file not found
      if (err || !userData) {
        console.log(`[AUTH] Login failed — user not found: ${emailKey}`);
        return res.status(400).json({ msg: 'Invalid Login' });
      }

      try {
        // Compare password against bcrypt hash
        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) {
          console.log(`[AUTH] Login failed — wrong password: ${emailKey}`);
          return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Check account is active
        if (!userData.status) {
          return res.status(400).json({ msg: 'Account deactivated' });
        }

        // Build JWT payload — include id, name and companyname
        // so the React frontend doesn't need a separate /api/auth GET call
        const payload = {
          user: {
            id          : userData.id,
            name        : userData.name        || '',
            companyname : userData.companyname || '',
          },
        };

        jwt.sign(
          payload,
          config.get('jwtSecret'),
          { expiresIn: '365d' },
          (err, token) => {
            if (err) throw err;
            console.log(`[AUTH] Login success: ${emailKey}`);
            res.json({ token });
          }
        );
      } catch (err) {
        console.error('[AUTH] Server error:', err.message);
        res.status(500).send('Server Error');
      }
    });
  }
);

module.exports = router;
