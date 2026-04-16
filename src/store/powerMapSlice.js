import { createSlice } from '@reduxjs/toolkit';

let nodeIdCounter = 1;
export const genNodeId = () => `pm-node-${Date.now()}-${nodeIdCounter++}`;
let edgeIdCounter = 1;
export const genEdgeId = () => `pm-edge-${Date.now()}-${edgeIdCounter++}`;

const initialState = {
  nodes:         [],
  edges:         [],
  footerSensors: { ITLoad: '', PUE: '', TotalLoad: '' },
  editMode:      true,
  isDark:        true,
};

const powerMapSlice = createSlice({
  name: 'powerMap',
  initialState,
  reducers: {
    setNodes(state, { payload }) { state.nodes = payload; },
    setEdges(state, { payload }) { state.edges = payload; },
    setEditMode(state, { payload }) { state.editMode = payload; },
    setFooterSensors(state, { payload }) { state.footerSensors = payload; },
    setIsDark(state, { payload }) { state.isDark = payload; },

    updateNodeData(state, { payload: { id, patch } }) {
      const node = state.nodes.find((n) => n.id === id);
      if (node) node.data = { ...node.data, ...patch };
    },

    updateEdgeData(state, { payload: { id, patch } }) {
      const edge = state.edges.find((e) => e.id === id);
      if (edge) edge.data = { ...edge.data, ...patch };
    },

    importConfig(state, { payload: config }) {
      const {
        nodes: cfgNodes = [],
        edges: cfgEdges = [],
        ITLoad = '',
        PUE = '',
        TotalLoad = '',
      } = config;

      state.nodes = cfgNodes.map((n) => ({
        id:       n.id,
        type:     n.type,
        position: n.position,
        style:    n.style,
        draggable: true,
        data: {
          label:         n.data?.label         ?? '',
          status:        n.data?.status        ?? false,
          primaryStatus: n.data?.primaryStatus ?? false,
          nodeStyle:     n.data?.style,
          mainF:         n.mainF      ?? '',
          indicatorF:    n.indicatorF ?? '',
          sensors:       n.sensors    ?? [],
        },
      }));

      state.edges = cfgEdges.map((e) => ({
        id:           e.id,
        source:       e.source,
        sourceHandle: e.sourceHandle,
        target:       e.target,
        targetHandle: e.targetHandle,
        type:         e.type ?? 'smoothstep',
        markerEnd:    e.markerEnd,
        animated:     e.state ?? false,
        style:        { stroke: e.state ? '#22c55e' : '#6b7280', strokeWidth: 2 },
        data: {
          mainF:      e.mainF      ?? '',
          state:      e.state      ?? false,
          changeFlow: e.changeFlow ?? false,
        },
      }));

      state.footerSensors = { ITLoad, PUE, TotalLoad };
    },
  },
});

export const {
  setNodes, setEdges, setEditMode, setFooterSensors, setIsDark,
  updateNodeData, updateEdgeData, importConfig,
} = powerMapSlice.actions;

// exportConfig is a read-only selector-style thunk
export const exportConfig = () => (dispatch, getState) => {
  const { nodes, edges, footerSensors } = getState().powerMap;

  const cards = nodes
    .filter((n) => !['region', 'sb', 'sbMain'].includes(n.type) && n.data.sensors?.length > 0)
    .map((n) => ({ label: n.data.label, sensors: n.data.sensors }));

  const outNodes = nodes.map((n) => {
    const out = {
      data: {
        label:         n.data.label,
        primaryStatus: n.data.primaryStatus ?? false,
        status:        n.data.status        ?? false,
      },
      draggable: false,
      id:        n.id,
      position:  n.position,
      type:      n.type,
    };
    if (n.data.indicatorF) out.indicatorF = n.data.indicatorF;
    if (n.data.mainF)      out.mainF      = n.data.mainF;
    if (n.data.sensors?.length) out.sensors = n.data.sensors;
    if (n.style)           out.style      = n.style;
    if (n.data.nodeStyle)  out.data.style = n.data.nodeStyle;
    return out;
  });

  const outEdges = edges.map((e) => {
    const out = {
      changeFlow: e.data?.changeFlow ?? false,
      id:         e.id,
      mainF:      e.data?.mainF ?? '',
      source:     e.source,
      state:      e.data?.state ?? false,
      target:     e.target,
      type:       e.type ?? 'smoothstep',
    };
    if (e.sourceHandle) out.sourceHandle = e.sourceHandle;
    if (e.targetHandle) out.targetHandle = e.targetHandle;
    if (e.markerEnd)    out.markerEnd    = e.markerEnd;
    return out;
  });

  return {
    Config: {
      cards,
      edges:      outEdges,
      nodes:      outNodes,
      ITLoad:     footerSensors.ITLoad,
      PUE:        footerSensors.PUE,
      TotalLoad:  footerSensors.TotalLoad,
    },
  };
};

export default powerMapSlice.reducer;
