/**
 * algorithm.js — Core simulation engine
 *
 * Three layers:
 *   ExtensionRegistry  manage cell types, edge rules, step hooks
 *   Grid               2-D array of cells, compiles to a network
 *   Network            pure logic graph, Jacobi stepping
 *
 * No DOM, no drawing, no global state.
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// ERRORS
// ─────────────────────────────────────────────────────────────────────────────

export class LoopError extends Error {
  constructor(msg) { super(msg); this.name = 'LoopError'; }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTENSION REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * An Extension looks like:
 * {
 *   id:        string          unique key, e.g. 'base', 'user_io'
 *   name:      string          display name
 *   types: {
 *     [NAME]: {
 *       id:         number     unique type id (0 = EMPTY, reserved)
 *       label:      string     short label for UI
 *       // optional rendering hints (used by draw layer, not algorithm)
 *       color:      string
 *       colorOn:    string
 *     }
 *   }
 *   // Edge rules — called for every empty-cell gap between two non-empty cells.
 *   // Return an array of {src, dst, edgeType} objects or [].
 *   edgeRules: (typeA, typeB, netA, netB) => [{src, dst, edgeType}]
 *
 *   // Network-merge rules — which pairs of cells (across a gap) belong to the
 *   // same network even though they are not adjacent.
 *   mergeRules: (typeA, typeB) => boolean
 *
 *   // Called once per step BEFORE the Jacobi iteration.
 *   // Use to force nodes ON/OFF (e.g. pressed buttons).
 *   // Returns a Map<netId, boolean> of overrides, or null.
 *   onBeforeStep: (context) => Map<number,boolean> | null
 *
 *   // Called once per step AFTER state is written back to cells.
 *   // Use for output effects (e.g. playing a sound when a light turns on).
 *   onAfterStep: (context) => void
 * }
 *
 * context = { grid, netState, cellNet, getCell }
 */

export class ExtensionRegistry {
  constructor() {
    this._extensions = new Map(); // id → extension
    this._types      = new Map(); // typeId → { ...type, extensionId }
    this._typeByName = new Map(); // 'CABLE' → typeId
  }

  register(ext) {
    if (this._extensions.has(ext.id))
      throw new Error(`Extension '${ext.id}' already registered`);

    for (const [name, td] of Object.entries(ext.types || {})) {
      if (this._types.has(td.id))
        throw new Error(`Type id ${td.id} (${name}) conflicts with existing type`);
      this._types.set(td.id, { ...td, name, extensionId: ext.id });
      this._typeByName.set(name, td.id);
    }

    this._extensions.set(ext.id, ext);
  }

  unregister(id) {
    const ext = this._extensions.get(id);
    if (!ext) return;
    for (const td of Object.values(ext.types || {}))
      this._types.delete(td.id);
    this._extensions.delete(id);
    // Rebuild name map
    this._typeByName.clear();
    for (const [tid, td] of this._types)
      this._typeByName.set(td.name, tid);
  }

  /** All registered type ids (including 0/EMPTY) */
  get typeIds()  { return [...this._types.keys()]; }

  /** Map of typeId → type descriptor */
  get types()    { return this._types; }

  /** Resolve a type name to its id */
  typeId(name)   { return this._typeByName.get(name); }

  /** Resolve a type id to its descriptor */
  typeInfo(id)   { return this._types.get(id); }

  /** Collect edge rules from all extensions */
  collectEdgeRules(typeA, typeB, netA, netB) {
    const edges = [];
    for (const ext of this._extensions.values()) {
      if (ext.edgeRules) {
        const r = ext.edgeRules(typeA, typeB, netA, netB);
        if (r) edges.push(...r);
      }
    }
    return edges;
  }

  /** Collect merge rules from all extensions */
  shouldMerge(typeA, typeB) {
    for (const ext of this._extensions.values()) {
      if (ext.mergeRules && ext.mergeRules(typeA, typeB)) return true;
    }
    return false;
  }

  /** Collect before-step overrides from all extensions */
  collectBeforeStep(context) {
    const overrides = new Map();
    for (const ext of this._extensions.values()) {
      if (ext.onBeforeStep) {
        const m = ext.onBeforeStep(context);
        if (m) for (const [k, v] of m) overrides.set(k, v);
      }
    }
    return overrides;
  }

