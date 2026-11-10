// Runs after `expo export -p web`: adds Vercel routing, link-preview tags (WhatsApp, Instagram, X)
// and a home-screen icon to dist/.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const SITE = 'https://kinnesto.com';
const TITLE = 'Kinnesto: find your place, find your people';
const DESC = 'Swipe on flats, PGs, hostels, co-living and BnBs, and match with flatmates who share your vibe. No brokers.';

fs.copyFileSync(path.join(root, 'vercel.json'), path.join(dist, 'vercel.json'));
fs.copyFileSync(path.join(root, '.vercelignore'), path.join(dist, '.vercelignore'));
fs.copyFileSync(path.join(root, 'assets', 'icon.png'), path.join(dist, 'icon.png'));

const tags = [
  `<meta name="theme-color" content="#2A1660">`,
  `<link rel="apple-touch-icon" href="/icon.png">`,
  `<link rel="canonical" href="${SITE}/">`,
  `<meta property="og:type" content="website">`,
  `<meta property="og:site_name" content="Kinnesto">`,
  `<meta property="og:title" content="${TITLE}">`,
  `<meta property="og:description" content="${DESC}">`,
  `<meta property="og:url" content="${SITE}/">`,
  `<meta property="og:image" content="${SITE}/icon.png">`,
  `<meta name="twitter:card" content="summary">`,
].join('\n');

const file = path.join(dist, 'index.html');
const html = fs.readFileSync(file, 'utf8');
if (!html.includes('og:title')) fs.writeFileSync(file, html.replace('</head>', `${tags}\n</head>`));
console.log('postexport: added vercel.json, icon.png and share tags');
