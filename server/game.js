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
    const gain = (dt / 1000) * REGEN_PER_SEC;
    this.energy.w = Math.min(MAX_ENERGY, this.energy.w + gain);
    this.energy.b = Math.min(MAX_ENERGY, this.energy.b + gain);
  }

  timeLeft(now) { return this.phase === 'live' ? Math.max(0, MATCH_MS - (now - this.startTime)) : MATCH_MS; }
  countdownLeft(now) { return this.phase === 'countdown' ? Math.max(0, this.startsAt - now) : 0; }

  moveCost(r, c) {
    const p = this.board[r][c];
    if (!p) return Infinity;
    const surcharge = E.inCheck(this.board, p.color) ? CHECK_SURCHARGE : 0;
    return E.MOVE_COST[p.type] + surcharge;
  }

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

    this._regen(now);
    const cost = this.moveCost(fr, fc);
    if (this.energy[color] < cost) return { ok: false, reason: 'sin-energia' };

    const target = this.board[tr][tc];
    const capturedKing = target && target.type === 'k';

    this.energy[color] -= cost;
    if (target) this.energy[color] = Math.min(MAX_ENERGY, this.energy[color] + E.VALUE[target.type] * REFUND);

    this.board[tr][tc] = p;
    this.board[fr][fc] = null;
    if (p.type === 'p' && (tr === 0 || tr === 7)) p.type = 'q';

    this.lastMove = { fr, fc, tr, tc };
    if (capturedKing) this._end(color, 'king');
    return { ok: true, captured: !!target, capturedKing };
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
