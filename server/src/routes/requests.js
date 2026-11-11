const express = require('express');
const { Interest } = require('../models');
const { presentUser, presentListing } = require('../lib/present');
const { vibeMatch } = require('../lib/compat');
const { createMatch } = require('../lib/matching');
const { emitToUser } = require('../socket');

const router = express.Router();

// People who liked one of your listings (or asked to book your BnB).
router.get('/', async (req, res) => {
  const items = await Interest.find({ owner: req.user._id, action: 'like' }).sort({ createdAt: -1 }).limit(200).populate('user').populate('listing');
  res.json({
    requests: items
      .filter((i) => i.user && i.listing && !req.user.blocked.some((b) => b.equals(i.user._id)))
      .map((i) => ({
        id: String(i._id),
        status: i.status,
        note: i.note || '',
        checkIn: i.checkIn || null,
        checkOut: i.checkOut || null,
        guests: i.guests || null,
        createdAt: i.createdAt,
        user: presentUser(i.user, { vibe: vibeMatch(req.user, i.user).score }),
        listing: presentListing(i.listing),
      })),
  });
});

router.post('/:id/respond', async (req, res) => {
  const i = await Interest.findOne({ _id: req.params.id, owner: req.user._id, action: 'like' }).populate('listing').catch(() => null);
  if (!i || !i.listing) return res.status(404).json({ error: 'Request not found' });
  i.status = req.body.accept ? 'accepted' : 'declined';
  await i.save();
  emitToUser(i.user, 'request-update', { listingId: String(i.listing._id), status: i.status });
  if (!req.body.accept) return res.json({ status: i.status });

  const text = i.listing.type === 'bnb' ? `Your stay at ${i.listing.title} is confirmed 🎉` : `Hi! I accepted your request for ${i.listing.title}. Let’s chat.`;
  const match = await createMatch(req.user._id, i.user, { kind: 'listing', listing: i.listing._id, opener: { from: req.user._id, text } });
  res.json({ status: i.status, matchId: match ? String(match._id) : undefined });
});

module.exports = router;
