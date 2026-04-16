import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Rect, Circle, Ellipse, Arrow, Text, Group } from 'react-konva';
import Konva from 'konva';
import { useStore, getPixelsPerInch, mmToPx as mmToPxUtil, pxToInches as pxToInchesUtil } from '../store';
import type { TerrainObject, UnitToken } from '../types';
import { buildLosPolygon, dist, pointInPolygon } from '../utils/geometry';
import { v4 as uuidv4 } from 'uuid';

// ─── Grid Layer ──────────────────────────────────────────────────────────────
function GridLayer() {
  const canvasWidth = useStore(s => s.canvasWidth);
  const board = useStore(s => s.board);
  const gridVisible = useStore(s => s.layers.grid);

  if (!gridVisible) return null;
  const ppi = getPixelsPerInch(canvasWidth, board.widthInches);
  const boardHeightPx = (board.heightInches / board.widthInches) * canvasWidth;
  const op = board.gridOpacity ?? 0.3;
  const lines: React.ReactElement[] = [];

  for (let x = 0; x <= canvasWidth; x += ppi) {
    const isMajor = Math.round(x / ppi) % 6 === 0;
    lines.push(
      <Line key={`vx${x}`} points={[x, 0, x, boardHeightPx]}
        stroke={isMajor ? `rgba(99,102,241,${Math.min(op * 1.4, 1)})` : `rgba(99,102,241,${op * 0.5})`}
        strokeWidth={isMajor ? 1.5 : 0.5} listening={false} />,
    );
    if (isMajor && x > 0) {
      lines.push(
        <Text key={`vt${x}`} x={x + 2} y={2} text={`${Math.round(x / ppi)}"`}
          fontSize={9} fill={`rgba(165,180,252,${Math.min(op * 2, 1)})`} listening={false} />,
      );
    }
  }
  for (let y = 0; y <= boardHeightPx; y += ppi) {
    const isMajor = Math.round(y / ppi) % 6 === 0;
    lines.push(
      <Line key={`hy${y}`} points={[0, y, canvasWidth, y]}
        stroke={isMajor ? `rgba(99,102,241,${Math.min(op * 1.4, 1)})` : `rgba(99,102,241,${op * 0.5})`}
        strokeWidth={isMajor ? 1.5 : 0.5} listening={false} />,
    );
    if (isMajor && y > 0) {
      lines.push(
        <Text key={`ht${y}`} x={2} y={y + 2} text={`${Math.round(y / ppi)}"`}
          fontSize={9} fill={`rgba(165,180,252,${Math.min(op * 2, 1)})`} listening={false} />,
      );
    }
  }
  return <Layer listening={false}>{lines}</Layer>;
}

// ─── Terrain Layer ────────────────────────────────────────────────────────────
function TerrainLayer() {
  const terrain = useStore(s => s.terrain);
  const terrainVisible = useStore(s => s.layers.terrain);
  const selectedIds = useStore(s => s.selectedIds);
  const activeTool = useStore(s => s.activeTool);
  const updateTerrain = useStore(s => s.updateTerrain);
  const setSelectedIds = useStore(s => s.setSelectedIds);

  if (!terrainVisible) return null;

  const tagColor = (t: TerrainObject) => {
    if (t.tags.includes('blocks_los')) return t.color || '#6b7280';
    if (t.tags.includes('obscuring')) return '#b45309';
    if (t.tags.includes('difficult')) return '#065f46';
    return '#374151';
  };

  return (
    <Layer>
      {terrain.map((t) => {
        const isSelected = selectedIds.includes(t.id);
        const color = tagColor(t);
        const commonProps = {
          opacity: t.opacity,
          stroke: isSelected ? '#a5f3fc' : color,
          strokeWidth: isSelected ? 2.5 : 1.5,
          dash: t.tags.includes('decorative') ? [6, 3] : undefined,
          onClick: () => {
            if (activeTool === 'select') setSelectedIds([t.id]);
          },
          draggable: activeTool === 'select' && !t.locked,
          onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
            const dx = e.target.x(), dy = e.target.y();
            updateTerrain(t.id, {
              points: t.points.map((v, i) => i % 2 === 0 ? v + dx : v + dy),
            });
            e.target.x(0);
            e.target.y(0);
          },
        };

        if (t.shape === 'line') {
          return (
            <Line key={t.id} {...commonProps}
              points={t.points}
              fill={undefined}
              stroke={isSelected ? '#a5f3fc' : color}
              strokeWidth={6}
              lineCap="round"
            />
          );
        }

        return (
          <Line key={t.id} {...commonProps}
            points={t.points}
            closed={true}
            fill={color + '40'}
          />
        );
      })}
    </Layer>
  );
}

