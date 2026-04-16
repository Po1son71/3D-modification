/**
 * Compatibility wrapper for dcimStore — delegates to Redux (dcimSlice).
 * Consumer files do NOT need to change.
 *
 * Note: tileOccupancy is now a plain object { "x,z": id } instead of a Map.
 * isTileOccupied is provided as a bound function on both the hook result and getState().
 */
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { store } from './index';
import * as actions from './dcimSlice';

const isTileOccupied = (tileOccupancy, gridX, gridZ) =>
  `${gridX},${gridZ}` in tileOccupancy;

const makeActions = (dispatch, getTileOccupancy) => ({
  setIsDragging:      (v)                => dispatch(actions.setIsDragging(v)),
  selectTile:         (gridX, gridZ)     => dispatch(actions.selectTile({ gridX, gridZ })),
  setPlacementMode:   (mode)             => dispatch(actions.setPlacementMode(mode)),
  isTileOccupied:     (gridX, gridZ)     => isTileOccupied(getTileOccupancy(), gridX, gridZ),
  occupyTiles:        (tiles, componentId) => dispatch(actions.occupyTiles({ tiles, componentId })),
  freeTiles:          (componentId)      => dispatch(actions.freeTiles(componentId)),
  loadFloorData:      (data)             => dispatch(actions.loadFloorData(data)),
  selectRack:         (id)               => dispatch(actions.selectRack(id)),
  selectEquipment:    (id)               => dispatch(actions.selectEquipment(id)),
  updateRackPosition: (rackId, position) => dispatch(actions.updateRackPosition({ rackId, position })),
  addRack:            (rack, tiles)      => dispatch(actions.addRack({ rack, tiles })),
  addACUnit:          (acUnit, tiles)    => dispatch(actions.addACUnit({ acUnit, tiles })),
  addGenerator:       (generator, tiles) => dispatch(actions.addGenerator({ generator, tiles })),
  removeRack:         (id)               => dispatch(actions.removeRack(id)),
  addEquipment:       (rackId, equipment)  => dispatch(actions.addEquipment({ rackId, equipment })),
  removeEquipment:    (rackId, equipmentId) => dispatch(actions.removeEquipment({ rackId, equipmentId })),
});

function useDCIMStore(selector) {
  const dispatch   = useDispatch();
  const sliceState = useSelector((s) => s.dcim, shallowEqual);

  if (typeof selector === 'function') return selector(sliceState);

  return {
    ...sliceState,
    ...makeActions(dispatch, () => sliceState.tileOccupancy),
  };
}

useDCIMStore.getState = () => {
  const state    = store.getState().dcim;
  const dispatch = store.dispatch.bind(store);
  return {
    ...state,
    ...makeActions(dispatch, () => store.getState().dcim.tileOccupancy),
  };
};

export default useDCIMStore;
