const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const Conversation = require('../models/Conversation');
const ConversationMember = require('../models/ConversationMember');
const { ok, fail } = require('../utils/apiResponse');
const { CONVERSATION_TYPE, MEMBER_ROLE } = require('../config/constants');

async function listTeams(req, res, next) {
  try {
    const memberships = await TeamMember.find({ user: req.user._id }).select('team');
    const teamIds = memberships.map((m) => m.team);
    const teams = await Team.find({ _id: { $in: teamIds } })
      .populate('conversation')
      .populate('createdBy', 'firstName lastName email profileImage');

    const withCounts = await Promise.all(
      teams.map(async (team) => ({
        ...team.toObject(),
        memberCount: await TeamMember.countDocuments({ team: team._id }),
      }))
    );

    return ok(res, { teams: withCounts });
  } catch (err) {
    next(err);
  }
}

async function createTeam(req, res, next) {
  try {
    const { name, description, icon, color, memberIds = [] } = req.body;
    if (!name) return fail(res, 'Team name is required.', 400);

    const conversation = await Conversation.create({
      type: CONVERSATION_TYPE.TEAM,
      name,
      description,
      createdBy: req.user._id,
    });

    const team = await Team.create({ name, description, icon, color, conversation: conversation._id, createdBy: req.user._id });
    conversation.team = team._id;
    await conversation.save();

    const uniqueMemberIds = Array.from(new Set([...memberIds, String(req.user._id)]));
    await Promise.all([
      TeamMember.create(
        uniqueMemberIds.map((uid) => ({ team: team._id, user: uid, role: uid === String(req.user._id) ? MEMBER_ROLE.OWNER : MEMBER_ROLE.MEMBER }))
      ),
      ConversationMember.create(
        uniqueMemberIds.map((uid) => ({ conversation: conversation._id, user: uid, role: uid === String(req.user._id) ? MEMBER_ROLE.OWNER : MEMBER_ROLE.MEMBER }))
      ),
    ]);

    return ok(res, { team, conversation }, 'Team created.', 201);
  } catch (err) {
    next(err);
  }
}

async function getTeam(req, res, next) {
  try {
    const team = await Team.findById(req.params.id)
      .populate('conversation')
      .populate('createdBy', 'firstName lastName email profileImage');
    if (!team) return fail(res, 'Team not found.', 404);

    const members = await TeamMember.find({ team: team._id }).populate('user', '-password');
    return ok(res, { team, members });
  } catch (err) {
    next(err);
  }
}

const User = require('../models/User');
const Message = require('../models/Message');

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
    console.error('[teamController] sendSystemMessage error:', e);
  }
}

async function addTeamMembers(req, res, next) {
  try {
    const { memberIds = [] } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return fail(res, 'Team not found.', 404);

    const existing = await TeamMember.find({ team: team._id }).select('user');
    const existingIds = new Set(existing.map((m) => String(m.user)));
    const newIds = memberIds.filter((id) => !existingIds.has(String(id)));

    if (newIds.length) {
      await TeamMember.create(newIds.map((uid) => ({ team: team._id, user: uid, role: MEMBER_ROLE.MEMBER })));
      if (team.conversation) {
        await ConversationMember.create(newIds.map((uid) => ({ conversation: team.conversation, user: uid, role: MEMBER_ROLE.MEMBER })));
        const addedUsers = await User.find({ _id: { $in: newIds } });
        const names = addedUsers.map((u) => `${u.firstName} ${u.lastName}`).join(', ');
        await sendSystemMessage(team.conversation, `${names} joined the team`, req.user._id);
      }
    }

    return ok(res, null, 'Members added to team.');
  } catch (err) {
    next(err);
  }
}

async function removeTeamMember(req, res, next) {
  try {
    const { id, userId } = req.params;
    const team = await Team.findById(id);
    if (!team) return fail(res, 'Team not found.', 404);

    const creatorId = String(team.createdBy?._id || team.createdBy);
    const requesterId = String(req.user._id);
    const targetUserId = String(userId);

    const isCreator = creatorId === requesterId;
    const isSelfLeave = targetUserId === requesterId;

    if (!isCreator && !isSelfLeave) {
      return fail(res, 'Only the team creator can remove members from this team.', 403);
    }

    if (isCreator && isSelfLeave) {
      return fail(res, 'The team creator cannot be removed. You can delete the team instead.', 400);
    }

    const targetUser = await User.findById(targetUserId);
    const targetName = targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'A member';

    await TeamMember.deleteOne({ team: team._id, user: targetUserId });
    if (team.conversation) {
      await ConversationMember.deleteOne({ conversation: team.conversation, user: targetUserId });
      const actionText = isSelfLeave ? `${targetName} left the team` : `${targetName} was removed from the team`;
      await sendSystemMessage(team.conversation, actionText, req.user._id);
    }

    return ok(res, null, 'Member removed from team.');
  } catch (err) {
    next(err);
  }
}

async function deleteTeam(req, res, next) {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return fail(res, 'Team not found.', 404);

    const creatorId = String(team.createdBy?._id || team.createdBy);
    if (creatorId !== String(req.user._id)) {
      return fail(res, 'Only the team creator can delete this team.', 403);
    }

    await TeamMember.deleteMany({ team: team._id });
    if (team.conversation) {
      await ConversationMember.deleteMany({ conversation: team.conversation });
      await Message.deleteMany({ conversation: team.conversation });
      await Conversation.findByIdAndDelete(team.conversation);
    }
    await Team.findByIdAndDelete(team._id);

    return ok(res, null, 'Team deleted successfully.');
  } catch (err) {
    next(err);
  }
}

module.exports = { listTeams, createTeam, getTeam, addTeamMembers, removeTeamMember, deleteTeam };
