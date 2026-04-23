import React, { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  useUpdateNodeInternals,
  Panel,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import usePowerMapStore, { genNodeId, genEdgeId } from '../../store/powerMapStore';
import { useTheme } from './powerMapTheme';
import {
  NODE_TYPES,
  PALETTE_ITEMS,
  PalettePreview,
  DEFAULT_NODE_DATA,
} from './PowerMapNodeTypes';

/* ── Keeps edge paths in sync with rotated nodes ───────────────────
   Rendered inside <ReactFlow> so it has access to the RF context.
   Fires after every nodes-array change (import, rotation update, etc.)
   and calls updateNodeInternals for every node that carries a rotation.
   ─────────────────────────────────────────────────────────────────── */
const RotationEdgeSync = ({ nodes }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    const rotated = nodes.filter((n) => n.data?.rotation);
    if (rotated.length) rotated.forEach((n) => updateNodeInternals(n.id));
  }, [nodes, updateNodeInternals]);
  return null;
};

/* ── Edge factory ───────────────────────────────────────────────── */
const makeEdgeStyle = (state) => ({
  stroke: state ? '#22c55e' : '#1e3a5f',
  strokeWidth: state ? 2.5 : 1.8,
  filter: state ? 'drop-shadow(0 0 4px #22c55e88)' : 'none',
});

/* ══════════════════════════════════════════════════════════════════
   PALETTE
   ══════════════════════════════════════════════════════════════════ */
const Palette = () => {
  const T = useTheme();

  const onDragStart = (e, type) => {
    e.dataTransfer.setData('application/reactflow-type', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{
      width: 116,
      background: T.paletteBg,
      borderRight: `1px solid ${T.border}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '12px 8px',
      gap: 5,
      overflowY: 'auto',
      flexShrink: 0,
    }}>
      <div style={{
        fontSize: 9,
        fontWeight: 800,
        color: T.sectionColor,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: 6,
        paddingLeft: 4,
      }}>
        Components
      </div>

      {PALETTE_ITEMS.map(({ type, label, accent }) => (
        <div
          key={type}
          draggable
          onDragStart={(e) => onDragStart(e, type)}
          title={`Drag to place ${label}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '6px 4px 5px',
            borderRadius: 7,
            background: T.paletteItemBg,
            border: `1px solid ${T.border}`,
            borderTop: `2px solid ${accent}`,
            cursor: 'grab',
            userSelect: 'none',
            transition: 'background 0.12s, box-shadow 0.12s',
            gap: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = T.paletteItemHover;
            e.currentTarget.style.boxShadow = `0 0 10px ${accent}44`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = T.paletteItemBg;
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <PalettePreview type={type}/>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            color: T.textSecondary,
            textAlign: 'center',
            lineHeight: 1.25,
            marginTop: 2,
            letterSpacing: '0.02em',
          }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   REACT FLOW CANVAS
   ══════════════════════════════════════════════════════════════════ */
const PowerMapEditorInner = ({ onNodeSelect, onEdgeSelect }) => {
  const { nodes, edges, setNodes, setEdges, editMode } = usePowerMapStore();
  const T = useTheme();
  const { screenToFlowPosition } = useReactFlow();
  const wrapperRef = useRef(null);

  const onConnect = useCallback(
    (params) => {
      const edge = {
        ...params,
        id: genEdgeId(),
        type: 'smoothstep',
        animated: false,
        style: makeEdgeStyle(false),
        data: { mainF: '', state: false, changeFlow: false },
      };
      setEdges(addEdge(edge, edges));
    },
    [edges, setEdges]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow-type');
      if (!type) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const isRegion = type === 'region';
      setNodes([
        ...nodes,
        {
          id: genNodeId(),
          type,
          position,
          draggable: true,
          ...(isRegion ? {
            zIndex: -1,
            style: { width: 350, height: 480 },
          } : { zIndex: 1 }),
          data: { ...DEFAULT_NODE_DATA[type] },
        },
      ]);
    },
    [nodes, setNodes, screenToFlowPosition]
  );

  const onNodeClick    = useCallback((_, n) => { onNodeSelect(n); onEdgeSelect(null); }, [onNodeSelect, onEdgeSelect]);
  const onEdgeClick    = useCallback((_, e) => { onEdgeSelect(e); onNodeSelect(null); }, [onEdgeSelect, onNodeSelect]);
  const onPaneClick    = useCallback(()     => { onNodeSelect(null); onEdgeSelect(null); }, [onNodeSelect, onEdgeSelect]);

  const onKeyDown = useCallback((e) => {
    if (!editMode) return;
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    setNodes(nodes.filter((n) => !n.selected));
    setEdges(edges.filter((ed) => !ed.selected));
  }, [nodes, edges, setNodes, setEdges, editMode]);

  return (
    <div ref={wrapperRef} style={{ flex: 1, height: '100%' }} onKeyDown={onKeyDown} tabIndex={0}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={(c) => setNodes(applyNodeChanges(c, nodes))}
        onEdgesChange={(c) => setEdges(applyEdgeChanges(c, edges))}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodesDraggable={editMode}
        nodesConnectable={editMode}
        elementsSelectable={editMode}
        selectionOnDrag={editMode}
        selectionKeyCode="Control"
        multiSelectionKeyCode="Control"
        elevateNodesOnSelect
        connectionMode="loose"
        isValidConnection={() => true}
        fitView
        defaultEdgeOptions={{ type: 'smoothstep' }}
        style={{ background: T.canvasBg }}
      >
        <RotationEdgeSync nodes={nodes}/>

        <Background
          variant={BackgroundVariant.Dots}
          color={T.dotColor}
          gap={24}
          size={1.5}
        />

        <Controls
          style={{
            background: T.minimapBg,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
          }}
          showInteractive={false}
        />

        <MiniMap
          nodeColor={(n) => {
            if (n.data?.status) return '#22c55e';
            const m = { transformer:'#f59e0b', generator:'#f59e0b', rectifier:'#0ea5e9', inverter:'#8b5cf6', sb:'#475569', sbMain:'#334155', region:'#1e3050' };
            return m[n.type] ?? '#1e3050';
          }}
          maskColor={T.isDark ? 'rgba(8,15,26,0.7)' : 'rgba(241,245,249,0.7)'}
          style={{
            background: T.minimapBg,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
          }}
        />

        {!editMode && (
          <Panel position="top-center">
            <div style={{
              background: T.panelFloatBg,
              color: T.textSecondary,
              padding: '5px 16px',
              borderRadius: 20,
              fontSize: 11,
              border: `1px solid ${T.border}`,
              backdropFilter: 'blur(4px)',
            }}>
              View Mode — switch to Edit to make changes
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   PAGE-LEVEL WRAPPER (provides ReactFlow context)
   ══════════════════════════════════════════════════════════════════ */
const PowerMapEditor = ({ onNodeSelect, onEdgeSelect }) => {
  const { editMode } = usePowerMapStore();
  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      {editMode && <Palette />}
      <ReactFlowProvider>
        <PowerMapEditorInner onNodeSelect={onNodeSelect} onEdgeSelect={onEdgeSelect} />
      </ReactFlowProvider>
    </div>
  );
};

export { makeEdgeStyle };
export default PowerMapEditor;
