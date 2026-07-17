/* RoyalShess CLIENTE Fase 3. Menú - Buscar partida online / vs CPU. Cliente tonto: pinta el estado. autoritativo del servidor, orienta el tablero según tu color y envía. intenciones t:move. Las reglas las decide el servidor. */
const E = window.RSEngine;
// \uFE0E = text presentation selector: forces iOS/Safari to draw the monochrome
// glyph which respects the CSS color instead of the default black emoji.
const VS = '\uFE0E';
const GLYPH = { p:'\u265F'+VS, n:'\u265E'+VS, b:'\u265D'+VS, r:'\u265C'+VS, q:'\u265B'+VS, k:'\u265A'+VS };
// idioma: todos los textos viven en i18n.js; trclave devuelve el texto actual
const I18N = window.RSI18N;
I18N.setLang(localStorage.getItem('rs-lang') || 'es');
const tr = (k) => I18N.t(k);
const pieceName = (k) => tr('piece.' + k);

let state = null;   // último snapshot
let you = 'w';            // tu color
let lastYou = null;   // para rehacer el tablero si cambia la orientación
let selected = null;   // r,c en coords de tablero
let drag = null;   // arrastre en curso r,c,id,el,lifted,sx,sy
let justDragged = false;   // evita que el click posterior a un arrastre reseleccione
let dragEnabled = localStorage.getItem('rs-drag') !== '0';  // opción del menú
let myName = localStorage.getItem('rs-name') || '';
// identidad ligera: token aleatorio generado una vez y guardado en localStorage.
// Las estadísticas del servidor viven atadas a este token, no al nombre.
let myToken = localStorage.getItem('rs-token');
if (!myToken){
  myToken = (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'tk-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  localStorage.setItem('rs-token', myToken);
}
let musicOn = localStorage.getItem('rs-music') !== '0';     // música lo-fi de fondo
let theme = localStorage.getItem('rs-theme') || 'neon';     // 'neon' | 'chesscom'
// escalera de leyendas: rivales vencidos hasta ahora y contra cual peleas
const RV = window.RSRivals;
let ladderProg = Math.max(0, parseInt(localStorage.getItem('rs-ladder') || '0', 10) || 0);
// nueva vuelta: 0 es la primera pasada; cada vuelta extra es modo pesadilla,
// con rivales mas rapidos y precisos y retratos poseidos por deep blue
let ladderLoop = Math.max(0, parseInt(localStorage.getItem('rs-ladder-loop') || '0', 10) || 0);
// campeon de pesadilla: vencer a toda la torre en una vuelta pesadilla
// desbloquea el tema TERMINAL CRT y la corona sobre tu nombre
let nightmareDone = localStorage.getItem('rs-nightmare-done') === '1';
let currentLadder = null;
// un rival esta poseido en pesadilla, salvo el propio jefe secreto que posee a los demas
const isPossessed = (r) => ladderLoop > 0 && !r.secret;
// aplica o quita el efecto poseido a un retrato. Cada uno parpadea a su aire:
// sortea uno de los 4 patrones de style.css, una duracion propia y un punto
// de arranque aleatorio del ciclo, para que la torre no parpadee al unisono.
// possessD respira suave, asi que va con curva en vez de cortes
const POSSESS_ANIMS = [
  ['possessA', 'steps(1,end)'],
  ['possessB', 'steps(1,end)'],
  ['possessC', 'steps(1,end)'],
  ['possessD', 'ease-in-out'],
];
function possessFx(el, on){
  el.classList.toggle('possessed', on);
  if (on){
    const [name, timing] = POSSESS_ANIMS[Math.floor(Math.random() * POSSESS_ANIMS.length)];
    el.style.animationName = name;
    el.style.animationTimingFunction = timing;
    el.style.animationDelay = (-Math.random() * 4).toFixed(2) + 's';
    el.style.animationDuration = (2 + Math.random() * 2.5).toFixed(2) + 's';
  } else {
    el.style.animationName = '';
    el.style.animationTimingFunction = '';
    el.style.animationDelay = '';
    el.style.animationDuration = '';
  }
}
let sfxOn = true, audioCtx = null;
let ws = null;
let prevPhase = null;

// DOM
const $ = (id) => document.getElementById(id);
const gridEl = $('grid'), piecesEl = $('pieces'), clockEl = $('clock'), boardWrap = $('boardWrap');
const toastEl = $('toast'), overlay = $('overlay'), countdownEl = $('countdown'), cdNum = $('cdNum');
const statusEl = $('status'), statusTxt = $('statusTxt');
const btnQueue = $('btnQueue'), btnCPU = $('btnCPU'), btnCancel = $('btnCancel'),
      btnAgain = $('btnAgain'), btnCPU2 = $('btnCPU2'), menuBtn = $('menuBtn'),
      btnFriend = $('btnFriend'), btnCreate = $('btnCreate'), btnJoin = $('btnJoin'),
      btnBack = $('btnBack'), btnCancelWait = $('btnCancelWait'),
      codeInput = $('codeInput'), codeErr = $('codeErr'), codeValue = $('codeValue'),
      nameInput = $('nameInput'), dragToggle = $('dragToggle'),
      btnRematch = $('btnRematch'), btnHelp = $('btnHelp'), btnHelpBack = $('btnHelpBack');
let curScreen = null;
let lastStatusKey = 'status.connecting';   // para re-traducir el estado al cambiar idioma
let menuEnabled = false;

// Orientación tu bando abajo
function toDisplay(r, c){ return you === 'b' ? { dr:7-r, dc:7-c } : { dr:r, dc:c }; }
function toBoard(dr, dc){ return you === 'b' ? { r:7-dr, c:7-dc } : { r:dr, c:dc }; }

function buildGrid(){
  gridEl.innerHTML = '';
  for (let dr=0; dr<8; dr++) for (let dc=0; dc<8; dc++){
    const sq = document.createElement('div');
    const { r, c } = toBoard(dr, dc);
    sq.className = 'sq ' + ((r+c)%2 ? 'dark' : 'light');
    sq.dataset.dr = dr; sq.dataset.dc = dc;
    if (dc===0 || dr===7){
      const co = document.createElement('span'); co.className='coord';
      co.textContent = (dr===7 ? String.fromCharCode(97+c) : (8-r));
      sq.appendChild(co);
    }
    sq.addEventListener('click', onSquareClick);
    gridEl.appendChild(sq);
  }
}
function displaySquareEl(dr, dc){ return gridEl.children[dr*8 + dc]; }

// Render
const pieceEls = new Map();
// efectos de derrota por pieza id -> cls 'topple'|'dissolve', delay ms.
// se aplican en cada render porque el className se reescribe entero
const pieceFx = new Map();
function render(){
  if (!state) return;
  if (you !== lastYou){ buildGrid(); lastYou = you; }   // rehacer si cambió tu color
  const bd = state.board;

  [...gridEl.children].forEach(sq => {
    sq.classList.remove('sel','lastmove','freecap','threat');
    [...sq.querySelectorAll('.hint,.rbeam')].forEach(h => h.remove());
  });
  drawRookLines(bd);

  // cupón de recaptura gratis: marca en dorado a la pieza que puedes comer sin coste
  if (state.freeCap){
    const d = toDisplay(state.freeCap.r, state.freeCap.c);
    displaySquareEl(d.dr, d.dc).classList.add('freecap');
  }

  const present = new Set();
  for (let r=0; r<8; r++) for (let c=0; c<8; c++){
    const p = bd[r][c]; if (!p) continue;
    present.add(p.id);
    let el = pieceEls.get(p.id);
    if (!el){
      el = document.createElement('div');
      el.className = 'piece ' + p.color + ' pop';
      el.appendChild(document.createElement('span'));   // el glifo vive en un span para animar su escala
      piecesEl.appendChild(el);
      pieceEls.set(p.id, el);
      setTimeout(() => el.classList.remove('pop'), 240);
    }
    el.firstChild.textContent = GLYPH[p.type];
    const isChecker = state.checkers && state.checkers.includes(p.id);   // pieza que da jaque a TU rey
    const fx = pieceFx.get(p.id);
    el.className = 'piece ' + p.color +
      ((drag && drag.lifted && drag.id === p.id) ? ' dragging' : '') +
      (isChecker ? ' checker' : '') +
      (fx ? ' ' + fx.cls : '');
    el.firstChild.style.animationDelay = (fx && fx.delay) ? fx.delay + 'ms' : '';
    const { dr, dc } = toDisplay(r, c);
    if (isChecker) displaySquareEl(dr, dc).classList.add('threat');      // y su casilla marcada
    // Si esta pieza se está arrastrando, no la recolocamos: la controla el puntero.
    if (!(drag && drag.lifted && drag.id === p.id)) el.style.transform = `translate(${dc*100}%, ${dr*100}%)`;
  }
  for (const [id, el] of pieceEls){
    if (!present.has(id)){
      const fx = pieceFx.get(id);
      if (fx && fx.cls === 'topple'){
        // el rey capturado no se desvanece: se tumba con su propia animacion
        el.classList.add('topple');
        pieceEls.delete(id);
        setTimeout(() => el.remove(), 1300);
      } else {
        el.classList.add('dead'); pieceEls.delete(id); setTimeout(()=>el.remove(),200);
      }
    }
  }

  if (state.lastMove){
    const a = toDisplay(state.lastMove.fr, state.lastMove.fc);
    const b = toDisplay(state.lastMove.tr, state.lastMove.tc);
    displaySquareEl(a.dr, a.dc).classList.add('lastmove');
    displaySquareEl(b.dr, b.dc).classList.add('lastmove');
  }

  if (selected && state.phase==='live'){
    const s = toDisplay(selected.r, selected.c);
    displaySquareEl(s.dr, s.dc).classList.add('sel');
    const p = bd[selected.r][selected.c];
    if (p && p.color === you){
      const surcharge = E.inCheck(bd, you) ? (window.RSConfig.energy.checkSurcharge) : 0;
      // en salas con ajustes propios el servidor manda sus costes
      const baseCost = (state.costs && state.costs[p.type] != null) ? state.costs[p.type] : E.MOVE_COST[p.type];
      const cost = baseCost + surcharge;
      const afford = state.energy[you] >= cost;
      for (const m of E.genMoves(bd, selected.r, selected.c)){
        const d = toDisplay(m.r, m.c);
        const h = document.createElement('div');
        h.className = 'hint' + (m.cap ? ' cap' : '') + (afford ? '' : ' poor');
        displaySquareEl(d.dr, d.dc).appendChild(h);
      }
    }
  }
  updateHUD();
}
// carriles de las torres: SOLO la dirección donde la torre tenga más de N casillas
// libres se activa ese tramo se dibuja y es el único donde cobra el peaje
function drawRookLines(bd){
  const rules = window.RSConfig.rules;
  const showLen = (rules && rules.rookLineLen != null) ? rules.rookLineLen : 4;
  for (let r=0; r<8; r++) for (let c=0; c<8; c++){
    const p = bd[r][c];
    if (!p || p.type !== 'r') continue;
    for (const [dr2, dc2] of [[-1,0],[1,0],[0,-1],[0,1]]){
      let run = 0, rr = r+dr2, cc = c+dc2;
      while (rr>=0 && rr<8 && cc>=0 && cc<8 && !bd[rr][cc]){ run++; rr+=dr2; cc+=dc2; }
      if (run <= showLen) continue;
      rr = r+dr2; cc = c+dc2;
      for (let i=0; i<run; i++){
        const d = toDisplay(rr, cc);
        const beam = document.createElement('div');
        beam.className = 'rbeam ' + (dr2 === 0 ? 'h' : 'v') + ' ' + p.color;
        displaySquareEl(d.dr, d.dc).appendChild(beam);
        rr+=dr2; cc+=dc2;
      }
    }
  }
}

function updateHUD(){
  if (!state || !state.energy) return;

  // Obtener energía máxima con protección antidivisión por cero
  const max = state.maxEnergy || (window.RSConfig && window.RSConfig.energy ? window.RSConfig.energy.max : 10);

  for (const side of ['w','b']){
    const val = state.energy[side];
    if (typeof val !== 'undefined') {
      // Calcular porcentaje exacto entre 0% y 100%
      const pct = Math.min(100, Math.max(0, (val / max) * 100));
      
      // Actualizar el ancho de la barra visual
      const fillEl = $('ef' + side.toUpperCase());
      if (fillEl) fillEl.style.width = pct + '%';
      
      // Actualizar el número de texto
      const numEl = $('en' + side.toUpperCase());
      if (numEl) {
        const v = Math.floor(val * 10) / 10;
        numEl.textContent = (v % 1 === 0) ? v : v.toFixed(1);
      }
    }
  }

  // Actualizar material y jaques
  $('matW').textContent = state.material.w;
  $('matB').textContent = state.material.b;
  $('cardW').classList.toggle('check', state.check.w);
  $('cardB').classList.toggle('check', state.check.b);
  boardWrap.classList.toggle('edge-w', state.check.w);
  boardWrap.classList.toggle('edge-b', state.check.b);
  // alarma fuerte cuando TU rey está en jaque: tablero en rojo pulsante
  boardWrap.classList.toggle('danger', state.phase === 'live' && !!state.check[you]);

  // Acomodar tarjetas: Tu color ABAJO, rival ARRIBA
  const myCard  = $(you === 'w' ? 'cardW' : 'cardB');
  const oppCard = $(you === 'w' ? 'cardB' : 'cardW');
  const sideBottom = $('sideBottom');
  const sideTop = $('sideTop');
  if (myCard && sideBottom && myCard.parentElement !== sideBottom) {
    sideBottom.appendChild(myCard);
  }
  if (oppCard && sideTop && oppCard.parentElement !== sideTop) {
    sideTop.appendChild(oppCard);
  }

  // Etiquetas de usuario y reloj nombre si lo hay; si no, TÚ / Rival / CPU
  const names = state.names || {};
  const ranks = state.ranks || {};
  const label = (side) => {
    let s = names[side] || (side === you ? tr('tag.you') : (state.vsCPU ? tr('tag.cpu') : tr('tag.rival')));
    if (ranks[side]) s += ' · #' + ranks[side];   // tu posición global tras el nombre
    return s;
  };
  $('tagW').textContent = '· ' + label('w');
  $('tagW').style.color = you==='w' ? 'var(--white-acc)' : 'var(--ink-dim)';
  $('tagB').textContent = '· ' + label('b');
  $('tagB').style.color = you==='b' ? 'var(--black-acc)' : 'var(--ink-dim)';
  // corona de campeon de pesadilla flotando sobre TU nombre, en cualquier modo.
  // secreto: si te llamas karina, la corona lleva sus iniciales grabadas
  for (const side of ['w','b']){
    const card = $(side === 'w' ? 'cardW' : 'cardB');
    let cr = card.querySelector('.crown');
    if (!cr){
      cr = document.createElement('span');
      cr.className = 'crown';
      card.querySelector('.pname').prepend(cr);
    }
    const mine = nightmareDone && side === you;
    cr.style.display = mine ? '' : 'none';
    if (mine){
      const kk = /^karina$/i.test((myName || '').trim());
      cr.innerHTML = '👑' + (kk ? '<b>KK</b>' : '');
    }
  }

  // foto del rival junto a su nombre, solo en la escalera de leyendas
  const rival = (currentLadder != null && state.vsCPU) ? RV.RIVALS[currentLadder] : null;
  for (const side of ['w','b']){
    const face = $(side === 'w' ? 'faceW' : 'faceB');
    if (rival && side !== you){
      face.src = rival.img || RV.DEFAULT_IMG;
      if (face.classList.contains('possessed') !== isPossessed(rival)) possessFx(face, isPossessed(rival));
      face.style.display = '';
    } else face.style.display = 'none';
  }
  
  const s = Math.max(0, Math.ceil(state.timeLeft/1000));
  clockEl.textContent = `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  clockEl.classList.toggle('low', s<=30 && state.phase==='live');
}

// Interacción - intención al servidor
function onSquareClick(e){
  if (justDragged){ justDragged = false; return; }   // ese clic venía de soltar un arrastre
  if (!state || state.phase!=='live') return;
  const dr = +e.currentTarget.dataset.dr, dc = +e.currentTarget.dataset.dc;
  const { r, c } = toBoard(dr, dc);
  const bd = state.board, p = bd[r][c];
  if (selected){
    const from = bd[selected.r][selected.c];
    if (from){
      const isDest = E.genMoves(bd, selected.r, selected.c).some(m => m.r===r && m.c===c);
      if (isDest){ sendMove(selected, {r,c}); selected=null; render(); return; }
    }
    if (p && p.color === you){ selected={r,c}; render(); return; }
    selected=null; render(); return;
  }
  if (p && p.color === you){ selected={r,c}; render(); }
}
function sendMove(from, to){ send({ t:'move', from:[from.r,from.c], to:[to.r,to.c] }); }
function send(obj){ if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj)); }
function sendName(){
  myName = (nameInput.value || '').trim().slice(0, 14);
  localStorage.setItem('rs-name', myName);
  send({ t:'name', name: myName, token: myToken });
}

// Arrastrar piezas drag & drop convive con el clic
function squareUnderPointer(x, y){
  const el = document.elementFromPoint(x, y);
  const sq = el && el.closest ? el.closest('.sq') : null;
  if (!sq || sq.parentElement !== gridEl) return null;
  return { dr:+sq.dataset.dr, dc:+sq.dataset.dc };
}
function onPointerDown(e){
  if (!dragEnabled) return;   // opción del menú desactivada
  if (e.button != null && e.button !== 0) return;   // solo botón principal
  if (!state || state.phase!=='live') return;
  const sq = e.target.closest && e.target.closest('.sq');
  if (!sq) return;
  const { r, c } = toBoard(+sq.dataset.dr, +sq.dataset.dc);
  const p = state.board[r][c];
  if (!p || p.color !== you) return;   // solo tus piezas
  e.preventDefault();
  justDragged = false;
  selected = { r, c };
  // la pieza se agarra AL INSTANTE: nada de umbrales ni esperar a mover
  drag = { r, c, id: p.id, el: pieceEls.get(p.id), lifted: true };
  if (drag.el) drag.el.classList.add('dragging');
  document.body.classList.add('grabbing');
  render();   // pistas no recoloca la pieza en drag
  positionDragEl(e);   // la pieza salta al cursor ya
}
function positionDragEl(e){
  if (!drag || !drag.el) return;
  const rect = piecesEl.getBoundingClientRect();
  const size = rect.width / 8;
  drag.el.style.transform = `translate(${e.clientX - rect.left - size/2}px, ${e.clientY - rect.top - size/2}px)`;
}
function onPointerMove(e){ positionDragEl(e); }
function onPointerUp(e){
  if (!drag) return;
  const d = drag; drag = null;
  document.body.classList.remove('grabbing');
  if (d.el) d.el.classList.remove('dragging');
  justDragged = true;
  setTimeout(() => { justDragged = false; }, 0);   // solo anula el clic de ESTE gesto
  settleAnim(d.id);   // animación de asentarse al soltar
  const at = squareUnderPointer(e.clientX, e.clientY);
  if (at){
    const { r, c } = toBoard(at.dr, at.dc);
    if (r === d.r && c === d.c){ render(); return; }   // soltó donde agarró: queda seleccionada
    if (E.genMoves(state.board, d.r, d.c).some(m => m.r===r && m.c===c)) sendMove({r:d.r,c:d.c}, {r,c});
  }
  selected = null;
  render();
}
// escala 1.28 - rebote - 1 sobre el span estilo inline: sobrevive a los re-render
function settleAnim(id){
  const el = pieceEls.get(id);
  if (!el || !el.firstChild) return;
  const s = el.firstChild;
  s.style.animation = 'none';
  void s.offsetWidth;   // reinicia la animación
  s.style.animation = 'settle .28s cubic-bezier(.3,1.5,.5,1)';
  setTimeout(() => { s.style.animation = ''; }, 300);
}
function onPointerCancel(){
  if (!drag) return;
  const d = drag; drag = null;
  document.body.classList.remove('grabbing');
  if (d.el) d.el.classList.remove('dragging');
  selected = null; render();
}

// Pantallas del overlay
function showScreen(name){   // menu | friend | waiting | search | help | board | result | nullen juego
  if (name !== 'help') stopDemo();   // al salir del tutorial se detiene la demo
  curScreen = name;
  overlay.classList.toggle('hidden', name===null);
  $('screenMenu').style.display    = name==='menu'    ? '' : 'none';
  $('screenFriend').style.display  = name==='friend'  ? '' : 'none';
  $('screenWaiting').style.display = name==='waiting' ? '' : 'none';
  $('screenSearch').style.display  = name==='search'  ? '' : 'none';
  $('screenHelp').style.display    = name==='help'    ? '' : 'none';
  $('screenLadder').style.display  = name==='ladder'  ? '' : 'none';
  $('screenBoard').style.display   = name==='board'   ? '' : 'none';
  $('screenResult').style.display  = name==='result'  ? '' : 'none';
  const subs = { search:'sub.search', friend:'sub.friend', waiting:'sub.friend', help:'sub.help', board:'sub.board', ladder:'sub.ladder' };
  $('overlaySub').textContent = tr(subs[name] || 'sub.default');
  if (name==='friend'){ codeErr.textContent=''; }
  // el botón volver a la partida solo aparece si hay una partida en curso
  if (name==='menu') $('btnResume').style.display = (state && (state.phase==='live' || state.phase==='countdown')) ? '' : 'none';
}
// vs CPU rápido desactivado: contra la máquina solo se pelea en la escalera de leyendas
function enableMenu(on){ menuEnabled=on; btnQueue.disabled=!on; btnFriend.disabled=!on; btnCPU.disabled=true; $('btnLadder').disabled=!on; btnQueue.textContent = tr(on ? 'menu.search' : 'status.connecting'); }
function setStatus(ok, key){ lastStatusKey = key; statusEl.classList.toggle('ok', ok); statusTxt.textContent = tr(key); }

// WebSocket
function connect(){
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}`);
  ws.onopen  = () => { setStatus(true, 'status.connected'); enableMenu(true); sendName(); };
  ws.onclose = () => { setStatus(false, 'status.offline'); enableMenu(false); showScreen('menu'); setTimeout(connect, 1500); };
  ws.onerror = () => setStatus(false, 'status.netError');
  ws.onmessage = (ev) => {
    let msg; try { msg = JSON.parse(ev.data); } catch(_e){ return; }
    if (msg.t === 'welcome' || msg.t === 'lobby'){ state=null; selected=null; prevPhase=null; currentLadder=null; hideBanner(); stopTaunts(); showScreen('menu'); updateAmbience(); return; }
    if (msg.t === 'queued'){ showScreen('search'); return; }
    if (msg.t === 'created'){ codeValue.textContent = msg.code; showScreen('waiting'); return; }
    if (msg.t === 'reject'){ handleReject(msg.reason); return; }
    if (msg.t === 'toll'){ showToast(tr('toast.toll').replace('{n}', msg.toll)); return; }
    if (msg.t === 'freecap'){ showToast(tr('toast.freecap'), true); return; }
    if (msg.t === 'rematch-wait'){ btnRematch.disabled = true; btnRematch.textContent = tr('result.rematchWait'); return; }
    if (msg.t === 'rematch-offer'){ showToast(tr('toast.rematchOffer'), true); return; }
    if (msg.t === 'opp-gone'){ showBanner(tr('banner.oppGone')); return; }
    if (msg.t === 'opp-back'){ hideBanner(); showToast(tr('toast.oppBack'), true); return; }
    if (msg.t === 'resumed'){ hideBanner(); showToast(tr('toast.resumed'), true); return; }
    if (msg.t === 'top'){ renderBoard(msg); return; }
    if (msg.t === 'state'){ onState(msg); return; }
  };
}