// ─── LoS Layer ────────────────────────────────────────────────────────────────
function LosLayer() {
  const units = useStore(s => s.units);
  const terrain = useStore(s => s.terrain);
  const losVisible = useStore(s => s.layers.los);
  const selectedIds = useStore(s => s.selectedIds);
  const canvasWidth = useStore(s => s.canvasWidth);
  const board = useStore(s => s.board);

  if (!losVisible) return null;

  const ppi = getPixelsPerInch(canvasWidth, board.widthInches);
  const boardHeightPx = (board.heightInches / board.widthInches) * canvasWidth;
  const losUnits = units.filter(u => u.losEnabled && selectedIds.includes(u.id));
  if (losUnits.length === 0) return null;

  const blockers = terrain.filter(t => t.tags.includes('blocks_los'));

  return (
    <Layer
      clipX={0} clipY={0}
      clipWidth={canvasWidth} clipHeight={boardHeightPx}
    >
      {losUnits.map(u => {
        const poly = buildLosPolygon(u.x, u.y, u.rangeInches, ppi, blockers, 360);
        return (
          <Group key={`los-${u.id}`}>
            {/* LoS visibility area */}
            <Line
              points={poly}
              closed
              fill="rgba(251,191,36,0.12)"
              stroke="rgba(251,191,36,0.5)"
              strokeWidth={1}
            />
            {/* Range circle */}
            {u.rangeInches > 0 && (
              <Circle
                x={u.x} y={u.y}
                radius={u.rangeInches * ppi}
                stroke="rgba(251,191,36,0.4)"
                strokeWidth={1.5}
                dash={[6, 4]}
              />
            )}
            {/* Range label */}
            {u.rangeInches > 0 && (
              <Text
                x={u.x + u.rangeInches * ppi + 4}
                y={u.y - 8}
                text={`${u.rangeInches}"`}
                fontSize={11}
                fill="rgba(251,191,36,0.9)"
              />
            )}
            {/* Highlight visible non-selected units */}
            {units
              .filter(other => other.id !== u.id && !selectedIds.includes(other.id))
              .map(other => {
                const inLos = pointInPolygon(other.x, other.y, poly);
                if (!inLos) return null;
                const r = mmToPxUtil(other.baseWidthMm, ppi) * 0.5 * 1.3;
                return (
                  <Circle key={`vis-${other.id}`}
                    x={other.x} y={other.y}
                    radius={r}
                    stroke="#22c55e" strokeWidth={2.5}
                    fill="rgba(34,197,94,0.08)"
                    dash={[4, 3]}
                  />
                );
              })
            }
          </Group>
        );
      })}
    </Layer>
  );
}

// ─── Unit Layer ───────────────────────────────────────────────────────────────
interface DragInfo {
  unitId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface UnitLayerProps { onUnitMouseDown: () => void; }

function UnitLayer({ onUnitMouseDown }: UnitLayerProps) {
  const units = useStore(s => s.units);
  const unitsVisible = useStore(s => s.layers.units);
  const selectedIds = useStore(s => s.selectedIds);
  const activeTool = useStore(s => s.activeTool);
  const canvasWidth = useStore(s => s.canvasWidth);
  const board = useStore(s => s.board);
  const updateUnit = useStore(s => s.updateUnit);
  const toggleSelection = useStore(s => s.toggleSelection);
  const setSelectedIds = useStore(s => s.setSelectedIds);
  const pushHistory = useStore(s => s.pushHistory);

  const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);

  if (!unitsVisible) return null;

