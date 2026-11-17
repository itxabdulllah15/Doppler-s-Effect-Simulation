
/* DOPPLER EFFECT – Interactive Physics Simulation | Abdullah Ashraf
   Sections: 1 Config · 2 Physics · 3 Audio · 4 Simulation
   5 Drawing · 6 UI · 7 Calculator · 8 Content · 9 Intro
*/
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fx = (n, d = 1) => Number(n).toFixed(d);

/* ---------- 1. CONFIG ---------- */

const DEFAULTS = {
  f: 440,
  v: 343,
  vs: 30,
  vL: 30,
  vol: 50,
  speed: 1
};

const ASSETS = {
  car: 'assets/car/car.png',
  person: 'assets/character/person.png'
};

const K = 0.8;
const VIS_DIV = 220;

const S = {
  mode: 'A',
  c: 0,
  ...DEFAULTS,
  sT: true,
  lT: true,
  playing: true,
  tone: 'obs',
  sound: false
};

/* ---------- 2. PHYSICS ---------- */

// Positive uS = source moves towards listener.
// Negative uS = source moves away.
// Negative uL = listener moves towards source.

function doppler(f, v, uS, uL) {
  const fo = f * (v - uL) / (v - uS);
  const lam = v / f;
  const lamO = (v - uS) / f;

  return {
    fo,
    lam,
    lamO,
    df: fo - f,
    dl: lamO - lam,
    pct: (fo - f) / f * 100
  };
}

function velocities(mode, vs, vL, sToward, lToward) {
  return {
    uS: mode === 'A' ? 0 : (sToward ? vs : -vs),
    uL: mode === 'B' ? 0 : (lToward ? -vL : vL)
  };
}

function formulaText(mode, f, v, vs, vL, uS, uL) {
  const gen = mode === 'A'
    ? (uL < 0
      ? "f' = f(v + vL)/v"
      : "f' = f(v − vL)/v")
    : mode === 'B'
      ? (uS > 0
        ? "f' = f·v/(v − vs)"
        : "f' = f·v/(v + vs)")
      : "f' = f(v ± vL)/(v ∓ vs)";

  const num = mode === 'B'
    ? `${v}`
    : `(${v} ${uL < 0 ? '+' : '−'} ${vL})`;

  const den = mode === 'A'
    ? `${v}`
    : `(${v} ${uS > 0 ? '−' : '+'} ${vs})`;

  return {
    gen,
    sub: `f' = ${f} × ${num} / ${den}`
  };
}

function current() {
  const sToward = S.mode === 'B' ? S.c === 0 : S.sT;
  const lToward = S.mode === 'A' ? S.c === 0 : S.lT;

  let vs = S.mode === 'A' ? 0 : S.vs;
  let vL = S.mode === 'B' ? 0 : S.vL;

  const u = velocities(
    S.mode,
    vs,
    vL,
    sToward,
    lToward
  );

  let uS = u.uS;
  let uL = u.uL;

  // Manual dragging temporarily controls actual velocity.
  if (dragging === 'source') {
    uS = dragUS;
    vs = Math.abs(dragUS);
  }

  if (dragging === 'listener') {
    uL = dragUL;
    vL = Math.abs(dragUL);
  }

  const result = doppler(S.f, S.v, uS, uL);

  const formula = formulaText(
    S.mode,
    S.f,
    S.v,
    vs,
    vL,
    uS,
    uL
  );

  if (dragging) {
    formula.gen = "f' = f(v − uL)/(v − uS)";
    formula.sub = `f' = ${S.f} × (${S.v} − ${fx(uL, 1)}) / (${S.v} − ${fx(uS, 1)})`;
  }

  return {
    uS,
    uL,
    vs,
    vL,
    ...result,
    ...formula
  };
}

/* ---------- 3. AUDIO ---------- */

let ac, osc, gain;

function audioInit() {
  if (ac) return;

  ac = new (window.AudioContext || window.webkitAudioContext)();

  osc = ac.createOscillator();
  gain = ac.createGain();

  gain.gain.value = 0;
  osc.type = 'sine';

  osc.connect(gain).connect(ac.destination);
  osc.start();
}

function audioUpdate() {
  if (!ac) return;

  const t = ac.currentTime;
  const c = current();

  osc.frequency.setTargetAtTime(
    S.tone === 'obs' ? c.fo : S.f,
    t,
    0.05
  );

  gain.gain.setTargetAtTime(
    S.sound ? S.vol / 100 * 0.3 : 0,
    t,
    0.05
  );
}

/* ---------- 4. SIMULATION ---------- */

const cv = $('#scene');
const g = cv.getContext('2d');

let sx, lx;
let time = 0;
let last = performance.now();

let dragging = null;
let pointerX = 0;
let pointerY = 0;
let lastPointerTime = 0;

