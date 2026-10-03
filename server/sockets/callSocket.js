const Call = require('../models/Call');
const Notification = require('../models/Notification');
const { SOCKET_EVENTS, CALL_STATUS, NOTIFICATION_TYPE } = require('../config/constants');

// This module only relays signaling data (SDP offers/answers, ICE candidates)
// between two specific users' personal rooms. The actual audio/video stream
// is a direct peer-to-peer WebRTC connection between the two browsers —
// it never touches this server.

function registerCallHandlers(io, socket, { isUserOnline }) {
  const userId = String(socket.user._id);

  // Caller initiates a call
  socket.on(SOCKET_EVENTS.CALL_INVITE, async ({ calleeId, type, conversationId }, callback) => {
    if (!isUserOnline(calleeId)) {
      socket.emit(SOCKET_EVENTS.CALL_BUSY, { calleeId, reason: 'offline' });
      if (typeof callback === 'function') callback({ success: false, reason: 'offline' });
      return;
    }

    const call = await Call.create({
      conversation: conversationId,
      caller: userId,
      callee: calleeId,
      type,
      status: CALL_STATUS.RINGING,
    });

    io.to(`user:${calleeId}`).emit(SOCKET_EVENTS.CALL_RINGING, {
      callId: call._id,
      type,
      conversationId,
      caller: {
        id: userId,
        name: `${socket.user.firstName} ${socket.user.lastName}`,
        profileImage: socket.user.profileImage,
      },
    });

    await Notification.create({
      recipient: calleeId,
      sender: userId,
      type: NOTIFICATION_TYPE.CALL,
      title: `Incoming ${type} call`,
      body: `${socket.user.firstName} ${socket.user.lastName} is calling you`,
      call: call._id,
    });

    if (typeof callback === 'function') callback({ success: true, callId: call._id });
  });

  socket.on(SOCKET_EVENTS.CALL_ACCEPT, async ({ callId, callerId }) => {
    await Call.findByIdAndUpdate(callId, { status: CALL_STATUS.ONGOING, connectedAt: new Date() });
    io.to(`user:${callerId}`).emit(SOCKET_EVENTS.CALL_ACCEPT, { callId, calleeId: userId });
  });

  socket.on(SOCKET_EVENTS.CALL_REJECT, async ({ callId, callerId }) => {
    await Call.findByIdAndUpdate(callId, { status: CALL_STATUS.DECLINED, endedAt: new Date() });
    io.to(`user:${callerId}`).emit(SOCKET_EVENTS.CALL_REJECT, { callId, calleeId: userId });
  });

  socket.on(SOCKET_EVENTS.CALL_END, async ({ callId, otherUserId }) => {
    const call = await Call.findById(callId);
    if (call) {
      const durationSeconds = call.connectedAt ? Math.round((Date.now() - call.connectedAt.getTime()) / 1000) : 0;
      call.status = call.connectedAt ? CALL_STATUS.ENDED : CALL_STATUS.MISSED;
      call.endedAt = new Date();
      call.durationSeconds = durationSeconds;
      await call.save();
    }
    io.to(`user:${otherUserId}`).emit(SOCKET_EVENTS.CALL_END, { callId, endedBy: userId });
  });

  // --- WebRTC signaling relay ---
  socket.on(SOCKET_EVENTS.CALL_OFFER, ({ targetUserId, sdp, callId }) => {
    io.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.CALL_OFFER, { fromUserId: userId, sdp, callId });
  });

  socket.on(SOCKET_EVENTS.CALL_ANSWER, ({ targetUserId, sdp, callId }) => {
    io.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.CALL_ANSWER, { fromUserId: userId, sdp, callId });
  });

  socket.on(SOCKET_EVENTS.CALL_ICE_CANDIDATE, ({ targetUserId, candidate, callId }) => {
    io.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.CALL_ICE_CANDIDATE, { fromUserId: userId, candidate, callId });
  });

  socket.on(SOCKET_EVENTS.SCREEN_SHARE_START, ({ targetUserId, callId }) => {
    io.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.SCREEN_SHARE_START, { fromUserId: userId, callId });
  });

  socket.on(SOCKET_EVENTS.SCREEN_SHARE_STOP, ({ targetUserId, callId }) => {
    io.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.SCREEN_SHARE_STOP, { fromUserId: userId, callId });
  });
}

module.exports = registerCallHandlers;