  const ppi = getPixelsPerInch(canvasWidth, board.widthInches);

  const handleDragStart = (u: UnitToken) => {
    // Use getState() so we always read the latest selectedIds, not a stale closure
    const { selectedIds: ids, units: currentUnits } = useStore.getState();
    const map = new Map<string, { x: number; y: number }>();
    const groupIds = ids.includes(u.id) ? ids : [u.id];
    currentUnits.forEach(unit => {
      if (groupIds.includes(unit.id)) {
        map.set(unit.id, { x: unit.x, y: unit.y });
      }
    });
    dragStartPositions.current = map;
    setDragInfo({ unitId: u.id, startX: u.x, startY: u.y, currentX: u.x, currentY: u.y });
  };

  const handleDragMove = (u: UnitToken, e: Konva.KonvaEventObject<DragEvent>) => {
    const cx = e.target.x();
    const cy = e.target.y();

    // Update the distance label
    setDragInfo(prev => prev ? { ...prev, currentX: cx, currentY: cy } : null);

    // Move ALL other selected units live so the whole group moves together
    const { selectedIds: ids, updateUnit: upd } = useStore.getState();
    if (ids.includes(u.id) && ids.length > 1) {
      const startPos = dragStartPositions.current.get(u.id);
      if (startPos) {
        const dx = cx - startPos.x;
        const dy = cy - startPos.y;
        ids.forEach(id => {
          if (id === u.id) return; // dragged unit is handled by Konva
          const start = dragStartPositions.current.get(id);
          if (start) upd(id, { x: start.x + dx, y: start.y + dy });
        });
      }
    }
  };

  const handleDragEnd = (u: UnitToken, e: Konva.KonvaEventObject<DragEvent>) => {
    const newX = e.target.x();
    const newY = e.target.y();
    const { pushHistory: ph, updateUnit: upd } = useStore.getState();
    // Commit the primary unit's final position FIRST so pushHistory captures
    // the complete post-drag state (all units at new positions).
    // Previously ph() ran before upd(), leaving the primary at its old store
    // position in the snapshot → redo would snap it back to the wrong spot.
    upd(u.id, { x: newX, y: newY });
    ph();
    setDragInfo(null);
  };

  return (
    <Layer>
      {units.map((u) => {
        const isSelected = selectedIds.includes(u.id);
        const rW = mmToPxUtil(u.baseWidthMm, ppi) * 0.5;
        const rH = mmToPxUtil(u.baseHeightMm, ppi) * 0.5;
        const draggable = activeTool === 'select' && !u.locked;
        const isRound = u.baseShape === 'round';
        const arrowLen = Math.max(rW, rH) + 12;
        const arrowRad = (u.rotation * Math.PI) / 180;

        const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
          if (activeTool !== 'select') return;
          e.cancelBubble = true;
          if (e.evt.shiftKey) {
            toggleSelection(u.id);
          } else if (!selectedIds.includes(u.id)) {
            // Only switch selection when clicking a unit NOT already in the group.
            // Clicking a unit that IS selected keeps the current selection intact.
            setSelectedIds([u.id]);
          }
        };

        return (
          <Group
            key={u.id}
            x={u.x} y={u.y}
            draggable={draggable}
            onMouseDown={() => { if (activeTool === 'select') onUnitMouseDown(); }}
            onDragStart={() => handleDragStart(u)}
            onDragMove={(e) => handleDragMove(u, e)}
            onDragEnd={(e) => handleDragEnd(u, e)}
            onClick={handleClick}
          >
            {/* Selection ring */}
            {isSelected && (
              isRound
                ? <Circle radius={rW + 4} fill="rgba(165,243,252,0.15)" stroke="#a5f3fc" strokeWidth={2} />
                : <Ellipse radiusX={rW + 4} radiusY={rH + 4} fill="rgba(165,243,252,0.15)" stroke="#a5f3fc" strokeWidth={2} />
            )}

            {/* Base body */}
            {isRound
              ? <Circle radius={rW} fill={u.color} stroke={u.color} strokeWidth={1.5} />
              : <Ellipse radiusX={rW} radiusY={rH} fill={u.color} stroke={u.color} strokeWidth={1.5} />
            }

            {/* Facing arrow */}
            {u.facingArrow && (
              <Arrow
                points={[0, 0, Math.cos(arrowRad) * arrowLen, Math.sin(arrowRad) * arrowLen]}
                pointerLength={7} pointerWidth={6}
                fill="rgba(255,255,255,0.8)" stroke="rgba(255,255,255,0.8)"
                strokeWidth={2}
              />
            )}

            {/* Label */}
            {u.labelVisible && u.name && (
              <Text
                text={u.name}
                fontSize={Math.max(8, Math.min(12, rW * 0.7))}
                fill="white"
                align="center"
                width={rW * 2.5}
                x={-rW * 1.25}
                y={rH + 4}
              />
            )}
          </Group>
        );
      })}

