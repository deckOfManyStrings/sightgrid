import React, { useEffect } from 'react';

interface ProModalProps {
  onClose: () => void;
}

export function ProModal({ onClose }: ProModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes pro-backdrop-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pro-card-in {
          from { opacity: 0; transform: scale(0.94) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 4000,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          animation: 'pro-backdrop-in 0.2s ease',
        }}
      />

      {/* Card */}
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 4001,
          width: 480,
          background: 'rgba(10,15,26,0.98)',
          border: '1px solid rgba(234,179,8,0.4)',
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(234,179,8,0.15)',
          animation: 'pro-card-in 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'inherit',
        }}
      >
        {/* Header Graphic */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(234,179,8,0.2) 0%, rgba(234,179,8,0.05) 100%)',
          padding: '32px 24px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(234,179,8,0.15)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👑</div>
          <h2 style={{ 
            fontSize: 24, fontWeight: 800, color: '#fcd34d', margin: 0,
            textShadow: '0 2px 10px rgba(234,179,8,0.3)',
          }}>
            SightGrid Pro
          </h2>
          <p style={{ fontSize: 14, color: '#fde68a', opacity: 0.8, marginTop: 8, marginBottom: 0 }}>
            Unlock the full tactical experience.
          </p>
        </div>

        {/* Benefits List */}
        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 18, background: 'rgba(234,179,8,0.15)', borderRadius: '50%', padding: 4, lineHeight: 1 }}>✨</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Unlimited Saves</div>
              <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>Save as many custom scenarios and board layouts as you need, without limits.</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 18, background: 'rgba(234,179,8,0.15)', borderRadius: '50%', padding: 4, lineHeight: 1 }}>🗺️</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>All Premium Templates</div>
              <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>Get instant access to all advanced board layouts and future template additions.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 18, background: 'rgba(234,179,8,0.15)', borderRadius: '50%', padding: 4, lineHeight: 1 }}>💖</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Support Development</div>
              <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>Help us keep adding new features, tools, and enhancements to SightGrid.</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ 
          padding: '20px 32px 28px', 
          background: 'rgba(0,0,0,0.2)',
          borderTop: '1px solid #1e293b',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <a
            href="https://buy.stripe.com/cNi4gBfds9G1cyF7Sf0Fi01"
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
            style={{
              padding: '14px', borderRadius: 12, textAlign: 'center',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff', fontSize: 16, fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,158,11,0.4)'; }}
          >
            Upgrade to Pro
          </a>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: '#64748b',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </>
  );
}
