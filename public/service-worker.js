// Minimal service worker — clears all old caches, intercepts nothing.
// Caching was interfering with POST/API requests, converting them to GET.

const CACHE_NAME = 'my-cache-Glamhour-v3';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Delete all old caches so stale responses don't affect API calls
      caches.keys().then((keys) =>
        Promise.all(keys.map((k) => caches.delete(k)))
      ),
    ])
  );
});

// No fetch handler — every request goes directly to the network.
