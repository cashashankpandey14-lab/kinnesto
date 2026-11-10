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
  fileFilter: (req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.mimetype)),
});

const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'photos' });

// Saves the uploaded file and returns its public URL.
async function savePhoto(file, ownerId) {
  const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
  const filename = `${crypto.randomUUID()}${ext}`;
  await new Promise((resolve, reject) => {
    const up = bucket().openUploadStream(filename, { metadata: { owner: String(ownerId), contentType: file.mimetype } });
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

module.exports = { photoUpload, savePhoto, deletePhoto, servePhoto };
