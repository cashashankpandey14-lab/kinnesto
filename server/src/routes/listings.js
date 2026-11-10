const express = require('express');
const O = require('../options');
const { Listing, Interest, User } = require('../models');
const { listingFit } = require('../lib/compat');
const { presentListing } = require('../lib/present');
const { photoUpload, savePhoto } = require('../lib/upload');
const { createMatch } = require('../lib/matching');
const { emitToUser } = require('../socket');
const { config } = require('../config');

const router = express.Router();
const MAX_PHOTOS = 10;
const OWNER_FIELDS = 'name photos occupation lastActive lifestyle budgetMin budgetMax intent interests moveIn onboarded gender';

function buildFilter(q, user) {
  const filter = { active: true };
  const types = String(q.type || '').split(',').filter((t) => O.LISTING_TYPES[t]);
  if (types.length) filter.type = { $in: types };
  filter.city = O.CITIES.includes(q.city) ? q.city : user.city || O.LAUNCH_CITIES[0];
  if (q.maxPrice) filter.price = { ...filter.price, $lte: Number(q.maxPrice) };
  if (q.minPrice) filter.price = { ...filter.price, $gte: Number(q.minPrice) };
  if (O.ROOM_TYPES[q.roomType]) filter.roomType = q.roomType;
  // Don't show women-only places to men and vice versa unless they ask for everything.
  const gender = q.gender || user.gender;
  if (gender === 'male' || gender === 'female') filter.genderPref = { $in: ['any', gender] };
  else if (gender === 'nonbinary') filter.genderPref = 'any';
  if (q.amenities) filter.amenities = { $all: String(q.amenities).split(',').filter((a) => O.AMENITIES[a]) };
  if (q.locality) filter.locality = new RegExp(String(q.locality).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return filter;
}

function withFit(user, listings) {
  return listings.map((l) => {
    const fit = listingFit(user, l, l.owner);
    return presentListing(l, { fit: fit.score, reasons: fit.reasons });
  });
}

// Browse: a filterable grid of places.
router.get('/', async (req, res) => {
  const filter = buildFilter(req.query, req.user);
  const listings = await Listing.find(filter).populate('owner', OWNER_FIELDS).sort({ createdAt: -1 }).limit(100);
  let out = withFit(req.user, listings.filter((l) => l.owner && !req.user.blocked.some((b) => b.equals(l.owner._id))));
  const sort = req.query.sort;
  if (sort === 'price') out.sort((a, b) => a.price - b.price);
  else if (sort === 'newest') out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else out.sort((a, b) => b.fit - a.fit);
  const liked = new Set((await Interest.find({ user: req.user._id, action: 'like' }).distinct('listing')).map(String));
  out = out.map((l) => ({ ...l, saved: liked.has(l.id) }));
  res.json({ city: filter.city, listings: out });
});

// Swipe mode for places: same filters, minus anything already swiped or your own.
router.get('/deck', async (req, res) => {
  const filter = buildFilter(req.query, req.user);
  const seen = await Interest.find({ user: req.user._id }).distinct('listing');
  filter._id = { $nin: seen };
  filter.owner = { $nin: [req.user._id, ...req.user.blocked] };
  const listings = await Listing.find(filter).populate('owner', OWNER_FIELDS).limit(100);
  res.json({ city: filter.city, listings: withFit(req.user, listings).sort((a, b) => b.fit - a.fit).slice(0, 40) });
});

router.get('/mine', async (req, res) => {
  const listings = await Listing.find({ owner: req.user._id }).sort({ createdAt: -1 });
  const counts = await Interest.aggregate([
    { $match: { owner: req.user._id, action: 'like', status: 'pending' } },
    { $group: { _id: '$listing', n: { $sum: 1 } } },
  ]);
  const pending = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json({ listings: listings.map((l) => presentListing(l, { pendingRequests: pending.get(String(l._id)) || 0 })) });
});

router.get('/saved', async (req, res) => {
  const interests = await Interest.find({ user: req.user._id, action: 'like' })
    .sort({ createdAt: -1 })
    .populate({ path: 'listing', populate: { path: 'owner', select: OWNER_FIELDS } });
  res.json({
    saved: interests
      .filter((i) => i.listing)
      .map((i) => ({ status: i.status, checkIn: i.checkIn, checkOut: i.checkOut, listing: withFit(req.user, [i.listing])[0] })),
  });
});

router.post('/photos', photoUpload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose a JPG, PNG or WebP image' });
  res.json({ url: await savePhoto(req.file, req.user._id) });
});

router.get('/:id', async (req, res) => {
  const l = await Listing.findById(req.params.id).populate('owner', OWNER_FIELDS).catch(() => null);
  if (!l || !l.owner) return res.status(404).json({ error: 'Listing not found' });
  const mine = l.owner._id.equals(req.user._id);
  if (!l.active && !mine) return res.status(404).json({ error: 'This listing is no longer available' });
  const interest = await Interest.findOne({ user: req.user._id, listing: l._id });
  res.json({ listing: withFit(req.user, [l])[0], mine, request: interest && interest.action === 'like' ? { status: interest.status, checkIn: interest.checkIn, checkOut: interest.checkOut } : null });
});

