import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import useFloorPlannerStore, {
  getWallEndpoints,
  getDoorInfo,
  getSharedWallDoors,
  getWorldWallFace,
} from '../../store/floorPlannerStore';

const PPM  = 60;    // pixels per meter at scale = 1
const SNAP = 0.05;  // snap grid in meters (5 cm)
const DEFAULT_DOOR_WIDTH = 0.9;

const snapVal = (v) => Math.round(v / SNAP) * SNAP;
const snapPt  = (wx, wy) => ({ x: snapVal(wx), y: snapVal(wy) });

// Returns '#fff' for dark backgrounds, '#111' for light backgrounds
const contrastColor = (hex) => {
  if (!hex || hex[0] !== '#') return '#111';
  const h = hex.slice(1);
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // Relative luminance (WCAG formula)
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum < 140 ? '#fff' : '#111';
};

// ── Furniture symbol icons ────────────────────────────────────────────────────
function drawFurnitureSymbol(ctx, type, sw, sh, sc, symColor = 'rgba(0,0,0,0.25)') {
  ctx.strokeStyle = symColor;
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
    ctx.fillStyle = symColor;
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
  } else if (type === 'pod') {
    // Hatched border pattern to indicate a POD zone
    const step = Math.max(8, Math.min(sw, sh) * 0.12);
    ctx.save(); ctx.globalAlpha = 0.18;
    for (let i = -sh; i < sw + sh; i += step) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + sh, sh); ctx.stroke();
    }
    ctx.restore();
    // "POD" label centred
    ctx.save();
    ctx.font = `bold ${Math.max(8, Math.min(sw, sh) * 0.14)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = symColor;
    ctx.fillText('POD', sw / 2, sh / 2);
    ctx.restore();
  } else if (type === 'battery-bank') {
    // Draw grid of battery cells based on item's batteryRows/batteryCols stored on ctx._batteryMeta
    const cols = ctx._batteryMeta?.cols || 4;
    const rows = ctx._batteryMeta?.rows || 2;
    const cw = sw / cols, ch = sh / rows;
    const gap = Math.max(1, Math.min(cw, ch) * 0.06);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.strokeRect(c * cw + gap, r * ch + gap, cw - gap * 2, ch - gap * 2);
      }
    }
    // small + sign in first cell to indicate polarity
    const cx2 = cw / 2, cy2 = ch / 2, sz = Math.min(cw, ch) * 0.2;
    ctx.beginPath();
    ctx.moveTo(cx2 - sz, cy2); ctx.lineTo(cx2 + sz, cy2);
    ctx.moveTo(cx2, cy2 - sz); ctx.lineTo(cx2, cy2 + sz);
    ctx.stroke();
  }
}

// ── Wall nearest-point finder (for door placement) ────────────────────────────
function findNearestWall(wx, wy, rooms, maxDist = 1.2) {
  let best = null, bestDist = Infinity;

  // Rotation-aware point-in-room check (mirrors the component's ptInRoom logic).
  const isInsideRoom = (room) => {
    const rotRad = (room.rotation || 0) * Math.PI / 180;
    if (room.polygon && room.polygon.length >= 3) {
      if (!rotRad) return ptInPolygon(wx, wy, room.polygon);
      const cx = room.x + room.width / 2, cy = room.y + room.height / 2;
      const cos = Math.cos(-rotRad), sin = Math.sin(-rotRad);
      const ddx = wx - cx, ddy = wy - cy;
      return ptInPolygon(cx + ddx * cos - ddy * sin, cy + ddx * sin + ddy * cos, room.polygon);
    }
    if (!rotRad) return wx >= room.x && wx <= room.x + room.width && wy >= room.y && wy <= room.y + room.height;
    const cx = room.x + room.width / 2, cy = room.y + room.height / 2;
    const cos = Math.cos(-rotRad), sin = Math.sin(-rotRad);
    const ddx = wx - cx, ddy = wy - cy;
    const lx = ddx * cos - ddy * sin, ly = ddx * sin + ddy * cos;
    return Math.abs(lx) <= room.width / 2 && Math.abs(ly) <= room.height / 2;
  };

  // If the cursor is inside a room, restrict the search to that room's walls.
  // This prevents an adjacent room's wall from winning purely on distance.
  const containingRoom = rooms.find(isInsideRoom);
  const searchRooms = containingRoom ? [containingRoom] : rooms;

  for (const room of searchRooms) {
    for (const wall of ['north', 'south', 'east', 'west']) {
      // getWallEndpoints returns LOCAL (unrotated) endpoints; rotate to world space.
      const { start: s0, end: e0, len } = getWallEndpoints(room, wall);
      const start = rotateAboutRoomCenter(room, s0.x, s0.y);
      const end   = rotateAboutRoomCenter(room, e0.x, e0.y);
      const dx = end.x - start.x, dy = end.y - start.y;
      // len*len == dx²+dy² (rotation preserves length), so the denominator is correct.
      const t = Math.max(0, Math.min(1, ((wx - start.x) * dx + (wy - start.y) * dy) / (len * len)));
      const px = start.x + t * dx, py = start.y + t * dy;
      const dist = Math.hypot(wx - px, wy - py);
      if (dist < bestDist && dist < maxDist) {
        bestDist = dist;
        // t*len is the local-space offset (rotation preserves arc length along wall).
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

// ── Room-to-room edge snap ────────────────────────────────────────────────────
// Returns the snapped {x, y} and alignment guides when dragging/drawing a room.
// Snaps edges and corners to other rooms within ROOM_SNAP_DIST metres.
const ROOM_SNAP_DIST = 0.4; // metres — corner/face snap radius when drawing a new room
const EDGE_SNAP_DIST = 0.5; // metres — edge-to-edge snap radius when dragging a room

// ── Rotation helpers (module-level, used by snap/placement functions) ─────────
function rotateAboutRoomCenter(room, px, py) {
  const rotRad = (room.rotation || 0) * Math.PI / 180;
  if (!rotRad) return { x: px, y: py };
  const cx = room.x + room.width / 2, cy = room.y + room.height / 2;
  const cosA = Math.cos(rotRad), sinA = Math.sin(rotRad);
  const dx = px - cx, dy = py - cy;
  return { x: cx + dx * cosA - dy * sinA, y: cy + dx * sinA + dy * cosA };
}

function getRoomWorldCorners(room) {
  const { x, y, width: w, height: h } = room;
  return [
    rotateAboutRoomCenter(room, x,     y),
    rotateAboutRoomCenter(room, x + w, y),
    rotateAboutRoomCenter(room, x + w, y + h),
    rotateAboutRoomCenter(room, x,     y + h),
  ];
}

// ── Room-edge-to-room-edge snap during drag ───────────────────────────────────
// Compares the world-space wall faces of all dragged rooms (at their candidate
// position) against the faces of every stationary room.  Returns adjusted deltas
// and guide descriptors.  Works with any room rotation.
function computeRoomEdgeSnap(draggingOrigins, allRooms, sdx, sdy, threshold = EDGE_SNAP_DIST) {
  const draggedIds = new Set(Object.keys(draggingOrigins));
  const staticRooms = allRooms.filter((r) => !draggedIds.has(r.id));
  if (!staticRooms.length) return { sdx, sdy, guides: [] };

  // Build candidate rooms (original data shifted by the current grid-snapped delta)
  const candidateRooms = [];
  for (const [id, orig] of Object.entries(draggingOrigins)) {
    if (orig.kind !== 'room') continue;
    const full = allRooms.find((r) => r.id === id);
    if (!full) continue;
    candidateRooms.push({ ...full, x: orig.x + sdx, y: orig.y + sdy });
  }
  if (!candidateRooms.length) return { sdx, sdy, guides: [] };

  // Collect world-space face segments
  const WALLS = ['north', 'south', 'east', 'west'];
  const draggedFaces = candidateRooms.flatMap((r) => WALLS.map((w) => getWorldWallFace(r, w)));
  const staticFaces  = staticRooms.flatMap((r) => WALLS.map((w) => getWorldWallFace(r, w)));

  let bestDX = 0, bestAbsDX = threshold;
  let bestDY = 0, bestAbsDY = threshold;
  let guideX = null, guideY = null;

  for (const df of draggedFaces) {
    const dxD = df.e.x - df.s.x, dyD = df.e.y - df.s.y;
    const lenD = Math.hypot(dxD, dyD);
    if (lenD < 0.001) continue;
    const uX = dxD / lenD, uY = dyD / lenD; // unit along face
    const nX = -uY, nY = uX;                 // face normal

    for (const sf of staticFaces) {
      const dxS = sf.e.x - sf.s.x, dyS = sf.e.y - sf.s.y;
      const lenS = Math.hypot(dxS, dyS);
      if (lenS < 0.001) continue;

      // Must be parallel (|cos θ| ≈ 1)
      if (Math.abs(Math.abs((dxS * uX + dyS * uY) / lenS) - 1) > 0.1) continue;

      // Normal-direction separation must be within threshold
      const vecX = sf.s.x - df.s.x, vecY = sf.s.y - df.s.y;
      const signedDist = vecX * nX + vecY * nY;
      if (Math.abs(signedDist) > threshold) continue;

      // Faces must overlap along the shared axis (sProj..eProj overlaps 0..lenD)
      const sProj = vecX * uX + vecY * uY;
      const eProj = sProj + dxS * uX + dyS * uY;
      if (Math.max(sProj, eProj) < -0.001 || Math.min(sProj, eProj) > lenD + 0.001) continue;

      // Decompose correction into world X and Y components
      const corrX = signedDist * nX;
      const corrY = signedDist * nY;

      if (Math.abs(corrX) > 0.0005 && Math.abs(corrX) < bestAbsDX) {
        bestAbsDX = Math.abs(corrX);
        bestDX    = corrX;
        guideX    = { axis: 'x', value: (sf.s.x + sf.e.x) / 2, kind: 'edge', faceS: sf.s, faceE: sf.e };
      }
      if (Math.abs(corrY) > 0.0005 && Math.abs(corrY) < bestAbsDY) {
        bestAbsDY = Math.abs(corrY);
        bestDY    = corrY;
        guideY    = { axis: 'y', value: (sf.s.y + sf.e.y) / 2, kind: 'edge', faceS: sf.s, faceE: sf.e };
      }
    }
  }

  const guides = [];
  if (guideX) guides.push(guideX);
  if (guideY) guides.push(guideY);
  return { sdx: sdx + bestDX, sdy: sdy + bestDY, guides };
}



// ── Wall axis-alignment guides (red lines like a design-tool smart guide) ─────
// Returns { axis, value, kind:'align', refPt } entries for every endpoint of the
// dragged wall that shares the same X or Y coordinate (within tol) with any other
// wall endpoint or room corner.
function computeWallAlignGuides(x1, y1, x2, y2, draggingId, allFWWalls, rooms, tol = 0.08) {
  // Reference points: all other freestanding-wall endpoints + room world corners
  const refPts = [];
  for (const w of allFWWalls) {
    if (w.id === draggingId) continue;
    refPts.push({ x: w.x1, y: w.y1 });
    refPts.push({ x: w.x2, y: w.y2 });
  }
  for (const r of rooms) {
    for (const c of getRoomWorldCorners(r)) refPts.push(c);
  }

  const raw = [];
  for (const [px, py] of [[x1, y1], [x2, y2]]) {
    for (const rp of refPts) {
      if (Math.abs(px - rp.x) < tol)
        raw.push({ axis: 'x', value: rp.x, kind: 'align', refPt: rp, dragPt: { x: px, y: py } });
      if (Math.abs(py - rp.y) < tol)
        raw.push({ axis: 'y', value: rp.y, kind: 'align', refPt: rp, dragPt: { x: px, y: py } });
    }
  }

  // Deduplicate by axis + rounded value
  const seen = new Set();
  return raw.filter((g) => {
    const key = `${g.axis}:${g.value.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

// ── Polygon room helpers ──────────────────────────────────────────────────────

// Returns the polygon vertices for a room.
// Rectangle rooms return the 4 corners; polygon rooms return room.polygon.
function getRoomPolygon(room) {
  if (room.polygon && room.polygon.length >= 3) return room.polygon;
  return [
    { x: room.x,             y: room.y },
    { x: room.x + room.width, y: room.y },
    { x: room.x + room.width, y: room.y + room.height },
    { x: room.x,             y: room.y + room.height },
  ];
}

// Axis-aligned bounding box of a polygon.
function polyBoundingBox(poly) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const v of poly) {
    if (v.x < minX) minX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.x > maxX) maxX = v.x;
    if (v.y > maxY) maxY = v.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// Point-in-polygon (ray-casting).
function ptInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

// ── Furniture snap: room wall faces + other furniture edges ───────────────────
// Snaps any axis-aligned edge of the furniture bounding box to the nearest snap
// target. Only works for unrotated furniture — rotated items snap to grid only.

// ── Overlap detection helpers ─────────────────────────────────────────────────
// Returns true if two AABB rectangles overlap (touching edges are OK).
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  const GAP = 0.005; // 5 mm tolerance so flush items don't block each other
  return ax + aw > bx + GAP && bx + bw > ax + GAP &&
         ay + ah > by + GAP && by + bh > ay + GAP;
}

// Returns true if placing furniture at (fx,fy,fw,fd) would overlap any other furniture.
function furnitureOverlapsAny(fx, fy, fw, fd, rot, allFurniture, excludeId) {
  if (rot) return false; // skip overlap check for rotated items (complex geometry)
  for (const f of allFurniture) {
    if (f.id === excludeId) continue;
    if (f.rotation) continue; // skip rotated obstacles
    if (rectsOverlap(fx, fy, fw, fd, f.x, f.y, f.width, f.depth)) return true;
  }
  return false;
}

// Returns true if two rooms' bounding boxes overlap.
function roomsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh);
}

// Best non-overlapping X position: try candX, then clamp to origX if needed.
// Returns { x, y } that is the closest position to (candX, candY) without overlap.
function resolveNoOverlap(candX, candY, fw, fd, rot, allFurniture, excludeId, origX, origY) {
  if (!furnitureOverlapsAny(candX, candY, fw, fd, rot, allFurniture, excludeId))
    return { x: candX, y: candY };
  // Try sliding along X only (keep original Y)
  if (!furnitureOverlapsAny(candX, origY, fw, fd, rot, allFurniture, excludeId))
    return { x: candX, y: origY };
  // Try sliding along Y only (keep original X)
  if (!furnitureOverlapsAny(origX, candY, fw, fd, rot, allFurniture, excludeId))
    return { x: origX, y: candY };
  // All blocked — stay at origin
  return { x: origX, y: origY };
}

// ── Wall endpoint snap ────────────────────────────────────────────────────────
// Priority: 1) room corner  2) room wall face (projected)  3) other wall endpoint
// Returns { x, y, snapped, kind } — kind is 'corner'|'wall'|'endpoint'|null
const SNAP_DIST = 0.4; // metres

function snapWallPoint(wx, wy, rooms, walls, excludeWallId) {
  let best = null, bestDist = Infinity;

  // 1. Room corners
  for (const r of rooms) {
    for (const { x: cx, y: cy } of getRoomWorldCorners(r)) {
      const d = Math.hypot(wx - cx, wy - cy);
      if (d < bestDist && d < SNAP_DIST) {
        bestDist = d; best = { x: cx, y: cy, kind: 'corner' };
      }
    }
  }

  // 2. Room wall face — projected closest point on (rotated) wall line
  for (const r of rooms) {
    for (const wall of ['north', 'south', 'east', 'west']) {
      const { start: s0, end: e0 } = getWallEndpoints(r, wall);
      const start = rotateAboutRoomCenter(r, s0.x, s0.y);
      const end   = rotateAboutRoomCenter(r, e0.x, e0.y);
      const dx = end.x - start.x, dy = end.y - start.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq < 1e-10) continue;
      const t = Math.max(0, Math.min(1, ((wx - start.x) * dx + (wy - start.y) * dy) / lenSq));
      const px = start.x + t * dx, py = start.y + t * dy;
      const d = Math.hypot(wx - px, wy - py);
      if (d < bestDist && d < SNAP_DIST) {
        bestDist = d; best = { x: px, y: py, kind: 'wall' };
      }
    }
  }

  // 3. Other wall endpoints (highest priority over face — checked before face)
  if (walls) {
    for (const w of walls) {
      if (w.id === excludeWallId) continue;
      for (const [ex, ey] of [[w.x1, w.y1], [w.x2, w.y2]]) {
        const d = Math.hypot(wx - ex, wy - ey);
        if (d < bestDist && d < SNAP_DIST) {
          bestDist = d; best = { x: ex, y: ey, kind: 'endpoint' };
        }
      }
    }
  }

  // 4. Other wall face — projected closest point on freestanding wall body
  if (walls) {
    for (const w of walls) {
      if (w.id === excludeWallId) continue;
      const fdx = w.x2 - w.x1, fdy = w.y2 - w.y1;
      const lenSq = fdx * fdx + fdy * fdy;
      if (lenSq < 1e-10) continue;
      const t = Math.max(0, Math.min(1, ((wx - w.x1) * fdx + (wy - w.y1) * fdy) / lenSq));
      const px = w.x1 + t * fdx, py = w.y1 + t * fdy;
      const d = Math.hypot(wx - px, wy - py);
      if (d < bestDist && d < SNAP_DIST) {
        bestDist = d; best = { x: px, y: py, kind: 'wall' };
      }
    }
  }

  return best ? { ...best, snapped: true } : { x: snapVal(wx), y: snapVal(wy), snapped: false, kind: null };
}

// ── Freestanding wall helpers ─────────────────────────────────────────────────

// Distance from point (px,py) to segment (ax,ay)→(bx,by), returns { dist, t }
function ptSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-10) return { dist: Math.hypot(px - ax, py - ay), t: 0 };
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return { dist: Math.hypot(px - (ax + t * dx), py - (ay + t * dy)), t };
}

// Find the nearest freestanding wall within maxDist, returns { wall, t, offset }
function findNearestFWWall(wx, wy, walls, maxDist = 1.2) {
  let best = null, bestDist = Infinity;
  for (const w of walls) {
    const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
    if (len < 0.01) continue;
    const { dist, t } = ptSegDist(wx, wy, w.x1, w.y1, w.x2, w.y2);
    if (dist < bestDist && dist < maxDist) {
      bestDist = dist;
      const rawOffset = t * len;
      const clampedOffset = snapVal(Math.max(0, Math.min(len - DEFAULT_DOOR_WIDTH, rawOffset - DEFAULT_DOOR_WIDTH / 2)));
      best = { wall: w, t, offset: clampedOffset, len };
    }
  }
  return best;
}

// ── Right-click context menu ──────────────────────────────────────────────────
const MenuItem = ({ onClick, danger, disabled, children }) => (
  <div
    onClick={disabled ? undefined : onClick}
    style={{
      padding: '7px 14px', fontSize: 13, cursor: disabled ? 'default' : 'pointer',
      color: disabled ? '#BBB' : danger ? '#C62828' : '#222',
      borderRadius: 4,
      transition: 'background 0.1s',
    }}
    onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = danger ? '#FFEBEE' : '#F0F4FF'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
  >
    {children}
  </div>
);
const MenuSep = () => <div style={{ height: 1, background: '#EEE', margin: '4px 0' }} />;

