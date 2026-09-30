const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../middleware/auth');
const {check, validationResult} = require('express-validator');

const User = require('../models/User');
const userStore = require('../lib/userStore');

const cors = require('cors');
router.use( cors({origin:'*'}) );

// @route     GET api/auth
// @desc      Get logged in user
// @access    Private
router.get('/', auth, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState === 1 && req.user.id) {
      try {
        const dbUser = await User.findById(req.user.id.toUpperCase()).select('-password');
        if (dbUser) return res.json(dbUser);
      } catch (e) {}
    }
    const jsonUser = userStore.findUser(req.user.id || req.user.username);
    if (jsonUser) {
      const { password, ...userWithoutPassword } = jsonUser;
      return res.json(userWithoutPassword);
    }
    return res.json(req.user);
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
    const {email, password} = req.body;
    try {
      let _email = email.toUpperCase();
      let user = null;

      const mongoose = require('mongoose');
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          user = await User.findOne({ email: _email });
        } catch (e) {}
      }
      if (!user) {
        user = userStore.findUser(_email);
      }

      if (!user) {
        console.log('...INVALID LOGIN...');
        return res.status(400).json({msg: 'Invalid Login'});
      }

      let isMatch = false;
      if (user.password) {
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
          isMatch = await bcrypt.compare(password, user.password);
        } else {
          isMatch = password === user.password;
        }
      }

      if (!isMatch) {
        console.log('...INVALID CREDENTIALS...');
        return res.status(400).json({msg: 'Invalid Credentials'});
      }
      if (user.status === false) {
        return res.status(400).json({msg:'Deactivated'});
      }

      const payload = {
        user: { id: user.id || user._id, username: user.username || user.name, role: user.role || 'CHECKER' },
      };
      const secret = config.has('jwtSecret') ? config.get('jwtSecret') : 'secret';
      jwt.sign(
        payload,
        secret,
        { expiresIn: '365d' },
        (err, token) => {
          if (err) throw err;
          res.json({token});
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },
);

