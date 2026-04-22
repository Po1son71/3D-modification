import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import usePowerMapStore from '../../store/powerMapStore';
import { useTheme } from './powerMapTheme';

/* ══════════════════════════════════════════════════════════════════
   PROFESSIONAL SVG ICONS — each drawn on a consistent viewBox
   ══════════════════════════════════════════════════════════════════ */

/** HV Transmission Tower */
const TransformerSVG = ({ c }) => (
  <svg width="52" height="66" viewBox="0 0 52 66" fill="none">
    {/* Vertical spine */}
    <line x1="26" y1="2"  x2="26" y2="62" stroke={c} strokeWidth="2.8" strokeLinecap="round"/>
    {/* Crossarm 1 — top */}
    <line x1="5"  y1="12" x2="47" y2="12" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
    {/* Crossarm 2 — mid */}
    <line x1="9"  y1="24" x2="43" y2="24" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
    {/* Crossarm 3 — lower */}
    <line x1="13" y1="36" x2="39" y2="36" stroke={c} strokeWidth="2"   strokeLinecap="round"/>
    {/* Diagonals: top section */}
    <line x1="26" y1="2"  x2="5"  y2="12" stroke={c} strokeWidth="1.5"/>
    <line x1="26" y1="2"  x2="47" y2="12" stroke={c} strokeWidth="1.5"/>
    {/* Diagonals: arm1 → arm2 */}
    <line x1="5"  y1="12" x2="9"  y2="24" stroke={c} strokeWidth="1.5"/>
    <line x1="47" y1="12" x2="43" y2="24" stroke={c} strokeWidth="1.5"/>
    {/* Diagonals: arm2 → arm3 */}
    <line x1="9"  y1="24" x2="13" y2="36" stroke={c} strokeWidth="1.5"/>
    <line x1="43" y1="24" x2="39" y2="36" stroke={c} strokeWidth="1.5"/>
    {/* X-bracing panel 1 */}
    <line x1="16" y1="14" x2="36" y2="22" stroke={c} strokeWidth="0.9" opacity="0.6"/>
    <line x1="36" y1="14" x2="16" y2="22" stroke={c} strokeWidth="0.9" opacity="0.6"/>
    {/* X-bracing panel 2 */}
    <line x1="17" y1="26" x2="35" y2="34" stroke={c} strokeWidth="0.9" opacity="0.6"/>
    <line x1="35" y1="26" x2="17" y2="34" stroke={c} strokeWidth="0.9" opacity="0.6"/>
    {/* Insulator caps */}
    <circle cx="5"  cy="12" r="2.8" fill={c}/>
    <circle cx="47" cy="12" r="2.8" fill={c}/>
    <circle cx="9"  cy="24" r="2.4" fill={c}/>
    <circle cx="43" cy="24" r="2.4" fill={c}/>
    <circle cx="13" cy="36" r="2.2" fill={c}/>
    <circle cx="39" cy="36" r="2.2" fill={c}/>
    {/* Feet */}
    <line x1="26" y1="52" x2="11" y2="63" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="26" y1="52" x2="41" y2="63" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    {/* Foot cross-braces */}
    <line x1="14" y1="59" x2="22" y2="55" stroke={c} strokeWidth="1.2" opacity="0.6"/>
    <line x1="38" y1="59" x2="30" y2="55" stroke={c} strokeWidth="1.2" opacity="0.6"/>
  </svg>
);

/** Diesel Generator — side profile */
const GeneratorSVG = ({ c }) => (
  <svg width="60" height="46" viewBox="0 0 60 46" fill="none">
    {/* Skid/base */}
    <rect x="3" y="35" width="54" height="5" rx="1.5" fill={c} fillOpacity="0.25" stroke={c} strokeWidth="1.5"/>
    {/* Main body */}
    <rect x="5" y="13" width="50" height="22" rx="3" fill={c} fillOpacity="0.09" stroke={c} strokeWidth="1.8"/>
    {/* Engine cylinders (3) */}
    {[10, 21, 32].map((x) => (
      <rect key={x} x={x} y="5" width="10" height="10" rx="2" fill={c} fillOpacity="0.13" stroke={c} strokeWidth="1.4"/>
    ))}
    {/* Alternator end */}
    <circle cx="48" cy="24" r="9.5" fill={c} fillOpacity="0.12" stroke={c} strokeWidth="1.8"/>
    <text x="48" y="28" textAnchor="middle" fontSize="9" fill={c} fontWeight="800" fontFamily="monospace">G</text>
    {/* Control panel */}
    <rect x="7" y="16" width="18" height="14" rx="2" fill={c} fillOpacity="0.18" stroke={c} strokeWidth="1.3"/>
    <circle cx="13" cy="22" r="2.2" fill="none" stroke={c} strokeWidth="1.2"/>
    <circle cx="20" cy="22" r="2.2" fill={c} fillOpacity="0.6"/>
    <line x1="9"  y1="27" x2="23" y2="27" stroke={c} strokeWidth="1" opacity="0.5"/>
    {/* Exhaust stack */}
    <rect x="3" y="15" width="4" height="3" rx="1" fill={c} fillOpacity="0.3" stroke={c} strokeWidth="1.2"/>
  </svg>
);

