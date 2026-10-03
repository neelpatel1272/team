const Attachment = require('../models/Attachment');
const { ok, fail } = require('../utils/apiResponse');
const { getCategory, folderForCategory } = require('../utils/fileCategory');

// Handles a single or multiple file upload. Files are already written to disk
// by the `upload` multer middleware by the time this controller runs;
// this just records metadata so a Message can reference it afterwards.
async function uploadFiles(req, res, next) {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) return fail(res, 'No file provided.', 400);

    const attachments = await Promise.all(
      files.map((file) => {
        const category = getCategory(file.mimetype);
        const folder = folderForCategory(category);
        return Attachment.create({
          uploadedBy: req.user._id,
          conversation: req.body.conversationId || undefined,
          fileName: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          category,
          size: file.size,
          url: `/uploads/${folder}/${file.filename}`,
        });
      })
    );

    return ok(res, { attachments }, 'File(s) uploaded.', 201);
  } catch (err) {
    next(err);
  }
}

async function getSharedFiles(req, res, next) {
  try {
    const { conversationId } = req.params;
    const { category } = req.query;

    const filter = { conversation: conversationId };
    if (category) filter.category = category;

    const attachments = await Attachment.find(filter).populate('uploadedBy', 'firstName lastName').sort({ createdAt: -1 });
    return ok(res, { attachments });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadFiles, getSharedFiles };
