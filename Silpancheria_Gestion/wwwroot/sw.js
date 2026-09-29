const CACHE_NAME = 'silpancheria-v2';
const urlsToCache = ['/', '/index.html', '/api.js'];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(
                names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Solo manejar GET de tu mismo dominio; la API nunca se cachea
    if (event.request.method !== 'GET' ||
        url.origin !== self.location.origin ||
        url.pathname.startsWith('/api/')) {
        return;
    }

    // Network first: siempre intenta el servidor, y usa la caché solo si no hay internet
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.ok) {
                    const copia = response.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(event.request, copia));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});