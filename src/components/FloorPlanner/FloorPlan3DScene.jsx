import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import useFloorPlannerStore from '../../store/floorPlannerStore';

const WALL_H = 2.8;
const CEIL_THICK = 0.1;
const FLOOR_THICK = 0.05;

// Precompute wall geometry data for a room
function getRoomWalls(room) {
  const { x, y, width: w, height: h, wallThickness: wt = 0.15 } = room;
  return [
    // North wall (along -Z edge) — includes corners
    { pos: [x + w / 2,          WALL_H / 2, y],     size: [w + wt * 2, WALL_H, wt] },
    // South wall (along +Z edge) — includes corners
    { pos: [x + w / 2,          WALL_H / 2, y + h], size: [w + wt * 2, WALL_H, wt] },
    // West wall (along -X edge) — excludes corners
    { pos: [x,                  WALL_H / 2, y + h / 2], size: [wt, WALL_H, h] },
    // East wall (along +X edge) — excludes corners
    { pos: [x + w,              WALL_H / 2, y + h / 2], size: [wt, WALL_H, h] },
  ];
}

const RoomMesh = React.memo(({ room }) => {
  const { x, y, width: w, height: h, floorColor, wallColor = '#4A4A4A', wallThickness: wt = 0.15 } = room;
  const walls = useMemo(() => getRoomWalls(room), [room]);
  const cx = x + w / 2;
  const cz = y + h / 2;

  return (
    <group>
      {/* Floor slab */}
      <mesh position={[cx, FLOOR_THICK / 2, cz]} receiveShadow>
        <boxGeometry args={[w - wt, FLOOR_THICK, h - wt]} />
        <meshStandardMaterial color={floorColor} roughness={0.8} />
      </mesh>

      {/* Ceiling (semi-transparent) */}
      <mesh position={[cx, WALL_H + CEIL_THICK / 2, cz]}>
        <boxGeometry args={[w + wt, CEIL_THICK, h + wt]} />
        <meshStandardMaterial color={wallColor} opacity={0.15} transparent />
      </mesh>

      {/* 4 Walls */}
      {walls.map((wall, i) => (
        <mesh key={i} position={wall.pos} castShadow receiveShadow>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color={wallColor} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
});

const FurnitureMesh = React.memo(({ item }) => {
  const { x, y, width, depth, color = '#C8A080', height3d = 0.8, rotation = 0 } = item;
  const cx = x + width / 2;
  const cz = y + depth / 2;

  return (
    <mesh
      position={[cx, height3d / 2 + FLOOR_THICK, cz]}
      rotation={[0, -(rotation * Math.PI) / 180, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[width, height3d, depth]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
});

// Ground plane below everything
const Ground = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
    <planeGeometry args={[200, 200]} />
    <meshStandardMaterial color="#C8C8C8" roughness={1} />
  </mesh>
);

// Infinite grid lines
const GridLines = () => (
  <gridHelper
    args={[200, 200, '#AAAAAA', '#CCCCCC']}
    position={[0, 0, 0]}
  />
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

const FloorPlan3DScene = () => {
  const { rooms, furniture } = useFloorPlannerStore();
  const hasContent = rooms.length > 0;

  // Compute a rough center of all rooms for camera target
  const center = useMemo(() => {
    if (!rooms.length) return [0, 0, 0];
    const cx = rooms.reduce((a, r) => a + r.x + r.width / 2, 0) / rooms.length;
    const cz = rooms.reduce((a, r) => a + r.y + r.height / 2, 0) / rooms.length;
    return [cx, 0, cz];
  }, [rooms]);

  const camPos = useMemo(() => [center[0] + 12, 14, center[2] + 12], [center]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        key={`${camPos[0]}-${camPos[2]}`}
        camera={{ position: camPos, fov: 50, near: 0.1, far: 500 }}
        shadows
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#CDD8E3']} />

        {/* Lighting */}
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[15, 25, 15]}
          intensity={0.85}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={100}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
        />
        <directionalLight position={[-10, 15, -10]} intensity={0.25} />
        <hemisphereLight skyColor="#EEF5FF" groundColor="#888888" intensity={0.4} />

        <Suspense fallback={null}>
          <Ground />
          <GridLines />

          {!hasContent && <EmptyState />}

          {rooms.map((room) => (
            <RoomMesh key={room.id} room={room} />
          ))}

          {furniture.map((item) => (
            <FurnitureMesh key={item.id} item={item} />
          ))}
        </Suspense>

        <OrbitControls
          target={center}
          enablePan
          enableZoom
          enableRotate
          panSpeed={1.2}
          zoomSpeed={1.2}
          rotateSpeed={0.8}
          minDistance={3}
          maxDistance={120}
          dampingFactor={0.08}
          enableDamping
        />
      </Canvas>
    </div>
  );
};

export default FloorPlan3DScene;
