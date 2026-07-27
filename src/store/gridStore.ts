import { create } from 'zustand';
import type { Grid, CellType, Cell } from '../simulation/types';
import { key, toggleCellState } from '../simulation/grid';
import { simulationStep, SimLoopError } from '../simulation/engine';
import { translateKeys, rotateKeys, mirrorKeys } from '../canvas/selection';
// Typ-only Import aus selectionStore — wird zur Compile-Zeit komplett entfernt
// (verbatimModuleSyntax), also KEIN Laufzeit-Zyklus gridStore↔selectionStore.
// ClipboardCell gehört konzeptionell zu selectionStore (verwaltet die
// Zwischenablage); gridStore braucht den Typ nur für die pasteCells-Signatur.
import type { ClipboardCell } from './selectionStore';

/** Maximale Größe von Undo-/Redo-Stack — älteste Einträge fallen heraus. */
const MAX_UNDO = 60;

/**
 * Rein intern, bewusst außerhalb des Stores (kein Re-Render nötig wenn sich
 * das ändert). true während eines Drags (siehe Canvas.tsx onDragStart/onDragEnd) —
 * verhindert, dass jede einzelne Zelle einer Bresenham-Drag-Linie ihren
 * eigenen Undo-Schritt pusht statt einen gemeinsamen für den ganzen Drag.
 */
let batchActive = false;

/**
 * Verschiebt Zellen von oldKeys[i] nach newKeys[i]. Set-Iterationsreihenfolge
 * = Einfügereihenfolge (ES2015+-Garantie), daher ist die Paarung über
 * parallele Arrays stabil — solange oldKeys/newKeys aus derselben
 * Quell-Iteration stammen (translateKeys/rotateKeys/mirrorKeys iterieren ihr
 * Input-Set unverändert durch, siehe canvas/selection.ts).
 * Erst ALLE Quellen löschen, DANN ALLE Ziele setzen — verhindert Kollisionen
 * bei überlappenden alten/neuen Positionen (z. B. Verschieben um 1 Zelle).
 * Ziel-Zellen außerhalb der Selektion werden dabei überschrieben
 * (Kollisions-Policy, konsistent mit setCell).
 */
function remapCells(grid: Grid, oldKeys: Set<string>, newKeys: Set<string>): Grid {
  const g = new Map(grid);
  const oldArr = [...oldKeys];
  const newArr = [...newKeys];
  const pairs: [string, Cell][] = [];
  for (let i = 0; i < oldArr.length; i++) {
    const cell = g.get(oldArr[i]);
    if (cell) pairs.push([newArr[i], cell]);
  }
  for (const k of oldArr) g.delete(k);
  for (const [k, cell] of pairs) g.set(k, cell);
  return g;
}

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

  /** Verschiebt alle Zellen mit den gegebenen Keys um (dx, dy). Überschreibt Ziel-Zellen. */
  moveCells:   (keys: Set<string>, dx: number, dy: number) => void;
  /** Löscht alle Zellen mit den gegebenen Keys. */
  deleteCells: (keys: Set<string>) => void;
  /** Fügt Zwischenablage-Zellen ein, verankert bei (atX, atY). Überschreibt Ziel-Zellen. */
  pasteCells:  (cells: ClipboardCell[], atX: number, atY: number) => Set<string>;
  /** Rotiert die Zellen mit den gegebenen Keys um ihr gemeinsames Zentrum. */
  rotateCells: (keys: Set<string>, dir: 1 | -1) => Set<string>;
  /** Spiegelt die Zellen mit den gegebenen Keys. */
  mirrorCells: (keys: Set<string>, axis: 'x' | 'y') => Set<string>;

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

  moveCells: (keys, dx, dy) => {
    const newKeys = translateKeys(keys, dx, dy);
    if (!batchActive) get().pushUndo();
    set(s => ({ grid: remapCells(s.grid, keys, newKeys) }));
  },

  deleteCells: keys => {
    if (!batchActive) get().pushUndo();
    set(s => {
      const g = new Map(s.grid);
      for (const k of keys) g.delete(k);
      return { grid: g };
    });
  },

  pasteCells: (cells, atX, atY) => {
    if (!batchActive) get().pushUndo();
    const newKeys = new Set<string>();
    set(s => {
      const g = new Map(s.grid);
      for (const c of cells) {
        const k = key(atX + c.dx, atY + c.dy);
        g.set(k, { type: c.type, state: c.state, forced: c.forced });
        newKeys.add(k);
      }
      return { grid: g };
    });
    return newKeys;
  },

  rotateCells: (keys, dir) => {
    const newKeys = rotateKeys(keys, dir);
    if (!batchActive) get().pushUndo();
    set(s => ({ grid: remapCells(s.grid, keys, newKeys) }));
    return newKeys;
  },

  mirrorCells: (keys, axis) => {
    const newKeys = mirrorKeys(keys, axis);
    if (!batchActive) get().pushUndo();
    set(s => ({ grid: remapCells(s.grid, keys, newKeys) }));
    return newKeys;
  },

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
