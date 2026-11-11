// Demo members and listings so a fresh install has people and places to swipe on.
// Every demo account's password is "kinnesto123". Safe to re-run: it wipes demo data first.
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { config } = require('./config');
const { User, Listing, Swipe, Interest, Match, Message } = require('./models');

const img = (id) => `https://images.unsplash.com/photo-${id}?w=1000&q=70&auto=format&fit=crop`;
const face = (g, n) => `https://randomuser.me/api/portraits/${g === 'female' ? 'women' : 'men'}/${n}.jpg`;
const portrait = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=70&auto=format&fit=crop&crop=faces`;
const PORTRAITS = {
  female: ['1494790108377-be9c29b29330', '1438761681033-6461ffad8d80', '1534528741775-53994a69daeb', '1544005313-94ddf0286df2', '1517841905240-472988babdf9', '1524504388940-b1c1722653e1', '1488426862026-3ee34a7d66df', '1529626455594-4ff0802cfb7e', '1580489944761-15a19d654956', '1573496359142-b8d87734a5a2'],
  male: ['1507003211169-0a1dd7228f2d', '1500648767791-00dcc994a43e', '1506794778202-cad84cf45f1d', '1539571696357-5a69c17a67c6', '1531427186611-ecfd6d936c79', '1519085360753-af0119f7cbe7', '1492562080023-ab3db95bfbce', '1472099645785-5658abf4ff4e', '1564564321837-a57b7070ac4f', '1566492031773-4f4e44671857'],
};
const inDays = (d) => new Date(Date.now() + d * 86400000);
const Y = new Date().getFullYear();

const ROOMS = {
  living: ['1502672260266-1c1ef2d93688', '1522708323590-d24dbb6b0267', '1560448204-e02f11c3d0e2', '1493809842364-78817add7ffb', '1512918728675-ed5a9ecdebfd', '1554995207-c18c203602cb', '1586023492125-27b2c045efd7', '1600210492486-724fe5c67fb0'],
  bed: ['1505691938895-1758d7feb511', '1540518614846-7eded433c457', '1566665797739-1674de7a421a', '1595526114035-0d45ed16cfbf', '1617806118233-18e1de247200', '1598928506311-c55ded91a20c', '1616594039964-ae9021a400a0', '1615874959474-d609969a20ed'],
  kitchen: ['1484154218962-a197022b5858', '1556020685-ae41abfc9365', '1600607687939-ce8a6c25118c'],
  hostel: ['1555854877-bab0e564b8d5', '1595846519845-68e298c2edd8', '1630699144867-37acec97df5a', '1522771739844-6a9f6d5f14af'],
  stay: ['1631049307264-da0ec9d70304', '1618773928121-c32242e63f39', '1613490493576-7fde63acd811', '1571896349842-33c89424de2d', '1520250497591-112f2f40a3f4', '1600585154340-be6161a56a0c', '1564013799919-ab600027ffc6', '1536376072261-38c75010e6c9', '1507089947368-19c1da9775ae'],
};
const pick = (arr, i, n) => Array.from({ length: n }, (_, k) => img(arr[(i + k) % arr.length]));

// name, gender, age, city, localities, intent, budget, moveIn (days), occupation, company, lifestyle, interests, bio
const PEOPLE = [
  ['Ananya', 'female', 26, 'Bengaluru', ['Koramangala', 'HSR Layout'], 'have_place', [15000, 22000], 10, 'Product Designer', 'Swiggy',
    { food: 'Eggetarian', smoking: 'Never', drinking: 'Socially', sleep: 'Night owl', cleanliness: 'Tidy', guests: 'Sometimes', pets: 'Fine with pets', work: 'Hybrid', vibe: 'Ambivert' },
    ['Cooking', 'Plants', 'Netflix', 'Yoga'], 'Have a sunny 3BHK in Bandra West with one room free. Looking for someone chill who doesn’t mind a plant jungle 🌿'],
  ['Rohan', 'male', 27, 'Bengaluru', ['Indiranagar', 'Domlur'], 'need_place', [12000, 20000], 14, 'Backend Engineer', 'Razorpay',
    { food: 'Non-veg', smoking: 'Never', drinking: 'Socially', sleep: 'Night owl', cleanliness: 'Tidy', guests: 'Sometimes', pets: 'Fine with pets', work: 'Hybrid', vibe: 'Ambivert' },
    ['Gaming', 'Football', 'Coding', 'Coffee'], 'Moving from Pune for work, hoping to be near Bandra. I cook a mean biryani on Sundays and will share.'],
  ['Meera', 'female', 24, 'Bengaluru', ['HSR Layout', 'BTM Layout'], 'team_up', [10000, 16000], 20, 'Data Analyst', 'Flipkart',
    { food: 'Vegetarian', smoking: 'Never', drinking: 'Never', sleep: 'Early bird', cleanliness: 'Neat freak', guests: 'Rarely', pets: 'No pets please', work: 'Office', vibe: 'Introvert' },
    ['Reading', 'Yoga', 'Meditation', 'Podcasts'], 'Want a calm, clean home. Let’s find a 2BHK near Andheri together?'],
  ['Kabir', 'male', 29, 'Bengaluru', ['Whitefield', 'Marathahalli'], 'have_place', [18000, 25000], 5, 'Engineering Manager', 'Microsoft',
    { food: 'Non-veg', smoking: 'Outside only', drinking: 'Regularly', sleep: 'Flexible', cleanliness: 'Tidy', guests: 'Often', pets: 'I have a pet', work: 'Work from home', vibe: 'Extrovert' },
    ['Board games', 'Trekking', 'Music', 'Partying'], 'Me + my golden retriever Bruno. Gated society, pool, gym. Weekend board game nights are a thing here.'],
  ['Ishita', 'female', 25, 'Bengaluru', ['Koramangala', 'Indiranagar'], 'need_place', [14000, 20000], 12, 'Marketing Lead', 'CRED',
    { food: 'Non-veg', smoking: 'Never', drinking: 'Socially', sleep: 'Night owl', cleanliness: 'Tidy', guests: 'Sometimes', pets: 'Fine with pets', work: 'Hybrid', vibe: 'Extrovert' },
    ['Dancing', 'Foodie', 'Travel', 'Stand-up comedy'], 'Looking for a fun flat with people who’ll come to open mics with me.'],
  ['Arjun', 'male', 23, 'Bengaluru', ['HSR Layout', 'Bellandur'], 'need_place', [8000, 13000], 25, 'SDE Intern', 'Zepto',
    { food: 'Vegetarian', smoking: 'Never', drinking: 'Never', sleep: 'Night owl', cleanliness: 'Relaxed', guests: 'Sometimes', pets: 'Fine with pets', work: 'Student', vibe: 'Ambivert' },
    ['Anime', 'Gaming', 'Cricket', 'Coding'], 'Final-year student interning in Mumbai. Quiet, pays rent on the 1st.'],
  ['Sneha', 'female', 28, 'Bengaluru', ['Indiranagar', 'Domlur'], 'have_place', [16000, 24000], 7, 'UX Researcher', 'Atlassian',
    { food: 'Vegetarian', smoking: 'Never', drinking: 'Socially', sleep: 'Early bird', cleanliness: 'Neat freak', guests: 'Rarely', pets: 'Fine with pets', work: 'Hybrid', vibe: 'Introvert' },
    ['Running', 'Coffee', 'Reading', 'Photography'], 'Spare room in my Powai flat, close to Hiranandani. Women only.'],
  ['Vikram', 'male', 30, 'Bengaluru', ['Koramangala', 'Jayanagar'], 'team_up', [15000, 22000], 30, 'Founder', 'Stealth startup',
    { food: 'Non-veg', smoking: 'Never', drinking: 'Socially', sleep: 'Night owl', cleanliness: 'Tidy', guests: 'Often', pets: 'Fine with pets', work: 'Work from home', vibe: 'Extrovert' },
    ['Startups', 'Gym', 'Podcasts', 'Cycling'], 'Building something new. Looking for a co-founder of a different kind: a flatmate.'],
  ['Priya', 'female', 27, 'Mumbai', ['Bandra', 'Andheri West'], 'have_place', [25000, 35000], 10, 'Investment Analyst', 'Kotak',
    { food: 'Non-veg', smoking: 'Never', drinking: 'Socially', sleep: 'Flexible', cleanliness: 'Tidy', guests: 'Sometimes', pets: 'Fine with pets', work: 'Office', vibe: 'Ambivert' },
    ['Travel', 'Foodie', 'Movies', 'Yoga'], 'Sea-facing-ish (if you lean out) 2BHK in Bandra. Room free from next month.'],
  ['Aditya', 'male', 26, 'Mumbai', ['Powai', 'Andheri East'], 'need_place', [18000, 28000], 15, 'Consultant', 'Deloitte',
    { food: 'Non-veg', smoking: 'Never', drinking: 'Socially', sleep: 'Night owl', cleanliness: 'Tidy', guests: 'Sometimes', pets: 'No pets please', work: 'Office', vibe: 'Extrovert' },
    ['Cricket', 'Gym', 'Music', 'Partying'], 'Travel 3 days a week for work, so you get the flat to yourself half the time.'],
  ['Nisha', 'female', 25, 'Pune', ['Baner', 'Aundh'], 'need_place', [9000, 14000], 18, 'QA Engineer', 'Persistent',
    { food: 'Vegetarian', smoking: 'Never', drinking: 'Never', sleep: 'Early bird', cleanliness: 'Tidy', guests: 'Rarely', pets: 'Fine with pets', work: 'Office', vibe: 'Introvert' },
    ['Reading', 'Cooking', 'Art', 'Meditation'], 'Simple person, love cooking Maharashtrian food. Looking for a peaceful place near Vashi.'],
  ['Karan', 'male', 28, 'Pune', ['Kharadi', 'Viman Nagar'], 'have_place', [10000, 15000], 8, 'DevOps Engineer', 'Barclays',
    { food: 'Non-veg', smoking: 'Never', drinking: 'Socially', sleep: 'Flexible', cleanliness: 'Tidy', guests: 'Sometimes', pets: 'Fine with pets', work: 'Hybrid', vibe: 'Ambivert' },
    ['Cycling', 'Trekking', 'Photography', 'Coffee'], '2BHK in Thane. Weekend treks to the Sahyadris are optional but encouraged.'],
  ['Zara', 'female', 31, 'Goa', ['Assagao', 'Anjuna'], 'have_place', [20000, 30000], 3, 'Villa Host', 'Self-employed',
    { food: 'Non-veg', smoking: 'Never', drinking: 'Socially', sleep: 'Early bird', cleanliness: 'Neat freak', guests: 'Often', pets: 'I have a pet', work: 'Work from home', vibe: 'Extrovert' },
    ['Yoga', 'Travel', 'Plants', 'Music'], 'I host travellers at my homes in Versova. Come for a week, stay for a month.'],
  ['Rahul', 'male', 35, 'Bengaluru', ['BTM Layout', 'Electronic City'], 'have_place', [6000, 12000], 0, 'PG Owner', 'Sri Sai Residency',
    {}, [], 'Running PGs and hostels in Mumbai for 8 years. Clean rooms, home food, no brokerage.'],
];

// owner index, type, title, locality, price, deposit, roomType, bedrooms, bathrooms, furnishing, genderPref, amenities, photos, availableFrom (days), extras, description
const LISTINGS = [
  [0, 'flat', 'Sunny room in a plant-filled 3BHK', 'Koramangala', 18500, 50000, 'private', 3, 2, 'furnished', 'any', ['wifi', 'washer', 'fridge', 'kitchen', 'power', 'balcony', 'geyser'], [...pick(ROOMS.bed, 0, 1), ...pick(ROOMS.living, 0, 2), ...pick(ROOMS.kitchen, 0, 1)], 10, { currentFlatmates: 2 },
    'Big private room with an attached balcony in a 3BHK off Hill Road. Two of us live here: me (product designer) and Dev (musician, very quiet with headphones). Cook stops by at 8am and 7pm, split three ways.'],
  [3, 'flat', 'Room in gated society with pool & gym', 'Whitefield', 22000, 60000, 'private', 3, 3, 'furnished', 'any', ['wifi', 'ac', 'washer', 'fridge', 'kitchen', 'gym', 'pool', 'parking', 'security', 'lift', 'power'], [...pick(ROOMS.living, 3, 2), ...pick(ROOMS.bed, 3, 2)], 5, { currentFlatmates: 1 },
    'Attached bathroom, AC, wardrobe and a work desk. 10 minutes to the Western Express Highway. You must love dogs: Bruno will greet you every evening.'],
  [6, 'flat', 'Women-only room near Powai lake', 'Indiranagar', 21000, 42000, 'private', 2, 2, 'furnished', 'female', ['wifi', 'ac', 'washer', 'fridge', 'kitchen', 'geyser', 'workspace'], [...pick(ROOMS.bed, 5, 2), ...pick(ROOMS.living, 5, 1)], 7, { currentFlatmates: 1 },
    '2BHK in Hiranandani, a short walk to the lake. Quiet building, lots of cafes around. Looking for a clean, early-rising flatmate.'],
  [8, 'flat', 'Bandra 2BHK room, 10 min to Carter Road', 'Bandra', 32000, 100000, 'private', 2, 2, 'furnished', 'any', ['wifi', 'ac', 'washer', 'fridge', 'kitchen', 'lift', 'security'], [...pick(ROOMS.living, 6, 2), ...pick(ROOMS.bed, 6, 1)], 25, { currentFlatmates: 1 },
    'Classic Bandra West building with a lift (rare!). The room fits a queen bed and a desk.'],
  [11, 'flat', 'Room in 2BHK near Thane station', 'Kharadi', 12500, 30000, 'private', 2, 2, 'semi', 'any', ['wifi', 'washer', 'fridge', 'kitchen', 'parking', 'power'], [...pick(ROOMS.bed, 2, 1), ...pick(ROOMS.living, 2, 1), ...pick(ROOMS.kitchen, 1, 1)], 8, { currentFlatmates: 1 },
    'Bed, wardrobe and curtains included. 5 min walk to Thane station. Maid comes daily.'],
  [13, 'pg', 'Sri Sai Ladies PG: meals + housekeeping', 'BTM Layout', 9500, 10000, 'shared', 1, 1, 'furnished', 'female', ['wifi', 'meals', 'housekeeping', 'washer', 'power', 'security', 'geyser'], [...pick(ROOMS.bed, 4, 2), ...pick(ROOMS.hostel, 1, 1)], 0, { currentFlatmates: 1 },
    'Twin sharing with 3 meals a day (North + South Indian), daily cleaning, laundry twice a week. Biometric entry, CCTV.'],
  [13, 'pg', 'Sri Sai Gents PG: single room', 'Electronic City', 11000, 15000, 'private', 1, 1, 'furnished', 'male', ['wifi', 'meals', 'housekeeping', 'ac', 'power', 'security', 'geyser', 'tv'], [...pick(ROOMS.bed, 6, 1), ...pick(ROOMS.living, 7, 1)], 0, {},
    'Private AC room with attached bath. Breakfast and dinner included. 5 minutes to the Thane–Belapur road offices.'],
  [13, 'hostel', 'Backpacker hostel, 6-bed mixed dorm', 'Koramangala', 7000, 5000, 'bed', 1, 2, 'furnished', 'any', ['wifi', 'housekeeping', 'power', 'security', 'workspace'], pick(ROOMS.hostel, 0, 3), 0, {},
    'Monthly beds for interns and new joiners. Lockers, a rooftop co-working area and Friday movie nights.'],
  [13, 'coliving', 'Managed co-living, private room', 'HSR Layout', 16500, 33000, 'private', 4, 4, 'furnished', 'any', ['wifi', 'ac', 'housekeeping', 'washer', 'fridge', 'kitchen', 'gym', 'power', 'security'], [...pick(ROOMS.living, 4, 2), ...pick(ROOMS.bed, 7, 1)], 3, { currentFlatmates: 3 },
    'All-inclusive rent: Wi-Fi, electricity up to 100 units, cleaning twice a week. Community events every weekend.'],
  [12, 'bnb', 'Sea-view apartment in Versova', 'Assagao', 6500, 0, 'entire', 3, 3, 'furnished', 'any', ['wifi', 'ac', 'pool', 'kitchen', 'parking', 'housekeeping', 'workspace'], pick(ROOMS.stay, 2, 4), 0, { maxGuests: 6, minNights: 2 },
    'A bright apartment with a sea-facing balcony in Versova, five minutes from the beach. Fast Wi-Fi for work trips.'],
  [12, 'bnb', 'Cozy studio for workations', 'Anjuna', 2800, 0, 'entire', 1, 1, 'furnished', 'any', ['wifi', 'ac', 'kitchen', 'workspace', 'balcony'], pick(ROOMS.stay, 0, 3), 0, { maxGuests: 2, minNights: 3 },
    'Studio with a balcony in a quiet lane. 100 Mbps fibre, standing desk, metro nearby.'],
  [0, 'bnb', 'Guest room in Bandra (short stays)', 'Koramangala', 1800, 0, 'private', 1, 1, 'furnished', 'any', ['wifi', 'ac', 'kitchen', 'geyser'], [...pick(ROOMS.stay, 7, 1), ...pick(ROOMS.bed, 1, 1)], 0, { maxGuests: 2, minNights: 1 },
    'Visiting Mumbai for a few days? Stay in our guest room. Great for house-hunting trips.'],
  [9, 'flat', 'Entire 1BHK in Powai (lease takeover)', 'Powai', 34000, 120000, 'entire', 1, 1, 'semi', 'any', ['wifi', 'ac', 'lift', 'security', 'parking', 'gym', 'pool'], [...pick(ROOMS.living, 1, 1), ...pick(ROOMS.bed, 0, 1)], 30, {},
    'Moving out, looking for someone to take over the lease in Hiranandani. Society has a pool and gym.'],
];

// We launch in Mumbai, so demo members and listings all live there.
const MUMBAI = { Koramangala: 'Bandra West', 'HSR Layout': 'Andheri West', Indiranagar: 'Powai', Whitefield: 'Goregaon', Marathahalli: 'Malad', 'BTM Layout': 'Andheri East', 'Electronic City': 'Thane', Bellandur: 'Chembur', Jayanagar: 'Lower Parel', Domlur: 'Juhu', Bandra: 'Bandra West', 'Andheri West': 'Andheri West', Powai: 'Powai', 'Andheri East': 'Andheri East', Baner: 'Vashi', Aundh: 'Kharghar', Kharadi: 'Thane', 'Viman Nagar': 'Kandivali', Assagao: 'Versova', Anjuna: 'Versova' };
const toMumbai = (area) => MUMBAI[area] || area;

async function seed() {
  await mongoose.connect(config.mongoUri, { dbName: config.dbName });
  const demo = await User.find({ isDemo: true }).distinct('_id');
  await Promise.all([
    Listing.deleteMany({ owner: { $in: demo } }),
    Swipe.deleteMany({ $or: [{ from: { $in: demo } }, { to: { $in: demo } }] }),
    Interest.deleteMany({ $or: [{ user: { $in: demo } }, { owner: { $in: demo } }] }),
    Match.deleteMany({ users: { $in: demo } }),
    User.deleteMany({ isDemo: true }),
  ]);
  await Message.deleteMany({ match: { $nin: await Match.distinct('_id') } });

  const passwordHash = await bcrypt.hash('kinnesto123', 10);
  const nth = { female: 0, male: 0 };
  const users = await User.insertMany(
    PEOPLE.map(([name, gender, age, city, localities, intent, [budgetMin, budgetMax], moveIn, occupation, company, lifestyle, interests, bio], i) => ({
      email: `${name.toLowerCase()}@demo.kinnesto.app`,
      passwordHash,
      name,
      gender,
      birthYear: Y - age,
      city: 'Mumbai',
      localities: localities.map(toMumbai),
      intent,
      budgetMin,
      budgetMax,
      moveIn: inDays(moveIn),
      occupation,
      company,
      lifestyle,
      interests,
      bio,
      photos: [portrait(PORTRAITS[gender][nth[gender]++ % PORTRAITS[gender].length]), face(gender, 12 + i * 5)],
      flatmateGender: name === 'Sneha' || name === 'Meera' ? 'female' : 'any',
      onboarded: true,
      isDemo: true,
      lastActive: inDays(-(i % 4)),
    }))
  );

  await Listing.insertMany(
    LISTINGS.map(([o, type, title, locality, price, deposit, roomType, bedrooms, bathrooms, furnishing, genderPref, amenities, photos, avail, extras, description]) => ({
      owner: users[o]._id,
      type,
      title,
      city: 'Mumbai',
      locality: toMumbai(locality),
      price,
      deposit,
      roomType,
      bedrooms,
      bathrooms,
      furnishing,
      genderPref,
      amenities,
      photos,
      availableFrom: inDays(avail),
      description,
      ...extras,
    }))
  );

  console.log(`Seeded ${users.length} demo members and ${LISTINGS.length} listings (password: kinnesto123)`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
