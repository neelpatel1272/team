import { useEffect, useState } from 'react';
import { X, Folder, Image, Video, FileText } from 'lucide-react';
import { FILE_API, fileUrl } from '../services/api';
import { formatBytes, fileIconFor } from '../utils/format';

const FILTERS = [
  { key: null, label: 'All', icon: Folder },
  { key: 'image', label: 'Images', icon: Image },
  { key: 'video', label: 'Videos', icon: Video },
  { key: 'document', label: 'Docs', icon: FileText },
];

export default function SharedFilesPanel({ open, onClose, conversationId }) {
  const [files, setFiles] = useState([]);
  const [filter, setFilter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    FILE_API.shared(conversationId, filter || undefined)
      .then(({ data }) => setFiles(data.data.attachments))
      .finally(() => setLoading(false));
  }, [open, conversationId, filter]);

  if (!open) return null;

  return (
    <div className="overlay" onClick={onClose} style={{ alignItems: 'flex-start', justifyContent: 'flex-end' }}>
      <div className="modal" style={{ margin: '0 0 0 auto', height: '100vh', maxHeight: '100vh', borderRadius: 0, width: 360 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title flex items-center gap-2"><Folder size={16} /> Shared Files</span>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="flex gap-2" style={{ padding: '12px 22px 0' }}>
          {FILTERS.map(({ key, label, icon: Icon }) => (
            <button key={label} className={`btn text-sm ${filter === key ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '6px 10px' }} onClick={() => setFilter(key)}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
        <div className="modal__body">
          {loading && <div className="muted text-sm">Loading...</div>}
          {!loading && files.length === 0 && <div className="muted text-sm" style={{ textAlign: 'center', padding: 20 }}>No files shared yet.</div>}
          {!loading && files.map((f) => (
            <a key={f._id} href={fileUrl(f.url)} target="_blank" rel="noreferrer" className="file-card" style={{ marginBottom: 8, textDecoration: 'none' }}>
              <div className="file-card__icon" style={{ fontSize: 18 }}>{f.category === 'image' ? '🖼️' : fileIconFor(f.mimeType)}</div>
              <div className="file-card__body">
                <div className="file-card__name">{f.originalName}</div>
                <div className="file-card__meta">{formatBytes(f.size)} · {f.uploadedBy?.firstName}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
