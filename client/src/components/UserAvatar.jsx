import { fileUrl } from '../services/api';
import { initials } from '../utils/format';
import { useSocketContext } from '../contexts/SocketContext';

export default function UserAvatar({ user, size = 40, showStatus = false }) {
  const { isOnline, getUserStatus } = useSocketContext();
  if (!user) return null;

  const online = showStatus && isOnline(user._id);
  const status = showStatus ? (online ? 'online' : 'offline') : null;

  return (
    <div className="avatar" style={{ width: size, height: size }}>
      {user.profileImage ? (
        <img src={fileUrl(user.profileImage)} alt={`${user.firstName || ''} ${user.lastName || ''}`} />
      ) : (
        <div className="avatar__fallback" style={{ fontSize: size * 0.38 }}>
          {initials(user.firstName || '', user.lastName || '')}
        </div>
      )}
      {showStatus && <span className={`status-dot ${status}`} />}
    </div>
  );
}
