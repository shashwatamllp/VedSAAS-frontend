const CACHE_NAME = 'vedsaas-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/public/css/civilization.css',
    '/public/image/logopic.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) return response;
                return fetch(event.request);
            })
    );
});
