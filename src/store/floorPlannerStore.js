/**
 * Compatibility wrapper — exposes the exact same hook API as the old Zustand store,
 * but delegates all state to Redux (via floorPlannerSlice).
 *
 * Consumer files do NOT need to change.
 * The Redux slice is the source of truth; this file is a thin adapter.
 */
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { store } from './index';

// Re-export utilities and catalog unchanged
export { FURNITURE_CATALOG, getWallEndpoints, getSharedWallDoors, getWallInward, getDoorInfo } from './floorPlannerSlice';

// Import all action creators / thunks from the slice
import * as actions from './floorPlannerSlice';

// ── Build a dispatch-bound action map ─────────────────────────────────────────
// These mirror the Zustand store's method signatures exactly.
const makeActions = (dispatch) => ({
  // History helpers (called via getState() in FloorPlanEditor event handlers)
  _pushHistory: () => dispatch(actions.pushHistory()),

  // Simple setters
  setActiveTool:         (tool)        => dispatch(actions.setActiveTool(tool)),
  setActiveFurnitureDef: (def)         => dispatch(actions.setActiveFurnitureDef(def)),
  setViewMode:           (mode)        => dispatch(actions.setViewMode(mode)),
  setIsDark:             (v)           => dispatch(actions.setIsDark(v)),
  toggleHeatmap:         ()            => dispatch(actions.toggleHeatmap()),
  cycleGridSize:         ()            => dispatch(actions.cycleGridSize()),
  setEditorCamera:       (cam)         => dispatch(actions.setEditorCamera(cam)),

  // Selection
  selectOne:      (id)   => dispatch(actions.selectOne(id)),
  selectAdd:      (id)   => dispatch(actions.selectAdd(id)),
  setSelectedIds: (ids)  => dispatch(actions.setSelectedIds(ids)),
  clearSelection: ()     => dispatch(actions.clearSelection()),
  setSelectedId:  (id)   => dispatch(actions.setSelectedId(id)),

  // Locking
  toggleLock:     (id) => dispatch(actions.toggleLock(id)),
  lockSelected:   ()   => dispatch(actions.lockSelected()),
  unlockSelected: ()   => dispatch(actions.unlockSelected()),

  // Rooms
  addRoom:    (data)         => dispatch(actions.addRoom(data)),
  updateRoom: (id, updates)  => dispatch(actions.updateRoom({ id, updates })),
  deleteRoom: (id)           => dispatch(actions.deleteRoom(id)),

  // Furniture
  addFurniture:    (data)        => dispatch(actions.addFurniture(data)),
  updateFurniture: (id, updates) => dispatch(actions.updateFurniture({ id, updates })),
  deleteFurniture: (id)          => dispatch(actions.deleteFurniture(id)),

  // Doors
  addDoor:    (data)        => dispatch(actions.addDoor(data)),
  updateDoor: (id, updates) => dispatch(actions.updateDoor({ id, updates })),
  deleteDoor: (id)          => dispatch(actions.deleteDoor(id)),

  // Freestanding walls
  addWall:    (data)        => dispatch(actions.addWall(data)),
  updateWall: (id, updates) => dispatch(actions.updateWall({ id, updates })),
  deleteWall: (id)          => dispatch(actions.deleteWall(id)),

  // Multi-type
  deleteSelected:          ()        => dispatch(actions.deleteSelected()),
  rotateSelectedFurniture: (deg)     => dispatch(actions.rotateSelectedFurniture(deg)),

  // Clipboard
  copySelected:    () => dispatch(actions.copySelected()),
  pasteClipboard:  () => dispatch(actions.pasteClipboard()),

  // Groups
  groupSelected:   ()         => dispatch(actions.groupSelected()),
  ungroupSelected: ()         => dispatch(actions.ungroupSelected()),
  ungroupIds:      (ids)      => dispatch(actions.ungroupIds(ids)),
  deleteGroup:     (id)       => dispatch(actions.deleteGroup(id)),
  renameGroup:     (id, name) => dispatch(actions.renameGroup({ groupId: id, name })),

  // Undo / Redo
  undo: () => dispatch(actions.undo()),
  redo: () => dispatch(actions.redo()),

  // Bulk
  clearAll: () => dispatch(actions.clearAll()),

  // Export / Import
  exportLayout: ()      => dispatch(actions.exportLayout()),
  importLayout: (json)  => dispatch(actions.importLayout(json)),
  mergeLayout:  (json)  => dispatch(actions.mergeLayout(json)),
});

// ── getState — adds callable methods so old getState().action() patterns work ─
const makeGetState = () => {
  const state = store.getState().floorPlanner;
  const dispatch = store.dispatch.bind(store);
  const boundActions = makeActions(dispatch);
  return { ...state, ...boundActions };
};

// ── Hook ──────────────────────────────────────────────────────────────────────
function useFloorPlannerStore(selector) {
  const dispatch = useDispatch();
  const sliceState = useSelector((s) => s.floorPlanner, shallowEqual);

  if (typeof selector === 'function') {
    // Called as useFloorPlannerStore(s => s.isDark)
    // Use the already-selected full slice; applying selector avoids an extra useSelector
    return selector(sliceState);
  }

  // Called as useFloorPlannerStore() — return state + bound actions
  return { ...sliceState, ...makeActions(dispatch) };
}

// Attach getState so existing getState()._pushHistory() / getState().lockSelected() calls work
useFloorPlannerStore.getState = makeGetState;

export default useFloorPlannerStore;
