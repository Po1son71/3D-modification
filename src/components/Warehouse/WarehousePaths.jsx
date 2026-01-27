import React from "react";
import useWarehouseStore from "../../store/warehouseStore";

const CELL_SIZE = 2.0; // Must match WarehouseFloor.jsx

/**
 * WarehousePaths - Renders pathways connecting different areas of the warehouse floor
 * Pathways can be horizontal, vertical, or both to create corridors and aisles
 */
const WarehousePaths = () => {
    const { pathways } = useWarehouseStore();

    if (!pathways || pathways.length === 0) {
        return null;
    }

    return (
        <group>
            {pathways.map((pathway, index) => {
                const {
                    id,
                    startRow,
                    startCol,
                    endRow,
                    endCol,
                    width = 1, // Width in cells
                    color = "#FFD700", // Default: gold/yellow for pathways
                    opacity = 0.6,
                    type = "floor" // 'floor', 'elevated', 'bridge'
                } = pathway;

                // Calculate pathway dimensions
                const isHorizontal = startRow === endRow;
                const isVertical = startCol === endCol;

                if (!isHorizontal && !isVertical) {
                    // For diagonal or complex paths, we'll create a stepped path
                    return renderComplexPath(pathway, index);
                }

                // Calculate position and size for straight paths
                const minRow = Math.min(startRow, endRow);
                const maxRow = Math.max(startRow, endRow);
                const minCol = Math.min(startCol, endCol);
                const maxCol = Math.max(startCol, endCol);

                const pathLength = isHorizontal
                    ? (maxCol - minCol + 1) * CELL_SIZE
                    : (maxRow - minRow + 1) * CELL_SIZE;

                const pathWidth = width * CELL_SIZE;

                // Center position
                const centerX = (minCol + maxCol) * CELL_SIZE / 2 + CELL_SIZE / 2;
                const centerZ = (minRow + maxRow) * CELL_SIZE / 2 + CELL_SIZE / 2;

                // Height based on type
                const pathHeight = type === "elevated" ? 0.2 : 0.05;
                const yPosition = type === "elevated" ? 0.5 : 0.02;

                return (
                    <mesh
                        key={id || `path-${index}`}
                        position={[centerX, yPosition, centerZ]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        receiveShadow
                    >
                        <planeGeometry
                            args={[
                                isHorizontal ? pathLength : pathWidth,
                                isHorizontal ? pathWidth : pathLength
                            ]}
                        />
                        <meshStandardMaterial
                            color={color}
                            transparent
                            opacity={opacity}
                            emissive={color}
                            emissiveIntensity={0.2}
                        />
                    </mesh>
                );
            })}
        </group>
    );
};

/**
 * Renders complex (non-straight) pathways as connected segments
 */
const renderComplexPath = (pathway, baseIndex) => {
    const { startRow, startCol, endRow, endCol, width = 1, color = "#FFD700", opacity = 0.6 } = pathway;

    const segments = [];
    const pathWidth = width * CELL_SIZE;

    // Create an L-shaped path (horizontal then vertical)
    // Segment 1: Horizontal from start to end column
    const horizLength = Math.abs(endCol - startCol + 1) * CELL_SIZE;
    const horizCenterX = (startCol + endCol) * CELL_SIZE / 2 + CELL_SIZE / 2;
    const horizCenterZ = startRow * CELL_SIZE + CELL_SIZE / 2;

    segments.push(
        <mesh
            key={`${baseIndex}-horiz`}
            position={[horizCenterX, 0.02, horizCenterZ]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
        >
            <planeGeometry args={[horizLength, pathWidth]} />
            <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.2}
            />
        </mesh>
    );

    // Segment 2: Vertical from start row to end row
    const vertLength = Math.abs(endRow - startRow + 1) * CELL_SIZE;
    const vertCenterX = endCol * CELL_SIZE + CELL_SIZE / 2;
    const vertCenterZ = (startRow + endRow) * CELL_SIZE / 2 + CELL_SIZE / 2;

    segments.push(
        <mesh
            key={`${baseIndex}-vert`}
            position={[vertCenterX, 0.02, vertCenterZ]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
        >
            <planeGeometry args={[pathWidth, vertLength]} />
            <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={0.2}
            />
        </mesh>
    );

    return <group key={`complex-path-${baseIndex}`}>{segments}</group>;
};

export default WarehousePaths;
