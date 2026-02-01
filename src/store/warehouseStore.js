import { create } from 'zustand';

const useWarehouseStore = create((set) => ({
    // Warehouse configuration
    rows: 10,
    columns: 10,
    isConfigured: false,

    // Warehouse inventory data
    inventory: [],

    // Pathways connecting floor areas
    pathways: [],

    // UI state
    isLoading: false,

    // Edit Mode state
    viewMode: 'display', // 'display' or 'edit'
    gridData: Array(50).fill(null).map(() => Array(50).fill(null)), // 50x50 grid
    selectedTool: 'floor', // 'floor', 'pathway', 'eraser'
    pathwayColor: '#FFD700', // Current pathway color
    pathwayWidth: 0.8, // Pathway width
    pathwayOpacity: 0.5, // Pathway opacity
    editMode: "draw",

    // Undo/Redo state
    gridHistory: [],
    historyIndex: -1,

    // Actions
    setWarehouseConfig: (rows, columns) => set({
        rows,
        columns,
        isConfigured: true,
        gridData: Array(rows).fill(null).map(() => Array(columns).fill(null)),
        gridHistory: [],
        historyIndex: -1
    }),

    loadInventory: (data) => set({
        inventory: data || []
    }),

    addItem: (item) => set((state) => ({
        inventory: [...state.inventory, item]
    })),

    updateItem: (itemId, updates) => set((state) => ({
        inventory: state.inventory.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        )
    })),

    removeItem: (itemId) => set((state) => ({
        inventory: state.inventory.filter(item => item.id !== itemId)
    })),

    // Pathway management
    loadPathways: (data) => set({
        pathways: data || []
    }),

    addPathway: (pathway) => set((state) => ({
        pathways: [...state.pathways, pathway]
    })),

    updatePathway: (pathwayId, updates) => set((state) => ({
        pathways: state.pathways.map(pathway =>
            pathway.id === pathwayId ? { ...pathway, ...updates } : pathway
        )
    })),

    removePathway: (pathwayId) => set((state) => ({
        pathways: state.pathways.filter(pathway => pathway.id !== pathwayId)
    })),

    // Edit Mode actions
    setViewMode: (mode) => set({ viewMode: mode }),

    setEditMode: (mode) => set({ editMode: mode }),

    setSelectedTool: (tool) => set({ selectedTool: tool }),

    setPathwayColor: (color) => set({ pathwayColor: color }),

    setPathwayWidth: (width) => set({ pathwayWidth: width }),

    setPathwayOpacity: (opacity) => set({ pathwayOpacity: opacity }),

    updateGridCell: (row, col, value) => set((state) => {
        // Save current state to history
        const newHistory = state.gridHistory.slice(0, state.historyIndex + 1);
        newHistory.push(state.gridData.map(r => [...r]));

        // Limit history to last 50 states
        if (newHistory.length > 50) {
            newHistory.shift();
        }

        const newGrid = state.gridData.map(r => [...r]);
        newGrid[row][col] = value;

        return {
            gridData: newGrid,
            gridHistory: newHistory,
            historyIndex: newHistory.length - 1
        };
    }),

    clearGrid: () => set((state) => ({
        gridData: Array(state.rows).fill(null).map(() => Array(state.columns).fill(null)),
        gridHistory: [],
        historyIndex: -1
    })),

    // Undo last grid change
    undoGridChange: () => set((state) => {
        if (state.historyIndex > 0) {
            const newIndex = state.historyIndex - 1;
            return {
                gridData: state.gridHistory[newIndex].map(r => [...r]),
                historyIndex: newIndex
            };
        }
        return {};
    }),

    // Redo grid change
    redoGridChange: () => set((state) => {
        if (state.historyIndex < state.gridHistory.length - 1) {
            const newIndex = state.historyIndex + 1;
            return {
                gridData: state.gridHistory[newIndex].map(r => [...r]),
                historyIndex: newIndex
            };
        }
        return {};
    }),

    // Apply grid editor data to warehouse (sync edit mode to display mode)
    applyGridToWarehouse: () => {
        const state = useWarehouseStore.getState();
        const pathways = [];
        const visited = Array(state.rows).fill(null).map(() => Array(state.columns).fill(false));

        // Extract pathways from grid
        for (let row = 0; row < state.rows; row++) {
            for (let col = 0; col < state.columns; col++) {
                const cell = state.gridData[row]?.[col];
                if (cell && cell.type === 'pathway' && !visited[row][col]) {
                    // Find the extent of this pathway
                    let minRow = row, maxRow = row, minCol = col, maxCol = col;

                    // Simple flood fill to find connected pathway cells
                    const queue = [[row, col]];
                    visited[row][col] = true;

                    while (queue.length > 0) {
                        const [r, c] = queue.shift();
                        minRow = Math.min(minRow, r);
                        maxRow = Math.max(maxRow, r);
                        minCol = Math.min(minCol, c);
                        maxCol = Math.max(maxCol, c);

                        // Check adjacent cells
                        [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([nr, nc]) => {
                            if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.columns &&
                                !visited[nr][nc] &&
                                state.gridData[nr]?.[nc]?.type === 'pathway' &&
                                state.gridData[nr]?.[nc]?.color === cell.color) {
                                visited[nr][nc] = true;
                                queue.push([nr, nc]);
                            }
                        });
                    }

                    // Create pathway object
                    pathways.push({
                        id: `path-${pathways.length + 1}`,
                        startRow: minRow,
                        startCol: minCol,
                        endRow: maxRow,
                        endCol: maxCol,
                        width: cell.width || 0.8,
                        color: cell.color || '#FFD700',
                        opacity: cell.opacity || 0.5,
                        type: 'floor'
                    });
                }
            }
        }

        // Update pathways in store
        set({ pathways });
    },

    // Export grid data to pathway JSON format (legacy - kept for backwards compatibility)
    exportGridToPathways: () => {
        const state = useWarehouseStore.getState();
        const pathways = [];
        const visited = Array(state.rows).fill(null).map(() => Array(state.columns).fill(false));

        // Find contiguous pathway regions
        for (let row = 0; row < state.rows; row++) {
            for (let col = 0; col < state.columns; col++) {
                const cell = state.gridData[row]?.[col];
                if (cell && cell.type === 'pathway' && !visited[row][col]) {
                    // Find the extent of this pathway
                    let minRow = row, maxRow = row, minCol = col, maxCol = col;

                    // Simple flood fill to find connected pathway cells
                    const queue = [[row, col]];
                    visited[row][col] = true;

                    while (queue.length > 0) {
                        const [r, c] = queue.shift();
                        minRow = Math.min(minRow, r);
                        maxRow = Math.max(maxRow, r);
                        minCol = Math.min(minCol, c);
                        maxCol = Math.max(maxCol, c);

                        // Check adjacent cells
                        [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([nr, nc]) => {
                            if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.columns &&
                                !visited[nr][nc] &&
                                state.gridData[nr]?.[nc]?.type === 'pathway' &&
                                state.gridData[nr]?.[nc]?.color === cell.color) {
                                visited[nr][nc] = true;
                                queue.push([nr, nc]);
                            }
                        });
                    }

                    // Create pathway object
                    pathways.push({
                        id: `path-${pathways.length + 1}`,
                        startRow: minRow,
                        startCol: minCol,
                        endRow: maxRow,
                        endCol: maxCol,
                        width: cell.width || 0.8,
                        color: cell.color || '#FFD700',
                        opacity: cell.opacity || 0.5,
                        type: 'pathway'
                    });
                }
            }
        }

        return pathways;
    },

    // Export all warehouse data including config, inventory, pathways, and floor tiles
    exportAllData: () => {
        const state = useWarehouseStore.getState();
        const pathways = [];
        const floors = [];
        const visitedPathways = Array(state.rows).fill(null).map(() => Array(state.columns).fill(false));
        const visitedFloors = Array(state.rows).fill(null).map(() => Array(state.columns).fill(false));

        // Extract pathways from grid
        for (let row = 0; row < state.rows; row++) {
            for (let col = 0; col < state.columns; col++) {
                const cell = state.gridData[row]?.[col];
                if (cell && cell.type === 'pathway' && !visitedPathways[row][col]) {
                    // Find the extent of this pathway
                    let minRow = row, maxRow = row, minCol = col, maxCol = col;

                    // Simple flood fill to find connected pathway cells
                    const queue = [[row, col]];
                    visitedPathways[row][col] = true;

                    while (queue.length > 0) {
                        const [r, c] = queue.shift();
                        minRow = Math.min(minRow, r);
                        maxRow = Math.max(maxRow, r);
                        minCol = Math.min(minCol, c);
                        maxCol = Math.max(maxCol, c);

                        // Check adjacent cells
                        [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([nr, nc]) => {
                            if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.columns &&
                                !visitedPathways[nr][nc] &&
                                state.gridData[nr]?.[nc]?.type === 'pathway' &&
                                state.gridData[nr]?.[nc]?.color === cell.color) {
                                visitedPathways[nr][nc] = true;
                                queue.push([nr, nc]);
                            }
                        });
                    }

                    // Create pathway object
                    pathways.push({
                        id: `path-${pathways.length + 1}`,
                        startRow: minRow,
                        startCol: minCol,
                        endRow: maxRow,
                        endCol: maxCol,
                        width: cell.width || 0.8,
                        color: cell.color || '#FFD700',
                        opacity: cell.opacity || 0.5,
                        type: 'floor'
                    });
                }
            }
        }

        // Extract floor tiles from grid
        for (let row = 0; row < state.rows; row++) {
            for (let col = 0; col < state.columns; col++) {
                const cell = state.gridData[row]?.[col];
                if (cell && cell.type === 'floor' && !visitedFloors[row][col]) {
                    // Record this floor tile
                    floors.push({
                        id: `floor-${floors.length + 1}`,
                        row,
                        col,
                        type: 'floor'
                    });
                    visitedFloors[row][col] = true;
                }
            }
        }

        // Compile all data
        return {
            warehouse: {
                rows: state.rows,
                columns: state.columns
            },
            inventory: state.inventory,
            pathways: pathways,
            floors: floors
        };
    },

    resetWarehouse: () => set({
        rows: 10,
        columns: 10,
        isConfigured: false,
        inventory: [],
        pathways: [],
        viewMode: 'display',
        gridData: Array(50).fill(null).map(() => Array(50).fill(null))
    })
}));

export default useWarehouseStore;
