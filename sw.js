const CACHE_NAME = 'action-track-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/normalize.css',
  '/css/webflow.css',
  '/css/action-track.webflow.css',
  '/js/webflow.js',
  '/js/firebase-config.js',
  '/js/firebase-auth.js',
  '/js/functions.js',
  '/images/icon.svg',
  '/images/webclip.png',
  '/manifest.json'
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
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
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
});