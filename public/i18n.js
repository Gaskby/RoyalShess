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
    'sub.learn':   { es: 'aprende jugando',        en: 'learn by playing' },
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
    'sub.settings':          { es: 'ajustes',  en: 'settings' },
    'settings.music':        { es: 'Música',   en: 'Music' },
    'settings.music.lofi':   { es: 'Lo-fi',    en: 'Lo-fi' },
    'settings.music.ambient':{ es: 'Ambient',  en: 'Ambient' },
    'settings.emotes':      { es: 'Emotes en partida', en: 'In-game emotes' },
    'settings.emotes.note': { es: 'pruebalo si te para tiltiarte',
                              en: 'just for salty players' },
    'menu.lang':    { es: 'Idioma',  en: 'Language' },
    'menu.search':  { es: 'Buscar partida',      en: 'Find match' },
    'menu.friend':  { es: 'Jugar con un amigo',  en: 'Play with a friend' },
    'menu.cpu':     { es: 'Jugar vs CPU',        en: 'Play vs CPU' },
    'menu.help':    { es: 'Cómo jugar',          en: 'How to play' },
    'menu.board':   { es: 'Clasificación',       en: 'Leaderboard' },
    'menu.resume':  { es: 'Volver a la partida', en: 'Back to the match' },
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
    'theme.locked':    { es: 'Tema bloqueado: gana el logro «{a}»', en: 'Locked theme: earn the “{a}” achievement' },

    // nombres de los temas (el color de cada uno vive en style.css)
    'theme.neon':      { es: 'Neón',      en: 'Neon' },
    'theme.chesscom':  { es: 'Clásico',   en: 'Classic' },
    'theme.madera':    { es: 'Madera',    en: 'Wood' },
    'theme.synthwave': { es: 'Synthwave', en: 'Synthwave' },
    'theme.crt':       { es: 'CRT',       en: 'CRT' },
    'theme.artico':    { es: 'Ártico',    en: 'Arctic' },
    'theme.oro':       { es: 'Oro',       en: 'Gold' },

    // logros: el nombre y la condición de cada uno. Se editan en achievements.js
    'menu.ach':   { es: 'Logros',  en: 'Achievements' },
    'sub.ach':    { es: 'logros',  en: 'achievements' },
    'ach.prog':   { es: 'Desbloqueados', en: 'Unlocked' },
    'ach.reward': { es: 'Tema {t}', en: '{t} theme' },
    'ach.got':    { es: '¡Logro desbloqueado: {a}!', en: 'Achievement unlocked: {a}!' },
    'ach.gotTheme': { es: '¡Logro «{a}» y tema {t} desbloqueados!', en: 'Achievement “{a}” and {t} theme unlocked!' },

    'ach.canibal.n':    { es: 'Caníbal', en: 'Cannibal' },
    'ach.canibal.d':    { es: 'Come cinco piezas en una sola partida.',
                          en: 'Capture five pieces in a single match.' },
    'ach.cazador.n':    { es: 'Cazador de leyendas', en: 'Legend hunter' },
    'ach.cazador.d':    { es: 'Vence a tu primer rival de la escalera.',
                          en: 'Beat your first ladder rival.' },
    'ach.sacrificio.n': { es: 'Sacrificio de dama', en: 'Queen sacrifice' },
    'ach.sacrificio.d': { es: 'Pierde tu dama y gana la partida igualmente.',
                          en: 'Lose your queen and win the match anyway.' },
    'ach.remontada.n':  { es: 'Remontada', en: 'Comeback' },
    'ach.remontada.d':  { es: 'Gana después de ir nueve puntos por debajo.',
                          en: 'Win after being nine points behind.' },
    'ach.ejecucion.n':  { es: 'Ejecución', en: 'Execution' },
    'ach.ejecucion.d':  { es: 'Captura el rey en menos de un minuto.',
                          en: 'Capture the king in under a minute.' },
    'ach.ahogo.n':      { es: 'Estrangulamiento', en: 'Stranglehold' },
    'ach.ahogo.d':      { es: 'Captura el rey con el rival sin energía para mover.',
                          en: 'Capture the king while the rival has no energy left to move.' },
    'ach.reydesnudo.n': { es: 'Rey desnudo', en: 'Bare king' },
    'ach.reydesnudo.d': { es: 'Deja al rival solo con su rey.',
                          en: 'Leave the rival with nothing but their king.' },
    'ach.intocable.n':  { es: 'Intocable', en: 'Untouched' },
    'ach.intocable.d':  { es: 'Gana sin perder ni una sola pieza.',
                          en: 'Win without losing a single piece.' },
    'ach.pesadilla.n':  { es: 'Campeón de la pesadilla', en: 'Nightmare champion' },
    'ach.pesadilla.d':  { es: 'Termina la torre entera en una vuelta pesadilla.',
                          en: 'Clear the whole tower on a nightmare run.' },
    'ach.impecable.n':  { es: 'Torre impecable', en: 'Flawless tower' },
    'ach.impecable.d':  { es: 'Vence la escalera entera sin perder ni una partida.',
                          en: 'Clear the whole ladder without losing a single match.' },
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

    // emotes: el texto sale al pasar el ratón y lo leen los lectores de pantalla
    'emote.senala':  { es: '¡Míralo!',        en: 'Look at you!' },
    'emote.aplauso': { es: 'Bravo, campeón',  en: 'Bravo, champ' },
    'emote.bostezo': { es: 'Qué sueño',       en: 'So sleepy' },
    'emote.llora':   { es: 'Llora más',       en: 'Cry more' },
    'emote.adios':   { es: 'Hasta luego',     en: 'Bye now' },
    'emote.corona':  { es: 'Te gana un peón', en: 'Beaten by a pawn' },
    'emote.open':    { es: 'Emotes',          en: 'Emotes' },

    // repeticiones
    'menu.replays':  { es: 'Repeticiones',      en: 'Replays' },
    'sub.replays':   { es: 'repeticiones',      en: 'replays' },
    'sub.replay':    { es: 'repetición',        en: 'replay' },
    'replay.watch':  { es: 'Ver repetición', en: 'Watch replay' },
    // botonera del reproductor: solo icono, el texto sale al pasar el ratón
    'replay.ctrl.restart': { es: 'Volver al principio', en: 'Back to start' },
    'replay.ctrl.prev':    { es: 'Jugada anterior',     en: 'Previous move' },
    'replay.ctrl.play':    { es: 'Reproducir / pausar', en: 'Play / pause' },
    'replay.ctrl.next':    { es: 'Jugada siguiente',    en: 'Next move' },
    'replay.ctrl.speed':   { es: 'Velocidad',           en: 'Speed' },
    'replay.empty':  { es: 'Aún no hay repeticiones. Juega una partida y su cinta se guarda aquí.',
                       en: 'No replays yet. Play a match and its tape is saved here.' },
    'replay.note':   { es: 'Se guardan tus últimas 10 partidas en este navegador.',
                       en: 'Your last 10 matches are saved in this browser.' },
    'replay.win':    { es: 'Victoria', en: 'Win' },
    'replay.lose':   { es: 'Derrota',  en: 'Loss' },
    'replay.draw':   { es: 'Empate',   en: 'Draw' },
    'replay.moves':  { es: '{n} jugadas', en: '{n} moves' },
    'replay.moves1': { es: '1 jugada',    en: '1 move' },
    'replay.end':    { es: 'FIN', en: 'END' },

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

    // === TUTORIAL JUGABLE (tutorial.js + coach.js) ======================
    // Quien dice todo esto es el peón de píxeles, así que las frases son
    // CORTAS: se escriben letra a letra y nadie espera a un parrafazo.
    'learn.start':    { es: 'Empezar',          en: 'Start' },
    'learn.continue': { es: 'Continuar',        en: 'Continue' },
    'learn.again':    { es: 'Repetir tutorial', en: 'Play it again' },
    'learn.rules':    { es: 'Reglas y trucos',  en: 'Rules & tricks' },
    'learn.retry':    { es: 'Reintentar',       en: 'Try again' },
    'learn.next':     { es: 'Siguiente',        en: 'Next' },
    'learn.skip':     { es: 'Saltar',           en: 'Skip' },
    'learn.finish':   { es: 'Terminar',         en: 'Finish' },
    'learn.exit':     { es: 'Salir',            en: 'Exit' },
    'learn.free':     { es: 'GRATIS',           en: 'FREE' },
    'learn.tally':    { es: '{a} de {b} lecciones', en: '{a} of {b} lessons' },
    'learn.cleared':  { es: '¡Lección superada!',   en: 'Lesson cleared!' },
    'learn.failed':   { es: 'Otra vez',             en: 'Once more' },
    'learn.locked':   { es: 'Termina el capítulo anterior para abrir este.',
                        en: 'Finish the previous chapter to open this one.' },
    'learn.grace.you': { es: 'Te comen el rey en {n} s', en: 'Your king falls in {n}s' },
    'learn.grace.foe': { es: 'Su rey cae en {n} s',      en: 'Their king falls in {n}s' },
    'learn.err.energy':  { es: 'Sin energía: eso cuesta {n}. Espera a que suba la barra.',
                           en: 'Not enough energy: that costs {n}. Wait for the bar to refill.' },
    'learn.err.grace':   { es: 'Ese rey aguanta {n} s más. Espera al aviso dorado.',
                           en: 'That king holds for {n}s more. Wait for the gold mark.' },
    'learn.err.noCheck': { es: 'Solo puedes comer un rey que esté en jaque.',
                           en: 'You can only capture a king that is in check.' },
    'learn.err.castle':  { es: 'Por ahí no: no se enroca en jaque ni pasando por casilla vigilada.',
                           en: 'Not that way: no castling in check or through a watched square.' },

    // capítulos (se abren en cadena)
    'learn.ch.basics': { es: 'Lo básico',       en: 'The basics' },
    'learn.ch.king':   { es: 'El rey',          en: 'The king' },
    'learn.ch.pieces': { es: 'Trucos de pieza', en: 'Piece tricks' },
    'learn.ch.fine':   { es: 'Jugadas finas',   en: 'Fine play' },

    // ---- capítulo 1: lo básico ----
    'learn.move.t':    { es: 'Mover',   en: 'Moving' },
    'learn.move.s':    { es: 'Toca una pieza y luego un punto', en: 'Tap a piece, then a dot' },
    'learn.move.goal': { es: 'Haz tu primer movimiento', en: 'Make your first move' },
    'learn.move.say':  { es: 'Hola. Aquí <b>no hay turnos</b>: mueves cuando te dé la gana. Toca el peón y luego un punto.',
                         en: 'Hi. There are <b>no turns</b> here: you move whenever you feel like it. Tap the pawn, then a dot.' },
    'learn.move.goal2':{ es: 'Ahora mueve otra pieza', en: 'Now move another piece' },
    'learn.move.say2': { es: 'Eso es. Tu rival tampoco espera: mueve a la vez que tú. Prueba con el caballo.',
                         en: 'That is it. Your opponent does not wait either: they move at the same time. Try the knight.' },
    'learn.move.ok':   { es: 'Ya sabes moverte. Lo que te frena no es el turno: es la <b>energía</b>.',
                         en: 'You can move now. What holds you back is not a turn: it is <b>energy</b>.' },

    'learn.energy.t':    { es: 'Energía', en: 'Energy' },
    'learn.energy.s':    { es: 'Gastar, quedarse seco y esperar', en: 'Spend it, run dry, wait' },
    'learn.energy.goal': { es: 'Haz 3 movimientos', en: 'Make 3 moves' },
    'learn.energy.say':  { es: 'Cada pieza cuesta lo que ves en su punto. La barra sube sola: <b>1 cada {regen} s</b>. Llevas 4: gástala.',
                           en: 'Each piece costs what its dot says. The bar refills itself: <b>1 every {regen}s</b>. You have 4: spend it.' },
    'learn.energy.say2': { es: 'Si no te llega, el punto sale a rayas y el tablero tiembla. Toca <b>esperar</b>: eso también es jugar.',
                           en: 'If you are short, the dot goes dashed and the board shakes. You have to <b>wait</b>: that is playing too.' },
    'learn.energy.ok':   { es: 'Esa barra es el reloj de verdad. Sin energía no existes.',
                           en: 'That bar is the real clock. With no energy you do not exist.' },

    'learn.capture.t':     { es: 'Comer', en: 'Capturing' },
    'learn.capture.s':     { es: 'Comer devuelve energía… casi siempre', en: 'Capturing refunds energy… usually' },
    'learn.capture.goal':  { es: 'Cómete el alfil negro', en: 'Capture the black bishop' },
    'learn.capture.say':   { es: 'Comer te devuelve parte de lo comido, así que atacar te mantiene vivo. Cómete el <b>alfil</b>.',
                             en: 'Capturing refunds part of what you take, so attacking keeps you alive. Take the <b>bishop</b>.' },
    'learn.capture.goal2': { es: 'Ahora cómete el peón', en: 'Now capture the pawn' },
    'learn.capture.say2':  { es: '¿Ves el <b>+</b> verde? Eso es energía de vuelta. Ahora el <b>peón</b>: los peones no dan nada.',
                             en: 'See the green <b>+</b>? That is energy back. Now the <b>pawn</b>: pawns give nothing.' },
    'learn.capture.ok':    { es: 'Comer piezas caras te mantiene lleno. Los peones no pagan, y tu dama nunca recupera.',
                             en: 'Taking expensive pieces keeps you full. Pawns pay nothing, and your queen never recovers.' },

    'learn.clock.t':    { es: 'El reloj', en: 'The clock' },
    'learn.clock.s':    { es: 'Si se acaba el tiempo, mandan los Puntos', en: 'If time runs out, Points decide' },
    'learn.clock.goal': { es: 'Ten más Puntos cuando suene', en: 'Lead on Points when it rings' },
    'learn.clock.say':  { es: 'La partida dura {min} min. Si nadie come al rey, gana quien tenga más <b>Puntos</b>. Vas perdiendo: cómete torre y alfil.',
                          en: 'A match lasts {min} min. If nobody eats a king, most <b>Points</b> wins. You are behind: take the rook and the bishop.' },
    'learn.clock.say2': { es: 'Bien, pero aún vas por detrás. Queda poco: sigue comiendo.',
                          en: 'Good, but you are still behind. Not much time left: keep eating.' },
    'learn.clock.say3': { es: '¡Ahora mandas tú! Aguanta la ventaja hasta que suene.',
                          en: 'Now you are ahead! Hold that lead until it rings.' },
    'learn.clock.ok':   { es: 'Eso es ganar por material: aquí el reloj también es un arma.',
                          en: 'That is winning on material: the clock is a weapon here too.' },
    'learn.clock.fail': { es: 'Sonó con el rival por delante. Cada pieza que comes son Puntos: no dejes que decida el reloj.',
                          en: 'It rang with your rival ahead. Every capture is Points: do not let the clock decide.' },

    // ---- capítulo 2: el rey ----
    'learn.check.t':     { es: 'Jaque', en: 'Check' },
    'learn.check.s':     { es: 'Rojo: {grace} s para reaccionar', en: 'Red: {grace}s to react' },
    'learn.check.goal':  { es: 'Vigila la torre negra', en: 'Watch the black rook' },
    'learn.check.say':   { es: 'Ojo con esa torre. Cuando el tablero se ponga <b>rojo</b>, estás en jaque.',
                           en: 'Careful with that rook. When the board turns <b>red</b>, you are in check.' },
    'learn.check.goal2': { es: 'Sal del jaque antes de que acabe la cuenta', en: 'Escape check before the count ends' },
    'learn.check.say2':  { es: '<b>¡Jaque!</b> Mover cuesta +{surcharge} y en {grace} s te comen el rey. Aquí no hay mate: ¡muévete!',
                           en: '<b>Check!</b> Moving costs +{surcharge} and in {grace}s they take your king. No mate here: move!' },
    'learn.check.ok':    { es: 'Salir del jaque es lo primero, siempre. Y ese +1 duele: ten energía guardada.',
                           en: 'Escaping check comes first, always. And that +1 hurts: keep energy in reserve.' },
    'learn.check.fail':  { es: 'Te comieron el rey. En jaque solo tienes {grace} s: no te quedes mirando.',
                           en: 'They took your king. In check you only get {grace}s: do not just stare.' },

    'learn.block.t':    { es: 'Rey acorralado', en: 'Cornered king' },
    'learn.block.s':    { es: 'Tapar la línea o comerte al que ataca', en: 'Block the line or eat the attacker' },
    'learn.block.goal': { es: 'Sal del jaque sin mover el rey', en: 'Escape check without moving the king' },
    'learn.block.say':  { es: 'Tu rey no tiene a dónde ir. Del jaque también se sale <b>tapando</b> la línea: mete el caballo o el alfil en medio. Tranquilo, aquí no corre el reloj.',
                          en: 'Your king has nowhere to go. You can also escape by <b>blocking</b> the line: put the knight or the bishop in the way. Relax, no clock here.' },
    'learn.block.ok':   { es: 'Tres salidas: mover el rey, tapar la línea o comerte al atacante. La más barata gana.',
                          en: 'Three ways out: move the king, block the line, or eat the attacker. The cheapest one wins.' },

    'learn.king.t':    { es: 'Ganar', en: 'Winning' },
    'learn.king.s':    { es: 'Se gana comiendo al rey, no por mate', en: 'You win by eating the king, not by mate' },
    'learn.king.goal': { es: 'Cómete al rey negro cuando brille en dorado', en: 'Take the black king when it glows gold' },
    'learn.king.say':  { es: 'Tu dama ya le da jaque, pero el rey aguanta <b>{grace} s</b> protegido. Espera al brillo dorado y cómelo.',
                         en: 'Your queen has it in check, but the king is protected for <b>{grace}s</b>. Wait for the gold glow, then take it.' },
    'learn.king.ok':   { es: '¡Así se gana! Sin jaque mate: capturando. Ese margen también te salva a ti.',
                         en: 'That is how you win! No checkmate: you capture. That margin saves you too.' },

    'learn.castle.t':    { es: 'Enroque', en: 'Castling' },
    'learn.castle.s':    { es: 'Saca al rey del centro de un golpe', en: 'Get the king out of the middle' },
    'learn.castle.goal': { es: 'Enroca: mueve el rey dos casillas', en: 'Castle: move the king two squares' },
    'learn.castle.say':  { es: 'Rey en el centro, mala vida. Muévelo <b>dos casillas</b> hacia la torre y ella salta sola. Al otro lado no te deja: esa columna está vigilada.',
                           en: 'King in the middle is a bad life. Move it <b>two squares</b> toward the rook and the rook jumps by itself. The other side is blocked: that file is watched.' },
    'learn.castle.ok':   { es: 'Cuesta como un movimiento normal del rey y te lo deja a salvo. Casi siempre vale la pena.',
                           en: 'It costs a normal king move and tucks it away. Almost always worth it.' },

    // ---- capítulo 3: trucos de cada pieza ----
    'learn.pawn.t':     { es: 'Racha del peón', en: 'Pawn streak' },
    'learn.pawn.s':     { es: 'Repetir el mismo peón sale caro', en: 'Pushing the same pawn gets pricey' },
    'learn.pawn.goal':  { es: 'Mueve el MISMO peón 3 veces', en: 'Move the SAME pawn 3 times' },
    'learn.pawn.say':   { es: 'Mira el número del punto mientras empujas el mismo peón: <b>1, 2, 3…</b> Cada repetición cuesta +1.',
                          en: 'Watch the number on the dot as you push the same pawn: <b>1, 2, 3…</b> Each repeat costs +1.' },
    'learn.pawn.goal2': { es: 'Ahora mueve otra pieza', en: 'Now move another piece' },
    'learn.pawn.say2':  { es: '¿Ves cómo sube? Mueve otra cosa y la racha se <b>reinicia</b>. Correr con un solo peón te arruina.',
                          en: 'See it climb? Move anything else and the streak <b>resets</b>. Running with one pawn ruins you.' },
    'learn.pawn.ok':    { es: 'Alterna piezas y pagas el precio de tabla. Emperrarte con un peón es tirar energía.',
                          en: 'Alternate pieces and you pay list price. Obsessing over one pawn burns energy.' },

    'learn.knight.t':     { es: 'Caballo', en: 'Knight' },
    'learn.knight.s':     { es: 'Después de comer, salta más barato', en: 'After a meal it jumps cheaper' },
    'learn.knight.goal':  { es: 'Cómete el alfil con el caballo', en: 'Take the bishop with the knight' },
    'learn.knight.say':   { es: 'El caballo es caro, pero tiene premio. Cómete el <b>alfil</b> y no quites ojo al número.',
                            en: 'The knight is expensive, but it gets a perk. Take the <b>bishop</b> and watch the number.' },
    'learn.knight.goal2': { es: 'Ahora salta a una casilla vacía', en: 'Now jump to an empty square' },
    'learn.knight.say2':  { es: 'Vale menos, ¿ves? Tras comer, su siguiente salto <b>sin captura</b> cuesta 1 menos. Come y sigue.',
                            en: 'Cheaper, right? After a capture, its next jump <b>without capturing</b> costs 1 less. Eat and keep moving.' },
    'learn.knight.ok':    { es: 'Un caballo que come es un caballo que corre. Encadena capturas y saltos.',
                            en: 'A knight that eats is a knight that runs. Chain captures and jumps.' },

    'learn.queen.t':     { es: 'Dama', en: 'Queen' },
    'learn.queen.s':     { es: 'Se abarata comiendo, pero no recupera', en: 'Gets cheaper by eating, never refunds' },
    'learn.queen.goal':  { es: 'Cómete el caballo con la dama', en: 'Take the knight with the queen' },
    'learn.queen.say':   { es: 'La dama es cara y encima <b>nunca</b> recupera al comer. Cómete el <b>caballo</b> y mira la barra: no sube.',
                           en: 'The queen is expensive and <b>never</b> refunds on a capture. Take the <b>knight</b> and watch the bar: it will not rise.' },
    'learn.queen.goal2': { es: 'Ahora cómete el alfil', en: 'Now take the bishop' },
    'learn.queen.say2':  { es: 'Cero energía de vuelta, pero cada captura la <b>abarata 1</b> (nunca por debajo de {qmin}). Cómete el alfil.',
                           en: 'No energy back, but each capture makes her <b>1 cheaper</b> (never under {qmin}). Take the bishop.' },
    'learn.queen.ok':    { es: 'Una dama con hambre se mueve casi gratis. Pero si te la comen, adiós al descuento.',
                           en: 'A hungry queen moves almost free. Lose her and the discount goes with her.' },

    'learn.rook.t':     { es: 'Carriles de torre', en: 'Rook lanes' },
    'learn.rook.s':     { es: 'Cruzar la línea de una torre cuesta +{toll}', en: 'Crossing a rook line costs +{toll}' },
    'learn.rook.goal':  { es: 'Cruza el carril con el alfil', en: 'Cross the lane with the bishop' },
    'learn.rook.say':   { es: 'Esa línea que brilla es el <b>carril</b> de la torre negra: se enciende con más de {lanelen} casillas libres. Cruza con el alfil y mira el precio.',
                          en: 'That glowing line is the black rook <b>lane</b>: it lights up past {lanelen} free squares. Cross it with the bishop and watch the price.' },
    'learn.rook.goal2': { es: 'Ahora cruza con el caballo', en: 'Now cross with the knight' },
    'learn.rook.say2':  { es: 'Te cobró +{toll} por pasar. Pero el caballo <b>salta</b>: prueba con él y no paga peaje.',
                          en: 'It charged you +{toll} to pass. But the knight <b>jumps</b>: try it and it pays no toll.' },
    'learn.rook.ok':    { es: 'Las torres cobran por pasar. O rodeas, o saltas, o pagas.',
                          en: 'Rooks charge a toll. Go around, jump over, or pay up.' },

    // ---- capítulo 4: jugadas finas ----
    'learn.freecap.t':    { es: 'Recaptura gratis', en: 'Free recapture' },
    'learn.freecap.s':    { es: 'Te comen algo defendido: la venganza es gratis', en: 'They take a defended piece: revenge is free' },
    'learn.freecap.goal': { es: 'Cómete al alfil: no cuesta nada', en: 'Eat the bishop: it costs nothing' },
    'learn.freecap.say':  { es: 'Solo te queda 1 de energía y ese alfil viene a comerse tu peón… que está <b>defendido</b> por el caballo. Déjale.',
                            en: 'You have 1 energy left and that bishop is coming for your pawn… which the knight <b>defends</b>. Let it.' },
    'learn.freecap.say2': { es: 'Ahí lo tienes, en dorado: comerte al agresor en esa casilla es <b>gratis</b>. Véngate.',
                            en: 'There it is, in gold: eating the attacker on that square is <b>free</b>. Get even.' },
    'learn.freecap.ok':   { es: 'Por eso se defienden las piezas: quien come primero paga, tú recuperas de balde.',
                            en: 'That is why you defend pieces: whoever eats first pays, you take it back for free.' },

    'learn.promote.t':    { es: 'Coronación', en: 'Promotion' },
    'learn.promote.s':    { es: 'El peón que llega arriba se hace dama', en: 'A pawn that gets to the end becomes a queen' },
    'learn.promote.goal': { es: 'Lleva el peón a la última fila', en: 'Push the pawn to the last rank' },
    'learn.promote.say':  { es: 'Ese peón está a un paso del final. Empújalo: arriba se convierte en <b>dama</b>, sin preguntar.',
                            en: 'That pawn is one step from the end. Push it: up there it becomes a <b>queen</b>, no questions asked.' },
    'learn.promote.ok':   { es: 'De costar 1 a costar lo que cuesta una dama… y de regalo, jaque. Un peón avanzado vale oro.',
                            en: 'From costing 1 to costing a queen… and a check for free. An advanced pawn is gold.' },

    'learn.spar.t':    { es: 'Duelo final', en: 'Final duel' },
    'learn.spar.s':    { es: 'Todo junto contra la máquina', en: 'Everything at once against the machine' },
    'learn.spar.goal': { es: 'Captura al rey negro', en: 'Capture the black king' },
    'learn.spar.say':  { es: 'Se acabaron las clases. Los dos con energía, a la vez y sin turnos. Dale jaque, aguanta los {grace} s y cómetelo.',
                         en: 'Class is over. Both on energy, at the same time, no turns. Give check, survive the {grace}s and eat it.' },
    'learn.spar.ok':   { es: 'Estás listo. Eso es RoyalShess; las de verdad duran {min} minutos y el rival piensa más. Ve a por ellos.',
                         en: 'You are ready. That is RoyalShess; real ones last {min} minutes and the rival thinks harder. Go get them.' },
    'learn.spar.fail': { es: 'Te comieron el rey. Mira también SU barra: cuando se le llena, algo trama.',
                         en: 'They took your king. Watch THEIR bar too: when it fills up, they are plotting.' },

    // tutorial de bienvenida: recorre el menú principal la primera visita
    'tour.title': { es: 'Tutorial',   en: 'Tutorial' },
    'tour.skip':  { es: 'Saltar',     en: 'Skip' },
    'tour.next':  { es: 'Siguiente',  en: 'Next' },
    'tour.done':  { es: '¡A jugar!',  en: "Let's play!" },
    'tour.welcome': {
      es: '¡Bienvenido a <b>RoyalShess</b>! Aquí el ajedrez es en tiempo real: no hay turnos, mueves cuando tu energía te lo permite. Te enseño el menú en un momento.',
      en: 'Welcome to <b>RoyalShess</b>! Chess here is real-time: no turns, you move whenever your energy allows it. Let me show you around the menu.',
    },
    'tour.name': {
      es: 'Escribe aquí tu nombre para que tu rival sepa quién le está ganando. Es opcional y se guarda para la próxima vez.',
      en: 'Type your name here so your opponent knows who is beating them. Optional, and it is saved for next time.',
    },
    'tour.search': {
      es: 'Partida online contra un rival al azar. Son las únicas partidas que puntúan en la clasificación.',
      en: 'Online match against a random opponent. These are the only games rated on the leaderboard.',
    },
    'tour.friend': {
      es: 'Crea una sala privada con código o únete a la de tu amigo. Quien crea la sala elige duración, energía y hasta el coste de cada pieza.',
      en: "Create a private room with a code or join your friend's. The room creator picks duration, energy and even each piece's cost.",
    },
    'tour.ladder': {
      es: 'La torre de las leyendas: derrota a los grandes maestros uno a uno, desde abajo hasta la cima. Algo te espera arriba…',
      en: 'The tower of legends: defeat the grandmasters one by one, from the bottom to the top. Something awaits up there…',
    },
    'tour.board': {
      es: 'La clasificación global: Elo, victorias y derrotas de todos los jugadores.',
      en: 'The global leaderboard: Elo, wins and losses for every player.',
    },
    'tour.help': {
      es: 'Tutorial jugable: seis lecciones cortas donde mueves tú y no se avanza hasta que lo pillas. Si es tu primera partida, empieza por aquí.',
      en: 'A playable tutorial: six short lessons where you do the moving and nothing advances until you get it. First match? Start here.',
    },
    'tour.settings': {
      es: 'Ajustes: tema visual, música, arrastre de piezas, los <b>emotes</b> (que vienen apagados) y tus <b>repeticiones</b> guardadas.',
      en: 'Settings: visual theme, music, piece dragging, <b>emotes</b> (off by default) and your saved <b>replays</b>.',
    },
    'tour.lang': {
      es: 'Cambia el idioma del juego cuando quieras desde aquí.',
      en: 'Switch the game language any time from here.',
    },
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
      .replace('{surcharge}', C.energy.checkSurcharge)
      .replace('{toll}', C.rules.rookLineToll)
      .replace('{lanelen}', C.rules.rookLineLen)
      .replace('{qmin}', C.rules.queenMinCost)
      .replace('{qmin}', C.rules.queenMinCost);
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
