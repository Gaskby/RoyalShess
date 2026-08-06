
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RSEmotes = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  // ---- piezas comunes de la cabeza -------------------------------------
  const NECK  = '<path d="M27 46h10v11l-5 4-5-4z" fill="var(--e-skin2)"/>';
  const SHIRT = '<path d="M13 64q1.5-8 11-10.5l8 7 8-7q9.5 2.5 11 10.5z" fill="var(--e-shirt)"/>' +
                '<path d="M24 53.5l8 7 8-7" fill="none" stroke="var(--e-shirt2)" stroke-width="1.7"/>';
  const FACE  = '<circle cx="15.8" cy="34" r="3.1" fill="var(--e-skin2)"/>' +
                '<circle cx="48.2" cy="34" r="3.1" fill="var(--e-skin2)"/>' +
                '<path d="M16 27C16 12 22 8 32 8s16 4 16 19v9c0 14-7 18-16 18s-16-4-16-18z" ' +
                'fill="var(--e-skin)"/>';
  // LA MELENA: lo que hace que se le reconozca. Silueta con bucles arriba y
  // flequillo ondulado sobre la frente, no un casco liso
  const HAIR  = '<path d="M12 33C8 20 11 10 19 6c4-3 8-2 10 0 3-4 9-4 12 0 7 0 13 7 11 27' +
                'c-1-7-3-12-6.5-14-4.5 5-10 3-13.5.5-4 3.5-9.5 4.5-13.5-.5-3.5 2-5.5 7-6.5 14z" ' +
                'fill="var(--e-hair)"/>' +
                '<path d="M18 15q5 3.5 9.5 1.5M35 13.5q5.5 2 9.5 5.5M26 8.5q4 1 6.5 3" ' +
                'fill="none" stroke="var(--e-hair2)" stroke-width="1.6" stroke-linecap="round"/>';

  // ---- rasgos sueltos, para no repetirlos en cada cara ------------------
  const eye = {
    // el ojo de siempre, con el parpado pesado encima: mirada dura
    openL:  '<ellipse cx="25.5" cy="33" rx="2.6" ry="3.2" fill="var(--e-line)"/>' +
            '<path d="M22.4 30.6q3.1-1.8 6.2 0" fill="none" stroke="var(--e-line)" ' +
            'stroke-width="1.5" stroke-linecap="round"/>',
    openR:  '<ellipse cx="38.5" cy="33" rx="2.6" ry="3.2" fill="var(--e-line)"/>' +
            '<path d="M35.4 30.6q3.1-1.8 6.2 0" fill="none" stroke="var(--e-line)" ' +
            'stroke-width="1.5" stroke-linecap="round"/>',
    // guiño: el ojo cerrado hacia arriba. La chuleria empieza aqui
    winkL:  '<path d="M22 33.5q3.5-4.5 7 0" fill="none" stroke="var(--e-line)" ' +
            'stroke-width="2.6" stroke-linecap="round"/>',
    happyL: '<path d="M22 34q3.5-4.5 7 0" fill="none" stroke="var(--e-line)" ' +
            'stroke-width="2.6" stroke-linecap="round"/>',
    happyR: '<path d="M35 34q3.5-4.5 7 0" fill="none" stroke="var(--e-line)" ' +
            'stroke-width="2.6" stroke-linecap="round"/>',
    // platos: el blanco a tope es lo unico que se lee de lejos
    wideL:  '<ellipse cx="25.5" cy="33" rx="4.4" ry="5" fill="#fff"/>' +
            '<circle cx="25.5" cy="33.6" r="2.3" fill="var(--e-line)"/>',
    wideR:  '<ellipse cx="38.5" cy="33" rx="4.4" ry="5" fill="#fff"/>' +
            '<circle cx="38.5" cy="33.6" r="2.3" fill="var(--e-line)"/>',
    // apretados hacia abajo: los de llorar a moco tendido
    shutL:  '<path d="M22 31.5q3.5 4.5 7 0" fill="none" stroke="var(--e-line)" ' +
            'stroke-width="2.6" stroke-linecap="round"/>',
    shutR:  '<path d="M35 31.5q3.5 4.5 7 0" fill="none" stroke="var(--e-line)" ' +
            'stroke-width="2.6" stroke-linecap="round"/>',
  };
  // las cejas van en su propio tono, mas oscuro que la melena: si no,
  // se pierden contra el pelo y la cara se queda sin gesto.
  // Las ASIMETRICAS son las que dan el aire de sobrado
  const brow = {
    flatL:  '<path d="M21 27q4.5-2.5 9-1" fill="none" stroke="var(--e-brow)" stroke-width="2.8" ' +
            'stroke-linecap="round"/>',
    flatR:  '<path d="M43 27q-4.5-2.5-9-1" fill="none" stroke="var(--e-brow)" stroke-width="2.8" ' +
            'stroke-linecap="round"/>',
    highL:  '<path d="M21 23.5q4.5-3 9-1.5" fill="none" stroke="var(--e-brow)" stroke-width="2.8" ' +
            'stroke-linecap="round"/>',
    highR:  '<path d="M43 23.5q-4.5-3-9-1.5" fill="none" stroke="var(--e-brow)" stroke-width="2.8" ' +
            'stroke-linecap="round"/>',
    // la ceja de "ya te vale": una arriba y otra caida
    smugL:  '<path d="M21 26q4.5 1.5 9 2" fill="none" stroke="var(--e-brow)" stroke-width="2.8" ' +
            'stroke-linecap="round"/>',
    sadL:   '<path d="M21 29q4.5-4.5 9-3.5" fill="none" stroke="var(--e-brow)" stroke-width="2.8" ' +
            'stroke-linecap="round"/>',
    sadR:   '<path d="M43 29q-4.5-4.5-9-3.5" fill="none" stroke="var(--e-brow)" stroke-width="2.8" ' +
            'stroke-linecap="round"/>',
  };
  const mouth = {
    // sonrisilla de lado: sube por un extremo. La burla en una sola curva
    smirk: '<path d="M26 43.5q5.5 3.5 11-2" fill="none" stroke="var(--e-line)" ' +
           'stroke-width="2.4" stroke-linecap="round"/>',
    // carcajada de verdad, con lengua: no se confunde con una sonrisa
    laugh: '<path d="M23 40q9 13 18 0q-9 4-18 0z" fill="var(--e-line)"/>' +
           '<path d="M29 47.5q3-3 6 0q-3 2.5-6 0z" fill="var(--e-tongue)"/>',
    // mandibula desencajada
    jaw:   '<ellipse cx="32" cy="44" rx="3.6" ry="5" fill="var(--e-line)"/>',
    firm:  '<path d="M26.5 43.5h11" fill="none" stroke="var(--e-line)" stroke-width="2.6" ' +
           'stroke-linecap="round"/>',
    // berrinche: boca abierta y ancha con el borde de arriba CAIDO. Ese
    // borde hacia abajo es lo que la separa de la mandibula del asombro,
    // que es un ovalo alto y estrecho
    wail:  '<path d="M26.5 42.5q5.5 4 11 0q0 8-5.5 8t-5.5-8z" fill="var(--e-line)"/>',
    // lengua fuera: el remate mas burlon del juego
    tongue:'<path d="M26.5 42q5.5 3 11 0" fill="none" stroke="var(--e-line)" stroke-width="2.4" ' +
           'stroke-linecap="round"/>' +
           '<path d="M29.5 43h6q0 6.5-3 6.5t-3-6.5z" fill="var(--e-tongue)" ' +
           'stroke="var(--e-line)" stroke-width="1.3" stroke-linejoin="round"/>',
  };

  // manos. Van en su propio grupo para poder moverlas solas
  const HAND_WAVE =
    '<g class="ef-hand"><g transform="rotate(12 54 40)">' +
    '<path d="M41.5 43.5q0-2.6 2-3.6V29.5q0-2.2 2.1-2.2t2.1 2.2V36h1.1V26.5q0-2.2 2.1-2.2t2.1 2.2V36h1.1' +
    'v-6.4q0-2.2 2.1-2.2t2.1 2.2V44q0 7.8-7.8 7.8t-9-8.3z" fill="var(--e-skin)" ' +
    'stroke="var(--e-line)" stroke-width="1.6" stroke-linejoin="round"/></g></g>';
  const HAND_THUMB =
    '<g class="ef-thumb"><g transform="rotate(-6 53 54)">' +
    '<path d="M43 50.5q0-2.4 2.4-2.4h2.4l3-6.4q1-2.2 3-1.2t1.2 3.2l-1.4 4.4h4.6q2.4 0 2.4 2.4t-2.4 2.4' +
    'q2.4 0 2.4 2.4t-2.4 2.4q2.4 0 2.4 2.4T58.2 62H48.5q-5.5 0-5.5-5.5z" fill="var(--e-skin)" ' +
    'stroke="var(--e-line)" stroke-width="1.6" stroke-linejoin="round"/></g></g>';

  // LAGRIMAS: dos chorros gordos por las mejillas. Van pegadas a la cara,
  // asi que entran con los rasgos y se mueven con la cabeza
  const TEAR_STREAMS =
    '<path d="M23 35.5q-3 8-2.4 14 .3 2.7 2.4 2.7t2.4-2.7q.6-6-2.4-14z" fill="var(--e-tear)"/>' +
    '<path d="M41 35.5q-3 8-2.4 14 .3 2.7 2.4 2.7t2.4-2.7q.6-6-2.4-14z" fill="var(--e-tear)"/>';
  // las gotas que CAEN van fuera de la cabeza: tienen su propio animacion
  const TEAR_DROPS =
    '<path class="ef-drop ef-drop1" d="M20.5 53q3 4 0 6.2-3-2.2 0-6.2z" fill="var(--e-tear)"/>' +
    '<path class="ef-drop ef-drop2" d="M43.5 53q3 4 0 6.2-3-2.2 0-6.2z" fill="var(--e-tear)"/>';
  // lagrimon de risa saltando del ojo: el detalle que hace la risa burlona
  const LAUGH_TEAR =
    '<path class="ef-drop ef-drop1" d="M18.5 36q2.6 3.4 0 5.2-2.6-1.8 0-5.2z" fill="var(--e-tear)"/>' +
    '<path class="ef-drop ef-drop2" d="M45.5 36q2.6 3.4 0 5.2-2.6-1.8 0-5.2z" fill="var(--e-tear)"/>';

  // llama sobre la melena: el naranja es lo que se ve de lejos
  const FLAME =
    '<g class="ef-flame">' +
    '<path d="M45.5 0q8 6 7.5 13.5T45 21q-5.5 0-6-5.5t3.5-8.5q.3 3 2 3.7Q45.5 6.5 45.5 0z" ' +
    'fill="var(--e-flame)"/>' +
    '<path d="M45 8.5q3.4 4 3 8t-3.8 4q-2.7 0-3-3t2.2-5q.2 1.6 1.1 2-.2-2.7.5-6z" ' +
    'fill="var(--e-flame2)"/></g>';

  // ---- la escalera de emotes -------------------------------------------
  // el ORDEN es el indice que viaja por la red: no lo cambies a la ligera
  // o los emotes de una partida en curso saldrian cambiados.
  // fx    = rasgos que van SOBRE la cabeza (se mueven con ella)
  // extra = lo que va suelto delante: manos, llama, gotas que caen
  const EMOTES = [
    // saludo de sobrado: guiño, sonrisilla de lado y la manita
    { id: 'hola',    key: 'emote.hola',
      fx: brow.flatL + brow.highR + eye.winkL + eye.openR + mouth.smirk,
      extra: HAND_WAVE },
    // risa en tu cara, con lagrimones de tanto reirse
    { id: 'risa',    key: 'emote.risa',
      fx: brow.highL + brow.highR + eye.happyL + eye.happyR + mouth.laugh,
      extra: LAUGH_TEAR },
    // asombro exagerado, de los de "aaanda ya"
    { id: 'asombro', key: 'emote.asombro',
      fx: brow.highL + brow.highR + eye.wideL + eye.wideR + mouth.jaw,
      extra: '' },
    // chuleria pura: una ceja arriba, otra caida y la cabeza ardiendo
    { id: 'fuego',   key: 'emote.fuego',
      fx: brow.smugL + brow.highR + eye.openL + eye.openR + mouth.smirk,
      extra: FLAME },
    // llorica: berrinche con dos chorros y gotas cayendo
    { id: 'llanto',  key: 'emote.llanto',
      fx: brow.sadL + brow.sadR + eye.shutL + eye.shutR + mouth.wail + TEAR_STREAMS,
      extra: TEAR_DROPS },
    // "buena partida" con guiño y lengua fuera: buen rollo, pero con retintin
    { id: 'gg',      key: 'emote.gg',
      fx: brow.flatL + brow.flatR + eye.winkL + eye.openR + mouth.tongue,
      extra: HAND_THUMB },
  ];

  // devuelve el SVG completo de un emote, listo para meter en el DOM.
  // La clase e-<id> del <svg> es la que engancha su animacion en style.css
  function svg(i) {
    const e = EMOTES[i];
    if (!e) return '';
    return '<svg class="emote-face e-' + e.id + '" viewBox="0 0 64 64" aria-hidden="true">' +
             '<g class="ef-body">' + NECK + SHIRT + '</g>' +
             '<g class="ef-head">' + FACE + HAIR + e.fx + '</g>' +
             e.extra +
           '</svg>';
  }

  return { EMOTES, svg, count: EMOTES.length };
});
