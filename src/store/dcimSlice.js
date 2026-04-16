import { createSlice } from '@reduxjs/toolkit';

// tileOccupancy is stored as a plain object { "gridX,gridZ": componentId }
// instead of a Map, so Redux state stays serializable.

const initialState = {
  floor:             null,
  racks:             [],
  acUnits:           [],
  generators:        [],
  selectedTile:      null,
  placementMode:     null,
  tileOccupancy:     {},   // plain object, was Map in Zustand
  selectedRackId:    null,
  selectedEquipmentId: null,
  isLoading:         true,
  isDragging:        false,
};

const dcimSlice = createSlice({
  name: 'dcim',
  initialState,
  reducers: {
    setIsDragging(state, { payload }) { state.isDragging = payload; },

    selectTile(state, { payload: { gridX, gridZ } }) {
      state.selectedTile = { gridX, gridZ };
    },

    setPlacementMode(state, { payload }) { state.placementMode = payload; },

    occupyTiles(state, { payload: { tiles, componentId } }) {
      for (const { gridX, gridZ } of tiles) {
        state.tileOccupancy[`${gridX},${gridZ}`] = componentId;
      }
    },

    freeTiles(state, { payload: componentId }) {
      for (const key of Object.keys(state.tileOccupancy)) {
        if (state.tileOccupancy[key] === componentId) {
          delete state.tileOccupancy[key];
        }
      }
    },

    loadFloorData(state, { payload: data }) {
      state.floor     = data.floor;
      state.racks     = data.racks   || [];
      state.acUnits   = data.acUnits || [];
      state.isLoading = false;
    },

    selectRack(state, { payload: rackId }) {
      state.selectedRackId      = rackId;
      state.selectedEquipmentId = null;
    },

    selectEquipment(state, { payload: equipmentId }) {
      state.selectedEquipmentId = equipmentId;
    },

    updateRackPosition(state, { payload: { rackId, position } }) {
      const rack = state.racks.find((r) => r.id === rackId);
      if (rack) rack.position = position;
    },

    addRack(state, { payload: { rack, tiles } }) {
      if (tiles) {
        for (const { gridX, gridZ } of tiles) {
          state.tileOccupancy[`${gridX},${gridZ}`] = rack.id;
        }
      }
      state.racks.push(rack);
      state.placementMode = null;
      state.selectedTile  = null;
    },

    addACUnit(state, { payload: { acUnit, tiles } }) {
      if (tiles) {
        for (const { gridX, gridZ } of tiles) {
          state.tileOccupancy[`${gridX},${gridZ}`] = acUnit.id;
        }
      }
      state.acUnits.push(acUnit);
      state.placementMode = null;
      state.selectedTile  = null;
    },

    addGenerator(state, { payload: { generator, tiles } }) {
      if (tiles) {
        for (const { gridX, gridZ } of tiles) {
          state.tileOccupancy[`${gridX},${gridZ}`] = generator.id;
        }
      }
      state.generators.push(generator);
      state.placementMode = null;
      state.selectedTile  = null;
    },

    removeRack(state, { payload: rackId }) {
      for (const key of Object.keys(state.tileOccupancy)) {
        if (state.tileOccupancy[key] === rackId) delete state.tileOccupancy[key];
      }
      state.racks = state.racks.filter((r) => r.id !== rackId);
      if (state.selectedRackId === rackId) state.selectedRackId = null;
    },

    addEquipment(state, { payload: { rackId, equipment } }) {
      const rack = state.racks.find((r) => r.id === rackId);
      if (rack) rack.equipment = [...(rack.equipment || []), equipment];
    },

    removeEquipment(state, { payload: { rackId, equipmentId } }) {
      const rack = state.racks.find((r) => r.id === rackId);
      if (rack) rack.equipment = rack.equipment.filter((e) => e.id !== equipmentId);
      if (state.selectedEquipmentId === equipmentId) state.selectedEquipmentId = null;
    },
  },
});

export const {
  setIsDragging, selectTile, setPlacementMode,
  occupyTiles, freeTiles,
  loadFloorData, selectRack, selectEquipment,
  updateRackPosition, addRack, addACUnit, addGenerator,
  removeRack, addEquipment, removeEquipment,
} = dcimSlice.actions;

export default dcimSlice.reducer;
