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
      case 'queue':  lobby.enqueue(client); break;        // buscar rival online
      case 'cpu':    lobby.startCPU(client); break;        // jugar vs CPU
      case 'create': lobby.createPrivate(client, m.code); break; // crear sala privada
      case 'join':   lobby.joinPrivate(client, m.code); break;   // unirse con código
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
