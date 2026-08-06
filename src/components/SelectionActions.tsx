import { useSelectionStore } from '../store/selectionStore';
import { useGridStore }      from '../store/gridStore';
import { boundingBox }       from '../canvas/selection';
import { finalizePendingMove } from '../store/selectionOps';
import { serializeSelection } from '../lib/serializer';
import { saveToFile }         from '../lib/fileIO';

interface SelectionActionsProps {
  /** Letzte bekannte Zeiger-Zellposition — für den Einfügen-Button (Mobile, ohne Strg+V). */
  getPasteAnchor: () => [number, number] | null;
}

/**
 * Kontextabhängige Mini-Toolbar für die aktuelle Selektion UND die
 * Zwischenablage. Sichtbar wenn `selected.size > 0` ODER eine Zwischenablage
 * existiert (Schritt 5b, Punkt 4 — Einfügen muss auch ohne aktive Selektion
 * per Touch erreichbar sein, nicht nur über Strg+V).
 * Schwebt über dem Canvas (analog zu .step-overlay), zentriert am unteren Rand.
 * Icon-only per Design — braucht keine Mobile-Sonderbehandlung.
 */
export function SelectionActions({ getPasteAnchor }: SelectionActionsProps) {
  const selected        = useSelectionStore(s => s.selected);
  const clipboard        = useSelectionStore(s => s.clipboard);
  const setSelection    = useSelectionStore(s => s.setSelection);
  const copyToClipboard = useSelectionStore(s => s.copyToClipboard);

  const grid        = useGridStore(s => s.grid);
  const deleteCells  = useGridStore(s => s.deleteCells);
  const pasteCells   = useGridStore(s => s.pasteCells);
  const rotateCells  = useGridStore(s => s.rotateCells);
  const mirrorCells  = useGridStore(s => s.mirrorCells);

  const hasSelection = selected.size > 0;
  const hasClipboard = !!clipboard && clipboard.length > 0;
  if (!hasSelection && !hasClipboard) return null;

  const handleCopy = () => { finalizePendingMove(); copyToClipboard(grid); };

  const handleCut = () => {
    // Ausschneiden = Kopieren + Löschen, ein Undo-Schritt (deleteCells).
    finalizePendingMove();
    copyToClipboard(grid);
    deleteCells(selected);
    setSelection(new Set());
  };

  const handleDuplicate = () => {
    // Gleiche DRY-Begründung wie in useKeyboardShortcuts.ts (Strg+D):
    // nutzt copyToClipboard + pasteCells, überschreibt dabei den Strg+C-Inhalt.
    finalizePendingMove();
    copyToClipboard(grid);
    const { minX, minY } = boundingBox(selected);
    const dup = useSelectionStore.getState().clipboard ?? [];
    setSelection(pasteCells(dup, minX + 1, minY + 1));
  };

  const handleRotate = (dir: 1 | -1) => {
    finalizePendingMove();
    setSelection(rotateCells(selected, dir));
  };

  const handleMirror = (axis: 'x' | 'y') => {
    finalizePendingMove();
    setSelection(mirrorCells(selected, axis));
  };

  const handleDelete = () => {
    finalizePendingMove();
    deleteCells(selected);
    setSelection(new Set());
  };

  const handlePaste = () => {
    if (!clipboard || clipboard.length === 0) return;
    const anchor = getPasteAnchor() ?? [0, 0];
    setSelection(pasteCells(clipboard, anchor[0], anchor[1]));
  };

  const handleExport = async () => {
    finalizePendingMove();
    // Export liest die AKTUELLE Selektion, nicht die Zwischenablage — falls
    // beide unterschiedlich sind (z. B. selektiert, aber noch nicht kopiert),
    // exportieren wir das, was gerade sichtbar markiert ist.
    const { minX, minY } = boundingBox(selected);
    const cells = [...selected].flatMap(k => {
      const cell = grid.get(k);
      if (!cell) return [];
      const [x, y] = k.split(',').map(Number);
      return [{ dx: x - minX, dy: y - minY, type: cell.type, state: cell.state, forced: cell.forced ?? false }];
    });
    const json = serializeSelection(cells);
    const d = new Date().toISOString().slice(0, 10);
    try {
      await saveToFile(json, `unit3-selektion-${d}.u3sel`, 'Unit-3 Selektion', { 'application/json': ['.u3sel'] });
    } catch {
      alert('Selektion konnte nicht exportiert werden.');
    }
  };

  return (
    <div className="selection-actions">
      {hasSelection && <button className="sel-action-btn" onClick={handleCopy} title="Kopieren [Strg+C]">📋</button>}
      {hasSelection && <button className="sel-action-btn" onClick={handleCut} title="Ausschneiden [Strg+X]">✂️</button>}
      {hasClipboard && <button className="sel-action-btn" onClick={handlePaste} title="Einfügen [Strg+V]">📌</button>}
      {hasSelection && <button className="sel-action-btn" onClick={handleDuplicate} title="Duplizieren [Strg+D]">⧉</button>}
      {hasSelection && <button className="sel-action-btn" onClick={() => handleRotate(1)} title="Rotieren im Uhrzeigersinn [R]">↻</button>}
      {hasSelection && <button className="sel-action-btn" onClick={() => handleRotate(-1)} title="Rotieren gegen Uhrzeigersinn [Shift+R]">↺</button>}
      {hasSelection && <button className="sel-action-btn" onClick={() => handleMirror('x')} title="Horizontal spiegeln [M]">⇋</button>}
      {hasSelection && <button className="sel-action-btn" onClick={() => handleMirror('y')} title="Vertikal spiegeln [Shift+M]">⇵</button>}
      {hasSelection && <button className="sel-action-btn" onClick={handleExport} title="Selektion exportieren (.u3sel)">📤</button>}
      {hasSelection && <button className="sel-action-btn sel-action-danger" onClick={handleDelete} title="Löschen [Entf]">🗑</button>}
    </div>
  );
}
