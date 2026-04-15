import React from 'react';
import usePowerMapStore from '../../store/powerMapStore';
import { useTheme } from './powerMapTheme';
import { makeEdgeStyle } from './PowerMapEditor';

/* ── Shared button style ────────────────────────────────────────── */
const btnStyle = (bg) => ({
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: 5,
  padding: '4px 9px',
  fontSize: 10,
  fontWeight: 700,
  cursor: 'pointer',
  flexShrink: 0,
  letterSpacing: '0.04em',
});

/* ── Themed building blocks ─────────────────────────────────────── */
const Field = ({ label, T, children }) => (
  <div style={{ marginBottom: 11 }}>
    <label style={{
      display: 'block',
      fontSize: 9,
      fontWeight: 700,
      color: T.textDimmer,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
    }}>
      {label}
    </label>
    {children}
  </div>
);

const SectionTitle = ({ T, children }) => (
  <div style={{
    fontSize: 9,
    fontWeight: 800,
    color: T.sectionColor,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 10,
    marginTop: 2,
  }}>
    {children}
  </div>
);

const Divider = ({ T }) => (
  <div style={{ height: 1, background: T.borderSubtle, margin: '12px 0' }}/>
);

/* ── Sensor list editor ─────────────────────────────────────────── */
const SensorEditor = ({ sensors = [], onChange, T }) => {
  const IS = makeInputStyle(T);
  const add    = ()          => onChange([...sensors, { id: '', label: '' }]);
  const remove = (i)         => onChange(sensors.filter((_, idx) => idx !== i));
  const update = (i, f, v)   => onChange(sensors.map((s, idx) => idx === i ? { ...s, [f]: v } : s));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: T.textDimmer, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Sensors</span>
        <button onClick={add} style={btnStyle('#1d4ed8')}>+ Add</button>
      </div>
      {sensors.length === 0 && (
        <div style={{ fontSize: 11, color: T.sectionColor, fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
          No sensors configured
        </div>
      )}
      {sensors.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
          <input placeholder="ID"    value={s.id}    onChange={(e) => update(i,'id',e.target.value)}    style={{ ...IS, width: 54 }}/>
          <input placeholder="Label" value={s.label} onChange={(e) => update(i,'label',e.target.value)} style={{ ...IS, flex: 1 }}/>
          <button onClick={() => remove(i)} style={{ ...btnStyle('#7f1d1d'), padding: '4px 7px' }}>✕</button>
        </div>
      ))}
    </div>
  );
};

/* ── Input style factory ────────────────────────────────────────── */
const makeInputStyle = (T) => ({
  border: `1px solid ${T.inputBorder}`,
  borderRadius: 5,
  padding: '5px 8px',
  fontSize: 11,
  color: T.inputColor,
  background: T.inputBg,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
});

/* ── Checkbox label style ───────────────────────────────────────── */
const cbLabel = (T) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 11,
  color: T.textSecondary,
  cursor: 'pointer',
});

/* ── Node accent map ────────────────────────────────────────────── */
const NODE_ACCENT = {
  transformer: '#f59e0b',
  generator:   '#f59e0b',
  sb:          '#64748b',
  sbMain:      '#475569',
  rectifier:   '#0ea5e9',
  inverter:    '#8b5cf6',
  region:      '#475569',
};

