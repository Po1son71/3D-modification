import React, { useState } from "react";

const GridConfigModal = ({ onConfigure, onCancel, defaultRows = 20, defaultColumns = 20 }) => {
    const [rows, setRows] = useState(defaultRows);
    const [columns, setColumns] = useState(defaultColumns);
    const [error, setError] = useState("");

    const handleSubmit = () => {
        // Validation
        if (rows < 5 || rows > 50) {
            setError("Rows must be between 5 and 50");
            return;
        }
        if (columns < 5 || columns > 50) {
            setError("Columns must be between 5 and 50");
            return;
        }

        onConfigure(rows, columns);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                padding: '32px',
                borderRadius: '8px',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
                <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '24px', fontWeight: 600 }}>
                    Configure Grid Editor
                </h2>
                <p style={{ marginBottom: '24px', color: '#666', fontSize: '14px' }}>
                    Set the dimensions for your warehouse grid editor. This will determine the editable area.
                </p>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
                        Rows (5-50):
                    </label>
                    <input
                        type="number"
                        min="5"
                        max="50"
                        value={rows}
                        onChange={(e) => {
                            setRows(parseInt(e.target.value) || 5);
                            setError("");
                        }}
                        style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '14px',
                            border: '2px solid #ddd',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
                        Columns (5-50):
                    </label>
                    <input
                        type="number"
                        min="5"
                        max="50"
                        value={columns}
                        onChange={(e) => {
                            setColumns(parseInt(e.target.value) || 5);
                            setError("");
                        }}
                        style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '14px',
                            border: '2px solid #ddd',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {error && (
                    <div style={{
                        marginBottom: '16px',
                        padding: '12px',
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            style={{
                                padding: '10px 20px',
                                fontSize: '14px',
                                backgroundColor: '#ffffff',
                                color: '#666',
                                border: '2px solid #ddd',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={handleSubmit}
                        style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            backgroundColor: '#1976d2',
                            color: '#ffffff',
                            border: '2px solid #1976d2',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        Configure Grid
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GridConfigModal;
