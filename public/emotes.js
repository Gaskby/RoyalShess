
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RSEmotes = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  // ===== LOS EMOTES: un PEON vacilandote ================================
  // Seis burlas, cero chat libre. El personaje es la propia pieza en plano,
  // por capas, con la silueta maciza del icono: cabeza, collar, cuerpo y dos
  // peanas. Los dos puntos de brillo que llevan estos iconos en la cabeza
  // son los OJOS, y de ahi sale todo lo demas.
  //
  // Que sea un peon no es casualidad: es la pieza mas tonta del tablero, asi
  // que la burla escuece el doble. El remate del set es que se corona.
  //
  // El DISCO de detras no es decoracion: la pieza es azul marino y el panel
  // del juego tambien es oscuro, sin disco no se veria nada. Y ya que esta,
  // se tiñe del color de quien manda el emote (--e-disc), asi sabes quien
  // vacila sin leer una palabra.

  // ---- el disco y el suelo ---------------------------------------------
  // El suelo es el casquete inferior del disco: el arco va de (3.22,46) a
  // (60.78,46), que son los cortes de y=46 con el circulo r=32
  const DISC   = '<circle cx="32" cy="32" r="32" fill="var(--e-disc)"/>';
  const GROUND = '<path d="M3.22 46A32 32 0 0 0 60.78 46z" fill="var(--e-ground)"/>';

  // ---- el cuerpo del peon, de abajo arriba ------------------------------
  const BODY =
    '<rect x="20.5" y="26" width="23" height="5.5" rx="2.7" fill="var(--e-piece2)"/>' +
    '<path d="M26 31.5q.4 8.5-3.4 12.5h18.8Q37.6 40 38 31.5z" fill="var(--e-piece)"/>' +
    '<rect x="20" y="43.5" width="24" height="6.5" rx="3.2" fill="var(--e-piece2)"/>' +
    '<rect x="16" y="49.5" width="32" height="7.5" rx="3.7" fill="var(--e-piece)"/>';
  const SKULL = '<circle cx="32" cy="17" r="9.5" fill="var(--e-piece)"/>';

  // ---- rasgos ------------------------------------------------------------
  // Solo ojos y boca, y GORDOS: la burbuja mide 44 px en pantalla, ahi una
  // linea fina no es un gesto, es suciedad
  const eyes = {
    open:   '<circle cx="28.2" cy="15.8" r="2.2" fill="var(--e-face)"/>' +
            '<circle cx="35.8" cy="15.8" r="2.2" fill="var(--e-face)"/>',
    // los arcos hacia arriba: los ojos de quien se esta riendo de ti
    happy:  '<path d="M26.2 16.3q2-2.6 4 0" fill="none" stroke="var(--e-face)" stroke-width="2" stroke-linecap="round"/>' +
            '<path d="M33.8 16.3q2-2.6 4 0" fill="none" stroke="var(--e-face)" stroke-width="2" stroke-linecap="round"/>',
    shut:   '<path d="M26.2 15.6q2 2.4 4 0" fill="none" stroke="var(--e-face)" stroke-width="2" stroke-linecap="round"/>' +
            '<path d="M33.8 15.6q2 2.4 4 0" fill="none" stroke="var(--e-face)" stroke-width="2" stroke-linecap="round"/>',
    // dos rayas GORDAS: la mirada de medio lado del que no se cree lo que ha
    // visto. Finas no se leian: a este tamaño una raya de 2 px es ruido
    half:   '<rect x="25.6" y="14.6" width="5.2" height="2.6" rx="1.3" fill="var(--e-face)"/>' +
            '<rect x="33.2" y="14.6" width="5.2" height="2.6" rx="1.3" fill="var(--e-face)"/>',
    wink:   '<path d="M26.2 16.3q2-2.6 4 0" fill="none" stroke="var(--e-face)" stroke-width="2" stroke-linecap="round"/>' +
            '<circle cx="35.8" cy="15.8" r="2.2" fill="var(--e-face)"/>',
  };
  const mouth = {
    laugh: '<path class="ef-mouth" d="M27 20.4q5 6 10 0q-5 2.2-10 0z" fill="var(--e-face)"/>',
    wide:  '<path d="M27.5 20.8q4.5 4 9 0q-4.5 1.6-9 0z" fill="var(--e-face)"/>',
    // la boca del bostezo sale PEQUEÑA y la abre la animación. Dibujada ya
    // abierta ocupaba media cabeza y no parecia un bostezo, parecia un huevo
    yawn:  '<ellipse class="ef-mouth" cx="32" cy="21" rx="2.5" ry="3.1" fill="var(--e-face)"/>',
    // el berrinche: boca ancha con el borde de arriba caido
    wail:  '<path class="ef-mouth" d="M28 20.2q4 2.2 8 0q0 5.4-4 5.4t-4-5.4z" fill="var(--e-face)"/>',
    // la sonrisilla de lado: sube por un extremo. Toda la chuleria en una
    // curva, pero GRUESA: en creciente fino se perdia contra la cabeza
    smirk: '<path d="M27 21.2q5.4 3.4 10-2.6q-1.4 6.4-10 2.6z" fill="var(--e-face)"/>',
  };

  // ---- bracitos ----------------------------------------------------------
  // Capsula gruesa + mano redonda, un tono mas claro para que se despeguen
  // del cuerpo. Cada uno en su grupo: son los que se mueven
  const ARM_POINT =
    '<g class="ef-arm">' +
    '<path d="M37.5 34.5L47 30.5" fill="none" stroke="var(--e-piece2)" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="49.5" cy="29.5" r="3.7" fill="var(--e-hand)"/>' +
    '<rect x="52" y="27.8" width="7" height="3.4" rx="1.7" fill="var(--e-hand)"/></g>';

  // el aplauso lento: las manos empiezan SEPARADAS y se juntan despacio.
  // La lentitud es el chiste, por eso las rayitas del golpe solo se encienden
  // cuando chocan
  const ARMS_CLAP =
    '<g class="ef-clapL">' +
    '<path d="M26.5 34.5L24 39.5" fill="none" stroke="var(--e-piece2)" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="24.5" cy="41" r="4" fill="var(--e-hand)"/></g>' +
    '<g class="ef-clapR">' +
    '<path d="M37.5 34.5L40 39.5" fill="none" stroke="var(--e-piece2)" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="39.5" cy="41" r="4" fill="var(--e-hand)"/></g>' +
    '<path class="ef-tick" d="M18 38.5h2.6M18 44h2.6M43.4 38.5H46M43.4 44H46" fill="none" ' +
    'stroke="var(--e-face)" stroke-width="1.5" stroke-linecap="round"/>';

  const ARM_WAVE =
    '<g class="ef-wave">' +
    '<path d="M37.5 33.5L46 27" fill="none" stroke="var(--e-piece2)" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="48.5" cy="25" r="4.2" fill="var(--e-hand)"/>' +
    '<rect x="50.5" y="20.2" width="3" height="4.6" rx="1.5" fill="var(--e-hand)"/>' +
    '<rect x="53.6" y="21.4" width="3" height="4.4" rx="1.5" fill="var(--e-hand)"/>' +
    '<rect x="56.4" y="23.4" width="3" height="4" rx="1.5" fill="var(--e-hand)"/></g>';

  // los dos puños restregandose los ojos: el lloro de mentira
  const FISTS =
    '<path d="M23 34.5L25 27M41 34.5L39 27" fill="none" stroke="var(--e-piece2)" stroke-width="5" stroke-linecap="round"/>' +
    '<circle class="ef-fistL" cx="24.5" cy="17.5" r="4.4" fill="var(--e-hand)"/>' +
    '<circle class="ef-fistR" cx="39.5" cy="17.5" r="4.4" fill="var(--e-hand)"/>';

  // los chorros van pegados a la cara y se mueven con ella; las gotas que
  // CAEN van sueltas delante, con su propio bucle
  const TEAR_STREAMS =
    '<path d="M25.5 22q-2.6 7-2 11.6.3 2.3 2 2.3t2-2.3q.6-4.6-2-11.6z" fill="var(--e-tear)"/>' +
    '<path d="M38.5 22q-2.6 7-2 11.6.3 2.3 2 2.3t2-2.3q.6-4.6-2-11.6z" fill="var(--e-tear)"/>';
  const TEAR_DROPS =
    '<path class="ef-drop ef-drop1" d="M25.5 37q2.6 3.4 0 5.2-2.6-1.8 0-5.2z" fill="var(--e-tear)"/>' +
    '<path class="ef-drop ef-drop2" d="M38.5 37q2.6 3.4 0 5.2-2.6-1.8 0-5.2z" fill="var(--e-tear)"/>';

  // LA CORONA: el remate del set. Un peon poniendose la corona del rey es
  // «te ha ganado la pieza mas tonta del tablero», que en ajedrez duele mas
  // que cualquier carita
  const CROWN =
    '<g class="ef-crown">' +
    '<path d="M22.5 8.5l2 5.5h15l2-5.5-4.5 3-4.5-5-4.5 5z" fill="var(--e-gold)"/>' +
    '<rect x="23.5" y="13.5" width="17" height="4" rx="1.5" fill="var(--e-gold2)"/></g>' +
    '<path class="ef-spark ef-spark1" d="M13 12v3M11.5 13.5h3" fill="none" stroke="var(--e-gold)" ' +
    'stroke-width="1.6" stroke-linecap="round"/>' +
    '<path class="ef-spark ef-spark2" d="M51 10v3M49.5 11.5h3" fill="none" stroke="var(--e-gold)" ' +
    'stroke-width="1.6" stroke-linecap="round"/>';

  const ZZZ =
    '<text class="ef-z ef-z1" x="45.5" y="17" font-family="system-ui,sans-serif" font-weight="800" ' +
    'font-size="10" fill="var(--e-face)">z</text>' +
    '<text class="ef-z ef-z2" x="52" y="10.5" font-family="system-ui,sans-serif" font-weight="800" ' +
    'font-size="7.5" fill="var(--e-face)">z</text>';

  // ---- la escalera de emotes -------------------------------------------
  // El ORDEN es el indice que viaja por la red y el servidor solo valida el
  // rango (EMOTE_COUNT en lobby.js). No lo cambies a la ligera: cliente y
  // servidor tienen que subir juntos o una partida en vuelo veria otra cara.
  // face  = rasgos que van SOBRE la cabeza (se mueven con ella)
  // front = lo que va suelto delante: brazos, corona, gotas que caen
  // back  = lo que va detras de la cabeza pero delante del cuerpo
  const EMOTES = [
    // te señala y se descojona. El clasico, y el que mas tiltea
    { id: 'senala',  key: 'emote.senala',
      face: eyes.happy + mouth.laugh, front: ARM_POINT },
    // aplauso lento: «que jugada, campeon». Sarcasmo puro
    { id: 'aplauso', key: 'emote.aplauso',
      face: eyes.half + mouth.smirk, front: ARMS_CLAP },
    // bostezo: no se rie de tu jugada, se rie de lo que tardas
    { id: 'bostezo', key: 'emote.bostezo',
      face: eyes.shut + mouth.yawn, front: ZZZ },
    // llora mas: berrinche falso a dos puños
    { id: 'llora',   key: 'emote.llora',
      face: eyes.shut + mouth.wail, back: TEAR_STREAMS, front: FISTS + TEAR_DROPS },
    // adios: «venga, hasta luego». Te despide antes de que acabe la partida
    { id: 'adios',   key: 'emote.adios',
      face: eyes.wink + mouth.wide, front: ARM_WAVE },
    // coronacion: te ha ganado un peon
    { id: 'corona',  key: 'emote.corona',
      face: eyes.open + mouth.smirk, front: CROWN },
  ];

  // devuelve el SVG completo de un emote, listo para meter en el DOM.
  // La clase e-<id> del <svg> es la que engancha su animacion en style.css
  function svg(i) {
    const e = EMOTES[i];
    if (!e) return '';
    return '<svg class="emote-face e-' + e.id + '" viewBox="0 0 64 64" aria-hidden="true">' +
             DISC + GROUND +
             '<g class="ef-body">' + BODY + '</g>' +
             (e.back || '') +
             '<g class="ef-head">' + SKULL + e.face + '</g>' +
             (e.front || '') +
           '</svg>';
  }

  return { EMOTES, svg, count: EMOTES.length };
});
