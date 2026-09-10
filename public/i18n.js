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

    // tutorial interactivo (tutorial.js): se aprende jugando, no leyendo
    'learn.start':    { es: 'Empezar',          en: 'Start' },
    'learn.continue': { es: 'Continuar',        en: 'Continue' },
    'learn.again':    { es: 'Repetir tutorial', en: 'Play it again' },
    'learn.rules':    { es: 'Reglas y trucos',  en: 'Rules & tricks' },
    'learn.retry':    { es: 'Reintentar',       en: 'Try again' },
    'learn.next':     { es: 'Siguiente',        en: 'Next' },
    'learn.skip':     { es: 'Saltar',           en: 'Skip' },
    'learn.finish':   { es: 'Terminar',         en: 'Finish' },
    'learn.exit':     { es: 'Salir',            en: 'Exit' },
    'learn.tally':    { es: '{a} de {b} lecciones', en: '{a} of {b} lessons' },
    'learn.cleared':  { es: '¡Lección superada!',   en: 'Lesson cleared!' },
    'learn.failed':   { es: 'Otra vez',             en: 'Once more' },
    'learn.grace.you': { es: 'Te comen el rey en {n} s', en: 'Your king falls in {n}s' },
    'learn.grace.foe': { es: 'Su rey cae en {n} s',      en: 'Their king falls in {n}s' },
    'learn.err.energy':  { es: 'Sin energía: eso cuesta {n}. Espera a que suba la barra.',
                           en: 'Not enough energy: that costs {n}. Wait for the bar to refill.' },
    'learn.err.grace':   { es: 'Ese rey aguanta {n} s más. Espera al aviso dorado.',
                           en: 'That king holds for {n}s more. Wait for the gold mark.' },
    'learn.err.noCheck': { es: 'Solo puedes comer un rey que esté en jaque.',
                           en: 'You can only capture a king that is in check.' },

    'learn.move.t':    { es: 'Mover',   en: 'Moving' },
    'learn.move.s':    { es: 'Toca una pieza y luego un punto', en: 'Tap a piece, then a dot' },
    'learn.move.goal': { es: 'Haz tu primer movimiento', en: 'Make your first move' },
    'learn.move.say':  { es: 'Aquí <b>no hay turnos</b>: mueves cuando quieras, sin esperar a nadie. Toca el peón y luego uno de los puntos.',
                         en: 'There are <b>no turns</b> here: you move whenever you want, waiting for nobody. Tap the pawn, then one of the dots.' },
    'learn.move.goal2':{ es: 'Ahora mueve otra pieza', en: 'Now move another piece' },
    'learn.move.say2': { es: 'Eso es. El rival tampoco espera: mueve a la vez que tú. Prueba ahora con el caballo.',
                         en: 'That is it. Your opponent does not wait either: they move at the same time as you. Try the knight now.' },
    'learn.move.ok':   { es: 'Ya sabes moverte. Lo que te frena no es el turno: es la <b>energía</b>.',
                         en: 'You can move now. What holds you back is not a turn: it is <b>energy</b>.' },

    'learn.energy.t':    { es: 'Energía', en: 'Energy' },
    'learn.energy.s':    { es: 'Mover gasta; la barra se rellena sola', en: 'Moving spends it; the bar refills itself' },
    'learn.energy.goal': { es: 'Haz 3 movimientos', en: 'Make 3 moves' },
    'learn.energy.say':  { es: 'Cada pieza cuesta lo que pone en la tabla de abajo, y la barra se rellena sola: <b>1 cada {regen} s</b>. Empiezas con 4: gástala.',
                           en: 'Each piece costs what the table below says, and the bar refills on its own: <b>1 every {regen}s</b>. You start with 4: spend it.' },
    'learn.energy.say2': { es: 'Si la barra no llega, el movimiento se rechaza y el tablero tiembla. No es un fallo: toca <b>esperar</b>, y esperar bien es medio juego.',
                           en: 'If the bar is short the move is refused and the board shakes. It is not a bug: you have to <b>wait</b>, and waiting well is half the game.' },
    'learn.energy.ok':   { es: 'Esa barra es el reloj de verdad de RoyalShess. Sin energía no existes.',
                           en: 'That bar is the real clock in RoyalShess. With no energy you do not exist.' },

    'learn.capture.t':     { es: 'Comer', en: 'Capturing' },
    'learn.capture.s':     { es: 'Comer devuelve energía… casi siempre', en: 'Capturing refunds energy… usually' },
    'learn.capture.goal':  { es: 'Cómete el alfil negro', en: 'Capture the black bishop' },
    'learn.capture.say':   { es: 'Comer devuelve parte del valor de lo comido, así que atacar te mantiene vivo. Cómete el <b>alfil</b> con el caballo.',
                             en: 'Capturing refunds part of the captured value, so attacking keeps you alive. Take the <b>bishop</b> with your knight.' },
    'learn.capture.goal2': { es: 'Ahora cómete el peón', en: 'Now capture the pawn' },
    'learn.capture.say2':  { es: 'Recuperaste energía al comer (el <b>+</b> verde). Ahora prueba con el <b>peón</b>: los peones no devuelven nada.',
                             en: 'You got energy back (the green <b>+</b>). Now try the <b>pawn</b>: pawns refund nothing.' },
    'learn.capture.ok':    { es: 'Comer piezas caras te mantiene con energía. Los peones no dan reembolso, y tu dama nunca recupera al comer.',
                             en: 'Taking expensive pieces keeps your energy up. Pawns give no refund, and your queen never recovers on a capture.' },

    'learn.check.t':     { es: 'Jaque', en: 'Check' },
    'learn.check.s':     { es: 'Rojo: {grace} s para reaccionar', en: 'Red: {grace}s to react' },
    'learn.check.goal':  { es: 'Vigila la torre negra', en: 'Watch the black rook' },
    'learn.check.say':   { es: 'Esa torre negra va a por tu rey. Cuando el tablero se ponga <b>rojo</b> estarás en jaque.',
                           en: 'That black rook is coming for your king. When the board turns <b>red</b> you are in check.' },
    'learn.check.goal2': { es: 'Sal del jaque antes de que acabe la cuenta', en: 'Escape check before the count ends' },
    'learn.check.say2':  { es: '<b>Jaque.</b> Mover cuesta +{surcharge} y en {grace} s pueden comerte el rey. Aquí no hay mate que te avise dos veces: muévete.',
                           en: '<b>Check.</b> Moving costs +{surcharge} and in {grace}s they can take your king. There is no mate warning here: move.' },
    'learn.check.ok':    { es: 'Salir del jaque es lo primero, siempre. Mover el rey, tapar la línea o comerte a quien te ataca.',
                           en: 'Escaping check comes first, always. Move the king, block the line, or eat whoever is attacking.' },
    'learn.check.fail':  { es: 'Te comieron el rey. En jaque solo tienes {grace} s: no te quedes mirando.',
                           en: 'They took your king. In check you only get {grace}s: do not just stare.' },

    'learn.king.t':    { es: 'Ganar', en: 'Winning' },
    'learn.king.s':    { es: 'Se gana comiendo al rey, no por mate', en: 'You win by eating the king, not by mate' },
    'learn.king.goal': { es: 'Cómete al rey negro cuando brille en dorado', en: 'Take the black king when it glows gold' },
    'learn.king.say':  { es: 'Tu dama ya tiene al rey negro en jaque, pero aguanta <b>{grace} s</b> protegido. Espera a que su casilla brille en dorado y cómelo.',
                         en: 'Your queen already has the black king in check, but it is protected for <b>{grace}s</b>. Wait for its square to glow gold, then take it.' },
    'learn.king.ok':   { es: '¡Así se gana! Sin jaque mate: capturando el rey. Y si se acaba el tiempo, gana quien tenga más Puntos.',
                         en: 'That is how you win! No checkmate: you capture the king. And if time runs out, most Points wins.' },

    'learn.spar.t':    { es: 'Duelo de prueba', en: 'Practice duel' },
    'learn.spar.s':    { es: 'Todo junto contra la máquina', en: 'Everything at once against the machine' },
    'learn.spar.goal': { es: 'Captura al rey negro', en: 'Capture the black king' },
    'learn.spar.say':  { es: 'Ahora todo junto: los dos con energía, a la vez y sin turnos. Dale jaque, aguanta los {grace} s y cómete su rey antes de que él coma el tuyo.',
                         en: 'Now all together: both sides on energy, at the same time, no turns. Give check, survive the {grace}s and take their king before they take yours.' },
    'learn.spar.ok':   { es: 'Estás listo. Eso es una partida de RoyalShess, solo que las de verdad duran {min} minutos y el rival piensa más.',
                         en: 'You are ready. That is a RoyalShess game, except the real ones last {min} minutes and the opponent thinks harder.' },
    'learn.spar.fail': { es: 'Te comieron el rey. Mira también la barra del rival: cuando se le llena, algo se le ocurre.',
                         en: 'They took your king. Watch their bar too: when it fills up, they get ideas.' },

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
