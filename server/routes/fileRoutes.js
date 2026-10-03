const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadFiles, getSharedFiles } = require('../controllers/fileController');

router.use(protect);

router.post('/upload', upload.array('files', 10), uploadFiles);
router.get('/conversation/:conversationId', getSharedFiles);

module.exports = router;
