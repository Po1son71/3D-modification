import React, { useState, useRef, useLayoutEffect } from 'react';
import useFloorPlannerStore, { CABLE_TYPES } from '../../store/floorPlannerStore';
import { useFloorTheme } from './floorPlanTheme';

// ── Topology diagram ──────────────────────────────────────────────────────────
const TopologyDiagram = ({ selectedId, selectedCables, furniture, onRename, T }) => {
  const containerRef = useRef(null);
  const [W, setW] = useState(400);

  useLayoutEffect(() => {
    if (containerRef.current) setW(containerRef.current.offsetWidth);
  }, []);

  const getName = (id) => {
    const f = furniture.find((f) => f.id === id);
    return f ? (f.name || f.type) : '—';
  };

  const n       = selectedCables.length;
  const H       = Math.max(90, n * 46 + 20);
  const BOX_W   = 76, BOX_H = 28, R = 5;
  // Fix the diagram to a compact width regardless of panel width
  const DIAG_W  = Math.min(W, 320);
  const offsetX = (W - DIAG_W) / 2; // center the diagram
  const SRC_CX  = offsetX + BOX_W / 2 + 8;
  const SRC_CY  = H / 2;
  const TGT_CX  = offsetX + DIAG_W - BOX_W / 2 - 8;
  const rowH    = H / Math.max(n, 1);

  // Connection points
  const srcPt  = { x: SRC_CX + BOX_W / 2, y: SRC_CY };

  const targets = selectedCables.map((cable, i) => {
    const cy = rowH * i + rowH / 2;
    return {
      cable,
      cx: TGT_CX,
      cy,
      connPt: { x: TGT_CX - BOX_W / 2, y: cy },
      otherId: cable.fromId === selectedId ? cable.toId : cable.fromId,
    };
  });

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: H, overflow: 'visible' }}>
      <svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
        {/* Lines + wire labels */}
        {targets.map(({ cable, connPt, cy, otherId, dir }) => {
          const mx = (srcPt.x + connPt.x) / 2;
          const my = (srcPt.y + connPt.y) / 2;
          const typeInfo = CABLE_TYPES[cable.type] || CABLE_TYPES.custom;
          const label = cable.label || typeInfo.label;

          // Angle for label rotation
          const angle = Math.atan2(connPt.y - srcPt.y, connPt.x - srcPt.x) * 180 / Math.PI;
          const flip  = angle > 90 || angle < -90;

          return (
            <g key={cable.id}>
              <line
                x1={srcPt.x} y1={srcPt.y}
                x2={connPt.x} y2={connPt.y}
                stroke={cable.color} strokeWidth={1.8}
                strokeLinecap="round"
              />
              {/* Wire name — click to rename */}
              <g
                transform={`translate(${mx},${my}) rotate(${flip ? angle + 180 : angle})`}
                style={{ cursor: 'pointer' }}
                onClick={() => onRename(cable.id)}
              >
                <rect
                  x={-label.length * 3.2} y={-10}
                  width={label.length * 6.4} height={14}
                  rx={3} fill={T.panel} opacity={0.85}
                />
                <text
                  x={0} y={1}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={9} fontWeight={600}
                  fill={cable.color} fontFamily="'Inter','Segoe UI',sans-serif"
                >
                  {label}
                </text>
              </g>
              {/* Dot at connection points */}
              <circle cx={srcPt.x} cy={srcPt.y} r={3.5} fill={cable.color} />
              <circle cx={connPt.x} cy={connPt.y} r={3.5} fill={cable.color} />
            </g>
          );
        })}

        {/* Source box */}
        <rect
          x={SRC_CX - BOX_W / 2} y={SRC_CY - BOX_H / 2}
          width={BOX_W} height={BOX_H} rx={R}
          fill={T.accentBg} stroke={T.accentDark} strokeWidth={1.5}
        />
        <text
          x={SRC_CX} y={SRC_CY}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={9} fontWeight={700} fill={T.accentDark}
          fontFamily="'Inter','Segoe UI',sans-serif"
        >
          {getName(selectedId).length > 11
            ? getName(selectedId).slice(0, 10) + '…'
            : getName(selectedId)}
        </text>

        {/* Target boxes */}
        {targets.map(({ cable, cx, cy, otherId }) => (
          <g key={cable.id + '-tgt'}>
            <rect
              x={cx - BOX_W / 2} y={cy - BOX_H / 2}
              width={BOX_W} height={BOX_H} rx={R}
              fill={`${cable.color}14`}
              stroke={cable.color} strokeWidth={1.2}
            />
            <text
              x={cx} y={cy}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={9} fontWeight={600} fill={cable.color}
              fontFamily="'Inter','Segoe UI',sans-serif"
            >
              {getName(otherId).length > 11
                ? getName(otherId).slice(0, 10) + '…'
                : getName(otherId)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// ── Rename modal (inline, positioned below the panel header) ─────────────────
const RenameRow = ({ cable, onSave, onCancel, T }) => {
  const [val, setVal] = useState(cable.label || '');
  const ref = useRef(null);
  useLayoutEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);

  const commit = () => onSave(cable.id, val.trim());

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '5px 8px', marginBottom: 4, borderRadius: 5,
      background: T.panelHeader, border: `1px solid ${cable.color}55`,
      borderLeft: `3px solid ${cable.color}`,
    }}>
      <span style={{
        fontSize: 9, fontWeight: 700, padding: '1px 5px',
        background: `${cable.color}18`, color: cable.color,
        border: `1px solid ${cable.color}33`, borderRadius: 3,
        textTransform: 'uppercase', flexShrink: 0,
      }}>{(CABLE_TYPES[cable.type] || CABLE_TYPES.custom).label}</span>
      <input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onCancel(); }}
        onBlur={commit}
        placeholder="Wire name…"
        style={{
          flex: 1, fontSize: 11, padding: '3px 6px',
          border: `1px solid ${cable.color}44`, borderRadius: 4,
          background: T.inputBg, color: T.inputText, outline: 'none',
        }}
      />
      <button onClick={commit} style={{
        padding: '2px 7px', borderRadius: 4, border: 'none',
        background: cable.color, color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600,
      }}>✓</button>
    </div>
  );
};

