/* RoyalShess - service worker
   Sirve para dos cosas, ninguna magica:
     1. Arranque instantaneo: el "shell" (html, css, js, iconos) sale de cache
        y se revalida por detras, asi la app abre sin pantalla en blanco
        aunque la red del movil este lenta.
     2. Fallo elegante: sin conexion la app carga igual y muestra su pantalla
        de "sin conexion" en vez del dinosaurio del navegador.

   OJO: la partida NO funciona offline. El tablero, la energia y hasta la CPU
   viven en el servidor (server/lobby.js), el cliente solo dibuja. Cachear no
   cambia eso; solo evita que la app parezca rota mientras no hay red.

   Al desplegar cambios hay que subir VERSION: es lo que invalida la cache
   vieja. Los nombres de archivo no llevan hash, asi que sin ese numero los
   navegadores se quedarian con el client.js de ayer. */
const VERSION = 'v1';
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
    await Promise.all(SHELL_URLS.map((u) => cache.add(u).catch(() => {})));
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
    const isShell = SHELL_URLS.includes(url.pathname);
    e.respondWith(staleWhileRevalidate(req, isShell ? SHELL : RUNTIME));
    return;
  }

  // Las fuentes de Google son inmutables: guardarlas evita que la tipografia
  // baile (o desaparezca) cuando el movil pierde la red.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(staleWhileRevalidate(req, FONTS));
  }
});
