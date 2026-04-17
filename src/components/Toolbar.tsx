import React, { useEffect } from 'react';
import { useStore, getPixelsPerInch } from '../store';
import { AccountButton } from './AccountButton';
import { useAuth } from '../contexts/AuthContext';

interface ToolbarProps {
  onOpenScenarios: () => void;
  onOpenAuth: () => void;
}

export function Toolbar({ onOpenScenarios, onOpenAuth }: ToolbarProps) {
  // Use individual selectors to avoid creating new object references
  const activeTool = useStore(s => s.activeTool);
  const setActiveTool = useStore(s => s.setActiveTool);
  const undo = useStore(s => s.undo);
  const redo = useStore(s => s.redo);
  const stageScale = useStore(s => s.stageScale);
  const stageX = useStore(s => s.stageX);
  const stageY = useStore(s => s.stageY);
  const setViewport = useStore(s => s.setViewport);
  const snapEnabled = useStore(s => s.snapEnabled);
  const toggleSnap = useStore(s => s.toggleSnap);
  const selectedIds = useStore(s => s.selectedIds);
  const terrain = useStore(s => s.terrain);
  const units = useStore(s => s.units);
  const drawings = useStore(s => s.drawings) || [];
  const deleteUnits = useStore(s => s.deleteUnits);
  const deleteTerrain = useStore(s => s.deleteTerrain);
  const deleteDrawings = useStore(s => s.deleteDrawings);
  const duplicateUnits = useStore(s => s.duplicateUnits);
  const boardWidthInches = useStore(s => s.board.widthInches);
  const canvasWidth = useStore(s => s.canvasWidth);

  const pixelsPerInch = getPixelsPerInch(canvasWidth, boardWidthInches);
  const selectedCount = selectedIds.length;
  const { user } = useAuth();

  // Deletes whatever is selected
  const deleteSelected = () => {
    const terrainIds = selectedIds.filter(id => terrain.some(t => t.id === id));
    const unitIds = selectedIds.filter(id => units.some(u => u.id === id));
    const drawingIds = selectedIds.filter(id => drawings.some(d => d.id === id));
    
    if (terrainIds.length > 0) terrainIds.forEach(id => deleteTerrain(id));
    if (unitIds.length > 0) deleteUnits(unitIds);
    if (drawingIds.length > 0) deleteDrawings(drawingIds);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if (!e.metaKey && !e.ctrlKey) {
        if (e.key === 'v' || e.key === 'V') setActiveTool('select');
        if (e.key === ' ') { e.preventDefault(); /* space reserved */ }
        if (e.key === 'u' || e.key === 'U') setActiveTool('place_unit');
        if (e.key === 'l' || e.key === 'L') setActiveTool('terrain_line');
        if (e.key === 'r' || e.key === 'R') setActiveTool('terrain_rect');
        if (e.key === 'p' || e.key === 'P') setActiveTool('terrain_polygon');
        if (e.key === 'm' || e.key === 'M') setActiveTool('ruler');
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedIds.length > 0) deleteSelected();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, setActiveTool, selectedIds, deleteUnits, deleteTerrain, terrain]);

  const tbtn = (
    icon: string, label: string, onClick: () => void,
    active = false, variant: 'default' | 'danger' = 'default'
  ) => (
    <button title={label} onClick={onClick} style={{
      background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
      border: `1px solid ${active ? '#6366f1' : 'transparent'}`,
      color: variant === 'danger' ? '#fca5a5' : (active ? '#a5b4fc' : '#64748b'),
      borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
      fontSize: 13, display: 'flex', alignItems: 'center', gap: 4,
      whiteSpace: 'nowrap' as const, transition: 'all 0.15s',
    }}>
      <span>{icon}</span>
      <span style={{ fontSize: 11 }}>{label}</span>
    </button>
  );

  const divider = () => (
    <div style={{ width: 1, height: 24, background: '#1e293b', margin: '0 4px' }} />
  );

  return (
    <div style={{
      height: 48, background: '#0a0f1a', borderBottom: '1px solid #1e293b',
      display: 'flex', alignItems: 'center', paddingInline: 12, gap: 4,
      flexShrink: 0, zIndex: 20,
    }}>
      {/* Brand */}
      <div style={{
        fontSize: 14, fontWeight: 800, color: '#a5b4fc', marginRight: 12,
        letterSpacing: '-0.02em', whiteSpace: 'nowrap' as const,
      }}>
        🎯 SightGrid
      </div>

      {divider()}

      {tbtn('↩', 'Undo', undo)}
      {tbtn('↪', 'Redo', redo)}

      {divider()}

      {tbtn(snapEnabled ? '🔒' : '🔓', `Snap: ${snapEnabled ? 'On' : 'Off'}`, toggleSnap, snapEnabled)}

      {divider()}

      {/* Zoom controls */}
      <button title="Zoom out" onClick={() => setViewport(stageX, stageY, Math.max(stageScale / 1.25, 0.2))}
        style={iconBtnStyle}>−</button>
      <span style={{ fontSize: 11, color: '#476090', minWidth: 42, textAlign: 'center' as const }}>
        {Math.round(stageScale * 100)}%
      </span>
      <button title="Zoom in" onClick={() => setViewport(stageX, stageY, Math.min(stageScale * 1.25, 8))}
        style={iconBtnStyle}>+</button>

      {divider()}

      <span style={{ fontSize: 11, color: '#334155' }}>
        {pixelsPerInch.toFixed(1)}px/in
      </span>

      {selectedCount > 0 && (
        <>
          {divider()}
          <span style={{ fontSize: 11, color: '#6366f1' }}>{selectedCount} selected</span>
          {tbtn('⧉', 'Duplicate', () => duplicateUnits(selectedIds), false)}
          {tbtn('🗑', 'Delete', deleteSelected, false, 'danger')}
        </>
      )}

      {/* Right side controls — pushed to the far right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <a 
          href="https://buy.stripe.com/dRm5kF4yOcSdgOV4G30Fi00"
          target="_blank"
          rel="noreferrer"
          title="Support SightGrid Development"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399', borderRadius: 8,
            padding: '4px 10px', fontSize: 12, fontWeight: 600,
            textDecoration: 'none',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <span>💖</span>
          <span>Support</span>
        </a>
        <AccountButton
          onOpenScenarios={onOpenScenarios}
          onOpenAuth={onOpenAuth}
        />
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent', border: '1px solid #1e293b',
  color: '#64748b', borderRadius: 5, width: 26, height: 26,
  cursor: 'pointer', fontSize: 16, lineHeight: '1',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
