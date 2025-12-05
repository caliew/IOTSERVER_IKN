const jwt = require('jsonwebtoken');
const config = require('config');

// Generate a test token
function generateTestToken(userId = 'DEFAULT_USER') {
  const payload = {
    user: { 
      id: userId,
      name: 'Test User',
      companyname: 'TEST_COMPANY'
    }
  };

  const token = jwt.sign(
    payload,
    config.get('jwtSecret'),
    {
      expiresIn: '365d',  // 1 year expiration
      algorithm: 'HS256'
    }
  );

  return token;
}

// Test token generation
const testToken = generateTestToken('USER_123');
console.log('Generated JWT Token:');
console.log('====================');
console.log('JWT SECRET=',config.get('jwtSecret'));
console.log(testToken);
console.log('====================\n');

// Verify the token
try {
  const decoded = jwt.verify(testToken, config.get('jwtSecret'));
  console.log('Token decoded successfully:');
  console.log('User ID:', decoded.user.id);
  console.log('Expires:', new Date(decoded.exp * 1000).toISOString());
} catch (err) {
  console.error('Token verification failed:', err.message);
}