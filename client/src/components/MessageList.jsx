import { useEffect, useRef, useState, useCallback } from 'react';
import { MESSAGE_API } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocketContext } from '../contexts/SocketContext';
import { SOCKET_EVENTS } from '../utils/socketEvents';
import MessageBubble from './MessageBubble';
import { MessageListSkeleton } from './LoadingSkeleton';
import EmptyState from './EmptyState';
import { formatDayLabel } from '../utils/format';
import { MessageCircle } from 'lucide-react';

export default function MessageList({ conversationId, onReply, onOpenImage, onForward, highlightId }) {
  const { user } = useAuth();
  const { socket, clearConversationNotifications } = useSocketContext();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const initialLoadRef = useRef(true);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'auto' });

  const loadHistory = useCallback(async (before) => {
    const { data } = await MESSAGE_API.history(conversationId, before ? { before } : {});
    return data.data.messages;
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return undefined;
    setLoading(true);
    setMessages([]);
    setHasMore(true);
    initialLoadRef.current = true;

    clearConversationNotifications(conversationId);

    loadHistory().then((msgs) => {
      setMessages(msgs);
      setLoading(false);
      setHasMore(msgs.length >= 30);
      setTimeout(scrollToBottom, 50);

      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && String(lastMsg.sender._id) !== String(user._id)) {
        socket?.emit(SOCKET_EVENTS.MESSAGE_READ, { conversationId, messageId: lastMsg._id });
      }
    });

    socket?.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId });
    return () => socket?.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, { conversationId });
  }, [conversationId, loadHistory, socket, clearConversationNotifications, user._id]);

  useEffect(() => {
    if (!socket) return undefined;

    const onNew = ({ message, conversationId: cid }) => {
      if (cid !== conversationId) return;
      setMessages((prev) => [...prev, message]);
      setTimeout(scrollToBottom, 30);
      clearConversationNotifications(conversationId);
      if (String(message.sender._id) !== String(user._id)) {
        socket.emit(SOCKET_EVENTS.MESSAGE_READ, { conversationId, messageId: message._id });
      }
    };
    const onEdited = ({ message }) => {
      setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    };
    const onDeleted = ({ messageId, conversationId: cid }) => {
      if (cid !== conversationId) return;
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, isDeleted: true, content: '' } : m)));
    };
    const onReaction = ({ message }) => {
      setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    };
    const onPinned = ({ messageId, pinned }) => {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, isPinned: pinned } : m)));
    };
    const onMessageRead = ({ conversationId: cid, userId: readerId }) => {
      if (cid !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) => {
          const alreadyRead = (m.readBy || []).some((r) => String(r.user?._id || r.user) === String(readerId));
          if (!alreadyRead) {
            return {
              ...m,
              readBy: [...(m.readBy || []), { user: { _id: readerId }, readAt: new Date() }],
            };
          }
          return m;
        })
      );
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onNew);
    socket.on(SOCKET_EVENTS.MESSAGE_EDITED, onEdited);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, onDeleted);
    socket.on(SOCKET_EVENTS.MESSAGE_REACTION_UPDATED, onReaction);
    socket.on(SOCKET_EVENTS.MESSAGE_PINNED, onPinned);
    socket.on(SOCKET_EVENTS.MESSAGE_READ, onMessageRead);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onNew);
      socket.off(SOCKET_EVENTS.MESSAGE_EDITED, onEdited);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, onDeleted);
      socket.off(SOCKET_EVENTS.MESSAGE_REACTION_UPDATED, onReaction);
      socket.off(SOCKET_EVENTS.MESSAGE_PINNED, onPinned);
      socket.off(SOCKET_EVENTS.MESSAGE_READ, onMessageRead);
    };
  }, [socket, conversationId, user._id, clearConversationNotifications]);

  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`msg-${highlightId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.background = 'rgba(79,70,229,0.12)';
      setTimeout(() => { el.style.background = ''; }, 1500);
    }
  }, [highlightId]);

  const loadOlder = async () => {
    if (messages.length === 0) return;
    const el = listRef.current;
    const prevHeight = el.scrollHeight;
    const older = await loadHistory(messages[0].createdAt);
    setHasMore(older.length >= 30);
    setMessages((prev) => [...older, ...prev]);
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - prevHeight;
    });
  };

  const onScroll = () => {
    if (listRef.current?.scrollTop < 60 && hasMore && !loading) loadOlder();
  };

  const editMessage = (id, content) => {
    socket.emit(SOCKET_EVENTS.MESSAGE_EDIT, { messageId: id, content });
  };
  const deleteMessage = (id) => {
    socket.emit(SOCKET_EVENTS.MESSAGE_DELETE, { messageId: id });
  };
  const reactMessage = (id, emoji) => {
    socket.emit(SOCKET_EVENTS.MESSAGE_REACT, { messageId: id, emoji });
  };
  const pinMessage = (id) => {
    socket.emit(SOCKET_EVENTS.MESSAGE_PIN, { messageId: id });
  };

  if (loading) return <MessageListSkeleton />;

  if (messages.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle size={26} className="muted" />}
        title="Say hello 👋"
        description="This is the start of your conversation."
      />
    );
  }

  let lastDay = null;
  let lastSenderId = null;

  return (
    <div className="message-list" ref={listRef} onScroll={onScroll}>
      {messages.map((m, idx) => {
        const day = new Date(m.createdAt).toDateString();
        const showDivider = day !== lastDay;
        lastDay = day;
        const showSender = m.sender._id !== lastSenderId || showDivider;
        lastSenderId = m.sender._id;

        return (
          <div key={m._id} id={`msg-${m._id}`} style={{ transition: 'background 400ms ease', borderRadius: 8 }}>
            {showDivider && <div className="date-divider">{formatDayLabel(m.createdAt)}</div>}
            <MessageBubble
              message={m}
              isOwn={String(m.sender._id) === String(user._id)}
              showSender={showSender}
              onReply={onReply}
              onEdit={editMessage}
              onDelete={deleteMessage}
              onReact={reactMessage}
              onPin={pinMessage}
              onForward={onForward}
              onOpenImage={onOpenImage}
              onJumpTo={(id) => document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
