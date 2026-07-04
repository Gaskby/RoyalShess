/* ============================================================================
   RoyalShess — CLIENTE (Fase 3)
   Menú -> Buscar partida (online) / vs CPU. Cliente "tonto": pinta el estado
   autoritativo del servidor, orienta el tablero según tu color y envía
   intenciones {t:'move'}. Las reglas las decide el servidor.
   ============================================================================ */
const E = window.RSEngine;
const GLYPH = { p:'\u265F', n:'\u265E', b:'\u265D', r:'\u265C', q:'\u265B', k:'\u265A' };
const NAME  = { p:'Peón', n:'Caballo', b:'Alfil', r:'Torre', q:'Dama', k:'Rey' };

let state = null;         // último snapshot
let you = 'w';            // tu color
let lastYou = null;       // para rehacer el tablero si cambia la orientación
let selected = null;      // {r,c} en coords de tablero
let drag = null;          // arrastre en curso {r,c,id,el,lifted,sx,sy}
let justDragged = false;  // evita que el 'click' posterior a un arrastre reseleccione
let dragEnabled = localStorage.getItem('rs-drag') !== '0';  // opción del menú
let myName = localStorage.getItem('rs-name') || '';
let musicOn = localStorage.getItem('rs-music') !== '0';     // música lo-fi de fondo
let sfxOn = true, audioCtx = null;
let ws = null;
let prevPhase = null;

// ---- DOM ----
const $ = (id) => document.getElementById(id);
const gridEl = $('grid'), piecesEl = $('pieces'), clockEl = $('clock'), boardWrap = $('boardWrap');
const toastEl = $('toast'), overlay = $('overlay'), countdownEl = $('countdown'), cdNum = $('cdNum');
const statusEl = $('status'), statusTxt = $('statusTxt');
const btnQueue = $('btnQueue'), btnCPU = $('btnCPU'), btnCancel = $('btnCancel'),
      btnAgain = $('btnAgain'), btnCPU2 = $('btnCPU2'), menuBtn = $('menuBtn'),
      btnFriend = $('btnFriend'), btnCreate = $('btnCreate'), btnJoin = $('btnJoin'),
      btnBack = $('btnBack'), btnCancelWait = $('btnCancelWait'),
      codeInput = $('codeInput'), codeErr = $('codeErr'), codeValue = $('codeValue'),
      nameInput = $('nameInput'), dragToggle = $('dragToggle');
let curScreen = null;

// ============================================================
//  Orientación (tu bando abajo)
// ============================================================
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

