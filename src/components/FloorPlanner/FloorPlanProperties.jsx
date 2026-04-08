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

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:       '#0D1B2E',
  accent:     '#0EA5E9',
  accentDark: '#0284C7',
  accentBg:   'rgba(14,165,233,0.08)',
  border:     '#E2E8F0',
  bg:         '#F8FAFC',
  panel:      '#FFFFFF',
  text:       '#1E293B',
  textSub:    '#64748B',
  textMuted:  '#94A3B8',
  danger:     '#EF4444',
  dangerBg:   'rgba(239,68,68,0.08)',
  warning:    '#F59E0B',
  success:    '#22C55E',
  sectionBg:  '#F1F5F9',
};

// ── Shared input style ────────────────────────────────────────────────────────
const inp = {
  width: '100%', padding: '6px 8px',
  border: `1px solid ${C.border}`,
  borderRadius: 5, fontSize: 12, color: C.text,
  background: C.panel, boxSizing: 'border-box', outline: 'none',
  transition: 'border-color 0.1s',
};
const colorInp = { ...inp, padding: '2px 3px', height: 32, cursor: 'pointer' };

// ── Field ─────────────────────────────────────────────────────────────────────
const Field = ({ label, children, row }) => (
  <div style={{ marginBottom: 10, ...(row ? { display: 'flex', alignItems: 'center', gap: 8 } : {}) }}>
    <label style={{
      display: 'block', fontSize: 10, color: C.textMuted, marginBottom: row ? 0 : 3,
      fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
      flexShrink: row ? 0 : undefined, minWidth: row ? 58 : undefined,
    }}>
      {label}
    </label>
    {children}
  </div>
);

// ── Section header ────────────────────────────────────────────────────────────
const Section = ({ label, accent, badge, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 12px',
      background: C.sectionBg,
      borderRadius: '6px 6px 0 0',
      borderTop: `2px solid ${accent || C.border}`,
      marginBottom: 10,
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, color: accent || C.textSub,
        textTransform: 'uppercase', letterSpacing: '0.7px', flex: 1,
      }}>{label}</span>
      {badge && (
        <span style={{
          fontSize: 10, padding: '1px 6px',
          background: `${accent}18`, color: accent,
          borderRadius: 3, fontWeight: 700, border: `1px solid ${accent}30`,
        }}>{badge}</span>
      )}
    </div>
    {children}
  </div>
);

// ── Segmented control ─────────────────────────────────────────────────────────
const Seg = ({ value, options, onChange }) => (
  <div style={{
    display: 'flex', background: C.sectionBg,
    borderRadius: 6, padding: 2, gap: 2,
    border: `1px solid ${C.border}`,
  }}>
    {options.map(({ val, label }) => (
      <button key={val} onClick={() => onChange(val)} style={{
        flex: 1, padding: '5px 4px', border: 'none', borderRadius: 4, cursor: 'pointer',
        fontSize: 11, fontWeight: value === val ? 600 : 400,
        background: value === val ? C.panel : 'transparent',
        color: value === val ? C.accentDark : C.textSub,
        boxShadow: value === val ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
        transition: 'all 0.1s',
      }}>
        {label}
      </button>
    ))}
  </div>
);

// ── Door angle preview ────────────────────────────────────────────────────────
const AngleSlider = ({ value, onChange }) => (
  <div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="range" min={5} max={175} step={5} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: C.accent }}
      />
      <span style={{ fontSize: 12, fontWeight: 600, color: C.text, minWidth: 36 }}>
        {value}°
      </span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
      <svg width={80} height={52} viewBox="0 0 80 52">
        <line x1={10} y1={10} x2={70} y2={10} stroke="#334155" strokeWidth={2.5} />
        {(() => {
          const r = 35, cx = 20, cy = 10;
          const θ = (value * Math.PI) / 180;
          const ex = cx + r * Math.cos(θ), ey = cy + r * Math.sin(θ);
          const largeArc = value > 90 ? 1 : 0;
          return (
            <>
              <path d={`M ${cx + r} ${cy} A ${r} ${r} 0 ${largeArc} 0 ${ex.toFixed(1)} ${ey.toFixed(1)}`}
                fill="none" stroke={`${C.accent}50`} strokeWidth={1.5} strokeDasharray="3,3" />
              <line x1={cx} y1={cy} x2={ex.toFixed(1)} y2={ey.toFixed(1)}
                stroke={C.accentDark} strokeWidth={2} strokeLinecap="round" />
              <circle cx={cx} cy={cy} r={3} fill={C.accentDark} />
            </>
          );
        })()}
      </svg>
    </div>
  </div>
);

