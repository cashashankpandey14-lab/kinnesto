const express = require('express');
const O = require('../options');
const { Report, Listing, User } = require('../models');

const router = express.Router();

// Report a listing or a member. Body: { listingId? , userId?, reason, details? }
router.post('/', async (req, res) => {
  const reason = O.REPORT_REASONS.includes(req.body.reason) ? req.body.reason : null;
  if (!reason) return res.status(400).json({ error: 'Pick a reason' });
  const listing = req.body.listingId ? await Listing.findById(req.body.listingId).catch(() => null) : null;
  const user = req.body.userId ? await User.findById(req.body.userId).catch(() => null) : listing ? await User.findById(listing.owner) : null;
  if (!listing && !user) return res.status(404).json({ error: 'Nothing to report' });
  if (user && user._id.equals(req.user._id)) return res.status(400).json({ error: 'You can’t report yourself' });
  await Report.create({ from: req.user._id, user: user?._id, listing: listing?._id, reason, details: String(req.body.details || '').slice(0, 1000) });
  res.status(201).json({ ok: true });
});

module.exports = router;