  /** Fire after-step hooks */
  fireAfterStep(context) {
    for (const ext of this._extensions.values())
      if (ext.onAfterStep) ext.onAfterStep(context);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UNION-FIND
// ─────────────────────────────────────────────────────────────────────────────

function makeUF(n) {
  const p = Array.from({ length: n }, (_, i) => i);
  const r = new Int32Array(n);
  function find(x) {
    while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; }
    return x;
  }
  function union(a, b) {
    a = find(a); b = find(b);
    if (a === b) return;
    if (r[a] < r[b]) { const t = a; a = b; b = t; }
    p[b] = a;
    if (r[a] === r[b]) r[a]++;
  }
  return { find, union };
}

// ─────────────────────────────────────────────────────────────────────────────
// GRID
// ─────────────────────────────────────────────────────────────────────────────

export class Grid {
  /**
   * @param {number} width
   * @param {number} height
   * @param {ExtensionRegistry} registry
   */
  constructor(width, height, registry) {
    this.width    = width;
    this.height   = height;
    this.registry = registry;

    // cells[y][x] = { type: number, state: boolean }
    this.cells = this._makeCells(width, height);

    // Compiled network state (null = dirty)
    this._net      = null; // { netState, netEdges, cellNet }
    this._stepCount = 0;
  }

  get stepCount() { return this._stepCount; }

  // ── Cell access ─────────────────────────────────────────────────────────────

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  getCell(x, y) {
    return this.inBounds(x, y) ? this.cells[y][x] : null;
  }

  setType(x, y, typeId) {
    if (!this.inBounds(x, y)) return;
    this.cells[y][x].type  = typeId;
    this.cells[y][x].state = false;
    this._net = null;
  }

  setState(x, y, state) {
    if (!this.inBounds(x, y)) return;
    this.cells[y][x].state = state;
    // don't dirty the net — state change is propagated on next step
  }

  resetStates() {
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++)
        this.cells[y][x].state = false;
    this._stepCount = 0;
  }

  resize(w, h) {
    const old = this.cells;
    this.cells = this._makeCells(w, h);
    for (let y = 0; y < Math.min(h, this.height); y++)
      for (let x = 0; x < Math.min(w, this.width); x++)
        this.cells[y][x] = old[y][x];
    this.width = w; this.height = h;
    this._net = null;
  }

  // ── Compile ────────────────────────────────────────────────────────────────

  /**
   * Build network from current grid state.
   * Returns { netState, netEdges, cellNet } and caches internally.
   */
  compile() {
    const { width: W, height: H, cells, registry } = this;
    const EMPTY = 0;

    const cellNet = this._makeCellNet(W, H); // [y][x] → netId or -1
    const uf      = makeUF(W * H);

    // 1. Adjacent non-empty cells → same network
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (cells[y][x].type === EMPTY) continue;
        const i = y * W + x;
        if (x + 1 < W && cells[y][x + 1].type !== EMPTY) uf.union(i, y * W + x + 1);
        if (y + 1 < H && cells[y + 1][x].type !== EMPTY) uf.union(i, (y + 1) * W + x);
      }