/* ── Node properties panel ──────────────────────────────────────── */
const NodePropsForm = ({ node }) => {
  const T = useTheme();
  const IS = makeInputStyle(T);
  const { updateNodeData } = usePowerMapStore();
  const d   = node.data;
  const set = (f, v) => updateNodeData(node.id, { [f]: v });
  const accent = NODE_ACCENT[node.type] || T.textDimmer;

  return (
    <div style={{ padding: '14px 14px', overflowY: 'auto', flex: 1 }}>
      {/* Type badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 4, height: 28, borderRadius: 2, background: accent, flexShrink: 0 }}/>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.textPrimary }}>{d.label || '—'}</div>
          <div style={{ fontSize: 9, color: T.textDimmer, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 1 }}>{node.type}</div>
        </div>
      </div>

      <Field label="Label" T={T}>
        <input value={d.label || ''} onChange={(e) => set('label', e.target.value)} style={IS}/>
      </Field>

      <Field label="Status" T={T}>
        <div style={{ display: 'flex', gap: 10 }}>
          <label style={cbLabel(T)}>
            <input type="checkbox" checked={!!d.status}        onChange={(e) => set('status', e.target.checked)}/> Active
          </label>
          {d.primaryStatus !== undefined && (
            <label style={cbLabel(T)}>
              <input type="checkbox" checked={!!d.primaryStatus} onChange={(e) => set('primaryStatus', e.target.checked)}/> Primary
            </label>
          )}
        </div>
      </Field>

      {d.mainF !== undefined && (
        <Field label="Main Formula (mainF)" T={T}>
          <input placeholder="e.g. 151 AND 267" value={d.mainF || ''} onChange={(e) => set('mainF', e.target.value)} style={IS}/>
        </Field>
      )}

      {d.indicatorF !== undefined && (
        <Field label="Indicator Formula (indicatorF)" T={T}>
          <input placeholder="e.g. 146" value={d.indicatorF || ''} onChange={(e) => set('indicatorF', e.target.value)} style={IS}/>
        </Field>
      )}

      {node.type !== 'region' && (
        <>
          <Divider T={T}/>
          <SensorEditor sensors={d.sensors || []} onChange={(s) => set('sensors', s)} T={T}/>
        </>
      )}
    </div>
  );
};

/* ── Edge properties panel ──────────────────────────────────────── */
const EdgePropsForm = ({ edge }) => {
  const T = useTheme();
  const IS = makeInputStyle(T);
  const { edges, setEdges } = usePowerMapStore();

  const patchEdge = (field, val) =>
    setEdges(edges.map((e) => {
      if (e.id !== edge.id) return e;
      const newData = { ...e.data, [field]: val };
      const isState = field === 'state';
      return {
        ...e,
        data: newData,
        animated: isState ? val : e.animated,
        style: isState ? makeEdgeStyle(val) : e.style,
      };
    }));

  const patchMarker = (val) =>
    setEdges(edges.map((e) =>
      e.id === edge.id
        ? { ...e, markerEnd: val ? { type: 'arrowclosed' } : undefined }
        : e
    ));

  const d = edge.data || {};

  return (
    <div style={{ padding: '14px 14px', overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 4, height: 28, borderRadius: 2, background: d.state ? '#22c55e' : T.border, flexShrink: 0 }}/>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.textPrimary }}>Wire / Edge</div>
          <div style={{ fontSize: 9, color: T.textDimmer, letterSpacing: '0.04em', marginTop: 1 }}>
            {edge.source} → {edge.target}
          </div>
        </div>
      </div>

      <Field label="Flow State" T={T}>
        <label style={cbLabel(T)}>
          <input type="checkbox" checked={!!d.state} onChange={(e) => patchEdge('state', e.target.checked)}/>
          Active — green animated line
        </label>
      </Field>

      <Field label="Main Formula (mainF)" T={T}>
        <input placeholder="e.g. 151 AND 267" value={d.mainF || ''} onChange={(e) => patchEdge('mainF', e.target.value)} style={IS}/>
      </Field>

      <Field label="Options" T={T}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={cbLabel(T)}>
            <input type="checkbox" checked={!!d.changeFlow} onChange={(e) => patchEdge('changeFlow', e.target.checked)}/>
            Reverse flow direction
          </label>
          <label style={cbLabel(T)}>
            <input type="checkbox" checked={!!edge.markerEnd} onChange={(e) => patchMarker(e.target.checked)}/>
            Show arrowhead
          </label>
        </div>
      </Field>
    </div>
  );
};

/* ── Sensor cards (empty state) ─────────────────────────────────── */
const SensorCards = () => {
  const T = useTheme();
  const { nodes } = usePowerMapStore();
  const cards = nodes.filter((n) => !['region','sb','sbMain'].includes(n.type) && n.data.sensors?.length > 0);

  const ACCENT = NODE_ACCENT;

  if (cards.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: T.sectionColor, textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ marginBottom: 12, opacity: 0.4 }}>
          <rect x="4" y="8" width="32" height="24" rx="4" stroke={T.textMuted} strokeWidth="2"/>
          <line x1="4" y1="15" x2="36" y2="15" stroke={T.textMuted} strokeWidth="1.5"/>
          <line x1="12" y1="21" x2="28" y2="21" stroke={T.textMuted} strokeWidth="1.5"/>
          <line x1="12" y1="26" x2="22" y2="26" stroke={T.textMuted} strokeWidth="1.5"/>
        </svg>
        <div style={{ fontSize: 11, color: T.textDimmer, lineHeight: 1.5 }}>
          No sensor cards yet.<br/>Select a node and add sensors.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '10px 12px', overflowY: 'auto', flex: 1 }}>
      {cards.map((n) => {
        const accent = ACCENT[n.type] || T.textDimmer;
        return (
          <div key={n.id} style={{
            border: `1px solid ${n.data.status ? '#166534' : T.border}`,
            borderTop: `2px solid ${n.data.status ? '#22c55e' : accent}`,
            borderRadius: '0 0 7px 7px',
            marginBottom: 10,
            overflow: 'hidden',
            background: T.inputBg,
          }}>
            <div style={{
              padding: '6px 10px',
              borderBottom: `1px solid ${T.borderSubtle}`,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: n.data.status ? 'rgba(34,197,94,0.08)' : T.subBg,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: n.data.status ? '#22c55e' : T.statusOffColor ?? T.border, boxShadow: n.data.status ? '0 0 5px #22c55e' : 'none', flexShrink: 0 }}/>
              <span style={{ fontSize: 11, fontWeight: 700, color: n.data.status ? '#d1fae5' : T.textSecondary, flex: 1 }}>{n.data.label}</span>
              <span style={{ fontSize: 9, color: n.data.status ? '#22c55e' : T.sectionColor, fontWeight: 700, letterSpacing: '0.06em' }}>
                {n.data.status ? 'ACTIVE' : 'OFFLINE'}
              </span>
            </div>
            <div style={{ padding: '5px 10px 7px' }}>
              {n.data.sensors.map((s, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 0',
                  borderBottom: i < n.data.sensors.length - 1 ? `1px solid ${T.borderSubtle}` : 'none',
                }}>
                  <span style={{ fontSize: 10, color: T.textDimmer }}>{s.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, fontFamily: 'monospace' }}>#{s.id}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── Footer sensor config ───────────────────────────────────────── */
const FooterConfig = () => {
  const T = useTheme();
  const IS = makeInputStyle(T);
  const { footerSensors, setFooterSensors } = usePowerMapStore();
  const set = (k, v) => setFooterSensors({ ...footerSensors, [k]: v });

  return (
    <div style={{ borderTop: `1px solid ${T.borderSubtle}`, padding: '10px 14px 12px', background: T.subBg }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: T.sectionColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
        Footer Sensors
      </div>
      {[['TotalLoad','Total Load'],['PUE','PUE'],['ITLoad','IT Load']].map(([key, label]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
          <span style={{ fontSize: 10, color: T.textDimmer, width: 66, flexShrink: 0 }}>{label}</span>
          <input
            placeholder="Sensor ID"
            value={footerSensors[key] || ''}
            onChange={(e) => set(key, e.target.value)}
            style={{ ...IS, flex: 1 }}
          />
        </div>
      ))}
    </div>
  );
};

/* ── Root panel ─────────────────────────────────────────────────── */
const PowerMapProperties = ({ selectedNode, selectedEdge }) => {
  const T = useTheme();
  return (
    <div style={{
      width: 246,
      background: T.propsBg,
      borderLeft: `1px solid ${T.border}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: `1px solid ${T.borderSubtle}`,
        fontSize: 11,
        fontWeight: 800,
        color: T.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        background: T.headerBg,
      }}>
        {selectedNode ? 'Node Properties' : selectedEdge ? 'Edge Properties' : 'Sensor Cards'}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selectedNode
          ? <NodePropsForm node={selectedNode}/>
          : selectedEdge
            ? <EdgePropsForm edge={selectedEdge}/>
            : <SensorCards/>
        }
      </div>

      <FooterConfig/>
    </div>
  );
};

export default PowerMapProperties;
