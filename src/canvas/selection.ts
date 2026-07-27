/**
 * Reine Geometrie-Funktionen für Selektion (Schritt 5).
 * KEIN React-Import, KEIN Store-Import — operiert ausschließlich auf
 * Set<string> von Grid-Keys ("x,y"). Kennt weder Grid noch Cell-Daten;
 * das Filtern nach tatsächlich belegten Zellen passiert beim Aufrufer
 * (Canvas.tsx), der Zugriff auf das Grid hat.
 */
import { key, fromKey } from '../simulation/grid';

/** Alle Grid-Keys innerhalb eines Rechtecks (inklusive Rand, Reihenfolge der Ecken egal). */
export function cellsInRect(x0: number, y0: number, x1: number, y1: number): Set<string> {
  const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
  const result = new Set<string>();
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      result.add(key(x, y));
    }
  }
  return result;
}

/** Bounding Box einer Key-Menge — Basis für Rotation/Spiegelung/Zentrum. Leeres Set → alle 0. */
export function boundingBox(keys: Set<string>): { minX: number; minY: number; maxX: number; maxY: number } {
  if (keys.size === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const k of keys) {
    const [x, y] = fromKey(k);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

/** Alle Keys um (dx,dy) verschoben. */
export function translateKeys(keys: Set<string>, dx: number, dy: number): Set<string> {
  const result = new Set<string>();
  for (const k of keys) {
    const [x, y] = fromKey(k);
    result.add(key(x + dx, y + dy));
  }
  return result;
}

/**
 * 90°-Rotation um das Bounding-Box-Zentrum.
 * dir: 1 = im Uhrzeigersinn, -1 = gegen den Uhrzeigersinn.
 *
 * Nicht-quadratische Bounding Boxes: Breite/Höhe tauschen sich nach der
 * Rotation (z. B. 1x5-Linie → 5x1-Linie) — das ist korrekt und erwartet.
 *
 * Rundungs-Hinweis: Das neue (dimensionsvertauschte) Rechteck wird so
 * platziert, dass sein Zentrum mit dem alten Zentrum übereinstimmt. Bei
 * ungleicher Breite/Höhen-Parität (z. B. 5x2) ergibt das einen halben
 * Zellen-Versatz, der auf dem Integer-Grid nicht exakt darstellbar ist —
 * es gibt dafür keine "mathematisch korrektere" Alternative, nur eine
 * konsistente Konvention. Wir runden mit Math.round (halbe Werte werden
 * aufgerundet), das ist deterministisch und ausreichend für den Zweck.
 */
export function rotateKeys(keys: Set<string>, dir: 1 | -1): Set<string> {
  if (keys.size === 0) return new Set();
  const { minX, minY, maxX, maxY } = boundingBox(keys);
  const W = maxX - minX + 1;
  const H = maxY - minY + 1;

  const offX = Math.round((W - H) / 2);
  const offY = Math.round((H - W) / 2);
  const newMinX = minX + offX;
  const newMinY = minY + offY;

  const result = new Set<string>();
  for (const k of keys) {
    const [x, y] = fromKey(k);
    const lx = x - minX, ly = y - minY; // lokale Koordinaten (0..W-1, 0..H-1)
    let newLx: number, newLy: number;
    if (dir === 1) {
      // Uhrzeigersinn: Standard-90°-CW-Matrixrotation (W×H → H×W)
      newLx = (H - 1) - ly;
      newLy = lx;
    } else {
      // Gegen den Uhrzeigersinn
      newLx = ly;
      newLy = (W - 1) - lx;
    }
    result.add(key(newMinX + newLx, newMinY + newLy));
  }
  return result;
}

/**
 * Spiegelung um das Bounding-Box-Zentrum.
 * axis='x' → X-Koordinaten werden gespiegelt (horizontaler Flip, links/rechts).
 * axis='y' → Y-Koordinaten werden gespiegelt (vertikaler Flip, oben/unten).
 * Anders als bei Rotation ändert sich die Breite/Höhe hier nicht, daher ist
 * die Spiegelachse immer exakt auf dem Integer-Grid darstellbar — kein
 * Rundungs-Sonderfall nötig.
 */
export function mirrorKeys(keys: Set<string>, axis: 'x' | 'y'): Set<string> {
  if (keys.size === 0) return new Set();
  const { minX, minY, maxX, maxY } = boundingBox(keys);
  const result = new Set<string>();
  for (const k of keys) {
    const [x, y] = fromKey(k);
    const nx = axis === 'x' ? (minX + maxX) - x : x;
    const ny = axis === 'y' ? (minY + maxY) - y : y;
    result.add(key(nx, ny));
  }
  return result;
}
