import { createSlice, current } from '@reduxjs/toolkit';

// ── ID helpers ────────────────────────────────────────────────────────────────
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const TYPE_PREFIX = {
  'server-rack': 'SRV', 'crac': 'CRAC', 'generator': 'GEN',
  'ups': 'UPS', 'pdu': 'PDU', 'patch-panel': 'PP',
  'network-switch': 'NSW', 'firewall': 'FW', 'kvm': 'KVM',
  'desk': 'DSK', 'l-desk': 'LDK', 'office-chair': 'OCH', 'filing-cabinet': 'FC', 'bookcase': 'BC',
  'sofa': 'SOF', 'armchair': 'ARM', 'coffee-table': 'CT', 'tv-stand': 'TVS',
  'bookshelf': 'BSH', 'side-table': 'ST',
  'bed-single': 'BDS', 'bed-double': 'BDD', 'bed-king': 'BDK',
  'wardrobe': 'WRD', 'nightstand': 'NS', 'dresser': 'DRS',
  'kitchen-counter': 'KC', 'refrigerator': 'REF', 'stove': 'STV',
  'sink': 'SNK', 'dishwasher': 'DW', 'island': 'ISL',
  'dining-table-rect': 'DTR', 'dining-table-round': 'DTD',
  'dining-chair': 'DCH', 'bar-stool': 'BST',
  'bathtub': 'BTH', 'toilet': 'TLT', 'shower': 'SHW',
  'bathroom-sink': 'BSN', 'vanity': 'VNT',
};

