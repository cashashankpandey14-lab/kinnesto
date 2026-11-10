require('dotenv').config();

const config = {
  port: Number(process.env.PORT) || 4100,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kinnesto',
  // Kinnesto shares an Atlas cluster with Lunexim but always uses its own database.
  dbName: process.env.DB_NAME || 'kinnesto',
  corsOrigins: (process.env.CORS_ORIGINS || 'https://kinnesto.com,https://www.kinnesto.com').split(',').map((s) => s.trim()),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret',
  publicUrl: (process.env.PUBLIC_URL || 'http://localhost:4100').replace(/\/$/, ''),
  // Seeded demo members like you back and demo hosts accept requests, so a fresh
  // install has matches and chats to try. Never enable in production.
  demoAutoReply: process.env.DEMO_AUTO_REPLY === 'true',
  // Members with these emails see the admin dashboard (comma-separated).
  adminEmails: (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
  // Social sign-in. Leave unset to hide the buttons.
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  facebookAppId: process.env.FACEBOOK_APP_ID || '',
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET || '',
};

if (process.env.NODE_ENV === 'production' && config.jwtSecret === 'dev-only-secret') {
  throw new Error('JWT_SECRET must be set in production');
}

module.exports = { config };
