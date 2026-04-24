import type { TerrainObject } from './types';
import { v4 as uuidv4 } from 'uuid';

// All coordinates are in canvas-px at the default 44"×60" board (canvasWidth=900)
// ppi ≈ 900/44 ≈ 20.45 px/in
// Board size: 900 × (60/44)*900 ≈ 900 × 1227 – but we only use a visible portion.
// Coordinates below are tuned for a typical 900-wide, 615-tall viewport.

export interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** Tag line shown under name */
  subtitle: string;
  terrain: () => TerrainObject[];
}

function t(
  shape: TerrainObject['shape'],
  points: number[],
  tags: TerrainObject['tags'] = ['blocks_los'],
  color = '#6b7280',
  opacity = 0.85,
): TerrainObject {
  return { id: uuidv4(), shape, points, tags, color, opacity, locked: false, layerId: 'terrain' };
}

// ─── Helper to build a centered rect from (cx, cy, w, h) ────────────────────
function cr(cx: number, cy: number, w: number, h: number, tags?: TerrainObject['tags'], color?: string) {
  const x0 = cx - w / 2, y0 = cy - h / 2;
  const x1 = cx + w / 2, y1 = cy + h / 2;
  return t('rect', [x0, y0, x1, y0, x1, y1, x0, y1], tags, color);
}

export const TEMPLATES: ScenarioTemplate[] = [
  // ── 1. Empty Board ──────────────────────────────────────────────────────────
  {
    id: 'empty',
    name: 'Empty Board',
    emoji: '🟫',
    subtitle: 'Blank slate — no terrain',
    description: 'Clears everything and leaves you with a clean board to build from scratch.',
    terrain: () => [],
  },

  // ── 2. Hammer & Anvil ───────────────────────────────────────────────────────
  {
    id: 'hammer_anvil',
    name: 'Hammer & Anvil',
    emoji: '⚒️',
    subtitle: 'Standard 40K deployment',
    description: 'Classic long-edge deployment with central ruins providing cover and line-of-sight blockers on both flanks.',
    terrain: () => [
      // Centre ruin cluster
      cr(450, 308, 90, 70),
      cr(450, 308, 30, 30, ['decorative'], '#44403c'),
      // Left flank cover
      cr(180, 220, 100, 40),
      cr(160, 420, 40, 120),
      // Right flank cover
      cr(720, 220, 100, 40),
      cr(740, 420, 40, 120),
      // Mid-field scatter
      cr(300, 360, 60, 40),
      cr(600, 360, 60, 40),
    ],
  },

  // ── 3. Search & Destroy ─────────────────────────────────────────────────────
  {
    id: 'search_destroy',
    name: 'Search & Destroy',
    emoji: '🎯',
    subtitle: 'Corner deployment',
    description: 'Diagonal deployment with dense mid-board terrain creating choke points and ambush opportunities.',
    terrain: () => [
      // Central large ruin
      cr(450, 308, 120, 80),
      // Forward bastions
      cr(250, 200, 80, 50),
      cr(650, 420, 80, 50),
      // Scatter terrain
      cr(350, 420, 50, 38),
      cr(550, 200, 50, 38),
      cr(180, 340, 38, 80),
      cr(720, 280, 38, 80),
    ],
  },

  // ── 4. Sweeping Engagement ──────────────────────────────────────────────────
  {
    id: 'sweeping',
    name: 'Sweeping Engagement',
    emoji: '🌊',
    subtitle: 'Short-edge deployment',
    description: 'Short-edge deployment with terrain walls that funnel armies into a central killing ground.',
    terrain: () => [
      // Long walls left of centre
      t('line', [130, 180, 130, 440], ['blocks_los'], '#44403c'),
      t('line', [200, 200, 200, 420], ['obscuring'], '#1e3a5f'),
      // Long walls right of centre
      t('line', [770, 180, 770, 440], ['blocks_los'], '#44403c'),
      t('line', [700, 200, 700, 420], ['obscuring'], '#1e3a5f'),
      // Mid-field objectives cover
      cr(450, 210, 70, 45),
      cr(450, 408, 70, 45),
      cr(320, 308, 55, 55),
      cr(580, 308, 55, 55),
    ],
  },

  // ── 5. Dawn of War ──────────────────────────────────────────────────────────
  {
    id: 'dawn_of_war',
    name: 'Dawn of War',
    emoji: '🌄',
    subtitle: 'Classic objective grab',
    description: 'Troops begin on the board. Wide deployment zone with terrain spread evenly to reward movement.',
    terrain: () => [
      // Scattered ruins across the whole board
      cr(200, 155, 100, 55),
      cr(700, 155, 100, 55),
      cr(200, 460, 100, 55),
      cr(700, 460, 100, 55),
      cr(450, 308, 80, 60),
      // Mid flanks
      t('line', [340, 230, 400, 280], ['blocks_los']),
      t('line', [560, 230, 500, 280], ['blocks_los']),
      t('line', [340, 390, 400, 340], ['blocks_los']),
      t('line', [560, 390, 500, 340], ['blocks_los']),
    ],
  },

  // ── 6. Close Quarters ───────────────────────────────────────────────────────
  {
    id: 'close_quarters',
    name: 'Close Quarters',
    emoji: '🏙️',
    subtitle: 'Dense city-fight',
    description: 'High-density urban terrain with narrow corridors. Short sightlines reward melee armies.',
    terrain: () => [
      // Dense city blocks
      cr(170, 175, 120, 90),
      cr(450, 150, 90, 70),
      cr(730, 175, 120, 90),
      cr(170, 445, 120, 90),
      cr(450, 465, 90, 70),
      cr(730, 445, 120, 90),
      // Mid-board two big blockers
      cr(310, 308, 80, 130),
      cr(590, 308, 80, 130),
      // Corridors
      t('line', [380, 175, 380, 440], ['blocks_los'], '#44403c'),
      t('line', [520, 175, 520, 440], ['blocks_los'], '#44403c'),
    ],
  },
];
