import { useAuth } from '../contexts/AuthContext';

interface AccountButtonProps {
  onOpenScenarios: () => void;
  onOpenAuth: () => void;
}

export function AccountButton({ onOpenScenarios, onOpenAuth }: AccountButtonProps) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <button
        onClick={onOpenAuth}
        title="Sign in to save scenarios"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)',
          color: '#a5b4fc', borderRadius: 8,
          padding: '5px 12px', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <span>👤</span>
        <span>Sign In</span>
      </button>
    );
  }

  // Authenticated — show initials + scenarios button
  const initials = (user.email ?? '?').slice(0, 2).toUpperCase();

  return (
    <button
      onClick={onOpenScenarios}
      title={`Signed in as ${user.email}\nClick to open My Scenarios`}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
        color: '#a5b4fc', borderRadius: 8,
        padding: '5px 12px', fontSize: 12, fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      <span style={{
        width: 22, height: 22, borderRadius: '50%',
        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 800, color: 'white', flexShrink: 0,
        letterSpacing: '-0.03em',
      }}>
        {initials}
      </span>
      <span>☁ My Scenarios</span>
    </button>
  );
}
