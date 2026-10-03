const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Reaction = require('../models/Reaction');
const { ok, fail } = require('../utils/apiResponse');
const { populateMessage } = require('../services/messageService');

// Paginated message history for a conversation (newest last, like a chat feed).
async function getMessages(req, res, next) {
  try {
    const { before, limit = 30 } = req.query;
    const filter = { conversation: req.params.conversationId, isDeleted: false };
    if (before) filter.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(filter)
      .populate('sender', '-password')
      .populate('attachments')
      .populate({ path: 'replyTo', populate: { path: 'sender', select: 'firstName lastName' } })
      .populate({ path: 'reactions', populate: { path: 'user', select: 'firstName lastName' } })
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return ok(res, { messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
}

async function editMessage(req, res, next) {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return fail(res, 'Message not found.', 404);
    if (String(message.sender) !== String(req.user._id)) return fail(res, 'You can only edit your own messages.', 403);

    message.content = req.body.content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    return ok(res, { message: await populateMessage(message) }, 'Message updated.');
  } catch (err) {
    next(err);
  }
}

async function deleteMessage(req, res, next) {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return fail(res, 'Message not found.', 404);
    if (String(message.sender) !== String(req.user._id)) return fail(res, 'You can only delete your own messages.', 403);

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = '';
    await message.save();

    return ok(res, { messageId: message._id }, 'Message deleted.');
  } catch (err) {
    next(err);
  }
}

async function reactToMessage(req, res, next) {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return fail(res, 'Message not found.', 404);

    const existing = await Reaction.findOne({ message: message._id, user: req.user._id, emoji });
    if (existing) {
      await existing.deleteOne();
      message.reactions = message.reactions.filter((r) => String(r) !== String(existing._id));
    } else {
      const reaction = await Reaction.create({ message: message._id, user: req.user._id, emoji });
      message.reactions.push(reaction._id);
    }
    await message.save();

    return ok(res, { message: await populateMessage(message) });
  } catch (err) {
    next(err);
  }
}

async function pinMessage(req, res, next) {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return fail(res, 'Message not found.', 404);

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

    return ok(res, { message, pinned: !isPinned });
  } catch (err) {
    next(err);
  }
}

async function forwardMessage(req, res, next) {
  try {
    const { targetConversationIds = [] } = req.body;
    const original = await Message.findById(req.params.id).populate('attachments');
    if (!original) return fail(res, 'Message not found.', 404);

    const created = [];
    for (const convId of targetConversationIds) {
      const forwarded = await Message.create({
        conversation: convId,
        sender: req.user._id,
        content: original.content,
        messageType: original.messageType,
        attachments: original.attachments.map((a) => a._id),
        forwardedFrom: original._id,
        deliveredTo: [req.user._id],
        readBy: [{ user: req.user._id, readAt: new Date() }],
      });
      await Conversation.findByIdAndUpdate(convId, { lastMessage: forwarded._id, lastMessageAt: new Date() });
      created.push(await populateMessage(forwarded));
    }

    return ok(res, { messages: created }, 'Message forwarded.');
  } catch (err) {
    next(err);
  }
}

// Full-text search across the conversations the user belongs to.
async function searchMessages(req, res, next) {
  try {
    const { q, conversationId } = req.query;
    if (!q) return fail(res, 'Search query is required.', 400);

    const filter = { $text: { $search: q }, isDeleted: false };
    if (conversationId) filter.conversation = conversationId;

    const messages = await Message.find(filter)
      .populate('sender', 'firstName lastName profileImage')
      .populate('conversation')
      .limit(50)
      .sort({ createdAt: -1 });

    return ok(res, { messages });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMessages,
  editMessage,
  deleteMessage,
  reactToMessage,
  pinMessage,
  forwardMessage,
  searchMessages,
};