function onState(msg){
  const prev = state;
  state = msg; you = msg.you;

  // coreografia de la victoria: al capturar al rey rival, este se tumba
  // (estaba en el estado anterior) y su ejercito se disuelve en cascada
  if (msg.phase === 'over' && prev && prev.phase !== 'over' && msg.winner === you && msg.reason === 'king'){
    const foeColor = you === 'w' ? 'b' : 'w';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++){
      const pp = prev.board && prev.board[r][c];
      if (pp && pp.color === foeColor && pp.type === 'k') pieceFx.set(pp.id, { cls: 'topple', delay: 0 });
      const np = msg.board[r][c];
      if (np && np.color === foeColor) pieceFx.set(np.id, { cls: 'dissolve', delay: Math.round(350 + Math.random() * 900) });
    }
  }

  // sonidos por cambios
  if (prev && JSON.stringify(prev.lastMove) !== JSON.stringify(state.lastMove)){
    const captured = (prev.material.w + prev.material.b) !== (state.material.w + state.material.b);
    sfx(captured ? 'cap' : 'move');
    if (state.check.w || state.check.b) sfx('check');
    // el rival de la escalera presume cuando te come una pieza
    if (captured && prev.material[you] > state.material[you] && currentLadder != null && Math.random() < 0.5){
      showTaunt();
      scheduleTaunt(false);
    }
  }

  // gestión de fase
  if (state.phase === 'countdown'){
    // solo cierra pantallas al ENTRAR en la fase: así el menú puede quedarse abierto
    if (prevPhase !== 'countdown'){ showScreen(null); window.RSBG.newScene(); pieceFx.clear(); }
    const secs = Math.ceil(state.countdownLeft/1000);
    countdownEl.style.display = 'flex';
    cdNum.textContent = secs > 0 ? secs : tr('game.go');
  } else if (state.phase === 'live'){
    if (prevPhase !== 'live'){
      showScreen(null); sfx('go');
      if (currentLadder != null) scheduleTaunt(true);   // el rival abre la boca pronto
    }
    countdownEl.style.display = 'none';
  } else if (state.phase === 'over'){
    countdownEl.style.display = 'none';
    if (prevPhase !== 'over'){ showResult(); sfx(state.winner === you ? 'win' : 'end'); }
  }
  prevPhase = state.phase;
  updateAmbience();
  render();
}

