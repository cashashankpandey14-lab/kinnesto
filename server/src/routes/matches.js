const express = require('express');
const { Match, Message, User, Listing, Swipe } = require('../models');
const { presentUser, presentListing } = require('../lib/present');
const { emitToUser } = require('../socket');
const { config } = require('../config');

const router = express.Router();

const ICEBREAKERS = [
  'What does a perfect Sunday at home look like for you?',
  'Split groceries or everyone for themselves?',
  'How do you feel about friends staying over on weekends?',
  'AC at 18° or 24°? This decides everything 😄',
  'Which area are you hoping to live in?',
];

async function loadMatch(req, res) {
  const m = await Match.findOne({ _id: req.params.id, users: req.user._id, active: true }).catch(() => null);
  if (!m) {
    res.status(404).json({ error: 'Chat not found' });
    return null;
  }
  return m;
}

router.get('/', async (req, res) => {
  const matches = await Match.find({ users: req.user._id, active: true }).sort({ lastMessageAt: -1, createdAt: -1 });
  const otherIds = matches.map((m) => m.users.find((u) => !u.equals(req.user._id)));
  const [users, listings, unread] = await Promise.all([
    User.find({ _id: { $in: otherIds } }),
    Listing.find({ _id: { $in: matches.map((m) => m.listing).filter(Boolean) } }),
    Message.aggregate([
      { $match: { match: { $in: matches.map((m) => m._id) }, from: { $ne: req.user._id }, readAt: null } },
      { $group: { _id: '$match', n: { $sum: 1 } } },
    ]),
  ]);
  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const listingMap = new Map(listings.map((l) => [String(l._id), l]));
  const unreadMap = new Map(unread.map((u) => [String(u._id), u.n]));
  res.json({
    matches: matches
      .map((m, i) => {
        const u = userMap.get(String(otherIds[i]));
        if (!u || req.user.blocked.some((b) => b.equals(u._id))) return null;
        const l = m.listing && listingMap.get(String(m.listing));
        return {
          id: String(m._id),
          kind: m.kind,
          user: presentUser(u),
          listing: l ? presentListing(l) : null,
          lastMessage: m.lastMessage || null,
          lastMessageAt: m.lastMessageAt || null,
          unread: unreadMap.get(String(m._id)) || 0,
          createdAt: m.createdAt,
        };
      })
      .filter(Boolean),
  });
});

router.get('/:id/messages', async (req, res) => {
  const m = await loadMatch(req, res);
  if (!m) return;
  const otherId = m.users.find((u) => !u.equals(req.user._id));
  const [other, listing, messages] = await Promise.all([
    User.findById(otherId),
    m.listing ? Listing.findById(m.listing) : null,
    Message.find({ match: m._id }).sort({ createdAt: -1 }).limit(500).then((list) => list.reverse()),
  ]);
  const unread = await Message.updateMany({ match: m._id, from: otherId, readAt: null }, { readAt: new Date() });
  if (unread.modifiedCount) emitToUser(otherId, 'read', { matchId: String(m._id) });
  res.json({
    match: { id: String(m._id), kind: m.kind, user: other ? presentUser(other) : null, listing: listing ? presentListing(listing) : null },
    messages: messages.map((x) => ({ id: String(x._id), from: String(x.from), text: x.text, createdAt: x.createdAt, readAt: x.readAt || null })),
    icebreakers: messages.length ? [] : ICEBREAKERS,
  });
});

router.post('/:id/messages', async (req, res) => {
  const m = await loadMatch(req, res);
  if (!m) return;
  const text = String(req.body.text || '').trim().slice(0, 2000);
  if (!text) return res.status(400).json({ error: 'Message is empty' });
  const msg = await Message.create({ match: m._id, from: req.user._id, text });
  m.lastMessage = text;
  m.lastMessageAt = msg.createdAt;
  await m.save();
  const payload = { matchId: String(m._id), message: { id: String(msg._id), from: String(req.user._id), text, createdAt: msg.createdAt, readAt: null } };
  for (const u of m.users) emitToUser(u, 'message', payload);
  res.status(201).json(payload);
  demoReply(m, req.user);
});

const DEMO_REPLIES = [
  'Haha good question! I’m easy-going, happy to split groceries and cook together on weekends.',
  'Sounds great 😊 Want to catch up over coffee this weekend and talk it through?',
  'Totally agree. When are you free to see the place?',
];

// Demo members answer the first couple of messages so a fresh install feels alive.
async function demoReply(m, sender) {
  if (!config.demoAutoReply) return;
  const otherId = m.users.find((u) => !u.equals(sender._id));
  const other = await User.findById(otherId);
  if (!other?.isDemo) return;
  const theirs = await Message.countDocuments({ match: m._id, from: otherId });
  if (theirs >= DEMO_REPLIES.length) return;
  setTimeout(async () => {
    const msg = await Message.create({ match: m._id, from: otherId, text: DEMO_REPLIES[theirs] });
    await Match.updateOne({ _id: m._id }, { lastMessage: msg.text, lastMessageAt: msg.createdAt });
    const payload = { matchId: String(m._id), message: { id: String(msg._id), from: String(otherId), text: msg.text, createdAt: msg.createdAt, readAt: null } };
    for (const u of m.users) emitToUser(u, 'message', payload);
  }, 1500);
}

router.delete('/:id', async (req, res) => {
  const m = await loadMatch(req, res);
  if (!m) return;
  m.active = false;
  await m.save();
  // Closing a chat also clears the likes behind it, so it can't quietly re-match.
  const [a, b] = m.users;
  await Swipe.deleteMany({ $or: [{ from: a, to: b }, { from: b, to: a }] });
  for (const u of m.users) emitToUser(u, 'unmatch', { matchId: String(m._id) });
  res.json({ ok: true });
});

module.exports = router;
