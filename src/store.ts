import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  ActiveTool, BoardState, LayerVisibility, TerrainObject,
  UnitToken, HistorySnapshot, RulerState, UnitTemplate
} from './types';
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

  // Selection
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;

  // Clipboard
  clipboardUnits: UnitToken[];
  copySelection: () => void;
  pasteClipboard: () => void;

  // Active tool
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;

  // Unit template (for placement tool)
  unitTemplate: UnitTemplate;
  setUnitTemplate: (t: Partial<UnitTemplate>) => void;

  // Layers
  layers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;

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
}

// Default Template
import { BASE_SIZES } from './constants';
const defaultTemplate: UnitTemplate = {
  baseSize: BASE_SIZES[2], // 32mm
  color: '#3b82f6',
  name: 'Unit',
  unitType: 'Infantry',
  placementCount: 1,
};

// INITIAL BOARD STATE FOR DEMONSTRATION
const b_id_center = uuidv4();
const INITIAL_TERRAIN: TerrainObject[] = [
  { id: uuidv4(), shape: 'rect', points: [460, 160, 610, 160, 610, 410, 460, 410], tags: ['blocks_los'], color: '#6b7280', opacity: 0.85, locked: false },
  { id: uuidv4(), shape: 'rect', points: [330, 410, 460, 410, 460, 560, 330, 560], tags: ['blocks_los'], color: '#6b7280', opacity: 0.85, locked: false },
];

