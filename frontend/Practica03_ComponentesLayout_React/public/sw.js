const CACHE = 'multicatalogo-shell-v4';
const SHELL = ['/', '/index.html', '/manifest.json', '/favicon.svg', '/pwa-192.png', '/pwa-512.png'];
const PRODUCT_IMAGES = [
  'aceite-corporal-almendras', 'balsamo-labial-cacao', 'bruma-facial-rosas',
  'contorno-ojos', 'crema-hidratante', 'gel-limpiador-avena', 'kit-rutina', 'mascarilla-nocturna',
  'serum-galeria-1', 'serum-galeria-2', 'serum-galeria-3', 'serum-retinol',
  'serum-revitalizante', 'tonico-exfoliante', 'tonico-purificante',
].map(name => `/productos/${name}.webp`);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll([...SHELL, ...PRODUCT_IMAGES]);
    // Vite genera nombres con hash: se leen del HTML compilado para que la primera
    // apertura de la PWA ya tenga JavaScript y CSS disponibles sin conexión.
    const html = await (await cache.match('/index.html')).text();
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(match => match[1]);
    if (!assets.length) throw new Error('No se encontraron los archivos de la aplicación.');
    await cache.addAll([...new Set(assets)]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('multicatalogo-shell-') && key !== CACHE).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')));
    return;
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/productos/') || SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(request, { ignoreVary: true }).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
      }
      return response;
    })));
  }
});
