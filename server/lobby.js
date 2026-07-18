/* RoyalShess - lobby
   Emparejamiento, salas privadas, revancha y reconexion.
   Formas de entrar a una partida: cola publica, vs CPU,
   crear sala privada con codigo o unirse a una. */
const { Game } = require('./game.js');
const stats = require('./stats.js');
const CONFIG = require('../public/config.js');
const { RIVALS, ladderAt } = require('../public/rivals.js');

const RECONNECT_MS = (CONFIG.server.reconnectSeconds || 20) * 1000;
const PIECE_TYPES = ['p', 'n', 'b', 'r', 'q', 'k'];

function normalizeCode(x) { return String(x || '').trim().toUpperCase().slice(0, 12); }

// ajustes que puede elegir quien crea una sala privada, con lista blanca y limites
function cleanSettings(o) {
  if (!o || typeof o !== 'object') return null;
  const num = (v, min, max) => { v = +v; return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : null; };
  const s = {};
  const m  = num(o.minutes, 1, 10); if (m  != null) s.minutes = Math.round(m);
  const st = num(o.start,   0, 10); if (st != null) s.start = Math.round(st);
  const rg = num(o.regen,   1, 10); if (rg != null) s.regenSecondsPerPoint = rg;
  if (o.costs && typeof o.costs === 'object') {
    const costs = {};
    for (const t of PIECE_TYPES) { const v = num(o.costs[t], 0, 20); if (v != null) costs[t] = Math.round(v); }
    if (Object.keys(costs).length) s.moveCost = costs;
  }
  if (o.refunds && typeof o.refunds === 'object') {
    const refunds = {};
    for (const t of PIECE_TYPES) { const v = num(o.refunds[t], 0, 10); if (v != null) refunds[t] = Math.round(v * 2) / 2; }
    if (Object.keys(refunds).length) s.refunds = refunds;
  }
  return Object.keys(s).length ? s : null;
}

// nueva vuelta de la escalera: cada pesadilla acelera y afina a todos los rivales.
// loop 0 devuelve la personalidad original; el tope evita valores absurdos del cliente
function nightmareAI(ai, loop) {
  if (!loop) return ai;
  const speed = Math.pow(0.62, loop);
  // el spread conserva los rasgos de estilo del rival (risk, kingHunt, smother,
  // depth, book...): en pesadilla sigue siendo el mismo, solo que potenciado
  return {
    ...ai,
    tickMs: Math.max(150, Math.round(ai.tickMs * speed)),
    aggression: ai.aggression + 0.4 * loop,
    blunder: ai.blunder * Math.pow(0.25, loop),
    hoard: Math.max(2, ai.hoard - loop),
    // ventaja de la maquina poseida: energia inicial extra y regeneracion mas rapida
    startBonus: Math.min(3, loop),
    regenBoost: Math.min(1.75, 1 + 0.25 * loop),
  };
}