let dragUS = 0;
let dragUL = 0;

function wavelengthPixels() {
  const c = current();

  return c.lamO * K * VIS_DIV;
}

function minimumGap() {
  return 90;
}

function keepObjectsSeparated() {
  const gap = minimumGap();

  if (lx - sx < gap) {
    lx = Math.min(1100, sx + gap);

    if (lx - sx < gap) {
      sx = Math.max(120, lx - gap);
    }
  }

  sx = Math.max(120, Math.min(1100, sx));
  lx = Math.max(sx + 40, Math.min(1100, lx));
}

function init() {
  time = 0;

  const sT = S.mode === 'B'
    ? S.c === 0
    : S.sT;

  if (S.mode === 'A') {
    sx = 300;
    lx = 1050;
  } else if (S.mode === 'B') {
    lx = 1000;
    sx = sT ? 120 : 500;
  } else {
    sx = sT ? 180 : 400;
    lx = 1050;
  }

  keepObjectsSeparated();
}

function step(dt) {
  // Time and sound waves continue to animate.
  // The car and person DO NOT move automatically.
  time += dt;
}

/* ---------- IMAGE ASSETS ---------- */

const img = {};

for (const k in ASSETS) {
  img[k] = new Image();

  img[k].onload = () => {
    img[k].ok = true;
  };

  img[k].src = ASSETS[k];
}

/* ---------- DRAG CONTROLS ---------- */

function getCanvasPosition(e) {
  const rect = cv.getBoundingClientRect();

  return {
    x: (e.clientX - rect.left) * (1200 / rect.width),
    y: (e.clientY - rect.top) * (560 / rect.height)
  };
}

cv.addEventListener('pointerdown', e => {
  const p = getCanvasPosition(e);

  const carHit =
    Math.abs(p.x - sx) < 115 &&
    p.y > 355 &&
    p.y < 490;

  const personHit =
    Math.abs(p.x - lx) < 55 &&
    p.y > 190 &&
    p.y < 345;

  // Mode A: Source is stationary.
  // Mode B: Listener is stationary.
  // Mode C: Both can move.
  const sourceCanMove = S.mode !== 'A';
  const listenerCanMove = S.mode !== 'B';

  if (carHit && sourceCanMove) {
    dragging = 'source';
  } else if (personHit && listenerCanMove) {
    dragging = 'listener';
  } else {
    return;
  }

  pointerX = p.x;
  pointerY = p.y;
  lastPointerTime = performance.now();

  dragUS = 0;
  dragUL = 0;

  cv.setPointerCapture(e.pointerId);

  refresh();
});

function stopDragging() {
  dragging = null;

  dragUS = 0;
  dragUL = 0;

  audioUpdate();
  refresh();
}

cv.addEventListener('pointerup', stopDragging);
cv.addEventListener('pointercancel', stopDragging);
cv.addEventListener('lostpointercapture', stopDragging);

cv.style.cursor = 'grab';

cv.addEventListener('pointermove', e => {
  if (!dragging) return;

  const p = getCanvasPosition(e);
  const now = performance.now();

  const dt = Math.max(
    0.001,
    (now - lastPointerTime) / 1000
  );

  const dx = p.x - pointerX;
  const gap = minimumGap();

  if (dragging === 'source') {
    const oldX = sx;

    sx = Math.max(
      120,
      Math.min(lx - gap, sx + dx)
    );

    const actualDx = sx - oldX;

    // Right = approaching; left = moving away.
    if (Math.abs(actualDx) > 0.5) {
      dragUS = Math.max(
        -100,
        Math.min(100, actualDx / (K * dt))
      );
    }
  }

  if (dragging === 'listener') {
    const oldX = lx;

    lx = Math.max(
      sx + gap,
      Math.min(1100, lx + dx)
    );

    const actualDx = lx - oldX;

    // Left = approaching; right = moving away.
    if (Math.abs(actualDx) > 0.5) {
      dragUL = Math.max(
        -100,
        Math.min(100, actualDx / (K * dt))
      );
    }
  }

  pointerX = p.x;
  pointerY = p.y;
  lastPointerTime = now;

  audioUpdate();
});

/* ---------- 5. DRAWING ---------- */

const COL = {
  wave: '#22d3ee',
  lam: '#a78bfa',
  dl: '#facc15',
  fo: '#4ade80',
  vs: '#f87171',
  vl: '#60a5fa'
};

