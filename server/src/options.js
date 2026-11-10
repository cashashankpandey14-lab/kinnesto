// Every pick-list in the app lives here and is served at /api/options,
// so the web and mobile clients never hard-code labels.

const LISTING_TYPES = {
  flat: { label: 'Flat', emoji: '🏢', blurb: 'Rooms or whole apartments', priceUnit: 'month' },
  pg: { label: 'PG', emoji: '🛏️', blurb: 'Paying guest, often with meals', priceUnit: 'month' },
  hostel: { label: 'Hostel', emoji: '🎒', blurb: 'Beds in shared dorms', priceUnit: 'month' },
  coliving: { label: 'Co-living', emoji: '🤝', blurb: 'Managed shared homes', priceUnit: 'month' },
  bnb: { label: 'BnB', emoji: '🌴', blurb: 'Short stays by the night', priceUnit: 'night' },
};

const ROOM_TYPES = {
  private: 'Private room',
  shared: 'Shared room',
  entire: 'Entire place',
  bed: 'Bed in a dorm',
};

const FURNISHING = { furnished: 'Fully furnished', semi: 'Semi-furnished', unfurnished: 'Unfurnished' };

const GENDER_PREFS = { any: 'Anyone', male: 'Men only', female: 'Women only' };

const GENDERS = { male: 'Man', female: 'Woman', nonbinary: 'Non-binary' };

const AMENITIES = {
  wifi: { label: 'Wi-Fi', icon: 'wifi' },
  ac: { label: 'AC', icon: 'snow' },
  washer: { label: 'Washing machine', icon: 'water' },
  fridge: { label: 'Fridge', icon: 'cube' },
  kitchen: { label: 'Kitchen', icon: 'restaurant' },
  meals: { label: 'Meals included', icon: 'fast-food' },
  housekeeping: { label: 'Housekeeping', icon: 'sparkles' },
  power: { label: 'Power backup', icon: 'flash' },
  geyser: { label: 'Geyser', icon: 'flame' },
  parking: { label: 'Parking', icon: 'car' },
  lift: { label: 'Lift', icon: 'swap-vertical' },
  gym: { label: 'Gym', icon: 'barbell' },
  security: { label: '24×7 security', icon: 'shield-checkmark' },
  balcony: { label: 'Balcony', icon: 'leaf' },
  tv: { label: 'TV', icon: 'tv' },
  pool: { label: 'Pool', icon: 'water-outline' },
  workspace: { label: 'Work desk', icon: 'laptop' },
};

// What a member is on Kinnesto for. Drives who sees whom in the Roomies deck.
const INTENTS = {
  have_place: { label: 'I have a place', blurb: 'Looking for flatmates to fill a room', emoji: '🔑' },
  need_place: { label: 'I need a place', blurb: 'Looking for a room or a flat to join', emoji: '🧳' },
  team_up: { label: 'Let’s team up', blurb: 'Find a buddy, then hunt for a flat together', emoji: '🤜' },
};

// Lifestyle answers power the vibe-match score. `ordered` keys score
// half a point for neighbouring answers (tidy vs neat freak is close; relaxed vs neat freak is not).
const LIFESTYLE = {
  food: { label: 'Food', icon: 'restaurant-outline', options: ['Vegetarian', 'Eggetarian', 'Non-veg', 'Vegan'] },
  smoking: { label: 'Smoking', icon: 'cloud-outline', options: ['Never', 'Outside only', 'Smoker'], ordered: true },
  drinking: { label: 'Drinking', icon: 'wine-outline', options: ['Never', 'Socially', 'Regularly'], ordered: true },
  sleep: { label: 'Sleep', icon: 'moon-outline', options: ['Early bird', 'Flexible', 'Night owl'], ordered: true },
  cleanliness: { label: 'Cleanliness', icon: 'sparkles-outline', options: ['Relaxed', 'Tidy', 'Neat freak'], ordered: true },
  guests: { label: 'Guests over', icon: 'people-outline', options: ['Rarely', 'Sometimes', 'Often'], ordered: true },
  pets: { label: 'Pets', icon: 'paw-outline', options: ['No pets please', 'Fine with pets', 'I have a pet'] },
  work: { label: 'Work', icon: 'briefcase-outline', options: ['Office', 'Hybrid', 'Work from home', 'Student'] },
  vibe: { label: 'Vibe', icon: 'happy-outline', options: ['Introvert', 'Ambivert', 'Extrovert'], ordered: true },
};

const INTERESTS = [
  'Cooking', 'Gaming', 'Gym', 'Yoga', 'Running', 'Cricket', 'Football', 'Music', 'Movies', 'Netflix',
  'Reading', 'Travel', 'Trekking', 'Photography', 'Art', 'Dancing', 'Startups', 'Coding', 'Board games',
  'Coffee', 'Foodie', 'Plants', 'Anime', 'Podcasts', 'Cycling', 'Meditation', 'Stand-up comedy', 'Partying',
];

const CITIES = [
  'Bengaluru', 'Mumbai', 'Delhi', 'Gurugram', 'Noida', 'Pune', 'Hyderabad', 'Chennai',
  'Kolkata', 'Ahmedabad', 'Jaipur', 'Chandigarh', 'Indore', 'Kochi', 'Goa',
];

const REPORT_REASONS = ['Fake profile or listing', 'Asked for money upfront', 'Rude or abusive', 'Scam or broker posing as owner', 'Something else'];

module.exports = {
  LISTING_TYPES,
  ROOM_TYPES,
  FURNISHING,
  GENDER_PREFS,
  GENDERS,
  AMENITIES,
  INTENTS,
  LIFESTYLE,
  INTERESTS,
  CITIES,
  REPORT_REASONS,
};
