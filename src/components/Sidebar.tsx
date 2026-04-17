import { useStore } from '../store';
import type { ActiveTool } from '../types';

const toolGroups = [
  {
    label: 'Navigation',
    tools: [
      { id: 'select' as ActiveTool, icon: '↖', label: 'Select', tooltip: 'Select & move units (V)' },
    ],
  },
  {
    label: 'Units',
    tools: [
      { id: 'place_unit' as ActiveTool, icon: '⬤', label: 'Place', tooltip: 'Place unit token (U)' },
    ],
  },
  {
    label: 'Terrain',
    tools: [
      { id: 'terrain_line' as ActiveTool, icon: '╱', label: 'Line', tooltip: 'Draw terrain line (L)' },
      { id: 'terrain_rect' as ActiveTool, icon: '▭', label: 'Rect', tooltip: 'Draw terrain rect (R)' },
      { id: 'terrain_polygon' as ActiveTool, icon: '⬡', label: 'Poly', tooltip: 'Draw terrain polygon (P) — dbl-click to close' },
    ],
  },
  {
    label: 'Measure',
    tools: [
      { id: 'ruler' as ActiveTool, icon: '📏', label: 'Ruler', tooltip: 'Measure distance (M)' },
    ],
  },
  {
    label: 'Markup',
    tools: [
      { id: 'draw' as ActiveTool, icon: '✎', label: 'Draw', tooltip: 'Freehand Draw (D)' },
      { 
        id: 'eraser' as ActiveTool, 
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
            <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
            <path d="M22 21H7" />
            <path d="m13.3 9 5.6 5.6" />
          </svg>
        ), 
        label: 'Eraser', tooltip: 'Erase Drawings (E)' 
      },
    ],
  },
];

export function Sidebar() {
  const activeTool = useStore(s => s.activeTool);
  const setActiveTool = useStore(s => s.setActiveTool);

  return (
    <div style={{
      width: 56, background: '#0a0f1a', borderRight: '1px solid #1e293b',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingTop: 12, gap: 8, zIndex: 10, flexShrink: 0,
    }}>
      {toolGroups.map((group, groupIndex) => (
        <div key={group.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' }}>
          {group.tools.map(t => (
            <button
              key={t.id}
              title={t.tooltip}
              onClick={() => setActiveTool(t.id)}
              style={{
                width: 40, height: 40, 
                background: activeTool === t.id ? 'rgba(99,102,241,0.2)' : 'transparent',
                borderRadius: 8,
                border: activeTool === t.id ? '1px solid #6366f1' : '1px solid transparent',
                color: activeTool === t.id ? '#a5b4fc' : '#64748b',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', fontSize: 18,
              }}
            >
              <span>{t.icon}</span>
            </button>
          ))}
          {groupIndex < toolGroups.length - 1 && (
            <div style={{ width: 32, height: 1, background: '#1e293b', margin: '4px 0' }} />
          )}
        </div>
      ))}
    </div>
  );
}
