import React, { useRef } from "react";

const Generator = ({ generatorData }) => {
    const generatorRef = useRef();

    return (
        <group
            ref={generatorRef}
            position={[generatorData.position.x, generatorData.height / 2, generatorData.position.z]}
        >
            {/* Generator body */}
            <mesh>
                <boxGeometry args={[generatorData.width, generatorData.height, generatorData.depth]} />
                <meshStandardMaterial 
                    color="#ff9800"
                    metalness={0.3}
                    roughness={0.5}
                />
            </mesh>


            {/* Top surface highlight */}
            <mesh position={[0, generatorData.height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[generatorData.width, generatorData.depth]} />
                <meshStandardMaterial color="#fb8c00" />
            </mesh>

            {/* Ventilation grille (front) */}
            <mesh position={[0, generatorData.height * 0.4, generatorData.depth / 2 + 0.01]}>
                <boxGeometry args={[generatorData.width * 0.8, generatorData.height * 0.4, 0.02]} />
                <meshStandardMaterial color="#333333" metalness={0.5} />
            </mesh>
        </group>
    );
};

export default Generator;

