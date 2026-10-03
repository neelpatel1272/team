import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '../contexts/CallContext';
import UserAvatar from './UserAvatar';

export default function IncomingCallToast() {
  const { incomingCall, acceptCall, declineCall } = useCall();
  if (!incomingCall) return null;

  const { caller, type } = incomingCall;

  return (
    <div className="incoming-call-toast">
      <div className="flex items-center gap-3">
        <UserAvatar user={{ firstName: caller.name?.split(' ')[0], lastName: caller.name?.split(' ')[1], profileImage: caller.profileImage }} size={48} />
        <div>
          <div className="font-bold">{caller.name}</div>
          <div className="muted text-sm flex items-center gap-1">
            {type === 'video' ? <Video size={13} /> : <Phone size={13} />}
            Incoming {type} call...
          </div>
        </div>
      </div>
      <div className="flex gap-2" style={{ marginTop: 14 }}>
        <button className="btn btn-danger" style={{ flex: 1 }} onClick={declineCall}>
          <PhoneOff size={15} /> Decline
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={acceptCall}>
          <Phone size={15} /> Accept
        </button>
      </div>
    </div>
  );
}
