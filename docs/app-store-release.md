# Releasing Kinnesto on Google Play and the App Store

The app is one Expo codebase (`app/`). Expo's cloud service **EAS** builds the Android and iOS binaries and
uploads them to the stores, so you don't need Android Studio, Xcode or a Mac. Build settings live in `app/eas.json`;
every build points at `https://api.kinnesto.com`.

## 0. One-time accounts

| Account | Cost | Notes |
|---|---|---|
| Expo (expo.dev) | Free tier works | Free tier has a monthly build quota and a queue; paid plans build faster |
| Google Play Console | US$25 once | Sign up at play.google.com/console. Choose an **Organisation** account if you have a registered company (needs a D-U-N-S number). **Personal** accounts must run a closed test with at least 12 testers for 14 days before production |
| Apple Developer Program | US$99 / year | developer.apple.com/programs. Organisation enrolment needs a D-U-N-S number and takes a few days; Individual is faster but shows your personal name as the seller |

## 1. Prepare (once)

```bash
cd kinnesto/app
npx eas-cli@latest login
npx eas-cli@latest init        # links the project to your Expo account
```

Already set in `app.json`: name **Kinnesto**, bundle ID / package **app.kinnesto**, icon, adaptive icon,
splash, photo permission text. Version is `1.0.0`; build numbers auto-increment on EAS.

## 2. Test on real phones first

```bash
npx eas-cli@latest build -p android --profile preview   # gives an .apk link you can install directly
npx eas-cli@latest build -p ios --profile preview       # installs on registered iPhones (EAS walks you through it)
```

Check sign-up, swiping, photo upload, chat and listing a place against the live API.

## 3. Google Play

```bash
npx eas-cli@latest build -p android --profile production    # produces an .aab
npx eas-cli@latest submit -p android --profile production   # uploads it to the Internal testing track
```

The first upload: EAS asks for a Google Service Account key so it can upload for you. Follow its prompt, or upload
the first `.aab` by hand in Play Console → **Testing → Internal testing**.

All listing text, the privacy-form answers and Apple review notes are in `docs/store-listing.md`; the graphics
(512 icon, 1024×500 feature graphic, phone screenshots) are in `marketing/store/play/`.

In Play Console, fill in:
- **Store listing:** title "Kinnesto: Flats, PGs & Flatmates", short description (80 characters), full description,
  icon (512×512 from `assets/icon.png`), feature graphic (1024×500), and at least 2 phone screenshots.
- **App content:** privacy policy `https://kinnesto.com/privacy`; **Data safety** (you collect name, email, photos,
  approximate location preference, messages; data is encrypted in transit; users can delete their account in the app
  and at `https://kinnesto.com/delete-account`); ads: none; target audience 18+; content rating questionnaire (user
  interaction and user-generated content: yes).
- **Testing:** internal test → closed test (12+ testers for 14 days on a personal account) → production.

Review usually takes from a few hours to a few days.

## 4. Apple App Store

```bash
npx eas-cli@latest build -p ios --profile production    # EAS creates the certificates and provisioning for you
npx eas-cli@latest submit -p ios --profile production   # uploads to App Store Connect / TestFlight
```

In App Store Connect (appstoreconnect.apple.com):
- Create the app record: name **Kinnesto**, bundle ID **app.kinnesto**, SKU `kinnesto`, primary language English (India).
- **App Privacy:** same data as the Play Data safety form. Privacy policy URL `https://kinnesto.com/privacy`.
- **Screenshots:** 6.9" iPhone (1320×2868) is the only required size: use `marketing/store/appstore/`. The app is
  iPhone-only (`supportsTablet: false`), so no iPad screenshots are needed.
- **Review notes:** give Apple a working demo login (create a real test account on the live site for them), and
  explain that profiles and listings are user-generated with report & block, and that admins review reports.
- Test with TestFlight first, then **Submit for review**. First reviews take 1–3 days.

### Apple rules that matter for Kinnesto
- **Account deletion in the app** (5.1.1(v)): done (Me → Delete account).
- **User-generated content** (1.2): needs report, block, a way to act on reports and published contact details. Report &
  block and the admin dashboard are done; make sure `hello@kinnesto.com` works.
- **Sign in with Apple** (4.8): only required if the iOS app offers Google or Facebook sign-in. The native app
  currently offers email only (social buttons are web-only), so it isn't required yet. Add Sign in with Apple at the
  same time as native Google/Facebook sign-in.
- **Location/photos permission text:** already set.

## 5. After launch

- Ship JavaScript-only fixes instantly with `npx eas-cli@latest update --branch production` (add `expo-updates` first).
- Anything that changes native code (new native packages, app.json permissions) needs a new store build.
- Bump `version` in `app.json` for each store release (1.0.1, 1.1.0, …).