// ============================================================
//  Render
// ============================================================
const pieceEls = new Map();
function render(){
  if (!state) return;
  if (you !== lastYou){ buildGrid(); lastYou = you; }  // rehacer si cambió tu color
  const bd = state.board;

  [...gridEl.children].forEach(sq => {
    sq.classList.remove('sel','lastmove');
    [...sq.querySelectorAll('.hint')].forEach(h => h.remove());
  });

  const present = new Set();
  for (let r=0; r<8; r++) for (let c=0; c<8; c++){
    const p = bd[r][c]; if (!p) continue;
    present.add(p.id);
    let el = pieceEls.get(p.id);
    if (!el){
      el = document.createElement('div');
      el.className = 'piece ' + p.color + ' pop';
      el.appendChild(document.createElement('span'));   // el glifo vive en un span (animaciones de escala)
      piecesEl.appendChild(el);
      pieceEls.set(p.id, el);
      setTimeout(() => el.classList.remove('pop'), 240);
    }
    el.firstChild.textContent = GLYPH[p.type];
    el.className = 'piece ' + p.color + ((drag && drag.lifted && drag.id === p.id) ? ' dragging' : '');
    const { dr, dc } = toDisplay(r, c);
    // Si esta pieza se está arrastrando, no la recolocamos: la controla el puntero.
    if (!(drag && drag.lifted && drag.id === p.id)) el.style.transform = `translate(${dc*100}%, ${dr*100}%)`;
  }
  for (const [id, el] of pieceEls){
    if (!present.has(id)){ el.classList.add('dead'); pieceEls.delete(id); setTimeout(()=>el.remove(),200); }
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
      const cost = E.MOVE_COST[p.type] + surcharge;
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

  // Etiquetas de usuario y reloj (nombre si lo hay; si no, TÚ / Rival / CPU)
  const names = state.names || {};
  const label = (side) => names[side] || (side === you ? 'TÚ' : (state.vsCPU ? 'CPU' : 'Rival'));
  $('tagW').textContent = '· ' + label('w');
  $('tagW').style.color = you==='w' ? 'var(--white-acc)' : 'var(--ink-dim)';
  $('tagB').textContent = '· ' + label('b');
  $('tagB').style.color = you==='b' ? 'var(--black-acc)' : 'var(--ink-dim)';
  
  const s = Math.max(0, Math.ceil(state.timeLeft/1000));
  clockEl.textContent = `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  clockEl.classList.toggle('low', s<=30 && state.phase==='live');
}

// ============================================================
//  Interacción -> intención al servidor
// ============================================================
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
  send({ t:'name', name: myName });
}

// ============================================================
//  Arrastrar piezas (drag & drop) — convive con el clic
// ============================================================
function squareUnderPointer(x, y){
  const el = document.elementFromPoint(x, y);
  const sq = el && el.closest ? el.closest('.sq') : null;
  if (!sq || sq.parentElement !== gridEl) return null;
  return { dr:+sq.dataset.dr, dc:+sq.dataset.dc };
}
function onPointerDown(e){
  if (!dragEnabled) return;                                 // opción del menú desactivada
  if (e.button != null && e.button !== 0) return;          // solo botón principal
  if (!state || state.phase!=='live') return;
  const sq = e.target.closest && e.target.closest('.sq');
  if (!sq) return;
  const { r, c } = toBoard(+sq.dataset.dr, +sq.dataset.dc);
  const p = state.board[r][c];
  if (!p || p.color !== you) return;                        // solo tus piezas
  e.preventDefault();
  justDragged = false;
  selected = { r, c };
  // la pieza se "agarra" AL INSTANTE: nada de umbrales ni esperar a mover
  drag = { r, c, id: p.id, el: pieceEls.get(p.id), lifted: true };
  if (drag.el) drag.el.classList.add('dragging');
  document.body.classList.add('grabbing');
  render();                                                 // pistas (no recoloca la pieza en drag)
  positionDragEl(e);                                        // la pieza salta al cursor ya
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
  setTimeout(() => { justDragged = false; }, 0);            // solo anula el clic de ESTE gesto
  settleAnim(d.id);                                         // animación de "asentarse" al soltar
  const at = squareUnderPointer(e.clientX, e.clientY);
  if (at){
    const { r, c } = toBoard(at.dr, at.dc);
    if (r === d.r && c === d.c){ render(); return; }        // soltó donde agarró: queda seleccionada
    if (E.genMoves(state.board, d.r, d.c).some(m => m.r===r && m.c===c)) sendMove({r:d.r,c:d.c}, {r,c});
  }
  selected = null;
  render();
}
// escala 1.28 -> rebote -> 1 sobre el span (estilo inline: sobrevive a los re-render)
function settleAnim(id){
  const el = pieceEls.get(id);
  if (!el || !el.firstChild) return;
  const s = el.firstChild;
  s.style.animation = 'none';
  void s.offsetWidth;                                       // reinicia la animación
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

// ============================================================
//  Pantallas del overlay
// ============================================================
function showScreen(name){ // 'menu' | 'friend' | 'waiting' | 'search' | 'result' | null(en juego)
  curScreen = name;
  overlay.classList.toggle('hidden', name===null);
  $('screenMenu').style.display    = name==='menu'    ? '' : 'none';
  $('screenFriend').style.display  = name==='friend'  ? '' : 'none';
  $('screenWaiting').style.display = name==='waiting' ? '' : 'none';
  $('screenSearch').style.display  = name==='search'  ? '' : 'none';
  $('screenResult').style.display  = name==='result'  ? '' : 'none';
  const subs = { search:'emparejando…', friend:'sala privada', waiting:'sala privada' };
  $('overlaySub').textContent = subs[name] || 'ajedrez en tiempo real';
  if (name==='friend'){ codeErr.textContent=''; }
}
function enableMenu(on){ btnQueue.disabled=!on; btnFriend.disabled=!on; btnCPU.disabled=!on; btnQueue.textContent = on?'Buscar partida':'Conectando…'; }
function setStatus(ok, txt){ statusEl.classList.toggle('ok', ok); statusTxt.textContent = txt; }

// ============================================================
//  WebSocket
// ============================================================
function connect(){
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}`);
  ws.onopen  = () => { setStatus(true, 'Conectado'); enableMenu(true); sendName(); };
  ws.onclose = () => { setStatus(false, 'Sin conexión'); enableMenu(false); showScreen('menu'); setTimeout(connect, 1500); };
  ws.onerror = () => setStatus(false, 'Error de red');
  ws.onmessage = (ev) => {
    let msg; try { msg = JSON.parse(ev.data); } catch(_e){ return; }
    if (msg.t === 'welcome' || msg.t === 'lobby'){ state=null; selected=null; prevPhase=null; showScreen('menu'); updateAmbience(); return; }
    if (msg.t === 'queued'){ showScreen('search'); return; }
    if (msg.t === 'created'){ codeValue.textContent = msg.code; showScreen('waiting'); return; }
    if (msg.t === 'reject'){ handleReject(msg.reason); return; }
    if (msg.t === 'state'){ onState(msg); return; }
  };
}

