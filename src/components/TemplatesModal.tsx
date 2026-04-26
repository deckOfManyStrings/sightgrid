import React, { useEffect, useState } from 'react';
import { Stage, Layer, Line, Rect } from 'react-konva';
import { useStore } from '../store';
import { usePro } from '../contexts/ProContext';
import { TEMPLATES } from '../templates';
import type { ScenarioTemplate } from '../templates';

interface TemplatesModalProps {
  onClose: () => void;
}

/** Mini read-only Konva preview of a template's terrain */
function TemplatePreview({ template }: { template: ScenarioTemplate }) {
  const PW = 200, PH = 137; // preview canvas dimensions (≈ board aspect ratio 44:60 ≈ 0.733)
  // Templates are authored at 900-wide. Scale to preview width.
  const scale = PW / 900;

  const terrain = template.terrain();

  const tagColor = (tags: string[], color: string) => {
    if (tags.includes('blocks_los')) return color || '#475569';
    if (tags.includes('obscuring')) return '#ea580c';
    if (tags.includes('difficult')) return '#16a34a';
    return '#334155';
  };

  return (
    <div style={{
      borderRadius: 8, overflow: 'hidden',
      border: '1px solid #1e293b',
      background: '#1e293b',
      flexShrink: 0,
    }}>
      <Stage width={PW} height={PH} scaleX={scale} scaleY={scale} listening={false}>
        {/* Board background */}
        <Layer>
          <Rect x={0} y={0} width={900} height={615} fill="#1e293b" />
          {/* Grid hint */}
          {Array.from({ length: 44 }, (_, i) => (
            <Line key={`v${i}`} points={[i * (900 / 44), 0, i * (900 / 44), 615]}
              stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
          ))}
        </Layer>
        <Layer>
          {terrain.map((t) => {
            const color = tagColor(t.tags, t.color);
            if (t.shape === 'line') {
              return (
                <Line key={t.id} points={t.points}
                  stroke={color} strokeWidth={4} lineCap="round" opacity={t.opacity} />
              );
            }
            return (
              <Line key={t.id} points={t.points} closed
                fill={color + '70'} stroke={color} strokeWidth={2} opacity={t.opacity} />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}

export function TemplatesModal({ onClose }: TemplatesModalProps) {
  const terrain = useStore(s => s.terrain);
  const units = useStore(s => s.units);
  const drawings = useStore(s => s.drawings) || [];
  const loadTemplate = useStore(s => s.loadTemplate);
  const { isPro, openProModal } = usePro();

  const [selected, setSelected] = useState<ScenarioTemplate>(TEMPLATES[0]); // changed default to 0 just in case 1 is locked? No, 1 is fine since we lock at 2.
  const [confirmTarget, setConfirmTarget] = useState<ScenarioTemplate | null>(null);

  const hasContent = terrain.length > 0 || units.length > 0 || drawings.length > 0;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleLoad = (tpl: ScenarioTemplate) => {
    if (hasContent) {
      setConfirmTarget(tpl);
    } else {
      loadTemplate(tpl);
      onClose();
    }
  };

  const confirmLoad = () => {
    if (confirmTarget) {
      loadTemplate(confirmTarget);
      setConfirmTarget(null);
      onClose();
    }
  };

  return (
    <>
      <style>{`
        @keyframes tmpl-backdrop-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tmpl-card-in {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.95); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes tmpl-confirm-in {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
        .tmpl-card:hover  { border-color: rgba(99,102,241,0.5) !important; background: rgba(99,102,241,0.07) !important; }
        .tmpl-card.active { border-color: #6366f1 !important; background: rgba(99,102,241,0.14) !important; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          animation: 'tmpl-backdrop-in 0.18s ease',
        }}
      />

      {/* Main modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 3001,
        width: 760,
        maxHeight: '85vh',
        background: 'rgba(8,12,22,0.99)',
        border: '1px solid rgba(99,102,241,0.35)',
        borderRadius: 18,
        boxShadow: '0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(99,102,241,0.08)',
        animation: 'tmpl-card-in 0.24s cubic-bezier(0.34,1.56,0.64,1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'inherit',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px 14px',
          borderBottom: '1px solid #1e293b',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>
              🗺️ Board Templates
            </div>
            <div style={{ fontSize: 11, color: '#475569' }}>
              Choose a preset layout — terrain is loaded and units are cleared
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(30,41,59,0.6)', border: '1px solid #334155',
              color: '#64748b', borderRadius: 8, width: 32, height: 32,
              cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#475569'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#334155'; }}
          >
            ✕
          </button>
        </div>

        {/* Body — two-column layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Left: template list */}
          <div style={{
            width: 230, flexShrink: 0, overflowY: 'auto',
            padding: '12px 10px', borderRight: '1px solid #1e293b',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {TEMPLATES.map((tpl, idx) => {
              const isLocked = !isPro && idx >= 2;
              return (
                <button
                  key={tpl.id}
                  className={`tmpl-card${selected.id === tpl.id ? ' active' : ''}`}
                  onClick={() => setSelected(tpl)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    border: '1px solid #1e293b',
                    background: 'transparent', textAlign: 'left',
                    transition: 'all 0.15s', width: '100%',
                    opacity: isLocked && selected.id !== tpl.id ? 0.6 : 1,
                  }}
                >

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpl.name}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tpl.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* More coming soon */}
            <div style={{
              marginTop: 4,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px dashed rgba(99,102,241,0.2)',
              background: 'rgba(99,102,241,0.04)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0, opacity: 0.5 }}>🕐</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 2 }}>More coming soon</div>
                <div style={{ fontSize: 10, color: '#334155', lineHeight: 1.4 }}>New tables & layouts on the way</div>
              </div>
            </div>
          </div>

          {/* Right: preview + detail */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            overflowY: 'auto', padding: '20px 24px', gap: 16,
          }}>
            {/* Preview canvas */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <TemplatePreview template={selected} />
            </div>

            {/* Description */}
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
                {selected.name}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 6, padding: '2px 8px',
                fontSize: 10, fontWeight: 700, color: '#a5b4fc',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                marginBottom: 10,
              }}>
                {selected.subtitle}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>
                {selected.description}
              </div>
            </div>

            {/* Terrain count badge */}
            <div style={{
              display: 'flex', gap: 8, flexWrap: 'wrap',
            }}>
              {(() => {
                const terrain = selected.terrain();
                return (
                  <>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20,
                      background: 'rgba(30,41,59,0.8)', border: '1px solid #334155',
                      fontSize: 11, color: '#64748b',
                    }}>
                      {terrain.length} terrain piece{terrain.length !== 1 ? 's' : ''}
                    </span>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20,
                      background: 'rgba(30,41,59,0.8)', border: '1px solid #334155',
                      fontSize: 11, color: '#64748b',
                    }}>
                      0 units (cleared)
                    </span>
                  </>
                );
              })()}
            </div>

            {/* Load button */}
            <div style={{ marginTop: 'auto' }}>
              {(() => {
                const isLocked = !isPro && TEMPLATES.findIndex(t => t.id === selected.id) >= 2;
                if (isLocked) {
                  return (
                    <button
                      onClick={openProModal}
                      style={{
                        width: '100%', padding: '11px',
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.2))',
                        border: '1px solid rgba(245,158,11,0.5)',
                        color: '#fcd34d', borderRadius: 10,
                        cursor: 'pointer', fontSize: 13, fontWeight: 700,
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(217,119,6,0.3))'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.2))'; }}
                    >
                      <span>👑</span>
                      Unlock Pro to Load
                    </button>
                  );
                }
                return (
                  <button
                    onClick={() => handleLoad(selected)}
                    style={{
                      width: '100%', padding: '11px',
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.7), rgba(139,92,246,0.7))',
                      border: '1px solid rgba(99,102,241,0.5)',
                      color: '#e2e8f0', borderRadius: 10,
                      cursor: 'pointer', fontSize: 13, fontWeight: 700,
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.9))'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.7), rgba(139,92,246,0.7))'; }}
                  >
                    <span>🗺️</span>
                    Load "{selected.name}"
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm overwrite dialog */}
      {confirmTarget && (
        <>
          <div style={{
            position: 'fixed', inset: 0, zIndex: 3100,
            background: 'rgba(0,0,0,0.5)',
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            zIndex: 3101,
            width: 380,
            background: 'rgba(10,15,26,0.99)',
            border: '1px solid rgba(234,179,8,0.35)',
            borderRadius: 14,
            padding: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            animation: 'tmpl-confirm-in 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            fontFamily: 'inherit',
          }}>
            <div style={{ fontSize: 28, marginBottom: 12, textAlign: 'center' }}>⚠️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 8, textAlign: 'center' }}>
              Replace current board?
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 20, textAlign: 'center' }}>
              Loading <strong style={{ color: '#e2e8f0' }}>{confirmTarget.name}</strong> will clear all your current units, terrain, and drawings. You can undo this with <kbd style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 3, padding: '0 4px', fontSize: 11, color: '#a5b4fc', fontFamily: 'monospace' }}>⌘Z</kbd>.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmTarget(null)}
                style={{
                  flex: 1, padding: '9px', borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(30,41,59,0.8)', border: '1px solid #334155',
                  color: '#94a3b8', fontSize: 13, fontWeight: 600,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
              >
                Cancel
              </button>
              <button
                onClick={confirmLoad}
                style={{
                  flex: 1, padding: '9px', borderRadius: 8, cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(234,179,8,0.3), rgba(234,179,8,0.15))',
                  border: '1px solid rgba(234,179,8,0.4)',
                  color: '#fcd34d', fontSize: 13, fontWeight: 700,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(234,179,8,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(234,179,8,0.3), rgba(234,179,8,0.15))'; }}
              >
                Yes, replace
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
