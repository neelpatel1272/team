const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { PRESENCE_STATUS } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    profileImage: { type: String, default: '' },
    department: { type: String, default: 'General' },
    jobTitle: { type: String, default: '' },
    employeeId: { type: String, default: '' },
    phone: { type: String, default: '' },
    about: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(PRESENCE_STATUS),
      default: PRESENCE_STATUS.OFFLINE,
    },
    lastSeen: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    settings: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      notifications: {
        messages: { type: Boolean, default: true },
        calls: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        sound: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

userSchema.index({ firstName: 'text', lastName: 'text', email: 'text', department: 'text' });

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
