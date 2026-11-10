// Generates crawlable static HTML for search engines and link previews into dist/:
// city landing pages, legal pages, sitemap.xml, robots.txt and the web manifest.
// The app itself stays a single-page app; these pages link into it.
const fs = require('fs');
const path = require('path');
const { cities } = require('./seo-data');

const SITE = 'https://kinnesto.com';
const CONTACT = 'hello@kinnesto.com';
const TODAY = new Date().toISOString().slice(0, 10);
const dist = path.join(__dirname, '..', 'web-build');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CSS = `
:root{--ink:#121119;--ink2:#2B2838;--paper:#F6F5F2;--line:#E5E2DC;--muted:#6C6878;--gold:#F4A51C;--goldtext:#B86E00;--goldsoft:#FFF3DC;--sea:#11615F}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.7 'Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
a{color:var(--goldtext)}.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
nav{display:flex;justify-content:space-between;align-items:center;padding:18px 0}nav .logo{display:flex;align-items:center;gap:10px;font:600 24px 'Sora',system-ui,sans-serif;letter-spacing:-.03em;color:var(--ink);text-decoration:none}
nav img{width:34px;height:34px;border-radius:9px}
.btn{display:inline-block;padding:13px 24px;border-radius:999px;font-weight:700;font-size:15px;text-decoration:none;color:#fff;background:var(--ink);box-shadow:0 1px 2px rgba(18,17,25,.06),0 2px 8px rgba(18,17,25,.05)}
.btn.gold{background:var(--gold);color:var(--ink)}.btn.light{background:#fff;color:var(--ink);border:1px solid var(--line)}
h1,h2,h3{font-family:'Sora',system-ui,sans-serif;font-weight:600;line-height:1.1;letter-spacing:-.03em;margin:0 0 14px;text-wrap:balance}
h1{font-size:clamp(36px,5.6vw,60px);margin-top:36px}h2{font-size:clamp(26px,3.6vw,36px);margin-top:72px}h3{font-size:19px;letter-spacing:-.01em}
.accent{color:var(--goldtext)}
.eyebrow{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:5px 12px;font-size:13px;font-weight:600;color:var(--ink2);margin-top:28px}
.eyebrow i{width:8px;height:8px;border-radius:50%;background:#1E9E6A;display:inline-block}
.lead{font-size:19px;max-width:700px;color:var(--muted)}.ctas{display:flex;gap:12px;flex-wrap:wrap;margin:28px 0}
.chips{display:flex;flex-wrap:wrap;gap:8px}.chip{border:1px solid var(--line);border-radius:999px;padding:6px 14px;background:#fff;font-weight:600;font-size:14px;color:var(--ink2);text-decoration:none}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
.card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px;box-shadow:0 1px 2px rgba(18,17,25,.04)}.card p{margin:6px 0 0;color:var(--muted);font-size:15px;line-height:1.6}
.card .n{display:inline-flex;width:30px;height:30px;border-radius:50%;background:var(--ink);color:#fff;align-items:center;justify-content:center;font-weight:700;font-size:14px;margin-bottom:10px}
details{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px 20px;margin-bottom:10px}summary{font-weight:700;cursor:pointer}details p{color:var(--muted);margin:10px 0 0}
.band{background:var(--ink);color:#fff;border-radius:28px;padding:44px 32px;margin-top:72px;text-align:center}.band h2{margin-top:0}.band p{color:#BDB8CA}
.legal h2{font-size:24px;margin-top:40px}.legal{max-width:760px}.legal li{margin:6px 0}
footer{background:#fff;border-top:1px solid var(--line);margin-top:88px;padding:36px 0;font-size:15px;color:var(--muted)}footer a{color:var(--ink2);margin-right:18px;text-decoration:none;font-weight:600}
`;

