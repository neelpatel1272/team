import { useEffect, useState } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import Topbar from '../components/Topbar';
import UserAvatar from '../components/UserAvatar';
import EmptyState from '../components/EmptyState';
import { Skeleton } from '../components/LoadingSkeleton';
import { CALL_API } from '../services/api';
import { useCall } from '../contexts/CallContext';
import { formatDuration, formatRelativeTime } from '../utils/format';

const FILTERS = ['all', 'incoming', 'outgoing', 'missed'];

export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { placeCall } = useCall();

  useEffect(() => {
    CALL_API.history().then(({ data }) => setCalls(data.data.calls)).finally(() => setLoading(false));
  }, []);

  const filtered = calls.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'missed') return c.status === 'missed' || c.status === 'declined';
    return c.direction === filter;
  });

  const iconFor = (c) => {
    if (c.status === 'missed' || c.status === 'declined') return <PhoneMissed size={16} color="var(--color-danger)" />;
    return c.direction === 'incoming' ? <PhoneIncoming size={16} color="var(--color-success)" /> : <PhoneOutgoing size={16} color="var(--color-primary)" />;
  };

  const callBack = (call, type) => {
    const peer = call.direction === 'incoming' ? call.caller : call.callee;
    placeCall({ calleeId: peer._id, calleeName: `${peer.firstName} ${peer.lastName}`, calleeImage: peer.profileImage, type, conversationId: call.conversation });
  };

  return (
    <div className="main-pane" style={{ width: '100%' }}>
      <Topbar title="Calls" />
      <div className="page-container">
        <div className="flex gap-2" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button key={f} className={`btn text-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: 8 }}>
          {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={50} style={{ margin: 8 }} />)}

          {!loading && filtered.length === 0 && (
            <EmptyState icon={<Phone size={26} className="muted" />} title="No calls yet" description="Your call history will show up here." />
          )}

          {!loading && filtered.map((c) => {
            const peer = c.direction === 'incoming' ? c.caller : c.callee;
            return (
              <div key={c._id} className="convo-item" style={{ borderRadius: 10 }}>
                <UserAvatar user={peer} size={42} />
                <div className="convo-item__body">
                  <div className="convo-item__name">{peer.firstName} {peer.lastName}</div>
                  <div className="convo-item__preview flex items-center gap-1">
                    {iconFor(c)}
                    {c.type === 'video' ? 'Video call' : 'Audio call'} · {formatRelativeTime(c.createdAt)}
                    {c.durationSeconds > 0 && ` · ${formatDuration(c.durationSeconds)}`}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="btn-icon" onClick={() => callBack(c, 'audio')}><Phone size={15} /></button>
                  <button className="btn-icon" onClick={() => callBack(c, 'video')}><Video size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
