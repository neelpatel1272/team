import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, User as UserIcon, Settings as SettingsIcon, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocketContext } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import UserAvatar from './UserAvatar';
import SearchModal from './SearchModal';
import NotificationPanel from './NotificationPanel';

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const { unreadNotifCount, connectionState } = useSocketContext();
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="teams-topbar">
      <div className="teams-topbar__left">
        <span className="teams-topbar__title">{title}</span>
        {connectionState !== 'connected' && (
          <span
            className="text-xs"
            style={{
              color: connectionState === 'reconnecting' ? 'var(--color-warning)' : 'var(--color-danger)',
              fontWeight: 600,
              background: 'rgba(0,0,0,0.06)',
              padding: '2px 8px',
              borderRadius: 4,
            }}
          >
            {connectionState === 'reconnecting' ? '🟡 Reconnecting...' : '🔴 Offline'}
          </span>
        )}
      </div>

      <div className="teams-topbar__center">
        <div className="teams-search-pill" onClick={() => setSearchOpen(true)}>
          <Search size={14} className="muted" />
          <span className="teams-search-placeholder">Search or type a command</span>
          <kbd className="teams-kbd">Ctrl K</kbd>
        </div>
      </div>

      <div className="teams-topbar__right">
        <button className="btn-icon" title="Toggle dark/light theme" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button className="btn-icon" style={{ position: 'relative' }} title="Notifications" onClick={() => setNotifOpen((o) => !o)}>
          <Bell size={18} />
          {unreadNotifCount > 0 && <span className="rail__badge" style={{ top: -2, right: -2 }}>{unreadNotifCount}</span>}
        </button>

        <div style={{ position: 'relative' }}>
          <button className="btn-ghost" style={{ borderRadius: '50%', padding: 2 }} onClick={() => setMenuOpen((o) => !o)}>
            <UserAvatar user={user} size={32} showStatus />
          </button>

          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
              <div
                className="card"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 42,
                  width: 230,
                  padding: 8,
                  zIndex: 41,
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)', marginBottom: 6 }}>
                  <div className="font-bold text-sm">{user?.firstName || ''} {user?.lastName || ''}</div>
                  <div className="text-xs muted">{user?.email || ''}</div>
                  <div className="text-xs flex items-center gap-1" style={{ marginTop: 4, color: 'var(--color-success)', fontWeight: 600 }}>
                    <span className="status-dot online" style={{ position: 'static' }} /> Active now
                  </div>
                </div>

                <button
                  className="btn-ghost flex items-center gap-2 text-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 10px', borderRadius: 4 }}
                  onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                >
                  <UserIcon size={15} /> Profile
                </button>
                <button
                  className="btn-ghost flex items-center gap-2 text-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 10px', borderRadius: 4 }}
                  onClick={() => { setMenuOpen(false); navigate('/settings'); }}
                >
                  <SettingsIcon size={15} /> Settings
                </button>
                <button
                  className="btn-ghost flex items-center gap-2 text-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 10px', color: 'var(--color-danger)', borderRadius: 4 }}
                  onClick={logout}
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </header>
  );
}