/** IEC Circuit Breaker */
const BreakerSVG = ({ c, closed }) => (
  <svg width="28" height="52" viewBox="0 0 28 52" fill="none">
    {/* Bottom terminal */}
    <line x1="14" y1="46" x2="14" y2="36" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    {/* Bottom contact */}
    <circle cx="14" cy="34" r="3" fill="none" stroke={c} strokeWidth="2"/>
    {/* Moving arm */}
    {closed
      ? <line x1="14" y1="34" x2="14" y2="18" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      : <line x1="14" y1="34" x2="24" y2="20" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    }
    {/* Top contact */}
    <circle cx="14" cy="16" r="3" fill="none" stroke={c} strokeWidth="2"/>
    {/* Top terminal */}
    <line x1="14" y1="13" x2="14" y2="4" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

/** Dual Circuit Breaker (Main Switch) */
const MainBreakerSVG = ({ c, closed }) => (
  <svg width="64" height="52" viewBox="0 0 64 52" fill="none">
    {/* Bus coupler bar */}
    <line x1="8" y1="50" x2="56" y2="50" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    {/* Left breaker */}
    <line x1="18" y1="46" x2="18" y2="36" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="18" cy="34" r="3" fill="none" stroke={c} strokeWidth="2"/>
    {closed
      ? <line x1="18" y1="34" x2="18" y2="18" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      : <line x1="18" y1="34" x2="28" y2="20" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    }
    <circle cx="18" cy="16" r="3" fill="none" stroke={c} strokeWidth="2"/>
    <line x1="18" y1="13" x2="18" y2="4" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    {/* Right breaker */}
    <line x1="46" y1="46" x2="46" y2="36" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="46" cy="34" r="3" fill="none" stroke={c} strokeWidth="2"/>
    {closed
      ? <line x1="46" y1="34" x2="46" y2="18" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      : <line x1="46" y1="34" x2="56" y2="20" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    }
    <circle cx="46" cy="16" r="3" fill="none" stroke={c} strokeWidth="2"/>
    <line x1="46" y1="13" x2="46" y2="4" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

/** Bridge Rectifier (AC → DC) */
const RectifierSVG = ({ c }) => (
  <svg width="56" height="52" viewBox="0 0 56 52" fill="none">
    {/* Housing */}
    <rect x="4" y="4" width="48" height="44" rx="4" fill={c} fillOpacity="0.07" stroke={c} strokeWidth="1.6"/>
    {/* Bridge diamond */}
    <polygon points="28,12 44,26 28,40 12,26" fill="none" stroke={c} strokeWidth="1.5" opacity="0.4"/>
    {/* 4 diodes */}
    <polygon points="36,16 40,22 32,22" fill={c} fillOpacity="0.9"/>
    <line x1="36" y1="22" x2="36" y2="16" stroke={c} strokeWidth="1.2"/>
    <polygon points="36,36 32,30 40,30" fill={c} fillOpacity="0.9"/>
    <line x1="36" y1="30" x2="36" y2="36" stroke={c} strokeWidth="1.2"/>
    <polygon points="20,16 24,22 16,22" fill={c} fillOpacity="0.9"/>
    <line x1="20" y1="22" x2="20" y2="16" stroke={c} strokeWidth="1.2"/>
    <polygon points="20,36 16,30 24,30" fill={c} fillOpacity="0.9"/>
    <line x1="20" y1="30" x2="20" y2="36" stroke={c} strokeWidth="1.2"/>
    {/* Labels */}
    <text x="4" y="17" fontSize="7" fill={c} fontWeight="700" opacity="0.7">AC</text>
    <text x="43" y="13" fontSize="7" fill={c} fontWeight="700">+</text>
    <text x="43" y="42" fontSize="7" fill={c} fontWeight="700">−</text>
    {/* Output lines */}
    <line x1="44" y1="10" x2="52" y2="10" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="44" y1="42" x2="52" y2="42" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

/** DC → AC Inverter */
const InverterSVG = ({ c }) => (
  <svg width="56" height="52" viewBox="0 0 56 52" fill="none">
    {/* Housing */}
    <rect x="4" y="4" width="48" height="44" rx="4" fill={c} fillOpacity="0.07" stroke={c} strokeWidth="1.6"/>
    {/* Inverter triangle symbol */}
    <polygon points="14,12 14,40 38,26" fill={c} fillOpacity="0.18" stroke={c} strokeWidth="2"/>
    {/* Vertical bar */}
    <line x1="40" y1="14" x2="40" y2="38" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    {/* Sine wave output */}
    <path d="M42 26 Q44 19 46 26 Q48 33 50 26" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    {/* Labels */}
    <text x="7" y="49" fontSize="7" fill={c} fontWeight="700" opacity="0.7">DC IN</text>
    <text x="39" y="49" fontSize="7" fill={c} fontWeight="700">AC OUT</text>
  </svg>
);

/* ══════════════════════════════════════════════════════════════════
   SHARED NODE SHELL — all accept T (theme tokens)
   ══════════════════════════════════════════════════════════════════ */

const makeHandleStyle = (T) => ({
  width: 10,
  height: 10,
  background: T.handleBg,
  border: `2px solid ${T.handleBorder}`,
  borderRadius: '50%',
});

const makeActiveHandleStyle = (T) => ({
  width: 10,
  height: 10,
  background: '#052e16',
  border: '2px solid #22c55e',
  borderRadius: '50%',
});

// Wraps node content so data.rotation (degrees) rotates everything including handles
const RotateWrap = ({ rotation, children }) => (
  <div style={{
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
    transformOrigin: 'center',
    display: 'inline-block',
  }}>
    {children}
  </div>
);

const Card = ({ active, selected, accent, width, T, children }) => (
  <div style={{
    width,
    background: T.cardBg,
    border: `1px solid ${selected ? '#3b82f6' : active ? '#16a34a' : T.border}`,
    borderTop: `3px solid ${active ? '#22c55e' : accent}`,
    borderRadius: '0 0 8px 8px',
    boxShadow: selected
      ? '0 0 0 1.5px #3b82f6, 0 6px 24px rgba(0,0,0,0.3)'
      : active
        ? '0 0 18px rgba(34,197,94,0.22), 0 4px 16px rgba(0,0,0,0.25)'
        : '0 4px 16px rgba(0,0,0,0.18)',
    overflow: 'hidden',
    userSelect: 'none',
    cursor: 'default',
    position: 'relative',
  }}>
    {children}
  </div>
);

const StatusDot = ({ active, T }) => (
  <div style={{
    position: 'absolute',
    top: 5,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: active ? '#22c55e' : T.statusOffColor,
    boxShadow: active ? '0 0 6px #22c55e' : 'none',
  }}/>
);

const IconArea = ({ active, T, children }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px 8px 8px',
    background: active ? 'rgba(34,197,94,0.04)' : T.iconAreaBg,
  }}>
    {children}
  </div>
);

const NameBar = ({ label, active, T }) => (
  <div style={{
    padding: '5px 8px 7px',
    borderTop: `1px solid ${T.nameBorder}`,
    background: T.nameBg,
    textAlign: 'center',
  }}>
    <div style={{
      fontSize: 10,
      fontWeight: 700,
      color: active ? T.nameColorActive : T.nameColor,
      lineHeight: 1.3,
      letterSpacing: '0.01em',
    }}>
      {label}
    </div>
    <div style={{
      fontSize: 8,
      marginTop: 2,
      fontWeight: 600,
      letterSpacing: '0.06em',
      color: active ? '#22c55e' : T.textDimmer,
    }}>
      {active ? '▲ ACTIVE' : '— OFFLINE'}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   NODE COMPONENTS
   ══════════════════════════════════════════════════════════════════ */

export const TransformerNode = ({ data, selected }) => {
  const T = useTheme();
  const active = !!data.status;
  const accent = '#f59e0b';
  const iconColor = active ? '#22c55e' : '#f59e0b';
  const hs = active ? makeActiveHandleStyle(T) : makeHandleStyle(T);
  return (
    <RotateWrap rotation={data.rotation}>
      <Card active={active} selected={selected} accent={accent} width={108} T={T}>
        <Handle type="target" position={Position.Top}    id="t" style={hs}/>
        <StatusDot active={active} T={T}/>
        <IconArea active={active} T={T}><TransformerSVG c={iconColor}/></IconArea>
        <NameBar label={data.label} active={active} T={T}/>
        <Handle type="source" position={Position.Bottom} id="s" style={hs}/>
      </Card>
    </RotateWrap>
  );
};

export const GeneratorNode = ({ data, selected }) => {
  const T = useTheme();
  const active = !!data.status;
  const accent = '#f59e0b';
  const iconColor = active ? '#22c55e' : '#f59e0b';
  const hs = active ? makeActiveHandleStyle(T) : makeHandleStyle(T);
  return (
    <RotateWrap rotation={data.rotation}>
      <Card active={active} selected={selected} accent={accent} width={108} T={T}>
        <Handle type="target" position={Position.Top}    id="t" style={hs}/>
        <StatusDot active={active} T={T}/>
        <IconArea active={active} T={T}><GeneratorSVG c={iconColor}/></IconArea>
        <NameBar label={data.label} active={active} T={T}/>
        <Handle type="source" position={Position.Bottom} id="s" style={hs}/>
      </Card>
    </RotateWrap>
  );
};

export const SwitchNode = ({ data, selected }) => {
  const T = useTheme();
  const active = !!data.status;
  const accent = '#64748b';
  const iconColor = active ? '#22c55e' : '#94a3b8';
  const hs = active ? makeActiveHandleStyle(T) : makeHandleStyle(T);
  return (
    <RotateWrap rotation={data.rotation}>
      <Card active={active} selected={selected} accent={accent} width={72} T={T}>
        <Handle type="target" position={Position.Top}    id="t" style={hs}/>
        <StatusDot active={active} T={T}/>
        <IconArea active={active} T={T}><BreakerSVG c={iconColor} closed={active}/></IconArea>
        <NameBar label={data.label} active={active} T={T}/>
        <Handle type="source" position={Position.Bottom} id="s" style={hs}/>
      </Card>
    </RotateWrap>
  );
};

export const MainSwitchNode = ({ data, selected }) => {
  const T = useTheme();
  const active = !!data.status;
  const accent = '#475569';
  const iconColor = active ? '#22c55e' : '#94a3b8';
  const hs = active ? makeActiveHandleStyle(T) : makeHandleStyle(T);
  return (
    <RotateWrap rotation={data.rotation}>
      <Card active={active} selected={selected} accent={accent} width={142} T={T}>
        <Handle type="target" position={Position.Top} id="main-mcb-T-B" style={{ ...hs, left: '28%' }}/>
        <Handle type="target" position={Position.Top} id="main-mcb-T-A" style={{ ...hs, left: '72%' }}/>
        <StatusDot active={active} T={T}/>
        <IconArea active={active} T={T}><MainBreakerSVG c={iconColor} closed={active}/></IconArea>
        <NameBar label={data.label} active={active} T={T}/>
        <Handle type="source" position={Position.Bottom} id="main-mcb-S-A" style={{ ...hs, left: '28%' }}/>
        <Handle type="source" position={Position.Bottom} id="main-mcb-S-B" style={{ ...hs, left: '72%' }}/>
      </Card>
    </RotateWrap>
  );
};

export const RectifierNode = ({ data, selected }) => {
  const T = useTheme();
  const active = !!data.status;
  const accent = '#0ea5e9';
  const iconColor = active ? '#22c55e' : '#0ea5e9';
  const hs = active ? makeActiveHandleStyle(T) : makeHandleStyle(T);
  return (
    <RotateWrap rotation={data.rotation}>
      <Card active={active} selected={selected} accent={accent} width={108} T={T}>
        <Handle type="target" position={Position.Top}  id="t" style={hs}/>
        <Handle type="target" position={Position.Left} id="l" style={{ ...hs, top: '42%' }}/>
        <StatusDot active={active} T={T}/>
        <IconArea active={active} T={T}><RectifierSVG c={iconColor}/></IconArea>
        <NameBar label={data.label} active={active} T={T}/>
        <Handle type="source" position={Position.Bottom} id="s" style={hs}/>
      </Card>
    </RotateWrap>
  );
};

export const InverterNode = ({ data, selected }) => {
  const T = useTheme();
  const active = !!data.status;
  const accent = '#8b5cf6';
  const iconColor = active ? '#22c55e' : '#8b5cf6';
  const hs = active ? makeActiveHandleStyle(T) : makeHandleStyle(T);
  return (
    <RotateWrap rotation={data.rotation}>
      <Card active={active} selected={selected} accent={accent} width={108} T={T}>
        <Handle type="target" position={Position.Top}  id="t" style={hs}/>
        <Handle type="target" position={Position.Left} id="l" style={{ ...hs, top: '42%' }}/>
        <StatusDot active={active} T={T}/>
        <IconArea active={active} T={T}><InverterSVG c={iconColor}/></IconArea>
        <NameBar label={data.label} active={active} T={T}/>
        <Handle type="source" position={Position.Bottom} id="s" style={hs}/>
      </Card>
    </RotateWrap>
  );
};

export const RegionNode = ({ id, data, selected }) => {
  const T = useTheme();
  const { updateNodeData } = usePowerMapStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const commit = () => {
    const val = draft.trim() || 'Region';
    updateNodeData(id, { label: val });
    setDraft(val);
    setEditing(false);
  };

  const borderColor = selected ? '#3b82f6' : T.regionBorder;

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={160}
        minHeight={120}
        lineStyle={{ stroke: '#3b82f6', strokeWidth: 1.5 }}
        handleStyle={{ width: 10, height: 10, background: '#3b82f6', border: '2px solid #fff', borderRadius: 3 }}
      />
      <div style={{
        width: '100%',
        height: '100%',
        border: `2.5px solid ${borderColor}`,
        borderRadius: 12,
        background: T.regionBg,
        backdropFilter: 'blur(2px)',
        position: 'relative',
        pointerEvents: 'none',
        boxShadow: selected
          ? `0 0 0 1px #3b82f6, inset 0 0 0 1px #3b82f688`
          : `inset 0 0 0 1px ${T.regionBorder}44`,
      }}>

        {/* drag handle + editable label */}
        <div
          className="region-drag-handle"
          style={{
            position: 'absolute',
            top: 0,
            left: 14,
            transform: 'translateY(-50%)',
            background: T.regionLabelBg,
            padding: editing ? '1px 6px' : '3px 12px',
            borderRadius: 5,
            border: `2px solid ${borderColor}`,
            fontSize: 12,
            fontWeight: 700,
            color: T.textSecondary,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: editing ? 'text' : 'grab',
            pointerEvents: 'all',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            minWidth: 60,
          }}
        >
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') { setDraft(data.label); setEditing(false); }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: T.textSecondary,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                width: Math.max(60, draft.length * 9),
                cursor: 'text',
              }}
            />
          ) : (
            <>
              <span>{data.label}</span>
              <span
                title="Rename"
                onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
                style={{ fontSize: 9, opacity: 0.45, cursor: 'text', lineHeight: 1 }}
              >✎</span>
            </>
          )}
        </div>
      </div>
    </>
  );
};

