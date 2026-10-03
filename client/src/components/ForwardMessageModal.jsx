import { useEffect, useState } from 'react';
import { X, Forward } from 'lucide-react';
import { CONVERSATION_API, MESSAGE_API } from '../services/api';
import UserAvatar from './UserAvatar';
import { useToast } from '../contexts/ToastContext';

export default function ForwardMessageModal({ message, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!message) return;
    CONVERSATION_API.list().then(({ data }) => setConversations(data.data.conversations));
  }, [message]);

  if (!message) return null;

  const label = (c) => (c.type === 'direct' ? (c.otherUser ? `${c.otherUser.firstName} ${c.otherUser.lastName}` : 'Direct message') : c.name);

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const send = async () => {
    if (selected.length === 0) return;
    setSending(true);
    try {
      await MESSAGE_API.forward(message._id, selected);
      showToast('Message forwarded.', 'success');
      onClose();
    } catch {
      showToast('Unable to forward message.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title flex items-center gap-2"><Forward size={16} /> Forward message</span>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal__body">
          <div className="card" style={{ padding: 10, marginBottom: 14, fontSize: 13 }}>"{message.content || `📎 ${message.messageType}`}"</div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {conversations.map((c) => (
              <div key={c._id} className="convo-item" style={{ borderRadius: 10 }} onClick={() => toggle(c._id)}>
                <input type="checkbox" checked={selected.includes(c._id)} readOnly style={{ marginRight: 4 }} />
                {c.type === 'direct' ? <UserAvatar user={c.otherUser} size={34} /> : (
                  <div className="avatar" style={{ width: 34, height: 34 }}><div className="avatar__fallback">{(c.name || 'G').charAt(0)}</div></div>
                )}
                <div className="convo-item__body"><div className="convo-item__name">{label(c)}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={selected.length === 0 || sending} onClick={send}>Forward ({selected.length})</button>
        </div>
      </div>
    </div>
  );
}
