const O = require('../options');

const str = (v, max) => (v == null ? undefined : String(v).trim().slice(0, max));

// Fields a profile needs before it counts as complete.
function missingFields(u) {
  const missing = [];
  if (!u.name) missing.push('name');
  if (!u.birthYear) missing.push('age');
  if (!u.gender) missing.push('gender');
  if (!u.city) missing.push('city');
  if (!u.intent) missing.push('what you’re looking for');
  if (!u.photos.length) missing.push('a photo');
  return missing;
}

// Applies profile fields from a request body onto a member. Returns an error message to show,
// or null when everything applied. Shared by a member editing themselves and an admin editing
// anyone, so both validate the same way; only an admin may mark a half-filled profile complete.
function applyProfile(u, b, { asAdmin = false } = {}) {
  const thisYear = new Date().getFullYear();

  if (b.name !== undefined) u.name = str(b.name, 40);
  if (b.birthYear !== undefined) {
    const y = Number(b.birthYear);
    if (!(y <= thisYear - 18 && y >= thisYear - 80)) return asAdmin ? 'Year of birth must put them between 18 and 80' : 'You need to be 18 or older';
    u.birthYear = y;
  }
  if (b.gender !== undefined && O.GENDERS[b.gender]) u.gender = b.gender;
  if (b.occupation !== undefined) u.occupation = str(b.occupation, 60);
  if (b.company !== undefined) u.company = str(b.company, 60);
  if (b.bio !== undefined) u.bio = str(b.bio, 500);
  if (b.city !== undefined) {
    if (!O.LAUNCH_CITIES.includes(b.city)) return `Kinnesto is live in ${O.LAUNCH_CITIES.join(', ')} for now. More cities soon!`;
    u.city = b.city;
  }
  if (Array.isArray(b.localities)) u.localities = b.localities.map((l) => str(l, 40)).filter(Boolean).slice(0, 5);
  if (b.intent !== undefined && O.INTENTS[b.intent]) u.intent = b.intent;
  if (b.budgetMin !== undefined) u.budgetMin = Math.max(0, Number(b.budgetMin) || 0);
  if (b.budgetMax !== undefined) u.budgetMax = Math.max(0, Number(b.budgetMax) || 0);
  if (b.moveIn !== undefined) {
    const d = b.moveIn ? new Date(b.moveIn) : null;
    if (d && Number.isNaN(+d)) return 'Enter the move-in date as YYYY-MM-DD, or pick one of the quick options';
    u.moveIn = d || undefined;
  }
  if (b.flatmateGender !== undefined && O.GENDER_PREFS[b.flatmateGender]) u.flatmateGender = b.flatmateGender;
  if (b.lifestyle && typeof b.lifestyle === 'object') {
    for (const [k, v] of Object.entries(b.lifestyle)) {
      if (!O.LIFESTYLE[k]) continue;
      if (v && O.LIFESTYLE[k].options.includes(v)) u.lifestyle.set(k, v);
      else u.lifestyle.delete(k);
    }
  }
  if (Array.isArray(b.interests)) u.interests = b.interests.filter((i) => O.INTERESTS.includes(i)).slice(0, 8);
  if (u.budgetMin && u.budgetMax && u.budgetMin > u.budgetMax) [u.budgetMin, u.budgetMax] = [u.budgetMax, u.budgetMin];

  // An admin can switch a profile on or off outright; a member has to fill the gaps first.
  if (asAdmin && b.onboarded !== undefined) {
    u.onboarded = Boolean(b.onboarded);
  } else if (b.finishOnboarding) {
    const missing = missingFields(u);
    if (missing.length) return `Add ${missing.join(', ')} to finish`;
    u.onboarded = true;
  }

  return null;
}

module.exports = { applyProfile, missingFields };
