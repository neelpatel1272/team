import { Link } from 'react-router-dom';
import { MessageSquareOff } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-col items-center" style={{ height: '100vh', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
      <MessageSquareOff size={48} className="muted" />
      <h2 style={{ margin: 0 }}>Page not found</h2>
      <p className="muted">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary">Back to Dashboard</Link>
    </div>
  );
}
