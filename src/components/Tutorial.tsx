import React, { useState, useEffect } from 'react';

const TUTORIAL_KEY = 'sightgrid_tutorial_v1_done';

interface Step {
  title: string;
  body: string;
  shortcut?: string;
  /** Fixed-position style for the callout card */
  cardFixed: React.CSSProperties;
  /** Highlight ring around the target element */
  highlight: {
    top: number;
    width: number;
    height: number;
    borderRadius?: number;
    left?: number;
    right?: number;
  };
  /** Which side the arrow caret points FROM (i.e. the arrow is on that side of the card) */
  arrow: 'left' | 'right';
  /** Distance of arrow tip from top of card */
  arrowTop: string;
}

const STEPS: Step[] = [
  {
    title: '🖱️ Select & Move',
    body: 'Start here! Click unit tokens to select them, then drag to reposition. Hold Shift to select multiple at once. Press Delete to remove the selection.',
    shortcut: 'V',
    cardFixed: { top: 64, left: 82 },
    highlight: { top: 54, left: 6, width: 52, height: 52, borderRadius: 8 },
    arrow: 'left',
    arrowTop: '20px',
  },
  {
    title: '⬤ Place Units',
    body: 'Click the board to drop unit tokens. Configure the base size, count, and color in the Inspector panel on the right before clicking.',
    shortcut: 'U',
    cardFixed: { top: 132, left: 82 },
    highlight: { top: 126, left: 6, width: 52, height: 52, borderRadius: 8 },
    arrow: 'left',
    arrowTop: '20px',
  },
  {
    title: '⬡ Draw Terrain',
    body: 'Paint cover and obstacles with three tools: Line for walls, Rect for buildings, Polygon for irregular shapes. When drawing a polygon, click the glowing first vertex (or press Enter) to close it.',
    shortcut: 'L · R · P',
    cardFixed: { top: 190, left: 82 },
    highlight: { top: 206, left: 6, width: 52, height: 162, borderRadius: 8 },
    arrow: 'left',
    arrowTop: '50px',
  },
  {
    title: '✎ Freehand Draw',
    body: 'Sketch movement arrows, zone markers, or notes directly on the board. Use the Eraser to remove them. Drawings live on their own layer and never affect gameplay.',
    shortcut: 'D · E',
    cardFixed: { top: 420, left: 82 },
    highlight: { top: 445, left: 6, width: 52, height: 114, borderRadius: 8 },
    arrow: 'left',
    arrowTop: '20px',
  },
  {
    title: '🗺️ Upload a Map',
    body: 'In Board Setup at the top of the right panel, click "Upload Map Image" to set a background for your table. You can reposition, stretch, and adjust the opacity after uploading.',
    cardFixed: { top: 72, right: 242 },
    highlight: { top: 56, right: 6, width: 212, height: 240, borderRadius: 6 },
    arrow: 'right',
    arrowTop: '28px',
  },
  {
    title: '🔧 Inspector Panel',
    body: 'The Inspector adapts to your selection. Click a unit to edit its name, color, and line-of-sight range. Select terrain to delete it. Use the Layers section to toggle visibility or lock all objects at once.',
    cardFixed: { top: 340, right: 242 },
    highlight: { top: 300, right: 6, width: 212, height: 280, borderRadius: 6 },
    arrow: 'right',
    arrowTop: '30px',
  },
];

