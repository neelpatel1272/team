const mongoose = require('mongoose');
const { MEMBER_ROLE } = require('../config/constants');

const conversationMemberSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: Object.values(MEMBER_ROLE), default: MEMBER_ROLE.MEMBER },
    lastReadMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    lastReadAt: { type: Date },
    unreadCount: { type: Number, default: 0 },
    isMuted: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
  },
  { timestamps: true }
);

conversationMemberSchema.index({ conversation: 1, user: 1 }, { unique: true });
conversationMemberSchema.index({ user: 1 });

module.exports = mongoose.model('ConversationMember', conversationMemberSchema);
