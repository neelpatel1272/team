import { NavLink } from 'react-router-dom';
import { Bell, MessageSquare, Phone, Folder, Users, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocketContext } from '../contexts/SocketContext';
import UserAvatar from './UserAvatar';

export default function Sidebar() {
  const { user } = useAuth();
  const { unreadNotifCount } = useSocketContext();

  const NAV_ITEMS = [
    { to: '/', icon: Bell, label: 'Activity', end: true, badge: unreadNotifCount },
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/teams', icon: Users, label: 'Teams' },
    { to: '/calls', icon: Phone, label: 'Calls' },
    { to: '/files', icon: Folder, label: 'Files' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="rail">
      <div className="rail__top">
        <NavLink to="/" className="rail__logo" title="Microsoft Teams">
          <img src="/teams-icon.svg" alt="Teams" style={{ width: 34, height: 34, borderRadius: 8 }} />
        </NavLink>
      </div>

      <nav className="rail__nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `rail__item${isActive ? ' active' : ''}`}
            title={label}
            aria-label={label}
          >
            <div className="rail__icon-wrapper">
              <Icon size={20} />
              {Boolean(badge && badge > 0) && (
                <span className="rail__badge">{badge > 99 ? '99+' : badge}</span>
              )}
            </div>
            <span className="rail__label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="rail__bottom">
        <NavLink to="/profile" className="rail__user-btn" title={`${user?.firstName || ''} ${user?.lastName || ''}`}>
          <UserAvatar user={user} size={34} showStatus />
        </NavLink>
      </div>
    </aside>
  );
}
