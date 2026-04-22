/**
 * KY 재고관리 — Service Worker v2
 * ─────────────────────────────────
 * 전략: Stale-While-Revalidate (앱 셸)
 *       Network Only (Google API)
 *       Cache First (아이콘/정적 파일)
 *
 * 버전 업 방법: CACHE_VER 숫자만 올리면
 * 기존 캐시 자동 삭제 후 새로 설치됩니다.
 */

const CACHE_VER  = 2;
const CACHE_NAME = 'ky-inv-v' + CACHE_VER;

/* 앱 셸 — 최초 설치 시 반드시 캐시할 파일 */
const PRECACHE = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './favicon.ico'
];

/* Google 도메인 — 항상 네트워크만 사용 (캐시 금지) */
const NETWORK_ONLY = [
  'script.google.com',
  'script.googleusercontent.com',
  'googleapis.com',
  'accounts.google.com'
];

/* CDN — 네트워크 우선, 실패 시 캐시 */
const CDN_DOMAINS = [
  'cdnjs.cloudflare.com'
];

/* ── 유틸 ── */
function matchesDomain(url, domains) {
  return domains.some(function(d) { return url.indexOf(d) !== -1; });
}

/* ══ INSTALL ══ */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        /* 개별로 추가 — 하나 실패해도 나머지 계속 */
        return Promise.allSettled(
          PRECACHE.map(function(url) {
            return cache.add(url).catch(function(err) {
              console.warn('[SW] 프리캐시 실패:', url, err.message);
            });
          })
        );
      })
      .then(function() { return self.skipWaiting(); })
  );
});

/* ══ ACTIVATE ══ */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(k) { return k !== CACHE_NAME; })
          .map(function(k) {
            console.log('[SW] 구버전 캐시 삭제:', k);
            return caches.delete(k);
          })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

/* ══ FETCH ══ */
self.addEventListener('fetch', function(e) {
  /* GET 요청만 처리 */
  if (e.request.method !== 'GET') return;

  var url = e.request.url;

  /* 1. Google API — 절대 캐시 안 함 */
  if (matchesDomain(url, NETWORK_ONLY)) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return new Response(
          JSON.stringify({ success: false, message: '오프라인 상태입니다' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  /* 2. CDN — 네트워크 우선, 캐시 폴백 */
  if (matchesDomain(url, CDN_DOMAINS)) {
    e.respondWith(
      fetch(e.request)
        .then(function(res) {
          if (res && res.ok) {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
          }
          return res;
        })
        .catch(function() { return caches.match(e.request); })
    );
    return;
  }

  /* 3. 앱 셸 (index.html, manifest, 아이콘)
        Stale-While-Revalidate: 캐시 즉시 반환 + 백그라운드 업데이트 */
  e.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(e.request).then(function(cached) {
        var networkFetch = fetch(e.request)
          .then(function(res) {
            if (res && res.ok && res.type !== 'opaque') {
              cache.put(e.request, res.clone());
            }
            return res;
          })
          .catch(function() { return null; });

        /* 캐시가 있으면 즉시 반환 (백그라운드에서 최신화) */
        return cached || networkFetch.then(function(res) {
          return res || new Response('오프라인', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      });
    })
  );
});

/* ══ NOTIFICATION (향후 부족재고 푸시 알림 확장용) ══ */
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(ex) {}
  var title = data.title || 'KY 재고관리';
  var opts  = {
    body:    data.body    || '새 알림이 있습니다',
    icon:    './icons/icon-192.png',
    badge:   './icons/icon-96.png',
    tag:     data.tag     || 'ky-alert',
    vibrate: [200, 100, 200],
    data:    { url: data.url || './' }
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var targetUrl = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(list) {
        for (var i = 0; i < list.length; i++) {
          if (list[i].url.indexOf(targetUrl) !== -1 && 'focus' in list[i]) {
            return list[i].focus();
          }
        }
        return clients.openWindow(targetUrl);
      })
  );
});

/* ══ 메시지 핸들러 (앱에서 SW로 명령 전달) ══ */
self.addEventListener('message', function(e) {
  if (!e.data) return;
  switch (e.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(function() {
        console.log('[SW] 캐시 초기화 완료');
      });
      break;
  }
});
