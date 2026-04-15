import React, { useState, useMemo } from 'react';
import useFloorPlannerStore, { FURNITURE_CATALOG } from '../../store/floorPlannerStore';
import { useFloorTheme } from './floorPlanTheme';

// ── Metadata ──────────────────────────────────────────────────────────────────
const CATEGORY_META = {
  'Data Center': { icon: '🖥️', accent: '#0EA5E9', tag: 'DC' },
  'Living Room': { icon: '🛋️', accent: '#8B5CF6' },
  'Bedroom':     { icon: '🛏️', accent: '#EC4899' },
  'Kitchen':     { icon: '🍳', accent: '#F59E0B' },
  'Dining':      { icon: '🍽️', accent: '#10B981' },
  'Office':      { icon: '💼', accent: '#6366F1' },
  'Bathroom':    { icon: '🚿', accent: '#14B8A6' },
};

const TYPE_GROUP_ICON = {
  'Server':      '🗄',
  'Cooling':     '❄',
  'Generator':   '⚡',
  'UPS / Power': '🔋',
  'Networking':  '🌐',
};

const BRAND_COLOR = {
  'Dell':        '#1E3A6E',
  'HP / HPE':    '#0096D6',
  'Cisco':       '#1BA0D7',
  'Lenovo':      '#E31837',
  'ZTE':         '#004B98',
  'Schneider':   '#3D8EB9',
  'Vertiv':      '#C0392B',
  'Eaton':       '#CC2200',
  'Caterpillar': '#E6A817',
  'Cummins':     '#CC0000',
  'Kohler':      '#005480',
  'Stulz':       '#2D5A8A',
  'Juniper':     '#0070AD',
  'Generic':     '#64748B',
};

const TYPE_BADGE = {
  'server-rack':    'Rack',
  'crac':           'CRAC',
  'generator':      'Gen',
  'ups':            'UPS',
  'pdu':            'PDU',
  'patch-panel':    'PP',
  'network-switch': 'Switch',
  'firewall':       'FW',
  'kvm':            'KVM',
};

const isTyped  = (val) => !Array.isArray(val) && typeof val === 'object' && val !== null;
const isBrands = (val) => isTyped(val) && Array.isArray(Object.values(val)[0]);