// música y fondo reaccionan a la fase, al reloj 0 - 1 al agotarse y al jaque
function updateAmbience(){
  if (!state){ window.RSMusic.stop(); window.RSMusic.setDanger(false); window.RSBG.setIntensity(0); return; }
  if (state.phase === 'countdown' || state.phase === 'live'){
    // cada rival de la escalera tiene su propia canción: misma semilla, misma pista
    const rival = (currentLadder != null && state.vsCPU) ? RV.RIVALS[currentLadder] : null;
    window.RSMusic.setSeed(rival && rival.songSeed != null ? rival.songSeed : null);
    if (musicOn) window.RSMusic.start(audioCtx); else window.RSMusic.stop();
    const p = state.matchMs ? Math.max(0, Math.min(1, 1 - state.timeLeft / state.matchMs)) : 0;
    const inten = state.phase === 'live' ? Math.pow(p, 1.35) : 0;
    window.RSMusic.setIntensity(inten);
    window.RSMusic.setDanger(state.phase === 'live' && !!state.check[you]);
    window.RSBG.setIntensity(inten);
  } else {
    window.RSMusic.stop();
    window.RSMusic.setDanger(false);
    window.RSBG.setIntensity(0);
  }
}

function handleReject(reason){
  const codeKeys = {
    'codigo-en-uso':'err.codeInUse',
    'sala-no-existe':'err.roomMissing',
    'codigo-vacio':'err.codeEmpty',
    'sala-llena':'err.roomFull',
    'ya-en-sala':'err.inRoom',
  };
  if (codeKeys[reason]){
    if (curScreen==='friend'){ codeErr.textContent = tr(codeKeys[reason]); }
    else { showToast(tr(codeKeys[reason])); }
    return;
  }
  const map = { 'sin-energia':'toast.noEnergy', 'ilegal':'toast.illegal', 'no-es-tuya':'toast.notYours', 'no-corriendo':'toast.notRunning', 'rey-protegido':'toast.kingGrace', 'rival-se-fue':'err.rivalGone' };
  showToast(map[reason] ? tr(map[reason]) : tr('toast.rejected'));
}

