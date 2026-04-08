import React, { useEffect, useRef, useCallback } from 'react';
import FloorPlanEditor from '../components/FloorPlanner/FloorPlanEditor';
import FloorPlan3DScene from '../components/FloorPlanner/FloorPlan3DScene';
import FurnitureCatalog from '../components/FloorPlanner/FurnitureCatalog';
import FloorPlanProperties from '../components/FloorPlanner/FloorPlanProperties';
import useFloorPlannerStore from '../store/floorPlannerStore';

const ToolBtn = ({ active, onClick, children, title, danger }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      padding: '6px 14px',
      borderRadius: 6,
      border: `1px solid ${active ? '#1976D2' : danger ? '#FFCDD2' : '#DDD'}`,
      background: active ? '#E3F2FD' : danger ? '#FFF5F5' : '#fff',
      color: active ? '#1565C0' : danger ? '#C62828' : '#555',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      transition: 'all 0.12s',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = danger ? '#FFEBEE' : '#F5F5F5'; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = danger ? '#FFF5F5' : '#fff'; }}
  >
    {children}
  </button>
);

const Sep = () => (
  <div style={{ width: 1, height: 24, background: '#E8E8E8', margin: '0 4px' }} />
);

// ── Undo toast ────────────────────────────────────────────────────────────────
const UndoToast = ({ msg }) => {
  const prevMsg = useRef(null);
  if (msg) prevMsg.current = msg;
  const text = msg?.text ?? prevMsg.current?.text ?? '';

  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(30,30,30,0.92)', color: '#fff',
      padding: '9px 20px', borderRadius: 8,
      fontSize: 13, fontWeight: 500,
      boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
      pointerEvents: 'none', zIndex: 9999,
      opacity: msg ? 1 : 0,
      transition: msg ? 'opacity 0.12s' : 'opacity 0.4s 0.1s',
    }}>
      {text}
    </div>
  );
};