const nextAssetId = (type, furnitureList) => {
  const prefix = TYPE_PREFIX[type] || type.replace(/-/g, '').toUpperCase().slice(0, 4);
  const pat    = new RegExp(`^${prefix}-(\\d+)$`);
  const nums   = furnitureList
    .map((f) => { const m = (f.assetId || '').match(pat); return m ? parseInt(m[1], 10) : 0; })
    .filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${next}`;
};

// ── Furniture / Asset catalog ─────────────────────────────────────────────────
export const FURNITURE_CATALOG = {
  'Data Center': {
    'Server': {
      'Dell': [
        { type: 'server-rack', name: 'PowerEdge 42U',   width: 0.6, depth: 1.0,  color: '#1E3A6E', height3d: 2.0,  modelPath: '/models/dellserver_rack.glb' },
        { type: 'server-rack', name: 'PowerEdge 24U',   width: 0.6, depth: 1.0,  color: '#1E3A6E', height3d: 1.2,  modelPath: '/models/server-rack.glb' },
        { type: 'server-rack', name: 'PowerEdge 12U',   width: 0.6, depth: 1.0,  color: '#1E3A6E', height3d: 0.65, modelPath: '/models/server-rack.glb' },
      ],
      'HP / HPE': [
        { type: 'server-rack', name: 'ProLiant 42U',    width: 0.6, depth: 1.0,  color: '#0096D6', height3d: 2.0,  modelPath: '/models/server-rack.glb' },
        { type: 'server-rack', name: 'ProLiant 22U',    width: 0.6, depth: 0.85, color: '#0096D6', height3d: 1.1,  modelPath: '/models/server-rack.glb' },
      ],
      'Cisco': [
        { type: 'server-rack', name: 'UCS 5108 Blade',  width: 0.6,  depth: 0.9, color: '#1BA0D7', height3d: 0.88, modelPath: '/models/server-rack.glb' },
        { type: 'server-rack', name: 'UCS Mini',        width: 0.45, depth: 0.7, color: '#1BA0D7', height3d: 0.6,  modelPath: '/models/server-rack.glb' },
      ],
      'Lenovo': [
        { type: 'server-rack', name: 'ThinkSystem 42U', width: 0.6, depth: 1.0,  color: '#E31837', height3d: 2.0,  modelPath: '/models/server-rack.glb' },
        { type: 'server-rack', name: 'ThinkSystem 24U', width: 0.6, depth: 0.9,  color: '#E31837', height3d: 1.2,  modelPath: '/models/server-rack.glb' },
      ],
      'ZTE': [
        { type: 'server-rack', name: 'R5300 G4',        width: 0.6, depth: 1.0,  color: '#004B98', height3d: 2.0,  modelPath: '/models/server-rack.glb' },
        { type: 'server-rack', name: 'R5500 G4',        width: 0.7, depth: 1.1,  color: '#004B98', height3d: 2.2,  modelPath: '/models/server-rack.glb' },
        { type: 'server-rack', name: 'R5200 G4',        width: 0.6, depth: 0.9,  color: '#004B98', height3d: 1.2,  modelPath: '/models/server-rack.glb' },
      ],
      'Generic': [
        { type: 'server-rack', name: 'Open Rack 42U',   width: 0.6, depth: 1.0,  color: '#3d3d3d', height3d: 2.0,  modelPath: '/models/server-rack.glb' },
      ],
    },
    'Cooling': {
      'Schneider': [
        { type: 'crac', name: 'InRow RC 30kW',          width: 0.6,  depth: 1.0, color: '#3D8EB9', height3d: 2.0, modelPath: '/models/crac.glb' },
        { type: 'crac', name: 'NetShelter CW 20kW',     width: 0.75, depth: 0.9, color: '#3D8EB9', height3d: 1.8, modelPath: '/models/crac.glb' },
      ],
      'Vertiv': [
        { type: 'crac', name: 'Liebert DS 35kW',        width: 0.75, depth: 0.9, color: '#C0392B', height3d: 1.8, modelPath: '/models/crac.glb' },
        { type: 'crac', name: 'Liebert PEX 30kW',       width: 0.6,  depth: 1.0, color: '#C0392B', height3d: 2.0, modelPath: '/models/crac.glb' },
      ],
      'Stulz': [
        { type: 'crac', name: 'CyberAir 3 PRO',         width: 0.7,  depth: 0.95, color: '#2D5A8A', height3d: 1.9, modelPath: '/models/crac.glb' },
        { type: 'crac', name: 'CyberAir 3 DX',          width: 0.65, depth: 0.9,  color: '#2D5A8A', height3d: 1.8, modelPath: '/models/crac.glb' },
      ],
      'Generic': [
        { type: 'crac', name: 'CRAC Unit',              width: 0.75, depth: 0.9, color: '#3A5F8A', height3d: 1.8, modelPath: '/models/crac.glb' },
      ],
    },
    'Generator': {
      'Caterpillar': [
        { type: 'generator', name: 'XQ230 230kVA',      width: 1.5, depth: 0.8,  color: '#E6A817', height3d: 1.4, modelPath: '/models/generator.glb' },
        { type: 'generator', name: 'XQ350 350kVA',      width: 2.0, depth: 0.9,  color: '#E6A817', height3d: 1.6, modelPath: '/models/generator.glb' },
        { type: 'generator', name: 'XQ500 500kVA',      width: 2.4, depth: 1.0,  color: '#E6A817', height3d: 1.8, modelPath: '/models/generator.glb' },
      ],
      'Cummins': [
        { type: 'generator', name: 'C150D5 150kVA',     width: 1.4, depth: 0.7,  color: '#CC0000', height3d: 1.2, modelPath: '/models/generator.glb' },
        { type: 'generator', name: 'C250D5 250kVA',     width: 1.8, depth: 0.8,  color: '#CC0000', height3d: 1.4, modelPath: '/models/generator.glb' },
        { type: 'generator', name: 'C375D5 375kVA',     width: 2.2, depth: 0.9,  color: '#CC0000', height3d: 1.6, modelPath: '/models/generator.glb' },
      ],
      'Kohler': [
        { type: 'generator', name: '200ROZD 200kVA',    width: 1.6, depth: 0.75, color: '#005480', height3d: 1.3, modelPath: '/models/generator.glb' },
        { type: 'generator', name: '350ROZD 350kVA',    width: 2.0, depth: 0.9,  color: '#005480', height3d: 1.6, modelPath: '/models/generator.glb' },
      ],
      'Generic': [
        { type: 'generator', name: 'Generator',         width: 1.2, depth: 0.8,  color: '#4A4A2A', height3d: 1.2, modelPath: '/models/generator.glb' },
      ],
    },
    'UPS / Power': {
      'Schneider': [
        { type: 'ups', name: 'Symmetra LX 16kVA',       width: 0.44, depth: 0.77, color: '#5B8DB8', height3d: 1.3 },
        { type: 'ups', name: 'Smart-UPS 3000VA',        width: 0.44, depth: 0.65, color: '#5B8DB8', height3d: 0.9 },
        { type: 'pdu', name: 'APC Metered PDU',         width: 0.06, depth: 0.9,  color: '#5B8DB8', height3d: 1.8 },
      ],
      'Vertiv': [
        { type: 'ups', name: 'GXT5 3000VA',             width: 0.44, depth: 0.65, color: '#C0392B', height3d: 0.9 },
        { type: 'ups', name: 'Liebert EXL 80kVA',       width: 0.8,  depth: 0.9,  color: '#C0392B', height3d: 1.6 },
      ],
      'Eaton': [
        { type: 'ups', name: '9PX 3000VA',              width: 0.44, depth: 0.65, color: '#CC2200', height3d: 0.9 },
        { type: 'ups', name: '93PM 30kVA',              width: 0.8,  depth: 0.9,  color: '#CC2200', height3d: 1.6 },
        { type: 'pdu', name: 'G3 Metered PDU',          width: 0.06, depth: 0.9,  color: '#CC2200', height3d: 1.8 },
      ],
      'Generic': [
        { type: 'ups', name: 'UPS Unit',                width: 0.44, depth: 0.65, color: '#555555', height3d: 0.9 },
        { type: 'pdu', name: 'Vertical PDU 16A',        width: 0.06, depth: 0.9,  color: '#888888', height3d: 1.8 },
      ],
    },
    'Networking': {
      'Cisco': [
        { type: 'network-switch', name: 'Nexus 9504',   width: 0.6,  depth: 0.55, color: '#1BA0D7', height3d: 0.35 },
        { type: 'network-switch', name: 'Catalyst 9300',width: 0.45, depth: 0.3,  color: '#1BA0D7', height3d: 0.044 },
        { type: 'firewall',       name: 'ASA 5545-X',   width: 0.44, depth: 0.35, color: '#1BA0D7', height3d: 0.044 },
      ],
      'Juniper': [
        { type: 'network-switch', name: 'QFX5120-48Y',  width: 0.44, depth: 0.4,  color: '#0070AD', height3d: 0.044 },
        { type: 'network-switch', name: 'EX4300-48P',   width: 0.44, depth: 0.35, color: '#0070AD', height3d: 0.044 },
      ],
      'Generic': [
        { type: 'patch-panel', name: 'Patch Panel 24P', width: 0.6,  depth: 0.1,  color: '#555555', height3d: 0.044 },
        { type: 'kvm',         name: 'KVM Switch 16P',  width: 0.45, depth: 0.35, color: '#666666', height3d: 0.044 },
      ],
    },
  },
  'Living Room': [
    { type: 'sofa',          name: 'Sofa',           width: 2.2,  depth: 0.9, color: '#9C8B7A', height3d: 0.85 },
    { type: 'armchair',      name: 'Armchair',       width: 0.85, depth: 0.85, color: '#B09880', height3d: 0.85 },
    { type: 'coffee-table',  name: 'Coffee Table',   width: 1.2,  depth: 0.6, color: '#C4A882', height3d: 0.45 },
    { type: 'tv-stand',      name: 'TV Stand',       width: 1.6,  depth: 0.45, color: '#6B6055', height3d: 0.55 },
    { type: 'bookshelf',     name: 'Bookshelf',      width: 1.0,  depth: 0.3, color: '#8B7355', height3d: 1.9 },
    { type: 'side-table',    name: 'Side Table',     width: 0.5,  depth: 0.5, color: '#C4A882', height3d: 0.55 },
  ],
  'Bedroom': [
    { type: 'bed-single',    name: 'Single Bed',     width: 1.0,  depth: 2.0, color: '#C5B4A0', height3d: 0.55 },
    { type: 'bed-double',    name: 'Double Bed',     width: 1.6,  depth: 2.0, color: '#C5B4A0', height3d: 0.55 },
    { type: 'bed-king',      name: 'King Bed',       width: 2.0,  depth: 2.15, color: '#C5B4A0', height3d: 0.55 },
    { type: 'wardrobe',      name: 'Wardrobe',       width: 1.8,  depth: 0.6, color: '#8B7355', height3d: 2.1 },
    { type: 'nightstand',    name: 'Nightstand',     width: 0.5,  depth: 0.5, color: '#A0826D', height3d: 0.55 },
    { type: 'dresser',       name: 'Dresser',        width: 1.2,  depth: 0.5, color: '#8B7355', height3d: 0.85 },
  ],
  'Kitchen': [
    { type: 'kitchen-counter', name: 'Counter',      width: 2.0,  depth: 0.6, color: '#D0D0D0', height3d: 0.9 },
    { type: 'refrigerator',  name: 'Refrigerator',   width: 0.7,  depth: 0.7, color: '#E8E8E8', height3d: 1.8 },
    { type: 'stove',         name: 'Stove',          width: 0.6,  depth: 0.6, color: '#555555', height3d: 0.9 },
    { type: 'sink',          name: 'Sink',           width: 0.6,  depth: 0.5, color: '#C8C8C8', height3d: 0.9 },
    { type: 'dishwasher',    name: 'Dishwasher',     width: 0.6,  depth: 0.6, color: '#DCDCDC', height3d: 0.9 },
    { type: 'island',        name: 'Kitchen Island', width: 1.5,  depth: 0.8, color: '#C4A882', height3d: 0.9 },
  ],
  'Dining': [
    { type: 'dining-table-rect',  name: 'Dining Table', width: 1.8, depth: 0.9, color: '#A0826D', height3d: 0.75 },
    { type: 'dining-table-round', name: 'Round Table',  width: 1.1, depth: 1.1, color: '#A0826D', height3d: 0.75 },
    { type: 'dining-chair',  name: 'Dining Chair',   width: 0.45, depth: 0.45, color: '#8B7355', height3d: 0.9 },
    { type: 'bar-stool',     name: 'Bar Stool',      width: 0.4,  depth: 0.4, color: '#666', height3d: 1.0 },
  ],
  'Office': [
    { type: 'desk',          name: 'Desk',           width: 1.5,  depth: 0.75, color: '#D4C4A8', height3d: 0.75 },
    { type: 'l-desk',        name: 'L-Desk',         width: 2.0,  depth: 1.5,  color: '#D4C4A8', height3d: 0.75 },
    { type: 'office-chair',  name: 'Office Chair',   width: 0.6,  depth: 0.6,  color: '#333333', height3d: 1.1 },
    { type: 'filing-cabinet', name: 'Filing Cabinet',width: 0.45, depth: 0.55, color: '#999999', height3d: 1.1 },
    { type: 'bookcase',      name: 'Bookcase',       width: 0.9,  depth: 0.3,  color: '#8B7355', height3d: 2.0 },
  ],
  'Bathroom': [
    { type: 'bathtub',       name: 'Bathtub',        width: 1.7,  depth: 0.75, color: '#F0F0F0', height3d: 0.55 },
    { type: 'toilet',        name: 'Toilet',         width: 0.4,  depth: 0.7,  color: '#F5F5F5', height3d: 0.75 },
    { type: 'shower',        name: 'Shower',         width: 0.9,  depth: 0.9,  color: '#D0E8F0', height3d: 0.05 },
    { type: 'bathroom-sink', name: 'Sink',           width: 0.5,  depth: 0.4,  color: '#F0F0F0', height3d: 0.85 },
    { type: 'vanity',        name: 'Vanity',         width: 1.2,  depth: 0.5,  color: '#E0E0E0', height3d: 0.9 },
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

// Rotate a local point about a room's center into world space.
function roomToWorld(r, lx, ly) {
  const rotRad = (r.rotation || 0) * Math.PI / 180;
  if (!rotRad) return { x: lx, y: ly };
  const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  const dx = lx - cx, dy = ly - cy;
  return {
    x: cx + dx * Math.cos(rotRad) - dy * Math.sin(rotRad),
    y: cy + dx * Math.sin(rotRad) + dy * Math.cos(rotRad),
  };
}

// World-space endpoints of a named wall (accounts for room rotation).
export function getWorldWallFace(room, wall) {
  const ep = getWallEndpoints(room, wall);
  const s  = roomToWorld(room, ep.start.x, ep.start.y);
  const e  = roomToWorld(room, ep.end.x,   ep.end.y);
  return { s, e, len: ep.len };
}

export function getSharedWallDoors(room, wall, doors, rooms) {
  const TOL = 0.12;

  // Our wall in world space
  const { s: ourS, e: ourE } = getWorldWallFace(room, wall);
  const dxO = ourE.x - ourS.x, dyO = ourE.y - ourS.y;
  const lenO = Math.hypot(dxO, dyO);
  if (lenO < 0.001) return [];
  const uX = dxO / lenO, uY = dyO / lenO; // unit along our wall
  const nX = -uY, nY = uX;                // one of the two normals

  const result = [];

  for (const other of rooms) {
    if (other.id === room.id) continue;

    for (const otherWall of ['north', 'south', 'east', 'west']) {
      const ep2  = getWallEndpoints(other, otherWall);
      const thS  = roomToWorld(other, ep2.start.x, ep2.start.y);
      const thE  = roomToWorld(other, ep2.end.x,   ep2.end.y);
      const dxT  = thE.x - thS.x, dyT = thE.y - thS.y;
      const lenT = Math.hypot(dxT, dyT);
      if (lenT < 0.001) continue;

      // ① Walls must be parallel (|cos θ| ≈ 1)
      const dot = (dxT * uX + dyT * uY) / lenT;
      if (Math.abs(Math.abs(dot) - 1) > 0.05) continue;

      // ② Walls must be co-planar (normal distance < TOL)
      const vecX = thS.x - ourS.x, vecY = thS.y - ourS.y;
      if (Math.abs(vecX * nX + vecY * nY) > TOL) continue;

      // ③ Walls must overlap along the shared axis
      const sProj = vecX * uX + vecY * uY;
      const eProj = sProj + dxT * uX + dyT * uY;
      const olStart = Math.max(0, Math.min(sProj, eProj));
      const olEnd   = Math.min(lenO, Math.max(sProj, eProj));
      if (olEnd <= olStart + 0.001) continue;

      // ④ Map doors on the other wall into our wall's local offset space
      for (const d of doors) {
        if (d.roomId !== other.id || d.wall !== otherWall) continue;

        // Door gap endpoints in local space of the other room
        const t0 = d.offset / ep2.len;
        const t1 = (d.offset + d.width) / ep2.len;
        const gLS = { x: ep2.start.x + t0 * (ep2.end.x - ep2.start.x), y: ep2.start.y + t0 * (ep2.end.y - ep2.start.y) };
        const gLE = { x: ep2.start.x + t1 * (ep2.end.x - ep2.start.x), y: ep2.start.y + t1 * (ep2.end.y - ep2.start.y) };

        // Rotate to world space
        const gWS = roomToWorld(other, gLS.x, gLS.y);
        const gWE = roomToWorld(other, gLE.x, gLE.y);

        // Project onto our wall axis
        const p0 = (gWS.x - ourS.x) * uX + (gWS.y - ourS.y) * uY;
        const p1 = (gWE.x - ourS.x) * uX + (gWE.y - ourS.y) * uY;

        const mappedOffset = Math.min(p0, p1);
        const mappedWidth  = Math.abs(p1 - p0);

        if (mappedOffset + mappedWidth > 0.001 && mappedOffset < lenO - 0.001) {
          result.push({ ...d, offset: mappedOffset, width: mappedWidth });
        }
      }
    }
  }
  return result;
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
const makeSnapshot = (state) => ({
  rooms:     current(state.rooms),
  furniture: current(state.furniture),
  doors:     current(state.doors),
  walls:     current(state.walls),
  groups:    current(state.groups),
});

// ── Initial state ─────────────────────────────────────────────────────────────
const initialState = {
  rooms:              [],
  furniture:          [],
  doors:              [],
  walls:              [],
  selectedIds:        [],
  lockedIds:          [],
  groups:             [],
  clipboard:          [],
  clipboardGroup:     null,
  pasteCount:         0,
  activeTool:         'select',
  activeFurnitureDef: null,
  viewMode:           '2d',
  showHeatmap:        false,
  gridSize:           0.05,
  undoMsg:            null,
  editorCamera:       null,
  isDark:             false,
  past:               [],
  future:             [],
};

// ── Slice ─────────────────────────────────────────────────────────────────────
const floorPlannerSlice = createSlice({
  name: 'floorPlanner',
  initialState,
  reducers: {
    // ── History (private, called by thunks) ────────────────────────────────
    pushHistory(state) {
      state.past = [...state.past.slice(-49), makeSnapshot(state)];
      state.future = [];
    },

    _setUndoMsg(state, { payload }) {
      state.undoMsg = payload;
    },

    _undoSync(state) {
      if (!state.past.length) return;
      const prev = state.past[state.past.length - 1];
      const snap = makeSnapshot(state);
      state.past     = state.past.slice(0, -1);
      state.future   = [snap, ...state.future];
      state.rooms     = prev.rooms;
      state.furniture = prev.furniture;
      state.doors     = prev.doors;
      state.walls     = prev.walls     ?? [];
      state.groups    = prev.groups    ?? [];
      state.selectedIds = [];
    },

    _redoSync(state) {
      if (!state.future.length) return;
      const next = state.future[0];
      const snap = makeSnapshot(state);
      state.past     = [...state.past, snap];
      state.future   = state.future.slice(1);
      state.rooms     = next.rooms;
      state.furniture = next.furniture;
      state.doors     = next.doors;
      state.walls     = next.walls     ?? [];
      state.groups    = next.groups    ?? [];
      state.selectedIds = [];
    },

    // ── UI toggles ─────────────────────────────────────────────────────────
    setActiveTool(state, { payload }) {
      state.activeTool         = payload;
      state.activeFurnitureDef = null;
    },
    setActiveFurnitureDef(state, { payload }) {
      state.activeFurnitureDef = payload;
      state.activeTool         = 'furniture';
    },
    setViewMode(state, { payload })  { state.viewMode    = payload; },
    setIsDark(state, { payload })    { state.isDark      = payload; },
    toggleHeatmap(state)             { state.showHeatmap = !state.showHeatmap; },
    cycleGridSize(state) {
      const steps = [0.05, 0.1, 0.25];
      const idx = steps.findIndex((s) => Math.abs(s - state.gridSize) < 0.001);
      state.gridSize = steps[(idx + 1) % steps.length];
    },
    setEditorCamera(state, { payload }) { state.editorCamera = payload; },

    // ── Selection ──────────────────────────────────────────────────────────
    selectOne(state, { payload: id }) {
      state.selectedIds = id ? [id] : [];
    },
    selectAdd(state, { payload: id }) {
      if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter((x) => x !== id);
      } else {
        state.selectedIds = [...state.selectedIds, id];
      }
    },
    setSelectedIds(state, { payload }) { state.selectedIds = payload; },
    clearSelection(state)              { state.selectedIds = []; },
    setSelectedId(state, { payload: id }) { state.selectedIds = id ? [id] : []; },

    // ── Locking ────────────────────────────────────────────────────────────
    toggleLock(state, { payload: id }) {
      if (state.lockedIds.includes(id)) {
        state.lockedIds = state.lockedIds.filter((x) => x !== id);
      } else {
        state.lockedIds = [...state.lockedIds, id];
      }
    },
    lockSelected(state) {
      state.lockedIds = [...new Set([...state.lockedIds, ...state.selectedIds])];
    },
    unlockSelected(state) {
      state.lockedIds = state.lockedIds.filter((id) => !state.selectedIds.includes(id));
    },

    // ── Rooms ──────────────────────────────────────────────────────────────
    _addRoomSync(state, { payload: roomData }) {
      const newRoom = {
        id:            `room-${uid()}`,
        name:          `Room ${state.rooms.length + 1}`,
        floorColor:    '#F7F5F0',
        wallColor:     '#444444',
        wallThickness: 0.05,
        wallHeight:    1.8,
        ...roomData,
      };
      state.rooms.push(newRoom);
      state.selectedIds = [newRoom.id];
    },
    updateRoom(state, { payload: { id, updates } }) {
      const idx = state.rooms.findIndex((r) => r.id === id);
      if (idx !== -1) state.rooms[idx] = { ...state.rooms[idx], ...updates };
    },
    _deleteRoomSync(state, { payload: id }) {
      state.rooms       = state.rooms.filter((r) => r.id !== id);
      state.doors       = state.doors.filter((d) => d.roomId !== id);
      state.selectedIds = state.selectedIds.filter((x) => x !== id);
      state.lockedIds   = state.lockedIds.filter((x) => x !== id);
    },

    // ── Furniture ──────────────────────────────────────────────────────────
    _addFurnitureSync(state, { payload: itemData }) {
      const assetId = itemData.assetId || nextAssetId(itemData.type, current(state.furniture));
      const newItem = { id: `furniture-${uid()}`, rotation: 0, ...itemData, assetId };
      state.furniture.push(newItem);
      state.selectedIds = [newItem.id];
    },
    updateFurniture(state, { payload: { id, updates } }) {
      const idx = state.furniture.findIndex((f) => f.id === id);
      if (idx !== -1) state.furniture[idx] = { ...state.furniture[idx], ...updates };
    },
    _deleteFurnitureSync(state, { payload: id }) {
      state.furniture   = state.furniture.filter((f) => f.id !== id);
      state.selectedIds = state.selectedIds.filter((x) => x !== id);
      state.lockedIds   = state.lockedIds.filter((x) => x !== id);
    },

    // ── Doors ──────────────────────────────────────────────────────────────
    _addDoorSync(state, { payload: doorData }) {
      const newDoor = {
        id:        `door-${uid()}`,
        width:     0.9,
        openAngle: 90,
        hingeSide: 'left',
        swingIn:   true,
        ...doorData,
      };
      state.doors.push(newDoor);
      state.selectedIds = [newDoor.id];
    },
    updateDoor(state, { payload: { id, updates } }) {
      const idx = state.doors.findIndex((d) => d.id === id);
      if (idx !== -1) state.doors[idx] = { ...state.doors[idx], ...updates };
    },
    _deleteDoorSync(state, { payload: id }) {
      state.doors       = state.doors.filter((d) => d.id !== id);
      state.selectedIds = state.selectedIds.filter((x) => x !== id);
      state.lockedIds   = state.lockedIds.filter((x) => x !== id);
    },

    // ── Freestanding walls ─────────────────────────────────────────────────
    _addWallSync(state, { payload: wallData }) {
      const newWall = {
        id:        `wall-${uid()}`,
        thickness: 0.05,
        color:     '#444444',
        height:    1.8,
        ...wallData,
      };
      state.walls.push(newWall);
      state.selectedIds = [newWall.id];
    },
    updateWall(state, { payload: { id, updates } }) {
      const idx = state.walls.findIndex((w) => w.id === id);
      if (idx !== -1) state.walls[idx] = { ...state.walls[idx], ...updates };
    },
    _deleteWallSync(state, { payload: id }) {
      state.walls       = state.walls.filter((w) => w.id !== id);
      state.doors       = state.doors.filter((d) => d.wallId !== id);
      state.selectedIds = state.selectedIds.filter((x) => x !== id);
      state.lockedIds   = state.lockedIds.filter((x) => x !== id);
    },

    // ── Multi-delete (sync, called by deleteSelected thunk) ────────────────
    _deleteSelectedSync(state, { payload: toDelete }) {
      const del = new Set(toDelete);
      state.rooms       = state.rooms.filter((r) => !del.has(r.id));
      state.furniture   = state.furniture.filter((f) => !del.has(f.id));
      state.doors       = state.doors.filter(
        (d) => !del.has(d.id) && !del.has(d.roomId) && !del.has(d.wallId),
      );
      state.walls       = state.walls.filter((w) => !del.has(w.id));
      state.groups      = state.groups
        .map((g) => ({ ...g, itemIds: g.itemIds.filter((id) => !del.has(id)) }))
        .filter((g) => g.itemIds.length > 1);
      state.selectedIds = state.selectedIds.filter((id) => !del.has(id));
      state.lockedIds   = state.lockedIds.filter((id) => !del.has(id));
    },

    // ── Clipboard ──────────────────────────────────────────────────────────
    _setClipboard(state, { payload: { items, groupName } }) {
      state.clipboard      = items;
      state.clipboardGroup = groupName;
      state.pasteCount     = 0;
    },
    _pasteSync(state, { payload: { stamped, clipboardGroup } }) {
      const off = (state.pasteCount + 1) * 1;
      for (const item of stamped) {
        if (item.kind === 'room') {
          state.rooms.push({
            ...item.data,
            id:   item.newId,
            name: item.data.name.replace(/ \(copy.*\)$/, '') + ' (copy)',
            x:    item.data.x + off,
            y:    item.data.y + off,
          });
        } else if (item.kind === 'furniture') {
          state.furniture.push({
            ...item.data,
            id:      item.newId,
            assetId: nextAssetId(item.data.type, current(state.furniture)),
            sensors: [],
            x:       item.data.x + off,
            y:       item.data.y + off,
          });
        }
      }
      if (clipboardGroup) {
        state.groups.push({
          id:      `group-${uid()}`,
          name:    clipboardGroup + ' (copy)',
          itemIds: stamped.map((x) => x.newId),
        });
      }
      state.selectedIds = stamped.map((x) => x.newId);
      state.pasteCount  = state.pasteCount + 1;
    },

    // ── Groups ────────────────────────────────────────────────────────────
    _groupSync(state, { payload: { groupId, itemIds } }) {
      state.groups.push({ id: groupId, name: `Group ${state.groups.length + 1}`, itemIds });
    },
    _ungroupIdsSync(state, { payload: groupIds }) {
      const ids = new Set(groupIds);
      state.groups = state.groups.filter((g) => !ids.has(g.id));
    },
    _deleteGroupSync(state, { payload: groupId }) {
      const group = state.groups.find((g) => g.id === groupId);
      if (!group) return;
      const del = new Set(group.itemIds);
      state.groups      = state.groups.filter((g) => g.id !== groupId);
      state.rooms       = state.rooms.filter((r) => !del.has(r.id));
      state.furniture   = state.furniture.filter((f) => !del.has(f.id));
      state.doors       = state.doors.filter((d) => !del.has(d.id) && !del.has(d.roomId));
      state.selectedIds = state.selectedIds.filter((id) => !del.has(id));
      state.lockedIds   = state.lockedIds.filter((id) => !del.has(id));
    },
    renameGroup(state, { payload: { groupId, name } }) {
      const g = state.groups.find((g) => g.id === groupId);
      if (g) g.name = name;
    },

    // ── Clear all ──────────────────────────────────────────────────────────
    _clearAllSync(state) {
      state.rooms = []; state.furniture = []; state.doors = [];
      state.walls = []; state.groups    = [];
      state.selectedIds = []; state.lockedIds = [];
    },

    // ── Import ────────────────────────────────────────────────────────────
    _importSync(state, { payload: data }) {
      state.rooms       = data.rooms      || [];
      state.furniture   = data.assets     || data.furniture || [];
      state.doors       = data.doors      || [];
      state.walls       = data.walls      || [];
      state.groups      = data.groups     || [];
      state.selectedIds = [];
      state.lockedIds   = [];
    },
    _mergeSync(state, { payload: { rooms, furniture, doors, walls, groups } }) {
      state.rooms       = [...state.rooms,     ...rooms];
      state.furniture   = [...state.furniture, ...furniture];
      state.doors       = [...state.doors,     ...doors];
      state.walls       = [...state.walls,     ...walls];
      state.groups      = [...state.groups,    ...groups];
      state.selectedIds = [
        ...rooms.map((r) => r.id),
        ...furniture.map((f) => f.id),
        ...walls.map((w) => w.id),
      ];
    },
  },
});

const sa = floorPlannerSlice.actions;
export const { pushHistory } = sa;

// ── Thunk: show toast ─────────────────────────────────────────────────────────
export const showMsg = (text) => (dispatch, getState) => {
  const ts = Date.now();
  dispatch(sa._setUndoMsg({ text, ts }));
  setTimeout(() => {
    if (getState().floorPlanner.undoMsg?.ts === ts) dispatch(sa._setUndoMsg(null));
  }, 2000);
};

// ── Simple action re-exports (no history needed) ──────────────────────────────
export const {
  setActiveTool, setActiveFurnitureDef, setViewMode, setIsDark,
  toggleHeatmap, cycleGridSize, setEditorCamera,
  selectOne, selectAdd, setSelectedIds, clearSelection, setSelectedId,
  toggleLock, lockSelected, unlockSelected,
  updateRoom, updateFurniture, updateDoor, updateWall,
  renameGroup,
} = sa;

// ── Thunks: history-pushing actions ──────────────────────────────────────────
export const undo = () => (dispatch, getState) => {
  if (!getState().floorPlanner.past.length) return;
  dispatch(sa._undoSync());
  dispatch(showMsg('Undone'));
};

export const redo = () => (dispatch, getState) => {
  if (!getState().floorPlanner.future.length) return;
  dispatch(sa._redoSync());
  dispatch(showMsg('Redone'));
};

export const addRoom = (roomData) => (dispatch) => {
  dispatch(sa.pushHistory());
  dispatch(sa._addRoomSync(roomData));
};

export const deleteRoom = (id) => (dispatch) => {
  dispatch(sa.pushHistory());
  dispatch(sa._deleteRoomSync(id));
};

export const addFurniture = (itemData) => (dispatch) => {
  dispatch(sa.pushHistory());
  dispatch(sa._addFurnitureSync(itemData));
};

export const deleteFurniture = (id) => (dispatch) => {
  dispatch(sa.pushHistory());
  dispatch(sa._deleteFurnitureSync(id));
};

export const addDoor = (doorData) => (dispatch) => {
  dispatch(sa.pushHistory());
  dispatch(sa._addDoorSync(doorData));
};

export const deleteDoor = (id) => (dispatch) => {
  dispatch(sa.pushHistory());
  dispatch(sa._deleteDoorSync(id));
};

export const addWall = (wallData) => (dispatch) => {
  dispatch(sa.pushHistory());
  dispatch(sa._addWallSync(wallData));
};

export const deleteWall = (id) => (dispatch) => {
  dispatch(sa.pushHistory());
  dispatch(sa._deleteWallSync(id));
};

export const deleteSelected = () => (dispatch, getState) => {
  const { selectedIds, lockedIds } = getState().floorPlanner;
  const toDelete = selectedIds.filter((id) => !lockedIds.includes(id));
  if (!toDelete.length) return;
  dispatch(sa.pushHistory());
  dispatch(sa._deleteSelectedSync(toDelete));
};

export const rotateSelectedFurniture = (deg = 90) => (dispatch, getState) => {
  const { selectedIds, furniture } = getState().floorPlanner;
  for (const id of selectedIds) {
    const item = furniture.find((f) => f.id === id);
    if (item) dispatch(sa.updateFurniture({ id, updates: { rotation: ((item.rotation || 0) + deg) % 360 } }));
  }
};

export const copySelected = () => (dispatch, getState) => {
  const { selectedIds, rooms, furniture, groups } = getState().floorPlanner;
  if (!selectedIds.length) return;
  const items = [];
  for (const id of selectedIds) {
    const r = rooms.find((x) => x.id === id);
    const f = furniture.find((x) => x.id === id);
    if (r) items.push({ kind: 'room', data: { ...r } });
    else if (f) items.push({ kind: 'furniture', data: { ...f } });
  }
  if (!items.length) return;
  const sourceGroup = groups.find(
    (g) => selectedIds.every((id) => g.itemIds.includes(id)) &&
           g.itemIds.every((id) => selectedIds.includes(id)),
  );
  dispatch(sa._setClipboard({ items, groupName: sourceGroup ? sourceGroup.name : null }));
  dispatch(showMsg(`Copied ${items.length} item${items.length > 1 ? 's' : ''}${sourceGroup ? ' (group)' : ''}`));
};

export const pasteClipboard = () => (dispatch, getState) => {
  const { clipboard, clipboardGroup } = getState().floorPlanner;
  if (!clipboard.length) return;
  dispatch(sa.pushHistory());
  const stamped = clipboard.map((item) => ({ ...item, newId: uid() }));
  dispatch(sa._pasteSync({ stamped, clipboardGroup }));
  dispatch(showMsg(`Pasted ${stamped.length} item${stamped.length > 1 ? 's' : ''}${clipboardGroup ? ' (group)' : ''}`));
};

export const groupSelected = () => (dispatch, getState) => {
  const { selectedIds, lockedIds } = getState().floorPlanner;
  const ungroupable = selectedIds.filter((id) => !lockedIds.includes(id));
  if (ungroupable.length < 2) {
    dispatch(showMsg('Need 2+ unlocked items to group'));
    return;
  }
  dispatch(sa.pushHistory());
  const groupId = `group-${uid()}`;
  dispatch(sa._groupSync({ groupId, itemIds: ungroupable }));
  const skipped = selectedIds.length - ungroupable.length;
  dispatch(showMsg(
    skipped > 0 ? `Grouped (${skipped} locked item${skipped > 1 ? 's' : ''} skipped)` : 'Grouped',
  ));
};

export const ungroupIds = (groupIds) => (dispatch) => {
  dispatch(sa.pushHistory());
  dispatch(sa._ungroupIdsSync(groupIds));
  dispatch(showMsg('Ungrouped'));
};

export const ungroupSelected = () => (dispatch, getState) => {
  const { selectedIds, groups } = getState().floorPlanner;
  const toUngroup = groups
    .filter((g) => g.itemIds.some((id) => selectedIds.includes(id)))
    .map((g) => g.id);
  if (!toUngroup.length) return;
  dispatch(ungroupIds(toUngroup));
};

export const deleteGroup = (groupId) => (dispatch, getState) => {
  const group = getState().floorPlanner.groups.find((g) => g.id === groupId);
  if (!group) return;
  dispatch(sa.pushHistory());
  dispatch(sa._deleteGroupSync(groupId));
  dispatch(showMsg('Group deleted'));
};

export const clearAll = () => (dispatch) => {
  dispatch(sa.pushHistory());
  dispatch(sa._clearAllSync());
};

export const exportLayout = () => (dispatch, getState) => {
  const { rooms, furniture, doors, walls, groups } = getState().floorPlanner;
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
    assets: furniture.map((f) => ({ ...f, assetId: f.assetId || '', sensors: f.sensors || [], roomId: getRoomId(f) })),
    doors:  doors.map((d) => ({ ...d })),
    walls:  walls.map((w) => ({ ...w })),
    groups: groups.map((g) => ({ ...g })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `floor-plan-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  dispatch(showMsg('Layout exported'));
};

