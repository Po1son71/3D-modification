import React, { useRef, useEffect, useState, useCallback } from 'react';
import useFloorPlannerStore, {
  getWallEndpoints,
  getWallInward,
  getDoorInfo,
} from '../../store/floorPlannerStore';

const PPM  = 60;    // pixels per meter at scale = 1
const SNAP = 0.25;  // snap grid in meters
const DEFAULT_DOOR_WIDTH = 0.9;

const snapVal = (v) => Math.round(v / SNAP) * SNAP;
const snapPt  = (wx, wy) => ({ x: snapVal(wx), y: snapVal(wy) });

// ── Furniture symbol icons ────────────────────────────────────────────────────
function drawFurnitureSymbol(ctx, type, sw, sh, sc) {
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = Math.max(0.5, sc * 0.5);

  if (type === 'sofa' || type === 'armchair') {
    ctx.beginPath(); ctx.moveTo(sw * 0.05, sh * 0.1); ctx.lineTo(sw * 0.95, sh * 0.1); ctx.stroke();
    if (type === 'sofa') {
      ctx.beginPath(); ctx.moveTo(sw * 0.5, sh * 0.1); ctx.lineTo(sw * 0.5, sh * 0.9); ctx.stroke();
    }
  } else if (type.startsWith('bed')) {
    const r = Math.min(sw * 0.15, sh * 0.1, 8 * sc);
    const n = type === 'bed-single' ? 1 : 2;
    const sp2 = sw / (n + 1);
    for (let i = 0; i < n; i++) {
      ctx.beginPath(); ctx.arc(sp2 * (i + 1), sh * 0.2, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(sw * 0.05, sh * 0.45); ctx.lineTo(sw * 0.95, sh * 0.45); ctx.stroke();
  } else if (type === 'dining-table-round' || type === 'dining-table-rect') {
    ctx.beginPath();
    ctx.moveTo(sw * 0.5, sh * 0.1); ctx.lineTo(sw * 0.5, sh * 0.9);
    ctx.moveTo(sw * 0.1, sh * 0.5); ctx.lineTo(sw * 0.9, sh * 0.5);
    ctx.stroke();
  } else if (type === 'toilet') {
    ctx.beginPath(); ctx.ellipse(sw * 0.5, sh * 0.65, sw * 0.35, sh * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (type === 'bathtub') {
    ctx.beginPath(); ctx.ellipse(sw * 0.5, sh * 0.5, sw * 0.38, sh * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (type === 'shower') {
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(sw * 0.3, 0);
    ctx.moveTo(0, 0); ctx.lineTo(0, sh * 0.3);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.arc(sw * 0.15, sh * 0.15, Math.min(4 * sc, Math.min(sw, sh) * 0.08), 0, Math.PI * 2); ctx.fill();
  } else if (type === 'desk' || type === 'l-desk') {
    ctx.strokeRect(sw * 0.3, sh * 0.1, sw * 0.4, sh * 0.25);
  } else if (type === 'stove') {
    const r = Math.min(sw, sh) * 0.12;
    [[0.28, 0.3], [0.72, 0.3], [0.28, 0.7], [0.72, 0.7]].forEach(([fx, fy]) => {
      ctx.beginPath(); ctx.arc(sw * fx, sh * fy, r, 0, Math.PI * 2); ctx.stroke();
    });
  } else if (type === 'refrigerator') {
    ctx.beginPath(); ctx.moveTo(sw * 0.05, sh * 0.45); ctx.lineTo(sw * 0.95, sh * 0.45); ctx.stroke();
    ctx.strokeRect(sw * 0.75, sh * 0.12, sw * 0.08, sh * 0.25);
  }
}

// ── Wall nearest-point finder (for door placement) ────────────────────────────
function findNearestWall(wx, wy, rooms, maxDist = 1.2) {
  let best = null, bestDist = Infinity;

  for (const room of rooms) {
    for (const wall of ['north', 'south', 'east', 'west']) {
      const { start, end, len } = getWallEndpoints(room, wall);
      const dx = end.x - start.x, dy = end.y - start.y;
      const t = Math.max(0, Math.min(1, ((wx - start.x) * dx + (wy - start.y) * dy) / (len * len)));
      const px = start.x + t * dx, py = start.y + t * dy;
      const dist = Math.hypot(wx - px, wy - py);
      if (dist < bestDist && dist < maxDist) {
        bestDist = dist;
        // offset = projected distance along wall from start
        const rawOffset = t * len;
        const clampedOffset = snapVal(
          Math.max(0, Math.min(len - DEFAULT_DOOR_WIDTH, rawOffset - DEFAULT_DOOR_WIDTH / 2))
        );
        best = { room, wall, offset: clampedOffset };
      }
    }
  }
  return best;
}

// ── Main component ────────────────────────────────────────────────────────────
const FloorPlanEditor = () => {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);

  const [scale, setScale]         = useState(1.2);
  const [offset, setOffset]       = useState({ x: 180, y: 120 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Mutable refs for event handlers (avoid stale closures)
  const scaleRef  = useRef(scale);
  const offsetRef = useRef(offset);
  const drawRef   = useRef(null);   // room draw: { startX, startY, curX, curY }
  const dragRef   = useRef(null);   // active drag state
  const panRef    = useRef(null);   // pan state
  const hoverRef  = useRef(null);   // furniture hover position
  const doorHoverRef = useRef(null);// door placement preview { room, wall, offset }
  const [, forceRender] = useState(0);

  scaleRef.current  = scale;
  offsetRef.current = offset;

  const {
    rooms, furniture, doors,
    selectedId, activeTool, activeFurnitureDef,
    addRoom, updateRoom,
    addFurniture, updateFurniture,
    addDoor, updateDoor,
    setSelectedId, deleteSelected,
    undo, redo, rotateSelectedFurniture,
  } = useFloorPlannerStore();

  // ── World ↔ screen ──────────────────────────────────────────────────────────
  const toScreen = useCallback((wx, wy) => ({
    x: wx * PPM * scaleRef.current + offsetRef.current.x,
    y: wy * PPM * scaleRef.current + offsetRef.current.y,
  }), []);

  const toWorld = useCallback((sx, sy) => ({
    x: (sx - offsetRef.current.x) / (PPM * scaleRef.current),
    y: (sy - offsetRef.current.y) / (PPM * scaleRef.current),
  }), []);

  // ── Resize observer ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Non-passive wheel listener (React makes onWheel passive → zoom chaos fix) ─
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.max(0.25, Math.min(5, scaleRef.current * factor));
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const newOff = {
        x: mx - (mx - offsetRef.current.x) * (newScale / scaleRef.current),
        y: my - (my - offsetRef.current.y) * (newScale / scaleRef.current),
      };
      scaleRef.current  = newScale;
      offsetRef.current = newOff;
      setScale(newScale);
      setOffset(newOff);
    };
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
      else if (e.key === 'Escape') { setSelectedId(null); drawRef.current = null; forceRender((n) => n + 1); }
      else if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey) rotateSelectedFurniture(90);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, deleteSelected, setSelectedId, rotateSelectedFurniture]);

  // ── Draw canvas ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvasSize;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#DCDCDC';
    ctx.fillRect(0, 0, width, height);

    drawGrid(ctx, width, height);
    rooms.forEach((room) => drawRoom(ctx, room, room.id === selectedId));
    doors.forEach((door) => {
      const room = rooms.find((r) => r.id === door.roomId);
      if (room) drawDoorSymbol(ctx, door, room, door.id === selectedId);
    });
    furniture.forEach((item) => drawFurniture(ctx, item, item.id === selectedId));

    // Room draw preview
    const ds = drawRef.current;
    if (ds) {
      const rx = Math.min(ds.startX, ds.curX), ry = Math.min(ds.startY, ds.curY);
      const rw = Math.abs(ds.curX - ds.startX), rh = Math.abs(ds.curY - ds.startY);
      if (rw > 0 && rh > 0) {
        const sp = toScreen(rx, ry);
        const sw = rw * PPM * scale, sh = rh * PPM * scale;
        ctx.fillStyle = 'rgba(33,150,243,0.12)';
        ctx.fillRect(sp.x, sp.y, sw, sh);
        ctx.strokeStyle = '#2196F3'; ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]); ctx.strokeRect(sp.x, sp.y, sw, sh); ctx.setLineDash([]);
        ctx.fillStyle = '#1565C0';
        ctx.font = `bold ${Math.max(11, 12 * scale)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`${rw.toFixed(2)}m × ${rh.toFixed(2)}m`, sp.x + sw / 2, sp.y + sh / 2);
      }
    }

    // Furniture hover preview
    const hov = hoverRef.current;
    if (activeTool === 'furniture' && activeFurnitureDef && hov) {
      const sp = toScreen(hov.x, hov.y);
      const sw = activeFurnitureDef.width * PPM * scale, sh = activeFurnitureDef.depth * PPM * scale;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = activeFurnitureDef.color;
      ctx.fillRect(sp.x, sp.y, sw, sh);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#2196F3'; ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]); ctx.strokeRect(sp.x, sp.y, sw, sh); ctx.setLineDash([]);
    }

    // Door placement preview
    const dh = doorHoverRef.current;
    if (activeTool === 'door' && dh) {
      const previewDoor = { id: '__preview__', width: DEFAULT_DOOR_WIDTH, openAngle: 90, hingeSide: 'left', swingIn: true, ...dh };
      ctx.globalAlpha = 0.6;
      drawDoorSymbol(ctx, previewDoor, dh.room, false);
      ctx.globalAlpha = 1;
    }
  }, [rooms, furniture, doors, selectedId, canvasSize, scale, offset, activeTool, activeFurnitureDef]);

  // ── Grid ────────────────────────────────────────────────────────────────────
  const drawGrid = (ctx, width, height) => {
    const sc  = scaleRef.current;
    const off = offsetRef.current;

    const minorStep = SNAP * PPM * sc;
    if (minorStep > 6) {
      ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 0.5;
      const sx0 = ((off.x % minorStep) + minorStep) % minorStep;
      const sy0 = ((off.y % minorStep) + minorStep) % minorStep;
      for (let x = sx0; x < width; x += minorStep) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
      for (let y = sy0; y < height; y += minorStep) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    }

    const majorStep = PPM * sc;
    ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = 1;
    const mx0 = ((off.x % majorStep) + majorStep) % majorStep;
    const my0 = ((off.y % majorStep) + majorStep) % majorStep;
    for (let x = mx0; x < width; x += majorStep) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = my0; y < height; y += majorStep) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1.5;
    if (off.x > 0 && off.x < width) { ctx.beginPath(); ctx.moveTo(off.x, 0); ctx.lineTo(off.x, height); ctx.stroke(); }
    if (off.y > 0 && off.y < height) { ctx.beginPath(); ctx.moveTo(0, off.y); ctx.lineTo(width, off.y); ctx.stroke(); }
  };

  const HANDLE = 8;

  // ── Draw room with per-wall segments (allows door gaps) ───────────────────
  const drawRoom = (ctx, room, isSel) => {
    const sc = scaleRef.current;
    const sp = toScreen(room.x, room.y);
    const sw = room.width  * PPM * sc;
    const sh = room.height * PPM * sc;
    const wt = (room.wallThickness || 0.15) * PPM * sc;

    // Floor fill
    ctx.fillStyle = room.floorColor;
    ctx.fillRect(sp.x + wt / 2, sp.y + wt / 2, sw - wt, sh - wt);

    // Draw each wall side as a line, skipping door openings
    const wallColor = isSel ? '#1565C0' : room.wallColor;
    const roomDoors = doors.filter((d) => d.roomId === room.id);

    for (const wall of ['north', 'south', 'east', 'west']) {
      const { start, end, len } = getWallEndpoints(room, wall);
      const sp1 = toScreen(start.x, start.y);
      const sp2 = toScreen(end.x, end.y);

      const wallDoors = roomDoors
        .filter((d) => d.wall === wall)
        .sort((a, b) => a.offset - b.offset);

      ctx.strokeStyle = wallColor;
      ctx.lineWidth   = wt;
      ctx.lineCap     = 'square';

      let prevT = 0;
      for (const d of wallDoors) {
        const gapStart = Math.max(0, d.offset / len);
        const gapEnd   = Math.min(1, (d.offset + d.width) / len);
        if (gapStart > prevT) {
          ctx.beginPath();
          ctx.moveTo(sp1.x + (sp2.x - sp1.x) * prevT,  sp1.y + (sp2.y - sp1.y) * prevT);
          ctx.lineTo(sp1.x + (sp2.x - sp1.x) * gapStart, sp1.y + (sp2.y - sp1.y) * gapStart);
          ctx.stroke();
        }
        prevT = gapEnd;
      }
      if (prevT < 1) {
        ctx.beginPath();
        ctx.moveTo(sp1.x + (sp2.x - sp1.x) * prevT, sp1.y + (sp2.y - sp1.y) * prevT);
        ctx.lineTo(sp2.x, sp2.y);
        ctx.stroke();
      }
    }

    // Room label
    if (sw > 50 && sh > 28) {
      ctx.fillStyle    = isSel ? '#1565C0' : 'rgba(0,0,0,0.45)';
      ctx.font         = `${Math.max(10, 12 * sc)}px sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(room.name, sp.x + sw / 2, sp.y + sh / 2);
    }

    // Dimension labels when selected
    if (isSel && sw > 60) {
      ctx.fillStyle = '#1565C0';
      ctx.font = `${Math.max(9, 10 * sc)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`${room.width.toFixed(2)}m`, sp.x + sw / 2, sp.y - wt / 2 - 8 * sc);
      ctx.save();
      ctx.translate(sp.x - wt / 2 - 8 * sc, sp.y + sh / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${room.height.toFixed(2)}m`, 0, 0);
      ctx.restore();
    }

    // Selection handles (corners)
    if (isSel) {
      [[sp.x, sp.y], [sp.x + sw, sp.y], [sp.x + sw, sp.y + sh], [sp.x, sp.y + sh]].forEach(([cx, cy]) => {
        ctx.fillStyle = '#fff'; ctx.fillRect(cx - HANDLE / 2, cy - HANDLE / 2, HANDLE, HANDLE);
        ctx.strokeStyle = '#1976D2'; ctx.lineWidth = 2; ctx.lineCap = 'butt';
        ctx.strokeRect(cx - HANDLE / 2, cy - HANDLE / 2, HANDLE, HANDLE);
      });
    }
  };

  // ── Draw door swing symbol ───────────────────────────────────────────────
  const drawDoorSymbol = (ctx, door, room, isSel) => {
    const sc = scaleRef.current;
    const { hingePoint, panelDir, swingDir } = getDoorInfo(door, room);
    const sh  = toScreen(hingePoint.x, hingePoint.y);
    const radius = door.width * PPM * sc;

    // Compute open tip position
    const θ = door.openAngle * Math.PI / 180;
    const tipWorld = {
      x: hingePoint.x + door.width * (Math.cos(θ) * panelDir.x + Math.sin(θ) * swingDir.x),
      y: hingePoint.y + door.width * (Math.cos(θ) * panelDir.y + Math.sin(θ) * swingDir.y),
    };
    const sTip = toScreen(tipWorld.x, tipWorld.y);

    const panelColor = isSel ? '#1565C0' : '#7B5B3A';
    const arcColor   = isSel ? 'rgba(21,101,192,0.4)' : 'rgba(123,91,58,0.35)';

    // Swing arc
    const startAngle   = Math.atan2(panelDir.y, panelDir.x);
    const cross        = panelDir.x * swingDir.y - panelDir.y * swingDir.x;
    const anticlockwise = cross < 0;
    const endAngle     = startAngle + (anticlockwise ? -θ : θ);

    ctx.strokeStyle = arcColor;
    ctx.lineWidth   = Math.max(0.8, 1 * sc);
    ctx.setLineDash([3 * sc, 3 * sc]);
    ctx.beginPath();
    ctx.arc(sh.x, sh.y, radius, startAngle, endAngle, anticlockwise);
    ctx.stroke();
    ctx.setLineDash([]);

    // Closed position line (along wall)
    const closedTip = {
      x: sh.x + radius * panelDir.x,
      y: sh.y + radius * panelDir.y,
    };
    ctx.strokeStyle = arcColor;
    ctx.lineWidth   = Math.max(0.8, 1 * sc);
    ctx.beginPath();
    ctx.moveTo(sh.x, sh.y);
    ctx.lineTo(closedTip.x, closedTip.y);
    ctx.stroke();

    // Door panel (open position)
    ctx.strokeStyle = panelColor;
    ctx.lineWidth   = Math.max(2, 2.5 * sc);
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(sh.x, sh.y);
    ctx.lineTo(sTip.x, sTip.y);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // Hinge dot
    ctx.fillStyle = panelColor;
    ctx.beginPath();
    ctx.arc(sh.x, sh.y, Math.max(3, 4 * sc), 0, Math.PI * 2);
    ctx.fill();

    // "D" label when selected
    if (isSel) {
      const midX = (sh.x + sTip.x) / 2;
      const midY = (sh.y + sTip.y) / 2;
      ctx.fillStyle = '#1565C0';
      ctx.font = `bold ${Math.max(10, 11 * sc)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('D', midX, midY - 8 * sc);
    }
  };

  // ── Draw furniture ──────────────────────────────────────────────────────────
  const drawFurniture = (ctx, item, isSel) => {
    const sc = scaleRef.current;
    const sp = toScreen(item.x, item.y);
    const sw = item.width * PPM * sc;
    const sd = item.depth * PPM * sc;

    ctx.save();
    ctx.translate(sp.x + sw / 2, sp.y + sd / 2);
    ctx.rotate(((item.rotation || 0) * Math.PI) / 180);
    ctx.translate(-sw / 2, -sd / 2);

    ctx.fillStyle = item.color || '#C8A080';
    ctx.fillRect(0, 0, sw, sd);
    drawFurnitureSymbol(ctx, item.type, sw, sd, sc);

    ctx.strokeStyle = isSel ? '#1565C0' : 'rgba(0,0,0,0.28)';
    ctx.lineWidth   = isSel ? 2 : 1;
    ctx.strokeRect(0, 0, sw, sd);

    if (sw > 28 && sd > 16) {
      ctx.fillStyle    = isSel ? '#1565C0' : 'rgba(0,0,0,0.6)';
      ctx.font         = `${Math.max(8, 9 * sc)}px sans-serif`;
      ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(item.name, sw / 2, sd / 2);
    }

    if (isSel) {
      [[0, 0], [sw, 0], [sw, sd], [0, sd]].forEach(([cx, cy]) => {
        ctx.fillStyle = '#fff'; ctx.fillRect(cx - HANDLE / 2, cy - HANDLE / 2, HANDLE, HANDLE);
        ctx.strokeStyle = '#1976D2'; ctx.lineWidth = 2;
        ctx.strokeRect(cx - HANDLE / 2, cy - HANDLE / 2, HANDLE, HANDLE);
      });
    }
    ctx.restore();
  };

  // ── Hit testing ─────────────────────────────────────────────────────────────
  const ptInRect = (px, py, rx, ry, rw, rh) => px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;

  const checkHandleHit = (wx, wy) => {
    if (!selectedId) return null;
    const room = rooms.find((r) => r.id === selectedId);
    const furn = furniture.find((f) => f.id === selectedId);
    const item = room || furn;
    if (!item) return null;
    const iw   = item.width;
    const ih   = room ? item.height : item.depth;
    const tol  = (HANDLE / 2 + 2) / (PPM * scaleRef.current);
    const isRoom = !!room;
    const corners = [
      { x: item.x,      y: item.y,      corner: 'nw' },
      { x: item.x + iw, y: item.y,      corner: 'ne' },
      { x: item.x + iw, y: item.y + ih, corner: 'se' },
      { x: item.x,      y: item.y + ih, corner: 'sw' },
    ];
    for (const c of corners) {
      if (Math.abs(wx - c.x) < tol && Math.abs(wy - c.y) < tol)
        return { id: selectedId, corner: c.corner, isRoom, origX: item.x, origY: item.y, origW: iw, origH: ih };
    }
    return null;
  };

  const applyResize = (drag, wx, wy) => {
    const sx = snapVal(wx), sy = snapVal(wy);
    let { origX: nx, origY: ny, origW: nw, origH: nh } = drag;
    switch (drag.corner) {
      case 'nw': nx = Math.min(sx, drag.origX + drag.origW - SNAP); ny = Math.min(sy, drag.origY + drag.origH - SNAP); nw = drag.origX + drag.origW - nx; nh = drag.origY + drag.origH - ny; break;
      case 'ne': ny = Math.min(sy, drag.origY + drag.origH - SNAP); nw = Math.max(SNAP, sx - drag.origX); nh = drag.origY + drag.origH - ny; break;
      case 'se': nw = Math.max(SNAP, sx - drag.origX); nh = Math.max(SNAP, sy - drag.origY); break;
      case 'sw': nx = Math.min(sx, drag.origX + drag.origW - SNAP); nw = drag.origX + drag.origW - nx; nh = Math.max(SNAP, sy - drag.origY); break;
    }
    if (drag.isRoom) updateRoom(drag.id, { x: nx, y: ny, width: nw, height: nh });
    else             updateFurniture(drag.id, { x: nx, y: ny, width: nw, depth: nh });
  };

  /** Check if world point is near a door's hinge or panel (for selection). */
  const checkDoorHit = (wx, wy) => {
    const tol = 0.25; // meters
    for (const door of doors) {
      const room = rooms.find((r) => r.id === door.roomId);
      if (!room) continue;
      const { hingePoint } = getDoorInfo(door, room);
      if (Math.hypot(wx - hingePoint.x, wy - hingePoint.y) < tol) return door;
      // Also check midpoint of panel
      const θ = door.openAngle * Math.PI / 180;
      const { panelDir, swingDir } = getDoorInfo(door, room);
      const midX = hingePoint.x + (door.width / 2) * (Math.cos(θ) * panelDir.x + Math.sin(θ) * swingDir.x);
      const midY = hingePoint.y + (door.width / 2) * (Math.cos(θ) * panelDir.y + Math.sin(θ) * swingDir.y);
      if (Math.hypot(wx - midX, wy - midY) < tol) return door;
    }
    return null;
  };

  // ── Mouse events ────────────────────────────────────────────────────────────
  const getMP = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { sx: e.clientX - r.left, sy: e.clientY - r.top };
  };

  const onMouseDown = (e) => {
    const { sx, sy } = getMP(e);
    const { x: wx, y: wy } = toWorld(sx, sy);

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      panRef.current = { sx, sy, ox: offsetRef.current.x, oy: offsetRef.current.y };
      return;
    }
    if (e.button !== 0) return;

    if (activeTool === 'select') {
      const handleHit = checkHandleHit(wx, wy);
      if (handleHit) { dragRef.current = { type: 'resize', ...handleHit, startWX: wx, startWY: wy }; return; }

      // Doors (checked before rooms so they're accessible)
      const doorHit = checkDoorHit(wx, wy);
      if (doorHit) {
        setSelectedId(doorHit.id);
        const room = rooms.find((r) => r.id === doorHit.roomId);
        dragRef.current = {
          type: 'door', id: doorHit.id, wall: doorHit.wall,
          roomWidth: room.width, roomHeight: room.height,
          doorWidth: doorHit.width,
          startWX: wx, startWY: wy, origOffset: doorHit.offset,
        };
        return;
      }

      for (let i = furniture.length - 1; i >= 0; i--) {
        const f = furniture[i];
        if (ptInRect(wx, wy, f.x, f.y, f.width, f.depth)) {
          setSelectedId(f.id);
          dragRef.current = { type: 'furniture', id: f.id, startWX: wx, startWY: wy, origX: f.x, origY: f.y };
          return;
        }
      }
      for (let i = rooms.length - 1; i >= 0; i--) {
        const r = rooms[i];
        if (ptInRect(wx, wy, r.x, r.y, r.width, r.height)) {
          setSelectedId(r.id);
          dragRef.current = { type: 'room', id: r.id, startWX: wx, startWY: wy, origX: r.x, origY: r.y };
          return;
        }
      }
      setSelectedId(null);

    } else if (activeTool === 'room') {
      const { x, y } = snapPt(wx, wy);
      drawRef.current = { startX: x, startY: y, curX: x, curY: y };
      forceRender((n) => n + 1);

    } else if (activeTool === 'furniture' && activeFurnitureDef) {
      const { x, y } = snapPt(wx, wy);
      addFurniture({ type: activeFurnitureDef.type, name: activeFurnitureDef.name, x, y,
        width: activeFurnitureDef.width, depth: activeFurnitureDef.depth,
        color: activeFurnitureDef.color, height3d: activeFurnitureDef.height3d || 0.8 });

    } else if (activeTool === 'door') {
      const hit = findNearestWall(wx, wy, rooms);
      if (hit) {
        addDoor({ roomId: hit.room.id, wall: hit.wall, offset: hit.offset });
      }
    }
  };

  const onMouseMove = (e) => {
    const { sx, sy } = getMP(e);
    const { x: wx, y: wy } = toWorld(sx, sy);

    if (panRef.current) {
      const p = panRef.current;
      const newOff = { x: p.ox + (sx - p.sx), y: p.oy + (sy - p.sy) };
      offsetRef.current = newOff; setOffset(newOff); return;
    }

    if (dragRef.current) {
      const d = dragRef.current;
      const dx = wx - d.startWX, dy = wy - d.startWY;

      if (d.type === 'room')      updateRoom(d.id,      { x: snapVal(d.origX + dx), y: snapVal(d.origY + dy) });
      else if (d.type === 'furniture') updateFurniture(d.id, { x: snapVal(d.origX + dx), y: snapVal(d.origY + dy) });
      else if (d.type === 'resize')    applyResize(d, wx, wy);
      else if (d.type === 'door') {
        // Slide door along its wall
        const isHorizontal = d.wall === 'north' || d.wall === 'south';
        const wallLen      = isHorizontal ? d.roomWidth : d.roomHeight;
        const raw          = d.origOffset + (isHorizontal ? dx : dy);
        const clamped      = Math.max(0, Math.min(wallLen - d.doorWidth, snapVal(raw)));
        updateDoor(d.id, { offset: clamped });
      }
      return;
    }

    if (drawRef.current) {
      const { x, y } = snapPt(wx, wy);
      drawRef.current = { ...drawRef.current, curX: x, curY: y };
      forceRender((n) => n + 1);
    }

    if (activeTool === 'furniture' && activeFurnitureDef) {
      const { x, y } = snapPt(wx, wy);
      hoverRef.current = { x, y };
      forceRender((n) => n + 1);
    }

    if (activeTool === 'door') {
      const hit = findNearestWall(wx, wy, rooms);
      doorHoverRef.current = hit || null;
      forceRender((n) => n + 1);
    }
  };

  const onMouseUp = () => {
    if (panRef.current)  { panRef.current = null; return; }
    if (dragRef.current) { dragRef.current = null; return; }

    const ds = drawRef.current;
    if (ds) {
      const rx = Math.min(ds.startX, ds.curX), ry = Math.min(ds.startY, ds.curY);
      const rw = Math.abs(ds.curX - ds.startX), rh = Math.abs(ds.curY - ds.startY);
      if (rw >= 0.5 && rh >= 0.5) addRoom({ x: rx, y: ry, width: rw, height: rh });
      drawRef.current = null;
      forceRender((n) => n + 1);
    }
  };

  const cursor =
    panRef.current    ? 'grabbing' :
    activeTool === 'room'      ? 'crosshair' :
    activeTool === 'furniture' ? 'copy' :
    activeTool === 'door'      ? 'cell' :
    dragRef.current   ? 'move' :
    'default';

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ display: 'block', cursor }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { panRef.current = null; hoverRef.current = null; doorHoverRef.current = null; }}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Scale badge */}
      <div style={{ position: 'absolute', bottom: 14, right: 14,
        background: 'rgba(255,255,255,0.92)', padding: '5px 10px', borderRadius: 4,
        fontSize: 12, color: '#666', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        pointerEvents: 'none', fontFamily: 'monospace' }}>
        {Math.round(scale * 100)}% · 1 grid = 1 m
      </div>

      {/* Help hint */}
      <div style={{ position: 'absolute', bottom: 14, left: 14,
        background: 'rgba(255,255,255,0.88)', padding: '8px 12px', borderRadius: 4,
        fontSize: 11, color: '#666', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        lineHeight: 1.6, pointerEvents: 'none' }}>
        {activeTool === 'room'      && 'Click + drag to draw a room'}
        {activeTool === 'furniture' && activeFurnitureDef && `Click to place ${activeFurnitureDef.name}`}
        {activeTool === 'door'      && 'Click on any wall to place a door'}
        {activeTool === 'select'    && 'Click to select · Drag to move · R rotate · Del delete · Alt+drag to pan'}
      </div>
    </div>
  );
};

export default FloorPlanEditor;
