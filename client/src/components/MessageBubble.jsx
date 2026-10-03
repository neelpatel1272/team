import { useState } from 'react';
import { Smile, Reply, MoreHorizontal, Pin, Star, Copy, Pencil, Trash2, Forward } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import UserAvatar from './UserAvatar';
import FilePreview from './FilePreview';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import { fileUrl } from '../services/api';
import { formatMessageTime } from '../utils/format';
import { REACTION_EMOJIS } from '../utils/socketEvents';

export default function MessageBubble({
  message,
  isOwn,
  showSender,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onPin,
  onForward,
  onOpenImage,
  onJumpTo,
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);

  if (message.messageType === 'system') {
    return (
      <div className="flex justify-center" style={{ margin: '12px 0', width: '100%' }}>
        <div
          className="text-xs muted"
          style={{
            background: 'var(--color-surface-alt)',
            padding: '4px 14px',
            borderRadius: 99,
            border: '1px solid var(--color-border)',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>ℹ️</span> {message.content}
        </div>
      </div>
    );
  }

  if (message.isDeleted) {
    return (
      <div className={`msg-row ${isOwn ? 'out' : 'in'}`}>
        <div className="msg-bubble-wrap">
          <div className="msg-bubble" style={{ opacity: 0.6, fontStyle: 'italic' }}>This message was deleted</div>
        </div>
      </div>
    );
  }

  const senderId = String(message.sender?._id || message.sender || '');
  const readByOthers = (message.readBy || []).filter((r) => {
    const rId = String(r.user?._id || r.user || '');
    return rId && rId !== senderId;
  });
  const receiptState = !isOwn ? null : readByOthers.length > 0 ? 'read' : message.deliveredTo?.length > 1 ? 'delivered' : 'sent';

  const reactionGroups = {};
  (message.reactions || []).forEach((r) => {
    reactionGroups[r.emoji] = reactionGroups[r.emoji] || [];
    reactionGroups[r.emoji].push(r);
  });

  const submitEdit = () => {
    if (editValue.trim() && editValue !== message.content) onEdit(message._id, editValue.trim());
    setEditing(false);
  };

  const imageAttachments = (message.attachments || []).filter((a) => a.category === 'image');

  return (
    <div className={`msg-row ${isOwn ? 'out' : 'in'}`}>
      {!isOwn && <UserAvatar user={message.sender} size={30} />}

      <div className="msg-bubble-wrap">
        {showSender && !isOwn && (
          <span className="msg-sender">{message.sender.firstName} {message.sender.lastName}</span>
        )}

        <div className="flex items-end gap-1" style={{ flexDirection: isOwn ? 'row-reverse' : 'row' }}>
          <div>
            {message.replyTo && (
              <div className="msg-reply-quote" onClick={() => onJumpTo?.(message.replyTo._id)}>
                <b>{message.replyTo.sender?.firstName}</b>: {message.replyTo.content?.slice(0, 60) || 'Attachment'}
              </div>
            )}

            {message.messageType === 'text' && message.content && (
              <div className="msg-bubble">{message.content}</div>
            )}

            {message.messageType === 'voice' && (
              <div className="msg-bubble">
                <VoiceMessagePlayer attachment={message.attachments?.[0]} duration={message.voiceDuration} />
              </div>
            )}

            {imageAttachments.length > 0 && (
              <div className="flex-col gap-1">
                {imageAttachments.map((att, i) => (
                  <img
                    key={att._id}
                    src={fileUrl(att.url)}
                    alt={att.originalName}
                    className="msg-image"
                    onClick={() => onOpenImage(imageAttachments, i)}
                  />
                ))}
              </div>
            )}

            {message.messageType === 'video' &&
              (message.attachments || []).filter((a) => a.category === 'video').map((att) => (
                <video key={att._id} src={fileUrl(att.url)} controls className="msg-video" preload="metadata" />
              ))}

            {(message.attachments || [])
              .filter((a) => a.category === 'document' || a.category === 'other')
              .map((att) => <FilePreview key={att._id} attachment={att} />)}

            {message.content && message.messageType !== 'text' && message.messageType !== 'voice' && (
              <div className="msg-bubble" style={{ marginTop: 4 }}>{message.content}</div>
            )}

            {editing && (
              <div className="flex gap-1" style={{ marginTop: 4 }}>
                <input className="input" style={{ padding: '6px 10px', fontSize: 13 }} value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus />
                <button className="btn btn-primary" style={{ padding: '6px 10px' }} onClick={submitEdit}>Save</button>
              </div>
            )}

            {Object.keys(reactionGroups).length > 0 && (
              <div className="msg-reactions">
                {Object.entries(reactionGroups).map(([emoji, list]) => (
                  <span
                    key={emoji}
                    className={`reaction-chip ${list.some((r) => String(r.user._id || r.user) === String(user._id)) ? 'mine' : ''}`}
                    onClick={() => onReact(message._id, emoji)}
                  >
                    {emoji} {list.length}
                  </span>
                ))}
              </div>
            )}

            <div className="msg-meta">
              {message.isEdited && <span>(edited)</span>}
              <span>{formatMessageTime(message.createdAt)}</span>
              {receiptState && (
                <span
                  style={{
                    color: receiptState === 'read' ? '#5383ec' : 'var(--color-text-muted)',
                    fontWeight: receiptState === 'read' ? 700 : 400,
                    fontSize: 12,
                    marginLeft: 4,
                    letterSpacing: -1.5,
                  }}
                  title={receiptState === 'read' ? 'Read' : receiptState === 'delivered' ? 'Delivered' : 'Sent'}
                >
                  {receiptState === 'sent' && '✓'}
                  {receiptState === 'delivered' && '✓✓'}
                  {receiptState === 'read' && '✓✓'}
                </span>
              )}
            </div>
          </div>

          <div className="msg-hover-actions">
            <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => setShowEmojiPicker((s) => !s)}><Smile size={14} /></button>
            <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => onReply(message)}><Reply size={14} /></button>
            <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => setShowMenu((s) => !s)}><MoreHorizontal size={14} /></button>
          </div>
        </div>

        {showEmojiPicker && (
          <div className="card flex gap-1" style={{ padding: 6, position: 'relative', zIndex: 5, alignSelf: isOwn ? 'flex-end' : 'flex-start' }}>
            {REACTION_EMOJIS.map((emoji) => (
              <button key={emoji} className="btn-ghost" style={{ fontSize: 16, padding: 4 }} onClick={() => { onReact(message._id, emoji); setShowEmojiPicker(false); }}>
                {emoji}
              </button>
            ))}
          </div>
        )}

        {showMenu && (
          <div className="card flex-col" style={{ padding: 6, width: 170, position: 'relative', zIndex: 5, alignSelf: isOwn ? 'flex-end' : 'flex-start' }}>
            <button
              className="btn-ghost text-sm flex items-center gap-2"
              style={{ justifyContent: 'flex-start', padding: 8 }}
              onClick={() => {
                if (message.content) {
                  navigator.clipboard?.writeText(message.content);
                  showToast('Message copied to clipboard.', 'success');
                }
                setShowMenu(false);
              }}
            >
              <Copy size={14} /> Copy
            </button>
            <button className="btn-ghost text-sm flex items-center gap-2" style={{ justifyContent: 'flex-start', padding: 8 }} onClick={() => { onPin(message._id); setShowMenu(false); }}>
              <Pin size={14} /> {message.isPinned ? 'Unpin' : 'Pin'}
            </button>
            <button className="btn-ghost text-sm flex items-center gap-2" style={{ justifyContent: 'flex-start', padding: 8 }} onClick={() => { onForward(message); setShowMenu(false); }}>
              <Forward size={14} /> Forward
            </button>
            <button className="btn-ghost text-sm flex items-center gap-2" style={{ justifyContent: 'flex-start', padding: 8 }} onClick={() => { setShowMenu(false); }}>
              <Star size={14} /> Star
            </button>
            {isOwn && (
              <>
                <button className="btn-ghost text-sm flex items-center gap-2" style={{ justifyContent: 'flex-start', padding: 8 }} onClick={() => { setEditing(true); setShowMenu(false); }}>
                  <Pencil size={14} /> Edit
                </button>
                <button className="btn-ghost text-sm flex items-center gap-2" style={{ justifyContent: 'flex-start', padding: 8, color: 'var(--color-danger)' }} onClick={() => { onDelete(message._id); setShowMenu(false); }}>
                  <Trash2 size={14} /> Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
