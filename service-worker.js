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

// --- 1. KRITIKUS HIBAKEZELŐK (Brave/Electron Audit Fix) ---
self.addEventListener('error', (event) => {
    console.error("SW_CRITICAL_ERROR:", event.message);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error("SW_PROMISE_REJECTION:", event.reason);
});

// --- 2. INSTALL: GYORSÍTÓTÁR FELTÖLTÉSE ---
self.addEventListener('install', (event) => {
    // Azonnal átvesszük az irányítást, nem várunk a régi SW-re
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log("Mátrix: Cache feltöltése folyamatban...");
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((err) => console.error("Cache Install Error:", err))
    );
});

// --- 3. ACTIVATE: RÉGI VERZIÓK TAKARÍTÁSA ---
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log("Mátrix: Elavult cache törlése:", cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// --- 4. FETCH: NETWORK-FIRST STRATÉGIA (ERROR HANDLING-GEL) ---
self.addEventListener('fetch', (event) => {
    // Csak a GET kéréseket figyeljük
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Ha sikeres a hálózat, frissítjük a cache-t is a háttérben
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch((err) => {
                console.warn("Mátrix: Offline mód vagy hálózati hiba, cache használata...", err);
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    
                    // Ha nincs a cache-ben sem, dobunk egy értelmezhető hibát/oldalt
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});

// --- 5. PUSH ÉS ÉRTESÍTÉSEK ---
self.addEventListener('push', (event) => {
    let payload = { title: 'Mátrix Rendszer', body: 'Adatfrissítés érkezett!' };
    try {
        payload = event.data ? event.data.json() : payload;
    } catch (e) {
        payload.body = event.data.text();
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
