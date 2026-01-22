import React, { useState } from "react";
import WarehouseScene from "../components/Warehouse/WarehouseScene";
import WarehouseConfig from "../components/Warehouse/WarehouseConfig";
import useWarehouseStore from "../store/warehouseStore";

const WarehousePage = () => {
    const { isConfigured } = useWarehouseStore();
    const [showConfig, setShowConfig] = useState(!isConfigured);

    const handleConfigure = () => {
        setShowConfig(false);
    };

    const handleReset = () => {
        useWarehouseStore.getState().resetWarehouse();
        setShowConfig(true);
    };

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
                top: 0,
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
                </h1>
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

            {/* 3D Scene */}
            {isConfigured && (
                <div style={{
                    position: 'absolute',
                    top: '110px',
                    left: 0,
                    right: 0,
                    bottom: 0
                }}>
                    <WarehouseScene />
                </div>
            )}
        </div>
    );
};

export default WarehousePage;

