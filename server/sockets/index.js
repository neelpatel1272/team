const { authenticateSocketToken } = require('../middleware/auth');
const registerPresenceHandlers = require('./presence');
const registerMessageHandlers = require('./messageSocket');
const registerCallHandlers = require('./callSocket');
const { SOCKET_EVENTS } = require('../config/constants');

// Tracks userId -> Set of connected socket ids (a user can have multiple tabs/devices)
const onlineUsers = new Map();

function addOnlineSocket(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}

function removeOnlineSocket(userId, socketId) {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return false;
  sockets.delete(socketId);
  const isFullyOffline = sockets.size === 0;
  if (isFullyOffline) onlineUsers.delete(userId);
  return isFullyOffline;
}

function isUserOnline(userId) {
  return onlineUsers.has(String(userId));
}

let ioInstance = null;

function getIO() {
  return ioInstance;
}

function initSocket(io) {
  ioInstance = io;
  // Auth middleware for every socket connection — expects { token } in handshake.auth
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const user = await authenticateSocketToken(token);
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    const userId = String(socket.user._id);
    addOnlineSocket(userId, socket.id);

    // Personal room lets us push events (notifications, calls) to a user
    // regardless of which conversation room they're currently in.
    socket.join(`user:${userId}`);

    registerPresenceHandlers(io, socket, { onlineUsers, isUserOnline });
    registerMessageHandlers(io, socket);
    registerCallHandlers(io, socket, { isUserOnline });

    socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
      const wentFullyOffline = removeOnlineSocket(userId, socket.id);
      if (wentFullyOffline) {
        try {
          const Call = require('../models/Call');
          const { CALL_STATUS } = require('../config/constants');
          await Call.updateMany(
            { $or: [{ caller: userId }, { callee: userId }], status: CALL_STATUS.RINGING },
            { status: CALL_STATUS.MISSED, endedAt: new Date() }
          );
        } catch (e) {
          // ignore
        }
        const presence = require('./presence');
        await presence.handleFullyOffline(io, socket);
      }
    });
  });
}

module.exports = { initSocket, getIO, isUserOnline, onlineUsers };
