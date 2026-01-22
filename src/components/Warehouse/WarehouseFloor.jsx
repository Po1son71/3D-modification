import React, { useMemo } from "react";
import { Grid } from "@react-three/drei";
import useWarehouseStore from "../../store/warehouseStore";

const CELL_SIZE = 2.0; // 2 meters per cell
const FLOOR_HEIGHT = 0.1;

const WarehouseFloor = () => {
    const { rows, columns } = useWarehouseStore();

    const floorWidth = columns * CELL_SIZE;
    const floorDepth = rows * CELL_SIZE;

    const tiles = useMemo(() => {
        const arr = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
                arr.push([r, c]);
            }
        }
        return arr;
    }, [rows, columns]);

    return (
        <group>
            {/* Individual floor tiles - centered in their cells */}
            {tiles.map(([row, col]) => {
                // Center each tile in its cell
                const x = col * CELL_SIZE + CELL_SIZE / 2;
                const z = row * CELL_SIZE + CELL_SIZE / 2;
                const isEven = (row + col) % 2 === 0;
                
                return (
                    <mesh
                        key={`${row}-${col}`}
                        position={[x, 0, z]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        receiveShadow
                    >
                        <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
                        <meshStandardMaterial color={isEven ? "#f5f5f5" : "#ffffff"} />
                    </mesh>
                );
            })}

            {/* Grid lines - aligned with tile grid */}
            <Grid
                args={[floorWidth, floorDepth]}
                cellSize={CELL_SIZE}
                sectionSize={CELL_SIZE * 5}
                fadeDistance={50}
                cellColor="#cccccc"
                sectionColor="#999999"
                infiniteGrid={false}
                position={[floorWidth / 2, 0.01, floorDepth / 2]}
            />

            {/* Row and column labels (optional visual aid) - 1-based indexing */}
            {Array.from({ length: rows }).map((_, rowIndex) => {
                const rowNumber = rowIndex + 1; // Display as 1-based
                return (
                    <mesh key={`row-${rowIndex}`} position={[-0.5, 0.02, rowIndex * CELL_SIZE + CELL_SIZE / 2]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[0.3, 0.3]} />
                        <meshBasicMaterial color="#999999" transparent opacity={0.3} />
                    </mesh>
                );
            })}
            
            {Array.from({ length: columns }).map((_, colIndex) => {
                const colNumber = colIndex + 1; // Display as 1-based
                return (
                    <mesh key={`col-${colIndex}`} position={[colIndex * CELL_SIZE + CELL_SIZE / 2, 0.02, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[0.3, 0.3]} />
                        <meshBasicMaterial color="#999999" transparent opacity={0.3} />
                    </mesh>
                );
            })}
        </group>
    );
};

export default WarehouseFloor;

