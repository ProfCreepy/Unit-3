/**
 * extensions/base.js — Base extension
 *
 * Types:  CABLE (1), INVERTER (2), DELAY (3)
 *
 * Edge rules:
 *   INVERTER → CABLE    :  INVERT
 *   DELAY    → CABLE    :  DELAY
 *   DELAY    → INVERTER :  BUFFER
 *   (all bidirectional — each direction is checked separately)
 *
 * Merge rule:
 *   INVERTER . empty . INVERTER  →  same network
 */

export const BASE_TYPES = {
  EMPTY:    { id: 0, label: '-',   color: '#07070f', colorOn: '#07070f' },
  CABLE:    { id: 1, label: 'CAB', color: '#112238', colorOn: '#0a3020',
                                   borderColor: '#1e3d5c', borderColorOn: '#00d878' },
  INVERTER: { id: 2, label: 'INV', color: '#2c1408', colorOn: '#401808',
                                   borderColor: '#5c2a10', borderColorOn: '#ff6a20' },
  DELAY:    { id: 3, label: 'DLY', color: '#16082e', colorOn: '#220a40',
                                   borderColor: '#32165c', borderColorOn: '#9955ff' },
};

export const T = Object.fromEntries(
  Object.entries(BASE_TYPES).map(([k, v]) => [k, v.id])
);

export const baseExtension = {
  id:   'base',
  name: 'Base',

  types: BASE_TYPES,

  /**
   * Merge rule: two INVERTERs with exactly one empty cell between them
   * belong to the same network (they form a pass-through connection).
   */
  mergeRules(typeA, typeB) {
    return typeA === T.INVERTER && typeB === T.INVERTER;
  },

  /**
   * Edge rules for a pair of non-empty cells on opposite sides of an empty gap.
   * Called with (typeA, typeB, netA, netB) where A is left/top, B is right/bottom.
   * Must return edges in BOTH directions that apply.
   */
  edgeRules(typeA, typeB, netA, netB) {
    const edges = [];

    // Helper: CABLE is the "wire" type that connects to active components
    const isCable = t => t === T.CABLE;

    // INVERTER(A) -- CABLE(B)  →  INVERT  A→B
    if (typeA === T.INVERTER && isCable(typeB)) edges.push({ src: netA, dst: netB, edgeType: 'INVERT' });
    // CABLE(A) -- INVERTER(B)  →  INVERT  B→A
    if (isCable(typeA) && typeB === T.INVERTER) edges.push({ src: netB, dst: netA, edgeType: 'INVERT' });

    // DELAY(A) -- CABLE(B)     →  DELAY   A→B
    if (typeA === T.DELAY && isCable(typeB))    edges.push({ src: netA, dst: netB, edgeType: 'DELAY' });
    // CABLE(A) -- DELAY(B)     →  DELAY   B→A
    if (isCable(typeA) && typeB === T.DELAY)    edges.push({ src: netB, dst: netA, edgeType: 'DELAY' });

    // DELAY(A) -- INVERTER(B)  →  BUFFER  A→B
    if (typeA === T.DELAY && typeB === T.INVERTER) edges.push({ src: netA, dst: netB, edgeType: 'BUFFER' });
    // INVERTER(A) -- DELAY(B)  →  BUFFER  B→A
    if (typeA === T.INVERTER && typeB === T.DELAY) edges.push({ src: netB, dst: netA, edgeType: 'BUFFER' });

    return edges;
  },
};
