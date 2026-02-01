import React, { useState } from "react";
import useWarehouseStore from "../../store/warehouseStore";

const EditorToolbar = () => {
    const [showExport, setShowExport] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const {
        selectedTool,
        pathwayColor,
        pathwayWidth,
        pathwayOpacity,
        setSelectedTool,
        setPathwayColor,
        setPathwayWidth,
        setPathwayOpacity,
        clearGrid,
        exportAllData
    } = useWarehouseStore();

    const handleExport = () => {
        const allData = exportAllData();
        const jsonString = JSON.stringify(allData, null, 2);
        setShowExport(jsonString);
    };

    const handleCopyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Warehouse data JSON copied to clipboard!');
    };

    const handleClearGrid = () => {
        clearGrid();
        setShowClearConfirm(false);
    };

    const toolButtonStyle = (tool) => ({
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: 500,
        backgroundColor: selectedTool === tool ? '#1976d2' : '#ffffff',
        color: selectedTool === tool ? '#ffffff' : '#333333',
        border: `2px solid ${selectedTool === tool ? '#1976d2' : '#ddd'}`,
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginRight: '8px'
    });

    return (
        <div style={{
            padding: '16px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '16px'
        }}>
            {/* Tool Selection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', marginRight: '8px' }}>Tool:</span>
                <button
                    onClick={() => setSelectedTool('floor')}
                    style={toolButtonStyle('floor')}
                >
                    🏢 Floor
                </button>
                <button
                    onClick={() => setSelectedTool('pathway')}
                    style={toolButtonStyle('pathway')}
                >
                    🛣️ Pathway
                </button>
                <button
                    onClick={() => setSelectedTool('eraser')}
                    style={toolButtonStyle('eraser')}
                >
                    🧹 Eraser
                </button>
            </div>

            {/* Pathway Color Picker */}
            {selectedTool === 'pathway' && (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontWeight: 600, fontSize: '14px' }}>Color:</label>
                        <input
                            type="color"
                            value={pathwayColor}
                            onChange={(e) => setPathwayColor(e.target.value)}
                            style={{
                                width: '40px',
                                height: '32px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        />
                        <span style={{ fontSize: '12px', color: '#666' }}>{pathwayColor}</span>
                    </div>

                    {/* Pathway Width */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontWeight: 600, fontSize: '14px' }}>Width:</label>
                        <input
                            type="range"
                            min="0.3"
                            max="1.5"
                            step="0.1"
                            value={pathwayWidth}
                            onChange={(e) => setPathwayWidth(parseFloat(e.target.value))}
                            style={{ width: '100px' }}
                        />
                        <span style={{ fontSize: '12px', color: '#666', width: '30px' }}>{pathwayWidth}</span>
                    </div>

                    {/* Pathway Opacity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontWeight: 600, fontSize: '14px' }}>Opacity:</label>
                        <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={pathwayOpacity}
                            onChange={(e) => setPathwayOpacity(parseFloat(e.target.value))}
                            style={{ width: '100px' }}
                        />
                        <span style={{ fontSize: '12px', color: '#666', width: '30px' }}>{pathwayOpacity}</span>
                    </div>
                </>
            )}

            {/* Export Button */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button
                    onClick={() => setShowClearConfirm(true)}
                    style={{
                        padding: '10px 16px',
                        fontSize: '14px',
                        fontWeight: 500,
                        backgroundColor: '#ffffff',
                        color: '#d32f2f',
                        border: '2px solid #d32f2f',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Clear Grid
                </button>
                <button
                    onClick={handleExport}
                    style={{
                        padding: '10px 16px',
                        fontSize: '14px',
                        fontWeight: 500,
                        backgroundColor: '#2e7d32',
                        color: '#ffffff',
                        border: '2px solid #2e7d32',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    📥 Export to JSON
                </button>
            </div>

            {/* Export Modal */}
            {showExport && (
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
                    zIndex: 10000
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        padding: '24px',
                        borderRadius: '8px',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }}>
                        <h3 style={{ marginTop: 0 }}>Exported Warehouse Data JSON</h3>
                        <pre style={{
                            backgroundColor: '# f5f5f5',
                            padding: '16px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                        }}>
                            {showExport}
                        </pre>
                        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => handleCopyToClipboard(showExport)}
                                style={{
                                    padding: '10px 16px',
                                    fontSize: '14px',
                                    backgroundColor: '#1976d2',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Copy to Clipboard
                            </button>
                            <button
                                onClick={() => setShowExport(false)}
                                style={{
                                    padding: '10px 16px',
                                    fontSize: '14px',
                                    backgroundColor: '#666666',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear Confirmation */}
            {showClearConfirm && (
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
                    zIndex: 10000
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        padding: '24px',
                        borderRadius: '8px',
                        maxWidth: '400px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }}>
                        <h3 style={{ marginTop: 0 }}>Clear Grid?</h3>
                        <p>Are you sure you want to clear the entire grid? This action cannot be undone.</p>
                        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                style={{
                                    padding: '10px 16px',
                                    fontSize: '14px',
                                    backgroundColor: '#666666',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearGrid}
                                style={{
                                    padding: '10px 16px',
                                    fontSize: '14px',
                                    backgroundColor: '#d32f2f',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Clear Grid
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditorToolbar;
