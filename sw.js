const CACHE_NAME = 'vedsaas-v16';
const urlsToCache = [
    '/',
    '/index.html',
    '/public/css/civilization.css',
    '/public/image/logopic.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force activation immediately
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Claim clients immediately
});

self.addEventListener('fetch', (event) => {
    // Network-first strategy for HTML to ensure freshness
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request);
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) return response;
                return fetch(event.request);
            })
    );
});
