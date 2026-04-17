import React, { useEffect } from 'react';
import { useStore, getPixelsPerInch } from '../store';
import { AccountButton } from './AccountButton';
import { useAuth } from '../contexts/AuthContext';

interface ToolbarProps {
  onOpenScenarios: () => void;
  onOpenAuth: () => void;
  onCloudSave: () => void;
  onRequestAuth: () => void;
}

export function Toolbar({ onOpenScenarios, onOpenAuth, onCloudSave, onRequestAuth }: ToolbarProps) {
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
  const boardWidthInches = useStore(s => s.board.widthInches);
  const canvasWidth = useStore(s => s.canvasWidth);
  const clearBoard = useStore(s => s.clearBoard);
  const resetView = useStore(s => s.resetView);

  const pixelsPerInch = getPixelsPerInch(canvasWidth, boardWidthInches);
  const { user } = useAuth();

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
        if (e.key === 'd' || e.key === 'D') setActiveTool('draw');
        if (e.key === 'e' || e.key === 'E') setActiveTool('eraser');
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
    active = false, variant: 'default' | 'danger' | 'primary' = 'default'
  ) => {
    let color = '#64748b';
    let bg = 'transparent';
    let border = 'transparent';
    
    if (active) {
      bg = 'rgba(99,102,241,0.2)';
      border = '#6366f1';
      color = '#a5b4fc';
    } else if (variant === 'danger') {
      color = '#fca5a5';
      border = '#fecaca22';
      bg = 'rgba(239,68,68,0.1)';
    } else if (variant === 'primary') {
      color = '#a5b4fc';
      border = '#6366f144';
      bg = 'rgba(99,102,241,0.1)';
    }

    return (
      <button title={label} onClick={onClick} style={{
        background: bg,
        border: `1px solid ${border}`,
        color: color,
        borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
        fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
        whiteSpace: 'nowrap' as const, transition: 'all 0.15s',
      }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: variant !== 'default' ? 600 : 400 }}>{label}</span>
      </button>
    );
  };

  const divider = () => (
    <div style={{ width: 1, height: 24, background: '#1e293b', margin: '0 4px' }} />
  );

  return (
    <div style={{
      height: 48, background: '#0a0f1a', borderBottom: '1px solid #1e293b',
      display: 'flex', alignItems: 'center', paddingInline: 12, gap: 6,
      flexShrink: 0, zIndex: 20,
    }}>
      {/* Brand */}
      <div style={{
        fontSize: 14, fontWeight: 800, color: '#a5b4fc', marginRight: 8,
        letterSpacing: '-0.02em', whiteSpace: 'nowrap' as const,
      }}>
        🎯 SightGrid
      </div>

      {divider()}

      {/* File Group */}
      <button
        onClick={() => user ? onCloudSave() : onRequestAuth()}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: user ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))' : 'transparent',
          border: '1px solid ' + (user ? 'rgba(99,102,241,0.3)' : 'transparent'),
          color: user ? '#a5b4fc' : '#64748b',
          borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, fontWeight: user ? 600 : 400,
          transition: 'all 0.15s',
        }}
      >
        <span>&#x2601;</span>
        <span>Save</span>
      </button>


      {tbtn('✕', 'Clear', clearBoard, false, 'danger')}

      {divider()}

      {/* View & History Controls */}
      {tbtn('↩', 'Undo', undo)}
      {tbtn('↪', 'Redo', redo)}

      {divider()}

      {tbtn('⟳', 'Reset View', resetView)}
      {tbtn(snapEnabled ? '🔒' : '🔓', `Snap: ${snapEnabled ? 'On' : 'Off'}`, toggleSnap, snapEnabled)}

      {/* Zoom controls */}
      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(30,41,59,0.5)', borderRadius: 6, border: '1px solid #1e293b', overflow: 'hidden', marginLeft: 4 }}>
        <button title="Zoom out" onClick={() => setViewport(stageX, stageY, Math.max(stageScale / 1.25, 0.2))}
          style={iconBtnStyle}>−</button>
        <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 42, textAlign: 'center' as const, fontWeight: 500 }}>
          {Math.round(stageScale * 100)}%
        </span>
        <button title="Zoom in" onClick={() => setViewport(stageX, stageY, Math.min(stageScale * 1.25, 8))}
          style={iconBtnStyle}>+</button>
      </div>

      <span style={{ fontSize: 11, color: '#334155', marginLeft: 8 }}>
        {pixelsPerInch.toFixed(1)}px/in
      </span>

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
  background: 'transparent', border: 'none',
  color: '#64748b', width: 26, height: 26,
  cursor: 'pointer', fontSize: 16, lineHeight: '1',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
