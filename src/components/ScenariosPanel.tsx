import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store';
import {
  listScenarios, saveScenario, updateScenario,
  renameScenario, deleteScenario, getMapImageUrl,
  MAX_SCENARIOS, type Scenario,
} from '../lib/scenarios';

interface ScenariosPanelProps {
  open: boolean;
  onClose: () => void;
  /** If set, open in save mode immediately (triggered from "Save to Account") */
  pendingSave?: boolean;
  onClearPendingSave: () => void;
}

type PanelState = 'list' | 'saving' | 'overwriting';

export function ScenariosPanel({ open, onClose, pendingSave, onClearPendingSave }: ScenariosPanelProps) {
  const { user, signOut } = useAuth();
  const exportJSON = useStore(s => s.exportJSON);
  const importJSON = useStore(s => s.importJSON);
  const board = useStore(s => s.board);
  const setBoard = useStore(s => s.setBoard);

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Save flow
  const [panelState, setPanelState] = useState<PanelState>('list');
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [overwriteTarget, setOverwriteTarget] = useState<Scenario | null>(null);

  // Rename flow
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const flash = (msg: string, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(null), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }
  };

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setScenarios(await listScenarios());
    } catch {
      flash('Failed to load scenarios', true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) refresh();
  }, [open, user, refresh]);

  // Auto-enter save mode if panel was opened from "Save to Account"
  useEffect(() => {
    if (open && pendingSave) {
      onClearPendingSave();
      setSaveName('');
      setPanelState('saving');
    }
  }, [open, pendingSave, onClearPendingSave]);

  // ── Save new ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const scenarioData = JSON.parse(exportJSON());
      await saveScenario(saveName.trim(), scenarioData, board.mapImageUrl ?? undefined);
      flash(`"${saveName.trim()}" saved!`);
      setPanelState('list');
      setSaveName('');
      await refresh();
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'SCENARIO_LIMIT_REACHED') {
        flash('Free accounts can save up to 3 scenarios. Delete one to save another, or overwrite an existing save.', true);
      } else {
        flash('Save failed. Please try again.', true);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Overwrite existing ──────────────────────────────────────────────────────
  const handleOverwrite = async (target: Scenario) => {
    setSaving(true);
    setError(null);
    try {
      const scenarioData = JSON.parse(exportJSON());
      await updateScenario(target.id, {
        scenarioData,
        mapImageUrl: board.mapImageUrl ?? undefined,
        oldMapImagePath: target.map_image_path,
      });
      flash(`"${target.name}" overwritten!`);
      setPanelState('list');
      setOverwriteTarget(null);
      await refresh();
    } catch {
      flash('Overwrite failed. Please try again.', true);
    } finally {
      setSaving(false);
    }
  };

  // ── Load ────────────────────────────────────────────────────────────────────
  const handleLoad = async (scenario: Scenario) => {
    try {
      // Restore board+units+terrain
      importJSON(JSON.stringify(scenario.scenario_data));
      // Restore map image if stored in Supabase Storage
      if (scenario.map_image_path) {
        const url = await getMapImageUrl(scenario.map_image_path);
        if (url) {
          const img = new Image();
          img.onload = () => {
            setBoard({ mapImageUrl: url, mapImageWidth: img.width, mapImageHeight: img.height });
          };
          img.src = url;
        }
      }
      flash(`"${scenario.name}" loaded!`);
      onClose();
    } catch {
      flash('Load failed. Please try again.', true);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (scenario: Scenario) => {
    if (!confirm(`Delete "${scenario.name}"? This cannot be undone.`)) return;
    try {
      await deleteScenario(scenario.id, scenario.map_image_path);
      flash(`"${scenario.name}" deleted.`);
      await refresh();
    } catch {
      flash('Delete failed.', true);
    }
  };

  // ── Rename ──────────────────────────────────────────────────────────────────
  const commitRename = async (id: string) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    try {
      await renameScenario(id, renameValue.trim());
      setRenamingId(null);
      await refresh();
    } catch {
      flash('Rename failed.', true);
    }
  };

  const atLimit = scenarios.length >= MAX_SCENARIOS;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
      }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 901,
        width: 360, background: '#0a0f1a',
        borderLeft: '1px solid #1e293b',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-16px 0 48px rgba(0,0,0,0.4)',
        animation: 'slideInRight 0.2s ease-out',
      }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>☁ My Scenarios</span>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: '#475569',
              cursor: 'pointer', fontSize: 18, padding: 4, lineHeight: 1,
            }}>✕</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
              {user?.email}
            </span>
            <button onClick={signOut} style={{
              background: 'none', border: '1px solid #334155', color: '#64748b',
              fontSize: 11, borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
            }}>Sign out</button>
          </div>
        </div>

        {/* Flash messages */}
        {error && (
          <div style={{
            margin: '12px 20px 0', padding: '9px 12px', borderRadius: 8, fontSize: 12,
            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#fca5a5',
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            margin: '12px 20px 0', padding: '9px 12px', borderRadius: 8, fontSize: 12,
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac',
          }}>{success}</div>
        )}

        {/* Save flow */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
          {panelState === 'list' && (
            <div>
              {atLimit ? (
                <div>
                  <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 6 }}>
                    ⚠ Free accounts can save up to 3 scenarios.
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                    Delete one to save a new scenario, or overwrite an existing one below.
                  </div>
                </div>
              ) : null}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setSaveName(''); setPanelState('saving'); }}
                  disabled={atLimit}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
                    background: atLimit ? '#1e293b' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: atLimit ? '#475569' : 'white',
                    fontSize: 12, fontWeight: 700, cursor: atLimit ? 'not-allowed' : 'pointer',
                  }}
                >
                  + Save Current
                </button>
                <button
                  onClick={() => { setOverwriteTarget(scenarios[0] ?? null); setPanelState('overwriting'); }}
                  disabled={scenarios.length === 0}
                  style={{
                    padding: '8px 12px', borderRadius: 8,
                    border: '1px solid #334155', background: 'transparent',
                    color: scenarios.length === 0 ? '#334155' : '#94a3b8',
                    fontSize: 12, cursor: scenarios.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                  title="Overwrite an existing save"
                >
                  Overwrite
                </button>
              </div>
            </div>
          )}

          {panelState === 'saving' && (
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Scenario name
              </div>
              <input
                autoFocus
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setPanelState('list'); }}
                placeholder="e.g. Mission 3 Alpha"
                style={{
                  width: '100%', background: '#1e293b', border: '1px solid #6366f1',
                  color: '#e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13,
                  boxSizing: 'border-box', outline: 'none', marginBottom: 10,
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSave} disabled={saving || !saveName.trim()} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                  background: saving || !saveName.trim() ? '#334155' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: 'white', fontSize: 12, fontWeight: 700,
                  cursor: saving || !saveName.trim() ? 'not-allowed' : 'pointer',
                }}>
                  {saving ? 'Saving…' : '💾 Save'}
                </button>
                <button onClick={() => setPanelState('list')} style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid #334155',
                  background: 'transparent', color: '#64748b', fontSize: 12, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </div>
          )}

          {panelState === 'overwriting' && (
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>Pick a scenario to overwrite:</div>
              {scenarios.map(s => (
                <button key={s.id} onClick={() => setOverwriteTarget(s)} style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
                  borderRadius: 8, marginBottom: 4,
                  border: `1px solid ${overwriteTarget?.id === s.id ? '#6366f1' : '#334155'}`,
                  background: overwriteTarget?.id === s.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: '#e2e8f0', fontSize: 12, cursor: 'pointer',
                }}>
                  {s.name}
                </button>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => overwriteTarget && handleOverwrite(overwriteTarget)}
                  disabled={!overwriteTarget || saving}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                    background: !overwriteTarget || saving ? '#334155' : '#f59e0b',
                    color: 'white', fontSize: 12, fontWeight: 700,
                    cursor: !overwriteTarget || saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Saving…' : '⚠ Overwrite'}
                </button>
                <button onClick={() => setPanelState('list')} style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid #334155',
                  background: 'transparent', color: '#64748b', fontSize: 12, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Scenario list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase',
            letterSpacing: '0.1em', marginBottom: 10,
          }}>
            Saved Scenarios ({scenarios.length}/{MAX_SCENARIOS})
          </div>

          {loading && (
            <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: 24 }}>Loading…</div>
          )}

          {!loading && scenarios.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '32px 0',
              color: '#334155', fontSize: 13,
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🗂</div>
              <div>No saved scenarios yet.</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                Click "Save Current" to save your board state.
              </div>
            </div>
          )}

          {!loading && scenarios.map(scenario => (
            <div key={scenario.id} style={{
              background: '#0f172a', border: '1px solid #1e293b',
              borderRadius: 10, padding: '12px 14px', marginBottom: 10,
            }}>
              {/* Name / rename */}
              {renamingId === scenario.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => commitRename(scenario.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename(scenario.id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  style={{
                    width: '100%', background: '#1e293b', border: '1px solid #6366f1',
                    color: '#e2e8f0', borderRadius: 6, padding: '4px 8px',
                    fontSize: 13, boxSizing: 'border-box', marginBottom: 6, outline: 'none',
                  }}
                />
              ) : (
                <div
                  onClick={() => { setRenamingId(scenario.id); setRenameValue(scenario.name); }}
                  title="Click to rename"
                  style={{
                    fontSize: 13, fontWeight: 600, color: '#e2e8f0',
                    marginBottom: 4, cursor: 'text',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {scenario.name}
                  <span style={{ fontSize: 10, color: '#334155' }}>✎</span>
                </div>
              )}

              <div style={{ fontSize: 10, color: '#475569', marginBottom: 10 }}>
                Updated {new Date(scenario.updated_at).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
                {scenario.map_image_path && <span style={{ color: '#334155' }}> · 🗺 map</span>}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => handleLoad(scenario)}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 6,
                    border: 'none', background: 'rgba(99,102,241,0.2)',
                    color: '#a5b4fc', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  ↓ Load
                </button>
                <button
                  onClick={() => handleDelete(scenario)}
                  style={{
                    padding: '6px 10px', borderRadius: 6,
                    border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.07)',
                    color: '#f87171', fontSize: 11, cursor: 'pointer',
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
