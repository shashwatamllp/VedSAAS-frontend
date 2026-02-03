// VedSAAS Service Worker
const CACHE_VERSION = 'vedsaas-v2.0.0-network-first';
const CACHE_NAME = `vedsaas-cache-${CACHE_VERSION}`;

// Files to cache immediately
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/public/css/civilization.css',
    '/public/image/logopic.png',
    '/chat/',
    '/offline.html',
    '/manifest.json',
    '/public/js/components.js',
    '/components/navbar.html'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
    self.skipWaiting(); // FORCE IMMEDIATE ACTIVATE
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(PRECACHE_URLS);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name.startsWith('vedsaas-cache-') && name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim()) // TAKE CONTROL IMMEDIATELY
    );
});

// Fetch event - Network First for HTML, Cache First for Assets
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // CRITICAL: Bypass all API requests
    if (url.pathname.includes('/api/')) return;

    // STRATEGY: Network First for HTML (Navigation)
    // This ensures user always sees the latest changes, fallback to cache if offline.
    if (request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Update cache with new version
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then((cachedResponse) => {
                        return cachedResponse || caches.match('/offline.html');
                    });
                })
        );
        return;
    }

    // STRATEGY: Cache First for Static Assets (CSS, JS, Images)
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then((response) => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    return response;
                });
            })
    );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Background sync (optional)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
});

async function syncMessages() {
    // Implement background sync logic here
    console.log('[SW] Background sync triggered');
}
