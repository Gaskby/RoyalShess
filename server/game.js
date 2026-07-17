/* RoyalShess GAME estado autoritativo de UNA partida. Fases: lobby - countdown - live - over. Todos los números salen de public/config.js no edites aquí. */
const CONFIG = require('../public/config.js');
const E = require('../public/engine.js');

const START_ENERGY   = CONFIG.energy.start;
const MAX_ENERGY      = CONFIG.energy.max;
const REGEN_PER_SEC   = 1 / CONFIG.energy.regenSecondsPerPoint;
const CHECK_SURCHARGE = CONFIG.energy.checkSurcharge;
const REFUND          = CONFIG.energy.captureRefund;
const LATE_BOOST      = CONFIG.energy.lateBoost;
const LATE_MS         = CONFIG.energy.lateSeconds * 1000;
const GRACE_MS        = CONFIG.rules.kingGraceMs;
const QUEEN_MIN       = CONFIG.rules.queenMinCost;
const ROOK_TOLL       = CONFIG.rules.rookLineToll;
const LINE_LEN        = CONFIG.rules.rookLineLen;
const FREE_RECAP      = CONFIG.rules.freeRecapture !== false;
const MATCH_MS        = CONFIG.match.minutes * 60 * 1000;
const COUNTDOWN_MS    = CONFIG.match.countdownSeconds * 1000;
const AI_TICK_MS      = CONFIG.ai.tickMs;

class Game {
  constructor(opts = {}) {
    this.vsCPU = !!opts.vsCPU;
    // ajustes por partida salas privadas: si no vienen, valen los de config.js
    const s = opts.settings || {};
    this.startEnergy = s.start != null ? s.start : START_ENERGY;
    this.matchMs = (s.minutes != null ? s.minutes : CONFIG.match.minutes) * 60 * 1000;
    this.regenPerSec = 1 / (s.regenSecondsPerPoint != null ? s.regenSecondsPerPoint : CONFIG.energy.regenSecondsPerPoint);
    // coste de mover y energía al comer, por pieza personalizables en salas privadas
    this.moveCost = Object.assign({}, CONFIG.moveCost, s.moveCost || {});
    this.refundOf = {};
    for (const t of ['p', 'n', 'b', 'r', 'q', 'k']) {
      this.refundOf[t] = (s.refunds && s.refunds[t] != null) ? s.refunds[t] : E.VALUE[t] * REFUND;
    }
    // personalidad de la CPU, la escalera manda la suya por rival
    this.ai = Object.assign(
      { tickMs: AI_TICK_MS, aggression: 1, blunder: 0.05, hoard: 3, pawnPush: 0.2 },
      opts.ai || {}
    );
    this.reset();
  }

  reset() {
    const init = E.newBoard();
    this.board = init.board;
    this.nextId = init.nextId;
    // ventaja de la maquina en pesadilla: arranca con energia extra (ai.startBonus)
    this.energy = {
      w: this.startEnergy,
      b: Math.min(MAX_ENERGY, this.startEnergy + (this.vsCPU ? (this.ai.startBonus || 0) : 0)),
    };
    this.aiPrev = null;   // ultima jugada de la CPU, para no deshacerla en bucle
    this.bookIdx = 0;     // proxima jugada del libro de aperturas del rival
    this.lastMove = null;
    this.phase = 'lobby';        // 'lobby' | 'countdown' | 'live' | 'over'
    this.winner = null;   // w | b | draw | null
    this.reason = null;   // king | time | abandon | null
    this.startsAt = 0;   // cuándo pasa a live
    this.startTime = 0;   // inicio real del reloj de 5 min
    this.lastRegen = 0;
    this.lastAI = 0;
    // Historial por bando para reglas de coste especiales:
    this.lastMoveId = { w: null, b: null };   // id de la última pieza movida
    this.moveStreak = { w: 0, b: 0 };   // veces seguidas que se movió esa pieza
    this.knightDiscount = new Set();   // ids de caballos con -1 pendiente comieron
    this.queenStreak = new Map();   // id de dama - capturas acumuladas abarata su coste
    this.checkSince = { w: null, b: null };   // desde cuándo está en jaque cada rey gracia de captura
    // cupón de recaptura gratis por bando: r,c,id = puedes comer a ESA pieza
    // en ESA casilla sin gastar energía. Se gasta/pierde con tu siguiente movimiento.
    this.freeRecapture = { w: null, b: null };
    this.checkers = { w: new Set(), b: new Set() };   // ids de las piezas que dan cada jaque
  }

