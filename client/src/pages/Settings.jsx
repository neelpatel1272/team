import { useState } from 'react';
import { Sun, Moon, Monitor, Bell, Lock, Phone as PhoneIcon, User as UserIcon } from 'lucide-react';
import Topbar from '../components/Topbar';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { USER_API } from '../services/api';
import { playNotificationSound } from '../utils/sound';

const TABS = [
  { key: 'account', label: 'Account', icon: UserIcon },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'appearance', label: 'Appearance', icon: Sun },
  { key: 'security', label: 'Security', icon: Lock },
  { key: 'calls', label: 'Calls', icon: PhoneIcon },
];

export default function Settings() {
  const [tab, setTab] = useState('account');
  const { user } = useAuth();

  return (
    <div className="main-pane" style={{ width: '100%' }}>
      <Topbar title="Settings" />
      <div className="flex" style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ width: 220, borderRight: '1px solid var(--color-border)', padding: 16, flexShrink: 0 }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`btn-ghost flex items-center gap-2 text-sm`}
              style={{
                width: '100%', justifyContent: 'flex-start', padding: 10, marginBottom: 4, borderRadius: 10,
                background: tab === key ? 'var(--color-surface-alt)' : 'transparent',
                color: tab === key ? 'var(--color-text)' : 'var(--color-text-muted)',
                fontWeight: tab === key ? 600 : 500,
              }}
              onClick={() => setTab(key)}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: 28, overflowY: 'auto', maxWidth: 620 }}>
          {tab === 'account' && <AccountTab user={user} />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'appearance' && <AppearanceTab />}
          {tab === 'security' && <SecurityTab />}
          {tab === 'calls' && <CallsTab />}
        </div>
      </div>
    </div>
  );
}

function AccountTab({ user }) {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Account</h2>
      <div className="field">
        <label>Email</label>
        <input className="input" value={user.email} disabled />
      </div>
      <div className="field">
        <label>Department</label>
        <input className="input" value={user.department} disabled />
      </div>
      <div className="field">
        <label>Employee ID</label>
        <input className="input" value={user.employeeId || '—'} disabled />
      </div>
      <p className="muted text-sm">Head to your Profile page to edit your name, title, and photo.</p>
    </div>
  );
}

function NotificationsTab() {
  const { user, updateLocalUser } = useAuth();
  const { showToast } = useToast();
  const [prefs, setPrefs] = useState(user.settings?.notifications || { messages: true, calls: true, mentions: true, sound: true });

  const toggle = async (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    if (key === 'sound' && next.sound) {
      playNotificationSound();
    }
    try {
      await USER_API.updateSettings({ notifications: next });
      updateLocalUser({ settings: { ...user.settings, notifications: next } });
    } catch {
      showToast('Unable to update notification settings.', 'error');
    }
  };

  const rows = [
    { key: 'messages', label: 'Message notifications' },
    { key: 'calls', label: 'Call notifications' },
    { key: 'mentions', label: 'Mentions' },
    { key: 'sound', label: 'Notification sound' },
  ];

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Notifications</h2>
      {rows.map((r) => (
        <div key={r.key} className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <span className="text-sm">{r.label}</span>
            {r.key === 'sound' && (
              <button
                type="button"
                className="btn-ghost text-xs"
                style={{ padding: '2px 8px', color: 'var(--color-primary)' }}
                onClick={() => playNotificationSound()}
              >
                (Play preview)
              </button>
            )}
          </div>
          <ToggleSwitch checked={prefs[r.key]} onChange={() => toggle(r.key)} />
        </div>
      ))}
    </div>
  );
}

