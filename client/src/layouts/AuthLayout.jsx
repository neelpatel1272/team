import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare } from 'lucide-react';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div
      className="flex items-center"
      style={{
        minHeight: '100vh',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top left, #eef2ff, var(--color-bg))',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div className="flex items-center gap-2" style={{ justifyContent: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'var(--bubble-out-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <MessageSquare size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>WorkWave</div>
            <div className="muted text-sm">Connect. Collaborate. Communicate.</div>
          </div>
        </div>
        <div className="card" style={{ padding: 28 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
