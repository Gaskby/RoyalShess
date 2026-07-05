/* ============================================================================
   RoyalShess — SERVIDOR (Fase 3: multijugador con emparejamiento)
   ----------------------------------------------------------------------------
   Express sirve el cliente; WebSocket lleva el tiempo real. Toda la lógica de
   colas/salas vive en lobby.js; aquí solo traducimos mensajes del socket.
   ============================================================================ */
const path = require('path');
const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const { Lobby } = require('./lobby.js');
const stats = require('./stats.js');
const CONFIG = require('../public/config.js');

const PORT = process.env.PORT || CONFIG.server.port;
const TICK_HZ = CONFIG.server.tickHz;

const app = express();
app.use(express.static(path.join(__dirname, '..', 'public')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const lobby = new Lobby();

app.get('/health', (_req, res) => res.json({ ok: true, ...lobby.stats() }));

let clientSeq = 1;

// nombre de jugador: sin caracteres de control, máx 14
function cleanName(x) { let out = ''; for (const ch of String(x || '')) if (ch.charCodeAt(0) >= 32) out += ch; return out.trim().slice(0, 14); }
// token de identidad (UUID del localStorage del cliente): solo formato seguro
function cleanToken(x) { x = String(x || ''); return /^[A-Za-z0-9-]{8,64}$/.test(x) ? x : null; }

wss.on('connection', (ws) => {
  // adaptador: envuelve el socket como "cliente" genérico para el lobby
  const client = {
    id: clientSeq++,
    color: null,
    roomId: null,
    send(obj) { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj)); },
  };
  ws._client = client;
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch (_e) { return; }
    switch (m.t) {
      case 'name':                                         // identidad: nombre + token
        client.name = cleanName(m.name);
        client.token = cleanToken(m.token);
        if (client.token) stats.touch(client.token, client.name);
        break;
      case 'top':                                          // clasificación (top + tu posición)
        client.send({ t: 'top', rows: stats.top(20), me: stats.me(client.token) });
        break;
      case 'queue':  lobby.enqueue(client); break;        // buscar rival online
      case 'cpu':    lobby.startCPU(client); break;        // jugar vs CPU
      case 'create': lobby.createPrivate(client, m.code, m.opts); break; // crear sala privada (con ajustes)
      case 'join':   lobby.joinPrivate(client, m.code); break;   // unirse con código
      case 'rematch': lobby.rematch(client); break;        // revancha en la misma sala
      case 'cancel': lobby.cancel(client); break;          // cancelar búsqueda/espera
      case 'leave':  lobby.leave(client); break;           // volver al menú
      case 'move':
        if (Array.isArray(m.from) && Array.isArray(m.to)) lobby.handleMove(client, m.from, m.to);
        break;
    }
  });

  ws.on('close', () => lobby.disconnect(client));

  client.send({ t: 'welcome' });   // muestra el menú
});

// bucle global: avanza partidas y reparte estado
setInterval(() => lobby.tick(Date.now()), Math.round(1000 / TICK_HZ));

// heartbeat: descarta sockets muertos
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) { lobby.disconnect(ws._client); return ws.terminate(); }
    ws.isAlive = false;
    try { ws.ping(); } catch (_e) {}
  });
}, 30000);

server.listen(PORT, () => {
  console.log(`\n  RoyalShess (Fase 3) escuchando en http://localhost:${PORT}\n`);
});
