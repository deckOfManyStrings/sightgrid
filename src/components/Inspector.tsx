import React, { useRef, useState } from 'react';
import { useStore, getPixelsPerInch, mmToPx as mmToPxUtil, pxToInches as pxToInchesUtil } from '../store';
import { HexColorPicker } from 'react-colorful';
import { BASE_SIZES, UNIT_COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface InspectorProps {
  onCloudSave: () => void;     // user is authed — open ScenariosPanel in save mode
  onRequestAuth: () => void;   // user is not authed — open AuthModal
}

export function Inspector({ onCloudSave, onRequestAuth }: InspectorProps) {
  const selectedIds = useStore(s => s.selectedIds);
  const units = useStore(s => s.units);
  const canvasWidth = useStore(s => s.canvasWidth);
  const board = useStore(s => s.board);
  const updateUnit = useStore(s => s.updateUnit);
  const deleteUnits = useStore(s => s.deleteUnits);
  const deleteTerrain = useStore(s => s.deleteTerrain);
  const terrain = useStore(s => s.terrain);
  const duplicateUnits = useStore(s => s.duplicateUnits);
  const unitTemplate = useStore(s => s.unitTemplate);
  const setUnitTemplate = useStore(s => s.setUnitTemplate);
  const activeTool = useStore(s => s.activeTool);
  const setActiveTool = useStore(s => s.setActiveTool);
  const setBoard = useStore(s => s.setBoard);
  const layers = useStore(s => s.layers);
  const toggleLayer = useStore(s => s.toggleLayer);
  const snapEnabled = useStore(s => s.snapEnabled);
  const toggleSnap = useStore(s => s.toggleSnap);
  const exportJSON = useStore(s => s.exportJSON);
  const importJSON = useStore(s => s.importJSON);
  const clearBoard = useStore(s => s.clearBoard);
  const resetView = useStore(s => s.resetView);
  const { user } = useAuth();

  const importRef = useRef<HTMLInputElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTemplateColorPicker, setShowTemplateColorPicker] = useState(false);
  const [showGroupColorPicker, setShowGroupColorPicker] = useState(false);
  const [groupRange, setGroupRange] = useState<string>('24');

  const ppi = getPixelsPerInch(canvasWidth, board.widthInches);

  const selectedUnits = units.filter(u => selectedIds.includes(u.id));
  const hasSingleUnit = selectedUnits.length === 1;
  const u = hasSingleUnit ? selectedUnits[0] : null;

  // Terrain selection
  const selectedTerrain = selectedIds.length === 1
    ? terrain.find(t => t.id === selectedIds[0]) ?? null
    : null;

  function handleMapUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setBoard({ mapImageUrl: url, mapImageWidth: img.width, mapImageHeight: img.height });
    };
    img.src = url;
  }

  function handleExport() {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sightgrid-scenario.json';
    a.click();
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      importJSON(text);
    };
    reader.readAsText(file);
  }

  function arrangeInRows(numRows: number) {
    const sel = units.filter(uu => selectedIds.includes(uu.id));
    if (sel.length === 0) return;

    const gap = 2; // tiny gap between bases so they touch without overlapping

    // Sort left-to-right by current position
    const sorted = [...sel].sort((a, b) => a.x - b.x);
    const perRow = Math.ceil(sorted.length / numRows);

    // Anchor to the top-left edge of the first unit
    const firstW = mmToPxUtil(sorted[0].baseWidthMm, ppi);
    const firstH = mmToPxUtil(sorted[0].baseHeightMm, ppi);
    const anchorLeft = sorted[0].x - firstW / 2;
    const anchorTop  = sorted[0].y - firstH / 2;

    let currentY = anchorTop;

    for (let row = 0; row < numRows; row++) {
      const rowUnits = sorted.slice(row * perRow, (row + 1) * perRow);
      if (rowUnits.length === 0) break;

      // Height of this row = tallest unit in it
      const rowH = Math.max(...rowUnits.map(u => mmToPxUtil(u.baseHeightMm, ppi)));

      let currentX = anchorLeft;
      rowUnits.forEach(unit => {
        const w = mmToPxUtil(unit.baseWidthMm, ppi);
        const h = mmToPxUtil(unit.baseHeightMm, ppi);
        // Place unit center: currentX is the left edge, so center = currentX + w/2
        // Vertically center within the row height
        updateUnit(unit.id, {
          x: currentX + w / 2,
          y: currentY + rowH / 2,
        });
        currentX += w + gap; // advance by this unit's actual width
      });

      currentY += rowH + gap; // advance by this row's actual height
    }
  }

  // ── Shared UI helpers ────────────────────────────────────────────────────────

  const section = (title: string, content: React.ReactNode) => (
    <div key={title} style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase',
        letterSpacing: '0.1em', marginBottom: 8, paddingBottom: 4,
        borderBottom: '1px solid #1e293b',
      }}>
        {title}
      </div>
      {content}
    </div>
  );

  const label = (text: string) => (
    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>{text}</div>
  );

  const input = (value: string, onChange: (v: string) => void) => (
    <input
      type="text" value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', background: '#1e293b', border: '1px solid #334155',
        color: '#e2e8f0', borderRadius: 6, padding: '5px 8px', fontSize: 12,
        marginBottom: 8, boxSizing: 'border-box',
      }}
    />
  );

  const toggle = (on: boolean, onToggle: () => void, text: string) => (
    <div key={text} onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 6,
    }}>
      <div style={{
        width: 28, height: 16, borderRadius: 8,
        background: on ? '#6366f1' : '#1e293b',
        border: '1px solid ' + (on ? '#6366f1' : '#334155'),
        position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: 2,
          left: on ? 14 : 2,
          width: 10, height: 10, borderRadius: '50%',
          background: on ? 'white' : '#475569', transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontSize: 11, color: on ? '#e2e8f0' : '#64748b' }}>{text}</span>
    </div>
  );

  const btn = (text: string, onClick: () => void, variant: 'default' | 'primary' | 'danger' = 'default') => (
    <button key={text} onClick={onClick} style={{
      width: '100%', background: variant === 'primary' ? 'rgba(99,102,241,0.2)' :
        variant === 'danger' ? 'rgba(244,63,94,0.1)' : 'rgba(51,65,85,0.5)',
      color: variant === 'primary' ? '#a5b4fc' : variant === 'danger' ? '#fca5a5' : '#94a3b8',
      border: `1px solid ${variant === 'primary' ? '#6366f1' : variant === 'danger' ? '#f43f5e' : '#334155'}`,
      borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer',
      marginBottom: 4, textAlign: 'left' as const,
    }}>
      {text}
    </button>
  );

  return (
    <div style={{
      width: 220, background: '#0a0f1a', borderLeft: '1px solid #1e293b',
      overflowY: 'auto', padding: 12, flexShrink: 0,
      fontSize: 12, color: '#e2e8f0',
    }}>

      {/* Board Setup */}
      {section('Board Setup', (
        <>
          {/* Map upload */}
          <div style={{ marginBottom: 8 }}>
            <label style={{
              display: 'block', width: '100%', padding: '6px 0', textAlign: 'center',
              background: 'rgba(99,102,241,0.15)', border: '1px dashed #6366f1',
              borderRadius: 6, cursor: 'pointer', fontSize: 11, color: '#a5b4fc',
            }}>
              {board.mapImageUrl ? '🗺 Change Map' : '📂 Upload Map Image'}
              <input type="file" accept="image/*" onChange={handleMapUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              {label('Width (in)')}
              <input type="number" value={board.widthInches} min={1} max={120}
                onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 1) setBoard({ widthInches: v }); }}
                style={{
                  width: '100%', background: '#1e293b', border: '1px solid #334155',
                  color: '#e2e8f0', borderRadius: 6, padding: '5px 8px', fontSize: 12, boxSizing: 'border-box',
                }} />
            </div>
            <div>
              {label('Height (in)')}
              <input type="number" value={board.heightInches} min={1} max={120}
                onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 1) setBoard({ heightInches: v }); }}
                style={{
                  width: '100%', background: '#1e293b', border: '1px solid #334155',
                  color: '#e2e8f0', borderRadius: 6, padding: '5px 8px', fontSize: 12, boxSizing: 'border-box',
                }} />
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 8 }}>
            Standard 40K: 44" × 60" or 44" × 30"
          </div>
          {toggle(snapEnabled, toggleSnap, 'Snap to Grid')}

          {/* Map calibration — shown when a map is loaded */}
          {board.mapImageUrl && (
            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => setActiveTool(activeTool === 'map_adjust' ? 'select' : 'map_adjust')}
                style={{
                  width: '100%', padding: '5px 10px', fontSize: 11, cursor: 'pointer',
                  borderRadius: 6, marginBottom: 8, fontWeight: 600,
                  background: activeTool === 'map_adjust' ? 'rgba(251,191,36,0.2)' : 'rgba(51,65,85,0.5)',
                  color: activeTool === 'map_adjust' ? '#fbbf24' : '#94a3b8',
                  border: `1px solid ${activeTool === 'map_adjust' ? '#fbbf24' : '#334155'}`,
                }}
              >
                {activeTool === 'map_adjust' ? '✔ Adjusting Map…' : '🖼 Adjust Map'}
              </button>

              {activeTool === 'map_adjust' && (
                <>
                  {/* Stretch to Fit */}
                  <button
                    onClick={() => {
                      setBoard({ mapScaleX: 1, mapScaleY: 1, mapX: 0, mapY: 0 });
                    }}
                    style={{
                      width: '100%', padding: '5px 10px', fontSize: 11, cursor: 'pointer',
                      borderRadius: 6, marginBottom: 8, fontWeight: 600,
                      background: 'rgba(99,102,241,0.2)',
                      color: '#a5b4fc',
                      border: '1px solid #6366f1',
                    }}
                  >
                    ⤢ Stretch to Fit Board
                  </button>

                  {/* Width Stretch */}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>
                    Width Stretch: {Math.round((board.mapScaleX ?? 1) * 100)}%
                  </div>
                  <input
                    type="range" min={25} max={300} step={1}
                    value={Math.round((board.mapScaleX ?? 1) * 100)}
                    onChange={e => setBoard({ mapScaleX: +e.target.value / 100 })}
                    style={{ width: '100%', accentColor: '#fbbf24', marginBottom: 8 }}
                  />

                  {/* Height Stretch */}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>
                    Height Stretch: {Math.round((board.mapScaleY ?? 1) * 100)}%
                  </div>
                  <input
                    type="range" min={25} max={300} step={1}
                    value={Math.round((board.mapScaleY ?? 1) * 100)}
                    onChange={e => setBoard({ mapScaleY: +e.target.value / 100 })}
                    style={{ width: '100%', accentColor: '#fbbf24', marginBottom: 8 }}
                  />

                  {/* Position offset */}
                  <div style={{ fontSize: 10, color: '#475569', marginBottom: 6 }}>
                    Offset: {Math.round(board.mapX ?? 0)}px, {Math.round(board.mapY ?? 0)}px
                  </div>
                  {btn('⟳ Reset Map', () => setBoard({ mapX: 0, mapY: 0, mapScaleX: 1, mapScaleY: 1 }))}
                </>
              )}
            </div>
          )}

          {/* Grid Opacity */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>
              Grid Opacity: {Math.round((board.gridOpacity ?? 0.3) * 100)}%
            </div>
            <input
              type="range" min={0} max={100} step={1}
              value={Math.round((board.gridOpacity ?? 0.3) * 100)}
              onChange={e => setBoard({ gridOpacity: +e.target.value / 100 })}
              style={{ width: '100%', accentColor: '#6366f1', marginBottom: 4 }}
            />
          </div>

        </>
      ))}

      {/* Unit Template (when place_unit tool active) */}
      {activeTool === 'place_unit' && section('New Unit', (
        <>
          {/* Placement count */}
          {label('Units per Click')}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {[1, 5, 10, 20].map(n => (
              <button
                key={n}
                onClick={() => setUnitTemplate({ placementCount: n })}
                style={{
                  flex: 1, padding: '4px 0', fontSize: 12, fontWeight: 700,
                  borderRadius: 6, cursor: 'pointer', border: '1px solid',
                  borderColor: (unitTemplate.placementCount ?? 1) === n ? '#6366f1' : '#334155',
                  background: (unitTemplate.placementCount ?? 1) === n ? 'rgba(99,102,241,0.25)' : '#1e293b',
                  color: (unitTemplate.placementCount ?? 1) === n ? '#a5b4fc' : '#64748b',
                  transition: 'all 0.15s',
                }}
              >
                {n}
              </button>
            ))}
          </div>

          {label('Base Size')}
          <select
            value={unitTemplate.baseSize.label}
            onChange={e => {
              const bs = BASE_SIZES.find(b => b.label === e.target.value);
              if (bs) setUnitTemplate({ baseSize: bs });
            }}
            style={{
              width: '100%', background: '#1e293b', border: '1px solid #334155',
              color: '#e2e8f0', borderRadius: 6, padding: '5px 8px', fontSize: 11, marginBottom: 8,
            }}>
            {BASE_SIZES.map(b => <option key={b.label} value={b.label}>{b.label}</option>)}
          </select>
          {label('Name')}
          {input(unitTemplate.name, v => setUnitTemplate({ name: v }))}
          {label('Unit Type')}
          {input(unitTemplate.unitType, v => setUnitTemplate({ unitType: v }))}
          {label('Color')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {UNIT_COLORS.map(c => (
              <div key={c} onClick={() => setUnitTemplate({ color: c })}
                style={{
                  width: 20, height: 20, borderRadius: 4, background: c, cursor: 'pointer',
                  border: unitTemplate.color === c ? '2px solid white' : '2px solid transparent',
                }} />
            ))}
          </div>
          <div onClick={() => setShowTemplateColorPicker(!showTemplateColorPicker)}
            style={{
              width: '100%', height: 28, borderRadius: 6, background: unitTemplate.color,
              cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 11, color: 'rgba(255,255,255,0.8)',
              border: '1px solid #334155',
            }}>
            Custom Color
          </div>
          {showTemplateColorPicker && (
            <div style={{ marginBottom: 8 }}>
              <HexColorPicker color={unitTemplate.color} onChange={c => setUnitTemplate({ color: c })} />
            </div>
          )}
          <div style={{ fontSize: 10, color: '#475569' }}>
            Click canvas to place {unitTemplate.placementCount ?? 1} unit{(unitTemplate.placementCount ?? 1) > 1 ? 's' : ''}
          </div>
        </>
      ))}

      {/* Selected Unit Properties */}
      {hasSingleUnit && u && section('Unit Properties', (
        <>
          {label('Name')}
          {input(u.name, v => updateUnit(u.id, { name: v }))}
          {label('Unit Type')}
          {input(u.unitType, v => updateUnit(u.id, { unitType: v }))}
          {label('Color')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {UNIT_COLORS.map(c => (
              <div key={c} onClick={() => updateUnit(u.id, { color: c })}
                style={{
                  width: 20, height: 20, borderRadius: 4, background: c, cursor: 'pointer',
                  border: u.color === c ? '2px solid white' : '2px solid transparent',
                }} />
            ))}
          </div>
          <div onClick={() => setShowColorPicker(!showColorPicker)}
            style={{
              width: '100%', height: 28, borderRadius: 6, background: u.color,
              cursor: 'pointer', marginBottom: 8, border: '1px solid #334155',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: 'rgba(255,255,255,0.8)',
            }}>
            Custom Color
          </div>
          {showColorPicker && (
            <div style={{ marginBottom: 8 }}>
              <HexColorPicker color={u.color} onChange={c => updateUnit(u.id, { color: c })} />
            </div>
          )}
          {toggle(u.labelVisible, () => updateUnit(u.id, { labelVisible: !u.labelVisible }), 'Show Label')}
          {toggle(u.losEnabled, () => updateUnit(u.id, { losEnabled: !u.losEnabled }), 'Line of Sight')}
          {u.losEnabled && (
            <>
              {label('Range (inches)')}
              <input type="number" value={u.rangeInches} min={0} max={200}
                onChange={e => updateUnit(u.id, { rangeInches: +e.target.value })}
                style={{
                  width: '100%', background: '#1e293b', border: '1px solid #334155',
                  color: '#e2e8f0', borderRadius: 6, padding: '5px 8px', fontSize: 12, marginBottom: 8, boxSizing: 'border-box',
                }} />
            </>
          )}
          {label('Rotation (°)')}
          <input type="range" min={0} max={360} value={u.rotation}
            onChange={e => updateUnit(u.id, { rotation: +e.target.value })}
            style={{ width: '100%', accentColor: '#6366f1', marginBottom: 8 }} />
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
            Position: {pxToInchesUtil(u.x, ppi).toFixed(1)}" × {pxToInchesUtil(u.y, ppi).toFixed(1)}"
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
            Base: {u.baseWidthMm}mm {u.baseShape === 'oval' ? `× ${u.baseHeightMm}mm` : ''} {u.baseShape}
          </div>
          {toggle(u.locked, () => updateUnit(u.id, { locked: !u.locked }), 'Lock Unit')}
        </>
      ))}

      {/* Selected Terrain */}
      {selectedTerrain && section('Terrain', (
        <>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
            Shape: <span style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>{selectedTerrain.shape}</span>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
            Tag: <span style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>{selectedTerrain.tags.join(', ').replace('_', ' ')}</span>
          </div>
          {btn('🗑 Delete Terrain', () => deleteTerrain(selectedTerrain.id), 'danger')}
        </>
      ))}

      {/* Actions for single selected unit */}
      {selectedIds.length === 1 && u && section('Actions', (
        <>
          {btn('⧉ Duplicate', () => duplicateUnits([u.id]), 'primary')}
          {btn('🗑 Delete', () => deleteUnits([u.id]), 'danger')}
        </>
      ))}

      {selectedIds.length > 1 && section(`${selectedIds.length} Selected`, (
        <>
          {/* ── Group: Line of Sight ── */}
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Line of Sight</div>
          {(() => {
            const anyLos = selectedUnits.some(u => u.losEnabled);
            const allLos = selectedUnits.every(u => u.losEnabled);
            return (
              <>
                <div onClick={() => selectedUnits.forEach(u => updateUnit(u.id, { losEnabled: !allLos }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 6 }}>
                  <div style={{
                    width: 28, height: 16, borderRadius: 8,
                    background: allLos ? '#6366f1' : anyLos ? '#4338ca' : '#1e293b',
                    border: '1px solid ' + (anyLos ? '#6366f1' : '#334155'),
                    position: 'relative', transition: 'background 0.2s',
                  }}>
                    <div style={{
                      position: 'absolute', top: 2,
                      left: allLos ? 14 : 2,
                      width: 10, height: 10, borderRadius: '50%',
                      background: anyLos ? 'white' : '#475569', transition: 'left 0.2s',
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: anyLos ? '#e2e8f0' : '#64748b' }}>
                    {allLos ? 'LoS On (all)' : anyLos ? 'LoS Mixed — click to enable all' : 'LoS Off (all)'}
                  </span>
                </div>
                {anyLos && (
                  <>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>Range (inches) — LoS units</div>
                    <input
                      type="number" value={groupRange} min={0} max={200}
                      onChange={e => {
                        setGroupRange(e.target.value);
                        const val = +e.target.value;
                        if (!isNaN(val)) selectedUnits.filter(u => u.losEnabled).forEach(u => updateUnit(u.id, { rangeInches: val }));
                      }}
                      style={{
                        width: '100%', background: '#1e293b', border: '1px solid #334155',
                        color: '#e2e8f0', borderRadius: 6, padding: '5px 8px', fontSize: 12,
                        marginBottom: 8, boxSizing: 'border-box' as const,
                      }}
                    />
                  </>
                )}
              </>
            );
          })()}

          {/* ── Group: Color ── */}
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, marginTop: 4 }}>Color</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {UNIT_COLORS.map(c => (
              <div key={c}
                onClick={() => selectedUnits.forEach(u => updateUnit(u.id, { color: c }))}
                title={c}
                style={{
                  width: 20, height: 20, borderRadius: 4, background: c, cursor: 'pointer',
                  border: selectedUnits.every(u => u.color === c) ? '2px solid white' : '2px solid transparent',
                }} />
            ))}
          </div>
          <div
            onClick={() => setShowGroupColorPicker(!showGroupColorPicker)}
            style={{
              width: '100%', height: 28, borderRadius: 6,
              background: selectedUnits.length > 0 ? selectedUnits[0].color : '#6366f1',
              cursor: 'pointer', marginBottom: 8, border: '1px solid #334155',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: 'rgba(255,255,255,0.8)',
            }}>
            Custom Color
          </div>
          {showGroupColorPicker && (
            <div style={{ marginBottom: 8 }}>
              <HexColorPicker
                color={selectedUnits[0]?.color ?? '#6366f1'}
                onChange={c => selectedUnits.forEach(u => updateUnit(u.id, { color: c }))}
              />
            </div>
          )}

          {/* ── Group: Formation ── */}
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, marginTop: 4 }}>Formation</div>
          {btn('▬ 1 Row', () => arrangeInRows(1))}
          {btn('▬▬ 2 Rows', () => arrangeInRows(2))}
          {btn('▬▬▬ 3 Rows', () => arrangeInRows(3))}
          <div style={{ marginTop: 8 }}>
            {btn('⧉ Duplicate', () => duplicateUnits(selectedIds), 'primary')}
            {btn('🗑 Delete Selected', () => deleteUnits(selectedIds), 'danger')}
          </div>
        </>
      ))}

      {/* Layers */}
      {section('Layers', (
        <>
          {(Object.keys(layers) as (keyof typeof layers)[]).map(k =>
            toggle(layers[k], () => toggleLayer(k), k.charAt(0).toUpperCase() + k.slice(1))
          )}
        </>
      ))}

       {/* File */}
      {section('File', (
        <>
          {/* Cloud save — only shown when logged in or to prompt sign-in */}
          <button
            onClick={() => user ? onCloudSave() : onRequestAuth()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '7px 10px', borderRadius: 6, marginBottom: 8,
              background: user
                ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25))'
                : 'rgba(51,65,85,0.4)',
              border: user ? '1px solid rgba(99,102,241,0.5)' : '1px solid #334155',
              color: user ? '#a5b4fc' : '#64748b',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <span>&#x2601;</span>
            <span>{user ? 'Save to Account' : 'Sign In to Save'}</span>
          </button>
          {btn('↓ Export JSON', handleExport, 'primary')}
          <button onClick={() => importRef.current?.click()}
            style={{
              background: 'rgba(51,65,85,0.5)', color: '#94a3b8',
              border: '1px solid #334155', borderRadius: 6,
              padding: '5px 10px', fontSize: 11, cursor: 'pointer',
              width: '100%', marginBottom: 4,
            }}>
            ↑ Import JSON
          </button>
          <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          {btn('⟳ Reset View', resetView)}
          {btn('✕ Clear Board', clearBoard, 'danger')}
        </>
      ))}
    </div>
  );
}