function page({ urlPath, title, description, body, jsonLd = [], noindex = false }) {
  const url = `${SITE}${urlPath}`;
  return `<!DOCTYPE html>
<html lang="en-IN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">${noindex ? '\n<meta name="robots" content="noindex,follow">' : ''}
<meta name="theme-color" content="#121119">
<link rel="icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/icon.png"><link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="website"><meta property="og:site_name" content="Kinnesto"><meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SITE}/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
${jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head><body>
<div class="wrap"><nav><a class="logo" href="/"><img src="/icon.png" alt="">kinnesto</a><a class="btn light" href="/auth?mode=login">Sign in</a></nav></div>
<main class="wrap">${body}</main>
<footer><div class="wrap">
<p><strong style="color:var(--ink)">Kinnesto</strong> · flats, PGs, hostels, co-living, stays and flatmates. Live in ${cities.filter((c) => c.live).map((c) => `<a href="/in/${c.slug}">${c.name}</a>`).join(', ')}, more cities soon.</p>
<p><a href="/about">About</a><a href="/safety">Safety</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/delete-account">Delete account</a></p>
<p>© ${new Date().getFullYear()} Kinnesto · Made in India</p></div></footer>
</body></html>`;
}

function write(urlPath, html) {
  const dir = path.join(dist, urlPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

function cityPage(c) {
  const a = c.areas;
  const faqs = [
    [`How do I find a PG or flat in ${c.name} without a broker?`, `Create a free Kinnesto profile, pick ${c.name} and the areas you like (for example ${a.slice(0, 3).join(', ')}), then swipe through places. Liking a place sends a request straight to the owner or host, and when they accept you can chat directly. No brokerage.`],
    [`How do I find a flatmate in ${c.name}?`, `Open the Roomies tab. You’ll see people in ${c.name} ranked by a vibe-match score built from budget, move-in date and lifestyle: food habits, sleep schedule, cleanliness, guests and pets. If you both swipe right, you can chat and plan your flatshare.`],
    [`Which areas in ${c.name} are popular for shared flats and PGs?`, `Members often search in ${a.join(', ')}. You can add up to five preferred areas to your profile and Kinnesto shows places there first.`],
    [`Is Kinnesto free?`, `Yes. Creating a profile, swiping, matching, chatting and posting a listing are all free.`],
    [`Can I list my PG, flat or spare room in ${c.name}?`, `Yes. Post it from the Host tab with photos, rent, deposit and who it suits. People who swipe right on it show up as requests along with their vibe score, so you can choose tenants or flatmates who fit.`],
  ];
  const body = `
<span class="eyebrow"><i></i>Live in ${c.name}</span>
<h1>PG, flats &amp; flatmates in <span class="accent">${c.name}</span></h1>
<p class="lead">${esc(c.intro)} On Kinnesto you swipe on rooms <em>and</em> roommates in ${c.name}${c.alt !== c.name ? ` (${c.alt})` : ''}, and every card shows how well it fits your budget, timing and lifestyle.</p>
<div class="ctas"><a class="btn gold" href="/auth?mode=register">Find a place in ${c.name}</a><a class="btn light" href="/auth?mode=register">List your room or PG</a></div>
<h2>Popular areas in ${c.name}</h2>
<div class="chips">${a.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div>
<h2>What you can find in ${c.name}</h2>
<div class="grid">
<div class="card"><h3>Flats &amp; flatshares</h3><p>Private rooms in shared flats, or whole apartments in ${a[0]}, ${a[1]} and beyond.</p></div>
<div class="card"><h3>PGs</h3><p>Paying-guest rooms in ${c.name}, often with meals, housekeeping and Wi-Fi included.</p></div>
<div class="card"><h3>Hostels</h3><p>Budget beds for students and interns, by the month.</p></div>
<div class="card"><h3>Co-living</h3><p>Managed shared homes with bills, cleaning and community events in one rent.</p></div>
<div class="card"><h3>BnB stays</h3><p>Short stays for house-hunting trips${c.slug === 'goa' ? ', workations and long holidays' : ''}.</p></div>
</div>
<h2>How Kinnesto works</h2>
<div class="grid">
<div class="card"><span class="n">1</span><h3>Create your profile</h3><p>Budget, move-in date, preferred areas in ${c.name}, and how you live: food, sleep, cleanliness, guests, pets.</p></div>
<div class="card"><span class="n">2</span><h3>Swipe on people and places</h3><p>Every flatmate shows a vibe-match %, every room a fit % with the reasons behind it.</p></div>
<div class="card"><span class="n">3</span><h3>Match and move in</h3><p>Mutual likes and accepted requests open a chat. No brokers, no spam calls.</p></div>
</div>
<h2>FAQs: renting in ${c.name}</h2>
${faqs.map(([q, ans]) => `<details><summary>${esc(q)}</summary><p>${esc(ans)}</p></details>`).join('\n')}
<div class="band"><h2>Your next home in ${c.name} starts here.</h2><p>Create a free profile in two minutes.</p><a class="btn gold" href="/auth?mode=register">Get started</a></div>`;
  return page({
    urlPath: `/in/${c.slug}`,
    title: `PG, Flats & Flatmates in ${c.name} – No Broker | Kinnesto`,
    description: `Find PGs, flats for rent, hostels, co-living and flatmates in ${c.name} (${a.slice(0, 4).join(', ')}). Swipe, match by lifestyle and chat directly with owners. Free, no brokerage.`,
    body,
    jsonLd: [
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kinnesto', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: c.name, item: `${SITE}/in/${c.slug}` }] },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, ans]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: ans } })) },
    ],
  });
}

function soonPage(c) {
  const live = cities.filter((x) => x.live);
  return page({
    urlPath: `/in/${c.slug}`,
    title: `Kinnesto in ${c.name}: coming soon`,
    description: `Kinnesto is coming to ${c.name}. We're live in ${live.map((x) => x.name).join(', ')} today.`,
    noindex: true,
    body: `<span class="eyebrow"><i style="background:var(--gold)"></i>Coming soon</span>
<h1>Kinnesto is coming to <span class="accent">${c.name}</span>.</h1>
<p class="lead">We launch city by city so there are real places and real people from day one. ${c.name} is on the list. Today we're live in ${live.map((x) => `<a href="/in/${x.slug}">${x.name}</a>`).join(', ')}.</p>
<div class="ctas"><a class="btn gold" href="/auth?mode=register">Create a profile</a><a class="btn light" href="/in/${live[0].slug}">Explore ${live[0].name}</a></div>`,
  });
}

const legal = (h, html) => `<div class="legal"><h1>${h}</h1><p><em>Last updated: ${TODAY}</em></p>${html}</div>`;

const PAGES = {
  '/about': {
    title: 'About Kinnesto – Find your place, find your people',
    description: 'Kinnesto helps people across India find flats, PGs, hostels, co-living and BnB stays, and match with flatmates by lifestyle. No brokers.',
    body: `<h1>Find your place. <span class="accent">And the people to share it with.</span></h1>
<p class="lead">Kinnesto (kin + nest) is built on a simple idea: where you live matters, but who you live with matters just as much.</p>
<p>Most rental sites stop at the room. We match the people too. Every flatmate profile and every listing shows a match score built from budget, move-in timing and the everyday things that make or break a flatshare: food habits, sleep schedules, cleanliness, guests and pets.</p>
<p>Kinnesto covers flats, PGs, hostels, co-living spaces and BnB stays, starting in Mumbai with more cities to follow. It’s free, and you deal directly with owners and flatmates, with no brokers in the middle.</p>
<div class="ctas"><a class="btn gold" href="/auth?mode=register">Create your profile</a></div>
<p>Questions or partnership ideas? Write to <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>`,
  },
  '/safety': {
    title: 'Safety tips for renting and flatsharing | Kinnesto',
    description: 'How to stay safe while finding a flat, PG or flatmate: meeting tips, avoiding rental scams, and how to report or block someone on Kinnesto.',
    body: legal('Safety on Kinnesto', `
<h2>Before you pay anything</h2><ul><li>Never pay a deposit or “token amount” before you have seen the place in person (or on a live video call) and met the owner.</li><li>Be wary of anyone who pressures you to pay quickly, asks for payment to a personal UPI ID before a visit, or refuses to show the property.</li><li>Ask for a written rental agreement and keep receipts for every payment.</li></ul>
<h2>Meeting a flatmate or owner</h2><ul><li>Chat on Kinnesto first. Meet in a public place or visit the flat with a friend.</li><li>Tell someone where you’re going.</li><li>Trust your instincts. If something feels off, walk away.</li></ul>
<h2>Report and block</h2><p>Open the person’s profile and tap <strong>Block &amp; report</strong>. They will no longer see you or message you, and our team reviews every report. For anything urgent, contact local police (dial 112) and email <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>`),
  },
  '/privacy': {
    title: 'Privacy Policy | Kinnesto',
    description: 'How Kinnesto collects, uses, stores and deletes your personal data.',
    body: legal('Privacy Policy', `
<p>This policy explains what personal data Kinnesto (“we”) collects when you use kinnesto.com and the Kinnesto apps, why, and the choices you have. We process personal data in line with India’s Digital Personal Data Protection Act, 2023.</p>
<h2>What we collect</h2><ul>
<li><strong>Account details:</strong> email address and password (stored only as a secure hash), or, if you sign in with Google or Facebook, your name, email address, profile picture and an account identifier from that provider. We never receive your Google or Facebook password.</li>
<li><strong>Profile information you add:</strong> first name, year of birth, gender, occupation, photos, bio, city and preferred areas, budget, move-in date, flatmate preference, lifestyle answers and interests.</li>
<li><strong>Listings you post:</strong> photos, description, locality, rent, deposit and other details. We show the area publicly, never your exact address.</li>
<li><strong>Activity:</strong> swipes, matches, requests, booking requests and messages you exchange, and reports you make.</li>
<li><strong>Technical data:</strong> basic logs such as IP address, device and browser type, used for security and to keep the service running.</li></ul>
<h2>How we use it</h2><ul><li>To run the service: show your profile and listings, calculate match scores, deliver messages and requests.</li><li>To keep Kinnesto safe: investigate reports, prevent fraud and abuse, and enforce our Terms.</li><li>To contact you about your account. We do not sell your personal data.</li></ul>
<h2>Who can see your data</h2><p>Other members see your profile (not your email or exact birth date) and your listings. Messages are visible only to the people in the chat. We use trusted service providers to host and run Kinnesto: Vercel (website hosting), Render (application servers), MongoDB Atlas (database and photo storage), and Google and Meta (only if you choose to sign in with them). They process data on our behalf under their own security commitments.</p>
<h2>How long we keep it</h2><p>We keep your data while your account is active. When you delete your account we delete your profile, photos, listings, matches, messages and swipes, except where we must keep limited records to comply with law or resolve a safety report.</p>
<h2>Your rights</h2><p>You can view and edit your profile at any time, and delete your account from <strong>Me → Delete account</strong>. You can also ask us to access, correct or erase your data, or raise a grievance, by emailing <a href="mailto:${CONTACT}">${CONTACT}</a>. See <a href="/delete-account">how to delete your account</a>.</p>
<h2>Children</h2><p>Kinnesto is only for people aged 18 and over.</p>
<h2>Changes</h2><p>We’ll post any changes here and update the date above.</p>`),
  },
  '/terms': {
    title: 'Terms of Use | Kinnesto',
    description: 'The rules for using Kinnesto to find flats, PGs, stays and flatmates.',
    body: legal('Terms of Use', `
<p>By using Kinnesto you agree to these terms.</p>
<h2>Who can use Kinnesto</h2><p>You must be at least 18 and able to enter a binding agreement. One account per person.</p>
<h2>Your content</h2><p>You’re responsible for your profile, photos, listings and messages. They must be accurate and yours to share. Don’t post anything illegal, misleading, hateful, sexually explicit or that infringes someone else’s rights. You give us permission to display your content on Kinnesto to provide the service.</p>
<h2>Listings and rentals</h2><p>Kinnesto connects people; we are not a party to any rental, flatshare or stay arrangement and we don’t own or inspect the properties listed. Hosts must have the right to rent out what they list and must follow local laws. Agreements, payments and deposits are between you and the other person. Read our <a href="/safety">safety tips</a> before paying anything.</p>
<h2>Not allowed</h2><ul><li>Brokers or agents posing as owners or flatmates, or charging brokerage through Kinnesto.</li><li>Scams, asking for money before a viewing, fake profiles or fake listings.</li><li>Harassment, discrimination or abuse of other members.</li><li>Scraping, spamming, or interfering with the service.</li></ul>
<h2>Suspension</h2><p>We may remove content or suspend accounts that break these terms or put others at risk.</p>
<h2>Liability</h2><p>Kinnesto is provided “as is”. To the extent permitted by law, we aren’t liable for losses arising from arrangements between members or from content posted by members.</p>
<h2>Contact</h2><p><a href="mailto:${CONTACT}">${CONTACT}</a>. These terms are governed by the laws of India.</p>`),
  },
  '/delete-account': {
    title: 'Delete your Kinnesto account and data',
    description: 'How to delete your Kinnesto account and all associated data.',
    body: legal('Delete your account', `
<p>You can permanently delete your Kinnesto account and data at any time:</p>
<ol><li>Sign in at <a href="/auth?mode=login">kinnesto.com</a> or in the app.</li><li>Go to the <strong>Me</strong> tab.</li><li>Tap <strong>Delete account</strong> and confirm.</li></ol>
<p>This immediately deletes your profile, photos, listings, matches, messages, requests and swipes. It can’t be undone.</p>
<p>If you signed in with Facebook or Google, this also deletes the data we received from them. You can additionally remove Kinnesto from your Facebook “Apps and Websites” settings or your Google account’s third-party access page.</p>
<p>Can’t sign in? Email <a href="mailto:${CONTACT}">${CONTACT}</a> from the address on your account and we’ll delete it for you.</p>`),
  },
};

function main() {
  for (const c of cities) write(`/in/${c.slug}`, c.live ? cityPage(c) : soonPage(c));
  for (const [p, def] of Object.entries(PAGES)) write(p, page({ urlPath: p, ...def }));

  const urls = ['/', ...cities.filter((c) => c.live).map((c) => `/in/${c.slug}`), ...Object.keys(PAGES)];
  fs.writeFileSync(
    path.join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${SITE}${u === '/' ? '/' : u}</loc><lastmod>${TODAY}</lastmod><changefreq>${u === '/' || u.startsWith('/in/') ? 'weekly' : 'monthly'}</changefreq><priority>${u === '/' ? '1.0' : u.startsWith('/in/') ? '0.8' : '0.4'}</priority></url>`)
      .join('\n')}\n</urlset>\n`
  );
  // App screens are behind sign-in, so keep crawlers on the public pages.
  const appPaths = ['/roomies', '/places', '/host', '/chats', '/me', '/chat/', '/person/', '/listing/', '/onboarding', '/edit-profile', '/edit-listing'];
  fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n${appPaths.map((p) => `Disallow: ${p}`).join('\n')}\n\nSitemap: ${SITE}/sitemap.xml\n`);
  fs.writeFileSync(
    path.join(dist, 'site.webmanifest'),
    JSON.stringify({ name: 'Kinnesto', short_name: 'Kinnesto', start_url: '/', display: 'standalone', background_color: '#F6F5F2', theme_color: '#121119', icons: [{ src: '/icon.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' }] }, null, 2)
  );
  console.log(`seo: ${cities.filter((c) => c.live).length} live + ${cities.filter((c) => !c.live).length} coming-soon city pages, ${Object.keys(PAGES).length} info pages, sitemap (${urls.length} URLs), robots.txt, manifest`);
}

module.exports = { main, cities, SITE };
if (require.main === module) main();
