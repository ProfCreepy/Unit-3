import { useEffect } from 'react';
import { useUIStore }        from './uiStore';
import { useGridStore }      from './gridStore';
import { useSelectionStore } from './selectionStore';
import { boundingBox }       from '../canvas/selection';
import { finalizePendingMove } from './selectionOps';

/**
 * Zentraler Keyboard-Shortcut-Hook.
 *
 * Vorher waren Space/[.] in Toolbar.tsx registriert, obwohl sie zu
 * SimBar gehören — eine versteckte Abhängigkeit. Jetzt lebt die
 * gesamte Tastatur-Logik an einer Stelle (App.tsx), unabhängig davon
 * welche Komponente die zugehörigen Buttons rendert.
 *
 * @param getPasteAnchor Liefert die zuletzt bekannte Zeiger-Zellposition für
 *   Strg+V (siehe Canvas.tsx CanvasHandle.getLastPointerCell). Optional, da
 *   nicht jeder Aufrufer Zugriff auf den Canvas hat — ohne Angabe fügt
 *   Strg+V bei (0,0) ein.
 */
export function useKeyboardShortcuts(getPasteAnchor?: () => [number, number] | null) {
  const tool       = useUIStore(s => s.tool);
  const setTool    = useUIStore(s => s.setTool);
  const step       = useGridStore(s => s.step);
  const running    = useGridStore(s => s.isRunning);
  const setRunning = useGridStore(s => s.setRunning);
  const undo       = useGridStore(s => s.undo);
  const redo       = useGridStore(s => s.redo);
  const deleteCells = useGridStore(s => s.deleteCells);
  const pasteCells  = useGridStore(s => s.pasteCells);
  const rotateCells = useGridStore(s => s.rotateCells);
  const mirrorCells = useGridStore(s => s.mirrorCells);

  const selected       = useSelectionStore(s => s.selected);
  const clipboard      = useSelectionStore(s => s.clipboard);
  const setSelection   = useSelectionStore(s => s.setSelection);
  const clearSelection = useSelectionStore(s => s.clearSelection);
  const copyToClipboard = useSelectionStore(s => s.copyToClipboard);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      // Werkzeuge
      if (e.key === '1') { if (tool === 'select') finalizePendingMove(); setTool('cable'); }
      if (e.key === '2') { if (tool === 'select') finalizePendingMove(); setTool('inverter'); }
      if (e.key === '3') { if (tool === 'select') finalizePendingMove(); setTool('delay'); }
      if (e.key === 'e' || e.key === 'E') { if (tool === 'select') finalizePendingMove(); setTool('delete'); }
      if (e.key === 's' || e.key === 'S') setTool('select');

      // Simulation
      if (e.key === ' ') { e.preventDefault(); setRunning(!running); }
      if (e.key === '.' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (!running) step();
      }

      // Undo/Redo
      // e.key.toLowerCase() statt direktem Vergleich mit 'z'/'y': bei
      // gedrückter Shift-Taste liefert der Browser i. d. R. den Großbuchstaben
      // ('Z' statt 'z') — ein reiner === 'z'-Vergleich würde Ctrl+Shift+Z
      // dadurch nie erkennen.
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))
      ) {
        e.preventDefault();
        redo();
      }

      // ── Selektion (Schritt 5 / 5b) ──────────────────────────────────
      if (e.key === 'Escape') {
        finalizePendingMove();
        clearSelection();
        // Escape hebt jetzt auch das aktive Werkzeug auf (egal welches) —
        // kein Werkzeug aktiv, alles pannt (siehe canvas/input.ts shouldPan).
        setTool(null);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected.size > 0) {
        e.preventDefault();
        finalizePendingMove();
        deleteCells(useSelectionStore.getState().selected);
        clearSelection();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selected.size > 0) {
        e.preventDefault();
        finalizePendingMove();
        copyToClipboard(useGridStore.getState().grid);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x' && selected.size > 0) {
        e.preventDefault();
        // Ausschneiden = Kopieren + Löschen. deleteCells pusht genau EINEN
        // Undo-Schritt — copyToClipboard selbst mutiert das Grid nicht.
        finalizePendingMove();
        const freshSelected = useSelectionStore.getState().selected;
        copyToClipboard(useGridStore.getState().grid);
        deleteCells(freshSelected);
        clearSelection();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && clipboard && clipboard.length > 0) {
        e.preventDefault();
        // Bugfix: eine evtl. schwebende Verschiebung muss vor dem Einfügen
        // finalisiert werden — sonst "erbt" die neu eingefügte Selektion
        // später fälschlich den alten pendingOffset.
        finalizePendingMove();
        const anchor = getPasteAnchor?.() ?? [0, 0];
        const newKeys = pasteCells(clipboard, anchor[0], anchor[1]);
        setSelection(newKeys);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selected.size > 0) {
        e.preventDefault();
        finalizePendingMove();
        const freshSelected = useSelectionStore.getState().selected;
        copyToClipboard(useGridStore.getState().grid);
        // Versatz um die volle Breite statt fixem (1,1) — siehe Begründung
        // in SelectionActions.tsx handleDuplicate.
        const { minX, minY, maxX } = boundingBox(freshSelected);
        const width = maxX - minX + 1;
        const dup = useSelectionStore.getState().clipboard ?? [];
        const newKeys = pasteCells(dup, minX + width, minY);
        setSelection(newKeys);
        return;
      }
      if ((e.key === 'r' || e.key === 'R') && selected.size > 0) {
        e.preventDefault();
        finalizePendingMove();
        const freshSelected = useSelectionStore.getState().selected;
        const dir = e.shiftKey ? -1 : 1;
        const newKeys = rotateCells(freshSelected, dir);
        setSelection(newKeys);
        return;
      }
      if ((e.key === 'm' || e.key === 'M') && selected.size > 0) {
        e.preventDefault();
        finalizePendingMove();
        const freshSelected = useSelectionStore.getState().selected;
        const axis = e.shiftKey ? 'y' : 'x';
        const newKeys = mirrorCells(freshSelected, axis);
        setSelection(newKeys);
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    tool, running, setTool, setRunning, step, undo, redo,
    selected, clipboard, deleteCells, pasteCells, rotateCells, mirrorCells,
    setSelection, clearSelection, copyToClipboard, getPasteAnchor,
  ]);
}
