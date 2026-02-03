import { useState } from "react";

export default function TopHeader({ view, toggle, add }) {
    const defaultFormData = {
        id: "",
        label: "",
        x: null,
        z: null,
        type: "RACK",
    };

    const [formData, setFormData] = useState(defaultFormData);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAdd = () => {
        add(formData)
        setFormData(defaultFormData); 
    };

    return (
        <div
            style={{
                width: "max-content",
                display: "flex",
                flexDirection: "row",
                gap: "1.5rem",
            }}
        >
            {view === "2D" ? (
                <button onClick={() => toggle("3D")}>SWITCH TO 3D</button>
            ) : (
                <button onClick={() => toggle("2D")}>SWITCH TO 2D</button>
            )}

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <label>ID</label>
                <input
                    type="text"
                    name="id"
                    placeholder="Enter ID"
                    value={formData.id}
                    onChange={handleChange}
                />

                <label>Label</label>
                <input
                    type="text"
                    name="label"
                    placeholder="Enter Label"
                    value={formData.label}
                    onChange={handleChange}
                />

                <label>x</label>
                <input
                    type="number"
                    name="x"
                    value={formData.x}
                    onChange={handleChange}
                />

                <label>z</label>
                <input
                    type="number"
                    name="z"
                    value={formData.z}
                    onChange={handleChange}
                />

                <label>Component Type</label>
                <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                >
                    <option value="RACK">RACK</option>
                    <option value="CRAC">CRAC</option>
                    <option value="FUEL">FUEL</option>
                </select>

                <button onClick={handleAdd}>ADD</button>
            </div>
        </div>
    );
}