function arrow(x1, x2, y, col, label, both) {
  g.strokeStyle = g.fillStyle = col;
  g.lineWidth = 3;

  g.beginPath();
  g.moveTo(x1, y);
  g.lineTo(x2, y);
  g.stroke();

  const d = Math.sign(x2 - x1) || 1;

  const head = (x, s) => {
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x - s * 12, y - 7);
    g.lineTo(x - s * 12, y + 7);
    g.fill();
  };

  head(x2, d);

  if (both) head(x1, -d);

  if (label) {
    g.font = 'bold 18px Segoe UI';
    g.textAlign = 'center';
    g.fillText(label, (x1 + x2) / 2, y - 12);
  }
}

function drawBackground() {
  const sky = g.createLinearGradient(0, 0, 0, 260);

  sky.addColorStop(0, '#8fd3fb');
  sky.addColorStop(1, '#d9f1fd');

  g.fillStyle = sky;
  g.fillRect(0, 0, 1200, 560);

  g.fillStyle = '#fff';

  [[160, 70], [520, 50], [860, 90], [1060, 45]]
    .forEach(([x, y]) => {
      [[0, 0, 40], [38, -10, 34], [72, 2, 30], [-34, 6, 26]]
        .forEach(([a, b, r]) => {
          g.beginPath();
          g.arc(x + a, y + b, r, 0, 7);
          g.fill();
        });
    });

  g.fillStyle = '#5fb760';
  g.fillRect(0, 250, 1200, 50);

  g.fillStyle = '#3e9a48';

  for (let i = 0; i < 1200; i += 40) {
    g.beginPath();
    g.arc(i + 15, 252, 14, Math.PI, 0);
    g.fill();
  }

  g.fillStyle = '#cfd5db';
  g.fillRect(0, 300, 1200, 42);

  g.fillStyle = '#aab3bb';
  g.fillRect(0, 338, 1200, 4);

  g.fillStyle = '#4b535c';
  g.fillRect(0, 342, 1200, 150);

  g.fillStyle = '#f5f7fa';

  for (let i = 0; i < 1200; i += 100) {
    g.fillRect(i + 10, 418, 60, 6);
  }

  g.fillStyle = '#2f353c';
  g.fillRect(0, 492, 1200, 68);

  // Draw instruction.
  g.fillStyle = 'rgba(7,20,43,.85)';
  g.font = 'bold 15px Segoe UI';
  g.textAlign = 'center';

  g.fillText(
    'DRAG THE CAR OR PERSON TO REPOSITION THEM',
    600,
    75
  );
}

function drawCar(x, y, dir) {
  g.save();
  g.translate(x, y);
  g.scale(dir, 1);

  if (img.car.ok) {
    g.drawImage(img.car, -110, -100, 220, 100);
  } else {
    g.fillStyle = 'rgba(0,0,0,.25)';
    g.beginPath();
    g.ellipse(0, 2, 100, 8, 0, 0, 7);
    g.fill();

    g.fillStyle = '#d62839';
    g.beginPath();
    g.roundRect(-105, -52, 210, 36, 14);
    g.fill();

    g.beginPath();
    g.moveTo(-60, -52);
    g.quadraticCurveTo(-45, -92, -10, -92);
    g.lineTo(35, -92);
    g.quadraticCurveTo(62, -88, 78, -52);
    g.fill();

    g.fillStyle = '#bfe6fb';

    g.beginPath();
    g.moveTo(-48, -54);
    g.quadraticCurveTo(-38, -84, -12, -84);
    g.lineTo(-6, -84);
    g.lineTo(-6, -54);
    g.fill();

    g.beginPath();
    g.moveTo(4, -84);
    g.lineTo(32, -84);
    g.quadraticCurveTo(52, -80, 64, -54);
    g.lineTo(4, -54);
    g.fill();

    g.fillStyle = '#fde68a';
    g.fillRect(96, -46, 9, 8);

    g.fillStyle = '#ff9aa5';
    g.fillRect(-105, -46, 6, 8);

    [-62, 62].forEach(wx => {
      g.fillStyle = '#111';
      g.beginPath();
      g.arc(wx, -16, 22, 0, 7);
      g.fill();

      g.fillStyle = '#c3cfdd';
      g.beginPath();
      g.arc(wx, -16, 10, 0, 7);
      g.fill();
    });
  }

  g.restore();
}

function drawPerson(x, y, dir, moving) {
  g.save();
  g.translate(x, y);
  g.scale(dir, 1);

  if (img.person.ok) {
    g.drawImage(img.person, -35, -130, 70, 130);
  } else {
    const sw = moving ? Math.sin(time * 6) * 14 : 0;

    g.lineCap = 'round';
    g.lineWidth = 11;
    g.strokeStyle = '#26344f';

    g.beginPath();
    g.moveTo(0, -55);
    g.lineTo(sw, -2);
    g.moveTo(0, -55);
    g.lineTo(-sw, -2);
    g.stroke();

    g.fillStyle = '#1f9d8f';
    g.beginPath();
    g.roundRect(-16, -108, 32, 56, 10);
    g.fill();

    g.strokeStyle = '#1f9d8f';
    g.lineWidth = 9;

    g.beginPath();
    g.moveTo(0, -98);
    g.lineTo(-sw * .6 + 8, -66);
    g.stroke();

    g.fillStyle = '#f1c9a5';
    g.beginPath();
    g.arc(0, -126, 15, 0, 7);
    g.fill();

    g.fillStyle = '#3a2a22';
    g.beginPath();
    g.arc(-2, -130, 15, Math.PI, 0);
    g.fill();
  }

  g.restore();
}

