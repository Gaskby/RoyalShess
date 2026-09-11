(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RSEmotes = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  // ===== LOS EMOTES: seis burlas y las manda CHESSY =====================
  // Chessy es el peon de pixeles del tutorial (coach.js). Aqui sale a
  // vacilar: mismo bicho, misma silueta, los mismos cuatro colores planos.
  // Que sea un peon no es casualidad: es la pieza mas tonta del tablero, asi
  // que la burla escuece el doble. El remate del set es que se corona.
  //
  // Por que pixeles y no dibujo vectorial: la burbuja mide 44 px. A ese
  // tamano una curva fina es suciedad, y un bloque de 3 px se ve. Todo el
  // diseno sale de ahi: ojos de 2x2, brazos de 2 de grosor y los gestos
  // SIEMPRE fuera de la silueta del cuerpo, que si no se funden con el.
  //
  // Ya no hay disco detras: la burbuja del juego (.emote-bubble) es una
  // ficha oscura con el borde del color de quien habla, asi que Chessy va
  // dentro sin fondo y ocupa el cuadro entero.
  //
  // COMO SE EDITA
  // -------------
  // El cuerpo es un dibujo ASCII, una letra por pixel:
  //     '.' nada   '#' cuerpo   '=' sombra (la columna de la derecha)
  // Los gestos son rectangulos px(x, y, ancho, alto) en esas mismas
  // coordenadas, agrupados por clase. La clase es la que engancha la
  // animacion en style.css (busca «animacion de los emotes»).

  // 14x14. La cabeza se come un tercio del cuadro a proposito: es donde
  // esta la expresion. El cuerpo se corta por abajo, no hace falta entero
  const BODY = [
    '..............',   // 0  libre: aqui entra la corona
    '.....###=.....',   // 1  coronilla
    '....#####=....',   // 2  cabeza
    '...#######=...',   // 3  ojos (bloques de 2x2)
    '...#######=...',   // 4
    '...#######=...',   // 5
    '....#####=....',   // 6  boca
    '.....###=.....',   // 7  cuello
    '...#######=...',   // 8  collarin
    '.....###=.....',   // 9
    '....#####=....',   // 10
    '...#######=...',   // 11
    '..#########=..',   // 12
    '.###########=.',   // 13 peana
  ];
  const N = 14;
  const px = (x, y, w, h) => [x, y, w || 1, h || 1];

  // ---- la escalera de emotes -------------------------------------------
  // El ORDEN es el indice que viaja por la red y el servidor solo valida el
  // rango (EMOTE_COUNT en lobby.js). No lo cambies a la ligera: cliente y
  // servidor tienen que subir juntos o una partida en vuelo veria otra cara.
  // g: [clase, color, rectangulos]
  const EMOTES = [
    // te senala y se descojona. El brazo se SALE del cuadro: a 44 px un
    // bracito pegado al cuerpo no se lee, una barra que sale si
    { id: 'senala', key: 'emote.senala',
      g: [
        ['ef-eyes',  'ink',   [px(4, 3, 2, 2), px(7, 3, 2, 2)]],
        ['ef-mouth', 'ink',   [px(5, 6, 3, 2)]],
        ['ef-arm',   'body',  [px(10, 6, 3, 2)]],
        ['ef-hand',  'shade', [px(13, 6, 1, 2)]],
      ] },
    // aplauso lento: «que jugada, campeon». La lentitud es el chiste, por
    // eso las rayitas del golpe solo se encienden cuando las manos chocan
    { id: 'aplauso', key: 'emote.aplauso',
      g: [
        ['ef-eyes',  'ink',  [px(4, 4, 2), px(7, 4, 2)]],
        ['ef-mouth', 'ink',  [px(5, 6, 2), px(7, 7)]],
        ['ef-clapL', 'body', [px(0, 8, 3, 3)]],
        ['ef-clapR', 'body', [px(11, 8, 3, 3)]],
        ['ef-tick',  'acc',  [px(3, 7), px(3, 11), px(10, 7), px(10, 11)]],
      ] },
    // bostezo: no se rie de tu jugada, se rie de lo que tardas
    { id: 'bostezo', key: 'emote.bostezo',
      g: [
        ['ef-eyes',  'ink', [px(3, 4, 3), px(7, 4, 3)]],
        ['ef-mouth', 'ink', [px(5, 6, 3, 3)]],
        ['ef-z',     'acc', [px(9, 0, 5), px(12, 1), px(11, 2), px(9, 3, 5)]],
      ] },
    // llora mas: berrinche falso, con chorros por los carrillos
    { id: 'llora', key: 'emote.llora',
      g: [
        ['ef-eyes',  'ink',  [px(3, 4, 3), px(7, 4, 3)]],
        ['ef-mouth', 'ink',  [px(5, 6, 3, 2)]],
        ['ef-tear',  'tear', [px(3, 5, 2, 4), px(8, 5, 2, 4)]],
        ['ef-drop',  'tear', [px(2, 10, 2, 2), px(9, 11, 2, 2)]],
      ] },
    // adios: te despide antes de que acabe la partida. La mano va POR ENCIMA
    // de la cabeza, que es lo unico que se lee de lejos
    { id: 'adios', key: 'emote.adios',
      g: [
        ['ef-eyes',  'ink',  [px(4, 3, 2, 2), px(7, 4, 2)]],
        ['ef-mouth', 'ink',  [px(5, 6, 3)]],
        ['ef-arm',   'body', [px(10, 4, 2, 4)]],
        ['ef-hand',  'body', [px(10, 1, 3, 3)]],
      ] },
    // coronacion: te ha ganado un peon, y encima se corona
    { id: 'corona', key: 'emote.corona',
      g: [
        ['ef-eyes',  'ink',  [px(4, 3, 2, 2), px(7, 3, 2, 2)]],
        ['ef-mouth', 'ink',  [px(5, 6, 2), px(7, 7)]],
        ['ef-crown', 'gold', [px(3, 1, 8), px(3, 0, 2), px(6, 0, 2), px(9, 0, 2)]],
        ['ef-spark', 'acc',  [px(1, 2), px(12, 2), px(0, 6)]],
      ] },
  ];

  const PAINT = {
    body:  'var(--e-body)',
    shade: 'var(--e-shade)',
    ink:   'var(--e-ink)',
    gold:  'var(--e-gold)',
    tear:  'var(--e-tear)',
    acc:   'var(--e-acc)',
  };
  const rect = (q, f) => `<rect x="${q[0]}" y="${q[1]}" width="${q[2]}" height="${q[3]}" fill="${f}"/>`;

  // el cuerpo se pinta por TRAMOS seguidos de cada fila, no pixel a pixel
  let BODY_SVG = '';
  for (let y = 0; y < N; y++) {
    const row = BODY[y]; let x = 0;
    while (x < N) {
      const ch = row[x];
      if (ch !== '#' && ch !== '=') { x++; continue; }
      let n = 1; while (row[x + n] === ch) n++;
      BODY_SVG += rect([x, y, n, 1], ch === '#' ? PAINT.body : PAINT.shade);
      x += n;
    }
  }

  // devuelve el SVG completo de un emote, listo para meter en el DOM.
  // La clase e-<id> del <svg> es la que engancha su animacion en style.css
  function svg(i) {
    const e = EMOTES[i];
    if (!e) return '';
    return `<svg class="emote-face e-${e.id}" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" aria-hidden="true">` +
             `<g class="ef-body">${BODY_SVG}</g>` +
             e.g.map(([cls, col, list]) =>
               `<g class="${cls}">` + list.map((q) => rect(q, PAINT[col])).join('') + '</g>').join('') +
           '</svg>';
  }

  return { EMOTES, svg, count: EMOTES.length, BODY };
});
