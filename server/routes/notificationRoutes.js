const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { listNotifications, markRead, markAllRead, markConversationRead } = require('../controllers/notificationController');

router.use(protect);

router.get('/', listNotifications);
router.patch('/read-all', markAllRead);
router.patch('/conversation/:conversationId/read', markConversationRead);
router.patch('/:id/read', markRead);

module.exports = router;