// Resultado
function showResult(){
  hideBanner();   // por si terminó estando en pausa
  const won = state.winner === you, draw = state.winner === 'draw';
  endFx(draw ? 'draw' : won ? 'win' : 'lose');              // estallido + flash + sacudida
  const rt = $('resultTxt'); rt.className='result';
  if (draw){ rt.classList.add('draw'); rt.textContent=tr('result.draw'); }
  else if (won){ rt.classList.add('win'); rt.textContent=tr('result.win'); }
  else { rt.classList.add('lose'); rt.textContent=tr('result.lose'); }
  const reasonTxt = state.reason==='time'
    ? tr('reason.time').replace('{w}', state.material.w).replace('{b}', state.material.b)
    : state.reason==='abandon' ? tr('reason.abandon') : tr('reason.king');
  btnRematch.disabled = false;
  btnRematch.textContent = tr('result.rematch');
  stopTaunts();
  // escalera: al vencer avanza el progreso y el rival te deja su consejo.
  // si te gana el, te suelta su frase de victoria
  const rq = $('rivalQuote'), bn = $('btnNext');
  let rqText = '';          // la frase se escribe a maquina cuando el panel aparece
  let wonLadder = false;    // vencer a un rival: retrato agrietado
  let wasPossessed = false; // vencerlo en pesadilla: exorcismo
  let finalBoss = null;     // vencer al ultimo de la torre: apagon CRT + coronacion
  if (currentLadder != null && !draw){
    const r = RV.RIVALS[currentLadder];
    const lang = I18N.getLang();
    resetPortraitFx();   // limpia esquirlas y grietas de una partida anterior
    $('rqImg').src = r.img || RV.DEFAULT_IMG;
    possessFx($('rqImg'), isPossessed(r));
    $('rqName').textContent = r.name;
    rq.classList.toggle('lost', !won);
    if (won){
      wonLadder = true;
      wasPossessed = isPossessed(r);
      const firstWin = currentLadder === ladderProg;   // primera vez que lo vences
      if (firstWin){
        ladderProg++;
        localStorage.setItem('rs-ladder', String(ladderProg));
      }
      rqText = r.quote[lang] || r.quote.es;
      const next = RV.RIVALS[currentLadder + 1];
      bn.style.display = next ? '' : 'none';
      if (!next){
        finalBoss = r;
        showToast(tr(ladderLoop > 0 ? 'ladder.doneNightmare' : 'ladder.done'), true);
        // superar la pesadilla corona al campeon: tema CRT + corona en el nombre
        if (ladderLoop > 0 && !nightmareDone){
          nightmareDone = true;
          localStorage.setItem('rs-nightmare-done', '1');
          applyTheme();   // el boton CRT pierde el candado al instante
          setTimeout(() => showToast(tr('reward.unlocked'), true), 5200);
        }
      }
      // al caer el ultimo rival visible se revela el jefe secreto
      else if (next.secret && firstWin) showToast(tr('ladder.awaken'), true);
    } else {
      rqText = (r.gloat && (r.gloat[lang] || r.gloat.es)) || '';
      bn.style.display = 'none';
    }
    $('rqTxt').textContent = '';
    rq.style.display = '';
  } else {
    rq.style.display = 'none';
    bn.style.display = 'none';
  }
  // coreografia: el rey se tumba primero (1.1s); al jefe final le sigue el
  // apagon CRT y la coronacion antes de que entre el panel
  let panelDelay = won ? 950 : 550;
  if (finalBoss){
    if (finalBoss.id === 'deepblue'){
      setTimeout(crtShutdown, 800);      // la maquina se apaga (pantalla negra)
      setTimeout(crownDrop, 2200);       // la corona cae sobre tu nombre en el negro
      panelDelay = 4300;
    } else {
      setTimeout(crownDrop, 500);
      panelDelay = 2300;
    }
  }
  setTimeout(() => {
    if (!state || state.phase !== 'over') return;           // por si volvió al menú
    showScreen('result');
    $('overlaySub').textContent = reasonTxt;
    if (rq.style.display !== 'none'){
      typeText($('rqTxt'), rqText);
      if (wonLadder && wasPossessed) setTimeout(exorcise, 300);
    }
  }, panelDelay);
}

