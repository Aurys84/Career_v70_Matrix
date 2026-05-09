// --- KRITIKUS HIBAKEZELŐK (A Brave/Electron igénye szerint) ---
self.addEventListener('error', (event) => {
    console.error("Mátrix Service Worker Error:", event.message);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error("Mátrix Unhandled Rejection:", event.reason);
});

const CACHE_NAME = 'matrix-71-v1'; 
const urlsToCache = [
  './',
  './index.html',
  './database.js',
  './manifest.json',
  './store_icon.png'
];

// Telepítés - Cache feltöltése
self.addEventListener('install', event => {
    self.skipWaiting(); // Kényszerített azonnali átvétel
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Mátrix: Cache feltöltése...");
            return cache.addAll(urlsToCache);
        })
    );
});

// Aktiválás - RÉGI SZEMÉT TAKARÍTÁSA (Ezért nem láttad a változást!)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log("Mátrix: Régi gyorsítótár törlése:", cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - Okos betöltés: Előbb a hálózat, utána a cache (hogy lásd a változást!)
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

// --- ÉRTESÍTÉSI LOGIKA (PUSH) ---
self.addEventListener('push', function(event) {
    let data = { title: 'Mátrix Labor', body: 'Rendszerüzenet érkezett!' };
    if (event.data) {
        try { data = event.data.json(); } 
        catch (e) { data.body = event.data.text(); }
    }
    const options = {
        body: data.body,
        icon: 'store_icon.png',
        badge: 'store_icon.png',
        vibrate: [200, 100, 200],
        data: { url: self.registration.scope }
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let client of clientList) {
                if (client.url === event.notification.data.url && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(event.notification.data.url);
        })
    );
});
