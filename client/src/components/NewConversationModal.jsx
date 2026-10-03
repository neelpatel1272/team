import { useEffect, useState } from 'react';
import { X, Search, Users, MessageCircle } from 'lucide-react';
import { USER_API, CONVERSATION_API } from '../services/api';
import UserAvatar from './UserAvatar';
import { useToast } from '../contexts/ToastContext';

export default function NewConversationModal({ open, onClose, onCreated }) {
  const [tab, setTab] = useState('direct');
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!open) {
      setTab('direct');
      setQuery('');
      setSelected([]);
      setGroupName('');
      return;
    }
    USER_API.list().then(({ data }) => setUsers(data.data.users)).catch(() => {});
  }, [open]);

  if (!open) return null;

  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.department}`.toLowerCase().includes(query.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const startDirect = async (userId) => {
    setLoading(true);
    try {
      const { data } = await CONVERSATION_API.openDirect(userId);
      onCreated(data.data.conversation._id);
      onClose();
    } catch (err) {
      showToast('Unable to start conversation. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selected.length === 0) return;
    setLoading(true);
    try {
      const { data } = await CONVERSATION_API.createGroup({ name: groupName, memberIds: selected });
      onCreated(data.data.conversation._id);
      onClose();
    } catch (err) {
      showToast('Unable to create group. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">New conversation</span>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="flex gap-2" style={{ padding: '14px 22px 0' }}>
          <button className={`btn ${tab === 'direct' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setTab('direct')}>
            <MessageCircle size={15} /> Direct message
          </button>
          <button className={`btn ${tab === 'group' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setTab('group')}>
            <Users size={15} /> New group
          </button>
        </div>

        <div className="modal__body">
          {tab === 'group' && (
            <div className="field">
              <label>Group name</label>
              <input className="input" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Q4 Launch Squad" />
            </div>
          )}

          <div className="field" style={{ marginBottom: 10 }}>
            <div className="flex items-center gap-2" style={{ border: '1px solid var(--color-border)', borderRadius: 10, padding: '8px 12px' }}>
              <Search size={15} className="muted" />
              <input
                style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 14 }}
                placeholder="Search teammates..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {filtered.map((u) => (
              <div
                key={u._id}
                className="convo-item"
                style={{ borderRadius: 10, cursor: loading ? 'default' : 'pointer' }}
                onClick={() => (tab === 'direct' ? startDirect(u._id) : toggleSelect(u._id))}
              >
                {tab === 'group' && (
                  <input type="checkbox" checked={selected.includes(u._id)} readOnly style={{ marginRight: 4 }} />
                )}
                <UserAvatar user={u} size={38} showStatus />
                <div className="convo-item__body">
                  <div className="convo-item__name">{u.firstName} {u.lastName}</div>
                  <div className="convo-item__preview">{u.jobTitle || u.department}</div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="muted text-sm" style={{ padding: 16, textAlign: 'center' }}>No teammates found.</div>}
          </div>
        </div>

        {tab === 'group' && (
          <div className="modal__footer">
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={!groupName.trim() || selected.length === 0 || loading} onClick={createGroup}>
              Create group ({selected.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