// === piezas de la coreografia de derrota ===
// limpia los restos visuales del retrato entre una partida y otra
function resetPortraitFx(){
  $('rqImg').parentElement.querySelectorAll('.wisp').forEach(x => x.remove());
}
// pesadilla: el espiritu de deep blue abandona al vencido y el retrato
// queda limpio, liberado de la posesion
function exorcise(){
  const wrap = $('rqImg').parentElement;
  const w = document.createElement('i');
  w.className = 'wisp';
  wrap.appendChild(w);
  setTimeout(() => possessFx($('rqImg'), false), 450);
  setTimeout(() => w.remove(), 1500);
}
// la frase del rival se escribe letra a letra con cursor parpadeante
let typeTimer = null;
function typeText(el, txt){
  clearInterval(typeTimer);
  if (!txt){ el.textContent = ''; el.classList.remove('typing'); return; }
  el.classList.add('typing');
  el.textContent = '';
  let i = 0;
  typeTimer = setInterval(() => {
    el.textContent = txt.slice(0, ++i);
    if (i >= txt.length){ clearInterval(typeTimer); el.classList.remove('typing'); }
  }, 24);
}
// apagon de monitor viejo: la pantalla colapsa a una linea, a un punto y a
// negro; el negro se mantiene hasta que "reenciende" al quitar el elemento
function crtShutdown(){
  const d = document.createElement('div');
  d.id = 'crtOff';
  d.appendChild(document.createElement('i'));
  document.body.appendChild(d);
  sfx('end');
  setTimeout(() => d.remove(), 3400);
}
// la corona cae desde lo alto y aterriza con rebote sobre tu nombre
function crownDrop(){
  const card = $(you === 'w' ? 'cardW' : 'cardB');
  const pname = card && card.querySelector('.pname');
  if (!pname) return;
  const t = pname.getBoundingClientRect();
  const tx = Math.round(t.left + 6), ty = Math.round(t.top - 8);
  const c = document.createElement('div');
  c.className = 'crowndrop';
  c.textContent = '👑';
  document.body.appendChild(c);
  c.animate([
    { transform: `translate(${tx}px, -90px) scale(2.6) rotate(-14deg)`, opacity: 0 },
    { transform: `translate(${tx}px, ${Math.round(ty * 0.55)}px) scale(1.8) rotate(8deg)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${tx}px, ${ty}px) scale(1) rotate(0deg)`, offset: 0.72 },
    { transform: `translate(${tx}px, ${ty - 16}px) scale(1.08) rotate(-4deg)`, offset: 0.84 },
    { transform: `translate(${tx}px, ${ty}px) scale(1) rotate(0deg)` },
  ], { duration: 1300, easing: 'ease-in', fill: 'forwards' });
  sfx('win');
  setTimeout(() => {
    c.style.transition = 'opacity .6s';
    c.style.opacity = '0';
    setTimeout(() => c.remove(), 700);
  }, 2400);
}

// efectos de final de partida: cian al ganar, rojo al perder, dorado en empate
function endFx(kind){
  const hue = kind === 'win' ? 172 : kind === 'lose' ? 348 : 45;
  const f = $('flash');
  f.style.background = `hsl(${hue} 90% 60%)`;
  f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  if (kind === 'lose'){
    boardWrap.classList.add('shake');
    setTimeout(() => boardWrap.classList.remove('shake'), 500);
  }
  const r = boardWrap.getBoundingClientRect();
  window.RSBG.burst(r.left + r.width/2, r.top + r.height/2, hue);
}

// Sonido
function ensureAudio(){ if(!audioCtx){ try{ audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch(_e){} } }
function sfx(kind){
  if(!sfxOn||!audioCtx) return;
  const t=audioCtx.currentTime, o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  let f=520,d=0.06,type='triangle',vol=0.06;
  if(kind==='cap'){ f=180; d=0.12; type='sawtooth'; vol=0.09; }
  if(kind==='check'){ f=760; d=0.16; type='square'; vol=0.08; }
  if(kind==='go'){ f=660; d=0.18; type='triangle'; vol=0.09; }
  if(kind==='end'){ f=320; d=0.4; type='sawtooth'; vol=0.1; }
  if(kind==='win'){ f=440; d=0.45; type='triangle'; vol=0.1; }
  o.type=type; o.frequency.setValueAtTime(f,t);
  if(kind==='cap'||kind==='end') o.frequency.exponentialRampToValueAtTime(f*0.5,t+d);
  if(kind==='go') o.frequency.exponentialRampToValueAtTime(f*1.5,t+d);
  if(kind==='win') o.frequency.exponentialRampToValueAtTime(f*2,t+d);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  o.start(t); o.stop(t+d+0.02);
}

// Toast + leyenda
// banner persistente rival desconectado: se muestra hasta reconexión o fin
function showBanner(msg){ const b = $('banner'); b.textContent = msg; b.classList.add('show'); }
function hideBanner(){ const b = $('banner'); if (b) b.classList.remove('show'); }

let toastTimer=null;
function showToast(msg, good){
  toastEl.textContent = msg;
  toastEl.classList.toggle('good', !!good);   // verde para avisos positivos
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 900);
}
// rejilla de ajustes por pieza sala privada: coste de mover + energía al comerla
function buildCfgPieces(){
  const grid = $('cfgPieces'); if (!grid) return;
  grid.innerHTML = `<div class="cfg-h"></div><div class="cfg-h">${tr('friend.h.cost')}</div><div class="cfg-h">${tr('friend.h.eat')}</div>`;
  const refund = window.RSConfig.energy.captureRefund;
  ['p','n','b','r','q','k'].forEach(t => {
    const name = document.createElement('div');
    name.className = 'cfg-name';
    name.innerHTML = `<span class="g">${GLYPH[t]}</span>${pieceName(t)}`;
    grid.appendChild(name);
    const cost = document.createElement('input');
    cost.type = 'number'; cost.min = '0'; cost.max = '20'; cost.step = '1';
    cost.id = 'cfgCost_' + t; cost.value = E.MOVE_COST[t];
    grid.appendChild(cost);
    if (t === 'k'){
      const dash = document.createElement('div');
      dash.className = 'cfg-dash'; dash.textContent = '—';   // capturar al rey acaba la partida
      grid.appendChild(dash);
    } else {
      const ref = document.createElement('input');
      ref.type = 'number'; ref.min = '0'; ref.max = '10'; ref.step = '0.5';
      ref.id = 'cfgRef_' + t; ref.value = E.VALUE[t] * refund;
      grid.appendChild(ref);
    }
  });
}

function buildLegend(){
  const row=$('legendRow'); row.innerHTML='';
  ['p','n','b','r','q','k'].forEach(t=>{
    const chip=document.createElement('div'); chip.className='chip';
    const recover = E.VALUE[t] ? '+'+(E.VALUE[t]*window.RSConfig.energy.captureRefund) : '—';
    chip.innerHTML=`<span class="g">${GLYPH[t]}</span> <b>${E.MOVE_COST[t]}</b> <i>${recover}</i>`;
    chip.title = tr('legend.chip').replace('{name}', pieceName(t)).replace('{cost}', E.MOVE_COST[t]).replace('{rec}', recover);
    row.appendChild(chip);
  });
}

