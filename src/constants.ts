import type { BaseSize } from './types';

//  Standard Warhammer 40K Base Sizes 
export const BASE_SIZES: BaseSize[] = [
  // Round bases
  { label: '25mm Round', shape: 'round', widthMm: 25, heightMm: 25 },
  { label: '28.5mm Round', shape: 'round', widthMm: 28.5, heightMm: 28.5 },
  { label: '32mm Round', shape: 'round', widthMm: 32, heightMm: 32 },
  { label: '40mm Round', shape: 'round', widthMm: 40, heightMm: 40 },
  { label: '50mm Round', shape: 'round', widthMm: 50, heightMm: 50 },
  { label: '60mm Round', shape: 'round', widthMm: 60, heightMm: 60 },
  { label: '80mm Round', shape: 'round', widthMm: 80, heightMm: 80 },
  { label: '100mm Round', shape: 'round', widthMm: 100, heightMm: 100 },
  { label: '130mm Round', shape: 'round', widthMm: 130, heightMm: 130 },
  { label: '160mm Round', shape: 'round', widthMm: 160, heightMm: 160 },
  // Oval bases
  { label: '60x35mm Oval', shape: 'oval', widthMm: 60, heightMm: 35 },
  { label: '70x25mm Oval', shape: 'oval', widthMm: 70, heightMm: 25 },
  { label: '90x52mm Oval', shape: 'oval', widthMm: 90, heightMm: 52 },
  { label: '105x70mm Oval', shape: 'oval', widthMm: 105, heightMm: 70 },
  { label: '120x92mm Oval', shape: 'oval', widthMm: 120, heightMm: 92 },
  { label: '160x105mm Oval', shape: 'oval', widthMm: 160, heightMm: 105 },
];

//  Default Colors 
export const UNIT_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f59e0b', '#ffffff', '#64748b',
];

export const TERRAIN_COLORS = [
  '#6b7280', '#44403c', '#1e3a5f', '#065f46',
  '#7c3aed', '#b45309', '#374151', '#1f2937',
];

//  Default Board Dimensions 
export const DEFAULT_BOARD_WIDTH_INCHES = 44;
export const DEFAULT_BOARD_HEIGHT_INCHES = 60;

//  History Config 
export const MAX_HISTORY_SIZE = 50;

//  LoS Ray Config 
export const LOS_RAY_COUNT = 360; // one ray per degree
export const LOS_MAX_RANGE_PX_MULTIPLIER = 10000; // effectively infinite if no range set
