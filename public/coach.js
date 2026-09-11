/* RoyalShess - CHESSY, EL PEON QUE TE ENSENA (avatar del tutorial)
   ---------------------------------------------------------------------
   Quien te da los consejos en el tutorial: CHESSY, un peon de pixeles. No
   es un adorno, es el que habla: mientras el panel escribe letra a letra, el
   mueve la boca, y cambia de cara segun lo que pasa en el tablero (senala,
   se asusta en jaque, celebra al superar la leccion).

   Este mismo dibujo es el que manda los emotes en partida (emotes.js).

   Por que pixeles: son cuatro colores planos y una silueta gorda, asi que
   se lee a 60 px en un movil y aguanta los seis temas del juego sin
   retocar nada. Los colores salen de variables (--cz-*) que en style.css
   cuelgan de la paleta del tema, igual que hacen los emotes.

   COMO SE EDITA
   -------------
   El cuerpo es un dibujo ASCII (BODY): una letra por pixel.
       '.' nada   '#' cuerpo   '=' sombra (el lado derecho)
   Cambia el dibujo y cambia el peon; no hay coordenadas que cuadrar.

   Los rasgos (ojos, boca, brazos, chispas) NO van en el dibujo porque se
   encienden y se apagan solos: van como rectangulos px(x, y, ancho, alto)
   en coordenadas del dibujo, 0,0 arriba a la izquierda. Cada cara es una
   fila de MOODS. Las animaciones (parpadeo, boca al hablar, saltito) viven
   en style.css, buscando «peon del tutorial». */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RSCoach = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  // ---- el cuerpo: 12 de ancho x 14 de alto -----------------------------
  // cabeza redonda, cuello, faldon y peana ancha. La franja '=' de la
  // derecha es la sombra: sin ella el peon es una mancha plana
  const BODY = [
    '....###=....',   // 0  coronilla
    '..#######=..',   // 1  cabeza (aqui van las cejas)
    '..#######=..',   // 2  cabeza (aqui van los ojos)
    '..#######=..',   // 3  cabeza (fila de respiro: sin ella la cara es un borron)
    '...#####=...',   // 4  barbilla (aqui va la boca)
    '....###=....',   // 5  CUELLO: lo que lo hace un peon y no un muneco
    '..#######=..',   // 6  collarin, mas ancho que el cuello
    '....###=....',   // 7
    '...#####=...',   // 8  falda
    '...#####=...',   // 9
    '..#######=..',   // 10
    '.#########=.',   // 11
    '###########=',   // 12 peana
    '###########=',   // 13
  ];

  const W = 12, H = 14;           // tamano del dibujo
  const PAD = 1;                  // hueco alrededor para brazos y chispas
  const px = (x, y, w, h) => ({ x, y, w: w || 1, h: h || 1 });

  // ---- las caras --------------------------------------------------------
  // eyes/mouth: lo que se ve normalmente. shut: el parpadeo. mouth2: la boca
  // abierta que alterna con la cerrada MIENTRAS habla. extra: lo que sale
  // fuera del cuerpo (brazos, chispas, la gota de sudor).
  // c: 'body' | 'shade' | 'ink' | 'acc' | 'warn'  (por defecto 'ink')
  const MOODS = {
    // en reposo: mira de frente y respira
    idle: {
      eyes:   [px(3, 2), px(7, 2)],
      mouth:  [px(5, 4)],
      mouth2: [px(4, 4, 3)],
    },
    // senala el tablero: los ojos se van hacia donde apunta el brazo
    point: {
      eyes:   [px(4, 2), px(8, 2)],
      mouth:  [px(5, 4)],
      mouth2: [px(4, 4, 3)],
      arm:    [px(10, 6), px(11, 5), px(12, 4), px(12, 3)],
      armC:   'body',
    },
    // mirando la barra de energia, esperando a que suba: parpados caidos
    wait: {
      eyes:   [px(3, 3), px(7, 3)],
      mouth:  [px(5, 4)],
      mouth2: [px(4, 4, 3)],
      extra:  [{ ...px(11, 1), c: 'acc' }, { ...px(12, 0), c: 'acc' }],
    },
    // contento: ojos en pico y las comisuras hacia arriba
    happy: {
      eyes:   [px(2, 2), px(3, 1), px(4, 2), px(6, 2), px(7, 1), px(8, 2)],
      mouth:  [px(4, 4, 3)],
      mouth2: [px(4, 4, 3, 2)],
      noBlink: true,
    },
    // jaque: cejas caidas, boquita apretada y una gota
    worry: {
      eyes:   [px(3, 1, 2), px(6, 1, 2), px(3, 2), px(7, 2)],
      mouth:  [px(5, 4)],
      mouth2: [px(5, 4, 1, 2)],
      extra:  [{ ...px(10, 2), c: 'acc' }, { ...px(10, 3), c: 'acc' }],
    },
    // te ha salido mal: media mirada y la boca torcida
    oops: {
      eyes:   [px(3, 2, 2), px(6, 2, 2)],
      mouth:  [px(4, 4, 2), px(6, 5)],
      mouth2: [px(4, 4, 2), px(6, 5)],
      extra:  [{ ...px(11, 1), c: 'warn' }, { ...px(11, 2), c: 'warn' }, { ...px(11, 4), c: 'warn' }],
      noBlink: true,
    },
    // leccion superada: brazos arriba y chispas
    win: {
      eyes:   [px(2, 2), px(3, 1), px(4, 2), px(6, 2), px(7, 1), px(8, 2)],
      mouth:  [px(4, 4, 3)],
      mouth2: [px(4, 4, 3, 2)],
      arm:    [px(1, 5), px(0, 4), px(10, 5), px(11, 4)],
      armC:   'body',
      extra:  [{ ...px(0, 1), c: 'acc' }, { ...px(11, 0), c: 'acc' }, { ...px(12, 2), c: 'acc' }],
      noBlink: true,
    },
  };

  const PAINT = {
    body:  'var(--cz-body)',
    shade: 'var(--cz-shade)',
    ink:   'var(--cz-ink)',
    acc:   'var(--cz-acc)',
    warn:  'var(--cz-warn)',
  };

  const rect = (r, fill) =>
    `<rect x="${r.x + PAD}" y="${r.y + PAD}" width="${r.w}" height="${r.h}" fill="${fill}"/>`;

  // el cuerpo se pinta por TRAMOS seguidos de cada fila, no pixel a pixel:
  // un peon entero son 30 rectangulos en vez de 120
  function bodySvg() {
    let out = '';
    for (let y = 0; y < H; y++) {
      const row = BODY[y] || '';
      let x = 0;
      while (x < W) {
        const ch = row[x];
        if (ch !== '#' && ch !== '=') { x++; continue; }
        let n = 1;
        while (row[x + n] === ch) n++;
        out += rect(px(x, y, n, 1), ch === '#' ? PAINT.body : PAINT.shade);
        x += n;
      }
    }
    return out;
  }
  const BODY_SVG = bodySvg();

  const group = (list, cls, def) =>
    !list || !list.length ? '' :
      `<g class="${cls}">` + list.map((r) => rect(r, PAINT[r.c || def] || PAINT.ink)).join('') + '</g>';

  // devuelve el peon entero listo para meter en el DOM. La clase cz-<mood>
  // del <svg> es la que engancha su animacion en style.css
  function svg(mood) {
    const m = MOODS[mood] || MOODS.idle;
    return (
      `<svg class="cz cz-${MOODS[mood] ? mood : 'idle'}${m.noBlink ? ' cz-fixed' : ''}" ` +
      `viewBox="0 0 ${W + PAD * 2} ${H + PAD * 2}" shape-rendering="crispEdges" aria-hidden="true">` +
        `<g class="cz-body">${BODY_SVG}</g>` +
        group(m.arm, 'cz-arm', m.armC || 'body') +
        group(m.eyes, 'cz-eyes', 'ink') +
        group([px(3, 2, 2), px(6, 2, 2)], 'cz-shut', 'ink') +
        group(m.mouth, 'cz-mouth', 'ink') +
        group(m.mouth2, 'cz-mouth2', 'ink') +
        group(m.extra, 'cz-extra', 'acc') +
      '</svg>'
    );
  }

  return { svg, MOODS, BODY };
});
