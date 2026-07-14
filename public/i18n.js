/* RoyalShess ARCHIVO DE IDIOMAS. AQUÍ SE EDITAN TODOS LOS TEXTOS DEL JUEGO. <<<. Cada texto es una fila; cada idioma es una columna es, en, ..... Para AÑADIR UN IDIOMA: añade su código a LANGS y su columna a cada fila.. El botón del menú aparece solo. Si a una fila le falta un idioma, se usa. el primero de LANGS como respaldo.. Tokens: min regen grace late surcharge se rellenan desde config.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.RSI18N = factory(root);
})(typeof self !== 'undefined' ? self : this, function (root) {

  const LANGS = ['es', 'en'];

  const STRINGS = {
    // barra superior
    'status.connecting': { es: 'Conectando…',   en: 'Connecting…' },
    'status.connected':  { es: 'Conectado',     en: 'Connected' },
    'status.offline':    { es: 'Sin conexión',  en: 'Offline' },
    'status.netError':   { es: 'Error de red',  en: 'Network error' },
    'top.music':         { es: 'Música',        en: 'Music' },
    'top.menu':          { es: 'Menú',          en: 'Menu' },

    // tarjetas de jugador
    'card.white':   { es: 'Blancas',  en: 'White' },
    'card.black':   { es: 'Negras',   en: 'Black' },
    'card.energy':  { es: 'Energía',  en: 'Energy' },
    'card.points':  { es: 'Puntos',   en: 'Points' },
    'card.check':   { es: 'JAQUE +1', en: 'CHECK +1' },
    'tag.you':      { es: 'TÚ',       en: 'YOU' },
    'tag.rival':    { es: 'Rival',    en: 'Opponent' },
    'tag.cpu':      { es: 'CPU',      en: 'CPU' },

    // piezas
    'piece.p': { es: 'Peón',    en: 'Pawn' },
    'piece.n': { es: 'Caballo', en: 'Knight' },
    'piece.b': { es: 'Alfil',   en: 'Bishop' },
    'piece.r': { es: 'Torre',   en: 'Rook' },
    'piece.q': { es: 'Dama',    en: 'Queen' },
    'piece.k': { es: 'Rey',     en: 'King' },

    // leyenda bajo el tablero
    'legend.title': { es: 'Coste de mover · recuperas al comer',
                      en: 'Move cost · recover on capture' },
    'legend.chip':  { es: '{name}: cuesta {cost}, comerlo da {rec}',
                      en: '{name}: costs {cost}, capturing it gives {rec}' },
    'legend.body':  {
      es: 'Cada pieza cuesta energía al moverse y regeneras <b style="color:var(--energy-a)">1 cada {regen}&nbsp;s</b> (continuo, x2 en el último minuto). Sin energía no puedes mover. Comer devuelve parte del valor de lo comido. En <b style="color:var(--danger)">jaque</b>, mover cuesta +{surcharge}. Ganas por capturar el rey; al agotarse el tiempo, gana quien tenga más Puntos. <b>El servidor valida todo.</b>',
      en: 'Each piece costs energy to move and you regenerate <b style="color:var(--energy-a)">1 every {regen}&nbsp;s</b> (continuous, x2 in the final minute). Without energy you cannot move. Capturing refunds part of the captured value. While in <b style="color:var(--danger)">check</b>, moving costs +{surcharge}. Capture the king to win; if time runs out, most Points wins. <b>The server validates everything.</b>',
    },

    // overlay: subtítulos
    'sub.default': { es: 'ajedrez en tiempo real', en: 'real-time chess' },
    'sub.search':  { es: 'emparejando…',           en: 'matchmaking…' },
    'sub.friend':  { es: 'sala privada',           en: 'private room' },
    'sub.help':    { es: 'cómo jugar',             en: 'how to play' },
    'sub.board':   { es: 'clasificación',          en: 'leaderboard' },

    // clasificación
    'board.h.player': { es: 'Jugador',  en: 'Player' },
    'board.h.record': { es: 'G/P/E',    en: 'W/L/D' },
    'board.you':      { es: 'Tu posición', en: 'Your rank' },
    'board.empty':    { es: 'Aún no hay partidas puntuadas.', en: 'No rated matches yet.' },
    'board.note':     { es: 'Solo puntúan las partidas de «Buscar partida».', en: 'Only “Find match” games are rated.' },
    'board.loading':  { es: 'Cargando…', en: 'Loading…' },

    // menú principal
    'menu.name.ph': { es: 'TU NOMBRE (OPCIONAL)', en: 'YOUR NAME (OPTIONAL)' },
    'menu.drag':    { es: 'Arrastrar piezas para mover', en: 'Drag pieces to move' },
    'menu.theme':   { es: 'Tema',    en: 'Theme' },
    'menu.theme.neon':    { es: 'Neón',    en: 'Neon' },
    'menu.theme.classic': { es: 'Clásico', en: 'Classic' },
    'menu.lang':    { es: 'Idioma',  en: 'Language' },
    'menu.search':  { es: 'Buscar partida',      en: 'Find match' },
    'menu.friend':  { es: 'Jugar con un amigo',  en: 'Play with a friend' },
    'menu.cpu':     { es: 'Jugar vs CPU',        en: 'Play vs CPU' },
    'menu.help':    { es: 'Cómo jugar',          en: 'How to play' },
    'menu.board':   { es: 'Clasificación',       en: 'Leaderboard' },
    'menu.resume':  { es: '▶ Volver a la partida', en: '▶ Back to the match' },
    'menu.ladder':  { es: 'Escalera de leyendas', en: 'Ladder of legends' },
    'sub.ladder':   { es: 'escalera de leyendas', en: 'ladder of legends' },
    'ladder.play':  { es: 'Pelear', en: 'Fight' },
    'ladder.prog':  { es: 'Leyendas vencidas', en: 'Legends defeated' },
    'ladder.next':  { es: 'Siguiente rival', en: 'Next rival' },
    'ladder.done':  { es: '¡Escalera completada! Eres la nueva leyenda.', en: 'Ladder complete! You are the new legend.' },
    'ladder.hidden':{ es: 'Rival oculto', en: 'Hidden rival' },
    'ladder.awaken':{ es: 'Algo despierta en la cima de la torre...', en: 'Something awakens at the top of the tower...' },
    'ladder.nightmare': { es: 'Pesadilla', en: 'Nightmare' },
    'ladder.ngplus':    { es: '☠ Nueva vuelta: modo pesadilla', en: '☠ New run: nightmare mode' },
    'ladder.loopStart': { es: 'El espíritu de Deep Blue posee la torre...', en: 'The spirit of Deep Blue possesses the tower...' },
    'ladder.doneNightmare': { es: '¡Pesadilla superada! Ni la máquina pudo contigo.', en: 'Nightmare cleared! Not even the machine could stop you.' },
    'theme.locked':    { es: 'Tema bloqueado: supera el modo pesadilla para ganarlo', en: 'Locked theme: beat nightmare mode to earn it' },
    'reward.unlocked': { es: '¡Tema TERMINAL CRT y corona de campeón desbloqueados!', en: 'TERMINAL CRT theme and champion crown unlocked!' },
    'menu.note': {
      es: '<b>Buscar partida:</b> rival al azar. <b>Con un amigo:</b> sala privada con código. <b>Escalera:</b> derrota a las leyendas una a una. No hay turnos: cada quien mueve cuando tiene energía. La partida dura {min} minutos.',
      en: '<b>Find match:</b> random opponent. <b>With a friend:</b> private room with a code. <b>Ladder:</b> defeat the legends one by one. No turns: everyone moves whenever they have energy. Matches last {min} minutes.',
    },

    // sala privada
    'friend.code.ph':  { es: 'CÓDIGO / CONTRASEÑA', en: 'CODE / PASSWORD' },
    'friend.duration': { es: 'Duración',        en: 'Duration' },
    'friend.start':    { es: 'Energía inicial', en: 'Starting energy' },
    'friend.regen':    { es: 'Regeneración',    en: 'Regeneration' },
    'friend.regenOpt': { es: '1 cada {n} s',    en: '1 every {n}s' },
    'friend.pieces':   { es: 'Piezas: coste de mover y energía al comerlas',
                         en: 'Pieces: move cost & energy when captured' },
    'friend.h.cost':   { es: 'Coste',      en: 'Cost' },
    'friend.h.eat':    { es: 'Al comerla', en: 'On capture' },
    'friend.create':   { es: 'Crear sala',   en: 'Create room' },
    'friend.join':     { es: 'Unirse a sala', en: 'Join room' },
    'friend.back':     { es: 'Volver',       en: 'Back' },
    'friend.note': {
      es: 'Para <b>crear</b>: elige un código y compártelo (si lo dejas vacío se genera uno). Para <b>unirte</b>: escribe el código que tu amigo creó. Los ajustes solo aplican a la sala que <b>tú crees</b>.',
      en: 'To <b>create</b>: pick a code and share it (leave it empty to generate one). To <b>join</b>: type the code your friend created. Settings only apply to the room <b>you create</b>.',
    },

    // espera / búsqueda
    'wait.title':  { es: 'Sala creada · esperando…', en: 'Room created · waiting…' },
    'wait.code':   { es: 'Código', en: 'Code' },
    'wait.note': {
      es: 'Comparte este código con tu amigo. Cuando lo escriba en “Unirse a sala”, empieza la partida.',
      en: 'Share this code with your friend. The match starts when they enter it in “Join room”.',
    },
    'common.cancel': { es: 'Cancelar', en: 'Cancel' },
    'search.title':  { es: 'Buscando rival…', en: 'Searching for opponent…' },

    // resultado
    'result.win':         { es: 'Ganaste',   en: 'You win' },
    'result.lose':        { es: 'Perdiste',  en: 'You lose' },
    'result.draw':        { es: 'Empate',    en: 'Draw' },
    'reason.time':        { es: 'tiempo agotado · puntos {w} — {b}', en: 'time over · points {w} — {b}' },
    'reason.abandon':     { es: 'tu rival abandonó', en: 'your opponent left' },
    'reason.king':        { es: 'rey capturado',     en: 'king captured' },
    'result.rematch':     { es: 'Revancha',          en: 'Rematch' },
    'result.rematchWait': { es: 'Esperando rival…',  en: 'Waiting for opponent…' },
    'result.again':       { es: 'Buscar otra',       en: 'Find another' },
    'result.cpu':         { es: 'vs CPU',            en: 'vs CPU' },
    'result.menu':        { es: 'Menú principal',    en: 'Main menu' },

    // avisos toasts
    'toast.noEnergy':     { es: 'Sin energía',        en: 'No energy' },
    'toast.illegal':      { es: 'Movimiento ilegal',  en: 'Illegal move' },
    'toast.notYours':     { es: 'No es tu pieza',     en: 'Not your piece' },
    'toast.notRunning':   { es: 'Aún no empieza',     en: 'Not started yet' },
    'toast.kingGrace':    { es: 'Espera {grace} s tras el jaque', en: 'Wait {grace}s after check' },
    'toast.rejected':     { es: 'Rechazado',          en: 'Rejected' },
    'toast.toll':         { es: 'Carril de torre: +{n}', en: 'Rook lane: +{n}' },
    'toast.freecap':      { es: '¡Recaptura gratis!',    en: 'Free recapture!' },
    'toast.rematchOffer': { es: '¡Tu rival quiere revancha!', en: 'Your opponent wants a rematch!' },
    'banner.oppGone':     { es: 'Rival desconectado · esperando reconexión…', en: 'Opponent disconnected · waiting to reconnect…' },
    'toast.oppBack':      { es: 'Rival reconectó', en: 'Opponent reconnected' },
    'toast.resumed':      { es: 'Reconectado a la partida', en: 'Reconnected to the match' },
    'err.codeInUse':      { es: 'Ese código ya está en uso, elige otro.', en: 'That code is already in use, pick another.' },
    'err.roomMissing':    { es: 'No existe una sala con ese código.',     en: 'No room exists with that code.' },
    'err.codeEmpty':      { es: 'Escribe un código para unirte.',         en: 'Type a code to join.' },
    'err.roomFull':       { es: 'Esa sala ya está completa.',             en: 'That room is already full.' },
    'err.inRoom':         { es: 'Ya estás en una sala.',                  en: 'You are already in a room.' },
    'err.rivalGone':      { es: 'Tu rival ya se fue.',                    en: 'Your opponent already left.' },

    // juego
    'game.go': { es: '¡YA!', en: 'GO!' },

    // tutorial cómo jugar
    'tut.demoHint': { es: 'Toca una regla para ver el ejemplo ▶', en: 'Tap a rule to see an example ▶' },
    'tut.1':  { es: 'Sin turnos: mueve cuando tengas energía. Se regenera 1 cada {regen} s (x2 en el último minuto).',
                en: 'No turns: move whenever you have energy. It regenerates 1 every {regen}s (x2 in the final minute).' },
    'tut.2':  { es: 'Cada pieza tiene un coste de movimiento (tabla bajo el tablero). Mueve con clic o arrastrando.',
                en: 'Each piece has a move cost (table under the board). Move by clicking or dragging.' },
    'tut.3':  { es: 'Comer devuelve parte del valor de lo comido. Peones y dama no reciben reembolso, y comer peones no da nada.',
                en: 'Capturing refunds part of the captured value. Pawns and the queen get no refund, and capturing pawns gives nothing.' },
    'tut.4':  { es: 'En jaque, mover cuesta +{surcharge} y el tablero se pone rojo. Si el jaque dura {grace} s, tu rey puede ser capturado: ¡reacciona!',
                en: 'In check, moving costs +{surcharge} and the board turns red. If the check lasts {grace}s your king can be captured: react!' },
    'tut.5':  { es: 'Ganas capturando al rey rival; si se acaba el tiempo, gana quien tenga más Puntos.',
                en: 'Capture the enemy king to win; if time runs out, most Points wins.' },
    'tut.6':  { es: 'Peón: mover el mismo peón varias veces seguidas cuesta +1 extra acumulativo.',
                en: 'Pawn: moving the same pawn repeatedly costs a stacking +1.' },
    'tut.7':  { es: 'Caballo: después de comer, su siguiente salto sin captura cuesta 1 menos.',
                en: 'Knight: after capturing, its next non-capture jump costs 1 less.' },
    'tut.8':  { es: 'Dama: cada captura abarata sus movimientos en 1 (con tope), pero nunca recupera energía al comer.',
                en: 'Queen: each capture makes her moves 1 cheaper (to a floor), but she never refunds energy on captures.' },
    'tut.9':  { es: 'Torre: sus líneas largas y despejadas brillan; cruzar ese carril cuesta +1.',
                en: 'Rook: long open rook lanes glow; crossing a lane costs +1.' },
    'tut.10': { es: 'Recaptura gratis: si te comen una pieza protegida, comerte al agresor en esa casilla no cuesta energía (marca dorada).',
                en: 'Free recapture: if a defended piece of yours is taken, capturing the attacker on that square costs nothing (gold mark).' },
    'tut.11': { es: 'Enroque disponible si el rey y la torre no se han movido; cuesta como un movimiento normal del rey.',
                en: 'Castling is available if the king and rook have not moved; it costs a normal king move.' },
  };

  let lang = LANGS[0];

  // rellena tokens x con valores de config.js si está cargada
  function fill(s) {
    if (s.indexOf('{') === -1) return s;
    const C = root && root.RSConfig;
    if (!C) return s;
    return s
      .replace('{min}', C.match.minutes)
      .replace('{regen}', C.energy.regenSecondsPerPoint)
      .replace('{grace}', C.rules.kingGraceMs / 1000)
      .replace('{late}', C.energy.lateSeconds)
      .replace('{surcharge}', C.energy.checkSurcharge);
  }

  function t(key) {
    const row = STRINGS[key];
    if (!row) return key;
    return fill(row[lang] != null ? row[lang] : row[LANGS[0]]);
  }

  return {
    LANGS,
    t,
    setLang(l) { if (LANGS.includes(l)) lang = l; },
    getLang() { return lang; },
  };
});
