import React, { useRef, Suspense } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Component to load GLB model
const PalletModel = ({ url }) => {
    const gltf = useGLTF(url);
    return <primitive object={gltf.scene.clone()} />;
};

const Pallet = ({ position, stackHeight = 1 }) => {
    const palletRef = useRef();
    
    // Check if GLB model exists (set to true when you add the GLB file)
    const useGLBModel = true; // Changed to true since you have the GLB file
    
    const height = 0.15; // Height of one pallet
    const totalHeight = height * stackHeight;

    return (
        <group
            ref={palletRef}
            position={[position.x, totalHeight / 2, position.z]}
        >
            {useGLBModel ? (
                <Suspense fallback={null}>
                    {/* Load multiple GLB instances for stacking */}
                    {Array.from({ length: stackHeight }).map((_, index) => (
                        <group
                            key={index}
                            position={[0, index * height - totalHeight / 2 + height / 2, 0]}
                        >
                            <PalletModel url="/models/pallet.glb" />
                        </group>
                    ))}
                </Suspense>
            ) : (
                <>
                    {/* Pallet base */}
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[1.8, height * stackHeight, 1.2]} />
                        <meshStandardMaterial color="#8B4513" />
                    </mesh>
                    
                    {/* Pallet slats (top) */}
                    <mesh position={[0, (height * stackHeight) / 2 - 0.01, 0]}>
                        <boxGeometry args={[1.8, 0.05, 1.2]} />
                        <meshStandardMaterial color="#A0522D" />
                    </mesh>
                    
                    {/* Pallet supports */}
                    <mesh position={[-0.6, 0, 0]}>
                        <boxGeometry args={[0.1, height * stackHeight, 0.1]} />
                        <meshStandardMaterial color="#654321" />
                    </mesh>
                    <mesh position={[0.6, 0, 0]}>
                        <boxGeometry args={[0.1, height * stackHeight, 0.1]} />
                        <meshStandardMaterial color="#654321" />
                    </mesh>
                </>
            )}
        </group>
    );
};

// Preload GLB model if it exists
try {
    useGLTF.preload("/models/pallet.glb");
} catch (e) {
    // Model doesn't exist yet, skip preload
}

export default Pallet;