function genCode() {
  const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = ''; for (let i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

class Lobby {
  constructor() {
    this.queue = [];
    this.rooms = new Map();
    this.privateWaiting = new Map();
    this.roomSeq = 1;
  }

  _send(client, obj) { try { client.send(obj); } catch (_e) {} }
  toLobby(client) { client.roomId = null; client.color = null; this._send(client, { t: 'lobby' }); }

  _makeRoom(vsCPU, opts = {}) {
    const id = this.roomSeq++;
    const room = { id, game: new Game({ vsCPU, settings: opts.settings, ai: opts.ai }), clients: [], code: opts.code || null, private: !!opts.private };
    this.rooms.set(id, room);
    return room;
  }

  _deleteRoom(room) {
    if (room.awaitTimers) for (const k in room.awaitTimers) clearTimeout(room.awaitTimers[k]);
    this.rooms.delete(room.id);
    if (room.code && this.privateWaiting.get(room.code) === room) this.privateWaiting.delete(room.code);
  }

  // pausa mientras alguien esta desconectado y al reanudar
  // desplaza el reloj para no contar el tiempo detenido
  _pause(room) { if (!room.paused) { room.paused = true; room.pausedAt = Date.now(); } }
  _resume(room) {
    if (!room.paused) return;
    room.game.shiftTime(Date.now() - room.pausedAt);
    room.paused = false; room.pausedAt = 0;
  }

  // saca al cliente de una sala ya terminada
  _detach(client) {
    const room = client.roomId != null ? this.rooms.get(client.roomId) : null;
    if (room && room.game.phase === 'over') {
      room.clients = room.clients.filter(c => c !== client);
      if (room.clients.length === 0) this._deleteRoom(room);
      client.roomId = null; client.color = null;
    }
  }

  _removeFromQueue(client) { this.queue = this.queue.filter(c => c !== client); }

  // arranca la partida con colores al azar y cuenta atras
  _beginMatch(room) {
    room.rematch = new Set();
    room.scored = false;
    if (room.awaitTimers) for (const k in room.awaitTimers) clearTimeout(room.awaitTimers[k]);
    room.awaiting = null; room.awaitTimers = {}; room.paused = false; room.pausedAt = 0;
    const colors = Math.random() < 0.5 ? ['w', 'b'] : ['b', 'w'];
    room.clients[0].color = colors[0];
    room.clients[1].color = colors[1];
    // foto de identidades al empezar para puntuar aunque alguien se caiga
    room.players = {};
    room.ranks = { w: null, b: null };
    for (const c of room.clients) if (c.color) {
      room.players[c.color] = { token: c.token || null, name: c.name || '' };
      room.ranks[c.color] = c.token ? stats.rankOf(c.token) : null;
    }
    room.game.beginCountdown(Date.now());
    this._broadcast(room, Date.now());
  }

  // puntua Elo una sola vez por partida y solo en salas publicas de cola
  _maybeScore(room) {
    if (room.scored || room.game.phase !== 'over') return;
    room.scored = true;
    if (room.game.vsCPU || room.private || !room.players) return;
    const pw = room.players.w, pb = room.players.b;
    if (!pw || !pb || !pw.token || !pb.token) return;
    const winner = room.game.winner;
    stats.applyResult(pw.token, pb.token, winner === 'w' ? 1 : winner === 'b' ? 0 : 0.5);
  }

  // revancha en la misma sala con los mismos ajustes
  rematch(client) {
    const room = client.roomId != null ? this.rooms.get(client.roomId) : null;
    if (!room || room.game.phase !== 'over') return;
    if (room.game.vsCPU) {
      room.game.beginCountdown(Date.now());
      this._broadcast(room, Date.now());
      return;
    }
    if (room.clients.length < 2) { this._send(client, { t: 'reject', reason: 'rival-se-fue' }); return; }
    room.rematch = room.rematch || new Set();
    room.rematch = new Set([...room.rematch].filter(id => room.clients.some(c => c.id === id)));
    room.rematch.add(client.id);
    if (room.rematch.size >= 2) {
      this._beginMatch(room);
    } else {
      this._send(client, { t: 'rematch-wait' });
      room.clients.forEach(c => { if (c !== client) this._send(c, { t: 'rematch-offer' }); });
    }
  }

  // cola publica
  enqueue(client) {
    this._detach(client);
    if (client.roomId != null) return;
    if (this.queue.includes(client)) return;
    const partner = this.queue.find(c => c !== client);
    if (partner) {
      this._removeFromQueue(partner);
      const room = this._makeRoom(false);
      room.clients.push(partner, client);
      partner.roomId = room.id; client.roomId = room.id;
      this._beginMatch(room);
    } else {
      this.queue.push(client);
      this._send(client, { t: 'queued' });
    }
  }

  // practica contra la maquina
  startCPU(client) {
    this._detach(client);
    if (client.roomId != null) return;
    this._removeFromQueue(client);
    const room = this._makeRoom(true);
    room.clients.push(client);
    client.color = 'w'; client.roomId = room.id;
    room.ranks = { w: client.token ? stats.rankOf(client.token) : null, b: null };
    room.game.beginCountdown(Date.now());
    this._broadcast(room, Date.now());
  }

  // pelea de la escalera contra el rival idx del archivo rivals.js.
  // loop > 0 es nueva vuelta en modo pesadilla: misma escalera, rivales potenciados
  startLadder(client, idx, loop) {
    idx = Math.floor(+idx);
    if (!Number.isFinite(idx) || idx < 0 || idx >= RIVALS.length) return;
    loop = Math.min(9, Math.max(0, Math.floor(+loop) || 0));
    this._detach(client);
    if (client.roomId != null) return;
    this._removeFromQueue(client);
    // la cima de la torre cambia por vuelta: Deep Blue, Deep Green, Deep Red
    const rival = ladderAt(idx, loop);
    const room = this._makeRoom(true, { ai: nightmareAI(rival.ai, loop) });
    room.rivalName = (loop ? '☠ ' : '') + rival.name;
    room.clients.push(client);
    client.color = 'w'; client.roomId = room.id;
    room.ranks = { w: client.token ? stats.rankOf(client.token) : null, b: null };
    room.game.beginCountdown(Date.now());
    this._broadcast(room, Date.now());
  }

  // crear sala privada con codigo
  createPrivate(client, rawCode, rawOpts) {
    this._detach(client);
    if (client.roomId != null) { this._send(client, { t: 'reject', reason: 'ya-en-sala' }); return; }
    let code = normalizeCode(rawCode);
    if (!code) code = genCode();
    if (this.privateWaiting.has(code)) { this._send(client, { t: 'reject', reason: 'codigo-en-uso' }); return; }
    this._removeFromQueue(client);
    const room = this._makeRoom(false, { code, private: true, settings: cleanSettings(rawOpts) });
    room.clients.push(client);
    client.roomId = room.id;
    this.privateWaiting.set(code, room);
    this._send(client, { t: 'created', code });
  }

  // unirse a sala privada
  joinPrivate(client, rawCode) {
    this._detach(client);
    if (client.roomId != null) { this._send(client, { t: 'reject', reason: 'ya-en-sala' }); return; }
    const code = normalizeCode(rawCode);
    if (!code) { this._send(client, { t: 'reject', reason: 'codigo-vacio' }); return; }
    const room = this.privateWaiting.get(code);
    if (!room) { this._send(client, { t: 'reject', reason: 'sala-no-existe' }); return; }
    if (room.clients.length >= 2 || room.clients.includes(client)) { this._send(client, { t: 'reject', reason: 'sala-llena' }); return; }
    this._removeFromQueue(client);
    room.clients.push(client);
    client.roomId = room.id;
    this.privateWaiting.delete(code);
    this._beginMatch(room);
  }

  cancel(client) { this._removeFromQueue(client); this.toLobby(client); }

  handleMove(client, from, to) {
    const room = client.roomId != null ? this.rooms.get(client.roomId) : null;
    if (!room || room.paused) return;
    const now = Date.now();
    const res = room.game.applyMove(client.color, from[0], from[1], to[0], to[1], now);
    if (!res.ok) { this._send(client, { t: 'reject', reason: res.reason }); return; }
    if (res.toll) this._send(client, { t: 'toll', toll: res.toll });
    if (res.free) this._send(client, { t: 'freecap' });
    this._broadcast(room, now);
  }

  _handleExit(client, isDisconnect) {
    this._removeFromQueue(client);
    const room = client.roomId != null ? this.rooms.get(client.roomId) : null;
    if (room) {
      if (!room.game.vsCPU && (room.game.phase === 'live' || room.game.phase === 'countdown')) {
        room.game.abandon(client.color === 'w' ? 'b' : 'w');
      }
      room.clients = room.clients.filter(c => c !== client);
      if (room.clients.length === 0) this._deleteRoom(room);
      else this._broadcast(room, Date.now());
    }
    if (!isDisconnect) this.toLobby(client);
  }

  leave(client) { this._handleExit(client, false); }

  // caida de socket en partida: reserva la plaza por token y pausa la sala
  disconnect(client) {
    this._removeFromQueue(client);
    const room = client.roomId != null ? this.rooms.get(client.roomId) : null;
    if (!room) return;
    const g = room.game;
    const canReconnect = !g.vsCPU && client.color && client.token &&
                         (g.phase === 'live' || g.phase === 'countdown');
    if (!canReconnect) { this._handleExit(client, true); return; }

    const color = client.color;
    room.clients = room.clients.filter(c => c !== client);
    room.awaiting = room.awaiting || {};
    room.awaiting[color] = { token: client.token, name: client.name || '' };
    client.roomId = null; client.color = null;
    this._pause(room);
    room.awaitTimers = room.awaitTimers || {};
    clearTimeout(room.awaitTimers[color]);
    room.awaitTimers[color] = setTimeout(() => this._reconnectTimeout(room, color), RECONNECT_MS);
    room.clients.forEach(c => this._send(c, { t: 'opp-gone', seconds: Math.round(RECONNECT_MS / 1000) }));
  }

  // un socket nuevo con token busca su plaza reservada
  tryReconnect(client) {
    if (!client.token) return false;
    for (const room of this.rooms.values()) {
      if (!room.awaiting) continue;
      for (const color of ['w', 'b']) {
        const slot = room.awaiting[color];
        if (!slot || slot.token !== client.token) continue;
        delete room.awaiting[color];
        if (room.awaitTimers) { clearTimeout(room.awaitTimers[color]); delete room.awaitTimers[color]; }
        client.color = color; client.roomId = room.id;
        if (!client.name) client.name = slot.name;
        room.clients.push(client);
        const stillAway = room.awaiting && Object.keys(room.awaiting).length > 0;
        if (!stillAway) this._resume(room);
        this._send(client, { t: 'resumed' });
        room.clients.forEach(c => { if (c !== client) this._send(c, { t: 'opp-back' }); });
        this._broadcast(room, Date.now());
        return true;
      }
    }
    return false;
  }

  // vencio la ventana de reconexion y el ausente pierde por abandono
  _reconnectTimeout(room, color) {
    if (!this.rooms.has(room.id)) return;
    if (!room.awaiting || !room.awaiting[color]) return;
    delete room.awaiting[color];
    if (room.awaitTimers) delete room.awaitTimers[color];
    this._resume(room);
    if (room.game.phase === 'live' || room.game.phase === 'countdown') {
      room.game.abandon(color === 'w' ? 'b' : 'w');
    }
    this._broadcast(room, Date.now());
  }

  _names(room) {
    const names = { w: null, b: null };
    for (const c of room.clients) if (c.color) names[c.color] = c.name || null;
    if (room.awaiting) for (const color of ['w', 'b']) {
      if (room.awaiting[color] && !names[color]) names[color] = room.awaiting[color].name || null;
    }
    if (room.game.vsCPU && !names.b) names.b = room.rivalName || 'CPU';
    return names;
  }

  _broadcast(room, now) {
    this._maybeScore(room);
    const names = this._names(room);
    room.clients.forEach(c => {
      if (!c.color) return;
      const st = room.game.serialize(c.color, now);
      st.names = names;
      st.ranks = room.ranks || null;
      this._send(c, st);
    });
  }

  tick(now) {
    for (const room of this.rooms.values()) {
      if (room.clients.length === 0) { this._deleteRoom(room); continue; }
      if (room.paused) continue;
      if (room.game.phase === 'lobby') continue;
      room.game.tick(now);
      this._broadcast(room, now);
    }
  }

  stats() { return { queue: this.queue.length, rooms: this.rooms.size, private: this.privateWaiting.size }; }
}

module.exports = { Lobby, normalizeCode, genCode };