function tag(t, x, y) {
  g.font = '600 18px Segoe UI';

  const w = g.measureText(t).width + 22;

  g.fillStyle = 'rgba(255,255,255,.95)';
  g.beginPath();
  g.roundRect(x - w / 2, y - 20, w, 30, 8);
  g.fill();

  g.fillStyle = '#0b2342';
  g.textAlign = 'center';
  g.fillText(t, x, y + 1);
}

function dashV(x, y1, y2, col) {
  g.setLineDash([6, 5]);
  g.strokeStyle = col;
  g.lineWidth = 2;

  g.beginPath();
  g.moveTo(x, y1);
  g.lineTo(x, y2);
  g.stroke();

  g.setLineDash([]);
}

/* ---------- WAVELENGTH DRAWING ---------- */


function drawWavelength(c, V, u, fV, cy, A) {
  // Actual wavelength in visual pixels.
  const lambdaPx = (V - u) / fV;

  // Fixed measurement position at the centre of the gap.
  const mid = (sx + lx) / 2;
  const x1 = mid - lambdaPx / 2;
  const x2 = mid + lambdaPx / 2;

  const enoughSpace =
    x1 >= sx + 8 &&
    x2 <= lx - 8;

  // Small wavelength heading above the measurement.
  g.fillStyle = '#0b2342';
  g.font = 'bold 13px Segoe UI';
  g.textAlign = 'center';

  g.fillText(`λ′ = ${fx(c.lamO, 3)} m`, (x1 + x2) / 2, 135); 

  if (enoughSpace) {
    // Fixed measurement markers.
    dashV(x1, 110, cy - A - 3, COL.wave);
    dashV(x2, 110, cy - A - 3, COL.wave);

    // Wavelength arrow and value.
    arrow(
      x1,
      x2,
      120,
      COL.lam,
      `λ′ = ${fx(c.lamO, 3)} m`,
      true
    );

    // Original wavelength.
    g.fillStyle = '#0b2342';
    g.font = '12px Segoe UI';

    g.fillText(
      `Original λ = ${fx(c.lam, 3)} m`,
      mid,
      148
    );

    // Source movement status.
    g.font = '11px Segoe UI';

    const status =
      c.uS > 0
        ? 'COMPRESSED — Source approaching'
        : c.uS < 0
          ? 'STRETCHED — Source moving away'
          : 'UNCHANGED — Source stationary';

    g.fillText(status, mid, 168);

  } else {
    // Show values if the gap is too small.
    g.fillStyle = COL.lam;
    g.font = '13px Segoe UI';

    g.fillText(
      `λ′ = ${fx(c.lamO, 3)} m`,
      mid,
      125
    );

    g.fillStyle = '#0b2342';
    g.font = '12px Segoe UI';

    g.fillText(
      `Original λ = ${fx(c.lam, 3)} m`,
      mid,
      148
    );
  }
}


/* ---------- MAIN SCENE ---------- */

