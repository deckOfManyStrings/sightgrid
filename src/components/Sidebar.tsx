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
];

export function Sidebar() {
  const activeTool = useStore(s => s.activeTool);
  const setActiveTool = useStore(s => s.setActiveTool);

  return (
    <div style={{
      width: 64, background: '#0f172a', borderRight: '1px solid #1e293b',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingTop: 12, gap: 4, zIndex: 10,
    }}>
      {toolGroups.map(group => (
        <div key={group.label} style={{ width: '100%', marginBottom: 8 }}>
          <div style={{
            fontSize: 9, color: '#475569', textAlign: 'center', marginBottom: 4,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {group.label}
          </div>
          {group.tools.map(t => (
            <button
              key={t.id}
              title={t.tooltip}
              onClick={() => setActiveTool(t.id)}
              style={{
                width: '100%', height: 48, background: activeTool === t.id
                  ? 'rgba(99,102,241,0.3)' : 'transparent',
                border: 'none', borderLeft: activeTool === t.id
                  ? '3px solid #6366f1' : '3px solid transparent',
                color: activeTool === t.id ? '#a5b4fc' : '#64748b',
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                transition: 'all 0.15s', fontSize: 18,
              }}
            >
              <span>{t.icon}</span>
              <span style={{ fontSize: 9 }}>{t.label}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
