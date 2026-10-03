import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AUTH_API } from '../services/api';
import { Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const email = params.get('email') || '';
  const token = params.get('token') || '';

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match.');
    if (!email || !token) return setError('This reset link is invalid. Please request a new one.');

    setLoading(true);
    try {
      const { data } = await AUTH_API.resetPassword({ email, token, password });
      localStorage.setItem('workwave_token', data.data.token);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 4 }}>Choose a new password</h2>
      <p className="muted text-sm" style={{ marginBottom: 20 }}>Make it something you'll remember, at least 8 characters.</p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>New password</label>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        </div>
        <div className="field">
          <label>Confirm new password</label>
          <input type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading} type="submit">
          {loading && <Loader2 size={16} className="spin" />}
          Reset password
        </button>
      </form>
      <p className="text-sm muted" style={{ textAlign: 'center', marginTop: 20 }}>
        <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Back to sign in</Link>
      </p>
    </div>
  );
}
