const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const mongoose = require('mongoose');
const { config } = require('../config');

// Photos live in MongoDB (GridFS), not on disk, because hosts like Render wipe the disk on every
// restart. Atlas M0 has 512 MB, which is thousands of photos; move to S3/Cloudinary when it fills up.
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

// Phones label their uploads inconsistently — Android sends image/jpg, image/heif or
// application/octet-stream for ordinary photos — so the format is read from the file's own
// first bytes instead of the mimetype header, which also fixes names like IMG.HEIC on JPEG data.
const HEIF_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'];
const ascii = (buf, start, end) => buf.subarray(start, end).toString('latin1');
const SIGNATURES = [
  { mime: 'image/jpeg', ext: '.jpg', match: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', ext: '.png', match: (b) => ascii(b, 1, 4) === 'PNG' && b[0] === 0x89 },
  { mime: 'image/webp', ext: '.webp', match: (b) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP' },
  { mime: 'image/avif', ext: '.avif', match: (b) => ascii(b, 4, 8) === 'ftyp' && ascii(b, 8, 12) === 'avif' },
  { mime: 'image/heic', ext: '.heic', match: (b) => ascii(b, 4, 8) === 'ftyp' && HEIF_BRANDS.includes(ascii(b, 8, 12)) },
];

// The image's real format, or null when the bytes aren't an image we can serve.
function imageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  return SIGNATURES.find((s) => s.match(buffer)) || null;
}

// Use after photoUpload: rejects anything that isn't really an image.
function requireImage(req, res, next) {
  req.image = req.file && imageType(req.file.buffer);
  if (!req.image) return res.status(400).json({ error: 'Choose a JPG, PNG or WebP image' });
  next();
}

const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'photos' });

// Saves the uploaded file and returns its public URL.
async function savePhoto(file, ownerId, image = imageType(file.buffer)) {
  const filename = `${crypto.randomUUID()}${image.ext}`;
  await new Promise((resolve, reject) => {
    const up = bucket().openUploadStream(filename, { metadata: { owner: String(ownerId), contentType: image.mime } });
    up.on('error', reject).on('finish', resolve);
    up.end(file.buffer);
  });
  return `${config.publicUrl}/uploads/${filename}`;
}

async function deletePhoto(url) {
  const filename = String(url).split('/uploads/')[1];
  if (!filename) return;
  const files = await bucket().find({ filename }).toArray();
  await Promise.all(files.map((f) => bucket().delete(f._id)));
}

// GET /uploads/:filename
async function servePhoto(req, res) {
  const filename = path.basename(req.params.filename);
  const [file] = await bucket().find({ filename }).limit(1).toArray();
  if (!file) return res.status(404).end();
  res.set('Content-Type', file.metadata?.contentType || 'image/jpeg');
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  bucket().openDownloadStreamByName(filename).on('error', () => res.status(404).end()).pipe(res);
}

module.exports = { photoUpload, requireImage, imageType, savePhoto, deletePhoto, servePhoto };
