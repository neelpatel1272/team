const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { fail } = require('../utils/apiResponse');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) return fail(res, 'Not authenticated. Please log in.', 401);

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) return fail(res, 'User no longer exists or is inactive.', 401);

    req.user = user;
    next();
  } catch (err) {
    return fail(res, 'Invalid or expired session. Please log in again.', 401);
  }
}

// Verifies a token for socket handshake auth (returns user or throws).
async function authenticateSocketToken(token) {
  const decoded = verifyToken(token);
  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) throw new Error('Invalid session');
  return user;
}

module.exports = { protect, authenticateSocketToken };