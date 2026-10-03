import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MessageSquare } from 'lucide-react';
import { USER_API, MESSAGE_API, CONVERSATION_API } from '../services/api';
import UserAvatar from './UserAvatar';

export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      setQuery('');
      setUsers([]);
      setMessages([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      setMessages([]);
      return undefined;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [userRes, msgRes] = await Promise.all([
          USER_API.list({ q: query }),
          MESSAGE_API.search(query),
        ]);
        setUsers(userRes.data.data.users.slice(0, 6));
        setMessages(msgRes.data.data.messages.slice(0, 6));
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && open) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const openUserChat = async (userId) => {
    const { data } = await CONVERSATION_API.openDirect(userId);
    onClose();
    navigate(`/chat/${data.data.conversation._id}`);
  };

  const openMessage = (msg) => {
    onClose();
    navigate(`/chat/${msg.conversation._id || msg.conversation}`);
  };

  return (
    <div className="overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '10vh' }}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <Search size={18} className="muted" />
            <input
              autoFocus
              className="input"
              style={{ border: 'none', boxShadow: 'none', flex: 1, padding: '6px 0' }}
              placeholder="Search employees, groups, messages, files..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn-icon" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div style={{ maxHeight: '55vh', overflowY: 'auto', padding: 8 }}>
          {!query && (
            <div className="muted text-sm" style={{ padding: 16, textAlign: 'center' }}>
              Type to search employees, groups, messages and files. Press <b>Esc</b> to close.
            </div>
          )}

          {query && users.length > 0 && (
            <div style={{ padding: '8px 10px 4px' }}>
              <div className="muted text-sm font-bold" style={{ marginBottom: 6 }}>People</div>
              {users.map((u) => (
                <div key={u._id} className="convo-item" style={{ borderRadius: 10 }} onClick={() => openUserChat(u._id)}>
                  <UserAvatar user={u} size={36} showStatus />
                  <div className="convo-item__body">
                    <div className="convo-item__name">{u.firstName} {u.lastName}</div>
                    <div className="convo-item__preview">{u.jobTitle || u.department}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {query && messages.length > 0 && (
            <div style={{ padding: '8px 10px 4px' }}>
              <div className="muted text-sm font-bold" style={{ marginBottom: 6 }}>Messages</div>
              {messages.map((m) => (
                <div key={m._id} className="convo-item" style={{ borderRadius: 10 }} onClick={() => openMessage(m)}>
                  <div className="avatar" style={{ width: 36, height: 36 }}>
                    <div className="avatar__fallback"><MessageSquare size={16} /></div>
                  </div>
                  <div className="convo-item__body">
                    <div className="convo-item__name">{m.sender?.firstName} {m.sender?.lastName}</div>
                    <div className="convo-item__preview">"{m.content}"</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {query && !loading && users.length === 0 && messages.length === 0 && (
            <div className="muted text-sm" style={{ padding: 16, textAlign: 'center' }}>No results for "{query}".</div>
          )}
        </div>
      </div>
    </div>
  );
}
