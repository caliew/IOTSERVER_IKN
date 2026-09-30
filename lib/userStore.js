const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const usersFilePath = path.join(__dirname, '../.data/fileStores/users.json');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Read all users from .data/settings/users.json
 */
function getUsers() {
  try {
    if (!fs.existsSync(usersFilePath)) return [];
    const content = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('[USERSTORE] Error reading users.json:', err.message);
    return [];
  }
}

/**
 * Save users list to .data/settings/users.json
 */
function saveUsers(users) {
  try {
    ensureDir(path.dirname(usersFilePath));
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[USERSTORE] Error writing users.json:', err.message);
    return false;
  }
}

/**
 * Find user by username, email, name, or id in .data/settings/users.json
 */
function findUser(identifier) {
  if (!identifier) return null;
  const users = getUsers();
  const searchStr = String(identifier).trim().toUpperCase();

  return users.find(u => 
    (u.username && String(u.username).toUpperCase() === searchStr) ||
    (u.email && String(u.email).toUpperCase() === searchStr) ||
    (u.name && String(u.name).toUpperCase() === searchStr) ||
    (u.id && String(u.id).toUpperCase() === searchStr)
  ) || null;
}

/**
 * Add or update a user entry in .data/settings/users.json
 */
async function saveOrUpdateUser(userData) {
  const users = getUsers();
  const identifier = userData.username || userData.email || userData.name || '';
  const searchStr = String(identifier).trim().toUpperCase();

  const idx = users.findIndex(u => 
    (u.username && String(u.username).toUpperCase() === searchStr) ||
    (u.email && String(u.email).toUpperCase() === searchStr) ||
    (u.name && String(u.name).toUpperCase() === searchStr) ||
    (userData.id && u.id && String(u.id) === String(userData.id))
  );

  let hashedPassword = userData.password;
  if (userData.password && !userData.password.startsWith('$2a$') && !userData.password.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(userData.password, salt);
  }

  let derivedRole = userData.role;
  if (!derivedRole) {
    if (searchStr.includes('VERIFIER')) {
      derivedRole = 'VERIFIER';
    } else if (searchStr.includes('ADMIN')) {
      derivedRole = 'ADMIN';
    } else {
      derivedRole = 'CHECKER';
    }
  }
  derivedRole = derivedRole.toUpperCase();

  const userId = userData.id || (idx !== -1 ? users[idx].id : `usr_${Math.floor(100 + Math.random() * 900)}`);
  const finalUsername = userData.username || userData.name || identifier || 'user';

  const record = {
    id: userId,
    name: userData.name || finalUsername,
    username: finalUsername,
    email: (userData.email || `${finalUsername}@${(userData.site || 'IKNHOSPITAL').toUpperCase()}.COM`).toUpperCase(),
    password: hashedPassword || (idx !== -1 ? users[idx].password : ''),
    status: userData.status !== undefined ? Boolean(userData.status) : true,
    usertype: (userData.usertype || derivedRole).toLowerCase(),
    role: derivedRole,
    companyname: userData.companyname || userData.site || 'IKNHOSPITAL',
    phone: userData.phone || 0
  };

  if (idx !== -1) {
    users[idx] = { ...users[idx], ...record };
  } else {
    users.push(record);
  }

  saveUsers(users);
  return record;
}

module.exports = {
  getUsers,
  saveUsers,
  findUser,
  saveOrUpdateUser
};
