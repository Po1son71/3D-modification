import React from "react";

const Equipment = ({ equipment, rackHeight, units, onClick }) => {
    const y = ((equipment.ruStart - 1) + equipment.ruHeight / 2) * (rackHeight / units);
    const height = equipment.ruHeight * (rackHeight / units);

    return (
        <mesh
            position={[0, y, 0.26]}
            onClick={(e) => {
                e.stopPropagation();
                onClick && onClick(equipment);
            }}
            onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'default';
            }}
        >
            <boxGeometry args={[0.9, height, 0.45]} />
            <meshStandardMaterial
                color={equipment.color}
                emissive={equipment.color}
                emissiveIntensity={0.2}
            />
        </mesh>
    );
};

export default Equipment;
