import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, Plus, X, MessageSquare, Settings, UserPlus, UserMinus, Trash2, ShieldCheck, Search, Check } from 'lucide-react';
import Topbar from '../components/Topbar';
import EmptyState from '../components/EmptyState';
import { Skeleton } from '../components/LoadingSkeleton';
import { TEAM_API, USER_API } from '../services/api';
import UserAvatar from '../components/UserAvatar';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export default function Teams() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { teamId } = useParams();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [manageTeam, setManageTeam] = useState(null);
  const navigate = useNavigate();

  const loadTeams = useCallback(async () => {
    try {
      const { data } = await TEAM_API.list();
      const loaded = data.data.teams || [];
      setTeams(loaded);
      if (teamId) {
        const found = loaded.find((t) => t._id === teamId);
        if (found) setManageTeam(found);
      }
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleDeleteTeamDirect = async (e, team) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete the team "${team.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await TEAM_API.delete(team._id);
      showToast(`Team "${team.name}" deleted successfully.`, 'success');
      loadTeams();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete team.', 'error');
    }
  };

  return (
    <div className="main-pane" style={{ width: '100%' }}>
      <Topbar title="Teams & Channels" />
      <div className="page-container">
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Team Workspaces</h2>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>Collaborate in channels, share files, and manage your department spaces.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
            <Plus size={15} /> Create team
          </button>
        </div>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={150} />)}
          </div>
        )}

        {!loading && teams.length === 0 && (
          <EmptyState
            icon={<Users size={28} className="muted" />}
            title="No teams yet"
            description="Create a team space to collaborate with your teammates."
            action={
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setCreateModalOpen(true)}>
                <Plus size={15} /> Create your first team
              </button>
            }
          />
        )}

        {!loading && teams.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
            {teams.map((team) => {
              const creatorId = String(team.createdBy?._id || team.createdBy || '');
              const isCreator = creatorId === String(user?._id);
              const conversationId = team.conversation?._id || team.conversation;

              return (
                <div
                  key={team._id}
                  className="card hover-shadow"
                  style={{
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    position: 'relative',
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between" style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: team.color || 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                          color: '#fff',
                          fontWeight: 700,
                        }}
                      >
                        {team.icon || team.name.charAt(0)}
                      </div>
                      {isCreator && (
                        <div className="flex items-center gap-1">
                          <span
                            className="badge-pill"
                            style={{
                              background: 'rgba(99, 102, 241, 0.12)',
                              color: 'var(--color-primary)',
                              fontSize: 11,
                              padding: '3px 8px',
                              fontWeight: 600,
                              borderRadius: 6,
                            }}
                          >
                            <ShieldCheck size={12} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                            Creator
                          </span>
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--color-danger)', width: 28, height: 28, padding: 0 }}
                            title="Delete team"
                            onClick={(e) => handleDeleteTeamDirect(e, team)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="font-bold" style={{ fontSize: 16, marginBottom: 4 }}>{team.name}</div>
                    <div className="text-sm muted" style={{ marginBottom: 14, minHeight: 38, lineHeight: 1.4 }}>
                      {team.description || 'General team discussion channel and workspace.'}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs muted" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={14} /> {team.memberCount} member{team.memberCount === 1 ? '' : 's'}
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="btn btn-primary text-xs flex-1 flex items-center justify-center gap-1"
                        style={{ height: 34 }}
                        onClick={() => navigate(`/chat/${conversationId}`)}
                      >
                        <MessageSquare size={14} /> Open Channel
                      </button>
                      <button
                        className="btn btn-outline text-xs flex items-center justify-center gap-1"
                        style={{ height: 34, padding: '0 12px' }}
                        onClick={() => setManageTeam(team)}
                        title="Manage team members & settings"
                      >
                        <Settings size={14} /> Members
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <NewTeamModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={loadTeams}
      />

      {manageTeam && (
        <ManageTeamModal
          team={manageTeam}
          onClose={() => setManageTeam(null)}
          onUpdated={loadTeams}
        />
      )}
    </div>
  );
}

function ManageTeamModal({ team, onClose, onUpdated }) {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const creatorId = String(team.createdBy?._id || team.createdBy || '');
  const isCreator = creatorId === String(currentUser?._id);

  const fetchDetails = useCallback(async () => {
    try {
      const [teamRes, usersRes] = await Promise.all([
        TEAM_API.get(team._id),
        USER_API.list({ includeSelf: false }),
      ]);
      setMembers(teamRes.data.data.members || []);
      setAllUsers(usersRes.data.data.users || []);
    } catch {
      showToast('Failed to load team members.', 'error');
    } finally {
      setLoading(false);
    }
  }, [team._id, showToast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleRemoveMember = async (targetUser) => {
    if (!isCreator) {
      showToast('Only the team creator can remove members.', 'error');
      return;
    }
    const targetUserId = String(targetUser._id);
    if (targetUserId === creatorId) {
      showToast('The team creator cannot be removed.', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove ${targetUser.firstName} ${targetUser.lastName} from "${team.name}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await TEAM_API.removeMember(team._id, targetUserId);
      showToast(`${targetUser.firstName} has been removed from the team.`, 'success');
      await fetchDetails();
      onUpdated();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove member.';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!isCreator) {
      showToast('Only the team creator can delete this team.', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete the team "${team.name}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await TEAM_API.delete(team._id);
      showToast('Team deleted successfully.', 'success');
      onUpdated();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete team.';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const u = m.user;
    if (!u) return false;
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const query = searchFilter.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 540, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: team.color || 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {team.icon || team.name.charAt(0)}
            </div>
            <div>
              <span className="modal__title" style={{ fontSize: 16 }}>{team.name}</span>
              <div className="text-xs muted">{members.length} member{members.length === 1 ? '' : 's'}</div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal__body" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {team.description && (
            <div className="text-xs muted" style={{ marginBottom: 16, background: 'var(--color-surface-alt)', padding: '8px 12px', borderRadius: 8 }}>
              {team.description}
            </div>
          )}

          <div className="flex items-center justify-between gap-2" style={{ marginBottom: 12 }}>
            <div className="flex items-center gap-2" style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '6px 10px', flex: 1 }}>
              <Search size={14} className="muted" />
              <input
                style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 12 }}
                placeholder="Search team members..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary text-xs flex items-center gap-1"
              style={{ height: 32, padding: '0 12px' }}
              onClick={() => setAddModalOpen(true)}
            >
              <UserPlus size={14} /> Add members
            </button>
          </div>

          {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={48} style={{ marginBottom: 8 }} />)}

          {!loading && (
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
              {filteredMembers.map((m) => {
                const u = m.user;
                if (!u) return null;
                const isMemberCreator = String(u._id) === creatorId;
                const isSelf = String(u._id) === String(currentUser?._id);

                return (
                  <div
                    key={m._id || u._id}
                    className="flex items-center justify-between p-2"
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--color-border)',
                      background: isSelf ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar user={u} size={36} showStatus />
                      <div className="min-w-0">
                        <div className="text-sm font-bold flex items-center gap-1">
                          {u.firstName} {u.lastName}
                          {isSelf && <span className="text-xs muted font-normal">(You)</span>}
                        </div>
                        <div className="text-xs muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.jobTitle || u.department || u.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isMemberCreator ? (
                        <span
                          className="badge-pill"
                          style={{
                            background: 'rgba(99, 102, 241, 0.12)',
                            color: 'var(--color-primary)',
                            fontSize: 11,
                            padding: '2px 8px',
                            fontWeight: 600,
                            borderRadius: 99,
                          }}
                        >
                          Creator
                        </span>
                      ) : (
                        <span className="text-xs muted">Member</span>
                      )}

                      {/* Only team creator can remove other members */}
                      {isCreator && !isMemberCreator && (
                        <button
                          className="btn-icon"
                          style={{ color: 'var(--color-danger)', width: 28, height: 28, padding: 0 }}
                          title={`Remove ${u.firstName} from team`}
                          disabled={actionLoading}
                          onClick={() => handleRemoveMember(u)}
                        >
                          <UserMinus size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredMembers.length === 0 && (
                <div className="text-xs muted" style={{ padding: 20, textAlign: 'center' }}>
                  No members matched your search.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal__footer flex justify-between items-center" style={{ padding: '12px 20px' }}>
          {isCreator ? (
            <button
              className="btn btn-outline text-xs flex items-center gap-1"
              style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
              onClick={handleDeleteTeam}
              disabled={actionLoading}
            >
              <Trash2 size={13} /> Delete Team
            </button>
          ) : (
            <span className="text-xs muted">Created by {team.createdBy?.firstName ? `${team.createdBy.firstName} ${team.createdBy.lastName}` : 'Admin'}</span>
          )}
          <button className="btn btn-outline text-xs" onClick={onClose}>Close</button>
        </div>
      </div>

      {addModalOpen && (
        <AddMembersToTeamModal
          team={team}
          existingMembers={members}
          allUsers={allUsers}
          onClose={() => setAddModalOpen(false)}
          onAdded={async () => {
            await fetchDetails();
            onUpdated();
            setAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function AddMembersToTeamModal({ team, existingMembers, allUsers, onClose, onAdded }) {
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const existingIds = new Set(existingMembers.map((m) => String(m.user?._id || m.user)));
  const availableUsers = allUsers.filter((u) => !existingIds.has(String(u._id)));

  const filteredUsers = availableUsers.filter((u) => {
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const q = query.toLowerCase();
    return fullName.includes(q) || email.includes(q);
  });

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAdd = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      await TEAM_API.addMembers(team._id, selected);
      showToast(`Added ${selected.length} member${selected.length === 1 ? '' : 's'} to ${team.name}.`, 'success');
      onAdded();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add members.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay" style={{ zIndex: 60 }} onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440, width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div>
            <span className="modal__title" style={{ fontSize: 16 }}>Add members to {team.name}</span>
            <div className="text-xs muted">Select colleagues to join this team channel</div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal__body" style={{ padding: '16px 20px' }}>
          <div className="flex items-center gap-2" style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '6px 10px', marginBottom: 12 }}>
            <Search size={14} className="muted" />
            <input
              style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 12 }}
              placeholder="Search colleagues by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
            {filteredUsers.map((u) => {
              const isChecked = selected.includes(u._id);
              return (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-2 hover-bg cursor-pointer"
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    background: isChecked ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                  }}
                  onClick={() => toggle(u._id)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(u._id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: 'pointer' }}
                    />
                    <UserAvatar user={u} size={30} showStatus />
                    <div>
                      <div className="text-xs font-bold">{u.firstName} {u.lastName}</div>
                      <div className="text-xs muted">{u.jobTitle || u.department || u.email}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredUsers.length === 0 && (
              <div className="text-xs muted" style={{ padding: 24, textAlign: 'center' }}>
                {availableUsers.length === 0 ? 'All colleagues are already in this team.' : 'No users match your search.'}
              </div>
            )}
          </div>
        </div>

        <div className="modal__footer">
          <button className="btn btn-outline text-xs" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary text-xs flex items-center gap-1"
            disabled={selected.length === 0 || loading}
            onClick={handleAdd}
          >
            <Check size={14} /> Add {selected.length > 0 ? `(${selected.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewTeamModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (open) {
      USER_API.list({ includeSelf: false }).then(({ data }) => setUsers(data.data.users || []));
    } else {
      setName('');
      setDescription('');
      setSelected([]);
    }
  }, [open]);

  if (!open) return null;

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const create = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await TEAM_API.create({ name: name.trim(), description: description.trim(), memberIds: selected });
      showToast(`Team "${name.trim()}" created successfully!`, 'success');
      onCreated();
      onClose();
    } catch {
      showToast('Unable to create team.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480, width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">Create new team space</span>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal__body" style={{ padding: '16px 20px' }}>
          <div className="field">
            <label>Team name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Engineering & DevOps" />
          </div>
          <div className="field">
            <label>Description</label>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this team about?" />
          </div>
          <div className="field">
            <label>Add initial members ({selected.length} selected)</label>
            <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
              {users.map((u) => (
                <div key={u._id} className="convo-item" style={{ borderRadius: 0, padding: '8px 10px' }} onClick={() => toggle(u._id)}>
                  <input type="checkbox" checked={selected.includes(u._id)} readOnly style={{ marginRight: 8, cursor: 'pointer' }} />
                  <UserAvatar user={u} size={28} showStatus />
                  <div className="convo-item__body">
                    <div className="convo-item__name text-xs">{u.firstName} {u.lastName}</div>
                    <div className="text-xs muted">{u.jobTitle || u.department || u.email}</div>
                  </div>
                </div>
              ))}
              {users.length === 0 && <div className="text-xs muted" style={{ padding: 16, textAlign: 'center' }}>No other colleagues found.</div>}
            </div>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn-outline text-xs" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary text-xs" disabled={!name.trim() || loading} onClick={create}>
            Create team
          </button>
        </div>
      </div>
    </div>
  );
}