// Botones
btnQueue.addEventListener('click', () => { ensureAudio(); sendName(); leaveIfInGame(); currentLadder = null; send({t:'queue'}); });
btnAgain.addEventListener('click', () => { ensureAudio(); sendName(); currentLadder = null; send({t:'queue'}); });
btnCPU .addEventListener('click', () => { ensureAudio(); sendName(); leaveIfInGame(); currentLadder = null; send({t:'cpu'}); });
btnCPU2.addEventListener('click', () => { ensureAudio(); sendName(); currentLadder = null; send({t:'cpu'}); });
btnCancel.addEventListener('click', () => send({t:'cancel'}));
// en partida, el menú solo se ABRE no abandona; fuera de partida vuelve al lobby
const inGame = () => !!(state && (state.phase === 'live' || state.phase === 'countdown'));
menuBtn.addEventListener('click', () => { if (inGame()) showScreen('menu'); else send({t:'leave'}); });
$('btnResume').addEventListener('click', () => showScreen(null));
// menú principal desde la pantalla de resultado: sales de la sala y el
// servidor te devuelve al lobby, que abre el menú
$('btnMenu2').addEventListener('click', () => { currentLadder = null; send({t:'leave'}); });
// Escape: desde cualquier subpantalla se regresa al menú principal
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (curScreen === 'friend' || curScreen === 'help' || curScreen === 'ladder' || curScreen === 'board') showScreen('menu');
  else if (curScreen === 'result'){ currentLadder = null; send({t:'leave'}); }
  else if (curScreen === 'menu' && inGame()) showScreen(null);   // en partida, cierra el menú
});
// elegir otro modo estando en partida = abandonarla primero
function leaveIfInGame(){ if (inGame()) send({t:'leave'}); }
// salas privadas
btnFriend.addEventListener('click', () => { showScreen('friend'); setTimeout(()=>codeInput.focus(),50); });
btnBack.addEventListener('click', () => showScreen('menu'));
btnCreate.addEventListener('click', () => {
  ensureAudio(); sendName(); leaveIfInGame(); currentLadder = null;
  const opts = { minutes: +$('cfgMin').value, start: +$('cfgStart').value, regen: +$('cfgRegen').value, costs: {}, refunds: {} };
  ['p','n','b','r','q','k'].forEach(t => {
    const c = $('cfgCost_' + t); if (c && c.value !== '') opts.costs[t] = +c.value;
    const rf = $('cfgRef_' + t); if (rf && rf.value !== '') opts.refunds[t] = +rf.value;
  });
  send({t:'create', code: codeInput.value, opts});
});
btnJoin.addEventListener('click', () => { ensureAudio(); sendName(); leaveIfInGame(); currentLadder = null; send({t:'join', code: codeInput.value}); });
btnCancelWait.addEventListener('click', () => send({t:'cancel'}));
codeInput.addEventListener('input', () => { codeInput.value = codeInput.value.toUpperCase(); codeErr.textContent=''; });
codeInput.addEventListener('keydown', (e) => { if (e.key==='Enter') btnJoin.click(); });
$('soundBtn').addEventListener('click', function(){ sfxOn=!sfxOn; this.textContent=sfxOn?'🔊 SFX':'🔇 SFX'; ensureAudio(); });
function musicBtnText(){ $('musicBtn').textContent = (musicOn ? '🎵 ' : '🔇 ') + tr('top.music'); }
$('musicBtn').addEventListener('click', function(){
  musicOn = !musicOn;
  localStorage.setItem('rs-music', musicOn ? '1' : '0');
  musicBtnText();
  ensureAudio();
  updateAmbience();
});

// Idioma: aplica todas las traducciones estáticas y construidas
function applyLang(){
  document.documentElement.lang = I18N.getLang();
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = tr(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = tr(el.dataset.i18nPh); });
  document.querySelectorAll('#cfgRegen option').forEach(o => { o.textContent = tr('friend.regenOpt').replace('{n}', o.value); });
  document.querySelectorAll('#langRow .tbtn').forEach(b => b.classList.toggle('on', b.dataset.lang === I18N.getLang()));
  musicBtnText();
  menuBtn.textContent = '☰ ' + tr('top.menu');
  statusTxt.textContent = tr(lastStatusKey);
  enableMenu(menuEnabled);
  buildLegend();
  buildCfgPieces();
  buildHelp();
  buildLadder();
  if (curScreen) showScreen(curScreen);
  if (state) updateHUD();
  // la marca se aparta de la píldora de idiomas fija su ancho depende de cuántos haya
  const lr = $('langRow'), brand = document.querySelector('.brand');
  if (lr && brand) brand.style.marginLeft = (lr.offsetWidth + 14) + 'px';
}

// botones de idioma: uno por cada idioma de i18n.js añadir idioma = solo editar ese archivo
const langRow = $('langRow');
I18N.LANGS.forEach(l => {
  const b = document.createElement('button');
  b.className = 'btn tbtn';
  b.dataset.lang = l;
  b.textContent = l.toUpperCase();
  b.addEventListener('click', () => { I18N.setLang(l); localStorage.setItem('rs-lang', l); applyLang(); });
  langRow.appendChild(b);
});

// tutorial cómo jugar: lista de reglas desde i18n.js; clic = demo animada
function buildHelp(){
  const list = $('helpList'); if (!list) return;
  list.innerHTML = '';
  for (let i = 1; i <= 11; i++){
    const item = document.createElement('div');
    item.className = 'help-item';
    item.innerHTML = `<b>${i}</b>${tr('tut.' + i)}`;
    item.addEventListener('click', () => {
      [...list.children].forEach(x => x.classList.remove('active'));
      item.classList.add('active');
      playDemo(i);
    });
    list.appendChild(item);
  }
}
btnHelp.addEventListener('click', () => showScreen('help'));
btnHelpBack.addEventListener('click', () => showScreen('menu'));

// Demos del tutorial: mini-tablero que RECREA cada regla.
// Cada demo es solo piezas + coordenadas; el reproductor anima
// movimientos, capturas, costes flotantes y efectos en bucle.
let demoPieces = [], demoGen = 0;
const dSleep = (ms) => new Promise(r => setTimeout(r, ms));

function demoInit(){
  const sqs = $('demoSqs');
  if (sqs.childElementCount) return;
  for (let r=0; r<8; r++) for (let c=0; c<8; c++){
    const d = document.createElement('div');
    d.className = 'dsq ' + ((r+c)%2 ? 'd' : 'l');
    d.style.left = c*12.5 + '%'; d.style.top = r*12.5 + '%';
    sqs.appendChild(d);
  }
}
function demoReset(set){
  $('demoPieces').innerHTML = '';
  $('demoFx').innerHTML = '';
  $('demoBoard').classList.remove('danger');
  demoPieces = set.map(([col, t, r, c]) => {
    const el = document.createElement('div');
    el.className = 'dpiece ' + col;
    el.textContent = GLYPH[t];
    el.style.transform = `translate(${c*100}%, ${r*100}%)`;
    $('demoPieces').appendChild(el);
    return { el, r, c };
  });
}
const dAt = (r, c) => demoPieces.find(p => p.r === r && p.c === c);
function dFloat(r, c, txt, mood){
  const f = document.createElement('div');
  f.className = 'dfloat' + (mood ? ' ' + mood : '');
  f.textContent = txt;
  f.style.left = c*12.5 + '%'; f.style.top = (r*12.5 + 1) + '%';
  $('demoBoard').appendChild(f);
  setTimeout(() => f.remove(), 1150);
}
function dBeamH(r, c){
  const b = document.createElement('div');
  b.className = 'dbeam';
  b.style.left = c*12.5 + '%'; b.style.top = (r*12.5 + 5.5) + '%';
  b.style.width = '12.5%'; b.style.height = '1.6%';
  $('demoFx').appendChild(b);
}
function dGold(r, c){
  const g = document.createElement('div');
  g.className = 'dgold';
  g.style.left = (c*12.5 + 1) + '%'; g.style.top = (r*12.5 + 1) + '%';
  g.style.width = '10.5%'; g.style.height = '10.5%';
  $('demoFx').appendChild(g);
}
function dMove(fr, fc, r2, c2, cost, gain){
  const p = dAt(fr, fc); if (!p) return;
  const victim = dAt(r2, c2);
  if (victim){
    demoPieces = demoPieces.filter(x => x !== victim);
    setTimeout(() => { victim.el.style.opacity = 0; setTimeout(() => victim.el.remove(), 260); }, 200);
  }
  p.r = r2; p.c = c2;
  p.el.style.transform = `translate(${c2*100}%, ${r2*100}%)`;
  if (cost != null) dFloat(r2, c2, cost, String(cost).startsWith('-') ? '' : 'good');
  if (gain != null) setTimeout(() => dFloat(r2, c2, gain, 'good'), 420);
}