    // 2. Extension merge rules (e.g. two INVERTERs across one gap)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (cells[y][x].type !== EMPTY) continue;
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const ax = x - dx, ay = y - dy, bx = x + dx, by = y + dy;
          if (ax < 0 || ay < 0 || bx >= W || by >= H) continue;
          const ta = cells[ay][ax].type, tb = cells[by][bx].type;
          if (ta === EMPTY || tb === EMPTY) continue;
          if (registry.shouldMerge(ta, tb))
            uf.union(ay * W + ax, by * W + bx);
        }
      }

    // 3. Assign net ids
    const rootToId = new Map();
    let nextId = 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (cells[y][x].type === EMPTY) continue;
        const root = uf.find(y * W + x);
        if (!rootToId.has(root)) rootToId.set(root, nextId++);
        cellNet[y][x] = rootToId.get(root);
      }

    // 4. Initial net state = OR of cell states within each net
    const netState = {};
    for (let i = 0; i < nextId; i++) netState[i] = false;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const id = cellNet[y][x];
        if (id >= 0 && cells[y][x].state) netState[id] = true;
      }

    // 5. Edge detection across empty-cell gaps
    const seen     = new Set();
    const netEdges = [];
    function tryEdge(src, dst, edgeType) {
      const k = `${src}-${dst}-${edgeType}`;
      if (!seen.has(k)) { seen.add(k); netEdges.push({ src, dst, edgeType }); }
    }

    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (cells[y][x].type !== EMPTY) continue;
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const ax = x - dx, ay = y - dy, bx = x + dx, by = y + dy;
          if (ax < 0 || ay < 0 || bx >= W || by >= H) continue;
          const ca = cells[ay][ax], cb = cells[by][bx];
          if (ca.type === EMPTY || cb.type === EMPTY) continue;
          const na = cellNet[ay][ax], nb = cellNet[by][bx];
          if (na === nb || na < 0 || nb < 0) continue;

          const rules = registry.collectEdgeRules(ca.type, cb.type, na, nb);
          for (const { src, dst, edgeType } of rules)
            tryEdge(src, dst, edgeType);
        }
      }


    // Track which nets are driven (have at least one incoming edge).
    // Passive nets have no driver and must not ghost-power.
    const drivenNets = new Set();
    for (const e of netEdges) drivenNets.add(e.dst);

    this._net = { netState, netEdges, cellNet, drivenNets };
    return this._net;
  }

  // ── Step ───────────────────────────────────────────────────────────────────

  /**
   * Advance simulation by one tick.
   * @returns {boolean} true if any state changed
   * @throws  {LoopError} on unstable combinatorial loop
   */
  step() {
    if (!this._net) this.compile();

    const { netState, netEdges, cellNet, drivenNets } = this._net;
    const context = {
      grid: this,
      netState,
      cellNet,
      getCell: (x, y) => this.getCell(x, y),
    };

    // Before-step hooks (e.g. force button nets ON)
    const overrides = this.registry.collectBeforeStep(context);

    const ids  = Object.keys(netState).map(Number);
    if (!ids.length) return false;

    const prev = { ...netState };
    const next = { ...netState };

    // Apply overrides
    for (const [id, val] of overrides) next[id] = val;

    // Build incoming edge map
    const inc = {};
    for (const id of ids) inc[id] = [];
    for (const e of netEdges) inc[e.dst].push(e);

    // Jacobi relaxation
    // Driven nets: have incoming edges and are not overridden → evaluated.
    // Passive nets: no incoming edges, no override → forced OFF (no ghost power).
    // Overridden nets: set by extensions (e.g. button) → skip evaluation.
    const driven = new Set(ids.filter(id => inc[id].length > 0 && !overrides.has(id)));

    // Force passive nets to OFF (no driver, no override = unpowered = no ghost power).
    for (const id of ids) {
      if (!driven.has(id) && !overrides.has(id)) next[id] = false;
    }

    const maxIter = ids.length + 1;
    let converged = false;
    for (let iter = 0; iter < maxIter; iter++) {
      const snap = { ...next };
      let changed = false;
      for (const id of driven) {
        const ins = inc[id];
        let r = false;
        for (const e of ins) {
          if      (e.edgeType === 'INVERT') r = r || !snap[e.src];
          else if (e.edgeType === 'BUFFER') r = r ||  snap[e.src];
          else if (e.edgeType === 'DELAY')  r = r ||  prev[e.src];
        }
        if (next[id] !== r) { next[id] = r; changed = true; }
      }
      if (!changed) { converged = true; break; }
    }

    if (!converged)
      throw new LoopError(`Unstable loop: no convergence after ${maxIter} iterations`);

    let anyChanged = false;
    for (const id of ids) {
      if (netState[id] !== next[id]) anyChanged = true;
      netState[id] = next[id];
    }

    this._syncBack(netState, cellNet);
    this._stepCount++;
    this.registry.fireAfterStep(context);
    return anyChanged;
  }

  /**
   * Run until fixpoint or maxSteps.
   * @returns {number} steps taken
   */
  run(maxSteps = 1000) {
    for (let i = 0; i < maxSteps; i++)
      if (!this.step()) return i + 1;
    return maxSteps;
  }

  // ── Serialise ──────────────────────────────────────────────────────────────

  toJSON() {
    return {
      version: 2,
      width:   this.width,
      height:  this.height,
      cells:   this.cells.map(row => row.map(c => ({ t: c.type, s: c.state ? 1 : 0 }))),
    };
  }

  static fromJSON(data, registry) {
    const g = new Grid(data.width, data.height, registry);
    g.cells = data.cells.map(row => row.map(c => ({ type: c.t, state: !!c.s })));
    return g;
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  _makeCells(w, h) {
    return Array.from({ length: h }, () =>
      Array.from({ length: w }, () => ({ type: 0, state: false }))
    );
  }

  _makeCellNet(w, h) {
    return Array.from({ length: h }, () => new Array(w).fill(-1));
  }

  _syncBack(netState, cellNet) {
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++) {
        const id = cellNet[y][x];
        if (id >= 0) this.cells[y][x].state = netState[id] || false;
      }
  }
}