const ContextMenu = ({
  x, y, hitId, group, selectedIds, groups, lockedIds,
  onClose, onGroup, onUngroup, onDeleteGroup, onDelete, onCopy,
  onRenameGroup, onLock, onUnlock,
}) => {
  const ref = React.useRef(null);
  const [renaming, setRenaming] = React.useState(false);
  const [renameVal, setRenameVal] = React.useState(group?.name || '');

  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    // Defer so the right-click that opened this menu doesn't immediately close it
    const tid = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(tid); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  // Clamp to viewport
  const menuW = 200, menuH = 300;
  const left = Math.min(x, window.innerWidth  - menuW - 8);
  const top  = Math.min(y, window.innerHeight - menuH - 8);

  const selCount   = selectedIds.length;
  const isLocked   = hitId ? lockedIds.includes(hitId) : false;
  const canGroup   = selCount >= 2;
  const inGroup    = !!group;

  return (
    <div ref={ref} style={{
      position: 'fixed', left, top, zIndex: 9999,
      background: '#fff', borderRadius: 8, padding: '6px 0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.1)',
      minWidth: menuW, userSelect: 'none',
    }}>
      {/* Group name header */}
      {inGroup && (
        <>
          {renaming ? (
            <div style={{ padding: '6px 10px', display: 'flex', gap: 6 }}>
              <input
                autoFocus
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { onRenameGroup(group.id, renameVal); setRenaming(false); }
                  if (e.key === 'Escape') setRenaming(false);
                }}
                style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid #90CAF9', fontSize: 12 }}
              />
              <button onClick={() => { onRenameGroup(group.id, renameVal); setRenaming(false); }}
                style={{ padding: '4px 8px', background: '#1976D2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>✓</button>
            </div>
          ) : (
            <div style={{ padding: '6px 14px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#7B1FA2', flex: 1 }}>⬡ {group.name}</span>
              <span onClick={() => { setRenameVal(group.name); setRenaming(true); }}
                style={{ fontSize: 11, color: '#999', cursor: 'pointer' }}>rename</span>
            </div>
          )}
          <MenuSep />
        </>
      )}

      {hitId && <MenuItem onClick={onCopy}>⎘ Copy{selCount > 1 ? ` (${selCount})` : ''}</MenuItem>}

      <MenuSep />

      {canGroup && !inGroup && <MenuItem onClick={onGroup}>⬡ Group selected ({selCount})</MenuItem>}
      {inGroup && <MenuItem onClick={() => onUngroup(group.id)}>⬡ Ungroup "{group.name}"</MenuItem>}

      {/* Show all groups the selection touches */}
      {groups.filter((g) => g.id !== group?.id && g.itemIds.some((id) => selectedIds.includes(id))).map((g) => (
        <MenuItem key={g.id} onClick={() => onUngroup(g.id)}>⬡ Ungroup "{g.name}"</MenuItem>
      ))}

      <MenuSep />

      {isLocked
        ? <MenuItem onClick={onUnlock}>🔓 Unlock</MenuItem>
        : <MenuItem onClick={onLock}>🔒 Lock</MenuItem>
      }

      <MenuSep />

      {inGroup && <MenuItem danger onClick={() => onDeleteGroup(group.id)}>✕ Delete group + items</MenuItem>}
      <MenuItem danger disabled={isLocked} onClick={isLocked ? undefined : onDelete}>
        ✕ Delete{selCount > 1 ? ` (${selCount})` : ''}
      </MenuItem>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const FloorPlanEditor = ({ isDark = false }) => {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);

  // ── Canvas theme — all drawing colours in one place ─────────────────────────
  const CTHEME = {
    canvasBg:      isDark ? '#1a2332'                   : '#DCDCDC',
    grid1:         isDark ? 'rgba(255,255,255,0.04)'    : 'rgba(0,0,0,0.055)',
    grid2:         isDark ? 'rgba(255,255,255,0.07)'    : 'rgba(0,0,0,0.10)',
    grid3:         isDark ? 'rgba(255,255,255,0.13)'    : 'rgba(0,0,0,0.18)',
    gridAxis:      isDark ? 'rgba(255,255,255,0.18)'    : 'rgba(0,0,0,0.22)',
    scaleBg:       isDark ? 'rgba(15,23,42,0.85)'       : 'rgba(255,255,255,0.82)',
    scaleStroke:   isDark ? '#475569'                   : '#555',
    scaleText:     isDark ? '#94a3b8'                   : '#333',
    roomLabel:     isDark ? 'rgba(255,255,255,0.75)'    : 'rgba(0,0,0,0.45)',
    compassBg:     isDark ? 'rgba(15,23,42,0.85)'       : 'rgba(255,255,255,0.85)',
    compassBorder: isDark ? 'rgba(255,255,255,0.15)'    : 'rgba(0,0,0,0.18)',
    furnSymbol:    isDark ? 'rgba(255,255,255,0.3)'     : 'rgba(0,0,0,0.25)',
  };

  const [scale, setScale]           = useState(() => { const c = useFloorPlannerStore.getState().editorCamera; return c?.scale ?? 1.2; });
  const [offset, setOffset]         = useState(() => { const c = useFloorPlannerStore.getState().editorCamera; return c ? { x: c.offsetX, y: c.offsetY } : { x: 180, y: 120 }; });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Mutable refs for event handlers (avoid stale closures)
  const scaleRef       = useRef(scale);
  const offsetRef      = useRef(offset);
  const drawRef        = useRef(null);    // room draw: { startX, startY, curX, curY }
  const wallDrawRef    = useRef(null);    // wall draw: { x1, y1, x2, y2 }
  const wallSnapRef    = useRef(null);    // current snap point { x, y, kind } for draw indicator
  const dragRef        = useRef(null);    // active drag state
  const panRef         = useRef(null);    // pan state
  const hoverRef       = useRef(null);    // furniture hover position
  const doorHoverRef   = useRef(null);    // door placement preview
  const boxSelectRef    = useRef(null);    // box-select drag: { startSX, startSY, curSX, curSY, additive }
  const hoverHandleRef  = useRef(null);    // handle corner/edge key the mouse is hovering ('nw', 'n', …)
  const hoverGroupRef   = useRef(false);   // true when mouse is over empty area inside a group rect

  const hoverWallEpRef  = useRef(false);   // true when hovering over a wall endpoint
  const hoverRotateRef  = useRef(false);   // true when hovering over rotation handle
  const alignGuidesRef  = useRef([]);      // alignment guides: [{ axis:'x'|'y', value, kind }]
  const miniCanvasRef   = useRef(null);    // mini-map canvas
  const [renderTick, forceRender] = useState(0);

  scaleRef.current  = scale;
  offsetRef.current = offset;

  // Persist camera to store so it survives 2D ↔ 3D view switches
  useEffect(() => {
    setEditorCamera({ scale, offsetX: offset.x, offsetY: offset.y });
  }, [scale, offset.x, offset.y]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    rooms, furniture, doors, walls, groups,
    selectedIds, lockedIds,
    activeTool, activeFurnitureDef,
    showHeatmap, gridSize,
    editorCamera, setEditorCamera,
    addRoom, updateRoom,
    addFurniture, updateFurniture,
    addDoor, updateDoor,
    addWall, updateWall,
    selectOne, selectAdd, setSelectedIds, clearSelection,
    deleteSelected,
    setActiveTool,
    undo, redo, rotateSelectedFurniture,
    copySelected, pasteClipboard,
    groupSelected, ungroupSelected, deleteGroup, ungroupIds, renameGroup,
  } = useFloorPlannerStore();

  const [contextMenu, setContextMenu] = useState(null); // { x, y, kind, groupId? }

  // Convenience: first selected ID (for single-item operations like resize handles)
  const selectedId = selectedIds[0] ?? null;

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
      const newScale = Math.max(0.05, Math.min(5, scaleRef.current * factor));
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

  // ── Mini-map ──────────────────────────────────────────────────────────────────
  const MINI_W = 210, MINI_H = 158;
  useEffect(() => {
    const mc = miniCanvasRef.current;
    if (!mc) return;
    const ctx = mc.getContext('2d');
    ctx.clearRect(0, 0, MINI_W, MINI_H);

    // Background
    ctx.fillStyle = 'rgba(18,18,28,0.86)';
    ctx.fillRect(0, 0, MINI_W, MINI_H);

    // Gather all content bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const expand = (x, y) => { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); };
    rooms.forEach((r) => {
      if (r.polygon) r.polygon.forEach((v) => expand(v.x, v.y));
      else { expand(r.x, r.y); expand(r.x + r.width, r.y + r.height); }
    });
    walls.forEach((w) => { expand(w.x1, w.y1); expand(w.x2, w.y2); });
    furniture.forEach((f) => { expand(f.x, f.y); expand(f.x + f.width, f.y + f.depth); });

    const hasContent = isFinite(minX);
    if (!hasContent) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('No content', MINI_W / 2, MINI_H / 2);
      return;
    }

    const pad = 0.8;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    const cW = maxX - minX, cH = maxY - minY;
    const ipad = 10;
    const ms = Math.min((MINI_W - ipad * 2) / cW, (MINI_H - ipad * 2) / cH);
    const ox = ipad + ((MINI_W - ipad * 2) - cW * ms) / 2;
    const oy = ipad + ((MINI_H - ipad * 2) - cH * ms) / 2;
    const mX = (wx) => (wx - minX) * ms + ox;
    const mY = (wy) => (wy - minY) * ms + oy;

    // Draw rooms
    rooms.forEach((r) => {
      ctx.fillStyle = r.floorColor || '#e8dfd0';
      if (r.polygon && r.polygon.length >= 3) {
        ctx.beginPath();
        r.polygon.forEach((v, i) => { i === 0 ? ctx.moveTo(mX(v.x), mY(v.y)) : ctx.lineTo(mX(v.x), mY(v.y)); });
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = r.wallColor || '#555'; ctx.lineWidth = Math.max(0.8, (r.wallThickness || 0.15) * ms);
        ctx.stroke();
      } else {
        ctx.fillRect(mX(r.x), mY(r.y), r.width * ms, r.height * ms);
        ctx.strokeStyle = r.wallColor || '#555'; ctx.lineWidth = Math.max(0.8, (r.wallThickness || 0.15) * ms);
        ctx.strokeRect(mX(r.x), mY(r.y), r.width * ms, r.height * ms);
      }
    });

    // Draw freestanding walls
    walls.forEach((w) => {
      ctx.strokeStyle = w.color || '#444'; ctx.lineWidth = Math.max(1, (w.thickness || 0.15) * ms);
      ctx.beginPath(); ctx.moveTo(mX(w.x1), mY(w.y1)); ctx.lineTo(mX(w.x2), mY(w.y2)); ctx.stroke();
    });

    // Draw furniture as small dots
    furniture.forEach((f) => {
      ctx.fillStyle = f.color || '#b08060';
      ctx.fillRect(mX(f.x), mY(f.y), Math.max(2, f.width * ms), Math.max(2, f.depth * ms));
    });

    // Viewport rectangle — shows which part of the world is currently on screen
    const vpX = -offsetRef.current.x / (PPM * scaleRef.current);
    const vpY = -offsetRef.current.y / (PPM * scaleRef.current);
    const vpW = canvasSize.width  / (PPM * scaleRef.current);
    const vpH = canvasSize.height / (PPM * scaleRef.current);
    ctx.strokeStyle = 'rgba(96,180,255,0.95)'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
    ctx.strokeRect(mX(vpX), mY(vpY), vpW * ms, vpH * ms);
    ctx.fillStyle = 'rgba(96,180,255,0.07)';
    ctx.fillRect(mX(vpX), mY(vpY), vpW * ms, vpH * ms);

    // Border
    ctx.strokeStyle = 'rgba(96,180,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.strokeRect(0.5, 0.5, MINI_W - 1, MINI_H - 1);

    // Label
    ctx.fillStyle = 'rgba(140,180,255,0.7)'; ctx.font = '9px sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('OVERVIEW', 6, 5);
  }, [rooms, walls, furniture, scale, offset, canvasSize, renderTick]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); copySelected(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); pasteClipboard(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); copySelected(); pasteClipboard(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
      else if (e.key === 'Escape') {
        clearSelection();
        drawRef.current     = null;
        dragRef.current     = null;
        wallDrawRef.current = null;
        panRef.current      = null;
        alignGuidesRef.current = [];
        wallSnapRef.current = null;
        setActiveTool('select');
        forceRender((n) => n + 1);
      }
      else if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey) rotateSelectedFurniture(90);
      else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const { rooms: rs, furniture: furn, lockedIds: locked } = useFloorPlannerStore.getState();
        const all = [...rs, ...furn].map((x) => x.id).filter((id) => !locked.includes(id));
        setSelectedIds(all);
      }
      else if (e.key === 'g' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault(); groupSelected();
      }
      else if (e.key === 'g' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault(); ungroupSelected();
      }
      // ── Arrow key nudge: 1/5 grid = 0.2 m per press ──
      else if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
        const { selectedIds: ids, lockedIds: locked,
                rooms: rs, furniture: furn, doors: ds } = useFloorPlannerStore.getState();
        if (!ids.length) return;
        e.preventDefault();

        const STEP = 0.1; // 1/10 of 1 m grid
        const dx = e.key === 'ArrowLeft' ? -STEP : e.key === 'ArrowRight' ? STEP : 0;
        const dy = e.key === 'ArrowUp'   ? -STEP : e.key === 'ArrowDown'  ? STEP : 0;

        useFloorPlannerStore.getState()._pushHistory();

        const { walls: ws2 } = useFloorPlannerStore.getState();
        for (const id of ids) {
          if (locked.includes(id)) continue;

          // Room
          const room = rs.find((r) => r.id === id);
          if (room) {
            const nx = snapVal(room.x + dx), ny = snapVal(room.y + dy);
            if (room.polygon) {
              const fdx = nx - room.x, fdy = ny - room.y;
              updateRoom(id, { x: nx, y: ny, polygon: room.polygon.map((v) => ({ x: v.x + fdx, y: v.y + fdy })) });
            } else {
              updateRoom(id, { x: nx, y: ny });
            }
            continue;
          }

          // Furniture
          const furn2 = furn.find((f) => f.id === id);
          if (furn2) {
            updateFurniture(id, { x: snapVal(furn2.x + dx), y: snapVal(furn2.y + dy) });
            continue;
          }

          // Freestanding wall
          const wall2 = ws2 && ws2.find((w) => w.id === id);
          if (wall2) {
            updateWall(id, { x1: snapVal(wall2.x1 + dx), y1: snapVal(wall2.y1 + dy),
                             x2: snapVal(wall2.x2 + dx), y2: snapVal(wall2.y2 + dy) });
            continue;
          }

          // Door — slide along its wall axis
          const door = ds.find((d) => d.id === id);
          if (door) {
            if (door.roomId) {
              const room2 = rs.find((r) => r.id === door.roomId);
              if (!room2) continue;
              const isHoriz = door.wall === 'north' || door.wall === 'south';
              const wallLen = isHoriz ? room2.width : room2.height;
              const delta   = isHoriz ? dx : dy;
              const newOff  = Math.max(0, Math.min(wallLen - door.width, snapVal(door.offset + delta)));
              updateDoor(id, { offset: newOff });
            } else if (door.wallId) {
              const fw = ws2 && ws2.find((w) => w.id === door.wallId);
              if (!fw) continue;
              const fwLen = Math.hypot(fw.x2 - fw.x1, fw.y2 - fw.y1);
              if (fwLen < 0.01) continue;
              const dirX = (fw.x2 - fw.x1) / fwLen, dirY = (fw.y2 - fw.y1) / fwLen;
              const newOff = Math.max(0, Math.min(fwLen - door.width, snapVal(door.offset + dx * dirX + dy * dirY)));
              updateDoor(id, { offset: newOff });
            }
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, deleteSelected, clearSelection, rotateSelectedFurniture, setSelectedIds, copySelected, pasteClipboard, updateRoom, updateFurniture, updateWall, updateDoor, groupSelected, ungroupSelected, setActiveTool]);

  // ── Draw canvas ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvasSize;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = CTHEME.canvasBg;
    ctx.fillRect(0, 0, width, height);

    drawGrid(ctx, width, height);
    rooms.forEach((room) => drawRoom(ctx, room, selectedIds.includes(room.id)));
    if (showHeatmap) drawHeatmap(ctx);
    doors.forEach((door) => {
      const room = rooms.find((r) => r.id === door.roomId);
      if (!room) return;
      const roomRot = (room.rotation || 0) * Math.PI / 180;
      drawDoorSymbol(ctx, door, room, selectedIds.includes(door.id), roomRot);
    });
    // Freestanding walls
    walls.forEach((w) => drawFWWall(ctx, w, selectedIds.includes(w.id)));
    doors.forEach((door) => {
      if (!door.wallId) return;
      const fw = walls.find((w) => w.id === door.wallId);
      if (fw) drawFWDoor(ctx, door, fw, selectedIds.includes(door.id));
    });
    furniture.forEach((item) => drawFurniture(ctx, item, selectedIds.includes(item.id)));
    // Group outlines drawn LAST so they appear on top of rooms and furniture
    groups.forEach((group) => drawGroupOutline(ctx, group));

    // Room draw preview — green highlight + live dimensions
    const ds = drawRef.current;
    if (ds) {
      const rx = Math.min(ds.startX, ds.curX), ry = Math.min(ds.startY, ds.curY);
      const rw = Math.abs(ds.curX - ds.startX), rh = Math.abs(ds.curY - ds.startY);
      if (rw > 0 && rh > 0) {
        const sp = toScreen(rx, ry);
        const sw = rw * PPM * scale, sh = rh * PPM * scale;

        // Green fill
        ctx.fillStyle = 'rgba(56,142,60,0.13)';
        ctx.fillRect(sp.x, sp.y, sw, sh);

        // Green border
        ctx.strokeStyle = '#388E3C'; ctx.lineWidth = 2;
        ctx.setLineDash([7, 4]); ctx.strokeRect(sp.x, sp.y, sw, sh); ctx.setLineDash([]);

        // Area label in centre
        if (sw > 60 && sh > 30) {
          const area = (rw * rh).toFixed(2);
          ctx.fillStyle = '#1B5E20';
          ctx.font = `bold ${Math.max(12, 13 * scale)}px sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(`${rw.toFixed(2)} × ${rh.toFixed(2)} m  (${area} m²)`, sp.x + sw / 2, sp.y + sh / 2);
        }

        // Width dimension above
        const dimFont = `${Math.max(10, 11 * scale)}px sans-serif`;
        ctx.fillStyle = '#388E3C'; ctx.font = dimFont;
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(`${rw.toFixed(2)} m`, sp.x + sw / 2, sp.y - 4);

        // Height dimension to the left (rotated)
        ctx.save();
        ctx.translate(sp.x - 4, sp.y + sh / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(`${rh.toFixed(2)} m`, 0, 0);
        ctx.restore();
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

    // Door placement preview (room wall)
    const dh = doorHoverRef.current;
    if (activeTool === 'door' && dh && dh.room) {
      const previewDoor = { id: '__preview__', width: DEFAULT_DOOR_WIDTH, openAngle: 90, hingeSide: 'left', swingIn: true, ...dh };
      ctx.globalAlpha = 0.6;
      drawDoorSymbol(ctx, previewDoor, dh.room, false, (dh.room.rotation || 0) * Math.PI / 180);
      ctx.globalAlpha = 1;
    }
    // Door placement preview (freestanding wall)
    if (activeTool === 'door' && dh && dh.fwWall) {
      ctx.globalAlpha = 0.6;
      drawFWDoor(ctx, { id: '__preview__', width: DEFAULT_DOOR_WIDTH, openAngle: 90, hingeSide: 'left', offset: dh.offset }, dh.fwWall, false);
      ctx.globalAlpha = 1;
    }

    // Freestanding wall draw preview
    const wd = wallDrawRef.current;
    if (wd) {
      const sp1 = toScreen(wd.x1, wd.y1), sp2 = toScreen(wd.x2, wd.y2);
      const thickness = 0.05 * PPM * scale;
      ctx.strokeStyle = '#1565C0';
      ctx.lineWidth   = Math.max(2, thickness);
      ctx.lineCap     = 'square';
      ctx.setLineDash([8, 5]);
      ctx.beginPath(); ctx.moveTo(sp1.x, sp1.y); ctx.lineTo(sp2.x, sp2.y); ctx.stroke();
      ctx.setLineDash([]);
      // Start + end endpoint dots
      for (const pt of [sp1, sp2]) {
        ctx.fillStyle = '#1565C0';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2); ctx.fill();
      }
      // Length label
      const len = Math.hypot(wd.x2 - wd.x1, wd.y2 - wd.y1);
      if (len > 0.2) {
        const mx = (sp1.x + sp2.x) / 2, my = (sp1.y + sp2.y) / 2;
        ctx.fillStyle = '#1565C0';
        ctx.font = `bold ${Math.max(11, 12 * scale)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(`${len.toFixed(2)} m`, mx, my - 6);
      }
    }

    // Alignment guides (room-to-room snap lines)
    const guides = alignGuidesRef.current;
    if (guides && guides.length > 0) {
      ctx.save();
      for (const g of guides) {
        const isEdge  = g.kind === 'edge';
        const isAlign = g.kind === 'align';
        ctx.strokeStyle = isAlign ? '#F44336' : isEdge ? '#43A047' : '#00BCD4';
        ctx.lineWidth   = isAlign ? 1 : isEdge ? 1.5 : 1;
        ctx.globalAlpha = isAlign ? 0.85 : 1;
        ctx.setLineDash(isEdge ? [6, 3] : [4, 4]);
        if (isAlign) ctx.setLineDash([]);

        if (g.axis === 'x') {
          const sx2 = toScreen(g.value, 0).x;
          ctx.beginPath(); ctx.moveTo(sx2, 0); ctx.lineTo(sx2, height); ctx.stroke();
          // Align: small dots at the two aligned points
          if (isAlign && g.refPt && g.dragPt) {
            ctx.setLineDash([]);
            ctx.fillStyle = '#F44336';
            for (const pt of [g.refPt, g.dragPt]) {
              const sp = toScreen(pt.x, pt.y);
              ctx.beginPath(); ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2); ctx.fill();
            }
          }
          // Diamond marker at centre
          if (isEdge) {
            ctx.setLineDash([]);
            ctx.fillStyle = '#43A047';
            ctx.beginPath();
            ctx.moveTo(sx2, height / 2 - 7); ctx.lineTo(sx2 + 7, height / 2);
            ctx.lineTo(sx2, height / 2 + 7); ctx.lineTo(sx2 - 7, height / 2);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#43A047';
            ctx.font = `bold ${Math.max(9, 10 * scale)}px sans-serif`;
            ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
            ctx.fillText('Edge', sx2 + 10, height / 2 - 2);
          }
        } else {
          const sy2 = toScreen(0, g.value).y;
          ctx.beginPath(); ctx.moveTo(0, sy2); ctx.lineTo(width, sy2); ctx.stroke();
          if (isAlign && g.refPt && g.dragPt) {
            ctx.setLineDash([]);
            ctx.fillStyle = '#F44336';
            for (const pt of [g.refPt, g.dragPt]) {
              const sp = toScreen(pt.x, pt.y);
              ctx.beginPath(); ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2); ctx.fill();
            }
          }
          if (isEdge) {
            ctx.setLineDash([]);
            ctx.fillStyle = '#43A047';
            ctx.beginPath();
            ctx.moveTo(width / 2 - 7, sy2); ctx.lineTo(width / 2, sy2 - 7);
            ctx.lineTo(width / 2 + 7, sy2); ctx.lineTo(width / 2, sy2 + 7);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#43A047';
            ctx.font = `bold ${Math.max(9, 10 * scale)}px sans-serif`;
            ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
            ctx.fillText('Edge', width / 2 + 10, sy2 - 2);
          }
        }

        // Draw a thick highlight along the snapping face segment
        if (isEdge && g.faceS && g.faceE) {
          const fp1 = toScreen(g.faceS.x, g.faceS.y);
          const fp2 = toScreen(g.faceE.x, g.faceE.y);
          ctx.setLineDash([]);
          ctx.strokeStyle = '#43A047';
          ctx.lineWidth   = 3;
          ctx.beginPath(); ctx.moveTo(fp1.x, fp1.y); ctx.lineTo(fp2.x, fp2.y); ctx.stroke();
          // Small tick marks at each end
          ctx.lineWidth = 2;
          const dx = fp2.x - fp1.x, dy = fp2.y - fp1.y;
          const len = Math.hypot(dx, dy);
          if (len > 0.1) {
            const px = -dy / len * 6, py = dx / len * 6;
            for (const [ex, ey] of [[fp1.x, fp1.y], [fp2.x, fp2.y]]) {
              ctx.beginPath(); ctx.moveTo(ex - px, ey - py); ctx.lineTo(ex + px, ey + py); ctx.stroke();
            }
          }
        }
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // (Selection overlay — drawn at end of render loop, after compass)

    // Wall snap indicator — orange ring + crosshair at snap point
    const ws = wallSnapRef.current;
    if (ws && (activeTool === 'wall' || dragRef.current?.type === 'wall-ep' || dragRef.current?.type === 'wall')) {
      const sp = toScreen(ws.x, ws.y);
      const snapColor = ws.kind === 'corner' ? '#FF6D00' : ws.kind === 'endpoint' ? '#AA00FF' : '#00897B';
      const r = 8;
      ctx.strokeStyle = snapColor;
      ctx.lineWidth   = 2;
      ctx.beginPath(); ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2); ctx.stroke();
      // Crosshair
      ctx.beginPath();
      ctx.moveTo(sp.x - r * 1.6, sp.y); ctx.lineTo(sp.x + r * 1.6, sp.y);
      ctx.moveTo(sp.x, sp.y - r * 1.6); ctx.lineTo(sp.x, sp.y + r * 1.6);
      ctx.stroke();
      // Label
      const label = ws.kind === 'corner' ? 'Corner' : ws.kind === 'endpoint' ? 'Endpoint' : 'Wall';
      ctx.fillStyle = snapColor;
      ctx.font = `bold ${Math.max(9, 10 * scale)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(label, sp.x, sp.y - r - 3);
    }

    // Box-select rectangle
    const bs = boxSelectRef.current;
    if (bs) {
      const minSX = Math.min(bs.startSX, bs.curSX);
      const minSY = Math.min(bs.startSY, bs.curSY);
      const bsW   = Math.abs(bs.curSX - bs.startSX);
      const bsH   = Math.abs(bs.curSY - bs.startSY);
      ctx.fillStyle   = 'rgba(33,150,243,0.08)';
      ctx.fillRect(minSX, minSY, bsW, bsH);
      ctx.strokeStyle = '#2196F3';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(minSX, minSY, bsW, bsH);
      ctx.setLineDash([]);
    }

    // North compass — fixed top-right corner
    {
      const cx = width - 28, cy = 36, r = 16;
      ctx.save();
      // Outer ring
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = CTHEME.compassBg;
      ctx.fill();
      ctx.strokeStyle = CTHEME.compassBorder; ctx.lineWidth = 1;
      ctx.stroke();
      // Arrow pointing up (north)
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(cx, cy - r + 3);
      ctx.lineTo(cx - 4, cy + 2);
      ctx.lineTo(cx, cy - 1);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.moveTo(cx, cy + r - 3);
      ctx.lineTo(cx + 4, cy - 2);
      ctx.lineTo(cx, cy + 1);
      ctx.closePath(); ctx.fill();
      // N label
      ctx.fillStyle = '#EF4444';
      ctx.font = `bold ${Math.max(8, 9 * scale)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('N', cx, cy - r - 7);
      ctx.restore();
    }

    // ══ SELECTION OVERLAY — drawn last so handles are always on top ══════════
    const drawRotateHandleAt = (rhx, rhy, topCX, topCY, isHot) => {
      // Stem
      ctx.beginPath(); ctx.moveTo(topCX, topCY); ctx.lineTo(rhx, rhy);
      ctx.strokeStyle = isHot ? '#0D47A1' : '#1976D2';
      ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
      // Outer ring
      ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = isHot ? 8 : 4;
      ctx.fillStyle   = isHot ? '#1565C0' : '#1976D2';
      ctx.beginPath(); ctx.arc(rhx, rhy, HANDLE_CORNER + 3, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur  = 0;
      ctx.strokeStyle = isHot ? '#0D47A1' : 'rgba(255,255,255,0.7)';
      ctx.lineWidth   = isHot ? 2 : 1.5;
      ctx.beginPath(); ctx.arc(rhx, rhy, HANDLE_CORNER + 3, 0, Math.PI * 2); ctx.stroke();
      // ↻ arrow icon (white)
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(rhx, rhy, 4.5, -Math.PI * 0.75, Math.PI * 0.5); ctx.stroke();
      const ta = Math.PI * 0.5;
      const ax = rhx + 4.5 * Math.cos(ta), ay = rhy + 4.5 * Math.sin(ta);
      ctx.beginPath(); ctx.moveTo(ax - 3, ay - 1); ctx.lineTo(ax, ay); ctx.lineTo(ax - 1, ay + 3); ctx.stroke();
    };

    if (selectedIds.length === 1 && !lockedIds.includes(selectedId)) {
      const room = rooms.find((r) => r.id === selectedId);
      const furn = furniture.find((f) => f.id === selectedId);
      if (room) {
        const sp  = toScreen(room.x, room.y);
        const sw2 = room.width  * PPM * scale;
        const sh2 = room.height * PPM * scale;
        const rot = ((room.rotation || 0) * Math.PI) / 180;
        const rcx = sp.x + sw2 / 2, rcy = sp.y + sh2 / 2;
        if (room.polygon && room.polygon.length >= 3) {
          // Polygon room: draw vertex circles and edge-midpoint diamonds
          const hov = hoverHandleRef.current;
          const poly = room.polygon;
          const cosA = Math.cos(rot), sinA = Math.sin(rot);
          const rotPoly = (px, py) => {
            const dx = px - (room.x + room.width / 2), dy = py - (room.y + room.height / 2);
            return toScreen(
              room.x + room.width / 2 + dx * cosA - dy * sinA,
              room.y + room.height / 2 + dx * sinA + dy * cosA
            );
          };
          // Dashed outline
          ctx.beginPath();
          const p0s = rotPoly(poly[0].x, poly[0].y);
          ctx.moveTo(p0s.x, p0s.y);
          for (let i = 1; i < poly.length; i++) {
            const ps = rotPoly(poly[i].x, poly[i].y);
            ctx.lineTo(ps.x, ps.y);
          }
          ctx.closePath();
          ctx.strokeStyle = '#1976D2'; ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
          // Vertex handles (circles)
          for (let i = 0; i < poly.length; i++) {
            const ps = rotPoly(poly[i].x, poly[i].y);
            const isHot = hov === `v${i}`;
            ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = isHot ? 6 : 3;
            ctx.fillStyle = isHot ? '#1976D2' : '#fff';
            ctx.beginPath(); ctx.arc(ps.x, ps.y, HANDLE_CORNER, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = isHot ? '#0D47A1' : '#1976D2'; ctx.lineWidth = isHot ? 2.5 : 2;
            ctx.beginPath(); ctx.arc(ps.x, ps.y, HANDLE_CORNER, 0, Math.PI * 2); ctx.stroke();
          }
          // Edge-midpoint handles (diamonds)
          for (let i = 0; i < poly.length; i++) {
            const j = (i + 1) % poly.length;
            const mx = (poly[i].x + poly[j].x) / 2, my = (poly[i].y + poly[j].y) / 2;
            const ms = rotPoly(mx, my);
            const isHot = hov === `e${i}`;
            const hs = HANDLE_EDGE + 1;
            ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = isHot ? 5 : 2;
            ctx.fillStyle = isHot ? '#1976D2' : '#fff';
            ctx.beginPath();
            ctx.moveTo(ms.x, ms.y - hs); ctx.lineTo(ms.x + hs, ms.y);
            ctx.lineTo(ms.x, ms.y + hs); ctx.lineTo(ms.x - hs, ms.y);
            ctx.closePath(); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = isHot ? '#0D47A1' : '#1976D2'; ctx.lineWidth = isHot ? 2.5 : 1.5;
            ctx.beginPath();
            ctx.moveTo(ms.x, ms.y - hs); ctx.lineTo(ms.x + hs, ms.y);
            ctx.lineTo(ms.x, ms.y + hs); ctx.lineTo(ms.x - hs, ms.y);
            ctx.closePath(); ctx.stroke();
          }
          ctx.shadowBlur = 0;
        } else {
          ctx.save();
          if (rot) { ctx.translate(rcx, rcy); ctx.rotate(rot); ctx.translate(-sw2 / 2, -sh2 / 2); }
          else     { ctx.translate(sp.x, sp.y); }
          drawHandles(ctx, 0, 0, sw2, sh2);
          ctx.restore();
        }
        // Rotation handle
        const { rhx, rhy } = getRotateHandleScreen(room);
        const tcx = rcx - (sh2 / 2) * Math.sin(rot);
        const tcy = rcy - (sh2 / 2) * Math.cos(rot);
        drawRotateHandleAt(rhx, rhy, tcx, tcy, hoverRotateRef.current);
      }
      if (furn) {
        const sp  = toScreen(furn.x, furn.y);
        const sw2 = furn.width * PPM * scale;
        const sd2 = furn.depth * PPM * scale;
        const rot = ((furn.rotation || 0) * Math.PI) / 180;
        const fcx = sp.x + sw2 / 2, fcy = sp.y + sd2 / 2;
        // Draw resize handles in rotated context
        ctx.save();
        ctx.translate(fcx, fcy); ctx.rotate(rot); ctx.translate(-sw2 / 2, -sd2 / 2);
        drawHandles(ctx, 0, 0, sw2, sd2);
        ctx.restore();
        // Rotation handle above top-center (screen space)
        const { rhx, rhy } = getRotateHandleScreen(furn);
        // Rotated top-center: rotate (0, -sd2/2) around item center
        const tcx = fcx - (sd2 / 2) * Math.sin(rot);
        const tcy = fcy - (sd2 / 2) * Math.cos(rot);
        drawRotateHandleAt(rhx, rhy, tcx, tcy, hoverRotateRef.current);
      }
    }

    if (selectedIds.length > 1) {
      const bbox = getMultiSelectBBox();
      if (bbox) {
        const sp1 = toScreen(bbox.x1, bbox.y1);
        const sp2 = toScreen(bbox.x2, bbox.y2);
        const mw = sp2.x - sp1.x, mh = sp2.y - sp1.y;
        const hov = hoverHandleRef.current;
        // Dashed bounding rect
        ctx.strokeStyle = '#1976D2'; ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]); ctx.strokeRect(sp1.x, sp1.y, mw, mh); ctx.setLineDash([]);
        // Handles
        const handles = [
          { key: 'nw', hx: sp1.x,       hy: sp1.y },
          { key: 'ne', hx: sp2.x,       hy: sp1.y },
          { key: 'se', hx: sp2.x,       hy: sp2.y },
          { key: 'sw', hx: sp1.x,       hy: sp2.y },
          { key: 'n',  hx: sp1.x+mw/2,  hy: sp1.y },
          { key: 's',  hx: sp1.x+mw/2,  hy: sp2.y },
          { key: 'w',  hx: sp1.x,       hy: sp1.y+mh/2 },
          { key: 'e',  hx: sp2.x,       hy: sp1.y+mh/2 },
        ];
        const corners = ['nw','ne','se','sw'];
        for (const { key, hx, hy } of handles) {
          const isHot = hov === key;
          if (corners.includes(key)) {
            const hs = HANDLE_CORNER;
            ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = isHot ? 6 : 3;
            ctx.fillStyle = isHot ? '#1976D2' : '#fff';
            ctx.beginPath(); ctx.roundRect?.(hx-hs, hy-hs, hs*2, hs*2, 3) || ctx.rect(hx-hs, hy-hs, hs*2, hs*2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = isHot ? '#0D47A1' : '#1976D2'; ctx.lineWidth = isHot ? 2.5 : 2;
            ctx.beginPath(); ctx.roundRect?.(hx-hs, hy-hs, hs*2, hs*2, 3) || ctx.rect(hx-hs, hy-hs, hs*2, hs*2); ctx.stroke();
          } else {
            const r = HANDLE_EDGE;
            ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = isHot ? 5 : 2;
            ctx.fillStyle = isHot ? '#1976D2' : '#fff';
            ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = isHot ? '#0D47A1' : '#1976D2'; ctx.lineWidth = isHot ? 2.5 : 1.5;
            ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.stroke();
          }
        }
        ctx.shadowBlur = 0;
        // Rotation handle above top-center of bbox
        const bboxCX = sp1.x + mw / 2;
        const rhx2 = bboxCX;
        const rhy2 = sp1.y - ROTATE_HANDLE_OFFSET;
        drawRotateHandleAt(rhx2, rhy2, bboxCX, sp1.y, hoverRotateRef.current);
      }
    }
    // ════════════════════════════════════════════════════════════════════════

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, furniture, doors, walls, groups, selectedIds, lockedIds, canvasSize, scale, offset, activeTool, activeFurnitureDef, showHeatmap, gridSize, renderTick]);

  // ── Group outline ─────────────────────────────────────────────────────────
  const drawGroupOutline = (ctx, group) => {
    const sc  = scaleRef.current;
    // Compute bounding box over all items in the group
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasAny = false;
    for (const id of group.itemIds) {
      const r = rooms.find((x) => x.id === id);
      const f = furniture.find((x) => x.id === id);
      const item = r || f;
      if (!item) continue;
      hasAny = true;
      const iw = item.width, ih = r ? item.height : item.depth;
      minX = Math.min(minX, item.x);       minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + iw);  maxY = Math.max(maxY, item.y + ih);
    }
    if (!hasAny) return;

    const PAD = 0.18; // world-space padding around group
    const sp  = toScreen(minX - PAD, minY - PAD);
    const ep  = toScreen(maxX + PAD, maxY + PAD);
    const sw  = ep.x - sp.x, sh = ep.y - sp.y;
    const R   = 8; // corner radius px

    // Check if all group items are selected
    const allSel = group.itemIds.every((id) => selectedIds.includes(id));
    const color  = allSel ? '#7B1FA2' : '#9C27B0';

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([6 * sc, 4 * sc]);
    ctx.beginPath();
    ctx.roundRect?.(sp.x, sp.y, sw, sh, R) || ctx.rect(sp.x, sp.y, sw, sh);
    ctx.stroke();
    ctx.setLineDash([]);

    // Fill tint
    ctx.fillStyle = allSel ? 'rgba(123,31,162,0.07)' : 'rgba(156,39,176,0.04)';
    ctx.beginPath();
    ctx.roundRect?.(sp.x, sp.y, sw, sh, R) || ctx.rect(sp.x, sp.y, sw, sh);
    ctx.fill();

    // Group name label top-left
    const fontSize = Math.max(9, 10 * sc);
    ctx.fillStyle  = color;
    ctx.font       = `600 ${fontSize}px sans-serif`;
    ctx.textAlign  = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(group.name, sp.x + 6, sp.y - 3);

    ctx.restore();
  };

  // ── Heatmap helpers ──────────────────────────────────────────────────────────
  // Simple 4-stop scale used by the Properties panel slider indicator only
  const heatColor = (v) => {
    if (v < 40)  return { r: 76,  g: 175, b: 80  };
    if (v < 65)  return { r: 255, g: 193, b: 7   };
    if (v < 80)  return { r: 230, g: 81,  b: 0   };
    return             { r: 198, g: 40,  b: 40  };
  };

  // Full thermal-camera palette: deep purple (cold) → blue → cyan → green → yellow → orange → red → white (hot)
  const thermalColor = (v) => {
    const t = Math.max(0, Math.min(100, v)) / 100;
    const stops = [
      [0.00, [15,  0,   50 ]],
      [0.18, [0,   0,   210]],
      [0.38, [0,   185, 225]],
      [0.54, [0,   210, 60 ]],
      [0.68, [255, 230, 0  ]],
      [0.80, [255, 110, 0  ]],
      [0.91, [255, 20,  0  ]],
      [1.00, [255, 255, 210]],
    ];
    let i = 0;
    while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    const f = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
    return {
      r: Math.round(c0[0] + f * (c1[0] - c0[0])),
      g: Math.round(c0[1] + f * (c1[1] - c0[1])),
      b: Math.round(c0[2] + f * (c1[2] - c0[2])),
    };
  };

  const drawHeatmap = (ctx) => {
    const sc  = scaleRef.current;
    const off = offsetRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Offscreen canvas: thermal rendering happens here then composited ──────
    const thermal = document.createElement('canvas');
    thermal.width  = canvas.width;
    thermal.height = canvas.height;
    const tc = thermal.getContext('2d');

    // Step 1 — Dark ambient base on every room floor (thermal "cold" background)
    for (const room of rooms) {
      const wt  = (room.wallThickness || 0.05) * PPM * sc;
      const rsp = toScreen(room.x, room.y);
      const rsw = room.width  * PPM * sc;
      const rsh = room.height * PPM * sc;
      tc.fillStyle = 'rgba(12, 4, 48, 0.82)';
      tc.fillRect(rsp.x + wt / 2, rsp.y + wt / 2, rsw - wt, rsh - wt);
    }

    // Step 2 — Hot sensor plumes using screen blending (colours add like light)
    tc.globalCompositeOperation = 'screen';

    for (const item of furniture) {
      if (!item.sensors?.length) continue;
      const maxSensor = item.sensors.reduce(
        (best, s) => ((s.value ?? 0) > (best.value ?? 0) ? s : best),
        item.sensors[0],
      );
      const v = maxSensor.value ?? 0;
      if (v === 0) continue;

      const acx = item.x + item.width / 2;
      const acy = item.y + item.depth / 2;
      const room = rooms.find(
        (r) => acx >= r.x && acx <= r.x + r.width && acy >= r.y && acy <= r.y + r.height,
      );

      const cx     = acx * PPM * sc + off.x;
      const cy     = acy * PPM * sc + off.y;
      const baseR  = 1 * PPM * sc;
      const dirRad = ((maxSensor.direction ?? item.rotation ?? 0) * Math.PI) / 180;

      const { r: cr, g: cg, b: cb } = thermalColor(v);
      // Also compute the mid-range colour for a richer gradient
      const mid = thermalColor(Math.max(0, v - 30));

      tc.save();

      // Clip to room before transform
      if (room) {
        const wt  = (room.wallThickness || 0.05) * PPM * sc;
        const rsp = toScreen(room.x, room.y);
        tc.beginPath();
        tc.rect(rsp.x + wt / 2, rsp.y + wt / 2,
                room.width * PPM * sc - wt, room.height * PPM * sc - wt);
        tc.clip();
      }

      // Directional elongation
      tc.translate(cx, cy);
      tc.rotate(dirRad);
      tc.scale(1, 2.8);

      const grad = tc.createRadialGradient(0, 0, 0, 0, 0, baseR);
      grad.addColorStop(0,    `rgba(${cr},${cg},${cb},0.95)`);
      grad.addColorStop(0.25, `rgba(${cr},${cg},${cb},0.80)`);
      grad.addColorStop(0.55, `rgba(${mid.r},${mid.g},${mid.b},0.45)`);
      grad.addColorStop(1,    `rgba(${mid.r},${mid.g},${mid.b},0)`);

      tc.beginPath();
      tc.arc(0, 0, baseR, 0, Math.PI * 2);
      tc.fillStyle = grad;
      tc.fill();
      tc.restore();
    }

    // Step 3 — Composite thermal layer onto main canvas
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.drawImage(thermal, 0, 0);
    ctx.restore();
  };

  // ── Grid ────────────────────────────────────────────────────────────────────
  const drawGrid = (ctx, width, height) => {
    const sc  = scaleRef.current;
    const off = offsetRef.current;
    const gs  = gridSize || 0.05; // active snap size in metres

    const drawLines = (stepM, color, lw) => {
      const stepPx = stepM * PPM * sc;
      if (stepPx < 4) return; // too dense to draw
      ctx.strokeStyle = color; ctx.lineWidth = lw;
      const ox = ((off.x % stepPx) + stepPx) % stepPx;
      const oy = ((off.y % stepPx) + stepPx) % stepPx;
      for (let x = ox; x < width; x += stepPx)  { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
      for (let y = oy; y < height; y += stepPx)  { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y);  ctx.stroke(); }
    };

    // Tier 1 — active snap grid (e.g. 5 cm), very faint, only when zoomed in
    drawLines(gs,    CTHEME.grid1, 0.5);
    // Tier 2 — half-cell lines (0.3 m), slightly stronger
    drawLines(0.3,   CTHEME.grid2, 0.5);
    // Tier 3 — 0.6 m lines, visible at all zoom levels
    drawLines(0.6,   CTHEME.grid3, 1.0);

    // Origin axes
    ctx.strokeStyle = CTHEME.gridAxis; ctx.lineWidth = 1.5;
    if (off.x > 0 && off.x < width)  { ctx.beginPath(); ctx.moveTo(off.x, 0); ctx.lineTo(off.x, height); ctx.stroke(); }
    if (off.y > 0 && off.y < height) { ctx.beginPath(); ctx.moveTo(0, off.y); ctx.lineTo(width, off.y);  ctx.stroke(); }

    // ── Scale bar (bottom-left, just above compass area) ──────────────────
    // Pick a round bar length: 1, 2, or 5 m, whichever gives ~80-140 px wide
    const candidates = [0.5, 1, 2, 5, 10];
    let barM = 1;
    for (const c of candidates) {
      barM = c;
      if (c * PPM * sc >= 80) break;
    }
    const barPx = barM * PPM * sc;
    const bx = 18, by = height - 20;
    ctx.fillStyle = CTHEME.scaleBg;
    ctx.fillRect(bx - 4, by - 14, barPx + 8, 20);
    ctx.strokeStyle = CTHEME.scaleStroke; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by - 5); ctx.lineTo(bx, by);          // left tick
    ctx.lineTo(bx + barPx, by);                           // bar
    ctx.lineTo(bx + barPx, by - 5);                       // right tick
    ctx.stroke();
    ctx.fillStyle = CTHEME.scaleText;
    ctx.font = `bold ${Math.max(9, 10 * sc)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(barM < 1 ? `${barM * 100 | 0}cm` : `${barM}m`, bx + barPx / 2, by - 1);
  };

  // Handle sizes — larger = easier to grab
  const HANDLE_CORNER = 5;  // corner square half-size (px)
  const HANDLE_EDGE   = 4;  // edge midpoint circle radius (px)
  const ROTATE_HANDLE_OFFSET = 28; // px above top-center of item (screen space)
  const HANDLE_TOL    = 11; // hit-test tolerance in px (generous for smooth grab)

  // Cursor per handle type
  const HANDLE_CURSORS = {
    nw: 'nw-resize', ne: 'ne-resize', se: 'se-resize', sw: 'sw-resize',
    n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize',
  };

  // ── Draw all 8 handles for a selected item (screen coords) ───────────────────
  const drawHandles = (ctx, sx, sy, sw, sh) => {
    const hov = hoverHandleRef.current;

    // Corner handles
    const corners = [
      { key: 'nw', cx: sx,      cy: sy      },
      { key: 'ne', cx: sx + sw, cy: sy      },
      { key: 'se', cx: sx + sw, cy: sy + sh },
      { key: 'sw', cx: sx,      cy: sy + sh },
    ];
    for (const { key, cx, cy } of corners) {
      const isHot = hov === key;
      const hs = HANDLE_CORNER;
      // Shadow for depth
      ctx.shadowColor = 'rgba(0,0,0,0.22)';
      ctx.shadowBlur  = isHot ? 6 : 3;
      ctx.fillStyle   = isHot ? '#1976D2' : '#fff';
      ctx.beginPath();
      ctx.roundRect?.(cx - hs, cy - hs, hs * 2, hs * 2, 3) || ctx.rect(cx - hs, cy - hs, hs * 2, hs * 2);
      ctx.fill();
      ctx.shadowBlur  = 0;
      ctx.strokeStyle = isHot ? '#0D47A1' : '#1976D2';
      ctx.lineWidth   = isHot ? 2.5 : 2;
      ctx.beginPath();
      ctx.roundRect?.(cx - hs, cy - hs, hs * 2, hs * 2, 3) || ctx.rect(cx - hs, cy - hs, hs * 2, hs * 2);
      ctx.stroke();
    }

    // Edge midpoint handles (circles)
    const edges = [
      { key: 'n', cx: sx + sw / 2, cy: sy      },
      { key: 's', cx: sx + sw / 2, cy: sy + sh },
      { key: 'w', cx: sx,          cy: sy + sh / 2 },
      { key: 'e', cx: sx + sw,     cy: sy + sh / 2 },
    ];
    for (const { key, cx, cy } of edges) {
      const isHot = hov === key;
      const r = HANDLE_EDGE;
      ctx.shadowColor = 'rgba(0,0,0,0.18)';
      ctx.shadowBlur  = isHot ? 5 : 2;
      ctx.fillStyle   = isHot ? '#1976D2' : '#fff';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur  = 0;
      ctx.strokeStyle = isHot ? '#0D47A1' : '#1976D2';
      ctx.lineWidth   = isHot ? 2.5 : 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.shadowBlur = 0;
  };

  // ── Lock badge ───────────────────────────────────────────────────────────────
  const drawLockBadge = (ctx, sx, sy, sc) => {
    const s = Math.max(11, 13 * sc);
    const bx = sx - s * 0.5, by = sy - s * 0.5;
    ctx.fillStyle = 'rgba(255,152,0,0.92)';
    ctx.beginPath();
    ctx.roundRect?.(bx, by, s, s, 3) || ctx.rect(bx, by, s, s);
    ctx.fill();
    // Shackle arc
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = Math.max(1, s * 0.1);
    ctx.beginPath();
    ctx.arc(sx, by + s * 0.38, s * 0.22, Math.PI, 0);
    ctx.stroke();
    // Body rect
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx - s * 0.22, by + s * 0.44, s * 0.44, s * 0.38);
  };

  // ── Draw room — supports both rectangle and polygon shapes ──────────────────
  const drawRoom = (ctx, room, isSel) => {
    const sc  = scaleRef.current;
    const rot = ((room.rotation || 0) * Math.PI) / 180;
    const isLocked = lockedIds.includes(room.id);
    const isPoly   = room.polygon && room.polygon.length >= 3;

    // Rotate a world point around the room bbox centre (for rectangle rooms with rotation)
    const rwcx = room.x + room.width  / 2;
    const rwcy = room.y + room.height / 2;
    const cosR = Math.cos(rot), sinR = Math.sin(rot);
    const rotWP = (wx, wy) => {
      if (!rot) return { x: wx, y: wy };
      const dx = wx - rwcx, dy = wy - rwcy;
      return { x: rwcx + dx * cosR - dy * sinR, y: rwcy + dx * sinR + dy * cosR };
    };

    const wt  = (room.wallThickness || 0.15) * PPM * sc;
    const wtW = (room.wallThickness || 0.15) / 2;
    const wallColor = isSel ? '#1565C0' : room.wallColor;

    if (isPoly) {
      // ── Polygon room ──────────────────────────────────────────────────────
      const poly = room.polygon;
      const n    = poly.length;

      // Floor fill — inset polygon by wtW using simple vertex-normal inset
      // For a convex polygon this gives a clean inset; for concave it may clip
      const insetPoly = poly.map((v, i) => {
        const prev = poly[(i + n - 1) % n];
        const next = poly[(i + 1) % n];
        // edge vectors
        const e1x = v.x - prev.x, e1y = v.y - prev.y;
        const e2x = next.x - v.x, e2y = next.y - v.y;
        // inward normals (2D left normal = (-y, x) normalised)
        const l1 = Math.hypot(e1x, e1y) || 1;
        const l2 = Math.hypot(e2x, e2y) || 1;
        const n1x = -e1y / l1, n1y = e1x / l1;
        const n2x = -e2y / l2, n2y = e2x / l2;
        // bisector
        const bx = n1x + n2x, by = n1y + n2y;
        const bl = Math.hypot(bx, by) || 1;
        const dot = n1x * bx / bl + n1y * by / bl || 1;
        const dist = wtW / dot;
        return { x: v.x + bx / bl * dist, y: v.y + by / bl * dist };
      });

      const sp  = insetPoly.map((p) => toScreen(p.x, p.y));
      ctx.fillStyle = room.floorColor;
      ctx.beginPath();
      ctx.moveTo(sp[0].x, sp[0].y);
      for (let i = 1; i < sp.length; i++) ctx.lineTo(sp[i].x, sp[i].y);
      ctx.closePath();
      ctx.fill();

      // Walls — draw each polygon edge as a stroked line segment
      ctx.strokeStyle = wallColor;
      ctx.lineWidth   = wt;
      ctx.lineCap     = 'square';
      ctx.lineJoin    = 'miter';
      const screenPoly = poly.map((p) => toScreen(p.x, p.y));
      ctx.beginPath();
      ctx.moveTo(screenPoly[0].x, screenPoly[0].y);
      for (let i = 1; i < screenPoly.length; i++) ctx.lineTo(screenPoly[i].x, screenPoly[i].y);
      ctx.closePath();
      ctx.stroke();

      // Label — centred on bounding box centre, hidden while rotating
      const isRotatingPoly = dragRef.current?.type === 'rotate' || dragRef.current?.type === 'rotate-multi';
      const bb = polyBoundingBox(poly);
      const csp = toScreen(bb.x + bb.width / 2, bb.y + bb.height / 2);
      const bbSW = bb.width * PPM * sc, bbSH = bb.height * PPM * sc;
      if (!isRotatingPoly && bbSW > 50 && bbSH > 28) {
        ctx.fillStyle    = isSel ? '#1565C0' : CTHEME.roomLabel;
        ctx.font         = `${Math.max(10, 12 * sc)}px sans-serif`;
        ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(room.name, csp.x, csp.y);
      }

      if (isLocked) drawLockBadge(ctx, screenPoly[0].x, screenPoly[0].y, sc);

    } else {
      // ── Rectangle room (original path) ────────────────────────────────────
      const sp = toScreen(room.x, room.y);
      const sw = room.width  * PPM * sc;
      const sh = room.height * PPM * sc;
      const rcx = sp.x + sw / 2, rcy = sp.y + sh / 2;

      // Floor polygon
      const floorCorners = [
        rotWP(room.x + wtW, room.y + wtW),
        rotWP(room.x + room.width - wtW, room.y + wtW),
        rotWP(room.x + room.width - wtW, room.y + room.height - wtW),
        rotWP(room.x + wtW,              room.y + room.height - wtW),
      ].map((p) => toScreen(p.x, p.y));
      ctx.fillStyle = room.floorColor;
      ctx.beginPath();
      ctx.moveTo(floorCorners[0].x, floorCorners[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(floorCorners[i].x, floorCorners[i].y);
      ctx.closePath();
      ctx.fill();

      // Walls with door gaps
      const roomDoors = doors.filter((d) => d.roomId === room.id);
      for (const wall of ['north', 'south', 'east', 'west']) {
        if ((room.hiddenWalls || []).includes(wall)) continue;
        const { start, end, len } = getWallEndpoints(room, wall);
        const rs  = rotWP(start.x, start.y);
        const re  = rotWP(end.x,   end.y);
        const sp1 = toScreen(rs.x, rs.y);
        const sp2 = toScreen(re.x, re.y);
        const ownDoors    = roomDoors.filter((d) => d.wall === wall);
        const sharedDoors = getSharedWallDoors(room, wall, doors, rooms);

        // If this room has no doors on this face and no shared doors, but an adjacent room
        // owns this face with a door, skip drawing — the owning room renders the gap.
        if (ownDoors.length === 0 && sharedDoors.length === 0) {
          const ourFace = getWorldWallFace(room, wall);
          const dxO = ourFace.e.x - ourFace.s.x, dyO = ourFace.e.y - ourFace.s.y;
          const fLen = Math.hypot(dxO, dyO);
          if (fLen > 0.001) {
            const uX = dxO / fLen, uY = dyO / fLen;
            const nX = -uY, nY = uX;
            // Project our face onto the parallel axis for overlap testing
            const ourS = ourFace.s.x * uX + ourFace.s.y * uY;
            const ourE = ourFace.e.x * uX + ourFace.e.y * uY;
            const oMin = Math.min(ourS, ourE), oMax = Math.max(ourS, ourE);
            const hasDoorOnAdjacentFace = rooms.some((other) => {
              if (other.id === room.id) return false;
              return ['north', 'south', 'east', 'west'].some((ow) => {
                const thFace = getWorldWallFace(other, ow);
                // Must be co-planar — rooms that merely share the same axis but have
                // any gap between them must NOT trigger the skip (tolerance = 2 cm)
                const dx0 = thFace.s.x - ourFace.s.x, dy0 = thFace.s.y - ourFace.s.y;
                if (Math.abs(dx0 * nX + dy0 * nY) > 0.02) return false;
                // Must be parallel
                const dxT = thFace.e.x - thFace.s.x, dyT = thFace.e.y - thFace.s.y;
                const tLen = Math.hypot(dxT, dyT);
                if (tLen < 0.001) return false;
                const dot = (dxT * uX + dyT * uY) / tLen;
                if (Math.abs(Math.abs(dot) - 1) > 0.1) return false;
                // Must actually overlap in the parallel direction (prevents false skips
                // from unrelated rooms that share the same Y/X coordinate elsewhere)
                const thS = thFace.s.x * uX + thFace.s.y * uY;
                const thE = thFace.e.x * uX + thFace.e.y * uY;
                const tMin = Math.min(thS, thE), tMax = Math.max(thS, thE);
                if (Math.min(oMax, tMax) - Math.max(oMin, tMin) < 0.05) return false;
                return doors.some((d) => d.roomId === other.id && d.wall === ow);
              });
            });
            if (hasDoorOnAdjacentFace) continue;
          }
        }

        const wallDoors   = [...ownDoors, ...sharedDoors].sort((a, b) => a.offset - b.offset);
        ctx.strokeStyle = wallColor;
        ctx.lineWidth   = wt;
        ctx.lineCap     = 'square';
        let prevT = 0;
        for (const d of wallDoors) {
          const gapStart = Math.max(0, d.offset / len);
          const gapEnd   = Math.min(1, (d.offset + d.width) / len);
          if (gapStart > prevT) {
            ctx.beginPath();
            ctx.moveTo(sp1.x + (sp2.x - sp1.x) * prevT,    sp1.y + (sp2.y - sp1.y) * prevT);
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

      // Live dimension badge while resizing — centered inside the room
      const isResizing = (dragRef.current?.type === 'resize' && dragRef.current?.id === room.id) ||
                         dragRef.current?.type === 'multi-resize';
      if (isResizing) {
        const normDeg = ((rot * 180 / Math.PI) % 360 + 360) % 360;
        const textRot = (normDeg > 90 && normDeg < 270) ? rot + Math.PI : rot;
        const label   = `${room.width.toFixed(2)} × ${room.height.toFixed(2)} m`;
        ctx.font      = `bold ${Math.max(11, 12 * sc)}px sans-serif`;
        const tw      = ctx.measureText(label).width;
        const pad     = 6 * sc;
        const bw      = tw + pad * 2, bh = Math.max(18, 20 * sc);
        ctx.save(); ctx.translate(rcx, rcy); ctx.rotate(textRot);
        ctx.fillStyle    = 'rgba(21,101,192,0.88)';
        ctx.beginPath();
        ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
        ctx.fill();
        ctx.fillStyle    = '#fff';
        ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }

      // Label — hide while actively rotating; always render readable (never upside-down)
      const isRotating = dragRef.current?.type === 'rotate' || dragRef.current?.type === 'rotate-multi';
      if (!isRotating && sw > 50 && sh > 28) {
        // Flip text rotation so it stays in the readable half-circle (top → bottom)
        const normDeg = ((rot * 180 / Math.PI) % 360 + 360) % 360;
        const textRot = (normDeg > 90 && normDeg < 270) ? rot + Math.PI : rot;
        ctx.fillStyle    = isSel ? '#1565C0' : CTHEME.roomLabel;
        ctx.font         = `${Math.max(10, 12 * sc)}px sans-serif`;
        ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
        ctx.save(); ctx.translate(rcx, rcy); ctx.rotate(textRot);
        ctx.fillText(room.name, 0, 0);
        ctx.restore();
      }

      // Dimension labels on all 4 wall faces when selected (matches freestanding wall style)
      if (!isRotating && isSel) {
        const normDeg = ((rot * 180 / Math.PI) % 360 + 360) % 360;
        const flip    = normDeg > 90 && normDeg < 270;
        const hRot    = rot - Math.PI / 2;
        const hNorm   = ((hRot * 180 / Math.PI) % 360 + 360) % 360;
        const hFlip   = hNorm > 90 && hNorm < 270;
        const gap     = wt / 2 + Math.max(8, 9 * sc);
        ctx.fillStyle = '#1565C0';
        ctx.font      = `${Math.max(9, 10 * sc)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        // North wall — width above
        { const p = rotWP(rwcx, room.y); const sp = toScreen(p.x, p.y);
          ctx.save(); ctx.translate(sp.x, sp.y); ctx.rotate(flip ? rot + Math.PI : rot);
          ctx.fillText(`${room.width.toFixed(2)} m`, 0, -gap); ctx.restore(); }

        // South wall — width below
        { const p = rotWP(rwcx, room.y + room.height); const sp = toScreen(p.x, p.y);
          ctx.save(); ctx.translate(sp.x, sp.y); ctx.rotate(flip ? rot + Math.PI : rot);
          ctx.fillText(`${room.width.toFixed(2)} m`, 0, gap); ctx.restore(); }

        // West wall — height to the left
        { const p = rotWP(room.x, rwcy); const sp = toScreen(p.x, p.y);
          ctx.save(); ctx.translate(sp.x, sp.y); ctx.rotate(hFlip ? hRot + Math.PI : hRot);
          ctx.fillText(`${room.height.toFixed(2)} m`, 0, -gap); ctx.restore(); }

        // East wall — height to the right
        { const p = rotWP(room.x + room.width, rwcy); const sp = toScreen(p.x, p.y);
          ctx.save(); ctx.translate(sp.x, sp.y); ctx.rotate(hFlip ? hRot + Math.PI : hRot);
          ctx.fillText(`${room.height.toFixed(2)} m`, 0, gap); ctx.restore(); }
      }

      if (isLocked) {
        const lkRot = rotWP(room.x + room.width - 8 / (PPM * sc), room.y + 8 / (PPM * sc));
        const lkp = toScreen(lkRot.x, lkRot.y);
        drawLockBadge(ctx, lkp.x, lkp.y, sc);
      }
    }
  };

  // ── Draw door swing symbol ───────────────────────────────────────────────
  // roomRot: room rotation in radians (0 for freestanding-wall doors)
  const drawDoorSymbol = (ctx, door, room, isSel, roomRot = 0) => {
    const sc = scaleRef.current;
    const { hingePoint, panelDir, swingDir } = getDoorInfo(door, room);

    // Rotate geometry around room world-centre if the room is rotated
    let rhp = hingePoint, rpd = panelDir, rsd = swingDir;
    if (roomRot) {
      const rwcx = room.x + room.width / 2, rwcy = room.y + room.height / 2;
      const cosA = Math.cos(roomRot), sinA = Math.sin(roomRot);
      const rotV = (vx, vy) => ({ x: vx * cosA - vy * sinA, y: vx * sinA + vy * cosA });
      const rotP = (px, py) => {
        const dx = px - rwcx, dy = py - rwcy;
        return { x: rwcx + dx * cosA - dy * sinA, y: rwcy + dx * sinA + dy * cosA };
      };
      rhp = rotP(hingePoint.x, hingePoint.y);
      rpd = rotV(panelDir.x, panelDir.y);
      rsd = rotV(swingDir.x, swingDir.y);
    }

    const sh     = toScreen(rhp.x, rhp.y);
    const radius = door.width * PPM * sc;
    const θ      = door.openAngle * Math.PI / 180;

    const tipWorld = {
      x: rhp.x + door.width * (Math.cos(θ) * rpd.x + Math.sin(θ) * rsd.x),
      y: rhp.y + door.width * (Math.cos(θ) * rpd.y + Math.sin(θ) * rsd.y),
    };
    const sTip = toScreen(tipWorld.x, tipWorld.y);

    const panelColor = isSel ? '#1565C0' : '#7B5B3A';
    const arcColor   = isSel ? 'rgba(21,101,192,0.4)' : 'rgba(123,91,58,0.35)';

    const startAngle    = Math.atan2(rpd.y, rpd.x);
    const cross         = rpd.x * rsd.y - rpd.y * rsd.x;
    const anticlockwise = cross < 0;
    const endAngle      = startAngle + (anticlockwise ? -θ : θ);

    ctx.strokeStyle = arcColor;
    ctx.lineWidth   = Math.max(0.8, 1 * sc);
    ctx.setLineDash([3 * sc, 3 * sc]);
    ctx.beginPath();
    ctx.arc(sh.x, sh.y, radius, startAngle, endAngle, anticlockwise);
    ctx.stroke();
    ctx.setLineDash([]);

    const closedTip = {
      x: sh.x + radius * rpd.x,
      y: sh.y + radius * rpd.y,
    };
    ctx.strokeStyle = arcColor;
    ctx.lineWidth   = Math.max(0.8, 1 * sc);
    ctx.beginPath();
    ctx.moveTo(sh.x, sh.y);
    ctx.lineTo(closedTip.x, closedTip.y);
    ctx.stroke();

    ctx.strokeStyle = panelColor;
    ctx.lineWidth   = Math.max(2, 2.5 * sc);
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(sh.x, sh.y);
    ctx.lineTo(sTip.x, sTip.y);
    ctx.stroke();
    ctx.lineCap = 'butt';

    ctx.fillStyle = panelColor;
    ctx.beginPath();
    ctx.arc(sh.x, sh.y, Math.max(3, 4 * sc), 0, Math.PI * 2);
    ctx.fill();

    if (isSel) {
      const midX = (sh.x + sTip.x) / 2;
      const midY = (sh.y + sTip.y) / 2;
      ctx.fillStyle = '#1565C0';
      ctx.font = `bold ${Math.max(10, 11 * sc)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('D', midX, midY - 8 * sc);
    }
  };

  // ── Draw freestanding wall (with door gaps) ──────────────────────────────────
  const drawFWWall = (ctx, w, isSel) => {
    const sc = scaleRef.current;
    const sp1 = toScreen(w.x1, w.y1), sp2 = toScreen(w.x2, w.y2);
    const thickness = (w.thickness || 0.15) * PPM * sc;
    const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
    const wallColor = isSel ? '#1565C0' : (w.color || '#444444');
    const isLocked  = lockedIds.includes(w.id);

    const wallDoors = doors.filter((d) => d.wallId === w.id).sort((a, b) => a.offset - b.offset);

    ctx.strokeStyle = wallColor;
    ctx.lineWidth   = thickness;
    ctx.lineCap     = 'square';

    // Draw segments with gaps for doors
    const dx = sp2.x - sp1.x, dy = sp2.y - sp1.y;
    let prevT = 0;
    for (const d of wallDoors) {
      const t0 = Math.max(0, d.offset / len);
      const t1 = Math.min(1, (d.offset + d.width) / len);
      if (t0 > prevT + 0.001) {
        ctx.beginPath();
        ctx.moveTo(sp1.x + dx * prevT, sp1.y + dy * prevT);
        ctx.lineTo(sp1.x + dx * t0,    sp1.y + dy * t0);
        ctx.stroke();
      }
      prevT = t1;
    }
    if (prevT < 1 - 0.001) {
      ctx.beginPath();
      ctx.moveTo(sp1.x + dx * prevT, sp1.y + dy * prevT);
      ctx.lineTo(sp2.x, sp2.y);
      ctx.stroke();
    }

    // Selection: endpoint handles
    if (isSel) {
      const r = Math.max(6, 8 * sc);
      [sp1, sp2].forEach((pt) => {
        // Outer ring
        ctx.fillStyle = '#1565C0';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, r + 2, 0, Math.PI * 2); ctx.fill();
        // Inner white
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1565C0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2); ctx.stroke();
      });
      // Length label mid-wall
      const mx = (sp1.x + sp2.x) / 2, my = (sp1.y + sp2.y) / 2;
      ctx.fillStyle = '#1565C0';
      ctx.font = `${Math.max(9, 10 * sc)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(`${len.toFixed(2)} m`, mx, my - thickness / 2 - 4);
    }

    if (isLocked) drawLockBadge(ctx, (sp1.x + sp2.x) / 2, (sp1.y + sp2.y) / 2 - 8 * sc, sc);
  };

  // ── Draw a door on a freestanding wall ───────────────────────────────────────
  const drawFWDoor = (ctx, door, fw, isSel) => {
    const sc  = scaleRef.current;
    const len = Math.hypot(fw.x2 - fw.x1, fw.y2 - fw.y1);
    if (len < 0.01) return;
    const dirX = (fw.x2 - fw.x1) / len, dirY = (fw.y2 - fw.y1) / len;
    // Perpendicular: left side of wall direction = "inward"
    const perpX = -dirY, perpY = dirX;

    const hingeSide = door.hingeSide ?? 'left';
    const swingIn   = door.swingIn   ?? true;

    // Hinge is at start (left) or end (right) of the door gap
    const hingeOffset = hingeSide === 'left' ? door.offset : door.offset + door.width;
    const hingeW = { x: fw.x1 + dirX * hingeOffset, y: fw.y1 + dirY * hingeOffset };
    const hinge  = toScreen(hingeW.x, hingeW.y);
    const radius = door.width * PPM * sc;
    const θ      = (door.openAngle ?? 90) * Math.PI / 180;

    // Panel closed direction: away from hinge along wall
    const closedDirX = hingeSide === 'left' ?  dirX :  -dirX;
    const closedDirY = hingeSide === 'left' ?  dirY :  -dirY;
    // Swing direction: inward = perp, outward = -perp
    const swingDirX = swingIn ? perpX : -perpX;
    const swingDirY = swingIn ? perpY : -perpY;

    // Cross product to determine arc direction
    const cross = closedDirX * swingDirY - closedDirY * swingDirX;
    const anticlockwise = cross < 0;

    const closedAngle = Math.atan2(closedDirY, closedDirX);
    const endAngle    = closedAngle + (anticlockwise ? -θ : θ);

    const panelColor = isSel ? '#1565C0' : '#7B5B3A';
    const arcColor   = isSel ? 'rgba(21,101,192,0.35)' : 'rgba(123,91,58,0.3)';

    ctx.strokeStyle = arcColor;
    ctx.lineWidth   = Math.max(0.8, 1 * sc);
    ctx.setLineDash([3 * sc, 3 * sc]);
    ctx.beginPath();
    ctx.arc(hinge.x, hinge.y, radius, closedAngle, endAngle, anticlockwise);
    ctx.stroke();
    ctx.setLineDash([]);

    // Closed panel line
    const closedTipS = { x: hinge.x + radius * Math.cos(closedAngle), y: hinge.y + radius * Math.sin(closedAngle) };
    ctx.strokeStyle = arcColor; ctx.lineWidth = Math.max(0.8, 1 * sc);
    ctx.beginPath(); ctx.moveTo(hinge.x, hinge.y); ctx.lineTo(closedTipS.x, closedTipS.y); ctx.stroke();

    // Open panel
    const openTipS = { x: hinge.x + radius * Math.cos(endAngle), y: hinge.y + radius * Math.sin(endAngle) };
    ctx.strokeStyle = panelColor; ctx.lineWidth = Math.max(2, 2.5 * sc); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hinge.x, hinge.y); ctx.lineTo(openTipS.x, openTipS.y); ctx.stroke();
    ctx.lineCap = 'butt';

    ctx.fillStyle = panelColor;
    ctx.beginPath(); ctx.arc(hinge.x, hinge.y, Math.max(3, 4 * sc), 0, Math.PI * 2); ctx.fill();
  };

  // ── Draw furniture ──────────────────────────────────────────────────────────
  const drawFurniture = (ctx, item, isSel) => {
    const sc  = scaleRef.current;
    const sp  = toScreen(item.x, item.y);
    const sw  = item.width * PPM * sc;
    const sd  = item.depth * PPM * sc;
    const rot = ((item.rotation || 0) * Math.PI) / 180;
    const isLocked = lockedIds.includes(item.id);

    // Screen-space center (always at this position regardless of rotation)
    const cx = sp.x + sw / 2;
    const cy = sp.y + sd / 2;

    // ── Rotated drawing context ──
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.translate(-sw / 2, -sd / 2);

    ctx.fillStyle = item.color || '#C8A080';
    ctx.fillRect(0, 0, sw, sd);
    if (item.type === 'battery-bank') {
      ctx._batteryMeta = { cols: item.batteryCols || 4, rows: item.batteryRows || 2 };
    }
    drawFurnitureSymbol(ctx, item.type, sw, sd, sc, CTHEME.furnSymbol);
    ctx._batteryMeta = null;

    ctx.strokeStyle = isSel ? '#1565C0' : 'rgba(0,0,0,0.28)';
    ctx.lineWidth   = isSel ? 2 : 1;
    ctx.strokeRect(0, 0, sw, sd);

    if (isLocked) drawLockBadge(ctx, sw - 6 * sc, 6 * sc, sc);

    ctx.restore();

    // ── Label drawn AFTER restore so text is always upright ──
    if (sw > 28 && sd > 16) {
      const textColor = isSel ? '#1565C0' : contrastColor(item.color || '#C8A080');
      ctx.fillStyle    = textColor;
      ctx.font         = `${Math.max(8, 9 * sc)}px sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.name, cx, cy);
    }
  };

  // ── Hit testing ─────────────────────────────────────────────────────────────
  const ptInRect = (px, py, rx, ry, rw, rh) => px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;

  // Hit test accounting for rotation — transforms point into item's local space
  const ptInRotatedRect = (px, py, rx, ry, rw, rh, rotRad) => {
    if (!rotRad) return ptInRect(px, py, rx, ry, rw, rh);
    const cx = rx + rw / 2, cy = ry + rh / 2;
    const cos = Math.cos(-rotRad), sin = Math.sin(-rotRad);
    const dx = px - cx, dy = py - cy;
    const lx = dx * cos - dy * sin, ly = dx * sin + dy * cos;
    return Math.abs(lx) <= rw / 2 && Math.abs(ly) <= rh / 2;
  };

  const ptInRoom = (wx, wy, r) => {
    if (r.polygon && r.polygon.length >= 3) {
      const rot = (r.rotation || 0) * Math.PI / 180;
      if (!rot) return ptInPolygon(wx, wy, r.polygon);
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      const cos = Math.cos(-rot), sin = Math.sin(-rot);
      const dx = wx - cx, dy = wy - cy;
      const lx = cx + dx * cos - dy * sin;
      const ly = cy + dx * sin + dy * cos;
      return ptInPolygon(lx, ly, r.polygon);
    }
    return ptInRotatedRect(wx, wy, r.x, r.y, r.width, r.height, (r.rotation || 0) * Math.PI / 180);
  };

  // Returns world-space bounding box of a group (including outline padding), or null
  const getGroupBounds = useCallback((group) => {
    const PAD = 0.18;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasAny = false;
    const state = useFloorPlannerStore.getState();
    for (const id of group.itemIds) {
      const r = state.rooms.find((x) => x.id === id);
      const f = state.furniture.find((x) => x.id === id);
      const item = r || f;
      if (!item) continue;
      hasAny = true;
      const iw = item.width, ih = r ? item.height : item.depth;
      minX = Math.min(minX, item.x);      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + iw); maxY = Math.max(maxY, item.y + ih);
    }
    if (!hasAny) return null;
    return { minX: minX - PAD, minY: minY - PAD, maxX: maxX + PAD, maxY: maxY + PAD };
  }, []);

  // ── Rotate a screen point around a center ─────────────────────────────────
  const rotPt = (px, py, cx, cy, angle) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    const dx = px - cx, dy = py - cy;
    return { hx: cx + dx * c - dy * s, hy: cy + dx * s + dy * c };
  };

  // ── Returns handle key under screen point (sx,sy), or null ──────────────────
  // Accounts for item rotation so handles appear at the visual corners.
  const getHandleAtScreen = (sx, sy) => {
    if (selectedIds.length !== 1) return null;
    if (lockedIds.includes(selectedId)) return null;
    const room = rooms.find((r) => r.id === selectedId);
    const furn = furniture.find((f) => f.id === selectedId);
    const item = room || furn;
    if (!item) return null;
    const t = HANDLE_TOL;

    // Polygon room: vertex and edge-midpoint handles
    if (room && room.polygon && room.polygon.length >= 3) {
      const poly = room.polygon;
      const rot  = (room.rotation || 0) * Math.PI / 180;
      const cosA = Math.cos(rot), sinA = Math.sin(rot);
      const rcx  = room.x + room.width / 2, rcy = room.y + room.height / 2;
      const rotPoly = (px, py) => {
        const dx = px - rcx, dy = py - rcy;
        return toScreen(rcx + dx * cosA - dy * sinA, rcy + dx * sinA + dy * cosA);
      };
      let best = null, bestDist = Infinity;
      // Vertex handles
      for (let i = 0; i < poly.length; i++) {
        const ps = rotPoly(poly[i].x, poly[i].y);
        const d  = Math.hypot(sx - ps.x, sy - ps.y);
        if (d < t && d < bestDist) { bestDist = d; best = { key: `v${i}`, hx: ps.x, hy: ps.y, isRoom: true, isPolyVertex: true, vertexIdx: i }; }
      }
      // Edge-midpoint handles (lower priority than vertices)
      for (let i = 0; i < poly.length; i++) {
        const j  = (i + 1) % poly.length;
        const ms = rotPoly((poly[i].x + poly[j].x) / 2, (poly[i].y + poly[j].y) / 2);
        const d  = Math.hypot(sx - ms.x, sy - ms.y);
        if (d < t && d < bestDist) { bestDist = d; best = { key: `e${i}`, hx: ms.x, hy: ms.y, isRoom: true, isPolyEdge: true, edgeIdx: i }; }
      }
      return best;
    }

    const iw  = item.width, ih = room ? item.height : item.depth;
    const sp  = toScreen(item.x, item.y);
    const sw  = iw * PPM * scaleRef.current;
    const sh  = ih * PPM * scaleRef.current;
    const rot = ((item.rotation || 0) * Math.PI) / 180;
    const cx  = sp.x + sw / 2, cy = sp.y + sh / 2;

    // Local (unrotated) handle positions then rotate around item center
    const raw = [
      { key: 'nw', lx: sp.x,          ly: sp.y        },
      { key: 'ne', lx: sp.x + sw,     ly: sp.y        },
      { key: 'se', lx: sp.x + sw,     ly: sp.y + sh   },
      { key: 'sw', lx: sp.x,          ly: sp.y + sh   },
      { key: 'n',  lx: sp.x + sw / 2, ly: sp.y        },
      { key: 's',  lx: sp.x + sw / 2, ly: sp.y + sh   },
      { key: 'w',  lx: sp.x,          ly: sp.y + sh / 2 },
      { key: 'e',  lx: sp.x + sw,     ly: sp.y + sh / 2 },
    ];

    let best = null, bestDist = Infinity;
    for (const h of raw) {
      const { hx, hy } = rotPt(h.lx, h.ly, cx, cy, rot);
      const d = Math.hypot(sx - hx, sy - hy);
      if (d < t && d < bestDist) {
        bestDist = d;
        best = { key: h.key, hx, hy, isRoom: !!room, origX: item.x, origY: item.y, origW: iw, origH: ih, rot };
      }
    }
    return best;
  };

  // ── Rotation handle: screen position for any item (furniture or room) ──────
  const getRotateHandleScreen = (item) => {
    const sp  = toScreen(item.x, item.y);
    const sw  = item.width * PPM * scaleRef.current;
    const sd  = (item.depth ?? item.height) * PPM * scaleRef.current;
    const rot = ((item.rotation || 0) * Math.PI) / 180;
    const cx  = sp.x + sw / 2;
    const cy  = sp.y + sd / 2;
    const dist = sd / 2 + ROTATE_HANDLE_OFFSET;
    return {
      rhx: cx + dist * Math.sin(rot),
      rhy: cy - dist * Math.cos(rot),
      cx, cy,
    };
  };

  // ── Rotation handle hit test (single select — furniture or room) ──────────
  const getRotateHandleAtScreen = (sx, sy) => {
    if (selectedIds.length !== 1) return null;
    if (lockedIds.includes(selectedId)) return null;
    const furn = furniture.find((f) => f.id === selectedId);
    const room = rooms.find((r) => r.id === selectedId);
    const item = furn || room;
    if (!item) return null;
    const { rhx, rhy, cx, cy } = getRotateHandleScreen(item);
    const d = Math.hypot(sx - rhx, sy - rhy);
    if (d <= HANDLE_TOL + 4) return { item, rhx, rhy, cx, cy, isRoom: !!room };
    return null;
  };

  // ── Multi-select rotation handle hit test ─────────────────────────────────
  const getMultiRotateHandleAtScreen = (sx, sy) => {
    if (selectedIds.length < 2) return null;
    const bbox = getMultiSelectBBox();
    if (!bbox) return null;
    const sp1 = toScreen(bbox.x1, bbox.y1);
    const sp2 = toScreen(bbox.x2, bbox.y2);
    const rhx = sp1.x + (sp2.x - sp1.x) / 2;
    const rhy = sp1.y - ROTATE_HANDLE_OFFSET;
    // bbox center in screen space (for angle calc)
    const bcx = sp1.x + (sp2.x - sp1.x) / 2;
    const bcy = sp1.y + (sp2.y - sp1.y) / 2;
    const d = Math.hypot(sx - rhx, sy - rhy);
    if (d <= HANDLE_TOL + 4) return { rhx, rhy, bcx, bcy };
    return null;
  };

  // ── Clamp all doors on a room to their wall's valid offset range ─────────────
  // Called after any room resize so doors can't end up outside the wall.
  const clampDoorsToRoom = (roomId, newW, newH) => {
    const state = useFloorPlannerStore.getState();
    for (const door of state.doors) {
      if (door.roomId !== roomId) continue;
      const wallLen = (door.wall === 'north' || door.wall === 'south') ? newW : newH;
      const maxOff = Math.max(0, wallLen - door.width);
      if (door.offset > maxOff) updateDoor(door.id, { offset: maxOff });
    }
  };

  // ── Apply resize given current world mouse position ────────────────────────
  // For rotated furniture: project delta onto local axes and resize from center.
  // For rooms (no rotation): classic corner/edge resize.
  const applyResize = (drag, wx, wy) => {
    const MIN = SNAP;

    if (drag.rot !== 0) {
      // ── Rotated item: resize symmetrically from center in local space ──
      const origCX = drag.origX + drag.origW / 2;
      const origCY = drag.origY + drag.origH / 2;
      const dwx = wx - drag.startWX, dwy = wy - drag.startWY;
      const cos = Math.cos(-drag.rot), sin = Math.sin(-drag.rot);
      const localDX = dwx * cos - dwy * sin;
      const localDY = dwx * sin + dwy * cos;

      let nw = drag.origW, nh = drag.origH;
      switch (drag.key) {
        case 'e': case 'ne': case 'se': nw = Math.max(MIN, snapVal(drag.origW + localDX)); break;
        case 'w': case 'nw': case 'sw': nw = Math.max(MIN, snapVal(drag.origW - localDX)); break;
      }
      switch (drag.key) {
        case 's': case 'se': case 'sw': nh = Math.max(MIN, snapVal(drag.origH + localDY)); break;
        case 'n': case 'ne': case 'nw': nh = Math.max(MIN, snapVal(drag.origH - localDY)); break;
      }
      if (drag.isRoom) {
        updateRoom(selectedId, { x: origCX - nw / 2, y: origCY - nh / 2, width: nw, height: nh });
        clampDoorsToRoom(selectedId, nw, nh);
      } else {
        updateFurniture(selectedId, { x: origCX - nw / 2, y: origCY - nh / 2, width: nw, depth: nh });
      }
      return;
    }

    // ── Axis-aligned (room or rotation=0 furniture) ────────────────────────
    const sx = snapVal(wx), sy = snapVal(wy);
    let { origX: nx, origY: ny, origW: nw, origH: nh } = drag;
    switch (drag.key) {
      case 'nw': nx = Math.min(sx, drag.origX + drag.origW - MIN); ny = Math.min(sy, drag.origY + drag.origH - MIN); nw = drag.origX + drag.origW - nx; nh = drag.origY + drag.origH - ny; break;
      case 'ne': ny = Math.min(sy, drag.origY + drag.origH - MIN); nw = Math.max(MIN, sx - drag.origX); nh = drag.origY + drag.origH - ny; break;
      case 'se': nw = Math.max(MIN, sx - drag.origX); nh = Math.max(MIN, sy - drag.origY); break;
      case 'sw': nx = Math.min(sx, drag.origX + drag.origW - MIN); nw = drag.origX + drag.origW - nx; nh = Math.max(MIN, sy - drag.origY); break;
      case 'n':  ny = Math.min(sy, drag.origY + drag.origH - MIN); nh = drag.origY + drag.origH - ny; break;
      case 's':  nh = Math.max(MIN, sy - drag.origY); break;
      case 'w':  nx = Math.min(sx, drag.origX + drag.origW - MIN); nw = drag.origX + drag.origW - nx; break;
      case 'e':  nw = Math.max(MIN, sx - drag.origX); break;
    }
    if (drag.isRoom) {
      updateRoom(selectedId, { x: nx, y: ny, width: nw, height: nh });
      clampDoorsToRoom(selectedId, nw, nh);
    } else {
      updateFurniture(selectedId, { x: nx, y: ny, width: nw, depth: nh });
    }
  };

  // ── Bounding box of all selected non-locked items (world coords) ─────────
  const getMultiSelectBBox = () => {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity, hasAny = false;
    for (const id of selectedIds) {
      if (lockedIds.includes(id)) continue;
      const r = rooms.find((x) => x.id === id);
      const f = furniture.find((x) => x.id === id);
      const w = walls && walls.find((x) => x.id === id);
      if (r) {
        x1 = Math.min(x1, r.x); y1 = Math.min(y1, r.y);
        x2 = Math.max(x2, r.x + r.width); y2 = Math.max(y2, r.y + r.height); hasAny = true;
      } else if (f) {
        x1 = Math.min(x1, f.x); y1 = Math.min(y1, f.y);
        x2 = Math.max(x2, f.x + f.width); y2 = Math.max(y2, f.y + f.depth); hasAny = true;
      } else if (w) {
        x1 = Math.min(x1, Math.min(w.x1, w.x2)); y1 = Math.min(y1, Math.min(w.y1, w.y2));
        x2 = Math.max(x2, Math.max(w.x1, w.x2)); y2 = Math.max(y2, Math.max(w.y1, w.y2)); hasAny = true;
      }
    }
    return hasAny ? { x1, y1, x2, y2 } : null;
  };

  // ── Multi-select resize handle hit test ──────────────────────────────────
  const getMultiHandleAtScreen = (sx, sy) => {
    if (selectedIds.length < 2) return null;
    const bbox = getMultiSelectBBox();
    if (!bbox) return null;
    const sp1 = toScreen(bbox.x1, bbox.y1);
    const sp2 = toScreen(bbox.x2, bbox.y2);
    const mw = sp2.x - sp1.x, mh = sp2.y - sp1.y;
    const t = HANDLE_TOL;
    const handles = [
      { key: 'nw', hx: sp1.x,          hy: sp1.y },
      { key: 'ne', hx: sp2.x,          hy: sp1.y },
      { key: 'se', hx: sp2.x,          hy: sp2.y },
      { key: 'sw', hx: sp1.x,          hy: sp2.y },
      { key: 'n',  hx: sp1.x + mw / 2, hy: sp1.y },
      { key: 's',  hx: sp1.x + mw / 2, hy: sp2.y },
      { key: 'w',  hx: sp1.x,          hy: sp1.y + mh / 2 },
      { key: 'e',  hx: sp2.x,          hy: sp1.y + mh / 2 },
    ];
    let best = null, bestDist = Infinity;
    for (const h of handles) {
      const d = Math.hypot(sx - h.hx, sy - h.hy);
      if (d < t && d < bestDist) { bestDist = d; best = { ...h, bbox }; }
    }
    return best;
  };

  // ── Apply multi-select resize ─────────────────────────────────────────────
  const applyMultiResize = (drag, wx, wy) => {
    const { key, origBBox, origItems } = drag;
    const { x1: ox1, y1: oy1, x2: ox2, y2: oy2 } = origBBox;
    const origW = ox2 - ox1, origH = oy2 - oy1;
    const sw = snapVal(wx), sy2 = snapVal(wy);

    let nx1 = ox1, ny1 = oy1, nx2 = ox2, ny2 = oy2;
    switch (key) {
      case 'nw': nx1 = Math.min(sw,  ox2 - SNAP); ny1 = Math.min(sy2, oy2 - SNAP); break;
      case 'ne': nx2 = Math.max(sw,  ox1 + SNAP); ny1 = Math.min(sy2, oy2 - SNAP); break;
      case 'se': nx2 = Math.max(sw,  ox1 + SNAP); ny2 = Math.max(sy2, oy1 + SNAP); break;
      case 'sw': nx1 = Math.min(sw,  ox2 - SNAP); ny2 = Math.max(sy2, oy1 + SNAP); break;
      case 'n':  ny1 = Math.min(sy2, oy2 - SNAP); break;
      case 's':  ny2 = Math.max(sy2, oy1 + SNAP); break;
      case 'w':  nx1 = Math.min(sw,  ox2 - SNAP); break;
      case 'e':  nx2 = Math.max(sw,  ox1 + SNAP); break;
    }
    const scaleX = origW > 0.001 ? (nx2 - nx1) / origW : 1;
    const scaleY = origH > 0.001 ? (ny2 - ny1) / origH : 1;

    for (const orig of origItems) {
      const { id } = orig;
      if (orig.type === 'room') {
        const nw = Math.max(SNAP, orig.width  * scaleX);
        const nh = Math.max(SNAP, orig.height * scaleY);
        const ncx = nx1 + (orig.x + orig.width  / 2 - ox1) * scaleX;
        const ncy = ny1 + (orig.y + orig.height / 2 - oy1) * scaleY;
        updateRoom(id, { x: ncx - nw / 2, y: ncy - nh / 2, width: nw, height: nh });
        clampDoorsToRoom(id, nw, nh);
      } else if (orig.type === 'furniture') {
        const nw = Math.max(SNAP, orig.width * scaleX);
        const nd = Math.max(SNAP, orig.depth * scaleY);
        const ncx = nx1 + (orig.x + orig.width / 2 - ox1) * scaleX;
        const ncy = ny1 + (orig.y + orig.depth / 2 - oy1) * scaleY;
        updateFurniture(id, { x: ncx - nw / 2, y: ncy - nd / 2, width: nw, depth: nd });
      } else if (orig.type === 'wall') {
        updateWall(id, {
          x1: nx1 + (orig.x1 - ox1) * scaleX, y1: ny1 + (orig.y1 - oy1) * scaleY,
          x2: nx1 + (orig.x2 - ox1) * scaleX, y2: ny1 + (orig.y2 - oy1) * scaleY,
        });
      }
    }
  };

  const checkDoorHit = (wx, wy) => {
    const tol = 0.25;
    for (const door of doors) {
      // Room door
      if (door.roomId) {
        const room = rooms.find((r) => r.id === door.roomId);
        if (!room) continue;
        // Transform click point into room's unrotated local space
        const rotRad = (room.rotation || 0) * Math.PI / 180;
        let lwx = wx, lwy = wy;
        if (rotRad) {
          const rcx = room.x + room.width / 2, rcy = room.y + room.height / 2;
          const cos = Math.cos(-rotRad), sin = Math.sin(-rotRad);
          const dx2 = wx - rcx, dy2 = wy - rcy;
          lwx = rcx + dx2 * cos - dy2 * sin;
          lwy = rcy + dx2 * sin + dy2 * cos;
        }
        const { hingePoint, panelDir, swingDir } = getDoorInfo(door, room);
        if (Math.hypot(lwx - hingePoint.x, lwy - hingePoint.y) < tol) return door;
        const θ = door.openAngle * Math.PI / 180;
        const midX = hingePoint.x + (door.width / 2) * (Math.cos(θ) * panelDir.x + Math.sin(θ) * swingDir.x);
        const midY = hingePoint.y + (door.width / 2) * (Math.cos(θ) * panelDir.y + Math.sin(θ) * swingDir.y);
        if (Math.hypot(lwx - midX, lwy - midY) < tol) return door;
      }
      // Freestanding wall door
      if (door.wallId) {
        const fw = walls.find((w) => w.id === door.wallId);
        if (!fw) continue;
        const len = Math.hypot(fw.x2 - fw.x1, fw.y2 - fw.y1);
        if (len < 0.01) continue;
        const dirX = (fw.x2 - fw.x1) / len, dirY = (fw.y2 - fw.y1) / len;
        const hingeSide = door.hingeSide ?? 'left';
        const swingIn   = door.swingIn   ?? true;
        const hingeOffset = hingeSide === 'left' ? door.offset : door.offset + door.width;
        const hingeX = fw.x1 + dirX * hingeOffset;
        const hingeY = fw.y1 + dirY * hingeOffset;
        if (Math.hypot(wx - hingeX, wy - hingeY) < tol) return door;
        // Mid-panel point along open panel direction
        const closedDirX = hingeSide === 'left' ?  dirX : -dirX;
        const closedDirY = hingeSide === 'left' ?  dirY : -dirY;
        const perpX = -dirY, perpY = dirX;
        const swingDirX = swingIn ?  perpX : -perpX;
        const swingDirY = swingIn ?  perpY : -perpY;
        const cross = closedDirX * swingDirY - closedDirY * swingDirX;
        const anticlockwise = cross < 0;
        const θ = (door.openAngle ?? 90) * Math.PI / 180;
        const closedAngle = Math.atan2(closedDirY, closedDirX);
        const endAngle = closedAngle + (anticlockwise ? -θ : θ);
        const midX = hingeX + (door.width / 2) * Math.cos(endAngle);
        const midY = hingeY + (door.width / 2) * Math.sin(endAngle);
        if (Math.hypot(wx - midX, wy - midY) < tol) return door;
      }
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

    // Right-click → context menu
    if (e.button === 2) {
      e.preventDefault();
      const { x: wx2, y: wy2 } = toWorld(sx, sy);
      // Check what was right-clicked
      let hitId = null;
      for (let i = furniture.length - 1; i >= 0; i--) {
        const f = furniture[i];
        if (ptInRect(wx2, wy2, f.x, f.y, f.width, f.depth)) { hitId = f.id; break; }
      }
      if (!hitId) {
        for (let i = rooms.length - 1; i >= 0; i--) {
          const r = rooms[i];
          if (ptInRect(wx2, wy2, r.x, r.y, r.width, r.height)) { hitId = r.id; break; }
        }
      }
      // Find group: either via hitId membership, or by bounding-box overlap (empty space in group)
      let hitGroup = hitId ? groups.find((g) => g.itemIds.includes(hitId)) : null;
      if (!hitGroup) {
        for (let i = groups.length - 1; i >= 0; i--) {
          const b = getGroupBounds(groups[i]);
          if (b && wx2 >= b.minX && wx2 <= b.maxX && wy2 >= b.minY && wy2 <= b.maxY) {
            hitGroup = groups[i]; break;
          }
        }
      }
      // Select what was clicked
      if (hitId && !selectedIds.includes(hitId)) selectOne(hitId);
      setContextMenu({ x: e.clientX, y: e.clientY, hitId, group: hitGroup || null });
      return;
    }

    // Middle-click or Alt+drag → pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      panRef.current = { sx, sy, ox: offsetRef.current.x, oy: offsetRef.current.y };
      return;
    }
    if (e.button !== 0) return;

    // Close context menu on any left-click
    if (contextMenu) { setContextMenu(null); }

    if (activeTool === 'select') {
      // ── Ctrl+drag → force box-select regardless of what's under the cursor ──
      if (e.ctrlKey) {
        if (!e.shiftKey) clearSelection();
        boxSelectRef.current = { startSX: sx, startSY: sy, curSX: sx, curSY: sy, additive: e.shiftKey, noRooms: true };
        return;
      }

      // ── Multi-select resize handle check ──────────────────────────────
      if (selectedIds.length > 1) {
        const mHit = getMultiHandleAtScreen(sx, sy);
        if (mHit) {
          useFloorPlannerStore.getState()._pushHistory();
          const origItems = selectedIds
            .filter((id) => !lockedIds.includes(id))
            .map((id) => {
              const r = rooms.find((x) => x.id === id);
              const f = furniture.find((x) => x.id === id);
              const w = walls && walls.find((x) => x.id === id);
              if (r) return { id, type: 'room',      x: r.x,  y: r.y,  width: r.width,  height: r.height };
              if (f) return { id, type: 'furniture', x: f.x,  y: f.y,  width: f.width,  depth: f.depth };
              if (w) return { id, type: 'wall',      x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 };
              return null;
            })
            .filter(Boolean);
          dragRef.current = { type: 'multi-resize', key: mHit.key, origBBox: mHit.bbox, origItems, startWX: wx, startWY: wy };
          return;
        }
      }

      // ── Selection bbox interior drag (click anywhere inside multi-selection) ──
      // This makes the entire blue bounding box a drag zone — user doesn't need
      // to click directly on an individual object to move all selected items.
      if (selectedIds.length > 1) {
        const bbox = getMultiSelectBBox();
        if (bbox && wx >= bbox.x1 && wx <= bbox.x2 && wy >= bbox.y1 && wy <= bbox.y2) {
          useFloorPlannerStore.getState()._pushHistory();
          const origins = {};
          const storeState = useFloorPlannerStore.getState();
          for (const id of selectedIds) {
            if (lockedIds.includes(id)) continue;
            const f2 = storeState.furniture.find((x) => x.id === id);
            const r2 = storeState.rooms.find((x) => x.id === id);
            if (f2) origins[id] = { x: f2.x, y: f2.y, kind: 'furniture' };
            else if (r2) origins[id] = { x: r2.x, y: r2.y, kind: 'room', polygon: r2.polygon ? r2.polygon.map((v) => ({ ...v })) : null };
            else { const w2 = storeState.walls && storeState.walls.find((x) => x.id === id); if (w2) origins[id] = { x1: w2.x1, y1: w2.y1, x2: w2.x2, y2: w2.y2, kind: 'wall' }; }
          }
          if (Object.keys(origins).length > 0) {
            dragRef.current = { type: 'multi', origins, startWX: wx, startWY: wy };
            return;
          }
        }
      }

      // ── Multi-select rotation handle ──
      const mRotHit = getMultiRotateHandleAtScreen(sx, sy);
      if (mRotHit) {
        useFloorPlannerStore.getState()._pushHistory();
        const storeState = useFloorPlannerStore.getState();
        // World-space center of the entire selection (orbit pivot)
        const bbox = getMultiSelectBBox();
        const bboxWCX = (bbox.x1 + bbox.x2) / 2;
        const bboxWCY = (bbox.y1 + bbox.y2) / 2;
        const origItems = {};
        for (const id of selectedIds) {
          if (lockedIds.includes(id)) continue;
          const f2 = storeState.furniture.find((x) => x.id === id);
          const r2 = storeState.rooms.find((x) => x.id === id);
          const w2 = storeState.walls.find((x) => x.id === id);
          if (f2) origItems[id] = { cx: f2.x + f2.width / 2, cy: f2.y + f2.depth / 2, rotation: f2.rotation || 0, width: f2.width, depth: f2.depth, kind: 'furniture' };
          else if (r2) origItems[id] = { cx: r2.x + r2.width / 2, cy: r2.y + r2.height / 2, rotation: r2.rotation || 0, width: r2.width, depth: r2.height, kind: 'room' };
          else if (w2) origItems[id] = { x1: w2.x1, y1: w2.y1, x2: w2.x2, y2: w2.y2, kind: 'wall' };
        }
        dragRef.current = {
          type: 'rotate-multi',
          bcx: mRotHit.bcx, bcy: mRotHit.bcy,   // screen-space center for angle
          bboxWCX, bboxWCY,                        // world-space pivot for orbit
          startAngle: Math.atan2(sy - mRotHit.bcy, sx - mRotHit.bcx),
          origItems,
        };
        return;
      }

      // ── Rotation handle check (furniture or room, single selection) ──
      const rotHit = getRotateHandleAtScreen(sx, sy);
      if (rotHit) {
        useFloorPlannerStore.getState()._pushHistory();
        dragRef.current = {
          type: 'rotate', id: rotHit.item.id,
          cx: rotHit.cx, cy: rotHit.cy,
          startAngle: Math.atan2(sy - rotHit.cy, sx - rotHit.cx),
          origRotation: rotHit.item.rotation || 0,
          isRoom: rotHit.isRoom,
        };
        return;
      }

      // ── Resize handle check (screen-space, only single selection) ──
      const handleHit = getHandleAtScreen(sx, sy);
      if (handleHit) {
        useFloorPlannerStore.getState()._pushHistory();
        if (handleHit.isPolyVertex) {
          const room = rooms.find((r) => r.id === selectedId);
          dragRef.current = { type: 'room-vertex', id: selectedId, vertexIdx: handleHit.vertexIdx, origPoly: room.polygon.map((v) => ({ ...v })), startWX: wx, startWY: wy };
        } else if (handleHit.isPolyEdge) {
          const room = rooms.find((r) => r.id === selectedId);
          const idx  = handleHit.edgeIdx;
          const j    = (idx + 1) % room.polygon.length;
          // Insert two new vertices by splitting the edge
          const newPoly = [...room.polygon];
          const v0 = room.polygon[idx], v1 = room.polygon[j];
          const mx = (v0.x + v1.x) / 2, my = (v0.y + v1.y) / 2;
          // Insert at idx+1: [v0, midL, midR, v1] → insert two copies of mid at idx+1
          newPoly.splice(idx + 1, 0, { x: mx, y: my }, { x: mx, y: my });
          updateRoom(selectedId, { polygon: newPoly, ...polyBoundingBox(newPoly) });
          // Now drag both new vertices (idx+1 and idx+2) together — treat as a new vertex pair
          dragRef.current = { type: 'room-edge-extrude', id: selectedId, vi: idx + 1, vj: idx + 2, origPoly: newPoly.map((v) => ({ ...v })), startWX: wx, startWY: wy };
        } else {
          dragRef.current = { type: 'resize', ...handleHit, startWX: wx, startWY: wy };
        }
        return;
      }

      // ── Door hit ──
      const doorHit = checkDoorHit(wx, wy);
      if (doorHit) {
        if (e.shiftKey) { selectAdd(doorHit.id); return; }
        selectOne(doorHit.id);
        useFloorPlannerStore.getState()._pushHistory();
        if (doorHit.wallId) {
          // Freestanding wall door — drag slides along the wall
          const fw = walls.find((w) => w.id === doorHit.wallId);
          const fwLen = fw ? Math.hypot(fw.x2 - fw.x1, fw.y2 - fw.y1) : 0;
          dragRef.current = {
            type: 'fwDoor', id: doorHit.id, wallId: doorHit.wallId,
            wallLen: fwLen, doorWidth: doorHit.width,
            fw,
            startWX: wx, startWY: wy, origOffset: doorHit.offset,
          };
        } else {
          const room = rooms.find((r) => r.id === doorHit.roomId);
          dragRef.current = {
            type: 'door', id: doorHit.id, wall: doorHit.wall,
            roomWidth: room.width, roomHeight: room.height,
            doorWidth: doorHit.width,
            roomRotation: room.rotation || 0,
            startWX: wx, startWY: wy, origOffset: doorHit.offset,
          };
        }
        return;
      }

      // ── Furniture hit ──
      let furnHit = null;
      for (let i = furniture.length - 1; i >= 0; i--) {
        const f = furniture[i];
        if (ptInRect(wx, wy, f.x, f.y, f.width, f.depth)) { furnHit = f; break; }
      }
      if (furnHit) {
        // If item belongs to a group, select all group members (unless shift)
        const hitGroup = groups.find((g) => g.itemIds.includes(furnHit.id));
        if (e.shiftKey) { selectAdd(furnHit.id); return; }
        const idsToSelect = hitGroup ? hitGroup.itemIds : [furnHit.id];
        const alreadySel  = idsToSelect.every((id) => selectedIds.includes(id));
        if (!alreadySel) setSelectedIds(idsToSelect);
        if (!lockedIds.includes(furnHit.id)) {
          useFloorPlannerStore.getState()._pushHistory();
          const ids = alreadySel && selectedIds.length > 1 ? selectedIds : idsToSelect;
          const origins = {};
          const storeState = useFloorPlannerStore.getState();
          for (const id of ids) {
            if (lockedIds.includes(id)) continue;
            const f2 = storeState.furniture.find((x) => x.id === id);
            const r2 = storeState.rooms.find((x) => x.id === id);
            if (f2) origins[id] = { x: f2.x, y: f2.y, kind: 'furniture' };
            else if (r2) origins[id] = { x: r2.x, y: r2.y, kind: 'room', polygon: r2.polygon ? r2.polygon.map((v) => ({ ...v })) : null };
            else { const w2 = storeState.walls && storeState.walls.find((x) => x.id === id); if (w2) origins[id] = { x1: w2.x1, y1: w2.y1, x2: w2.x2, y2: w2.y2, kind: 'wall' }; }
          }
          dragRef.current = { type: 'multi', origins, startWX: wx, startWY: wy };
        }
        return;
      }

      // ── Priority 1b: Freestanding wall hit ───────────────────────────────
      {
        const ENDPOINT_TOL = 0.25; // metres — snap radius for endpoint handles
        let wallHit = null;
        for (let i = walls.length - 1; i >= 0; i--) {
          const w = walls[i];
          const { dist } = ptSegDist(wx, wy, w.x1, w.y1, w.x2, w.y2);
          const tol = (w.thickness || 0.15) / 2 + 0.18;
          if (dist <= tol) { wallHit = w; break; }
        }
        if (wallHit) {
          if (e.shiftKey) { selectAdd(wallHit.id); return; }
          selectOne(wallHit.id);
          if (!lockedIds.includes(wallHit.id)) {
            useFloorPlannerStore.getState()._pushHistory();
            const distP1 = Math.hypot(wx - wallHit.x1, wy - wallHit.y1);
            const distP2 = Math.hypot(wx - wallHit.x2, wy - wallHit.y2);
            const nearEp = distP1 <= ENDPOINT_TOL ? 1 : distP2 <= ENDPOINT_TOL ? 2 : 0;

            if (nearEp) {
              // Check for other walls sharing this endpoint (join drag)
              const jx = nearEp === 1 ? wallHit.x1 : wallHit.x2;
              const jy = nearEp === 1 ? wallHit.y1 : wallHit.y2;
              // endpoints: [ { id, ep: 1|2, origX1, origY1, origX2, origY2 } ]
              const joined = [{ id: wallHit.id, ep: nearEp,
                origX1: wallHit.x1, origY1: wallHit.y1,
                origX2: wallHit.x2, origY2: wallHit.y2 }];
              for (const w of walls) {
                if (w.id === wallHit.id || lockedIds.includes(w.id)) continue;
                const d1 = Math.hypot(w.x1 - jx, w.y1 - jy);
                const d2 = Math.hypot(w.x2 - jx, w.y2 - jy);
                if (d1 <= ENDPOINT_TOL)
                  joined.push({ id: w.id, ep: 1, origX1: w.x1, origY1: w.y1, origX2: w.x2, origY2: w.y2 });
                else if (d2 <= ENDPOINT_TOL)
                  joined.push({ id: w.id, ep: 2, origX1: w.x1, origY1: w.y1, origX2: w.x2, origY2: w.y2 });
              }
              if (joined.length > 1) {
                // Joint drag — all endpoints move together
                dragRef.current = { type: 'wall-join', joined, startWX: wx, startWY: wy };
              } else {
                // Solo endpoint drag — reshapes only this wall
                dragRef.current = { type: 'wall-ep', id: wallHit.id, endpoint: nearEp,
                  origX1: wallHit.x1, origY1: wallHit.y1, origX2: wallHit.x2, origY2: wallHit.y2 };
              }
            } else {
              // Drag body — moves whole wall
              dragRef.current = { type: 'wall', id: wallHit.id,
                origX1: wallHit.x1, origY1: wallHit.y1,
                origX2: wallHit.x2, origY2: wallHit.y2,
                startWX: wx, startWY: wy };
            }
          }
          return;
        }
      }

      // ── Priority 2: Group background hit ──────────────────────────────────
      // Furniture (individual items) above; rooms below.
      // Clicking empty space inside a group rect selects/drags the whole group.
      {
        let groupHit = null;
        for (let i = groups.length - 1; i >= 0; i--) {
          const b = getGroupBounds(groups[i]);
          if (b && wx >= b.minX && wx <= b.maxX && wy >= b.minY && wy <= b.maxY) {
            groupHit = groups[i]; break;
          }
        }
        if (groupHit) {
          if (e.shiftKey) {
            const allIn = groupHit.itemIds.every((id) => selectedIds.includes(id));
            const next = allIn
              ? selectedIds.filter((id) => !groupHit.itemIds.includes(id))
              : [...new Set([...selectedIds, ...groupHit.itemIds])];
            setSelectedIds(next);
          } else {
            setSelectedIds(groupHit.itemIds);
          }
          const allLocked = groupHit.itemIds.every((id) => lockedIds.includes(id));
          if (!allLocked) {
            useFloorPlannerStore.getState()._pushHistory();
            const origins = {};
            const storeState = useFloorPlannerStore.getState();
            for (const id of groupHit.itemIds) {
              if (lockedIds.includes(id)) continue;
              const f2 = storeState.furniture.find((x) => x.id === id);
              const r2 = storeState.rooms.find((x) => x.id === id);
              if (f2) origins[id] = { x: f2.x, y: f2.y, kind: 'furniture' };
              else if (r2) origins[id] = { x: r2.x, y: r2.y, kind: 'room', polygon: r2.polygon ? r2.polygon.map((v) => ({ ...v })) : null };
            }
            dragRef.current = { type: 'multi', origins, startWX: wx, startWY: wy };
          }
          return;
        }
      }

      // ── Priority 3: Room hit ───────────────────────────────────────────────
      let roomHit = null;
      for (let i = rooms.length - 1; i >= 0; i--) {
        const r = rooms[i];
        if (ptInRoom(wx, wy, r)) { roomHit = r; break; }
      }
      if (roomHit) {
        const hitGroup = groups.find((g) => g.itemIds.includes(roomHit.id));
        if (e.shiftKey) { selectAdd(roomHit.id); return; }
        const idsToSelect = hitGroup ? hitGroup.itemIds : [roomHit.id];
        const alreadySel  = idsToSelect.every((id) => selectedIds.includes(id));
        if (!alreadySel) setSelectedIds(idsToSelect);
        if (!lockedIds.includes(roomHit.id)) {
          useFloorPlannerStore.getState()._pushHistory();
          const ids = alreadySel && selectedIds.length > 1 ? selectedIds : idsToSelect;
          const origins = {};
          const storeState = useFloorPlannerStore.getState();
          for (const id of ids) {
            if (lockedIds.includes(id)) continue;
            const f2 = storeState.furniture.find((x) => x.id === id);
            const r2 = storeState.rooms.find((x) => x.id === id);
            if (f2) origins[id] = { x: f2.x, y: f2.y, kind: 'furniture' };
            else if (r2) origins[id] = { x: r2.x, y: r2.y, kind: 'room', polygon: r2.polygon ? r2.polygon.map((v) => ({ ...v })) : null };
            else { const w2 = storeState.walls && storeState.walls.find((x) => x.id === id); if (w2) origins[id] = { x1: w2.x1, y1: w2.y1, x2: w2.x2, y2: w2.y2, kind: 'wall' }; }
          }
          dragRef.current = { type: 'multi', origins, startWX: wx, startWY: wy };
        }
        return;
      }

      // ── Priority 4: Clicked empty canvas → box-select ─────────────────────
      if (!e.shiftKey) clearSelection();
      boxSelectRef.current = { startSX: sx, startSY: sy, curSX: sx, curSY: sy, additive: e.shiftKey };

    } else if (activeTool === 'wall') {
      const snap = snapWallPoint(wx, wy, rooms, walls, null);
      wallDrawRef.current = { x1: snap.x, y1: snap.y, x2: snap.x, y2: snap.y };
      wallSnapRef.current = snap;
      forceRender((n) => n + 1);

    } else if (activeTool === 'room') {
      let { x, y } = snapPt(wx, wy);
      // Snap start point to existing room corners and face lines
      for (const r of rooms) {
        for (const { x: cx, y: cy } of getRoomWorldCorners(r)) {
          if (Math.abs(wx - cx) < ROOM_SNAP_DIST) x = cx;
          if (Math.abs(wy - cy) < ROOM_SNAP_DIST) y = cy;
        }
        if (!(r.rotation || 0)) {
          for (const fx of [r.x, r.x + (r.width || 0)])  if (Math.abs(wx - fx) < ROOM_SNAP_DIST) x = fx;
          for (const fy of [r.y, r.y + (r.height || 0)]) if (Math.abs(wy - fy) < ROOM_SNAP_DIST) y = fy;
        }
      }
      drawRef.current = { startX: x, startY: y, curX: x, curY: y };
      forceRender((n) => n + 1);

    } else if (activeTool === 'furniture' && activeFurnitureDef) {
      const { x, y } = snapPt(wx, wy);
      addFurniture({
        type:      activeFurnitureDef.type,
        name:      activeFurnitureDef.name,
        x, y,
        width:     activeFurnitureDef.width,
        depth:     activeFurnitureDef.depth,
        color:     activeFurnitureDef.color,
        height3d:  activeFurnitureDef.height3d || 0.8,
        modelPath: activeFurnitureDef.modelPath || null,
      });
      // Auto-switch to select after placing
      setActiveTool('select');

    } else if (activeTool === 'door') {
      const roomHit = findNearestWall(wx, wy, rooms);
      if (roomHit) {
        addDoor({ roomId: roomHit.room.id, wall: roomHit.wall, offset: roomHit.offset });
        setActiveTool('select');
      } else {
        const fwHit = findNearestFWWall(wx, wy, walls);
        if (fwHit) {
          addDoor({ wallId: fwHit.wall.id, offset: fwHit.offset, width: DEFAULT_DOOR_WIDTH, openAngle: 90, hingeSide: 'left', swingIn: true });
          setActiveTool('select');
        }
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

      if (d.type === 'rotate') {
        const curAngle = Math.atan2(sy - d.cy, sx - d.cx);
        let deg = d.origRotation + (curAngle - d.startAngle) * (180 / Math.PI);
        if (e.shiftKey) deg = Math.round(deg / 15) * 15;
        const newRot = ((deg % 360) + 360) % 360;
        if (d.isRoom) updateRoom(d.id, { rotation: newRot });
        else          updateFurniture(d.id, { rotation: newRot });
        forceRender((n) => n + 1);
        return;
      }

      if (d.type === 'rotate-multi') {
        const curAngle = Math.atan2(sy - d.bcy, sx - d.bcx);
        let deltaDeg = (curAngle - d.startAngle) * (180 / Math.PI);
        if (e.shiftKey) deltaDeg = Math.round(deltaDeg / 15) * 15;
        const deltaRad = deltaDeg * Math.PI / 180;
        const cosA = Math.cos(deltaRad), sinA = Math.sin(deltaRad);
        const orbitPt = (px, py) => {
          const ddx = px - d.bboxWCX, ddy = py - d.bboxWCY;
          return { x: d.bboxWCX + ddx * cosA - ddy * sinA, y: d.bboxWCY + ddx * sinA + ddy * cosA };
        };
        for (const [id, orig] of Object.entries(d.origItems)) {
          if (orig.kind === 'wall') {
            // Orbit both wall endpoints around group center
            const np1 = orbitPt(orig.x1, orig.y1);
            const np2 = orbitPt(orig.x2, orig.y2);
            updateWall(id, { x1: np1.x, y1: np1.y, x2: np2.x, y2: np2.y });
          } else {
            // Orbit item center around the common bbox center
            const nc = orbitPt(orig.cx, orig.cy);
            const newX  = nc.x - orig.width / 2;
            const newY  = nc.y - orig.depth / 2;
            const newRot = ((orig.rotation + deltaDeg) % 360 + 360) % 360;
            if (orig.kind === 'furniture') updateFurniture(id, { x: newX, y: newY, rotation: newRot });
            else updateRoom(id, { x: newX, y: newY, rotation: newRot });
          }
        }
        forceRender((n) => n + 1);
        return;
      }

      if (d.type === 'wall') {
        // Candidate positions after raw delta
        const c1x = d.origX1 + dx, c1y = d.origY1 + dy;
        const c2x = d.origX2 + dx, c2y = d.origY2 + dy;
        // Try snapping each endpoint; pick the one with the tightest snap
        const s1 = snapWallPoint(c1x, c1y, rooms, walls, d.id);
        const s2 = snapWallPoint(c2x, c2y, rooms, walls, d.id);
        const d1 = s1.snapped ? Math.hypot(s1.x - c1x, s1.y - c1y) : Infinity;
        const d2 = s2.snapped ? Math.hypot(s2.x - c2x, s2.y - c2y) : Infinity;
        let nx1, ny1, nx2, ny2;
        if (d1 <= d2 && s1.snapped) {
          // Snap ep1; translate ep2 by same delta
          const sdx = s1.x - c1x, sdy = s1.y - c1y;
          nx1 = s1.x; ny1 = s1.y;
          nx2 = snapVal(c2x + sdx); ny2 = snapVal(c2y + sdy);
        } else if (d2 < d1 && s2.snapped) {
          // Snap ep2; translate ep1 by same delta
          const sdx = s2.x - c2x, sdy = s2.y - c2y;
          nx2 = s2.x; ny2 = s2.y;
          nx1 = snapVal(c1x + sdx); ny1 = snapVal(c1y + sdy);
        } else {
          nx1 = snapVal(c1x); ny1 = snapVal(c1y);
          nx2 = snapVal(c2x); ny2 = snapVal(c2y);
        }
        // Update snap indicator for body drag
        const snapped = d1 <= d2 ? s1 : s2;
        wallSnapRef.current = snapped.snapped ? snapped : null;
        updateWall(d.id, { x1: nx1, y1: ny1, x2: nx2, y2: ny2 });
        // HUD: dimension + parallel comparison lines
        alignGuidesRef.current = computeWallAlignGuides(nx1, ny1, nx2, ny2, d.id, walls, rooms);
      } else if (d.type === 'wall-join') {
        // Move all joined endpoints by the same snapped delta
        const snap = snapWallPoint(wx, wy, rooms, walls, d.joined[0].id);
        const nx = snap.x, ny = snap.y;
        for (const ep of d.joined) {
          if (ep.ep === 1) updateWall(ep.id, { x1: nx, y1: ny });
          else             updateWall(ep.id, { x2: nx, y2: ny });
        }
        wallSnapRef.current = snap.snapped ? snap : null;
      } else if (d.type === 'wall-ep') {
        const snap = snapWallPoint(wx, wy, rooms, walls, d.id);
        let nx = snap.x, ny = snap.y;
        if (e.shiftKey) {
          const fx = d.endpoint === 1 ? d.origX2 : d.origX1;
          const fy = d.endpoint === 1 ? d.origY2 : d.origY1;
          const edx = nx - fx, edy = ny - fy;
          const adx = Math.abs(edx), ady = Math.abs(edy);
          if (adx > ady * 2)      { ny = fy; }
          else if (ady > adx * 2) { nx = fx; }
          else { const d2 = snapVal(Math.min(adx, ady)); nx = fx + (edx >= 0 ? d2 : -d2); ny = fy + (edy >= 0 ? d2 : -d2); }
        }
        if (d.endpoint === 1) updateWall(d.id, { x1: nx, y1: ny });
        else                   updateWall(d.id, { x2: nx, y2: ny });
        { const ex1 = d.endpoint === 1 ? nx : d.origX1, ey1 = d.endpoint === 1 ? ny : d.origY1;
          const ex2 = d.endpoint === 2 ? nx : d.origX2, ey2 = d.endpoint === 2 ? ny : d.origY2;
          alignGuidesRef.current = computeWallAlignGuides(ex1, ey1, ex2, ey2, d.id, walls, rooms); }
      } else if (d.type === 'multi') {
        // Snap the delta ONCE so all items move as a rigid group.
        let sdx = snapVal(d.startWX + dx) - d.startWX;
        let sdy = snapVal(d.startWY + dy) - d.startWY;

        // Room edge-to-edge snap: pull dragged room faces onto stationary room faces.
        const edgeSnap = computeRoomEdgeSnap(d.origins, rooms, sdx, sdy);
        sdx = edgeSnap.sdx;
        sdy = edgeSnap.sdy;
        alignGuidesRef.current = edgeSnap.guides;

        // Overlap prevention: don't let dragged rooms land on top of stationary rooms.
        const draggedRoomIds = new Set(
          Object.entries(d.origins).filter(([, o]) => o.kind === 'room').map(([id]) => id)
        );
        const staticRooms = rooms.filter((r) => !draggedRoomIds.has(r.id) && !r.polygon);
        const wouldOverlap = (testSDX, testSDY) =>
          Object.entries(d.origins).some(([id, orig]) => {
            if (orig.kind !== 'room' || orig.polygon) return false;
            const full = rooms.find((r) => r.id === id);
            if (!full || full.polygon) return false;
            const nx = orig.x + testSDX, ny = orig.y + testSDY;
            return staticRooms.some((sr) => roomsOverlap(nx, ny, full.width, full.height, sr.x, sr.y, sr.width, sr.height));
          });
        if (wouldOverlap(sdx, sdy)) {
          if (!wouldOverlap(sdx, 0))      { sdy = 0; }
          else if (!wouldOverlap(0, sdy)) { sdx = 0; }
          else                            { sdx = 0; sdy = 0; }
        }

        for (const [id, orig] of Object.entries(d.origins)) {
          if (orig.kind === 'furniture') {
            updateFurniture(id, { x: orig.x + sdx, y: orig.y + sdy });
          } else if (orig.kind === 'room') {
            const nx = orig.x + sdx, ny = orig.y + sdy;
            if (orig.polygon) {
              const newPoly = orig.polygon.map((v) => ({ x: v.x + sdx, y: v.y + sdy }));
              updateRoom(id, { x: nx, y: ny, polygon: newPoly });
            } else {
              updateRoom(id, { x: nx, y: ny });
            }
          } else if (orig.kind === 'wall') {
            updateWall(id, { x1: orig.x1 + sdx, y1: orig.y1 + sdy, x2: orig.x2 + sdx, y2: orig.y2 + sdy });
          }
        }
      } else if (d.type === 'room-vertex') {
        const newPoly = d.origPoly.map((v) => ({ ...v }));
        newPoly[d.vertexIdx] = { x: snapVal(wx), y: snapVal(wy) };
        const bb = polyBoundingBox(newPoly);
        updateRoom(d.id, { polygon: newPoly, ...bb });
      } else if (d.type === 'room-edge-extrude') {
        const newPoly = d.origPoly.map((v) => ({ ...v }));
        const ddx = snapVal(wx) - snapVal(d.startWX);
        const ddy = snapVal(wy) - snapVal(d.startWY);
        newPoly[d.vi] = { x: d.origPoly[d.vi].x + ddx, y: d.origPoly[d.vi].y + ddy };
        newPoly[d.vj] = { x: d.origPoly[d.vj].x + ddx, y: d.origPoly[d.vj].y + ddy };
        const bb = polyBoundingBox(newPoly);
        updateRoom(d.id, { polygon: newPoly, ...bb });
      } else if (d.type === 'multi-resize') {
        applyMultiResize(d, wx, wy);
      } else if (d.type === 'resize') {
        applyResize(d, wx, wy);
      } else if (d.type === 'door') {
        const isHorizontal = d.wall === 'north' || d.wall === 'south';
        const wallLen      = isHorizontal ? d.roomWidth : d.roomHeight;
        // Project delta onto the wall direction (accounts for room rotation)
        const rotRad = (d.roomRotation || 0) * Math.PI / 180;
        const wallDirX = isHorizontal ?  Math.cos(rotRad) : -Math.sin(rotRad);
        const wallDirY = isHorizontal ?  Math.sin(rotRad) :  Math.cos(rotRad);
        const proj = dx * wallDirX + dy * wallDirY;
        const raw  = d.origOffset + proj;
        const clamped = Math.max(0, Math.min(wallLen - d.doorWidth, snapVal(raw)));
        updateDoor(d.id, { offset: clamped });
      } else if (d.type === 'fwDoor') {
        // Project mouse delta onto the wall direction to get offset change
        const fw = walls.find((w) => w.id === d.wallId) || d.fw;
        if (!fw) return;
        const fwLen = Math.hypot(fw.x2 - fw.x1, fw.y2 - fw.y1);
        if (fwLen < 0.01) return;
        const dirX = (fw.x2 - fw.x1) / fwLen, dirY = (fw.y2 - fw.y1) / fwLen;
        const proj  = dx * dirX + dy * dirY;
        const raw   = d.origOffset + proj;
        const clamped = Math.max(0, Math.min(fwLen - d.doorWidth, snapVal(raw)));
        updateDoor(d.id, { offset: clamped });
      }
      return;
    }

    if (boxSelectRef.current) {
      boxSelectRef.current = { ...boxSelectRef.current, curSX: sx, curSY: sy };
      forceRender((n) => n + 1);
      return;
    }

    if (drawRef.current) {
      // Snap cursor to room corners and face lines while drawing a new room.
      // Uses world-space positions so rotated rooms snap correctly.
      const ds = drawRef.current;
      let { x, y } = snapPt(wx, wy);
      const newGuides = [];
      for (const r of rooms) {
        // Corner snap (all rooms, incl. rotated)
        for (const { x: cx, y: cy } of getRoomWorldCorners(r)) {
          if (Math.abs(wx - cx) < ROOM_SNAP_DIST) { x = cx; newGuides.push({ axis: 'x', value: cx }); }
          if (Math.abs(wy - cy) < ROOM_SNAP_DIST) { y = cy; newGuides.push({ axis: 'y', value: cy }); }
          if (Math.abs(ds.startX - cx) < ROOM_SNAP_DIST) newGuides.push({ axis: 'x', value: cx });
          if (Math.abs(ds.startY - cy) < ROOM_SNAP_DIST) newGuides.push({ axis: 'y', value: cy });
        }
        // Face-line snap (axis-aligned rooms only — snaps cursor onto an edge line)
        if (!(r.rotation || 0)) {
          for (const fx of [r.x, r.x + (r.width || 0)]) {
            const face = getWorldWallFace(r, fx === r.x ? 'west' : 'east');
            if (Math.abs(wx - fx) < ROOM_SNAP_DIST) {
              x = fx;
              newGuides.push({ axis: 'x', value: fx, kind: 'edge', faceS: face.s, faceE: face.e });
            }
            if (Math.abs(ds.startX - fx) < ROOM_SNAP_DIST)
              newGuides.push({ axis: 'x', value: fx, kind: 'edge', faceS: face.s, faceE: face.e });
          }
          for (const fy of [r.y, r.y + (r.height || 0)]) {
            const face = getWorldWallFace(r, fy === r.y ? 'north' : 'south');
            if (Math.abs(wy - fy) < ROOM_SNAP_DIST) {
              y = fy;
              newGuides.push({ axis: 'y', value: fy, kind: 'edge', faceS: face.s, faceE: face.e });
            }
            if (Math.abs(ds.startY - fy) < ROOM_SNAP_DIST)
              newGuides.push({ axis: 'y', value: fy, kind: 'edge', faceS: face.s, faceE: face.e });
          }
        }
      }
      alignGuidesRef.current = newGuides;
      drawRef.current = { ...ds, curX: x, curY: y };
      forceRender((n) => n + 1);
    }

    if (wallDrawRef.current) {
      // First try room/wall snap, then apply shift constraint on top
      const snap = snapWallPoint(wx, wy, rooms, walls, null);
      let { x, y } = snap;
      if (e.shiftKey) {
        const dx = x - wallDrawRef.current.x1;
        const dy = y - wallDrawRef.current.y1;
        const adx = Math.abs(dx), ady = Math.abs(dy);
        if (adx > ady * 2)      { y = wallDrawRef.current.y1; }
        else if (ady > adx * 2) { x = wallDrawRef.current.x1; }
        else { const d = snapVal(Math.min(adx, ady)); x = wallDrawRef.current.x1 + (dx >= 0 ? d : -d); y = wallDrawRef.current.y1 + (dy >= 0 ? d : -d); }
      }
      wallDrawRef.current = { ...wallDrawRef.current, x2: x, y2: y };
      wallSnapRef.current = snap.snapped ? snap : null;
      // Show HUD while drawing a new wall
      { const wd = wallDrawRef.current;
        const wLen = Math.hypot(wd.x2 - wd.x1, wd.y2 - wd.y1);
        if (wLen > 0.05) {
          alignGuidesRef.current = computeWallAlignGuides(wd.x1, wd.y1, wd.x2, wd.y2, '__preview__', walls, rooms);
        } else {
          alignGuidesRef.current = [];
        }
      }
      forceRender((n) => n + 1);
    }

    // Wall snap preview — update indicator even before drawing starts
    if (activeTool === 'wall' && !wallDrawRef.current) {
      const snap = snapWallPoint(wx, wy, rooms, walls, null);
      const prev = wallSnapRef.current;
      if (!prev || prev.x !== snap.x || prev.y !== snap.y || prev.snapped !== snap.snapped) {
        wallSnapRef.current = snap.snapped ? snap : null;
        forceRender((n) => n + 1);
      }
    }

    if (activeTool === 'furniture' && activeFurnitureDef) {
      const { x, y } = snapPt(wx, wy);
      hoverRef.current = { x, y };
      forceRender((n) => n + 1);
    }

    if (activeTool === 'door') {
      const roomHit = findNearestWall(wx, wy, rooms);
      if (roomHit) {
        doorHoverRef.current = roomHit;
      } else {
        const fwHit = findNearestFWWall(wx, wy, walls);
        doorHoverRef.current = fwHit ? { fwWall: fwHit.wall, offset: fwHit.offset } : null;
      }
      forceRender((n) => n + 1);
    }

    // Update hover handle + group hover for cursor
    if (activeTool === 'select' && !dragRef.current && !panRef.current) {
      const rotOver = !!getRotateHandleAtScreen(sx, sy) || !!getMultiRotateHandleAtScreen(sx, sy);
      if (rotOver !== hoverRotateRef.current) {
        hoverRotateRef.current = rotOver;
        forceRender((n) => n + 1);
      }

      const hit  = getHandleAtScreen(sx, sy);
      const mHit = selectedIds.length > 1 ? getMultiHandleAtScreen(sx, sy) : null;
      const key  = hit?.key ?? mHit?.key ?? null;
      if (key !== hoverHandleRef.current) {
        hoverHandleRef.current = key;
        forceRender((n) => n + 1);
      }

      // Check if hovering over empty space inside a group rect (no item directly under cursor)
      const overItem = furniture.some((f) => ptInRect(wx, wy, f.x, f.y, f.width, f.depth))
                    || rooms.some((r) => ptInRoom(wx, wy, r));
      const overGroup = !overItem && groups.some((g) => {
        const b = getGroupBounds(g);
        return b && wx >= b.minX && wx <= b.maxX && wy >= b.minY && wy <= b.maxY;
      });
      if (overGroup !== hoverGroupRef.current) {
        hoverGroupRef.current = overGroup;
        forceRender((n) => n + 1);
      }

      // Wall endpoint hover (for resize cursor)
      const EP_TOL = 0.25;
      const overWallEp = selectedIds.length === 1 && walls.some((w) => {
        if (w.id !== selectedIds[0]) return false;
        return Math.hypot(wx - w.x1, wy - w.y1) <= EP_TOL ||
               Math.hypot(wx - w.x2, wy - w.y2) <= EP_TOL;
      });
      if (overWallEp !== hoverWallEpRef.current) {
        hoverWallEpRef.current = overWallEp;
        forceRender((n) => n + 1);
      }
    }
  };

  const onMouseUp = () => {
    if (panRef.current)  { panRef.current = null; return; }
    if (dragRef.current) {
      dragRef.current = null;
      wallSnapRef.current = null;

      alignGuidesRef.current = [];
      return;
    }

    // Box-select finalize
    const bs = boxSelectRef.current;
    if (bs) {
      boxSelectRef.current = null;
      const w1 = toWorld(Math.min(bs.startSX, bs.curSX), Math.min(bs.startSY, bs.curSY));
      const w2 = toWorld(Math.max(bs.startSX, bs.curSX), Math.max(bs.startSY, bs.curSY));
      const bsW = Math.abs(bs.curSX - bs.startSX);
      const bsH = Math.abs(bs.curSY - bs.startSY);
      // Ctrl+click (no real drag) — absorb the event so rooms don't get selected
      if (bsW <= 4 && bsH <= 4 && bs.noRooms) { forceRender((n) => n + 1); return; }
      if (bsW > 4 && bsH > 4) {
        const inBox = (x, y, w, h) => x < w2.x && x + w > w1.x && y < w2.y && y + h > w1.y;
        // Check if any point of a wall segment is inside the box
        const wallInBox = (wx1, wy1, wx2, wy2) => {
          if (wx1 >= w1.x && wx1 <= w2.x && wy1 >= w1.y && wy1 <= w2.y) return true;
          if (wx2 >= w1.x && wx2 <= w2.x && wy2 >= w1.y && wy2 <= w2.y) return true;
          const mx = (wx1 + wx2) / 2, my = (wy1 + wy2) / 2;
          return mx >= w1.x && mx <= w2.x && my >= w1.y && my <= w2.y;
        };
        const hits = [];
        for (const f of furniture) { if (inBox(f.x, f.y, f.width, f.depth)) hits.push(f.id); }
        if (!bs.noRooms) {
          for (const r of rooms) { if (inBox(r.x, r.y, r.width, r.height)) hits.push(r.id); }
        }
        if (walls) {
          for (const w of walls) { if (wallInBox(w.x1, w.y1, w.x2, w.y2)) hits.push(w.id); }
        }
        if (hits.length > 0) {
          if (bs.additive) {
            setSelectedIds([...new Set([...selectedIds, ...hits])]);
          } else {
            setSelectedIds(hits);
          }
        }
      }
      forceRender((n) => n + 1);
      return;
    }

    const ws = wallDrawRef.current;
    if (ws) {
      const len = Math.hypot(ws.x2 - ws.x1, ws.y2 - ws.y1);
      if (len >= 0.25) {
        addWall({ x1: ws.x1, y1: ws.y1, x2: ws.x2, y2: ws.y2 });
        setActiveTool('select');
      }
      wallDrawRef.current = null;
      alignGuidesRef.current = [];

      forceRender((n) => n + 1);
    }

    const ds = drawRef.current;
    if (ds) {
      const rx = Math.min(ds.startX, ds.curX), ry = Math.min(ds.startY, ds.curY);
      const rw = Math.abs(ds.curX - ds.startX), rh = Math.abs(ds.curY - ds.startY);
      if (rw >= 0.5 && rh >= 0.5) {
        addRoom({ x: rx, y: ry, width: rw, height: rh });
        setActiveTool('select'); // auto-switch to select after placing
      }
      drawRef.current = null;
      alignGuidesRef.current = [];
      forceRender((n) => n + 1);
    }
  };

  const [ctrlHeld, setCtrlHeld] = useState(false);
  useEffect(() => {
    const down = (e) => { if (e.key === 'Control') setCtrlHeld(true);  };
    const up   = (e) => { if (e.key === 'Control') setCtrlHeld(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const cursor =
    panRef.current                                          ? 'grabbing' :
    activeTool === 'room'                                   ? 'crosshair' :
    activeTool === 'wall'                                   ? 'crosshair' :
    activeTool === 'furniture'                              ? 'copy' :
    activeTool === 'door'                                   ? 'cell' :
    dragRef.current?.type === 'rotate'                      ? 'grab' :
    dragRef.current?.type === 'rotate-multi'                ? 'grab' :
    dragRef.current?.type === 'resize'                      ? HANDLE_CURSORS[dragRef.current.key] :
    dragRef.current                                         ? 'move' :
    ctrlHeld && activeTool === 'select'                     ? 'crosshair' :
    hoverRotateRef.current                                  ? 'grab' :
    hoverWallEpRef.current                                  ? 'crosshair' :
    hoverHandleRef.current && HANDLE_CURSORS[hoverHandleRef.current] ? HANDLE_CURSORS[hoverHandleRef.current] :
    hoverHandleRef.current                                  ? 'move' :
    hoverGroupRef.current                                   ? 'grab' :
    'default';

  const selCount = selectedIds.length;

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
      onContextMenu={(e) => e.preventDefault()}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ display: 'block', cursor }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { panRef.current = null; hoverRef.current = null; doorHoverRef.current = null; hoverHandleRef.current = null; hoverRotateRef.current = false; wallSnapRef.current = null; }}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Mini-map */}
      <canvas
        ref={miniCanvasRef}
        width={MINI_W}
        height={MINI_H}
        style={{
          position: 'absolute', bottom: 50, right: 14,
          borderRadius: 7,
          boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
          pointerEvents: 'none',
          imageRendering: 'pixelated',
        }}
      />

      {/* Scale badge */}
      <div style={{ position: 'absolute', bottom: 14, right: 14,
        background: 'rgba(255,255,255,0.92)', padding: '5px 10px', borderRadius: 4,
        fontSize: 12, color: '#666', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        pointerEvents: 'none', fontFamily: 'monospace' }}>
        {Math.round(scale * 100)}% · 1 grid = 0.6 m
      </div>

      {/* Selection count badge */}
      {selCount > 1 && (
        <div style={{ position: 'absolute', bottom: 44, right: 14,
          background: '#1976D2', color: '#fff', padding: '4px 10px', borderRadius: 4,
          fontSize: 12, fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          pointerEvents: 'none' }}>
          {selCount} selected
        </div>
      )}

      {/* Help hint */}
      <div style={{ position: 'absolute', bottom: 14, left: 14,
        background: 'rgba(255,255,255,0.88)', padding: '8px 12px', borderRadius: 4,
        fontSize: 11, color: '#666', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        lineHeight: 1.6, pointerEvents: 'none' }}>
        {activeTool === 'room'      && 'Click + drag to draw a room'}
        {activeTool === 'wall'      && 'Click + drag to draw a wall'}
        {activeTool === 'furniture' && activeFurnitureDef && `Click to place ${activeFurnitureDef.name}`}
        {activeTool === 'door'      && 'Click on any wall to place a door'}
        {activeTool === 'select'    && 'Click · Shift+click multi-select · Drag empty to box-select · Arrow keys nudge rooms/furniture/doors · R rotate · Del delete · Ctrl+C/V copy · Ctrl+G group · Alt+drag pan'}
      </div>

      {/* ── Right-click context menu — rendered in a portal to escape overflow:hidden ── */}
      {contextMenu && createPortal(
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          hitId={contextMenu.hitId}
          group={contextMenu.group}
          selectedIds={selectedIds}
          groups={groups}
          onClose={() => setContextMenu(null)}
          onGroup={() => { groupSelected(); setContextMenu(null); }}
          onUngroup={(gid) => { ungroupIds([gid]); setContextMenu(null); }}
          onDeleteGroup={(gid) => { deleteGroup(gid); setContextMenu(null); }}
          onDelete={() => { deleteSelected(); setContextMenu(null); }}
          onCopy={() => { copySelected(); setContextMenu(null); }}
          onRenameGroup={(gid, name) => { renameGroup(gid, name); }}
          onLock={() => { useFloorPlannerStore.getState().lockSelected(); setContextMenu(null); }}
          onUnlock={() => { useFloorPlannerStore.getState().unlockSelected(); setContextMenu(null); }}
          lockedIds={lockedIds}
        />,
        document.body
      )}
    </div>
  );
};

export default FloorPlanEditor;
