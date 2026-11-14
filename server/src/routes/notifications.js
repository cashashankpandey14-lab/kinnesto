const express = require('express');
const { Notification } = require('../models');

const router = express.Router();
const LIMIT = 50;

const present = (n) => ({ id: String(n._id), title: n.title, body: n.body, createdAt: n.createdAt });

// The announcements a member can see, newest first, with how many arrived since they last looked.
router.get('/', async (req, res) => {
  const items = await Notification.find({ audience: 'all' }).sort({ createdAt: -1 }).limit(LIMIT);
  const readAt = req.user.notificationsReadAt;
  res.json({
    notifications: items.map(present),
    unread: readAt ? items.filter((n) => n.createdAt > readAt).length : items.length,
  });
});

router.post('/read', async (req, res) => {
  req.user.notificationsReadAt = new Date();
  await req.user.save();
  res.json({ ok: true });
});

module.exports = router;
module.exports.present = present;
