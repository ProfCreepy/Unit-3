import { useSelectionStore } from '../store/selectionStore';
import { useGridStore }      from '../store/gridStore';
import { boundingBox }       from '../canvas/selection';

/**
 * Kontextabhängige Mini-Toolbar für die aktuelle Selektion.
 * Sichtbar nur wenn selected.size > 0. Schwebt über dem Canvas
 * (analog zu .step-overlay in index.css), zentriert am unteren Rand.
 * Icon-only per Design — braucht keine Mobile-Sonderbehandlung.
 */
export function SelectionActions() {
  const selected        = useSelectionStore(s => s.selected);
  const setSelection    = useSelectionStore(s => s.setSelection);
  const copyToClipboard = useSelectionStore(s => s.copyToClipboard);

  const grid        = useGridStore(s => s.grid);
  const deleteCells  = useGridStore(s => s.deleteCells);
  const pasteCells   = useGridStore(s => s.pasteCells);
  const rotateCells  = useGridStore(s => s.rotateCells);
  const mirrorCells  = useGridStore(s => s.mirrorCells);

  if (selected.size === 0) return null;

  const handleCopy = () => copyToClipboard(grid);

  const handleDuplicate = () => {
    // Gleiche DRY-Begründung wie in useKeyboardShortcuts.ts (Strg+D):
    // nutzt copyToClipboard + pasteCells, überschreibt dabei den Strg+C-Inhalt.
    copyToClipboard(grid);
    const { minX, minY } = boundingBox(selected);
    const dup = useSelectionStore.getState().clipboard ?? [];
    setSelection(pasteCells(dup, minX + 1, minY + 1));
  };

  const handleRotate = () => setSelection(rotateCells(selected, 1));
  const handleMirror = () => setSelection(mirrorCells(selected, 'x'));
  const handleDelete = () => { deleteCells(selected); setSelection(new Set()); };

  return (
    <div className="selection-actions">
      <button className="sel-action-btn" onClick={handleCopy} title="Kopieren [Strg+C]">📋</button>
      <button className="sel-action-btn" onClick={handleDuplicate} title="Duplizieren [Strg+D]">⧉</button>
      <button className="sel-action-btn" onClick={handleRotate} title="Rotieren [R]">↻</button>
      <button className="sel-action-btn" onClick={handleMirror} title="Spiegeln [M]">⇋</button>
      <button className="sel-action-btn sel-action-danger" onClick={handleDelete} title="Löschen [Entf]">🗑</button>
    </div>
  );
}
