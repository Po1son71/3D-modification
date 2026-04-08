import React, { useRef, useCallback } from 'react';
import FloorPlanEditor from '../components/FloorPlanner/FloorPlanEditor';
import FloorPlan3DScene from '../components/FloorPlanner/FloorPlan3DScene';
import FurnitureCatalog from '../components/FloorPlanner/FurnitureCatalog';
import FloorPlanProperties from '../components/FloorPlanner/FloorPlanProperties';
import useFloorPlannerStore from '../store/floorPlannerStore';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:        '#0D1B2E',
  navyMid:     '#162236',
  accent:      '#0EA5E9',
  accentDark:  '#0284C7',
  accentBg:    'rgba(14,165,233,0.15)',
  white:       '#FFFFFF',
  bg:          '#EEF2F7',
  panelBg:     '#FFFFFF',
  border:      '#E2E8F0',
  text:        '#1E293B',
  textSub:     '#64748B',
  textMuted:   '#94A3B8',
  danger:      '#EF4444',
  dangerBg:    'rgba(239,68,68,0.1)',
  success:     '#22C55E',
  warning:     '#F59E0B',
  toolHover:   '#F1F5F9',
};

// ── Light-mode action button ──────────────────────────────────────────────────
const LightBtn = ({ onClick, title, children }) => (
  <button onClick={onClick} title={title} style={{
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 11px', borderRadius: 6,
    border: `1px solid ${C.border}`,
    background: 'transparent', color: C.textSub,
    cursor: 'pointer', fontSize: 12, fontWeight: 400,
    transition: 'all 0.1s', whiteSpace: 'nowrap',
  }}
    onMouseEnter={(e) => { e.currentTarget.style.background = C.toolHover; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
  >{children}</button>
);

// ── Toast notification ────────────────────────────────────────────────────────
const Toast = ({ msg }) => {
  const prev = useRef(null);
  if (msg) prev.current = msg;
  const text = msg?.text ?? prev.current?.text ?? '';
  return (
    <div style={{
      position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
      background: C.navy, color: C.white,
      padding: '8px 18px', borderRadius: 6,
      fontSize: 12, fontWeight: 500, letterSpacing: '0.3px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      pointerEvents: 'none', zIndex: 9999,
      opacity: msg ? 1 : 0,
      transition: msg ? 'opacity 0.1s' : 'opacity 0.35s 0.1s',
      border: `1px solid rgba(255,255,255,0.1)`,
    }}>
      {text}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const FloorPlannerPage = () => {
  const {
    activeTool, activeFurnitureDef, viewMode,
    selectedIds, lockedIds, clipboard,
    showHeatmap,
    setActiveTool, setViewMode,
    undo, redo,
    lockSelected, unlockSelected,
    copySelected, pasteClipboard,
    exportLayout, importLayout,
    toggleHeatmap,
    rooms, furniture,
    undoMsg,
  } = useFloorPlannerStore();

  const jsonInputRef = useRef(null);

  const handleLoadJson = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => importLayout(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  }, [importLayout]);

  const selCount    = selectedIds.length;
  const anySelected = selCount > 0;
  const anyLocked   = selectedIds.some((id) => lockedIds.includes(id));
  const anyUnlocked = selectedIds.some((id) => !lockedIds.includes(id));
  const totalArea   = rooms.reduce((a, r) => a + r.width * r.height, 0);
  const sensorCount = furniture.reduce((a, f) => a + (f.sensors?.length || 0), 0);

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      background: C.bg,
    }}>

      {/* ── Top header bar ───────────────────────────────────────── */}
      <div style={{
        height: 50, background: '#FFFFFF',
        display: 'flex', alignItems: 'center',
        padding: '0 14px', gap: 0,
        flexShrink: 0,
        borderBottom: `1px solid ${C.border}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        zIndex: 20,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 20,
          paddingRight: 20, borderRight: `1px solid ${C.border}` }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 900, color: '#fff',
            flexShrink: 0,
          }}>D</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '0.3px' }}>
              DCIM Studio
            </div>
            <div style={{ fontSize: 9, color: C.textMuted, marginTop: -1, letterSpacing: '0.6px',
              textTransform: 'uppercase' }}>
              Floor Plan Editor
            </div>
          </div>
        </div>

        {/* Tool group */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          background: C.toolHover, borderRadius: 8, padding: '3px',
          border: `1px solid ${C.border}`,
        }}>
          {[
            { id: 'select', label: 'Select', icon: '↖', title: 'Select / move (S)' },
            { id: 'room',   label: 'Room',   icon: '⬜', title: 'Draw room' },
            { id: 'door',   label: 'Door',   icon: '🚪', title: 'Place door' },
          ].map(({ id, label, icon, title }) => (
            <button key={id} onClick={() => setActiveTool(id)} title={title} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6,
              border: activeTool === id ? `1px solid ${C.accentDark}` : '1px solid transparent',
              background: activeTool === id ? '#fff' : 'transparent',
              color: activeTool === id ? C.accentDark : C.textSub,
              cursor: 'pointer', fontSize: 12,
              fontWeight: activeTool === id ? 600 : 400,
              boxShadow: activeTool === id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.1s',
            }}
              onMouseEnter={(e) => { if (activeTool !== id) e.currentTarget.style.background = '#fff'; }}
              onMouseLeave={(e) => { if (activeTool !== id) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{icon}</span><span>{label}</span>
            </button>
          ))}

          {activeTool === 'furniture' && activeFurnitureDef && (
            <button onClick={() => setActiveTool('select')} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6,
              border: `1px solid ${C.accentDark}`,
              background: C.accentBg, color: C.accentDark,
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>
              <span>📦</span>
              <span>{activeFurnitureDef.name}</span>
              <span style={{ opacity: 0.5, fontSize: 10 }}>✕</span>
            </button>
          )}
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 22, background: C.border, margin: '0 12px' }} />

        {/* Undo / Redo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[
            { label: '↩', title: 'Undo (Ctrl+Z)', action: undo },
            { label: '↪', title: 'Redo (Ctrl+Y)', action: redo },
          ].map(({ label, title, action }) => (
            <button key={label} onClick={action} title={title} style={{
              width: 30, height: 30, borderRadius: 6,
              border: `1px solid transparent`,
              background: 'transparent', color: C.textSub,
              cursor: 'pointer', fontSize: 15, display: 'flex',
              alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.toolHover; e.currentTarget.style.border = `1px solid ${C.border}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.border = '1px solid transparent'; }}
            >{label}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 22, background: C.border, margin: '0 12px' }} />

        {/* 2D actions */}
        {viewMode === '2d' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <LightBtn onClick={copySelected} title="Copy (Ctrl+C)">⎘ Copy</LightBtn>
            <LightBtn onClick={pasteClipboard} title="Paste (Ctrl+V)">
              ⎙ Paste{clipboard?.length > 0 ? ` (${clipboard.length})` : ''}
            </LightBtn>

            {anySelected && anyUnlocked && (
              <LightBtn onClick={lockSelected} title="Lock selected">🔒</LightBtn>
            )}
            {anySelected && anyLocked && (
              <LightBtn onClick={unlockSelected} title="Unlock selected">🔓</LightBtn>
            )}

            <div style={{ width: 1, height: 22, background: C.border, margin: '0 8px' }} />

            <button onClick={toggleHeatmap} title="Toggle thermal heatmap" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 11px', borderRadius: 6,
              border: `1px solid ${showHeatmap ? C.accentDark : C.border}`,
              background: showHeatmap ? C.accentBg : 'transparent',
              color: showHeatmap ? C.accentDark : C.textSub,
              cursor: 'pointer', fontSize: 12, fontWeight: showHeatmap ? 600 : 400,
              transition: 'all 0.1s',
            }}
              onMouseEnter={(e) => { if (!showHeatmap) e.currentTarget.style.background = C.toolHover; }}
              onMouseLeave={(e) => { if (!showHeatmap) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>🌡</span><span>Thermal</span>
            </button>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Save / Load */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 10 }}>
          <button onClick={() => jsonInputRef.current?.click()} title="Import layout" style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 12,
            border: `1px solid ${C.border}`,
            background: 'transparent', color: C.textSub,
            cursor: 'pointer', transition: 'all 0.1s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.toolHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >📂 Import</button>
          <button onClick={exportLayout} title="Export layout" style={{
            padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            border: 'none',
            background: 'linear-gradient(135deg, #0EA5E9, #0369A1)',
            color: '#fff', cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(14,165,233,0.35)',
            transition: 'opacity 0.1s',
          }}>💾 Export</button>
          <input ref={jsonInputRef} type="file" accept=".json"
            style={{ display: 'none' }} onChange={handleLoadJson} />
        </div>

        {/* View toggle */}
        <div style={{
          display: 'flex', background: C.toolHover,
          borderRadius: 7, padding: 3, gap: 2,
          border: `1px solid ${C.border}`,
        }}>
          {['2D', '3D'].map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode.toLowerCase())} style={{
              padding: '4px 16px', borderRadius: 5, border: 'none',
              background: viewMode === mode.toLowerCase() ? '#fff' : 'transparent',
              boxShadow: viewMode === mode.toLowerCase() ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              color: viewMode === mode.toLowerCase() ? C.accentDark : C.textMuted,
              transition: 'all 0.15s',
            }}>{mode}</button>
          ))}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left panel */}
        {viewMode === '2d' && <FurnitureCatalog />}

        {/* Canvas */}
        <div style={{
          flex: 1, overflow: 'hidden', position: 'relative',
          background: C.bg,
        }}>
          {viewMode === '2d' ? <FloorPlanEditor /> : <FloorPlan3DScene />}

          {/* Canvas overlay: selection info */}
          {anySelected && viewMode === '2d' && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              background: C.navy, color: '#fff',
              padding: '5px 14px', borderRadius: 20,
              fontSize: 11, fontWeight: 500, letterSpacing: '0.3px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              pointerEvents: 'none',
            }}>
              <span style={{ color: C.accent }}>{selCount}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>selected</span>
              {anyLocked && <span style={{ color: C.warning }}>· 🔒 locked</span>}
            </div>
          )}
        </div>

        {/* Right panel */}
        <FloorPlanProperties />
      </div>

      {/* ── Status bar ───────────────────────────────────────────── */}
      <div style={{
        height: 28, background: C.navy,
        display: 'flex', alignItems: 'center',
        padding: '0 14px', gap: 10,
        flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusDot color={C.success} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.3px' }}>Ready</span>
        </div>

        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />

        <StatusItem label="Rooms" value={rooms.length} />
        <StatusItem label="Assets" value={furniture.length} />
        {rooms.length > 0 && <StatusItem label="Area" value={`${totalArea.toFixed(0)} m²`} />}
        {sensorCount > 0 && <StatusItem label="Sensors" value={sensorCount} color={C.accent} />}
        {lockedIds.length > 0 && <StatusItem label="Locked" value={lockedIds.length} color={C.warning} />}

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.5px' }}>
          DCIM STUDIO v1.0
        </span>
      </div>

      <Toast msg={undoMsg} />
    </div>
  );
};

const StatusDot = ({ color }) => (
  <div style={{
    width: 6, height: 6, borderRadius: '50%',
    background: color, boxShadow: `0 0 6px ${color}`,
  }} />
);

const StatusItem = ({ label, value, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.3px' }}>{label}</span>
    <span style={{ fontSize: 11, color: color || 'rgba(255,255,255,0.65)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
  </div>
);

export default FloorPlannerPage;
