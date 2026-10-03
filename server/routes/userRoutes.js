const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  listUsers,
  getUser,
  updateProfile,
  updateSettings,
  changePassword,
  updateStatus,
} = require('../controllers/userController');

router.use(protect);

router.get('/', listUsers);
router.get('/:id', getUser);
router.patch('/me/profile', updateProfile);
router.patch('/me/settings', updateSettings);
router.patch('/me/password', changePassword);
router.patch('/me/status', updateStatus);

module.exports = router;
