
/* RoyalShess - repeticiones y su reproductor
   ---------------------------------------------------------------------
   Vive aparte de client.js porque es una ISLA: tiene su propio tablero
   (#rpBoard), su propio estado y su propio bucle de fotogramas, y no
   comparte NADA con la partida en vivo. Mezclado ahi dentro solo servia
   para engordar el archivo.

   Que guarda: el servidor manda la cinta completa una vez al terminar
   (`replay-data`), solo coordenadas + tiempos. El tablero se reconstruye
   aplicandolas en orden con el mismo motor de reglas del juego, asi que la
   cinta ocupa nada y no puede desincronizarse de las reglas.

   Como habla con el cliente: por INYECCION, no por variables globales. El
   cliente le pasa en init() las cuatro cosas que este modulo no puede
   saber por si mismo (cambiar de pantalla, sonar, desbloquear el audio,
   como se dibuja una pieza y si la partida sigue abierta). Asi el
   reproductor no toca ni una global de client.js y se puede probar solo. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RSReplay = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tr = (k) => window.RSI18N.t(k);

  const STORE_KEY = 'rs-replays';
  const STORE_MAX = 10;
  const SPEEDS = [1, 2, 4];
  // botonera: id -> clave del texto que sale al pasar el raton
  const BTN_KEYS = [
    ['rpRestart', 'replay.ctrl.restart'], ['rpPrev', 'replay.ctrl.prev'],
    ['rpPlay',    'replay.ctrl.play'],    ['rpNext', 'replay.ctrl.next'],
    ['rpSpeed',   'replay.ctrl.speed'],
  ];

  // --- lo que el modulo necesita del cliente ------------------------------
  // Arrancan en vacio para que stop() sea seguro aunque showScreen() se
  // llame antes de init(): el cliente enruta pantallas desde que carga
  let host = {
    showScreen:  () => {},
    sfx:         () => {},
    ensureAudio: () => {},
    glyph:       {},
    isMatchOver: () => false,
  };
  let E = null;   // el motor de reglas, resuelto en init()

  let lastTape = null;    // cinta de la ultima partida de ESTA sesion
  let rp = null;          // { rep, board, els, t, idx, playing, speed, spdIdx, raf, last }
  let cameFrom = 'replays';   // desde donde se abrio, para que Volver regrese ahi

  // ---- la estanteria: las cintas guardadas en este navegador -------------
  function loadAll(){
    try { const l = JSON.parse(localStorage.getItem(STORE_KEY)); return Array.isArray(l) ? l : []; }
    catch(_e){ return []; }
  }
  function store(msg){
    lastTape = { d: Date.now(), you: msg.you, names: msg.names || {}, winner: msg.winner,
                 reason: msg.reason, matchMs: msg.matchMs, moves: msg.moves || [] };
    if (!lastTape.moves.length){ lastTape = null; return; }
    try {
      const list = loadAll();
      list.unshift(lastTape);
      localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, STORE_MAX)));
    } catch(_e){ /* almacenamiento lleno o bloqueado: la cinta vive solo en memoria */ }
  }
  const nameOf = (rep, side) => (rep.names && rep.names[side]) || tr(side === 'w' ? 'card.white' : 'card.black');
  const movesTxt = (n) => n === 1 ? tr('replay.moves1') : tr('replay.moves').replace('{n}', n);

  function renderList(){
    const list = $('replayList');
    list.innerHTML = '';
    const reps = loadAll();
    if (!reps.length){
      list.innerHTML = `<div class="help-item">${esc(tr('replay.empty'))}</div>`;
      return;
    }
    for (const rep of reps){
      const res = rep.winner === 'draw' ? 'draw' : (rep.winner === rep.you ? 'win' : 'lose');
      const when = new Date(rep.d);
      const whenTxt = when.toLocaleDateString(undefined, { day:'2-digit', month:'2-digit' }) +
        ' · ' + when.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
      const row = document.createElement('div');
      row.className = 'replay-row';
      row.innerHTML =
        `<span class="rr-res ${res}">${esc(tr('replay.' + res))}</span>` +
        `<span class="rr-names"><b>${esc(nameOf(rep,'w'))}</b> vs <b>${esc(nameOf(rep,'b'))}</b></span>` +
        `<span class="rr-meta">${esc(whenTxt)}<br>${esc(movesTxt(rep.moves.length))}</span>`;
      row.addEventListener('click', () => open(rep, 'replays'));
      list.appendChild(row);
    }
  }

  // ---- el reproductor: tablero propio, aislado del juego real ------------
  const disp = (r, c) => (rp && rp.rep.you === 'b') ? { dr:7-r, dc:7-c } : { dr:r, dc:c };

  function buildBoard(){
    const sqs = $('rpSqs');
    if (sqs.childElementCount) return;
    for (let r=0; r<8; r++) for (let c=0; c<8; c++){
      const d = document.createElement('div');
      d.className = 'dsq ' + ((r+c)%2 ? 'd' : 'l');
      d.style.left = c*12.5 + '%'; d.style.top = r*12.5 + '%';
      sqs.appendChild(d);
    }
  }
  // duracion de la cinta: si acabo por tiempo, el reloj completo; si no,
  // la ultima jugada mas un respiro para ver como quedo el tablero
  function duration(){
    const mvs = rp.rep.moves;
    const end = mvs.length ? mvs[mvs.length-1][4] : 0;
    return rp.rep.reason === 'time' ? (rp.rep.matchMs || end + 1200) : end + 1200;
  }
  // avanza UNA jugada sobre el tablero puro (sin DOM): mueve, corona y enroca.
  // Las capturas son implicitas: la pieza destino simplemente desaparece.
  // Ojo con los nombres: aqui `toR`/`toC` son la casilla destino. En client.js
  // esto se llamaba `tr`, que tapaba al `tr()` de las traducciones
  function step(b, mv){
    const [fr, fc, toR, toC] = mv;
    const p = b[fr][fc];
    if (!p) return null;
    const victim = b[toR][toC] || null;
    b[toR][toC] = p; b[fr][fc] = null;
    if (p.type === 'p' && (toR === 0 || toR === 7)) p.type = 'q';
    let rook = null, rookC = 0;
    if (p.type === 'k' && Math.abs(toC - fc) === 2){
      const rfc = toC > fc ? 7 : 0; rookC = toC > fc ? 5 : 3;
      rook = b[fr][rfc];
      if (rook){ b[fr][rookC] = rook; b[fr][rfc] = null; }
    }
    return { p, victim, rook, rookR: fr, rookC };
  }
  function place(piece, r, c){
    let el = rp.els.get(piece.id);
    if (!el){
      el = document.createElement('div');
      el.className = 'rp-piece ' + piece.color;
      $('rpPieces').appendChild(el);
      rp.els.set(piece.id, el);
    }
    el.textContent = host.glyph[piece.type];
    const d = disp(r, c);
    el.style.transform = `translate(${d.dc*100}%, ${d.dr*100}%)`;
  }
  function marks(mv){
    const wrap = $('rpMarks');
    wrap.innerHTML = '';
    if (!mv) return;
    for (const [r, c] of [[mv[0], mv[1]], [mv[2], mv[3]]]){
      const d = disp(r, c);
      const m = document.createElement('div');
      m.className = 'rp-mark';
      m.style.left = d.dc*12.5 + '%'; m.style.top = d.dr*12.5 + '%';
      wrap.appendChild(m);
    }
  }
  // aplica la siguiente jugada CON animacion: deslizamiento, captura y sonido
  function applyMove(mv){
    const res = step(rp.board, mv);
    if (!res) return;
    if (res.victim){
      const ve = rp.els.get(res.victim.id);
      if (ve){ rp.els.delete(res.victim.id); ve.classList.add('dead'); setTimeout(() => ve.remove(), 220); }
    }
    place(res.p, mv[2], mv[3]);
    if (res.rook) place(res.rook, res.rookR, res.rookC);
    marks(mv);
    host.sfx(res.victim ? 'cap' : 'move');
  }
  // reconstruye el tablero desde cero hasta rp.idx (para saltos y retrocesos)
  function rebuild(){
    rp.board = E.newBoard().board;
    const mvs = rp.rep.moves;
    for (let i = 0; i < rp.idx; i++) step(rp.board, mvs[i]);
    $('rpPieces').innerHTML = '';
    rp.els = new Map();
    for (let r=0; r<8; r++) for (let c=0; c<8; c++){
      const p = rp.board[r][c];
      if (p) place(p, r, c);
    }
    marks(rp.idx > 0 ? mvs[rp.idx-1] : null);
  }
  function hud(){
    if (!rp) return;
    const dur = duration();
    const done = rp.t >= dur;
    const remain = Math.max(0, (rp.rep.matchMs || dur) - rp.t);
    const s = Math.ceil(remain/1000);
    $('rpClock').textContent = done ? tr('replay.end') : `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
    $('rpCount').textContent = rp.idx + '/' + rp.rep.moves.length;
    $('rpFill').style.width = (100 * Math.min(1, rp.t / dur)).toFixed(2) + '%';
    // el boton grande cuenta el estado con la forma: el triangulo se abre en
    // dos barras al reproducir y se enrosca en flecha circular al terminar.
    // RSIcons.set corta solo si ya esta en ese icono, asi que llamarlo por
    // fotograma no cuesta nada
    RSIcons.set($('rpPlay'), rp.playing ? 'pause' : (done ? 'replay' : 'play'));
  }
  function tick(ts){
    if (!rp || !rp.playing) return;
    const dt = ts - (rp.last || ts);
    rp.last = ts;
    rp.t += dt * rp.speed;
    const mvs = rp.rep.moves;
    while (rp.idx < mvs.length && mvs[rp.idx][4] <= rp.t){ applyMove(mvs[rp.idx]); rp.idx++; }
    if (rp.t >= duration()){ rp.t = duration(); rp.playing = false; hud(); return; }
    hud();
    rp.raf = requestAnimationFrame(tick);
  }
  function setPlaying(on){
    if (!rp) return;
    cancelAnimationFrame(rp.raf);   // SIEMPRE: nunca dos bucles a la vez
    rp.playing = on;
    if (on){ rp.last = 0; rp.raf = requestAnimationFrame(tick); }
    hud();
  }
  function seekTime(t){
    if (!rp) return;
    rp.t = Math.max(0, Math.min(duration(), t));
    const mvs = rp.rep.moves;
    let idx = 0;
    while (idx < mvs.length && mvs[idx][4] <= rp.t) idx++;
    rp.idx = idx;
    rebuild();
    hud();
  }

  function open(rep, cameFromScreen){
    if (!rep || !rep.moves || !rep.moves.length) return;
    host.ensureAudio();
    cameFrom = cameFromScreen || 'result';
    buildBoard();
    rp = { rep, board:null, els:new Map(), t:0, idx:0, playing:false, speed:SPEEDS[0], spdIdx:0, raf:0, last:0 };
    $('rpHead').innerHTML =
      `<b class="w">${esc(nameOf(rep,'w'))}</b><span>vs</span><b class="b">${esc(nameOf(rep,'b'))}</b>`;
    RSIcons.text($('rpSpeed'), '×' + SPEEDS[0]);
    rebuild();
    host.showScreen('replay');
    setPlaying(true);   // la cinta arranca sola
  }
  function stop(){
    if (!rp) return;
    cancelAnimationFrame(rp.raf);
    rp = null;
    $('rpPieces').innerHTML = '';
    $('rpMarks').innerHTML = '';
  }
  // Volver desde el reproductor: a la lista o al resultado, segun de donde vino
  function back(){
    if (cameFrom === 'result' && host.isMatchOver()) host.showScreen('result');
    else if (cameFrom === 'replays'){ renderList(); host.showScreen('replays'); }
    else host.showScreen('menu');
  }
  // al cambiar de idioma solo se retraduce el texto de ayuda: el icono se queda
  function retitle(){
    BTN_KEYS.forEach(([id, key]) => {
      const b = $(id);
      if (!b) return;
      b.title = tr(key);
      b.setAttribute('aria-label', tr(key));
    });
  }

  // ---- arranque -----------------------------------------------------------
  function init(deps){
    host = Object.assign(host, deps || {});
    E = window.RSEngine;
    // la botonera se pinta aqui, no en client.js: es del reproductor
    RSIcons.btn($('rpRestart'), 'skipBack', '');
    RSIcons.btn($('rpPrev'),    'prev', '');
    RSIcons.btn($('rpPlay'),    'play', '');
    RSIcons.btn($('rpNext'),    'next', '');
    RSIcons.btn($('rpSpeed'),   'speed', '×1');

    // las repeticiones cuelgan de ajustes, asi que volver lleva ahi, no al menu
    $('btnReplays').addEventListener('click', () => { renderList(); host.showScreen('replays'); });
    $('btnReplaysBack').addEventListener('click', () => host.showScreen('settings'));
    $('btnWatch').addEventListener('click', () => open(lastTape, 'result'));
    $('btnReplayBack').addEventListener('click', back);
    $('rpPlay').addEventListener('click', () => {
      if (!rp) return;
      host.ensureAudio();
      if (!rp.playing && rp.t >= duration()) seekTime(0);   // la flecha circular vuelve a empezar
      setPlaying(!rp.playing);
    });
    $('rpRestart').addEventListener('click', () => {
      if (!rp) return;
      const was = rp.playing;
      setPlaying(false);
      seekTime(0);
      setPlaying(was);
    });
    $('rpPrev').addEventListener('click', () => {
      if (!rp) return;
      setPlaying(false);
      rp.idx = Math.max(0, rp.idx - 1);
      rp.t = rp.idx > 0 ? rp.rep.moves[rp.idx-1][4] : 0;
      rebuild(); hud();
    });
    $('rpNext').addEventListener('click', () => {
      if (!rp) return;
      setPlaying(false);
      const mvs = rp.rep.moves;
      if (rp.idx < mvs.length){ applyMove(mvs[rp.idx]); rp.idx++; rp.t = mvs[rp.idx-1][4]; }
      hud();
    });
    $('rpSpeed').addEventListener('click', () => {
      if (!rp) return;
      rp.spdIdx = (rp.spdIdx + 1) % SPEEDS.length;
      rp.speed = SPEEDS[rp.spdIdx];
      RSIcons.text($('rpSpeed'), '×' + rp.speed);
    });
    $('rpProgress').addEventListener('click', (e) => {
      if (!rp) return;
      const r = $('rpProgress').getBoundingClientRect();
      setPlaying(false);
      seekTime(((e.clientX - r.left) / r.width) * duration());
    });
  }

  return {
    init,
    store,                          // llega una cinta nueva del servidor
    renderList,                     // pinta la estanteria
    openLast: () => open(lastTape, 'result'),
    hasLast:  () => !!lastTape,     // ¿enseñamos «Ver repeticion» en el resultado?
    clearLast: () => { lastTape = null; },   // empieza otra partida: la anterior ya no es «esta»
    stop, back, retitle,
  };
});
