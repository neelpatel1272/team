import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 4 }}>Welcome back</h2>
      <p className="muted text-sm" style={{ marginBottom: 20 }}>Sign in to continue to your workspace.</p>

      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="email">Work email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            placeholder="you@company.com"
            value={form.email}
            onChange={onChange}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            placeholder="••••••••"
            value={form.password}
            onChange={onChange}
            required
          />
        </div>
        {error && <div className="error-text">{error}</div>}

        <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
          <Link to="/forgot-password" className="text-sm" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Forgot password?
          </Link>
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading} type="submit">
          {loading && <Loader2 size={16} className="spin" />}
          Sign in
        </button>
      </form>

      <p className="text-sm muted" style={{ textAlign: 'center', marginTop: 20 }}>
        New to WorkWave?{' '}
        <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
          Create an account
        </Link>
      </p>
    </div>
  );
}