function drawScene() {
  const c = current();

  const V = S.v * K;
  const u = c.uS * K;
  const fV = S.f / VIS_DIV;

  const A = 34;
  const cy = 250;

  drawBackground();

  // Draw waves ONLY between the car and the person.
  g.save();

  g.beginPath();
  g.rect(
    Math.min(sx, lx),
    115,
    Math.abs(lx - sx),
    160
  );
  g.clip();

  const trueLambdaPx = (V - u) / fV;
  const displayLambdaPx = trueLambdaPx;

  g.strokeStyle = '#1e7bff';
  g.lineWidth = 5;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.beginPath();

  let on = false;

  for (let x = sx; x <= lx; x += 3) {
    const distance = x - sx;

    const phase =
      2 * Math.PI *
      (fV * time - distance / displayLambdaPx);

    const y =
      cy -
      A * Math.sin(phase);

    if (!on) {
      g.moveTo(x, y);
      on = true;
    } else {
      g.lineTo(x, y);
    }
  }

  g.stroke();
  g.restore();

  // Fixed wavelength measurement above the animated wave.
  drawWavelength(c, V, u, fV, cy, A);

  drawCar(sx, 470, c.uS < 0 ? -1 : 1);

  // Person remains stationary unless manually dragged.
  drawPerson(lx, 336, c.uL < 0 ? -1 : 1, false);

  dashV(sx, cy + A, 380, '#fff');

  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(sx, 382, 6, 0, 7);
  g.fill();

  if (c.uS) {
    arrow(
      sx - 55 * Math.sign(c.uS),
      sx + 55 * Math.sign(c.uS),
      372,
      COL.vs,
      `vs = ${c.vs} m/s`
    );
  }

  if (c.uL) {
    arrow(
      lx - 45 * Math.sign(c.uL),
      lx + 45 * Math.sign(c.uL),
      205,
      COL.vl,
      `vL = ${c.vL} m/s`
    );
  }

  tag(
    c.uS ? 'Source: car with horn' : 'Source (at rest)',
    sx,
    345
  );

  tag(
    c.uL ? 'Listener (moving)' : 'Listener (at rest)',
    lx,
    160
  );

  // Doppler formula panel near the listener (right side).
  g.fillStyle = 'rgba(7,20,43,.92)';
  g.beginPath();
  g.roundRect(805, 12, 380, 76, 12);
  g.fill();

  g.strokeStyle = 'rgba(34,211,238,.65)';
  g.lineWidth = 1.5;
  g.stroke();

  g.fillStyle = '#22d3ee';
  g.font = 'bold 14px Segoe UI';
  g.textAlign = 'center';

  g.fillText('DOPPLER EFFECT FORMULA', 995, 33);

  g.fillStyle = '#ffffff';
  g.font = 'bold 18px Segoe UI';

  g.fillText(c.gen, 995, 57);

  g.fillStyle = '#a7f3d0';
  g.font = 'bold 15px Segoe UI';

  g.fillText(
    `${c.sub} = ${fx(c.fo)} Hz`,
    995,
    78
  );

  g.fillStyle = '#0b2342';
  g.font = '13px Segoe UI';
  g.textAlign = 'right';

  g.fillText(
    'Wave drawing is a visual representation',
    1190,
    62
  );

  // Bottom information strip.
  g.fillStyle = 'rgba(7,20,43,.92)';
  g.fillRect(0, 494, 1200, 66);

  // Wavelength values are displayed above the wave,
  // so they are intentionally removed from this strip.
  const L = [
    [COL.wave, `f = ${S.f} Hz`],
    [COL.fo, `f′ = ${fx(c.fo)} Hz`],
    [COL.fo, `Δf = ${c.df >= 0 ? '+' : ''}${fx(c.df)} Hz`],
    ['#fff', `v = ${S.v} m/s`],
    [COL.vs, `vs = ${c.vs} m/s`],
    [COL.vl, `vL = ${c.vL} m/s`]
  ];

  g.font = 'bold 17px Segoe UI';
  g.textAlign = 'left';

  L.forEach(([col, t], i) => {
    g.fillStyle = col;

    g.fillText(
      t,
      24 + Math.floor(i / 3) * 400,
      516 + (i % 3) * 22
    );
  });
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);

  last = now;

  if (S.playing) {
    step(dt * S.speed);
  }

  drawScene();

  requestAnimationFrame(loop);
}

/* ---------- 6. UI ---------- */

const CASES = {
  A: [
    'Listener moves towards the source',
    'Listener moves away from the source'
  ],
  B: [
    'Source moves towards the listener',
    'Source moves away from the listener'
  ],
  C: ['Both moving']
};

function refresh() {
  [
    'f',
    'v',
    'vs',
    'vL',
    'vol'
  ].forEach(k => {
    const el = $('#' + k);

    el.value = S[k];

    el.previousElementSibling.textContent =
      S[k] +
      (
        k === 'f'
          ? ' Hz'
          : k === 'vol'
            ? ' %'
            : ' m/s'
      );
  });

  $('#speedO').textContent = fx(S.speed) + 'x';

  $('#rowVs').hidden = S.mode === 'A';
  $('#rowVl').hidden = S.mode === 'B';

  $('#caseRow').hidden = S.mode === 'C';
  $('#advRow').hidden = S.mode !== 'C';

  $$('.mode').forEach(b => {
    b.classList.toggle('on', b.dataset.mode === S.mode);
  });

  $$('.case').forEach((b, i) => {
    b.textContent = CASES[S.mode][i] || '';
    b.classList.toggle('on', +b.dataset.case === S.c);
  });

  $('#caseTitle').textContent =
    S.mode === 'C'
      ? `Source ${S.sT ? 'approaching' : 'moving away'} · Listener ${S.lT ? 'approaching' : 'moving away'}`
      : CASES[S.mode][S.c];

  $('#vs').max = Math.min(100, S.v - 1);

  if (S.vs > S.v - 1) {
    S.vs = S.v - 1;
  }

  if (sx !== undefined && lx !== undefined) {
    keepObjectsSeparated();
  }

  $('#bPlay').textContent = S.playing ? 'Pause Waves' : 'Play Waves';

  // SOUND button: fixed text, colour indicates its state.
  $('#bSound').textContent = 'SOUND';

  $('#bSound').classList.toggle('on', S.sound);

  $('#bSound').setAttribute(
    'aria-pressed',
    String(S.sound)
  );

  $('#bSound').title =
    S.sound
      ? 'Sound is ON — click to turn it OFF'
      : 'Sound is OFF — click to turn it ON';

  $('#tOrig').classList.toggle('on', S.tone === 'orig');
  $('#tObs').classList.toggle('on', S.tone === 'obs');

  audioUpdate();
}

