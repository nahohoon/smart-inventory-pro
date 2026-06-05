/* KY 재고관리 안정형 PWA Service Worker */
const CACHE_NAME = 'ky-inventory-cache-v4';
const CACHE_PREFIX = 'ky-inventory-cache-';

/* HTML(./, ./index.html)은 캐시하지 않음 — navigate는 항상 네트워크 */
const APP_SHELL = [
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then(clients =>
        Promise.all(
          clients.map(client => {
            try {
              return client.navigate(client.url);
            } catch (e) {
              return Promise.resolve();
            }
          })
        )
      )
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (
    req.method !== 'GET' ||
    req.url.includes('script.google.com') ||
    req.url.includes('googleusercontent.com')
  ) {
    return;
  }

  /* SW 스크립트: 항상 최신본 */
  if (req.url.includes('sw.js')) {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  /* HTML 문서: 네트워크 전용 (캐시 저장/폴백 없음) */
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() =>
        fetch(req, { cache: 'reload' })
      )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      return (
        cached ||
        fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return res;
        })
      );
    })
  );
});
