/**
 * script.js — App glue
 *
 * Connects algorithm.js + extensions to the minimal test UI.
 * Draw loop, input handling, extension toggle, save/load.
 */

import { ExtensionRegistry, Grid, LoopError } from './algorithm.js';
import { baseExtension, BASE_TYPES, T }        from './extensions/base.js';
import { userIOExtension, USER_IO_TYPES }       from './extensions/user_io.js';

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY + GRID SETUP
// ─────────────────────────────────────────────────────────────────────────────

const registry = new ExtensionRegistry();
registry.register(baseExtension);
// user_io is optional — toggled by checkbox below

let grid = new Grid(60, 40, registry);

// ─────────────────────────────────────────────────────────────────────────────
// AVAILABLE EXTENSIONS (beyond base, which is always on)
// ─────────────────────────────────────────────────────────────────────────────

const OPTIONAL_EXTENSIONS = [
  { ext: userIOExtension, label: 'User I/O  (Button, Light)', default: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS + VIEW
// ─────────────────────────────────────────────────────────────────────────────

const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');
let camX = 0, camY = 0, camZ = 14;

function resize() {
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  draw();
}
window.addEventListener('resize', resize);

function cellToScreen(x, y) { return [x * camZ + camX, y * camZ + camY]; }
function screenToCell(sx, sy) {
  return [Math.floor((sx - camX) / camZ), Math.floor((sy - camY) / camZ)];
}
function inBounds(x, y) { return grid.inBounds(x, y); }

function centerCam() {
  camX = (canvas.width  - grid.width  * camZ) / 2;
  camY = (canvas.height - grid.height * camZ) / 2;
}

// ─────────────────────────────────────────────────────────────────────────────
// DRAW
// ─────────────────────────────────────────────────────────────────────────────

function draw() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, W, H);

  // Grid area highlight
  const [gx, gy] = cellToScreen(0, 0);
  const gw = grid.width * camZ, gh = grid.height * camZ;
  ctx.fillStyle = '#0e0e20';
  ctx.fillRect(gx, gy, gw, gh);
  ctx.strokeStyle = 'rgba(60,90,220,0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(gx + 0.5, gy + 0.5, gw - 1, gh - 1);

  const x0 = Math.max(0, Math.floor(-camX / camZ));
  const y0 = Math.max(0, Math.floor(-camY / camZ));
  const x1 = Math.min(grid.width,  Math.ceil((W - camX) / camZ) + 1);
  const y1 = Math.min(grid.height, Math.ceil((H - camY) / camZ) + 1);
  const sz = camZ - 1;

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const cell = grid.getCell(x, y);
      if (!cell || cell.type === 0) continue;

      const info = registry.typeInfo(cell.type);
      if (!info) continue;

      const [px, py] = cellToScreen(x, y);
      const flashing = flashCells.has(`${x},${y}`);
      const showOn = cell.state || flashing;
      ctx.fillStyle   = showOn ? (info.colorOn    || info.color)        : info.color;
      ctx.fillRect(px, py, sz, sz);
      ctx.strokeStyle = showOn ? (info.borderColorOn || info.borderColor || '#fff') : (info.borderColor || '#333');
      ctx.lineWidth   = showOn ? 1.5 : 0.5;
      ctx.strokeRect(px + 0.5, py + 0.5, sz - 1, sz - 1);

      // Label at higher zoom
      if (camZ >= 18) {
        ctx.fillStyle    = cell.state ? '#fff' : '#555';
        ctx.font         = `${Math.floor(camZ * 0.35)}px monospace`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.label || '?', px + sz / 2, py + sz / 2);
      }
    }
  }

  // Grid lines
  if (camZ >= 8) {
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 0.5;
    for (let x = x0; x <= x1; x++) {
      const px = x * camZ + camX;
      ctx.beginPath(); ctx.moveTo(px, gy); ctx.lineTo(px, gy + gh); ctx.stroke();
    }
    for (let y = y0; y <= y1; y++) {
      const py = y * camZ + camY;
      ctx.beginPath(); ctx.moveTo(gx, py); ctx.lineTo(gx + gw, py); ctx.stroke();
    }
  }

  // In interact mode: highlight interactive cells on hover
  if (interactMode && mouseCell) {
    const [mx, my] = mouseCell;
    if (inBounds(mx, my)) {
      const cell  = grid.getCell(mx, my);
      const BTN   = registry.typeId('BUTTON');
      const LEVER = registry.typeId('LEVER');
      const isInteractive = (BTN !== undefined && cell.type === BTN) ||
                            (LEVER !== undefined && cell.type === LEVER);
      if (isInteractive) {
        const [px, py] = cellToScreen(mx, my);
        ctx.strokeStyle = 'rgba(255,200,60,0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, sz - 2, sz - 2);
      }
    }
  }

  // Draw lever ON indicator (small dot when active)
  const LEVER = registry.typeId('LEVER');
  if (LEVER !== undefined && camZ >= 10) {
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const cell = grid.getCell(x, y);
        if (!cell || cell.type !== LEVER) continue;
        const isOn = userIOExtension.getLeverState(x, y);
        if (!isOn) continue;
        const [px, py] = cellToScreen(x, y);
        const r = sz * 0.18;
        ctx.fillStyle = '#00ccff';
        ctx.beginPath();
        ctx.arc(px + sz * 0.75, py + sz * 0.25, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Cursor preview
  if (!interactMode && activeTool !== 0 && mouseCell) {
    const [mx, my] = mouseCell;
    if (inBounds(mx, my)) {
      const info = registry.typeInfo(activeTool);
      if (info) {
        const [px, py] = cellToScreen(mx, my);
        ctx.fillStyle   = info.color + 'aa';
        ctx.fillRect(px, py, sz, sz);
        ctx.strokeStyle = info.borderColor || '#888';
        ctx.lineWidth   = 1.5;
        ctx.strokeRect(px + 0.5, py + 0.5, sz - 1, sz - 1);
      }
    }
  }

  updateStatus();
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────────────────────────────────────────

let activeTool  = T.CABLE; // 0 = erase
let drawing     = false, drawType = 0, lastDX = 0, lastDY = 0;
let panning     = false, panSX = 0, panSY = 0, panOX = 0, panOY = 0;
let mouseCell   = null;
let spaceDown   = false;
let interactMode = false;
const flashCells = new Map(); // "x,y" → timeoutId for visual flash

function setTool(id) {
  activeTool = id;
  const info = id === 0 ? { label: 'ERASE' } : registry.typeInfo(id);
  const label = info ? info.label || `TYPE ${id}` : 'ERASE';
  document.getElementById('active-tool-label').textContent = label;
  document.getElementById('s-tool').textContent = label;
  // Update palette highlight
  document.querySelectorAll('.type-btn').forEach(b =>
    b.classList.toggle('active', parseInt(b.dataset.id) === id)
  );
}

function toggleInteract() {
  interactMode = !interactMode;
  const btn = document.getElementById('btn-interact');
  if (btn) {
    btn.textContent = interactMode ? 'DRAW' : 'INTERACT';
    btn.classList.toggle('btn-interact-on', interactMode);
  }
  canvas.classList.toggle('interact', interactMode);
  log(interactMode ? 'Interact mode — click BUTTON cells' : 'Draw mode', 'info');
}

function cycleToolForward() {
  const ids = [0, ...registry.typeIds.filter(i => i !== 0).sort((a, b) => a - b)];
  const idx = ids.indexOf(activeTool);
  setTool(ids[(idx + 1) % ids.length]);
}

function paintLine(x0, y0, x1, y1, type) {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, x = x0, y = y0;
  while (true) {
    grid.setType(x, y, type);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2  <  dx) { err += dx; y += sy; }
  }
}

canvas.addEventListener('mousedown', e => {
  e.preventDefault();
  const [cx, cy] = screenToCell(e.offsetX, e.offsetY);

  if (e.button === 1 || (e.button === 0 && spaceDown)) {
    panning = true; panSX = e.offsetX; panSY = e.offsetY; panOX = camX; panOY = camY;
    canvas.style.cursor = 'grabbing'; return;
  }

  // Interact mode: press buttons, toggle levers
  if (interactMode && e.button === 0) {
    if (inBounds(cx, cy)) {
      const cell = grid.getCell(cx, cy);
      const BTN   = registry.typeId('BUTTON');
      const LEVER = registry.typeId('LEVER');

      if (BTN !== undefined && cell.type === BTN) {
        // Button: press → step → flash → auto-release → step
        userIOExtension.pressButton(grid, cx, cy);
        if (!grid._net) grid.compile();
        doStep();
        // Flash the button visually even after release
        const fKey = `${cx},${cy}`;
        clearTimeout(flashCells.get(fKey));
        flashCells.set(fKey, setTimeout(() => { flashCells.delete(fKey); draw(); }, 120));
        draw();
        userIOExtension.releaseAll(grid);
        doStep();
      } else if (LEVER !== undefined && cell.type === LEVER) {
        // Lever: toggle state
        const newState = userIOExtension.toggleLever(grid, cx, cy);
        if (!grid._net) grid.compile();
        doStep();
        log(`Lever (${cx},${cy}) → ${newState ? 'ON' : 'OFF'}`, 'info');
      }
    }
    return;
  }

  if (e.button === 0 || e.button === 2) {
    drawing  = true;
    drawType = e.button === 2 ? 0 : activeTool;
    paintLine(cx, cy, cx, cy, drawType);
    lastDX = cx; lastDY = cy;
    grid._net = null;
    draw();
  }
});

canvas.addEventListener('mousemove', e => {
  const [cx, cy] = screenToCell(e.offsetX, e.offsetY);
  mouseCell = [cx, cy];
  document.getElementById('s-coords').textContent =
    inBounds(cx, cy) ? `${cx}, ${cy}` : '';

  if (panning) {
    camX = panOX + (e.offsetX - panSX);
    camY = panOY + (e.offsetY - panSY);
    draw(); return;
  }
  if (drawing) {
    paintLine(lastDX, lastDY, cx, cy, drawType);
    lastDX = cx; lastDY = cy;
    grid._net = null;
  }
  draw();
});

canvas.addEventListener('mouseup', e => {
  if (e.button === 1) { panning = false; canvas.style.cursor = 'crosshair'; }
  if (e.button === 0 || e.button === 2) {
    if (!interactMode) drawing = false;
  }
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) {
    // Zoom
    const f  = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const nz = Math.min(80, Math.max(3, camZ * f));
    camX = e.offsetX - (e.offsetX - camX) * (nz / camZ);
    camY = e.offsetY - (e.offsetY - camY) * (nz / camZ);
    camZ = nz;
  } else {
    cycleToolForward();
  }
  draw();
}, { passive: false });

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === ' ') { e.preventDefault(); spaceDown = true; }
  if (e.key === 'r' || e.key === 'R') { e.preventDefault(); cycleToolForward(); }
  if (e.key === 'Escape') { if (interactMode) toggleInteract(); else setTool(0); }
  if (e.key === 'i' || e.key === 'I') toggleInteract();
  if (e.key === 's' && !e.ctrlKey) doStep();
});
document.addEventListener('keyup', e => {
  if (e.key === ' ') { spaceDown = false; if (panning) { panning = false; canvas.style.cursor = 'crosshair'; } }
});

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATION
// ─────────────────────────────────────────────────────────────────────────────

