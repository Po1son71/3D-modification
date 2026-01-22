import React, { useRef } from "react";

const ACUnit = ({ acData }) => {
    const acRef = useRef();

    return (
        <group
            ref={acRef}
            position={[acData.position.x, acData.height / 2, acData.position.z]}
        >
            {/* AC Unit body */}
            <mesh>
                <boxGeometry args={[acData.width, acData.height, acData.depth]} />
                <meshStandardMaterial 
                    color="#757575"
                    metalness={0.2}
                    roughness={0.6}
                />
            </mesh>


            {/* Top surface highlight */}
            <mesh position={[0, acData.height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[acData.width, acData.depth]} />
                <meshStandardMaterial color="#9e9e9e" />
            </mesh>
        </group>
    );
};

export default ACUnit;