// guiones: los números salen de config/engine para no quedar desfasados
function demoScript(n){
  const C = E.MOVE_COST, V = E.VALUE;
  const R = window.RSConfig.energy.captureRefund;
  const S = window.RSConfig.energy.checkSurcharge;
  const QM = window.RSConfig.rules.queenMinCost;
  const laneRow4 = []; for (let c = 1; c < 8; c++) laneRow4.push([4, c]);
  const D = {
    1:{ set:[['w','p',6,4],['b','p',1,4],['w','n',7,6]],
        steps:[ {mv:[6,4,4,4],cost:'-'+C.p}, {mv:[1,4,3,4],cost:'-'+C.p,d:550}, {mv:[7,6,5,5],cost:'-'+C.n} ] },
    2:{ set:[['w','p',6,0],['w','n',7,1],['w','r',7,7]],
        steps:[ {mv:[6,0,5,0],cost:'-'+C.p}, {mv:[7,1,5,2],cost:'-'+C.n}, {mv:[7,7,4,7],cost:'-'+C.r} ] },
    3:{ set:[['w','b',4,2],['b','n',2,4],['w','p',4,5],['b','r',3,6]],
        steps:[ {mv:[4,2,2,4],cost:'-'+C.b,gain:'+'+(V.n*R)}, {mv:[4,5,3,6],cost:'-'+C.p,d:1100} ] },
    4:{ set:[['w','k',7,4],['b','r',3,0]],
        steps:[ {mv:[3,0,3,4],cost:'-'+C.r}, {fx:'check',d:1100}, {mv:[7,4,6,3],cost:'-'+(C.k+S)}, {fx:'calm',d:400} ] },
    5:{ set:[['w','q',4,7],['b','k',0,7]],
        steps:[ {mv:[4,7,0,7],cost:'-'+C.q}, {float:tr('result.win'),at:[0,7],mood:'good',d:1000} ] },
    6:{ set:[['w','p',6,3]],
        steps:[ {mv:[6,3,5,3],cost:'-'+C.p}, {mv:[5,3,4,3],cost:'-'+(C.p+1)}, {mv:[4,3,3,3],cost:'-'+(C.p+2)} ] },
    7:{ set:[['w','n',5,4],['b','b',3,5]],
        steps:[ {mv:[5,4,3,5],cost:'-'+C.n,gain:'+'+(V.b*R)}, {mv:[3,5,1,4],cost:'-'+(C.n-1)} ] },
    8:{ set:[['w','q',7,3],['b','n',5,3]],
        steps:[ {mv:[7,3,5,3],cost:'-'+C.q}, {mv:[5,3,5,6],cost:'-'+Math.max(QM, C.q-1)} ] },
    9:{ set:[['w','r',4,0],['b','b',2,6]],
        steps:[ {fx:'lane',at:laneRow4,d:900}, {mv:[2,6,6,2],cost:'-'+C.b}, {float:'+1',at:[4,4],mood:'bad',d:900} ] },
    10:{ set:[['w','p',4,4],['w','n',6,3],['b','b',2,6]],
        steps:[ {mv:[2,6,4,4],cost:'-'+C.b}, {fx:'gold',at:[4,4],d:850}, {mv:[6,3,4,4],cost:'0'}, {float:tr('toast.freecap'),at:[3,4],mood:'good',d:1000} ] },
    11:{ set:[['w','k',7,4],['w','r',7,7]],
        steps:[ {mv:[7,4,7,6],cost:'-'+C.k}, {mv:[7,7,7,5],d:300} ] },
  };
  return D[n];
}

function stopDemo(){
  demoGen++;
  const w = $('demoWrap'); if (w) w.style.display = 'none';
  const b = $('demoBoard'); if (b) b.classList.remove('danger');
}
async function playDemo(n){
  const demo = demoScript(n);
  if (!demo) return;
  demoInit();
  demoGen++;
  const gen = demoGen;
  $('demoWrap').style.display = '';
  while (gen === demoGen){                         
    demoReset(demo.set);
    await dSleep(500);
    for (const s of demo.steps){
      if (gen !== demoGen) return;
      if (s.mv) dMove(s.mv[0], s.mv[1], s.mv[2], s.mv[3], s.cost, s.gain);
      if (s.fx === 'check') $('demoBoard').classList.add('danger');
      if (s.fx === 'calm')  $('demoBoard').classList.remove('danger');
      if (s.fx === 'lane')  s.at.forEach(([r, c]) => dBeamH(r, c));
      if (s.fx === 'gold')  dGold(s.at[0], s.at[1]);
      if (s.float) dFloat(s.at[0], s.at[1], s.float, s.mood);
      await dSleep(s.d || 950);
    }
    await dSleep(1500);
  }
}

// clasificación: pide el top al servidor y lo pinta al llegar
const escHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderBoard(msg){
  const list = $('boardList');
  list.innerHTML = '';
  if (!msg.rows || !msg.rows.length){
    list.innerHTML = `<div class="help-item">${tr('board.empty')}</div>`;
  } else {
    const head = document.createElement('div');
    head.className = 'board-row head';
    head.innerHTML = `<span class="rk">#</span><span class="nm">${tr('board.h.player')}</span><span class="el">Elo</span><span class="wl">${tr('board.h.record')}</span>`;
    list.appendChild(head);
    for (const r of msg.rows){
      const row = document.createElement('div');
      row.className = 'board-row' + (msg.me && r.rank === msg.me.rank && r.disc === msg.me.disc ? ' me' : '');
      const nm = escHtml(r.name || 'Anon');
      row.innerHTML = `<span class="rk">${r.rank}</span>` +
                      `<span class="nm">${nm}<small>#${r.disc}</small></span>` +
                      `<span class="el">${r.elo}</span>` +
                      `<span class="wl">${r.wins}/${r.losses}/${r.draws}</span>`;
      list.appendChild(row);
    }
  }
  $('boardMe').textContent = msg.me ? `${tr('board.you')}: #${msg.me.rank} · ${msg.me.elo} Elo` : '';
}
$('btnBoard').addEventListener('click', () => {
  $('boardList').innerHTML = `<div class="help-item">${tr('board.loading')}</div>`;
  $('boardMe').textContent = '';
  send({ t:'top' });
  showScreen('board');
});
$('btnBoardBack').addEventListener('click', () => showScreen('menu'));