/* ── Line / Bus-bar node ─────────────────────────────────────────────────────
   Resizable horizontal bus. Handles at both ends + evenly spaced along top &
   bottom so any component can tap in at any point along the bar.
   connectionMode="loose" (set on the canvas) means every handle can both
   start and end a connection — wire anything to anything.
   ════════════════════════════════════════════════════════════════════════════ */
export const LineNode = ({ data, selected }) => {
  const T = useTheme();
  const wireColor = selected ? '#3b82f6' : '#94a3b8';
  const glowColor = selected ? '#3b82f688' : '#94a3b833';

  const hs = {
    width: 10, height: 10,
    background: wireColor,
    border: `2px solid ${selected ? '#bfdbfe' : '#475569'}`,
    borderRadius: '50%',
    zIndex: 10,
  };

  // intermediate tap handles along top & bottom (25 %, 50 %, 75 %)
  const tapOffsets = ['25%', '50%', '75%'];

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={4}
        maxHeight={4}
        lineStyle={{ stroke: wireColor, strokeWidth: 1 }}
        handleStyle={{ width: 8, height: 8, background: wireColor, border: '2px solid #fff', borderRadius: 2 }}
        // only allow horizontal resizing
        onResize={(_, { width }) => width}
      />

      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center',
        position: 'relative',
      }}>
        {/* the bar itself */}
        <div style={{
          width: '100%', height: 4, borderRadius: 2,
          background: wireColor,
          boxShadow: `0 0 6px ${glowColor}`,
        }} />

        {/* label */}
        {data.label && (
          <div style={{
            position: 'absolute', top: -15, left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 9, fontWeight: 700, color: wireColor,
            whiteSpace: 'nowrap', letterSpacing: '0.05em',
            textTransform: 'uppercase', pointerEvents: 'none',
          }}>{data.label}</div>
        )}
      </div>

      {/* end handles — left & right */}
      <Handle type="source" position={Position.Left}   id="end-l" isConnectableStart isConnectableEnd style={{ ...hs, top: '50%', left: -5, transform: 'translateY(-50%)' }}/>
      <Handle type="source" position={Position.Right}  id="end-r" isConnectableStart isConnectableEnd style={{ ...hs, top: '50%', right: -5, transform: 'translateY(-50%)' }}/>

      {/* tap handles along top */}
      {tapOffsets.map((left, i) => (
        <Handle key={`t${i}`} type="source" position={Position.Top} id={`top-${i}`}
          isConnectableStart isConnectableEnd
          style={{ ...hs, left, top: -5, transform: 'translateX(-50%)' }}/>
      ))}

      {/* tap handles along bottom */}
      {tapOffsets.map((left, i) => (
        <Handle key={`b${i}`} type="source" position={Position.Bottom} id={`bot-${i}`}
          isConnectableStart isConnectableEnd
          style={{ ...hs, left, bottom: -5, transform: 'translateX(-50%)' }}/>
      ))}
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════
   EXPORTS
   ══════════════════════════════════════════════════════════════════ */