export const importLayout = (jsonText) => (dispatch) => {
  try {
    const data = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText;
    dispatch(sa.pushHistory());
    dispatch(sa._importSync(data));
    dispatch(showMsg('Layout imported'));
  } catch {
    dispatch(showMsg('Import failed — invalid JSON'));
  }
};

export const mergeLayout = (jsonText) => (dispatch) => {
  try {
    const data = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText;
    dispatch(sa.pushHistory());

    const inRooms     = data.rooms     || [];
    const inFurniture = data.assets    || data.furniture || [];
    const inDoors     = data.doors     || [];
    const inWalls     = data.walls     || [];
    const inGroups    = data.groups    || [];

    const roomIdMap = {};
    const rooms = inRooms.map((r) => { const id = `room-${uid()}`; roomIdMap[r.id] = id; return { ...r, id }; });
    const furniIdMap = {};
    const furniture = inFurniture.map((f) => { const id = `furniture-${uid()}`; furniIdMap[f.id] = id; return { ...f, id }; });
    const wallIdMap = {};
    const walls = inWalls.map((w) => { const id = `wall-${uid()}`; wallIdMap[w.id] = id; return { ...w, id }; });
    const doors = inDoors.map((d) => ({
      ...d,
      id:     `door-${uid()}`,
      roomId: d.roomId ? (roomIdMap[d.roomId] || d.roomId) : undefined,
      wallId: d.wallId ? (wallIdMap[d.wallId] || d.wallId) : undefined,
    }));
    const groups = inGroups.map((g) => ({
      ...g,
      id:      `group-${uid()}`,
      itemIds: g.itemIds.map((id) => furniIdMap[id] || roomIdMap[id] || wallIdMap[id] || id),
    }));

    dispatch(sa._mergeSync({ rooms, furniture, doors, walls, groups }));
    dispatch(showMsg('Layout merged'));
  } catch {
    dispatch(showMsg('Merge failed — invalid JSON'));
  }
};

export default floorPlannerSlice.reducer;
