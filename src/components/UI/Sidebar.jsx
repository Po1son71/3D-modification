import React from "react";
import useDCIMStore from "../../store/dcimStore";
import { gridToWorld, TILE_SIZE } from "../../utils/gridUtils";

const Sidebar = () => {
    const { 
        floor, 
        racks, 
        acUnits, 
        generators,
        selectedRackId, 
        selectedTile,
        placementMode,
        setPlacementMode,
        selectRack,
        addRack,
        addACUnit,
        addGenerator,
        isTileOccupied
    } = useDCIMStore();

    const handlePlaceComponent = () => {
        if (!selectedTile || !placementMode) return;

        const { gridX, gridZ } = selectedTile;
        
        // Define component sizes in tiles (width x depth)
        const componentTileSizes = {
            'rack': { width: 2, depth: 2 },      // 2x2 tiles
            'ac': { width: 2, depth: 4 },        // 2x4 tiles
            'generator': { width: 4, depth: 4 }  // 4x4 tiles
        };

        const size = componentTileSizes[placementMode];
        if (!size) return;

        // Calculate all tiles this component will occupy
        const tiles = [];
        for (let x = 0; x < size.width; x++) {
            for (let z = 0; z < size.depth; z++) {
                tiles.push({ gridX: gridX + x, gridZ: gridZ + z });
            }
        }

        // Check if all tiles are available
        const allTilesAvailable = tiles.every(tile => !isTileOccupied(tile.gridX, tile.gridZ));
        if (!allTilesAvailable) {
            alert(`Cannot place component: Some tiles are already occupied`);
            return;
        }

        // Calculate center position for the component
        const centerX = gridX + (size.width - 1) / 2;
        const centerZ = gridZ + (size.depth - 1) / 2;
        const position = gridToWorld(centerX, centerZ);

        switch (placementMode) {
            case 'rack':
                const newRack = {
                    id: `rack-${Date.now()}`,
                    name: `Rack ${racks.length + 1}`,
                    position: { x: position.x, z: position.z },
                    units: 42,
                    width: size.width * TILE_SIZE * 0.9,  // Slightly smaller than tile size
                    height: 2,
                    depth: size.depth * TILE_SIZE * 0.9,
                    sections: [],
                    equipment: []
                };
                addRack(newRack, tiles);
                break;

            case 'ac':
                const newAC = {
                    id: `ac-${Date.now()}`,
                    name: `AC-${acUnits.length + 1}`,
                    position: { x: position.x, z: position.z },
                    width: size.width * TILE_SIZE * 0.9,
                    height: 1.2,
                    depth: size.depth * TILE_SIZE * 0.9
                };
                addACUnit(newAC, tiles);
                break;

            case 'generator':
                const newGenerator = {
                    id: `gen-${Date.now()}`,
                    name: `Generator ${generators.length + 1}`,
                    position: { x: position.x, z: position.z },
                    width: size.width * TILE_SIZE * 0.9,
                    height: 1.5,
                    depth: size.depth * TILE_SIZE * 0.9
                };
                addGenerator(newGenerator, tiles);
                break;

            default:
                break;
        }
    };

    const componentTypes = [
        { id: 'rack', label: 'Server Rack', icon: '📦', color: '#2196f3' },
        { id: 'ac', label: 'AC Unit', icon: '❄️', color: '#757575' },
        { id: 'generator', label: 'Generator', icon: '⚡', color: '#ff9800' }
    ];

    return (
        <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '280px',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e0e0e0',
            overflowY: 'auto',
            zIndex: 10,
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: '#1976d2',
                color: '#ffffff'
            }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                    {floor?.name || 'Data Center Floor'}
                </h2>
            </div>

            {/* Component Palette */}
            <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#424242' }}>
                    Add Component
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {componentTypes.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setPlacementMode(placementMode === type.id ? null : type.id)}
                            style={{
                                padding: '12px',
                                border: placementMode === type.id ? '2px solid ' + type.color : '1px solid #e0e0e0',
                                borderRadius: '4px',
                                backgroundColor: placementMode === type.id ? type.color + '15' : '#f5f5f5',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span style={{ fontSize: '24px' }}>{type.icon}</span>
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>{type.label}</span>
                        </button>
                    ))}
                </div>

                {/* Place Component Button */}
                {selectedTile && placementMode && (() => {
                    const componentTileSizes = {
                        'rack': { width: 2, depth: 2 },
                        'ac': { width: 2, depth: 4 },
                        'generator': { width: 4, depth: 4 }
                    };
                    const size = componentTileSizes[placementMode] || { width: 1, depth: 1 };
                    return (
                        <button
                            onClick={handlePlaceComponent}
                            style={{
                                marginTop: '12px',
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#4caf50',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
                        >
                            Place {componentTypes.find(t => t.id === placementMode)?.label} ({size.width}×{size.depth} tiles)
                            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.9 }}>
                                at ({selectedTile.gridX}, {selectedTile.gridZ})
                            </div>
                        </button>
                    );
                })()}

                {selectedTile && !placementMode && (
                    <div style={{
                        marginTop: '12px',
                        padding: '8px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#666'
                    }}>
                        Selected tile: ({selectedTile.gridX}, {selectedTile.gridZ})
                        <div style={{ marginTop: '4px', fontSize: '11px', color: '#999' }}>
                            Choose a component to place
                        </div>
                    </div>
                )}
            </div>

            {/* Floor Info */}
            <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    Floor Dimensions
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    {floor?.gridSize.width}×{floor?.gridSize.depth} tiles
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    ({floor?.gridSize.width * 2}m × {floor?.gridSize.depth * 2}m)
                </div>
            </div>

            {/* Racks List */}
            <div style={{ padding: '16px' }}>
                <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: '#424242'
                }}>
                    Racks ({racks.length})
                </div>

                {racks.map((rack) => (
                    <div
                        key={rack.id}
                        onClick={() => selectRack(rack.id)}
                        style={{
                            padding: '12px',
                            marginBottom: '8px',
                            backgroundColor: selectedRackId === rack.id ? '#e3f2fd' : '#f5f5f5',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: selectedRackId === rack.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (selectedRackId !== rack.id) {
                                e.currentTarget.style.backgroundColor = '#eeeeee';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (selectedRackId !== rack.id) {
                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                            }
                        }}
                    >
                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                            {rack.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            {rack.units}U • {rack.equipment.length} equipment
                        </div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                            Position: ({rack.position.x.toFixed(1)}, {rack.position.z.toFixed(1)})
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
