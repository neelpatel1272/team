const mongoose = require('mongoose');
const { CALL_TYPE, CALL_STATUS } = require('../config/constants');

const callSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    callee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(CALL_TYPE), required: true },
    status: { type: String, enum: Object.values(CALL_STATUS), default: CALL_STATUS.RINGING },
    startedAt: { type: Date, default: Date.now },
    connectedAt: { type: Date },
    endedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

callSchema.index({ caller: 1, createdAt: -1 });
callSchema.index({ callee: 1, createdAt: -1 });

module.exports = mongoose.model('Call', callSchema);
