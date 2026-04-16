/**
 * Compatibility wrapper for warehouseStore — delegates to Redux (warehouseSlice).
 * Consumer files do NOT need to change.
 */
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { store } from './index';
import * as actions from './warehouseSlice';

const makeActions = (dispatch) => ({
  setWarehouseConfig: (rows, columns) => dispatch(actions.setWarehouseConfig({ rows, columns })),
  loadInventory:      (data)          => dispatch(actions.loadInventory(data)),
  addItem:            (item)          => dispatch(actions.addItem(item)),
  updateItem:         (itemId, updates) => dispatch(actions.updateItem({ itemId, updates })),
  removeItem:         (itemId)        => dispatch(actions.removeItem(itemId)),
  loadPathways:       (data)          => dispatch(actions.loadPathways(data)),
  addPathway:         (p)             => dispatch(actions.addPathway(p)),
  updatePathway:      (pathwayId, updates) => dispatch(actions.updatePathway({ pathwayId, updates })),
  removePathway:      (pathwayId)     => dispatch(actions.removePathway(pathwayId)),
  setViewMode:        (mode)          => dispatch(actions.setViewMode(mode)),
  setEditMode:        (mode)          => dispatch(actions.setEditMode(mode)),
  setSelectedTool:    (tool)          => dispatch(actions.setSelectedTool(tool)),
  setPathwayColor:    (color)         => dispatch(actions.setPathwayColor(color)),
  setPathwayWidth:    (w)             => dispatch(actions.setPathwayWidth(w)),
  setPathwayOpacity:  (o)             => dispatch(actions.setPathwayOpacity(o)),
  updateGridCell:     (row, col, value) => dispatch(actions.updateGridCell({ row, col, value })),
  clearGrid:          ()              => dispatch(actions.clearGrid()),
  undoGridChange:     ()              => dispatch(actions.undoGridChange()),
  redoGridChange:     ()              => dispatch(actions.redoGridChange()),
  applyGridToWarehouse: ()            => dispatch(actions.applyGridToWarehouse()),
  resetWarehouse:     ()              => dispatch(actions.resetWarehouse()),
  exportGridToPathways: ()            => actions.exportGridToPathways(store.getState().warehouse),
  exportAllData:        ()            => {
    const state     = store.getState().warehouse;
    const pathways  = actions.exportGridToPathways(state);
    const floors    = [];
    const { rows, columns, gridData } = state;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const cell = gridData[row]?.[col];
        if (cell && cell.type === 'floor') {
          floors.push({ id: `floor-${floors.length + 1}`, row, col, type: 'floor' });
        }
      }
    }

    return {
      warehouse: { rows, columns },
      inventory: state.inventory,
      pathways,
      floors,
    };
  },
});

function useWarehouseStore(selector) {
  const dispatch   = useDispatch();
  const sliceState = useSelector((s) => s.warehouse, shallowEqual);

  if (typeof selector === 'function') return selector(sliceState);

  return { ...sliceState, ...makeActions(dispatch) };
}

useWarehouseStore.getState = () => {
  const state    = store.getState().warehouse;
  const dispatch = store.dispatch.bind(store);
  return { ...state, ...makeActions(dispatch) };
};

export default useWarehouseStore;
