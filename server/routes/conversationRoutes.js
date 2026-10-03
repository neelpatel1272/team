const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  listConversations,
  openDirectConversation,
  createGroup,
  getConversation,
  updateGroup,
  addMembers,
  removeMember,
  leaveConversation,
  getPinnedMessages,
} = require('../controllers/conversationController');

router.use(protect);

router.get('/', listConversations);
router.post('/direct', openDirectConversation);
router.post('/group', createGroup);
router.get('/:id', getConversation);
router.patch('/:id', updateGroup);
router.post('/:id/members', addMembers);
router.delete('/:id/members/:userId', removeMember);
router.post('/:id/leave', leaveConversation);
router.get('/:id/pinned', getPinnedMessages);

module.exports = router;
