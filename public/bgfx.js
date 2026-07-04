/* ============================================================================
   RoyalShess — FONDO ANIMADO PROCEDURAL (estética TETR.IO: nada plano)
   Canvas a pantalla completa detrás de la UI. Cada "escena" se genera al
   azar (newScene): paleta, tipos de forma, dirección del flujo, densidad,
   parallax... El cliente pide una escena nueva en cada partida.
   La intensidad (0..1) la fija el cliente según el reloj: acelera todo y
   corre el matiz hacia el rojo.
   ============================================================================ */
(function () {
  const cv = document.createElement('canvas');
  cv.id = 'bgfx';
  document.body.prepend(cv);
  const g = cv.getContext('2d');

  // segundo canvas POR ENCIMA de la UI: estallidos de final de partida
  const fxcv = document.createElement('canvas');
  fxcv.id = 'fxfx';
  document.body.appendChild(fxcv);
  const fg = fxcv.getContext('2d');

  let W = 0, H = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);   // tope de DPR: rendimiento
    W = window.innerWidth; H = window.innerHeight;
    for (const [c, cx] of [[cv, g], [fxcv, fg]]) {
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }
  window.addEventListener('resize', resize);
  resize();

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // ---------- escena procedural ----------
  // tipos de forma disponibles; cada escena sortea 1-3 de ellos
  const KINDS = ['tri', 'diamond', 'hex', 'ring', 'dot'];
  const HUES  = [222, 252, 282, 200, 318, 168];   // azul, índigo, violeta, cian, magenta, verde-azul
  let scene = null, shapes = [];

  function newScene() {
    const kinds = [pick(KINDS)];
    while (Math.random() < 0.6 && kinds.length < 3) {
      const k = pick(KINDS);
      if (!kinds.includes(k)) kinds.push(k);
    }
    scene = {
      hue: pick(HUES) + rnd(-12, 12),   // matiz base de la paleta
      spread: rnd(16, 46),              // variedad de matiz entre formas
      sat: rnd(40, 62),
      flow: rnd(0, Math.PI * 2),        // dirección global de la deriva
      drift: rnd(0.03, 0.12),           // cuánto serpentea esa dirección
      speed: rnd(9, 24),                // px/s base
      glows: Math.random() < 0.5 ? 2 : 3,
      wire: rnd(0.25, 0.8),             // proporción de formas solo-contorno
      vig: rnd(0.45, 0.65),             // fuerza de la viñeta
    };
    shapes = [];
    const n = Math.round(rnd(24, 44));
    for (let i = 0; i < n; i++) {
      const depth = rnd(0.35, 1.3);     // parallax: lejos = pequeño, lento y tenue
      shapes.push({
        x: Math.random(), y: Math.random(),
        s: rnd(12, 74) * depth,
        r: rnd(0, Math.PI * 2), vr: rnd(-0.22, 0.22),
        depth,
        a: rnd(0.03, 0.09) * (1.7 - depth * 0.5),
        k: pick(kinds),
        h: rnd(-scene.spread / 2, scene.spread / 2),
        wob: rnd(0, Math.PI * 2), wobA: rnd(0, 12),   // bamboleo lateral propio
        wire: Math.random() < scene.wire,
      });
    }
  }
  newScene();   // escena inicial al cargar

  let intensity = 0, target = 0, tPrev = performance.now(), tAcc = rnd(0, 900);

  function poly(ctx2, k, s) {
    ctx2.beginPath();
    for (let i = 0; i < k; i++) {
      const an = (i / k) * Math.PI * 2;
      i ? ctx2.lineTo(Math.cos(an) * s, Math.sin(an) * s)
        : ctx2.moveTo(Math.cos(an) * s, Math.sin(an) * s);
    }
    ctx2.closePath();
  }

  // ---------- estallido de final de partida (corto: ~1 s) ----------
  const sparks = [];
  function burst(px, py, hue) {
    for (let i = 0; i < 70; i++) {
      const an = rnd(0, Math.PI * 2), sp = rnd(140, 640);
      sparks.push({
        x: px, y: py,
        vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - rnd(0, 140),
        s: rnd(3, 10), r: rnd(0, Math.PI * 2), vr: rnd(-7, 7),
        h: hue + rnd(-16, 16),
        life: 1, decay: rnd(0.9, 1.7),          // vive entre ~0.6 y ~1.1 s
        k: Math.random() < 0.5 ? 3 : 4,
      });
    }
  }

  function drawSparks(dt) {
    fg.clearRect(0, 0, W, H);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.life -= dt * p.decay;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      p.vy += 560 * dt;                          // gravedad
      p.vx *= 1 - 1.2 * dt;                      // fricción
      p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      fg.save();
      fg.translate(p.x, p.y); fg.rotate(p.r);
      fg.globalAlpha = Math.max(0, Math.min(1, p.life));
      fg.fillStyle = `hsl(${p.h} 90% 62%)`;
      fg.shadowColor = `hsl(${p.h} 90% 60%)`; fg.shadowBlur = 9;
      poly(fg, p.k, p.s);
      fg.fill();
      fg.restore();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { tPrev = now; return; }              // pausa en 2º plano
    const dt = Math.min(0.05, (now - tPrev) / 1000); tPrev = now;

    intensity += (target - intensity) * Math.min(1, dt * 2);
    tAcc += dt * (0.5 + intensity * 2);
    const hue = scene.hue + Math.sin(tAcc * 0.11) * 10 + intensity * 46;  // -> rojizo al final
    const spd = 1 + intensity * 2.2;
    const flow = scene.flow + Math.sin(tAcc * scene.drift) * 0.8;         // la dirección serpentea
    const fx = Math.cos(flow), fy = Math.sin(flow);

    // gradiente de fondo orientado según el flujo de la escena
    const gx = Math.cos(scene.flow), gy = Math.sin(scene.flow);
    const gr = g.createLinearGradient(W / 2 - gx * W / 2, H / 2 - gy * H / 2,
                                      W / 2 + gx * W / 2, H / 2 + gy * H / 2);
    gr.addColorStop(0, `hsl(${hue} ${scene.sat}% ${5 + intensity * 2.5}%)`);
    gr.addColorStop(1, `hsl(${hue + scene.spread} ${scene.sat + 8}% ${8 + intensity * 3}%)`);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);

    // resplandores suaves orbitando lento
    for (let i = 0; i < scene.glows; i++) {
      const an = tAcc * (0.17 + 0.09 * i) + i * 2.2;
      const cx = W * 0.5 + Math.cos(an) * W * 0.34;
      const cy = H * 0.5 + Math.sin(an * 0.8) * H * 0.30;
      const rad = Math.max(W, H) * 0.55;
      const rg = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
      rg.addColorStop(0, `hsla(${hue + i * 38} 90% 60% / ${0.045 + intensity * 0.05})`);
      rg.addColorStop(1, 'transparent');
      g.fillStyle = rg; g.fillRect(0, 0, W, H);
    }

    // formas a la deriva (dirección global + bamboleo + parallax)
    for (const s of shapes) {
      s.wob += dt * 0.6;
      s.x += (fx * scene.speed * s.depth * spd + Math.cos(s.wob) * s.wobA) * dt / W;
      s.y += (fy * scene.speed * s.depth * spd + Math.sin(s.wob * 0.7) * s.wobA) * dt / H;
      s.r += s.vr * spd * dt;
      if (s.x < -0.15) s.x = 1.15; else if (s.x > 1.15) s.x = -0.15;
      if (s.y < -0.15) s.y = 1.15; else if (s.y > 1.15) s.y = -0.15;

      g.save();
      g.translate(s.x * W, s.y * H);
      g.rotate(s.r);
      const col = (l, a) => `hsla(${hue + s.h} 80% ${l}% / ${a})`;
      const alpha = s.a * (1 + intensity * 0.7);
      if (s.k === 'ring') {
        g.beginPath(); g.arc(0, 0, s.s, 0, Math.PI * 2);
        g.strokeStyle = col(66, alpha); g.lineWidth = 1.5; g.stroke();
      } else if (s.k === 'dot') {
        g.beginPath(); g.arc(0, 0, Math.max(2, s.s * 0.16), 0, Math.PI * 2);
        g.fillStyle = col(64, alpha * 1.4); g.fill();
      } else {
        poly(g, s.k === 'tri' ? 3 : s.k === 'diamond' ? 4 : 6, s.s);
        g.strokeStyle = col(66, alpha); g.lineWidth = 1.5;
        if (!s.wire) { g.fillStyle = col(60, s.a * 0.5); g.fill(); }
        g.stroke();
      }
      g.restore();
    }

    // viñeta para que la UI respire encima
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.78);
    vg.addColorStop(0, 'transparent');
    vg.addColorStop(1, `rgba(2,3,8,${scene.vig})`);
    g.fillStyle = vg; g.fillRect(0, 0, W, H);

    drawSparks(dt);   // estallidos de final de partida (canvas superior)
  }
  requestAnimationFrame(frame);

  window.RSBG = {
    setIntensity(x) { target = Math.max(0, Math.min(1, x)); },
    newScene,
    burst,
  };
})();
