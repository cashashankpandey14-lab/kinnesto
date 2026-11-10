const mongoose = require('mongoose');
const O = require('../options');

const { Schema, model } = mongoose;
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name });

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: String, // empty for people who only sign in with Google or Facebook
    googleId: { type: String, index: true, sparse: true },
    facebookId: { type: String, index: true, sparse: true },
    name: { type: String, trim: true, maxlength: 40 },
    birthYear: Number,
    gender: { type: String, enum: Object.keys(O.GENDERS) },
    occupation: { type: String, trim: true, maxlength: 60 },
    company: { type: String, trim: true, maxlength: 60 },
    bio: { type: String, trim: true, maxlength: 500 },
    photos: { type: [String], default: [] },
    city: { type: String, enum: O.CITIES },
    localities: { type: [String], default: [] },
    intent: { type: String, enum: Object.keys(O.INTENTS) },
    budgetMin: Number,
    budgetMax: Number,
    moveIn: Date,
    lifestyle: { type: Map, of: String, default: {} },
    interests: { type: [String], default: [] },
    flatmateGender: { type: String, enum: Object.keys(O.GENDER_PREFS), default: 'any' },
    onboarded: { type: Boolean, default: false },
    blocked: [ref('User')],
    isDemo: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.virtual('age').get(function age() {
  return this.birthYear ? new Date().getFullYear() - this.birthYear : null;
});

const listingSchema = new Schema(
  {
    owner: { ...ref('User'), required: true, index: true },
    type: { type: String, enum: Object.keys(O.LISTING_TYPES), required: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 2000 },
    city: { type: String, enum: O.CITIES, required: true },
    locality: { type: String, trim: true, maxlength: 60 },
    price: { type: Number, required: true, min: 0 },
    deposit: { type: Number, min: 0, default: 0 },
    roomType: { type: String, enum: Object.keys(O.ROOM_TYPES), default: 'private' },
    bedrooms: { type: Number, min: 0, max: 20 },
    bathrooms: { type: Number, min: 0, max: 20 },
    furnishing: { type: String, enum: Object.keys(O.FURNISHING), default: 'furnished' },
    genderPref: { type: String, enum: Object.keys(O.GENDER_PREFS), default: 'any' },
    amenities: { type: [String], default: [] },
    photos: { type: [String], default: [] },
    availableFrom: Date,
    // Flats/co-living: people already living there. BnB: guest limit and minimum stay.
    currentFlatmates: { type: Number, min: 0, max: 20, default: 0 },
    maxGuests: { type: Number, min: 1, max: 30 },
    minNights: { type: Number, min: 1, max: 365 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
listingSchema.index({ city: 1, type: 1, active: 1, price: 1 });

// A right/left swipe on another member.
const swipeSchema = new Schema(
  {
    from: { ...ref('User'), required: true },
    to: { ...ref('User'), required: true },
    action: { type: String, enum: ['like', 'pass'], required: true },
  },
  { timestamps: true }
);
swipeSchema.index({ from: 1, to: 1 }, { unique: true });

// A swipe on a listing. A like becomes a request the host accepts or declines;
// for BnBs it carries the dates and works as a booking request.
const interestSchema = new Schema(
  {
    user: { ...ref('User'), required: true },
    listing: { ...ref('Listing'), required: true },
    owner: { ...ref('User'), required: true, index: true },
    action: { type: String, enum: ['like', 'pass'], required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    note: { type: String, trim: true, maxlength: 300 },
    checkIn: Date,
    checkOut: Date,
    guests: Number,
  },
  { timestamps: true }
);
interestSchema.index({ user: 1, listing: 1 }, { unique: true });

// Two members who can chat: either they liked each other, or a host accepted a request.
const matchSchema = new Schema(
  {
    users: { type: [ref('User')], required: true, index: true },
    listing: ref('Listing'),
    kind: { type: String, enum: ['roomie', 'listing'], default: 'roomie' },
    lastMessage: String,
    lastMessageAt: Date,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const messageSchema = new Schema(
  {
    match: { ...ref('Match'), required: true, index: true },
    from: { ...ref('User'), required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    readAt: Date,
  },
  { timestamps: true }
);

const reportSchema = new Schema(
  {
    from: ref('User'),
    user: ref('User'),
    listing: ref('Listing'),
    reason: String,
    details: String,
  },
  { timestamps: true }
);

module.exports = {
  User: model('User', userSchema),
  Listing: model('Listing', listingSchema),
  Swipe: model('Swipe', swipeSchema),
  Interest: model('Interest', interestSchema),
  Match: model('Match', matchSchema),
  Message: model('Message', messageSchema),
  Report: model('Report', reportSchema),
};
