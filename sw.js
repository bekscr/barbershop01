// sw.js — GitHub Pages friendly
const CACHE = 'bs01-v2'; // сменил версию, чтобы обновить кэш
const ASSETS = [
  './',                 // корень репозитория
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // сразу активируем новый SW
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Стратегия: Cache First для статических ассетов,
// Network First для остального (например, HTML навигации)
self.addEventListener('fetch', event => {
  const req = event.request;

  // Для документов (навигация) — сначала сеть, иначе кэш (офлайн)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Для ассетов из списка — Cache First
  const url = new URL(req.url);
  const isAsset = ASSETS.some(p => url.pathname.endsWith(p.replace('./', '/barbershop01/')));
  if (isAsset) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req))
    );
    return;
  }

  // Остальное — попытка из кэша, иначе сеть
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});