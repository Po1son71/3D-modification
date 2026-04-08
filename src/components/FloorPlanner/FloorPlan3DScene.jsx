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
import useFloorPlannerStore, { getDoorInfo } from '../../store/floorPlannerStore';

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
const ModelMeshInner = React.memo(({ modelPath, width, height3d, depth, rotation }) => {
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
          />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  );
});

// ── Room: floor + ceiling + 4 walls with door cutouts ────────────────────────
const RoomMesh = React.memo(({ room, roomDoors }) => {
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
      const L = wd.L;
      const sorted = (roomDoors || [])
        .filter((d) => d.wall === wallName)
        .sort((a, b) => a.offset - b.offset);

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
  }, [room, roomDoors, wallH, doorH]);

  return (
    <group>
      {/* Tiled floor */}
      <mesh position={[x + w / 2, FLOOR_THICK / 2, y + h / 2]}>
        <boxGeometry args={[w - wt, FLOOR_THICK, h - wt]} />
        <meshStandardMaterial map={tileTex} roughness={0.75} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[x + w / 2, wallH + CEIL_THICK / 2, y + h / 2]}>
        <boxGeometry args={[w + wt, CEIL_THICK, h + wt]} />
        <meshStandardMaterial color={wallColor} opacity={0.12} transparent />
      </mesh>

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
  const panelAngle  = closedAngle + (cross >= 0 ? 1 : -1) * θ;
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
    <meshStandardMaterial color="#B8BEC4" roughness={1} />
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

// ── Scene root ────────────────────────────────────────────────────────────────
const FloorPlan3DScene = () => {
  const { rooms, furniture, doors } = useFloorPlannerStore();
  const hasContent = rooms.length > 0;

  // Compute tight bounding box over all rooms so the camera scales with layout size
  const { center, camPos } = useMemo(() => {
    if (!rooms.length) {
      const c = [0, 0, 0];
      return { center: c, camPos: [10, 18, 10] };
    }
    const minX = Math.min(...rooms.map((r) => r.x));
    const maxX = Math.max(...rooms.map((r) => r.x + r.width));
    const minZ = Math.min(...rooms.map((r) => r.y));
    const maxZ = Math.max(...rooms.map((r) => r.y + r.height));
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
        key={`${camPos[0].toFixed(1)}-${camPos[2].toFixed(1)}`}
        camera={{ position: camPos, fov: 38, near: 0.1, far: 500 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#CDD8E3']} />

        <ambientLight intensity={0.55} />
        <directionalLight position={[15, 25, 15]} intensity={0.85} />
        <directionalLight position={[-10, 15, -10]} intensity={0.25} />
        <hemisphereLight skyColor="#EEF5FF" groundColor="#888888" intensity={0.4} />

        <Suspense fallback={null}>
          <Ground />

          {!hasContent && <EmptyState />}

          {rooms.map((room) => (
            <RoomMesh key={room.id} room={room} roomDoors={doorsByRoom[room.id] || []} />
          ))}

          {doors.map((door) => {
            const room = rooms.find((r) => r.id === door.roomId);
            return room ? <DoorMesh key={door.id} door={door} room={room} /> : null;
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
