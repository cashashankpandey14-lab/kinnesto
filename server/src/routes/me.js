const express = require('express');
const O = require('../options');
const { deleteUserData } = require('../lib/accounts');
const { presentMe } = require('../lib/present');
const { photoUpload, requireImage, savePhoto, deletePhoto } = require('../lib/upload');

const router = express.Router();
const MAX_PHOTOS = 6;

const str = (v, max) => (v == null ? undefined : String(v).trim().slice(0, max));

router.get('/', (req, res) => res.json({ user: presentMe(req.user) }));

router.patch('/', async (req, res) => {
  const b = req.body;
  const u = req.user;
  const thisYear = new Date().getFullYear();

  if (b.name !== undefined) u.name = str(b.name, 40);
  if (b.birthYear !== undefined) {
    const y = Number(b.birthYear);
    if (!(y <= thisYear - 18 && y >= thisYear - 80)) return res.status(400).json({ error: 'You need to be 18 or older' });
    u.birthYear = y;
  }
  if (b.gender !== undefined && O.GENDERS[b.gender]) u.gender = b.gender;
  if (b.occupation !== undefined) u.occupation = str(b.occupation, 60);
  if (b.company !== undefined) u.company = str(b.company, 60);
  if (b.bio !== undefined) u.bio = str(b.bio, 500);
  if (b.city !== undefined) {
    if (!O.LAUNCH_CITIES.includes(b.city)) return res.status(400).json({ error: `Kinnesto is live in ${O.LAUNCH_CITIES.join(', ')} for now. More cities soon!` });
    u.city = b.city;
  }
  if (Array.isArray(b.localities)) u.localities = b.localities.map((l) => str(l, 40)).filter(Boolean).slice(0, 5);
  if (b.intent !== undefined && O.INTENTS[b.intent]) u.intent = b.intent;
  if (b.budgetMin !== undefined) u.budgetMin = Math.max(0, Number(b.budgetMin) || 0);
  if (b.budgetMax !== undefined) u.budgetMax = Math.max(0, Number(b.budgetMax) || 0);
  if (b.moveIn !== undefined) {
    const d = b.moveIn ? new Date(b.moveIn) : null;
    if (d && Number.isNaN(+d)) return res.status(400).json({ error: 'Enter the move-in date as YYYY-MM-DD, or pick one of the quick options' });
    u.moveIn = d || undefined;
  }
  if (b.flatmateGender !== undefined && O.GENDER_PREFS[b.flatmateGender]) u.flatmateGender = b.flatmateGender;
  if (b.lifestyle && typeof b.lifestyle === 'object') {
    for (const [k, v] of Object.entries(b.lifestyle)) {
      if (!O.LIFESTYLE[k]) continue;
      if (v && O.LIFESTYLE[k].options.includes(v)) u.lifestyle.set(k, v);
      else u.lifestyle.delete(k);
    }
  }
  if (Array.isArray(b.interests)) u.interests = b.interests.filter((i) => O.INTERESTS.includes(i)).slice(0, 8);
  if (u.budgetMin && u.budgetMax && u.budgetMin > u.budgetMax) [u.budgetMin, u.budgetMax] = [u.budgetMax, u.budgetMin];

  if (b.finishOnboarding) {
    const missing = [];
    if (!u.name) missing.push('name');
    if (!u.birthYear) missing.push('age');
    if (!u.gender) missing.push('gender');
    if (!u.city) missing.push('city');
    if (!u.intent) missing.push('what you’re looking for');
    if (!u.photos.length) missing.push('a photo');
    if (missing.length) return res.status(400).json({ error: `Add ${missing.join(', ')} to finish` });
    u.onboarded = true;
  }

  await u.save();
  res.json({ user: presentMe(u) });
});

router.post('/photos', photoUpload.single('photo'), requireImage, async (req, res) => {
  if (req.user.photos.length >= MAX_PHOTOS) {
    return res.status(400).json({ error: `You can add up to ${MAX_PHOTOS} photos` });
  }
  req.user.photos.push(await savePhoto(req.file, req.user._id, req.image));
  await req.user.save();
  res.json({ user: presentMe(req.user) });
});

router.delete('/photos/:index', async (req, res) => {
  const i = Number(req.params.index);
  if (!Number.isInteger(i) || i < 0) return res.status(404).json({ error: 'Photo not found' });
  const [removed] = req.user.photos.splice(i, 1);
  if (!removed) return res.status(404).json({ error: 'Photo not found' });
  await req.user.save();
  deletePhoto(removed).catch(() => {});
  res.json({ user: presentMe(req.user) });
});

// Move a photo to the front so it becomes the main one.
router.post('/photos/:index/main', async (req, res) => {
  const i = Number(req.params.index);
  if (!req.user.photos[i]) return res.status(404).json({ error: 'Photo not found' });
  const [p] = req.user.photos.splice(i, 1);
  req.user.photos.unshift(p);
  await req.user.save();
  res.json({ user: presentMe(req.user) });
});

router.delete('/', async (req, res) => {
  await deleteUserData(req.user._id);
  res.json({ ok: true });
});

module.exports = router;
