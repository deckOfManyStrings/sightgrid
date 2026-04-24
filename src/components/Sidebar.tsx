import React, { useState } from 'react';
import { useStore } from '../store';
import type { ActiveTool } from '../types';

const toolGroups = [
  {
    label: 'Navigation',
    slot: [
      { id: 'select' as ActiveTool, icon: '↖', label: 'Select', tooltip: 'Select & move objects', shortcut: 'V' },
    ],
  },
  {
    label: 'Units',
    slot: [
      { id: 'place_unit' as ActiveTool, icon: '⬤', label: 'Place', tooltip: 'Place a unit token', shortcut: 'U' },
    ],
  },
  {
    label: 'Terrain',
    slot: [
      { id: 'terrain_line' as ActiveTool, icon: '╱', label: 'Line', tooltip: 'Draw a terrain line', shortcut: 'L' },
      { id: 'terrain_rect' as ActiveTool, icon: '▭', label: 'Rect', tooltip: 'Draw a terrain rectangle', shortcut: 'R' },
      { id: 'terrain_polygon' as ActiveTool, icon: '⬡', label: 'Polygon', tooltip: 'Draw a terrain polygon - click first vertex or Enter to close', shortcut: 'P' },
    ],
  },
  {
    label: 'Measure',
    slot: [
      { id: 'ruler' as ActiveTool, icon: '📏', label: 'Ruler', tooltip: 'Measure distance on the board', shortcut: 'M' },
    ],
  },
  {
    label: 'Drafting',
    slot: [
      { id: 'draw' as ActiveTool, icon: '✎', label: 'Draw', tooltip: 'Freehand draw on the board', shortcut: 'F' },
      { id: 'draw_line' as ActiveTool, icon: '╱', label: 'Line', tooltip: 'Draw a straight line', shortcut: '' },
      { id: 'draw_rect' as ActiveTool, icon: '▭', label: 'Rect', tooltip: 'Draw a rectangle', shortcut: '' },
      { id: 'draw_polygon' as ActiveTool, icon: '⬡', label: 'Polygon', tooltip: 'Draw a polygon', shortcut: '' },
    ],
  },
  {
    label: 'Eraser',
    slot: [
      { 
        id: 'eraser' as ActiveTool, 
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
            <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
            <path d="M22 21H7" />
            <path d="m13.3 9 5.6 5.6" />
          </svg>
        ), 
        label: 'Eraser', tooltip: 'Erase drawings', shortcut: 'E',
      },
    ],
  },
];