function AppearanceTab() {
  const { theme, setTheme, chatBackground, setChatBackground, wallpaperPresets } = useTheme();
  const { showToast } = useToast();
  const [customUrl, setCustomUrl] = useState(
    chatBackground?.startsWith('http') || chatBackground?.startsWith('data:') ? chatBackground : ''
  );

  const options = [
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'dark', label: 'Dark', icon: Moon },
    { key: 'system', label: 'System', icon: Monitor },
  ];

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    setChatBackground(customUrl.trim());
    showToast('Custom wallpaper applied.', 'success');
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Appearance & Themes</h2>

      <div style={{ marginBottom: 24 }}>
        <label className="text-xs font-bold muted" style={{ display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Color Theme
        </label>
        <div className="flex gap-3">
          {options.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className="card flex-col items-center gap-2"
              style={{ padding: 18, width: 120, borderColor: theme === key ? 'var(--color-primary)' : undefined, borderWidth: theme === key ? 2 : 1 }}
              onClick={() => setTheme(key)}
            >
              <Icon size={22} />
              <span className="text-sm font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20, marginBottom: 24 }}>
        <label className="text-xs font-bold muted" style={{ display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Chat Wallpaper & Background
        </label>
        <p className="muted text-xs" style={{ margin: '0 0 14px' }}>
          Select a background theme for your chat rooms and channels.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, marginBottom: 18 }}>
          {wallpaperPresets.map((preset) => {
            const isSelected = chatBackground === preset.id;
            return (
              <div
                key={preset.id}
                className="card cursor-pointer hover-shadow"
                style={{
                  padding: 8,
                  borderRadius: 10,
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onClick={() => {
                  setChatBackground(preset.id);
                  showToast(`Background set to ${preset.name}.`, 'success');
                }}
              >
                <div
                  style={{
                    height: 56,
                    borderRadius: 6,
                    background: preset.style === 'transparent' ? 'var(--color-surface-alt)' : preset.style,
                    border: '1px solid var(--color-border)',
                    marginBottom: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected && (
                    <span
                      style={{
                        background: 'var(--color-primary)',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold" style={{ textAlign: 'center' }}>{preset.name}</div>
                <div className="text-xs muted" style={{ textAlign: 'center', fontSize: 10 }}>{preset.category}</div>
              </div>
            );
          })}
        </div>

        <div style={{ background: 'var(--color-surface-alt)', padding: 14, borderRadius: 10 }}>
          <label className="text-xs font-bold" style={{ display: 'block', marginBottom: 6 }}>
            Custom Image Background URL
          </label>
          <form onSubmit={handleApplyCustom} className="flex gap-2">
            <input
              className="input"
              style={{ flex: 1, padding: '8px 12px', fontSize: 12 }}
              placeholder="https://example.com/custom-wallpaper.jpg"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary text-xs"
              disabled={!customUrl.trim() || customUrl.trim() === chatBackground}
            >
              Apply
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return showToast('New passwords do not match.', 'error');
    setLoading(true);
    try {
      await USER_API.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      showToast('Password updated successfully.', 'success');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to update password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Security</h2>
      <form onSubmit={submit}>
        <div className="field">
          <label>Current password</label>
          <input type="password" className="input" value={form.currentPassword} onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))} required />
        </div>
        <div className="field">
          <label>New password</label>
          <input type="password" className="input" value={form.newPassword} onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))} minLength={8} required />
        </div>
        <div className="field">
          <label>Confirm new password</label>
          <input type="password" className="input" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} minLength={8} required />
        </div>
        <button className="btn btn-primary" disabled={loading} type="submit">Update password</button>
      </form>
    </div>
  );
}

function CallsTab() {
  const [prefs, setPrefs] = useState({ ringtone: true, echoCancellation: true });
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Calls</h2>
      <div className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
        <span className="text-sm">Play ringtone for incoming calls</span>
        <ToggleSwitch checked={prefs.ringtone} onChange={() => setPrefs((p) => ({ ...p, ringtone: !p.ringtone }))} />
      </div>
      <div className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
        <span className="text-sm">Echo cancellation</span>
        <ToggleSwitch checked={prefs.echoCancellation} onChange={() => setPrefs((p) => ({ ...p, echoCancellation: !p.echoCancellation }))} />
      </div>
      <p className="muted text-sm" style={{ marginTop: 12 }}>
        STUN/TURN servers are configured by your administrator via server environment variables.
      </p>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 42, height: 24, borderRadius: 999, border: 'none', position: 'relative',
        background: checked ? 'var(--color-primary)' : 'var(--color-border)', transition: 'background 150ms ease',
      }}
    >
      <span
        style={{
          position: 'absolute', top: 2, left: checked ? 20 : 2, width: 20, height: 20, borderRadius: '50%',
          background: '#fff', transition: 'left 150ms ease', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}
