import React from 'react';
import useFloorPlannerStore from '../../store/floorPlannerStore';

const SENSOR_TYPES = [
  'temperature', 'humidity', 'power', 'current',
  'voltage', 'airflow', 'pressure', 'network', 'custom',
];
const SENSOR_UNITS = {
  temperature: '°C', humidity: '%RH', power: 'kW',
  current: 'A', voltage: 'V', airflow: 'CFM',
  pressure: 'Pa', network: 'Mbps', custom: '',
};

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 13 }}>
    <label style={{ display: 'block', fontSize: 10, color: '#999', marginBottom: 4,
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
      {label}
    </label>
    {children}
  </div>
);

const inputStyle = {
  width: '100%', padding: '6px 9px', border: '1px solid #DDD',
  borderRadius: 5, fontSize: 13, color: '#333', background: '#fff',
  boxSizing: 'border-box', outline: 'none',
};

const colorInput = { ...inputStyle, padding: '3px 4px', height: 36, cursor: 'pointer' };
const Divider    = () => <div style={{ height: 1, background: '#F0F0F0', margin: '14px 0' }} />;

const Seg = ({ value, options, onChange }) => (
  <div style={{ display: 'flex', background: '#F2F2F2', borderRadius: 6, padding: 3, gap: 2 }}>
    {options.map(({ val, label }) => (
      <button key={val} onClick={() => onChange(val)} style={{
        flex: 1, padding: '5px 4px', border: 'none', borderRadius: 4, cursor: 'pointer',
        fontSize: 12, fontWeight: value === val ? 700 : 400,
        background: value === val ? '#fff' : 'transparent',
        color: value === val ? '#1976D2' : '#888',
        boxShadow: value === val ? '0 1px 3px rgba(0,0,0,0.14)' : 'none',
        transition: 'all 0.12s',
      }}>
        {label}
      </button>
    ))}
  </div>
);

const AngleSlider = ({ value, onChange }) => (
  <div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="range" min={5} max={175} step={5} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: '#1976D2' }}
      />
      <span style={{ fontSize: 13, fontWeight: 600, color: '#333', minWidth: 36 }}>
        {value}°
      </span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
      <svg width={80} height={60} viewBox="0 0 80 60">
        <line x1={10} y1={10} x2={70} y2={10} stroke="#444" strokeWidth={3} />
        <line x1={20} y1={10} x2={60} y2={10} stroke="#aaa" strokeWidth={1} strokeDasharray="3,3" />
        {(() => {
          const r = 35, cx = 20, cy = 10;
          const θ = (value * Math.PI) / 180;
          const ex = cx + r * Math.cos(θ), ey = cy + r * Math.sin(θ);
          const largeArc = value > 90 ? 1 : 0;
          return (
            <>
              <path d={`M ${cx + r} ${cy} A ${r} ${r} 0 ${largeArc} 0 ${ex.toFixed(1)} ${ey.toFixed(1)}`}
                fill="none" stroke="rgba(139,91,58,0.3)" strokeWidth={1.5} strokeDasharray="3,3" />
              <line x1={cx} y1={cy} x2={ex.toFixed(1)} y2={ey.toFixed(1)}
                stroke="#7B5B3A" strokeWidth={2} strokeLinecap="round" />
              <circle cx={cx} cy={cy} r={3} fill="#7B5B3A" />
            </>
          );
        })()}
      </svg>
    </div>
  </div>
);

// ── Lock button ───────────────────────────────────────────────────────────────
const LockBtn = ({ locked, onToggle }) => (
  <button
    onClick={onToggle}
    title={locked ? 'Click to unlock' : 'Click to lock (prevents move/delete)'}
    style={{
      width: '100%', padding: '8px', marginBottom: 10,
      background: locked ? '#FFF3E0' : '#F5F5F5',
      color: locked ? '#E65100' : '#666',
      border: `1px solid ${locked ? '#FFCC80' : '#E0E0E0'}`,
      borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      transition: 'all 0.15s',
    }}
  >
    {locked ? '🔒 Locked' : '🔓 Unlocked'}
  </button>
);

