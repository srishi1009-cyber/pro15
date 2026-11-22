const CACHE_NAME = 'rishi-music-gh-v4';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// INSTALL
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            await cache.addAll(ASSETS_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// ACTIVATE
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.map((key) => {
                    if (
                        key.startsWith('rishi-music-') &&
                        key !== CACHE_NAME
                    ) {
                        return caches.delete(key);
                    }
                })
            )
        )
    );

    self.clients.claim();
});

// FETCH
self.addEventListener('fetch', (event) => {

    const request = event.request;

    // Only handle GET requests
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Ignore external websites
    if (url.origin !== self.location.origin) return;

    // Ignore data and blob URLs
    if (
        url.protocol === 'data:' ||
        url.protocol === 'blob:'
    ) return;

    event.respondWith(
        caches.match(request).then(async (cachedResponse) => {

            // Return cached files first
            if (cachedResponse) {
                return cachedResponse;
            }

            try {
                const networkResponse = await fetch(request);

                if (networkResponse && networkResponse.ok) {

                    const cache = await caches.open(CACHE_NAME);

                    // Cache application resources only
                    if (
                        request.destination === 'script' ||
                        request.destination === 'style' ||
                        request.destination === 'document' ||
                        request.destination === 'image' ||
                        request.destination === 'font' ||
                        url.pathname.endsWith('.json')
                    ) {
                        await cache.put(
                            request,
                            networkResponse.clone()
                        );
                    }
                }

                return networkResponse;

            } catch (error) {

                // Offline navigation fallback
                if (request.mode === 'navigate') {
                    return caches.match('./index.html');
                }

                return new Response(
                    'You are offline. Please try again later.',
                    {
                        status: 503,
                        headers: {
                            'Content-Type': 'text/plain'
                        }
                    }
                );
            }
        })
    );
});