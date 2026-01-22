import React, { useMemo } from "react";
import { TILE_SIZE } from "../utils/gridUtils";
import { Grid } from "@react-three/drei";
import { DoubleSide } from "three";
import useDCIMStore from "../store/dcimStore";

const Floor = ({ width = 50, depth = 30 }) => {
    const { selectedTile, selectTile, isTileOccupied, placementMode } = useDCIMStore();

    // Define component sizes in tiles (width x depth)
    const componentTileSizes = {
        'rack': { width: 2, depth: 2 },
        'ac': { width: 2, depth: 4 },
        'generator': { width: 4, depth: 4 }
    };

    const tiles = useMemo(() => {
        const arr = [];
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < depth; z++) {
                arr.push([x, z]);
            }
        }
        return arr;
    }, [width, depth]);

    const handleTileClick = (e, gridX, gridZ) => {
        e.stopPropagation();

        // Check if tile is occupied
        if (isTileOccupied(gridX, gridZ)) {
            return; // Can't select occupied tiles
        }

        // If in placement mode, check if all required tiles are available
        if (placementMode) {
            const size = componentTileSizes[placementMode];
            if (size) {
                // Check all tiles that would be occupied
                for (let x = 0; x < size.width; x++) {
                    for (let z = 0; z < size.depth; z++) {
                        if (isTileOccupied(gridX + x, gridZ + z)) {
                            return; // Can't place here, some tiles are occupied
                        }
                    }
                }
            }
        }

        selectTile(gridX, gridZ);
    };

    return (
        <group>
            {/* Floor tiles */}
            {tiles.map(([gridX, gridZ]) => {
                const worldX = gridX * TILE_SIZE;
                const worldZ = gridZ * TILE_SIZE;
                const isSelected = selectedTile?.gridX === gridX && selectedTile?.gridZ === gridZ;
                const isOccupied = isTileOccupied(gridX, gridZ);

                // Check if this tile is part of a multi-tile component preview
                let isPreviewTile = false;
                if (selectedTile && placementMode && !isOccupied) {
                    const size = componentTileSizes[placementMode];
                    if (size) {
                        const deltaX = gridX - selectedTile.gridX;
                        const deltaZ = gridZ - selectedTile.gridZ;
                        isPreviewTile = deltaX >= 0 && deltaX < size.width &&
                            deltaZ >= 0 && deltaZ < size.depth;
                    }
                }

                // Determine tile color based on state
                let tileColor = "#ffffff";
                if (isSelected) {
                    tileColor = placementMode ? "#4caf50" : "#2196f3"; // Green if in placement mode, blue if just selected
                } else if (isPreviewTile) {
                    tileColor = "#a5d6a7"; // Light green for preview tiles
                } else if (isOccupied) {
                    tileColor = "#e0e0e0"; // Gray for occupied
                }

                return (
                    <mesh
                        key={`${gridX}-${gridZ}`}
                        position={[worldX, 0, worldZ]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        receiveShadow
                        onClick={(e) => handleTileClick(e, gridX, gridZ)}
                        onPointerOver={(e) => {
                            if (!isOccupied && placementMode) {
                                e.stopPropagation();
                                document.body.style.cursor = 'pointer';
                            }
                        }}
                        onPointerOut={(e) => {
                            e.stopPropagation();
                            document.body.style.cursor = 'default';
                        }}
                    >
                        <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
                        <meshStandardMaterial
                            color={tileColor}
                            transparent={isSelected || isOccupied || isPreviewTile}
                            opacity={isSelected ? 0.7 : isOccupied ? 0.5 : isPreviewTile ? 0.6 : 1}
                        />

                        {/* Selection highlight border */}
                        {(isSelected || isPreviewTile) && (
                            <>
                                <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                                    <ringGeometry args={[TILE_SIZE * 0.95, TILE_SIZE * 0.98, 64]} />
                                    <meshBasicMaterial
                                        color={isSelected ? (placementMode ? "#4caf50" : "#2196f3") : "#a5d6a7"}
                                        side={2}
                                        transparent
                                        opacity={isSelected ? 0.8 : 0.5}
                                    />
                                </mesh>
                                {/* Additional border lines for better visibility */}
                                {isSelected && (
                                    <>
                                        <mesh position={[-TILE_SIZE / 2, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                                            <boxGeometry args={[0.1, TILE_SIZE, 0.01]} />
                                            <meshBasicMaterial color={placementMode ? "#4caf50" : "#2196f3"} />
                                        </mesh>
                                        <mesh position={[TILE_SIZE / 2, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                                            <boxGeometry args={[0.1, TILE_SIZE, 0.01]} />
                                            <meshBasicMaterial color={placementMode ? "#4caf50" : "#2196f3"} />
                                        </mesh>
                                        <mesh position={[0, 0.02, -TILE_SIZE / 2]} rotation={[-Math.PI / 2, 0, 0]}>
                                            <boxGeometry args={[TILE_SIZE, 0.1, 0.01]} />
                                            <meshBasicMaterial color={placementMode ? "#4caf50" : "#2196f3"} />
                                        </mesh>
                                        <mesh position={[0, 0.02, TILE_SIZE / 2]} rotation={[-Math.PI / 2, 0, 0]}>
                                            <boxGeometry args={[TILE_SIZE, 0.1, 0.01]} />
                                            <meshBasicMaterial color={placementMode ? "#4caf50" : "#2196f3"} />
                                        </mesh>
                                    </>
                                )}
                            </>
                        )}
                    </mesh>
                );
            })}

            {/* Grid lines */}
            {/* Grid lines - Main 2m Grid */}
            <Grid
                args={[width * TILE_SIZE, depth * TILE_SIZE]}
                cellSize={TILE_SIZE}
                sectionSize={TILE_SIZE * 5}
                fadeDistance={50}
                cellColor="#cccccc"
                sectionColor="#999999"
                infiniteGrid={false}
                position={[width * TILE_SIZE / 2 - TILE_SIZE / 2, 0.002, depth * TILE_SIZE / 2 - TILE_SIZE / 2]}
            />

            {/* Grid lines - Sub-grid (2x2 tiles per main tile) */}
            <Grid
                args={[width * TILE_SIZE, depth * TILE_SIZE]}
                cellSize={TILE_SIZE / 2}
                sectionSize={TILE_SIZE}
                fadeDistance={50}
                cellColor="#001f57"
                sectionColor="#cccccc"
                infiniteGrid={false}
                position={[width * TILE_SIZE / 2 - TILE_SIZE / 2, 0.001, depth * TILE_SIZE / 2 - TILE_SIZE / 2]}
            />
            {/* Transparent Walls */}
            {/* Left Wall */}
            <mesh
                position={[-TILE_SIZE / 2 - 0.05, 3, (depth * TILE_SIZE / 2) - TILE_SIZE / 2]}
            >
                <boxGeometry args={[0.1, 6, depth * TILE_SIZE]} />
                <meshBasicMaterial color="#cccccc" transparent opacity={0.2} side={DoubleSide} />
            </mesh>

            {/* Right Wall */}
            <mesh
                position={[width * TILE_SIZE - TILE_SIZE / 2 + 0.05, 3, (depth * TILE_SIZE / 2) - TILE_SIZE / 2]}
            >
                <boxGeometry args={[0.1, 6, depth * TILE_SIZE]} />
                <meshBasicMaterial color="#cccccc" transparent opacity={0.2} side={DoubleSide} />
            </mesh>

            {/* Top (Back) Wall */}
            <mesh
                position={[(width * TILE_SIZE / 2) - TILE_SIZE / 2, 3, -TILE_SIZE / 2 - 0.05]}
            >
                <boxGeometry args={[width * TILE_SIZE, 6, 0.1]} />
                <meshBasicMaterial color="#cccccc" transparent opacity={0.2} side={DoubleSide} />
            </mesh>
        </group>
    );
};

export default Floor;