export const NODE_TYPES = {
  transformer: TransformerNode,
  generator:   GeneratorNode,
  sb:          SwitchNode,
  sbMain:      MainSwitchNode,
  rectifier:   RectifierNode,
  inverter:    InverterNode,
  region:      RegionNode,
  line:        LineNode,
};

/* Mini SVG previews for palette (smaller, same icon) */
const PalettePreview = ({ type }) => {
  const map = {
    transformer: <TransformerSVG c="#f59e0b"/>,
    generator:   <GeneratorSVG   c="#f59e0b"/>,
    sb:          <BreakerSVG     c="#94a3b8" closed={false}/>,
    sbMain:      <MainBreakerSVG c="#94a3b8" closed={false}/>,
    rectifier:   <RectifierSVG   c="#0ea5e9"/>,
    inverter:    <InverterSVG    c="#8b5cf6"/>,
    region:      <svg width="32" height="20" viewBox="0 0 32 20"><rect x="1" y="1" width="30" height="18" rx="4" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,2"/></svg>,
    line:        <svg width="44" height="14" viewBox="0 0 44 14"><line x1="2" y1="7" x2="42" y2="7" stroke="#64748b" strokeWidth="3" strokeLinecap="round"/><circle cx="2" cy="7" r="3.5" fill="#64748b"/><circle cx="22" cy="7" r="3" fill="#64748b"/><circle cx="42" cy="7" r="3.5" fill="#64748b"/></svg>,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(0.55)', transformOrigin: 'center', height: 40 }}>
      {map[type]}
    </div>
  );
};

