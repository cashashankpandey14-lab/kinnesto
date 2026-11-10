const { Server } = require('socket.io');
const { verifyToken } = require('./middleware/auth');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: '*' } });

  io.use((socket, next) => {
    try {
      socket.userId = verifyToken(socket.handshake.auth?.token);
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
  });
}

function emitToUser(userId, event, payload) {
  if (io) io.to(`user:${String(userId)}`).emit(event, payload);
}

module.exports = { initSocket, emitToUser };
