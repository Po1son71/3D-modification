import React, { useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import Floor from "./Floor";
import Rack from "./Rack";
import useDCIMStore from "../store/dcimStore";

const Scene = () => {
    const { floor, racks, loadFloorData, isLoading } = useDCIMStore();

    useEffect(() => {
        fetch('/data/floorConfig.json')
            .then(res => res.json())
            .then(data => loadFloorData(data))
            .catch(err => console.error('Failed to load floor config:', err));
    }, [loadFloorData]);

    if (isLoading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>;
    }

    return (
        <Canvas
            orthographic
            camera={{ position: [10, 10, 10], zoom: 50, near: -100, far: 100 }}
            shadows
        >
            {/* Background */}
            <color attach="background" args={['#f5f5f5']} />

            {/* Lights */}
            <ambientLight intensity={1.6} />
            <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />

            <Suspense fallback={<Html>Loading Scene...</Html>}>
                {/* Floor */}
                {floor && (
                    <Floor width={floor.gridSize.width} depth={floor.gridSize.depth} />
                )}

                {/* Racks */}
                {racks.map((rack) => (
                    <Rack key={rack.id} rackData={rack} />
                ))}
            </Suspense>

            {/* Camera Controls */}
            <OrbitControls
                maxPolarAngle={Math.PI / 2}
                minPolarAngle={Math.PI / 4}
                minAzimuthAngle={-Math.PI / 2}
                maxAzimuthAngle={Math.PI / 2}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
            />
        </Canvas>
    );
};

export default Scene;
