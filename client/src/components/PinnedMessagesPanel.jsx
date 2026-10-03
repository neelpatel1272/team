import { X, Pin } from 'lucide-react';
import { formatRelativeTime } from '../utils/format';

export default function PinnedMessagesPanel({ open, onClose, messages, onJumpTo }) {
  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose} style={{ alignItems: 'flex-start', justifyContent: 'flex-end' }}>
      <div className="modal" style={{ margin: '0 0 0 auto', height: '100vh', maxHeight: '100vh', borderRadius: 0, width: 360 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title flex items-center gap-2"><Pin size={16} /> Pinned Messages</span>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal__body">
          {messages.length === 0 && <div className="muted text-sm" style={{ textAlign: 'center', padding: 20 }}>No pinned messages yet.</div>}
          {messages.map((m) => (
            <div key={m._id} className="card" style={{ padding: 12, marginBottom: 10, cursor: 'pointer' }} onClick={() => onJumpTo(m._id)}>
              <div className="text-sm font-bold">{m.sender.firstName} {m.sender.lastName}</div>
              <div className="text-sm" style={{ margin: '4px 0' }}>{m.content || `📎 ${m.messageType}`}</div>
              <div className="text-sm muted" style={{ fontSize: 11 }}>{formatRelativeTime(m.createdAt)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
