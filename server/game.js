/* ============================================================================
   RoyalShess — GAME (estado autoritativo de UNA partida)
   Fases: 'lobby' -> 'countdown' -> 'live' -> 'over'
   Todos los números salen de public/config.js (no edites aquí).
   ============================================================================ */
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
const MATCH_MS        = CONFIG.match.minutes * 60 * 1000;
const COUNTDOWN_MS    = CONFIG.match.countdownSeconds * 1000;
const AI_TICK_MS      = CONFIG.ai.tickMs;

class Game {
  constructor(opts = {}) {
    this.vsCPU = !!opts.vsCPU;
    this.reset();
  }

  reset() {
    const init = E.newBoard();
    this.board = init.board;
    this.nextId = init.nextId;
    this.energy = { w: START_ENERGY, b: START_ENERGY };
    this.lastMove = null;
    this.phase = 'lobby';        // 'lobby' | 'countdown' | 'live' | 'over'
    this.winner = null;          // 'w' | 'b' | 'draw' | null
    this.reason = null;          // 'king' | 'time' | 'abandon' | null
    this.startsAt = 0;           // cuándo pasa a 'live'
    this.startTime = 0;          // inicio real del reloj de 5 min
    this.lastRegen = 0;
    this.lastAI = 0;
    // Historial por bando para reglas de coste especiales:
    this.lastMoveId = { w: null, b: null };  // id de la última pieza movida
    this.moveStreak = { w: 0, b: 0 };        // veces seguidas que se movió esa pieza
    this.knightDiscount = new Set();         // ids de caballos con -1 pendiente (comieron)
    this.queenStreak = new Map();            // id de dama -> capturas acumuladas (abarata su coste)
    this.checkSince = { w: null, b: null };  // desde cuándo está en jaque cada rey (gracia de captura)
  }

  get running() { return this.phase === 'live'; }

