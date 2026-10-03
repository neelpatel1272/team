const mongoose = require('mongoose');
const { MEMBER_ROLE } = require('../config/constants');

const teamMemberSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: Object.values(MEMBER_ROLE), default: MEMBER_ROLE.MEMBER },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

teamMemberSchema.index({ team: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
