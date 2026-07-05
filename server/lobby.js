/* ============================================================================
   RoyalShess — LOBBY (emparejamiento + salas)  · Fase 3 + salas privadas
   ----------------------------------------------------------------------------
   Modos de entrar a una partida:
     - enqueue(): cola pública, empareja con quien sea.
     - startCPU(): práctica contra la máquina.
     - createPrivate(code): crea una sala con código/contraseña y espera.
     - joinPrivate(code): entra a la sala privada de ese código.

   Un cliente es: { id, color, roomId, send(obj) }
   ============================================================================ */
const { Game } = require('./game.js');

function normalizeCode(x) { return String(x || '').trim().toUpperCase().slice(0, 12); }

// ajustes de partida que puede elegir quien crea una sala privada (lista blanca + límites)
const PIECE_TYPES = ['p', 'n', 'b', 'r', 'q', 'k'];
function cleanSettings(o) {
  if (!o || typeof o !== 'object') return null;
  const num = (v, min, max) => { v = +v; return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : null; };
  const s = {};
  const m  = num(o.minutes, 1, 10); if (m  != null) s.minutes = Math.round(m);
  const st = num(o.start,   0, 10); if (st != null) s.start = Math.round(st);
  const rg = num(o.regen,   1, 10); if (rg != null) s.regenSecondsPerPoint = rg;
  // coste de mover por pieza (enteros 0..20)
  if (o.costs && typeof o.costs === 'object') {
    const costs = {};
    for (const t of PIECE_TYPES) { const v = num(o.costs[t], 0, 20); if (v != null) costs[t] = Math.round(v); }
    if (Object.keys(costs).length) s.moveCost = costs;
  }
  // energía al comer cada pieza (0..10, media unidad; el rey no aplica)
  if (o.refunds && typeof o.refunds === 'object') {
    const refunds = {};
    for (const t of PIECE_TYPES) { const v = num(o.refunds[t], 0, 10); if (v != null) refunds[t] = Math.round(v * 2) / 2; }
    if (Object.keys(refunds).length) s.refunds = refunds;
  }
  return Object.keys(s).length ? s : null;
}
function genCode() {
  const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // sin caracteres ambiguos
  let s = ''; for (let i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

class Lobby {
  constructor() {
    this.queue = [];               // clientes esperando rival público
    this.rooms = new Map();        // roomId -> room
    this.privateWaiting = new Map();// code -> room (privadas esperando 2º jugador)
    this.roomSeq = 1;
  }

  _send(client, obj) { try { client.send(obj); } catch (_e) {} }
  toLobby(client) { client.roomId = null; client.color = null; this._send(client, { t: 'lobby' }); }

  _makeRoom(vsCPU, opts = {}) {
    const id = this.roomSeq++;
    const room = { id, game: new Game({ vsCPU, settings: opts.settings }), clients: [], code: opts.code || null, private: !!opts.private };
    this.rooms.set(id, room);
    return room;
  }
  _deleteRoom(room) {
    this.rooms.delete(room.id);
    if (room.code && this.privateWaiting.get(room.code) === room) this.privateWaiting.delete(room.code);
  }

  _detach(client) {   // saca al cliente de una sala YA TERMINADA
    const room = client.roomId != null ? this.rooms.get(client.roomId) : null;
    if (room && room.game.phase === 'over') {
      room.clients = room.clients.filter(c => c !== client);
      if (room.clients.length === 0) this._deleteRoom(room);
      client.roomId = null; client.color = null;
    }
  }
  _removeFromQueue(client) { this.queue = this.queue.filter(c => c !== client); }

  // arranca la partida entre los 2 clientes de la sala (colores al azar + cuenta atrás)
  _beginMatch(room) {
    const colors = Math.random() < 0.5 ? ['w', 'b'] : ['b', 'w'];
    room.clients[0].color = colors[0];
    room.clients[1].color = colors[1];
    room.game.beginCountdown(Date.now());
    this._broadcast(room, Date.now());
  }

  // ---------------- pública ----------------
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

  // ---------------- CPU ----------------
  startCPU(client) {
    this._detach(client);
    if (client.roomId != null) return;
    this._removeFromQueue(client);
    const room = this._makeRoom(true);
    room.clients.push(client);
    client.color = 'w'; client.roomId = room.id;
    room.game.beginCountdown(Date.now());
    this._broadcast(room, Date.now());
  }

  // ---------------- privada: crear ----------------
  createPrivate(client, rawCode, rawOpts) {
    this._detach(client);
    if (client.roomId != null) { this._send(client, { t: 'reject', reason: 'ya-en-sala' }); return; }
    let code = normalizeCode(rawCode);
    if (!code) code = genCode();                     // si no escriben nada, generamos uno
    if (this.privateWaiting.has(code)) { this._send(client, { t: 'reject', reason: 'codigo-en-uso' }); return; }
    this._removeFromQueue(client);
    const room = this._makeRoom(false, { code, private: true, settings: cleanSettings(rawOpts) });
    room.clients.push(client);
    client.roomId = room.id;                          // color se asigna al emparejar
    this.privateWaiting.set(code, room);
    this._send(client, { t: 'created', code });       // el host espera; comparte el código
  }

  // ---------------- privada: unirse ----------------
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
    this.privateWaiting.delete(code);                 // ya no espera a nadie
    this._beginMatch(room);
  }

  cancel(client) { this._removeFromQueue(client); this.toLobby(client); }

  handleMove(client, from, to) {
    const room = client.roomId != null ? this.rooms.get(client.roomId) : null;
    if (!room) return;
    const now = Date.now();
    const res = room.game.applyMove(client.color, from[0], from[1], to[0], to[1], now);
    if (!res.ok) { this._send(client, { t: 'reject', reason: res.reason }); return; }
    if (res.toll) this._send(client, { t: 'toll', toll: res.toll });   // aviso: pagó peaje de torre
    this._broadcast(room, now);
  }

  _handleExit(client, isDisconnect) {
    this._removeFromQueue(client);
    const room = client.roomId != null ? this.rooms.get(client.roomId) : null;
    if (room) {
      // si era PvP y estaba en juego/cuenta atrás, el rival gana por abandono
      if (!room.game.vsCPU && (room.game.phase === 'live' || room.game.phase === 'countdown')) {
        room.game.abandon(client.color === 'w' ? 'b' : 'w');
      }
      room.clients = room.clients.filter(c => c !== client);
      if (room.clients.length === 0) this._deleteRoom(room);
      else this._broadcast(room, Date.now());
    }
    if (!isDisconnect) this.toLobby(client);
  }
  leave(client) { this._handleExit(client, false); }        // volver al menú
  disconnect(client) { this._handleExit(client, true); }    // se cayó el socket

  _names(room) {
    const names = { w: null, b: null };
    for (const c of room.clients) if (c.color) names[c.color] = c.name || null;
    if (room.game.vsCPU && !names.b) names.b = 'CPU';
    return names;
  }

  _broadcast(room, now) {
    const names = this._names(room);
    room.clients.forEach(c => {
      if (!c.color) return;
      const st = room.game.serialize(c.color, now);
      st.names = names;
      this._send(c, st);
    });
  }

  tick(now) {
    for (const room of this.rooms.values()) {
      if (room.clients.length === 0) { this._deleteRoom(room); continue; }
      if (room.game.phase === 'lobby') continue;   // sala privada esperando: nada que difundir
      room.game.tick(now);
      this._broadcast(room, now);
    }
  }

  stats() { return { queue: this.queue.length, rooms: this.rooms.size, private: this.privateWaiting.size }; }
}

module.exports = { Lobby, normalizeCode, genCode };
