// sw.js — GitHub Pages friendly, без хардкода имени репозитория
const CACHE = 'bs01-v3'; // меняй версию при обновлении ассетов

// Базовый путь, где задеплоен сайт (напр. "/barbershop01/" или "/")
const SCOPE_PATH = new URL(self.registration.scope).pathname.replace(/\/+$/, '/') || '/';

// Нормализуем список ассетов с учётом базового пути
const ASSETS = [
  '',            // корень сайта (= index.html)
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
].map(p => SCOPE_PATH + p);

// ====== INSTALL: кладём ассеты в кэш ======
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ====== ACTIVATE: чистим старые кэши ======
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// ====== FETCH ======
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1) Навигация (HTML): network-first, fallback -> index.html из кэша (для офлайна)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          // Обновим кэш свежим index при успешной загрузке корня/индекса
          if (url.pathname === SCOPE_PATH || url.pathname === SCOPE_PATH + 'index.html') {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(SCOPE_PATH + 'index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match(SCOPE_PATH + 'index.html'))
    );
    return;
  }

  // 2) Cache-first для статических ассетов из нашего списка
  const isOurAsset = ASSETS.includes(url.pathname);
  if (isOurAsset) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req))
    );
    return;
  }

  // 3) Для всего прочего — cache falling back to network (экономичный режим)
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});