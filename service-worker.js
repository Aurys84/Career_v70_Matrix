// --- KRITIKUS HIBAKEZELŐK START (A Brave/Electron igénye szerint) ---
self.addEventListener('error', (event) => {
    console.error("Mátrix Service Worker Error:", event.message);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error("Mátrix Unhandled Rejection:", event.reason);
});
// --- KRITIKUS HIBAKEZELŐK END ---

const CACHE_NAME = 'matrix-71-v1'; // Verziót léptettem a frissítés miatt
const urlsToCache = [
  './',
  './index.html',
  './database.js',
  './manifest.json',
  './store_icon.png'
];

// Telepítés és Cache feltöltése
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // Azonnali átvétel
  );
});

// Aktiválás és a régi cache takarítása
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch eseménykezelő
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// --- ÉRTESÍTÉSI LOGIKA ---
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
        icon: 'store_icon.png',
        badge: 'store_icon.png',
        vibrate: [200, 100, 200],
        data: {
            url: self.registration.scope
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let client of clientList) {
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
