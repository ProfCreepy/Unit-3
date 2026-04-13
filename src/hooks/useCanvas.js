/* eslint-disable no-unused-vars */
import { useRef, useEffect, useState, useCallback } from "react";

export function useCanvas() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  // State
  const stateRef = useRef({
    viewport: { offsetX: 0, offsetY: 0, scale: 1.0 },
    grid: { cellSize: 50 },
    cells: new Map(),
    mouse: {
      isDown: false,
      button: null,
      mode: null,
      startX: 0,
      startY: 0,
      lastCellX: null,
      lastCellY: null,
      paintMode: null,
    },
  });

  const [cellCount, setCellCount] = useState(0);

  // ============ HELPER FUNCTIONS ============

  const getCellKey = (cellX, cellY) => `${cellX},${cellY}`;

  const isCellFilled = useCallback((cellX, cellY) => {
    return stateRef.current.cells.has(getCellKey(cellX, cellY));
  }, []);

  const setCellFilled = useCallback((cellX, cellY, filled) => {
    const key = getCellKey(cellX, cellY);
    if (filled) {
      stateRef.current.cells.set(key, true);
    } else {
      stateRef.current.cells.delete(key);
    }
    // Update UI
    setCellCount(stateRef.current.cells.size);
  }, []);

  const screenToWorld = useCallback((screenX, screenY) => {
    const { viewport } = stateRef.current;
    return {
      x: (screenX - viewport.offsetX) / viewport.scale,
      y: (screenY - viewport.offsetY) / viewport.scale,
    };
  }, []);

  const worldToCell = useCallback((worldX, worldY) => {
    const { grid } = stateRef.current;
    return {
      x: Math.floor(worldX / grid.cellSize),
      y: Math.floor(worldY / grid.cellSize),
    };
  }, []);

  // ============ RENDER FUNCTIONS ============

  const drawGrid = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const { viewport, grid } = stateRef.current;

    const minX = -viewport.offsetX / viewport.scale;
    const minY = -viewport.offsetY / viewport.scale;
    const maxX = minX + canvas.width / viewport.scale;
    const maxY = minY + canvas.height / viewport.scale;

    const targetPixelSpacing = 50;
    const worldSpacing = targetPixelSpacing / viewport.scale;
    const spacingSteps = [50, 500, 5000, 50000];
    let spacing = 1;
    for (let step of spacingSteps) {
      if (step >= worldSpacing) {
        spacing = step;
        break;
      }
    }

    const minorColor = "#e8e8e8";
    const majorColor = "#cccccc";

    // Vertikale Linien
    const startCol = Math.floor(minX / spacing);
    const endCol = Math.ceil(maxX / spacing);
    for (let i = startCol; i <= endCol; i++) {
      const x = i * spacing;
      const isMajor = i % 10 === 0;
      ctx.strokeStyle = isMajor ? majorColor : minorColor;
      ctx.lineWidth = isMajor ? 2 / viewport.scale : 1 / viewport.scale;
      ctx.beginPath();
      ctx.moveTo(x, Math.floor(minY / spacing) * spacing);
      ctx.lineTo(x, Math.ceil(maxY / spacing) * spacing);
      ctx.stroke();
    }

    // Horizontale Linien
    const startRow = Math.floor(minY / spacing);
    const endRow = Math.ceil(maxY / spacing);
    for (let i = startRow; i <= endRow; i++) {
      const y = i * spacing;
      const isMajor = i % 10 === 0;
      ctx.strokeStyle = isMajor ? majorColor : minorColor;
      ctx.lineWidth = isMajor ? 2 / viewport.scale : 1 / viewport.scale;
      ctx.beginPath();
      ctx.moveTo(Math.floor(minX / spacing) * spacing, y);
      ctx.lineTo(Math.ceil(maxX / spacing) * spacing, y);
      ctx.stroke();
    }

    // Ursprung
    ctx.fillStyle = "#ff4444";
    ctx.beginPath();
    ctx.arc(0, 0, 3 / viewport.scale, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const drawCells = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const { viewport, grid, cells } = stateRef.current;

    const minX = -viewport.offsetX / viewport.scale;
    const minY = -viewport.offsetY / viewport.scale;
    const maxX = minX + canvas.width / viewport.scale;
    const maxY = minY + canvas.height / viewport.scale;

    const startCellX = Math.floor(minX / grid.cellSize);
    const startCellY = Math.floor(minY / grid.cellSize);
    const endCellX = Math.ceil(maxX / grid.cellSize);
    const endCellY = Math.ceil(maxY / grid.cellSize);

    for (let [key] of cells) {
      const [cellX, cellY] = key.split(",").map(Number);

      if (
        cellX < startCellX ||
        cellX >= endCellX ||
        cellY < startCellY ||
        cellY >= endCellY
      ) {
        continue;
      }

      const x = Math.round(cellX * grid.cellSize);
      const y = Math.round(cellY * grid.cellSize);
      const size = Math.round(grid.cellSize);

      ctx.fillStyle = "#528e54";
      ctx.fillRect(x, y, size, size);
    }
  }, []);

  const drawCellBorders = useCallback(() => {
    const ctx = ctxRef.current;
    const { viewport, grid, cells } = stateRef.current;

    const borderColor = "#386138";
    const borderWidth = 3 / viewport.scale;

    for (let [key] of cells) {
      const [cellX, cellY] = key.split(",").map(Number);

      const x = Math.round(cellX * grid.cellSize);
      const y = Math.round(cellY * grid.cellSize);
      const size = Math.round(grid.cellSize);

      const hasLeft = isCellFilled(cellX - 1, cellY);
      const hasRight = isCellFilled(cellX + 1, cellY);
      const hasTop = isCellFilled(cellX, cellY - 1);
      const hasBottom = isCellFilled(cellX, cellY + 1);

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;

      if (!hasLeft) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + size);
        ctx.stroke();
      }

      if (!hasRight) {
        ctx.beginPath();
        ctx.moveTo(x + size, y);
        ctx.lineTo(x + size, y + size);
        ctx.stroke();
      }

      if (!hasTop) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y);
        ctx.stroke();
      }

      if (!hasBottom) {
        ctx.beginPath();
        ctx.moveTo(x, y + size);
        ctx.lineTo(x + size, y + size);
        ctx.stroke();
      }
    }
  }, [isCellFilled]);

  const render = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    const { viewport } = stateRef.current;
    ctx.translate(viewport.offsetX, viewport.offsetY);
    ctx.scale(viewport.scale, viewport.scale);

    drawGrid();
    drawCells();
    drawCellBorders();

    ctx.restore();
  }, [drawGrid, drawCells, drawCellBorders]);

  // ============ SETUP ============

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctxRef.current = ctx;

    // Resize
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      render();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Mouse Events
    const handleMouseDown = (e) => {
      const { mouse, viewport, grid, cells } = stateRef.current;
      mouse.isDown = true;
      mouse.button = e.button;
      mouse.startX = e.clientX;
      mouse.startY = e.clientY;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const world = screenToWorld(screenX, screenY);
      const cell = worldToCell(world.x, world.y);

      if (e.button === 1) {
        mouse.mode = "pan";
      } else if (e.button === 0) {
        mouse.mode = "paint";
        const isFilled = isCellFilled(cell.x, cell.y);
        mouse.paintMode = isFilled ? "erase" : "fill";
        setCellFilled(cell.x, cell.y, mouse.paintMode === "fill");
        mouse.lastCellX = cell.x;
        mouse.lastCellY = cell.y;
      } else if (e.button === 2) {
        mouse.mode = "delete";
        setCellFilled(cell.x, cell.y, false);
        mouse.lastCellX = cell.x;
        mouse.lastCellY = cell.y;
      }

      render();
    };

    const handleMouseMove = (e) => {
      const { mouse, viewport } = stateRef.current;
      if (!mouse.isDown) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      if (mouse.mode === "pan") {
        const deltaX = e.clientX - mouse.startX;
        const deltaY = e.clientY - mouse.startY;

        viewport.offsetX += deltaX;
        viewport.offsetY += deltaY;

        viewport.offsetX = Math.round(viewport.offsetX);
        viewport.offsetY = Math.round(viewport.offsetY);

        mouse.startX = e.clientX;
        mouse.startY = e.clientY;
      } else if (mouse.mode === "paint" || mouse.mode === "delete") {
        const world = screenToWorld(screenX, screenY);
        const cell = worldToCell(world.x, world.y);

        if (cell.x !== mouse.lastCellX || cell.y !== mouse.lastCellY) {
          if (mouse.mode === "paint") {
            setCellFilled(cell.x, cell.y, mouse.paintMode === "fill");
          } else if (mouse.mode === "delete") {
            setCellFilled(cell.x, cell.y, false);
          }

          mouse.lastCellX = cell.x;
          mouse.lastCellY = cell.y;
        }
      }

      render();
    };

    const handleMouseUp = () => {
      const { mouse } = stateRef.current;
      mouse.isDown = false;
      mouse.button = null;
      mouse.mode = null;
      mouse.paintMode = null;
      mouse.lastCellX = null;
      mouse.lastCellY = null;
    };

    const handleWheel = (e) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const { viewport } = stateRef.current;
      const oldScale = viewport.scale;

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      viewport.scale *= zoomFactor;
      viewport.scale = Math.max(0.01, Math.min(viewport.scale, 2));

      const worldX = (mouseX - viewport.offsetX) / oldScale;
      const worldY = (mouseY - viewport.offsetY) / oldScale;

      viewport.offsetX = mouseX - worldX * viewport.scale;
      viewport.offsetY = mouseY - worldY * viewport.scale;

      viewport.offsetX = Math.round(viewport.offsetX);
      viewport.offsetY = Math.round(viewport.offsetY);

      render();
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [render, screenToWorld, worldToCell, isCellFilled, setCellFilled]);

  return {
    canvasRef,
    cellCount,
  };
}
