const jwt = require('jsonwebtoken');
const config = require('config');

// Generate a test token
function generateTestToken(
  userId = 'DEFAULT_USER',
  role = ['ADMIN', 'CHECKER', 'VERIFIER'],
  username = 'admin',
  site = 'IKNHOSPITAL',
  companyname = 'TEST_COMPANY'
) {
  const payload = {
    user: { 
      id: String(userId),
      username: username,
      name: 'Test User',
      role: Array.isArray(role) ? role : [role],
      companyname: companyname,
      site: site
    }
  };

  const secret = config.has('jwtSecret') ? config.get('jwtSecret') : 'secret';

  const token = jwt.sign(
    payload,
    secret,
    {
      expiresIn: '365d',  // 1 year expiration
      algorithm: 'HS256'
    }
  );

  return token;
}

// Parse optional CLI arguments: node generateToken.js <userId> <role> <username> <site>
const args = process.argv.slice(2);
const cliUserId = args[0] || 'USER_123';
const cliRole = args[1] ? args[1].split(',') : ['ADMIN', 'CHECKER', 'VERIFIER'];
const cliUsername = args[2] || 'admin';
const cliSite = args[3] || 'IKNHOSPITAL';

const testToken = generateTestToken(cliUserId, cliRole, cliUsername, cliSite);
const secret = config.has('jwtSecret') ? config.get('jwtSecret') : 'secret';

console.log('==================================================');
console.log('Generated JWT Token (FE & Middleware Compatible):');
console.log('==================================================');
console.log('JWT SECRET =', secret);
console.log('TOKEN      =', testToken);
console.log('==================================================\n');

// Verify the token
try {
  const decoded = jwt.verify(testToken, secret);
  console.log('Token decoded successfully:');
  console.log('User ID  :', decoded.user.id);
  console.log('Username :', decoded.user.username);
  console.log('Roles    :', decoded.user.role);
  console.log('Site     :', decoded.user.site);
  console.log('Expires  :', new Date(decoded.exp * 1000).toISOString());
} catch (err) {
  console.error('Token verification failed:', err.message);
}

module.exports = { generateTestToken };