const FloorPlannerPage = () => {
  const {
    activeTool, activeFurnitureDef, viewMode,
    selectedIds, lockedIds, clipboard,
    showHeatmap,
    setActiveTool, setViewMode,
    undo, redo, clearAll,
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
    e.target.value = ''; // allow re-loading the same file
  }, [importLayout]);

  const handleClearAll = () => {
    if (rooms.length === 0 && furniture.length === 0) return;
    if (window.confirm('Clear all rooms and furniture?')) clearAll();
  };

  const selCount     = selectedIds.length;
  const anySelected  = selCount > 0;
  const anyLocked    = selectedIds.some((id) => lockedIds.includes(id));
  const anyUnlocked  = selectedIds.some((id) => !lockedIds.includes(id));

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div style={{
        height: 50,
        background: '#fff',
        borderBottom: '1px solid #E0E0E0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 6,
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        zIndex: 10,
      }}>

        {/* Tool buttons */}
        <ToolBtn
          active={activeTool === 'select'}
          onClick={() => setActiveTool('select')}
          title="Select / move (S)"
        >
          ↖ Select
        </ToolBtn>

        <ToolBtn
          active={activeTool === 'room'}
          onClick={() => setActiveTool('room')}
          title="Draw room (R)"
        >
          ⬜ Room
        </ToolBtn>

        <ToolBtn
          active={activeTool === 'door'}
          onClick={() => setActiveTool('door')}
          title="Place door on a wall"
        >
          🚪 Door
        </ToolBtn>

        {activeTool === 'furniture' && activeFurnitureDef && (
          <ToolBtn active onClick={() => setActiveTool('select')}>
            📦 {activeFurnitureDef.name} <span style={{ color: '#90CAF9', fontSize: 11 }}>✕</span>
          </ToolBtn>
        )}

        <Sep />

        {/* Undo / Redo */}
        <ToolBtn onClick={undo} title="Undo (Ctrl+Z)">↩ Undo</ToolBtn>
        <ToolBtn onClick={redo} title="Redo (Ctrl+Y)">↪ Redo</ToolBtn>

        <Sep />

        {/* Copy / Paste */}
        {viewMode === '2d' && (
          <>
            <ToolBtn
              onClick={copySelected}
              title="Copy selected (Ctrl+C)"
              active={false}
            >
              ⎘ Copy{selCount > 0 ? ` (${selCount})` : ''}
            </ToolBtn>
            <ToolBtn
              onClick={pasteClipboard}
              title="Paste (Ctrl+V)"
              active={false}
            >
              ⎙ Paste{clipboard?.length > 0 ? ` (${clipboard.length})` : ''}
            </ToolBtn>
            <Sep />
          </>
        )}

        {/* Lock / Unlock (only visible when items are selected) */}
        {anySelected && viewMode === '2d' && (
          <>
            {anyUnlocked && (
              <ToolBtn onClick={lockSelected} title="Lock selected items">
                🔒 Lock{selCount > 1 ? ` (${selCount})` : ''}
              </ToolBtn>
            )}
            {anyLocked && (
              <ToolBtn onClick={unlockSelected} title="Unlock selected items">
                🔓 Unlock
              </ToolBtn>
            )}
            <Sep />
          </>
        )}

        {/* Heatmap toggle (2D only) */}
        {viewMode === '2d' && (
          <ToolBtn
            active={showHeatmap}
            onClick={toggleHeatmap}
            title="Toggle sensor heatmap overlay"
          >
            🌡 Heatmap
          </ToolBtn>
        )}

        <Sep />

        {/* Save / Load JSON */}
        <ToolBtn onClick={exportLayout} title="Export layout as JSON (includes asset & sensor mappings)">
          💾 Save
        </ToolBtn>
        <ToolBtn onClick={() => jsonInputRef.current?.click()} title="Import layout from JSON">
          📂 Load
        </ToolBtn>
        <input
          ref={jsonInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleLoadJson}
        />

        <Sep />

        {/* Clear */}
        <ToolBtn onClick={handleClearAll} title="Clear all" danger>
          ✕ Clear
        </ToolBtn>

        {/* Stats */}
        {(rooms.length > 0 || furniture.length > 0) && (
          <>
            <Sep />
            <span style={{ fontSize: 12, color: '#AAA', whiteSpace: 'nowrap' }}>
              {rooms.length} room{rooms.length !== 1 ? 's' : ''} · {furniture.length} item{furniture.length !== 1 ? 's' : ''}
              {rooms.length > 0 && (
                <span style={{ marginLeft: 6 }}>
                  · {rooms.reduce((a, r) => a + r.width * r.height, 0).toFixed(0)} m² total
                </span>
              )}
              {lockedIds.length > 0 && (
                <span style={{ marginLeft: 6, color: '#FF9800' }}>
                  · {lockedIds.length} locked
                </span>
              )}
            </span>
          </>
        )}

        {/* View toggle (right-aligned) */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#BBB' }}>View</span>
          <div style={{
            display: 'flex',
            background: '#F2F2F2',
            borderRadius: 7,
            padding: 3,
            gap: 2,
          }}>
            {['2d', '3d'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '4px 18px',
                  borderRadius: 5,
                  border: 'none',
                  background: viewMode === mode ? '#fff' : 'transparent',
                  boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.14)' : 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: viewMode === mode ? 700 : 400,
                  color: viewMode === mode ? '#1976D2' : '#888',
                  transition: 'all 0.15s',
                }}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content area ────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: Furniture catalog (only shown in 2D) */}
        {viewMode === '2d' && <FurnitureCatalog />}

        {/* Center: Canvas */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {viewMode === '2d' ? <FloorPlanEditor /> : <FloorPlan3DScene />}
        </div>

        {/* Right: Properties panel */}
        <FloorPlanProperties />
      </div>

      {/* Undo/Redo toast */}
      <UndoToast msg={undoMsg} />
    </div>
  );
};

export default FloorPlannerPage;
