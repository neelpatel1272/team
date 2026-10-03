const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const ConversationMember = require('../models/ConversationMember');
const Notification = require('../models/Notification');
const { NOTIFICATION_TYPE } = require('../config/constants');

const POPULATE_SENDER = { path: 'sender', select: '-password' };
const POPULATE_ATTACHMENTS = { path: 'attachments' };
const POPULATE_REPLY = {
  path: 'replyTo',
  populate: { path: 'sender', select: 'firstName lastName' },
};
const POPULATE_REACTIONS = { path: 'reactions', populate: { path: 'user', select: 'firstName lastName' } };

async function populateMessage(message) {
  return message.populate([POPULATE_SENDER, POPULATE_ATTACHMENTS, POPULATE_REPLY, POPULATE_REACTIONS]);
}

async function createMessage({ conversationId, senderId, content, messageType, attachmentIds, replyTo, mentions, voiceDuration }) {
  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    content: content || '',
    messageType: messageType || 'text',
    attachments: attachmentIds || [],
    replyTo: replyTo || null,
    mentions: mentions || [],
    voiceDuration,
    deliveredTo: [senderId],
    readBy: [{ user: senderId, readAt: new Date() }],
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    lastMessageAt: new Date(),
  });

  // Bump unread counters for every other member of the conversation
  await ConversationMember.updateMany(
    { conversation: conversationId, user: { $ne: senderId }, leftAt: null },
    { $inc: { unreadCount: 1 } }
  );

  return populateMessage(message);
}

async function createNotificationsForMessage(message, conversation) {
  const members = await ConversationMember.find({
    conversation: conversation._id,
    user: { $ne: message.sender._id || message.sender },
    leftAt: null,
  });

  const mentionSet = new Set((message.mentions || []).map((m) => String(m._id || m)));

  const notifications = members.map((member) => {
    const isMentioned = mentionSet.has(String(member.user));
    return {
      recipient: member.user,
      sender: message.sender._id || message.sender,
      type: isMentioned ? NOTIFICATION_TYPE.MENTION : NOTIFICATION_TYPE.MESSAGE,
      title: isMentioned ? 'You were mentioned' : 'New message',
      body: message.content?.slice(0, 140) || '',
      conversation: conversation._id,
      message: message._id,
    };
  });

  if (notifications.length) return Notification.insertMany(notifications);
  return [];
}

module.exports = { createMessage, populateMessage, createNotificationsForMessage };
