export function categoryFromMime(mimeType = '') {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType === 'application/pdf' ||
    mimeType.includes('word') ||
    mimeType.includes('excel') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation') ||
    mimeType.includes('zip')
  ) {
    return 'document';
  }
  return 'other';
}

export function messageTypeFromAttachments(attachments = []) {
  if (!attachments.length) return 'text';
  const categories = new Set(attachments.map((a) => a.category));
  if (categories.size === 1) {
    const [only] = categories;
    if (only === 'image') return 'image';
    if (only === 'video') return 'video';
    if (only === 'audio') return 'audio';
  }
  return 'file';
}
