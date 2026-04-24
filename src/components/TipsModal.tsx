import React, { useEffect } from 'react';

interface TipsModalProps {
  onClose: () => void;
}

const TIPS: { keys: string[]; description: string; category: string }[] = [
  // Tools
  { keys: ['V'],            description: 'Switch to the Select tool — click and drag units',         category: 'Tools' },
  { keys: ['U'],            description: 'Switch to the Place Unit tool — click the board to drop tokens', category: 'Tools' },
  { keys: ['L'],            description: 'Switch to Terrain Line tool — draw wall segments',          category: 'Tools' },
  { keys: ['R'],            description: 'Switch to Terrain Rect tool — drag out buildings and cover', category: 'Tools' },
  { keys: ['P'],            description: 'Switch to Terrain Polygon tool — click to place each vertex', category: 'Tools' },
  { keys: ['M'],            description: 'Switch to the Ruler — click and drag to measure in inches',  category: 'Tools' },
  { keys: ['F'],            description: 'Switch to the Draw tool — freehand sketch on the board',    category: 'Tools' },
  { keys: ['E'],            description: 'Switch to the Eraser — drag over drawings to remove them',  category: 'Tools' },
  // Polygon
  { keys: ['Enter'],        description: 'Complete the current polygon while using the Polygon tool', category: 'Drawing' },
  { keys: ['Esc'],          description: 'Cancel and discard the polygon you are drawing',            category: 'Drawing' },
  // Selection & editing
  { keys: ['Shift', 'Click'], description: 'Add a unit or terrain piece to the selection without deselecting others', category: 'Selection' },
  { keys: ['Hold', 'Scroll'], description: 'Hold mouse on a selected unit then scroll to rotate it (or the whole group)', category: 'Selection' },
  { keys: ['Hold', 'Scroll'], description: 'Hold mouse on selected terrain then scroll to rotate it around its centroid', category: 'Selection' },
  { keys: ['Del'],          description: 'Delete the selected unit(s), terrain, or drawing',         category: 'Selection' },
  // History
  { keys: ['⌘ / Ctrl', 'Z'], description: 'Undo the last action',                                   category: 'History' },
  { keys: ['⌘ / Ctrl', 'Shift', 'Z'], description: 'Redo — reapply the undone action',              category: 'History' },
  // Clipboard
  { keys: ['⌘ / Ctrl', 'C'], description: 'Copy the selected units, terrain, or drawings',          category: 'Clipboard' },
  { keys: ['⌘ / Ctrl', 'V'], description: 'Paste — drop copies offset from the originals',          category: 'Clipboard' },
];

const CATEGORIES = ['Tools', 'Drawing', 'Selection', 'History', 'Clipboard'];

const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Tools:     { bg: 'rgba(99,102,241,0.12)',  text: '#a5b4fc', border: 'rgba(99,102,241,0.3)' },
  Drawing:   { bg: 'rgba(251,191,36,0.1)',   text: '#fcd34d', border: 'rgba(251,191,36,0.25)' },
  Selection: { bg: 'rgba(52,211,153,0.1)',   text: '#6ee7b7', border: 'rgba(52,211,153,0.25)' },
  History:   { bg: 'rgba(248,113,113,0.1)',  text: '#fca5a5', border: 'rgba(248,113,113,0.25)' },
  Clipboard: { bg: 'rgba(167,139,250,0.1)',  text: '#c4b5fd', border: 'rgba(167,139,250,0.25)' },
};

export function TipsModal({ onClose }: TipsModalProps) {
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
        @keyframes tips-backdrop-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tips-card-in {
          from { opacity: 0; transform: scale(0.94) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        .tips-row:hover { background: rgba(99,102,241,0.06) !important; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          animation: 'tips-backdrop-in 0.18s ease',
        }}
      />

      {/* Card */}
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2001,
          width: 620,
          maxHeight: '80vh',
          background: 'rgba(10,15,26,0.98)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 16,
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.08)',
          animation: 'tips-card-in 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'inherit',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px 14px',
          borderBottom: '1px solid #1e293b',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>
              ⌨️ Keyboard Shortcuts
            </div>
            <div style={{ fontSize: 11, color: '#475569' }}>
              Press <Kbd keys={['?']} inline /> anytime to open this panel
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(30,41,59,0.6)', border: '1px solid #334155',
              color: '#64748b', borderRadius: 8, width: 32, height: 32,
              cursor: 'pointer', fontSize: 14, display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#475569'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#334155'; }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '14px 22px 20px' }}>
          {CATEGORIES.map(cat => {
            const rows = TIPS.filter(t => t.category === cat);
            const c = CAT_COLORS[cat];
            return (
              <div key={cat} style={{ marginBottom: 20 }}>
                {/* Category label */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center',
                  background: c.bg, border: `1px solid ${c.border}`,
                  borderRadius: 6, padding: '2px 8px',
                  fontSize: 10, fontWeight: 700, color: c.text,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: 8,
                }}>
                  {cat}
                </div>

                {rows.map((tip, i) => (
                  <div
                    key={i}
                    className="tips-row"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '8px 6px', borderRadius: 8,
                      transition: 'background 0.1s',
                      borderBottom: i < rows.length - 1 ? '1px solid rgba(30,41,59,0.6)' : 'none',
                    }}
                  >
                    {/* Keys */}
                    <div style={{ flexShrink: 0, minWidth: 170, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <Kbd keys={tip.keys} />
                    </div>
                    {/* Description */}
                    <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, flex: 1 }}>
                      {tip.description}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 22px', borderTop: '1px solid #1e293b',
          fontSize: 11, color: '#334155', textAlign: 'center', flexShrink: 0,
        }}>
          Click anywhere outside or press Esc to close
        </div>
      </div>
    </>
  );
}

/** Renders a sequence of styled kbd badges with "+" separators */
function Kbd({ keys, inline }: { keys: string[]; inline?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {keys.map((k, i) => (
        <React.Fragment key={i}>
          {i > 0 && !inline && (
            <span style={{ fontSize: 10, color: '#475569' }}>+</span>
          )}
          <kbd style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: '#0f172a',
            border: '1px solid #334155',
            borderBottom: '2px solid #1e293b',
            borderRadius: 5,
            padding: inline ? '0 4px' : '2px 7px',
            fontSize: inline ? 10 : 11,
            fontFamily: 'monospace',
            color: '#a5b4fc',
            minWidth: inline ? 'unset' : 24,
            whiteSpace: 'nowrap',
          }}>
            {k}
          </kbd>
        </React.Fragment>
      ))}
    </span>
  );
}
