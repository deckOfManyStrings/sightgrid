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
        stroke={isMajor ? `rgba(255,255,255,${Math.min(op * 1.4, 1)})` : `rgba(255,255,255,${op * 0.5})`}
        strokeWidth={isMajor ? 1.5 : 0.5} listening={false} />,
    );
    if (isMajor && x > 0) {
      lines.push(
        <Text key={`vt${x}`} x={x + 2} y={2} text={`${Math.round(x / ppi)}"`}
          fontSize={9} fill={`rgba(255,255,255,${Math.min(op * 2, 1)})`} listening={false} />,
      );
    }
  }
  for (let y = 0; y <= boardHeightPx; y += ppi) {
    const isMajor = Math.round(y / ppi) % 6 === 0;
    lines.push(
      <Line key={`hy${y}`} points={[0, y, canvasWidth, y]}
        stroke={isMajor ? `rgba(255,255,255,${Math.min(op * 1.4, 1)})` : `rgba(255,255,255,${op * 0.5})`}
        strokeWidth={isMajor ? 1.5 : 0.5} listening={false} />,
    );
    if (isMajor && y > 0) {
      lines.push(
        <Text key={`ht${y}`} x={2} y={y + 2} text={`${Math.round(y / ppi)}"`}
          fontSize={9} fill={`rgba(255,255,255,${Math.min(op * 2, 1)})`} listening={false} />,
      );
    }
  }
  return <Layer listening={false}>{lines}</Layer>;
}

// ─── Terrain Layer ────────────────────────────────────────────────────────────
interface TerrainLayerProps {
  onTerrainMouseDown: (id: string) => void;
}

function TerrainLayer({ onTerrainMouseDown }: TerrainLayerProps) {
  const terrain = useStore(s => s.terrain);
  const terrainVisible = useStore(s => s.layers.terrain);
  const selectedIds = useStore(s => s.selectedIds);
  const activeTool = useStore(s => s.activeTool);
  const updateTerrain = useStore(s => s.updateTerrain);
  const setSelectedIds = useStore(s => s.setSelectedIds);
  const toggleSelection = useStore(s => s.toggleSelection);
  const objectsVisible = useStore(s => s.objectsVisible);
  const objectsLocked = useStore(s => s.objectsLocked);

  if (!objectsVisible) return null;

  const tagColor = (t: TerrainObject) => {
    if (t.tags.includes('blocks_los')) return t.color || '#475569';
    if (t.tags.includes('obscuring')) return '#ea580c';
    if (t.tags.includes('difficult')) return '#16a34a';
    return '#334155';
  };

  return (
    <Layer>
      {terrain.map((t) => {
        const isSelected = selectedIds.includes(t.id);
        const color = tagColor(t);
        const commonProps = {
          opacity: t.opacity,
          onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (activeTool === 'select' && !objectsLocked) {
              e.cancelBubble = true;
              onTerrainMouseDown(t.id);
            }
          },
          onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (activeTool === 'select' && !objectsLocked) {
              e.cancelBubble = true;
              if (e.evt.shiftKey) {
                toggleSelection(t.id);
              } else {
                setSelectedIds([t.id]);
              }
            }
          },
          draggable: activeTool === 'select' && !t.locked && !objectsLocked,
          onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
            if (objectsLocked) return;
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
              strokeWidth={isSelected ? 6 : 4}
              dash={t.tags.includes('decorative') ? [8, 6] : undefined}
              lineCap="round"
              shadowColor="#000"
              shadowBlur={8}
              shadowOffset={{ x: 2, y: 3 }}
              shadowOpacity={0.6}
              hitStrokeWidth={15}
            />
          );
        }

        return (
          <Group key={t.id} {...commonProps}>
            <Line
              points={t.points}
              closed={true}
              fill={color + '70'} // 44% opacity to make it more distinct from grid
              stroke={isSelected ? '#a5f3fc' : color}
              strokeWidth={isSelected ? 3 : 2}
              dash={t.tags.includes('decorative') ? [8, 6] : undefined}
              shadowColor="#000"
              shadowBlur={12}
              shadowOffset={{ x: 3, y: 5 }}
              shadowOpacity={0.6}
            />
            {/* Inner highlight line to simulate a slight 3D bevelling effect */}
            <Line
              points={t.points}
              closed={true}
              fill={undefined}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
              offsetX={-1}
              offsetY={-1}
              listening={false}
            />
          </Group>
        );
      })}
    </Layer>
  );
}

