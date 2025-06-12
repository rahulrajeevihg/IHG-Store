
// public/service-worker.js

const CACHE_NAME = 'my-cache-Glamhour';
const REVALIDATE_TIME = 86400; // Revalidate after 24 hours (in seconds)

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        // Add files you want to cache here, such as CSS, JS, images, etc.
        '/',
        '/pages/index.js',
        '/Address',
        '/Arrow',
        '/Cart',
        '/checkout',
        '/Delivery',
        '/EmptyImg',
        '/errors',
        '/footer',
        '/thankyou',
        '/styles',
        '/filters',
        '/order',
        '/login',
        '/detail',
        '/Sidemenu',
        '/Tabs',
        '/js',
        '/Nav',
        '/Navbar',
        '/styles/globals.scss',
        '/libs/api.js',
        // Add more files to cache as needed
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((response) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
        // Revalidate cached responses after a specified time
        if (response) {
          const fetchTime = Date.parse(response.headers.get('date'));
          const currentTime = Date.now();
          if (currentTime - fetchTime > REVALIDATE_TIME * 1000) {
            return fetchPromise;
          }
          return response;
        }
        return fetchPromise;
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});
