/* RoyalShess - escalera de rivales
   ESTE ARCHIVO ES EDITABLE. Aqui vive toda la escalera.
   El orden del array es el orden de combate: el primero es tu primer rival
   y el ultimo es el jefe final en la cima de la torre.
   Campos de cada rival:
     name    nombre visible
     title   mote corto bajo el nombre
     desc    personalidad que se muestra al seleccionarlo, con es y en
     quote   frase o consejo que te dice al derrotarlo, con es y en
     img     ruta de su imagen, por ejemplo /magnus.png puesta en public.
             si lo dejas en null usa la imagen predeterminada de abajo
     ai      su forma de jugar
       tickMs      cada cuantos ms decide una jugada, menos es mas rapido
       aggression  cuanto persigue capturas, 1 es normal
       blunder     probabilidad de 0 a 1 de jugar cualquier cosa
       hoard       energia minima que junta antes de mover sin capturar
       pawnPush    ganas de empujar peones
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
      img: null,
      ai: { tickMs: 1400, aggression: 1.6, blunder: 0.35, hoard: 2, pawnPush: 0.3 },
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
      img: null,
      ai: { tickMs: 1200, aggression: 1.0, blunder: 0.28, hoard: 3, pawnPush: 0.2 },
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
      img: null,
      ai: { tickMs: 1100, aggression: 0.7, blunder: 0.22, hoard: 5, pawnPush: 0.15 },
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
      img: null,
      ai: { tickMs: 950, aggression: 1.0, blunder: 0.16, hoard: 4, pawnPush: 0.2 },
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
      img: null,
      ai: { tickMs: 850, aggression: 1.3, blunder: 0.10, hoard: 4, pawnPush: 0.25 },
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
      img: null,
      ai: { tickMs: 700, aggression: 1.7, blunder: 0.08, hoard: 3, pawnPush: 0.25 },
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
      img: null,
      ai: { tickMs: 600, aggression: 1.9, blunder: 0.05, hoard: 5, pawnPush: 0.2 },
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
        es: 'No necesite atacarte. Solo espere tu ultimo error. La paciencia tambien gana partidas: exprime la posicion hasta que el rival se rinda solo.',
        en: 'I did not need to attack you. I just waited for your last mistake. Patience wins games too: squeeze the position until your opponent breaks.',
      },
      img: null,
      ai: { tickMs: 500, aggression: 1.2, blunder: 0.02, hoard: 6, pawnPush: 0.2 },
    },
  ];

  return { RIVALS, DEFAULT_IMG };
});
