import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import useFloorPlannerStore, {
  getWallEndpoints,
  getDoorInfo,
} from '../../store/floorPlannerStore';

const PPM  = 60;    // pixels per meter at scale = 1
const SNAP = 0.25;  // snap grid in meters
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
const FloorPlanEditor = () => {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);

  const [scale, setScale]           = useState(1.2);
  const [offset, setOffset]         = useState({ x: 180, y: 120 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Mutable refs for event handlers (avoid stale closures)
  const scaleRef       = useRef(scale);
  const offsetRef      = useRef(offset);
  const drawRef        = useRef(null);    // room draw: { startX, startY, curX, curY }
  const dragRef        = useRef(null);    // active drag state
  const panRef         = useRef(null);    // pan state
  const hoverRef       = useRef(null);    // furniture hover position
  const doorHoverRef   = useRef(null);    // door placement preview
  const boxSelectRef    = useRef(null);    // box-select drag: { startSX, startSY, curSX, curSY, additive }
  const hoverHandleRef  = useRef(null);    // handle corner/edge key the mouse is hovering ('nw', 'n', …)
  const hoverGroupRef   = useRef(false);   // true when mouse is over empty area inside a group rect
  const [renderTick, forceRender] = useState(0);

  scaleRef.current  = scale;
  offsetRef.current = offset;

  const {
    rooms, furniture, doors, groups,
    selectedIds, lockedIds,
    activeTool, activeFurnitureDef,
    showHeatmap,
    addRoom, updateRoom,
    addFurniture, updateFurniture,
    addDoor, updateDoor,
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
      else if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); copySelected(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); pasteClipboard(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); copySelected(); pasteClipboard(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
      else if (e.key === 'Escape') { clearSelection(); drawRef.current = null; forceRender((n) => n + 1); }
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

        for (const id of ids) {
          if (locked.includes(id)) continue;
          const room = rs.find((r) => r.id === id);
          if (room) { updateRoom(id, { x: room.x + dx, y: room.y + dy }); continue; }
          const furn2 = furn.find((f) => f.id === id);
          if (furn2) { updateFurniture(id, { x: furn2.x + dx, y: furn2.y + dy }); continue; }
          // Doors: slide along their wall axis
          const door = ds.find((d) => d.id === id);
          if (door) {
            const room2 = rs.find((r) => r.id === door.roomId);
            if (!room2) continue;
            const isHoriz = door.wall === 'north' || door.wall === 'south';
            const wallLen = isHoriz ? room2.width : room2.height;
            const delta   = isHoriz ? dx : dy;
            const newOff  = Math.max(0, Math.min(wallLen - door.width, door.offset + delta));
            updateDoor(id, { offset: newOff });
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, deleteSelected, clearSelection, rotateSelectedFurniture, setSelectedIds, copySelected, pasteClipboard, updateRoom, updateFurniture, updateDoor, groupSelected, ungroupSelected]);

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
    rooms.forEach((room) => drawRoom(ctx, room, selectedIds.includes(room.id)));
    if (showHeatmap) drawHeatmap(ctx);
    doors.forEach((door) => {
      const room = rooms.find((r) => r.id === door.roomId);
      if (room) drawDoorSymbol(ctx, door, room, selectedIds.includes(door.id));
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

    // Door placement preview
    const dh = doorHoverRef.current;
    if (activeTool === 'door' && dh) {
      const previewDoor = { id: '__preview__', width: DEFAULT_DOOR_WIDTH, openAngle: 90, hingeSide: 'left', swingIn: true, ...dh };
      ctx.globalAlpha = 0.6;
      drawDoorSymbol(ctx, previewDoor, dh.room, false);
      ctx.globalAlpha = 1;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, furniture, doors, groups, selectedIds, lockedIds, canvasSize, scale, offset, activeTool, activeFurnitureDef, showHeatmap, renderTick]);

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

  // ── Heatmap overlay ─────────────────────────────────────────────────────────
  // For each sensor with a value, draw a radial gradient centred on its asset.
  // value 0–39 → green, 40–64 → yellow, 65–79 → orange, 80–100 → red
  const heatColor = (v) => {
    if (v < 40)  return { r: 76,  g: 175, b: 80  }; // green
    if (v < 65)  return { r: 255, g: 193, b: 7   }; // yellow
    if (v < 80)  return { r: 230, g: 81,  b: 0   }; // orange
    return             { r: 198, g: 40,  b: 40  }; // red
  };

  const drawHeatmap = (ctx) => {
    const sc  = scaleRef.current;
    const off = offsetRef.current;

    for (const item of furniture) {
      if (!item.sensors?.length) continue;
      const maxSensor = item.sensors.reduce(
        (best, s) => ((s.value ?? 0) > (best.value ?? 0) ? s : best),
        item.sensors[0],
      );
      const v = maxSensor.value ?? 0;
      if (v === 0) continue;

      // Find the room this asset sits in (centre-point test)
      const acx = item.x + item.width / 2;
      const acy = item.y + item.depth / 2;
      const room = rooms.find(
        (r) => acx >= r.x && acx <= r.x + r.width && acy >= r.y && acy <= r.y + r.height,
      );

      const cx = acx * PPM * sc + off.x;
      const cy = acy * PPM * sc + off.y;
      const radius = 2 * PPM * sc; // fixed 2 m spread

      const { r: cr, g: cg, b: cb } = heatColor(v);
      const alpha = 0.55 + v * 0.004; // 0.55 → 0.95
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0,    `rgba(${cr},${cg},${cb},${Math.min(0.95, alpha).toFixed(2)})`);
      grad.addColorStop(0.35, `rgba(${cr},${cg},${cb},${(alpha * 0.7).toFixed(2)})`);
      grad.addColorStop(0.7,  `rgba(${cr},${cg},${cb},${(alpha * 0.3).toFixed(2)})`);
      grad.addColorStop(1,    `rgba(${cr},${cg},${cb},0)`);

      ctx.save();
      ctx.globalCompositeOperation = 'multiply';

      // Clip to room floor so heat never bleeds through walls
      if (room) {
        const wt = (room.wallThickness || 0.05) * PPM * sc;
        const rsp = toScreen(room.x, room.y);
        const rsw = room.width  * PPM * sc;
        const rsh = room.height * PPM * sc;
        ctx.beginPath();
        ctx.rect(rsp.x + wt / 2, rsp.y + wt / 2, rsw - wt, rsh - wt);
        ctx.clip();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
  };

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
    if (off.x > 0 && off.x < width)  { ctx.beginPath(); ctx.moveTo(off.x, 0); ctx.lineTo(off.x, height); ctx.stroke(); }
    if (off.y > 0 && off.y < height) { ctx.beginPath(); ctx.moveTo(0, off.y); ctx.lineTo(width, off.y);  ctx.stroke(); }
  };

  // Handle sizes — larger = easier to grab
  const HANDLE_CORNER = 5;  // corner square half-size (px)
  const HANDLE_EDGE   = 4;  // edge midpoint circle radius (px)
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

  // ── Draw room with per-wall segments (allows door gaps) ───────────────────
  const drawRoom = (ctx, room, isSel) => {
    const sc = scaleRef.current;
    const sp = toScreen(room.x, room.y);
    const sw = room.width  * PPM * sc;
    const sh = room.height * PPM * sc;
    const wt = (room.wallThickness || 0.15) * PPM * sc;
    const isLocked = lockedIds.includes(room.id);

    ctx.fillStyle = room.floorColor;
    ctx.fillRect(sp.x + wt / 2, sp.y + wt / 2, sw - wt, sh - wt);

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
          ctx.moveTo(sp1.x + (sp2.x - sp1.x) * prevT,   sp1.y + (sp2.y - sp1.y) * prevT);
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

    if (sw > 50 && sh > 28) {
      ctx.fillStyle    = isSel ? '#1565C0' : 'rgba(0,0,0,0.45)';
      ctx.font         = `${Math.max(10, 12 * sc)}px sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(room.name, sp.x + sw / 2, sp.y + sh / 2);
    }

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

    // Selection handles (only when single item selected)
    if (isSel && selectedIds.length === 1) {
      drawHandles(ctx, sp.x, sp.y, sw, sh);
    }

    if (isLocked) drawLockBadge(ctx, sp.x + sw - 8 * sc, sp.y + 8 * sc, sc);
  };

  // ── Draw door swing symbol ───────────────────────────────────────────────
  const drawDoorSymbol = (ctx, door, room, isSel) => {
    const sc = scaleRef.current;
    const { hingePoint, panelDir, swingDir } = getDoorInfo(door, room);
    const sh  = toScreen(hingePoint.x, hingePoint.y);
    const radius = door.width * PPM * sc;

    const θ = door.openAngle * Math.PI / 180;
    const tipWorld = {
      x: hingePoint.x + door.width * (Math.cos(θ) * panelDir.x + Math.sin(θ) * swingDir.x),
      y: hingePoint.y + door.width * (Math.cos(θ) * panelDir.y + Math.sin(θ) * swingDir.y),
    };
    const sTip = toScreen(tipWorld.x, tipWorld.y);

    const panelColor = isSel ? '#1565C0' : '#7B5B3A';
    const arcColor   = isSel ? 'rgba(21,101,192,0.4)' : 'rgba(123,91,58,0.35)';

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
    drawFurnitureSymbol(ctx, item.type, sw, sd, sc);

    ctx.strokeStyle = isSel ? '#1565C0' : 'rgba(0,0,0,0.28)';
    ctx.lineWidth   = isSel ? 2 : 1;
    ctx.strokeRect(0, 0, sw, sd);

    // Selection handles drawn in rotated local space
    if (isSel && selectedIds.length === 1) {
      drawHandles(ctx, 0, 0, sw, sd);
    }

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
    const iw  = item.width, ih = room ? item.height : item.depth;
    const sp  = toScreen(item.x, item.y);
    const sw  = iw * PPM * scaleRef.current;
    const sh  = ih * PPM * scaleRef.current;
    const rot = ((furn?.rotation || 0) * Math.PI) / 180;
    const cx  = sp.x + sw / 2, cy = sp.y + sh / 2;
    const t   = HANDLE_TOL;

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

  // ── Apply resize given current world mouse position ────────────────────────
  // For rotated furniture: project delta onto local axes and resize from center.
  // For rooms (no rotation): classic corner/edge resize.
  const applyResize = (drag, wx, wy) => {
    const MIN = SNAP;

    if (!drag.isRoom && drag.rot !== 0) {
      // ── Rotated furniture: resize symmetrically from center in local space ──
      const origCX = drag.origX + drag.origW / 2;
      const origCY = drag.origY + drag.origH / 2;
      // World delta from drag start
      const dwx = wx - drag.startWX, dwy = wy - drag.startWY;
      // Project onto local axes (unrotate delta)
      const cos = Math.cos(-drag.rot), sin = Math.sin(-drag.rot);
      const localDX = dwx * cos - dwy * sin;
      const localDY = dwx * sin + dwy * cos;

      let nw = drag.origW, nh = drag.origH;
      // Map handle key to which axis it stretches
      switch (drag.key) {
        case 'e': case 'ne': case 'se': nw = Math.max(MIN, snapVal(drag.origW + localDX)); break;
        case 'w': case 'nw': case 'sw': nw = Math.max(MIN, snapVal(drag.origW - localDX)); break;
      }
      switch (drag.key) {
        case 's': case 'se': case 'sw': nh = Math.max(MIN, snapVal(drag.origH + localDY)); break;
        case 'n': case 'ne': case 'nw': nh = Math.max(MIN, snapVal(drag.origH - localDY)); break;
      }
      // Keep center fixed, recompute top-left
      updateFurniture(selectedId, { x: origCX - nw / 2, y: origCY - nh / 2, width: nw, depth: nh });
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
    if (drag.isRoom) updateRoom(selectedId, { x: nx, y: ny, width: nw, height: nh });
    else             updateFurniture(selectedId, { x: nx, y: ny, width: nw, depth: nh });
  };

  const checkDoorHit = (wx, wy) => {
    const tol = 0.25;
    for (const door of doors) {
      const room = rooms.find((r) => r.id === door.roomId);
      if (!room) continue;
      const { hingePoint, panelDir, swingDir } = getDoorInfo(door, room);
      if (Math.hypot(wx - hingePoint.x, wy - hingePoint.y) < tol) return door;
      const θ = door.openAngle * Math.PI / 180;
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

      // ── Resize handle check (screen-space, only single selection) ──
      const handleHit = getHandleAtScreen(sx, sy);
      if (handleHit) {
        useFloorPlannerStore.getState()._pushHistory();
        dragRef.current = { type: 'resize', ...handleHit, startWX: wx, startWY: wy };
        return;
      }

      // ── Door hit ──
      const doorHit = checkDoorHit(wx, wy);
      if (doorHit) {
        if (e.shiftKey) { selectAdd(doorHit.id); return; }
        selectOne(doorHit.id);
        const room = rooms.find((r) => r.id === doorHit.roomId);
        useFloorPlannerStore.getState()._pushHistory();
        dragRef.current = {
          type: 'door', id: doorHit.id, wall: doorHit.wall,
          roomWidth: room.width, roomHeight: room.height,
          doorWidth: doorHit.width,
          startWX: wx, startWY: wy, origOffset: doorHit.offset,
        };
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
            else if (r2) origins[id] = { x: r2.x, y: r2.y, kind: 'room' };
          }
          dragRef.current = { type: 'multi', origins, startWX: wx, startWY: wy };
        }
        return;
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
              else if (r2) origins[id] = { x: r2.x, y: r2.y, kind: 'room' };
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
        if (ptInRect(wx, wy, r.x, r.y, r.width, r.height)) { roomHit = r; break; }
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
            else if (r2) origins[id] = { x: r2.x, y: r2.y, kind: 'room' };
          }
          dragRef.current = { type: 'multi', origins, startWX: wx, startWY: wy };
        }
        return;
      }

      // ── Priority 4: Clicked empty canvas → box-select ─────────────────────
      if (!e.shiftKey) clearSelection();
      boxSelectRef.current = { startSX: sx, startSY: sy, curSX: sx, curSY: sy, additive: e.shiftKey };

    } else if (activeTool === 'room') {
      const { x, y } = snapPt(wx, wy);
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

      if (d.type === 'multi') {
        for (const [id, orig] of Object.entries(d.origins)) {
          const nx = snapVal(orig.x + dx), ny = snapVal(orig.y + dy);
          if (orig.kind === 'furniture') updateFurniture(id, { x: nx, y: ny });
          else if (orig.kind === 'room')  updateRoom(id, { x: nx, y: ny });
        }
      } else if (d.type === 'resize') {
        applyResize(d, wx, wy);
      } else if (d.type === 'door') {
        const isHorizontal = d.wall === 'north' || d.wall === 'south';
        const wallLen      = isHorizontal ? d.roomWidth : d.roomHeight;
        const raw          = d.origOffset + (isHorizontal ? dx : dy);
        const clamped      = Math.max(0, Math.min(wallLen - d.doorWidth, snapVal(raw)));
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

    // Update hover handle + group hover for cursor
    if (activeTool === 'select' && !dragRef.current && !panRef.current) {
      const hit = getHandleAtScreen(sx, sy);
      const key = hit?.key ?? null;
      if (key !== hoverHandleRef.current) {
        hoverHandleRef.current = key;
        forceRender((n) => n + 1);
      }

      // Check if hovering over empty space inside a group rect (no item directly under cursor)
      const overItem = furniture.some((f) => ptInRect(wx, wy, f.x, f.y, f.width, f.depth))
                    || rooms.some((r) => ptInRect(wx, wy, r.x, r.y, r.width, r.height));
      const overGroup = !overItem && groups.some((g) => {
        const b = getGroupBounds(g);
        return b && wx >= b.minX && wx <= b.maxX && wy >= b.minY && wy <= b.maxY;
      });
      if (overGroup !== hoverGroupRef.current) {
        hoverGroupRef.current = overGroup;
        forceRender((n) => n + 1);
      }
    }
  };

  const onMouseUp = () => {
    if (panRef.current)  { panRef.current = null; return; }
    if (dragRef.current) {
      dragRef.current = null;
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
      if (bsW > 4 && bsH > 4) {
        const inBox = (x, y, w, h) => x < w2.x && x + w > w1.x && y < w2.y && y + h > w1.y;
        const hits = [];
        for (const f of furniture) { if (inBox(f.x, f.y, f.width, f.depth)) hits.push(f.id); }
        if (!bs.noRooms) {
          for (const r of rooms) { if (inBox(r.x, r.y, r.width, r.height)) hits.push(r.id); }
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

    const ds = drawRef.current;
    if (ds) {
      const rx = Math.min(ds.startX, ds.curX), ry = Math.min(ds.startY, ds.curY);
      const rw = Math.abs(ds.curX - ds.startX), rh = Math.abs(ds.curY - ds.startY);
      if (rw >= 0.5 && rh >= 0.5) {
        addRoom({ x: rx, y: ry, width: rw, height: rh });
        setActiveTool('select'); // auto-switch to select after placing
      }
      drawRef.current = null;
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
    activeTool === 'furniture'                              ? 'copy' :
    activeTool === 'door'                                   ? 'cell' :
    dragRef.current?.type === 'resize'                      ? HANDLE_CURSORS[dragRef.current.key] :
    dragRef.current                                         ? 'move' :
    ctrlHeld && activeTool === 'select'                     ? 'crosshair' :
    hoverHandleRef.current                                  ? HANDLE_CURSORS[hoverHandleRef.current] :
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
        onMouseLeave={() => { panRef.current = null; hoverRef.current = null; doorHoverRef.current = null; hoverHandleRef.current = null; }}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Scale badge */}
      <div style={{ position: 'absolute', bottom: 14, right: 14,
        background: 'rgba(255,255,255,0.92)', padding: '5px 10px', borderRadius: 4,
        fontSize: 12, color: '#666', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        pointerEvents: 'none', fontFamily: 'monospace' }}>
        {Math.round(scale * 100)}% · 1 grid = 1 m
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
        {activeTool === 'furniture' && activeFurnitureDef && `Click to place ${activeFurnitureDef.name}`}
        {activeTool === 'door'      && 'Click on any wall to place a door'}
        {activeTool === 'select'    && 'Click · Shift+click multi-select · Drag empty to box-select · Arrow keys nudge (0.1 m) · R rotate · Del delete · Ctrl+C/V copy · Ctrl+G group · Alt+drag pan'}
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
