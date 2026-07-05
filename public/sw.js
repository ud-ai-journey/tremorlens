// Dadu service worker — NETWORK-FIRST so the latest deploy always loads.
// (The old cache-first version served a stale app shell after updates.)
const CACHE_NAME = 'dadu-cache-v3';
const SHELL = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Network-first: always try the network, fall back to cache only when offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (!req.url.startsWith('http') || req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Cache same-origin successful responses for offline fallback.
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => {
          if (cached) return cached;
          if (req.mode === 'navigate') return caches.match('/index.html');
          return undefined;
        })
      )
  );
});
