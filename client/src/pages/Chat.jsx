import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ConversationList from '../components/ConversationList';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageComposer from '../components/MessageComposer';
import TypingIndicator from '../components/TypingIndicator';
import ImageViewer from '../components/ImageViewer';
import PinnedMessagesPanel from '../components/PinnedMessagesPanel';
import SharedFilesPanel from '../components/SharedFilesPanel';
import ForwardMessageModal from '../components/ForwardMessageModal';
import EmptyState from '../components/EmptyState';
import { CONVERSATION_API } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocketContext } from '../contexts/SocketContext';
import { SOCKET_EVENTS } from '../utils/socketEvents';
import { MessageSquareText } from 'lucide-react';

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { socket, clearConversationNotifications } = useSocketContext();
  const { user } = useAuth();

  const [conversation, setConversation] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [imageViewer, setImageViewer] = useState(null); // { images, index }
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [filesOpen, setFilesOpen] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [highlightId, setHighlightId] = useState(null);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      return;
    }
    CONVERSATION_API.get(conversationId).then(({ data }) => {
      const conv = data.data.conversation;
      if (conv.type === 'direct') {
        const otherMember = data.data.members.find((m) => String(m.user._id) !== String(user._id));
        conv.otherUser = otherMember ? otherMember.user : null;
      } else {
        conv.memberCount = data.data.members.length;
      }
      setConversation(conv);
    });
  }, [conversationId]);

  useEffect(() => {
    if (!socket || !conversationId) return undefined;

    const onTypingStart = (payload) => {
      if (payload.conversationId !== conversationId) return;
      setTypingUsers((prev) => (prev.some((u) => u.userId === payload.userId) ? prev : [...prev, payload]));
    };
    const onTypingStop = (payload) => {
      if (payload.conversationId !== conversationId) return;
      setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.userId));
    };

    socket.on(SOCKET_EVENTS.TYPING_START, onTypingStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP, onTypingStop);
    return () => {
      socket.off(SOCKET_EVENTS.TYPING_START, onTypingStart);
      socket.off(SOCKET_EVENTS.TYPING_STOP, onTypingStop);
      setTypingUsers([]);
    };
  }, [socket, conversationId]);

  const loadPinned = async () => {
    const { data } = await CONVERSATION_API.pinned(conversationId);
    setPinnedMessages(data.data.pinnedMessages);
    setPinnedOpen(true);
  };

  const handleSend = (payload) => {
    clearConversationNotifications(conversationId);
    socket.emit(SOCKET_EVENTS.MESSAGE_SEND, { conversationId, ...payload }, (ack) => {
      if (!ack?.success) {
        console.error('[chat] send failed', ack?.error);
      }
    });
    setReplyTo(null);
  };

  return (
    <div className="flex" style={{ flex: 1, minWidth: 0 }}>
      <ConversationList activeId={conversationId} mobileHidden={!!conversationId} />

      <div className={`main-pane${conversationId ? '' : ' hide-on-mobile'}`}>
        {conversation ? (
          <>
            <ChatHeader
              conversation={conversation}
              onOpenPinned={loadPinned}
              onOpenFiles={() => setFilesOpen(true)}
              onBack={() => navigate('/chat')}
            />
            <MessageList
              conversationId={conversationId}
              onReply={setReplyTo}
              onOpenImage={(images, index) => setImageViewer({ images, index })}
              onForward={setForwardMessage}
              highlightId={highlightId}
            />
            <TypingIndicator typingUsers={typingUsers} />
            <MessageComposer
              conversationId={conversationId}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              onSend={handleSend}
              onTypingStart={() => socket.emit(SOCKET_EVENTS.TYPING_START, { conversationId })}
              onTypingStop={() => socket.emit(SOCKET_EVENTS.TYPING_STOP, { conversationId })}
            />
          </>
        ) : (
          <EmptyState
            icon={<MessageSquareText size={28} className="muted" />}
            title="Select a conversation"
            description="Choose a chat from the left, or start a new one."
          />
        )}
      </div>

      {imageViewer && (
        <ImageViewer images={imageViewer.images} startIndex={imageViewer.index} onClose={() => setImageViewer(null)} />
      )}

      <PinnedMessagesPanel
        open={pinnedOpen}
        onClose={() => setPinnedOpen(false)}
        messages={pinnedMessages}
        onJumpTo={(id) => { setPinnedOpen(false); setHighlightId(id); }}
      />

      <SharedFilesPanel open={filesOpen} onClose={() => setFilesOpen(false)} conversationId={conversationId} />

      <ForwardMessageModal message={forwardMessage} onClose={() => setForwardMessage(null)} />
    </div>
  );
}
