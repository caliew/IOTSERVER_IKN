// middleware/auth.js - SIMPLE GLOBAL BYPASS
const jwt = require('jsonwebtoken');
const config = require('config');
const _debugENDPOINT = false;

module.exports = function(req, res, next) {
  // ========== GLOBAL BYPASS SWITCH ==========
  // Set this to true to bypass ALL JWT checks
  const BYPASS_ALL_JWT = true;  // ← CHANGE THIS TO true/false
  
  if (BYPASS_ALL_JWT) {
    _debugENDPOINT && console.log('🔓 GLOBAL BYPASS: Skipping ALL JWT checks');
    
    // Get user info from query or use defaults
    const userId = req.query.id || req.query.userId || 'DEFAULT_USER';
    const company = req.query.company || 'TEST_COMPANY';
    
    req.user = {
      id: req.query.id || req.query.userId || 'DEFAULT_USER',
      name: 'Bypass User',
      companyname: req.query.company || 'TEST_COMPANY'
    };
    
    _debugENDPOINT && console.log(`🔓 Using: User ID=${userId}, Company=${company}`);
    return next();
  }
  // ========== END BYPASS ==========
  
  // Get token from header
  let token = req.header('x-auth-token');
  
  if (!token) {
    _debugENDPOINT && console.log('🔐 AUTH: No token provided');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));
    req.user = decoded.user;
    _debugENDPOINT && console.log(`🔐 AUTH: Token valid for user ${decoded.user.id}`);
    next();
  } catch (err) {
    _debugENDPOINT && console.log(`🔐 AUTH: Token verification failed: ${err.message}`);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};