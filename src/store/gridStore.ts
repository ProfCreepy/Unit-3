import { create } from 'zustand';
import type { Grid, CellType } from '../simulation/types';
import { key, toggleCellState } from '../simulation/grid';
import { simulationStep, SimLoopError } from '../simulation/engine';

/** Maximale Größe von Undo-/Redo-Stack — älteste Einträge fallen heraus. */
const MAX_UNDO = 60;

/**
 * Rein intern, bewusst außerhalb des Stores (kein Re-Render nötig wenn sich
 * das ändert). true während eines Drags (siehe Canvas.tsx onDragStart/onDragEnd) —
 * verhindert, dass jede einzelne Zelle einer Bresenham-Drag-Linie ihren
 * eigenen Undo-Schritt pusht statt einen gemeinsamen für den ganzen Drag.
 */
let batchActive = false;

interface GridStore {
  grid:      Grid;
  stepCount: number;
  isRunning: boolean;
  hz:        number;
  loopError: string | null;

  undoStack: Grid[];
  redoStack: Grid[];

  setCell:       (x: number, y: number, type: CellType, state?: boolean) => void;
  deleteCell:    (x: number, y: number) => void;
  toggleState:   (x: number, y: number) => void;
  /**
   * Forced-Flag umschalten.
   * forced=true  → Zelle wird auf ON erzwungen, bleibt dauerhafter Treiber.
   * forced=false → Zelle verhält sich wieder normal (Passive Rule greift).
   */
  toggleForced:  (x: number, y: number) => void;
  step:          () => void;
  setRunning:    (v: boolean) => void;
  setHz:         (v: number) => void;
  clear:         () => void;
  loadGrid:      (g: Grid) => void;

  /** Speichert den aktuellen Grid-Zustand auf dem Undo-Stack (max. 60). */
  pushUndo:   () => void;
  /** Startet einen Batch (Drag) — Mutationen darin pushen keinen eigenen Undo-Schritt. */
  beginBatch: () => void;
  /** Beendet den Batch — einzelne Mutationen pushen wieder normal. */
  endBatch:   () => void;
  /** Letzten Zustand wiederherstellen, aktueller wandert auf den redoStack. */
  undo: () => void;
  /** Zurückgeholten Zustand wiederherstellen. */
  redo: () => void;
}

export const useGridStore = create<GridStore>((set, get) => ({
  grid:      new Map(),
  stepCount: 0,
  isRunning: false,
  hz:        5,
  loopError: null,
  undoStack: [],
  redoStack: [],

  setCell: (x, y, type, state = false) => {
    if (!batchActive) get().pushUndo();
    set(s => {
      const g = new Map(s.grid);
      // Beim Typ-Wechsel forced zurücksetzen
      g.set(key(x, y), { type, state, forced: false });
      return { grid: g };
    });
  },

  deleteCell: (x, y) => {
    if (!batchActive) get().pushUndo();
    set(s => {
      const g = new Map(s.grid); g.delete(key(x, y)); return { grid: g };
    });
  },

  toggleState: (x, y) => set(s => {
    const g = new Map(s.grid); toggleCellState(g, x, y); return { grid: g };
  }),

  toggleForced: (x, y) => {
    if (!batchActive) get().pushUndo();
    set(s => {
      const k    = key(x, y);
      const cell = s.grid.get(k);
      if (!cell) return {};
      const g         = new Map(s.grid);
      const nowForced = !cell.forced;
      // forced=true → state=true (Zelle ist AN und bleibt AN)
      // forced=false → state=false (Zelle zerfällt ohne Treiber)
      g.set(k, { ...cell, forced: nowForced, state: nowForced });
      return { grid: g };
    });
  },

  step: () => {
    try {
      const newGrid = simulationStep(get().grid);
      set(s => ({ grid: newGrid, stepCount: s.stepCount + 1, loopError: null }));
    } catch (e) {
      if (e instanceof SimLoopError) set({ isRunning: false, loopError: e.message });
      else throw e;
    }
  },

  setRunning: v  => set({ isRunning: v, ...(v && { loopError: null }) }),
  setHz:      v  => set({ hz: v }),

  clear: () => {
    get().pushUndo();
    set({ grid: new Map(), stepCount: 0, isRunning: false, loopError: null });
  },

  loadGrid: g => set({ grid: g, stepCount: 0, isRunning: false, loopError: null }),

  pushUndo: () => set(s => {
    const stack = [...s.undoStack, s.grid];
    if (stack.length > MAX_UNDO) stack.shift();
    // Neue Aktion → alter Redo-Pfad wird ungültig
    return { undoStack: stack, redoStack: [] };
  }),

  beginBatch: () => { batchActive = true; },
  endBatch:   () => { batchActive = false; },

  undo: () => set(s => {
    if (s.undoStack.length === 0) return {};
    const prev  = s.undoStack[s.undoStack.length - 1];
    const stack = s.undoStack.slice(0, -1);
    return {
      grid:      prev,
      undoStack: stack,
      redoStack: [...s.redoStack, s.grid],
    };
  }),

  redo: () => set(s => {
    if (s.redoStack.length === 0) return {};
    const next  = s.redoStack[s.redoStack.length - 1];
    const stack = s.redoStack.slice(0, -1);
    return {
      grid:      next,
      redoStack: stack,
      undoStack: [...s.undoStack, s.grid],
    };
  }),
}));
