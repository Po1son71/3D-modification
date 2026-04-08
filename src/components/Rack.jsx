import React, { useRef, useState } from "react";
import { DragControls } from "@react-three/drei";
import Equipment from "./Equipment";
import useDCIMStore from "../store/dcimStore";
import { snapToGrid } from "../utils/gridUtils";

const Rack = ({ rackData }) => {
    const rackRef = useRef();
    const [isDragging, setIsDragging] = useState(false);

    const { selectedRackId, selectRack, selectEquipment, updateRackPosition, floor } = useDCIMStore();
    const isSelected = selectedRackId === rackData.id;

    const handleDragEnd = () => {
        setIsDragging(false);
        if (rackRef.current && floor) {
            const pos = rackRef.current.position;

            // Strict snap to grid
            let snappedX = snapToGrid(pos.x);
            let snappedZ = snapToGrid(pos.z);

            // Clamp to floor bounds
            const maxX = (floor.gridSize.width - 1) * 0.6; // 0-indexed tiles
            const maxZ = (floor.gridSize.depth - 1) * 0.6;

            snappedX = Math.max(0, Math.min(snappedX, maxX));
            snappedZ = Math.max(0, Math.min(snappedZ, maxZ));

            // Apply snapped position visually immediately
            rackRef.current.position.x = snappedX;
            rackRef.current.position.y = 0; // Ensure it stays on floor
            rackRef.current.position.z = snappedZ;

            // Update position in store
            updateRackPosition(rackData.id, { x: snappedX, z: snappedZ });
        }
    };

    const handleClick = (e) => {
        e.stopPropagation();
        if (!isDragging) {
            selectRack(rackData.id);
        }
    };

    const handleEquipmentClick = (equipment) => {
        selectRack(rackData.id);
        selectEquipment(equipment.id);
    };

    return (
        <DragControls onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}>
            <group
                ref={rackRef}
                position={[rackData.position.x, 0, rackData.position.z]}
                onClick={handleClick}
            >
                {/* Rack frame */}
                <mesh position={[0, rackData.height / 2, 0]}>
                    <boxGeometry args={[rackData.width, rackData.height, rackData.depth]} />
                    <meshStandardMaterial
                        color={isSelected ? "#ffeb3b" : "#424242"}
                        transparent
                        opacity={0.3}
                        wireframe
                    />
                </mesh>

                {/* Rack back panel */}
                <mesh position={[0, rackData.height / 2, -rackData.depth / 2 + 0.01]}>
                    <planeGeometry args={[rackData.width, rackData.height]} />
                    <meshStandardMaterial color="#212121" side={2} />
                </mesh>

                {/* Equipment */}
                {rackData.equipment.map((eq) => (
                    <Equipment
                        key={eq.id}
                        equipment={eq}
                        rackHeight={rackData.height}
                        units={rackData.units}
                        onClick={handleEquipmentClick}
                    />
                ))}

                {/* Selection highlight */}
                {isSelected && (
                    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[rackData.width + 0.2, rackData.depth + 0.2]} />
                        <meshBasicMaterial color="#ffeb3b" transparent opacity={0.3} />
                    </mesh>
                )}
            </group>
        </DragControls>
    );
};

export default Rack;