      {/* ── Movement distance overlay: shows while dragging ── */}
      {dragInfo && (() => {
        const dx = dragInfo.currentX - dragInfo.startX;
        const dy = dragInfo.currentY - dragInfo.startY;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        if (distPx < 2) return null;
        const distIn = pxToInchesUtil(distPx, ppi);
        const mx = (dragInfo.startX + dragInfo.currentX) / 2;
        const my = (dragInfo.startY + dragInfo.currentY) / 2 - 18;
        const label = `${distIn.toFixed(2)}"`;
        const labelW = label.length * 7 + 14;
        return (
          <Group key="movement-overlay" listening={false}>
            <Circle
              x={dragInfo.startX} y={dragInfo.startY}
              radius={8} fill="rgba(74,222,128,0.15)" stroke="#4ade80" strokeWidth={1.5}
              dash={[4, 3]}
            />
            <Line
              points={[dragInfo.startX, dragInfo.startY, dragInfo.currentX, dragInfo.currentY]}
              stroke="#4ade80" strokeWidth={2} dash={[8, 5]}
            />
            <Rect
              x={mx - labelW / 2} y={my - 10}
              width={labelW} height={20}
              fill="rgba(10,15,26,0.9)" cornerRadius={6}
              stroke="#4ade80" strokeWidth={1.5}
            />
            <Text
              x={mx - labelW / 2 + 6} y={my - 5}
              text={label}
              fontSize={12} fill="#4ade80" fontStyle="bold"
            />
          </Group>
        );
      })()}
    </Layer>
  );
}

// ─── Measurement Layer (Ruler) ────────────────────────────────────────────────
function MeasurementLayer() {
  const ruler = useStore(s => s.ruler);
  const measureVisible = useStore(s => s.layers.measurement);
  const canvasWidth = useStore(s => s.canvasWidth);
  const board = useStore(s => s.board);

  if (!measureVisible || !ruler.active) return null;
  const ppi = getPixelsPerInch(canvasWidth, board.widthInches);
  const d = dist(ruler.startX, ruler.startY, ruler.endX, ruler.endY);
  const inches = pxToInchesUtil(d, ppi).toFixed(2);
  const mx = (ruler.startX + ruler.endX) / 2;
  const my = (ruler.startY + ruler.endY) / 2;

  return (
    <Layer>
      <Line
        points={[ruler.startX, ruler.startY, ruler.endX, ruler.endY]}
        stroke="#f43f5e" strokeWidth={2} dash={[8, 4]}
      />
      <Circle x={ruler.startX} y={ruler.startY} radius={5} fill="#f43f5e" />
      <Circle x={ruler.endX} y={ruler.endY} radius={5} fill="#f43f5e" />
      <Rect x={mx - 32} y={my - 12} width={64} height={20}
        fill="rgba(17,24,39,0.85)" cornerRadius={4} />
      <Text x={mx - 28} y={my - 7} text={`${inches}"`}
        fontSize={12} fill="#f43f5e" fontStyle="bold" />
    </Layer>
  );
}

