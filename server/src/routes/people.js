const express = require('express');
const O = require('../options');
const { User, Swipe, Listing } = require('../models');
const { vibeMatch } = require('../lib/compat');
const { presentUser, presentListing } = require('../lib/present');
const { createMatch } = require('../lib/matching');
const { config } = require('../config');

const router = express.Router();

// The Roomies deck: people in your city who'd live with someone like you, best vibe first.
router.get('/deck', async (req, res) => {
  const me = req.user;
  const city = O.CITIES.includes(req.query.city) ? req.query.city : me.city;
  const swiped = await Swipe.find({ from: me._id }).distinct('to');

  const filter = {
    _id: { $nin: [me._id, ...swiped, ...me.blocked] },
    blocked: { $ne: me._id },
    onboarded: true,
    banned: { $ne: true },
    city,
    flatmateGender: { $in: ['any', me.gender].filter(Boolean) },
  };
  if (me.flatmateGender !== 'any') filter.gender = me.flatmateGender;
  if (O.INTENTS[req.query.intent]) filter.intent = req.query.intent;

  const people = await User.find(filter).limit(200);
  const likedMe = new Set((await Swipe.find({ to: me._id, action: 'like' }).distinct('from')).map(String));
  const listings = await Listing.find({ owner: { $in: people.map((p) => p._id) }, active: true, type: { $in: ['flat', 'coliving'] } });
  const placeOf = new Map(listings.map((l) => [String(l.owner), l]));

  const deck = people
    .map((p) => {
      const vibe = vibeMatch(me, p);
      const place = placeOf.get(String(p._id));
      return presentUser(p, { vibe: vibe.score, reasons: vibe.reasons, likedYou: likedMe.has(String(p._id)), place: place ? presentListing(place) : null });
    })
    .sort((a, b) => b.vibe - a.vibe + (b.recentlyActive - a.recentlyActive) * 5)
    .slice(0, 40);

  res.json({ city, people: deck });
});

router.get('/:id', async (req, res) => {
  const p = await User.findOne({ _id: req.params.id, onboarded: true, banned: { $ne: true } }).catch(() => null);
  if (!p || p.blocked.some((b) => b.equals(req.user._id)) || req.user.blocked.some((b) => b.equals(p._id))) return res.status(404).json({ error: 'Profile not found' });
  const vibe = vibeMatch(req.user, p);
  const listings = await Listing.find({ owner: p._id, active: true });
  res.json({ person: presentUser(p, { vibe: vibe.score, reasons: vibe.reasons }), listings: listings.map((l) => presentListing(l)) });
});

router.post('/:id/swipe', async (req, res) => {
  const action = req.body.action === 'like' ? 'like' : 'pass';
  const target = await User.findById(req.params.id).catch(() => null);
  const blocked = target && (target.blocked.some((b) => b.equals(req.user._id)) || req.user.blocked.some((b) => b.equals(target._id)));
  if (!target || target.banned || blocked || !target.onboarded || target._id.equals(req.user._id)) return res.status(404).json({ error: 'Profile not found' });

  await Swipe.updateOne({ from: req.user._id, to: target._id }, { action }, { upsert: true });
  if (action !== 'like') return res.json({ match: null });

  let theyLiked = await Swipe.exists({ from: target._id, to: req.user._id, action: 'like' });
  // Demo members say yes to most people so a fresh install has matches to try.
  if (!theyLiked && config.demoAutoReply && target.isDemo && Math.random() < 0.7) {
    await Swipe.updateOne({ from: target._id, to: req.user._id }, { action: 'like' }, { upsert: true });
    theyLiked = true;
  }
  if (!theyLiked) return res.json({ match: null });

  const match = await createMatch(req.user._id, target._id, { kind: 'roomie' });
  if (!match) return res.json({ match: null });
  res.json({ match: { id: String(match._id), user: presentUser(target), vibe: vibeMatch(req.user, target).score } });
});

router.post('/:id/block', async (req, res) => {
  const { Report, Match } = require('../models');
  const target = await User.findById(req.params.id).catch(() => null);
  if (!target) return res.status(404).json({ error: 'Profile not found' });
  if (!req.user.blocked.some((b) => b.equals(target._id))) req.user.blocked.push(target._id);
  await req.user.save();
  await Match.updateMany({ users: { $all: [req.user._id, target._id] } }, { active: false });
  await Swipe.deleteMany({ $or: [{ from: req.user._id, to: target._id }, { from: target._id, to: req.user._id }] });
  if (req.body.reason) await Report.create({ from: req.user._id, user: target._id, reason: String(req.body.reason).slice(0, 100), details: String(req.body.details || '').slice(0, 1000) });
  res.json({ ok: true });
});

module.exports = router;
