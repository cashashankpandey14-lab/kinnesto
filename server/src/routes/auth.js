const express = require('express');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models');
const { signToken } = require('../middleware/auth');
const { presentMe } = require('../lib/present');
const { config } = require('../config');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const google = new OAuth2Client();

// Which social sign-ins are switched on. The IDs are public by design (they ship in the web page).
router.get('/providers', (req, res) => {
  // *Status says why a provider is off without revealing the configured value.
  const status = (raw, ok) => (ok ? 'ok' : raw ? 'invalid' : 'missing');
  res.json({
    google: config.googleClientId || null,
    facebook: config.facebookAppId || null,
    googleStatus: status(process.env.GOOGLE_CLIENT_ID, config.googleClientId),
    facebookStatus: status(process.env.FACEBOOK_APP_ID, config.facebookAppId && config.facebookAppSecret),
  });
});

router.post('/register', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (await User.exists({ email })) return res.status(409).json({ error: 'An account with this email already exists' });
  let user;
  try {
    user = await User.create({ email, passwordHash: await bcrypt.hash(password, 10) });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'An account with this email already exists' });
    throw e;
  }
  res.status(201).json({ token: signToken(user), user: presentMe(user) });
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ email });
  if (user?.banned) return res.status(403).json({ error: 'This account has been suspended. Contact hello@kinnesto.com if you think this is a mistake.' });
  if (user && !user.passwordHash) {
    return res.status(401).json({ error: `This account uses ${user.googleId ? 'Google' : 'Facebook'} sign-in. Use that button instead.` });
  }
  if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.passwordHash))) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }
  res.json({ token: signToken(user), user: presentMe(user) });
});

// Finds the member by provider id, then by email (linking the accounts), or creates them.
async function socialSignIn(res, { provider, id, email, name, photo }) {
  const key = provider === 'google' ? 'googleId' : 'facebookId';
  let user = (await User.findOne({ [key]: id })) || (await User.findOne({ email }));
  if (user?.banned) return res.status(403).json({ error: 'This account has been suspended. Contact hello@kinnesto.com if you think this is a mistake.' });
  const created = !user;
  if (!user) user = new User({ email });
  if (!created && !user.googleId && !user.facebookId && user.passwordHash) user.passwordHash = undefined;
  user[key] = id;
  if (!user.name && name) user.name = name.split(' ')[0].slice(0, 40);
  if (!user.photos.length && photo) user.photos.push(photo);
  await user.save();
  res.status(created ? 201 : 200).json({ token: signToken(user), user: presentMe(user) });
}

// Body: { credential } — the ID token from Google Identity Services.
router.post('/google', async (req, res) => {
  if (!config.googleClientId) return res.status(503).json({ error: 'Google sign-in is not set up yet' });
  let payload;
  try {
    const ticket = await google.verifyIdToken({ idToken: String(req.body.credential || ''), audience: config.googleClientId });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Google sign-in failed, please try again' });
  }
  if (!payload?.email || !payload.email_verified) return res.status(401).json({ error: 'Your Google email is not verified' });
  await socialSignIn(res, { provider: 'google', id: payload.sub, email: payload.email.toLowerCase(), name: payload.given_name || payload.name, photo: payload.picture?.replace(/=s\d+-c$/, '=s800-c') });
});

// Body: { accessToken } — from the Facebook JS SDK. We check the token was issued to our app before trusting it.
router.post('/facebook', async (req, res) => {
  if (!config.facebookAppId || !config.facebookAppSecret) return res.status(503).json({ error: 'Facebook sign-in is not set up yet' });
  const token = String(req.body.accessToken || '');
  try {
    const appToken = `${config.facebookAppId}|${config.facebookAppSecret}`;
    const debug = await (await fetch(`https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(appToken)}`)).json();
    if (!debug.data?.is_valid || debug.data.app_id !== config.facebookAppId) throw new Error('bad token');
    const me = await (await fetch(`https://graph.facebook.com/v21.0/me?fields=id,first_name,email,picture.width(800).height(800)&access_token=${encodeURIComponent(token)}`)).json();
    if (!me.id || me.id !== debug.data.user_id) throw new Error('bad profile');
    if (!me.email) return res.status(400).json({ error: 'Your Facebook account has no email address. Sign in with Google or email instead.' });
    const photo = me.picture?.data && !me.picture.data.is_silhouette ? me.picture.data.url : null;
    await socialSignIn(res, { provider: 'facebook', id: me.id, email: me.email.toLowerCase(), name: me.first_name, photo });
  } catch {
    res.status(401).json({ error: 'Facebook sign-in failed, please try again' });
  }
});

module.exports = router;
