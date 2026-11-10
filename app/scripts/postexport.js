// Runs after `expo export -p web`: Vercel routing, share tags and structured data on the home page,
// crawlable fallback content, and the static SEO pages (see seo.js).
const fs = require('fs');
const path = require('path');
const seo = require('./seo');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'web-build');
const SITE = seo.SITE;
const TITLE = 'Kinnesto: PG, Flats, Hostels & Flatmates in India – No Broker';
const DESC = 'Swipe on flats, PGs, hostels, co-living and BnB stays, and match with flatmates who share your vibe. Free, no brokerage, in 15 Indian cities.';

fs.copyFileSync(path.join(root, 'vercel.json'), path.join(dist, 'vercel.json'));
fs.copyFileSync(path.join(root, '.vercelignore'), path.join(dist, '.vercelignore'));
fs.copyFileSync(path.join(root, 'assets', 'icon.png'), path.join(dist, 'icon.png'));
fs.copyFileSync(path.join(root, 'assets', 'og.png'), path.join(dist, 'og.png'));

const jsonLd = [
  { '@context': 'https://schema.org', '@type': 'Organization', name: 'Kinnesto', url: SITE, logo: `${SITE}/icon.png` },
  { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Kinnesto', url: SITE, description: DESC, inLanguage: 'en-IN' },
];

const tags = [
  `<meta name="theme-color" content="#2A1660">`,
  `<link rel="apple-touch-icon" href="/icon.png">`,
  `<link rel="manifest" href="/site.webmanifest">`,
  `<link rel="canonical" href="${SITE}/">`,
  `<meta property="og:type" content="website">`,
  `<meta property="og:site_name" content="Kinnesto">`,
  `<meta property="og:title" content="${TITLE}">`,
  `<meta property="og:description" content="${DESC}">`,
  `<meta property="og:url" content="${SITE}/">`,
  `<meta property="og:image" content="${SITE}/og.png">`,
  `<meta property="og:image:width" content="1200">`,
  `<meta property="og:image:height" content="630">`,
  `<meta name="twitter:card" content="summary_large_image">`,
  ...jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`),
].join('\n');

// Shown until the app's JavaScript takes over (a split second for people), and readable by any crawler.
const fallback = `<div id="root"><div style="font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:40px 20px;color:#17112B;background:#FBF7EF">
<h1>Find your place. Find your people.</h1>
<p>Kinnesto is the free, no-broker way to find PGs, flats for rent, hostels, co-living and BnB stays in India, and to match with flatmates by budget, move-in date and lifestyle.</p>
<p><a href="/auth?mode=register">Create your free profile</a> · <a href="/about">About</a> · <a href="/safety">Safety</a></p>
<h2>Cities</h2><p>${seo.cities.map((c) => `<a href="/in/${c.slug}">PG, flats &amp; flatmates in ${c.name}</a>`).join(' · ')}</p>
</div></div>`;

const file = path.join(dist, 'index.html');
let html = fs.readFileSync(file, 'utf8');
if (!html.includes('og:title')) {
  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${DESC}">`)
    .replace('<html lang="en">', '<html lang="en-IN">')
    .replace('</head>', `${tags}\n</head>`)
    .replace('<div id="root"></div>', fallback);
  fs.writeFileSync(file, html);
}
seo.main();
console.log('postexport: home page tags, structured data and fallback content added');
