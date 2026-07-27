import { useEffect, useRef } from 'react';
import { Canvas }       from './components/Canvas';
import type { CanvasHandle } from './components/Canvas';
import { Toolbar }      from './components/Toolbar';
import { SimBar }       from './components/SimBar';
import { SimControls }  from './components/SimControls';
import { SelectionActions } from './components/SelectionActions';
import { useGridStore } from './store/gridStore';
import { useKeyboardShortcuts } from './store/useKeyboardShortcuts';
import { serialize, deserialize, SerializeError } from './lib/serializer';

/** Speichert `content` als Datei — File System Access API, sonst <a download>-Fallback. */
async function saveToFile(content: string, filename: string) {
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as unknown as {
        showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle>;
      }).showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'Unit-3 Datei', accept: { 'application/json': ['.u3'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return;
    } catch (e) {
      // Nutzer hat den Save-Dialog abgebrochen → kein Fehler, einfach nichts tun
      if (e instanceof DOMException && e.name === 'AbortError') return;
      throw e;
    }
  }
  // Fallback: Firefox, Safari, Mobile — kein Speicherort wählbar, direkter Download
  const blob = new Blob([content], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Öffnet einen Datei-Dialog und liest die gewählte Datei als Text. */
function loadFromFile(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input    = document.createElement('input');
    input.type     = 'file';
    input.accept   = '.u3,.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('Keine Datei gewählt')); return; }
      file.text().then(resolve).catch(reject);
    };
    input.click();
  });
}

/** `unit3-projekt-YYYY-MM-DD.u3` — Datum wird beim Speichern generiert. */
function suggestedFilename() {
  const d = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `unit3-projekt-${d}.u3`;
}

export default function App() {
  const step      = useGridStore(s => s.step);
  const isRunning = useGridStore(s => s.isRunning);
  const hz        = useGridStore(s => s.hz);
  const steps     = useGridStore(s => s.stepCount);
  const cells     = useGridStore(s => s.grid.size);
  const grid      = useGridStore(s => s.grid);
  const loadGrid  = useGridStore(s => s.loadGrid);
  const setRunning = useGridStore(s => s.setRunning);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef   = useRef<CanvasHandle>(null);

  // Zentrale Tastatur-Shortcuts — unabhängig davon welche Komponente
  // die zugehörigen Buttons rendert (Toolbar / SimBar)
  useKeyboardShortcuts(() => canvasRef.current?.getLastPointerCell() ?? null);

  // Simulations-Schleife
  useEffect(() => {
    if (!isRunning) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(step, 1000 / hz);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, hz, step]);

  // ── Speichern ──────────────────────────────────────────────────────────
  // Speichern während laufender Simulation ist erlaubt — kein setRunning nötig.
  const handleSave = async () => {
    const camera = canvasRef.current?.getCameraSnapshot();
    if (!camera) return; // Canvas noch nicht bereit
    const json = serialize(grid, camera);
    try {
      await saveToFile(json, suggestedFilename());
    } catch {
      alert('Datei konnte nicht gespeichert werden.');
    }
  };

  // ── Laden ──────────────────────────────────────────────────────────────
  // Simulation wird vor dem Laden gestoppt (setRunning(false)) — auch wenn
  // das Laden selbst fehlschlägt, ist ein gestoppter Zustand hier unkritisch.
  const handleLoad = async () => {
    let text: string;
    try {
      text = await loadFromFile();
    } catch {
      return; // kein Dialog-Abbruch als Fehler behandeln
    }
    setRunning(false);
    try {
      const { grid: loaded, camera } = deserialize(text);
      loadGrid(loaded);
      canvasRef.current?.setCameraSnapshot(camera);
    } catch (e) {
      const msg = e instanceof SerializeError ? e.message : 'Datei konnte nicht gelesen werden';
      alert(msg);
    }
  };

  return (
    /*
      Layout läuft komplett über CSS Grid (index.css, .app-layout).
      Die drei Kinder werden per grid-area positioniert — DOM-Reihenfolge
      bleibt für Tab-Navigation/Screenreader gleich, nur die visuelle
      Anordnung ändert sich responsiv:
        Desktop (≥ 600px):  toolbar → canvas → status
        Mobile  (< 600px):  canvas  → status → toolbar
      Kein JavaScript für Layout-Entscheidungen.
    */
    <div className="app-layout">

      {/* ── Toolbar + SimBar ─────────────────────────────────────
          Desktop: oben, eine Zeile nebeneinander
          Mobile:  unten, zwei Zeilen übereinander (flex-direction: column)
      ────────────────────────────────────────────────────────── */}
      <header className="top-bar">
        <Toolbar />
        <SimBar onSave={handleSave} onLoad={handleLoad} />
      </header>

      {/* ── Canvas ───────────────────────────────────────────────
          Füllt den verbleibenden Platz (flex: 1).
          .step-overlay: absolut positioniert, nur auf Mobile sichtbar.
      ────────────────────────────────────────────────────────── */}
      <div className="canvas-area">
        <Canvas ref={canvasRef} />
        <SelectionActions />
        <div className="step-overlay">
          {steps} Schritte · {cells} Zellen
        </div>
      </div>

      {/* ── Statusleiste ─────────────────────────────────────────
          Loop-Error-Banner + Zähler + Hilfetext.
          Hilfetext wird auf Mobile per CSS ausgeblendet.
      ────────────────────────────────────────────────────────── */}
      <SimControls />

    </div>
  );
}
