const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    category: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'other'],
      default: 'other',
    },
    size: { type: Number, required: true }, // bytes
    url: { type: String, required: true }, // relative path, e.g. /uploads/documents/xyz.pdf
    thumbnailUrl: { type: String },
    width: { type: Number },
    height: { type: Number },
    duration: { type: Number }, // for audio/video
  },
  { timestamps: true }
);

attachmentSchema.index({ conversation: 1, category: 1 });

module.exports = mongoose.model('Attachment', attachmentSchema);
