/* RoyalShess - iconos de trazo
   Sustituyen a los emojis y a los simbolitos unicode (⏮ ▶ 🔊 ☰) de la barra
   y del reproductor: esos los dibuja cada sistema a su manera y en el panel
   del replay cantaban mucho. Aqui son SVG nuestros, del mismo grosor y con
   el color del texto, asi que heredan el tema (neon / clasico / CRT).

   CADA ICONO ES UN SOLO `d` sobre la rejilla 24x24, aunque tenga varios
   trazos. Eso no es capricho: morphicons (public/morph.js) transforma UN
   <path> en otro, asi que un icono con un unico `d` se puede morfear a
   cualquier otro de esta lista. Misma rejilla para todos o el morph
   descuadra. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RSIcons = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const D = {
    // --- reproductor de repeticiones ---
    play:     'M6 3l14 9-14 9z',
    pause:    'M6 4h4v16H6z M14 4h4v16h-4z',
    replay:   'M3 12a9 9 0 1 0 9-9 9.7 9.7 0 0 0-6.7 2.7L3 8 M3 3v5h5',
    skipBack: 'M19 20L9 12l10-8z M5 19V5',
    prev:     'M15 18l-6-6 6-6',
    next:     'M9 18l6-6-6-6',
    speed:    'M12 14l4-4 M3.4 19a10 10 0 1 1 17.2 0',
    // --- barra superior y menu ---
    sound:    'M11 4.7L6.6 9H3v6h3.6l4.4 4.3z M16 9a5 5 0 0 1 0 6 M19.4 5.6a10 10 0 0 1 0 12.8',
    mute:     'M11 4.7L6.6 9H3v6h3.6l4.4 4.3z M22 9l-6 6 M16 9l6 6',
    music:    'M9 18V5l12-2v13 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    menu:     'M4 6h16 M4 12h16 M4 18h16',
    settings: 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6',
    // --- emotes ---
    lock:     'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
    smile:    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M8 14s1.5 2 4 2 4-2 4-2 M9.5 9v.01 M14.5 9v.01',
    close:    'M18 6L6 18 M6 6l12 12',
    // --- logros (achievements.js) uno por fila de LIST, mismo orden ---
    check:    'M4 12l5 5L20 6',
    palette:  'M12 21a9 9 0 1 1 0-18c5 0 9 3.6 9 8 0 2.2-1.8 4-4 4h-2a2 2 0 0 0-1.4 3.4A2 2 0 0 1 12 21z M7.5 10.5v.01 M12 7.5v.01 M16.5 10.5v.01',
    achCanibal:    'M6 3l12 15 M18 3L6 18 M4 21l4-4 M20 21l-4-4',
    achCazador:    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 1v4 M12 19v4 M1 12h4 M19 12h4',
    achSacrificio: 'M5 9l2 8h10l2-8-4 3-3-6-3 6-4-3z M6 20h12',
    achRemontada:  'M3 17l6-6 4 4 8-8 M15 7h6v6',
    achEjecucion:  'M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M12 10v4l3 2 M9 2h6',
    achAhogo:      'M3 8h15v9H3z M21 11v3 M6 11v3',
    achReyDesnudo: 'M12 2v6 M9 5h6 M5 12h14l-2 8H7z M5 12l7-4 7 4',
    achIntocable:  'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z',
    achPesadilla:  'M7 4h10v6a5 5 0 0 1-10 0z M7 5H4v2a3 3 0 0 0 3 3 M17 5h3v2a3 3 0 0 1-3 3 M10 15h4l1 5H9z',
    achImpecable:  'M4 20h4v-5H4z M10 20h4v-9h-4z M16 20h4V6h-4z M3 21h18',
  };

  // El <svg> lleva el trazo; el <path> solo la geometria. Asi morph.js puede
  // reescribir el `d` sin tocar nada mas. `icon` queda en el dataset para
  // saber desde donde se morfea sin volver a leer el DOM
  function svg(name, cls) {
    const d = D[name] || '';
    return '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" ' +
           'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
           'aria-hidden="true"><path data-icon="' + name + '" d="' + d + '"/></svg>';
  }

  // icono + palabra: los botones de la barra son «dibujo + texto traducido».
  // El <span> se emite SIEMPRE, aunque el boton no lleve palabra: asi luego
  // se le puede meter texto sin repintar el SVG (y .ico-txt:empty lo esconde)
  function label(name, text) {
    const esc = String(text || '').replace(/[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    return svg(name) + '<span class="ico-txt">' + esc + '</span>';
  }

  // ---- manipular un boton YA pintado ------------------------------------
  // Viven aqui y no en client.js porque los usan dos modulos (la barra del
  // cliente y la botonera del reproductor): un ayudante que comparten dos
  // sitios pertenece al modulo de iconos, no a uno de los dos consumidores.

  // set() cambia la FORMA. Si morph.js ya cargo, la transforma con muelle;
  // si todavia no, reescribe el `d` a pelo. Nunca deja el boton sin dibujo.
  // Corta solo si ya esta en ese icono, asi que se puede llamar por fotograma
  function set(host, name) {
    if (typeof window !== 'undefined' && window.RSMorph) return window.RSMorph.to(host, name);
    const path = host && host.querySelector && host.querySelector('path[data-icon]');
    if (!path || !D[name]) return;
    path.dataset.icon = name;
    path.setAttribute('d', D[name]);
  }
  // btn() pinta el boton entero (icono + palabra); text() solo cambia la
  // palabra, sin tocar el SVG, que es lo que hace falta al cambiar de idioma
  function btn(host, name, text) { if (host) host.innerHTML = label(name, text); }
  function text(host, txt) {
    const s = host && host.querySelector('.ico-txt');
    if (s) s.textContent = txt;
  }

  return { D, svg, label, set, btn, text };
});
