import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AUTH_API } from '../services/api';
import { Loader2, MailCheck } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [devLink, setDevLink] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await AUTH_API.forgotPassword(email);
      setSent(true);
      if (data?.data?.devResetUrl) setDevLink(data.data.devResetUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex-col items-center" style={{ textAlign: 'center', gap: 10 }}>
        <div className="empty-state__icon"><MailCheck size={28} color="var(--color-primary)" /></div>
        <h3 style={{ margin: 0 }}>Check your email</h3>
        <p className="muted text-sm">If an account exists for {email}, we've sent a reset link.</p>
        {devLink && (
          <p className="text-sm" style={{ wordBreak: 'break-all' }}>
            Dev mode link:{' '}
            <Link to={devLink.replace(window.location.origin, '')} style={{ color: 'var(--color-primary)' }}>
              {devLink}
            </Link>
          </p>
        )}
        <Link to="/login" className="btn btn-outline" style={{ marginTop: 8 }}>Back to sign in</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 4 }}>Reset your password</h2>
      <p className="muted text-sm" style={{ marginBottom: 20 }}>
        Enter your work email and we'll send you a reset link.
      </p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Work email</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading} type="submit">
          {loading && <Loader2 size={16} className="spin" />}
          Send reset link
        </button>
      </form>
      <p className="text-sm muted" style={{ textAlign: 'center', marginTop: 20 }}>
        <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Back to sign in</Link>
      </p>
    </div>
  );
}
