import React, { useState } from 'react'
import useWarehouseStore from '../../../store/warehouseStore';
const styles = {
    panel: {
        position: "fixed",
        top: '15vh',
        left: 0,
        width: "20vw",
        minWidth: "260px",
        height: "80vh",
        background: "#ffffff",
        boxShadow: "2px 0 12px rgba(0,0,0,0.12)",
        padding: "16px",
        marginTop: "20px",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        zIndex: '100'
    },

    title: {
        margin: "0 0 16px 0",
        fontSize: "18px",
        fontWeight: "600"
    },

    field: {
        display: "flex",
        flexDirection: "column",
        marginBottom: "12px"
    },

    label: {
        fontSize: "13px",
        marginBottom: "4px",
        color: "#555"
    },

    input: {
        padding: "8px 10px",
        fontSize: "14px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        outline: "none"
    },

    meta: {
        fontSize: "12px",
        color: "#777",
        marginTop: "8px"
    },

    button: {
        marginTop: "auto",
        marginBottom: "20px",
        padding: "10px",
        fontSize: "14px",
        borderRadius: "4px",
        border: "none",
        background: "#1976d2",
        color: "#fff",
        cursor: "pointer"
    }
};

export default function AddNewMaterial({ row, col, inventory, cellSize }) {
    const [itemName, setItemName] = useState("");
    const [stackHeight, setStackHeight] = useState();
    const [type, setType] = useState("");
    const { addItem } = useWarehouseStore();
    const handleSave = () => {
        const item = {
            id: itemName,
            type: type,
            row: row+1,
            column: col+1,
            stackHeight: Number(stackHeight),
            position: {
                x: 0,
                z: 0
            }
        }
        addItem(item);

    };

    return (
        <div style={styles.panel}>
            <h3 style={styles.title}>Add New Material</h3>

            <div style={styles.field}>
                <label style={styles.label}>Item Name</label>
                <input style={styles.input} onChange={(e) => setItemName(e.target.value)} />
            </div>

            <div style={styles.field}>
                <label style={styles.label}>Item Type</label>
                <select
                    style={styles.input}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                >
                    <option value="">Select type</option>
                    <option value="box">Box</option>
                    <option value="pallet">Pallet</option>
                    <option value="sack">Sack</option>
                </select>
            </div>

            <div style={styles.field}>
                <label style={styles.label}>Stack Height</label>
                <input type="number" min={1} style={styles.input} onChange={(e) => setStackHeight(e.target.value)} />
            </div>

            <div style={styles.meta}>
                Cell: Row {row + 1}, Col {col + 1}
            </div>

            <button style={styles.button} onClick={handleSave}>
                Save Material
            </button>
        </div>
    );
}
