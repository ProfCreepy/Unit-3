/**
 * extensions/user_io.js — User I/O extension
 *
 * Adds two cell types:
 *
 *   BUTTON (4) — Manual input. While held pressed by the user its network
 *                is forced ON for that step. Connects to cables like a wire.
 *
 *   LIGHT  (5) — Visual output. No special logic — it simply shows the ON/OFF
 *                state of its network. Connects to cables like a wire.
 *
 * Both types behave as CABLE for edge detection purposes, so they can be wired
 * directly to INVERTERs and DELAYs.
 *
 * Usage:
 *   import { userIOExtension } from './extensions/user_io.js';
 *   registry.register(userIOExtension);
 *
 *   // Press / release a button from UI code:
 *   userIOExtension.pressButton(x, y);
 *   userIOExtension.releaseButton(x, y);
 */

import { T as BaseT } from './base.js';

export const USER_IO_TYPES = {
  BUTTON: {
    id: 4, label: 'BTN',
    color: '#2a1800', colorOn: '#4a2c00',
    borderColor: '#6a3c00', borderColorOn: '#ffaa20',
  },
  LIGHT: {
    id: 5, label: 'LMP',
    color: '#2a2600', colorOn: '#3e3a00',
    borderColor: '#6a6200', borderColorOn: '#ffee20',
  },
  LEVER: {
    id: 6, label: 'LVR',
    color: '#001a2a', colorOn: '#003040',
    borderColor: '#004466', borderColorOn: '#00ccff',
  },
};

const T_BTN   = USER_IO_TYPES.BUTTON.id;
const T_LIGHT = USER_IO_TYPES.LIGHT.id;
const T_LEVER = USER_IO_TYPES.LEVER.id;

// Press/lever state tracked on cells directly.
// These sets track which cells are active for releaseAll().
const _pressedCells = new Set();
const _leverStates = new Map();

// ── Cable-like helper ─────────────────────────────────────────────────────────
// BUTTON and LIGHT both act as cable for wiring purposes
function isCableLike(t) {
  return t === BaseT.CABLE || t === T_BTN || t === T_LIGHT || t === T_LEVER;
}

export const userIOExtension = {
  id:   'user_io',
  name: 'User I/O',

  types: USER_IO_TYPES,


  // No extra merge rules — adjacency is enough
  mergeRules: null,

  /**
   * BUTTON / LIGHT participate in wiring exactly like CABLE:
   *   INVERTER ↔ (BUTTON|LIGHT|CABLE)  →  INVERT
   *   DELAY    ↔ (BUTTON|LIGHT|CABLE)  →  DELAY / BUFFER
   */
  edgeRules(typeA, typeB, netA, netB) {
    const edges = [];

    if (typeA === BaseT.INVERTER && isCableLike(typeB)) edges.push({ src: netA, dst: netB, edgeType: 'INVERT' });
    if (isCableLike(typeA) && typeB === BaseT.INVERTER) edges.push({ src: netB, dst: netA, edgeType: 'INVERT' });
    if (typeA === BaseT.DELAY    && isCableLike(typeB)) edges.push({ src: netA, dst: netB, edgeType: 'DELAY'  });
    if (isCableLike(typeA) && typeB === BaseT.DELAY)    edges.push({ src: netB, dst: netA, edgeType: 'DELAY'  });
    if (typeA === BaseT.DELAY    && typeB === BaseT.INVERTER) edges.push({ src: netA, dst: netB, edgeType: 'BUFFER' });
    if (typeA === BaseT.INVERTER && typeB === BaseT.DELAY)    edges.push({ src: netB, dst: netA, edgeType: 'BUFFER' });

    return edges;
  },

  /**
   * Before each step: force pressed BTN nets ON, active LEVER nets ON.
   * These overrides prevent the passive→false rule from clearing user-controlled nets.
   */
  onBeforeStep(context) {
    const { cellNet, grid } = context;
    const overrides = new Map();

    for (const key of _pressedCells) {
      const [x, y] = key.split(',').map(Number);
      if (!grid.inBounds(x, y)) { _pressedCells.delete(key); continue; }
      const id = cellNet[y][x];
      if (id >= 0) overrides.set(id, true);
    }

    for (const [key, on] of _leverStates) {
      if (!on) continue;
      const [x, y] = key.split(',').map(Number);
      if (!grid.inBounds(x, y)) { _leverStates.delete(key); continue; }
      const id = cellNet[y][x];
      if (id >= 0) overrides.set(id, true);
    }

    return overrides.size ? overrides : null;
  },

  onAfterStep: null,

  // ── Public API for UI ────────────────────────────────────────────────────────

  /** Press a BUTTON cell. */
  pressButton(x, y) {
    _pressedCells.add(`${x},${y}`);
  },

  /** Release a BUTTON cell. */
  releaseButton(x, y) {
    _pressedCells.delete(`${x},${y}`);
  },

  /** Release all buttons and reset levers. */
  releaseAll() {
    _pressedCells.clear();
    _leverStates.clear();
  },

  /** Check if a button is currently pressed. */
  isPressed(x, y) {
    return _pressedCells.has(`${x},${y}`);
  },

  /** Toggle a lever ON/OFF. Returns new state. */
  toggleLever(x, y) {
    const key = `${x},${y}`;
    const newState = !_leverStates.get(key);
    _leverStates.set(key, newState);
    return newState;
  },

  /** Get lever state. */
  getLeverState(x, y) {
    return _leverStates.get(`${x},${y}`) || false;
  },

  /** Clear all lever states. */
  resetLevers() {
    _leverStates.clear();
  },
};