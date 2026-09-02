/* RoyalShess - service worker
   Sirve para dos cosas, ninguna magica:
     1. Arranque rapido: el "shell" (html, css, js, iconos) se guarda entero.
        Los iconos y las imagenes salen ya de cache; el codigo se pide a red
        con un tope de espera corto y tira de cache si la red no llega, asi la
        app abre sin pantalla en blanco aunque el movil vaya mal de red.
     2. Fallo elegante: sin conexion la app carga igual y muestra su pantalla
        de "sin conexion" en vez del dinosaurio del navegador.

   OJO: la partida NO funciona offline. El tablero, la energia y hasta la CPU
   viven en el servidor (server/lobby.js), el cliente solo dibuja. Cachear no
   cambia eso; solo evita que la app parezca rota mientras no hay red.

   Al desplegar cambios conviene subir VERSION: borra las caches viejas de
   golpe. Ya no es lo unico que nos salva (el codigo va a red primero, ver
   mas abajo), pero deja el disco limpio entre versiones. */
const VERSION = 'v2';
const SHELL = `royalshess-shell-${VERSION}`;
const RUNTIME = `royalshess-runtime-${VERSION}`;
const FONTS = `royalshess-fonts-${VERSION}`;

// El shell minimo para pintar algo util. Las imagenes de los rivales y los
// morphicons NO estan aqui a proposito: pesan y se cachean solas al usarse.
const SHELL_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/favicon.svg',
  '/manifest.webmanifest',
  '/config.js',
  '/rivals.js',
  '/achievements.js',
  '/icons.js',
  '/emotes.js',
  '/i18n.js',
  '/engine.js',
  '/replay.js',
  '/bgfx.js',
  '/music.js',
  '/client.js',
  '/morph.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Rutas que jamas se cachean: son estado del servidor, no cliente.
const NEVER = ['/health', '/admin'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // addAll es todo o nada: si un archivo falla, la instalacion entera se cae
    // y nos quedamos sin service worker. Uno a uno perdona los huecos.
    // cache:'reload' evita guardar en la cache del SW lo que ya estaba viejo
    // en la cache HTTP del navegador: seria empezar la casa por el tejado.
    await Promise.all(SHELL_URLS.map((u) =>
      fetch(u, { cache: 'reload' })
        .then((res) => (res && res.ok ? cache.put(u, res) : null))
        .catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keep = new Set([SHELL, RUNTIME, FONTS]);
    const names = await caches.keys();
    await Promise.all(names.map((n) => (keep.has(n) ? null : caches.delete(n))));
    await self.clients.claim();
  })());
});

// Permite que la pagina fuerce la actualizacion sin esperar a cerrar pestanas
self.addEventListener('message', (e) => { if (e.data === 'skip-waiting') self.skipWaiting(); });

// El codigo (html, css, js) tiene que viajar junto. El index va a red siempre,
// asi que si el resto saliera de cache tendriamos un index nuevo pidiendole
// claves a un i18n.js viejo: ahi es donde salian los identificadores en crudo
// (CARD.BLACK, MENU.FRIEND...) en vez del texto traducido. Por eso el codigo
// va a red primero, con la cache como red de emergencia. El tope de espera es
// lo que mantiene el arranque rapido en una red mala: si la red no contesta
// en NET_TIMEOUT ms tiramos de lo guardado, igual que antes.
const CODE_RE = /\.(?:js|css|html)$/;
const NET_TIMEOUT = 3000;

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); },
    );
  });
}

// red-primero: lo ultimo que haya publicado, con lo guardado de respaldo
async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await withTimeout(fetch(req), NET_TIMEOUT);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (_e) {
    return (await cache.match(req)) || Response.error();
  }
}

// cache-primero-y-revalida: responde ya con lo guardado y actualiza por detras
async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const net = fetch(req).then((res) => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return hit || (await net) || Response.error();
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin && NEVER.some((p) => url.pathname.startsWith(p))) return;

  // Navegacion: red primero para que un despliegue nuevo entre al momento,
  // con el index cacheado de red de emergencia.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(SHELL);
        cache.put('/index.html', res.clone());
        return res;
      } catch (_e) {
        const cache = await caches.open(SHELL);
        return (await cache.match('/index.html')) || (await cache.match('/')) || Response.error();
      }
    })());
    return;
  }

  if (sameOrigin) {
    const cacheName = SHELL_URLS.includes(url.pathname) ? SHELL : RUNTIME;
    // codigo a red primero; imagenes e iconos, que no caducan, de cache
    e.respondWith(CODE_RE.test(url.pathname)
      ? networkFirst(req, cacheName)
      : staleWhileRevalidate(req, cacheName));
    return;
  }

  // Las fuentes de Google son inmutables: guardarlas evita que la tipografia
  // baile (o desaparezca) cuando el movil pierde la red.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(staleWhileRevalidate(req, FONTS));
  }
});