// escalera de leyendas: torre con el jefe arriba, peleas desde abajo
let ladderOpen = null;   // fila expandida
// silueta para los rivales aún bloqueados: no ves quién es hasta que te toque
const MYSTERY_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
  '<rect width="100" height="100" rx="14" fill="#0b0c16"/>' +
  '<text x="50" y="70" font-size="52" text-anchor="middle" fill="#3a3f63" opacity="0.9">?</text>' +
  '<rect width="100" height="100" rx="14" fill="none" stroke="#23263d" stroke-width="3"/>' +
  '</svg>'
);
function buildLadder(){
  const list = $('ladderList'); if (!list) return;
  list.innerHTML = '';
  const lang = I18N.getLang();
  const rivals = RV.RIVALS;
  // el jefe secreto no existe para el jugador hasta que le toca pelear con el
  const shown = (i) => !rivals[i].secret || ladderProg >= i;
  let topIdx = rivals.length - 1;
  while (topIdx > 0 && !shown(topIdx)) topIdx--;
  const total = rivals.filter((_, i) => shown(i)).length;
  // cabecera de progreso: cuántas leyendas llevas vencidas
  const prog = $('ladderProg');
  if (prog){
    const done = Math.min(ladderProg, total);
    const mark = ladderLoop > 0 ? `<b class="loopmark">☠ ${escHtml(tr('ladder.nightmare'))} ×${ladderLoop}</b>` : '';
    prog.innerHTML =
      `<span>${escHtml(tr('ladder.prog'))}</span>` + mark +
      `<div class="lpbar"><i style="width:${Math.round(100 * done / total)}%"></i></div>` +
      `<b>${done}/${total}</b>`;
  }
  // torre completada: se abre la nueva vuelta en modo pesadilla
  if (ladderProg >= rivals.length){
    const ng = document.createElement('button');
    ng.className = 'ngplus';
    ng.textContent = tr('ladder.ngplus');
    ng.addEventListener('click', startNightmare);
    list.appendChild(ng);
  }
  for (let i = rivals.length - 1; i >= 0; i--){
    if (!shown(i)) continue;
    const r = rivals[i];
    const beaten = i < ladderProg, isNext = i === ladderProg, locked = i > ladderProg;
    const boss = i === topIdx;
    const row = document.createElement('div');
    row.className = 'lrow' +
      (beaten ? ' beaten' : isNext ? ' next' : ' locked') +
      (boss ? ' boss' : '');
    const st = beaten ? '✓' : isNext ? '▶' : '🔒';
    const stCls = beaten ? 'beaten' : isNext ? 'next' : '';
    // dificultad en 5 barritas según el piso de la torre
    const diff = Math.ceil((i + 1) * 5 / rivals.length);
    let dots = '';
    for (let d = 1; d <= 5; d++) dots += `<i class="${d <= diff ? 'on' : ''}"></i>`;
    // los rivales bloqueados quedan en secreto: silueta y sin nombre
    const img   = locked ? MYSTERY_IMG : (r.img || RV.DEFAULT_IMG);
    const name  = locked ? '???' : escHtml(r.name);
    const title = locked ? escHtml(tr('ladder.hidden')) : escHtml(r.title[lang] || r.title.es);
    row.innerHTML =
      `<div class="lav"><img src="${img}" alt=""><span class="lvl">${i + 1}</span></div>` +
      `<div class="lmain"><div class="ln">${boss ? '👑 ' : ''}${name}</div>` +
        `<div class="lt">${title}</div>` +
        `<div class="ldiff">${dots}</div></div>` +
      `<div class="st ${stCls}">${st}</div>`;
    if (!locked && isPossessed(r)) possessFx(row.querySelector('.lav img'), true);
    if (!locked){
      if (ladderOpen === i){
        const d = document.createElement('div');
        d.className = 'ldesc';
        d.innerHTML = escHtml(r.desc[lang] || r.desc.es) +
          `<button class="lplay" data-idx="${i}">${escHtml(tr('ladder.play'))}</button>`;
        row.appendChild(d);
        d.querySelector('.lplay').addEventListener('click', (e) => {
          e.stopPropagation();
          startLadderFight(i);
        });
      }
      row.addEventListener('click', () => {
        ladderOpen = ladderOpen === i ? null : i;
        buildLadder();
      });
    }
    list.appendChild(row);
  }
}
function startLadderFight(idx){
  ensureAudio(); sendName(); leaveIfInGame();
  currentLadder = idx;
  send({ t:'ladder', idx, loop: ladderLoop });
}
// nueva vuelta: la torre se reinicia y todos los rivales despiertan poseidos
function startNightmare(){
  ladderLoop++;
  ladderProg = 0;
  ladderOpen = 0;
  localStorage.setItem('rs-ladder-loop', String(ladderLoop));
  localStorage.setItem('rs-ladder', '0');
  showToast(tr('ladder.loopStart'), true);
  buildLadder();
}

// frases del rival durante la partida, solo en la escalera. Editables en rivals.js
let tauntTimer = null, tauntHide = null;
function showTaunt(){
  if (currentLadder == null || !state || state.phase !== 'live') return;
  const r = RV.RIVALS[currentLadder];
  const list = (r.taunts && (r.taunts[I18N.getLang()] || r.taunts.es)) || [];
  if (!list.length) return;
  $('tauntImg').src = r.img || RV.DEFAULT_IMG;
  possessFx($('tauntImg'), isPossessed(r));
  $('tauntTxt').textContent = list[Math.floor(Math.random() * list.length)];
  const el = $('taunt');
  el.classList.add('show');
  positionTaunt();
  clearTimeout(tauntHide);
  tauntHide = setTimeout(() => el.classList.remove('show'), 4500);
}
// coloca la burbuja centrada arriba pero elevandola lo justo para que su borde
// inferior quede SIEMPRE por encima del tablero, sea cual sea la resolucion
function positionTaunt(){
  const el = $('taunt');
  if (!el.classList.contains('show')) return;
  const boardTop = boardWrap.getBoundingClientRect().top;
  const h = el.offsetHeight || 52;
  let top = boardTop - 10 - h;          // 10px de aire sobre el tablero
  if (top < 6) top = 6;                 // pantallas muy bajas: pegada arriba
  el.style.top = top + 'px';
}
// si la ventana cambia de tamano con la burbuja visible, recolocala
window.addEventListener('resize', positionTaunt);
function scheduleTaunt(first){
  clearTimeout(tauntTimer);
  tauntTimer = setTimeout(() => { showTaunt(); scheduleTaunt(false); }, first ? 6000 : 16000 + Math.random() * 14000);
}
function stopTaunts(){
  clearTimeout(tauntTimer); tauntTimer = null;
  clearTimeout(tauntHide);
  const el = $('taunt'); if (el) el.classList.remove('show');
}
$('btnLadder').addEventListener('click', () => { ladderOpen = ladderProg; buildLadder(); showScreen('ladder'); });
$('btnLadderBack').addEventListener('click', () => showScreen('menu'));
$('btnNext').addEventListener('click', () => startLadderFight(currentLadder + 1));

// revancha: misma sala, mismos ajustes; en PvP esperan a que acepten los dos
btnRematch.addEventListener('click', () => { ensureAudio(); send({t:'rematch'}); });

// tema visual: clase en <body + fondo animado a juego persiste en localStorage
function applyTheme(){
  if (theme === 'crt' && !nightmareDone) theme = 'neon';   // candado: aun no lo ganaste
  document.body.classList.toggle('theme-chesscom', theme === 'chesscom');
  document.body.classList.toggle('theme-crt', theme === 'crt');
  $('themeNeon').classList.toggle('on', theme !== 'chesscom' && theme !== 'crt');
  $('themeClassic').classList.toggle('on', theme === 'chesscom');
  const crt = $('themeCRT');
  crt.classList.toggle('on', theme === 'crt');
  crt.classList.toggle('locked', !nightmareDone);
  crt.textContent = (nightmareDone ? '' : '🔒 ') + 'CRT';
  if (window.RSBG && window.RSBG.setTheme) window.RSBG.setTheme(theme);
}
function setTheme(t){ theme = t; localStorage.setItem('rs-theme', t); applyTheme(); }
$('themeNeon').addEventListener('click', () => setTheme('neon'));
$('themeClassic').addEventListener('click', () => setTheme('chesscom'));
$('themeCRT').addEventListener('click', () => {
  if (!nightmareDone){ showToast(tr('theme.locked')); return; }
  setTheme('crt');
});
applyTheme();

// opciones del menú: nombre + arrastre persisten en localStorage
nameInput.value = myName;
dragToggle.checked = dragEnabled;
nameInput.addEventListener('change', sendName);
dragToggle.addEventListener('change', () => {
  dragEnabled = dragToggle.checked;
  localStorage.setItem('rs-drag', dragEnabled ? '1' : '0');
});

// arrastrar piezas listeners globales; el grid se reconstruye pero gridEl persiste
gridEl.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);
window.addEventListener('pointercancel', onPointerCancel);

// init
buildGrid(); lastYou = you;
applyLang();   // traduce todo y construye leyenda, ajustes de piezas y tutorial
connect();