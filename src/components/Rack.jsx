import React, { useRef, useState } from "react";
import { DragControls } from "@react-three/drei";
import Equipment from "./Equipment";
import useDCIMStore from "../store/dcimStore";
import { snapToGrid } from "../utils/gridUtils";

const Rack = ({ rackData }) => {
    const rackRef = useRef();
    const [isDraggingLocal, setIsDraggingLocal] = useState(false);

    const { selectedRackId, selectRack, selectEquipment, updateRackPosition, floor, setIsDragging } = useDCIMStore();
    const isSelected = selectedRackId === rackData.id;

    const handleDragStart = () => {
        setIsDraggingLocal(true);
        setIsDragging(true);
    };

    const handleDrag = () => {
        if (rackRef.current) {
            // Lock movement to X-Z plane (User's "X-Y", preventing "Z"/Height movement)
            rackRef.current.position.y = 0;
        }
    };

    const handleDragEnd = () => {
        setIsDraggingLocal(false);
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
        if (!isDraggingLocal) {
            selectRack(rackData.id);
        }
    };

    const handleEquipmentClick = (equipment) => {
        selectRack(rackData.id);
        selectEquipment(equipment.id);
    };

    // Render rack sections if they exist, otherwise render equipment
    const renderSections = () => {
        if (rackData.sections && rackData.sections.length > 0) {
            return rackData.sections.map((section) => {
                // Calculate section position and dimensions
                const sectionHeight = (section.ruHeight / rackData.units) * rackData.height;
                const baseY = ((section.ruStart - 1) / rackData.units) * rackData.height;
                const sectionY = baseY + sectionHeight / 2;
                
                // Default to front face
                const zPosition = rackData.depth / 2 - 0.01;
                const labelSide = -1;

                return (
                    <group key={section.id}>
                        {/* Section face */}
                        <mesh 
                            position={[0, sectionY, zPosition]}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClick(e);
                            }}
                        >
                            <planeGeometry args={[rackData.width, sectionHeight]} />
                            <meshStandardMaterial 
                                color={section.color} 
                                side={2}
                                metalness={0.15}
                                roughness={0.25}
                            />
                        </mesh>

                        {/* Section 3D body for better visibility */}
                        <mesh position={[0, sectionY, rackData.depth / 2 - 0.02]}>
                            <boxGeometry args={[rackData.width - 0.05, sectionHeight, 1.04]} />
                            <meshStandardMaterial 
                                color={section.color}
                                metalness={0.2}
                                roughness={0.3}
                            />
                        </mesh>

                        {/* Section border highlights */}
                        <mesh position={[0, sectionY - sectionHeight / 2, zPosition + 0.01]}>
                            <boxGeometry args={[rackData.width, 0.01, 0.01]} />
                            <meshBasicMaterial color="#000000" opacity={0.3} transparent />
                        </mesh>
                        <mesh position={[0, sectionY + sectionHeight / 2, zPosition + 0.01]}>
                            <boxGeometry args={[rackData.width, 0.01, 0.01]} />
                            <meshBasicMaterial color="#ffffff" opacity={0.5} transparent />
                        </mesh>

                        {/* Section top edge highlight */}
                        <mesh position={[0, sectionY + sectionHeight / 2, zPosition]}>
                            <boxGeometry args={[rackData.width, 0.02, 0.01]} />
                            <meshStandardMaterial color="#ffffff" opacity={0.5} transparent />
                        </mesh>

                    </group>
                );
            });
        }
        return null;
    };

    return (
        <DragControls onDragStart={handleDragStart} onDrag={handleDrag} onDragEnd={handleDragEnd}>
            <group
                ref={rackRef}
                position={[rackData.position.x, 0, rackData.position.z]}
                onClick={handleClick}
            >
                {/* Rack frame - subtle wireframe */}
                <mesh position={[0, rackData.height / 2, 0]}>
                    <boxGeometry args={[rackData.width, rackData.height, rackData.depth]} />
                    <meshStandardMaterial
                        color={isSelected ? "#ffeb3b" : "#424242"}
                        transparent
                        opacity={0.15}
                        wireframe
                    />
                </mesh>

                {/* Rack back panel */}
                <mesh position={[0, rackData.height / 2, -rackData.depth / 2 + 0.01]}>
                    <planeGeometry args={[rackData.width, rackData.height]} />
                    <meshStandardMaterial color="#212121" side={2} />
                </mesh>

                {/* Rack sides */}
                <mesh position={[-rackData.width / 2, rackData.height / 2, 0]}>
                    <boxGeometry args={[0.02, rackData.height, rackData.depth]} />
                    <meshStandardMaterial color="#424242" />
                </mesh>
                <mesh position={[rackData.width / 2, rackData.height / 2, 0]}>
                    <boxGeometry args={[0.02, rackData.height, rackData.depth]} />
                    <meshStandardMaterial color="#424242" />
                </mesh>

                {/* Render sections if available */}
                {renderSections()}

                {/* Equipment (for backward compatibility) */}
                {rackData.equipment && rackData.equipment.map((eq) => (
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
