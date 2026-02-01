import React, { useState } from "react";
import WarehouseScene from "../components/Warehouse/WarehouseScene";
import WarehouseConfig from "../components/Warehouse/WarehouseConfig";
import GridEditor from "../components/Warehouse/GridEditor";
import EditorToolbar from "../components/Warehouse/EditorToolbar";
import useWarehouseStore from "../store/warehouseStore";

const WarehousePage = () => {
    const { isConfigured, viewMode, setViewMode, editMode, setEditMode } = useWarehouseStore();
    const [showConfig, setShowConfig] = useState(!isConfigured);

    const handleConfigure = () => {
        setShowConfig(false);
    };

    const handleReset = () => {
        useWarehouseStore.getState().resetWarehouse();
        setShowConfig(true);
    };

    const toggleViewMode = () => {
        setViewMode(viewMode === 'display' ? 'edit' : 'display');
    };

    const  toggleEditMode =() =>{
        setEditMode(editMode === "draw"?"selection" : "draw")
    }
    return (
        <div style={{
            width: "100vw",
            height: "100vh",
            margin: 0,
            padding: 0,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5'
        }}>
            {/* Top Bar */}
            <div style={{
                position: 'absolute',
                top: '50px', // Start below App navigation
                left: 0,
                right: 0,
                height: '60px',
                backgroundColor: '#1976d2',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                    Warehouse Management System
                    <span style={{
                        marginLeft: '16px',
                        fontSize: '14px',
                        fontWeight: 400,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        padding: '4px 12px',
                        borderRadius: '12px'
                    }}>
                        {viewMode === 'display' ? '👁️ Display Mode' : '✏️ Edit Mode'}
                    </span>
                </h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {isConfigured && (
                        <button
                            onClick={toggleViewMode}
                            style={{
                                padding: '8px 16px',
                                fontSize: '14px',
                                backgroundColor: viewMode === 'edit' ? '#2e7d32' : 'rgba(255,255,255,0.2)',
                                color: '#ffffff',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 500,
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = viewMode === 'edit' ? '#388e3c' : 'rgba(255,255,255,0.3)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = viewMode === 'edit' ? '#2e7d32' : 'rgba(255,255,255,0.2)';
                            }}
                        >
                            {viewMode === 'display' ? '✏️ Edit Mode' : '👁️ Display Mode'}
                        </button>
                    )}
                    
                    {viewMode === 'edit' &&
                        <button onClick={toggleEditMode}
                        style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            backgroundColor: viewMode === 'selection' ? '#2e7d32' : 'rgba(255,255,255,0.2)',
                            color: '#ffffff',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {editMode === 'draw' ? '✏️ Draw Mode' : '✏️ Selection Mode'}
                    </button>
                    }
                    <button
                        onClick={handleReset}
                        style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: '#ffffff',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                    >
                        Reset Configuration
                    </button>
                </div>
            </div>

            {/* Configuration Modal */}
            {showConfig && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 1000
                }}>
                    <WarehouseConfig onConfigure={handleConfigure} />
                </div>
            )}

            {/* Main Content Area */}
            {isConfigured && (
                <>
                    {viewMode === 'display' ? (
                        // Display Mode: 3D Scene
                        <div style={{
                            position: 'absolute',
                            top: '110px', // 50px nav + 60px warehouse bar
                            left: 0,
                            right: 0,
                            bottom: 0
                        }}>
                            <WarehouseScene />
                        </div>
                    ) : (
                        // Edit Mode: Grid Editor
                        <div style={{
                            position: 'absolute',
                            top: '110px', // 50px nav + 60px warehouse bar
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <EditorToolbar />
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <GridEditor />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default WarehousePage;
