/* (morphicons) */
import { createMorph } from './vendor/morphicons/dom.js';

const D = window.RSIcons.D;
const morphs = new WeakMap();   // <path> -> instancia de morphicons


function morphOf(path) {
  let m = morphs.get(path);
  if (!m) {
    m = createMorph(path, path.getAttribute('d') || '');
    morphs.set(path, m);
  }
  return m;
}

// cambia el icono de un contenedor (normalmente un <button>) con animacion.
// Si ya esta en ese icono no hace nada: rpHud() llama en cada fotograma
function morphTo(host, name, spring) {
  const path = host && host.querySelector('path[data-icon]');
  if (!path || !D[name] || path.dataset.icon === name) return;
  path.dataset.icon = name;
  morphOf(path).morphTo(D[name], spring || 'snappy');
}

window.RSMorph = { to: morphTo };
// aviso a client.js de que a partir de aqui los cambios ya son animados
document.dispatchEvent(new Event('rs-morph-ready'));
