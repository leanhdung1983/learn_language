
const CACHE_NAME = 'linguaflow-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event: Cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network First for HTML/API, Cache First for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Google Gemini API & External APIs -> Network Only (Never cache)
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('dicebear.com') || url.hostname.includes('unsplash.com')) {
    return;
  }

  // 2. Navigation (HTML) -> Network First (Fall back to cache)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 3. Static Assets (JS, CSS, Images in origin) -> Stale-While-Revalidate
  // This serves from cache immediately but updates in background
  if (url.origin === self.location.origin && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.png'))) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});
