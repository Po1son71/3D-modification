import React, { useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import Floor from "./Floor";
import Rack from "./Rack";
import ACUnit from "./ACUnit";
import Generator from "./Generator";
import useDCIMStore from "../store/dcimStore";

const Scene = () => {
    const { floor, racks, acUnits, generators, loadFloorData, isLoading, isDragging } = useDCIMStore();

    useEffect(() => {
        fetch('/data/floorConfig.json')
            .then(res => res.json())
            .then(data => loadFloorData(data))
            .catch(err => console.error('Failed to load floor config:', err));
    }, [loadFloorData]);

    if (isLoading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>;
    }

    // Calculate center of the floor for better camera positioning
    const centerX = floor ? (floor.gridSize.width * 2) / 2 : 0;
    const centerZ = floor ? (floor.gridSize.depth * 2) / 2 : 0;

    return (
        <Canvas
            camera={{ 
                position: [centerX + 30, 30, centerZ + 30], 
                fov: 50,
                near: 0.1, 
                far: 1000,
                up: [0, 1, 0]
            }}
            shadows
        >
            {/* Background */}
            <color attach="background" args={['#f5f5f5']} />

            {/* Lights */}
            <ambientLight intensity={0.8} />
            <directionalLight position={[20, 30, 20]} intensity={1.2} castShadow />
            <directionalLight position={[-10, 20, -10]} intensity={0.4} />

            <Suspense fallback={<Html>Loading Scene...</Html>}>
                {/* Floor */}
                {floor && (
                    <Floor width={floor.gridSize.width} depth={floor.gridSize.depth} />
                )}

                {/* AC Units */}
                {acUnits.map((acUnit) => (
                    <ACUnit key={acUnit.id} acData={acUnit} />
                ))}

                {/* Generators */}
                {generators.map((generator) => (
                    <Generator key={generator.id} generatorData={generator} />
                ))}

                {/* Racks */}
                {racks.map((rack) => (
                    <Rack key={rack.id} rackData={rack} />
                ))}
            </Suspense>

            {/* Camera Controls - Free flow like Blender */}
            <OrbitControls
                enabled={!isDragging}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                panSpeed={1.2}
                zoomSpeed={1.2}
                rotateSpeed={1.0}
                dampingFactor={0.05}
                minDistance={5}
                maxDistance={200}
            />
        </Canvas>
    );
};

export default Scene;
