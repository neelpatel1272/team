const Conversation = require('../models/Conversation');
const ConversationMember = require('../models/ConversationMember');
const Message = require('../models/Message');
const User = require('../models/User');
const { ok, fail } = require('../utils/apiResponse');
const { CONVERSATION_TYPE, MEMBER_ROLE } = require('../config/constants');

// List all conversations the current user belongs to, newest activity first.
async function listConversations(req, res, next) {
  try {
    const memberships = await ConversationMember.find({ user: req.user._id, leftAt: null }).select('conversation unreadCount isMuted');
    const conversationIds = memberships.map((m) => m.conversation);

    const conversations = await Conversation.find({ _id: { $in: conversationIds } })
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    // Attach other-party info for direct chats + unread counts
    const results = await Promise.all(
      conversations.map(async (conv) => {
        const membership = memberships.find((m) => String(m.conversation) === String(conv._id));
        let otherUser = null;
        let memberCount = 0;

        if (conv.type === CONVERSATION_TYPE.DIRECT) {
          const otherMember = await ConversationMember.findOne({
            conversation: conv._id,
            user: { $ne: req.user._id },
          }).populate('user', '-password');
          otherUser = otherMember ? otherMember.user : null;
        } else {
          memberCount = await ConversationMember.countDocuments({ conversation: conv._id, leftAt: null });
        }

        return {
          ...conv.toObject(),
          otherUser,
          memberCount,
          unreadCount: membership ? membership.unreadCount : 0,
          isMuted: membership ? membership.isMuted : false,
        };
      })
    );

    return ok(res, { conversations: results });
  } catch (err) {
    next(err);
  }
}

// Get or create a direct conversation with another user.
async function openDirectConversation(req, res, next) {
  try {
    const { userId } = req.body;
    if (!userId) return fail(res, 'userId is required.', 400);
    if (userId === String(req.user._id)) return fail(res, 'Cannot start a conversation with yourself.', 400);

    const otherUser = await User.findById(userId);
    if (!otherUser) return fail(res, 'User not found.', 404);

    // Find an existing direct conversation between the two users
    const myMemberships = await ConversationMember.find({ user: req.user._id }).select('conversation');
    const theirMemberships = await ConversationMember.find({ user: userId }).select('conversation');
    const myConvIds = new Set(myMemberships.map((m) => String(m.conversation)));
    const sharedConvId = theirMemberships.find((m) => myConvIds.has(String(m.conversation)));

    if (sharedConvId) {
      const existing = await Conversation.findOne({ _id: sharedConvId.conversation, type: CONVERSATION_TYPE.DIRECT });
      if (existing) return ok(res, { conversation: existing, created: false });
    }

    const conversation = await Conversation.create({
      type: CONVERSATION_TYPE.DIRECT,
      createdBy: req.user._id,
    });

    await ConversationMember.create([
      { conversation: conversation._id, user: req.user._id, role: MEMBER_ROLE.MEMBER },
      { conversation: conversation._id, user: userId, role: MEMBER_ROLE.MEMBER },
    ]);

    return ok(res, { conversation, created: true }, 'Conversation started.', 201);
  } catch (err) {
    next(err);
  }
}

// Create a group conversation.
async function createGroup(req, res, next) {
  try {
    const { name, description, memberIds = [], image } = req.body;
    if (!name) return fail(res, 'Group name is required.', 400);

    const conversation = await Conversation.create({
      type: CONVERSATION_TYPE.GROUP,
      name,
      description,
      image,
      createdBy: req.user._id,
    });

    const uniqueMemberIds = Array.from(new Set([...memberIds, String(req.user._id)]));
    await ConversationMember.create(
      uniqueMemberIds.map((uid) => ({
        conversation: conversation._id,
        user: uid,
        role: uid === String(req.user._id) ? MEMBER_ROLE.OWNER : MEMBER_ROLE.MEMBER,
      }))
    );

    return ok(res, { conversation }, 'Group created.', 201);
  } catch (err) {
    next(err);
  }
}

