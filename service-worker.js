self.addEventListener('error', (event) => {
    console.error("Mátrix SW Error:", event.message);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error("Mátrix Unhandled Rejection:", event.reason);
});

const CACHE_NAME = 'matrix-v71-final';
const urlsToCache = [
  './',
  './index.html',
  './database.js',
  './manifest.json',
  './store_icon.png'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => { if(key !== CACHE_NAME) return caches.delete(key); })
        )).then(() => self.clients.claim())
    );
});

// FRISSÍTÉS-BARÁT FETCH: Előbb a friss kód, csak utána a cache!
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});

// --- ÉRTESÍTÉSEK ---
self.addEventListener('push', event => {
    let data = { title: 'Mátrix Labor', body: 'Rendszerüzenet!' };
    if (event.data) { try { data = event.data.json(); } catch(e) { data.body = event.data.text(); } }
    event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: 'store_icon.png' }));
});