// @route     POST api/auth/login
// @desc      RESTful Login endpoint returning token & user details (saved to JSON)
// @access    Public
router.post('/login', async (req, res) => {
  const { username, password, site } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }

  try {
    const _username = String(username).trim();
    const siteName = site || 'IKNHOSPITAL';

    // 1. Search in .data/settings/users.json file store
    let user = userStore.findUser(_username);

    // 2. Fallback to DB search if connected
    const mongoose = require('mongoose');
    if (!user && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const dbUser = await User.findOne({
          $or: [
            { username: _username },
            { email: _username.toUpperCase() },
            { email: _username.toLowerCase() },
            { name: _username }
          ]
        });
        if (dbUser) {
          user = {
            id: dbUser.id || dbUser._id,
            name: dbUser.name,
            username: dbUser.username || dbUser.name,
            email: dbUser.email,
            password: dbUser.password,
            status: dbUser.status !== false,
            usertype: dbUser.usertype,
            role: dbUser.role || (dbUser.usertype === 'administrator' ? 'ADMIN' : 'CHECKER'),
            companyname: dbUser.companyname || siteName
          };
        }
      } catch (e) {
        console.warn('DB search failed during login:', e.message);
      }
    }

    if (user) {
      if (user.status === false) {
        return res.status(400).json({ success: false, error: 'Account deactivated' });
      }

      // Check if user has no password set (first-time password initialization)
      const hasNoPassword = !user.password || String(user.password).trim() === '';

      if (hasNoPassword) {
        console.log(`[AUTH] First-time password set for pre-approved user: "${_username}"`);
        user = await userStore.saveOrUpdateUser({
          ...user,
          username: user.username || _username,
          password: password,
          site: siteName
        });
        user.isFirstTimeLogin = true;

        if (mongoose.connection && mongoose.connection.readyState === 1) {
          try {
            const dbUser = await User.findOne({ username: user.username });
            if (dbUser) {
              const salt = await bcrypt.genSalt(10);
              dbUser.password = await bcrypt.hash(password, salt);
              await dbUser.save();
            }
          } catch (e) {
            console.warn('Failed to update DB password:', e.message);
          }
        }
      } else {
        // Validate password for existing user with password set
        let isMatch = false;
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
          isMatch = await bcrypt.compare(password, user.password);
        } else {
          isMatch = password === user.password;
        }
        if (!isMatch) {
          return res.status(400).json({ success: false, error: 'Invalid credentials' });
        }
      }
    } else {
      // User not found in users.json or DB — reject login
      console.log(`[AUTH] Login rejected: username "${_username}" not found in approved user list`);
      return res.status(401).json({
        success: false,
        error: 'Access denied. Your account has not been registered. Please contact the administrator.'
      });
    }

    const userId = user.id || `usr_${Math.floor(100 + Math.random() * 900)}`;
    const finalRole = (user.role || (user.usertype === 'administrator' ? 'ADMIN' : 'CHECKER')).toUpperCase();
    const finalUsername = user.username || user.name || _username;

    const payload = {
      user: {
        id: String(userId),
        username: finalUsername,
        role: finalRole,
        site: siteName
      }
    };

    const secret = config.has('jwtSecret') ? config.get('jwtSecret') : 'secret';
    const token = jwt.sign(payload, secret, { expiresIn: '365d' });

    return res.status(200).json({
      success: true,
      token: token,
      isFirstTimeLogin: Boolean(user.isFirstTimeLogin),
      user: {
        id: String(userId),
        username: finalUsername,
        role: finalRole
      }
    });

  } catch (err) {
    console.error('Error in POST /api/auth/login:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// @route     POST api/auth/setup-password
// @desc      Explicit endpoint to initialize password for pre-approved user with empty password
// @access    Public
router.post('/setup-password', async (req, res) => {
  const { username, newPassword, site } = req.body || {};
  if (!username || !newPassword) {
    return res.status(400).json({ success: false, error: 'Username and newPassword are required' });
  }

  try {
    const _username = String(username).trim();
    const siteName = site || 'IKNHOSPITAL';

    let user = userStore.findUser(_username);

    const mongoose = require('mongoose');
    if (!user && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const dbUser = await User.findOne({
          $or: [
            { username: _username },
            { email: _username.toUpperCase() },
            { email: _username.toLowerCase() },
            { name: _username }
          ]
        });
        if (dbUser) {
          user = {
            id: dbUser.id || dbUser._id,
            name: dbUser.name,
            username: dbUser.username || dbUser.name,
            email: dbUser.email,
            password: dbUser.password,
            status: dbUser.status !== false,
            usertype: dbUser.usertype,
            role: dbUser.role || (dbUser.usertype === 'administrator' ? 'ADMIN' : 'CHECKER'),
            companyname: dbUser.companyname || siteName
          };
        }
      } catch (e) {}
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Account not found in approved user list.'
      });
    }

    // Reject if user already has a password set
    if (user.password && String(user.password).trim() !== '') {
      return res.status(400).json({
        success: false,
        error: 'Password already configured for this account. Please log in normally.'
      });
    }

    // Save and hash new password
    user = await userStore.saveOrUpdateUser({
      ...user,
      username: user.username || _username,
      password: newPassword,
      site: siteName
    });

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const dbUser = await User.findOne({ username: user.username });
        if (dbUser) {
          const salt = await bcrypt.genSalt(10);
          dbUser.password = await bcrypt.hash(newPassword, salt);
          await dbUser.save();
        }
      } catch (e) {}
    }

    const userId = user.id || `usr_${Math.floor(100 + Math.random() * 900)}`;
    const finalRole = (user.role || (user.usertype === 'administrator' ? 'ADMIN' : 'CHECKER')).toUpperCase();
    const finalUsername = user.username || user.name || _username;

    const payload = {
      user: {
        id: String(userId),
        username: finalUsername,
        role: finalRole,
        site: siteName
      }
    };

    const secret = config.has('jwtSecret') ? config.get('jwtSecret') : 'secret';
    const token = jwt.sign(payload, secret, { expiresIn: '365d' });

    return res.status(200).json({
      success: true,
      message: 'Password successfully initialized',
      token: token,
      user: {
        id: String(userId),
        username: finalUsername,
        role: finalRole
      }
    });
  } catch (err) {
    console.error('Error in POST /api/auth/setup-password:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
