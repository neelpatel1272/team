const User = require('../models/User');
const { SOCKET_EVENTS, PRESENCE_STATUS } = require('../config/constants');

function registerPresenceHandlers(io, socket, { onlineUsers, isUserOnline }) {
  const userId = String(socket.user._id);

  // Mark online + broadcast, then send the requester a snapshot of who else is online.
  (async () => {
    await User.findByIdAndUpdate(userId, { status: PRESENCE_STATUS.ONLINE, lastSeen: new Date() });
    io.emit(SOCKET_EVENTS.USER_ONLINE, { userId, status: PRESENCE_STATUS.ONLINE });

    const onlineIds = Array.from(onlineUsers.keys());
    socket.emit(SOCKET_EVENTS.PRESENCE_SYNC, { onlineUserIds: onlineIds });
  })();

  socket.on(SOCKET_EVENTS.USER_STATUS_CHANGE, async ({ status }) => {
    if (!Object.values(PRESENCE_STATUS).includes(status)) return;
    await User.findByIdAndUpdate(userId, { status });
    io.emit(SOCKET_EVENTS.USER_STATUS_CHANGE, { userId, status });
  });
}

// Called once a user's LAST socket disconnects (i.e. they closed every tab / logged out).
async function handleFullyOffline(io, socket) {
  const userId = String(socket.user._id);
  const now = new Date();
  await User.findByIdAndUpdate(userId, { status: PRESENCE_STATUS.OFFLINE, lastSeen: now });
  io.emit(SOCKET_EVENTS.USER_OFFLINE, { userId, status: PRESENCE_STATUS.OFFLINE, lastSeen: now });
}

registerPresenceHandlers.handleFullyOffline = handleFullyOffline;
module.exports = registerPresenceHandlers;
