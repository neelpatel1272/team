import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const DEPARTMENTS = ['Engineering', 'Marketing', 'HR', 'Sales', 'Design', 'Management'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: 'Engineering',
    jobTitle: '',
    employeeId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 4 }}>Create your account</h2>
      <p className="muted text-sm" style={{ marginBottom: 20 }}>Join your team on WorkWave.</p>

      <form onSubmit={onSubmit}>
        <div className="flex gap-2">
          <div className="field" style={{ flex: 1 }}>
            <label>First name</label>
            <input name="firstName" className="input" value={form.firstName} onChange={onChange} required />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Last name</label>
            <input name="lastName" className="input" value={form.lastName} onChange={onChange} required />
          </div>
        </div>

        <div className="field">
          <label>Work email</label>
          <input name="email" type="email" className="input" value={form.email} onChange={onChange} required />
        </div>

        <div className="field">
          <label>Password</label>
          <input name="password" type="password" className="input" value={form.password} onChange={onChange} minLength={8} required />
        </div>

        <div className="flex gap-2">
          <div className="field" style={{ flex: 1 }}>
            <label>Department</label>
            <select name="department" className="input" value={form.department} onChange={onChange}>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Job title</label>
            <input name="jobTitle" className="input" value={form.jobTitle} onChange={onChange} placeholder="e.g. Product Designer" />
          </div>
        </div>

        <div className="field">
          <label>Employee ID (optional)</label>
          <input name="employeeId" className="input" value={form.employeeId} onChange={onChange} placeholder="e.g. EMP-014" />
        </div>

        {error && <div className="error-text">{error}</div>}

        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading} type="submit">
          {loading && <Loader2 size={16} className="spin" />}
          Create account
        </button>
      </form>

      <p className="text-sm muted" style={{ textAlign: 'center', marginTop: 20 }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
