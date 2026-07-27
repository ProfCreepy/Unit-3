import { create } from 'zustand';
import type { Grid, CellType } from '../simulation/types';
import { fromKey } from '../simulation/grid';
import { boundingBox } from '../canvas/selection';

/** Zelle relativ zu ihrem Anker (oben-links der Bounding Box) — für Zwischenablage. */
export interface ClipboardCell {
  dx: number; dy: number;
  type: CellType; state: boolean; forced: boolean;
}

interface SelectionStore {
  selected:  Set<string>;
  clipboard: ClipboardCell[] | null;

  setSelection:   (keys: Set<string>) => void;
  clearSelection: () => void;

  /** Liest die aktuell selektierten Zellen aus dem Grid in die Zwischenablage. */
  copyToClipboard: (grid: Grid) => void;
}

/**
 * Verwaltet AUSSCHLIESSLICH was gerade markiert ist und die Zwischenablage.
 * Mutiert das Grid NICHT selbst — Grid-Mutationen (Verschieben, Löschen,
 * Einfügen, Rotieren, Spiegeln) laufen zentral über gridStore-Aktionen,
 * die den bestehenden Undo/Batch-Mechanismus nutzen. Keine doppelte
 * Undo-Logik hier.
 */
export const useSelectionStore = create<SelectionStore>((set, get) => ({
  selected:  new Set(),
  clipboard: null,

  setSelection:   keys => set({ selected: keys }),
  clearSelection: ()   => set({ selected: new Set() }),

  copyToClipboard: grid => {
    const { selected } = get();
    if (selected.size === 0) return;
    const { minX, minY } = boundingBox(selected);
    const cells: ClipboardCell[] = [];
    for (const k of selected) {
      const cell = grid.get(k);
      if (!cell) continue; // Selektion kann leere Positionen enthalten
      const [x, y] = fromKey(k);
      cells.push({
        dx: x - minX, dy: y - minY,
        type: cell.type, state: cell.state, forced: cell.forced ?? false,
      });
    }
    set({ clipboard: cells });
  },
}));
