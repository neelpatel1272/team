const User = require('../models/User');
const { ok, fail } = require('../utils/apiResponse');

async function listUsers(req, res, next) {
  try {
    const { department, q, includeSelf } = req.query;
    const filter = { isActive: true };
    if (includeSelf !== 'true') {
      filter._id = { $ne: req.user._id };
    }
    if (department) filter.department = department;
    if (q) filter.$text = { $search: q };

    const users = await User.find(filter).select('-password').sort({ firstName: 1 }).limit(200);
    return ok(res, { users });
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return fail(res, 'User not found.', 404);
    return ok(res, { user });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const allowed = ['firstName', 'lastName', 'department', 'jobTitle', 'employeeId', 'phone', 'about', 'profileImage'];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    return ok(res, { user: user.toSafeObject() }, 'Profile updated.');
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const { theme, notifications } = req.body;
    const update = {};
    if (theme) update['settings.theme'] = theme;
    if (notifications) {
      Object.entries(notifications).forEach(([key, val]) => {
        update[`settings.notifications.${key}`] = val;
      });
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true });
    return ok(res, { user: user.toSafeObject() }, 'Settings updated.');
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return fail(res, 'Both current and new password are required.', 400);
    if (newPassword.length < 8) return fail(res, 'New password must be at least 8 characters.', 400);

    const user = await User.findById(req.user._id).select('+password');
    const matches = await user.comparePassword(currentPassword);
    if (!matches) return fail(res, 'Current password is incorrect.', 401);

    user.password = newPassword;
    await user.save();
    return ok(res, null, 'Password changed successfully.');
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { status }, { new: true });
    // Real-time broadcast happens via socket presence handlers, not here,
    // since this REST endpoint has no socket reference. The client also
    // emits `user:status-change` over the socket for instant propagation.
    return ok(res, { user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, getUser, updateProfile, updateSettings, changePassword, updateStatus };
