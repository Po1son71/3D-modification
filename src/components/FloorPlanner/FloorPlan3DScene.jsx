import React, { Suspense, useMemo, Component } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ── Tile texture factory ───────────────────────────────────────────────────────
// Draws a single square tile with beveled grout lines onto a canvas, returns
// a THREE.CanvasTexture that tiles seamlessly across the floor mesh.
function makeTileTexture(baseColor = '#F0EDE8', groutColor = '#CCCAC5', tileSize = 120) {
  const c = document.createElement('canvas');
  c.width = tileSize; c.height = tileSize;
  const ctx = c.getContext('2d');
  const g = 4; // grout width px

  // Tile face
  ctx.fillStyle = baseColor;
  ctx.fillRect(g, g, tileSize - g * 2, tileSize - g * 2);

  // Subtle noise variation so tiles don't look flat
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(g, g, (tileSize - g * 2) * 0.5, (tileSize - g * 2) * 0.5);
  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  ctx.fillRect(tileSize * 0.5, tileSize * 0.5, (tileSize - g * 2) * 0.5, (tileSize - g * 2) * 0.5);

  // Grout lines
  ctx.fillStyle = groutColor;
  ctx.fillRect(0, 0, tileSize, g);               // top
  ctx.fillRect(0, tileSize - g, tileSize, g);    // bottom
  ctx.fillRect(0, 0, g, tileSize);               // left
  ctx.fillRect(tileSize - g, 0, g, tileSize);   // right

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
import useFloorPlannerStore, { getDoorInfo, getSharedWallDoors, getWorldWallFace } from '../../store/floorPlannerStore';

const WALL_H     = 1.8;
const DOOR_H     = 2.1;
const CEIL_THICK = 0.1;
const FLOOR_THICK = 0.05;
const PANEL_THICK = 0.04;

// ── Error boundary — catches failed GLB loads, falls back to box ──────────────
class ModelErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

// ── GLB model mesh — auto-scales loaded scene to fit item dimensions ──────────
const ModelMeshInner = React.memo(({ modelPath, width, height3d, depth, rotation, color }) => {
  const { scene } = useGLTF(modelPath);

  const { clone, offset } = useMemo(() => {
    const clone = scene.clone(true);

    // Measure raw bounding box of the loaded model
    const box  = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());

    // Scale non-uniformly to exactly match the defined item dimensions
    const sx = size.x > 0.001 ? width   / size.x : 1;
    const sy = size.y > 0.001 ? height3d / size.y : 1;
    const sz = size.z > 0.001 ? depth   / size.z : 1;
    clone.scale.set(sx, sy, sz);

    // After scaling, center X/Z and bottom-align Y
    const scaled  = new THREE.Box3().setFromObject(clone);
    const center  = scaled.getCenter(new THREE.Vector3());
    const offset  = { x: -center.x, y: -scaled.min.y, z: -center.z };

    return { clone, offset };
  }, [scene, width, height3d, depth]);

  // Apply color tint to all mesh materials whenever color changes
  useMemo(() => {
    if (!color) return;
    const threeColor = new THREE.Color(color);
    clone.traverse((child) => {
      if (!child.isMesh) return;
      const wasArray = Array.isArray(child.material);
      const mats = wasArray ? child.material : [child.material];
      const tinted = mats.map((mat) => {
        const m = mat.clone();
        m.color = threeColor.clone();
        return m;
      });
      child.material = wasArray ? tinted : tinted[0];
    });
  }, [clone, color]);

  return (
    <group rotation={[0, -(rotation * Math.PI) / 180, 0]}>
      <primitive
        object={clone}
        position={[offset.x, offset.y, offset.z]}
      />
    </group>
  );
});

// ── Simple fallback box (used when no modelPath, or GLB fails to load) ────────
const BoxMesh = ({ width, height3d, depth, color, rotation }) => (
  <mesh
    rotation={[0, -(rotation * Math.PI) / 180, 0]}
   
  >
    <boxGeometry args={[width, height3d, depth]} />
    <meshStandardMaterial color={color} roughness={0.6} />
  </mesh>
);

