import React, { useRef, useEffect, useState } from "react";
import useWarehouseStore from "../../store/warehouseStore";

const GRID_SIZE = 50;
const CELL_SIZE = 12; // pixels per cell

const GridEditor = () => {
    const canvasRef = useRef(null);
    const [hoveredCell, setHoveredCell] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);

    const [selectionStart, setSelectionStart] = useState(null);
    const [selectionEnd, setSelectionEnd] = useState(null);

    const {
        gridData,
        selectedTool,
        editMode,
        pathwayColor,
        pathwayWidth,
        pathwayOpacity,
        updateGridCell
    } = useWarehouseStore();

    // Draw the grid
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw background
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, width, height);

        // Calculate visible grid area
        const cellSize = CELL_SIZE * scale;
        const startRow = Math.max(0, Math.floor(-offset.y / cellSize));
        const endRow = Math.min(GRID_SIZE, Math.ceil((height - offset.y) / cellSize));
        const startCol = Math.max(0, Math.floor(-offset.x / cellSize));
        const endCol = Math.min(GRID_SIZE, Math.ceil((width - offset.x) / cellSize));

        // Draw cells
        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const x = col * cellSize + offset.x;
                const y = row * cellSize + offset.y;

                const cell = gridData[row][col];

                // Draw cell background
                if (cell) {
                    if (cell.type === 'floor') {
                        // Checkerboard pattern for floor
                        ctx.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#f0f0f0';
                    } else if (cell.type === 'pathway') {
                        // Pathway with color
                        const alpha = cell.opacity || 0.5;
                        ctx.fillStyle = cell.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                    }
                } else {
                    // Empty cell
                    ctx.fillStyle = '#e0e0e0';
                }

                ctx.fillRect(x, y, cellSize - 1, cellSize - 1);

                // Highlight hovered cell
                if (hoveredCell && hoveredCell.row === row && hoveredCell.col === col) {
                    ctx.strokeStyle = '#1976d2';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
                }
            }
        }

        // Draw grid lines
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let col = startCol; col <= endCol; col++) {
            const x = col * cellSize + offset.x;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let row = startRow; row <= endRow; row++) {
            const y = row * cellSize + offset.y;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw grid boundaries (thicker)
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.strokeRect(offset.x, offset.y, GRID_SIZE * cellSize, GRID_SIZE * cellSize);

        // selection rectangle
        if (selectionStart && selectionEnd) {
            const x =
                Math.min(selectionStart.col, selectionEnd.col) * cellSize +
                offset.x;
            const y =
                Math.min(selectionStart.row, selectionEnd.row) * cellSize +
                offset.y;

            const w =
                (Math.abs(selectionEnd.col - selectionStart.col) + 1) * cellSize;
            const h =
                (Math.abs(selectionEnd.row - selectionStart.row) + 1) * cellSize;

            ctx.strokeStyle = "#1976d2";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(x, y, w, h);
            ctx.setLineDash([]);
        }
    }, [gridData, hoveredCell, offset, scale, selectionStart, selectionEnd]);

    const getCellFromMouse = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const cellSize = CELL_SIZE * scale;
        const col = Math.floor((x - offset.x) / cellSize);
        const row = Math.floor((y - offset.y) / cellSize);

        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
            return { row, col };
        }
        return null;
    };

    const handleMouseMove = (e) => {
        const cell = getCellFromMouse(e);
        setHoveredCell(cell);

        if (!cell) return;

        if ((selectedTool === 'floor' || selectedTool === 'eraser' || selectedTool === 'pathway') && editMode === 'selection' && selectionStart) {
            setSelectionEnd(cell);
            return;
        }

        if (isDrawing) {
            paintCell(cell.row, cell.col);
        }
    };

    const handleMouseDown = (e) => {
        const cell = getCellFromMouse(e);
        if (!cell) return;

        if ((selectedTool === 'floor' || selectedTool === 'eraser' || selectedTool === 'pathway') && editMode === 'selection') {
            setSelectionStart(cell);
            setSelectionEnd(cell);
            return;
        }

        setIsDrawing(true);
        paintCell(cell.row, cell.col);
    };

    const handleMouseUp = () => {
        if (selectedTool === 'floor' && editMode === 'selection' && selectionStart && selectionEnd) {
            fillSelection(selectionStart, selectionEnd);
        }

        if (selectedTool === 'pathway' && editMode === 'selection' && selectionStart && selectionEnd) {
            fillPathway(selectionStart, selectionEnd);
        }

        if (selectedTool === 'eraser' && editMode === 'selection' && selectionStart && selectionEnd) {
            removeSelection(selectionStart, selectionEnd);
        }


        setIsDrawing(false);
        setSelectionStart(null);
        setSelectionEnd(null);
    };

    const paintCell = (row, col) => {
        let value = null;

        if (selectedTool === 'floor' && editMode === "draw") {
            value = { type: 'floor' };
        } else if (selectedTool === 'pathway') {
            value = {
                type: 'pathway',
                color: pathwayColor,
                width: pathwayWidth,
                opacity: pathwayOpacity
            };
        } else if (selectedTool === 'eraser') {
            value = null;
        }

        updateGridCell(row, col, value);
    };

    const fillSelection = (start, end) => {
        const minRow = Math.min(start.row, end.row);
        const maxRow = Math.max(start.row, end.row);
        const minCol = Math.min(start.col, end.col);
        const maxCol = Math.max(start.col, end.col);

        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                updateGridCell(row, col, { type: "floor" });
            }
        }
    };

    const removeSelection = (start, end) => {
        const minRow = Math.min(start.row, end.row);
        const maxRow = Math.max(start.row, end.row);
        const minCol = Math.min(start.col, end.col);
        const maxCol = Math.max(start.col, end.col);

        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                updateGridCell(row, col, null);
            }
        }
    }

    const fillPathway = (start, end) => {
        const minRow = Math.min(start.row, end.row);
        const maxRow = Math.max(start.row, end.row);
        const minCol = Math.min(start.col, end.col);
        const maxCol = Math.max(start.col, end.col);

        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                updateGridCell(row, col, {
                    type: 'pathway',
                    color: pathwayColor,
                    width: pathwayWidth,
                    opacity: pathwayOpacity
                });
            }
        }
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(prev => Math.max(0.5, Math.min(3, prev * delta)));
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: '#f5f5f5'
        }}>
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => setHoveredCell(null)}
                onWheel={handleWheel}
                style={{
                    display: 'block',
                    cursor: 'crosshair',
                    width: '100%',
                    height: '100%'
                }}
            />

            {/* Coordinates Display */}
            {hoveredCell && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    pointerEvents: 'none'
                }}>
                    Row: {hoveredCell.row}, Col: {hoveredCell.col}
                </div>
            )}

            {/* Instructions */}
            <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                backgroundColor: 'rgba(255,255,255,0.9)',
                padding: '12px',
                borderRadius: '4px',
                fontSize: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div><strong>Click</strong> to paint single cell</div>
                <div><strong>Click + Drag</strong> to paint multiple cells</div>
                <div><strong>Selection Mode: Click + Drag</strong> to paint multiple cells inside the selection box</div>
                <div><strong>Mouse Wheel</strong> to zoom</div>
            </div>
        </div>
    );
};

export default GridEditor;
