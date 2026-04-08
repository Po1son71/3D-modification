import { create } from 'zustand';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ── Typed asset ID generator ──────────────────────────────────────────────────
const TYPE_PREFIX = {
  // Data Center
  'server-rack': 'SRV', 'crac': 'CRAC', 'generator': 'GEN',
  'ups': 'UPS', 'pdu': 'PDU', 'patch-panel': 'PP',
  // Office
  'desk': 'DSK', 'l-desk': 'LDK', 'office-chair': 'OCH', 'filing-cabinet': 'FC', 'bookcase': 'BC',
  // Living
  'sofa': 'SOF', 'armchair': 'ARM', 'coffee-table': 'CT', 'tv-stand': 'TVS',
  'bookshelf': 'BSH', 'side-table': 'ST',
  // Bedroom
  'bed-single': 'BDS', 'bed-double': 'BDD', 'bed-king': 'BDK',
  'wardrobe': 'WRD', 'nightstand': 'NS', 'dresser': 'DRS',
  // Kitchen
  'kitchen-counter': 'KC', 'refrigerator': 'REF', 'stove': 'STV',
  'sink': 'SNK', 'dishwasher': 'DW', 'island': 'ISL',
  // Dining
  'dining-table-rect': 'DTR', 'dining-table-round': 'DTD',
  'dining-chair': 'DCH', 'bar-stool': 'BST',
  // Bathroom
  'bathtub': 'BTH', 'toilet': 'TLT', 'shower': 'SHW',
  'bathroom-sink': 'BSN', 'vanity': 'VNT',
};

