/**
 * Aurys84 - Career-Engine v71 PRO
 * Refactored Service Worker with Advanced Error Handling
 */

const CACHE_NAME = 'aurys84-matrix-v71';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './database.js',
  './manifest.json',
  './store_icon.png'
];

// --- 1. KRITIKUS HIBAKEZELŐK (Brave Audit Fix) ---
self.addEventListener('error', (event) => {
    console.error("SW_CRITICAL_ERROR:", event.message);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error("SW_PROMISE_REJECTION:", event.reason);
});

// --- 2. INSTALL: CACHE FELTÖLTÉSE ---
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Azonnali átvétel, nem várjuk meg a bezárást
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log("Mátrix: Assetek tárazása...");
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((err) => console.error("Mátrix Install Hiba:", err))
    );
});

// --- 3. ACTIVATE: RÉGI SZEMÉT TAKARÍTÁSA ---
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log("Mátrix: Elavult cache törlése:", key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// --- 4. FETCH: NETWORK-FIRST (Hogy lásd a változást az index.html-ben!) ---
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Ha él a hálózat, frissítjük a cache-t is
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Ha nincs net, jön a mentett verzió
                return caches.match(event.request).then((cached) => {
                    if (cached) return cached;
                    // Végső mentőöv navigációhoz
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});

// --- 5. PUSH ÉRTESÍTÉSEK ---
self.addEventListener('push', (event) => {
    let payload = { title: 'Mátrix Rendszer', body: 'Rendszerüzenet érkezett!' };
    try {
        payload = event.data ? event.data.json() : payload;
    } catch (e) {
        payload.body = event.data ? event.data.text() : payload.body;
    }

    event.waitUntil(
        self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: 'store_icon.png',
            badge: 'store_icon.png',
            vibrate: [100, 50, 100]
        })
    );
});
