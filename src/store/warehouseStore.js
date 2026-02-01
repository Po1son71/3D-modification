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

    // Actions
    setWarehouseConfig: (rows, columns) => set({
        rows,
        columns,
        isConfigured: true
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
        const newGrid = state.gridData.map(r => [...r]);
        newGrid[row][col] = value;
        return { gridData: newGrid };
    }),

    clearGrid: () => set({
        gridData: Array(50).fill(null).map(() => Array(50).fill(null))
    }),

    // Export grid data to pathway JSON format (legacy - kept for backwards compatibility)
    exportGridToPathways: () => {
        const state = useWarehouseStore.getState();
        const pathways = [];
        const visited = Array(50).fill(null).map(() => Array(50).fill(false));

        // Find contiguous pathway regions
        for (let row = 0; row < 50; row++) {
            for (let col = 0; col < 50; col++) {
                const cell = state.gridData[row][col];
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
                            if (nr >= 0 && nr < 50 && nc >= 0 && nc < 50 &&
                                !visited[nr][nc] &&
                                state.gridData[nr][nc]?.type === 'pathway' &&
                                state.gridData[nr][nc]?.color === cell.color) {
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
        const visitedPathways = Array(50).fill(null).map(() => Array(50).fill(false));
        const visitedFloors = Array(50).fill(null).map(() => Array(50).fill(false));

        // Extract pathways from grid
        for (let row = 0; row < 50; row++) {
            for (let col = 0; col < 50; col++) {
                const cell = state.gridData[row][col];
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
                            if (nr >= 0 && nr < 50 && nc >= 0 && nc < 50 &&
                                !visitedPathways[nr][nc] &&
                                state.gridData[nr][nc]?.type === 'pathway' &&
                                state.gridData[nr][nc]?.color === cell.color) {
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
        for (let row = 0; row < 50; row++) {
            for (let col = 0; col < 50; col++) {
                const cell = state.gridData[row][col];
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
