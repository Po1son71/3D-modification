import { createSlice, current } from '@reduxjs/toolkit';

const INITIAL_GRID_SIZE = 50;

const makeGrid = (rows, cols) =>
  Array(rows).fill(null).map(() => Array(cols).fill(null));

const initialState = {
  rows:       10,
  columns:    10,
  isConfigured: false,
  inventory:  [],
  pathways:   [],
  isLoading:  false,
  viewMode:   'display',
  gridData:   makeGrid(INITIAL_GRID_SIZE, INITIAL_GRID_SIZE),
  selectedTool:    'floor',
  pathwayColor:    '#FFD700',
  pathwayWidth:    0.8,
  pathwayOpacity:  0.5,
  editMode:        'draw',
  gridHistory:     [],
  historyIndex:    -1,
};

const warehouseSlice = createSlice({
  name: 'warehouse',
  initialState,
  reducers: {
    setWarehouseConfig(state, { payload: { rows, columns } }) {
      state.rows         = rows;
      state.columns      = columns;
      state.isConfigured = true;
      state.gridData     = makeGrid(rows, columns);
      state.gridHistory  = [];
      state.historyIndex = -1;
    },

    loadInventory(state, { payload }) { state.inventory = payload || []; },

    addItem(state, { payload }) { state.inventory.push(payload); },

    updateItem(state, { payload: { itemId, updates } }) {
      const item = state.inventory.find((i) => i.id === itemId);
      if (item) Object.assign(item, updates);
    },

    removeItem(state, { payload: itemId }) {
      state.inventory = state.inventory.filter((i) => i.id !== itemId);
    },

    loadPathways(state, { payload }) { state.pathways = payload || []; },

    addPathway(state, { payload }) { state.pathways.push(payload); },

    updatePathway(state, { payload: { pathwayId, updates } }) {
      const p = state.pathways.find((p) => p.id === pathwayId);
      if (p) Object.assign(p, updates);
    },

    removePathway(state, { payload: pathwayId }) {
      state.pathways = state.pathways.filter((p) => p.id !== pathwayId);
    },

    setViewMode(state, { payload })     { state.viewMode     = payload; },
    setEditMode(state, { payload })     { state.editMode     = payload; },
    setSelectedTool(state, { payload }) { state.selectedTool = payload; },
    setPathwayColor(state, { payload }) { state.pathwayColor = payload; },
    setPathwayWidth(state, { payload }) { state.pathwayWidth = payload; },
    setPathwayOpacity(state, { payload }) { state.pathwayOpacity = payload; },

    updateGridCell(state, { payload: { row, col, value } }) {
      // Push current grid to history (limit 50)
      const newHistory = state.gridHistory.slice(0, state.historyIndex + 1);
      newHistory.push(current(state.gridData).map((r) => [...r]));
      if (newHistory.length > 50) newHistory.shift();

      const newGrid = current(state.gridData).map((r) => [...r]);
      newGrid[row][col] = value;

      state.gridData     = newGrid;
      state.gridHistory  = newHistory;
      state.historyIndex = newHistory.length - 1;
    },

    clearGrid(state) {
      state.gridData     = makeGrid(state.rows, state.columns);
      state.gridHistory  = [];
      state.historyIndex = -1;
    },

    undoGridChange(state) {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        state.gridData     = state.gridHistory[newIndex].map((r) => [...r]);
        state.historyIndex = newIndex;
      }
    },

    redoGridChange(state) {
      if (state.historyIndex < state.gridHistory.length - 1) {
        const newIndex = state.historyIndex + 1;
        state.gridData     = state.gridHistory[newIndex].map((r) => [...r]);
        state.historyIndex = newIndex;
      }
    },

    _setPathways(state, { payload }) { state.pathways = payload; },

    resetWarehouse(state) {
      state.rows          = 10;
      state.columns       = 10;
      state.isConfigured  = false;
      state.inventory     = [];
      state.pathways      = [];
      state.viewMode      = 'display';
      state.gridData      = makeGrid(INITIAL_GRID_SIZE, INITIAL_GRID_SIZE);
    },
  },
});

