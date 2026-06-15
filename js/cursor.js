/**
 * Pixel Grid Cursor Effect
 * EXACT 1:1 port from The Browser Company's homepage (sM component).
 *
 * Original React component → vanilla JS.
 * Only activates on devices with a fine pointer (mouse/trackpad).
 */
(function () {
  'use strict';

  /* ---- Constants (exact TBC defaults / homepage props) ------------------- */
  var CELL_SIZE = 10;              // pixelSize prop (homepage passes 10)
  var FADE_DURATION = 500;        // fadeDuration prop default
  var FADE_DELAY = 0;             // delay prop default
  var COLOR = '#0C50FF';          // pixelColor prop default
  var TRAIL_LENGTH = 35;          // simulatedCursorTrailLength prop default
  var TRAIL_INTERVAL = 1500;      // simulatedCursorTrailInterval prop default
  var TRAIL_SPEED = 175;          // simulatedCursorTrailSpeed prop default (ms per step)
  var MAX_TRAILS = 8;             // maxConcurrentSimulatedCursorTrails prop default

  /* ---- DOM setup -------------------------------------------------------- */
  var wrapper = document.createElement('div');
  wrapper.className = 'cursor-pixel-overlay';

  var canvas = document.createElement('canvas');
  canvas.className = 'cursor-pixel-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  wrapper.appendChild(canvas);
  document.body.prepend(wrapper);

  var ctx = canvas.getContext('2d');

  /* ---- State ------------------------------------------------------------ */
  /** @type {Map<string, {x: number, y: number, opacity: number, fadeStart: number}>} */
  var cells = new Map();
  /** @type {Array<{id: string, path: Array<{x:number,y:number}>, currentIndex: number, startTime: number, isComplete: boolean}>} */
  var trails = [];
  var rafId = null;
  var trailTimer = null;
  var spawnTimer = null;
  var enabled = true;
  var gridW = 0;
  var gridH = 0;

  /* ---- Helpers ---------------------------------------------------------- */
  function cellKey(col, row) {
    return col + '-' + row;
  }

  function resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    gridW = Math.ceil(w / CELL_SIZE);
    gridH = Math.ceil(h / CELL_SIZE);
    canvas.width = gridW * CELL_SIZE;
    canvas.height = gridH * CELL_SIZE;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.imageSmoothingEnabled = false;
  }

  /**
   * Generate a random walk path for a simulated cursor trail.
   * Exact port of TBC's _ function.
   * @param {number|null} startX
   * @param {number|null} startY
   * @param {Set<string>} occupied - cells already taken
   * @returns {Array<{x:number, y:number}>}
   */
  function generatePath(startX, startY, occupied) {
    if (gridW <= 0 || gridH <= 0) return [];

    var path = [];
    var cx = startX != null ? startX : Math.floor(Math.random() * gridW);
    var cy = startY != null ? startY : Math.floor(Math.random() * gridH);
    path.push({ x: cx, y: cy });

    // 8 compass directions
    var dirs = [
      { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: -1, y: 1 },
      { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 }
    ];
    var dirIdx = Math.floor(Math.random() * dirs.length);

    for (var i = 1; i < TRAIL_LENGTH; i++) {
      // Occasionally change direction
      if (Math.random() < 0.3) {
        dirIdx = (dirIdx + (Math.floor(3 * Math.random()) - 1) + dirs.length) % dirs.length;
      }

      var dir = dirs[dirIdx];
      var nx = cx + dir.x;
      var ny = cy + dir.y;
      var bouncedX = false;
      var bouncedY = false;

      // Bounce off edges
      if (nx < 0 || nx >= gridW) {
        nx = cx + (dir = Object.assign({}, dir, { x: -dir.x })).x;
        bouncedX = true;
      }
      if (ny < 0 || ny >= gridH) {
        ny = cy + (dir = Object.assign({}, dir, { y: -dir.y })).y;
        bouncedY = true;
      }

      // Find new direction after bounce
      if (bouncedX || bouncedY) {
        var newIdx = dirs.findIndex(function (d) { return d.x === dir.x && d.y === dir.y; });
        if (newIdx === -1) {
          newIdx = dirs.findIndex(function (d) {
            return Math.sign(d.x) === Math.sign(dir.x) && Math.sign(d.y) === Math.sign(dir.y);
          });
        }
        if (newIdx === -1) newIdx = Math.floor(Math.random() * dirs.length);
        dirIdx = newIdx;
      }

      var tx = Math.max(0, Math.min(gridW - 1, nx));
      var ty = Math.max(0, Math.min(gridH - 1, ny));
      var key = tx + '-' + ty;

      // If cell is occupied, try all directions to find a free one
      if (occupied.has(key)) {
        var found = false;
        for (var d = 0; d < dirs.length; d++) {
          var dx = Math.max(0, Math.min(gridW - 1, cx + dirs[d].x));
          var dy = Math.max(0, Math.min(gridH - 1, cy + dirs[d].y));
          var dk = dx + '-' + dy;
          if (!occupied.has(dk)) {
            tx = dx; ty = dy; dirIdx = d; found = true;
            break;
          }
        }
        if (!found) break; // dead end
      }

      cx = tx; cy = ty;
      path.push({ x: cx, y: cy });
    }

    return path;
  }

  /**
   * Create a new simulated trail.
   * Exact port of TBC's V function.
   */
  function createTrail(delay, occupied) {
    var path = generatePath(null, null, occupied);
    return {
      id: Math.random().toString(36).substr(2, 9),
      path: path,
      currentIndex: 0,
      startTime: Date.now() + (delay || 0),
      isComplete: false
    };
  }

  /* ---- Draw loop -------------------------------------------------------- */
  function draw() {
    if (!ctx) { rafId = null; return; }

    var now = Date.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLOR;

    cells.forEach(function (cell, key) {
      var elapsed = now - cell.fadeStart - FADE_DELAY;
      if (elapsed < 0) return;
      if (elapsed >= FADE_DURATION) {
        cells.delete(key);
        return;
      }
      cell.opacity = 1 - elapsed / FADE_DURATION;
      var alpha = cell.opacity;
      // Simulated trails get conditional opacity (always on in our case)
      if (key.indexOf('simulated-') === 0) {
        alpha *= 1; // !!D where D = true (intro finished + showCursors)
      }
      ctx.globalAlpha = alpha;
      ctx.fillRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    ctx.globalAlpha = 1;

    if (cells.size > 0) {
      rafId = requestAnimationFrame(draw);
    } else {
      rafId = null;
    }
  }

  function ensureDrawing() {
    if (!rafId && (cells.size > 0 || trails.length > 0)) {
      rafId = requestAnimationFrame(draw);
    }
  }

  /* ---- Simulated trail update (exact port of TBC's w function) ----------- */
  function updateTrails() {
    var now = Date.now();

    trails = trails.map(function (trail) {
      if (trail.isComplete) return trail;

      var newIndex = Math.floor((now - trail.startTime) / TRAIL_SPEED);

      if (newIndex > trail.currentIndex && newIndex < trail.path.length) {
        for (var i = trail.currentIndex + 1; i <= newIndex; i++) {
          var pt = trail.path[i];
          if (pt) {
            var key = 'simulated-' + trail.id + '-' + pt.x + '-' + pt.y;
            cells.set(key, { x: pt.x, y: pt.y, opacity: 1, fadeStart: now });
          }
        }
        if (!rafId) rafId = requestAnimationFrame(draw);
        return Object.assign({}, trail, {
          currentIndex: newIndex,
          isComplete: newIndex >= trail.path.length - 1
        });
      }

      return trail;
    }).filter(function (trail) {
      return !trail.isComplete || now - (trail.startTime + 50 * trail.path.length) < 2000;
    });
  }

  /* ---- Spawn new trails if needed --------------------------------------- */
  function spawnTrailsIfNeeded() {
    var now = Date.now();

    trails = trails.filter(function (t) {
      return t.startTime > now || !t.isComplete;
    }).filter(function (t) {
      return !t.isComplete || now - (t.startTime + t.path.length * TRAIL_SPEED) < 3000;
    });

    var activeCount = trails.filter(function (t) { return !t.isComplete; }).length;

    if (activeCount < MAX_TRAILS) {
      // Collect occupied cells from current trails
      var occupied = (function (existing) {
        var set = new Set();
        existing.forEach(function (t) {
          if (t.path.length > 0 && !t.isComplete) {
            var pt = t.path[Math.min(t.currentIndex, t.path.length - 1)];
            set.add(pt.x + '-' + pt.y);
          }
        });
        return set;
      })(trails);

      var newTrail = createTrail(400 * Math.random(), occupied);
      trails.push(newTrail);
    }

    // Cap at 2 * MAX_TRAILS
    if (trails.length > 2 * MAX_TRAILS) {
      trails = trails.slice(-2 * MAX_TRAILS);
    }
  }

  /* ---- Mouse handler (exact port of TBC's F function) ------------------- */
  function onMouseMove(e) {
    if (!enabled) return;

    var rect = canvas.getBoundingClientRect();
    var col = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    var row = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    if (col < 0 || row < 0 || col >= Math.ceil(rect.width / CELL_SIZE) || row >= Math.ceil(rect.height / CELL_SIZE)) return;

    var key = col + '-' + row;
    cells.set(key, { x: col, y: row, opacity: 1, fadeStart: Date.now() });

    if (!rafId) rafId = requestAnimationFrame(draw);
  }

  /* ---- Visibility handler ----------------------------------------------- */
  function onVisibilityChange() {
    if (document.hidden) {
      if (trailTimer) { clearInterval(trailTimer); trailTimer = null; }
      if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
    }
    // No ambient trails to restart
  }

  function scheduleTimers() {
    if (trailTimer) clearInterval(trailTimer);
    if (spawnTimer) clearInterval(spawnTimer);

    // Ambient trails disabled — no timers needed
  }

  /* ---- Lifecycle -------------------------------------------------------- */
  function start() {
    var hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!hasFinePointer) {
      enabled = false;
      wrapper.style.display = 'none';
      return;
    }
    enabled = true;
    wrapper.style.display = '';
    resize();
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    scheduleTimers();

    // Ambient trails disabled for portfolio — cursor-only mode
  }

  function stop() {
    enabled = false;
    cells.clear();
    trails = [];
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (trailTimer) { clearInterval(trailTimer); trailTimer = null; }
    if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /* ---- Init ------------------------------------------------------------- */
  start();

  // Re-evaluate on pointer type change
  window.matchMedia('(pointer: fine)').addEventListener('change', function (e) {
    if (e.matches) { start(); } else { stop(); }
  });
})();
