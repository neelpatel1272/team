import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Video, MoreVertical, Pin, Folder, ArrowLeft, VolumeX, LogOut, Palette } from 'lucide-react';
import UserAvatar from './UserAvatar';
import WallpaperModal from './WallpaperModal';
import { useCall } from '../contexts/CallContext';
import { useSocketContext } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';
import { CONVERSATION_API } from '../services/api';
import { formatRelativeTime } from '../utils/format';

export default function ChatHeader({ conversation, onOpenPinned, onOpenFiles, onBack }) {
  const { placeCall } = useCall();
  const { isOnline, getLastSeen } = useSocketContext();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [wallpaperOpen, setWallpaperOpen] = useState(false);
  const [muted, setMuted] = useState(false);

  if (!conversation) return null;

  const isDirect = conversation.type === 'direct';
  const peer = conversation.otherUser;
  const online = isDirect && peer ? isOnline(peer._id) : false;
  const lastSeenDate = peer ? getLastSeen(peer._id, peer.lastSeen) : null;
  const name = isDirect ? (peer ? `${peer.firstName} ${peer.lastName}` : 'Direct message') : conversation.name;

  const startCall = (type) => {
    if (!isDirect || !peer) return;
    placeCall({ calleeId: peer._id, calleeName: `${peer.firstName} ${peer.lastName}`, calleeImage: peer.profileImage, type, conversationId: conversation._id });
  };

  const handleLeave = async () => {
    setMenuOpen(false);
    if (!window.confirm(`Are you sure you want to leave ${name}?`)) return;
    try {
      await CONVERSATION_API.leave(conversation._id);
      showToast(`You left ${name}.`, 'success');
      navigate('/chat');
    } catch {
      showToast('Unable to leave conversation.', 'error');
    }
  };

  const toggleMute = () => {
    setMuted((m) => !m);
    setMenuOpen(false);
    showToast(muted ? 'Notifications unmuted for this chat.' : 'Notifications muted for this chat.', 'info');
  };

  return (
    <header className="chat-header">
      <div className="chat-header__info">
        <button className="btn-icon" style={{ display: 'none' }} onClick={onBack}><ArrowLeft size={18} /></button>
        {isDirect ? <UserAvatar user={peer} size={40} showStatus /> : (
          <div className="avatar" style={{ width: 40, height: 40, background: 'var(--color-primary)', color: '#fff' }}>
            <div className="avatar__fallback" style={{ fontWeight: 700 }}>{conversation.type === 'team' ? '🏢' : (name || 'T').charAt(0)}</div>
          </div>
        )}
        <div>
          <div className="chat-header__name">{name}</div>
          <div className="chat-header__status">
            {isDirect ? (
              online ? (
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>🟢 Available</span>
              ) : (
                <span className="muted">{lastSeenDate ? `Last seen ${formatRelativeTime(lastSeenDate)}` : 'Offline'}</span>
              )
            ) : (
              `${conversation.memberCount || ''} members`
            )}
            {isDirect && peer?.jobTitle && <span> · {peer.jobTitle}</span>}
          </div>
        </div>
      </div>

      <div className="chat-header__actions">
        {isDirect && (
          <>
            <button className="btn btn-primary text-xs flex items-center gap-1" style={{ height: 32, padding: '0 12px' }} onClick={() => startCall('video')} title="Video call">
              <Video size={14} /> Meet
            </button>
            <button className="btn-icon" onClick={() => startCall('audio')} title="Audio call"><Phone size={16} /></button>
          </>
        )}
        <button className="btn-icon" onClick={() => setWallpaperOpen(true)} title="Change chat wallpaper & background"><Palette size={17} /></button>
        <button className="btn-icon" onClick={onOpenPinned} title="Pinned messages"><Pin size={17} /></button>
        <button className="btn-icon" onClick={onOpenFiles} title="Shared files"><Folder size={17} /></button>
        <div style={{ position: 'relative' }}>
          <button className="btn-icon" onClick={() => setMenuOpen((o) => !o)}><MoreVertical size={17} /></button>
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 5 }} onClick={() => setMenuOpen(false)} />
              <div className="card" style={{ position: 'absolute', right: 0, top: 44, width: 200, padding: 6, zIndex: 6 }}>
                <button className="btn-ghost text-sm flex items-center gap-2" style={{ width: '100%', textAlign: 'left', padding: 9 }} onClick={() => { setWallpaperOpen(true); setMenuOpen(false); }}>
                  <Palette size={14} /> Chat wallpaper
                </button>
                <button className="btn-ghost text-sm flex items-center gap-2" style={{ width: '100%', textAlign: 'left', padding: 9 }} onClick={() => { onOpenPinned(); setMenuOpen(false); }}>
                  <Pin size={14} /> Pinned messages
                </button>
                <button className="btn-ghost text-sm flex items-center gap-2" style={{ width: '100%', textAlign: 'left', padding: 9 }} onClick={() => { onOpenFiles(); setMenuOpen(false); }}>
                  <Folder size={14} /> Shared files
                </button>
                <button className="btn-ghost text-sm flex items-center gap-2" style={{ width: '100%', textAlign: 'left', padding: 9 }} onClick={toggleMute}>
                  <VolumeX size={14} /> {muted ? 'Unmute' : 'Mute'} notifications
                </button>
                {!isDirect && (
                  <button className="btn-ghost text-sm flex items-center gap-2" style={{ width: '100%', textAlign: 'left', padding: 9, color: 'var(--color-danger)' }} onClick={handleLeave}>
                    <LogOut size={14} /> Leave conversation
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <WallpaperModal open={wallpaperOpen} onClose={() => setWallpaperOpen(false)} />
    </header>
  );
}
