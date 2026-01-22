export const TILE_SIZE = 2.0; // 2x2 meter tiles

/**
 * Snap a value to the nearest grid point
 */
export function snapToGrid(value) {
    return Math.round(value / TILE_SIZE) * TILE_SIZE;
}

/**
 * Convert grid coordinates to world position
 */
export function gridToWorld(gridX, gridZ) {
    return {
        x: gridX * TILE_SIZE,
        z: gridZ * TILE_SIZE
    };
}

/**
 * Convert world position to grid coordinates
 */
export function worldToGrid(x, z) {
    return {
        gridX: Math.round(x / TILE_SIZE),
        gridZ: Math.round(z / TILE_SIZE)
    };
}

/**
 * Check if a position is within bounds
 */
export function isInBounds(x, z, gridWidth, gridDepth) {
    const grid = worldToGrid(x, z);
    return grid.gridX >= 0 && grid.gridX < gridWidth &&
        grid.gridZ >= 0 && grid.gridZ < gridDepth;
}

/**
 * Check if a rack placement would collide with existing racks
 */
export function checkCollision(x, z, width, depth, existingRacks, excludeId = null) {
    for (const rack of existingRacks) {
        if (rack.id === excludeId) continue;

        const rx = rack.position.x;
        const rz = rack.position.z;
        const rw = rack.width;
        const rd = rack.depth;

        // Simple AABB collision detection
        if (Math.abs(x - rx) < (width + rw) / 2 &&
            Math.abs(z - rz) < (depth + rd) / 2) {
            return true; // Collision detected
        }
    }
    return false;
}
