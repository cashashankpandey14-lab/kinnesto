const O = require('../options');

// Vibe match: a 0–100 score for how well two people would live together,
// plus the top reasons, shown on cards as "92% vibe · Both night owls".
const WEIGHTS = { lifestyle: 45, budget: 20, intent: 15, moveIn: 10, interests: 10 };

const lifestyleOf = (u) => (u.lifestyle instanceof Map ? Object.fromEntries(u.lifestyle) : u.lifestyle || {});

const SAME_REASON = {
  food: (v) => (v === 'Non-veg' ? 'Both non-veg' : `Both ${v.toLowerCase()}`),
  smoking: (v) => (v === 'Never' ? 'Both non-smokers' : null),
  drinking: (v) => (v === 'Never' ? 'Neither drinks' : v === 'Socially' ? 'Both social drinkers' : null),
  sleep: (v) => (v === 'Night owl' ? 'Both night owls' : v === 'Early bird' ? 'Both early birds' : null),
  cleanliness: (v) => (v === 'Neat freak' ? 'Both neat freaks' : v === 'Tidy' ? 'Both tidy' : null),
  pets: (v) => (v === 'I have a pet' ? 'Both pet parents' : null),
  work: (v) => (v === 'Work from home' ? 'Both WFH' : v === 'Student' ? 'Both students' : null),
  vibe: (v) => `Both ${v.toLowerCase()}s`,
  guests: () => null,
};

function lifestyleScore(a, b, reasons) {
  const la = lifestyleOf(a);
  const lb = lifestyleOf(b);
  let total = 0;
  let got = 0;
  for (const [key, def] of Object.entries(O.LIFESTYLE)) {
    if (!la[key] || !lb[key]) continue;
    total += 1;
    if (la[key] === lb[key]) {
      got += 1;
      const r = SAME_REASON[key]?.(la[key]);
      if (r) reasons.push(r);
    } else if (def.ordered && Math.abs(def.options.indexOf(la[key]) - def.options.indexOf(lb[key])) === 1) {
      got += 0.5;
    } else if (key === 'pets' && [la[key], lb[key]].includes('No pets please') && [la[key], lb[key]].includes('I have a pet')) {
      got -= 0.5; // a real clash
    }
  }
  // Too few answers to judge: assume average rather than punish empty profiles.
  return total < 3 ? 0.5 : Math.max(0, got / total);
}

function budgetScore(a, b, reasons) {
  if (!a.budgetMax || !b.budgetMax) return 0.5;
  const lo = Math.max(a.budgetMin || 0, b.budgetMin || 0);
  const hi = Math.min(a.budgetMax, b.budgetMax);
  if (hi < lo) return 0;
  const span = Math.max(a.budgetMax - (a.budgetMin || 0), b.budgetMax - (b.budgetMin || 0), 1);
  const s = Math.min(1, (hi - lo) / span + 0.4);
  if (s >= 0.7) reasons.push('Similar budget');
  return s;
}

function intentScore(a, b, reasons) {
  const pair = [a.intent, b.intent].sort().join('+');
  const table = {
    'have_place+need_place': [1, 'You have a room, they need one'],
    'need_place+team_up': [0.85, 'Could hunt for a flat together'],
    'team_up+team_up': [1, 'Both want to team up'],
    'need_place+need_place': [0.7, 'Could hunt for a flat together'],
    'have_place+team_up': [0.6, null],
    'have_place+have_place': [0.1, null],
  };
  const [s, why] = table[pair] || [0.5, null];
  if (why) reasons.push(a.intent === 'need_place' && b.intent === 'have_place' ? 'They have a room for you' : why);
  return s;
}

function moveInScore(a, b) {
  if (!a.moveIn || !b.moveIn) return 0.5;
  const days = Math.abs(new Date(a.moveIn) - new Date(b.moveIn)) / 86400000;
  return days <= 15 ? 1 : days <= 45 ? 0.7 : days <= 90 ? 0.4 : 0.1;
}

function interestScore(a, b, reasons) {
  const mine = new Set(a.interests || []);
  const shared = (b.interests || []).filter((i) => mine.has(i));
  if (shared.length) reasons.push(`Into ${shared.slice(0, 2).join(' & ')}`);
  return Math.min(1, shared.length / 3);
}

function vibeMatch(a, b) {
  const reasons = [];
  const parts = {
    intent: intentScore(a, b, reasons),
    lifestyle: lifestyleScore(a, b, reasons),
    budget: budgetScore(a, b, reasons),
    moveIn: moveInScore(a, b),
    interests: interestScore(a, b, reasons),
  };
  const score = Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + w * parts[k], 0);
  return { score: Math.round(Math.min(99, Math.max(5, score))), reasons: reasons.slice(0, 3) };
}

// How well a listing fits what the member is looking for.
function listingFit(user, listing, owner) {
  const reasons = [];
  let score = 50;
  if (user.budgetMax) {
    const monthly = listing.type === 'bnb' ? null : listing.price;
    if (monthly != null) {
      if (monthly <= user.budgetMax && monthly >= (user.budgetMin || 0) * 0.7) {
        score += 20;
        reasons.push('In your budget');
      } else if (monthly > user.budgetMax * 1.15) score -= 20;
    }
  }
  if (user.city && listing.city === user.city) score += 5;
  if (user.localities?.length && user.localities.some((l) => l.toLowerCase() === (listing.locality || '').toLowerCase())) {
    score += 10;
    reasons.push(`In ${listing.locality}`);
  }
  if (listing.genderPref !== 'any' && user.gender && listing.genderPref !== user.gender) score -= 40;
  if (user.moveIn && listing.availableFrom && listing.type !== 'bnb') {
    const days = (new Date(listing.availableFrom) - new Date(user.moveIn)) / 86400000;
    if (days <= 10) {
      score += 5;
      if (days >= -30) reasons.push('Available when you move in');
    }
  }
  if (owner && owner.onboarded && listing.type !== 'bnb' && listing.type !== 'hostel') {
    const vibe = vibeMatch(user, owner);
    score += Math.round((vibe.score - 50) / 3);
    if (vibe.score >= 70) reasons.push(`${vibe.score}% vibe with ${owner.name}`);
  }
  return { score: Math.round(Math.min(99, Math.max(5, score))), reasons: reasons.slice(0, 3) };
}

module.exports = { vibeMatch, listingFit, lifestyleOf };
