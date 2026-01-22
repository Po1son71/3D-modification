import React, { useState } from "react";
import { Html } from "@react-three/drei";

const RU = ({ index, rackHeight, units }) => {
    // Mock heatmap data
    const [color] = useState(() => {
        const value = Math.random(); // 0 to 1
        if (value > 0.7) return "red";
        if (value > 0.4) return "orange";
        return "green";
    });

    // Height offset per RU
    const y = (index - 0.5) * (rackHeight / units);

    return (
        <mesh position={[0, y, 0.26]} >
            <boxGeometry args={[1, rackHeight / units, 1]} />
            <meshStandardMaterial color={color} />

            {/* Floating Label */}
            <Html distanceFactor={10} style={{ color: "white", fontSize: "12px" }}>
                RU {index}
            </Html>
        </mesh>
    );
};

export default RU;
