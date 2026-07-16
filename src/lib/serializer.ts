/**
 * Reine Serialisierungs-Funktionen für Save/Load (Schritt 4).
 * KEIN React-Import, KEIN Store-Import — nur Simulations-Typen.
 */
import type { Grid, CellType } from '../simulation/types';

const CURRENT_VERSION = 1;
const VALID_TYPES: readonly CellType[] = ['cable', 'inverter', 'delay'];

export interface Camera {
  x:    number;
  y:    number;
  zoom: number;
}

/** Zell-Tupel: [key, type, state, forced] — kompakter als ein Objekt pro Zelle. */
export type CellTuple = [string, CellType, boolean, boolean];

export interface SaveFile {
  version: number;
  camera:  Camera;
  cells:   CellTuple[];
}

/**
 * Wird bei ungültigem JSON, unbekannter Version oder kaputter Struktur geworfen.
 * Die `message` ist bereits so formuliert, dass sie direkt in der UI angezeigt
 * werden kann (z. B. per alert()).
 */
export class SerializeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SerializeError';
  }
}

/** Grid + Kamera → JSON-String im `.u3`-Dateiformat. */
export function serialize(grid: Grid, camera: Camera): string {
  const cells: CellTuple[] = [];
  for (const [k, cell] of grid) {
    cells.push([k, cell.type, cell.state, cell.forced ?? false]);
  }
  const file: SaveFile = { version: CURRENT_VERSION, camera: { ...camera }, cells };
  return JSON.stringify(file);
}

/**
 * JSON-String → { grid, camera }.
 * Wirft SerializeError bei ungültigem JSON, falscher Struktur oder
 * unbekannter Version. Unbekannte Zelltypen innerhalb gültiger Tupel werden
 * übersprungen (nicht: Absturz) — so bleiben alte Builds mit neuen
 * Zelltypen aus zukünftigen Dateien kompatibel.
 */
export function deserialize(json: string): { grid: Grid; camera: Camera } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new SerializeError('Datei konnte nicht gelesen werden');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new SerializeError('Datei konnte nicht gelesen werden');
  }
  const file = parsed as Partial<SaveFile>;

  if (file.version !== CURRENT_VERSION) {
    throw new SerializeError(`Unbekannte Datei-Version: ${String(file.version)}`);
  }
  if (!Array.isArray(file.cells)) {
    throw new SerializeError('Datei konnte nicht gelesen werden');
  }
  const cam = file.camera;
  if (
    typeof cam !== 'object' || cam === null ||
    typeof cam.x !== 'number' || typeof cam.y !== 'number' || typeof cam.zoom !== 'number'
  ) {
    throw new SerializeError('Datei konnte nicht gelesen werden');
  }

  const grid: Grid = new Map();
  for (const entry of file.cells) {
    // Defensiv: auch bei Tupeln mit falscher Form oder Typ nicht abstürzen,
    // sondern die einzelne Zelle überspringen und mit dem Rest weitermachen.
    if (!Array.isArray(entry) || entry.length !== 4) continue;
    const [k, type, state, forced] = entry as [unknown, unknown, unknown, unknown];
    if (typeof k !== 'string') continue;
    if (typeof type !== 'string' || !VALID_TYPES.includes(type as CellType)) continue;
    if (typeof state !== 'boolean') continue;
    grid.set(k, { type: type as CellType, state, forced: forced === true });
  }

  return { grid, camera: { x: cam.x, y: cam.y, zoom: cam.zoom } };
}
