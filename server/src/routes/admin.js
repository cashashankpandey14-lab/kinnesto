const express = require('express');
const { User, Listing, Interest, Match, Message, Report, Notification } = require('../models');
const { presentListing, presentMe } = require('../lib/present');
const { applyProfile, missingFields } = require('../lib/profile');
const { deleteUserData } = require('../lib/accounts');
const { disconnectUser, emitToAll } = require('../socket');
const { present: presentNotification } = require('./notifications');
const { deletePhoto } = require('../lib/upload');

const router = express.Router();
const DAY = 86400000;
const rx = (q) => new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
const page = (req) => Math.max(0, Number(req.query.page) || 0);
const PER = 50;

const userRow = (u) => ({
  id: String(u._id),
  email: u.email,
  name: u.name || '',
  photo: u.photos?.[0] || null,
  city: u.city || null,
  intent: u.intent || null,
  onboarded: u.onboarded,
  banned: !!u.banned,
  provider: u.googleId ? 'google' : u.facebookId ? 'facebook' : 'email',
  isDemo: !!u.isDemo,
  createdAt: u.createdAt,
  lastActive: u.lastActive,
});

router.get('/stats', async (req, res) => {
  const now = Date.now();
  const week = new Date(now - 7 * DAY);
  const since = new Date(now - 13 * DAY);
  since.setHours(0, 0, 0, 0);
  const [users, onboarded, newUsers, activeUsers, banned, listings, activeListings, byType, matches, roomieMatches, messages, pending, accepted, openReports, signups] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ onboarded: true }),
    User.countDocuments({ createdAt: { $gte: week } }),
    User.countDocuments({ lastActive: { $gte: week } }),
    User.countDocuments({ banned: true }),
    Listing.countDocuments(),
    Listing.countDocuments({ active: true }),
    Listing.aggregate([{ $group: { _id: '$type', n: { $sum: 1 } } }]),
    Match.countDocuments(),
    Match.countDocuments({ kind: 'roomie' }),
    Message.countDocuments(),
    Interest.countDocuments({ action: 'like', status: 'pending' }),
    Interest.countDocuments({ action: 'like', status: 'accepted' }),
    Report.countDocuments({ status: { $ne: 'resolved' } }),
    User.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, n: { $sum: 1 } } }]),
  ]);
  const perDay = new Map(signups.map((s) => [s._id, s.n]));
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since.getTime() + i * DAY).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return { day: d, signups: perDay.get(d) || 0 };
  });
  res.json({
    users: { total: users, onboarded, newThisWeek: newUsers, activeThisWeek: activeUsers, banned },
    listings: { total: listings, active: activeListings, byType: Object.fromEntries(byType.map((t) => [t._id, t.n])) },
    matches: { total: matches, roomie: roomieMatches, listing: matches - roomieMatches },
    messages,
    requests: { pending, accepted },
    openReports,
    signupsByDay: days,
  });
});

router.get('/users', async (req, res) => {
  const filter = {};
  if (req.query.q) filter.$or = [{ email: rx(req.query.q) }, { name: rx(req.query.q) }];
  if (req.query.status === 'banned') filter.banned = true;
  if (req.query.status === 'incomplete') filter.onboarded = false;
  const [items, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(page(req) * PER).limit(PER), User.countDocuments(filter)]);
  res.json({ users: items.map(userRow), total });
});

router.post('/users/:id/ban', async (req, res) => {
  const u = await User.findById(req.params.id).catch(() => null);
  if (!u) return res.status(404).json({ error: 'User not found' });
  if (u._id.equals(req.user._id)) return res.status(400).json({ error: 'You can’t ban yourself' });
  u.banned = Boolean(req.body.banned);
  await u.save();
  // A banned member's listings disappear from search; unbanning doesn't relist them automatically.
  if (u.banned) {
    await Promise.all([Listing.updateMany({ owner: u._id }, { active: false, adminHidden: true }), Match.updateMany({ users: u._id }, { active: false })]);
    disconnectUser(u._id);
  } else {
    await Listing.updateMany({ owner: u._id }, { adminHidden: false });
  }
  res.json({ user: userRow(u) });
});

// The full profile behind a member row, so the admin screen can edit every field.
router.get('/users/:id', async (req, res) => {
  const u = await User.findById(req.params.id).catch(() => null);
  if (!u) return res.status(404).json({ error: 'User not found' });
  res.json({ user: presentMe(u), missing: missingFields(u) });
});