// ── Main panel ────────────────────────────────────────────────────────────────
const CablePanel = ({ cableConnect, setCableConnect }) => {
  const T = useFloorTheme();
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState(null);

  const { cables, furniture, selectedIds, deleteCable, updateCable } = useFloorPlannerStore();

  const activeType = cableConnect.type;
  const connecting = cableConnect.active;
  const selectedId = selectedIds[0] ?? null;

  const selectedCables = selectedId
    ? cables.filter((c) => c.fromId === selectedId || c.toId === selectedId)
    : [];

  const renamingCable = renamingId ? cables.find((c) => c.id === renamingId) : null;

  const startConnect = (type) => { setCableConnect({ active: true, type }); setOpen(true); };
  const stopConnect  = ()      => setCableConnect({ active: false, type: activeType });

  const handleRename = (id) => setRenamingId(id);
  const saveRename   = (id, val) => {
    updateCable(id, { label: val });
    setRenamingId(null);
  };

  return (
    // position:relative so the absolute popup is anchored here.
    // height is always exactly 34px — the canvas above never resizes.
    <div style={{
      flexShrink: 0, position: 'relative',
      height: 34, borderTop: `1px solid ${T.border}`,
      background: T.panel, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      zIndex: 50,
    }}>

      {/* ── Header — always 34 px ─────────────────────────────────────────── */}
      <div onClick={() => setOpen((o) => !o)} style={{
        height: 34, display: 'flex', alignItems: 'center',
        padding: '0 14px', cursor: 'pointer', gap: 10, userSelect: 'none',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: T.textSub,
          textTransform: 'uppercase', letterSpacing: '0.6px', flex: 1,
        }}>Cable Connections</span>

        {cables.length > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 6px',
            background: 'rgba(14,165,233,0.12)', color: T.accentDark,
            border: `1px solid rgba(14,165,233,0.25)`, borderRadius: 3,
          }}>{cables.length}</span>
        )}
        {connecting && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 7px',
            background: `${CABLE_TYPES[activeType]?.color}22`,
            color: CABLE_TYPES[activeType]?.color,
            border: `1px solid ${CABLE_TYPES[activeType]?.color}44`, borderRadius: 3,
          }}>{CABLE_TYPES[activeType]?.label} — drag to connect</span>
        )}
        <span style={{ fontSize: 12, color: T.textMuted }}>{open ? '▾' : '▸'}</span>
      </div>

      {/* ── Expanded body — floats UPWARD over the canvas, never pushes layout ── */}
      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, right: 0,
          background: T.panel,
          borderTop: `1px solid ${T.border}`,
          borderBottom: `1px solid ${T.border}`,
          boxShadow: '0 -6px 20px rgba(0,0,0,0.12)',
          maxHeight: 360, overflowY: 'auto',
          padding: '8px 12px 10px',
          zIndex: 50,
        }}>

          {/* Cable type draw buttons */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
            {Object.entries(CABLE_TYPES).map(([key, { label, color }]) => {
              const isActive = activeType === key && connecting;
              return (
                <button key={key} onClick={() => startConnect(key)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 9px', borderRadius: 6, cursor: 'pointer',
                  fontSize: 11, fontWeight: isActive ? 700 : 500,
                  border: `1px solid ${isActive ? color : T.border}`,
                  background: isActive ? `${color}18` : T.panelHeader,
                  color: isActive ? color : T.textSub, transition: 'all 0.1s',
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0,
                    boxShadow: isActive ? `0 0 5px ${color}` : 'none',
                  }} />
                  {label}
                </button>
              );
            })}
            {connecting && (
              <button onClick={stopConnect} style={{
                padding: '4px 9px', borderRadius: 6, cursor: 'pointer',
                fontSize: 11, fontWeight: 600,
                border: `1px solid rgba(239,68,68,0.4)`,
                background: 'rgba(239,68,68,0.08)', color: '#EF4444',
              }}>✕ Cancel</button>
            )}
          </div>

          <div style={{ height: 1, background: T.border, margin: '4px 0 8px' }} />

          {/* ── Topology / connection details ──────────────────────────────── */}
          {!selectedId ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 0', gap: 6,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: T.panelHeader, border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: T.textMuted,
              }}>↖</div>
              <span style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', lineHeight: 1.5 }}>
                Select a component to<br />see its connections
              </span>
            </div>

          ) : selectedCables.length === 0 ? (
            <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', padding: '8px 0' }}>
              No cables connected to <strong style={{ color: T.textSub }}>
                {(furniture.find((f) => f.id === selectedId)?.name) || selectedId.slice(0, 8)}
              </strong>
            </div>

          ) : (
            <>
              {/* Topology diagram */}
              <TopologyDiagram
                selectedId={selectedId}
                selectedCables={selectedCables}
                furniture={furniture}
                onRename={handleRename}
                T={T}
              />

              {/* Rename row (appears below diagram when a wire is clicked) */}
              {renamingCable && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, fontWeight: 600 }}>
                    RENAME WIRE
                  </div>
                  <RenameRow
                    cable={renamingCable}
                    onSave={saveRename}
                    onCancel={() => setRenamingId(null)}
                    T={T}
                  />
                </div>
              )}

              {/* Hint */}
              <div style={{
                fontSize: 9, color: T.textMuted, marginTop: 6,
                textAlign: 'center', opacity: 0.7,
              }}>
                Click a wire label to rename · ✕ to delete
              </div>

              {/* Delete buttons list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
                {selectedCables.map((cable) => {
                  const typeInfo = CABLE_TYPES[cable.type] || CABLE_TYPES.custom;
                  const otherId  = cable.fromId === selectedId ? cable.toId : cable.fromId;
                  const otherName = (furniture.find((f) => f.id === otherId)?.name) || '—';
                  const label = cable.label || typeInfo.label;
                  return (
                    <div key={cable.id} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 7px', borderRadius: 4,
                      background: T.panelHeader,
                      border: `1px solid ${cable.color}22`,
                      borderLeft: `3px solid ${cable.color}`,
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: cable.color, flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: 10, color: cable.color, fontWeight: 700, flexShrink: 0,
                      }}>{label}</span>
                      <span style={{ fontSize: 10, color: T.textMuted, flexShrink: 0 }}>→</span>
                      <span style={{
                        fontSize: 10, color: T.text, flex: 1,
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      }}>{otherName}</span>
                      <button
                        onClick={() => { if (renamingId === cable.id) setRenamingId(null); deleteCable(cable.id); }}
                        style={{
                          width: 16, height: 16, border: 'none', borderRadius: 3,
                          background: 'transparent', color: T.textMuted,
                          cursor: 'pointer', fontSize: 10, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CablePanel;