let running   = false;
let runTimer  = null;

function doStep() {
  try {
    grid.step();
    draw();
  } catch (e) {
    if (e instanceof LoopError) {
      stopRun();
      log('UNSTABLE LOOP — ' + e.message, 'error');
      document.getElementById('s-msg').textContent = 'UNSTABLE LOOP';
      setTimeout(() => document.getElementById('s-msg').textContent = '', 2500);
    } else { throw e; }
  }
}

function startRun() {
  running = true;
  document.getElementById('btn-run').textContent = 'STOP';
  document.getElementById('btn-run').classList.add('on');
  const ms = parseInt(document.getElementById('inp-speed').value) || 150;
  runTimer = setInterval(doStep, ms);
}

function stopRun() {
  running = false;
  clearInterval(runTimer);
  document.getElementById('btn-run').textContent = 'RUN';
  document.getElementById('btn-run').classList.remove('on');
}

document.getElementById('btn-step').addEventListener('click', () => { stopRun(); doStep(); });
document.getElementById('btn-interact')?.addEventListener('click', toggleInteract);
document.getElementById('btn-run').addEventListener('click',  () => running ? stopRun() : startRun());
document.getElementById('btn-reset').addEventListener('click', () => {
  stopRun();
  userIOExtension.releaseAll(grid);
  grid.resetStates();
  draw(); log('Reset', 'info');
});

