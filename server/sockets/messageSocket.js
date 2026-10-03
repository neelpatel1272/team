const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const ConversationMember = require('../models/ConversationMember');
const Reaction = require('../models/Reaction');
const Notification = require('../models/Notification');
const { createMessage, populateMessage, createNotificationsForMessage } = require('../services/messageService');
const { SOCKET_EVENTS } = require('../config/constants');

function roomFor(conversationId) {
  return `conversation:${conversationId}`;
}

function registerMessageHandlers(io, socket) {
  const userId = String(socket.user._id);

  socket.on(SOCKET_EVENTS.CONVERSATION_JOIN, async ({ conversationId }) => {
    const isMember = await ConversationMember.exists({ conversation: conversationId, user: userId, leftAt: null });
    if (!isMember) return socket.emit(SOCKET_EVENTS.SOCKET_ERROR, { message: 'Not a member of this conversation.' });
    socket.join(roomFor(conversationId));

    // Auto-clear notification activity for this conversation
    try {
      await Notification.updateMany({ recipient: userId, conversation: conversationId, isRead: false }, { isRead: true });
      const unreadNotifs = await Notification.countDocuments({ recipient: userId, isRead: false });
      socket.emit('notification:conversation-cleared', { conversationId, unreadCount: unreadNotifs });
    } catch (e) {
      // ignore
    }
  });

  socket.on(SOCKET_EVENTS.CONVERSATION_LEAVE, ({ conversationId }) => {
    socket.leave(roomFor(conversationId));
  });

  socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload, callback) => {
    try {
      const { conversationId, content, messageType, attachmentIds, replyTo, mentions, voiceDuration } = payload;

      const isMember = await ConversationMember.exists({ conversation: conversationId, user: userId, leftAt: null });
      if (!isMember) throw new Error('Not a member of this conversation.');

      const message = await createMessage({
        conversationId,
        senderId: userId,
        content,
        messageType,
        attachmentIds,
        replyTo,
        mentions,
        voiceDuration,
      });

      io.to(roomFor(conversationId)).emit(SOCKET_EVENTS.MESSAGE_NEW, { message, conversationId });

      const conversation = await Conversation.findById(conversationId);
      const notifications = await createNotificationsForMessage(message, conversation);
      notifications.forEach((n) => {
        io.to(`user:${n.recipient}`).emit(SOCKET_EVENTS.NOTIFICATION_NEW, { notification: n });
      });

      if (typeof callback === 'function') callback({ success: true, message });
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
      socket.emit(SOCKET_EVENTS.SOCKET_ERROR, { message: 'Unable to send message. Please try again.' });
    }
  });

  socket.on(SOCKET_EVENTS.MESSAGE_EDIT, async ({ messageId, content }) => {
    const message = await Message.findById(messageId);
    if (!message || String(message.sender) !== userId) return;
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();
    io.to(roomFor(message.conversation)).emit(SOCKET_EVENTS.MESSAGE_EDITED, { message: await populateMessage(message) });
  });

  socket.on(SOCKET_EVENTS.MESSAGE_DELETE, async ({ messageId }) => {
    const message = await Message.findById(messageId);
    if (!message || String(message.sender) !== userId) return;
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = '';
    await message.save();
    io.to(roomFor(message.conversation)).emit(SOCKET_EVENTS.MESSAGE_DELETED, { messageId, conversationId: message.conversation });
  });

  socket.on(SOCKET_EVENTS.MESSAGE_REACT, async ({ messageId, emoji }) => {
    const message = await Message.findById(messageId);
    if (!message) return;

    const existing = await Reaction.findOne({ message: message._id, user: userId, emoji });
    if (existing) {
      await existing.deleteOne();
      message.reactions = message.reactions.filter((r) => String(r) !== String(existing._id));
    } else {
      const reaction = await Reaction.create({ message: message._id, user: userId, emoji });
      message.reactions.push(reaction._id);
    }
    await message.save();

    io.to(roomFor(message.conversation)).emit(SOCKET_EVENTS.MESSAGE_REACTION_UPDATED, {
      message: await populateMessage(message),
    });
  });

  socket.on(SOCKET_EVENTS.MESSAGE_PIN, async ({ messageId }) => {
    const message = await Message.findById(messageId);
    if (!message) return;
    const conversation = await Conversation.findById(message.conversation);
    const isPinned = conversation.pinnedMessages.some((id) => String(id) === String(message._id));

    if (isPinned) {
      conversation.pinnedMessages = conversation.pinnedMessages.filter((id) => String(id) !== String(message._id));
      message.isPinned = false;
    } else {
      conversation.pinnedMessages.push(message._id);
      message.isPinned = true;
    }
    await conversation.save();
    await message.save();

    io.to(roomFor(message.conversation)).emit(SOCKET_EVENTS.MESSAGE_PINNED, { messageId, pinned: message.isPinned });
  });

  // Read receipts: mark all messages up to `messageId` as read by this user.
  socket.on(SOCKET_EVENTS.MESSAGE_READ, async ({ conversationId, messageId }) => {
    await Message.updateMany(
      { conversation: conversationId, _id: { $lte: messageId }, 'readBy.user': { $ne: userId } },
      { $push: { readBy: { user: userId, readAt: new Date() } } }
    );
    await ConversationMember.findOneAndUpdate(
      { conversation: conversationId, user: userId },
      { unreadCount: 0, lastReadMessage: messageId, lastReadAt: new Date() }
    );
    try {
      await Notification.updateMany(
        { recipient: userId, conversation: conversationId, isRead: false },
        { isRead: true }
      );
      const unreadNotifs = await Notification.countDocuments({ recipient: userId, isRead: false });
      socket.emit('notification:conversation-cleared', { conversationId, unreadCount: unreadNotifs });
    } catch (e) {
      // ignore
    }
    socket.to(roomFor(conversationId)).emit(SOCKET_EVENTS.MESSAGE_READ, { conversationId, messageId, userId });
  });

  // Typing indicators — fire-and-forget, debounced client-side to avoid event spam.
  socket.on(SOCKET_EVENTS.TYPING_START, ({ conversationId }) => {
    socket.to(roomFor(conversationId)).emit(SOCKET_EVENTS.TYPING_START, {
      conversationId,
      userId,
      name: `${socket.user.firstName} ${socket.user.lastName}`,
    });
  });

  socket.on(SOCKET_EVENTS.TYPING_STOP, ({ conversationId }) => {
    socket.to(roomFor(conversationId)).emit(SOCKET_EVENTS.TYPING_STOP, { conversationId, userId });
  });
}

module.exports = registerMessageHandlers;
