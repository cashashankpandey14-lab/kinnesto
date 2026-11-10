# Kinnesto: find your place, find your people

Kinnesto (kin + nest: your people and your home) is a website and app for flats, PGs, hostels, co-living and BnBs, with Tinder-style
flatmate matching. You swipe on **people** (Roomies) and on **places**, and every card shows a match score.

```
kinnesto/
├── app/      One Expo codebase: the website (Expo web), iOS and Android. Expo Router, TypeScript
└── server/   Node + Express + MongoDB API, Socket.IO for realtime chat and match alerts
```

## What's in it

| Area | What it does |
|---|---|
| **Website landing page** | Hero, listing types, how it works, and calls to action. Shown to signed-out visitors at `/welcome` |
| **Onboarding** | 4 steps: basics → photos → what you're looking for (intent, city, areas, budget, move-in, flatmate gender) → lifestyle and interests |
| **Roomies** (swipe people) | People in your city who'd live with someone like you, best **vibe match** first. Filter by intent: *I have a place*, *I need a place*, *Let's team up*. A mutual like opens a chat |
| **Places** (swipe or browse) | Flats, PGs, hostels, co-living, BnBs. Swipe mode, or a responsive grid with type, price and sort filters. Each place shows a **% fit** for you |
| **Requests** | Swiping right on a place sends the host a request (for BnBs, a booking request with dates and guests). The host accepts → a chat opens with the listing pinned on top |
| **Host** | Post or edit listings with type-specific fields (deposit and current flatmates for rentals; nightly price, min nights and guests for BnBs), pause or delete them, and review requests with each person's vibe score |
| **Chats** | Realtime messages, Sent/Seen receipts, icebreakers, unread counts, separate Roomie / Place / Stay tags |
| **Safety** | Block & report, women-only / men-only places hidden from people they don't apply to, exact address never shown (area only), account deletion |

### How the scores work (`server/src/lib/compat.js`)

- **Vibe match (people)**, 0–100: lifestyle 45% (food, smoking, drinking, sleep, cleanliness, guests, pets, work, vibe;
  close answers on ordered scales get half credit, and pet owners vs "no pets please" is penalised), budget overlap 20%,
  intent pairing 15% (*have a place* + *need a place* scores highest), move-in timing 10%, shared interests 10%.
  The top reasons are shown on the card ("Both night owls", "Similar budget").
- **Fit (places)**: budget, preferred area, gender rules, availability vs. your move-in date, and your vibe with the
  person who posted it (for flats and co-living).

All pick-lists (cities, amenities, lifestyle answers, listing types) live in `server/src/options.js` and are served
at `/api/options`, so the clients never hard-code them.

## Look and feel

The "Lime & Plum" theme is meant to stand out to Gen Z without putting anyone else off: warm paper background, ink
outlines with hard offset shadows, electric-lime actions, violet/lilac for people and lime for places, sticker-style
badges, and a dark tab bar. Headlines use **Bricolage Grotesque**, body text **Plus Jakarta Sans** (Google Fonts via
`@expo-google-fonts`). Tokens live in `app/src/lib/theme.ts`; `hard()` gives the outline + shadow. All text goes
through `app/src/components/Text.tsx`, which maps `fontWeight` to the right font file, so use it instead of
React Native's `Text`. Screenshots are in `app/design/screens/`.

## Run it locally

**1. API** (Node 20+). No MongoDB install needed:

```bash
cd kinnesto/server
npm install
npm run dev:memory
```

This starts an in-memory MongoDB on port 27019, seeds 14 demo members and 13 listings (Bengaluru, Mumbai, Pune, Goa),
and serves the API at http://localhost:4100. Data resets on every restart. In this mode demo members like you back
most of the time, demo hosts accept requests instantly, and demo members reply to your first messages, so you can
try every flow alone. Every demo account's password is `kinnesto123`, e.g. `ananya@demo.kinnesto.app` (has a room)
or `zara@demo.kinnesto.app` (Goa BnB host).

For a real database: copy `.env.example` to `.env`, set `MONGODB_URI`, then `npm run seed` (optional) and `npm run dev`.

**2. App**

```bash
cd kinnesto/app
npm install --legacy-peer-deps
npx expo start --web      # website at http://localhost:8081
npx expo start            # scan the QR code with Expo Go for iOS/Android
```

On a phone, the app reaches the API on the computer running Expo (same Wi-Fi). Set `EXPO_PUBLIC_API_URL` for
production builds.

In the Claude desktop app, the `kinnesto-api` and `kinnesto-web` previews (port 8091) are set up in
`D:\Shashank\Claude\.claude\launch.json`.

## Before launch

- **Photo storage**: photos are stored in MongoDB (GridFS), which fits thousands on the free 512 MB Atlas tier. Move to
  S3 or Cloudinary as usage grows.
- **App icon and splash**: drawn in code by `app/design/make_icons.py` (lime and lilac swipe cards with an ink house and heart, on a
  plum background). Edit and re-run it to change the artwork; `design/icon-preview.png` shows every size. The splash is
  configured through the `expo-splash-screen` plugin, which only shows fully in a release build, not Expo Go.
- **Verification**: there's no phone/ID verification yet. Phone OTP (MSG91 or Twilio) and an Aadhaar/DigiLocker check
  for hosts would be the natural next layer of trust.
- **Payments**: BnB requests confirm the stay, but no money moves. Add Razorpay for deposits or booking fees.
- **Search radius**: matching is by city plus preferred areas. Storing coordinates would enable "within 5 km of my office".
- **Deploy** (live at https://kinnesto.com):
  - **Website** → Vercel project `kinnesto` (team `lunexim`), uploaded as a prebuilt static site:
    `cd app && EXPO_PUBLIC_API_URL=https://api.kinnesto.com npm run export:web && cd web-build && vercel link --yes --project kinnesto && vercel deploy --prod --yes`
  - **API** → Render service `kinnesto-api` from `render.yaml` (Blueprint), free plan, Singapore, custom domain `api.kinnesto.com`.
    Pushing to GitHub redeploys it. Free plan sleeps after ~15 min idle, so the first request after that takes ~30 s.
  - **Database** → the existing Atlas cluster shared with Lunexim, separate database `kinnesto` (`DB_NAME`). Photos are stored in it via GridFS.
  - **DNS at GoDaddy**: `A @ 76.76.21.21`, `A www 76.76.21.21` (Vercel), `CNAME api kinnesto-api.onrender.com` (Render).
  - Apps: build with EAS (`npx eas-cli@latest build`) with `EXPO_PUBLIC_API_URL=https://api.kinnesto.com`.
- Set `JWT_SECRET`, and never set `DEMO_AUTO_REPLY` in production.
