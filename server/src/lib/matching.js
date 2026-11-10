const { Match, Message, User, Listing } = require('../models');
const { emitToUser } = require('../socket');
const { presentUser, presentListing } = require('./present');

// Opens (or reuses) a chat between two members and tells both of them.
async function createMatch(a, b, { kind = 'roomie', listing = null, opener = null } = {}) {
  let match = await Match.findOne({ users: { $all: [a, b] }, kind, listing: listing || null });
  const isNew = !match;
  if (!match) match = await Match.create({ users: [a, b], kind, listing: listing || undefined });
  else if (!match.active) {
    match.active = true;
    await match.save();
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
