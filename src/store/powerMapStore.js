/**
 * Compatibility wrapper for powerMapStore — delegates to Redux (powerMapSlice).
 * Consumer files do NOT need to change.
 */
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { store } from './index';
import * as actions from './powerMapSlice';

export { genNodeId, genEdgeId } from './powerMapSlice';

const makeActions = (dispatch) => ({
  setNodes:         (nodes) => dispatch(actions.setNodes(nodes)),
  setEdges:         (edges) => dispatch(actions.setEdges(edges)),
  setEditMode:      (v)     => dispatch(actions.setEditMode(v)),
  setFooterSensors: (s)     => dispatch(actions.setFooterSensors(s)),
  setIsDark:        (v)     => dispatch(actions.setIsDark(v)),
  updateNodeData:   (id, patch) => dispatch(actions.updateNodeData({ id, patch })),
  updateEdgeData:   (id, patch) => dispatch(actions.updateEdgeData({ id, patch })),
  importConfig:     (config)   => dispatch(actions.importConfig(config)),
  mergeConfig:      (config)   => dispatch(actions.mergeConfig(config)),
  // exportConfig returns a value — thunk pattern: call dispatch and return result
  exportConfig: () => actions.exportConfig()(dispatch, () => store.getState()),
});

function usePowerMapStore(selector) {
  const dispatch   = useDispatch();
  const sliceState = useSelector((s) => s.powerMap, shallowEqual);

  if (typeof selector === 'function') return selector(sliceState);

  return { ...sliceState, ...makeActions(dispatch) };
}

usePowerMapStore.getState = () => {
  const state   = store.getState().powerMap;
  const dispatch = store.dispatch.bind(store);
  return { ...state, ...makeActions(dispatch) };
};

export default usePowerMapStore;
