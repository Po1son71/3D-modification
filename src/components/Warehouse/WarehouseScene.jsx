import React, { useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import WarehouseFloor from "./WarehouseFloor";
import WarehousePaths from "./WarehousePaths";
import Pallet from "./Pallet";
import Box from "./Box";
import useWarehouseStore from "../../store/warehouseStore";

const WarehouseScene = () => {
    const { inventory, rows, columns, loadInventory, loadPathways, isLoading } = useWarehouseStore();
    const CELL_SIZE = 2.0;

    useEffect(() => {
        // Load inventory data
        fetch('/data/warehouseInventory.json')
            .then(res => res.json())
            .then(data => {
                loadInventory(data.inventory || []);
                loadPathways(data.pathways || []);
            })
            .catch(err => {
                console.error('Failed to load warehouse inventory:', err);
                loadInventory([]);
                loadPathways([]);
            });
    }, [loadInventory, loadPathways]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                Loading Warehouse...
            </div>
        );
    }

    const centerX = (columns * CELL_SIZE) / 2;
    const centerZ = (rows * CELL_SIZE) / 2;

    return (
        <Canvas
            camera={{
                position: [centerX + 20, 30, centerZ + 20],
                fov: 50,
                near: 0.1,
                far: 1000,
                up: [0, 1, 0]
            }}
            shadows
        >
            {/* Background */}
            <color attach="background" args={['#f0f0f0']} />

            {/* Lights */}
            <ambientLight intensity={0.7} />
            <directionalLight position={[20, 30, 20]} intensity={1.0} castShadow />
            <directionalLight position={[-10, 20, -10]} intensity={0.3} />

            <Suspense fallback={<Html>Loading Warehouse Scene...</Html>}>
                {/* Warehouse Floor */}
                <WarehouseFloor />

                {/* Warehouse Pathways */}
                <WarehousePaths />

                {/* Render inventory items */}
                {inventory.map((item) => {
                    // Convert 1-based row/column to 0-based for positioning
                    // Row 1, Column 1 = position (0, 0) in 0-based system
                    const colIndex = (item.column - 1);
                    const rowIndex = (item.row - 1);
                    // Snap to exact grid position - center of cell
                    const worldX = colIndex * CELL_SIZE + CELL_SIZE / 2;
                    const worldZ = rowIndex * CELL_SIZE + CELL_SIZE / 2;
                    const position = { x: worldX, z: worldZ };

                    if (item.type === 'pallet') {
                        return (
                            <Pallet
                                key={item.id}
                                position={position}
                                stackHeight={item.stackHeight || 1}
                            />
                        );
                    } else if (item.type === 'box') {
                        return (
                            <Box
                                key={item.id}
                                position={position}
                                stackHeight={item.stackHeight || 1}
                            />
                        );
                    }
                    else if (item.type === 'sack') {
                        return (
                            <Sack
                                key={item.id}
                                position={position}
                                stackHeight={item.stackHeight || 1}
                            />
                        );
                    }
                    return null;
                })}
            </Suspense>

            {/* Camera Controls - Free flow */}
            <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                panSpeed={1.2}
                zoomSpeed={1.2}
                rotateSpeed={1.0}
                dampingFactor={0.05}
                minDistance={5}
                maxDistance={200}
            />
        </Canvas>
    );
};

export default WarehouseScene;

