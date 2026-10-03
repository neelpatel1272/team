const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  getMessages,
  editMessage,
  deleteMessage,
  reactToMessage,
  pinMessage,
  forwardMessage,
  searchMessages,
} = require('../controllers/messageController');

router.use(protect);

router.get('/search', searchMessages);
router.get('/conversation/:conversationId', getMessages);
router.patch('/:id', editMessage);
router.delete('/:id', deleteMessage);
router.post('/:id/react', reactToMessage);
router.post('/:id/pin', pinMessage);
router.post('/:id/forward', forwardMessage);

module.exports = router;
