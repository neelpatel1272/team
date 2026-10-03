const multer = require('multer');

// 404 handler — mount after all routes
function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

// Central error handler — mount last
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'File is too large.' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid identifier.' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'A record with these details already exists.' });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error. Please try again.' : err.message,
  });
}

module.exports = { notFound, errorHandler };
