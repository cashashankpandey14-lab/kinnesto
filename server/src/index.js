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
app.use(cors({ origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) }));
app.use(express.json({ limit: '200kb' }));

const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

app.get('/uploads/:filename', (req, res, next) => servePhoto(req, res).catch(next));

// `version` is the deployed commit on Render, handy for checking a deploy went out.
app.get('/api/health', (req, res) => res.json({ ok: true, version: (process.env.RENDER_GIT_COMMIT || 'local').slice(0, 7) }));
app.get('/api/options', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json(require('./options'));
});

app.use('/api/auth', authLimit, require('./routes/auth'));
app.use('/api/me', requireAuth, require('./routes/me'));
app.use('/api/listings', requireAuth, require('./routes/listings'));
app.use('/api/people', requireAuth, requireOnboarded, require('./routes/people'));
app.use('/api/requests', requireAuth, require('./routes/requests'));
app.use('/api/matches', requireAuth, require('./routes/matches'));
app.use('/api/admin', requireAuth, requireAdmin, require('./routes/admin'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.code === 'LIMIT_FILE_SIZE' ? 400 : 500;
  res.status(status).json({ error: status === 400 ? 'File is too large' : 'Something went wrong' });
});

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
