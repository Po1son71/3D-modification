import React, { useState } from "react";
import useWarehouseStore from "../../store/warehouseStore";

const WarehouseConfig = ({ onConfigure }) => {
    const [rows, setRows] = useState(10);
    const [columns, setColumns] = useState(10);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rows > 0 && columns > 0) {
            useWarehouseStore.getState().setWarehouseConfig(rows, columns);
            onConfigure && onConfigure();
        }
    };

    return (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#ffffff',
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '400px'
        }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', color: '#333' }}>
                Configure Warehouse
            </h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#666'
                    }}>
                        Number of Rows
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="50"
                        value={rows}
                        onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '16px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#666'
                    }}>
                        Number of Columns
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="50"
                        value={columns}
                        onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '16px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#ffffff',
                        backgroundColor: '#1976d2',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                >
                    Create Warehouse Floor
                </button>
            </form>
        </div>
    );
};

export default WarehouseConfig;