// ── Combined furniture mesh: GLB if modelPath present, else box ───────────────
const FurnitureMesh = React.memo(({ item }) => {
  const { x, y, width, depth, color = '#C8A080', height3d = 0.8, rotation = 0, modelPath } = item;

  const px = x + width / 2;
  const pz = y + depth / 2;

  if (!modelPath) {
    // Box origin is centered → lift by height3d/2 so its bottom sits on the floor
    return (
      <group position={[px, height3d / 2 + FLOOR_THICK, pz]}>
        <BoxMesh width={width} height3d={height3d} depth={depth} color={color} rotation={rotation} />
      </group>
    );
  }

  // When a GLB is present the parent group sits at floor level (FLOOR_THICK).
  // ModelMeshInner bottom-aligns the model to local Y=0 so it lands correctly.
  // The fallback box is expressed in the *same local space* (relative to the parent),
  // so it only needs height3d/2 to lift its center off Y=0 — NOT the absolute px/pz.
  const boxFallback = (
    <group position={[0, height3d / 2, 0]}>
      <BoxMesh width={width} height3d={height3d} depth={depth} color={color} rotation={rotation} />
    </group>
  );

  return (
    <group position={[px, FLOOR_THICK, pz]}>
      <ModelErrorBoundary fallback={boxFallback}>
        <Suspense fallback={boxFallback}>
          <ModelMeshInner
            modelPath={modelPath}
            width={width}
            height3d={height3d}
            depth={depth}
            rotation={rotation}
            color={color}
          />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  );
});

