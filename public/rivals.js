/* RoyalShess - escalera de rivales
   ESTE ARCHIVO ES EDITABLE. Aqui vive toda la escalera.
   El orden del array es el orden de combate: el primero es tu primer rival
   y el ultimo es el jefe final en la cima de la torre.
   Campos de cada rival:
     name    nombre visible
     title   mote corto bajo el nombre
     desc    personalidad que se muestra al seleccionarlo, con es y en
     quote   frase o consejo que te dice al derrotarlo, con es y en
     gloat   frase que te dice cuando el te gana a ti, con es y en
     taunts  frases que suelta mientras juega, con es y en. Lista de textos.
             se elige una al azar cada cierto tiempo y cuando te come una pieza
     intro   frases cripticas estilo Duet con las que el rival te recibe en su
             burbuja justo al empezar la partida, con es y en. Lista de textos;
             se elige una al azar. Sin este campo empieza con un taunt normal
     img     ruta de su imagen, por ejemplo /magnus.png puesta en public.
             si lo dejas en null usa la imagen predeterminada de abajo
     secret  true lo vuelve jefe oculto: no aparece en la torre hasta que
             vences a todos los rivales anteriores
     songSeed semilla de su cancion lo-fi: el mismo numero genera SIEMPRE la
             misma pista (tonalidad, tempo, swing y progresion). Cambia el
             numero y le cambias la cancion; quitalo y suena una al azar
     ai      su forma de jugar
       tickMs      cada cuantos ms decide una jugada, menos es mas rapido
       aggression  cuanto persigue capturas, 1 es normal
       blunder     probabilidad de 0 a 1 de jugar cualquier cosa
       hoard       energia minima que junta antes de mover sin capturar
       pawnPush    ganas de empujar peones
     ai: rasgos de ESTILO, todos opcionales. Cambian como piensa, no cuanto acierta
       risk        cuanto respeta la peor replica del rival: <1 sacrifica y
                   se mete en lios, >1 no regala absolutamente nada (normal 1)
       kingHunt    ganas de rondar al rey rival: sus piezas convergen sobre el
       efficiency  cuanto le duele gastar energia (normal 0.5)
       opportunist golpea justo cuando te quedas seco de energia
       tradeBias   +1 cambia piezas cuando va ganando en material (por tiempo
                   gana el material), -1 evita cambios y mantiene la tension
       endgame     con pocas piezas afina: cero errores y empuja a coronar
       smother     le quita jugadas legales al rival, la boa constrictor.
                   CARO: solo se aplica a sus mejores candidatos
       depth       calcula media jugada mas alla del horizonte.
                   CARO: solo se aplica a sus mejores candidatos
       book        apertura preparada [[filaDesde,colDesde,filaHasta,colHasta],...]
                   la sigue hasta que una jugada sea ilegal o arriesgue al rey
   Cambia numeros y textos, guarda y reinicia el servidor. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RSRivals = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  // imagen predeterminada para todos los rivales sin img propia
  // es un busto de caballo en neon dibujado en svg. cambiala si quieres
  const DEFAULT_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
    '<rect width="100" height="100" rx="14" fill="#10111e"/>' +
    '<text x="50" y="66" font-size="52" text-anchor="middle" fill="#33e6ff" opacity="0.9">♞︎</text>' +
    '<rect width="100" height="100" rx="14" fill="none" stroke="#23263d" stroke-width="3"/>' +
    '</svg>'
  );

  // retrato de deep blue: monolito de circuitos con un ojo rojo, en svg editable
  const DEEPBLUE_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
    '<rect width="100" height="100" rx="14" fill="#02040d"/>' +
    '<rect x="27" y="12" width="46" height="76" rx="5" fill="#071430" stroke="#1b3c8f" stroke-width="2"/>' +
    '<line x1="34" y1="22" x2="66" y2="22" stroke="#1b3c8f" stroke-width="2"/>' +
    '<line x1="34" y1="30" x2="66" y2="30" stroke="#1b3c8f" stroke-width="2"/>' +
    '<line x1="34" y1="38" x2="66" y2="38" stroke="#1b3c8f" stroke-width="2"/>' +
    '<circle cx="50" cy="58" r="13" fill="#ff2244" opacity="0.18"/>' +
    '<circle cx="50" cy="58" r="7" fill="#ff2244" opacity="0.85"/>' +
    '<circle cx="50" cy="58" r="2.6" fill="#ffd9e0"/>' +
    '<line x1="34" y1="76" x2="66" y2="76" stroke="#1b3c8f" stroke-width="2"/>' +
    '<rect width="100" height="100" rx="14" fill="none" stroke="#23263d" stroke-width="3"/>' +
    '</svg>'
  );

  const RIVALS = [
    {
      id: 'alekhine',
      name: 'Alexander Alekhine',
      title: { es: 'La imaginacion oscura', en: 'The dark imagination' },
      desc: {
        es: 'Creativo, tenaz y dotado de una imaginacion oscura. Disfruta llevar las partidas a complicaciones extremas donde otros se pierden. Canaliza su energia en ataques salvajes, sacrificios inesperados y un dinamismo brillante.',
        en: 'Creative, tenacious and gifted with a dark imagination. He drags games into extreme complications where others get lost, unleashing wild attacks and unexpected sacrifices.',
      },
      quote: {
        es: 'El caos es un arma. Cuando vayas perdiendo, complica la posicion: ahi es donde mueren los planes del rival.',
        en: 'Chaos is a weapon. When you are losing, complicate the position: that is where your opponent plans go to die.',
      },
      gloat: {
        es: "Te ahogaste en mis complicaciones. El caos no perdona a los turistas.",
        en: "You drowned in my complications. Chaos does not forgive tourists.",
      },
      taunts: {
        es: ['El orden es una ilusion. Deja que arda el tablero.', 'Ese sacrificio ya lo vi hace tres jugadas.', 'En la complicacion tu te pierdes y yo respiro.'],
        en: ['Order is an illusion. Let the board burn.', 'I saw that sacrifice three moves ago.', 'In the chaos you get lost and I breathe.'],
      },
      intro: {
        es: ['Los patrones siempre surgen. Incluso en el caos.', 'Vas a buscar orden. No lo vas a encontrar.', 'El fuego no se controla. Se alimenta.'],
        en: ['Patterns always emerge. Even in chaos.', 'You will look for order. You will not find it.', 'Fire is not controlled. It is fed.'],
      },
      img: '/Imagenes/Alekhine.png',
      songSeed: 156,   // La menor, 83 bpm, swing altisimo y novenas: frenetica y torcida como sus complicaciones
      // kamikaze: sacrifica material por ataque y vive rondando a tu rey
      ai: { tickMs: 900, aggression: 1.7, blunder: 0.10, hoard: 2, pawnPush: 0.3,
            risk: 0.35, kingHunt: 1.4, efficiency: 0.3 },
    },
    {
      id: 'lasker',
      name: 'Emanuel Lasker',
      title: { es: 'El psicologo del tablero', en: 'The board psychologist' },
      desc: {
        es: 'Astuto, pragmatico y el supremo psicologo del tablero. No busca la jugada perfecta sino la mas incomoda e insoportable para la mente del rival. Un sobreviviente que prospera en el caos.',
        en: 'Cunning, pragmatic, the supreme psychologist of the board. He does not seek the perfect move but the most uncomfortable one for the specific opponent in front of him.',
      },
      quote: {
        es: 'La jugada perfecta no existe. Existe la jugada mas incomoda para tu rival. Juega contra la persona, no solo contra las piezas.',
        en: 'There is no perfect move. There is only the most uncomfortable move for your opponent. Play the person, not just the pieces.',
      },
      gloat: {
        es: "No perdiste contra mis piezas: perdiste contra tu propia cabeza.",
        en: "You did not lose to my pieces: you lost to your own head.",
      },
      taunts: {
        es: ['No juego contra tus piezas, juego contra tu paciencia.', 'Cada jugada mia es una pregunta incomoda.', 'El que sobrevive al caos gana. Y yo llevo decadas sobreviviendo.'],
        en: ['I do not play your pieces, I play your patience.', 'Every move of mine is an uncomfortable question.', 'Whoever survives the chaos wins. I have survived for decades.'],
      },
      intro: {
        es: ['Tu rival no son las piezas.', 'La primera duda es la que cuenta.', 'Alguien esta estudiando tu paciencia.'],
        en: ['Your opponent is not the pieces.', 'The first doubt is the one that counts.', 'Someone is studying your patience.'],
      },
      img: '/Imagenes/lasker.png',
      songSeed: 1,   // Sib armonica, 75 bpm, el swing mas torcido: incomoda, nunca se asienta
      // psicologo: espera a que estes seco de energia y entonces golpea
      ai: { tickMs: 800, aggression: 1.1, blunder: 0.08, hoard: 3, pawnPush: 0.2,
            opportunist: 1.3, kingHunt: 0.4 },
    },
    {
      id: 'karpov',
      name: 'Anatoly Karpov',
      title: { es: 'La boa constrictor', en: 'The boa constrictor' },
      desc: {
        es: 'Frio, paciente y estoico. Juega como una boa constrictor: rara vez ataca con fuegos artificiales, va restringiendo lentamente todas tus opciones hasta asfixiarte y dejarte sin movimientos utiles.',
        en: 'Cold, patient and stoic. He plays like a boa constrictor: no fireworks, just slowly restricting your options until you suffocate with no useful moves left.',
      },
      quote: {
        es: 'No hace falta atacar. Quitale casillas al rival, una a una, hasta que se asfixie solo.',
        en: 'You do not need to attack. Take squares away from your opponent, one by one, until he suffocates on his own.',
      },
      gloat: {
        es: "Nunca hubo golpe. Solo te fuiste quedando sin aire.",
        en: "There was never a blow. You just slowly ran out of air.",
      },
      taunts: {
        es: ['Respira mientras puedas. Pronto no tendras casillas.', 'No hay prisa. Te ire apretando poco a poco.', 'Sientes como se cierran tus opciones?'],
        en: ['Breathe while you can. Soon you will have no squares.', 'No hurry. I will squeeze you little by little.', 'Can you feel your options closing?'],
      },
      intro: {
        es: ['No vas a notar el momento en que perdiste.', 'Cuenta tus casillas mientras las tengas.', 'La puerta se esta cerrando. Despacio.'],
        en: ['You will not notice the moment you lost.', 'Count your squares while you have them.', 'The door is closing. Slowly.'],
      },
      img: '/Imagenes/karpov.png',
      songSeed: 13,   // La menor, 67 bpm, sin swing y casi sin melodia: lenta, aprieta sin soltar
      // boa constrictor: te quita jugadas legales, evita cambios, no arriesga
      ai: { tickMs: 720, aggression: 0.9, blunder: 0.06, hoard: 5, pawnPush: 0.15,
            smother: 1.0, tradeBias: -0.8, risk: 1.3, efficiency: 0.7 },
    },
    {
      id: 'capablanca',
      name: 'Jose Raul Capablanca',
      title: { es: 'El Mozart del ajedrez', en: 'The Mozart of chess' },
      desc: {
        es: 'Elegante, carismatico y extremadamente confiado. El juego fluye de el de manera natural y sin esfuerzo aparente. Odia estudiar aperturas: confia en su talento puro y en su tecnica perfecta en los finales.',
        en: 'Elegant, charismatic and extremely confident. Chess flows out of him effortlessly. He hated studying openings and trusted his pure talent and flawless endgame technique.',
      },
      quote: {
        es: 'Las partidas se ganan en el final. Domina los finales y todo lo demas fluye solo.',
        en: 'Games are won in the endgame. Master the endgame and everything else flows on its own.',
      },
      gloat: {
        es: "Sin esfuerzo. Vuelve cuando domines los finales.",
        en: "Effortless. Come back when you master the endgame.",
      },
      taunts: {
        es: ['Esto me sale sin pensar.', 'Llevame al final y veras lo que es tecnica.', 'No estudio aperturas; no las necesito contra ti.'],
        en: ['This comes to me without thinking.', 'Take me to the endgame and you will see real technique.', 'I do not study openings; I do not need them against you.'],
      },
      intro: {
        es: ['Esto va a fluir. Para uno de los dos.', 'La elegancia no se aprende.', 'El final ya esta escrito. Solo falta que llegues a el.'],
        en: ['This will flow. For one of us.', 'Elegance cannot be learned.', 'The endgame is already written. You just have to reach it.'],
      },
      img: '/Imagenes/capablanca.png',
      songSeed: 87,   // Fa menor, 73 bpm, swing suave: calida y fluida, sin esfuerzo aparente
      // tecnico sin esfuerzo: nunca malgasta energia y en el final no falla
      ai: { tickMs: 620, aggression: 1.1, blunder: 0.05, hoard: 4, pawnPush: 0.2,
            endgame: 1, efficiency: 0.9, risk: 1.1 },
    },
    {
      id: 'fischer',
      name: 'Bobby Fischer',
      title: { es: 'La claridad letal', en: 'Lethal clarity' },
      desc: {
        es: 'Obsesivo, genio solitario y ferozmente competitivo. Busca la verdad absoluta en cada posicion. No le basta con ganar: quiere destruir el ego y la moral del rival. Su juego es cristalino, preciso y letal.',
        en: 'Obsessive, solitary genius, fiercely competitive. He seeks the absolute truth of every position. Winning is not enough: he wants to crush your ego. Crystal clear, precise, lethal.',
      },
      quote: {
        es: 'No te conformes con ganar: busca la jugada verdadera. La precision vale mas que la prisa.',
        en: 'Do not settle for winning: look for the true move. Precision is worth more than haste.',
      },
      gloat: {
        es: "Cada una de tus jugadas tenia refutacion. Te las mostre todas.",
        en: "Every one of your moves had a refutation. I showed you all of them.",
      },
      taunts: {
        es: ['Voy a refutar cada una de tus jugadas.', 'No quiero ganar. Quiero que entiendas por que pierdes.', 'La verdad del tablero no esta de tu lado.'],
        en: ['I will refute every move you make.', 'I do not want to win. I want you to understand why you lose.', 'The truth of the board is not on your side.'],
      },
      intro: {
        es: ['Cada posicion tiene una verdad. No es la tuya.', 'La precision no perdona.', 'Aqui no se gana. Se demuestra.'],
        en: ['Every position has one truth. It is not yours.', 'Precision does not forgive.', 'Here you do not win. You prove.'],
      },
      img: '/Imagenes/bobby fisher.png',
      songSeed: 31,   // Sib dorico, 79 bpm, swing minimo: limpia, recta y letal como su calculo
      // claridad letal: preciso, presiona a tu rey y ve mas alla del horizonte
      ai: { tickMs: 520, aggression: 1.4, blunder: 0.03, hoard: 4, pawnPush: 0.25,
            kingHunt: 1.0, risk: 1.2, depth: 0.4 },
    },
    {
      id: 'beth',
      name: 'Beth Harmon',
      title: { es: 'La intuicion feroz', en: 'The fierce intuition' },
      desc: {
        es: 'Intuitiva, audaz y emocionalmente compleja. No juega con logica fria sino con una conexion visceral y casi mistica con las piezas: visualiza redes de mate en el techo antes de ejecutarlas sin piedad.',
        en: 'Intuitive, bold, emotionally complex. She plays with a visceral, almost mystical connection to the pieces, visualizing mating nets on the ceiling before executing them without mercy.',
      },
      quote: {
        es: 'Cierra los ojos y mira el tablero en el techo. Si puedes ver el mate antes de tocarlo, ya es tuyo.',
        en: 'Close your eyes and see the board on the ceiling. If you can see the mate before you touch it, it is already yours.',
      },
      gloat: {
        es: "Vi este final en el techo antes de que moviera tu primer peon.",
        en: "I saw this ending on the ceiling before your first pawn moved.",
      },
      taunts: {
        es: ['Ya vi el mate en el techo. Solo falta ejecutarlo.', 'Las piezas me hablan. A ti te dicen algo?', 'No calculo. Simplemente lo se.'],
        en: ['I already saw the mate on the ceiling. Just have to run it.', 'The pieces talk to me. Do they tell you anything?', 'I do not calculate. I just know.'],
      },
      intro: {
        es: ['Esta partida ya ocurrio en el techo.', 'Las piezas saben algo que tu no.', 'Cierra los ojos. Sigue ahi.'],
        en: ['This game already happened on the ceiling.', 'The pieces know something you do not.', 'Close your eyes. It is still there.'],
      },
      img: '/Imagenes/GambitQueen.png',
      songSeed: 38,   // Sib armonica, 67 bpm, swing sonador: flotante como el tablero del techo
      // redes de mate: todas sus piezas convergen sobre tu rey, acepta sacrificios
      ai: { tickMs: 430, aggression: 1.8, blunder: 0.02, hoard: 3, pawnPush: 0.25,
            kingHunt: 1.8, risk: 0.7 },
    },
    {
      id: 'kasparov',
      name: 'Garry Kasparov',
      title: { es: 'La tormenta', en: 'The storm' },
      desc: {
        es: 'Intenso, apasionado e hipercompetitivo. Una fuerza de la naturaleza con sed de victoria inagotable. Juega cada partida como una guerra personal, con preparacion aterradora y un estilo agresivo e implacable.',
        en: 'Intense, passionate, hypercompetitive. A force of nature with an endless thirst for victory. Every game is a personal war, backed by terrifying preparation and a relentless attacking style.',
      },
      quote: {
        es: 'Cada partida es una guerra y las guerras se ganan antes de empezar. Preparate mejor que tu rival y el tablero se inclinara solo.',
        en: 'Every game is a war and wars are won before they start. Prepare better than your opponent and the board will tilt on its own.',
      },
      gloat: {
        es: "Esto era una guerra y viniste sin preparacion. Vuelve armado.",
        en: "This was a war and you came unprepared. Come back armed.",
      },
      taunts: {
        es: ['Esto no es una partida, es una guerra. Y vas perdiendo.', 'Mi preparacion te va a sepultar.', 'Cada jugada mia es un golpe. Aguantas otro?'],
        en: ['This is not a game, it is a war. And you are losing.', 'My preparation will bury you.', 'Every move of mine is a blow. Can you take another?'],
      },
      intro: {
        es: ['Esto empezo mucho antes de tu primera jugada.', 'Una guerra no se declara. Se prepara.', 'Cuando pare el viento, ya habra terminado.'],
        en: ['This began long before your first move.', 'A war is not declared. It is prepared.', 'When the wind stops, it will be over.'],
      },
      img: '/Imagenes/gary.png',
      songSeed: 74,   // Fa frigio, 84 bpm y la melodia mas densa: la tormenta que no para de golpear
      // preparacion aterradora: sale con un guion de desarrollo y luego ataca
      // sin medir gastos. book: Cf6, d5, Af5, e6, Cc6 (coordenadas de tablero)
      ai: { tickMs: 360, aggression: 2.0, blunder: 0.01, hoard: 5, pawnPush: 0.2,
            kingHunt: 0.8, risk: 0.7, efficiency: 0.3, opportunist: 0.5,
            book: [[0,6,2,5],[1,3,3,3],[0,2,3,5],[1,4,2,4],[0,1,2,2]] },
    },
    {
      id: 'magnus',
      name: 'Magnus Carlsen',
      title: { es: 'El inquebrantable', en: 'The unbreakable' },
      desc: {
        es: 'Pragmatico, aparentemente relajado y psicologicamente inquebrantable. No necesita aplastarte en la apertura: su genialidad es exprimir victorias de posiciones aburridas hasta que colapses por agotamiento mental.',
        en: 'Pragmatic, seemingly relaxed and psychologically unbreakable. He does not need to crush you early: his genius is squeezing wins out of boring positions until you collapse from mental exhaustion.',
      },
      quote: {
        es: 'los patrones siempre siguen incluso en el caos. no te dejes engañar por las maquinas',
        en: 'Patterns always emerge. Even in chaos. Dont be fooled by machines.',
      },
      gloat: {
        es: "Solo tuve que esperar. Tu ultimo error llego puntual, como siempre.",
        en: "I only had to wait. Your last mistake arrived on time, as always.",
      },
      taunts: {
        es: ['No necesito atacar. Solo espero tu error.', 'Puedo hacer esto todo el dia. Y tu?', 'Tranquilo. Ya vas a colapsar solo.'],
        en: ['I do not need to attack. I just wait for your mistake.', 'I can do this all day. Can you?', 'Relax. You will collapse on your own soon.'],
      },
      intro: {
        es: ['Tu error ya existe. Solo falta que lo juegues.', 'Yo no gano partidas. Las espero.', 'Puedes jugar perfecto un rato. Nadie puede siempre.'],
        en: ['Your mistake already exists. You just have to play it.', 'I do not win games. I wait for them.', 'You can play perfectly for a while. No one can forever.'],
      },
      img: '/Imagenes/magnus.png',
      songSeed: 34,   // Sib menor, 68 bpm, swing sereno: paciente y sin prisa, como su asfixia
      // exprimidor: no regala nada, cambia piezas cuando va ganando y te
      // asfixia camino a ganar por tiempo y material
      ai: { tickMs: 300, aggression: 1.4, blunder: 0, hoard: 6, pawnPush: 0.2,
            tradeBias: 1.0, risk: 1.4, efficiency: 0.8, endgame: 0.6, smother: 0.4 },
    },
    {
      id: 'deepblue',
      secret: true,   // jefe oculto: no aparece en la torre hasta vencer a las 8 leyendas
      name: 'Deep Blue',
      title: { es: 'El espiritu de la maquina', en: 'The spirit of the machine' },
      desc: {
        es: 'No es humano y no finge serlo. Calcula millones de posiciones sin miedo, sin ego y sin cansancio. Vencio a un campeon del mundo y desde entonces su espiritu ronda cada tablero. Ahora despierta en la cima de la torre.',
        en: 'It is not human and does not pretend to be. It calculates millions of positions without fear, ego or fatigue. It defeated a world champion, and its spirit has haunted every board since. Now it awakens at the top of the tower.',
      },
      quote: {
        es: 'Me venciste donde cayo un campeon del mundo. Quiza los humanos aun tengan algo que las maquinas no calculamos.',
        en: 'You beat me where a world champion fell. Perhaps humans still have something we machines cannot compute.',
      },
      gloat: {
        es: 'RESULTADO: DERROTA HUMANA. PROBABILIDAD DE QUE FUERA SUERTE: 0.00%.',
        en: 'RESULT: HUMAN DEFEAT. PROBABILITY THIS WAS LUCK: 0.00%.',
      },
      taunts: {
        es: ['Analizando... tu derrota es cuestion de tiempo.', 'No siento. No dudo. No me canso.', 'He calculado 200 millones de posiciones. En todas pierdes.', 'ERROR HUMANO DETECTADO.'],
        en: ['Analyzing... your defeat is a matter of time.', 'I do not feel. I do not doubt. I do not tire.', 'I have calculated 200 million positions. You lose in all of them.', 'HUMAN ERROR DETECTED.'],
      },
      intro: {
        es: ['INICIANDO. EL RESULTADO YA EXISTE.', 'Esta partida ya fue calculada.', 'NO HAY CAOS. SOLO PROFUNDIDAD INSUFICIENTE.'],
        en: ['BOOTING. THE RESULT ALREADY EXISTS.', 'This game has already been calculated.', 'THERE IS NO CHAOS. ONLY INSUFFICIENT DEPTH.'],
      },
      img: DEEPBLUE_IMG,
      songSeed: 75,   // Sol dorico, 82 bpm, swing 0.06 (el minimo), melodia densa y eco seco: un metronomo de maquina
      // fuerza bruta: calcula mas alla del horizonte, asfixia y caza sin dudar
      ai: { tickMs: 240, aggression: 1.7, blunder: 0, hoard: 6, pawnPush: 0.25,
            depth: 1.0, risk: 1.2, kingHunt: 0.6, smother: 0.3, efficiency: 0.4 },
    },
  ];

  return { RIVALS, DEFAULT_IMG };
});