function readListing(b, l = {}) {
  const out = {};
  const s = (v, max) => String(v ?? '').trim().slice(0, max);
  if (b.type !== undefined) out.type = b.type;
  if (b.title !== undefined) out.title = s(b.title, 80);
  if (b.description !== undefined) out.description = s(b.description, 2000);
  if (b.city !== undefined) out.city = b.city;
  if (b.locality !== undefined) out.locality = s(b.locality, 60);
  for (const k of ['price', 'deposit', 'bedrooms', 'bathrooms', 'currentFlatmates', 'maxGuests', 'minNights']) {
    if (b[k] !== undefined && b[k] !== '' && b[k] !== null) out[k] = Number(b[k]);
  }
  for (const k of ['roomType', 'furnishing', 'genderPref']) if (b[k] !== undefined) out[k] = b[k];
  if (Array.isArray(b.amenities)) out.amenities = b.amenities.filter((a) => O.AMENITIES[a]);
  if (Array.isArray(b.photos)) out.photos = b.photos.filter((p) => typeof p === 'string' && /^https?:\/\//.test(p)).slice(0, MAX_PHOTOS);
  if (b.availableFrom !== undefined) out.availableFrom = b.availableFrom ? new Date(b.availableFrom) : null;
  if (b.active !== undefined) out.active = Boolean(b.active);
  const type = out.type || l.type;
  if (type === 'bnb') {
    out.minNights = out.minNights || l.minNights || 1;
    out.maxGuests = out.maxGuests || l.maxGuests || 2;
  }
  return out;
}

router.post('/', async (req, res) => {
  const data = readListing(req.body);
  if (!O.LAUNCH_CITIES.includes(data.city)) return res.status(400).json({ error: `You can list places in ${O.LAUNCH_CITIES.join(', ')} for now. More cities soon!` });
  if (!data.photos?.length) return res.status(400).json({ error: 'Add at least one photo' });
  try {
    const l = await Listing.create({ ...data, owner: req.user._id });
    res.status(201).json({ listing: presentListing(l) });
  } catch (e) {
    if (e.name === 'ValidationError') return res.status(400).json({ error: `Check ${Object.keys(e.errors).join(', ')}` });
    throw e;
  }
});

router.patch('/:id', async (req, res) => {
  const l = await Listing.findOne({ _id: req.params.id, owner: req.user._id }).catch(() => null);
  if (!l) return res.status(404).json({ error: 'Listing not found' });
  Object.assign(l, readListing(req.body, l));
  try {
    await l.save();
  } catch (e) {
    if (e.name === 'ValidationError') return res.status(400).json({ error: `Check ${Object.keys(e.errors).join(', ')}` });
    throw e;
  }
  res.json({ listing: presentListing(l) });
});

router.delete('/:id', async (req, res) => {
  const l = await Listing.findOneAndDelete({ _id: req.params.id, owner: req.user._id }).catch(() => null);
  if (!l) return res.status(404).json({ error: 'Listing not found' });
  await Interest.deleteMany({ listing: l._id });
  res.json({ ok: true });
});

// Swipe on a place. A like is a request to the host; for a BnB it's a booking request with dates.
router.post('/:id/swipe', async (req, res) => {
  const l = await Listing.findOne({ _id: req.params.id, active: true }).catch(() => null);
  if (!l) return res.status(404).json({ error: 'Listing not found' });
  if (l.owner.equals(req.user._id)) return res.status(400).json({ error: 'That’s your own listing' });
  const action = req.body.action === 'like' ? 'like' : 'pass';

  const update = { action, owner: l.owner, note: String(req.body.note || '').slice(0, 300) };
  if (action === 'like' && l.type === 'bnb') {
    const checkIn = new Date(req.body.checkIn);
    const checkOut = new Date(req.body.checkOut);
    if (req.body.checkIn || req.body.checkOut) {
      if (Number.isNaN(+checkIn) || Number.isNaN(+checkOut) || checkOut <= checkIn) return res.status(400).json({ error: 'Pick a check-out after check-in' });
      const nights = Math.round((checkOut - checkIn) / 86400000);
      if (nights < (l.minNights || 1)) return res.status(400).json({ error: `Minimum stay is ${l.minNights} nights` });
      Object.assign(update, { checkIn, checkOut, guests: Math.min(Number(req.body.guests) || 1, l.maxGuests || 30) });
    }
  }

  const existing = await Interest.findOne({ user: req.user._id, listing: l._id });
  if (existing?.status === 'accepted' && action === 'like') return res.json({ request: { status: 'accepted' } });
  const interest = await Interest.findOneAndUpdate({ user: req.user._id, listing: l._id }, { ...update, status: 'pending' }, { upsert: true, new: true });
  if (action !== 'like') return res.json({ request: null });

  emitToUser(l.owner, 'request', { listingId: String(l._id), from: req.user.name });

  // Demo hosts accept straight away and say hello.
  const owner = await User.findById(l.owner);
  if (config.demoAutoReply && owner?.isDemo) {
    interest.status = 'accepted';
    await interest.save();
    const hello = l.type === 'bnb' ? `Hi ${req.user.name}! Your stay is confirmed 🎉 Let me know your arrival time.` : `Hey ${req.user.name}! Thanks for your interest in ${l.title}. When would you like to come see it?`;
    const match = await createMatch(l.owner, req.user._id, { kind: 'listing', listing: l._id, opener: { from: l.owner, text: hello } });
    return res.json({ request: { status: 'accepted', matchId: String(match._id) } });
  }
  res.json({ request: { status: 'pending' } });
});

module.exports = router;
