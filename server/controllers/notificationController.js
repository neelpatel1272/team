const Notification = require('../models/Notification');
const { ok } = require('../utils/apiResponse');

async function listNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .limit(100);

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    return ok(res, { notifications, unreadCount });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { isRead: true });
    return ok(res, null, 'Marked as read.');
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    return ok(res, null, 'All notifications marked as read.');
  } catch (err) {
    next(err);
  }
}

async function markConversationRead(req, res, next) {
  try {
    const { conversationId } = req.params;
    await Notification.updateMany({ recipient: req.user._id, conversation: conversationId, isRead: false }, { isRead: true });
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    return ok(res, { unreadCount }, 'Conversation notifications marked as read.');
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, markRead, markAllRead, markConversationRead };
