require('express-async-errors'); // Express 4 doesn't catch errors thrown in async handlers
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { config } = require('./config');
const { requireAuth, requireOnboarded, requireAdmin } = require('./middleware/auth');
const { initSocket } = require('./socket');
const { servePhoto } = require('./lib/upload');

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
// Browsers may only call the API from Kinnesto's own sites (and local dev). Mobile apps send no Origin.
app.use(cors({ origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) }));
app.use(express.json({ limit: '200kb' }));

const tooMany = { error: 'Too many attempts. Please wait a few minutes and try again.' };
// Only sign-in actions are throttled (not /auth/providers, which every sign-in screen loads).
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false, message: tooMany });
// Photo uploads are capped so nobody can fill the database.
const uploadLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 80, standardHeaders: true, legacyHeaders: false, message: { error: 'Upload limit reached. Try again in an hour.' } });

app.get('/uploads/:filename', (req, res, next) => servePhoto(req, res).catch(next));

// `version` is the deployed commit on Render, handy for checking a deploy went out.
app.get('/api/health', (req, res) => res.json({ ok: true, version: (process.env.RENDER_GIT_COMMIT || 'local').slice(0, 7) }));
app.get('/api/options', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json(require('./options'));
});

app.use(['/api/auth/login', '/api/auth/register', '/api/auth/google', '/api/auth/facebook'], authLimit);
app.use(['/api/me/photos', '/api/listings/photos'], (req, res, next) => (req.method === 'POST' ? uploadLimit(req, res, next) : next()));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/me', requireAuth, require('./routes/me'));
app.use('/api/listings', requireAuth, require('./routes/listings'));
app.use('/api/reports', requireAuth, require('./routes/reports'));
app.use('/api/people', requireAuth, requireOnboarded, require('./routes/people'));
app.use('/api/requests', requireAuth, require('./routes/requests'));
app.use('/api/matches', requireAuth, require('./routes/matches'));
app.use('/api/admin', requireAuth, requireAdmin, require('./routes/admin'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Bad input that slips past validation (invalid ids, dates, numbers) is the client's fault, not a crash.
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File is too large' });
  if (err.name === 'CastError' || err.name === 'ValidationError') return res.status(400).json({ error: 'Some of the details aren’t valid. Please check and try again.' });
  if (err.code === 11000) return res.status(409).json({ error: 'That already exists.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

// Last line of defence: log instead of taking the whole API down.
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));

async function main() {
  await mongoose.connect(config.mongoUri, { dbName: config.dbName });
  const server = http.createServer(app);
  initSocket(server);
  server.listen(config.port, () => console.log(`Kinnesto API on http://localhost:${config.port}`));
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { app, main };