$$('.mode').forEach(b => {
  b.onclick = () => {
    S.mode = b.dataset.mode;
    S.c = 0;

    init();
    refresh();
  };
});

$$('.case').forEach(b => {
  b.onclick = () => {
    S.c = +b.dataset.case;

    init();
    refresh();
  };
});

$('#sDirSel').onchange = e => {
  S.sT = e.target.value === '1';

  init();
  refresh();
};

$('#lDirSel').onchange = e => {
  S.lT = e.target.value === '1';

  init();
  refresh();
};

['f', 'v', 'vs', 'vL', 'vol'].forEach(k => {
  $('#' + k).oninput = e => {
    S[k] = +e.target.value;
    refresh();
  };
});

$('#speed').oninput = e => {
  S.speed = +e.target.value;
  refresh();
};

$('#bPlay').onclick = () => {
  S.playing = !S.playing;
  refresh();
};

$('#bRestart').onclick = () => {
  init();
  refresh();
};

$('#bSound').onclick = () => {
  audioInit();

  ac.resume();

  S.sound = !S.sound;

  refresh();
};

$('#tOrig').onclick = () => {
  S.tone = 'orig';
  refresh();
};

$('#tObs').onclick = () => {
  S.tone = 'obs';
  refresh();
};

$('#bTheme').onclick = () => {
  const d = document.documentElement;

  d.dataset.theme =
    d.dataset.theme === 'dark'
      ? 'light'
      : 'dark';
};

$('#bPresent').onclick = () => {
  document.body.classList.toggle('present');
};

$('#bFull').onclick = () => {
  document.fullscreenElement
    ? document.exitFullscreen()
    : $('#sceneCard').requestFullscreen();
};

$('#bResetAll').onclick = () => {
  Object.assign(S, {
    mode: 'A',
    c: 0,
    ...DEFAULTS,
    sT: true,
    lT: true,
    playing: true,
    tone: 'obs'
  });

  $('#sDirSel').value = '1';
  $('#lDirSel').value = '1';

  init();
  refresh();
  calcReset();
};

/* ---------- 7. CALCULATOR ---------- */

function calcRun() {
  const mode = $('#cMode').value;

  const f = +$('#cf').value;
  const v = +$('#cv').value;

  const vs = mode === 'A' ? 0 : +$('#cvs').value;
  const vL = mode === 'B' ? 0 : +$('#cvl').value;

  if (!(f > 0 && v > 0 && vs >= 0 && vL >= 0)) {
    return $('#cOut').textContent =
      'Enter a positive frequency and speed of sound, and velocities of 0 or more.';
  }

  if (vs >= v) {
    return $('#cOut').textContent =
      `Source velocity must be below the speed of sound (${v} m/s) for this subsonic model.`;
  }

  if (mode !== 'A' && vL >= v) {
    return $('#cOut').textContent =
      'Listener velocity must be below the speed of sound.';
  }

  const u = velocities(
    mode,
    vs,
    vL,
    $('#cS').value === '1',
    $('#cL').value === '1'
  );

  const r = doppler(f, v, u.uS, u.uL);

  const t = formulaText(
    mode,
    f,
    v,
    vs,
    vL,
    u.uS,
    u.uL
  );

  const num = mode === 'B' ? v : v - u.uL;
  const den = mode === 'A' ? v : v - u.uS;

  $('#cOut').textContent =
`Given:
  f = ${f} Hz, v = ${v} m/s, vs = ${vs} m/s, vL = ${vL} m/s

Formula:
  ${t.gen}

Substitution:
  ${t.sub}
  f' = ${f} × ${num} / ${den}

Final answer:
  f' = ${fx(r.fo)} Hz

λ = v/f = ${fx(r.lam, 3)} m
λ' = ${fx(r.lamO, 3)} m
Δf = ${r.df >= 0 ? '+' : ''}${fx(r.df)} Hz
Δλ = ${r.dl >= 0 ? '+' : ''}${fx(r.dl, 3)} m
Change in frequency = ${r.pct >= 0 ? '+' : ''}${fx(r.pct, 2)} %`;
}

