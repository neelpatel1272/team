import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import IncomingCallToast from '../components/IncomingCallToast';
import ActiveCallOverlay from '../components/ActiveCallOverlay';
import { useCall } from '../contexts/CallContext';
import { useSocketContext } from '../contexts/SocketContext';

export default function MainLayout() {
  const { activeCall } = useCall();
  const { connectionState } = useSocketContext();

  return (
    <div className="app-shell">
      {connectionState === 'offline' && (
        <div className="connection-banner" style={{ background: 'var(--color-danger)' }}>
          🔴 Connection lost. Trying to reconnect... Messages will send once you're back online.
        </div>
      )}
      {connectionState === 'reconnecting' && (
        <div className="connection-banner">🟡 Reconnecting...</div>
      )}

      <Sidebar />
      <Outlet />

      <IncomingCallToast />
      {activeCall && <ActiveCallOverlay />}
    </div>
  );
}
