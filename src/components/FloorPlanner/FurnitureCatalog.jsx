import React, { useState } from 'react';
import useFloorPlannerStore, { FURNITURE_CATALOG } from '../../store/floorPlannerStore';

const CATEGORY_ICONS = {
  'Living Room': '🛋️',
  'Bedroom':     '🛏️',
  'Kitchen':     '🍳',
  'Dining':      '🍽️',
  'Office':      '💼',
  'Bathroom':    '🚿',
};

const FurnitureCatalog = () => {
  const categories = Object.keys(FURNITURE_CATALOG);
  const [openCat, setOpenCat] = useState('Living Room');

  const { setActiveFurnitureDef, activeFurnitureDef, activeTool } = useFloorPlannerStore();

  const handleSelect = (item) => {
    setActiveFurnitureDef(item);
  };

  return (
    <div style={{
      width: 210,
      height: '100%',
      background: '#FAFAFA',
      borderRight: '1px solid #E0E0E0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid #E8E8E8',
        background: '#fff',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#333', letterSpacing: '0.3px' }}>
          Furniture
        </div>
        <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
          Click an item, then click canvas
        </div>
      </div>

      {/* Active furniture badge */}
      {activeTool === 'furniture' && activeFurnitureDef && (
        <div style={{
          margin: '8px 10px',
          padding: '7px 10px',
          background: '#E3F2FD',
          border: '1px solid #BBDEFB',
          borderRadius: 6,
          fontSize: 11,
          color: '#1565C0',
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 600 }}>Placing:</span> {activeFurnitureDef.name}
          <span style={{ color: '#90A4AE', marginLeft: 4 }}>
            ({activeFurnitureDef.width}×{activeFurnitureDef.depth}m)
          </span>
        </div>
      )}

      {/* Categories */}
      <div style={{ flex: 1 }}>
        {categories.map((cat) => {
          const isOpen = openCat === cat;
          return (
            <div key={cat}>
              {/* Category header */}
              <button
                onClick={() => setOpenCat(isOpen ? null : cat)}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  textAlign: 'left',
                  background: isOpen ? '#E8F4FD' : '#FAFAFA',
                  border: 'none',
                  borderBottom: '1px solid #EBEBEB',
                  borderLeft: isOpen ? '3px solid #1976D2' : '3px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: isOpen ? 700 : 500,
                  color: isOpen ? '#1565C0' : '#444',
                  transition: 'background 0.15s',
                }}
              >
                <span>{CATEGORY_ICONS[cat] || '📦'}</span>
                <span style={{ flex: 1 }}>{cat}</span>
                <span style={{ fontSize: 10, color: '#AAA', fontWeight: 400 }}>
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {/* Item list */}
              {isOpen && (
                <div style={{ background: '#fff' }}>
                  {FURNITURE_CATALOG[cat].map((item) => {
                    const isActive = activeFurnitureDef?.type === item.type;
                    return (
                      <button
                        key={item.type}
                        onClick={() => handleSelect(item)}
                        title={`${item.name} — ${item.width}m × ${item.depth}m`}
                        style={{
                          width: '100%',
                          padding: '8px 14px 8px 26px',
                          textAlign: 'left',
                          background: isActive ? '#E3F2FD' : 'transparent',
                          border: 'none',
                          borderBottom: '1px solid #F5F5F5',
                          borderLeft: isActive ? '3px solid #2196F3' : '3px solid transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#F5F9FF'; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {/* Color swatch */}
                        <div style={{
                          width: 20, height: 20,
                          borderRadius: 3,
                          background: item.color,
                          border: '1px solid rgba(0,0,0,0.1)',
                          flexShrink: 0,
                        }} />
                        <div>
                          <div style={{
                            fontSize: 12,
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? '#1565C0' : '#333',
                            lineHeight: 1.3,
                          }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 10, color: '#AAA', marginTop: 1 }}>
                            {item.width}m × {item.depth}m
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FurnitureCatalog;
