# Warehouse Management System

## Overview
A complete 3D warehouse management system with configurable floor layout and inventory visualization.

## Features

1. **Configurable Floor Layout**
   - User can input number of rows and columns
   - Floor is generated dynamically based on configuration
   - Visual grid system for easy navigation

2. **Inventory Management**
   - JSON-based inventory data structure
   - Support for pallets and boxes
   - Stacking capability (stackHeight property)
   - Position-based placement (row, column)

3. **3D Visualization**
   - Full 3D warehouse floor
   - GLB model support for pallets and boxes
   - Fallback geometry if GLB models are not available
   - Free-flow camera controls (Blender-style)

## File Structure

```
src/
├── pages/
│   ├── WarehousePage.jsx          # Main warehouse page
│   └── DataCenterPage.jsx          # Original data center page
├── components/
│   └── Warehouse/
│       ├── WarehouseFloor.jsx     # Floor component with grid
│       ├── WarehouseScene.jsx     # Main 3D scene
│       ├── WarehouseConfig.jsx     # Configuration modal
│       ├── Pallet.jsx             # Pallet component (GLB support)
│       └── Box.jsx                 # Box component (GLB support)
├── store/
│   └── warehouseStore.js          # Zustand store for warehouse state
└── public/
    ├── data/
    │   └── warehouseInventory.json # Inventory data structure
    └── models/
        ├── pallet.glb             # Place your pallet GLB here
        └── box.glb                # Place your box GLB here
```

## How to Use

### 1. Navigation
- Navigate to `/warehouse` route to access the warehouse management system
- Use the navigation bar at the top to switch between Data Center and Warehouse

### 2. Configure Warehouse
- On first visit, a configuration modal will appear
- Enter the number of rows and columns for your warehouse floor
- Click "Create Warehouse Floor" to generate the layout

### 3. Add GLB Models
To use your custom GLB models:

1. Place your `pallet.glb` file in `public/models/pallet.glb`
2. Place your `box.glb` file in `public/models/box.glb`
3. Update the components:
   - In `src/components/Warehouse/Pallet.jsx`, change `useGLBModel` to `true`
   - In `src/components/Warehouse/Box.jsx`, change `useGLBModel` to `true`

### 4. Inventory Data Structure

The inventory JSON follows this structure:

```json
{
  "warehouse": {
    "rows": 10,
    "columns": 10
  },
  "inventory": [
    {
      "id": "item-1",
      "type": "pallet",        // or "box"
      "row": 0,                 // Row index (0-based)
      "column": 0,              // Column index (0-based)
      "stackHeight": 1,         // Number of items stacked
      "position": {
        "x": 0,                 // World X position (auto-calculated)
        "z": 0                  // World Z position (auto-calculated)
      }
    }
  ]
}
```

### 5. Camera Controls
- **Left-click drag**: Rotate around the warehouse
- **Right-click drag**: Pan the view
- **Scroll wheel**: Zoom in/out
- Free 360-degree rotation

## Component Details

### WarehouseFloor
- Creates a grid-based floor with alternating tile colors
- Each cell is 2x2 meters
- Visual grid lines for reference

### Pallet Component
- Supports GLB model loading
- Fallback: Simple brown pallet representation
- Supports stacking (stackHeight property)

### Box Component
- Supports GLB model loading
- Fallback: Blue box representation
- Supports stacking (stackHeight property)

### WarehouseScene
- Main 3D scene container
- Loads inventory from JSON
- Renders floor and all inventory items
- Handles camera and lighting

## Customization

### Change Cell Size
Edit `CELL_SIZE` constant in:
- `src/components/Warehouse/WarehouseFloor.jsx`
- `src/components/Warehouse/WarehouseScene.jsx`

### Modify Colors
- Floor colors: Edit `WarehouseFloor.jsx`
- Pallet colors: Edit `Pallet.jsx` fallback geometry
- Box colors: Edit `Box.jsx` fallback geometry

### Add New Item Types
1. Create a new component in `src/components/Warehouse/`
2. Add the type to the inventory JSON
3. Update `WarehouseScene.jsx` to render the new type

## Notes

- GLB models are optional - the system works with fallback geometry
- Inventory data is loaded from `public/data/warehouseInventory.json`
- The warehouse configuration is stored in Zustand store
- All positions are calculated automatically from row/column indices