// ── Item row ──────────────────────────────────────────────────────────────────
const ItemRow = ({ item, accent, indent }) => {
  const T = useFloorTheme();
  const { setActiveFurnitureDef, activeFurnitureDef, activeTool } = useFloorPlannerStore();
  const isActive =
    activeTool === 'furniture' &&
    activeFurnitureDef?.type === item.type &&
    activeFurnitureDef?.name === item.name;
  const badge = TYPE_BADGE[item.type];

  return (
    <button
      onClick={() => setActiveFurnitureDef(item)}
      style={{
        width: '100%',
        padding: `5px 10px 5px ${indent}px`,
        textAlign: 'left',
        background: isActive ? `${accent}12` : 'transparent',
        border: 'none',
        borderBottom: `1px solid ${T.borderSubtle}`,
        borderLeft: `3px solid ${isActive ? accent : 'transparent'}`,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 7,
        transition: 'background 0.08s',
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = T.hover; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{
        width: 7, height: 7, borderRadius: 2, flexShrink: 0,
        background: item.color, border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11, fontWeight: isActive ? 600 : 400,
          color: isActive ? accent : T.text,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{item.name}</div>
        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1,
          display: 'flex', alignItems: 'center', gap: 3 }}>
          <span>{item.width}×{item.depth}m</span>
          {badge && (
            <span style={{
              fontSize: 9, padding: '0 3px', borderRadius: 2, fontWeight: 600,
              background: T.hoverStrong, color: T.textSub, border: `1px solid ${T.border}`,
            }}>{badge}</span>
          )}
          {item.modelPath && (
            <span style={{
              fontSize: 9, padding: '0 3px', borderRadius: 2, fontWeight: 700,
              background: '#DCFCE7', color: '#16A34A', border: '1px solid #BBF7D0',
            }}>3D</span>
          )}
        </div>
      </div>
    </button>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const FurnitureCatalog = () => {
  const T = useFloorTheme();
  const { activeFurnitureDef, activeTool } = useFloorPlannerStore();
  const placing = activeTool === 'furniture' && activeFurnitureDef;

  const [openCat, setOpenCat] = useState('Data Center');
  const [openTypes, setOpenTypes] = useState(new Set(['Server']));
  const [openBrands, setOpenBrands] = useState(new Set());
  const [search, setSearch] = useState('');

  const toggleType = (name) =>
    setOpenTypes((prev) => {
      const s = new Set(prev);
      s.has(name) ? s.delete(name) : s.add(name);
      return s;
    });

  const toggleBrand = (key) =>
    setOpenBrands((prev) => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });

  const allItems = useMemo(() => {
    const out = [];
    for (const [cat, catVal] of Object.entries(FURNITURE_CATALOG)) {
      if (isTyped(catVal)) {
        for (const [typeGroup, brands] of Object.entries(catVal)) {
          if (isBrands(brands)) {
            for (const [brand, items] of Object.entries(brands))
              for (const item of items) out.push({ cat, typeGroup, brand, item });
          } else {
            for (const item of brands) out.push({ cat, typeGroup, brand: null, item });
          }
        }
      } else {
        for (const item of catVal) out.push({ cat, typeGroup: null, brand: null, item });
      }
    }
    return out;
  }, []);

  const q = search.trim().toLowerCase();
  const searchResults = q
    ? allItems.filter(({ item, typeGroup, brand }) =>
        item.name.toLowerCase().includes(q) ||
        (typeGroup && typeGroup.toLowerCase().includes(q)) ||
        (brand && brand.toLowerCase().includes(q)) ||
        (TYPE_BADGE[item.type] || '').toLowerCase().includes(q)
      )
    : null;

  return (
    <div style={{
      width: 224, height: '100%',
      background: T.panel,
      borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, overflow: 'hidden',
    }}>

      {/* ── Header + search ───────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 12px',
        background: T.panelHeader,
        borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: T.textSub,
          textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 7,
        }}>Asset Library</div>

        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            fontSize: 11, color: T.textMuted, pointerEvents: 'none',
          }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets, brands…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '5px 26px 5px 26px',
              borderRadius: 5, border: `1px solid ${T.border}`,
              fontSize: 11, background: T.inputBg, color: T.inputText, outline: 'none',
            }}
            onFocus={(e) => { e.target.style.borderColor = T.accent; }}
            onBlur={(e)  => { e.target.style.borderColor = T.border; }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: T.textMuted, padding: 0, lineHeight: 1,
              }}
            >✕</button>
          )}
        </div>
      </div>

      {/* ── Placing banner ────────────────────────────────────────────────── */}
      {placing && (
        <div style={{
          margin: '6px 8px', padding: '6px 10px',
          background: 'rgba(14,165,233,0.08)',
          border: '1px solid rgba(14,165,233,0.25)',
          borderRadius: 5, flexShrink: 0,
        }}>
          <div style={{ fontSize: 9, color: '#0284C7', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 1 }}>Placing</div>
          <div style={{ fontSize: 12, color: '#0EA5E9', fontWeight: 600 }}>{activeFurnitureDef.name}</div>
          <div style={{ fontSize: 10, color: T.textSub, marginTop: 1 }}>
            {activeFurnitureDef.width} × {activeFurnitureDef.depth} m
          </div>
        </div>
      )}

      {/* ── Tree / Search results ─────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {searchResults ? (
          searchResults.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center',
              color: T.textMuted, fontSize: 11 }}>No assets found</div>
          ) : (
            <div>
              <div style={{ padding: '6px 12px 4px', fontSize: 10, color: T.textMuted,
                fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </div>
              {searchResults.map(({ cat, typeGroup, brand, item }) => {
                const meta  = CATEGORY_META[cat] || { accent: '#64748B' };
                const color = brand ? (BRAND_COLOR[brand] || meta.accent) : meta.accent;
                return (
                  <div key={`${typeGroup}-${brand}-${item.type}-${item.name}`}>
                    {(typeGroup || brand) && (
                      <div style={{ padding: '2px 12px 0 18px', fontSize: 9,
                        color: T.textMuted, fontWeight: 600, letterSpacing: '0.3px' }}>
                        {[typeGroup, brand].filter(Boolean).join(' · ')}
                      </div>
                    )}
                    <ItemRow item={item} accent={color} indent={18} />
                  </div>
                );
              })}
            </div>
          )
        ) : (

          Object.entries(FURNITURE_CATALOG).map(([cat, catVal]) => {
            const meta   = CATEGORY_META[cat] || { icon: '📦', accent: '#64748B' };
            const isOpen = openCat === cat;
            const typed  = isTyped(catVal);

            return (
              <div key={cat}>

                {/* Level 1 — Category */}
                <button
                  onClick={() => setOpenCat(isOpen ? null : cat)}
                  style={{
                    width: '100%', padding: '8px 12px', textAlign: 'left',
                    background: isOpen ? `${meta.accent}10` : 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${isOpen ? `${meta.accent}18` : T.borderSubtle}`,
                    borderLeft: `3px solid ${isOpen ? meta.accent : 'transparent'}`,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 7,
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.background = T.hover; }}
                  onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 13 }}>{meta.icon}</span>
                  <span style={{ flex: 1, fontSize: 12,
                    fontWeight: isOpen ? 700 : 500,
                    color: isOpen ? meta.accent : T.text }}>{cat}</span>
                  {meta.tag && (
                    <span style={{
                      fontSize: 9, padding: '1px 5px', borderRadius: 3, fontWeight: 700,
                      letterSpacing: '0.3px',
                      background: `${meta.accent}18`, color: meta.accent,
                    }}>{meta.tag}</span>
                  )}
                  <span style={{ fontSize: 9, fontWeight: 700,
                    color: isOpen ? meta.accent : T.textDimmer }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {/* Level 2a — Type groups (Data Center) */}
                {isOpen && typed && (
                  <div style={{ background: T.panelSecond }}>
                    {Object.entries(catVal).map(([typeGroup, brands]) => {
                      const typeOpen = openTypes.has(typeGroup);
                      const typeIcon = TYPE_GROUP_ICON[typeGroup] || '📦';
                      const totalItems = Object.values(brands)
                        .reduce((n, arr) => n + arr.length, 0);

                      return (
                        <div key={typeGroup}>
                          <button
                            onClick={() => toggleType(typeGroup)}
                            style={{
                              width: '100%', padding: '9px 12px', textAlign: 'left',
                              background: typeOpen ? `${meta.accent}10` : T.panelTertiary,
                              border: 'none',
                              borderTop: `1px solid ${T.border}`,
                              borderBottom: `1px solid ${typeOpen ? `${meta.accent}22` : T.border}`,
                              borderLeft: `4px solid ${typeOpen ? meta.accent : T.textDimmer}`,
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 8,
                              transition: 'all 0.1s',
                            }}
                            onMouseEnter={(e) => { if (!typeOpen) e.currentTarget.style.background = T.hoverStrong; }}
                            onMouseLeave={(e) => { if (!typeOpen) e.currentTarget.style.background = typeOpen ? `${meta.accent}10` : T.panelTertiary; }}
                          >
                            <span style={{ fontSize: 14 }}>{typeIcon}</span>
                            <span style={{
                              flex: 1, fontSize: 13, fontWeight: 700,
                              color: typeOpen ? meta.accent : T.text,
                              letterSpacing: '0.1px',
                            }}>{typeGroup}</span>
                            <span style={{
                              fontSize: 10, color: typeOpen ? meta.accent : T.textMuted,
                              background: typeOpen ? `${meta.accent}14` : T.hoverStrong,
                              borderRadius: 10, padding: '1px 6px',
                              fontVariantNumeric: 'tabular-nums', fontWeight: 600,
                            }}>{totalItems}</span>
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              color: typeOpen ? meta.accent : T.textMuted,
                            }}>{typeOpen ? '▾' : '▸'}</span>
                          </button>

                          {typeOpen && (
                            <div style={{ background: T.panelSecond, borderBottom: `1px solid ${T.border}` }}>
                              {Object.entries(brands).map(([brand, items]) => {
                                const brandKey   = `${typeGroup}/${brand}`;
                                const brandOpen  = openBrands.has(brandKey);
                                const brandColor = BRAND_COLOR[brand] || '#64748B';

                                return (
                                  <div key={brand}>
                                    <button
                                      onClick={() => toggleBrand(brandKey)}
                                      style={{
                                        width: '100%', padding: '5px 10px 5px 0', textAlign: 'left',
                                        background: brandOpen ? `${brandColor}07` : 'transparent',
                                        border: 'none', borderBottom: `1px solid ${T.borderSubtle}`,
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center',
                                        transition: 'background 0.1s',
                                      }}
                                      onMouseEnter={(e) => { if (!brandOpen) e.currentTarget.style.background = T.hover; }}
                                      onMouseLeave={(e) => { if (!brandOpen) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                      <div style={{
                                        width: 24, flexShrink: 0, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        color: T.textDimmer, fontSize: 10, userSelect: 'none',
                                      }}>│</div>
                                      <div style={{
                                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                                        background: brandColor, marginRight: 7,
                                        boxShadow: brandOpen ? `0 0 0 2px ${brandColor}28` : 'none',
                                      }} />
                                      <span style={{
                                        flex: 1, fontSize: 11,
                                        fontWeight: brandOpen ? 600 : 400,
                                        color: brandOpen ? brandColor : T.text,
                                      }}>{brand}</span>
                                      <span style={{
                                        fontSize: 10, color: T.textMuted, marginRight: 5,
                                        fontVariantNumeric: 'tabular-nums',
                                      }}>{items.length}</span>
                                      <span style={{
                                        fontSize: 9, fontWeight: 700, marginRight: 4,
                                        color: brandOpen ? brandColor : T.textDimmer,
                                      }}>{brandOpen ? '▾' : '▸'}</span>
                                    </button>

                                    {brandOpen && items.map((item) => (
                                      <ItemRow
                                        key={`${item.type}-${item.name}`}
                                        item={item}
                                        accent={brandColor}
                                        indent={36}
                                      />
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Level 2b — Flat items (non-DC categories) */}
                {isOpen && !typed && (
                  <div style={{ background: T.panelSecond, paddingBottom: 4 }}>
                    {catVal.map((item) => (
                      <ItemRow
                        key={`${item.type}-${item.name}`}
                        item={item}
                        accent={meta.accent}
                        indent={14}
                      />
                    ))}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FurnitureCatalog;
