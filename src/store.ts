import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  ActiveTool, BoardState, LayerVisibility, TerrainObject,
  UnitToken, HistorySnapshot, RulerState, UnitTemplate,
  DrawingObject, LayerName, InteractionLayer
} from './types';
import type { ScenarioTemplate } from './templates';
import {
  DEFAULT_BOARD_WIDTH_INCHES, DEFAULT_BOARD_HEIGHT_INCHES, MAX_HISTORY_SIZE
} from './constants';

// Full App State
export interface AppStore {
  // Board
  board: BoardState;
  setBoard: (partial: Partial<BoardState>) => void;

  // Canvas dimensions (set by BoardCanvas on mount/resize)
  canvasWidth: number;
  canvasHeight: number;
  setCanvasDimensions: (w: number, h: number) => void;

  // Terrain
  terrain: TerrainObject[];
  addTerrain: (t: TerrainObject) => void;
  updateTerrain: (id: string, partial: Partial<TerrainObject>) => void;
  deleteTerrain: (id: string) => void;

  // Units
  units: UnitToken[];
  addUnit: (u: UnitToken) => void;
  addUnitsBatch: (units: UnitToken[]) => void;
  updateUnit: (id: string, partial: Partial<UnitToken>) => void;
  deleteUnits: (ids: string[]) => void;
  duplicateUnits: (ids: string[]) => void;

  // Drawings
  drawColor: string;
  setDrawColor: (c: string) => void;
  drawings: DrawingObject[];
  addDrawing: (d: DrawingObject) => void;
  updateDrawing: (id: string, partial: Partial<DrawingObject>) => void;
  deleteDrawings: (ids: string[]) => void;
  duplicateDrawings: (ids: string[]) => void;

  // Selection
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;

  // Clipboard
  clipboardUnits: UnitToken[];
  clipboardTerrain: TerrainObject[];
  clipboardDrawings: DrawingObject[];
  copySelection: () => void;
  pasteClipboard: (centerPos?: { x: number; y: number }) => void;

  // Active tool
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  activeInteractionLayer: InteractionLayer;
  setActiveInteractionLayer: (layer: InteractionLayer) => void;

  // Change Object Layer
  changeLayer: (ids: string[], targetLayer: LayerName) => void;

  // Unit template (for placement tool)
  unitTemplate: UnitTemplate;
  setUnitTemplate: (t: Partial<UnitTemplate>) => void;

  // Layers & Visibilities
  layers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  
  // Object layer — single unified control
  objectsVisible: boolean;
  objectsLocked: boolean;
  toggleObjectsVisible: () => void;
  toggleObjectsLocked: () => void;

  // Snap to grid
  snapEnabled: boolean;
  toggleSnap: () => void;

  // Ruler
  ruler: RulerState;
  setRuler: (r: Partial<RulerState>) => void;

  // Viewport
  stageX: number;
  stageY: number;
  stageScale: number;
  setViewport: (x: number, y: number, scale: number) => void;
  resetView: () => void;

  // History (undo/redo)
  history: HistorySnapshot[];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Persistence
  exportJSON: () => string;
  importJSON: (json: string) => void;
  clearBoard: () => void;
  loadTemplate: (template: ScenarioTemplate) => void;
}

// Default Template
import { BASE_SIZES } from './constants';
const defaultTemplate: UnitTemplate = {
  baseSize: BASE_SIZES[2], // 32mm
  color: '#3b82f6',
  name: 'Unit',
  placementCount: 1,
};

// INITIAL BOARD STATE FOR DEMONSTRATION
const b_id_center = uuidv4();
const INITIAL_TERRAIN: TerrainObject[] = [
  { id: uuidv4(), shape: 'rect', points: [460, 160, 610, 160, 610, 410, 460, 410], tags: ['blocks_los'], color: '#6b7280', opacity: 0.85, locked: false, layerId: 'terrain' },
  { id: uuidv4(), shape: 'rect', points: [330, 410, 460, 410, 460, 560, 330, 560], tags: ['blocks_los'], color: '#6b7280', opacity: 0.85, locked: false, layerId: 'terrain' },
];