// ─── Map Image Layer ──────────────────────────────────────────────────────────
function MapImageLayer() {
  const board = useStore(s => s.board);
  const setBoard = useStore(s => s.setBoard);
  const canvasWidth = useStore(s => s.canvasWidth);
  const mapVisible = useStore(s => s.layers.map);
  const activeTool = useStore(s => s.activeTool);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!board.mapImageUrl) { setImg(null); return; }
    const i = new window.Image();
    i.src = board.mapImageUrl;
    i.onload = () => setImg(i);
  }, [board.mapImageUrl]);

  if (!mapVisible || !img) return null;
  const boardHeightPx = (board.heightInches / board.widthInches) * canvasWidth;
  const isAdjusting = activeTool === 'map_adjust';
  const mapW = canvasWidth * (board.mapScaleX ?? 1);
  const mapH = boardHeightPx * (board.mapScaleY ?? 1);

  return (
    <Layer>
      <KonvaImage
        image={img}
        x={board.mapX ?? 0}
        y={board.mapY ?? 0}
        width={mapW}
        height={mapH}
        draggable={isAdjusting}
        onDragEnd={(e) => {
          setBoard({ mapX: e.target.x(), mapY: e.target.y() });
        }}
      />
    </Layer>
  );
}

// ─── Draw State ───────────────────────────────────────────────────────────────
interface DrawState {
  drawing: boolean;
  points: number[];
  previewPoint: { x: number; y: number };
}
interface SelBox { x: number; y: number; w: number; h: number; visible: boolean; }

