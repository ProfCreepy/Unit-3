import { useSelectionStore } from '../store/selectionStore';
import { useGridStore }      from '../store/gridStore';
import { boundingBox }       from '../canvas/selection';
import { finalizePendingMove } from '../store/selectionOps';
import { serializeSelection } from '../lib/serializer';
import { saveToFile }         from '../lib/fileIO';

interface SelectionActionsProps {
  /** Zell-Position für den Einfügen-Button — siehe App.tsx (Viewport-Mitte). */
  getPasteAnchor: () => [number, number] | null;
}

/**
 * Kontextabhängige Mini-Toolbar für die aktuelle Selektion UND die
 * Zwischenablage. Sichtbar wenn `selected.size > 0` ODER eine Zwischenablage
 * existiert (Schritt 5b, Punkt 4 — Einfügen muss auch ohne aktive Selektion
 * per Touch erreichbar sein, nicht nur über Strg+V).
 * Schwebt über dem Canvas (analog zu .step-overlay), zentriert am unteren Rand.
 * Icon-only per Design — braucht keine Mobile-Sonderbehandlung.
 *
 * WICHTIG (Bugfix): `selected`/`grid` sind React-Closure-Werte vom letzten
 * Render. `finalizePendingMove()` mutiert die Stores zwar SOFORT (Zustand-
 * Updates sind synchron), aber diese bereits erfassten lokalen Variablen
 * werden dadurch NICHT automatisch aktuell — die laufende Funktion sieht
 * weiterhin den alten Stand. Jeder Handler, der nach finalizePendingMove()
 * noch Grid- oder Selektionsdaten braucht, liest sie deshalb explizit über
 * .getState() neu — sonst arbeitet er mit Positionen, die es im Grid gar
 * nicht mehr gibt (Ergebnis: leere Zwischenablage, leere Selektion).
 */
export function SelectionActions({ getPasteAnchor }: SelectionActionsProps) {
  const selected        = useSelectionStore(s => s.selected);
  const clipboard        = useSelectionStore(s => s.clipboard);
  const setSelection    = useSelectionStore(s => s.setSelection);
  const clearSelection  = useSelectionStore(s => s.clearSelection);
  const copyToClipboard = useSelectionStore(s => s.copyToClipboard);

  const deleteCells  = useGridStore(s => s.deleteCells);
  const pasteCells   = useGridStore(s => s.pasteCells);
  const rotateCells  = useGridStore(s => s.rotateCells);
  const mirrorCells  = useGridStore(s => s.mirrorCells);

  const hasSelection = selected.size > 0;
  const hasClipboard = !!clipboard && clipboard.length > 0;
  if (!hasSelection && !hasClipboard) return null;

  const handleCopy = () => {
    finalizePendingMove();
    copyToClipboard(useGridStore.getState().grid);
  };

  const handleCut = () => {
    // Ausschneiden = Kopieren + Löschen, ein Undo-Schritt (deleteCells).
    finalizePendingMove();
    const freshSelected = useSelectionStore.getState().selected;
    copyToClipboard(useGridStore.getState().grid);
    deleteCells(freshSelected);
    // clearSelection() statt setSelection(new Set()) — setzt pendingOffset
    // atomar mit zurück, statt sich darauf zu verlassen, dass es durch
    // finalizePendingMove() weiter oben schon bei {0,0} steht.
    clearSelection();
  };

  const handleDuplicate = () => {
    // Gleiche DRY-Begründung wie in useKeyboardShortcuts.ts (Strg+D):
    // nutzt copyToClipboard + pasteCells, überschreibt dabei den Strg+C-Inhalt.
    finalizePendingMove();
    const freshSelected = useSelectionStore.getState().selected;
    copyToClipboard(useGridStore.getState().grid);
    // Versatz um die volle Breite statt fixem (1,1) — garantiert KEINE
    // Überlappung mit dem Original, unabhängig von der Formgröße. Ein
    // fixer (1,1)-Versatz überlappte bei Formen ≥2×2 eine Ecke und
    // überschrieb dort sofort eine Original-Zelle.
    const { minX, minY, maxX } = boundingBox(freshSelected);
    const width = maxX - minX + 1;
    const dup = useSelectionStore.getState().clipboard ?? [];
    setSelection(pasteCells(dup, minX + width, minY));
  };

  const handleRotate = (dir: 1 | -1) => {
    finalizePendingMove();
    const freshSelected = useSelectionStore.getState().selected;
    setSelection(rotateCells(freshSelected, dir));
  };

  const handleMirror = (axis: 'x' | 'y') => {
    finalizePendingMove();
    const freshSelected = useSelectionStore.getState().selected;
    setSelection(mirrorCells(freshSelected, axis));
  };

  const handleDelete = () => {
    finalizePendingMove();
    const freshSelected = useSelectionStore.getState().selected;
    deleteCells(freshSelected);
    clearSelection();
  };

  const handlePaste = () => {
    if (!clipboard || clipboard.length === 0) return;
    // Bugfix: eine evtl. noch schwebende (nicht finalisierte) Verschiebung
    // MUSS vor dem Einfügen geschrieben werden — sonst "erbt" die neu
    // eingefügte Selektion später fälschlich den alten pendingOffset (siehe
    // finalizePendingMove-Dokumentation).
    finalizePendingMove();
    const anchor = getPasteAnchor() ?? [0, 0];
    setSelection(pasteCells(clipboard, anchor[0], anchor[1]));
  };

  const handleExport = async () => {
    finalizePendingMove();
    const freshSelected = useSelectionStore.getState().selected;
    const freshGrid = useGridStore.getState().grid;
    // Export liest die AKTUELLE Selektion, nicht die Zwischenablage — falls
    // beide unterschiedlich sind (z. B. selektiert, aber noch nicht kopiert),
    // exportieren wir das, was gerade sichtbar markiert ist.
    const { minX, minY } = boundingBox(freshSelected);
    const cells = [...freshSelected].flatMap(k => {
      const cell = freshGrid.get(k);
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
