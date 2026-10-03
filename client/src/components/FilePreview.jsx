import { Download, ExternalLink } from 'lucide-react';
import { fileUrl } from '../services/api';
import { formatBytes, fileIconFor } from '../utils/format';

export default function FilePreview({ attachment }) {
  if (!attachment) return null;
  return (
    <div className="file-card">
      <div className="file-card__icon" style={{ fontSize: 20 }}>{fileIconFor(attachment.mimeType)}</div>
      <div className="file-card__body">
        <div className="file-card__name">{attachment.originalName}</div>
        <div className="file-card__meta">{formatBytes(attachment.size)}</div>
      </div>
      <div className="flex gap-1">
        <a href={fileUrl(attachment.url)} target="_blank" rel="noreferrer" className="btn-icon" style={{ width: 30, height: 30 }} title="Open">
          <ExternalLink size={14} />
        </a>
        <a href={fileUrl(attachment.url)} download className="btn-icon" style={{ width: 30, height: 30 }} title="Download">
          <Download size={14} />
        </a>
      </div>
    </div>
  );
}