// ─── Main Board Canvas ────────────────────────────────────────────────────────
export function BoardCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const selBoxStart = useRef<{ x: number; y: number } | null>(null);
  // WASD pan state
  const wasdKeys = useRef<Set<string>>(new Set());
  const rafId = useRef<number | null>(null);
  const isPolyDrawing = useRef(false);
  // Tracks whether the mouse is held down on a unit (enables scroll-to-rotate)
  const unitHeldRef = useRef(false);

  const activeTool = useStore(s => s.activeTool);
  const canvasWidth = useStore(s => s.canvasWidth);
  const board = useStore(s => s.board);
  const units = useStore(s => s.units);
  const setCanvasDimensions = useStore(s => s.setCanvasDimensions);
  const stageX = useStore(s => s.stageX);
  const stageY = useStore(s => s.stageY);
  const stageScale = useStore(s => s.stageScale);
  const setViewport = useStore(s => s.setViewport);
  const ruler = useStore(s => s.ruler);
  const setRuler = useStore(s => s.setRuler);
  const addUnit = useStore(s => s.addUnit);
  const addUnitsBatch = useStore(s => s.addUnitsBatch);
  const addTerrain = useStore(s => s.addTerrain);
  const setSelectedIds = useStore(s => s.setSelectedIds);
  const toggleSelection = useStore(s => s.toggleSelection);
  const clearSelection = useStore(s => s.clearSelection);
  const unitTemplate = useStore(s => s.unitTemplate);
  const snapEnabled = useStore(s => s.snapEnabled);

  const [drawState, setDrawState] = useState<DrawState>({
    drawing: false, points: [], previewPoint: { x: 0, y: 0 },
  });
  const [selBox, setSelBox] = useState<SelBox>({ x: 0, y: 0, w: 0, h: 0, visible: false });

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setCanvasDimensions(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);
    setCanvasDimensions(el.clientWidth, el.clientHeight);
    return () => ro.disconnect();
  }, [setCanvasDimensions]);

  // WASD smooth pan
  useEffect(() => {
    const PAN_SPEED = 8; // px per frame at 100% zoom

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(k)) {
        e.preventDefault();
        wasdKeys.current.add(k);
        if (rafId.current === null) startLoop();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      wasdKeys.current.delete(e.key.toLowerCase());
      if (wasdKeys.current.size === 0 && rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };

    const startLoop = () => {
      const loop = () => {
        const keys = wasdKeys.current;
        if (keys.size === 0) { rafId.current = null; return; }
        const { stageX: sx, stageY: sy, stageScale: sc, setViewport: sv } = useStore.getState();
        let dx = 0, dy = 0;
        if (keys.has('a')) dx += PAN_SPEED;
        if (keys.has('d')) dx -= PAN_SPEED;
        if (keys.has('w')) dy += PAN_SPEED;
        if (keys.has('s')) dy -= PAN_SPEED;
        sv(sx + dx, sy + dy, sc);
        rafId.current = requestAnimationFrame(loop);
      };
      rafId.current = requestAnimationFrame(loop);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const ppi = getPixelsPerInch(canvasWidth, board.widthInches);

  const snapVal = useCallback((v: number) => {
    if (!snapEnabled) return v;
    return Math.round(v / ppi) * ppi;
  }, [snapEnabled, ppi]);

  const getRelPos = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return {
      x: snapVal((pos.x - stageX) / stageScale),
      y: snapVal((pos.y - stageY) / stageScale),
    };
  }, [stageX, stageY, stageScale, snapVal]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = getRelPos(e);
    const isStage = e.target === e.target.getStage();

    // Map adjust — let the KonvaImage drag handle it, do nothing here
    if (activeTool === 'map_adjust') return;

    // Ruler
    if (activeTool === 'ruler') {
      setRuler({ active: true, startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
      return;
    }

    // Place unit
    if (activeTool === 'place_unit') {
      const bs = unitTemplate.baseSize;
      const count = unitTemplate.placementCount ?? 1;
      const PER_ROW = 5;
      const gap = 2; // px between bases

      if (count === 1) {
        addUnit({
          id: uuidv4(),
          name: unitTemplate.name,
          unitType: unitTemplate.unitType,
          baseShape: bs.shape,
          baseWidthMm: bs.widthMm,
          baseHeightMm: bs.heightMm,
          x: pos.x, y: pos.y,
          rotation: 0,
          color: unitTemplate.color,
          labelVisible: true,
          facingArrow: false,
          losEnabled: false,
          rangeInches: 24,
          locked: false,
        });
      } else {
        // Build a formation centered on the click point
        const w = mmToPxUtil(bs.widthMm, ppi);
        const h = mmToPxUtil(bs.heightMm, ppi);
        const cols = Math.min(count, PER_ROW);
        const rows = Math.ceil(count / PER_ROW);
        const totalW = cols * w + (cols - 1) * gap;
        const totalH = rows * h + (rows - 1) * gap;
        const startX = pos.x - totalW / 2;
        const startY = pos.y - totalH / 2;
        const newUnits = Array.from({ length: count }, (_, i) => ({
          id: uuidv4(),
          name: unitTemplate.name,
          unitType: unitTemplate.unitType,
          baseShape: bs.shape,
          baseWidthMm: bs.widthMm,
          baseHeightMm: bs.heightMm,
          x: startX + (i % PER_ROW) * (w + gap) + w / 2,
          y: startY + Math.floor(i / PER_ROW) * (h + gap) + h / 2,
          rotation: 0,
          color: unitTemplate.color,
          labelVisible: true,
          facingArrow: false,
          losEnabled: false,
          rangeInches: 24,
          locked: false,
        }));
        addUnitsBatch(newUnits);
      }
      return;
    }

    // Terrain rect start
    if (activeTool === 'terrain_rect') {
      setDrawState({ drawing: true, points: [pos.x, pos.y], previewPoint: pos });
      return;
    }

    // Terrain line start
    if (activeTool === 'terrain_line') {
      if (!drawState.drawing) {
        setDrawState({ drawing: true, points: [pos.x, pos.y], previewPoint: pos });
      } else {
        // Add another point (single-click finalization)
        const newPoints = [...drawState.points, pos.x, pos.y];
        addTerrain({
          id: uuidv4(), shape: 'line', points: newPoints,
          tags: ['blocks_los'], color: '#6b7280', opacity: 0.9, locked: false,
        });
        setDrawState({ drawing: false, points: [], previewPoint: { x: 0, y: 0 } });
      }
      return;
    }

    // Terrain polygon
    if (activeTool === 'terrain_polygon') {
      if (!isPolyDrawing.current) {
        isPolyDrawing.current = true;
        setDrawState({ drawing: true, points: [pos.x, pos.y], previewPoint: pos });
      } else {
        setDrawState(prev => ({ ...prev, points: [...prev.points, pos.x, pos.y], previewPoint: pos }));
      }
      return;
    }

    // Selection box start — clear selection whenever we click anything that is NOT a unit.
    // unitHeldRef is set true by the unit Group's onMouseDown BEFORE this Stage handler fires
    // (Konva bubbles child → parent → stage), so it reliably tells us if a unit was hit.
    if (activeTool === 'select' && !e.evt.shiftKey) {
      if (!unitHeldRef.current) {
        selBoxStart.current = pos;
        clearSelection();
      }
    }
  }, [activeTool, stageX, stageY, unitTemplate, addUnit, addUnitsBatch, addTerrain, drawState, setRuler, clearSelection, getRelPos]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = getRelPos(e);

    // Ruler
    if (activeTool === 'ruler' && ruler.active) {
      setRuler({ endX: pos.x, endY: pos.y });
      return;
    }

    // Terrain rect preview
    if (activeTool === 'terrain_rect' && drawState.drawing) {
      const [sx, sy] = drawState.points;
      const pts = [sx, sy, pos.x, sy, pos.x, pos.y, sx, pos.y];
      setDrawState(prev => ({ ...prev, points: pts, previewPoint: pos }));
      return;
    }

    // Terrain line/polygon preview
    if ((activeTool === 'terrain_line' || activeTool === 'terrain_polygon') && drawState.drawing) {
      setDrawState(prev => ({ ...prev, previewPoint: pos }));
    }

    // Selection box
    if (selBoxStart.current) {
      const sx = selBoxStart.current.x;
      const sy = selBoxStart.current.y;
      setSelBox({
        x: Math.min(sx, pos.x), y: Math.min(sy, pos.y),
        w: Math.abs(pos.x - sx), h: Math.abs(pos.y - sy), visible: true,
      });
    }
  }, [activeTool, drawState, ruler, getRelPos, setRuler, stageScale, setViewport]);

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = getRelPos(e);

    // Ruler — clear on mouse up (hold-to-measure)
    if (activeTool === 'ruler' && ruler.active) {
      setRuler({ active: false });
      return;
    }

    // Terrain rect finalize
    if (activeTool === 'terrain_rect' && drawState.drawing) {
      const startX = drawState.points[0];
      const startY = drawState.points[1];
      const pts = [startX, startY, pos.x, startY, pos.x, pos.y, startX, pos.y];
      if (Math.abs(pos.x - startX) > 5 && Math.abs(pos.y - startY) > 5) {
        addTerrain({
          id: uuidv4(), shape: 'rect', points: pts,
          tags: ['blocks_los'], color: '#6b7280', opacity: 0.85, locked: false,
        });
      }
      setDrawState({ drawing: false, points: [], previewPoint: { x: 0, y: 0 } });
      return;
    }

    // Selection box 
    if (selBoxStart.current && activeTool === 'select') {
      const { x, y, w, h } = selBox;
      if (w > 5 || h > 5) {
        const inBox = units
          .filter(u => u.x >= x && u.x <= x + w && u.y >= y && u.y <= y + h)
          .map(u => u.id);
        if (e.evt.shiftKey) {
          inBox.forEach(id => toggleSelection(id));
        } else {
          setSelectedIds(inBox);
        }
      }
      selBoxStart.current = null;
      setSelBox(prev => ({ ...prev, visible: false }));
    }
  }, [activeTool, drawState, ruler, selBox, units, getRelPos, setRuler, addTerrain, setSelectedIds, toggleSelection]);

  const handleDblClick = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'terrain_polygon' && drawState.drawing && drawState.points.length >= 6) {
      addTerrain({
        id: uuidv4(), shape: 'polygon', points: drawState.points,
        tags: ['blocks_los'], color: '#6b7280', opacity: 0.85, locked: false,
      });
      setDrawState({ drawing: false, points: [], previewPoint: { x: 0, y: 0 } });
      isPolyDrawing.current = false;
    }
  }, [activeTool, drawState, addTerrain]);

  // Release unit-hold on global mouseup
  useEffect(() => {
    const onUp = () => { unitHeldRef.current = false; };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    // Scroll-to-rotate: when holding mouse on a unit, wheel rotates selected units
    if (unitHeldRef.current) {
      const { selectedIds: ids, units: currentUnits, updateUnit: upd } = useStore.getState();
      if (ids.length > 0) {
        const ROTATE_STEP = 5; // degrees per scroll tick
        const delta = e.evt.deltaY > 0 ? ROTATE_STEP : -ROTATE_STEP;
        ids.forEach(id => {
          const unit = currentUnits.find(u => u.id === id);
          if (unit) upd(id, { rotation: (unit.rotation + delta + 360) % 360 });
        });
        return; // don't zoom
      }
    }

    // Normal zoom
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.08;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const newScale = e.evt.deltaY < 0
      ? Math.min(oldScale * scaleBy, 8)
      : Math.max(oldScale / scaleBy, 0.2);
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setViewport(newPos.x, newPos.y, newScale);
  }, [setViewport]);

  const boardHeightPx = (board.heightInches / board.widthInches) * canvasWidth;
  const stageWidth = containerRef.current?.clientWidth || 900;
  const stageHeight = containerRef.current?.clientHeight || 700;

  return (
    <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#0f172a', cursor: getCursor(activeTool) }}>
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        x={stageX} y={stageY} scaleX={stageScale} scaleY={stageScale}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDblClick={handleDblClick}
        onWheel={handleWheel}
      >
        {/* Board background */}
        <Layer>
          <Rect x={0} y={0} width={canvasWidth} height={boardHeightPx}
            fill="#1e293b" stroke="rgba(99,102,241,0.6)" strokeWidth={2} />
        </Layer>

        <MapImageLayer />
        <GridLayer />
        <TerrainLayer />
        <LosLayer />
        <UnitLayer onUnitMouseDown={() => { unitHeldRef.current = true; }} />

        {/* Drawing preview */}
        {drawState.drawing && (
          <Layer>
            {activeTool === 'terrain_rect' && drawState.points.length >= 8 && (
              <Line
                points={drawState.points} closed
                fill="rgba(107,114,128,0.3)" stroke="#a5f3fc"
                strokeWidth={1.5} dash={[5, 3]}
              />
            )}
            {activeTool === 'terrain_polygon' && drawState.points.length >= 2 && (
              <>
                <Line
                  points={[...drawState.points, drawState.previewPoint.x, drawState.previewPoint.y]}
                  closed={false}
                  stroke="#a5f3fc" strokeWidth={1.5} dash={[5, 3]}
                />
                {Array.from({ length: drawState.points.length / 2 }).map((_, i) => (
                  <Circle key={i}
                    x={drawState.points[i * 2]} y={drawState.points[i * 2 + 1]}
                    radius={4} fill="#a5f3fc"
                  />
                ))}
              </>
            )}
            {activeTool === 'terrain_line' && drawState.points.length >= 2 && (
              <Line
                points={[drawState.points[0], drawState.points[1], drawState.previewPoint.x, drawState.previewPoint.y]}
                stroke="#a5f3fc" strokeWidth={2} dash={[5, 3]}
              />
            )}
          </Layer>
        )}

        {/* Selection box */}
        {selBox.visible && (
          <Layer>
            <Rect
              x={selBox.x} y={selBox.y} width={selBox.w} height={selBox.h}
              fill="rgba(99,102,241,0.12)" stroke="#6366f1" strokeWidth={1} dash={[4, 3]}
            />
          </Layer>
        )}

        <MeasurementLayer />
      </Stage>



      {/* Coordinate display */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        fontSize: 10, color: '#334155', pointerEvents: 'none',
      }}>
        {Math.round(canvasWidth / ppi * 10) / 10}" × {Math.round((boardHeightPx / ppi) * 10) / 10}" board
      </div>
    </div>
  );
}

function getCursor(tool: string): string {
  switch (tool) {
    case 'select': return 'default';
    case 'map_adjust': return 'move';
    case 'place_unit': return 'crosshair';
    case 'terrain_line':
    case 'terrain_rect':
    case 'terrain_polygon': return 'crosshair';
    case 'ruler': return 'crosshair';
    default: return 'default';
  }
}
