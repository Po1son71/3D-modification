import React from "react";

const TopBar = () => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: '280px',
            right: '320px',
            height: '60px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '12px',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
            <div style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#1976d2',
                marginRight: '24px'
            }}>
                Data Center Manager
            </div>

            <button style={{
                padding: '8px 16px',
                backgroundColor: '#1976d2',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
            }}>
                + Add Rack
            </button>

            <button style={{
                padding: '8px 16px',
                backgroundColor: '#ffffff',
                color: '#424242',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
            }}>
                Upload Model
            </button>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button style={{
                    padding: '8px 12px',
                    backgroundColor: '#f5f5f5',
                    color: '#424242',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                }}>
                    Floor View
                </button>
                <button style={{
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    color: '#424242',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                }}>
                    Rack Detail
                </button>
            </div>
        </div>
    );
};

export default TopBar;
