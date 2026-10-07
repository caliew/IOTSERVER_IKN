// middleware/auth.js - SIMPLE GLOBAL BYPASS
const jwt = require('jsonwebtoken');
const config = require('config');
const _debugENDPOINT = false;

const authMiddleware = function (req, res, next) {
  // ========== GLOBAL BYPASS SWITCH ==========
  // Set this to true to bypass ALL JWT checks
  const BYPASS_ALL_JWT = true;  // ← CHANGE THIS TO true/false

  if (BYPASS_ALL_JWT) {
    _debugENDPOINT && console.log('🔓 GLOBAL BYPASS: Skipping ALL JWT checks');

    // Get user info from query or use defaults
    const userId = req.query.id || req.query.userId || 'DEFAULT_USER';
    const company = req.query.company || 'TEST_COMPANY';

    req.user = {
      id: userId,
      username: userId,
      name: 'Bypass User',
      role: ['ADMIN', 'CHECKER', 'VERIFIER'],
      companyname: company
    };

    _debugENDPOINT && console.log(`🔓 Using: User ID=${userId}, Company=${company}`);
    return next();
  }
  // ========== END BYPASS ==========

  // Get token from header (supports x-auth-token and Authorization: Bearer <token>)
  let token = req.header('x-auth-token');
  if (!token && req.header('Authorization')) {
    const authHeader = req.header('Authorization');
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  if (!token) {
    _debugENDPOINT && console.log('🔐 AUTH: No token provided');
    return res.status(401).json({ success: false, msg: 'No token, authorization denied', error: 'No token provided' });
  }

  try {
    const secret = config.has('jwtSecret') ? config.get('jwtSecret') : 'secret';
    const decoded = jwt.verify(token, secret);
    req.user = decoded.user;
    _debugENDPOINT && console.log(`🔐 AUTH: Token valid for user ${decoded.user.id || decoded.user.username}`);
    next();
  } catch (err) {
    _debugENDPOINT && console.log(`🔐 AUTH: Token verification failed: ${err.message}`);
    return res.status(401).json({ success: false, msg: 'Token is not valid', error: 'Token is not valid' });
  }
};

// Helper middleware for role-based authorization
authMiddleware.requireRole = function (...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No user found in request token' });
    }
    let userRoles = [];
    if (Array.isArray(req.user.role)) {
      userRoles = req.user.role.map(r => String(r).toUpperCase());
    } else if (typeof req.user.role === 'string' && req.user.role) {
      userRoles = [req.user.role.toUpperCase()];
    } else if (typeof req.user.usertype === 'string' && req.user.usertype) {
      userRoles = [req.user.usertype.toUpperCase()];
    }

    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

    if (userRoles.includes('ADMIN') || userRoles.includes('ADMINISTRATOR') || normalizedAllowed.some(r => userRoles.includes(r))) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}], user has [${userRoles.join(', ')}]`
    });
  };
};

module.exports = authMiddleware;