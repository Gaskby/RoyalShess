/* RoyalShess - registro de visitas
   Cuenta personas distintas (por token) y a que hora entraron.
   No guarda nada sensible: solo token, nombre visible y marcas de tiempo.
   Se consulta en /admin/visitas?key=CLAVE — la clave sale por consola
   al arrancar y se guarda en admin-key.txt. Nada de esto se ve en el juego. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { disc } = require('./stats.js');

const FILE = path.join(__dirname, 'visits.json');
const KEYFILE = path.join(__dirname, 'admin-key.txt');
const REVISIT_MS = 30 * 60 * 1000; // reconexiones dentro de 30 min no cuentan como visita nueva
const LOG_MAX = 2000;

let data = { tokens: {}, log: [] };
try { data = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (_e) {}
if (!data.tokens) data.tokens = {};
if (!data.log) data.log = [];

let saveTimer = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try { fs.writeFileSync(FILE, JSON.stringify(data)); } catch (_e) {}
  }, 300);
}

// clave de acceso: variable de entorno ADMIN_KEY o una aleatoria persistida en admin-key.txt
let KEY = process.env.ADMIN_KEY || '';
if (!KEY) {
  try { KEY = fs.readFileSync(KEYFILE, 'utf8').trim(); } catch (_e) {}
  if (!KEY) {
    KEY = crypto.randomBytes(9).toString('base64url');
    try { fs.writeFileSync(KEYFILE, KEY); } catch (_e) {}
  }
}

function adminKey() { return KEY; }

// registra una entrada; se llama cuando un cliente se identifica por WebSocket
function record(token, name) {
  if (!token) return;
  const now = Date.now();
  let v = data.tokens[token];
  if (!v) v = data.tokens[token] = { first: now, last: 0, visits: 0, name: '' };
  if (name) v.name = name;
  if (now - v.last > REVISIT_MS) {
    v.visits++;
    data.log.push({ at: now, id: disc(token), name: name || '' });
    if (data.log.length > LOG_MAX) data.log = data.log.slice(-LOG_MAX);
  }
  v.last = now;
  save();
}

// pagina simple con el resumen; las horas se formatean en el navegador del que la mira
function pageHTML() {
  const tokens = Object.values(data.tokens);
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const uniqTotal = tokens.length;
  const uniq24h = tokens.filter(v => now - v.last < day).length;
  const uniq7d = tokens.filter(v => now - v.last < 7 * day).length;
  const rows = data.log.slice(-300).reverse();
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="robots" content="noindex,nofollow"><title>Visitas</title>
<style>
  body{font-family:system-ui,sans-serif;background:#101613;color:#e6efe9;margin:0;padding:24px;max-width:720px;margin-inline:auto}
  h1{font-size:20px} .cards{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}
  .card{background:#1a241e;border:1px solid #2c3a31;border-radius:10px;padding:12px 18px}
  .card b{display:block;font-size:26px} .card span{font-size:12px;opacity:.7}
  table{width:100%;border-collapse:collapse;font-size:14px}
  td,th{padding:6px 10px;border-bottom:1px solid #2c3a31;text-align:left}
  th{opacity:.6;font-weight:600;font-size:12px}
</style></head><body>
<h1>RoyalShess — visitas</h1>
<div class="cards">
  <div class="card"><b>${uniqTotal}</b><span>personas distintas (total)</span></div>
  <div class="card"><b>${uniq24h}</b><span>últimas 24 h</span></div>
  <div class="card"><b>${uniq7d}</b><span>últimos 7 días</span></div>
</div>
<table><thead><tr><th>Cuándo</th><th>Quién</th></tr></thead><tbody>
${rows.map(r => `<tr><td data-at="${r.at}"></td><td>${esc(r.name) || 'anónimo'}#${r.id}</td></tr>`).join('')}
</tbody></table>
<script>
  for (const td of document.querySelectorAll('td[data-at]'))
    td.textContent = new Date(+td.dataset.at).toLocaleString();
</script>
</body></html>`;
}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

module.exports = { record, adminKey, pageHTML };