function onState(msg){
  const prev = state;
  state = msg; you = msg.you;

  // sonidos por cambios
  if (prev && JSON.stringify(prev.lastMove) !== JSON.stringify(state.lastMove)){
    const captured = (prev.material.w + prev.material.b) !== (state.material.w + state.material.b);
    sfx(captured ? 'cap' : 'move');
    if (state.check.w || state.check.b) sfx('check');
  }

  // gestión de fase
  if (state.phase === 'countdown'){
    showScreen(null);
    if (prevPhase !== 'countdown') window.RSBG.newScene();   // fondo nuevo por partida
    const secs = Math.ceil(state.countdownLeft/1000);
    countdownEl.style.display = 'flex';
    cdNum.textContent = secs > 0 ? secs : '¡YA!';
  } else if (state.phase === 'live'){
    showScreen(null);
    if (prevPhase !== 'live') sfx('go');
    countdownEl.style.display = 'none';
  } else if (state.phase === 'over'){
    countdownEl.style.display = 'none';
    if (prevPhase !== 'over'){ showResult(); sfx('end'); }
  }
  prevPhase = state.phase;
  updateAmbience();
  render();
}

// música y fondo reaccionan a la fase y al reloj (0 al empezar -> 1 al agotarse)
function updateAmbience(){
  if (!state){ window.RSMusic.stop(); window.RSBG.setIntensity(0); return; }
  if (state.phase === 'countdown' || state.phase === 'live'){
    if (musicOn) window.RSMusic.start(audioCtx); else window.RSMusic.stop();
    const p = state.matchMs ? Math.max(0, Math.min(1, 1 - state.timeLeft / state.matchMs)) : 0;
    const inten = state.phase === 'live' ? Math.pow(p, 1.35) : 0;
    window.RSMusic.setIntensity(inten);
    window.RSBG.setIntensity(inten);
  } else {
    window.RSMusic.stop();
    window.RSBG.setIntensity(0);
  }
}

function handleReject(reason){
  const codeMsgs = {
    'codigo-en-uso':'Ese código ya está en uso, elige otro.',
    'sala-no-existe':'No existe una sala con ese código.',
    'codigo-vacio':'Escribe un código para unirte.',
    'sala-llena':'Esa sala ya está completa.',
    'ya-en-sala':'Ya estás en una sala.',
  };
  if (codeMsgs[reason]){
    if (curScreen==='friend'){ codeErr.textContent = codeMsgs[reason]; }
    else { showToast(codeMsgs[reason]); }
    return;
  }
  const map = { 'sin-energia':'Sin energía', 'ilegal':'Movimiento ilegal', 'no-es-tuya':'No es tu pieza', 'no-corriendo':'Aún no empieza' };
  showToast(map[reason] || 'Rechazado');
}

