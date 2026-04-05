import { create } from 'zustand';

const uid = () => `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

export const FURNITURE_CATALOG = {
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

/**
 * Returns wall start/end world points and the wall length.
 * offset for north/south walls = distance from room.x (left edge)
 * offset for east/west walls   = distance from room.y (top edge)
 */
export function getWallEndpoints(room, wall) {
  const { x, y, width: w, height: h } = room;
  switch (wall) {
    case 'north': return { start: { x, y }, end: { x: x + w, y }, len: w };
    case 'south': return { start: { x, y: y + h }, end: { x: x + w, y: y + h }, len: w };
    case 'west':  return { start: { x, y }, end: { x, y: y + h }, len: h };
    case 'east':  return { start: { x: x + w, y }, end: { x: x + w, y: y + h }, len: h };
  }
}

/** Returns the inward-facing unit vector for a wall (toward room interior). */
export function getWallInward(wall) {
  switch (wall) {
    case 'north': return { x: 0, y: 1 };
    case 'south': return { x: 0, y: -1 };
    case 'west':  return { x: 1, y: 0 };
    case 'east':  return { x: -1, y: 0 };
  }
}

/**
 * Computes the hinge world position and the unit vectors needed to draw/position
 * the door panel and swing arc.
 *
 * panelDir  – direction the door panel points when fully closed (lying along wall)
 * swingDir  – direction the door swings (inward or outward from room)
 */
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
});

// ── Store ─────────────────────────────────────────────────────────────────────

const useFloorPlannerStore = create((set, get) => ({
  rooms:     [],
  furniture: [],
  doors:     [],

  selectedId:        null,
  activeTool:        'select',   // 'select' | 'room' | 'furniture' | 'door'
  activeFurnitureDef: null,
  viewMode:          '2d',

  past:   [],
  future: [],

  _pushHistory: () => {
    const state = get();
    set({ past: [...state.past.slice(-49), snapshot(state)], future: [] });
  },

  undo: () => {
    const state = get();
    if (!state.past.length) return;
    const prev = state.past[state.past.length - 1];
    set({
      past: state.past.slice(0, -1),
      future: [snapshot(state), ...state.future],
      rooms:     prev.rooms,
      furniture: prev.furniture,
      doors:     prev.doors,
      selectedId: null,
    });
  },

  redo: () => {
    const state = get();
    if (!state.future.length) return;
    const next = state.future[0];
    set({
      past: [...state.past, snapshot(state)],
      future: state.future.slice(1),
      rooms:     next.rooms,
      furniture: next.furniture,
      doors:     next.doors,
      selectedId: null,
    });
  },

  setActiveTool:        (tool) => set({ activeTool: tool, activeFurnitureDef: null }),
  setActiveFurnitureDef:(def)  => set({ activeFurnitureDef: def, activeTool: 'furniture' }),
  setViewMode:          (mode) => set({ viewMode: mode }),
  setSelectedId:        (id)   => set({ selectedId: id }),

  // ── Rooms ──────────────────────────────────────────────────────────────────
  addRoom: (roomData) => {
    get()._pushHistory();
    set((state) => {
      const newRoom = {
        id: `room-${uid()}`,
        name: `Room ${state.rooms.length + 1}`,
        floorColor: '#F7F5F0',
        wallColor: '#444444',
        wallThickness: 0.15,
        ...roomData,
      };
      return { rooms: [...state.rooms, newRoom], selectedId: newRoom.id };
    });
  },

  updateRoom: (id, updates) =>
    set((state) => ({ rooms: state.rooms.map((r) => r.id === id ? { ...r, ...updates } : r) })),

  deleteRoom: (id) => {
    get()._pushHistory();
    set((state) => ({
      rooms:     state.rooms.filter((r) => r.id !== id),
      doors:     state.doors.filter((d) => d.roomId !== id), // cascade
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
  },

  // ── Furniture ──────────────────────────────────────────────────────────────
  addFurniture: (itemData) => {
    get()._pushHistory();
    set((state) => {
      const newItem = { id: `furniture-${uid()}`, rotation: 0, ...itemData };
      return { furniture: [...state.furniture, newItem], selectedId: newItem.id };
    });
  },

  updateFurniture: (id, updates) =>
    set((state) => ({ furniture: state.furniture.map((f) => f.id === id ? { ...f, ...updates } : f) })),

  deleteFurniture: (id) => {
    get()._pushHistory();
    set((state) => ({
      furniture:  state.furniture.filter((f) => f.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
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
      return { doors: [...state.doors, newDoor], selectedId: newDoor.id };
    });
  },

  updateDoor: (id, updates) =>
    set((state) => ({ doors: state.doors.map((d) => d.id === id ? { ...d, ...updates } : d) })),

  deleteDoor: (id) => {
    get()._pushHistory();
    set((state) => ({
      doors:      state.doors.filter((d) => d.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
  },

  // ── Multi-type helpers ─────────────────────────────────────────────────────
  deleteSelected: () => {
    const { selectedId, rooms, furniture, doors } = get();
    if (!selectedId) return;
    if (rooms.find((r)     => r.id === selectedId)) get().deleteRoom(selectedId);
    else if (furniture.find((f) => f.id === selectedId)) get().deleteFurniture(selectedId);
    else if (doors.find((d)     => d.id === selectedId)) get().deleteDoor(selectedId);
  },

  rotateSelectedFurniture: (deg = 90) => {
    const { selectedId, furniture } = get();
    const item = furniture.find((f) => f.id === selectedId);
    if (item) get().updateFurniture(selectedId, { rotation: ((item.rotation || 0) + deg) % 360 });
  },

  clearAll: () => {
    get()._pushHistory();
    set({ rooms: [], furniture: [], doors: [], selectedId: null });
  },
}));

export default useFloorPlannerStore;