const INITIAL_UNITS: UnitToken[] = [
  // Blue group (MSU)
  { id: b_id_center, name: 'MSU', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 230, y: 280, rotation: 0, color: '#3b82f6', labelVisible: true, facingArrow: false, losEnabled: true, rangeInches: 24, locked: false, layerId: 'units' },
  { id: uuidv4(), name: 'MSU', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 170, y: 280, rotation: 0, color: '#3b82f6', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false, layerId: 'units' },
  { id: uuidv4(), name: 'MSU', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 290, y: 280, rotation: 0, color: '#3b82f6', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false, layerId: 'units' },
  { id: uuidv4(), name: 'MSU', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 230, y: 220, rotation: 0, color: '#3b82f6', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false, layerId: 'units' },
  { id: uuidv4(), name: 'MSU', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 230, y: 340, rotation: 0, color: '#3b82f6', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false, layerId: 'units' },

  // Green group (Nobz)
  { id: uuidv4(), name: 'Nobz', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 680, y: 480, rotation: 0, color: '#22c55e', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false, layerId: 'units' },
  { id: uuidv4(), name: 'Nobz', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 680, y: 420, rotation: 0, color: '#22c55e', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false, layerId: 'units' },
  { id: uuidv4(), name: 'Nobz', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 680, y: 540, rotation: 0, color: '#22c55e', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false, layerId: 'units' },
  { id: uuidv4(), name: 'Nobz', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 740, y: 480, rotation: 0, color: '#22c55e', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false, layerId: 'units' },
  { id: uuidv4(), name: 'Nobz', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 740, y: 540, rotation: 0, color: '#22c55e', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false, layerId: 'units' },
];

