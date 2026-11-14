// Runs after `expo export -p web`: Vercel routing, share tags and structured data on the home page,
// crawlable fallback content, and the static SEO pages (see seo.js).
const fs = require('fs');
const path = require('path');
const seo = require('./seo');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'web-build');
const SITE = seo.SITE;
const TITLE = 'Kinnesto: PG, Flats & Flatmates in Mumbai – No Broker';
const DESC = 'Find PGs, flats, hostels, co-living and stays across Mumbai, and match with flatmates on budget, timing and lifestyle. Free, no brokerage.';

// `expo export --clear` wipes web-build, taking the .vercel link with it. Without it the next
// `vercel deploy` silently creates a NEW project named after the folder instead of updating
// kinnesto.com, so the link is rewritten here every time. These ids identify the project; they
// are not credentials.
const VERCEL_PROJECT = { projectId: 'prj_vZsavgWj91bLne1kx2mp62oW2rlW', orgId: 'team_kJMWkkWXDRO1LXdG5ktxQCo7', projectName: 'kinnesto' };
fs.mkdirSync(path.join(dist, '.vercel'), { recursive: true });
fs.writeFileSync(path.join(dist, '.vercel', 'project.json'), JSON.stringify(VERCEL_PROJECT));

fs.copyFileSync(path.join(root, 'vercel.json'), path.join(dist, 'vercel.json'));
fs.copyFileSync(path.join(root, '.vercelignore'), path.join(dist, '.vercelignore'));
fs.copyFileSync(path.join(root, 'assets', 'icon.png'), path.join(dist, 'icon.png'));
fs.copyFileSync(path.join(root, 'assets', 'og.png'), path.join(dist, 'og.png'));

// Expo exports bundled fonts and icons under assets/node_modules/..., and Vercel never uploads a
// path containing a node_modules segment, so those files 404 to index.html in production — which
// silently drops every Ionicons glyph and every custom font. Move them somewhere Vercel will take.
function unNodeModules() {
  const from = path.join(dist, 'assets', 'node_modules');
  if (!fs.existsSync(from)) return 0;
  fs.cpSync(from, path.join(dist, 'assets', 'vendor'), { recursive: true });
  fs.rmSync(from, { recursive: true, force: true });
  let patched = 0;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|html|json|css|map)$/.test(e.name)) {
        const text = fs.readFileSync(p, 'utf8');
        if (text.includes('assets/node_modules/')) {
          fs.writeFileSync(p, text.split('assets/node_modules/').join('assets/vendor/'));
          patched += 1;
        }
      }
    }
  };
  walk(dist);
  return patched;
}
console.log(`postexport: moved assets/node_modules -> assets/vendor, rewrote ${unNodeModules()} files`);

const jsonLd = [
  { '@context': 'https://schema.org', '@type': 'Organization', name: 'Kinnesto', url: SITE, logo: `${SITE}/icon.png` },
  { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Kinnesto', url: SITE, description: DESC, inLanguage: 'en-IN' },
];

const tags = [
  `<meta name="theme-color" content="#121119">`,
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
const fallback = `<div id="root"><div style="font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:40px 20px;color:#121119;background:#F6F5F2">
<h1>Find your place. And the people to share it with.</h1>
<p>Kinnesto is the free, no-broker way to find PGs, flats for rent, hostels, co-living and stays in Mumbai, and to match with flatmates by budget, move-in date and lifestyle.</p>
<p><a href="/auth?mode=register">Create your free profile</a> · <a href="/about">About</a> · <a href="/safety">Safety</a></p>
<p>${seo.cities.filter((c) => c.live).map((c) => `<a href="/in/${c.slug}">PG, flats &amp; flatmates in ${c.name}</a>`).join(' · ')}</p>
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
