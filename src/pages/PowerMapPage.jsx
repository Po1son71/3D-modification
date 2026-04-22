import React, { useState, useRef, useCallback } from 'react';
import PowerMapEditor from '../components/PowerMap/PowerMapEditor';
import PowerMapProperties from '../components/PowerMap/PowerMapProperties';
import usePowerMapStore from '../store/powerMapStore';
import { useTheme } from '../components/PowerMap/powerMapTheme';

/* ── Top toolbar ─────────────────────────────────────────────────── */
const Toolbar = ({ onImport, onExport }) => {
  const { editMode, setEditMode, isDark, setIsDark } = usePowerMapStore();

  return (
    <div style={{
      height: 46,
      background: '#1e293b',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 8,
      borderBottom: '1px solid #334155',
      flexShrink: 0,
    }}>
      {/* Title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        marginRight: 12,
      }}>
        <span style={{ fontSize: 16 }}>⚡</span>
        <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: 13 }}>Power Map Editor</span>
      </div>

      <div style={{ width: 1, height: 22, background: '#334155', margin: '0 4px' }} />

      {/* Edit / View toggle */}
      <div style={{
        display: 'flex',
        background: '#0f172a',
        borderRadius: 6,
        padding: 2,
        gap: 2,
      }}>
        {['edit', 'view'].map((mode) => (
          <button
            key={mode}
            onClick={() => setEditMode(mode === 'edit')}
            style={{
              padding: '4px 14px',
              borderRadius: 5,
              border: 'none',
              background: (editMode ? 'edit' : 'view') === mode ? '#3b82f6' : 'transparent',
              color: (editMode ? 'edit' : 'view') === mode ? '#fff' : '#94a3b8',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {mode === 'edit' ? '✏️ Edit' : '👁️ View'}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 22, background: '#334155', margin: '0 4px' }} />

      {/* Import */}
      <button
        onClick={onImport}
        style={{
          background: '#334155',
          color: '#f1f5f9',
          border: '1px solid #475569',
          borderRadius: 6,
          padding: '5px 12px',
          fontSize: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        📂 Import JSON
      </button>

      {/* Export */}
      <button
        onClick={onExport}
        style={{
          background: '#22c55e',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '5px 12px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        💾 Export JSON
      </button>

      <div style={{ width: 1, height: 22, background: '#334155', margin: '0 4px' }} />

      {/* Light / Dark segmented toggle */}
      <div style={{
        display: 'flex',
        background: '#0f172a',
        borderRadius: 6,
        padding: 2,
        gap: 2,
      }}>
        {[
          { key: 'dark',  label: '🌙 Dark' },
          { key: 'light', label: '☀️ Light' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setIsDark(key === 'dark')}
            style={{
              padding: '4px 12px',
              borderRadius: 5,
              border: 'none',
              background: isDark === (key === 'dark') ? '#3b82f6' : 'transparent',
              color:      isDark === (key === 'dark') ? '#fff'    : '#94a3b8',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* Help hint */}
      {editMode && (
        <div style={{ color: '#64748b', fontSize: 11 }}>
          Drag components from palette · Click to select · Delete key removes · Connect handles to draw wires
        </div>
      )}
    </div>
  );
};

/* ── Footer bar (sensor totals) ────────────────────────────────── */
const Footer = () => {
  const { footerSensors } = usePowerMapStore();

  const items = [
    { key: 'TotalLoad', label: 'Total Load' },
    { key: 'PUE',       label: 'PUE' },
    { key: 'ITLoad',    label: 'IT Load' },
  ];

  return (
    <div style={{
      height: 36,
      background: '#1e293b',
      borderTop: '1px solid #334155',
      display: 'flex',
      alignItems: 'center',
      padding: '0 18px',
      gap: 28,
      flexShrink: 0,
    }}>
      {items.map(({ key, label }) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: '#64748b', fontSize: 11 }}>{label}:</span>
          <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>
            {footerSensors[key] ? `Sensor #${footerSensors[key]}` : '—'}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Page ─────────────────────────────────────────────────────────── */
const PowerMapPage = () => {
  const T = useTheme();
  const { importConfig, mergeConfig, exportConfig } = usePowerMapStore();
  const fileInputRef = useRef(null);

  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [pendingJson, setPendingJson] = useState(null); // { text, name }

  /* Sync selection state with store updates */
  const { nodes, edges } = usePowerMapStore();

  const syncedNode = selectedNode
    ? nodes.find((n) => n.id === selectedNode.id) ?? null
    : null;
  const syncedEdge = selectedEdge
    ? edges.find((e) => e.id === selectedEdge.id) ?? null
    : null;

  /* Import */
  const handleImport = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        JSON.parse(ev.target.result); // validate
        setPendingJson({ text: ev.target.result, name: file.name });
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const doImport = (mode) => {
    if (!pendingJson) return;
    try {
      const json = JSON.parse(pendingJson.text);
      const config = json.Config ?? json;
      if (mode === 'overwrite') {
        importConfig(config);
        setSelectedNode(null);
        setSelectedEdge(null);
      } else {
        mergeConfig(config);
      }
    } catch {
      alert('Invalid JSON file');
    }
    setPendingJson(null);
  };

  /* Export */
  const handleExport = useCallback(() => {
    const data = exportConfig();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'powermap-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportConfig]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      background: T.canvasBg,
    }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Toolbar onImport={handleImport} onExport={handleExport} />

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Canvas + palette */}
        <PowerMapEditor
          onNodeSelect={setSelectedNode}
          onEdgeSelect={setSelectedEdge}
        />

        {/* Right panel */}
        <PowerMapProperties
          selectedNode={syncedNode}
          selectedEdge={syncedEdge}
        />
      </div>

      <Footer />

      {/* ── Import mode dialog ──────────────────────────────────────── */}
      {pendingJson && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setPendingJson(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1e293b', borderRadius: 10,
              boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
              width: 380, padding: '24px 24px 20px',
              border: '1px solid #334155',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
              Import Power Map
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 18 }}>
              <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{pendingJson.name}</span>
              {' '}— how do you want to import?
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <button
                onClick={() => doImport('merge')}
                style={{
                  padding: '10px 14px', borderRadius: 7, textAlign: 'left',
                  border: '1px solid #334155', background: '#0f172a',
                  cursor: 'pointer', transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#1e3a5f'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.background = '#0f172a'; }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>➕ Add to current</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                  Imported nodes are placed alongside existing ones. All IDs are re-generated to avoid conflicts.
                </div>
              </button>

              <button
                onClick={() => doImport('overwrite')}
                style={{
                  padding: '10px 14px', borderRadius: 7, textAlign: 'left',
                  border: '1px solid #334155', background: '#0f172a',
                  cursor: 'pointer', transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.background = '#450a0a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.background = '#0f172a'; }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>🗑 Overwrite</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                  Current map is discarded and replaced entirely with the imported file.
                </div>
              </button>
            </div>

            <button
              onClick={() => setPendingJson(null)}
              style={{
                width: '100%', padding: '7px', borderRadius: 6,
                border: '1px solid #334155', background: 'transparent',
                color: '#64748b', fontSize: 12, cursor: 'pointer',
              }}
            >Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PowerMapPage;