// Fill in or correct anyone's profile. Unlike a member editing themselves, an admin can mark a
// profile complete while details are still missing, so support can unblock someone by hand.
router.patch('/users/:id', async (req, res) => {
  const u = await User.findById(req.params.id).catch(() => null);
  if (!u) return res.status(404).json({ error: 'User not found' });
  const error = applyProfile(u, req.body, { asAdmin: true });
  if (error) return res.status(400).json({ error });
  await u.save();
  res.json({ user: presentMe(u), missing: missingFields(u) });
});

router.delete('/users/:id', async (req, res) => {
  const u = await User.findById(req.params.id).catch(() => null);
  if (!u) return res.status(404).json({ error: 'User not found' });
  if (u._id.equals(req.user._id)) return res.status(400).json({ error: 'Delete your own account from the Me tab' });
  await deleteUserData(u._id);
  res.json({ ok: true });
});

router.get('/listings', async (req, res) => {
  const filter = {};
  if (req.query.q) filter.$or = [{ title: rx(req.query.q) }, { locality: rx(req.query.q) }];
  if (req.query.status === 'active') filter.active = true;
  if (req.query.status === 'paused') filter.active = false;
  const [items, total] = await Promise.all([
    Listing.find(filter).sort({ createdAt: -1 }).skip(page(req) * PER).limit(PER).populate('owner', 'name email photos lastActive occupation'),
    Listing.countDocuments(filter),
  ]);
  res.json({ listings: items.map((l) => presentListing(l, { ownerEmail: l.owner?.email || null })), total });
});

router.patch('/listings/:id', async (req, res) => {
  const show = Boolean(req.body.active);
  const l = await Listing.findByIdAndUpdate(req.params.id, { active: show, adminHidden: !show }, { new: true }).catch(() => null);
  if (!l) return res.status(404).json({ error: 'Listing not found' });
  res.json({ listing: presentListing(l) });
});

router.delete('/listings/:id', async (req, res) => {
  const l = await Listing.findByIdAndDelete(req.params.id).catch(() => null);
  if (!l) return res.status(404).json({ error: 'Listing not found' });
  await Interest.deleteMany({ listing: l._id });
  l.photos.forEach((p) => deletePhoto(p).catch(() => {}));
  res.json({ ok: true });
});

router.get('/reports', async (req, res) => {
  const filter = req.query.status === 'resolved' ? { status: 'resolved' } : { status: { $ne: 'resolved' } };
  const items = await Report.find(filter).sort({ createdAt: -1 }).limit(200).populate('from', 'name email photos').populate('user', 'name email photos banned').populate('listing', 'title');
  res.json({
    reports: items.map((r) => ({
      id: String(r._id),
      reason: r.reason || '',
      details: r.details || '',
      status: r.status || 'open',
      createdAt: r.createdAt,
      from: r.from ? { id: String(r.from._id), name: r.from.name, email: r.from.email } : null,
      user: r.user ? { id: String(r.user._id), name: r.user.name, email: r.user.email, photo: r.user.photos?.[0] || null, banned: !!r.user.banned } : null,
      listing: r.listing ? { id: String(r.listing._id), title: r.listing.title } : null,
    })),
  });
});

router.post('/reports/:id/resolve', async (req, res) => {
  const r = await Report.findByIdAndUpdate(req.params.id, { status: req.body.reopen ? 'open' : 'resolved' }, { new: true }).catch(() => null);
  if (!r) return res.status(404).json({ error: 'Report not found' });
  res.json({ ok: true, status: r.status });
});

router.get('/notifications', async (req, res) => {
  const items = await Notification.find().sort({ createdAt: -1 }).limit(PER).populate('sentBy', 'name email');
  res.json({
    notifications: items.map((n) => ({ ...presentNotification(n), sentBy: n.sentBy?.name || n.sentBy?.email || null })),
    recipients: await User.countDocuments({ banned: false }),
  });
});

// Sends an announcement to every member. People who are online see it straight away; everyone
// else finds it in their notifications list next time they open the app.
router.post('/notifications', async (req, res) => {
  const title = String(req.body.title || '').trim().slice(0, 80);
  if (!title) return res.status(400).json({ error: 'Give the notification a title' });
  const n = await Notification.create({ title, body: String(req.body.body || '').trim().slice(0, 500), sentBy: req.user._id });
  emitToAll('notification', presentNotification(n));
  res.status(201).json({ notification: presentNotification(n) });
});

router.delete('/notifications/:id', async (req, res) => {
  const n = await Notification.findByIdAndDelete(req.params.id).catch(() => null);
  if (!n) return res.status(404).json({ error: 'Notification not found' });
  res.json({ ok: true });
});

module.exports = router;
