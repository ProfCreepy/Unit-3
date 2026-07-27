import { useEffect } from 'react';
import { useUIStore }        from './uiStore';
import { useGridStore }      from './gridStore';
import { useSelectionStore } from './selectionStore';
import { boundingBox }       from '../canvas/selection';

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
  const setTool    = useUIStore(s => s.setTool);
  const step       = useGridStore(s => s.step);
  const running    = useGridStore(s => s.isRunning);
  const setRunning = useGridStore(s => s.setRunning);
  const undo       = useGridStore(s => s.undo);
  const redo       = useGridStore(s => s.redo);
  const grid        = useGridStore(s => s.grid);
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
      if (e.key === '1') setTool('cable');
      if (e.key === '2') setTool('inverter');
      if (e.key === '3') setTool('delay');
      if (e.key === 'e' || e.key === 'E') setTool('delete');
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

      // ── Selektion (Schritt 5) ──────────────────────────────────────
      if (e.key === 'Escape') {
        clearSelection();
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected.size > 0) {
        e.preventDefault();
        deleteCells(selected);
        clearSelection();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selected.size > 0) {
        e.preventDefault();
        copyToClipboard(grid);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && clipboard && clipboard.length > 0) {
        e.preventDefault();
        const anchor = getPasteAnchor?.() ?? [0, 0];
        const newKeys = pasteCells(clipboard, anchor[0], anchor[1]);
        setSelection(newKeys);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selected.size > 0) {
        e.preventDefault();
        // Duplizieren nutzt intern copyToClipboard + pasteCells (DRY) — das
        // überschreibt als Nebeneffekt auch den regulären Strg+C-Inhalt. Da
        // es keine sichtbare "Zwischenablage"-UI gibt, ist das unauffällig
        // und spart eine zweite, praktisch identische Extraktions-Logik.
        copyToClipboard(grid);
        const { minX, minY } = boundingBox(selected);
        const dup = useSelectionStore.getState().clipboard ?? [];
        const newKeys = pasteCells(dup, minX + 1, minY + 1);
        setSelection(newKeys);
        return;
      }
      if ((e.key === 'r' || e.key === 'R') && selected.size > 0) {
        e.preventDefault();
        const dir = e.shiftKey ? -1 : 1;
        const newKeys = rotateCells(selected, dir);
        setSelection(newKeys);
        return;
      }
      if ((e.key === 'm' || e.key === 'M') && selected.size > 0) {
        e.preventDefault();
        const axis = e.shiftKey ? 'y' : 'x';
        const newKeys = mirrorCells(selected, axis);
        setSelection(newKeys);
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    running, setTool, setRunning, step, undo, redo,
    selected, clipboard, grid, deleteCells, pasteCells, rotateCells, mirrorCells,
    setSelection, clearSelection, copyToClipboard, getPasteAnchor,
  ]);
}
