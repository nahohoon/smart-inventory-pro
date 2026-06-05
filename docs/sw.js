/* KY 재고관리 안정형 PWA Service Worker */
const CACHE_NAME = 'ky-inventory-cache-v4-20260605-loginrecover';
const CACHE_PREFIX = 'ky-inventory-cache-';

const APP_SHELL = [
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

function isHtmlRequest(req) {
  if (req.mode === 'navigate' || req.destination === 'document') return true;
  try {
    var path = new URL(req.url).pathname;
    return /\/index\.html$/i.test(path) || path.endsWith('/');
  } catch (e) {
    return false;
  }
}

function purgeLegacyCaches() {
  return caches.keys().then(function(keys) {
    return Promise.all(
      keys
        .filter(function(key) {
          return key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME;
        })
        .map(function(key) {
          return caches.delete(key);
        })
    );
  });
}

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    purgeLegacyCaches()
      .then(function() {
        return caches.open(CACHE_NAME);
      })
      .then(function(cache) {
        return cache.addAll(APP_SHELL);
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    purgeLegacyCaches().then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  var req = event.request;

  // Apps Script 및 외부 API는 캐시 제외
  if (
    req.method !== 'GET' ||
    req.url.includes('script.google.com') ||
    req.url.includes('googleusercontent.com')
  ) {
    return;
  }

  // sw.js: 항상 네트워크 우선 (구버전 SW 고착 방지)
  if (/\/sw\.js(\?|$)/i.test(req.url)) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(function() {
        return caches.match(req);
      })
    );
    return;
  }

  // index.html / 문서: 네트워크 우선 (최신 배포 반영)
  if (isHtmlRequest(req)) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(function(res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(req, copy);
            });
          }
          return res;
        })
        .catch(function() {
          return caches.match(req);
        })
    );
    return;
  }

  // 나머지는 캐시 우선
  event.respondWith(
    caches.match(req).then(function(cached) {
      return (
        cached ||
        fetch(req).then(function(res) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(req, copy);
          });
          return res;
        })
      );
    })
  );
});