  get running() { return this.phase === 'live'; }

  // Desplaza todas las referencias temporales +dt tras una pausa por reconexión,
  // para que la partida continúe como si el tiempo en pausa no hubiera pasado.
  shiftTime(dt) {
    if (!dt) return;
    if (this.startsAt)  this.startsAt  += dt;
    if (this.startTime) this.startTime += dt;
    if (this.lastRegen) this.lastRegen += dt;
    if (this.lastAI)    this.lastAI    += dt;
    for (const c of ['w', 'b']) if (this.checkSince[c] != null) this.checkSince[c] += dt;
  }

  // Arranca la cuenta atrás arranque justo para ambos jugadores
  beginCountdown(now) {
    this.reset();
    this.phase = 'countdown';
    this.startsAt = now + COUNTDOWN_MS;
  }

  _goLive(now) {
    this.phase = 'live';
    this.startTime = now;
    this.lastRegen = now;
    this.lastAI = now;
  }

  _regen(now) {
    const dt = now - this.lastRegen;
    if (dt <= 0) return;
    this.lastRegen = now;
    // en el tramo final la energía sube más rápido
    const boost = (this.phase === 'live' && this.timeLeft(now) <= LATE_MS) ? LATE_BOOST : 1;
    const gain = (dt / 1000) * this.regenPerSec * boost;
    this.energy.w = Math.min(MAX_ENERGY, this.energy.w + gain);
    // ventaja de la maquina en pesadilla: regenera mas rapido (ai.regenBoost)
    this.energy.b = Math.min(MAX_ENERGY, this.energy.b + gain * (this.vsCPU ? (this.ai.regenBoost || 1) : 1));
  }

 
  _rookAttacks(r, c, exR, exC) {
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      // camina desde r,c hasta la primera pieza en esta dirección
      let rr = r + dr, cc = c + dc, dist = 1;
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && !this.board[rr][cc]) { rr += dr; cc += dc; dist++; }
      if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
      const q = this.board[rr][cc];
      if (!q || q.type !== 'r') continue;
      if (rr === exR && cc === exC) continue;   
      let run = dist;         
      let r2 = r - dr, c2 = c - dc;
      while (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8 && !this.board[r2][c2]) { run++; r2 -= dr; c2 -= dc; }
      if (run > LINE_LEN) return true;
    }
    return false;
  }

  // Peaje de torre:
  
  _rookLineToll(fr, fc, tr, tc) {
    // solo los trayectos rectos/diagonales tienen casillas intermedias el caballo salta
    if (!(fr === tr || fc === tc || Math.abs(tr - fr) === Math.abs(tc - fc))) return 0;
    const dr = Math.sign(tr - fr), dc = Math.sign(tc - fc);
    let toll = 0;
    let rr = fr + dr, cc = fc + dc;
    while (rr !== tr || cc !== tc) {
      if (this._rookAttacks(rr, cc, fr, fc)) toll += ROOK_TOLL;
      rr += dr; cc += dc;
    }
    return toll;
  }

  // ids de las piezas rivales que están atacando al rey de color
  _checkerIds(color) {
    const k = E.findKing(this.board, color);
    if (!k) return [];
    const ids = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = this.board[r][c];
      if (p && p.color !== color) {
        for (const m of E.genMoves(this.board, r, c)) {
          if (m.r === k.r && m.c === k.c) { ids.push(p.id); break; }
        }
      }
    }
    return ids;
  }

  // registra desde cuándo está cada rey en jaque para la gracia de captura.
  // Si se suma un atacante NUEVO al jaque, la ventana de gracia se REINICIA:
  // el defensor merece tiempo de reacción también contra la pieza nueva.
  _updateChecks(now) {
    for (const color of ['w', 'b']) {
      const ids = this._checkerIds(color);
      if (ids.length) {
        const prev = this.checkers[color];
        const hasNew = ids.some(id => !prev.has(id));
        if (this.checkSince[color] == null || hasNew) this.checkSince[color] = now;
        this.checkers[color] = new Set(ids);
      } else {
        this.checkSince[color] = null;
        this.checkers[color] = new Set();
      }
    }
  }

  timeLeft(now) { return this.phase === 'live' ? Math.max(0, this.matchMs - (now - this.startTime)) : this.matchMs; }
  countdownLeft(now) { return this.phase === 'countdown' ? Math.max(0, this.startsAt - now) : 0; }

  applyMove(color, fr, fc, tr, tc, now) {
    if (this.phase !== 'live') return { ok: false, reason: 'no-corriendo' };
    for (const v of [fr, fc, tr, tc]) {
      if (!Number.isInteger(v) || v < 0 || v > 7) return { ok: false, reason: 'coordenada' };
    }
    const p = this.board[fr][fc];
    if (!p) return { ok: false, reason: 'vacio' };
    if (p.color !== color) return { ok: false, reason: 'no-es-tuya' };

    const legal = E.genMoves(this.board, fr, fc).some(m => m.r === tr && m.c === tc);
    if (!legal) return { ok: false, reason: 'ilegal' };

    // ¿es un enroque? el rey se desplaza 2 columnas
    const isCastle = p.type === 'k' && Math.abs(tc - fc) === 2;
    if (isCastle && !this._castleAllowed(color, fr, fc, tc)) return { ok: false, reason: 'ilegal' };

    this._regen(now);

    const target = this.board[tr][tc];
    const capturedKing = target && target.type === 'k';

    // Gracia del jaque: el rey solo cae si su jaque lleva al menos GRACE_MS.
    if (capturedKing) {
      const cs = this.checkSince[target.color];
      if (cs == null || now - cs < GRACE_MS) return { ok: false, reason: 'rey-protegido' };
    }

    // COSTE del movimiento
    const surcharge = E.inCheck(this.board, color) ? CHECK_SURCHARGE : 0;
    let base = this.moveCost[p.type];
    // Dama: 1 menos por cada captura acumulada, sin bajar del suelo o de su
    // coste base si la sala lo puso aún más barato.
    if (p.type === 'q') base = Math.max(Math.min(QUEEN_MIN, this.moveCost.q), base - (this.queenStreak.get(p.id) || 0));
    let cost = base + surcharge;
    // Peón movido de forma SEGUIDA: +1 acumulativo por cada repetición del mismo peón.
    if (p.type === 'p' && this.lastMoveId[color] === p.id) cost += this.moveStreak[color];
    // Caballo: si venía de comer y este movimiento NO come, cuesta 1 menos.
    if (p.type === 'n' && !target && this.knightDiscount.has(p.id)) cost -= 1;
    // Peaje de torre: cruzar el carril activo de cualquier torre cuesta extra.
    let lineToll = this._rookLineToll(fr, fc, tr, tc);
    cost += lineToll;
    if (cost < 0) cost = 0;

    // Recaptura gratis: te comieron una pieza protegida y respondes comiendo
    const coupon = this.freeRecapture[color];
    const freeRecap = !!(coupon && target && tr === coupon.r && tc === coupon.c && target.id === coupon.id);
    if (freeRecap) { cost = 0; lineToll = 0; }

    if (this.energy[color] < cost) return { ok: false, reason: 'sin-energia' };

    this.energy[color] -= cost;
    // Reembolso al comer: peones y dama no lo reciben; comer peones tampoco lo da.
    if (target && p.type !== 'p' && p.type !== 'q' && target.type !== 'p') {
      this.energy[color] = Math.min(MAX_ENERGY, this.energy[color] + this.refundOf[target.type]);
    }

    // mover la pieza
    this.board[tr][tc] = p;
    this.board[fr][fc] = null;
    p.moved = true;
    if (p.type === 'p' && (tr === 0 || tr === 7)) p.type = 'q';

    // Enroque: mover también la torre al otro lado del rey.
    if (isCastle) {
      const rookFromC = tc > fc ? 7 : 0;
      const rookToC   = tc > fc ? 5 : 3;
      const rook = this.board[fr][rookFromC];
      this.board[fr][rookToC] = rook;
      this.board[fr][rookFromC] = null;
      if (rook) rook.moved = true;
    }

    // rachas y descuentos
    // Racha del mismo peón.
    if (this.lastMoveId[color] === p.id) this.moveStreak[color] += 1;
    else this.moveStreak[color] = 1;
    this.lastMoveId[color] = p.id;
    // Descuento del caballo
    if (p.type === 'n') {
      if (target) this.knightDiscount.add(p.id);
      else this.knightDiscount.delete(p.id);
    }
    // Dama: cada captura acumula 1 de descuento para sus siguientes movimientos.
    if (p.type === 'q' && target) this.queenStreak.set(p.id, (this.queenStreak.get(p.id) || 0) + 1);

    // Cupones de recaptura: al mover, el tuyo se gasta o se pierde; si comiste,
    this.freeRecapture[color] = null;
    if (FREE_RECAP && target && !capturedKing) {
      this.freeRecapture[target.color] = { r: tr, c: tc, id: p.id };
    }

    this.lastMove = { fr, fc, tr, tc };
    this._updateChecks(now);   // el reloj de gracia arranca en el instante del jaque
    if (capturedKing) this._end(color, 'king');
    return { ok: true, captured: !!target, capturedKing, cost, toll: lineToll, free: freeRecap };
  }

  // Las casillas vacías y la torre sin mover ya las validó genMoves.
  _castleAllowed(color, r, fc, tc) {
    if (E.inCheck(this.board, color)) return false;
    const step = tc > fc ? 1 : -1;
    const king = this.board[r][fc];
    for (let cc = fc + step; ; cc += step) {
      const saved = this.board[r][cc];      
      this.board[r][cc] = king;              
      this.board[r][fc] = null;
      const attacked = E.inCheck(this.board, color);
      this.board[r][fc] = king;            
      this.board[r][cc] = saved;
      if (attacked) return false;
      if (cc === tc) break;
    }
    return true;
  }

  // alguna pieza de ese color ataca la casilla dada
  _sqAttacked(color, r, c) {
    for (let rr = 0; rr < 8; rr++) for (let cc = 0; cc < 8; cc++) {
      const q = this.board[rr][cc];
      if (!q || q.color !== color) continue;
      for (const m of E.genMoves(this.board, rr, cc)) if (m.r === r && m.c === c) return true;
    }
    return false;
  }

  // alguna OTRA pieza del color defiende la casilla ocupada por una pieza suya.
  // truco: se pone temporalmente una pieza enemiga ahi para que las propias la vean
  _sqDefended(color, r, c) {
    const saved = this.board[r][c];
    this.board[r][c] = { type: 'p', color: color === 'w' ? 'b' : 'w', id: -9 };
    const def = this._sqAttacked(color, r, c);
    this.board[r][c] = saved;
    return def;
  }

  // coste real de una jugada de la CPU, replicando los descuentos, rachas,
  // peajes y cupón de applyMove para no intentar jugadas que serían rechazadas
  _estimateCost(color, p, fr, fc, tr, tc, target, surcharge) {
    const coupon = this.freeRecapture[color];
    if (coupon && target && tr === coupon.r && tc === coupon.c && target.id === coupon.id) return 0;
    let base = this.moveCost[p.type];
    if (p.type === 'q') base = Math.max(Math.min(QUEEN_MIN, this.moveCost.q), base - (this.queenStreak.get(p.id) || 0));
    let cost = base + surcharge;
    if (p.type === 'p' && this.lastMoveId[color] === p.id) cost += this.moveStreak[color];
    if (p.type === 'n' && !target && this.knightDiscount.has(p.id)) cost -= 1;
    cost += this._rookLineToll(fr, fc, tr, tc);
    return cost < 0 ? 0 : cost;
  }

  // peor réplica inmediata del rival sobre la posición ACTUAL del tablero
  // (ya simulada): material neto que su mejor captura nos puede ganar.
  // Tiene en cuenta su energía y que recapturar en justCapturedAt le sale
  // gratis por el cupón de recaptura.
  _worstReply(foeColor, myColor, justCapturedAt) {
    const V = E.VALUE;
    const sur = E.inCheck(this.board, foeColor) ? CHECK_SURCHARGE : 0;
    let worst = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const q = this.board[r][c];
      if (!q || q.color !== foeColor) continue;
      for (const m of E.genMoves(this.board, r, c)) {
        const t = this.board[m.r][m.c];
        if (!t || t.color !== myColor || t.type === 'k') continue;
        const free = justCapturedAt && m.r === justCapturedAt.r && m.c === justCapturedAt.c;
        if (!free && this.energy[foeColor] < this.moveCost[q.type] + sur) continue;
        let net = V[t.type];
        if (this._sqDefended(myColor, m.r, m.c)) net -= V[q.type];   // se la comeríamos de vuelta
        if (net > worst) worst = net;
      }
    }
    return worst;
  }

  // jugadas legales disponibles para un color. La boa constrictor puntua
  // cuantas de estas le quita al rival con cada jugada suya
  _mobility(color) {
    let n = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = this.board[r][c];
      if (p && p.color === color) n += E.genMoves(this.board, r, c).length;
    }
    return n;
  }

  // igual que _worstReply pero devuelve LA jugada, no solo el dano:
  // la mejor captura neta que foeColor puede permitirse ahora mismo
  _bestCaptureMove(foeColor, myColor, justCapturedAt) {
    const V = E.VALUE;
    const sur = E.inCheck(this.board, foeColor) ? CHECK_SURCHARGE : 0;
    let best = null, bestNet = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const q = this.board[r][c];
      if (!q || q.color !== foeColor) continue;
      for (const m of E.genMoves(this.board, r, c)) {
        const t = this.board[m.r][m.c];
        if (!t || t.color !== myColor || t.type === 'k') continue;
        const free = justCapturedAt && m.r === justCapturedAt.r && m.c === justCapturedAt.c;
        if (!free && this.energy[foeColor] < this.moveCost[q.type] + sur) continue;
        let net = V[t.type];
        if (this._sqDefended(myColor, m.r, m.c)) net -= V[q.type];
        if (net > bestNet) { bestNet = net; best = { fr: r, fc: c, tr: m.r, tc: m.c }; }
      }
    }
    return best;
  }

  // mira media jugada MAS ALLA del horizonte: deja que el rival ejecute su
  // mejor captura sobre la posicion simulada y mide nuestra mejor respuesta.
  // Positivo = la linea esconde un contragolpe que la evaluacion corta no ve
  _deepGain(color, foe, capturedAt) {
    const reply = this._bestCaptureMove(foe, color, capturedAt);
    if (!reply) return 0;
    const p = this.board[reply.fr][reply.fc];
    const victim = this.board[reply.tr][reply.tc];
    this.board[reply.tr][reply.tc] = p; this.board[reply.fr][reply.fc] = null;
    const counter = this._worstReply(color, foe, { r: reply.tr, c: reply.tc });
    this.board[reply.fr][reply.fc] = p; this.board[reply.tr][reply.tc] = victim || null;
    return counter;
  }

  _aiStep(now) {
    if (this.phase !== 'live' || !this.vsCPU) return;
    const color = 'b', foe = 'w';
    const V = E.VALUE;
    const inCheckNow = E.inCheck(this.board, color);
    const surcharge = inCheckNow ? CHECK_SURCHARGE : 0;
    const foeInCheck = this.checkSince[foe] != null;
    // solo se puede capturar al rey rival cuando su gracia de jaque venció
    const graceDone = foeInCheck && now - this.checkSince[foe] >= GRACE_MS;
    // rasgos de estilo del rival, con valores neutros si no los define.
    // Cada uno cambia COMO evalua, no solo cuanto acierta: aqui viven las
    // personalidades de verdad (ver la guia de campos en rivals.js)
    const A = this.ai;
    const risk        = A.risk != null ? A.risk : 1;
    const kingHunt    = A.kingHunt || 0;
    const efficiency  = A.efficiency != null ? A.efficiency : 0.5;
    const opportunist = A.opportunist || 0;
    const tradeBias   = A.tradeBias || 0;
    const endgame     = A.endgame || 0;

    // material y piezas en juego, una sola vez por decision
    const myMat = E.material(this.board, color), foeMat = E.material(this.board, foe);
    let pieceCount = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (this.board[r][c]) pieceCount++;
    // el tecnico de finales afina cuando el tablero se vacia: menos errores,
    // mas empuje de peones hacia la coronacion
    const inEndgame = endgame > 0 && pieceCount <= 12;
    const blunderNow  = inEndgame ? A.blunder * (1 - endgame) : A.blunder;
    const pawnPushNow = inEndgame ? A.pawnPush + 0.4 * endgame : A.pawnPush;

    // si va perdiendo en material y el reloj se acaba, se lanza: por tiempo
    // gana el que tenga mas material, asi que esperar es perder
    const desperate = this.timeLeft(now) <= LATE_MS && myMat < foeMat;
    const aggr = A.aggression * (desperate ? 1.5 : 1);
    // cercania al centro: las piezas menores y la dama pelean mejor desde ahi
    const cent = (rr, cc) => 3.5 - Math.max(Math.abs(rr - 3.5), Math.abs(cc - 3.5));
    // donde vive el rey rival, para los cazadores de reyes
    const fk = kingHunt ? E.findKing(this.board, foe) : null;

    // libro de aperturas: jugadas preparadas que ejecuta mientras la posicion
    // lo permita. Se abandona si una jugada ya no es legal o expone al rey
    if (A.book && this.bookIdx < A.book.length && !inCheckNow) {
      const [bfr, bfc, btr, btc] = A.book[this.bookIdx];
      const bp = this.board[bfr][bfc];
      const legal = bp && bp.color === color &&
        E.genMoves(this.board, bfr, bfc).some(m => m.r === btr && m.c === btc);
      if (!legal) { this.bookIdx = 999; }
      else {
        const bTarget = this.board[btr][btc];
        const bCost = this._estimateCost(color, bp, bfr, bfc, btr, btc, bTarget, surcharge);
        if (this.energy[color] < bCost) return;   // espera juntar energia para el guion
        this.board[btr][btc] = bp; this.board[bfr][bfc] = null;
        const bSafe = !E.inCheck(this.board, color);
        this.board[bfr][bfc] = bp; this.board[btr][btc] = bTarget || null;
        if (bSafe) {
          this.bookIdx++;
          this.applyMove(color, bfr, bfc, btr, btc, now);
          return;
        }
        this.bookIdx = 999;
      }
    }

    const moves = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = this.board[r][c];
      if (!p || p.color !== color) continue;
      for (const m of E.genMoves(this.board, r, c)) {
        const victim = this.board[m.r][m.c];
        if (victim && victim.type === 'k' && !graceDone) continue;   // el servidor la rechazaría
        if (m.castle && !this._castleAllowed(color, r, c, m.c)) continue;
        const cost = this._estimateCost(color, p, r, c, m.r, m.c, victim, surcharge);
        if (this.energy[color] < cost) continue;

        let score = 0;
        if (victim) {
          score += V[victim.type] * 10 * aggr;
          if (victim.type === 'k') score += 100000;
          if (cost === 0 && this.freeRecapture[color]) score += 6;   // recaptura con cupón: gratis
          // actitud ante los CAMBIOS (capturar pieza defendida): con tradeBias
          // positivo simplifica cuando va ganando en material porque por tiempo
          // gana el material; negativo evita cambios y mantiene la tension
          if (tradeBias && victim.type !== 'k' && this._sqDefended(foe, m.r, m.c)) {
            score += tradeBias * V[victim.type] * (myMat > foeMat ? 2 : -1.5);
          }
        }

        // simula la jugada y mide qué nos puede hacer el rival justo después
        const promotes = p.type === 'p' && (m.r === 0 || m.r === 7);
        this.board[m.r][m.c] = p; this.board[r][c] = null;
        if (promotes) p.type = 'q';
        const kingSafe = !E.inCheck(this.board, color);
        const givesCheck = E.inCheck(this.board, foe);
        const worst = kingSafe ? this._worstReply(foe, color, victim ? { r: m.r, c: m.c } : null) : 0;
        // amenaza que deja la pieza desde su nueva casilla: la mejor captura
        // RENTABLE que tendría al turno siguiente. Premia horquillas y presión.
        let threat = 0;
        if (kingSafe) {
          for (const m2 of E.genMoves(this.board, m.r, m.c)) {
            const t2 = this.board[m2.r][m2.c];
            if (!t2 || t2.color !== foe || t2.type === 'k') continue;
            const gain = this._sqDefended(foe, m2.r, m2.c) ? V[t2.type] - V[p.type] : V[t2.type];
            if (gain > threat) threat = gain;
          }
        }
        // caza del rey: cuantas casillas pegadas al rey rival muerde la pieza
        // desde su nueva posicion, y si el movimiento acorta la distancia
        if (kingHunt && fk && kingSafe && p.type !== 'k') {
          let bites = 0;
          for (const m2 of E.genMoves(this.board, m.r, m.c)) {
            if (Math.abs(m2.r - fk.r) <= 1 && Math.abs(m2.c - fk.c) <= 1) bites++;
          }
          const dBefore = Math.max(Math.abs(r - fk.r), Math.abs(c - fk.c));
          const dAfter  = Math.max(Math.abs(m.r - fk.r), Math.abs(m.c - fk.c));
          score += (bites * 1.5 + (dBefore - dAfter) * 0.6) * kingHunt;
        }
        if (promotes) p.type = 'p';
        this.board[r][c] = p; this.board[m.r][m.c] = victim || null;

        if (!kingSafe) score -= 400;      // deja al rey vendido
        score -= worst * 8 * risk;        // lo que su mejor réplica nos costaría
        score += threat * 2;              // amenaza creada para el siguiente turno
        score -= cost * efficiency;       // la energía es tempo: mejor barato
        // oportunista: golpea justo cuando el rival esta seco de energia
        // y no puede responder ni defenderse
        if (opportunist && this.energy[foe] < 2.5) {
          score += (threat * 1.2 + (givesCheck ? 5 : 0) + (victim ? 3 : 0)) * opportunist;
        }

        // el jaque sostenido es el camino a la victoria: corre el reloj de gracia
        if (givesCheck) {
          const wasChecker = this.checkers[foe].has(p.id);
          if (!foeInCheck) score += 8 * aggr;        // arranca el reloj
          else if (wasChecker) score += 12 * aggr;   // lo mantiene corriendo
          else score += 2;                           // atacante nuevo: reinicia la gracia
        } else if (foeInCheck && this.checkers[foe].has(p.id)) {
          score -= 10;                    // no sueltes el jaque que ya tienes
        }

        if (promotes) score += 25;
        if (p.type === 'p') score += (color === 'b' ? m.r : 7 - m.r) * pawnPushNow;
        if (p.type === 'k' && !inCheckNow) score -= 3;   // no pasear al rey sin motivo
        if ((p.type === 'n' || p.type === 'b') && (r === 0 || r === 7)) score += 1.5;   // desarrollo
        // ganar centro con menores y dama; perderlo sin motivo resta
        if (p.type === 'n' || p.type === 'b' || p.type === 'q') score += (cent(m.r, m.c) - cent(r, c)) * 0.8;
        // no deshacer la jugada anterior: el vaiven regala tempo y energia
        if (this.aiPrev && p.id === this.aiPrev.id && m.r === this.aiPrev.fr && m.c === this.aiPrev.fc) score -= 5;
        // el ruido aleatorio baja con la precision del rival: los finos casi no dudan
        score += Math.random() * (0.25 + blunderNow * 4);
        moves.push({ fr: r, fc: c, tr: m.r, tc: m.c, score, cap: !!victim, safe: kingSafe });
      }
    }
    if (!moves.length) return;
    // el rey NO se regala: solo jugadas que lo dejan a salvo. Si no existe
    // ninguna (mate inevitable), juega lo que haya.
    const safeMoves = moves.filter(m => m.safe);
    const pool = safeMoves.length ? safeMoves : moves;
    pool.sort((a, b) => b.score - a.score);

    // FASE CARA solo sobre los mejores candidatos, para no fundir el servidor:
    // smother mide cuantas jugadas legales le quita al rival (la boa de Karpov)
    // y depth mira media jugada mas alla del horizonte (el calculo de Deep Blue)
    if ((A.smother || A.depth) && pool.length > 1) {
      const smother = A.smother || 0, depth = A.depth || 0;
      const baseMob = smother ? this._mobility(foe) : 0;
      const K = Math.min(5, pool.length);
      for (let i = 0; i < K; i++) {
        const mv = pool[i];
        const p = this.board[mv.fr][mv.fc];
        const victim = this.board[mv.tr][mv.tc];
        if (victim && victim.type === 'k') continue;   // capturar al rey no necesita refinarse
        const promotes = p.type === 'p' && (mv.tr === 0 || mv.tr === 7);
        this.board[mv.tr][mv.tc] = p; this.board[mv.fr][mv.fc] = null;
        if (promotes) p.type = 'q';
        if (smother) mv.score += (baseMob - this._mobility(foe)) * smother;
        if (depth) mv.score += this._deepGain(color, foe, victim ? { r: mv.tr, c: mv.tc } : null) * 1.2 * depth;
        if (promotes) p.type = 'p';
        this.board[mv.fr][mv.fc] = p; this.board[mv.tr][mv.tc] = victim || null;
      }
      pool.sort((a, b) => b.score - a.score);
    }

    let pick = pool[0];
    const goodMove = pick.score > 8;   // captura rentable, jaque o respuesta a amenaza
    // acumula energia antes de gastar en jugadas mediocres segun su avaricia
    if (!goodMove && !inCheckNow && this.energy[color] < this.ai.hoard && Math.random() < 0.6) return;
    // error humano: a veces juega algo flojo (de la mitad buena de sus opciones),
    // pero nunca una jugada que exponga al rey ni estando en jaque
    if (!inCheckNow && pick.score < 9000 && Math.random() < blunderNow) {
      pick = pool[Math.floor(Math.random() * Math.max(1, Math.ceil(pool.length / 2)))];
    }
    const pid = this.board[pick.fr][pick.fc].id;
    const res = this.applyMove(color, pick.fr, pick.fc, pick.tr, pick.tc, now);
    if (res.ok) this.aiPrev = { id: pid, fr: pick.fr, fc: pick.fc };
  }

  _end(winner, reason) { this.phase = 'over'; this.winner = winner; this.reason = reason; }

  // el rival de winner abandonó - gana winner
  abandon(winner) { if (this.phase === 'live' || this.phase === 'countdown') this._end(winner, 'abandon'); }

  tick(now) {
    if (this.phase === 'countdown') {
      if (now >= this.startsAt) this._goLive(now);
      return;
    }
    if (this.phase !== 'live') return;
    this._regen(now);
    if (this.timeLeft(now) <= 0) {
      const mw = E.material(this.board, 'w');
      const mb = E.material(this.board, 'b');
      this._end(mw > mb ? 'w' : (mb > mw ? 'b' : 'draw'), 'time');
      return;
    }
    if (this.vsCPU) {
      // con un rey en jaque manda el reloj de gracia: la CPU reacciona más rápido,
      // tanto para salvar a su rey como para cazar al tuyo cuando venza la gracia
      const urgent = this.checkSince.w != null || this.checkSince.b != null;
      const wait = urgent ? Math.min(this.ai.tickMs, 320) : this.ai.tickMs;
      if (now - this.lastAI >= wait) { this.lastAI = now; this._aiStep(now); }
    }
  }

  serialize(you, now) {
    return {
      t: 'state',
      you,
      vsCPU: this.vsCPU,
      phase: this.phase,
      running: this.phase === 'live',
      countdownLeft: this.countdownLeft(now),
      board: this.board,
      energy: { w: +this.energy.w.toFixed(3), b: +this.energy.b.toFixed(3) },
      maxEnergy: MAX_ENERGY,
      timeLeft: this.timeLeft(now),
      matchMs: this.matchMs,
      costs: this.moveCost,
      freeCap: this.freeRecapture[you] || null,   
      checkers: [...this.checkers[you]],         
      check: { w: E.inCheck(this.board, 'w'), b: E.inCheck(this.board, 'b') },
      material: { w: E.material(this.board, 'w'), b: E.material(this.board, 'b') },
      lastMove: this.lastMove,
      winner: this.winner,
      reason: this.reason,
    };
  }
}

module.exports = { Game, MAX_ENERGY, MATCH_MS, COUNTDOWN_MS };