function calcReset() {
  $('#cf').value = DEFAULTS.f;
  $('#cv').value = DEFAULTS.v;
  $('#cvs').value = DEFAULTS.vs;
  $('#cvl').value = 0;

  $('#cMode').value = 'B';

  $('#cS').value = '1';
  $('#cL').value = '1';

  calcRun();
}

const copy = (txt, btn) =>
  navigator.clipboard.writeText(txt).then(() => {
    const o = btn.textContent;

    btn.textContent = 'Copied';

    setTimeout(() => {
      btn.textContent = o;
    }, 1200);
  });

$('#cGo').onclick = calcRun;
$('#cReset').onclick = calcReset;

$('#cClear').onclick = () => {
  ['cf', 'cv', 'cvs', 'cvl'].forEach(i => {
    $('#' + i).value = '';
  });

  $('#cOut').textContent = '';
};

$('#cCopy').onclick = e => {
  copy($('#cOut').textContent, e.target);
};

$('#cScene').onclick = () => {
  $('#cMode').value = S.mode;
  $('#cf').value = S.f;
  $('#cv').value = S.v;

  $('#cvs').value = S.mode === 'A' ? 0 : S.vs;
  $('#cvl').value = S.mode === 'B' ? 0 : S.vL;

  $('#cS').value =
    (S.mode === 'B' ? S.c === 0 : S.sT)
      ? '1'
      : '0';

  $('#cL').value =
    (S.mode === 'A' ? S.c === 0 : S.lT)
      ? '1'
      : '0';

  calcRun();
};

$$('#calc input,#calc select').forEach(el => {
  el.addEventListener('input', calcRun);
});

/* ---------- 8. EDUCATIONAL CONTENT ---------- */

const VARS = [
  ['f', 'Frequency', 'Number of waves the source makes each second.', 'Hz'],
  ["f′", 'Observed frequency', 'Frequency the listener actually hears.', 'Hz'],
  ['v', 'Speed of sound', 'How fast sound travels through the air.', 'm/s'],
  ['vs', 'Source velocity', 'How fast the source (car) moves.', 'm/s'],
  ['vL', 'Listener velocity', 'How fast the listener moves.', 'm/s'],
  ['λ', 'Wavelength', 'Distance between two wavefronts, λ = v/f.', 'm'],
  ["λ′", 'Observed wavelength', 'Wavelength in the air when the source moves.', 'm'],
  ['Δλ', 'Change in wavelength', "λ′ − λ", 'm'],
  ['Δf', 'Change in frequency', "f′ − f", 'Hz']
];

$('#vars').innerHTML = VARS.map(([s, n, d, u]) =>
  `<div><b>${s}</b> ${n}<small>${d} SI unit: ${u}</small></div>`
).join('');

const FORM = [
  ['Listener approaching (stationary source)', "f′ = f(v + vL)/v"],
  ['Listener moving away', "f′ = f(v − vL)/v"],
  ['Source approaching (stationary listener)', "f′ = f·v/(v − vs)"],
  ['Source moving away', "f′ = f·v/(v + vs)"],
  ['Wavelength', 'λ = v/f'],
  ['Moving source approaching', "λ′ = (v − vs)/f"],
  ['Moving source away', "λ′ = (v + vs)/f"],
  ['Both moving', "f′ = f(v ± vL)/(v ∓ vs)  (+vL listener towards, −vs source towards)"],
  ['Frequency difference', 'Δf = f′ − f'],
  ['Wavelength difference', 'Δλ = λ′ − λ']
];

$('#formulas').innerHTML = FORM.map(([a, b]) =>
  `<tr><th>${a}</th><td>${b}</td></tr>`
).join('');

$('#fCopy').onclick = e => {
  copy(FORM.map(x => x.join(': ')).join('\n'), e.target);
};

const UP = '<span class="up">▲ increases</span>';
const DN = '<span class="dn">▼ decreases</span>';

$('#compare').innerHTML =
  '<tr><th>Situation</th><th>Moving</th><th>Stationary</th><th>Formula</th><th>Frequency</th><th>Wavelength</th></tr>' +
  [
    ['Listener approaches source', 'Listener', 'Source', "f(v + vL)/v", UP, 'Unchanged'],
    ['Listener moves away', 'Listener', 'Source', "f(v − vL)/v", DN, 'Unchanged'],
    ['Source approaches listener', 'Source', 'Listener', "f·v/(v − vs)", UP, 'Shorter'],
    ['Source moves away', 'Source', 'Listener', "f·v/(v + vs)", DN, 'Longer']
  ].map(r =>
    `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`
  ).join('');