  // Arranca la cuenta atrás (arranque justo para ambos jugadores)
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
    const gain = (dt / 1000) * REGEN_PER_SEC * boost;
    this.energy.w = Math.min(MAX_ENERGY, this.energy.w + gain);
    this.energy.b = Math.min(MAX_ENERGY, this.energy.b + gain);
  }

  // ¿alguna torre RIVAL de `color` ataca (r,c) con línea despejada?
  _rookAttacks(color, r, c) {
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      let rr = r + dr, cc = c + dc;
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
        const q = this.board[rr][cc];
        if (q) { if (q.type === 'r' && q.color !== color) return true; break; }
        rr += dr; cc += dc;
      }
    }
    return false;
  }

  // Peaje de torre: +TOLL por cada casilla intermedia del trayecto que esté
  // en la línea de ataque de una torre rival (cruzar su "carril" cuesta).
  _rookLineToll(color, fr, fc, tr, tc) {
    // solo los trayectos rectos/diagonales tienen casillas intermedias (el caballo salta)
    if (!(fr === tr || fc === tc || Math.abs(tr - fr) === Math.abs(tc - fc))) return 0;
    const dr = Math.sign(tr - fr), dc = Math.sign(tc - fc);
    let toll = 0;
    let rr = fr + dr, cc = fc + dc;
    while (rr !== tr || cc !== tc) {
      if (this._rookAttacks(color, rr, cc)) toll += ROOK_TOLL;
      rr += dr; cc += dc;
    }
    return toll;
  }

  // registra desde cuándo está cada rey en jaque (para la gracia de captura)
  _updateChecks(now) {
    for (const color of ['w', 'b']) {
      if (E.inCheck(this.board, color)) {
        if (this.checkSince[color] == null) this.checkSince[color] = now;
      } else {
        this.checkSince[color] = null;
      }
    }
  }

  timeLeft(now) { return this.phase === 'live' ? Math.max(0, MATCH_MS - (now - this.startTime)) : MATCH_MS; }
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

    // ¿es un enroque? (el rey se desplaza 2 columnas)
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

    // ---------- COSTE del movimiento ----------
    const surcharge = E.inCheck(this.board, color) ? CHECK_SURCHARGE : 0;
    let base = E.MOVE_COST[p.type];
    // Dama: 1 menos por cada captura acumulada, sin bajar del suelo configurado.
    if (p.type === 'q') base = Math.max(QUEEN_MIN, base - (this.queenStreak.get(p.id) || 0));
    let cost = base + surcharge;
    // Peón movido de forma SEGUIDA: +1 acumulativo por cada repetición del mismo peón.
    if (p.type === 'p' && this.lastMoveId[color] === p.id) cost += this.moveStreak[color];
    // Caballo: si venía de comer y este movimiento NO come, cuesta 1 menos.
    if (p.type === 'n' && !target && this.knightDiscount.has(p.id)) cost -= 1;
    // Peaje de torre: cruzar la línea de ataque de una torre rival cuesta extra.
    cost += this._rookLineToll(color, fr, fc, tr, tc);
    if (cost < 0) cost = 0;

    if (this.energy[color] < cost) return { ok: false, reason: 'sin-energia' };

    this.energy[color] -= cost;
    // Reembolso al comer: peones y dama no lo reciben; comer peones tampoco lo da.
    if (target && p.type !== 'p' && p.type !== 'q' && target.type !== 'p') {
      this.energy[color] = Math.min(MAX_ENERGY, this.energy[color] + E.VALUE[target.type] * REFUND);
    }

    // ---------- mover la pieza ----------
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

    // ---------- rachas y descuentos ----------
    // Racha del mismo peón (para la penalización acumulativa).
    if (this.lastMoveId[color] === p.id) this.moveStreak[color] += 1;
    else this.moveStreak[color] = 1;
    this.lastMoveId[color] = p.id;
    // Descuento del caballo: se arma al comer, se limpia/gasta al no comer.
    if (p.type === 'n') {
      if (target) this.knightDiscount.add(p.id);
      else this.knightDiscount.delete(p.id);
    }
    // Dama: cada captura acumula 1 de descuento para sus siguientes movimientos.
    if (p.type === 'q' && target) this.queenStreak.set(p.id, (this.queenStreak.get(p.id) || 0) + 1);

    this.lastMove = { fr, fc, tr, tc };
    this._updateChecks(now);   // el reloj de gracia arranca en el instante del jaque
    if (capturedKing) this._end(color, 'king');
    return { ok: true, captured: !!target, capturedKing };
  }

  // ¿puede el rey enrocar? No en jaque y sin pasar por (ni caer en) casilla atacada.
  // Las casillas vacías y la torre sin mover ya las validó genMoves.
  _castleAllowed(color, r, fc, tc) {
    if (E.inCheck(this.board, color)) return false;
    const step = tc > fc ? 1 : -1;
    const king = this.board[r][fc];
    for (let cc = fc + step; ; cc += step) {
      const saved = this.board[r][cc];       // casilla intermedia (vacía)
      this.board[r][cc] = king;              // simula el rey ahí
      this.board[r][fc] = null;
      const attacked = E.inCheck(this.board, color);
      this.board[r][fc] = king;              // restaura
      this.board[r][cc] = saved;
      if (attacked) return false;
      if (cc === tc) break;
    }
    return true;
  }

  _aiStep(now) {
    if (this.phase !== 'live' || !this.vsCPU) return;
    const color = 'b';
    const surcharge = E.inCheck(this.board, color) ? CHECK_SURCHARGE : 0;
    const moves = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = this.board[r][c];
      if (p && p.color === color) {
        const cost = E.MOVE_COST[p.type] + surcharge;
        if (this.energy[color] >= cost) {
          for (const m of E.genMoves(this.board, r, c)) {
            let score = 0;
            if (m.cap) {
              const victim = this.board[m.r][m.c];
              score = E.VALUE[victim.type] * 10;
              if (victim.type === 'k') score += 1000;
            }
            if (p.type === 'p') score += (color === 'b' ? m.r : 7 - m.r) * 0.2;
            score += Math.random() * 2;
            moves.push({ fr: r, fc: c, tr: m.r, tc: m.c, score });
          }
        }
      }
    }
    if (!moves.length) return;
    moves.sort((a, b) => b.score - a.score);
    const hasCapture = moves[0].score >= 10;
    if (!hasCapture && this.energy[color] < 3 && Math.random() < 0.5) return;
    const pick = hasCapture ? moves[0] : moves[Math.floor(Math.random() * Math.min(4, moves.length))];
    this.applyMove(color, pick.fr, pick.fc, pick.tr, pick.tc, now);
  }

  _end(winner, reason) { this.phase = 'over'; this.winner = winner; this.reason = reason; }

  // el rival de 'winner' abandonó -> gana 'winner'
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
    if (this.vsCPU && now - this.lastAI >= AI_TICK_MS) { this.lastAI = now; this._aiStep(now); }
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
      matchMs: MATCH_MS,
      check: { w: E.inCheck(this.board, 'w'), b: E.inCheck(this.board, 'b') },
      material: { w: E.material(this.board, 'w'), b: E.material(this.board, 'b') },
      lastMove: this.lastMove,
      winner: this.winner,
      reason: this.reason,
    };
  }
}

module.exports = { Game, MAX_ENERGY, MATCH_MS, COUNTDOWN_MS };
