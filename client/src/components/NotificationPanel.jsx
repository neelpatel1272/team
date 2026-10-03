import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, AtSign, Phone, FileText, Users, Megaphone, CheckCheck } from 'lucide-react';
import { useSocketContext } from '../contexts/SocketContext';
import { formatRelativeTime } from '../utils/format';

const ICONS = {
  message: MessageCircle,
  mention: AtSign,
  call: Phone,
  file: FileText,
  group_invite: Users,
  announcement: Megaphone,
};

export default function NotificationPanel({ open, onClose }) {
  const { notifications, unreadNotifCount, markNotificationRead, markAllNotificationsRead } = useSocketContext();
  const navigate = useNavigate();

  if (!open) return null;

  const go = async (n) => {
    // Mark read so it disappears
    await markNotificationRead(n._id);
    onClose();
    if (n.conversation) navigate(`/chat/${n.conversation._id || n.conversation}`);
  };

  const dismiss = async (e, n) => {
    e.stopPropagation();
    await markNotificationRead(n._id);
  };

  return (
    <div className="overlay" onClick={onClose} style={{ background: 'transparent', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
      <div
        className="modal"
        style={{ marginTop: 60, marginRight: 20, maxWidth: 380, width: 380, boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <div className="flex items-center gap-2">
            <Bell size={18} color="var(--color-primary)" />
            <span className="modal__title">Notifications</span>
            {notifications.length > 0 && (
              <span className="badge-pill" style={{ background: 'var(--color-primary)', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 99 }}>
                {notifications.length}
              </span>
            )}
          </div>
          {notifications.length > 0 && (
            <button className="btn-ghost text-sm flex items-center gap-1" onClick={markAllNotificationsRead} style={{ color: 'var(--color-primary)' }}>
              <CheckCheck size={14} /> Clear all
            </button>
          )}
        </div>
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {notifications.length === 0 && (
            <div className="muted text-sm" style={{ padding: '36px 24px', textAlign: 'center' }}>
              <CheckCheck size={32} color="var(--color-success)" style={{ margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>You're all caught up! 🎉</div>
              <div className="text-sm muted" style={{ marginTop: 4 }}>No new notifications.</div>
            </div>
          )}
          {notifications.map((n) => {
            const Icon = ICONS[n.type] || Bell;
            return (
              <div
                key={n._id}
                onClick={() => go(n)}
                className="flex gap-3 items-start group"
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  transition: 'background var(--transition-fast)',
                }}
              >
                <div className="avatar" style={{ width: 36, height: 36, flexShrink: 0 }}>
                  <div className="avatar__fallback" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-primary)' }}>
                    <Icon size={16} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm font-bold">{n.title}</div>
                  <div className="text-sm muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>
                  <div className="text-sm muted" style={{ fontSize: 11, marginTop: 2 }}>{formatRelativeTime(n.createdAt)}</div>
                </div>
                <button
                  className="btn-icon"
                  style={{ width: 24, height: 24, padding: 0, opacity: 0.7, flexShrink: 0 }}
                  title="Dismiss notification"
                  onClick={(e) => dismiss(e, n)}
                >
                  <CheckCheck size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
