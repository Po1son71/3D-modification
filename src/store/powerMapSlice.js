import { createSlice } from '@reduxjs/toolkit';

let nodeIdCounter = 1;
export const genNodeId = () => `pm-node-${Date.now()}-${nodeIdCounter++}`;
let edgeIdCounter = 1;
export const genEdgeId = () => `pm-edge-${Date.now()}-${edgeIdCounter++}`;

const isRegion = (type) => type === 'region';

// shared helpers so import + merge stay in sync
const buildNode = (n) => ({
  id:         n.id,
  type:       n.type,
  position:   n.position ?? { x: 0, y: 0 },
  draggable:  true,
  ...(isRegion(n.type) ? {
    zIndex:     -1,
    dragHandle: '.region-drag-handle',
    style:      n.style ?? { width: 350, height: 480 },
  } : {
    zIndex: 1,
    ...(n.style ? { style: n.style } : {}),
  }),
  data: {
    label:         n.data?.label         ?? '',
    status:        n.data?.status        ?? false,
    primaryStatus: n.data?.primaryStatus ?? false,
    mainF:         n.data?.mainF  ?? n.mainF      ?? '',
    indicatorF:    n.data?.indicatorF ?? n.indicatorF ?? '',
    sensors:       n.data?.sensors ?? n.sensors    ?? [],
  },
});

const buildEdge = (e) => ({
  id:           e.id,
  source:       e.source,
  sourceHandle: e.sourceHandle,
  target:       e.target,
  targetHandle: e.targetHandle,
  type:         e.type ?? 'smoothstep',
  markerEnd:    e.markerEnd,
  animated:     e.data?.state ?? e.state ?? false,
  style:        { stroke: (e.data?.state ?? e.state) ? '#22c55e' : '#6b7280', strokeWidth: 2 },
  data: {
    mainF:      e.data?.mainF  ?? e.mainF      ?? '',
    state:      e.data?.state  ?? e.state      ?? false,
    changeFlow: e.data?.changeFlow ?? e.changeFlow ?? false,
  },
});

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

      state.nodes = cfgNodes.map((n) => buildNode(n));
      state.edges = cfgEdges.map((e) => buildEdge(e));
      state.footerSensors = { ITLoad, PUE, TotalLoad };
    },

    mergeConfig(state, { payload: config }) {
      const { nodes: cfgNodes = [], edges: cfgEdges = [] } = config;

      // remap IDs so merged nodes never clash with existing ones
      const idMap = {};
      const newNodes = cfgNodes.map((n) => {
        const newId = genNodeId();
        idMap[n.id] = newId;
        const node = buildNode(n);
        node.id = newId;
        // offset merged nodes so they don't land exactly on top of existing ones
        node.position = { x: (n.position?.x ?? 0) + 40, y: (n.position?.y ?? 0) + 40 };
        return node;
      });
      const newEdges = cfgEdges.map((e) => {
        const edge = buildEdge(e);
        edge.id     = genEdgeId();
        edge.source = idMap[e.source] ?? e.source;
        edge.target = idMap[e.target] ?? e.target;
        return edge;
      });

      state.nodes = [...state.nodes, ...newNodes];
      state.edges = [...state.edges, ...newEdges];
    },
  },
});

export const {
  setNodes, setEdges, setEditMode, setFooterSensors, setIsDark,
  updateNodeData, updateEdgeData, importConfig, mergeConfig,
} = powerMapSlice.actions;

// exportConfig is a read-only selector-style thunk
export const exportConfig = () => (dispatch, getState) => {
  const { nodes, edges, footerSensors } = getState().powerMap;

  const cards = nodes
    .filter((n) => !isRegion(n.type) && !['sb', 'sbMain'].includes(n.type) && n.data.sensors?.length > 0)
    .map((n) => ({ label: n.data.label, sensors: n.data.sensors }));

  const outNodes = nodes.map((n) => {
    const out = {
      id:       n.id,
      type:     n.type,
      position: n.position,
      data: {
        label:         n.data.label,
        primaryStatus: n.data.primaryStatus ?? false,
        status:        n.data.status        ?? false,
      },
    };
    // region-specific fields
    if (isRegion(n.type)) {
      out.style      = n.style ?? { width: 350, height: 480 };
      out.zIndex     = -1;
      out.dragHandle = '.region-drag-handle';
    } else {
      if (n.style) out.style = n.style;
    }
    if (n.data.indicatorF) out.data.indicatorF = n.data.indicatorF;
    if (n.data.mainF)      out.data.mainF      = n.data.mainF;
    if (n.data.sensors?.length) out.data.sensors = n.data.sensors;
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