export const PALETTE_ITEMS = [
  { type: 'transformer', label: 'Transformer',  accent: '#f59e0b' },
  { type: 'generator',   label: 'Generator',    accent: '#f59e0b' },
  { type: 'sb',          label: 'Switch / CB',  accent: '#64748b' },
  { type: 'sbMain',      label: 'Main Switch',  accent: '#475569' },
  { type: 'rectifier',   label: 'Rectifier',    accent: '#0ea5e9' },
  { type: 'inverter',    label: 'Inverter',     accent: '#8b5cf6' },
  { type: 'region',      label: 'Region',       accent: '#475569' },
  { type: 'line',        label: 'Line / Wire',  accent: '#64748b' },
];

export { PalettePreview };

export const DEFAULT_NODE_DATA = {
  transformer: { label: 'Transformer', status: false, primaryStatus: false, mainF: '', indicatorF: '', sensors: [], rotation: 0 },
  generator:   { label: 'Generator',   status: false, primaryStatus: false, mainF: '', indicatorF: '', sensors: [], rotation: 0 },
  sb:          { label: 'Switch',      status: false, mainF: '', sensors: [], rotation: 0 },
  sbMain:      { label: 'Main Switch', status: false, mainF: '', sensors: [], rotation: 0 },
  rectifier:   { label: 'Rectifier',   status: false, primaryStatus: false, mainF: '', indicatorF: '', sensors: [], rotation: 0 },
  inverter:    { label: 'Inverter',    status: false, primaryStatus: false, mainF: '', indicatorF: '', sensors: [], rotation: 0 },
  region:      { label: 'Region',      sensors: [] },
  line:        { label: '',            sensors: [] },
};