// ============================================================
//  Resultado
// ============================================================
function showResult(){
  const rt = $('resultTxt'); rt.className='result';
  if (state.winner === 'draw'){ rt.classList.add('draw'); rt.textContent='Empate'; }
  else if (state.winner === you){ rt.classList.add('win'); rt.textContent='Ganaste'; }
  else { rt.classList.add('lose'); rt.textContent='Perdiste'; }
  const reasonTxt = state.reason==='time'
    ? `tiempo agotado · material ${state.material.w} — ${state.material.b}`
    : state.reason==='abandon' ? 'tu rival abandonó' : 'rey capturado';
  showScreen('result');
  $('overlaySub').textContent = reasonTxt;
}

// ============================================================
//  Sonido
// ============================================================
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
  o.type=type; o.frequency.setValueAtTime(f,t);
  if(kind==='cap'||kind==='end') o.frequency.exponentialRampToValueAtTime(f*0.5,t+d);
  if(kind==='go') o.frequency.exponentialRampToValueAtTime(f*1.5,t+d);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  o.start(t); o.stop(t+d+0.02);
}

// ============================================================
//  Toast + leyenda
// ============================================================
let toastTimer=null;
function showToast(msg){ toastEl.textContent=msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toastEl.classList.remove('show'),900); }
function buildLegend(){
  const row=$('legendRow'); row.innerHTML='';
  ['p','n','b','r','q','k'].forEach(t=>{
    const chip=document.createElement('div'); chip.className='chip';
    const recover = E.VALUE[t] ? '+'+(E.VALUE[t]*window.RSConfig.energy.captureRefund) : '—';
    chip.innerHTML=`<span class="g">${GLYPH[t]}</span> <b>${E.MOVE_COST[t]}</b> <i>${recover}</i>`;
    chip.title=`${NAME[t]}: cuesta ${E.MOVE_COST[t]}, comerlo da ${recover}`;
    row.appendChild(chip);
  });
}

// ============================================================
//  Botones
// ============================================================
btnQueue.addEventListener('click', () => { ensureAudio(); sendName(); send({t:'queue'}); });
btnAgain.addEventListener('click', () => { ensureAudio(); sendName(); send({t:'queue'}); });
btnCPU .addEventListener('click', () => { ensureAudio(); sendName(); send({t:'cpu'}); });
btnCPU2.addEventListener('click', () => { ensureAudio(); sendName(); send({t:'cpu'}); });
btnCancel.addEventListener('click', () => send({t:'cancel'}));
menuBtn.addEventListener('click', () => send({t:'leave'}));
// salas privadas
btnFriend.addEventListener('click', () => { showScreen('friend'); setTimeout(()=>codeInput.focus(),50); });
btnBack.addEventListener('click', () => showScreen('menu'));
btnCreate.addEventListener('click', () => { ensureAudio(); sendName(); send({t:'create', code: codeInput.value}); });
btnJoin.addEventListener('click', () => { ensureAudio(); sendName(); send({t:'join', code: codeInput.value}); });
btnCancelWait.addEventListener('click', () => send({t:'cancel'}));
codeInput.addEventListener('input', () => { codeInput.value = codeInput.value.toUpperCase(); codeErr.textContent=''; });
codeInput.addEventListener('keydown', (e) => { if (e.key==='Enter') btnJoin.click(); });
$('soundBtn').addEventListener('click', function(){ sfxOn=!sfxOn; this.textContent=sfxOn?'🔊 SFX':'🔇 SFX'; ensureAudio(); });
$('musicBtn').textContent = musicOn ? '🎵 Música' : '🔇 Música';
$('musicBtn').addEventListener('click', function(){
  musicOn = !musicOn;
  localStorage.setItem('rs-music', musicOn ? '1' : '0');
  this.textContent = musicOn ? '🎵 Música' : '🔇 Música';
  ensureAudio();
  updateAmbience();
});

// opciones del menú: nombre + arrastre (persisten en localStorage)
nameInput.value = myName;
dragToggle.checked = dragEnabled;
nameInput.addEventListener('change', sendName);
dragToggle.addEventListener('change', () => {
  dragEnabled = dragToggle.checked;
  localStorage.setItem('rs-drag', dragEnabled ? '1' : '0');
});

// arrastrar piezas (listeners globales; el grid se reconstruye pero gridEl persiste)
gridEl.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);
window.addEventListener('pointercancel', onPointerCancel);

// init
buildGrid(); lastYou = you;
buildLegend();
connect();