const INITIAL_UNITS: UnitToken[] = [
  // Blue group (MSU)
  { id: b_id_center, name: 'MSU', unitType: 'Infantry', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 230, y: 280, rotation: 0, color: '#3b82f6', labelVisible: true, facingArrow: false, losEnabled: true, rangeInches: 24, locked: false },
  { id: uuidv4(), name: 'MSU', unitType: 'Infantry', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 170, y: 280, rotation: 0, color: '#3b82f6', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false },
  { id: uuidv4(), name: 'MSU', unitType: 'Infantry', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 290, y: 280, rotation: 0, color: '#3b82f6', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false },
  { id: uuidv4(), name: 'MSU', unitType: 'Infantry', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 230, y: 220, rotation: 0, color: '#3b82f6', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false },
  { id: uuidv4(), name: 'MSU', unitType: 'Infantry', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 230, y: 340, rotation: 0, color: '#3b82f6', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false },

  // Green group (Orks)
  { id: uuidv4(), name: 'Orks', unitType: 'Infantry', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 680, y: 480, rotation: 0, color: '#22c55e', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false },
  { id: uuidv4(), name: 'Orks', unitType: 'Infantry', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 680, y: 420, rotation: 0, color: '#22c55e', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false },
  { id: uuidv4(), name: 'Orks', unitType: 'Infantry', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 680, y: 540, rotation: 0, color: '#22c55e', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false },
  { id: uuidv4(), name: 'Orks', unitType: 'Infantry', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 740, y: 480, rotation: 0, color: '#22c55e', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false },
  { id: uuidv4(), name: 'Orks', unitType: 'Infantry', baseShape: 'round', baseWidthMm: 32, baseHeightMm: 32, x: 740, y: 540, rotation: 0, color: '#22c55e', labelVisible: true, facingArrow: false, losEnabled: false, rangeInches: 24, locked: false },
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
      get().pushHistory();
      set((s) => { s.terrain.push(t); });
    },
    updateTerrain: (id, partial) =>
      set((s) => {
        const i = s.terrain.findIndex((t) => t.id === id);
        if (i >= 0) Object.assign(s.terrain[i], partial);
      }),
    deleteTerrain: (id) => {
      get().pushHistory();
      set((s) => { s.terrain = s.terrain.filter((t) => t.id !== id); });
    },

    // Units
    units: INITIAL_UNITS,
    addUnit: (u) => {
      get().pushHistory();
      set((s) => { s.units.push(u); });
    },
    addUnitsBatch: (units) => {
      get().pushHistory();
      set((s) => { units.forEach(u => s.units.push(u)); });
    },
    updateUnit: (id, partial) =>
      set((s) => {
        const i = s.units.findIndex((u) => u.id === id);
        if (i >= 0) Object.assign(s.units[i], partial);
      }),
    deleteUnits: (ids) => {
      get().pushHistory();
      set((s) => { s.units = s.units.filter((u) => !ids.includes(u.id)); });
    },
    duplicateUnits: (ids) => {
      get().pushHistory();
      set((s) => {
        const toDup = s.units.filter((u) => ids.includes(u.id));
        toDup.forEach((u) => {
          s.units.push({ ...u, id: uuidv4(), x: u.x + 20, y: u.y + 20 });
        });
      });
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
    copySelection: () => {
      const { units, selectedIds } = get();
      const toCopy = units.filter((u) => selectedIds.includes(u.id));
      // Save clones
      set((s) => { s.clipboardUnits = JSON.parse(JSON.stringify(toCopy)); });
    },
    pasteClipboard: () => {
      const { clipboardUnits } = get();
      if (clipboardUnits.length === 0) return;
      get().pushHistory();
      set((s) => {
        const newIds: string[] = [];
        clipboardUnits.forEach((u) => {
          const newId = uuidv4();
          newIds.push(newId);
          s.units.push({ ...u, id: newId, x: u.x + 20, y: u.y + 20 });
        });
        s.selectedIds = newIds;
      });
    },

    // Tool
    activeTool: 'select',
    setActiveTool: (tool) => set((s) => { s.activeTool = tool; }),

    // Unit template
    unitTemplate: defaultTemplate,
    setUnitTemplate: (t) =>
      set((s) => { Object.assign(s.unitTemplate, t); }),

    // Layers
    layers: {
      map: true, grid: true, terrain: true,
      units: true, los: true, measurement: true,
    },
    toggleLayer: (layer) =>
      set((s) => { s.layers[layer] = !s.layers[layer]; }),

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
    history: [],
    historyIndex: -1,
    pushHistory: () => {
      const { terrain, units, history, historyIndex } = get();
      const snapshot: HistorySnapshot = {
        terrain: JSON.parse(JSON.stringify(terrain)),
        units: JSON.parse(JSON.stringify(units)),
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
        s.historyIndex = historyIndex + 1;
      });
    },

    // Persistence
    exportJSON: () => {
      const { board, terrain, units, canvasWidth } = get();
      // Include canvasWidth so importJSON can rescale positions if the canvas
      // size differs between save and load sessions.
      return JSON.stringify({ board, terrain, units, savedCanvasWidth: canvasWidth }, null, 2);
    },
    importJSON: (json) => {
      try {
        const data = JSON.parse(json);
        // Compute the position scaling ratio. All terrain/unit positions and
        // mapX/mapY are stored as absolute canvas pixels. If the canvas is a
        // different width now (different window size / screen resolution), we
        // must scale every position so it maps to the same fractional location.
        const currentCanvasWidth = get().canvasWidth;
        const ratio = data.savedCanvasWidth && data.savedCanvasWidth > 0
          ? currentCanvasWidth / data.savedCanvasWidth
          : 1;

        set((s) => {
          if (data.board) {
            Object.assign(s.board, data.board);
            if (ratio !== 1) {
              // mapScaleX/Y are fractions of canvasWidth — no scaling needed.
              // Only the absolute-pixel offset needs rescaling.
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
            }));
          }
          if (data.units) {
            s.units = data.units.map((u: any) => ({
              ...u,
              x: u.x * ratio,
              y: u.y * ratio,
            }));
          }
          s.selectedIds = [];
        });
      } catch (e) {
        console.error('Failed to import JSON', e);
      }
    },
    clearBoard: () => {
      get().pushHistory();
      set((s) => {
        s.terrain = [];
        s.units = [];
        s.selectedIds = [];
        s.ruler = { active: false, startX: 0, startY: 0, endX: 0, endY: 0 };
      });
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
