import React, { useRef, Suspense, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { TILE_SIZE } from "../../utils/gridUtils";

// Component to load GLB model with proper scaling
const BoxModel = ({ url, scale, onHeightCalculated}) => {
    const gltf = useGLTF(url);
    const clonedScene = gltf.scene.clone();

    useEffect(() => {
        // Calculate the bounding box of the model
        const box = new THREE.Box3().setFromObject(clonedScene);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Calculate scale to fit the model to TILE_SIZE (2x2 grid)
        const maxDim = Math.max(size.x, size.z);
        const targetScale = TILE_SIZE / maxDim;

        clonedScene.scale.set(targetScale, targetScale, targetScale);

        // After scaling, recalculate bounding box to get accurate position and size
        const scaledBox = new THREE.Box3().setFromObject(clonedScene);
        const scaledSize = new THREE.Vector3();
        scaledBox.getSize(scaledSize);

        // Move the model up so its bottom sits at y=0 (relative to parent)
        const yOffset = -scaledBox.min.y;
        clonedScene.position.y = yOffset;

        // Report the actual height back to parent
        if (onHeightCalculated) {
            onHeightCalculated(scaledSize.y);
        }
    }, [clonedScene, onHeightCalculated]);

    return <primitive object={clonedScene} scale={scale} />;
};

const Box = ({ position, stackHeight = 1 , onClick, item }) => {
    const boxRef = useRef();
    const [actualBoxHeight, setActualBoxHeight] = useState(null);

    // Check if GLB model exists (set to true when you add the GLB file)
    const useGLBModel = true; // Changed to true since you have the GLB file

    const fallbackBoxHeight = TILE_SIZE * 0.9; // Fallback height for non-GLB boxes
    const boxHeight = actualBoxHeight || fallbackBoxHeight;

    return (
        <group
            ref={boxRef}
            position={[position.x, (position.y && position.y > 0) ? position.y: 0, position.z]} // Start at floor level (y=0)
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(item);
            }}
        >
            {Array.from({ length: stackHeight }).map((_, index) => (
                <group
                    key={index}
                    position={[0.1, index * boxHeight, 1.2]} // Stack from floor upward (no offset needed)
                >
                    {useGLBModel ? (
                        <Suspense fallback={null}>
                            <BoxModel
                                url="/models/box.glb"
                                scale={1}
                                onHeightCalculated={index === 0 ? setActualBoxHeight : undefined}
                            />
                        </Suspense>
                    ) : (
                        <>
                            <mesh position={[0, fallbackBoxHeight / 2, 0]}>
                                <boxGeometry args={[TILE_SIZE * 0.9, fallbackBoxHeight, TILE_SIZE * 0.9]} />
                                <meshStandardMaterial color="#4a90e2" />
                            </mesh>

                            {/* Box edges for better visibility */}
                            <lineSegments position={[0, fallbackBoxHeight / 2, 0]}>
                                <edgesGeometry args={[new THREE.BoxGeometry(TILE_SIZE * 0.9, fallbackBoxHeight, TILE_SIZE * 0.9)]} />
                                <lineBasicMaterial color="#2c5aa0" linewidth={1} />
                            </lineSegments>
                        </>
                    )}
                </group>
            ))}
        </group>
    );
};

// Preload GLB model if it exists
try {
    useGLTF.preload("/models/box.glb");
} catch (e) {
    // Model doesn't exist yet, skip preload
}

export default Box;
