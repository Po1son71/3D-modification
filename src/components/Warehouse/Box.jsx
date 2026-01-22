import React, { useRef, Suspense } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Component to load GLB model
const BoxModel = ({ url }) => {
    const gltf = useGLTF(url);
    return <primitive object={gltf.scene.clone()} />;
};

const Box = ({ position, stackHeight = 1 }) => {
    const boxRef = useRef();
    
    // Check if GLB model exists (set to true when you add the GLB file)
    const useGLBModel = true; // Changed to true since you have the GLB file
    
    const boxHeight = 0.3; // Height of one box
    const totalHeight = boxHeight * stackHeight;

    return (
        <group
            ref={boxRef}
            position={[position.x, totalHeight / 2, position.z]}
        >
            {Array.from({ length: stackHeight }).map((_, index) => (
                <group
                    key={index}
                    position={[0, index * boxHeight - totalHeight / 2 + boxHeight / 2, 0]}
                >
                    {useGLBModel ? (
                        <Suspense fallback={null}>
                            <BoxModel url="/models/box.glb" />
                        </Suspense>
                    ) : (
                        <>
                            <mesh>
                                <boxGeometry args={[0.8, boxHeight, 0.8]} />
                                <meshStandardMaterial color="#4a90e2" />
                            </mesh>
                            
                            {/* Box edges for better visibility */}
                            <lineSegments>
                                <edgesGeometry args={[new THREE.BoxGeometry(0.8, boxHeight, 0.8)]} />
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
