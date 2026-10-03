import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Users, Calendar, Folder, PhoneMissed, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocketContext } from '../contexts/SocketContext';
import { CONVERSATION_API, USER_API, CALL_API } from '../services/api';
import Topbar from '../components/Topbar';
import UserAvatar from '../components/UserAvatar';
import { Skeleton } from '../components/LoadingSkeleton';
import { formatRelativeTime } from '../utils/format';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const { socket, isOnline, getLastSeen } = useSocketContext();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [teammates, setTeammates] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamTab, setTeamTab] = useState('all'); // 'online' | 'all'

  const refreshData = () => {
    Promise.all([CONVERSATION_API.list(), USER_API.list({ includeSelf: true }), CALL_API.history()])
      .then(([convRes, userRes, callRes]) => {
        setConversations(convRes.data.data.conversations || []);
        setTeammates(userRes.data.data.users || []);
        setCalls(callRes.data.data.calls || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    socket.on('message:new', refreshData);
    socket.on('message:read', refreshData);
    socket.on('notification:conversation-cleared', refreshData);
    socket.on('call:ringing', refreshData);
    socket.on('call:end', refreshData);
    return () => {
      socket.off('message:new', refreshData);
      socket.off('message:read', refreshData);
      socket.off('notification:conversation-cleared', refreshData);
      socket.off('call:ringing', refreshData);
      socket.off('call:end', refreshData);
    };
  }, [socket]);

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const onlineTeammates = teammates.filter((t) => isOnline(t._id));
  const onlineCount = onlineTeammates.length;

  // Include missed, declined, or unanswered ringing incoming calls
  const missedCalls = calls.filter((c) =>
    (c.status === 'missed' || c.status === 'declined' || c.status === 'ringing') &&
    c.direction === 'incoming'
  );

  const displayedTeammates = teamTab === 'online' ? onlineTeammates : teammates;
  const recentConversations = conversations.slice(0, 5);

  const startChatWith = async (targetUserId) => {
    if (String(targetUserId) === String(user?._id)) {
      navigate('/profile');
      return;
    }
    try {
      const res = await CONVERSATION_API.openDirect(targetUserId);
      const convoId = res.data.data.conversation._id;
      navigate(`/chat/${convoId}`);
    } catch (e) {
      navigate('/chat');
    }
  };

  return (
    <div className="main-pane" style={{ width: '100%' }}>
      <Topbar title="Teams Workspace Hub" />
      <div style={{ padding: 28, overflowY: 'auto', flex: 1 }}>
        <div className="teams-welcome-banner" style={{ marginBottom: 24 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700 }}>{greeting()}, {user?.firstName || 'there'} 👋</h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>Welcome back to Microsoft Teams. Here is your workspace activity overview.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard icon={<MessageCircle size={20} color="var(--color-primary)" />} value={unreadTotal} label="Unread Messages" onClick={() => navigate('/chat')} />
          <StatCard icon={<Users size={20} color="var(--color-success)" />} value={onlineCount} label="Available Online" onClick={() => setTeamTab('online')} />
          <StatCard icon={<PhoneMissed size={20} color="var(--color-danger)" />} value={missedCalls.length} label="Missed Calls" onClick={() => navigate('/calls')} />
          <StatCard icon={<Folder size={20} color="var(--color-primary)" />} value={conversations.length} label="Active Channels" onClick={() => navigate('/files')} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <div className="flex items-center gap-2">
                <MessageCircle size={18} color="var(--color-primary)" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Recent conversations</h3>
              </div>
              <button className="btn-ghost text-sm" onClick={() => navigate('/chat')} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>View all</button>
            </div>
            {loading && <Skeleton height={60} style={{ marginBottom: 10 }} />}
            {!loading && recentConversations.length === 0 && <div className="muted text-sm" style={{ padding: 16, textAlign: 'center' }}>No conversations yet.</div>}
            {!loading && recentConversations.map((c) => {
              const label = c.type === 'direct' ? (c.otherUser ? `${c.otherUser.firstName} ${c.otherUser.lastName}` : 'Direct message') : c.name;
              return (
                <div key={c._id} className="convo-item" style={{ borderRadius: 10, padding: '10px 8px', marginBottom: 4 }} onClick={() => navigate(`/chat/${c._id}`)}>
                  {c.type === 'direct' ? <UserAvatar user={c.otherUser} size={40} showStatus /> : (
                    <div className="avatar" style={{ width: 40, height: 40, background: 'var(--color-primary)', color: '#fff' }}>
                      <div className="avatar__fallback" style={{ fontWeight: 700 }}>{(label || 'T').charAt(0)}</div>
                    </div>
                  )}
                  <div className="convo-item__body">
                    <div className="convo-item__name font-bold">{label}</div>
                    <div className="convo-item__preview">{c.lastMessage?.content || 'No messages yet'}</div>
                  </div>
                  {c.unreadCount > 0 && <span className="unread-badge">{c.unreadCount}</span>}
                </div>
              );
            })}
          </div>

          <div className="flex-col gap-3">
            <div className="card" style={{ padding: 20 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                <div className="flex items-center gap-2">
                  <Users size={18} color="var(--color-primary)" />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Teammates</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    className={`btn text-xs ${teamTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '4px 10px', height: 28 }}
                    onClick={() => setTeamTab('all')}
                  >
                    All ({teammates.length})
                  </button>
                  <button
                    className={`btn text-xs ${teamTab === 'online' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '4px 10px', height: 28 }}
                    onClick={() => setTeamTab('online')}
                  >
                    Online ({onlineCount})
                  </button>
                </div>
              </div>

              {loading && <Skeleton height={40} />}
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {!loading && displayedTeammates.slice(0, 12).map((t) => {
                  const isSelf = String(t._id) === String(user?._id);
                  const online = isOnline(t._id);
                  const lastSeenDate = getLastSeen(t._id, t.lastSeen);
                  return (
                    <div
                      key={t._id}
                      className="flex items-center justify-between p-2 rounded-md hover-bg cursor-pointer"
                      style={{ padding: '8px 6px', borderRadius: 8 }}
                      onClick={() => startChatWith(t._id)}
                    >
                      <div className="flex items-center gap-2">
                        <UserAvatar user={t} size={34} showStatus />
                        <div>
                          <div className="text-sm font-bold flex items-center gap-1">
                            {t.firstName} {t.lastName}
                            {isSelf && (
                              <span className="text-xs muted" style={{ fontWeight: 500, opacity: 0.8 }}>(You)</span>
                            )}
                          </div>
                          <div className="text-xs muted">{t.jobTitle || t.department}</div>
                        </div>
                      </div>
                      <div className="text-xs font-semibold" style={{ color: online ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                        {online ? (isSelf ? '🟢 Active now' : '🟢 Available') : (lastSeenDate ? `Last seen ${formatRelativeTime(lastSeenDate)}` : 'Offline')}
                      </div>
                    </div>
                  );
                })}
                {!loading && displayedTeammates.length === 0 && (
                  <div className="muted text-sm" style={{ padding: 16, textAlign: 'center' }}>
                    {teamTab === 'online' ? 'No teammates currently online.' : 'No teammates found.'}
                  </div>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <div className="flex items-center gap-2">
                  <PhoneMissed size={18} color="var(--color-danger)" />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Missed calls</h3>
                  {missedCalls.length > 0 && (
                    <span style={{ background: 'var(--color-danger)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>
                      {missedCalls.length}
                    </span>
                  )}
                </div>
                <button className="btn-ghost text-sm" onClick={() => navigate('/calls')} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>View all</button>
              </div>

              {missedCalls.length === 0 && (
                <div className="muted text-sm" style={{ padding: '16px 0', textAlign: 'center' }}>No missed calls. 🎉</div>
              )}

              {missedCalls.slice(0, 4).map((c) => {
                const callerName = c.caller ? `${c.caller.firstName} ${c.caller.lastName}` : 'Incoming call';
                return (
                  <div key={c._id} className="flex items-center justify-between" style={{ padding: '8px 4px', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {c.type === 'video' ? <Video size={14} color="var(--color-danger)" /> : <PhoneMissed size={14} color="var(--color-danger)" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold">{callerName}</div>
                        <div className="text-xs muted">{formatRelativeTime(c.createdAt)}</div>
                      </div>
                    </div>
                    <button
                      className="btn btn-outline text-xs flex items-center gap-1"
                      style={{ padding: '4px 10px', height: 28, borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                      title="Call back"
                      onClick={() => navigate('/calls')}
                    >
                      Call back
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="flex items-center gap-2 muted">{icon}</div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  );
}
