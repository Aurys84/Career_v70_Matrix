/**
 * Aurys84 - Career-Engine v71 PRO
 * Stable Service Worker with Advanced Error Handling
 */

const CACHE_NAME = 'aurys84-v71-matrix';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './database.js',
  './manifest.json',
  './store_icon.png'
];

// --- 1. BRAVE/ELECTRON AUDIT FIX (Error Handling) ---
self.addEventListener('error', (event) => {
    console.error("Mátrix SW Hiba:", event.message);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error("Mátrix SW Rejection:", event.reason);
});

// --- 2. INSTALL: Assetek betöltése a gyorsítótárba ---
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Azonnali aktiválás kérése
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log("Mátrix: Assetek tárazása...");
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((err) => console.error("Mátrix Install Hiba:", err))
    );
});

// --- 3. ACTIVATE: Régi verziók kigyomlálása ---
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log("Mátrix: Régi cache törlése:", key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// --- 4. FETCH: NETWORK-FIRST STRATÉGIA (Ez a legbiztonságosabb!) ---
// Előbb mindig a friss fájlt kéri le a netről/gépről, és csak ha nincs meg, jön a cache.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Ha sikeres a lekérés, frissítjük a cache-t a háttérben
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Hálózati hiba esetén jön a mentett verzió
                return caches.match(event.request).then((cached) => {
                    return cached || new Response("Offline mód - Az erőforrás nem érhető el.");
                });
            })
    );
});