async function getConversation(req, res, next) {
  try {
    const conversation = await Conversation.findById(req.params.id).populate('pinnedMessages');
    if (!conversation) return fail(res, 'Conversation not found.', 404);

    const membership = await ConversationMember.findOne({ conversation: conversation._id, user: req.user._id });
    if (!membership) return fail(res, 'You are not a member of this conversation.', 403);

    const members = await ConversationMember.find({ conversation: conversation._id, leftAt: null }).populate('user', '-password');

    return ok(res, { conversation, members });
  } catch (err) {
    next(err);
  }
}

async function updateGroup(req, res, next) {
  try {
    const membership = await ConversationMember.findOne({ conversation: req.params.id, user: req.user._id });
    if (!membership || ![MEMBER_ROLE.OWNER, MEMBER_ROLE.ADMIN].includes(membership.role)) {
      return fail(res, 'Only group admins can update group details.', 403);
    }
    const { name, description, image } = req.body;
    const update = {};
    if (name) update.name = name;
    if (description !== undefined) update.description = description;
    if (image) update.image = image;

    const conversation = await Conversation.findByIdAndUpdate(req.params.id, update, { new: true });
    return ok(res, { conversation }, 'Group updated.');
  } catch (err) {
    next(err);
  }
}

async function sendSystemMessage(conversationId, content, senderId) {
  try {
    const { getIO } = require('../sockets');
    const { MESSAGE_TYPE, SOCKET_EVENTS } = require('../config/constants');
    const msg = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content,
      messageType: MESSAGE_TYPE.SYSTEM,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: msg._id,
      lastMessageAt: msg.createdAt,
    });

    const populated = await Message.findById(msg._id).populate('sender', 'firstName lastName profileImage');

    const io = getIO();
    if (io) {
      io.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, {
        conversationId: String(conversationId),
        message: populated,
      });
    }
    return populated;
  } catch (e) {
    console.error('[conversationController] sendSystemMessage error:', e);
  }
}

async function addMembers(req, res, next) {
  try {
    const { memberIds = [] } = req.body;
    const existing = await ConversationMember.find({ conversation: req.params.id }).select('user');
    const existingIds = new Set(existing.map((m) => String(m.user)));
    const newIds = memberIds.filter((id) => !existingIds.has(String(id)));

    if (newIds.length) {
      await ConversationMember.create(
        newIds.map((uid) => ({ conversation: req.params.id, user: uid, role: MEMBER_ROLE.MEMBER }))
      );

      const addedUsers = await User.find({ _id: { $in: newIds } });
      const names = addedUsers.map((u) => `${u.firstName} ${u.lastName}`).join(', ');
      await sendSystemMessage(req.params.id, `${names} joined the group`, req.user._id);
    }
    return ok(res, null, 'Members added.');
  } catch (err) {
    next(err);
  }
}

async function removeMember(req, res, next) {
  try {
    const targetUser = await User.findById(req.params.userId);
    const targetName = targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'A member';

    await ConversationMember.findOneAndUpdate(
      { conversation: req.params.id, user: req.params.userId },
      { leftAt: new Date() }
    );

    await sendSystemMessage(req.params.id, `${targetName} was removed from the group`, req.user._id);

    return ok(res, null, 'Member removed.');
  } catch (err) {
    next(err);
  }
}

async function leaveConversation(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    const userName = user ? `${user.firstName} ${user.lastName}` : 'A member';

    await ConversationMember.findOneAndUpdate(
      { conversation: req.params.id, user: req.user._id },
      { leftAt: new Date() }
    );

    await sendSystemMessage(req.params.id, `${userName} left the group`, req.user._id);

    return ok(res, null, 'You left the conversation.');
  } catch (err) {
    next(err);
  }
}

async function getPinnedMessages(req, res, next) {
  try {
    const conversation = await Conversation.findById(req.params.id).populate({
      path: 'pinnedMessages',
      populate: { path: 'sender', select: '-password' },
    });
    if (!conversation) return fail(res, 'Conversation not found.', 404);
    return ok(res, { pinnedMessages: conversation.pinnedMessages });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listConversations,
  openDirectConversation,
  createGroup,
  getConversation,
  updateGroup,
  addMembers,
  removeMember,
  leaveConversation,
  getPinnedMessages,
};
