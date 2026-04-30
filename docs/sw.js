/* KY 재고관리 안정형 PWA Service Worker */
const CACHE_NAME = 'ky-inventory-pwa-v20260430-ai-2';

const APP_SHELL = [
  './',
  './index.html',
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
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Apps Script 및 외부 API는 캐시 제외
  if (
    req.method !== 'GET' ||
    req.url.includes('script.google.com') ||
    req.url.includes('googleusercontent.com')
  ) {
    return;
  }

  // HTML은 네트워크 우선
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 나머지는 캐시 우선
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