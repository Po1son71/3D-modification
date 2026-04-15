import React, { useRef, useCallback, useState } from 'react';
import FloorPlanEditor from '../components/FloorPlanner/FloorPlanEditor';
import FloorPlan3DScene from '../components/FloorPlanner/FloorPlan3DScene';
import FurnitureCatalog from '../components/FloorPlanner/FurnitureCatalog';
import FloorPlanProperties from '../components/FloorPlanner/FloorPlanProperties';
import useFloorPlannerStore from '../store/floorPlannerStore';
import { useFloorTheme } from '../components/FloorPlanner/floorPlanTheme';

// ── Toast notification ────────────────────────────────────────────────────────
const Toast = ({ msg }) => {
  const prev = useRef(null);
  if (msg) prev.current = msg;
  const text = msg?.text ?? prev.current?.text ?? '';
  return (
    <div style={{
      position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
      background: '#0D1B2E', color: '#FFFFFF',
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

const StatusDot = ({ color }) => (
  <div style={{
    width: 6, height: 6, borderRadius: '50%',
    background: color, boxShadow: `0 0 6px ${color}`,
  }} />
);

const StatusItem = ({ label, value, color }) => {
  const T = useFloorTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 10, color: T.textMuted, letterSpacing: '0.3px' }}>{label}</span>
      <span style={{ fontSize: 11, color: color || T.textSub, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const FloorPlannerPage = () => {
  const T = useFloorTheme();
  const {
    activeTool, activeFurnitureDef, viewMode,
    selectedIds, lockedIds, clipboard,
    showHeatmap, gridSize,
    setActiveTool, setViewMode,
    undo, redo,
    isDark, setIsDark,
    lockSelected, unlockSelected,
    copySelected, pasteClipboard,
    exportLayout, importLayout, mergeLayout,
    toggleHeatmap, cycleGridSize,
    rooms, furniture,
    undoMsg,
  } = useFloorPlannerStore();

  const jsonInputRef = useRef(null);
  const [pendingJson, setPendingJson] = useState(null);

  const handleLoadJson = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPendingJson({ text: ev.target.result, name: file.name });
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const selCount    = selectedIds.length;
  const anySelected = selCount > 0;
  const anyLocked   = selectedIds.some((id) => lockedIds.includes(id));
  const anyUnlocked = selectedIds.some((id) => !lockedIds.includes(id));
  const totalArea   = rooms.reduce((a, r) => a + r.width * r.height, 0);
  const sensorCount = furniture.reduce((a, f) => a + (f.sensors?.length || 0), 0);

  /* ── shared micro-button style ─────────────────────────────────────────── */
  const lightBtn = {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 11px', borderRadius: 6,
    border: `1px solid ${T.border}`,
    background: 'transparent', color: T.textSub,
    cursor: 'pointer', fontSize: 12, fontWeight: 400,
    transition: 'all 0.1s', whiteSpace: 'nowrap',
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      background: T.bg,
    }}>

      {/* ── Top header bar ───────────────────────────────────────── */}
      <div style={{
        height: 50, background: T.panel,
        display: 'flex', alignItems: 'center',
        padding: '0 14px', gap: 0,
        flexShrink: 0,
        borderBottom: `1px solid ${T.border}`,
        boxShadow: T.isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
        zIndex: 20,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 20,
          paddingRight: 20, borderRight: `1px solid ${T.border}` }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 900, color: '#fff',
            flexShrink: 0,
          }}>D</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, letterSpacing: '0.3px' }}>
              DCIM Studio
            </div>
            <div style={{ fontSize: 9, color: T.textMuted, marginTop: -1, letterSpacing: '0.6px',
              textTransform: 'uppercase' }}>
              Floor Plan Editor
            </div>
          </div>
        </div>

        {/* Tool group */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          background: T.hoverStrong, borderRadius: 8, padding: '3px',
          border: `1px solid ${T.border}`,
        }}>
          {[
            { id: 'select', label: 'Select', icon: '↖', title: 'Select / move (S)' },
            { id: 'room',   label: 'Room',   icon: '⬜', title: 'Draw room' },
            { id: 'wall',   label: 'Wall',   icon: '▌', title: 'Draw freestanding wall' },
            { id: 'door',   label: 'Door',   icon: '🚪', title: 'Place door' },
          ].map(({ id, label, icon, title }) => (
            <button key={id} onClick={() => setActiveTool(id)} title={title} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6,
              border: activeTool === id ? `1px solid ${T.accentDark}` : '1px solid transparent',
              background: activeTool === id ? T.panel : 'transparent',
              color: activeTool === id ? T.accentDark : T.textSub,
              cursor: 'pointer', fontSize: 12,
              fontWeight: activeTool === id ? 600 : 400,
              boxShadow: activeTool === id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.1s',
            }}
              onMouseEnter={(e) => { if (activeTool !== id) e.currentTarget.style.background = T.panel; }}
              onMouseLeave={(e) => { if (activeTool !== id) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{icon}</span><span>{label}</span>
            </button>
          ))}

          {activeTool === 'furniture' && activeFurnitureDef && (
            <button onClick={() => setActiveTool('select')} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6,
              border: `1px solid ${T.accentDark}`,
              background: T.accentBg, color: T.accentDark,
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>
              <span>📦</span>
              <span>{activeFurnitureDef.name}</span>
              <span style={{ opacity: 0.5, fontSize: 10 }}>✕</span>
            </button>
          )}
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 22, background: T.border, margin: '0 12px' }} />

        {/* Undo / Redo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[
            { label: '↩', title: 'Undo (Ctrl+Z)', action: undo },
            { label: '↪', title: 'Redo (Ctrl+Y)', action: redo },
          ].map(({ label, title, action }) => (
            <button key={label} onClick={action} title={title} style={{
              width: 30, height: 30, borderRadius: 6,
              border: `1px solid transparent`,
              background: 'transparent', color: T.textSub,
              cursor: 'pointer', fontSize: 15, display: 'flex',
              alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.hoverStrong; e.currentTarget.style.border = `1px solid ${T.border}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.border = '1px solid transparent'; }}
            >{label}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 22, background: T.border, margin: '0 12px' }} />

        {/* 2D actions */}
        {viewMode === '2d' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <button onClick={copySelected} title="Copy (Ctrl+C)" style={lightBtn}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.hoverStrong; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>⎘ Copy</button>
            <button onClick={pasteClipboard} title="Paste (Ctrl+V)" style={lightBtn}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.hoverStrong; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              ⎙ Paste{clipboard?.length > 0 ? ` (${clipboard.length})` : ''}
            </button>

            {anySelected && anyUnlocked && (
              <button onClick={lockSelected} title="Lock selected" style={lightBtn}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.hoverStrong; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>🔒</button>
            )}
            {anySelected && anyLocked && (
              <button onClick={unlockSelected} title="Unlock selected" style={lightBtn}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.hoverStrong; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>🔓</button>
            )}

            <div style={{ width: 1, height: 22, background: T.border, margin: '0 8px' }} />

            <button onClick={toggleHeatmap} title="Toggle thermal heatmap" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 11px', borderRadius: 6,
              border: `1px solid ${showHeatmap ? T.accentDark : T.border}`,
              background: showHeatmap ? T.accentBg : 'transparent',
              color: showHeatmap ? T.accentDark : T.textSub,
              cursor: 'pointer', fontSize: 12, fontWeight: showHeatmap ? 600 : 400,
              transition: 'all 0.1s',
            }}
              onMouseEnter={(e) => { if (!showHeatmap) e.currentTarget.style.background = T.hoverStrong; }}
              onMouseLeave={(e) => { if (!showHeatmap) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>🌡</span><span>Thermal</span>
            </button>

            <button onClick={cycleGridSize} title="Cycle grid size" style={{
              ...lightBtn,
              fontWeight: 500,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.hoverStrong; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span>⊞</span>
              <span>Grid {gridSize < 0.1 ? `${gridSize * 100 | 0}cm` : gridSize < 1 ? `${gridSize * 100 | 0}cm` : '0.6m'}</span>
            </button>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Save / Load */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 10 }}>
          <button onClick={() => jsonInputRef.current?.click()} title="Import layout" style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 12,
            border: `1px solid ${T.border}`,
            background: 'transparent', color: T.textSub,
            cursor: 'pointer', transition: 'all 0.1s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.hoverStrong; }}
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

        {/* Light / Dark segmented toggle */}
        <div style={{
          display: 'flex',
          background: T.hoverStrong,
          borderRadius: 7, padding: 3, gap: 2,
          border: `1px solid ${T.border}`,
          marginRight: 8,
        }}>
          {[
            { key: 'light', label: '☀️ Light' },
            { key: 'dark',  label: '🌙 Dark' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setIsDark(key === 'dark')}
              style={{
                padding: '4px 11px', borderRadius: 5, border: 'none',
                background: isDark === (key === 'dark') ? T.panel : 'transparent',
                boxShadow: isDark === (key === 'dark') ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                color: isDark === (key === 'dark') ? T.accentDark : T.textMuted,
                transition: 'all 0.15s',
              }}
            >{label}</button>
          ))}
        </div>

        {/* View toggle (2D / 3D) */}
        <div style={{
          display: 'flex', background: T.hoverStrong,
          borderRadius: 7, padding: 3, gap: 2,
          border: `1px solid ${T.border}`,
        }}>
          {['2D', '3D'].map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode.toLowerCase())} style={{
              padding: '4px 16px', borderRadius: 5, border: 'none',
              background: viewMode === mode.toLowerCase() ? T.panel : 'transparent',
              boxShadow: viewMode === mode.toLowerCase() ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              color: viewMode === mode.toLowerCase() ? T.accentDark : T.textMuted,
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
          background: T.bg,
        }}>
          {viewMode === '2d' ? <FloorPlanEditor isDark={isDark} /> : <FloorPlan3DScene />}

          {/* Canvas overlay: selection info */}
          {anySelected && viewMode === '2d' && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              background: '#0D1B2E', color: '#fff',
              padding: '5px 14px', borderRadius: 20,
              fontSize: 11, fontWeight: 500, letterSpacing: '0.3px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              pointerEvents: 'none',
            }}>
              <span style={{ color: T.accent }}>{selCount}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>selected</span>
              {anyLocked && <span style={{ color: T.warning }}>· 🔒 locked</span>}
            </div>
          )}
        </div>

        {/* Right panel */}
        <FloorPlanProperties />
      </div>

      {/* ── Status bar ───────────────────────────────────────────── */}
      <div style={{
        height: 28, background: T.panel,
        display: 'flex', alignItems: 'center',
        padding: '0 14px', gap: 10,
        flexShrink: 0,
        borderTop: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusDot color={T.success} />
          <span style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.3px' }}>Ready</span>
        </div>

        <div style={{ width: 1, height: 14, background: T.border }} />

        <StatusItem label="Rooms" value={rooms.length} />
        <StatusItem label="Assets" value={furniture.length} />
        {rooms.length > 0 && <StatusItem label="Area" value={`${totalArea.toFixed(0)} m²`} />}
        {sensorCount > 0 && <StatusItem label="Sensors" value={sensorCount} color={T.accent} />}
        {lockedIds.length > 0 && <StatusItem label="Locked" value={lockedIds.length} color={T.warning} />}

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 10, color: T.textMuted, letterSpacing: '0.5px' }}>
          DCIM STUDIO v1.0
        </span>
      </div>

      <Toast msg={undoMsg} />

      {/* ── Import mode dialog ───────────────────────────────────── */}
      {pendingJson && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={() => setPendingJson(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.panel, borderRadius: 10,
              boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
              width: 380, padding: '24px 24px 20px',
              border: `1px solid ${T.border}`,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>
              Import Layout
            </div>
            <div style={{ fontSize: 12, color: T.textSub, marginBottom: 18 }}>
              <span style={{ fontWeight: 600, color: T.text }}>{pendingJson.name}</span>
              {' '}— how do you want to import?
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <button
                onClick={() => { mergeLayout(pendingJson.text); setPendingJson(null); }}
                style={{
                  padding: '10px 14px', borderRadius: 7, textAlign: 'left',
                  border: `1px solid ${T.border}`, background: T.panelHeader,
                  cursor: 'pointer', transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = T.accentBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.panelHeader; }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>➕ Add to current</div>
                <div style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}>
                  Imported rooms and assets are placed alongside existing ones. All IDs are re-generated.
                </div>
              </button>

              <button
                onClick={() => { importLayout(pendingJson.text); setPendingJson(null); }}
                style={{
                  padding: '10px 14px', borderRadius: 7, textAlign: 'left',
                  border: `1px solid ${T.border}`, background: T.panelHeader,
                  cursor: 'pointer', transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.danger; e.currentTarget.style.background = T.dangerBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.panelHeader; }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: T.danger }}>🗑 Overwrite</div>
                <div style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}>
                  Current floor plan is discarded and replaced entirely with the imported file.
                </div>
              </button>
            </div>

            <button
              onClick={() => setPendingJson(null)}
              style={{
                width: '100%', padding: '7px', borderRadius: 6,
                border: `1px solid ${T.border}`, background: 'transparent',
                color: T.textSub, fontSize: 12, cursor: 'pointer',
              }}
            >Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorPlannerPage;
