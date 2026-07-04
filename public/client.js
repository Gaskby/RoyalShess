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
      codeInput = $('codeInput'), codeErr = $('codeErr'), codeValue = $('codeValue');
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
      piecesEl.appendChild(el);
      pieceEls.set(p.id, el);
      setTimeout(() => el.classList.remove('pop'), 240);
    }
    el.textContent = GLYPH[p.type];
    el.className = 'piece ' + p.color;
    const { dr, dc } = toDisplay(r, c);
    el.style.transform = `translate(${dc*100}%, ${dr*100}%)`;
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
  const max = state.maxEnergy || 10;
  for (const side of ['w','b']){
    const pct = (state.energy[side]/max)*100;
    $('ef'+side.toUpperCase()).style.width = pct + '%';
    const v = Math.floor(state.energy[side]*10)/10;
    $('en'+side.toUpperCase()).textContent = (v % 1 === 0) ? v : v.toFixed(1);
  }
  $('matW').textContent = state.material.w;
  $('matB').textContent = state.material.b;
  $('cardW').classList.toggle('check', state.check.w);
  $('cardB').classList.toggle('check', state.check.b);
  boardWrap.classList.toggle('edge-w', state.check.w);
  boardWrap.classList.toggle('edge-b', state.check.b);
  // etiquetas TÚ / Rival según tu color
  const oppTag = state.vsCPU ? '· CPU' : '· Rival';
  $('tagW').textContent = you==='w' ? '· TÚ' : oppTag;
  $('tagW').style.color = you==='w' ? 'var(--white-acc)' : 'var(--ink-dim)';
  $('tagB').textContent = you==='b' ? '· TÚ' : oppTag;
  $('tagB').style.color = you==='b' ? 'var(--black-acc)' : 'var(--ink-dim)';
  // reloj
  const s = Math.max(0, Math.ceil(state.timeLeft/1000));
  clockEl.textContent = `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  clockEl.classList.toggle('low', s<=30 && state.phase==='live');
}

// ============================================================
//  Interacción -> intención al servidor
// ============================================================
function onSquareClick(e){
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
  ws.onopen  = () => { setStatus(true, 'Conectado'); enableMenu(true); };
  ws.onclose = () => { setStatus(false, 'Sin conexión'); enableMenu(false); showScreen('menu'); setTimeout(connect, 1500); };
  ws.onerror = () => setStatus(false, 'Error de red');
  ws.onmessage = (ev) => {
    let msg; try { msg = JSON.parse(ev.data); } catch(_e){ return; }
    if (msg.t === 'welcome' || msg.t === 'lobby'){ state=null; selected=null; prevPhase=null; showScreen('menu'); return; }
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
  render();
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
btnQueue.addEventListener('click', () => { ensureAudio(); send({t:'queue'}); });
btnAgain.addEventListener('click', () => { ensureAudio(); send({t:'queue'}); });
btnCPU .addEventListener('click', () => { ensureAudio(); send({t:'cpu'}); });
btnCPU2.addEventListener('click', () => { ensureAudio(); send({t:'cpu'}); });
btnCancel.addEventListener('click', () => send({t:'cancel'}));
menuBtn.addEventListener('click', () => send({t:'leave'}));
// salas privadas
btnFriend.addEventListener('click', () => { showScreen('friend'); setTimeout(()=>codeInput.focus(),50); });
btnBack.addEventListener('click', () => showScreen('menu'));
btnCreate.addEventListener('click', () => { ensureAudio(); send({t:'create', code: codeInput.value}); });
btnJoin.addEventListener('click', () => { ensureAudio(); send({t:'join', code: codeInput.value}); });
btnCancelWait.addEventListener('click', () => send({t:'cancel'}));
codeInput.addEventListener('input', () => { codeInput.value = codeInput.value.toUpperCase(); codeErr.textContent=''; });
codeInput.addEventListener('keydown', (e) => { if (e.key==='Enter') btnJoin.click(); });
$('soundBtn').addEventListener('click', function(){ sfxOn=!sfxOn; this.textContent=sfxOn?'🔊 SFX':'🔇 SFX'; ensureAudio(); });

// init
buildGrid(); lastYou = you;
buildLegend();
connect();
