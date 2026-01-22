import React from "react";
import useDCIMStore from "../../store/dcimStore";

const PropertiesPanel = () => {
    const { racks, selectedRackId, selectedEquipmentId } = useDCIMStore();

    const selectedRack = racks.find(r => r.id === selectedRackId);
    const selectedEquipment = selectedRack?.equipment.find(e => e.id === selectedEquipmentId);

    if (!selectedRack && !selectedEquipment) {
        return (
            <div style={{
                position: 'absolute',
                right: 0,
                top: '60px',
                bottom: 0,
                width: '320px',
                backgroundColor: '#ffffff',
                borderLeft: '1px solid #e0e0e0',
                padding: '16px',
                overflowY: 'auto',
                zIndex: 10,
                boxShadow: '-2px 0 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    color: '#999',
                    textAlign: 'center',
                    marginTop: '40px',
                    fontSize: '14px'
                }}>
                    Select a rack or equipment to view properties
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'absolute',
            right: 0,
            top: '60px',
            bottom: 0,
            width: '320px',
            backgroundColor: '#ffffff',
            borderLeft: '1px solid #e0e0e0',
            padding: '16px',
            overflowY: 'auto',
            zIndex: 10,
            boxShadow: '-2px 0 8px rgba(0,0,0,0.1)'
        }}>
            {/* Equipment Properties */}
            {selectedEquipment && (
                <div>
                    <h3 style={{
                        margin: '0 0 16px 0',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#1976d2'
                    }}>
                        Equipment Properties
                    </h3>

                    <PropertyRow label="Name" value={selectedEquipment.name} />
                    <PropertyRow label="ID" value={selectedEquipment.id} />
                    <PropertyRow label="Type" value={selectedEquipment.type} />
                    <PropertyRow label="RU Start" value={selectedEquipment.ruStart} />
                    <PropertyRow label="RU Height" value={`${selectedEquipment.ruHeight}U`} />

                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px'
                    }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                            Color
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: selectedEquipment.color,
                                borderRadius: '4px',
                                border: '1px solid #ddd'
                            }} />
                            <span style={{ fontSize: '14px' }}>{selectedEquipment.color}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Rack Properties */}
            {selectedRack && !selectedEquipment && (
                <div>
                    <h3 style={{
                        margin: '0 0 16px 0',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#1976d2'
                    }}>
                        Rack Properties
                    </h3>

                    <PropertyRow label="Name" value={selectedRack.name} />
                    <PropertyRow label="ID" value={selectedRack.id} />
                    <PropertyRow label="Units" value={`${selectedRack.units}U`} />
                    <PropertyRow label="Position X" value={`${selectedRack.position.x.toFixed(2)}m`} />
                    <PropertyRow label="Position Z" value={`${selectedRack.position.z.toFixed(2)}m`} />
                    <PropertyRow label="Dimensions" value={`${selectedRack.width}×${selectedRack.depth}m`} />
                    <PropertyRow label="Height" value={`${selectedRack.height}m`} />

                    <div style={{
                        marginTop: '24px',
                        paddingTop: '16px',
                        borderTop: '1px solid #e0e0e0'
                    }}>
                        <h4 style={{
                            margin: '0 0 12px 0',
                            fontSize: '14px',
                            fontWeight: 600
                        }}>
                            Equipment ({selectedRack.equipment.length})
                        </h4>

                        {selectedRack.equipment.length === 0 ? (
                            <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                                No equipment installed
                            </div>
                        ) : (
                            selectedRack.equipment.map((eq) => (
                                <div key={eq.id} style={{
                                    padding: '8px',
                                    marginBottom: '6px',
                                    backgroundColor: '#f9f9f9',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                }}>
                                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                                        {eq.name}
                                    </div>
                                    <div style={{ color: '#666' }}>
                                        RU {eq.ruStart} - {eq.ruStart + eq.ruHeight - 1} • {eq.type}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const PropertyRow = ({ label, value }) => (
    <div style={{
        marginBottom: '12px',
        paddingBottom: '12px',
        borderBottom: '1px solid #f0f0f0'
    }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            {label}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 500 }}>
            {value}
        </div>
    </div>
);

export default PropertiesPanel;
