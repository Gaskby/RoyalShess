/* RoyalShess - TUTORIAL INTERACTIVO ("Aprende jugando")
   ---------------------------------------------------------------------
   Antes esto era una lista de reglas escritas. Nadie las lee: los amigos
   nuevos entraban a su primera partida sin entender que aqui no hay turnos.
   Ahora se aprende JUGANDO: quince lecciones cortas, repartidas en cuatro
   capitulos, donde mueve el jugador y la leccion no avanza hasta que hace
   lo que se le pide.

   Quien habla es CHESSY, el peon de pixeles de coach.js: escribe el
   consejo letra a letra, mueve la boca mientras habla y cambia de cara
   segun lo que pasa (senala el tablero, se asusta en jaque, celebra al
   superar). El texto suelto de antes no lo leia nadie; a un bicho que te
   mira le haces caso.

   Es una ISLA, igual que replay.js: tablero propio (#tutBoard), estado
   propio y su propio bucle de fotogramas. NO habla con el servidor ni toca
   ninguna global de client.js; lo que no puede saber solo (cambiar de
   pantalla, sonar, desbloquear el audio, como se dibuja una pieza, avisar
   con un toast) se lo pasa el cliente en init().

   Las reglas se calculan aqui con el MISMO motor (engine.js) y los MISMOS
   numeros (config.js) que el servidor, y ahora tambien las FINAS: racha del
   peon, descuento del caballo, dama que se abarata, peaje de los carriles
   de torre, recaptura gratis, enroque y coronacion. Si manana cambia un
   coste en la hoja de configuracion, el tutorial ensena el numero nuevo sin
   tocar una linea. La pantalla de reglas escritas sigue existiendo a un
   boton de aqui, pero ya solo como chuleta de consulta.

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
  const QMIN   = () => CFG().rules.queenMinCost;
  const TOLL   = () => CFG().rules.rookLineToll;
  const LANELEN = () => CFG().rules.rookLineLen;
  const FREEREC = () => CFG().rules.freeRecapture !== false;

  const STORE_KEY = 'rs-learn';

  // === LECCIONES =========================================================
  // set:  [color, tipo, fila, columna]   (fila 7 = abajo = tus blancas)
  // need: cuando se supera.  fail: cuando toca reintentar.
  // say/goal/mood: funciones del marcador, porque el consejo cambia dentro
  // de la propia leccion segun lo que ya has hecho.
  // Opciones: energy (energia inicial), seconds (reloj), showCosts (numero
  // en cada destino), hideGrace (sin cuenta del jaque), script/killer/foe.
  const L_ = {
    // ---------- capitulo 1: lo basico ----------
    move: {
      set: [['w', 'k', 7, 4], ['w', 'p', 6, 4], ['w', 'n', 7, 6]],
      energy: 6,
      say:  (s) => s.moves === 0 ? 'learn.move.say' : 'learn.move.say2',
      goal: (s) => s.moves === 0 ? 'learn.move.goal' : 'learn.move.goal2',
      mood: () => 'point',
      need: (s) => s.moves >= 2,
    },
    energy: {
      set: [['w', 'k', 7, 4], ['w', 'p', 6, 0], ['w', 'n', 7, 1], ['w', 'b', 7, 2]],
      energy: 4, showCosts: true, count: 3,
      say:  (s) => s.moves === 0 ? 'learn.energy.say' : 'learn.energy.say2',
      goal: () => 'learn.energy.goal',
      mood: (s) => s.moves === 0 ? 'point' : 'wait',
      need: (s) => s.moves >= 3,
    },
    capture: {
      set: [['w', 'k', 7, 4], ['w', 'n', 5, 3], ['b', 'b', 3, 4], ['b', 'p', 5, 5]],
      energy: 6,
      say:  (s) => s.caps === 0 ? 'learn.capture.say' : 'learn.capture.say2',
      goal: (s) => s.caps === 0 ? 'learn.capture.goal' : 'learn.capture.goal2',
      mood: () => 'point',
      need: (s) => s.caps >= 2,
    },
    // el reloj: la otra forma de ganar. Come lo que puedas antes de que suene
    clock: {
      // el rey negro se queda en una esquina que la dama NO ve desde ninguna
      // de las dos casillas del recorrido: esta leccion va del reloj, no de
      // ganar por captura, y un jaque de rebote la cortaria a la mitad
      set: [['w', 'k', 7, 4], ['w', 'q', 6, 3], ['b', 'k', 0, 0], ['b', 'r', 6, 7], ['b', 'b', 2, 3], ['b', 'p', 1, 7]],
      energy: 10, seconds: 22, points: true,
      say:  (s) => s.caps === 0 ? 'learn.clock.say' : (s.lead ? 'learn.clock.say3' : 'learn.clock.say2'),
      goal: () => 'learn.clock.goal',
      mood: (s) => s.lead ? 'happy' : 'point',
      need: (s) => s.timeUp && s.lead,
      fail: (s) => s.timeUp && !s.lead,
    },

    // ---------- capitulo 2: el rey ----------
    check: {
      set: [['w', 'k', 7, 4], ['w', 'p', 6, 0], ['b', 'k', 0, 7], ['b', 'r', 3, 0]],
      energy: 5,
      script: [{ at: 1100, mv: [3, 0, 3, 4] }],   // la torre negra baja a dar jaque
      killer: true,                              // y se cobra el rey si nadie reacciona
      say:  (s) => s.checkSeen ? 'learn.check.say2' : 'learn.check.say',
      goal: (s) => s.checkSeen ? 'learn.check.goal2' : 'learn.check.goal',
      mood: (s) => s.checkSeen ? 'worry' : 'point',
      need: (s) => s.checkSeen && !s.inCheckW && s.movesInCheck > 0,
      fail: (s) => s.lost,
    },
    // el rey acorralado: aqui no se sale moviendolo, hay que tapar o comer
    block: {
      set: [['w', 'k', 7, 4], ['w', 'n', 7, 3], ['w', 'b', 7, 5], ['w', 'p', 6, 3], ['w', 'p', 6, 5],
            ['b', 'k', 0, 0], ['b', 'r', 3, 4]],
      energy: 6, hideGrace: true, showCosts: true,
      say:  () => 'learn.block.say',
      goal: () => 'learn.block.goal',
      mood: () => 'worry',
      need: (s) => !s.inCheckW && s.movesInCheck > 0,
    },
    king: {
      set: [['w', 'k', 7, 4], ['w', 'q', 5, 3], ['b', 'k', 1, 3], ['b', 'p', 1, 7]],
      energy: 8,
      say:  () => 'learn.king.say',
      goal: () => 'learn.king.goal',
      mood: () => 'point',
      need: (s) => s.won,
    },
    // enroque: el rey se va del centro y la torre salta sola
    castle: {
      set: [['w', 'k', 7, 4], ['w', 'r', 7, 7], ['w', 'r', 7, 0], ['w', 'p', 6, 6], ['w', 'p', 6, 1],
            ['b', 'k', 0, 6], ['b', 'r', 0, 3]],
      energy: 5, showCosts: true,
      say:  () => 'learn.castle.say',
      goal: () => 'learn.castle.goal',
      mood: () => 'point',
      need: (s) => s.castled,
    },

    // ---------- capitulo 3: trucos de cada pieza ----------
    pawn: {
      set: [['w', 'k', 7, 4], ['w', 'p', 6, 3], ['w', 'p', 6, 5], ['b', 'k', 0, 0]],
      energy: 10, showCosts: true,
      say:  (s) => s.streakMax < 3 ? 'learn.pawn.say' : 'learn.pawn.say2',
      goal: (s) => s.streakMax < 3 ? 'learn.pawn.goal' : 'learn.pawn.goal2',
      mood: () => 'point',
      need: (s) => s.streakMax >= 3 && s.brokeStreak,
    },
    knight: {
      set: [['w', 'k', 7, 4], ['w', 'n', 5, 3], ['b', 'k', 0, 0], ['b', 'b', 3, 4]],
      energy: 8, showCosts: true,
      say:  (s) => s.caps === 0 ? 'learn.knight.say' : 'learn.knight.say2',
      goal: (s) => s.caps === 0 ? 'learn.knight.goal' : 'learn.knight.goal2',
      mood: () => 'point',
      need: (s) => s.discountUsed,
    },
    queen: {
      set: [['w', 'k', 7, 4], ['w', 'q', 6, 3], ['b', 'k', 0, 0], ['b', 'n', 4, 3], ['b', 'b', 4, 6]],
      energy: 10, showCosts: true,
      say:  (s) => s.caps === 0 ? 'learn.queen.say' : 'learn.queen.say2',
      goal: (s) => s.caps === 0 ? 'learn.queen.goal' : 'learn.queen.goal2',
      mood: () => 'point',
      need: (s) => s.caps >= 2,
    },
    rook: {
      set: [['w', 'k', 7, 4], ['w', 'b', 5, 2], ['w', 'n', 5, 6], ['b', 'k', 0, 0], ['b', 'r', 4, 0]],
      energy: 10, showCosts: true,
      say:  (s) => s.tollPaid === 0 ? 'learn.rook.say' : 'learn.rook.say2',
      goal: (s) => s.tollPaid === 0 ? 'learn.rook.goal' : 'learn.rook.goal2',
      mood: () => 'point',
      need: (s) => s.tollPaid > 0 && s.jumped,
    },

    // ---------- capitulo 4: jugadas finas ----------
    // recaptura gratis: te comen algo defendido y la venganza sale de balde
    freecap: {
      set: [['w', 'k', 7, 4], ['w', 'p', 4, 4], ['w', 'n', 6, 3], ['b', 'k', 0, 0], ['b', 'b', 2, 6]],
      energy: 1, showCosts: true,
      script: [{ at: 1400, mv: [2, 6, 4, 4] }],   // el alfil se come el peon defendido
      say:  (s) => s.freeUsed ? 'learn.freecap.say2' : (s.caps ? 'learn.freecap.say2' : 'learn.freecap.say'),
      goal: () => 'learn.freecap.goal',
      mood: () => 'point',
      need: (s) => s.freeUsed,
    },
    promote: {
      set: [['w', 'k', 7, 4], ['w', 'p', 1, 3], ['b', 'k', 0, 7], ['b', 'p', 6, 0]],
      energy: 6,
      say:  () => 'learn.promote.say',
      goal: () => 'learn.promote.goal',
      mood: () => 'point',
      need: (s) => s.promoted,
    },
    spar: {
      set: [
        ['w', 'k', 7, 4], ['w', 'r', 7, 0], ['w', 'n', 7, 6], ['w', 'b', 7, 2], ['w', 'p', 6, 3], ['w', 'p', 6, 4],
        ['b', 'k', 0, 4], ['b', 'r', 0, 7], ['b', 'n', 0, 1], ['b', 'b', 0, 5], ['b', 'p', 1, 3], ['b', 'p', 1, 4],
      ],
      energy: null, foe: true, aiEvery: 1200, points: true,
      say:  () => 'learn.spar.say',
      goal: () => 'learn.spar.goal',
      mood: () => 'point',
      need: (s) => s.won,
      fail: (s) => s.lost,
    },
  };

  // Los capitulos se desbloquean en cadena: para entrar en uno hay que
  // haber terminado el anterior. Dentro del capitulo, orden libre
  const CHAPTERS = [
    { id: 'basics', ids: ['move', 'energy', 'capture', 'clock'] },
    { id: 'king',   ids: ['check', 'block', 'king', 'castle'] },
    { id: 'pieces', ids: ['pawn', 'knight', 'queen', 'rook'] },
    { id: 'fine',   ids: ['freecap', 'promote', 'spar'] },
  ];
  // lista plana: el orden de juego y el que usan «siguiente» y los puntos
  const ORDER = CHAPTERS.reduce((a, c) => a.concat(c.ids), []);
  ORDER.forEach((id, i) => { L_[id].id = id; L_[id].n = i; });
  const chapterOf = (id) => CHAPTERS.find((c) => c.ids.indexOf(id) >= 0);

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
  let hiddenAt = 0;             // instante en que la pestana se fue a segundo plano
  // reglas finas, igual que las lleva el servidor en server/game.js
  let streak = { w: 0, b: 0 }, lastId = { w: null, b: null };
  let knightCut = new Set();    // caballos que vienen de comer: -1 al siguiente salto
  let queenCut = new Map();     // damas: -1 por cada captura acumulada
  let coupon = { w: null, b: null };   // vale de recaptura gratis

  const cell = (r, c) => (bd && bd[r] ? bd[r][c] : null);
  const done = () => new Set((localStorage.getItem(STORE_KEY) || '').split(',').filter(Boolean));
  function markDone(id) {
    const d = done(); d.add(id);
    localStorage.setItem(STORE_KEY, [...d].join(','));
  }
  function progress() { const d = done(); return { done: d.size, total: ORDER.length }; }
  // un capitulo esta abierto si el anterior esta entero
  function chapterOpen(i) {
    if (i === 0) return true;
    const d = done();
    return CHAPTERS[i - 1].ids.every((id) => d.has(id));
  }

  // === REGLAS ============================================================
  // Las mismas cuentas que server/game.js. Si algo cambia alli, cambia aqui:
  // son las dos unicas copias y estan a proposito, para que el tutorial
  // pueda correr sin servidor.
  function rookAttacks(r, c, exR, exC) {
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      let rr = r + dr, cc = c + dc, dist = 1;
      while (ENG().inside(rr, cc) && !bd[rr][cc]) { rr += dr; cc += dc; dist++; }
      if (!ENG().inside(rr, cc)) continue;
      const q = bd[rr][cc];
      if (!q || q.type !== 'r') continue;
      if (rr === exR && cc === exC) continue;      // la pieza que se mueve no cuenta
      let run = dist, r2 = r - dr, c2 = c - dc;
      while (ENG().inside(r2, c2) && !bd[r2][c2]) { run++; r2 -= dr; c2 -= dc; }
      if (run > LANELEN()) return true;
    }
    return false;
  }
  function lineToll(fr, fc, tr2, tc) {
    if (!(fr === tr2 || fc === tc || Math.abs(tr2 - fr) === Math.abs(tc - fc))) return 0;
    const dr = Math.sign(tr2 - fr), dc = Math.sign(tc - fc);
    let toll = 0, rr = fr + dr, cc = fc + dc;
    while (rr !== tr2 || cc !== tc) {
      if (rookAttacks(rr, cc, fr, fc)) toll += TOLL();
      rr += dr; cc += dc;
    }
    return toll;
  }
  // coste completo de un movimiento concreto, con todos los extras
  function costOf(color, fr, fc, r2, c2) {
    const p = bd[fr][fc];
    if (!p) return 0;
    const target = bd[r2][c2];
    const cp = coupon[color];
    if (FREEREC() && cp && target && r2 === cp.r && c2 === cp.c && target.id === cp.id) return 0;
    let base = ENG().MOVE_COST[p.type];
    if (p.type === 'q') base = Math.max(Math.min(QMIN(), ENG().MOVE_COST.q), base - (queenCut.get(p.id) || 0));
    let cost = base + (inCheckC[color] ? SURCH() : 0);
    if (p.type === 'p' && lastId[color] === p.id) cost += streak[color];
    if (p.type === 'n' && !target && knightCut.has(p.id)) cost -= 1;
    cost += lineToll(fr, fc, r2, c2);
    return Math.max(0, cost);
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
  // El jaque se consulta MUCHAS veces por fotograma (cada destino de cada
  // pieza lleva su recargo), y mirarlo cuesta recorrer el tablero entero. Se
  // calcula una vez por jugada y se guarda: el tablero solo cambia al mover.
  let inCheckC = { w: false, b: false };
  function updateChecks(now) {
    for (const color of ['w', 'b']) {
      const c = ENG().inCheck(bd, color);
      inCheckC[color] = c;
      if (c) { if (checkSince[color] == null) checkSince[color] = now; }
      else checkSince[color] = null;
    }
  }
  // enroque: ni en jaque, ni pasando por casilla atacada (como el servidor)
  function castleOk(color, r, fc, tc) {
    if (ENG().inCheck(bd, color)) return false;
    const step = tc > fc ? 1 : -1;
    const king = bd[r][fc];
    for (let cc = fc + step; ; cc += step) {
      const saved = bd[r][cc];
      bd[r][cc] = king; bd[r][fc] = null;
      const bad = ENG().inCheck(bd, color);
      bd[r][fc] = king; bd[r][cc] = saved;
      if (bad) return false;
      if (cc === tc) return true;
    }
  }
  // carriles activos: solo la direccion donde la torre supera N casillas
  function lanes() {
    const out = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = cell(r, c);
      if (!p || p.type !== 'r') continue;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        let run = 0, rr = r + dr, cc = c + dc;
        while (ENG().inside(rr, cc) && !bd[rr][cc]) { run++; rr += dr; cc += dc; }
        if (run <= LANELEN()) continue;
        rr = r + dr; cc = c + dc;
        for (let i = 0; i < run; i++) { out.push([rr, cc, dr === 0]); rr += dr; cc += dc; }
      }
    }
    return out;
  }
  const material = (color) => ENG().material(bd, color);

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
    // carriles de torre: el peaje se ve antes de pagarlo
    for (const [r, c, horiz] of lanes()) {
      const b = document.createElement('u');
      b.className = 'tbeam' + (horiz ? '' : ' v');
      sqEl(r, c).appendChild(b);
    }
    // vale de recaptura gratis pendiente
    const cp = coupon.w;
    if (cp && cell(cp.r, cp.c)) sqEl(cp.r, cp.c).classList.add('free');
    // seleccion y destinos: hueco si no llega la energia, con su precio si
    // la leccion lo pide (los trucos finos solo se entienden viendo el numero)
    if (sel && phase === 'play') {
      const p = cell(sel.r, sel.c);
      if (p && p.color === 'w') {
        sqEl(sel.r, sel.c).classList.add('sel');
        for (const m of ENG().genMoves(bd, sel.r, sel.c)) {
          if (m.castle && !castleOk('w', sel.r, sel.c, m.c)) continue;
          const cost = costOf('w', sel.r, sel.c, m.r, m.c);
          const h = document.createElement('i');
          h.className = 'thint' + (m.cap ? ' cap' : '') + (energy.w >= cost ? '' : ' poor') + (cost === 0 ? ' gift' : '');
          if (L && L.showCosts) h.textContent = cost;
          sqEl(m.r, m.c).appendChild(h);
        }
      }
    }
    // reyes en jaque: el tuyo en rojo, el rival en oro cuando ya se puede comer
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
    // reloj y Puntos: solo en las lecciones que van de eso
    const bar = $('tutScore');
    if (!L || (!L.seconds && !L.points)) bar.style.display = 'none';
    else {
      bar.style.display = '';
      const left = L.seconds ? Math.max(0, L.seconds * 1000 - (now - t0)) : null;
      $('tutClock').style.display = left == null ? 'none' : '';
      if (left != null) {
        $('tutClock').textContent = Math.ceil(left / 1000) + 's';
        $('tutClock').classList.toggle('low', left < 6000);
      }
      $('tutPts').textContent = material('w') + ' – ' + material('b');
      $('tutPts').classList.toggle('good', material('w') > material('b'));
    }
    // margen del jaque: solo cuando alguien esta en jaque, que es cuando importa
    const gw = graceLeft('w', now), gb = graceLeft('b', now);
    const g = gw != null ? gw : gb;
    const wrap = $('tutGrace');
    if (g == null || phase !== 'play' || (L && L.hideGrace)) { wrap.style.display = 'none'; return; }
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

  // === EL PEON QUE HABLA =================================================
  // La cara vive en coach.js; aqui solo se decide QUE cara toca y se escribe
  // el consejo letra a letra. Mientras escribe, el peon mueve la boca.
  let typer = 0, typeNodes = null, moodNow = '', moodBack = 0;

  function setMood(mood) {
    if (mood === moodNow) return;
    moodNow = mood;
    const box = $('tutFace');
    if (box) box.innerHTML = window.RSCoach ? window.RSCoach.svg(mood) : '';
    if (box && typer) box.classList.add('talking');
  }
  // una cara puntual (celebrar, asustarse) que se deshace sola
  function flashMood(mood, ms) {
    clearTimeout(moodBack);
    setMood(mood);
    moodBack = setTimeout(() => { if (phase === 'play' && L) setMood(L.mood(S)); }, ms || 1100);
  }

  function stopTyping(fill) {
    clearInterval(typer); typer = 0;
    if (fill && typeNodes) for (const n of typeNodes) n.node.data = n.full;
    typeNodes = null;
    const box = $('tutFace');
    if (box) box.classList.remove('talking');
  }
  // escribe HTML (los <b> de i18n son intencionales) revelando sus letras:
  // se mete entero y se vacian los nodos de texto, que se van rellenando
  function say(html) {
    const el = $('tutSay');
    stopTyping(false);
    el.innerHTML = html;
    const nodes = [];
    (function walk(n) {
      for (const c of n.childNodes) {
        if (c.nodeType === 3) { nodes.push({ node: c, full: c.data }); c.data = ''; }
        else walk(c);
      }
    })(el);
    const total = nodes.reduce((a, n) => a + n.full.length, 0);
    typeNodes = nodes;
    let i = 0;
    const box = $('tutFace');
    if (box) box.classList.add('talking');
    typer = setInterval(() => {
      i += 2;
      let left = i;
      for (const n of nodes) {
        n.node.data = n.full.slice(0, Math.max(0, Math.min(n.full.length, left)));
        left -= n.full.length;
      }
      if (i >= total) stopTyping(true);
    }, 22);
  }

  // el texto del entrenador y el objetivo se recalculan tras cada evento
  let lastSaid = '';
  function paintCoach(force) {
    if (!L) return;
    const goal = $('tutGoal');
    let key, mood;
    if (phase === 'won')      { key = 'learn.' + L.id + '.ok';   mood = 'win'; }
    else if (phase === 'lost'){ key = 'learn.' + L.id + '.fail'; mood = 'worry'; }
    else                      { key = L.say(S);                  mood = L.mood(S); }
    $('tutSay').className = 'tut-say' + (phase === 'won' ? ' good' : phase === 'lost' ? ' bad' : '');
    if (force || key !== lastSaid) { lastSaid = key; say(tr(key)); setMood(mood); }

    if (phase === 'won')       { goal.className = 'tut-goal good pop'; goal.textContent = tr('learn.cleared'); }
    else if (phase === 'lost') { goal.className = 'tut-goal bad';      goal.textContent = tr('learn.failed'); }
    else {
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
  const lessonIdx = () => (L ? L.n : 0);
  const lastLesson = () => lessonIdx() === ORDER.length - 1;

  function paintDots() {
    const dots = $('tutDots');
    dots.innerHTML = '';
    const d = done();
    const ch = L ? chapterOf(L.id) : CHAPTERS[0];
    ch.ids.forEach((id) => {
      const el = document.createElement('i');
      if (L && id === L.id) el.className = 'on';
      else if (d.has(id)) el.className = 'ok';
      dots.appendChild(el);
    });
    $('tutStep').textContent = tr('learn.ch.' + ch.id) + ' · ' + (ch.ids.indexOf(L ? L.id : ch.ids[0]) + 1) + '/' + ch.ids.length;
  }

  // === MOVER =============================================================
  function nudge(key, sub) {
    const b = $('tutBoard');
    b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
    host.toast(sub == null ? tr(key) : tr(key).replace('{n}', sub));
    flashMood('oops', 1200);
  }

  function doMove(fr, fc, r2, c2, m, color, free) {
    const now = performance.now();
    const p = bd[fr][fc], victim = bd[r2][c2];
    const isCastle = p.type === 'k' && Math.abs(c2 - fc) === 2;
    let toll = 0, cheap = false;
    if (!free) {
      const cp = coupon[color];
      const wasFree = !!(FREEREC() && cp && victim && r2 === cp.r && c2 === cp.c && victim.id === cp.id);
      toll = lineToll(fr, fc, r2, c2);
      cheap = p.type === 'n' && !victim && knightCut.has(p.id);
      const cost = costOf(color, fr, fc, r2, c2);
      energy[color] = Math.max(0, energy[color] - cost);
      floatTxt(r2, c2, wasFree ? tr('learn.free') : '-' + cost, wasFree ? 'good' : '');
      const back = refundOf(p, victim);
      if (back) {
        energy[color] = Math.min(MAXE(), energy[color] + back);
        setTimeout(() => floatTxt(r2, c2, '+' + back, 'good'), 380);
      }
      if (color === 'w') {
        if (wasFree) S.freeUsed = true;
        if (toll) S.tollPaid += toll;
        if (cheap) S.discountUsed = true;
        if (p.type === 'n' && lanes().length) S.jumped = true;
      }
    }
    // mover
    bd[r2][c2] = p; bd[fr][fc] = null;
    p.moved = true;
    const crowned = p.type === 'p' && (r2 === 0 || r2 === 7);
    if (crowned) p.type = 'q';
    if (isCastle) {                          // el enroque arrastra su torre
      const rf = c2 > fc ? 7 : 0, rt = c2 > fc ? 5 : 3;
      const rook = bd[fr][rf];
      if (rook) { bd[fr][rt] = rook; bd[fr][rf] = null; rook.moved = true; }
    }
    // rachas y descuentos, en el mismo orden que el servidor
    if (lastId[color] === p.id) streak[color] += 1; else streak[color] = 1;
    lastId[color] = p.id;
    if (p.type === 'n') { if (victim) knightCut.add(p.id); else knightCut.delete(p.id); }
    if (p.type === 'q' && victim) queenCut.set(p.id, (queenCut.get(p.id) || 0) + 1);
    coupon[color] = null;
    if (FREEREC() && victim && victim.type !== 'k') coupon[victim.color] = { r: r2, c: c2, id: p.id };

    updateChecks(now);
    if (color === 'w') {
      S.moves++;
      if (S.wasInCheck) S.movesInCheck++;
      if (victim) S.caps++;
      if (crowned) S.promoted = true;
      if (isCastle) S.castled = true;
      if (p.type === 'p') S.streakMax = Math.max(S.streakMax, streak.w);
      else if (S.streakMax >= 3) S.brokeStreak = true;
      if (p.type === 'p' && streak.w === 1 && S.streakMax >= 3) S.brokeStreak = true;
    }
    S.wasInCheck = checkSince.w != null;
    if (checkSince.w != null) S.checkSeen = true;
    if (victim && victim.type === 'k') {
      if (victim.color === 'b') S.won = true; else S.lost = true;
    }
    if (victim) host.sfx('cap');
    if (color === 'b' && checkSince.w != null && !victim) host.sfx('check');
    if (color === 'w' && phase === 'play') flashMood(victim ? 'happy' : 'idle', 800);
    if (color === 'b' && checkSince.w != null) flashMood('worry', 1400);
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
        if (m.castle && !castleOk('w', sel.r, sel.c, c)) { nudge('learn.err.castle'); return; }
        // el rey solo cae si su jaque ya cumplio el margen
        if (victim && victim.type === 'k') {
          const left = graceLeft(victim.color, now);
          if (left == null) { nudge('learn.err.noCheck'); return; }
          if (left > 0) { nudge('learn.err.grace', (left / 1000).toFixed(1)); return; }
        }
        const cost = costOf('w', sel.r, sel.c, r, c);
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
      for (const m of ENG().genMoves(bd, r, c)) {
        if (m.castle && !castleOk('b', r, c, m.c)) continue;
        if (energy.b < costOf('b', r, c, m.r, m.c)) continue;
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
    S.lead = material('w') > material('b');
    if (L.seconds && now - t0 >= L.seconds * 1000) S.timeUp = true;
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
    paintCoach(true);
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
      // el margen del jaque y el reloj corren solos: al agotarse cambia todo
      if (phase === 'play') settle(now);
    }
    paintHUD(now);
    if (phase === 'play') paintMarks(now);
  }

  // === ARRANQUE DE UNA LECCION ===========================================
  function play(idx) {
    const src = L_[ORDER[Math.max(0, Math.min(ORDER.length - 1, idx))]];
    stopLoop();
    buildGrid();
    $('tutPieces').innerHTML = '';
    els.clear();
    // copia viva: el guion marca sus pasos como disparados y no debe pegarse
    // a la definicion original (si no, la segunda vez no volveria a dispararse)
    L = Object.assign({}, src, { script: src.script ? src.script.map((s) => Object.assign({}, s)) : null });
    bd = Array.from({ length: 8 }, () => Array(8).fill(null));
    let id = 1;
    for (const [color, type, r, c] of src.set) bd[r][c] = { type, color, id: id++ };
    const startE = L.energy == null ? CFG().energy.start : L.energy;
    energy.w = startE;
    energy.b = L.foe ? startE : 0;
    checkSince = { w: null, b: null };
    streak = { w: 0, b: 0 }; lastId = { w: null, b: null };
    knightCut = new Set(); queenCut = new Map(); coupon = { w: null, b: null };
    sel = null;
    S = { moves: 0, caps: 0, won: false, lost: false, checkSeen: false, movesInCheck: 0,
          wasInCheck: false, inCheckW: false, promoted: false, castled: false, freeUsed: false,
          tollPaid: 0, jumped: false, streakMax: 0, brokeStreak: false, discountUsed: false,
          timeUp: false, lead: false };
    t0 = lastT = performance.now();
    foeLast = t0;
    updateChecks(t0);
    S.wasInCheck = checkSince.w != null;
    S.inCheckW = S.wasInCheck;
    S.lead = material('w') > material('b');
    phase = 'play';
    lastSaid = '';
    $('tutIndex').style.display = 'none';
    $('tutPlay').style.display = '';
    buildCosts();
    paintPieces();
    paintDots();
    paintCoach(true);
    paintHUD(t0);
    paintMarks(t0);
    raf = requestAnimationFrame(loop);
  }

  function stopLoop() {
    cancelAnimationFrame(raf);
    raf = 0;
    phase = 'idle';
    stopTyping(true);
    const b = $('tutBoard');
    if (b) b.classList.remove('danger');
  }

  // === INDICE: cuatro capitulos en cadena ================================
  function buildIndex() {
    const d = done();
    const list = $('tutList');
    list.innerHTML = '';
    CHAPTERS.forEach((ch, ci) => {
      const open = chapterOpen(ci);
      const hechas = ch.ids.filter((id) => d.has(id)).length;
      const head = document.createElement('div');
      head.className = 'tut-ch' + (open ? '' : ' locked') + (hechas === ch.ids.length ? ' full' : '');
      head.innerHTML =
        '<b>' + esc(tr('learn.ch.' + ch.id)) + '</b>' +
        '<span class="tut-chn">' + (open ? hechas + '/' + ch.ids.length : '🔒') + '</span>';
      list.appendChild(head);
      ch.ids.forEach((id) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'tut-card' + (d.has(id) ? ' ok' : '') + (open ? '' : ' locked');
        item.innerHTML =
          '<span class="n">' + (d.has(id) ? '✓' : (L_[id].n + 1)) + '</span>' +
          '<span class="tx"><b>' + esc(tr('learn.' + id + '.t')) + '</b>' +
          esc(tr('learn.' + id + '.s')) + '</span>';
        if (open) item.addEventListener('click', () => play(L_[id].n));
        else item.addEventListener('click', () => host.toast(tr('learn.locked')));
        list.appendChild(item);
      });
    });
    const p = progress();
    $('tutTally').textContent = tr('learn.tally').replace('{a}', p.done).replace('{b}', p.total);
    const firstOpen = ORDER.findIndex((id) => !d.has(id));
    // la lista se coloca sola donde te quedaste: con quince lecciones, abrir
    // siempre por la primera es hacer scroll cada vez
    const mark = list.querySelector('.tut-card:not(.ok):not(.locked)');
    if (mark) list.scrollTop = Math.max(0, mark.offsetTop - list.offsetTop - 46);
    $('tutStart').textContent = tr(firstOpen === -1 ? 'learn.again' : (firstOpen === 0 ? 'learn.start' : 'learn.continue'));
    $('tutStart').dataset.idx = firstOpen === -1 ? 0 : firstOpen;
  }

  function showIndex() {
    stopLoop();
    L = null;
    // primero se ensena y luego se construye: buildIndex ajusta el scroll de
    // la lista, y sobre un elemento oculto el scroll no existe
    $('tutPlay').style.display = 'none';
    $('tutIndex').style.display = '';
    buildIndex();
  }

  // === API PARA EL CLIENTE ===============================================
  function open() { mount(); showIndex(); }
  function stop() { stopLoop(); }
  function retitle() {   // al cambiar de idioma
    if (!mounted) return;
    buildCosts();
    if (L) { paintCoach(true); paintDots(); }
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
    // tocar al peon (o su panel) acaba de escribir el consejo de golpe
    $('tutCoach').addEventListener('click', () => { if (typer) stopTyping(true); });
    // Si el jugador se va a otra pestana, el navegador congela los fotogramas
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
      // al acabar un capitulo se vuelve al indice: el siguiente acaba de abrirse
      const ch = chapterOf(ORDER[i]);
      if (i + 1 >= ORDER.length || ch !== chapterOf(ORDER[i + 1])) { showIndex(); return; }
      play(i + 1);
    });
  }

  return { init, open, stop, retitle, progress, mount };
});
