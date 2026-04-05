import React from 'react';
import useFloorPlannerStore from '../../store/floorPlannerStore';

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

// ── Segmented control (for door options) ──────────────────────────────────────
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

// ── Angle slider ──────────────────────────────────────────────────────────────
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
    {/* Visual arc preview */}
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
      <svg width={80} height={60} viewBox="0 0 80 60">
        {/* Wall line */}
        <line x1={10} y1={10} x2={70} y2={10} stroke="#444" strokeWidth={3} />
        {/* Closed position (dotted) */}
        <line x1={20} y1={10} x2={60} y2={10} stroke="#aaa" strokeWidth={1} strokeDasharray="3,3" />
        {/* Arc */}
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

// ── Main panel ────────────────────────────────────────────────────────────────
const FloorPlanProperties = () => {
  const {
    rooms, furniture, doors, selectedId,
    updateRoom, updateFurniture, updateDoor,
    deleteSelected, rotateSelectedFurniture,
  } = useFloorPlannerStore();

  const selectedRoom  = rooms.find((r) => r.id === selectedId);
  const selectedFurn  = furniture.find((f) => f.id === selectedId);
  const selectedDoor  = doors.find((d) => d.id === selectedId);
  const item = selectedRoom || selectedFurn || selectedDoor;
  const kind = selectedRoom ? 'room' : selectedFurn ? 'furniture' : selectedDoor ? 'door' : null;

  const numChange = (updater, key, e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) updater(selectedId, { [key]: val });
  };

  return (
    <div style={{ width: 236, height: '100%', background: '#FAFAFA',
      borderLeft: '1px solid #E0E0E0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #E8E8E8',
        background: '#fff', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>
          {kind === 'room'      && 'Room Properties'}
          {kind === 'furniture' && 'Furniture Properties'}
          {kind === 'door'      && 'Door Properties'}
          {!kind                && 'Properties'}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 12px' }}>
        {!item ? (
          <div style={{ color: '#BBB', fontSize: 13, textAlign: 'center', marginTop: 48, lineHeight: 1.7 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>↖</div>
            Select a room, furniture, or door to edit its properties
          </div>
        ) : (
          <>
            {/* ── ROOM ─────────────────────────────────────── */}
            {kind === 'room' && (
              <>
                <Field label="Name">
                  <input value={item.name || ''} onChange={(e) => updateRoom(selectedId, { name: e.target.value })} style={inputStyle} />
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
                  <input type="number" step="0.05" min="0.05" max="0.5" value={(item.wallThickness || 0.15).toFixed(2)} onChange={(e) => numChange(updateRoom, 'wallThickness', e)} style={inputStyle} />
                </Field>
                <Divider />
                <div style={{ background: '#F0F7FF', border: '1px solid #BBDEFB', borderRadius: 6, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Floor area</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1565C0', marginTop: 2 }}>{(item.width * item.height).toFixed(2)} m²</div>
                  <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 1 }}>{item.width.toFixed(2)} m × {item.height.toFixed(2)} m</div>
                </div>
              </>
            )}

            {/* ── FURNITURE ────────────────────────────────── */}
            {kind === 'furniture' && (
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
              </>
            )}

            {/* ── DOOR ─────────────────────────────────────── */}
            {kind === 'door' && (
              <>
                {/* Info badge */}
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
                  <AngleSlider
                    value={item.openAngle}
                    onChange={(v) => updateDoor(selectedId, { openAngle: v })}
                  />
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

            <Divider />

            <button onClick={deleteSelected}
              style={{ width: '100%', padding: '9px', background: '#FFF5F5', color: '#C62828',
                border: '1px solid #FFCDD2', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FFEBEE'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFF5F5'; }}
            >
              Delete {kind === 'room' ? 'Room' : kind === 'furniture' ? 'Item' : 'Door'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FloorPlanProperties;