// Store
export const useStore = create<AppStore>()(
  immer((set, get) => ({
    // Board
    board: {
      widthInches: DEFAULT_BOARD_WIDTH_INCHES,
      heightInches: DEFAULT_BOARD_HEIGHT_INCHES,
      mapImageUrl: null,
      mapImageWidth: 0,
      mapImageHeight: 0,
      mapX: 0,
      mapY: 0,
      mapScaleX: 1,
      mapScaleY: 1,
      gridOpacity: 0.3,
    },
    setBoard: (partial) =>
      set((s) => { Object.assign(s.board, partial); }),

    // Canvas
    canvasWidth: 900,
    canvasHeight: 700,
    setCanvasDimensions: (w, h) =>
      set((s) => { s.canvasWidth = w; s.canvasHeight = h; }),

    // Terrain
    terrain: INITIAL_TERRAIN,
    addTerrain: (t) => {
      set((s) => { s.terrain.push(t); });
      get().pushHistory();
    },
    updateTerrain: (id, partial) =>
      set((s) => {
        const i = s.terrain.findIndex((t) => t.id === id);
        if (i >= 0) Object.assign(s.terrain[i], partial);
      }),
    deleteTerrain: (id) => {
      set((s) => { s.terrain = s.terrain.filter((t) => t.id !== id); });
      get().pushHistory();
    },

    // Drawings
    drawColor: '#e4e4e7',
    setDrawColor: (c) => set((s) => { s.drawColor = c; }),
    drawings: [],
    addDrawing: (d) => {
      set((s) => { s.drawings.push(d); });
      get().pushHistory();
    },
    updateDrawing: (id, partial) =>
      set((s) => {
        const i = s.drawings.findIndex((d) => d.id === id);
        if (i >= 0) Object.assign(s.drawings[i], partial);
      }),
    deleteDrawings: (ids) => {
      set((s) => { s.drawings = s.drawings.filter((d) => !ids.includes(d.id)); });
      get().pushHistory();
    },
    duplicateDrawings: (ids) => {
      set((s) => {
        const toDup = s.drawings.filter((d) => ids.includes(d.id));
        toDup.forEach((d) => {
          // move simple points
          const newPoints = d.points.map((p, i) => p + 20); // x+20, y+20
          s.drawings.push({ ...d, id: uuidv4(), points: newPoints });
        });
      });
      get().pushHistory();
    },

    // Units
    units: INITIAL_UNITS,
    addUnit: (u) => {
      set((s) => { s.units.push(u); });
      get().pushHistory();
    },
    addUnitsBatch: (units) => {
      set((s) => { units.forEach(u => s.units.push(u)); });
      get().pushHistory();
    },
    updateUnit: (id, partial) =>
      set((s) => {
        const i = s.units.findIndex((u) => u.id === id);
        if (i >= 0) Object.assign(s.units[i], partial);
      }),
    deleteUnits: (ids) => {
      set((s) => { s.units = s.units.filter((u) => !ids.includes(u.id)); });
      get().pushHistory();
    },
    duplicateUnits: (ids) => {
      set((s) => {
        const toDup = s.units.filter((u) => ids.includes(u.id));
        toDup.forEach((u) => {
          s.units.push({ ...u, id: uuidv4(), x: u.x + 20, y: u.y + 20 });
        });
      });
      get().pushHistory();
    },

    // Selection
    selectedIds: [b_id_center],
    setSelectedIds: (ids) => set((s) => { s.selectedIds = ids; }),
    addToSelection: (id) => set((s) => { if (!s.selectedIds.includes(id)) s.selectedIds.push(id); }),
    toggleSelection: (id) =>
      set((s) => {
        const i = s.selectedIds.indexOf(id);
        if (i >= 0) s.selectedIds.splice(i, 1);
        else s.selectedIds.push(id);
      }),
    clearSelection: () => set((s) => { s.selectedIds = []; }),

    // Clipboard
    clipboardUnits: [],
    clipboardTerrain: [] as TerrainObject[],
    clipboardDrawings: [] as DrawingObject[],
    copySelection: () => {
      const { units, terrain, drawings, selectedIds } = get();
      const toCopyUnits = units.filter((u) => selectedIds.includes(u.id));
      const toCopyTerrain = terrain.filter((t) => selectedIds.includes(t.id));
      const toCopyDrawings = drawings.filter((d) => selectedIds.includes(d.id));
      
      set((s) => { 
        s.clipboardUnits = JSON.parse(JSON.stringify(toCopyUnits)); 
        (s as any).clipboardTerrain = JSON.parse(JSON.stringify(toCopyTerrain));
        (s as any).clipboardDrawings = JSON.parse(JSON.stringify(toCopyDrawings));
      });
    },
    pasteClipboard: (centerPos) => {
      const { clipboardUnits, clipboardTerrain = [], clipboardDrawings = [] } = get();
      
      if (clipboardUnits.length === 0 && clipboardTerrain.length === 0 && clipboardDrawings.length === 0) return;
      set((s) => {
        const newIds: string[] = [];
        
        let cx = 0, cy = 0;
        let totalCount = 0;
        
        clipboardUnits.forEach((u: UnitToken) => { cx += u.x; cy += u.y; totalCount++; });
        clipboardTerrain.forEach((t: TerrainObject) => {
          let tX = 0, tY = 0;
          for (let i = 0; i < t.points.length; i += 2) { tX += t.points[i]; tY += t.points[i+1]; }
          if (t.points.length > 0) {
            cx += tX / (t.points.length / 2); cy += tY / (t.points.length / 2);
            totalCount++;
          }
        });
        clipboardDrawings.forEach((d: DrawingObject) => {
          let dX = 0, dY = 0;
          for (let i = 0; i < d.points.length; i += 2) { dX += d.points[i]; dY += d.points[i+1]; }
          if (d.points.length > 0) {
            cx += dX / (d.points.length / 2); cy += dY / (d.points.length / 2);
            totalCount++;
          }
        });
        
        if (totalCount > 0) {
          cx /= totalCount; cy /= totalCount;
        }

        const dx = centerPos ? (centerPos.x - cx) : 20;
        const dy = centerPos ? (centerPos.y - cy) : 20;

        clipboardUnits.forEach((u) => {
          const newId = uuidv4();
          newIds.push(newId);
          s.units.push({ ...u, id: newId, x: u.x + (centerPos ? dx : 20), y: u.y + (centerPos ? dy : 20) });
        });
        
        clipboardTerrain.forEach((t: TerrainObject) => {
          const newId = uuidv4();
          newIds.push(newId);
          const newPts = t.points.map((p: number, i: number) => p + (centerPos ? (i % 2 === 0 ? dx : dy) : 20));
          s.terrain.push({ ...t, id: newId, points: newPts });
        });

        clipboardDrawings.forEach((d: DrawingObject) => {
          const newId = uuidv4();
          newIds.push(newId);
          const newPts = d.points.map((p: number, i: number) => p + (centerPos ? (i % 2 === 0 ? dx : dy) : 20));
          s.drawings.push({ ...d, id: newId, points: newPts });
        });

        s.selectedIds = newIds;
      });
      get().pushHistory();
    },

    // Active tool
    activeTool: 'select',
    setActiveTool: (t) => {
      set((s) => {
        s.activeTool = t;
        s.ruler.active = false;
        if (t === 'select') s.selectedIds = [];
      });
    },

    activeInteractionLayer: 'all',
    setActiveInteractionLayer: (layer) => {
      set((s) => {
        s.activeInteractionLayer = layer;
        s.selectedIds = []; // clear selection when switching layers
      });
    },

    changeLayer: (ids, targetLayer) => {
       set((s) => {
         s.units.forEach(u => { if (ids.includes(u.id)) u.layerId = targetLayer; });
         s.terrain.forEach(t => { if (ids.includes(t.id)) t.layerId = targetLayer; });
         s.drawings.forEach(d => { if (ids.includes(d.id)) d.layerId = targetLayer; });
       });
       get().pushHistory();
    },

    // Unit template
    unitTemplate: defaultTemplate,
    setUnitTemplate: (t) =>
      set((s) => { Object.assign(s.unitTemplate, t); }),

    // Layers & Visibilities
    layers: {
      map: true, grid: true, terrain: true,
      units: true, los: true, measurement: true,
    },
    toggleLayer: (layer) =>
      set((s) => { s.layers[layer] = !s.layers[layer]; }),
    
    // Object layer
    objectsVisible: true,
    objectsLocked: false,
    toggleObjectsVisible: () => set((s) => { s.objectsVisible = !s.objectsVisible; }),
    toggleObjectsLocked: () => set((s) => { s.objectsLocked = !s.objectsLocked; }),

    // Snap
    snapEnabled: false,
    toggleSnap: () => set((s) => { s.snapEnabled = !s.snapEnabled; }),

    // Ruler
    ruler: { active: false, startX: 0, startY: 0, endX: 0, endY: 0 },
    setRuler: (r) => set((s) => { Object.assign(s.ruler, r); }),

    // Viewport
    stageX: 0,
    stageY: 0,
    stageScale: 1,
    setViewport: (x, y, scale) =>
      set((s) => { s.stageX = x; s.stageY = y; s.stageScale = scale; }),
    resetView: () =>
      set((s) => { s.stageX = 0; s.stageY = 0; s.stageScale = 1; }),

    // History
    history: [{ terrain: JSON.parse(JSON.stringify(INITIAL_TERRAIN)), units: JSON.parse(JSON.stringify(INITIAL_UNITS)), drawings: [] }] as HistorySnapshot[],
    historyIndex: 0,
    pushHistory: () => {
      const { terrain, units, drawings, history, historyIndex } = get();
      const snapshot: HistorySnapshot = {
        terrain: JSON.parse(JSON.stringify(terrain)),
        units: JSON.parse(JSON.stringify(units)),
        drawings: JSON.parse(JSON.stringify(drawings || [])),
      };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(snapshot);
      if (newHistory.length > MAX_HISTORY_SIZE) newHistory.shift();
      set((s) => {
        s.history = newHistory as any;
        s.historyIndex = newHistory.length - 1;
      });
    },
    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex <= 0) return;
      const prev = history[historyIndex - 1];
      set((s) => {
        s.terrain = JSON.parse(JSON.stringify(prev.terrain));
        s.units = JSON.parse(JSON.stringify(prev.units));
        s.drawings = prev.drawings ? JSON.parse(JSON.stringify(prev.drawings)) : [];
        s.historyIndex = historyIndex - 1;
      });
    },
    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex >= history.length - 1) return;
      const next = history[historyIndex + 1];
      set((s) => {
        s.terrain = JSON.parse(JSON.stringify(next.terrain));
        s.units = JSON.parse(JSON.stringify(next.units));
        s.drawings = next.drawings ? JSON.parse(JSON.stringify(next.drawings)) : [];
        s.historyIndex = historyIndex + 1;
      });
    },

    // Persistence
    exportJSON: () => {
      const { board, terrain, units, drawings, objectsVisible, objectsLocked, canvasWidth } = get();
      return JSON.stringify({ board, terrain, units, drawings, objectsVisible, objectsLocked, savedCanvasWidth: canvasWidth }, null, 2);
    },
    importJSON: (json) => {
      try {
        const data = JSON.parse(json);
        const currentCanvasWidth = get().canvasWidth;
        const ratio = data.savedCanvasWidth && data.savedCanvasWidth > 0
          ? currentCanvasWidth / data.savedCanvasWidth
          : 1;

        set((s) => {
          if (data.board) {
            Object.assign(s.board, data.board);
            if (ratio !== 1) {
              s.board.mapX = (data.board.mapX ?? 0) * ratio;
              s.board.mapY = (data.board.mapY ?? 0) * ratio;
            }
          }
          if (data.terrain) {
            s.terrain = data.terrain.map((t: any) => ({
              ...t,
              points: ratio === 1
                ? t.points
                : t.points.map((v: number) => v * ratio),
              layerId: t.layerId || 'terrain',
            }));
          }
          if (data.units) {
            s.units = data.units.map((u: any) => ({
              ...u,
              x: u.x * ratio,
              y: u.y * ratio,
              layerId: u.layerId || 'units',
            }));
          }
          if (data.drawings) {
            s.drawings = data.drawings.map((draw: any) => ({
              ...draw,
              points: ratio === 1 ? draw.points : draw.points.map((v: number) => v * ratio),
              layerId: draw.layerId || 'drawings',
            }));
          } else {
            s.drawings = [];
          }
          
          if (data.objectsVisible !== undefined) s.objectsVisible = data.objectsVisible;
          if (data.objectsLocked !== undefined) s.objectsLocked = data.objectsLocked;
          
          s.selectedIds = [];
        });
      } catch (e) {
        console.error('Failed to import JSON', e);
      }
    },
    clearBoard: () => {
      set((s) => {
        s.terrain = [];
        s.units = [];
        s.drawings = [];
        s.selectedIds = [];
        s.ruler = { active: false, startX: 0, startY: 0, endX: 0, endY: 0 };
      });
      get().pushHistory();
    },
    loadTemplate: (template) => {
      const currentCanvasWidth = get().canvasWidth;
      const ratio = template.savedCanvasWidth && template.savedCanvasWidth > 0
        ? currentCanvasWidth / template.savedCanvasWidth
        : 1;

      set((s) => {
        // Apply board state if provided
        if (template.board) {
          Object.assign(s.board, template.board);
          if (ratio !== 1) {
            s.board.mapX = ((template.board as any).mapX ?? 0) * ratio;
            s.board.mapY = ((template.board as any).mapY ?? 0) * ratio;
          }
        }
        // Terrain with scaling
        s.terrain = template.terrain().map(t => ({
          ...t,
          points: ratio === 1 ? t.points : t.points.map((v: number) => v * ratio),
        })) as any;
        // Optional units
        s.units = template.units
          ? template.units().map(u => ({
              ...u,
              x: u.x * ratio,
              y: u.y * ratio,
            }))
          : [];
        // Optional drawings
        s.drawings = template.drawings
          ? template.drawings().map(d => ({
              ...d,
              points: ratio === 1 ? d.points : d.points.map((v: number) => v * ratio),
            })) as any
          : [];
        s.selectedIds = [];
        s.ruler = { active: false, startX: 0, startY: 0, endX: 0, endY: 0 };
      });
      get().pushHistory();
    },
  }))
);

// Stable scale helpers — call these in components, not as store selectors
export function getPixelsPerInch(canvasWidth: number, boardWidthInches: number) {
  return canvasWidth / Math.max(boardWidthInches, 1);
}
export function mmToPx(mm: number, ppi: number) {
  return (mm / 25.4) * ppi;
}
export function pxToInches(px: number, ppi: number) {
  return px / ppi;
}
