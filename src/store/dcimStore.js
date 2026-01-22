import { create } from 'zustand';

const useDCIMStore = create((set) => ({
    // Floor data
    floor: null,
    racks: [],
    acUnits: [],
    generators: [],

    // Tile selection state
    selectedTile: null, // { gridX, gridZ }
    
    // Component placement mode
    placementMode: null, // 'rack', 'ac', 'generator', null
    
    // Tile occupancy map - tracks which tiles have components
    tileOccupancy: new Map(), // key: "gridX,gridZ", value: componentId

    // Selection state
    selectedRackId: null,
    selectedEquipmentId: null,

    // Loading state
    isLoading: true,
    isDragging: false,

    // Actions
    setIsDragging: (isDragging) => set({ isDragging }),
    
    selectTile: (gridX, gridZ) => set((state) => ({
        selectedTile: { gridX, gridZ }
    })),
    
    setPlacementMode: (mode) => set({ placementMode: mode }),
    
    isTileOccupied: (gridX, gridZ) => {
        const key = `${gridX},${gridZ}`;
        return useDCIMStore.getState().tileOccupancy.has(key);
    },
    
    occupyTiles: (tiles, componentId) => set((state) => {
        const newOccupancy = new Map(state.tileOccupancy);
        tiles.forEach(({ gridX, gridZ }) => {
            newOccupancy.set(`${gridX},${gridZ}`, componentId);
        });
        return { tileOccupancy: newOccupancy };
    }),
    
    freeTiles: (componentId) => set((state) => {
        const newOccupancy = new Map(state.tileOccupancy);
        for (const [key, id] of newOccupancy.entries()) {
            if (id === componentId) {
                newOccupancy.delete(key);
            }
        }
        return { tileOccupancy: newOccupancy };
    }),

    loadFloorData: (data) => set({
        floor: data.floor,
        racks: data.racks || [],
        acUnits: data.acUnits || [],
        isLoading: false
    }),

    selectRack: (rackId) => set({
        selectedRackId: rackId,
        selectedEquipmentId: null
    }),

    selectEquipment: (equipmentId) => set({
        selectedEquipmentId: equipmentId
    }),

    updateRackPosition: (rackId, position) => set((state) => ({
        racks: state.racks.map(rack =>
            rack.id === rackId
                ? { ...rack, position }
                : rack
        )
    })),

    addRack: (rack, tiles) => set((state) => {
        const newOccupancy = new Map(state.tileOccupancy);
        if (tiles) {
            tiles.forEach(({ gridX, gridZ }) => {
                newOccupancy.set(`${gridX},${gridZ}`, rack.id);
            });
        }
        return {
            racks: [...state.racks, rack],
            tileOccupancy: newOccupancy,
            placementMode: null,
            selectedTile: null
        };
    }),
    
    addACUnit: (acUnit, tiles) => set((state) => {
        const newOccupancy = new Map(state.tileOccupancy);
        if (tiles) {
            tiles.forEach(({ gridX, gridZ }) => {
                newOccupancy.set(`${gridX},${gridZ}`, acUnit.id);
            });
        }
        return {
            acUnits: [...state.acUnits, acUnit],
            tileOccupancy: newOccupancy,
            placementMode: null,
            selectedTile: null
        };
    }),
    
    addGenerator: (generator, tiles) => set((state) => {
        const newOccupancy = new Map(state.tileOccupancy);
        if (tiles) {
            tiles.forEach(({ gridX, gridZ }) => {
                newOccupancy.set(`${gridX},${gridZ}`, generator.id);
            });
        }
        return {
            generators: [...state.generators, generator],
            tileOccupancy: newOccupancy,
            placementMode: null,
            selectedTile: null
        };
    }),

    removeRack: (rackId) => set((state) => {
        const newOccupancy = new Map(state.tileOccupancy);
        for (const [key, id] of newOccupancy.entries()) {
            if (id === rackId) {
                newOccupancy.delete(key);
            }
        }
        return {
            racks: state.racks.filter(r => r.id !== rackId),
            selectedRackId: state.selectedRackId === rackId ? null : state.selectedRackId,
            tileOccupancy: newOccupancy
        };
    }),

    addEquipment: (rackId, equipment) => set((state) => ({
        racks: state.racks.map(rack =>
            rack.id === rackId
                ? { ...rack, equipment: [...rack.equipment, equipment] }
                : rack
        )
    })),

    removeEquipment: (rackId, equipmentId) => set((state) => ({
        racks: state.racks.map(rack =>
            rack.id === rackId
                ? { ...rack, equipment: rack.equipment.filter(e => e.id !== equipmentId) }
                : rack
        ),
        selectedEquipmentId: state.selectedEquipmentId === equipmentId ? null : state.selectedEquipmentId
    }))
}));

export default useDCIMStore;
