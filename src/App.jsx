import React, { useState } from "react";
import DataCenterPage from "./pages/DataCenterPage";
import WarehousePage from "./pages/WarehousePage";
import FloorPlannerPage from "./pages/FloorPlannerPage";

const NAV = [
  { id: 'floorplanner', label: '🏠 Floor Planner' },
  { id: 'warehouse',    label: '📦 Warehouse' },
  { id: 'datacenter',  label: '🖥️ Data Center' },
];

function App() {
  const [page, setPage] = useState('floorplanner');

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      margin: 0,
      padding: 0,
    }}>
      {/* ── Navigation bar ─────────────────────────────── */}
      <nav style={{
        height: 50,
        background: '#1A1A2E',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 4,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        zIndex: 1000,
      }}>
        <span style={{
          color: '#fff',
          fontWeight: 800,
          fontSize: 16,
          marginRight: 20,
          letterSpacing: '-0.3px',
        }}>
          3D Layout Editor
        </span>

        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              padding: '6px 16px',
              borderRadius: 5,
              border: 'none',
              background: page === item.id ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: page === item.id ? '#fff' : 'rgba(255,255,255,0.55)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: page === item.id ? 600 : 400,
              transition: 'all 0.15s',
              outline: page === item.id ? '1px solid rgba(255,255,255,0.2)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (page !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={(e) => {
              if (page !== item.id) e.currentTarget.style.background = 'transparent';
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* ── Page content ───────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {page === 'floorplanner' && <FloorPlannerPage />}
        {page === 'warehouse'    && <WarehousePage />}
        {page === 'datacenter'   && <DataCenterPage />}
      </div>
    </div>
  );
}

export default App;