// ── Lock toggle ───────────────────────────────────────────────────────────────
const LockBtn = ({ locked, onToggle }) => (
  <button onClick={onToggle} style={{
    width: '100%', padding: '7px 12px', marginBottom: 12,
    background: locked ? 'rgba(245,158,11,0.08)' : 'transparent',
    color: locked ? C.warning : C.textSub,
    border: `1px solid ${locked ? 'rgba(245,158,11,0.3)' : C.border}`,
    borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    transition: 'all 0.15s', letterSpacing: '0.2px',
  }}>
    <span style={{ fontSize: 12 }}>{locked ? '🔒' : '🔓'}</span>
    {locked ? 'LOCKED — click to unlock' : 'Unlocked'}
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

  const selectedId  = selectedIds[0] ?? null;
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

  const multiRooms  = multiSelect ? selectedIds.filter((id) => rooms.find((r) => r.id === id)).length : 0;
  const multiFurn   = multiSelect ? selectedIds.filter((id) => furniture.find((f) => f.id === id)).length : 0;
  const multiLocked = multiSelect ? selectedIds.filter((id) => lockedIds.includes(id)).length : 0;
  const allLocked   = multiSelect && multiLocked === selectedIds.length;

  const kindLabel = kind === 'room' ? 'Room' : kind === 'furniture' ? 'Asset' : kind === 'door' ? 'Door' : '';
  const kindAccent = kind === 'room' ? '#8B5CF6' : kind === 'furniture' ? C.accent : '#F59E0B';

  return (
    <div style={{
      width: 244, height: '100%',
      background: C.panel,
      borderLeft: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column',
      flexShrink: 0,
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>

      {/* Panel header */}
      <div style={{
        padding: '11px 14px 9px',
        background: C.sectionBg,
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {kind && (
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: kindAccent, flexShrink: 0,
              boxShadow: `0 0 6px ${kindAccent}`,
            }} />
          )}
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, flex: 1 }}>
            {multiSelect
              ? `${selectedIds.length} Items Selected`
              : kind ? `${kindLabel} Properties` : 'Properties'}
          </div>
          {kind && (
            <span style={{
              fontSize: 10, padding: '1px 6px',
              background: `${kindAccent}15`, color: kindAccent,
              border: `1px solid ${kindAccent}25`, borderRadius: 3, fontWeight: 700,
            }}>{kindLabel.toUpperCase()}</span>
          )}
        </div>
        {multiSelect && (
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3, display: 'flex', gap: 6 }}>
            {multiRooms > 0 && <span>{multiRooms} room{multiRooms > 1 ? 's' : ''}</span>}
            {multiFurn  > 0 && <span>{multiFurn} asset{multiFurn > 1 ? 's' : ''}</span>}
            {multiLocked > 0 && <span style={{ color: C.warning }}>· {multiLocked} locked</span>}
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>

        {/* ── EMPTY STATE ──────────────────────────────────── */}
        {!multiSelect && !item && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '60%',
            color: C.textMuted, textAlign: 'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: C.sectionBg, border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, marginBottom: 12,
            }}>↖</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 4 }}>
              Nothing selected
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
              Click a room, asset or door<br />to view its properties
            </div>
          </div>
        )}

        {/* ── MULTI-SELECT ─────────────────────────────────── */}
        {multiSelect && (
          <>
            <div style={{
              padding: '9px 11px', borderRadius: 6, marginBottom: 12,
              background: C.accentBg, border: `1px solid rgba(14,165,233,0.2)`,
              fontSize: 11, color: C.accentDark, lineHeight: 1.6,
            }}>
              Shift+click to add/remove items<br />
              Drag any selected item to move all
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button onClick={lockSelected} style={{
                flex: 1, padding: '7px 6px', borderRadius: 6, cursor: 'pointer',
                fontSize: 11, fontWeight: 600,
                background: 'rgba(245,158,11,0.08)',
                color: C.warning, border: '1px solid rgba(245,158,11,0.25)',
              }}>🔒 Lock All</button>
              <button onClick={unlockSelected} style={{
                flex: 1, padding: '7px 6px', borderRadius: 6, cursor: 'pointer',
                fontSize: 11, fontWeight: 600,
                background: C.sectionBg, color: C.textSub, border: `1px solid ${C.border}`,
              }}>🔓 Unlock</button>
            </div>

            <button onClick={clearSelection} style={{
              width: '100%', padding: '7px', borderRadius: 6, marginBottom: 12,
              background: 'transparent', color: C.textSub,
              border: `1px solid ${C.border}`, cursor: 'pointer', fontSize: 11,
            }}>Deselect All</button>

            <div style={{ height: 1, background: C.border, margin: '4px 0 12px' }} />

            {allLocked
              ? <div style={{
                  padding: '8px 12px', borderRadius: 6, textAlign: 'center',
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                  fontSize: 11, color: C.warning,
                }}>All selected items are locked</div>
              : <button onClick={deleteSelected} style={{
                  width: '100%', padding: '8px', borderRadius: 6, cursor: 'pointer',
                  fontSize: 12, fontWeight: 500,
                  background: C.dangerBg, color: C.danger,
                  border: `1px solid rgba(239,68,68,0.25)`,
                  transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.dangerBg; }}>
                Delete Non-Locked ({selectedIds.length - multiLocked})
              </button>
            }
          </>
        )}

        {/* ── SINGLE ITEM ──────────────────────────────────── */}
        {!multiSelect && item && (
          <>
            <LockBtn locked={isLocked} onToggle={() => toggleLock(selectedId)} />

            {/* ── ROOM ──────────────────────────────────────── */}
            {kind === 'room' && !isLocked && (
              <>
                <Section label="Identity" accent="#8B5CF6">
                  <Field label="Name">
                    <input value={item.name || ''} onChange={(e) => updateRoom(selectedId, { name: e.target.value })} style={inp} />
                  </Field>
                  <Field label="Zone ID">
                    <input value={item.zoneId || ''} placeholder="e.g. ZONE-A"
                      onChange={(e) => updateRoom(selectedId, { zoneId: e.target.value })}
                      style={{ ...inp, fontFamily: 'monospace', fontSize: 11 }} />
                  </Field>
                </Section>

                <Section label="Dimensions" accent="#8B5CF6">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Field label="Width m">
                      <input type="number" step="0.25" min="0.5" value={item.width.toFixed(2)}
                        onChange={(e) => numChange(updateRoom, 'width', e)} style={inp} />
                    </Field>
                    <Field label="Length m">
                      <input type="number" step="0.25" min="0.5" value={item.height.toFixed(2)}
                        onChange={(e) => numChange(updateRoom, 'height', e)} style={inp} />
                    </Field>
                    <Field label="X m">
                      <input type="number" step="0.25" value={item.x.toFixed(2)}
                        onChange={(e) => numChange(updateRoom, 'x', e)} style={inp} />
                    </Field>
                    <Field label="Y m">
                      <input type="number" step="0.25" value={item.y.toFixed(2)}
                        onChange={(e) => numChange(updateRoom, 'y', e)} style={inp} />
                    </Field>
                  </div>
                </Section>

                <Section label="Appearance" accent="#8B5CF6">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <Field label="Floor">
                      <input type="color" value={item.floorColor}
                        onChange={(e) => updateRoom(selectedId, { floorColor: e.target.value })} style={colorInp} />
                    </Field>
                    <Field label="Wall">
                      <input type="color" value={item.wallColor}
                        onChange={(e) => updateRoom(selectedId, { wallColor: e.target.value })} style={colorInp} />
                    </Field>
                  </div>
                  <Field label="Wall Thick m">
                    <input type="number" step="0.05" min="0.05" max="0.5"
                      value={(item.wallThickness || 0.05).toFixed(2)}
                      onChange={(e) => numChange(updateRoom, 'wallThickness', e)} style={inp} />
                  </Field>
                  <Field label="Wall Height m">
                    <input type="number" step="0.1" min="1.5" max="6.0"
                      value={(item.wallHeight || 1.8).toFixed(1)}
                      onChange={(e) => numChange(updateRoom, 'wallHeight', e)} style={inp} />
                  </Field>
                </Section>
              </>
            )}

            {/* Room area card */}
            {kind === 'room' && (
              <div style={{
                padding: '10px 12px', borderRadius: 6, marginBottom: 12,
                background: C.accentBg, border: `1px solid rgba(14,165,233,0.2)`,
              }}>
                <div style={{ fontSize: 10, color: C.accentDark, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.5px' }}>Floor Area</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.accentDark, marginTop: 2,
                  fontVariantNumeric: 'tabular-nums' }}>
                  {(item.width * item.height).toFixed(2)} m²
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>
                  {item.width.toFixed(2)} × {item.height.toFixed(2)} m
                </div>
              </div>
            )}

            {/* ── FURNITURE / ASSET ─────────────────────────── */}
            {kind === 'furniture' && !isLocked && (
              <>
                <Section label="Identity" accent={C.accent}>
                  <Field label="Name">
                    <input value={item.name || ''} onChange={(e) => updateFurniture(selectedId, { name: e.target.value })} style={inp} />
                  </Field>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 8px', borderRadius: 5,
                    background: C.sectionBg, border: `1px solid ${C.border}`,
                    marginBottom: 10,
                  }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3,
                      background: item.color || '#888', flexShrink: 0,
                      border: '1px solid rgba(0,0,0,0.1)' }} />
                    <span style={{ fontSize: 11, color: C.textSub, flex: 1 }}>{item.type}</span>
                    <input type="color" value={item.color || '#C8A080'}
                      onChange={(e) => updateFurniture(selectedId, { color: e.target.value })}
                      style={{ width: 28, height: 22, padding: '1px 2px',
                        border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer' }} />
                  </div>
                </Section>

                <Section label="Dimensions" accent={C.accent}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <Field label="Width m">
                      <input type="number" step="0.25" min="0.25" value={item.width.toFixed(2)}
                        onChange={(e) => numChange(updateFurniture, 'width', e)} style={inp} />
                    </Field>
                    <Field label="Depth m">
                      <input type="number" step="0.25" min="0.25" value={item.depth.toFixed(2)}
                        onChange={(e) => numChange(updateFurniture, 'depth', e)} style={inp} />
                    </Field>
                    <Field label="Height m">
                      <input type="number" step="0.05" min="0.05" value={(item.height3d || 0.8).toFixed(2)}
                        onChange={(e) => numChange(updateFurniture, 'height3d', e)} style={inp} />
                    </Field>
                    <Field label="Rotation °">
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input type="number" step="15" min="0" max="345" value={item.rotation || 0}
                          onChange={(e) => numChange(updateFurniture, 'rotation', e)}
                          style={{ ...inp, flex: 1 }} />
                        <button onClick={() => rotateSelectedFurniture(90)}
                          style={{ padding: '4px 8px', border: `1px solid ${C.border}`,
                            borderRadius: 5, background: C.sectionBg, cursor: 'pointer',
                            fontSize: 15, color: C.text, flexShrink: 0 }}>↻</button>
                      </div>
                    </Field>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Field label="X m">
                      <input type="number" step="0.25" value={item.x.toFixed(2)}
                        onChange={(e) => numChange(updateFurniture, 'x', e)} style={inp} />
                    </Field>
                    <Field label="Y m">
                      <input type="number" step="0.25" value={item.y.toFixed(2)}
                        onChange={(e) => numChange(updateFurniture, 'y', e)} style={inp} />
                    </Field>
                  </div>
                </Section>

                {/* ── DCIM Mapping section ────────────────────── */}
                <Section label="DCIM Mapping" accent="#0EA5E9" badge="DCIM">
                  <Field label="Asset ID">
                    <input value={item.assetId || ''} placeholder="e.g. RACK-001"
                      onChange={(e) => updateFurniture(selectedId, { assetId: e.target.value })}
                      style={{ ...inp, fontFamily: 'monospace', fontSize: 11,
                        background: C.sectionBg, fontWeight: 600, color: C.accentDark }} />
                  </Field>

                  {/* Sensors */}
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted,
                      textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sensors</span>
                    <span style={{
                      fontSize: 10, padding: '1px 6px',
                      background: C.sectionBg, color: C.textSub,
                      border: `1px solid ${C.border}`, borderRadius: 10, fontWeight: 600,
                    }}>{(item.sensors || []).length}</span>
                  </div>

                  {(item.sensors || []).map((sensor, idx) => {
                    const v = sensor.value ?? 0;
                    const vc = v < 40 ? '#16A34A' : v < 65 ? '#D97706' : v < 80 ? '#EA580C' : '#DC2626';
                    return (
                      <div key={idx} style={{
                        marginBottom: 8, borderRadius: 6, overflow: 'hidden',
                        border: `1px solid ${C.border}`,
                        background: C.panel,
                      }}>
                        {/* Sensor header bar */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '5px 8px',
                          background: C.sectionBg,
                          borderBottom: `1px solid ${C.border}`,
                        }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: vc, boxShadow: `0 0 5px ${vc}`,
                            flexShrink: 0,
                          }} />
                          <input value={sensor.sensorId || ''} placeholder="Sensor ID"
                            onChange={(e) => {
                              const sensors = [...(item.sensors || [])];
                              sensors[idx] = { ...sensors[idx], sensorId: e.target.value };
                              updateFurniture(selectedId, { sensors });
                            }}
                            style={{
                              flex: 1, border: 'none', background: 'transparent',
                              fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
                              color: C.text, outline: 'none', minWidth: 0,
                            }} />
                          <select value={sensor.type || 'temperature'}
                            onChange={(e) => {
                              const sensors = [...(item.sensors || [])];
                              sensors[idx] = { ...sensors[idx], type: e.target.value,
                                unit: SENSOR_UNITS[e.target.value] ?? '' };
                              updateFurniture(selectedId, { sensors });
                            }}
                            style={{
                              border: 'none', background: 'transparent',
                              fontSize: 10, color: C.textSub, cursor: 'pointer',
                              outline: 'none', flexShrink: 0,
                            }}>
                            {SENSOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <button onClick={() => {
                            const sensors = (item.sensors || []).filter((_, i) => i !== idx);
                            updateFurniture(selectedId, { sensors });
                          }} style={{
                            width: 18, height: 18, border: 'none', borderRadius: 3,
                            background: 'transparent', color: C.textMuted, cursor: 'pointer',
                            fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>✕</button>
                        </div>

                        {/* Value + direction */}
                        <div style={{ padding: '7px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <input type="range" min={0} max={100} step={1} value={v}
                              onChange={(e) => {
                                const sensors = [...(item.sensors || [])];
                                sensors[idx] = { ...sensors[idx], value: Number(e.target.value) };
                                updateFurniture(selectedId, { sensors });
                              }}
                              style={{ flex: 1, accentColor: vc }} />
                            <span style={{
                              fontSize: 12, fontWeight: 700, color: vc,
                              minWidth: 38, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                            }}>{v}{sensor.unit || ''}</span>
                          </div>

                          {/* Direction */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 10, color: C.textMuted, flexShrink: 0, minWidth: 46 }}>
                              Direction
                            </span>
                            <div style={{ display: 'flex', gap: 2, flex: 1 }}>
                              {[{ l: '↑', v: 0 }, { l: '→', v: 90 }, { l: '↓', v: 180 }, { l: '←', v: 270 }].map(({ l, v: dv }) => {
                                const act = (sensor.direction ?? (item.rotation ?? 0)) === dv;
                                return (
                                  <button key={dv} onClick={() => {
                                    const sensors = [...(item.sensors || [])];
                                    sensors[idx] = { ...sensors[idx], direction: dv };
                                    updateFurniture(selectedId, { sensors });
                                  }} style={{
                                    flex: 1, padding: '3px 0', fontSize: 12,
                                    border: `1px solid ${act ? C.accentDark : C.border}`,
                                    borderRadius: 4, cursor: 'pointer',
                                    background: act ? C.accentBg : 'transparent',
                                    color: act ? C.accentDark : C.textSub,
                                    fontWeight: act ? 700 : 400,
                                  }}>{l}</button>
                                );
                              })}
                            </div>
                            <input type="number" min={0} max={359} step={15}
                              value={sensor.direction ?? (item.rotation ?? 0)}
                              onChange={(e) => {
                                const sensors = [...(item.sensors || [])];
                                sensors[idx] = { ...sensors[idx], direction: Number(e.target.value) % 360 };
                                updateFurniture(selectedId, { sensors });
                              }}
                              style={{ ...inp, width: 44, fontSize: 11, padding: '3px 5px',
                                flexShrink: 0, textAlign: 'center' }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button onClick={() => {
                    const sensors = [...(item.sensors || []),
                      { sensorId: '', type: 'temperature', unit: '°C', value: 0 }];
                    updateFurniture(selectedId, { sensors });
                  }} style={{
                    width: '100%', padding: '7px',
                    border: `1px dashed rgba(14,165,233,0.4)`,
                    borderRadius: 6, background: C.accentBg,
                    color: C.accentDark, cursor: 'pointer', fontSize: 11,
                    fontWeight: 600, letterSpacing: '0.2px', marginBottom: 2,
                  }}>+ Add Sensor</button>
                </Section>
              </>
            )}

            {/* ── DOOR ──────────────────────────────────────── */}
            {kind === 'door' && !isLocked && (
              <>
                <div style={{
                  padding: '7px 10px', borderRadius: 6, marginBottom: 12,
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.22)',
                  fontSize: 11, color: '#92400E',
                  display: 'flex', gap: 8,
                }}>
                  <span>Wall: <strong>{item.wall}</strong></span>
                  <span>·</span>
                  <span>Offset: <strong>{item.offset.toFixed(2)} m</strong></span>
                </div>

                <Section label="Door Settings" accent="#F59E0B">
                  <Field label="Width m">
                    <input type="number" step="0.05" min="0.5" max="2.5"
                      value={item.width.toFixed(2)}
                      onChange={(e) => numChange(updateDoor, 'width', e)} style={inp} />
                  </Field>
                  <Field label="Offset m">
                    <input type="number" step="0.25" min="0"
                      value={item.offset.toFixed(2)}
                      onChange={(e) => numChange(updateDoor, 'offset', e)} style={inp} />
                  </Field>
                  <Field label="Open Angle">
                    <AngleSlider value={item.openAngle} onChange={(v) => updateDoor(selectedId, { openAngle: v })} />
                  </Field>
                  <Field label="Hinge Side">
                    <Seg value={item.hingeSide}
                      options={[{ val: 'left', label: '← Left' }, { val: 'right', label: 'Right →' }]}
                      onChange={(v) => updateDoor(selectedId, { hingeSide: v })} />
                  </Field>
                  <Field label="Swing">
                    <Seg value={item.swingIn ? 'in' : 'out'}
                      options={[{ val: 'in', label: '↓ Inward' }, { val: 'out', label: '↑ Outward' }]}
                      onChange={(v) => updateDoor(selectedId, { swingIn: v === 'in' })} />
                  </Field>
                </Section>
              </>
            )}

            {/* Locked overlay */}
            {isLocked && (
              <div style={{
                padding: '10px 12px', borderRadius: 6, marginBottom: 12,
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.2)',
                fontSize: 11, color: '#92400E', textAlign: 'center', lineHeight: 1.7,
              }}>
                Item is locked.<br />
                <span style={{ color: C.textMuted }}>Unlock above to edit properties.</span>
              </div>
            )}

            {/* Delete button */}
            <button onClick={deleteSelected} disabled={isLocked} style={{
              width: '100%', padding: '8px', borderRadius: 6, cursor: isLocked ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 500,
              background: isLocked ? C.sectionBg : C.dangerBg,
              color: isLocked ? C.textMuted : C.danger,
              border: `1px solid ${isLocked ? C.border : 'rgba(239,68,68,0.25)'}`,
              transition: 'all 0.1s',
            }}
              onMouseEnter={(e) => { if (!isLocked) e.currentTarget.style.background = 'rgba(239,68,68,0.14)'; }}
              onMouseLeave={(e) => { if (!isLocked) e.currentTarget.style.background = isLocked ? C.sectionBg : C.dangerBg; }}>
              {isLocked ? '🔒 Locked — cannot delete' : `Delete ${kindLabel}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FloorPlanProperties;
