import { useEffect, useState } from 'react';
import { Folder, Image, Video, FileText, Music, Search } from 'lucide-react';
import Topbar from '../components/Topbar';
import EmptyState from '../components/EmptyState';
import { Skeleton } from '../components/LoadingSkeleton';
import { CONVERSATION_API, FILE_API, fileUrl } from '../services/api';
import { formatBytes, fileIconFor } from '../utils/format';

const FILTERS = [
  { key: null, label: 'All', icon: Folder },
  { key: 'image', label: 'Images', icon: Image },
  { key: 'video', label: 'Videos', icon: Video },
  { key: 'document', label: 'Documents', icon: FileText },
  { key: 'audio', label: 'Audio', icon: Music },
];

export default function Files() {
  const [conversations, setConversations] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await CONVERSATION_API.list();
      setConversations(data.data.conversations);
      const results = await Promise.all(
        data.data.conversations.map((c) => FILE_API.shared(c._id).then((r) => r.data.data.attachments.map((a) => ({ ...a, conversationLabel: c.type === 'direct' ? c.otherUser && `${c.otherUser.firstName} ${c.otherUser.lastName}` : c.name }))))
      );
      setFiles(results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLoading(false);
    }
    load();
  }, []);

  const filtered = files.filter((f) => (!filter || f.category === filter) && f.originalName.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="main-pane" style={{ width: '100%' }}>
      <Topbar title="Files" />
      <div style={{ padding: 28, overflowY: 'auto', flex: 1 }}>
        <div className="flex items-center justify-between gap-2" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="flex gap-2">
            {FILTERS.map(({ key, label, icon: Icon }) => (
              <button key={label} className={`btn text-sm ${filter === key ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(key)}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2" style={{ border: '1px solid var(--color-border)', borderRadius: 10, padding: '8px 12px', minWidth: 220 }}>
            <Search size={14} className="muted" />
            <input style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 13 }} placeholder="Search files..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={70} />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState icon={<Folder size={26} className="muted" />} title="No files found" description="Files shared in your conversations will appear here." />
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
            {filtered.map((f) => (
              <a key={f._id} href={fileUrl(f.url)} target="_blank" rel="noreferrer" className="file-card" style={{ textDecoration: 'none', minWidth: 0 }}>
                <div className="file-card__icon" style={{ fontSize: 20 }}>{f.category === 'image' ? '🖼️' : fileIconFor(f.mimeType)}</div>
                <div className="file-card__body">
                  <div className="file-card__name">{f.originalName}</div>
                  <div className="file-card__meta">{formatBytes(f.size)} · {f.conversationLabel || 'Conversation'}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
