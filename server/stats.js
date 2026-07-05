/* ============================================================================
   RoyalShess — ESTADÍSTICAS Y CLASIFICACIÓN (opción ligera)
   ----------------------------------------------------------------------------
   Identidad: el cliente manda un token aleatorio (UUID en su localStorage).
   Las estadísticas viven asociadas al TOKEN; el nombre es solo cómo te
   muestras (dos "GAKS" se distinguen por su discriminador: GAKS#4821).
   Persistencia: server/players.json (se carga al arrancar, se guarda al
   cambiar). Rating: Elo clásico, K=32, inicio en 1000.
   Solo puntúan las partidas públicas de "Buscar partida" (ni CPU ni salas
   privadas: sus reglas personalizables distorsionarían el Elo).
   ============================================================================ */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'players.json');
const START_ELO = 1000;
const K = 32;

let players = {};
try { players = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (_e) { players = {}; }

let saveTimer = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try { fs.writeFileSync(FILE, JSON.stringify(players)); } catch (_e) {}
  }, 300);
}

// discriminador estable de 4 dígitos derivado del token (GAKS#4821)
function disc(token) {
  let h = 0;
  for (let i = 0; i < token.length; i++) h = (h * 31 + token.charCodeAt(i)) >>> 0;
  return String(1000 + (h % 9000));
}

// asegura el registro del token y refresca su nombre visible
function touch(token, name) {
  if (!token) return null;
  let p = players[token];
  if (!p) { p = players[token] = { name: '', elo: START_ELO, wins: 0, losses: 0, draws: 0, games: 0 }; save(); }
  if (name != null && name !== p.name) { p.name = name; save(); }
  return p;
}

// scoreA: 1 = gana A, 0 = pierde A, 0.5 = tablas
function applyResult(tokenA, tokenB, scoreA) {
  if (!tokenA || !tokenB || tokenA === tokenB) return;
  const A = touch(tokenA), B = touch(tokenB);
  const ea = 1 / (1 + Math.pow(10, (B.elo - A.elo) / 400));
  A.elo = Math.round(A.elo + K * (scoreA - ea));
  B.elo = Math.round(B.elo + K * ((1 - scoreA) - (1 - ea)));
  A.games++; B.games++;
  if (scoreA === 1) { A.wins++; B.losses++; }
  else if (scoreA === 0) { A.losses++; B.wins++; }
  else { A.draws++; B.draws++; }
  save();
}

// posición global: cuántos (con partidas) tienen más Elo, +1
function rankOf(token) {
  const p = token && players[token];
  if (!p || !p.games) return null;
  let r = 1;
  for (const t in players) { const q = players[t]; if (q.games && q.elo > p.elo) r++; }
  return r;
}

function top(n) {
  return Object.keys(players)
    .filter(t => players[t].games > 0)
    .sort((a, b) => players[b].elo - players[a].elo)
    .slice(0, n)
    .map((t, i) => {
      const p = players[t];
      return { rank: i + 1, name: p.name, disc: disc(t), elo: p.elo, wins: p.wins, losses: p.losses, draws: p.draws };
    });
}

function me(token) {
  const p = token && players[token];
  if (!p || !p.games) return null;
  return { rank: rankOf(token), name: p.name, disc: disc(token), elo: p.elo, wins: p.wins, losses: p.losses, draws: p.draws };
}

module.exports = { touch, applyResult, rankOf, top, me, disc };
