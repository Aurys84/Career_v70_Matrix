const CACHE_NAME = 'matrix-71-v1';
const urlsToCache = [
  './',
  './index.html',
  './database.js',
  './manifest.json',
  './store_icon.png'
];

// Hibakezelők a Brave audit fixhez
self.addEventListener('error', e => console.error("SW Error:", e.message));
self.addEventListener('unhandledrejection', e => console.error("SW Rejection:", e.reason));

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => { if (key !== CACHE_NAME) return caches.delete(key); })
    )).then(() => self.clients.claim())
  );
});

// Biztonságos Fetch: Ha van hálózat, azt használja, ha nincs, jön a cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
