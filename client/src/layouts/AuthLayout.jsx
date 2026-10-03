import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare } from 'lucide-react';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="auth-wrapper">
      <div className="auth-card-container">
        <div className="flex items-center gap-2" style={{ justifyContent: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <MessageSquare size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>WorkWave</div>
            <div className="muted text-xs">Connect. Collaborate. Communicate.</div>
          </div>
        </div>
        <div className="card auth-card">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