// Returns the next unused asset ID for a given type, given the current furniture list.
// e.g. if SRV-1 and SRV-2 exist, returns SRV-3.
const nextAssetId = (type, furnitureList) => {
  const prefix = TYPE_PREFIX[type] || type.replace(/-/g, '').toUpperCase().slice(0, 4);
  const pat    = new RegExp(`^${prefix}-(\\d+)$`);
  const nums   = furnitureList
    .map((f) => { const m = (f.assetId || '').match(pat); return m ? parseInt(m[1], 10) : 0; })
    .filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${next}`;
};

// ---------------------------------------------------------------------------
// modelPath (optional): path relative to /public, e.g. '/models/datacenter/server-rack.glb'
// If present, the 3D view loads the GLB and auto-scales it to width × height3d × depth.
// If absent, a plain box is rendered instead.
// Drop your GLB files into public/models/datacenter/ and the paths below will work.
// ---------------------------------------------------------------------------
export const FURNITURE_CATALOG = {
  'Data Center': [
    {
      type: 'server-rack', name: 'Server Rack',
      width: 0.6, depth: 1.0, color: '#3d3d3d', height3d: 2.0,
      modelPath: '/models/server-rack.glb',
    },
    {
      type: 'crac', name: 'CRAC Unit',
      width: 0.75, depth: 0.9, color: '#3A5F8A', height3d: 1.8,
      modelPath: '/models/crac.glb',
    },
    {
      type: 'generator', name: 'Generator',
      width: 1.2, depth: 0.8, color: '#4A4A2A', height3d: 1.2,
      modelPath: '/models/generator.glb',
    },
  ],
  'Living Room': [
    { type: 'sofa', name: 'Sofa', width: 2.2, depth: 0.9, color: '#9C8B7A', height3d: 0.85 },
    { type: 'armchair', name: 'Armchair', width: 0.85, depth: 0.85, color: '#B09880', height3d: 0.85 },
    { type: 'coffee-table', name: 'Coffee Table', width: 1.2, depth: 0.6, color: '#C4A882', height3d: 0.45 },
    { type: 'tv-stand', name: 'TV Stand', width: 1.6, depth: 0.45, color: '#6B6055', height3d: 0.55 },
    { type: 'bookshelf', name: 'Bookshelf', width: 1.0, depth: 0.3, color: '#8B7355', height3d: 1.9 },
    { type: 'side-table', name: 'Side Table', width: 0.5, depth: 0.5, color: '#C4A882', height3d: 0.55 },
  ],
  'Bedroom': [
    { type: 'bed-single', name: 'Single Bed', width: 1.0, depth: 2.0, color: '#C5B4A0', height3d: 0.55 },
    { type: 'bed-double', name: 'Double Bed', width: 1.6, depth: 2.0, color: '#C5B4A0', height3d: 0.55 },
    { type: 'bed-king', name: 'King Bed', width: 2.0, depth: 2.15, color: '#C5B4A0', height3d: 0.55 },
    { type: 'wardrobe', name: 'Wardrobe', width: 1.8, depth: 0.6, color: '#8B7355', height3d: 2.1 },
    { type: 'nightstand', name: 'Nightstand', width: 0.5, depth: 0.5, color: '#A0826D', height3d: 0.55 },
    { type: 'dresser', name: 'Dresser', width: 1.2, depth: 0.5, color: '#8B7355', height3d: 0.85 },
  ],
  'Kitchen': [
    { type: 'kitchen-counter', name: 'Counter', width: 2.0, depth: 0.6, color: '#D0D0D0', height3d: 0.9 },
    { type: 'refrigerator', name: 'Refrigerator', width: 0.7, depth: 0.7, color: '#E8E8E8', height3d: 1.8 },
    { type: 'stove', name: 'Stove', width: 0.6, depth: 0.6, color: '#555555', height3d: 0.9 },
    { type: 'sink', name: 'Sink', width: 0.6, depth: 0.5, color: '#C8C8C8', height3d: 0.9 },
    { type: 'dishwasher', name: 'Dishwasher', width: 0.6, depth: 0.6, color: '#DCDCDC', height3d: 0.9 },
    { type: 'island', name: 'Kitchen Island', width: 1.5, depth: 0.8, color: '#C4A882', height3d: 0.9 },
  ],
  'Dining': [
    { type: 'dining-table-rect', name: 'Dining Table', width: 1.8, depth: 0.9, color: '#A0826D', height3d: 0.75 },
    { type: 'dining-table-round', name: 'Round Table', width: 1.1, depth: 1.1, color: '#A0826D', height3d: 0.75 },
    { type: 'dining-chair', name: 'Dining Chair', width: 0.45, depth: 0.45, color: '#8B7355', height3d: 0.9 },
    { type: 'bar-stool', name: 'Bar Stool', width: 0.4, depth: 0.4, color: '#666', height3d: 1.0 },
  ],
  'Office': [
    { type: 'desk', name: 'Desk', width: 1.5, depth: 0.75, color: '#D4C4A8', height3d: 0.75 },
    { type: 'l-desk', name: 'L-Desk', width: 2.0, depth: 1.5, color: '#D4C4A8', height3d: 0.75 },
    { type: 'office-chair', name: 'Office Chair', width: 0.6, depth: 0.6, color: '#333333', height3d: 1.1 },
    { type: 'filing-cabinet', name: 'Filing Cabinet', width: 0.45, depth: 0.55, color: '#999999', height3d: 1.1 },
    { type: 'bookcase', name: 'Bookcase', width: 0.9, depth: 0.3, color: '#8B7355', height3d: 2.0 },
  ],
  'Bathroom': [
    { type: 'bathtub', name: 'Bathtub', width: 1.7, depth: 0.75, color: '#F0F0F0', height3d: 0.55 },
    { type: 'toilet', name: 'Toilet', width: 0.4, depth: 0.7, color: '#F5F5F5', height3d: 0.75 },
    { type: 'shower', name: 'Shower', width: 0.9, depth: 0.9, color: '#D0E8F0', height3d: 0.05 },
    { type: 'bathroom-sink', name: 'Sink', width: 0.5, depth: 0.4, color: '#F0F0F0', height3d: 0.85 },
    { type: 'vanity', name: 'Vanity', width: 1.2, depth: 0.5, color: '#E0E0E0', height3d: 0.9 },
  ],
};

// ── Door geometry helpers (shared with editor + 3D scene) ─────────────────────

export function getWallEndpoints(room, wall) {
  const { x, y, width: w, height: h } = room;
  switch (wall) {
    case 'north': return { start: { x, y }, end: { x: x + w, y }, len: w };
    case 'south': return { start: { x, y: y + h }, end: { x: x + w, y: y + h }, len: w };
    case 'west':  return { start: { x, y }, end: { x, y: y + h }, len: h };
    case 'east':  return { start: { x: x + w, y }, end: { x: x + w, y: y + h }, len: h };
  }
}

export function getWallInward(wall) {
  switch (wall) {
    case 'north': return { x: 0, y: 1 };
    case 'south': return { x: 0, y: -1 };
    case 'west':  return { x: 1, y: 0 };
    case 'east':  return { x: -1, y: 0 };
  }
}

export function getDoorInfo(door, room) {
  const { offset, width, hingeSide, swingIn } = door;
  const { x, y, width: rw, height: rh } = room;
  let hingePoint, panelDir;
  const inwardDir = getWallInward(door.wall);

  switch (door.wall) {
    case 'north':
      hingePoint = hingeSide === 'left'
        ? { x: x + offset,         y }
        : { x: x + offset + width, y };
      panelDir = hingeSide === 'left' ? { x: 1, y: 0 } : { x: -1, y: 0 };
      break;
    case 'south':
      hingePoint = hingeSide === 'left'
        ? { x: x + offset,         y: y + rh }
        : { x: x + offset + width, y: y + rh };
      panelDir = hingeSide === 'left' ? { x: 1, y: 0 } : { x: -1, y: 0 };
      break;
    case 'west':
      hingePoint = hingeSide === 'left'
        ? { x, y: y + offset         }
        : { x, y: y + offset + width };
      panelDir = hingeSide === 'left' ? { x: 0, y: 1 } : { x: 0, y: -1 };
      break;
    case 'east':
      hingePoint = hingeSide === 'left'
        ? { x: x + rw, y: y + offset         }
        : { x: x + rw, y: y + offset + width };
      panelDir = hingeSide === 'left' ? { x: 0, y: 1 } : { x: 0, y: -1 };
      break;
  }

  const swingDir = swingIn
    ? inwardDir
    : { x: -inwardDir.x, y: -inwardDir.y };

  return { hingePoint, panelDir, swingDir, inwardDir };
}

// ── Snapshot helper ───────────────────────────────────────────────────────────

const snapshot = (state) => ({
  rooms:     JSON.parse(JSON.stringify(state.rooms)),
  furniture: JSON.parse(JSON.stringify(state.furniture)),
  doors:     JSON.parse(JSON.stringify(state.doors)),
  groups:    JSON.parse(JSON.stringify(state.groups)),
});

// ── Store ─────────────────────────────────────────────────────────────────────

const useFloorPlannerStore = create((set, get) => ({
  rooms:     [],
  furniture: [],
  doors:     [],

  selectedIds:        [],   // array of selected IDs
  lockedIds:          [],   // array of locked IDs
  groups:             [],   // [{ id, name, itemIds[] }]
  clipboard:          [],   // copied items: [{ kind: 'room'|'furniture', data }]
  pasteCount:         0,    // increments each paste so repeated pastes stack
  activeTool:         'select',
  activeFurnitureDef: null,
  viewMode:           '2d',
  showHeatmap:        false,
  undoMsg:            null, // { text, ts } — used for toast notifications

  past:   [],
  future: [],

  _pushHistory: () => {
    const state = get();
    set({ past: [...state.past.slice(-49), snapshot(state)], future: [] });
  },

  _showMsg: (text) => {
    const ts = Date.now();
    set({ undoMsg: { text, ts } });
    setTimeout(() => {
      set((state) => state.undoMsg?.ts === ts ? { undoMsg: null } : {});
    }, 2000);
  },

  undo: () => {
    const state = get();
    if (!state.past.length) return;
    const prev = state.past[state.past.length - 1];
    set({
      past:      state.past.slice(0, -1),
      future:    [snapshot(state), ...state.future],
      rooms:     prev.rooms,
      furniture: prev.furniture,
      doors:     prev.doors,
      groups:    prev.groups ?? [],
      selectedIds: [],
    });
    get()._showMsg('Undone');
  },

  redo: () => {
    const state = get();
    if (!state.future.length) return;
    const next = state.future[0];
    set({
      past:      [...state.past, snapshot(state)],
      future:    state.future.slice(1),
      rooms:     next.rooms,
      furniture: next.furniture,
      doors:     next.doors,
      groups:    next.groups ?? [],
      selectedIds: [],
    });
    get()._showMsg('Redone');
  },

  setActiveTool:         (tool) => set({ activeTool: tool, activeFurnitureDef: null }),
  setActiveFurnitureDef: (def)  => set({ activeFurnitureDef: def, activeTool: 'furniture' }),
  setViewMode:           (mode) => set({ viewMode: mode }),
  toggleHeatmap:         ()     => set((state) => ({ showHeatmap: !state.showHeatmap })),

  // ── Selection ──────────────────────────────────────────────────────────────
  // Select exactly one item (or clear if null)
  selectOne:      (id) => set({ selectedIds: id ? [id] : [] }),
  // Toggle one item in/out of multi-selection
  selectAdd:      (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds.filter((x) => x !== id)
      : [...state.selectedIds, id],
  })),
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  clearSelection: ()    => set({ selectedIds: [] }),
  // Backward-compat alias used by older call sites
  setSelectedId:  (id)  => set({ selectedIds: id ? [id] : [] }),

  // ── Locking ────────────────────────────────────────────────────────────────
  toggleLock: (id) => set((state) => ({
    lockedIds: state.lockedIds.includes(id)
      ? state.lockedIds.filter((x) => x !== id)
      : [...state.lockedIds, id],
  })),
  lockSelected:   () => set((state) => ({
    lockedIds: [...new Set([...state.lockedIds, ...state.selectedIds])],
  })),
  unlockSelected: () => set((state) => ({
    lockedIds: state.lockedIds.filter((id) => !state.selectedIds.includes(id)),
  })),

  // ── Rooms ──────────────────────────────────────────────────────────────────
  addRoom: (roomData) => {
    get()._pushHistory();
    set((state) => {
      const newRoom = {
        id:            `room-${uid()}`,
        name:          `Room ${state.rooms.length + 1}`,
        floorColor:    '#F7F5F0',
        wallColor:     '#444444',
        wallThickness: 0.05,
        wallHeight:    1.8,
        ...roomData,
      };
      return { rooms: [...state.rooms, newRoom], selectedIds: [newRoom.id] };
    });
  },

  updateRoom: (id, updates) =>
    set((state) => ({ rooms: state.rooms.map((r) => r.id === id ? { ...r, ...updates } : r) })),

  deleteRoom: (id) => {
    get()._pushHistory();
    set((state) => ({
      rooms:      state.rooms.filter((r) => r.id !== id),
      doors:      state.doors.filter((d) => d.roomId !== id),
      selectedIds: state.selectedIds.filter((x) => x !== id),
      lockedIds:   state.lockedIds.filter((x) => x !== id),
    }));
  },

  // ── Furniture ──────────────────────────────────────────────────────────────
  addFurniture: (itemData) => {
    get()._pushHistory();
    set((state) => {
      const assetId = itemData.assetId || nextAssetId(itemData.type, state.furniture);
      const newItem = { id: `furniture-${uid()}`, rotation: 0, ...itemData, assetId };
      return { furniture: [...state.furniture, newItem], selectedIds: [newItem.id] };
    });
  },

  updateFurniture: (id, updates) =>
    set((state) => ({ furniture: state.furniture.map((f) => f.id === id ? { ...f, ...updates } : f) })),

  deleteFurniture: (id) => {
    get()._pushHistory();
    set((state) => ({
      furniture:   state.furniture.filter((f) => f.id !== id),
      selectedIds: state.selectedIds.filter((x) => x !== id),
      lockedIds:   state.lockedIds.filter((x) => x !== id),
    }));
  },

  // ── Doors ──────────────────────────────────────────────────────────────────
  addDoor: (doorData) => {
    get()._pushHistory();
    set((state) => {
      const newDoor = {
        id:        `door-${uid()}`,
        width:     0.9,
        openAngle: 90,
        hingeSide: 'left',
        swingIn:   true,
        ...doorData,
      };
      return { doors: [...state.doors, newDoor], selectedIds: [newDoor.id] };
    });
  },

  updateDoor: (id, updates) =>
    set((state) => ({ doors: state.doors.map((d) => d.id === id ? { ...d, ...updates } : d) })),

  deleteDoor: (id) => {
    get()._pushHistory();
    set((state) => ({
      doors:       state.doors.filter((d) => d.id !== id),
      selectedIds: state.selectedIds.filter((x) => x !== id),
      lockedIds:   state.lockedIds.filter((x) => x !== id),
    }));
  },

  // ── Multi-type helpers ─────────────────────────────────────────────────────
  deleteSelected: () => {
    const { selectedIds, lockedIds } = get();
    const toDelete = selectedIds.filter((id) => !lockedIds.includes(id));
    if (!toDelete.length) return;
    get()._pushHistory();
    const del = new Set(toDelete);
    set((state) => ({
      rooms:       state.rooms.filter((r) => !del.has(r.id)),
      furniture:   state.furniture.filter((f) => !del.has(f.id)),
      doors:       state.doors.filter((d) => !del.has(d.id) && !del.has(d.roomId)),
      // Remove deleted items from any groups; drop empty groups
      groups:      state.groups
        .map((g) => ({ ...g, itemIds: g.itemIds.filter((id) => !del.has(id)) }))
        .filter((g) => g.itemIds.length > 1),
      selectedIds: state.selectedIds.filter((id) => !del.has(id)),
      lockedIds:   state.lockedIds.filter((id) => !del.has(id)),
    }));
  },

  rotateSelectedFurniture: (deg = 90) => {
    const { selectedIds, furniture } = get();
    for (const id of selectedIds) {
      const item = furniture.find((f) => f.id === id);
      if (item) get().updateFurniture(id, { rotation: ((item.rotation || 0) + deg) % 360 });
    }
  },

  // ── Clipboard ──────────────────────────────────────────────────────────────
  copySelected: () => {
    const { selectedIds, rooms, furniture } = get();
    if (!selectedIds.length) return;
    const items = [];
    for (const id of selectedIds) {
      const r = rooms.find((x) => x.id === id);
      const f = furniture.find((x) => x.id === id);
      if (r) items.push({ kind: 'room', data: { ...r } });
      else if (f) items.push({ kind: 'furniture', data: { ...f } });
    }
    if (items.length) {
      set({ clipboard: items, pasteCount: 0 });
      get()._showMsg(`Copied ${items.length} item${items.length > 1 ? 's' : ''}`);
    }
  },

  pasteClipboard: () => {
    const { clipboard, pasteCount } = get();
    if (!clipboard.length) return;
    get()._pushHistory();
    const off = (pasteCount + 1) * 1; // each repeated paste shifts +1 m
    // Generate IDs outside set() so they're stable
    const stamped = clipboard.map((item) => ({ ...item, newId: uid() }));
    const newIds  = stamped.map((x) => x.newId);
    set((state) => {
      const newRooms     = [...state.rooms];
      const newFurniture = [...state.furniture];
      for (const item of stamped) {
        if (item.kind === 'room') {
          newRooms.push({
            ...item.data,
            id:   item.newId,
            name: item.data.name.replace(/ \(copy.*\)$/, '') + ' (copy)',
            x:    item.data.x + off,
            y:    item.data.y + off,
          });
        } else if (item.kind === 'furniture') {
          newFurniture.push({
            ...item.data,
            id:      item.newId,
            assetId: nextAssetId(item.data.type, [...state.furniture, ...newFurniture]),
            sensors: [],   // sensors don't copy — new asset, new mappings
            x:       item.data.x + off,
            y:       item.data.y + off,
          });
        }
      }
      return {
        rooms:      newRooms,
        furniture:  newFurniture,
        selectedIds: newIds,
        pasteCount:  pasteCount + 1,
      };
    });
    get()._showMsg(`Pasted ${stamped.length} item${stamped.length > 1 ? 's' : ''}`);
  },

  // ── Groups ────────────────────────────────────────────────────────────────
  groupSelected: () => {
    const { selectedIds, lockedIds } = get();
    const ungroupable = selectedIds.filter((id) => !lockedIds.includes(id));
    if (ungroupable.length < 2) {
      get()._showMsg('Need 2+ unlocked items to group');
      return;
    }
    get()._pushHistory();
    const groupId = `group-${uid()}`;
    set((state) => ({
      groups: [...state.groups, {
        id:      groupId,
        name:    `Group ${state.groups.length + 1}`,
        itemIds: ungroupable,
      }],
    }));
    const skipped = selectedIds.length - ungroupable.length;
    get()._showMsg(skipped > 0 ? `Grouped (${skipped} locked item${skipped > 1 ? 's' : ''} skipped)` : 'Grouped');
  },

  ungroupIds: (groupIds) => {
    const ids = new Set(groupIds);
    get()._pushHistory();
    set((state) => ({ groups: state.groups.filter((g) => !ids.has(g.id)) }));
    get()._showMsg('Ungrouped');
  },

  // Ungroup every group that contains any of the currently selected items
  ungroupSelected: () => {
    const { selectedIds, groups } = get();
    const toUngroup = groups
      .filter((g) => g.itemIds.some((id) => selectedIds.includes(id)))
      .map((g) => g.id);
    if (!toUngroup.length) return;
    get().ungroupIds(toUngroup);
  },

  // Delete an entire group and all its items
  deleteGroup: (groupId) => {
    const group = get().groups.find((g) => g.id === groupId);
    if (!group) return;
    get()._pushHistory();
    const del = new Set(group.itemIds);
    set((state) => ({
      groups:      state.groups.filter((g) => g.id !== groupId),
      rooms:       state.rooms.filter((r) => !del.has(r.id)),
      furniture:   state.furniture.filter((f) => !del.has(f.id)),
      doors:       state.doors.filter((d) => !del.has(d.id) && !del.has(d.roomId)),
      selectedIds: state.selectedIds.filter((id) => !del.has(id)),
      lockedIds:   state.lockedIds.filter((id) => !del.has(id)),
    }));
    get()._showMsg('Group deleted');
  },

  renameGroup: (groupId, name) =>
    set((state) => ({
      groups: state.groups.map((g) => g.id === groupId ? { ...g, name } : g),
    })),

  clearAll: () => {
    get()._pushHistory();
    set({ rooms: [], furniture: [], doors: [], groups: [], selectedIds: [], lockedIds: [] });
  },

  // ── DCIM: Export / Import ──────────────────────────────────────────────────
  exportLayout: () => {
    const { rooms, furniture, doors, groups } = get();

    // Compute which room each asset's center falls inside
    const getRoomId = (asset) => {
      const cx = asset.x + asset.width / 2;
      const cy = asset.y + asset.depth / 2;
      return rooms.find(
        (r) => cx >= r.x && cx <= r.x + r.width && cy >= r.y && cy <= r.y + r.height,
      )?.id ?? null;
    };

    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      rooms: rooms.map((r) => ({ ...r })),
      assets: furniture.map((f) => ({
        ...f,
        assetId:  f.assetId  || '',
        sensors:  f.sensors  || [],
        roomId:   getRoomId(f),   // computed — useful for external systems
      })),
      doors:  doors.map((d) => ({ ...d })),
      groups: groups.map((g) => ({ ...g })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `floor-plan-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    get()._showMsg('Layout exported');
  },

  importLayout: (jsonText) => {
    try {
      const data = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText;
      get()._pushHistory();
      set({
        rooms:       data.rooms     || [],
        furniture:   data.assets    || data.furniture || [],
        doors:       data.doors     || [],
        groups:      data.groups    || [],
        selectedIds: [],
        lockedIds:   [],
      });
      get()._showMsg('Layout imported');
    } catch {
      get()._showMsg('Import failed — invalid JSON');
    }
  },
}));

export default useFloorPlannerStore;