// ─── Drawing Layer ─────────────────────────────────────────────────────────────
function DrawingLayer() {
  const drawings = useStore(s => s.drawings) || [];
  const objectsVisible = useStore(s => s.objectsVisible);
  const objectsLocked = useStore(s => s.objectsLocked);
  const selectedIds = useStore(s => s.selectedIds);
  const activeTool = useStore(s => s.activeTool);
  const updateDrawing = useStore(s => s.updateDrawing);
  const setSelectedIds = useStore(s => s.setSelectedIds);
  const deleteDrawings = useStore(s => s.deleteDrawings);

  if (!objectsVisible) return null;

  return (
    <Layer>
      {drawings.map((d) => {
        const isSelected = selectedIds.includes(d.id);

        const erase = () => {
          if (activeTool === 'eraser' && !objectsLocked) {
            deleteDrawings([d.id]);
          }
        };

        const handleDragErase = (e: any) => {
          if (e.evt?.buttons === 1 || e.type === 'touchmove') {
            erase();
          }
        };

        return (
          <Line
            key={d.id}
            points={d.points}
            stroke={isSelected ? '#a5f3fc' : d.color}
            strokeWidth={isSelected ? d.strokeWidth + 4 : d.strokeWidth}
            opacity={d.opacity}
            tension={0.1} // reduced from 0.5 for sharper handwriting
            lineCap="round"
            lineJoin="round"
            hitStrokeWidth={Math.max(15, d.strokeWidth + 5)}
            draggable={activeTool === 'select' && !objectsLocked}
            onPointerDown={erase}
            onPointerOver={handleDragErase}
            onTouchMove={handleDragErase}
            onClick={() => {
              if (activeTool === 'eraser') erase();
              if (activeTool === 'select' && !objectsLocked) setSelectedIds([d.id]);
            }}
            onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
              if (objectsLocked) return;
              const dx = e.target.x(), dy = e.target.y();
              updateDrawing(d.id, {
                points: d.points.map((v, i) => i % 2 === 0 ? v + dx : v + dy),
              });
              e.target.x(0);
              e.target.y(0);
            }}
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

// ─── Hover LoS Preview Layer ──────────────────────────────────────────────────
// Hover preview: 360 rays to match persistent toggle and avoid clipping through terrain.
// Suppressed when the unit already has the full persistent LoS toggle active.
function HoverLosLayer({ hoveredUnitId }: { hoveredUnitId: string | null }) {
  const units = useStore(s => s.units);
  const terrain = useStore(s => s.terrain);
  const canvasWidth = useStore(s => s.canvasWidth);
  const board = useStore(s => s.board);

  if (!hoveredUnitId) return null;

  const unit = units.find(u => u.id === hoveredUnitId);
  // Skip if no unit found, or if the persistent LoS toggle is already on
  if (!unit || unit.losEnabled) return null;

  const ppi = getPixelsPerInch(canvasWidth, board.widthInches);
  const boardHeightPx = (board.heightInches / board.widthInches) * canvasWidth;
  const blockers = terrain.filter(t => t.tags.includes('blocks_los'));

  // 360 rays (1° resolution) to accurately wrap around terrain corners
  const poly = buildLosPolygon(unit.x, unit.y, unit.rangeInches, ppi, blockers, 360);

  return (
    <Layer clipX={0} clipY={0} clipWidth={canvasWidth} clipHeight={boardHeightPx}>
      {/* Ghost LoS polygon — blue-purple preview tint */}
      <Line
        points={poly}
        closed
        fill="rgba(139,92,246,0.07)"
        stroke="rgba(139,92,246,0.45)"
        strokeWidth={1}
        dash={[5, 4]}
      />
      {/* Dashed range circle */}
      {unit.rangeInches > 0 && (
        <Circle
          x={unit.x} y={unit.y}
          radius={unit.rangeInches * ppi}
          stroke="rgba(139,92,246,0.5)"
          strokeWidth={1}
          dash={[4, 6]}
        />
      )}
      {/* Range label */}
      {unit.rangeInches > 0 && (
        <Text
          x={unit.x + unit.rangeInches * ppi + 4}
          y={unit.y - 8}
          text={`${unit.rangeInches}"`}
          fontSize={10}
          fill="rgba(167,139,250,0.85)"
        />
      )}
      {/* Highlight units visible from hovered unit */}
      {units
        .filter(other => other.id !== hoveredUnitId)
        .map(other => {
          if (!pointInPolygon(other.x, other.y, poly)) return null;
          const r = mmToPxUtil(other.baseWidthMm, ppi) * 0.5 * 1.3;
          return (
            <Circle key={`hlos-${other.id}`}
              x={other.x} y={other.y}
              radius={r}
              stroke="rgba(139,92,246,0.7)" strokeWidth={1.5}
              fill="rgba(139,92,246,0.08)"
              dash={[3, 3]}
            />
          );
        })
      }
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

interface UnitLayerProps {
  onUnitMouseDown: (id: string) => void;
  onUnitHover: (id: string | null) => void;
  onDragPrimaryChange: (id: string | null) => void;
  lastPrimaryPosRef: React.MutableRefObject<{ x: number; y: number } | null>;
}

function UnitLayer({ onUnitMouseDown, onUnitHover, onDragPrimaryChange, lastPrimaryPosRef }: UnitLayerProps) {
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
  const objectsVisible = useStore(s => s.objectsVisible);
  const objectsLocked = useStore(s => s.objectsLocked);

  const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const isDraggingRef = useRef(false); // suppresses hover during any drag
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);

  // Safety clear on global mouseup
  useEffect(() => {
    const onUp = () => { isDraggingRef.current = false; };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  if (!objectsVisible) return null;

  const ppi = getPixelsPerInch(canvasWidth, board.widthInches);

  const handleDragStart = (u: UnitToken) => {
    if (objectsLocked) return;
    isDraggingRef.current = true;
    lastPrimaryPosRef.current = { x: u.x, y: u.y };
    onDragPrimaryChange(u.id);
    onUnitHover(null);
    // Record start positions for distance label display
    const { selectedIds: ids, units: currentUnits } = useStore.getState();
    const map = new Map<string, { x: number; y: number }>();
    const groupIds = ids.includes(u.id) ? ids : [u.id];
    currentUnits.forEach(unit => {
      if (groupIds.includes(unit.id)) map.set(unit.id, { x: unit.x, y: unit.y });
    });
    dragStartPositions.current = map;
    setDragInfo({ unitId: u.id, startX: u.x, startY: u.y, currentX: u.x, currentY: u.y });
  };

  const handleDragMove = (u: UnitToken, e: Konva.KonvaEventObject<DragEvent>) => {
    const cx = e.target.x();
    const cy = e.target.y();

    // Incremental delta: movement since last frame applied to secondaries' CURRENT
    // store positions — preserves orbit changes that happened between drag events.
    const lastPos = lastPrimaryPosRef.current;
    lastPrimaryPosRef.current = { x: cx, y: cy };

    setDragInfo(prev => prev ? { ...prev, currentX: cx, currentY: cy } : null);

    if (lastPos) {
      const ddx = cx - lastPos.x;
      const ddy = cy - lastPos.y;
      const { selectedIds: ids, units: currentUnits, updateUnit: upd } = useStore.getState();
      if (ids.includes(u.id) && ids.length > 1) {
        ids.forEach(id => {
          if (id === u.id) return; // primary handled by Konva
          const cu = currentUnits.find(o => o.id === id);
          if (cu) upd(id, { x: cu.x + ddx, y: cu.y + ddy });
        });
      }
    }
  };

  const handleDragEnd = (u: UnitToken, e: Konva.KonvaEventObject<DragEvent>) => {
    const newX = e.target.x();
    const newY = e.target.y();
    const { pushHistory: ph, updateUnit: upd } = useStore.getState();
    upd(u.id, { x: newX, y: newY });
    ph();
    isDraggingRef.current = false;
    lastPrimaryPosRef.current = null;
    onDragPrimaryChange(null);
    setDragInfo(null);
    if (activeTool === 'select') onUnitHover(u.id);
  };

  return (
    <Layer>
      {units.map((u) => {
        const isSelected = selectedIds.includes(u.id);
        const rW = mmToPxUtil(u.baseWidthMm, ppi) * 0.5;
        const rH = mmToPxUtil(u.baseHeightMm, ppi) * 0.5;
        const draggable = activeTool === 'select' && !u.locked && !objectsLocked;
        const isRound = u.baseShape === 'round';
        const isRect = u.baseShape === 'rect';

        const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
          if (activeTool !== 'select' || objectsLocked) return;
          e.cancelBubble = true;
          if (e.evt.shiftKey) {
            toggleSelection(u.id);
          } else {
            // Isolate selection to this unit when explicitly clicked
            setSelectedIds([u.id]);
          }
        };

        return (
          <Group
            key={u.id}
            id={`unit-${u.id}`}
            x={u.x} y={u.y}
            rotation={u.rotation}
            draggable={draggable}
            onMouseEnter={() => { if (activeTool === 'select' && !isDraggingRef.current) onUnitHover(u.id); }}
            onMouseLeave={() => onUnitHover(null)}
            onMouseDown={() => { if (activeTool === 'select') onUnitMouseDown(u.id); }}
            onDragStart={() => handleDragStart(u)}
            onDragMove={(e) => handleDragMove(u, e)}
            onDragEnd={(e) => handleDragEnd(u, e)}
            onClick={handleClick}
          >
            {/* Selection ring — listening=false so it doesn't steal clicks from the background */}
            {isSelected && (
              isRound
                ? <Circle radius={rW + 4} fill="rgba(165,243,252,0.15)" stroke="#a5f3fc" strokeWidth={2} listening={false} />
                : isRect
                  ? <Rect x={-(rW + 4)} y={-(rH + 4)} width={(rW + 4) * 2} height={(rH + 4) * 2}
                      fill="rgba(165,243,252,0.15)" stroke="#a5f3fc" strokeWidth={2} cornerRadius={4} listening={false} />
                  : <Ellipse radiusX={rW + 4} radiusY={rH + 4} fill="rgba(165,243,252,0.15)" stroke="#a5f3fc" strokeWidth={2} listening={false} />
            )}

            {/* Base body */}
            {isRound
              ? <Circle radius={rW} fill={u.color} stroke={u.color} strokeWidth={1.5} />
              : isRect
                ? <Rect
                  x={-rW} y={-rH} width={rW * 2} height={rH * 2}
                  fill={u.color} stroke={u.color} strokeWidth={1.5}
                  cornerRadius={5}
                />
                : <Ellipse radiusX={rW} radiusY={rH} fill={u.color} stroke={u.color} strokeWidth={1.5} />
            }

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
                listening={false}
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
        opacity={board.mapOpacity ?? 1}
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
  // Mirror of polygon points kept in a ref so handleDblClick always reads the
  // freshest values — avoids stale-closure issues with async setDrawState.
  const polyPointsRef = useRef<number[]>([]);
  // Tracks whether the mouse is held down on a unit (enables scroll-to-rotate)
  const heldUnitIdRef = useRef<string | null>(null);
  // Tracks whether the mouse is held down on a terrain piece (enables scroll-to-rotate)
  const heldTerrainIdRef = useRef<string | null>(null);
  // Absorb momentum scroll after rotating
  const isRotatingRef = useRef(false);
  const rotateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the ID of the unit currently being Konva-dragged
  const dragPrimaryIdRef = useRef<string | null>(null);
  // Tracks primary's last known Konva position for incremental drag-move deltas.
  // Lifted here so handleWheel can update it after orbit moves the primary.
  const lastPrimaryPosRef = useRef<{ x: number; y: number } | null>(null);

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
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
  // True when cursor is close enough to the first vertex to snap-close the polygon
  const [polyCloseSnap, setPolyCloseSnap] = useState(false);

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

  // Copy & Paste shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        useStore.getState().copySelection();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        const stage = stageRef.current;
        let centerPos = undefined;
        if (stage) {
          const pos = stage.getPointerPosition();
          if (pos) {
            const { stageX, stageY, stageScale } = useStore.getState();
            centerPos = {
              x: (pos.x - stageX) / stageScale,
              y: (pos.y - stageY) / stageScale,
            };
            // optional: snap to grid if enabled
            const { snapEnabled, board, canvasWidth } = useStore.getState();
            if (snapEnabled) {
              const ppi = getPixelsPerInch(canvasWidth, board.widthInches);
              centerPos.x = Math.round(centerPos.x / ppi) * ppi;
              centerPos.y = Math.round(centerPos.y / ppi) * ppi;
            }
          }
        }
        useStore.getState().pasteClipboard(centerPos);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // WASD smooth pan
  useEffect(() => {
    const SPEED = 10;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(k)) {
        e.preventDefault();
        if (!wasdKeys.current.has(k)) {
          wasdKeys.current.add(k);
          if (rafId.current === null) startLoop();
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      wasdKeys.current.delete(e.key.toLowerCase());
    };

    const startLoop = () => {
      const loop = () => {
        const keys = wasdKeys.current;
        if (keys.size === 0) {
          rafId.current = null;
          return;
        }

        let dx = 0, dy = 0;
        if (keys.has('a')) dx += SPEED;
        if (keys.has('d')) dx -= SPEED;
        if (keys.has('w')) dy += SPEED;
        if (keys.has('s')) dy -= SPEED;

        if (dx !== 0 || dy !== 0) {
          const { stageX: sx, stageY: sy, stageScale: sc, setViewport: sv } = useStore.getState();
          sv(sx + dx, sy + dy, sc);
        }

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
          layerId: 'units',
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
        const newUnits: import('../types').UnitToken[] = Array.from({ length: count }, (_, i) => ({
          id: uuidv4(),
          name: unitTemplate.name,
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
          layerId: 'units' as const,
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

    // Freehand draw start
    if (activeTool === 'draw') {
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
          tags: ['blocks_los'], color: '#6b7280', opacity: 0.9, locked: false, layerId: 'terrain',
        });
        setDrawState({ drawing: false, points: [], previewPoint: { x: 0, y: 0 } });
      }
      return;
    }

    // Terrain polygon
    if (activeTool === 'terrain_polygon') {
      if (!isPolyDrawing.current) {
        // Start a new polygon
        isPolyDrawing.current = true;
        polyPointsRef.current = [pos.x, pos.y];
        setDrawState({ drawing: true, points: [pos.x, pos.y], previewPoint: pos });
      } else {
        // Check if clicking near the first vertex → close the polygon
        const pts = polyPointsRef.current;
        if (pts.length >= 6) { // need ≥3 vertices before we can close
          const CLOSE_THRESH = 15 / stageScale; // 15 screen-px in canvas-space
          const dx = pos.x - pts[0];
          const dy = pos.y - pts[1];
          if (Math.sqrt(dx * dx + dy * dy) < CLOSE_THRESH) {
            // Close: commit the polygon with existing points (don't add the click as a new vertex)
            addTerrain({
              id: uuidv4(), shape: 'polygon', points: [...pts],
              tags: ['blocks_los'], color: '#6b7280', opacity: 0.85, locked: false, layerId: 'terrain',
            });
            polyPointsRef.current = [];
            setPolyCloseSnap(false);
            setDrawState({ drawing: false, points: [], previewPoint: { x: 0, y: 0 } });
            isPolyDrawing.current = false;
            return;
          }
        }
        // Normal: add point
        polyPointsRef.current = [...pts, pos.x, pos.y];
        setDrawState(prev => ({ ...prev, points: [...prev.points, pos.x, pos.y], previewPoint: pos }));
      }
      return;
    }

    // Selection box start — clear selection whenever we click anything that is NOT a unit.
    // heldUnitIdRef is set by the unit Group's onMouseDown BEFORE this Stage handler fires
    // (Konva bubbles child → parent → stage), so it reliably tells us if a unit was hit.
    if (activeTool === 'select' && !e.evt.shiftKey) {
      if (!heldUnitIdRef.current) {
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

    // Freehand draw preview
    if (activeTool === 'draw' && drawState.drawing) {
      setDrawState(prev => ({ ...prev, points: [...prev.points, pos.x, pos.y], previewPoint: pos }));
      return;
    }

    // Terrain line/polygon preview
    if ((activeTool === 'terrain_line' || activeTool === 'terrain_polygon') && drawState.drawing) {
      setDrawState(prev => ({ ...prev, previewPoint: pos }));
    }

    // Update close-snap indicator for polygon
    if (activeTool === 'terrain_polygon' && isPolyDrawing.current) {
      const pts = polyPointsRef.current;
      if (pts.length >= 6) {
        const CLOSE_THRESH = 15 / stageScale;
        const dx = pos.x - pts[0];
        const dy = pos.y - pts[1];
        setPolyCloseSnap(Math.sqrt(dx * dx + dy * dy) < CLOSE_THRESH);
      } else {
        setPolyCloseSnap(false);
      }
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
          tags: ['blocks_los'], color: '#6b7280', opacity: 0.85, locked: false, layerId: 'terrain',
        });
      }
      setDrawState({ drawing: false, points: [], previewPoint: { x: 0, y: 0 } });
      return;
    }

    // Freehand draw finalize
    if (activeTool === 'draw' && drawState.drawing) {
      if (drawState.points.length > 4) { // Needs at least 2 x,y pairs + 1 point
        useStore.getState().addDrawing({
          id: uuidv4(),
          points: drawState.points,
          color: '#e4e4e7',
          strokeWidth: 4,
          opacity: 0.5,
          locked: false,
          layerId: 'drawings',
        });
      }
      setDrawState({ drawing: false, points: [], previewPoint: { x: 0, y: 0 } });
      return;
    }

    // Selection box 
    if (selBoxStart.current && activeTool === 'select') {
      const sx = selBoxStart.current.x;
      const sy = selBoxStart.current.y;
      const x = Math.min(sx, pos.x);
      const y = Math.min(sy, pos.y);
      const w = Math.abs(pos.x - sx);
      const h = Math.abs(pos.y - sy);

      if (w > 5 || h > 5) {
        const inBox = units.filter(u => {
          const rW = mmToPxUtil(u.baseWidthMm, ppi) / 2;
          const rH = mmToPxUtil(u.baseHeightMm, ppi) / 2;
          return u.x + rW >= x && u.x - rW <= x + w &&
                 u.y + rH >= y && u.y - rH <= y + h;
        }).map(u => u.id);
        
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

  // Enter = complete polygon, Escape = cancel — reliable keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isPolyDrawing.current) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        const pts = polyPointsRef.current;
        if (pts.length >= 6) {
          addTerrain({
            id: uuidv4(), shape: 'polygon', points: [...pts],
            tags: ['blocks_los'], color: '#6b7280', opacity: 0.85, locked: false, layerId: 'terrain',
          });
        }
        polyPointsRef.current = [];
        setPolyCloseSnap(false);
        setDrawState({ drawing: false, points: [], previewPoint: { x: 0, y: 0 } });
        isPolyDrawing.current = false;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        polyPointsRef.current = [];
        setPolyCloseSnap(false);
        setDrawState({ drawing: false, points: [], previewPoint: { x: 0, y: 0 } });
        isPolyDrawing.current = false;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addTerrain]);

  // Release unit/terrain hold on global mouseup
  useEffect(() => {
    const onUp = () => {
      heldUnitIdRef.current = null;
      heldTerrainIdRef.current = null;
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    // Scroll-to-rotate: when holding mouse on a unit, wheel rotates selected units
    if (heldUnitIdRef.current) {
      const { selectedIds: ids, units: currentUnits, updateUnit: upd } = useStore.getState();
      if (ids.length > 0 && ids.includes(heldUnitIdRef.current)) {
        const ROTATE_STEP = 5; // degrees per scroll tick
        const delta = e.evt.deltaY > 0 ? ROTATE_STEP : -ROTATE_STEP;
        const selected = ids.map(id => currentUnits.find(u => u.id === id)).filter(Boolean) as typeof currentUnits;

        if (selected.length === 1) {
          // Single unit: spin base in place
          upd(selected[0].id, { rotation: (selected[0].rotation + delta + 360) % 360 });
        } else {
          // Group rotation
          let cx = 0, cy = 0;
          if (dragPrimaryIdRef.current !== null) {
            // When actively dragging, Konva rigidly locks the primary unit to the mouse pointer.
            // If we rotate the group around the centroid, the primary unit would mathematically orbit 
            // away from the mouse cursor, but Konva would snap it back, breaking the formation.
            // Pivoting around the grabbed unit completely prevents this visual conflict and mathematically 
            // rotates the shape exactly as intended.
            const primaryId = heldUnitIdRef.current;
            const primaryUnit = selected.find(u => u.id === primaryId);
            if (!primaryUnit) return;
            cx = (primaryId === dragPrimaryIdRef.current && lastPrimaryPosRef.current) 
                  ? lastPrimaryPosRef.current.x 
                  : primaryUnit.x;
            cy = (primaryId === dragPrimaryIdRef.current && lastPrimaryPosRef.current) 
                  ? lastPrimaryPosRef.current.y 
                  : primaryUnit.y;
          } else {
            // Not dragging (just holding click): rotate around group centroid safely
            cx = selected.reduce((s, u) => s + u.x, 0) / selected.length;
            cy = selected.reduce((s, u) => s + u.y, 0) / selected.length;
          }

          const rad = (delta * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);

          selected.forEach(unit => {
            // Ensure we use the exact active Konva coordinate for the primary piece if it's dragging!
            const realX = (unit.id === dragPrimaryIdRef.current && lastPrimaryPosRef.current) 
                            ? lastPrimaryPosRef.current.x 
                            : unit.x;
            const realY = (unit.id === dragPrimaryIdRef.current && lastPrimaryPosRef.current) 
                            ? lastPrimaryPosRef.current.y 
                            : unit.y;

            const dx = realX - cx;
            const dy = realY - cy;
            
            upd(unit.id, {
              x: cx + dx * cos - dy * sin,
              y: cy + dx * sin + dy * cos,
              rotation: (unit.rotation + delta + 360) % 360,
            });
          });
        }
        
        isRotatingRef.current = true;
        if (rotateTimeoutRef.current !== null) clearTimeout(rotateTimeoutRef.current);
        rotateTimeoutRef.current = setTimeout(() => {
          isRotatingRef.current = false;
          useStore.getState().pushHistory();
        }, 300);

        return; // don't zoom
      }
    }

    // Scroll-to-rotate: when holding mouse on a terrain piece, wheel rotates selected terrain
    if (heldTerrainIdRef.current) {
      const { selectedIds: ids, terrain: currentTerrain, updateTerrain: updT } = useStore.getState();
      if (ids.length > 0 && ids.includes(heldTerrainIdRef.current)) {
        const ROTATE_STEP = 5; // degrees per scroll tick
        const delta = e.evt.deltaY > 0 ? ROTATE_STEP : -ROTATE_STEP;
        const selectedTerrain = ids
          .map(id => currentTerrain.find(t => t.id === id))
          .filter(Boolean) as TerrainObject[];

        if (selectedTerrain.length === 0) return;

        // Compute centroid across all selected terrain points
        let cx = 0, cy = 0, totalPts = 0;
        selectedTerrain.forEach(t => {
          for (let i = 0; i < t.points.length; i += 2) {
            cx += t.points[i];
            cy += t.points[i + 1];
            totalPts++;
          }
        });
        if (totalPts > 0) { cx /= totalPts; cy /= totalPts; }

        const rad = (delta * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        selectedTerrain.forEach(t => {
          const newPoints = t.points.map((v, i) => {
            if (i % 2 === 0) {
              // x coordinate
              const px = v - cx;
              const py = t.points[i + 1] - cy;
              return cx + px * cos - py * sin;
            } else {
              // y coordinate
              const px = t.points[i - 1] - cx;
              const py = v - cy;
              return cy + px * sin + py * cos;
            }
          });
          updT(t.id, { points: newPoints });
        });

        isRotatingRef.current = true;
        if (rotateTimeoutRef.current !== null) clearTimeout(rotateTimeoutRef.current);
        rotateTimeoutRef.current = setTimeout(() => {
          isRotatingRef.current = false;
          useStore.getState().pushHistory();
        }, 300);

        return; // don't zoom
      }
    }

    // Suppress zoom if we are currently absorbing momentum scroll from a recent rotation
    if (isRotatingRef.current) {
      if (rotateTimeoutRef.current !== null) clearTimeout(rotateTimeoutRef.current);
      rotateTimeoutRef.current = setTimeout(() => {
        isRotatingRef.current = false;
      }, 300);
      return;
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
        onWheel={handleWheel}
      >
        {/* Board background */}
        <Layer>
          <Rect x={0} y={0} width={canvasWidth} height={boardHeightPx}
            fill="#1e293b" stroke="rgba(99,102,241,0.6)" strokeWidth={2} />
        </Layer>

        <MapImageLayer />
        <GridLayer />
        <TerrainLayer onTerrainMouseDown={(id) => { heldTerrainIdRef.current = id; }} />
        <DrawingLayer />
        <LosLayer />
        <HoverLosLayer hoveredUnitId={hoveredUnitId} />
        <UnitLayer
          onUnitMouseDown={(id) => { heldUnitIdRef.current = id; }}
          onUnitHover={setHoveredUnitId}
          onDragPrimaryChange={(id) => { dragPrimaryIdRef.current = id; }}
          lastPrimaryPosRef={lastPrimaryPosRef}
        />

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
                {Array.from({ length: drawState.points.length / 2 }).map((_, i) => {
                  const isFirst = i === 0;
                  const canClose = drawState.points.length >= 6;
                  return (
                    <Circle key={i}
                      x={drawState.points[i * 2]} y={drawState.points[i * 2 + 1]}
                      radius={isFirst && canClose ? (polyCloseSnap ? 9 : 6) : 4}
                      fill={isFirst && canClose ? (polyCloseSnap ? '#22c55e' : '#86efac') : '#a5f3fc'}
                      stroke={isFirst && canClose ? '#16a34a' : undefined}
                      strokeWidth={isFirst && canClose ? 2 : 0}
                    />
                  );
                })}
              </>
            )}
            {activeTool === 'terrain_line' && drawState.points.length >= 2 && (
              <Line
                points={[drawState.points[0], drawState.points[1], drawState.previewPoint.x, drawState.previewPoint.y]}
                stroke="#a5f3fc" strokeWidth={2} dash={[5, 3]}
              />
            )}
            {activeTool === 'draw' && drawState.drawing && (
              <Line
                points={drawState.points}
                stroke="#e4e4e7" strokeWidth={4} tension={0.1}
                lineCap="round" lineJoin="round" opacity={0.5}
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
    case 'eraser': return 'cell';
    default: return 'default';
  }
}
