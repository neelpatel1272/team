const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getCallHistory, getIceServers } = require('../controllers/callController');

router.use(protect);

router.get('/history', getCallHistory);
router.get('/ice-servers', getIceServers);

module.exports = router;
