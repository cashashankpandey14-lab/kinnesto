const { User, Listing, Swipe, Interest, Match, Message } = require('../models');
const { deletePhoto } = require('./upload');

// Permanently removes a member and everything tied to them: listings, swipes, requests, chats and photos.
async function deleteUserData(id) {
  const [user, listings, matches] = await Promise.all([User.findById(id), Listing.find({ owner: id }).select('photos'), Match.find({ users: id }).select('_id')]);
  const photos = [...(user?.photos || []), ...listings.flatMap((l) => l.photos)].filter((p) => p.includes('/uploads/'));
  await Promise.all([
    Message.deleteMany({ match: { $in: matches.map((m) => m._id) } }),
    Match.deleteMany({ users: id }),
    Swipe.deleteMany({ $or: [{ from: id }, { to: id }] }),
    Interest.deleteMany({ $or: [{ user: id }, { owner: id }, { listing: { $in: listings.map((l) => l._id) } }] }),
    Listing.deleteMany({ owner: id }),
  ]);
  await User.deleteOne({ _id: id });
  await Promise.all(photos.map((p) => deletePhoto(p).catch(() => {})));
}

module.exports = { deleteUserData };
