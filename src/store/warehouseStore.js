import { create } from 'zustand';

const useWarehouseStore = create((set) => ({
    // Warehouse configuration
    rows: 10,
    columns: 10,
    isConfigured: false,
    
    // Warehouse inventory data
    inventory: [],
    
    // UI state
    isLoading: false,
    
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
    
    resetWarehouse: () => set({
        rows: 10,
        columns: 10,
        isConfigured: false,
        inventory: []
    })
}));

export default useWarehouseStore;