export function Tutorial() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [key, setKey] = useState(0); // forces re-animation on step change

  useEffect(() => {
    const done = localStorage.getItem(TUTORIAL_KEY);
    if (!done) setVisible(true);
  }, []);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const { highlight, cardFixed, arrow, arrowTop, title, body, shortcut } = current;

  const dismiss = () => {
    localStorage.setItem(TUTORIAL_KEY, '1');
    setVisible(false);
  };

  const goNext = () => {
    if (isLast) { dismiss(); return; }
    setKey(k => k + 1);
    setStep(s => s + 1);
  };

  const goBack = () => {
    if (step === 0) return;
    setKey(k => k + 1);
    setStep(s => s - 1);
  };

  // Build highlight ring style
  const hlStyle: React.CSSProperties = {
    position: 'fixed',
    top: highlight.top,
    width: highlight.width,
    height: highlight.height,
    borderRadius: highlight.borderRadius ?? 8,
    border: '2px solid rgba(99,102,241,0.85)',
    boxShadow: '0 0 0 4px rgba(99,102,241,0.12)',
    pointerEvents: 'none',
    zIndex: 999,
    animation: 'tut-pulse 2s ease-in-out infinite',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
  };
  if (highlight.left !== undefined) hlStyle.left = highlight.left;
  if (highlight.right !== undefined) hlStyle.right = highlight.right;

  return (
    <>
      <style>{`
        @keyframes tut-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(99,102,241,0.12), 0 0 16px rgba(99,102,241,0.2); }
          50%       { box-shadow: 0 0 0 8px rgba(99,102,241,0.2),  0 0 32px rgba(99,102,241,0.4); }
        }
        @keyframes tut-in {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
      `}</style>

      {/* Pulsing highlight ring */}
      <div style={hlStyle} />

      {/* Callout card */}
      <div
        key={key}
        style={{
          position: 'fixed',
          ...cardFixed,
          width: 268,
          background: 'rgba(10,15,26,0.97)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99,102,241,0.35)',
          borderRadius: 14,
          padding: '16px 16px 14px',
          zIndex: 1000,
          boxShadow: '0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(99,102,241,0.1)',
          animation: 'tut-in 0.22s cubic-bezier(0.4,0,0.2,1)',
          fontFamily: 'inherit',
        }}
      >
        {/* Left arrow (card is to right of sidebar) */}
        {arrow === 'left' && <>
          <div style={{
            position: 'absolute', right: '100%', top: arrowTop,
            width: 0, height: 0,
            borderTop: '9px solid transparent',
            borderBottom: '9px solid transparent',
            borderRight: '11px solid rgba(99,102,241,0.35)',
          }} />
          <div style={{
            position: 'absolute', right: 'calc(100% - 1px)', top: `calc(${arrowTop} + 1px)`,
            width: 0, height: 0,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderRight: '10px solid rgba(10,15,26,0.97)',
          }} />
        </>}

        {/* Right arrow (card is to left of inspector) */}
        {arrow === 'right' && <>
          <div style={{
            position: 'absolute', left: '100%', top: arrowTop,
            width: 0, height: 0,
            borderTop: '9px solid transparent',
            borderBottom: '9px solid transparent',
            borderLeft: '11px solid rgba(99,102,241,0.35)',
          }} />
          <div style={{
            position: 'absolute', left: 'calc(100% - 1px)', top: `calc(${arrowTop} + 1px)`,
            width: 0, height: 0,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderLeft: '10px solid rgba(10,15,26,0.97)',
          }} />
        </>}

        {/* Header row: progress dots + skip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === step ? '#6366f1' : (i < step ? '#312e81' : '#1e293b'),
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            ))}
            <span style={{ fontSize: 10, color: '#475569', marginLeft: 4 }}>
              {step + 1}/{STEPS.length}
            </span>
          </div>
          <button
            onClick={dismiss}
            style={{
              background: 'none', border: 'none', color: '#475569',
              cursor: 'pointer', fontSize: 11, padding: '2px 4px',
              borderRadius: 4, transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
          >
            ✕ Skip
          </button>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 8, lineHeight: 1.3,
        }}>
          {title}
        </div>

        {/* Body */}
        <div style={{
          fontSize: 12, color: '#94a3b8', lineHeight: 1.65,
          marginBottom: shortcut ? 10 : 16,
        }}>
          {body}
        </div>

        {/* Keyboard shortcut badge */}
        {shortcut && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 10, color: '#475569' }}>Shortcut</span>
            <kbd style={{
              background: '#0f172a', border: '1px solid #334155', borderRadius: 5,
              padding: '2px 7px', fontSize: 10, fontFamily: 'monospace',
              color: '#a5b4fc', boxShadow: '0 1px 0 #1e293b', letterSpacing: '0.05em',
            }}>
              {shortcut}
            </kbd>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {step > 0 && (
            <button
              onClick={goBack}
              style={{
                flex: 1, padding: '7px 10px', fontSize: 12, cursor: 'pointer',
                background: 'rgba(30,41,59,0.6)', border: '1px solid #334155',
                color: '#64748b', borderRadius: 7, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#475569'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#334155'; }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={goNext}
            style={{
              flex: 2, padding: '7px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))',
              border: '1px solid #6366f1',
              color: '#a5b4fc', borderRadius: 7, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(99,102,241,0.4),rgba(139,92,246,0.35))'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.2))'; }}
          >
            {isLast ? '🎉 Got it!' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  );
}
