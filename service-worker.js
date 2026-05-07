const CACHE_NAME = 'matrix-70-v1';
const urlsToCache = [
  './',
  './index.html',
  './database.js',
  './manifest.json',
  './store_icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// --- Értesítési Logika START ---

// 1. Az értesítés megjelenítése a kijelzőn
self.addEventListener('push', function(event) {
    let data = { title: 'Mátrix Labor', body: 'Rendszerüzenet érkezett!' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: 'icon-192x192.png', // Ellenőrizd, hogy ez a fájl létezik-e!
        badge: 'icon-192x192.png',
        vibrate: [200, 100, 200],
        data: {
            url: self.registration.scope // Megnyitja az appot, ha rákattintanak
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// 2. Mi történjen, ha a júzer rákattint az értesítésre
self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // Bezárja a kis ablakot
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // Ha már nyitva van az app, csak fókuszálunk rá
            for (let client of clientList) {
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            // Ha nincs nyitva, megnyitjuk
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});

// --- Értesítési Logika END ---
