// Tool Types
export type ActiveTool =
  | 'select'
  | 'pan'
  | 'map_adjust'
  | 'place_unit'
  | 'terrain_line'
  | 'terrain_rect'
  | 'terrain_polygon'
  | 'ruler'
  | 'movement_radius'
  | 'draw'
  | 'eraser';

export type LayerName = 'units' | 'terrain' | 'drawings';

export interface LayerState {
  id: LayerName;
  visible: boolean;
  locked: boolean;
}

// Terrain
export type TerrainTag = 'blocks_los' | 'obscuring' | 'difficult' | 'decorative';
export type TerrainShape = 'polygon' | 'rect' | 'line';

export interface TerrainObject {
  id: string;
  shape: TerrainShape;
  points: number[]; // flat [x,y,x,y,...] in canvas px
  tags: TerrainTag[];
  color: string;
  opacity: number;
  locked: boolean;
  layerId: LayerName;
}

// Units
export type BaseShape = 'round' | 'oval' | 'rect';

export interface BaseSize {
  label: string;
  shape: BaseShape;
  widthMm: number;
  heightMm: number;
}

export interface UnitToken {
  id: string;
  name: string;
  baseShape: BaseShape;
  baseWidthMm: number;
  baseHeightMm: number;
  x: number; // canvas px (center)
  y: number; // canvas px (center)
  rotation: number; // degrees
  color: string;
  labelVisible: boolean;
  facingArrow: boolean;
  losEnabled: boolean;
  rangeInches: number;
  locked: boolean;
  layerId: LayerName;
}

// Drawings
export interface DrawingObject {
  id: string;
  points: number[];
  color: string;
  strokeWidth: number;
  opacity: number;
  locked: boolean;
  layerId: LayerName;
}

// Board
export interface BoardState {
  widthInches: number;
  heightInches: number;
  mapImageUrl: string | null;
  mapImageWidth: number;
  mapImageHeight: number;
  mapX: number;       // canvas px offset
  mapY: number;       // canvas px offset
  mapScaleX: number;  // horizontal stretch multiplier (1 = fill board width)
  mapScaleY: number;  // vertical stretch multiplier (1 = fill board height)
  gridOpacity: number; // 0–1
  mapOpacity?: number; // 0-1
}

// Layers
export interface LayerVisibility {
  map: boolean;
  grid: boolean;
  terrain: boolean;
  units: boolean;
  los: boolean;
  measurement: boolean;
}

// History
export interface HistorySnapshot {
  terrain: TerrainObject[];
  units: UnitToken[];
  drawings: DrawingObject[];
}

// Ruler
export interface RulerState {
  active: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// Unit Placement Draft
export interface UnitTemplate {
  baseSize: BaseSize;
  color: string;
  name: string;
  placementCount: number; // how many units to place per click (1 | 5 | 10 | 20)
}
