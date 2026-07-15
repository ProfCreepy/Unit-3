import { useEffect } from 'react';
import { useUIStore }   from './uiStore';
import { useGridStore } from './gridStore';

/**
 * Zentraler Keyboard-Shortcut-Hook.
 *
 * Vorher waren Space/[.] in Toolbar.tsx registriert, obwohl sie zu
 * SimBar gehören — eine versteckte Abhängigkeit. Jetzt lebt die
 * gesamte Tastatur-Logik an einer Stelle (App.tsx), unabhängig davon
 * welche Komponente die zugehörigen Buttons rendert.
 */
export function useKeyboardShortcuts() {
  const setTool    = useUIStore(s => s.setTool);
  const step       = useGridStore(s => s.step);
  const running    = useGridStore(s => s.isRunning);
  const setRunning = useGridStore(s => s.setRunning);
  const undo       = useGridStore(s => s.undo);
  const redo       = useGridStore(s => s.redo);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      // Werkzeuge
      if (e.key === '1') setTool('cable');
      if (e.key === '2') setTool('inverter');
      if (e.key === '3') setTool('delay');
      if (e.key === 'e' || e.key === 'E') setTool('delete');

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
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, setTool, setRunning, step, undo, redo]);
}
