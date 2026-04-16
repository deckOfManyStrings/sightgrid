import type { TerrainObject } from '../types';

// Geometry Utilities

/** Check if two line segments (p1-p2) and (p3-p4) intersect. Returns intersection point or null. */
export function segmentIntersect(
  p1x: number, p1y: number,
  p2x: number, p2y: number,
  p3x: number, p3y: number,
  p4x: number, p4y: number,
): { x: number; y: number; t: number } | null {
  const dx1 = p2x - p1x, dy1 = p2y - p1y;
  const dx2 = p4x - p3x, dy2 = p4y - p3y;
  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-10) return null;

  const dx3 = p3x - p1x, dy3 = p3y - p1y;
  const t = (dx3 * dy2 - dy3 * dx2) / denom;
  const u = (dx3 * dy1 - dy3 * dx1) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { x: p1x + t * dx1, y: p1y + t * dy1, t };
  }
  return null;
}

/** Extract edge segments from a terrain object */
export function terrainToSegments(t: TerrainObject): [number, number, number, number][] {
  const pts = t.points;
  const segs: [number, number, number, number][] = [];

  if (t.shape === 'line') {
    for (let i = 0; i < pts.length - 2; i += 2) {
      segs.push([pts[i], pts[i + 1], pts[i + 2], pts[i + 3]]);
    }
  } else {
    // polygon or rect - closed shape
    const count = pts.length / 2;
    for (let i = 0; i < count; i++) {
      const next = (i + 1) % count;
      segs.push([pts[i * 2], pts[i * 2 + 1], pts[next * 2], pts[next * 2 + 1]]);
    }
  }
  return segs;
}

/** Distance between two points */
export function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/** Snap a value to the nearest grid cell in pixels */
export function snapToGrid(value: number, pixelsPerInch: number, gridDivisor = 1): number {
  const cellPx = pixelsPerInch / gridDivisor;
  return Math.round(value / cellPx) * cellPx;
}

// Line of Sight

/**
 * Cast a single ray from (ox, oy) in direction (angle degrees) up to maxDist px,
 * checking against blocking terrain segments.
 * Returns the hit point (or the end of the ray if no hit).
 */
export function castRay(
  ox: number, oy: number,
  angleDeg: number,
  maxDist: number,
  blockers: TerrainObject[],
): { x: number; y: number; blocked: boolean } {
  const rad = (angleDeg * Math.PI) / 180;
  const ex = ox + Math.cos(rad) * maxDist;
  const ey = oy + Math.sin(rad) * maxDist;

  let closestT = Infinity;
  let closestX = ex;
  let closestY = ey;
  let blocked = false;

  for (const t of blockers) {
    if (!t.tags.includes('blocks_los')) continue;
    const segs = terrainToSegments(t);
    for (const [sx1, sy1, sx2, sy2] of segs) {
      const hit = segmentIntersect(ox, oy, ex, ey, sx1, sy1, sx2, sy2);
      if (hit && hit.t < closestT) {
        closestT = hit.t;
        closestX = hit.x;
        closestY = hit.y;
        blocked = true;
      }
    }
  }

  return { x: closestX, y: closestY, blocked };
}

/**
 * Build a LoS polygon (array of flat [x,y,...]) for a unit at (cx,cy)
 * with a given range in pixels, blocked by terrain.
 */
export function buildLosPolygon(
  cx: number, cy: number,
  rangeInches: number,
  pixelsPerInch: number,
  blockers: TerrainObject[],
  rayCount = 360,
): number[] {
  const maxDist = rangeInches > 0 ? rangeInches * pixelsPerInch : 5000;
  const polygon: number[] = [];

  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * 360;
    const hit = castRay(cx, cy, angle, maxDist, blockers);
    polygon.push(hit.x, hit.y);
  }

  return polygon;
}

/**
 * Check if a point (px, py) is inside a polygon defined by flat [x,y,...] array.
 * Uses ray casting algorithm.
 */
export function pointInPolygon(px: number, py: number, polygon: number[]): boolean {
  const n = polygon.length / 2;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i * 2], yi = polygon[i * 2 + 1];
    const xj = polygon[j * 2], yj = polygon[j * 2 + 1];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Min distance from a circle center to a line segment (edge-to-edge approximation) */
export function circleToSegmentDist(
  cx: number, cy: number, r: number,
  x1: number, y1: number, x2: number, y2: number,
): number {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const nearX = x1 + t * dx, nearY = y1 + t * dy;
  return dist(cx, cy, nearX, nearY) - r;
}