// ─────────────────────────────────────────────────────────────────────────────
// RESIZE
// ─────────────────────────────────────────────────────────────────────────────

document.getElementById('btn-resize').addEventListener('click', () => {
  const w = parseInt(document.getElementById('inp-w').value);
  const h = parseInt(document.getElementById('inp-h').value);
  if (isNaN(w) || isNaN(h) || w < 5 || h < 5) return;
  stopRun();
  grid.resize(w, h);
  centerCam(); draw();
  log(`Resized to ${w}×${h}`, 'info');
});

// ─────────────────────────────────────────────────────────────────────────────
// EXTENSION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

function buildExtList() {
  const el = document.getElementById('ext-list');
  el.innerHTML = '';

  // Base is always on
  const baseRow = document.createElement('div');
  baseRow.className = 'ext-row';
  baseRow.innerHTML = '<input type="checkbox" checked disabled> <span>Base (Cable · Inverter · Delay)</span>';
  el.appendChild(baseRow);

  for (const { ext, label, default: def } of OPTIONAL_EXTENSIONS) {
    const row = document.createElement('div');
    row.className = 'ext-row';
    const cb = document.createElement('input');
    cb.type    = 'checkbox';
    cb.checked = def;
    if (def) safeRegister(ext);

    cb.addEventListener('change', () => {
      if (cb.checked) {
        safeRegister(ext);
        log(`Extension "${ext.name}" enabled`, 'ok');
      } else {
        registry.unregister(ext.id);
        log(`Extension "${ext.name}" disabled`, 'warn');
      }
      grid._net = null;
      buildTypePalette();
      draw();
    });

    const lbl = document.createElement('span');
    lbl.textContent = label;
    row.appendChild(cb); row.appendChild(lbl);
    el.appendChild(row);
  }
}

