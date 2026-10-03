import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import Topbar from '../components/Topbar';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { USER_API } from '../services/api';

export default function Profile() {
  const { user, updateLocalUser } = useAuth();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    jobTitle: user.jobTitle || '',
    department: user.department || '',
    phone: user.phone || '',
    about: user.about || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await USER_API.updateProfile(form);
      updateLocalUser(data.data.user);
      setEditing(false);
      showToast('Profile updated.', 'success');
    } catch {
      showToast('Unable to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="main-pane" style={{ width: '100%' }}>
      <Topbar title="Profile" />
      <div style={{ padding: 28, overflowY: 'auto', flex: 1, maxWidth: 640 }}>
        <div className="card" style={{ padding: 28 }}>
          <div className="flex items-center gap-4" style={{ marginBottom: 24 }}>
            <UserAvatar user={user} size={84} showStatus />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{user.firstName} {user.lastName}</div>
              <div className="muted text-sm">{user.jobTitle || 'Team member'} · {user.department}</div>
              <div className="muted text-sm">{user.email}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              {!editing ? (
                <button className="btn btn-outline" onClick={() => setEditing(true)}><Pencil size={14} /> Edit</button>
              ) : (
                <div className="flex gap-2">
                  <button className="btn btn-outline" onClick={() => setEditing(false)}><X size={14} /> Cancel</button>
                  <button className="btn btn-primary" disabled={saving} onClick={save}><Check size={14} /> Save</button>
                </div>
              )}
            </div>
          </div>

          {editing ? (
            <>
              <div className="flex gap-2">
                <div className="field" style={{ flex: 1 }}>
                  <label>First name</label>
                  <input className="input" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Last name</label>
                  <input className="input" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="field" style={{ flex: 1 }}>
                  <label>Job title</label>
                  <input className="input" value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Department</label>
                  <input className="input" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label>Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="field">
                <label>About</label>
                <textarea className="input" rows={3} value={form.about} onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))} />
              </div>
            </>
          ) : (
            <div className="flex-col gap-3">
              <ProfileRow label="Phone" value={user.phone || '—'} />
              <ProfileRow label="Employee ID" value={user.employeeId || '—'} />
              <ProfileRow label="About" value={user.about || 'No bio added yet.'} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
      <div className="text-sm muted">{label}</div>
      <div className="text-sm" style={{ marginTop: 2 }}>{value}</div>
    </div>
  );
}
