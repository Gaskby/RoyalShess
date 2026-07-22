/* RoyalShess - servidor
   Express sirve el cliente y el WebSocket lleva el tiempo real.
   La logica de colas y salas vive en lobby.js. */
const path = require('path');
const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const { Lobby } = require('./lobby.js');
const stats = require('./stats.js');
const visits = require('./visits.js');
const CONFIG = require('../public/config.js');

const PORT = process.env.PORT || CONFIG.server.port;
const TICK_HZ = CONFIG.server.tickHz;
const MSG_PER_SEC = CONFIG.server.msgPerSec || 25;
const MSG_BURST = Math.max(12, MSG_PER_SEC * 2);

const app = express();
app.use(express.static(path.join(__dirname, '..', 'public')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const lobby = new Lobby();

app.get('/health', (_req, res) => res.json({ ok: true, ...lobby.stats() }));

// registro de visitas privado; con clave mala responde 404 como si no existiera
app.get('/admin/visitas', (req, res) => {
  if (req.query.key !== visits.adminKey()) return res.status(404).send('Not found');
  res.send(visits.pageHTML());
});

let clientSeq = 1;

// nombre visible sin caracteres de control y con tope de largo
function cleanName(x) { let out = ''; for (const ch of String(x || '')) if (ch.charCodeAt(0) >= 32) out += ch; return out.trim().slice(0, 14); }
// token de identidad solo con formato seguro
function cleanToken(x) { x = String(x || ''); return /^[A-Za-z0-9-]{8,64}$/.test(x) ? x : null; }

wss.on('connection', (ws) => {
  const client = {
    id: clientSeq++,
    color: null,
    roomId: null,
    send(obj) { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj)); },
  };
  ws._client = client;
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  // antiinundacion con cubo de fichas por conexion
  ws._tokens = MSG_BURST; ws._lastRefill = Date.now(); ws._floods = 0;

  ws.on('message', (raw) => {
    if (raw.length > 2048) return;
    const now = Date.now();
    ws._tokens = Math.min(MSG_BURST, ws._tokens + (now - ws._lastRefill) / 1000 * MSG_PER_SEC);
    ws._lastRefill = now;
    if (ws._tokens < 1) {
      if (++ws._floods > 400) { try { ws.close(); } catch (_e) {} }
      return;
    }
    ws._tokens -= 1;

    let m; try { m = JSON.parse(raw); } catch (_e) { return; }
    switch (m.t) {
      case 'name':
        client.name = cleanName(m.name);
        client.token = cleanToken(m.token);
        if (client.token) { stats.touch(client.token, client.name); visits.record(client.token, client.name); lobby.tryReconnect(client); }
        break;
      case 'top':
        client.send({ t: 'top', rows: stats.top(20), me: stats.me(client.token) });
        break;
      case 'queue':  lobby.enqueue(client); break;
      case 'cpu':    lobby.startCPU(client); break;
      case 'ladder': lobby.startLadder(client, m.idx, m.loop); break;
      case 'create': lobby.createPrivate(client, m.code, m.opts); break;
      case 'join':   lobby.joinPrivate(client, m.code); break;
      case 'rematch': lobby.rematch(client); break;
      case 'cancel': lobby.cancel(client); break;
      case 'leave':  lobby.leave(client); break;
      case 'move':
        if (Array.isArray(m.from) && Array.isArray(m.to)) lobby.handleMove(client, m.from, m.to);
        break;
    }
  });

  ws.on('close', () => lobby.disconnect(client));

  client.send({ t: 'welcome' });
});

// bucle global que avanza partidas y reparte estado
setInterval(() => lobby.tick(Date.now()), Math.round(1000 / TICK_HZ));

// heartbeat que descarta sockets muertos
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) { lobby.disconnect(ws._client); return ws.terminate(); }
    ws.isAlive = false;
    try { ws.ping(); } catch (_e) {}
  });
}, 30000);

server.listen(PORT, () => {
  console.log(`\n  RoyalShess escuchando en http://localhost:${PORT}`);
  console.log(`  Registro de visitas: http://localhost:${PORT}/admin/visitas?key=${visits.adminKey()}\n`);
});