function safeRegister(ext) {
  if (!registry._extensions.has(ext.id)) registry.register(ext);
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPE PALETTE
// ─────────────────────────────────────────────────────────────────────────────

function buildTypePalette() {
  const el = document.getElementById('type-palette');
  el.innerHTML = '';

  // Erase
  const eraseBtn = document.createElement('button');
  eraseBtn.className = 'type-btn' + (activeTool === 0 ? ' active' : '');
  eraseBtn.dataset.id = 0;
  eraseBtn.textContent = 'ERASE';
  eraseBtn.style.borderColor = activeTool === 0 ? '#5c6bff' : '#333';
  eraseBtn.addEventListener('click', () => setTool(0));
  el.appendChild(eraseBtn);

  // All registered types except EMPTY (id=0)
  const sorted = [...registry.typeIds].filter(id => id !== 0).sort((a, b) => a - b);
  for (const id of sorted) {
    const info = registry.typeInfo(id);
    const btn  = document.createElement('button');
    btn.className   = 'type-btn' + (activeTool === id ? ' active' : '');
    btn.dataset.id  = id;
    btn.textContent = info.label || `T${id}`;
    btn.style.borderColor     = activeTool === id ? (info.borderColorOn || '#5c6bff') : (info.borderColor || '#333');
    btn.style.color           = activeTool === id ? (info.borderColorOn || '#aaf')    : '#666';
    btn.style.backgroundColor = info.color || '#1a1a2a';
    btn.addEventListener('click', () => setTool(id));
    el.appendChild(btn);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SAVE / LOAD
// ─────────────────────────────────────────────────────────────────────────────

document.getElementById('btn-save').addEventListener('click', () => {
  const data = grid.toJSON();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'gridsim.json';
  a.click();
  log('Saved gridsim.json', 'ok');
});

document.getElementById('btn-load').addEventListener('click', () =>
  document.getElementById('file-in').click()
);

document.getElementById('file-in').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      stopRun();
      const data = JSON.parse(ev.target.result);
      grid = Grid.fromJSON(data, registry);
      document.getElementById('inp-w').value = grid.width;
      document.getElementById('inp-h').value = grid.height;
      centerCam(); draw();
      log(`Loaded ${grid.width}×${grid.height}`, 'ok');
    } catch (err) {
      log('Load failed: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// ─────────────────────────────────────────────────────────────────────────────
// LOG
// ─────────────────────────────────────────────────────────────────────────────

function log(msg, level = 'info') {
  const el   = document.getElementById('log');
  const line = document.createElement('div');
  line.className = 'log-' + level;
  const t = new Date().toLocaleTimeString('de', { hour12: false });
  line.textContent = `[${t}] ${msg}`;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
  // Keep last 200 lines
  while (el.children.length > 200) el.removeChild(el.firstChild);
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────────────────────────────────────────

function updateStatus() {
  const net = grid._net;
  document.getElementById('s-nets').textContent = net ? Object.keys(net.netState).length : '—';
  document.getElementById('s-step').textContent = grid.stepCount;
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

buildExtList();
buildTypePalette();
resize();
setTimeout(() => { centerCam(); draw(); }, 50);
log('Grid Sim ready — algorithm.js loaded', 'ok');
log('L=draw  R=erase  Ctrl+scroll=zoom  scroll=cycle type  Space+drag=pan  S=step', 'info');