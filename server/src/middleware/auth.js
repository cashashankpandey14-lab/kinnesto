const jwt = require('jsonwebtoken');
const { config } = require('../config');
const { User } = require('../models');

// Admin needs an allow-listed email *and* proof of owning it: a Google sign-in (Google verifies the address).
// Seeded demo admins count only in the local demo mode.
const isAdmin = (user) => !!user && config.adminEmails.includes(user.email) && (!!user.googleId || (user.isDemo && config.demoAutoReply));

function requireAdmin(req, res, next) {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Admins only' });
  return next();
}

function signToken(user) {
  return jwt.sign({ sub: String(user._id) }, config.jwtSecret, { expiresIn: '30d' });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret).sub;
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not signed in' });
  try {
    const user = await User.findById(verifyToken(token));
    if (!user) return res.status(401).json({ error: 'Account not found' });
    if (user.banned) return res.status(403).json({ error: 'This account has been suspended. Contact hello@kinnesto.com if you think this is a mistake.', code: 'BANNED' });
    req.user = user;
    User.updateOne({ _id: user._id }, { lastActive: new Date() }).catch(() => {});
    return next();
  } catch {
    return res.status(401).json({ error: 'Session expired, please sign in again' });
  }
}

// Browsing places is open to everyone signed in; swiping on people needs a finished profile.
function requireOnboarded(req, res, next) {
  if (!req.user.onboarded) return res.status(403).json({ error: 'Finish your profile first', code: 'NOT_ONBOARDED' });
  return next();
}

module.exports = { signToken, verifyToken, requireAuth, requireOnboarded, requireAdmin, isAdmin };
