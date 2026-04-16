import { configureStore } from '@reduxjs/toolkit';
import floorPlannerReducer from './floorPlannerSlice';
import powerMapReducer from './powerMapSlice';
import dcimReducer from './dcimSlice';
import warehouseReducer from './warehouseSlice';

export const store = configureStore({
  reducer: {
    floorPlanner: floorPlannerReducer,
    powerMap:     powerMapReducer,
    dcim:         dcimReducer,
    warehouse:    warehouseReducer,
  },
});

export default store;