export const {
  setWarehouseConfig, loadInventory, addItem, updateItem, removeItem,
  loadPathways, addPathway, updatePathway, removePathway,
  setViewMode, setEditMode, setSelectedTool,
  setPathwayColor, setPathwayWidth, setPathwayOpacity,
  updateGridCell, clearGrid, undoGridChange, redoGridChange,
  resetWarehouse,
} = warehouseSlice.actions;

// ── applyGridToWarehouse thunk ────────────────────────────────────────────────
// Reads the current grid, extracts pathway regions, updates the pathways list.
export const applyGridToWarehouse = () => (dispatch, getState) => {
  const { rows, columns, gridData } = getState().warehouse;
  const pathways = [];
  const visited  = Array(rows).fill(null).map(() => Array(columns).fill(false));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const cell = gridData[row]?.[col];
      if (cell && cell.type === 'pathway' && !visited[row][col]) {
        let minRow = row, maxRow = row, minCol = col, maxCol = col;
        const queue = [[row, col]];
        visited[row][col] = true;

        while (queue.length > 0) {
          const [r, c] = queue.shift();
          minRow = Math.min(minRow, r);
          maxRow = Math.max(maxRow, r);
          minCol = Math.min(minCol, c);
          maxCol = Math.max(maxCol, c);

          [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([nr, nc]) => {
            if (nr >= 0 && nr < rows && nc >= 0 && nc < columns &&
                !visited[nr][nc] &&
                gridData[nr]?.[nc]?.type === 'pathway' &&
                gridData[nr]?.[nc]?.color === cell.color) {
              visited[nr][nc] = true;
              queue.push([nr, nc]);
            }
          });
        }

        pathways.push({
          id:       `path-${pathways.length + 1}`,
          startRow: minRow,
          startCol: minCol,
          endRow:   maxRow,
          endCol:   maxCol,
          width:    cell.width   || 0.8,
          color:    cell.color   || '#FFD700',
          opacity:  cell.opacity || 0.5,
          type:     'floor',
        });
      }
    }
  }

  dispatch(warehouseSlice.actions._setPathways(pathways));
};

// ── exportGridToPathways / exportAllData are pure computations ────────────────
export const exportGridToPathways = (state) => {
  const { rows, columns, gridData } = state;
  const pathways = [];
  const visited  = Array(rows).fill(null).map(() => Array(columns).fill(false));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const cell = gridData[row]?.[col];
      if (cell && cell.type === 'pathway' && !visited[row][col]) {
        let minRow = row, maxRow = row, minCol = col, maxCol = col;
        const queue = [[row, col]];
        visited[row][col] = true;

        while (queue.length > 0) {
          const [r, c] = queue.shift();
          minRow = Math.min(minRow, r);
          maxRow = Math.max(maxRow, r);
          minCol = Math.min(minCol, c);
          maxCol = Math.max(maxCol, c);

          [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([nr, nc]) => {
            if (nr >= 0 && nr < rows && nc >= 0 && nc < columns &&
                !visited[nr][nc] &&
                gridData[nr]?.[nc]?.type === 'pathway' &&
                gridData[nr]?.[nc]?.color === cell.color) {
              visited[nr][nc] = true;
              queue.push([nr, nc]);
            }
          });
        }

        pathways.push({
          id:       `path-${pathways.length + 1}`,
          startRow: minRow,
          startCol: minCol,
          endRow:   maxRow,
          endCol:   maxCol,
          width:    cell.width   || 0.8,
          color:    cell.color   || '#FFD700',
          opacity:  cell.opacity || 0.5,
          type:     'pathway',
        });
      }
    }
  }

  return pathways;
};

export default warehouseSlice.reducer;
