import React, { useEffect, Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import WarehouseFloor from "./WarehouseFloor";
import WarehousePaths from "./WarehousePaths";
import Pallet from "./Pallet";
import Box from "./Box";
import useWarehouseStore from "../../store/warehouseStore";
import AddNewMaterial from "./Forms/AddNewMaterial";
import EditComponentForm from "./Forms/EditComponentForm";
import { mx_bilerp_0 } from "three/src/nodes/materialx/lib/mx_noise.js";
import { Card, CardContent, CardHeader, CardTitle } from "../UI/card";

const WarehouseScene = () => {
    const { inventory, rows, columns, loadInventory, loadPathways, isLoading, updateItem } = useWarehouseStore();
    const [floorClick, setFloorClick] = useState(false);
    const [selectedCell, setSelectedCell] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [floorRow, setFloorRow] = useState();
    const [floorCol, setFloorCol] = useState();
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

    const handleFloorClick = (x, y) => {
        if (x == null || y == null) {
            setFloorClick(false);
            setSelectedItem(null);
            setSelectedCell(null);
            return;
        }

        const hasItem = inventory.some(
            (item) => item.row === x + 1 && item.column === y + 1
        );

        if (hasItem) {
            setFloorClick(false);
            setSelectedCell(null);
            return;
        }

        setSelectedItem(null);
        setFloorClick(true);
        setSelectedCell({ row: x, col: y });
        setFloorRow(x);
        setFloorCol(y);
    };


    const handleComponentClick = (item) => {
        setFloorClick(false);
        setSelectedCell();
        setSelectedItem(item);
    }

    const handleSaveItem = (item) => {
        const matchedItem = inventory.find(
            (items) => items.row === item.row && items.column === item.column && items.id !== item.id
        );
        const totalHeight = (matchedItem?.type === "box" ? 0.3 : 0.15) * matchedItem?.stackHeight
        const updatedItem = {
            ...item,
            position: {
                x: item.position.x,
                y: (totalHeight/2) + totalHeight - ((matchedItem?.stackHeight-1) *0.078) || 0,
                z: item.position.z
            }
        }
        updateItem(item.id, updatedItem);
    }

    return (
        <>
            {floorClick && (
                <AddNewMaterial
                    row={floorRow}
                    col={floorCol}
                    inventory={inventory}
                    cellSize={CELL_SIZE}
                />
            )}


            {/* LEFT PANEL – COMPONENT INFO */}
            {selectedItem && (
                <Card className="fixed top-24 left-0 h-64 bg-accent-foreground text-background shadow-lg p-4 flex flex-col z-50 rounded-lg" style={{width:"20vw"}}>
                    <CardHeader className="mb-2 items-center">
                        <CardTitle style={{margin: '1rem', fontSize: "1.25rem"}}>Component Info</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col text-sm" style={{padding: '1rem', background: 'var(--foreground)'}}>
                        <span style={{marginBottom: '0.825rem', display: "flex", justifyContent: "space-between"}}><span className="font-medium">ID:</span> {selectedItem.id}</span>
                        <span style={{marginBottom: '0.825rem', display: "flex", justifyContent: "space-between"}}><span className="font-medium">Type:</span> {selectedItem.type}</span>
                        <span style={{marginBottom: '0.825rem', display: "flex", justifyContent: "space-between"}}><span className="font-medium">Stack Height:</span> {selectedItem.stackHeight}</span>
                        <span style={{marginBottom: '0.825rem', display: "flex", justifyContent: "space-between"}}><span className="font-medium">Row:</span> {selectedItem.row}</span>
                        <span style={{marginBottom: '0.825rem', display: "flex", justifyContent: "space-between"}}><span className="font-medium">Column:</span> {selectedItem.column}</span>
                    </CardContent>
                </Card>
            )}
            <div style={{ display: "flex", height: "100vh", width: "100vw" }}>

                <div style={{
                    width: selectedItem ? '80vw' : '100vw',
                    height: "100%",
                    cursor: "default",
                    transition: 'width 0.3s ease'
                }}>
                    <Canvas
                        camera={{
                            position: [centerX + 20, 30, centerZ + 20],
                            fov: 50,
                            near: 0.1,
                            far: 1000
                        }}
                        shadows
                        onPointerMissed={handleFloorClick}
                    >
                        {/* Background */}
                        <color attach="background" args={["#f0f0f0"]} />

                        {/* Lights */}
                        <ambientLight intensity={0.7} />
                        <directionalLight position={[20, 30, 20]} intensity={1} castShadow />
                        <directionalLight position={[-10, 20, -10]} intensity={0.3} />

                        <Suspense fallback={<Html>Loading Warehouse Scene...</Html>}>

                            {/* Warehouse Floor */}
                            <WarehouseFloor
                                handleClick={handleFloorClick}
                                selectedCell={selectedCell}
                            />

                            {/* Warehouse Pathways */}
                            <WarehousePaths />

                            {/* Inventory Items */}
                            {inventory.map((item) => {
                                const colIndex = item.column - 1;
                                const rowIndex = item.row - 1;

                                const worldX = colIndex * CELL_SIZE + CELL_SIZE / 2;
                                const worldZ = rowIndex * CELL_SIZE + CELL_SIZE / 2;

                                const position = { x: worldX, y: item?.position?.y || 0, z: worldZ };

                                if (item.type === "pallet") {
                                    return (
                                        <Pallet
                                            key={item.id}
                                            item={item}
                                            position={position}
                                            stackHeight={item.stackHeight || 1}
                                            onClick={handleComponentClick}
                                        />
                                    );
                                }

                                if (item.type === "box") {
                                    return (
                                        <Box
                                            key={item.id}
                                            item={item}
                                            position={position}
                                            stackHeight={item.stackHeight || 1}
                                            onClick={handleComponentClick}
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

                        {/* Camera Controls */}
                        <OrbitControls
                            enablePan
                            enableZoom
                            enableRotate
                            panSpeed={1.2}
                            zoomSpeed={1.2}
                            rotateSpeed={1.0}
                            dampingFactor={0.05}
                            minDistance={5}
                            maxDistance={200}
                        />
                    </Canvas>
                </div>

                {/* {selectedItem && ( */}
                    <div
                        style={{
                            width: selectedItem?"20vw": '0vw',
                            padding: "16px",
                            background: "var(--background)",
                            borderLeft: "1px solid #ddd",
                            overflowY: "auto",
                            transform: selectedItem ? 'translateX(0)' : 'translateX(100%)',
                            transition: 'transform 0.3s ease, width 0.3s ease',
                        }}
                    >
                        <EditComponentForm
                            item={selectedItem}
                            onSave={handleSaveItem}
                        />
                    </div>
                {/* )} */}
            </div>
        </>
    );
};

export default WarehouseScene;

