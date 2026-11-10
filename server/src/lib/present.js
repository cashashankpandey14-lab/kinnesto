const { lifestyleOf } = require('./compat');

// What the signed-in member sees about themselves.
function presentMe(u) {
  return {
    id: String(u._id),
    email: u.email,
    name: u.name || '',
    age: u.age,
    birthYear: u.birthYear || null,
    gender: u.gender || null,
    occupation: u.occupation || '',
    company: u.company || '',
    bio: u.bio || '',
    photos: u.photos,
    city: u.city || null,
    localities: u.localities,
    intent: u.intent || null,
    budgetMin: u.budgetMin ?? null,
    budgetMax: u.budgetMax ?? null,
    moveIn: u.moveIn || null,
    lifestyle: lifestyleOf(u),
    interests: u.interests,
    flatmateGender: u.flatmateGender,
    onboarded: u.onboarded,
  };
}

// What other members see. No email, no exact birth year.
function presentUser(u, extra = {}) {
  return {
    id: String(u._id),
    name: u.name,
    age: u.age,
    gender: u.gender,
    occupation: u.occupation || '',
    company: u.company || '',
    bio: u.bio || '',
    photos: u.photos,
    city: u.city,
    localities: u.localities,
    intent: u.intent,
    budgetMin: u.budgetMin ?? null,
    budgetMax: u.budgetMax ?? null,
    moveIn: u.moveIn || null,
    lifestyle: lifestyleOf(u),
    interests: u.interests,
    recentlyActive: u.lastActive && Date.now() - new Date(u.lastActive) < 3 * 86400000,
    ...extra,
  };
}

function presentListing(l, extra = {}) {
  const owner = l.owner && l.owner._id ? l.owner : null;
  return {
    id: String(l._id),
    type: l.type,
    title: l.title,
    description: l.description || '',
    city: l.city,
    locality: l.locality || '',
    price: l.price,
    deposit: l.deposit || 0,
    roomType: l.roomType,
    bedrooms: l.bedrooms ?? null,
    bathrooms: l.bathrooms ?? null,
    furnishing: l.furnishing,
    genderPref: l.genderPref,
    amenities: l.amenities,
    photos: l.photos,
    availableFrom: l.availableFrom || null,
    currentFlatmates: l.currentFlatmates || 0,
    maxGuests: l.maxGuests ?? null,
    minNights: l.minNights ?? null,
    active: l.active,
    createdAt: l.createdAt,
    ownerId: String(owner ? owner._id : l.owner),
    owner: owner ? { id: String(owner._id), name: owner.name, photo: owner.photos?.[0] || null, occupation: owner.occupation || '', recentlyActive: Date.now() - new Date(owner.lastActive) < 3 * 86400000 } : null,
    ...extra,
  };
}

module.exports = { presentMe, presentUser, presentListing };
