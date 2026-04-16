import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (tab === 'signin') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        onSuccess();
        onClose();
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setInfo('Account created! Check your email to confirm, then sign in.');
        setTab('signin');
      }
    }
    setLoading(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f172a', border: '1px solid #334155',
          borderRadius: 16, padding: 32, width: 360,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
              🎯 SightGrid
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              Cloud saves for your scenarios
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#475569',
            cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4,
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: '#1e293b', borderRadius: 8,
          padding: 3, marginBottom: 24, gap: 3,
        }}>
          {(['signin', 'signup'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(null); setInfo(null); }} style={{
              flex: 1, padding: '7px 0', borderRadius: 6, border: 'none',
              background: tab === t ? '#6366f1' : 'transparent',
              color: tab === t ? 'white' : '#64748b',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              {t === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</div>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%', background: '#1e293b', border: '1px solid #334155',
                color: '#e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13,
                boxSizing: 'border-box', outline: 'none',
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</div>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              minLength={6}
              style={{
                width: '100%', background: '#1e293b', border: '1px solid #334155',
                color: '#e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13,
                boxSizing: 'border-box', outline: 'none',
              }}
            />
          </label>

          {error && (
            <div style={{
              background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
              borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#fca5a5', marginBottom: 16,
            }}>{error}</div>
          )}
          {info && (
            <div style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#86efac', marginBottom: 16,
            }}>{info}</div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 8, border: 'none',
              background: loading ? '#334155' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? '…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ fontSize: 11, color: '#334155', textAlign: 'center', marginTop: 18, marginBottom: 0 }}>
          You can use SightGrid without an account.<br />Sign in only to save scenarios to the cloud.
        </p>
      </div>
    </div>
  );
}