$('#apps').innerHTML = [
  ['Ambulance sirens', 'The siren sounds higher as the ambulance comes closer and lower as it leaves.'],
  ['Passing cars and horns', 'A horn drops in pitch the moment a car passes you.'],
  ['Doppler radar', 'Radar measures the frequency shift of reflected waves to find the speed of rain or vehicles.'],
  ['Medical ultrasound', 'Frequency shifts of echoes from moving blood show blood speed and direction.'],
  ['Astronomy', "Shifts in a star's light show whether it moves towards or away from us."],
  ['Redshift and blueshift', 'Light from receding objects shifts to red; approaching objects shift to blue. Light uses relativistic formulas, not the sound equations.']
].map(([a, b]) =>
  `<div><b>${a}</b><br>${b}</div>`
).join('');

/* ---------- QUIZ ---------- */

const QZ = [
  ['What is the Doppler effect?', [
    'A change in wave speed only',
    'An apparent change in frequency due to relative motion',
    'A change in loudness only'
  ], 1],

  ['A source moves towards a stationary listener. The wavelength in air…', [
    'becomes shorter',
    'becomes longer',
    'stays the same'
  ], 0],

  ['A listener moves away from a stationary source. The observed frequency…', [
    'increases',
    'decreases',
    'does not change'
  ], 1],

  ['Which formula is for a source approaching a stationary listener?', [
    'f′ = f·v/(v + vs)',
    'f′ = f·v/(v − vs)',
    'f′ = f(v + vL)/v'
  ], 1],

  ['Frequency controls…', [
    'pitch',
    'loudness',
    'wave speed'
  ], 0],

  ['Which of these uses the Doppler effect?', [
    'Doppler radar',
    'A mirror',
    'A magnet'
  ], 0]
];

let qi = 0;
let qs = 0;

function quiz() {
  const el = $('#quiz');

  if (qi >= QZ.length) {
    el.innerHTML =
      `<p class="q">Final score: ${qs} / ${QZ.length}</p>` +
      '<button class="btn pri" id="qr">Restart quiz</button>';

    $('#qr').onclick = () => {
      qi = qs = 0;
      quiz();
    };

    return;
  }

  const [q, o, a] = QZ[qi];

  el.innerHTML =
    `<p class="q">Question ${qi + 1} of ${QZ.length}: ${q}</p>` +
    o.map((t, i) =>
      `<button class="opt" data-i="${i}">${t}</button>`
    ).join('') +
    '<p id="qf" aria-live="polite"></p>';

  $$('.opt').forEach(b => {
    b.onclick = () => {
      const ok = +b.dataset.i === a;

      if (ok) qs++;

      b.classList.add(ok ? 'ok' : 'no');
      $$('.opt')[a].classList.add('ok');

      $$('.opt').forEach(x => {
        x.disabled = true;
      });

      $('#qf').textContent = ok
        ? 'Correct!'
        : 'Not quite. The correct answer is highlighted.';

      setTimeout(() => {
        qi++;
        quiz();
      }, 1400);
    };
  });
}

/* ---------- 9. INTRO + LOGO FALLBACK ---------- */

const LOGO_SVG = `
<svg class="logo-img" viewBox="0 0 100 100"
role="img" aria-label="AA logo placeholder">
<circle cx="50" cy="50" r="46" fill="#0b2a55"
stroke="#c3cfdd" stroke-width="2"/>
<path d="M14 50a36 36 0 0 1 72 0"
fill="none" stroke="#22d3ee" stroke-width="3" opacity=".6"/>
<path d="M22 50a28 28 0 0 1 56 0"
fill="none" stroke="#22d3ee" stroke-width="3" opacity=".9"/>
<text x="50" y="62" text-anchor="middle"
font-family="Georgia" font-weight="700"
font-size="34" fill="#fff">AA</text>
</svg>`;

$$('.logo-img').forEach(i => {
  i.onerror = () => {
    const w = document.createElement('div');

    w.innerHTML = LOGO_SVG;

    const s = w.firstChild;

    s.setAttribute('class', i.className);

    i.replaceWith(s);
  };
});

let introTimer;

function intro(show) {
  const el = $('#intro');

  clearTimeout(introTimer);

  if (show) {
    el.classList.remove('gone');

    const st = el.querySelector('.intro-stage');

    st.style.animation = 'none';

    void st.offsetWidth;

    st.style.animation = '';
    
    introTimer = setTimeout(() => intro(false), 5000);
  } else {
    el.classList.add('gone');
  }
}

$('#skipIntro').onclick = () => intro(false);
$('#bReplay').onclick = () => intro(true);

/* ---------- START ---------- */

init();
refresh();
calcReset();
quiz();

introTimer = setTimeout(() => intro(false), 5000);

requestAnimationFrame(loop);