// ── Room: floor + ceiling + 4 walls with door cutouts ────────────────────────
const RoomMesh = React.memo(({ room, roomDoors, allRooms, allDoors }) => {
  const {
    x, y, width: w, height: h,
    floorColor, wallColor = '#4A4A4A',
    wallThickness: wt = 0.15,
    wallHeight: wallH = WALL_H,
  } = room;

  // Build a tile texture tinted by floorColor
  const tileTex = useMemo(() => {
    // Parse floorColor as a slight tint on the base tile color
    const tex = makeTileTexture(floorColor || '#F0EDE8', '#B8B5AF');
    // Scale: 1 tile = 0.6 m → repeat = roomDim / 0.6
    tex.repeat.set(w / 0.6, h / 0.6);
    return tex;
  }, [floorColor, w, h]);

  // Door opening always spans full wall height
  const doorH = wallH;

  const wallSegments = useMemo(() => {
    const segments = [];
    const wallDefs = {
      north: { isHoriz: true,  wallX: x + w / 2, wallZ: y,         L: w },
      south: { isHoriz: true,  wallX: x + w / 2, wallZ: y + h,     L: w },
      west:  { isHoriz: false, wallX: x,          wallZ: y + h / 2, L: h },
      east:  { isHoriz: false, wallX: x + w,      wallZ: y + h / 2, L: h },
    };

    for (const [wallName, wd] of Object.entries(wallDefs)) {
      if ((room.hiddenWalls || []).includes(wallName)) continue;
      const L = wd.L;
      const ownDoors    = (roomDoors || []).filter((d) => d.wall === wallName);
      const sharedDoors = getSharedWallDoors(room, wallName, allDoors || [], allRooms || []);

      // If this room has no doors on this face and no shared doors, but an adjacent room
      // owns this face with a door, skip rendering — the owning room renders the gap.
      if (ownDoors.length === 0 && sharedDoors.length === 0) {
        const ourFace = getWorldWallFace(room, wallName);
        const dxO = ourFace.e.x - ourFace.s.x, dyO = ourFace.e.y - ourFace.s.y;
        const fLen = Math.hypot(dxO, dyO);
        if (fLen > 0.001) {
          const uX = dxO / fLen, uY = dyO / fLen;
          const nX = -uY, nY = uX;
          const ourS = ourFace.s.x * uX + ourFace.s.y * uY;
          const ourE = ourFace.e.x * uX + ourFace.e.y * uY;
          const oMin = Math.min(ourS, ourE), oMax = Math.max(ourS, ourE);
          const hasDoorOnAdjacentFace = (allRooms || []).some((other) => {
            if (other.id === room.id) return false;
            return ['north', 'south', 'east', 'west'].some((ow) => {
              const thFace = getWorldWallFace(other, ow);
              // Co-planar check — 2 cm tolerance only (not 30 cm)
              const dx0 = thFace.s.x - ourFace.s.x, dy0 = thFace.s.y - ourFace.s.y;
              if (Math.abs(dx0 * nX + dy0 * nY) > 0.02) return false;
              // Parallel check
              const dxT = thFace.e.x - thFace.s.x, dyT = thFace.e.y - thFace.s.y;
              const tLen = Math.hypot(dxT, dyT);
              if (tLen < 0.001) return false;
              const dot = (dxT * uX + dyT * uY) / tLen;
              if (Math.abs(Math.abs(dot) - 1) > 0.1) return false;
              // Must overlap in the parallel direction by at least 5 cm
              const thS = thFace.s.x * uX + thFace.s.y * uY;
              const thE = thFace.e.x * uX + thFace.e.y * uY;
              const tMin = Math.min(thS, thE), tMax = Math.max(thS, thE);
              if (Math.min(oMax, tMax) - Math.max(oMin, tMin) < 0.05) return false;
              return (allDoors || []).some((d) => d.roomId === other.id && d.wall === ow);
            });
          });
          if (hasDoorOnAdjacentFace) continue;
        }
      }

      const sorted = [...ownDoors, ...sharedDoors].sort((a, b) => a.offset - b.offset);

      const gaps = sorted.map((d) => ({
        t0: Math.max(0, d.offset / L),
        t1: Math.min(1, (d.offset + d.width) / L),
        door: d,
      }));

      let prev = 0;
      for (const gap of gaps) {
        if (gap.t0 > prev + 0.001) {
          segments.push({ wallName, wd, L, segLen: (gap.t0 - prev) * L, segCtr: (prev + gap.t0) / 2 * L, type: 'full' });
        }
        const transomH = wallH - doorH;
        if (transomH > 0.01) {
          segments.push({ wallName, wd, L, segLen: gap.door.width, segCtr: gap.door.offset + gap.door.width / 2, type: 'transom', transomH });
        }
        prev = gap.t1;
      }
      if (prev < 1 - 0.001) {
        segments.push({ wallName, wd, L, segLen: (1 - prev) * L, segCtr: (prev + 1) / 2 * L, type: 'full' });
      }
    }
    return segments;
  }, [room, roomDoors, wallH, doorH, allRooms, allDoors]);

  return (
    <group>
      {/* Tiled floor */}
      <mesh position={[x + w / 2, FLOOR_THICK / 2, y + h / 2]}>
        <boxGeometry args={[w - wt, FLOOR_THICK, h - wt]} />
        <meshStandardMaterial map={tileTex} roughness={0.75} />
      </mesh>

      {/* Ceiling — hidden when any walls are removed (open side would be visible) */}
      {!(room.hiddenWalls && room.hiddenWalls.length > 0) && (
        <mesh position={[x + w / 2, wallH + CEIL_THICK / 2, y + h / 2]}>
          <boxGeometry args={[w + wt, CEIL_THICK, h + wt]} />
          <meshStandardMaterial color={wallColor} opacity={0.12} transparent />
        </mesh>
      )}

      {/* Wall segments */}
      {wallSegments.map((seg, i) => {
        const { wallName, wd, segLen, segCtr, type, transomH } = seg;
        const isHoriz = wallName === 'north' || wallName === 'south';
        const segH = type === 'transom' ? transomH         : wallH;
        const segY = type === 'transom' ? doorH + transomH / 2 : wallH / 2;

        const px = isHoriz ? x + segCtr : wd.wallX;
        const pz = isHoriz ? wd.wallZ   : y + segCtr;
        const gx = isHoriz ? segLen      : wt;
        const gz = isHoriz ? wt          : segLen;

        return (
          <mesh key={i} position={[px, segY, pz]}>
            <boxGeometry args={[gx, segH, gz]} />
            <meshStandardMaterial color={wallColor} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
});

// ── Door panel ────────────────────────────────────────────────────────────────
const DoorMesh = React.memo(({ door, room }) => {
  const wallH = room.wallHeight || WALL_H;
  const { hingePoint, panelDir, swingDir } = useMemo(() => getDoorInfo(door, room), [door, room]);
  const θ          = (door.openAngle * Math.PI) / 180;
  const closedAngle = Math.atan2(panelDir.x, panelDir.y);
  const cross       = panelDir.x * swingDir.y - panelDir.y * swingDir.x;
  const panelAngle  = closedAngle + (cross >= 0 ? -1 : 1) * θ;
  const cx = hingePoint.x + (door.width / 2) * Math.sin(panelAngle);
  const cz = hingePoint.y + (door.width / 2) * Math.cos(panelAngle);

  return (
    <group position={[cx, wallH / 2 + FLOOR_THICK, cz]} rotation={[0, panelAngle, 0]}>
      <mesh>
        <boxGeometry args={[PANEL_THICK, wallH, door.width]} />
        <meshStandardMaterial color="#C8A07A" roughness={0.5} />
      </mesh>
      {/* Handle */}
      <mesh position={[PANEL_THICK / 2 + 0.01, 0, door.width * 0.3]}>
        <boxGeometry args={[0.04, 0.12, 0.012]} />
        <meshStandardMaterial color="#B8A000" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
});

// ── Clean ground plane (no grid) ──────────────────────────────────────────────
const Ground = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
    <planeGeometry args={[400, 400]} />
    <meshStandardMaterial color="#FFFFFF" roughness={1} emissive="#FFFFFF" emissiveIntensity={0.15} />
  </mesh>
);

const EmptyState = () => (
  <Html center>
    <div style={{
      textAlign: 'center', color: '#888',
      background: 'rgba(255,255,255,0.85)',
      padding: '24px 32px', borderRadius: 8,
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>🏠</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>No rooms yet</div>
      <div style={{ fontSize: 12, marginTop: 6, color: '#aaa' }}>Switch to 2D and draw rooms</div>
    </div>
  </Html>
);

// ── Door on freestanding wall ─────────────────────────────────────────────────
const FWDoorMesh = React.memo(({ door, wall }) => {
  const { offset = 0, width = 0.9, openAngle = 90, hingeSide = 'left', swingIn = true } = door;
  const { x1, y1, x2, y2, height: wallH = 2.4 } = wall;
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 0.01) return null;

  const dirX = (x2 - x1) / len, dirZ = (y2 - y1) / len;
  // Perp = left side of wall direction (inward)
  const perpX = -dirZ, perpZ = dirX;

  // Hinge at start or end of gap
  const hingeOffset = hingeSide === 'left' ? offset : offset + width;
  const hx = x1 + dirX * hingeOffset;
  const hz = y1 + dirZ * hingeOffset;

  // Closed panel direction: away from hinge along wall
  const closedDirX = hingeSide === 'left' ?  dirX : -dirX;
  const closedDirZ = hingeSide === 'left' ?  dirZ : -dirZ;
  // Swing direction: in 3D XZ, "inward" = perp; "outward" = -perp
  const swingDirX = swingIn ?  perpX : -perpX;
  const swingDirZ = swingIn ?  perpZ : -perpZ;

  // Cross product (Y component) to determine rotation sign
  // FWDoor uses standard atan2(z,x) — same convention as 2D canvas atan2(y,x),
  // so sign matches 2D directly (no negation needed, unlike room DoorMesh which swaps atan2 args)
  const cross = closedDirX * swingDirZ - closedDirZ * swingDirX;
  const sign  = cross >= 0 ? 1 : -1;

  const closedAngle    = Math.atan2(closedDirZ, closedDirX);
  const θ              = (openAngle * Math.PI) / 180;
  const panelWorldAngle = closedAngle + sign * θ;

  const doorH = Math.min(wallH, 2.1);
  const cx = hx + (width / 2) * Math.cos(panelWorldAngle);
  const cz = hz + (width / 2) * Math.sin(panelWorldAngle);

  return (
    <group>
      <mesh position={[cx, doorH / 2 + FLOOR_THICK, cz]} rotation={[0, -panelWorldAngle, 0]}>
        <boxGeometry args={[width, doorH, PANEL_THICK]} />
        <meshStandardMaterial color="#C8A07A" roughness={0.5} />
      </mesh>
      <mesh
        position={[
          cx + PANEL_THICK * 0.5 * Math.cos(panelWorldAngle + Math.PI / 2),
          doorH / 2 + FLOOR_THICK,
          cz + PANEL_THICK * 0.5 * Math.sin(panelWorldAngle + Math.PI / 2),
        ]}
        rotation={[0, -panelWorldAngle, 0]}
      >
        <boxGeometry args={[0.04, 0.12, 0.012]} />
        <meshStandardMaterial color="#B8A000" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
});

// ── Scene root ────────────────────────────────────────────────────────────────
// ── Freestanding wall mesh — renders segments with door gaps ──────────────────
const FWWallMesh = React.memo(({ wall, wallDoors }) => {
  const { x1, y1, x2, y2, thickness = 0.05, color = '#444444', height: wallH = 1.8 } = wall;
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 0.01) return null;

  const angle = Math.atan2(y2 - y1, x2 - x1); // wall direction in XZ
  const dirX  = (x2 - x1) / len;
  const dirZ  = (y2 - y1) / len;

  // Build segments — same logic as room wall segments
  const sorted = (wallDoors || []).slice().sort((a, b) => a.offset - b.offset);
  const segments = [];
  let prev = 0;
  for (const d of sorted) {
    const t0 = Math.max(0, d.offset / len);
    const t1 = Math.min(1, (d.offset + (d.width || 0.9)) / len);
    if (t0 > prev + 0.001) {
      segments.push({ start: prev * len, end: t0 * len });
    }
    prev = t1;
  }
  if (prev < 1 - 0.001) {
    segments.push({ start: prev * len, end: len });
  }
  // If no doors, one full segment
  if (segments.length === 0 && sorted.length === 0) {
    segments.push({ start: 0, end: len });
  }

  return (
    <group>
      {segments.map(({ start, end }, i) => {
        const segLen = end - start;
        const midT   = (start + end) / 2;
        const cx = x1 + dirX * midT;
        const cz = y1 + dirZ * midT;
        return (
          <mesh key={i} position={[cx, wallH / 2 + FLOOR_THICK, cz]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[segLen, wallH, thickness]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
});

const FloorPlan3DScene = () => {
  const { rooms, furniture, doors, walls } = useFloorPlannerStore();
  const hasContent = rooms.length > 0 || (walls && walls.length > 0);

  // Compute tight bounding box over rooms + freestanding walls
  const { center, camPos } = useMemo(() => {
    const pts = [
      ...rooms.flatMap((r) => [
        { x: r.x, z: r.y }, { x: r.x + r.width, z: r.y + r.height },
      ]),
      ...(walls || []).flatMap((w) => [
        { x: w.x1, z: w.y1 }, { x: w.x2, z: w.y2 },
      ]),
    ];
    if (!pts.length) return { center: [0, 0, 0], camPos: [10, 18, 10] };

    const minX = Math.min(...pts.map((p) => p.x));
    const maxX = Math.max(...pts.map((p) => p.x));
    const minZ = Math.min(...pts.map((p) => p.z));
    const maxZ = Math.max(...pts.map((p) => p.z));
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const spanX = maxX - minX;
    const spanZ = maxZ - minZ;
    const span  = Math.max(spanX, spanZ, 4);

    // Position camera more top-down: height ≈ span, small horizontal offset
    // This keeps the view scale matching the 2D footprint closely
    const h  = span * 1.1 + 4;
    const xz = span * 0.18 + 1;

    return {
      center: [cx, 0, cz],
      camPos: [cx + xz, h, cz + xz],
    };
  }, [rooms]);

  const doorsByRoom = useMemo(() => {
    const map = {};
    for (const d of doors) {
      if (!map[d.roomId]) map[d.roomId] = [];
      map[d.roomId].push(d);
    }
    return map;
  }, [doors]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        key={`${camPos[0].toFixed(1)}-${camPos[1].toFixed(1)}-${camPos[2].toFixed(1)}`}
        camera={{ position: camPos, fov: 38, near: 0.1, far: 500 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#FFFFFF']} />

        <ambientLight intensity={0.75} />
        <directionalLight position={[15, 25, 15]} intensity={0.9} castShadow />
        <directionalLight position={[-10, 15, -10]} intensity={0.35} />
        <hemisphereLight skyColor="#FFFFFF" groundColor="#FFFFFF" intensity={0.5} />

        <Suspense fallback={null}>
          <Ground />

          {!hasContent && <EmptyState />}

          {rooms.map((room) => {
            const rotRad = (room.rotation || 0) * Math.PI / 180;
            const cx = room.x + room.width / 2;
            const cz = room.y + room.height / 2;
            return (
              <group key={room.id} position={[cx, 0, cz]} rotation={[0, -rotRad, 0]}>
                <group position={[-cx, 0, -cz]}>
                  <RoomMesh room={room} roomDoors={doorsByRoom[room.id] || []} allRooms={rooms} allDoors={doors} />
                </group>
              </group>
            );
          })}

          {doors.map((door) => {
            const room = rooms.find((r) => r.id === door.roomId);
            if (!room) return null;
            const dRotRad = (room.rotation || 0) * Math.PI / 180;
            const dcx = room.x + room.width / 2;
            const dcz = room.y + room.height / 2;
            return (
              <group key={door.id} position={[dcx, 0, dcz]} rotation={[0, -dRotRad, 0]}>
                <group position={[-dcx, 0, -dcz]}>
                  <DoorMesh door={door} room={room} />
                </group>
              </group>
            );
          })}

          {walls && walls.map((wall) => (
            <FWWallMesh
              key={wall.id}
              wall={wall}
              wallDoors={doors.filter((d) => d.wallId === wall.id)}
            />
          ))}

          {doors.filter((d) => d.wallId).map((door) => {
            const wall = walls && walls.find((w) => w.id === door.wallId);
            return wall ? <FWDoorMesh key={door.id} door={door} wall={wall} /> : null;
          })}

          {furniture.map((item) => (
            <FurnitureMesh key={item.id} item={item} />
          ))}
        </Suspense>

        <OrbitControls
          target={center}
          enablePan enableZoom enableRotate
          panSpeed={1.2} zoomSpeed={1.2} rotateSpeed={0.8}
          minDistance={3} maxDistance={120}
          dampingFactor={0.08} enableDamping
        />
      </Canvas>
    </div>
  );
};

export default FloorPlan3DScene;
