const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { getCategory, folderForCategory, DANGEROUS_EXTENSIONS } = require('../utils/fileCategory');

const UPLOAD_ROOT = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

// Ensure base folders exist
['images', 'videos', 'documents', 'audio', 'other'].forEach((folder) => {
  const dir = path.join(UPLOAD_ROOT, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = getCategory(file.mimetype);
    const folder = folderForCategory(category);
    cb(null, path.join(UPLOAD_ROOT, folder));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, safeName);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return cb(new Error('This file type is not allowed for security reasons.'));
  }
  cb(null, true);
}

const maxSizeMb = Number(process.env.MAX_FILE_SIZE_MB || 25);

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
});

module.exports = { upload, UPLOAD_ROOT };