export function Sidebar() {
  const activeTool = useStore(s => s.activeTool);
  const setActiveTool = useStore(s => s.setActiveTool);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={{
      width: 64, background: '#0a0f1a', borderRight: '1px solid #1e293b',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingTop: 12, gap: 2, zIndex: 10, flexShrink: 0,
    }}>
      <style>{`
        .sg-tool-btn:hover {
          background: rgba(99,102,241,0.12) !important;
          border-color: rgba(99,102,241,0.3) !important;
          color: #c7d2fe !important;
        }
        .sg-tooltip {
          position: absolute;
          left: calc(100% + 10px);
          top: 50%;
          transform: translateY(-50%);
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 7px 10px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 1000;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          opacity: 0;
          translate: -6px 0;
          transition: opacity 0.15s ease, translate 0.15s ease;
        }
        .sg-tool-wrapper:hover .sg-tooltip {
          opacity: 1;
          translate: 0 0;
        }
        .sg-tooltip::before {
          content: '';
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-right-color: #334155;
        }
        .sg-tooltip::after {
          content: '';
          position: absolute;
          right: calc(100% - 1px);
          top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-right-color: #1e293b;
        }
        .sg-flyout {
          position: absolute;
          left: calc(100% + 4px);
          top: 0;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 8px;
          padding: 4px;
          display: flex;
          gap: 4px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          opacity: 0;
          translate: -6px 0;
          pointer-events: none;
          transition: opacity 0.15s ease, translate 0.15s ease;
          z-index: 1000;
        }
        .sg-tool-wrapper:hover .sg-flyout {
          opacity: 1;
          translate: 0 0;
          pointer-events: auto;
        }
      `}</style>

      {toolGroups.map((group, groupIndex) => {
        // Find which tool in this slot should be "visible" by default
        const activeToolInSlot = group.slot.find(t => t.id === activeTool);
        const displayTool = activeToolInSlot || group.slot[0];
        const isSlotActive = !!activeToolInSlot;
        
        return (
          <React.Fragment key={group.label}>
            <div className="sg-tool-wrapper" style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
            <button
              className="sg-tool-btn"
              onClick={() => setActiveTool(displayTool.id)}
              style={{
                width: 52, height: 52,
                background: isSlotActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                borderRadius: 8,
                border: isSlotActive ? '1px solid #6366f1' : '1px solid transparent',
                color: isSlotActive ? '#a5b4fc' : '#64748b',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3,
                transition: 'all 0.15s',
                padding: '4px 2px',
                position: 'relative'
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center' }}>{displayTool.icon}</span>
              <span style={{
                fontSize: 9, lineHeight: 1, fontWeight: 500,
                letterSpacing: '0.04em', textTransform: 'uppercase',
                color: isSlotActive ? '#a5b4fc' : '#475569',
                fontFamily: 'inherit',
              }}>{displayTool.label}</span>
              {group.slot.length > 1 && (
                <div style={{
                  position: 'absolute', bottom: 4, right: 4,
                  borderLeft: '4px solid transparent', borderTop: '4px solid transparent',
                  borderRight: `4px solid ${isSlotActive ? '#a5b4fc' : '#475569'}`, borderBottom: `4px solid ${isSlotActive ? '#a5b4fc' : '#475569'}`
                }} />
              )}
            </button>

            {group.slot.length > 1 ? (
              <div className="sg-flyout">
                {group.slot.map(t => {
                  const isActive = activeTool === t.id;
                  return (
                    <div key={t.id} style={{ position: 'relative' }} className="sg-tool-wrapper">
                      <button
                        className="sg-tool-btn"
                        onClick={() => setActiveTool(t.id)}
                        style={{
                          width: 52, height: 52,
                          background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                          borderRadius: 6,
                          border: isActive ? '1px solid #6366f1' : '1px solid transparent',
                          color: isActive ? '#a5b4fc' : '#64748b',
                          cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          gap: 3,
                        }}
                      >
                        <span style={{ fontSize: 16, lineHeight: 1 }}>{t.icon}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase',
                          color: isActive ? '#a5b4fc' : '#475569',
                        }}>{t.label}</span>
                      </button>
                      
                      <div className="sg-tooltip" style={{ left: '50%', top: 'calc(100% + 5px)', transform: 'translate(-50%, 0)', translate: '0 -6px' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 3 }}>{t.label}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: t.shortcut ? 5 : 0 }}>{t.tooltip}</div>
                        {t.shortcut && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 10, color: '#64748b' }}>Shortcut</span>
                            <kbd style={{
                              background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '1px 5px',
                              fontSize: 10, fontFamily: 'monospace', color: '#a5b4fc', boxShadow: '0 1px 0 #1e293b',
                            }}>{t.shortcut}</kbd>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="sg-tooltip">
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 3 }}>{displayTool.label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: displayTool.shortcut ? 5 : 0 }}>{displayTool.tooltip}</div>
                {displayTool.shortcut && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: '#64748b' }}>Shortcut</span>
                    <kbd style={{
                      background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '1px 5px',
                      fontSize: 10, fontFamily: 'monospace', color: '#a5b4fc', boxShadow: '0 1px 0 #1e293b',
                    }}>{displayTool.shortcut}</kbd>
                  </div>
                )}
              </div>
            )}
          </div>
          {groupIndex < toolGroups.length - 1 && (
            <div style={{ width: 36, height: 1, background: '#1e293b', margin: '6px 0' }} />
          )}
        </React.Fragment>
      );
    })}
    </div>
  );
}

