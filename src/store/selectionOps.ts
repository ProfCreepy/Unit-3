import { useGridStore }      from './gridStore';
import { useSelectionStore } from './selectionStore';
import { translateKeys }     from '../canvas/selection';

/**
 * Schreibt eine schwebende Verschiebung final ins Grid — EIN Undo-Schritt,
 * unabhängig davon wie viele einzelne Drags dazu beigetragen haben.
 * No-Op wenn gerade nichts schwebt (pendingOffset = {0,0}).
 *
 * MUSS vor jeder Selektions-Aktion aufgerufen werden, die nicht selbst
 * ein weiteres Verschieben ist (Rotieren, Spiegeln, Kopieren, Ausschneiden,
 * Duplizieren, Löschen, neue Rechteckauswahl, Werkzeugwechsel weg von
 * "select"). Undo/Redo/Datei-Laden rufen dies bewusst NICHT auf — dort wird
 * stattdessen verworfen (clearSelection()), da sich die Verschiebung auf
 * einen Grid-Zustand bezieht, der gerade ersetzt wird.
 */
export function finalizePendingMove(): void {
  const { selected, pendingOffset, setSelection, setPendingOffset } =
    useSelectionStore.getState();
  if (pendingOffset.dx === 0 && pendingOffset.dy === 0) return;
  useGridStore.getState().moveCells(selected, pendingOffset.dx, pendingOffset.dy);
  setSelection(translateKeys(selected, pendingOffset.dx, pendingOffset.dy));
  setPendingOffset({ dx: 0, dy: 0 });
}
