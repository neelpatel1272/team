const crypto = require('crypto');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const { ok, fail } = require('../utils/apiResponse');
const { PRESENCE_STATUS } = require('../config/constants');

async function register(req, res, next) {
  try {
    const { firstName, lastName, email, password, department, jobTitle, employeeId } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return fail(res, 'First name, last name, email and password are required.', 400);
    }
    if (password.length < 8) {
      return fail(res, 'Password must be at least 8 characters.', 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return fail(res, 'An account with this email already exists.', 409);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      department,
      jobTitle,
      employeeId,
      status: PRESENCE_STATUS.OFFLINE,
    });

    const token = signToken(user._id);
    return ok(res, { user: user.toSafeObject(), token }, 'Account created successfully.', 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, 'Email and password are required.', 400);

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return fail(res, 'Invalid email or password.', 401);
    }
    if (!user.isActive) return fail(res, 'This account has been deactivated.', 403);

    const token = signToken(user._id);
    return ok(res, { user: user.toSafeObject(), token }, 'Logged in successfully.');
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  return ok(res, { user: req.user.toSafeObject() });
}

async function logout(req, res) {
  if (req.user?._id) {
    await User.findByIdAndUpdate(req.user._id, { status: PRESENCE_STATUS.OFFLINE, lastSeen: new Date() });
  }
  return ok(res, null, 'Logged out.');
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });

    // Always respond the same way to avoid leaking which emails exist.
    if (!user) return ok(res, null, 'If that email exists, a reset link has been sent.');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // In production this would be emailed via a transactional email service.
    // For local dev/testing we log the reset link to the server console.
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    console.log(`[auth] Password reset link for ${user.email}: ${resetUrl}`);

    return ok(res, { devResetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined }, 'If that email exists, a reset link has been sent.');
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) return fail(res, 'Missing required fields.', 400);
    if (password.length < 8) return fail(res, 'Password must be at least 8 characters.', 400);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) return fail(res, 'This reset link is invalid or has expired.', 400);

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const jwtToken = signToken(user._id);
    return ok(res, { token: jwtToken }, 'Password reset successfully.');
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, logout, forgotPassword, resetPassword };
