const CACHE_NAME = 'aurys84-v71-matrix';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './database.js',
  './manifest.json',
  './store_icon.png'
];

// --- 1. HIBAKEZELÉS (Debuggoláshoz) ---
self.addEventListener('error', (event) => {
    console.error("Mátrix SW Hiba:", event.message);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error("Mátrix SW Rejection:", event.reason);
});

// --- 2. INSTALL: Assetek betöltése a gyorsítótárba ---
self.addEventListener('install', (event) => {
    // Azonnali aktiválás kérése (nem várja meg a meglévő oldalak lezárását)
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log("Mátrix: Assetek tárazása...");
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((err) => {
                console.error("Mátrix Install Hiba:", err);
                // Ha a cacheelés sikertelen, ne blokkolja az installt, csak logolj
            })
    );
});

// --- 3. ACTIVATE: Régi verziók törlése és kliensek "birtoklása" ---
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
        }).then(() => {
            // Minden meglévő oldalt azonnal a new SW-hez kapcsol (fontos offline-hoz!)
            return self.clients.claim();
        })
    );
});

// --- 4. FETCH: ROBUST STRATÉGIA (Offline-barát) ---
// Logika: 
// 1. Próbáljuk meg a netről letölteni (Network First).
// 2. Ha sikerül, frissítjük a cache-t és visszaadjuk a hálózati verziót.
// 3. Ha a hálózat nem elérhető (offline), NEM dobunk hibát, hanem visszaadjuk a cache-ből az index.html-t.
self.addEventListener('fetch', (event) => {
    // Csak GET kéréseket kezeli
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Ha sikeres a hálózati kérés
                if (response && response.status === 200) {
                    // Másolat a cache-be mentéshez (a response-t egyszer lehet olvasni)
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // HÁLÓZATI HIBA (pl. nincs internet, vagy a szerver nem elérhető)
                // Ilyenkor a cache-ből próbálunk meg találni valamit.
                // FONTOS: Ha semmi sem található, az index.html-t adjuk vissza, 
                // hogy az app betöltődjön (SPA működéshez szükséges).
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    // Ha még a cache-ben sincs meg a kért fájl (pl. új fájl, ami nem lett cache-elve),
                    // de az index.html van benne, azt adjuk vissza a SPA routernek.
                    return caches.match('./index.html');
                });
            })
    );
});
