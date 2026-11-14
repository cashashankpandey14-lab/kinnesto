const express = require('express');
const { deleteUserData } = require('../lib/accounts');
const { presentMe } = require('../lib/present');
const { photoUpload, requireImage, savePhoto, deletePhoto } = require('../lib/upload');
const { applyProfile } = require('../lib/profile');

const router = express.Router();
const MAX_PHOTOS = 6;

router.get('/', (req, res) => res.json({ user: presentMe(req.user) }));

router.patch('/', async (req, res) => {
  const error = applyProfile(req.user, req.body);
  if (error) return res.status(400).json({ error });
  await req.user.save();
  res.json({ user: presentMe(req.user) });
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
