/* RoyalShess - TUTORIAL INTERACTIVO ("Aprende jugando")
   ---------------------------------------------------------------------
   Antes esto era una lista de reglas escritas. Nadie las lee: los amigos
   nuevos entraban a su primera partida sin entender que aqui no hay turnos.
   Ahora se aprende JUGANDO: seis lecciones cortas donde el jugador mueve de
   verdad y la leccion no avanza hasta que hace lo que se le pide.

   Es una ISLA, igual que replay.js: tablero propio (#tutBoard), estado propio
   y su propio bucle de fotogramas. NO habla con el servidor ni toca ninguna
   global de client.js; lo que no puede saber solo (cambiar de pantalla, sonar,
   desbloquear el audio, como se dibuja una pieza, avisar con un toast) se lo
   pasa el cliente en init().

   Las reglas se calculan aqui con el MISMO motor (engine.js) y los MISMOS
   numeros (config.js) que el servidor, asi que si mañana cambia el coste de
   un caballo el tutorial enseña el numero nuevo sin tocar nada. Solo se
   reproducen las reglas BASICAS (coste, regeneracion, reembolso, jaque con su
   margen, ganar comiendo al rey): los trucos finos -racha del peon, descuento
   del caballo, carriles de torre, recaptura gratis- siguen explicados con sus
   demos en la pantalla de reglas, a un boton de aqui.

   Los textos viven en i18n.js (learn.*). El progreso, en localStorage. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RSTutorial = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const $ = (id) => document.getElementById(id);
  const tr = (k) => window.RSI18N.t(k);
  const esc = (s) => String(s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // --- lo que el modulo necesita del cliente ------------------------------
  let host = {
    showScreen: () => {},
    sfx: () => {},
    ensureAudio: () => {},
    toast: () => {},
    glyph: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
  };
  function init(h) { host = Object.assign(host, h || {}); }

  // config y motor se leen en caliente: la hoja de configuracion manda
  const CFG = () => window.RSConfig;
  const ENG = () => window.RSEngine;
  const MAXE   = () => CFG().energy.max;
  const REGEN  = () => 1 / CFG().energy.regenSecondsPerPoint;   // energia por segundo
  const SURCH  = () => CFG().energy.checkSurcharge;
  const REFUND = () => CFG().energy.captureRefund;
  const GRACE  = () => CFG().rules.kingGraceMs;

  const STORE_KEY = 'rs-learn';

  // === LECCIONES =========================================================
  // set: [color, tipo, fila, columna]  (fila 7 = abajo = tus blancas)
  // need: cuando se considera superada. fail: cuando hay que reintentar.
  // say/goal: claves de i18n que pueden depender del progreso dentro de la
  // leccion, por eso son funciones.
  const LESSONS = [
    {
      id: 'move',
      set: [['w', 'k', 7, 4], ['w', 'p', 6, 4], ['w', 'n', 7, 6]],
      energy: 6,
      say:  (s) => s.moves === 0 ? 'learn.move.say' : 'learn.move.say2',
      goal: (s) => s.moves === 0 ? 'learn.move.goal' : 'learn.move.goal2',
      need: (s) => s.moves >= 2,
    },
    {
      id: 'energy',
      set: [['w', 'k', 7, 4], ['w', 'p', 6, 0], ['w', 'n', 7, 1], ['w', 'b', 7, 2]],
      energy: 4,
      say:  (s) => s.moves === 0 ? 'learn.energy.say' : 'learn.energy.say2',
      goal: () => 'learn.energy.goal',
      count: 3,                       // el objetivo lleva contador 1/3
      need: (s) => s.moves >= 3,
    },
    {
      id: 'capture',
      set: [['w', 'k', 7, 4], ['w', 'n', 5, 3], ['b', 'b', 3, 4], ['b', 'p', 5, 5]],
      energy: 6,
      say:  (s) => s.caps === 0 ? 'learn.capture.say' : 'learn.capture.say2',
      goal: (s) => s.caps === 0 ? 'learn.capture.goal' : 'learn.capture.goal2',
      need: (s) => s.caps >= 2,
    },
    {
      id: 'check',
      set: [['w', 'k', 7, 4], ['w', 'p', 6, 0], ['b', 'k', 0, 7], ['b', 'r', 3, 0]],
      energy: 5,
      script: [{ at: 1100, mv: [3, 0, 3, 4] }],   // la torre negra baja a dar jaque
      killer: true,                              // y se cobra el rey si nadie reacciona
      say:  (s) => s.checkSeen ? 'learn.check.say2' : 'learn.check.say',
      goal: (s) => s.checkSeen ? 'learn.check.goal2' : 'learn.check.goal',
      need: (s) => s.checkSeen && !s.inCheckW && s.movesInCheck > 0,
      fail: (s) => s.lost,
    },
    {
      id: 'king',
      set: [['w', 'k', 7, 4], ['w', 'q', 5, 3], ['b', 'k', 1, 3], ['b', 'p', 1, 7]],
      energy: 8,
      say:  () => 'learn.king.say',
      goal: () => 'learn.king.goal',
      need: (s) => s.won,
    },
    {
      id: 'spar',
      set: [
        ['w', 'k', 7, 4], ['w', 'r', 7, 0], ['w', 'n', 7, 6], ['w', 'p', 6, 3], ['w', 'p', 6, 4],
        ['b', 'k', 0, 4], ['b', 'r', 0, 7], ['b', 'n', 0, 1], ['b', 'p', 1, 3], ['b', 'p', 1, 4],
      ],
      energy: null,        // la de verdad: la de config.js
      foe: true,
      aiEvery: 1200,
      say:  () => 'learn.spar.say',
      goal: () => 'learn.spar.goal',
      need: (s) => s.won,
      fail: (s) => s.lost,
    },
  ];

  // === ESTADO DE LA PARTIDA DE PRACTICAS =================================
  let L = null;                 // leccion en curso (copia viva)
  let bd = null;                // tablero 8x8
  let energy = { w: 0, b: 0 };
  let checkSince = { w: null, b: null };
  let sel = null;               // {r,c} pieza seleccionada
  let S = null;                 // marcador de la leccion
  let els = new Map();          // id de pieza -> elemento
  let raf = 0, lastT = 0, t0 = 0, foeLast = 0;
  let phase = 'idle';           // idle | play | won | lost
  let mounted = false;
  let hiddenAt = 0;             // instante en que la pestaña se fue a segundo plano

  const cell = (r, c) => (bd && bd[r] ? bd[r][c] : null);
  const done = () => new Set((localStorage.getItem(STORE_KEY) || '').split(',').filter(Boolean));
  function markDone(id) {
    const d = done(); d.add(id);
    localStorage.setItem(STORE_KEY, [...d].join(','));
  }
  function progress() { const d = done(); return { done: d.size, total: LESSONS.length }; }

  // --- reglas (las mismas cuentas que server/game.js, sin los extras) -----
  function costOf(p, color) {
    return ENG().MOVE_COST[p.type] + (ENG().inCheck(bd, color) ? SURCH() : 0);
  }
  function refundOf(p, victim) {
    // peones y dama no cobran reembolso, y comerse un peon no da nada
    if (!victim || p.type === 'p' || p.type === 'q' || victim.type === 'p') return 0;
    return ENG().VALUE[victim.type] * REFUND();
  }
  function graceLeft(color, now) {
    const cs = checkSince[color];
    if (cs == null) return null;                  // no esta en jaque
    return Math.max(0, GRACE() - (now - cs));
  }
  function updateChecks(now) {
    for (const color of ['w', 'b']) {
      if (ENG().inCheck(bd, color)) { if (checkSince[color] == null) checkSince[color] = now; }
      else checkSince[color] = null;
    }
  }

  // === PINTAR ============================================================
  function buildGrid() {
    const sqs = $('tutSqs');
    if (!sqs || sqs.childElementCount) return;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const d = document.createElement('div');
      d.className = 'tsq ' + ((r + c) % 2 ? 'd' : 'l');
      d.style.left = c * 12.5 + '%';
      d.style.top = r * 12.5 + '%';
      sqs.appendChild(d);
    }
  }
  const sqEl = (r, c) => $('tutSqs').children[r * 8 + c];

  function paintPieces() {
    const layer = $('tutPieces');
    const alive = new Set();
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = cell(r, c);
      if (!p) continue;
      alive.add(p.id);
      let el = els.get(p.id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'tpiece ' + p.color;
        layer.appendChild(el);
        els.set(p.id, el);
      }
      el.textContent = host.glyph[p.type];
      el.style.transform = `translate(${c * 100}%, ${r * 100}%)`;
    }
    for (const [id, el] of els) {
      if (alive.has(id)) continue;
      els.delete(id);
      el.classList.add('gone');
      setTimeout(() => el.remove(), 260);
    }
  }

  function paintMarks(now) {
    if (!bd) return;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const s = sqEl(r, c);
      s.className = 'tsq ' + ((r + c) % 2 ? 'd' : 'l');
      s.innerHTML = '';
    }
    // seleccion + destinos legales (huecos si no llega la energia, como en la partida)
    if (sel && phase === 'play') {
      const p = cell(sel.r, sel.c);
      if (p && p.color === 'w') {
        sqEl(sel.r, sel.c).classList.add('sel');
        const afford = energy.w >= costOf(p, 'w');
        for (const m of ENG().genMoves(bd, sel.r, sel.c)) {
          const h = document.createElement('i');
          h.className = 'thint' + (m.cap ? ' cap' : '') + (afford ? '' : ' poor');
          sqEl(m.r, m.c).appendChild(h);
        }
      }
    }
    // rey en jaque: el tuyo en rojo, el del rival en oro cuando ya se puede comer
    const kw = ENG().findKing(bd, 'w'), kb = ENG().findKing(bd, 'b');
    if (kw && checkSince.w != null) sqEl(kw.r, kw.c).classList.add('hot');
    if (kb && checkSince.b != null) sqEl(kb.r, kb.c).classList.add(graceLeft('b', now) === 0 ? 'kill' : 'hot');
    $('tutBoard').classList.toggle('danger', checkSince.w != null && phase === 'play');
  }

  function floatTxt(r, c, txt, mood) {
    const f = document.createElement('div');
    f.className = 'tfloat' + (mood ? ' ' + mood : '');
    f.textContent = txt;
    f.style.left = c * 12.5 + '%';
    f.style.top = (r * 12.5 + 1) + '%';
    $('tutBoard').appendChild(f);
    setTimeout(() => f.remove(), 1150);
  }

  function paintHUD(now) {
    const max = MAXE();
    const set = (side, val) => {
      const fill = $('tutFill' + side), num = $('tutNum' + side);
      if (fill) fill.style.width = Math.max(0, Math.min(100, (val / max) * 100)) + '%';
      if (num) { const v = Math.floor(val * 10) / 10; num.textContent = (v % 1 === 0) ? v : v.toFixed(1); }
    };
    set('W', energy.w);
    $('tutFoeRow').style.display = L && L.foe ? '' : 'none';
    if (L && L.foe) set('B', energy.b);
    // reloj de gracia: solo cuando alguien esta en jaque, que es cuando importa
    const gw = graceLeft('w', now), gb = graceLeft('b', now);
    const g = gw != null ? gw : gb;
    const wrap = $('tutGrace');
    if (g == null || phase !== 'play') { wrap.style.display = 'none'; return; }
    wrap.style.display = '';
    wrap.classList.toggle('mine', gw != null);
    $('tutGraceBar').style.width = (g / GRACE()) * 100 + '%';
    $('tutGraceTxt').textContent = tr(gw != null ? 'learn.grace.you' : 'learn.grace.foe')
      .replace('{n}', (g / 1000).toFixed(1));
  }

  // fila de costes: la misma tabla que hay bajo el tablero de verdad, aqui
  // siempre visible porque media leccion consiste en mirarla
  function buildCosts() {
    const row = $('tutCosts');
    if (!row) return;
    const C = ENG().MOVE_COST;
    row.innerHTML = ['p', 'n', 'b', 'r', 'q', 'k']
      .map((t) => '<span class="tut-chip"><i>' + host.glyph[t] + '</i>' + C[t] + '</span>').join('');
  }

  // el texto del entrenador y el objetivo se recalculan tras cada evento
  function paintCoach() {
    if (!L) return;
    const say = $('tutSay'), goal = $('tutGoal');
    if (phase === 'won') {
      say.className = 'tut-say good';
      say.innerHTML = tr('learn.' + L.id + '.ok');
      goal.className = 'tut-goal good';
      goal.textContent = tr('learn.cleared');
    } else if (phase === 'lost') {
      say.className = 'tut-say bad';
      say.innerHTML = tr('learn.' + L.id + '.fail');
      goal.className = 'tut-goal bad';
      goal.textContent = tr('learn.failed');
    } else {
      say.className = 'tut-say';
      say.innerHTML = tr(L.say(S));
      goal.className = 'tut-goal';
      let g = tr(L.goal(S));
      if (L.count) g += '  ' + Math.min(S.moves, L.count) + '/' + L.count;
      goal.textContent = g;
    }
    const next = $('tutNext');
    next.textContent = tr(phase === 'won' ? (lastLesson() ? 'learn.finish' : 'learn.next') : 'learn.skip');
    next.classList.toggle('go', phase === 'won');
    $('tutRetry').style.display = phase === 'lost' ? '' : 'none';
  }
  const lessonIdx = () => LESSONS.findIndex((x) => L && x.id === L.id);
  const lastLesson = () => lessonIdx() === LESSONS.length - 1;

  function paintDots() {
    const dots = $('tutDots');
    dots.innerHTML = '';
    const d = done();
    LESSONS.forEach((les, i) => {
      const el = document.createElement('i');
      if (i === lessonIdx()) el.className = 'on';
      else if (d.has(les.id)) el.className = 'ok';
      dots.appendChild(el);
    });
    $('tutStep').textContent = (lessonIdx() + 1) + '/' + LESSONS.length;
  }

  // === MOVER =============================================================
  function nudge(key, sub) {
    const b = $('tutBoard');
    b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
    host.toast(sub == null ? tr(key) : tr(key).replace('{n}', sub));
  }

  function doMove(fr, fc, r2, c2, m, color, free) {
    const now = performance.now();
    const p = bd[fr][fc], victim = bd[r2][c2];
    if (!free) {
      const cost = costOf(p, color);
      energy[color] = Math.max(0, energy[color] - cost);
      floatTxt(r2, c2, '-' + cost);
      const back = refundOf(p, victim);
      if (back) {
        energy[color] = Math.min(MAXE(), energy[color] + back);
        setTimeout(() => floatTxt(r2, c2, '+' + back, 'good'), 380);
      }
    }
    bd[r2][c2] = p; bd[fr][fc] = null;
    p.moved = true;
    if (p.type === 'p' && (r2 === 0 || r2 === 7)) p.type = 'q';
    if (m && m.castle) {                     // el enroque arrastra su torre
      const rf = c2 > fc ? 7 : 0, rt = c2 > fc ? 5 : 3;
      const rook = bd[fr][rf];
      if (rook) { bd[fr][rt] = rook; bd[fr][rf] = null; rook.moved = true; }
    }
    updateChecks(now);
    if (color === 'w') {
      S.moves++;
      if (S.wasInCheck) S.movesInCheck++;
      if (victim) S.caps++;
    }
    S.wasInCheck = checkSince.w != null;
    if (checkSince.w != null) S.checkSeen = true;
    if (victim && victim.type === 'k') {
      if (victim.color === 'b') S.won = true; else S.lost = true;
    }
    if (victim) host.sfx('cap');
    if (color === 'b' && checkSince.w != null && !victim) host.sfx('check');
    sel = null;
    paintPieces();
    settle(now);
  }

  // pulsacion sobre el tablero: seleccionar, mover o cancelar
  function tap(r, c) {
    if (phase !== 'play') return;
    host.ensureAudio();
    const now = performance.now();
    const p = cell(r, c);
    if (sel) {
      const mine = cell(sel.r, sel.c);
      const m = mine ? ENG().genMoves(bd, sel.r, sel.c).find((x) => x.r === r && x.c === c) : null;
      if (m) {
        const victim = cell(r, c);
        // el rey solo cae si su jaque ya cumplio el margen
        if (victim && victim.type === 'k') {
          const left = graceLeft(victim.color, now);
          if (left == null) { nudge('learn.err.noCheck'); return; }
          if (left > 0) { nudge('learn.err.grace', (left / 1000).toFixed(1)); return; }
        }
        const cost = costOf(mine, 'w');
        if (energy.w < cost) { nudge('learn.err.energy', cost); return; }
        doMove(sel.r, sel.c, r, c, m, 'w');
        return;
      }
    }
    if (p && p.color === 'w') sel = { r, c };
    else sel = null;
    paintMarks(now);
  }

  // === EL RIVAL ==========================================================
  // En las lecciones guionizadas mueve cuando toca (sin gastar energia: es un
  // actor, no un jugador). En el duelo final juega de verdad con su energia.
  function foeTurn(now) {
    if (!L || phase !== 'play') return;
    if (L.script) {
      for (const s of L.script) {
        if (s.fired || now - t0 < s.at) continue;
        s.fired = true;
        const [fr, fc, r2, c2] = s.mv;
        if (cell(fr, fc)) { doMove(fr, fc, r2, c2, null, 'b', true); return; }
      }
    }
    if (L.killer) {                       // se cobra el rey si nadie reacciono
      const k = ENG().findKing(bd, 'w');
      if (k && graceLeft('w', now) === 0) {
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
          const p = cell(r, c);
          if (!p || p.color !== 'b') continue;
          if (ENG().genMoves(bd, r, c).some((m) => m.r === k.r && m.c === k.c)) {
            doMove(r, c, k.r, k.c, null, 'b', true);
            return;
          }
        }
      }
    }
    if (!L.foe) return;
    if (now - foeLast < (L.aiEvery || 1200)) return;
    foeLast = now;
    const opts = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = cell(r, c);
      if (!p || p.color !== 'b') continue;
      if (energy.b < costOf(p, 'b')) continue;
      for (const m of ENG().genMoves(bd, r, c)) {
        const victim = cell(m.r, m.c);
        if (victim && victim.type === 'k' && graceLeft('w', now) !== 0) continue;
        let score = Math.random();
        if (victim) score += 3 + ENG().VALUE[victim.type] * 2;
        if (victim && victim.type === 'k') score += 100;
        if (p.type === 'p') score += 0.4;             // que empuje algo
        opts.push({ r, c, m, score });
      }
    }
    if (!opts.length) return;
    opts.sort((a, b2) => b2.score - a.score);
    const pick = opts[0];
    doMove(pick.r, pick.c, pick.m.r, pick.m.c, pick.m, 'b');
  }

  // === BUCLE =============================================================
  function settle(now) {
    if (!L || phase !== 'play') return;
    S.inCheckW = checkSince.w != null;
    if (L.fail && L.fail(S)) { finish(false); return; }
    if (L.need(S)) { finish(true); return; }
    paintCoach();
    paintMarks(now);
  }
  function finish(ok) {
    phase = ok ? 'won' : 'lost';
    sel = null;
    if (ok) { markDone(L.id); host.sfx('win'); } else host.sfx('end');
    $('tutBoard').classList.remove('danger');
    paintCoach();
    paintDots();
    paintMarks(performance.now());
  }

  function loop(now) {
    if (phase === 'idle') return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(400, now - lastT);
    lastT = now;
    if (phase === 'play') {
      energy.w = Math.min(MAXE(), energy.w + (dt / 1000) * REGEN());
      if (L.foe) energy.b = Math.min(MAXE(), energy.b + (dt / 1000) * REGEN());
      foeTurn(now);
      // el margen del jaque corre solo: al agotarse cambia lo que se pinta
      if (phase === 'play') settle(now);
    }
    paintHUD(now);
    if (phase === 'play') paintMarks(now);
  }

  // === ARRANQUE DE UNA LECCION ===========================================
  function play(idx) {
    const src = LESSONS[Math.max(0, Math.min(LESSONS.length - 1, idx))];
    stopLoop();
    buildGrid();
    $('tutPieces').innerHTML = '';
    els.clear();
    // copia viva: el guion marca sus pasos como disparados y no debe pegarse a
    // la definicion original (si no, la segunda vez no volveria a dispararse)
    L = Object.assign({}, src, { script: src.script ? src.script.map((s) => Object.assign({}, s)) : null });
    bd = Array.from({ length: 8 }, () => Array(8).fill(null));
    let id = 1;
    for (const [color, type, r, c] of src.set) bd[r][c] = { type, color, id: id++ };
    const startE = L.energy == null ? CFG().energy.start : L.energy;
    energy.w = startE;
    energy.b = L.foe ? startE : 0;
    checkSince = { w: null, b: null };
    sel = null;
    S = { moves: 0, caps: 0, won: false, lost: false, checkSeen: false, movesInCheck: 0, wasInCheck: false, inCheckW: false };
    t0 = lastT = performance.now();
    foeLast = t0;
    updateChecks(t0);
    S.wasInCheck = checkSince.w != null;
    S.inCheckW = S.wasInCheck;
    phase = 'play';
    $('tutIndex').style.display = 'none';
    $('tutPlay').style.display = '';
    buildCosts();
    paintPieces();
    paintDots();
    paintCoach();
    paintHUD(t0);
    paintMarks(t0);
    raf = requestAnimationFrame(loop);
  }

  function stopLoop() {
    cancelAnimationFrame(raf);
    raf = 0;
    phase = 'idle';
    const b = $('tutBoard');
    if (b) b.classList.remove('danger');
  }

  // === INDICE ============================================================
  function buildIndex() {
    const d = done();
    const list = $('tutList');
    list.innerHTML = '';
    LESSONS.forEach((les, i) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'tut-card' + (d.has(les.id) ? ' ok' : '');
      item.innerHTML =
        '<span class="n">' + (d.has(les.id) ? '✓' : (i + 1)) + '</span>' +
        '<span class="tx"><b>' + esc(tr('learn.' + les.id + '.t')) + '</b>' +
        esc(tr('learn.' + les.id + '.s')) + '</span>';
      item.addEventListener('click', () => play(i));
      list.appendChild(item);
    });
    const p = progress();
    $('tutTally').textContent = tr('learn.tally').replace('{a}', p.done).replace('{b}', p.total);
    const firstOpen = LESSONS.findIndex((x) => !d.has(x.id));
    $('tutStart').textContent = tr(firstOpen === -1 ? 'learn.again' : (firstOpen === 0 ? 'learn.start' : 'learn.continue'));
    $('tutStart').dataset.idx = firstOpen === -1 ? 0 : firstOpen;
  }

  function showIndex() {
    stopLoop();
    L = null;
    buildIndex();
    $('tutPlay').style.display = 'none';
    $('tutIndex').style.display = '';
  }

  // === API PARA EL CLIENTE ===============================================
  function open() { mount(); showIndex(); }
  function stop() { stopLoop(); }
  function retitle() {   // al cambiar de idioma
    if (!mounted) return;
    buildCosts();
    if (L) { paintCoach(); paintDots(); }
    else buildIndex();
  }

  function mount() {
    if (mounted) return;
    mounted = true;
    buildGrid();
    // una sola escucha para todo el tablero: la casilla sale de la geometria,
    // asi funciona igual con raton y con dedo y no hay 64 escuchas sueltas
    $('tutBoard').addEventListener('pointerdown', (e) => {
      const rect = $('tutBoard').getBoundingClientRect();
      const c = Math.floor(((e.clientX - rect.left) / rect.width) * 8);
      const r = Math.floor(((e.clientY - rect.top) / rect.height) * 8);
      if (r < 0 || r > 7 || c < 0 || c > 7) return;
      tap(r, c);
    });
    // Si el jugador se va a otra pestaña, el navegador congela los fotogramas
    // pero NO el reloj: al volver, el margen del jaque estaria agotado y le
    // comerian el rey por haber mirado el movil. En una partida de verdad eso
    // es asi -el servidor no espera a nadie- pero esto es una clase: al volver
    // se le devuelve el tiempo que estuvo fuera.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { hiddenAt = performance.now(); return; }
      const gap = hiddenAt ? performance.now() - hiddenAt : 0;
      hiddenAt = 0;
      if (!gap || phase !== 'play') return;
      t0 += gap; foeLast += gap; lastT = performance.now();
      for (const k of ['w', 'b']) if (checkSince[k] != null) checkSince[k] += gap;
    });
    $('tutStart').addEventListener('click', function () { play(+this.dataset.idx || 0); });
    $('tutRules').addEventListener('click', () => host.showScreen('help'));
    $('tutBack').addEventListener('click', () => host.showScreen('menu'));
    $('tutExit').addEventListener('click', showIndex);
    $('tutRetry').addEventListener('click', () => play(lessonIdx()));
    $('tutNext').addEventListener('click', () => {
      const i = lessonIdx();
      if (i + 1 >= LESSONS.length) { showIndex(); return; }
      play(i + 1);
    });
  }

  return { init, open, stop, retitle, progress, mount };
});
