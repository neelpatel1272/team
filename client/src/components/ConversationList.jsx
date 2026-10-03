import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MessagesSquare } from 'lucide-react';
import { CONVERSATION_API } from '../services/api';
import UserAvatar from './UserAvatar';
import EmptyState from './EmptyState';
import { ConversationListSkeleton } from './LoadingSkeleton';
import NewConversationModal from './NewConversationModal';
import { formatRelativeTime } from '../utils/format';
import { useSocketContext } from '../contexts/SocketContext';
import { SOCKET_EVENTS } from '../utils/socketEvents';

export default function ConversationList({ activeId, mobileHidden }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const { socket } = useSocketContext();

  const loadConversations = async () => {
    try {
      const { data } = await CONVERSATION_API.list();
      setConversations(data.data.conversations);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeId) {
      setConversations((prev) =>
        prev.map((c) => (c._id === activeId ? { ...c, unreadCount: 0 } : c))
      );
    }
  }, [activeId]);

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => loadConversations();
    const onRead = ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c))
      );
    };
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, refresh);
    socket.on(SOCKET_EVENTS.MESSAGE_READ, onRead);
    socket.on('notification:conversation-cleared', onRead);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, refresh);
      socket.off(SOCKET_EVENTS.MESSAGE_READ, onRead);
      socket.off('notification:conversation-cleared', onRead);
    };
  }, [socket]);

  const label = (c) => (c.type === 'direct' ? (c.otherUser ? `${c.otherUser.firstName} ${c.otherUser.lastName}` : 'Direct message') : c.name);

  const filtered = conversations.filter((c) => label(c)?.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className={`convo-pane${mobileHidden ? ' hide-on-mobile' : ''}`}>
      <div style={{ padding: '18px 16px 10px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Chats</h2>
          <button className="btn-icon" onClick={() => setModalOpen(true)} title="New conversation">
            <Plus size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2" style={{ border: '1px solid var(--color-border)', borderRadius: 10, padding: '8px 12px' }}>
          <Search size={15} className="muted" />
          <input
            style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 13 }}
            placeholder="Search conversations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <ConversationListSkeleton />}

        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={<MessagesSquare size={26} className="muted" />}
            title="No conversations yet"
            description="Start a direct message or create a group to get going."
            action={<button className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => setModalOpen(true)}>New conversation</button>}
          />
        )}

        {!loading &&
          filtered.map((c) => (
            <div
              key={c._id}
              className={`convo-item${activeId === c._id ? ' active' : ''}`}
              onClick={() => navigate(`/chat/${c._id}`)}
            >
              {c.type === 'direct' ? (
                <UserAvatar user={c.otherUser} size={46} showStatus />
              ) : (
                <div className="avatar" style={{ width: 46, height: 46 }}>
                  <div className="avatar__fallback">{c.type === 'team' ? '🏢' : (c.name || 'G').charAt(0)}</div>
                </div>
              )}
              <div className="convo-item__body">
                <div className="convo-item__top">
                  <span className="convo-item__name">{label(c)}</span>
                  <span className="convo-item__time">{c.lastMessageAt ? formatRelativeTime(c.lastMessageAt) : ''}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="convo-item__preview">
                    {c.lastMessage
                      ? c.lastMessage.isDeleted
                        ? 'This message was deleted'
                        : c.lastMessage.content || `📎 ${c.lastMessage.messageType}`
                      : 'No messages yet'}
                  </span>
                  {c.unreadCount > 0 && <span className="unread-badge">{c.unreadCount}</span>}
                </div>
              </div>
            </div>
          ))}
      </div>

      <NewConversationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(id) => {
          loadConversations();
          navigate(`/chat/${id}`);
        }}
      />
    </div>
  );
}
