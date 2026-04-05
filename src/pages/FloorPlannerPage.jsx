import React from 'react';
import FloorPlanEditor from '../components/FloorPlanner/FloorPlanEditor';
import FloorPlan3DScene from '../components/FloorPlanner/FloorPlan3DScene';
import FurnitureCatalog from '../components/FloorPlanner/FurnitureCatalog';
import FloorPlanProperties from '../components/FloorPlanner/FloorPlanProperties';
import useFloorPlannerStore from '../store/floorPlannerStore';

const ToolBtn = ({ active, onClick, children, title }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      padding: '6px 14px',
      borderRadius: 6,
      border: `1px solid ${active ? '#1976D2' : '#DDD'}`,
      background: active ? '#E3F2FD' : '#fff',
      color: active ? '#1565C0' : '#555',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      transition: 'all 0.12s',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#F5F5F5'; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = '#fff'; }}
  >
    {children}
  </button>
);

const Sep = () => (
  <div style={{ width: 1, height: 24, background: '#E8E8E8', margin: '0 4px' }} />
);

const FloorPlannerPage = () => {
  const {
    activeTool, activeFurnitureDef, viewMode,
    setActiveTool, setViewMode,
    undo, redo, clearAll,
    rooms, furniture,
  } = useFloorPlannerStore();

  const handleClearAll = () => {
    if (rooms.length === 0 && furniture.length === 0) return;
    if (window.confirm('Clear all rooms and furniture?')) clearAll();
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
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
        <ToolBtn onClick={undo} title="Undo (Ctrl+Z)">↩</ToolBtn>
        <ToolBtn onClick={redo} title="Redo (Ctrl+Y)">↪</ToolBtn>

        <Sep />

        {/* Clear */}
        <ToolBtn onClick={handleClearAll} title="Clear all">
          <span style={{ color: '#EF5350' }}>✕</span> Clear
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
    </div>
  );
};

export default FloorPlannerPage;
