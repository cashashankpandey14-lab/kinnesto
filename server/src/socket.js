const { Server } = require('socket.io');
const { verifyToken } = require('./middleware/auth');
const { config } = require('./config');
const { User } = require('./models');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) } });

  io.use(async (socket, next) => {
    try {
      socket.userId = verifyToken(socket.handshake.auth?.token);
      const user = await User.findById(socket.userId).select('banned');
      if (!user || user.banned) return next(new Error('unauthorized'));
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
  });
}

// Drops a member's live connections (used when they are banned).
function disconnectUser(userId) {
  if (io) io.in(`user:${String(userId)}`).disconnectSockets(true);
}

function emitToUser(userId, event, payload) {
  if (io) io.to(`user:${String(userId)}`).emit(event, payload);
}

// Everyone currently connected. Used for announcements; people who are offline pick them up
// from the notifications list the next time they open the app.
function emitToAll(event, payload) {
  if (io) io.emit(event, payload);
}

module.exports = { initSocket, emitToUser, emitToAll, disconnectUser };