// ── Main panel ────────────────────────────────────────────────────────────────
const FloorPlanProperties = () => {
  const {
    rooms, furniture, doors,
    selectedIds, lockedIds,
    updateRoom, updateFurniture, updateDoor,
    deleteSelected, rotateSelectedFurniture,
    toggleLock, lockSelected, unlockSelected,
    clearSelection,
  } = useFloorPlannerStore();

  const selectedId = selectedIds[0] ?? null;
  const multiSelect = selectedIds.length > 1;

  const selectedRoom = rooms.find((r) => r.id === selectedId);
  const selectedFurn = furniture.find((f) => f.id === selectedId);
  const selectedDoor = doors.find((d) => d.id === selectedId);
  const item = selectedRoom || selectedFurn || selectedDoor;
  const kind = selectedRoom ? 'room' : selectedFurn ? 'furniture' : selectedDoor ? 'door' : null;

  const isLocked = selectedId ? lockedIds.includes(selectedId) : false;

  const numChange = (updater, key, e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) updater(selectedId, { [key]: val });
  };

  // Count types in multi-selection
  const multiRooms = multiSelect ? selectedIds.filter((id) => rooms.find((r) => r.id === id)).length : 0;
  const multiFurn  = multiSelect ? selectedIds.filter((id) => furniture.find((f) => f.id === id)).length : 0;
  const multiLocked = multiSelect ? selectedIds.filter((id) => lockedIds.includes(id)).length : 0;
  const allLocked = multiSelect && multiLocked === selectedIds.length;

  return (
    <div style={{ width: 236, height: '100%', background: '#FAFAFA',
      borderLeft: '1px solid #E0E0E0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #E8E8E8',
        background: '#fff', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>
          {multiSelect             && `${selectedIds.length} Items Selected`}
          {!multiSelect && kind === 'room'      && 'Room Properties'}
          {!multiSelect && kind === 'furniture' && 'Furniture Properties'}
          {!multiSelect && kind === 'door'      && 'Door Properties'}
          {!multiSelect && !kind                && 'Properties'}
        </div>
        {multiSelect && (
          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
            {multiRooms > 0 && `${multiRooms} room${multiRooms > 1 ? 's' : ''}`}
            {multiRooms > 0 && multiFurn > 0 && ' · '}
            {multiFurn  > 0 && `${multiFurn} item${multiFurn > 1 ? 's' : ''}`}
            {multiLocked > 0 && ` · ${multiLocked} locked`}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 12px' }}>

        {/* ── MULTI-SELECT PANEL ─────────────────────────────── */}
        {multiSelect && (
          <>
            <div style={{ background: '#E3F2FD', border: '1px solid #BBDEFB', borderRadius: 6,
              padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#1565C0' }}>
              Shift+click to add/remove · Drag to move all
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <button
                onClick={lockSelected}
                style={{ flex: 1, padding: '7px 6px', border: '1px solid #FFCC80', borderRadius: 6,
                  background: '#FFF3E0', color: '#E65100', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                🔒 Lock All
              </button>
              <button
                onClick={unlockSelected}
                style={{ flex: 1, padding: '7px 6px', border: '1px solid #E0E0E0', borderRadius: 6,
                  background: '#F5F5F5', color: '#666', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                🔓 Unlock All
              </button>
            </div>

            <button
              onClick={clearSelection}
              style={{ width: '100%', padding: '7px', border: '1px solid #E0E0E0', borderRadius: 6,
                background: '#fff', color: '#666', cursor: 'pointer', fontSize: 12, marginBottom: 10 }}>
              Deselect All
            </button>

            <Divider />

            {allLocked ? (
              <div style={{ color: '#E65100', fontSize: 12, textAlign: 'center', padding: '8px 0', marginBottom: 8 }}>
                All selected items are locked
              </div>
            ) : (
              <button onClick={deleteSelected}
                style={{ width: '100%', padding: '9px', background: '#FFF5F5', color: '#C62828',
                  border: '1px solid #FFCDD2', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#FFEBEE'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#FFF5F5'; }}>
                Delete Non-Locked ({selectedIds.length - multiLocked})
              </button>
            )}
          </>
        )}

        {/* ── SINGLE-SELECT PANELS ──────────────────────────── */}
        {!multiSelect && !item && (
          <div style={{ color: '#BBB', fontSize: 13, textAlign: 'center', marginTop: 48, lineHeight: 1.7 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>↖</div>
            Select a room, furniture, or door to edit its properties
          </div>
        )}

        {!multiSelect && item && (
          <>
            <LockBtn locked={isLocked} onToggle={() => toggleLock(selectedId)} />

            {/* ── ROOM ─────────────────────────────────────── */}
            {kind === 'room' && !isLocked && (
              <>
                <Field label="Name">
                  <input value={item.name || ''} onChange={(e) => updateRoom(selectedId, { name: e.target.value })} style={inputStyle} />
                </Field>
                <Field label="Zone ID">
                  <input
                    value={item.zoneId || ''}
                    placeholder="e.g. ZONE-A"
                    onChange={(e) => updateRoom(selectedId, { zoneId: e.target.value })}
                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                  />
                </Field>
                <Divider />
                <Field label="Width (m)">
                  <input type="number" step="0.25" min="0.5" value={item.width.toFixed(2)} onChange={(e) => numChange(updateRoom, 'width', e)} style={inputStyle} />
                </Field>
                <Field label="Length (m)">
                  <input type="number" step="0.25" min="0.5" value={item.height.toFixed(2)} onChange={(e) => numChange(updateRoom, 'height', e)} style={inputStyle} />
                </Field>
                <Field label="X (m)">
                  <input type="number" step="0.25" value={item.x.toFixed(2)} onChange={(e) => numChange(updateRoom, 'x', e)} style={inputStyle} />
                </Field>
                <Field label="Y (m)">
                  <input type="number" step="0.25" value={item.y.toFixed(2)} onChange={(e) => numChange(updateRoom, 'y', e)} style={inputStyle} />
                </Field>
                <Divider />
                <Field label="Floor color">
                  <input type="color" value={item.floorColor} onChange={(e) => updateRoom(selectedId, { floorColor: e.target.value })} style={colorInput} />
                </Field>
                <Field label="Wall color">
                  <input type="color" value={item.wallColor} onChange={(e) => updateRoom(selectedId, { wallColor: e.target.value })} style={colorInput} />
                </Field>
                <Field label="Wall thickness (m)">
                  <input type="number" step="0.05" min="0.05" max="0.5" value={(item.wallThickness || 0.05).toFixed(2)} onChange={(e) => numChange(updateRoom, 'wallThickness', e)} style={inputStyle} />
                </Field>
                <Field label="Wall height (m)">
                  <input type="number" step="0.1" min="1.5" max="6.0" value={(item.wallHeight || 1.8).toFixed(1)} onChange={(e) => numChange(updateRoom, 'wallHeight', e)} style={inputStyle} />
                </Field>
                <Divider />
              </>
            )}
            {kind === 'room' && (
              <div style={{ background: '#F0F7FF', border: '1px solid #BBDEFB', borderRadius: 6, padding: '10px 12px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Floor area</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1565C0', marginTop: 2 }}>{(item.width * item.height).toFixed(2)} m²</div>
                <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 1 }}>{item.width.toFixed(2)} m × {item.height.toFixed(2)} m</div>
              </div>
            )}

            {/* ── FURNITURE ────────────────────────────────── */}
            {kind === 'furniture' && !isLocked && (
              <>
                <Field label="Name">
                  <input value={item.name || ''} onChange={(e) => updateFurniture(selectedId, { name: e.target.value })} style={inputStyle} />
                </Field>
                <Divider />
                <Field label="Width (m)">
                  <input type="number" step="0.25" min="0.25" value={item.width.toFixed(2)} onChange={(e) => numChange(updateFurniture, 'width', e)} style={inputStyle} />
                </Field>
                <Field label="Depth (m)">
                  <input type="number" step="0.25" min="0.25" value={item.depth.toFixed(2)} onChange={(e) => numChange(updateFurniture, 'depth', e)} style={inputStyle} />
                </Field>
                <Field label="Height 3D (m)">
                  <input type="number" step="0.05" min="0.05" value={(item.height3d || 0.8).toFixed(2)} onChange={(e) => numChange(updateFurniture, 'height3d', e)} style={inputStyle} />
                </Field>
                <Divider />
                <Field label="Rotation (°)">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="number" step="15" min="0" max="345" value={item.rotation || 0} onChange={(e) => numChange(updateFurniture, 'rotation', e)} style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={() => rotateSelectedFurniture(90)} title="Rotate 90°"
                      style={{ padding: '6px 10px', border: '1px solid #DDD', borderRadius: 5, background: '#fff', cursor: 'pointer', fontSize: 16, color: '#555', flexShrink: 0 }}>
                      ↻
                    </button>
                  </div>
                </Field>
                <Field label="Color">
                  <input type="color" value={item.color || '#C8A080'} onChange={(e) => updateFurniture(selectedId, { color: e.target.value })} style={colorInput} />
                </Field>
                <Divider />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Field label="X (m)"><input type="number" step="0.25" value={item.x.toFixed(2)} onChange={(e) => numChange(updateFurniture, 'x', e)} style={inputStyle} /></Field>
                  <Field label="Y (m)"><input type="number" step="0.25" value={item.y.toFixed(2)} onChange={(e) => numChange(updateFurniture, 'y', e)} style={inputStyle} /></Field>
                </div>

                <Divider />

                {/* ── DCIM Mapping ─────────────────────────── */}
                <div style={{ fontSize: 10, color: '#1565C0', marginBottom: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.6px',
                  display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ background: '#E3F2FD', border: '1px solid #BBDEFB',
                    borderRadius: 3, padding: '1px 5px' }}>DCIM</span>
                  Asset Mapping
                </div>

                <Field label="Asset ID">
                  <input
                    value={item.assetId || ''}
                    placeholder="e.g. RACK-001"
                    onChange={(e) => updateFurniture(selectedId, { assetId: e.target.value })}
                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                  />
                </Field>

                <div style={{ fontSize: 10, color: '#999', marginBottom: 6,
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Sensors</span>
                  <span style={{ color: '#AAA', fontWeight: 400, textTransform: 'none', fontSize: 10 }}>
                    {(item.sensors || []).length} mapped
                  </span>
                </div>

                {(item.sensors || []).map((sensor, idx) => {
                  const v = sensor.value ?? 0;
                  const heatColor = v < 40 ? '#2E7D32' : v < 65 ? '#F9A825' : v < 80 ? '#E65100' : '#C62828';
                  return (
                    <div key={idx} style={{ marginBottom: 8, background: '#F8F9FA',
                      border: '1px solid #EEE', borderRadius: 6, padding: '7px 8px' }}>
                      {/* Row 1: ID + type + delete */}
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 5 }}>
                        <input
                          value={sensor.sensorId || ''}
                          placeholder="Sensor ID"
                          onChange={(e) => {
                            const sensors = [...(item.sensors || [])];
                            sensors[idx] = { ...sensors[idx], sensorId: e.target.value };
                            updateFurniture(selectedId, { sensors });
                          }}
                          style={{ ...inputStyle, flex: 1, fontSize: 11, padding: '4px 6px',
                            fontFamily: 'monospace' }}
                        />
                        <select
                          value={sensor.type || 'temperature'}
                          onChange={(e) => {
                            const sensors = [...(item.sensors || [])];
                            sensors[idx] = { ...sensors[idx], type: e.target.value,
                              unit: SENSOR_UNITS[e.target.value] ?? '' };
                            updateFurniture(selectedId, { sensors });
                          }}
                          style={{ ...inputStyle, width: 88, fontSize: 11,
                            padding: '4px 3px', flexShrink: 0, cursor: 'pointer' }}
                        >
                          {SENSOR_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const sensors = (item.sensors || []).filter((_, i) => i !== idx);
                            updateFurniture(selectedId, { sensors });
                          }}
                          style={{ padding: '3px 6px', border: '1px solid #FFCDD2', borderRadius: 4,
                            background: '#FFF5F5', color: '#C62828', cursor: 'pointer',
                            fontSize: 11, lineHeight: 1, flexShrink: 0 }}
                        >✕</button>
                      </div>
                      {/* Row 2: Value slider */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, color: '#999', flexShrink: 0 }}>Value</span>
                        <input
                          type="range" min={0} max={100} step={1} value={v}
                          onChange={(e) => {
                            const sensors = [...(item.sensors || [])];
                            sensors[idx] = { ...sensors[idx], value: Number(e.target.value) };
                            updateFurniture(selectedId, { sensors });
                          }}
                          style={{ flex: 1, accentColor: heatColor }}
                        />
                        <span style={{ fontSize: 11, fontWeight: 700, color: heatColor,
                          minWidth: 36, textAlign: 'right' }}>
                          {v}{sensor.unit || ''}
                        </span>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => {
                    const sensors = [
                      ...(item.sensors || []),
                      { sensorId: '', type: 'temperature', unit: '°C' },
                    ];
                    updateFurniture(selectedId, { sensors });
                  }}
                  style={{ width: '100%', padding: '6px', border: '1px dashed #BBDEFB',
                    borderRadius: 5, background: '#F8FBFF', color: '#1976D2',
                    cursor: 'pointer', fontSize: 11, marginBottom: 2 }}
                >
                  + Add Sensor
                </button>
              </>
            )}

            {/* ── DOOR ─────────────────────────────────────── */}
            {kind === 'door' && !isLocked && (
              <>
                <div style={{ background: '#FFF8E1', border: '1px solid #FFECB3', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 11, color: '#795548' }}>
                  Wall: <strong>{item.wall.charAt(0).toUpperCase() + item.wall.slice(1)}</strong>
                  &nbsp;·&nbsp;
                  Offset: <strong>{item.offset.toFixed(2)} m</strong> from start
                </div>

                <Field label="Door width (m)">
                  <input type="number" step="0.05" min="0.5" max="2.5" value={item.width.toFixed(2)} onChange={(e) => numChange(updateDoor, 'width', e)} style={inputStyle} />
                </Field>

                <Field label="Offset along wall (m)">
                  <input type="number" step="0.25" min="0" value={item.offset.toFixed(2)} onChange={(e) => numChange(updateDoor, 'offset', e)} style={inputStyle} />
                </Field>

                <Divider />

                <Field label="Opening angle">
                  <AngleSlider value={item.openAngle} onChange={(v) => updateDoor(selectedId, { openAngle: v })} />
                </Field>

                <Divider />

                <Field label="Hinge side">
                  <Seg
                    value={item.hingeSide}
                    options={[{ val: 'left', label: '← Left' }, { val: 'right', label: 'Right →' }]}
                    onChange={(v) => updateDoor(selectedId, { hingeSide: v })}
                  />
                </Field>

                <Field label="Swing direction">
                  <Seg
                    value={item.swingIn ? 'in' : 'out'}
                    options={[{ val: 'in', label: '↓ Inward' }, { val: 'out', label: '↑ Outward' }]}
                    onChange={(v) => updateDoor(selectedId, { swingIn: v === 'in' })}
                  />
                </Field>
              </>
            )}

            {isLocked && (
              <div style={{ background: '#FFF3E0', border: '1px solid #FFCC80', borderRadius: 6,
                padding: '12px', marginBottom: 14, fontSize: 12, color: '#E65100', textAlign: 'center' }}>
                This item is locked.<br />
                <span style={{ color: '#999', fontSize: 11 }}>Unlock to edit or delete.</span>
              </div>
            )}

            <Divider />

            <button onClick={deleteSelected} disabled={isLocked}
              style={{ width: '100%', padding: '9px', background: isLocked ? '#F5F5F5' : '#FFF5F5',
                color: isLocked ? '#BBB' : '#C62828',
                border: `1px solid ${isLocked ? '#E0E0E0' : '#FFCDD2'}`,
                borderRadius: 6, cursor: isLocked ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500 }}
              onMouseEnter={(e) => { if (!isLocked) e.currentTarget.style.background = '#FFEBEE'; }}
              onMouseLeave={(e) => { if (!isLocked) e.currentTarget.style.background = '#FFF5F5'; }}>
              {isLocked ? '🔒 Locked — cannot delete' : `Delete ${kind === 'room' ? 'Room' : kind === 'furniture' ? 'Item' : 'Door'}`}
             </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FloorPlanProperties;
