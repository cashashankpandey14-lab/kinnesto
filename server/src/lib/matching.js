const { Match, Message, User, Listing } = require('../models');
const { emitToUser } = require('../socket');
const { presentUser, presentListing } = require('./present');

// One chat per pair (per listing for place chats), enforced by a unique key so double-taps can't duplicate it.
const matchKey = (a, b, kind, listing) => [kind, listing ? String(listing) : '-', ...[String(a), String(b)].sort()].join(':');

// Opens (or reuses) a chat between two members and tells both of them.
// A chat someone closed, or one between members who blocked each other, is never reopened: returns null.
async function createMatch(a, b, { kind = 'roomie', listing = null, opener = null } = {}) {
  const [ua0, ub0] = await Promise.all([User.findById(a).select('blocked banned'), User.findById(b).select('blocked banned')]);
  if (!ua0 || !ub0 || ua0.banned || ub0.banned || ua0.blocked.some((x) => x.equals(b)) || ub0.blocked.some((x) => x.equals(a))) return null;
  const key = matchKey(a, b, kind, listing);
  let match = await Match.findOne({ $or: [{ key }, { users: { $all: [a, b] }, kind, listing: listing || null }] });
  if (match && !match.active) return null;
  const isNew = !match;
  if (!match) {
    try {
      match = await Match.create({ users: [a, b], kind, listing: listing || undefined, key });
    } catch (e) {
      if (e.code !== 11000) throw e;
      match = await Match.findOne({ key });
      if (!match?.active) return null;
    }
  }

  if (opener) {
    await Message.create({ match: match._id, from: opener.from, text: opener.text });
    match.lastMessage = opener.text;
    match.lastMessageAt = new Date();
    await match.save();
  }

  if (isNew) {
    const [ua, ub, l] = await Promise.all([User.findById(a), User.findById(b), listing ? Listing.findById(listing) : null]);
    const listingInfo = l ? presentListing(l) : null;
    emitToUser(a, 'match', { matchId: String(match._id), kind, user: presentUser(ub), listing: listingInfo });
    emitToUser(b, 'match', { matchId: String(match._id), kind, user: presentUser(ua), listing: listingInfo });
  }
  return match;
}

module.exports = { createMatch };
