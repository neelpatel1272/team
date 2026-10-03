const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '' }, // emoji or image URL
    color: { type: String, default: '#4F46E5' },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);
