const CACHE_NAME = 'vancore-static-v2';
const STATIC_ASSETS = ['/manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  // Version 1 could cache authenticated API responses. Remove that cache.
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('vancore-static-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('Authorization')) return;
  // Cache immutable build assets only. HTML, API, profiles and documents
  // always go to the network and cannot leak through an offline cache.
  if (!url.pathname.startsWith('/_next/static/') && !STATIC_ASSETS.includes(url.pathname)) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone())));
    return response;
  })));
});
