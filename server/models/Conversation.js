const mongoose = require('mongoose');
const { CONVERSATION_TYPE } = require('../config/constants');

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(CONVERSATION_TYPE),
      required: true,
      default: CONVERSATION_TYPE.DIRECT,
    },
    name: { type: String, trim: true }, // group/team name; unused for direct
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }, // set when type === 'team'
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date, default: Date.now },
    pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

conversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
