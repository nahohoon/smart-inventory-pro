/**
 * KY 재고관리 — Service Worker v3
 * ─────────────────────────────────────────────────────────
 * ★ 배포 시 BUILD_ID를 현재 시각으로 교체하면
 *   브라우저가 SW 파일 변경을 감지 → 자동 업데이트
 *
 * BUILD_ID 형식: YYYYMMDD_HHMM  예) 20260422_1430
 * ─────────────────────────────────────────────────────────
 */

const BUILD_ID   = '20260422_1428';          /* ← 배포 시 이 값을 교체 */
const CACHE_NAME = 'ky-inv-' + BUILD_ID;

const PRECACHE = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './favicon.ico'
];

const NETWORK_ONLY_HOSTS = [
  'script.google.com',
  'script.googleusercontent.com',
  'googleapis.com',
  'accounts.google.com'
];

const CDN_HOSTS = ['cdnjs.cloudflare.com'];

function matchHost(url, hosts) {
  return hosts.some(function(h){ return url.indexOf(h) !== -1; });
}

/* ══ INSTALL — 새 캐시 빌드 ══ */
self.addEventListener('install', function(e) {
  console.log('[SW] install BUILD_ID:', BUILD_ID);
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return Promise.allSettled(
          PRECACHE.map(function(url) {
            /* cache-busting: ?v=BUILD_ID 붙여서 항상 최신 파일 가져옴 */
            var req = new Request(url + '?v=' + BUILD_ID, { cache: 'no-store' });
            return fetch(req)
              .then(function(res) {
                if(res && res.ok) return cache.put(url, res);
              })
              .catch(function(err) {
                console.warn('[SW] precache 실패:', url, err.message);
              });
          })
        );
      })
      /* 설치 즉시 활성화 — 대기 없음 */
      .then(function() { return self.skipWaiting(); })
  );
});

/* ══ ACTIVATE — 구버전 캐시 전부 삭제 ══ */
self.addEventListener('activate', function(e) {
  console.log('[SW] activate — 구버전 캐시 정리');
  e.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(
          keys
            .filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) {
              console.log('[SW] 삭제:', k);
              return caches.delete(k);
            })
        );
      })
      /* 즉시 모든 탭에 새 SW 적용 */
      .then(function() { return self.clients.claim(); })
      .then(function() {
        /* 열린 탭에 업데이트 완료 메시지 전송 */
        return self.clients.matchAll({ type: 'window' });
      })
      .then(function(clients) {
        clients.forEach(function(c) {
          c.postMessage({ type: 'SW_UPDATED', buildId: BUILD_ID });
        });
      })
  );
});

/* ══ FETCH ══ */
self.addEventListener('fetch', function(e) {
  if(e.request.method !== 'GET') return;
  var url = e.request.url;

  /* 1. Google API — 절대 캐시 안 함 */
  if(matchHost(url, NETWORK_ONLY_HOSTS)) {
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

  /* 2. CDN — Network First, 캐시 폴백 */
  if(matchHost(url, CDN_HOSTS)) {
    e.respondWith(
      fetch(e.request)
        .then(function(res) {
          if(res && res.ok) {
            caches.open(CACHE_NAME).then(function(c){ c.put(e.request, res.clone()); });
          }
          return res;
        })
        .catch(function() { return caches.match(e.request); })
    );
    return;
  }

  /* 3. 앱 셸 — Network First (항상 최신 우선) + 캐시 폴백
     ★ 이전과 달리 캐시를 먼저 주지 않고 네트워크를 먼저 시도
        → 배포 즉시 최신 index.html 수신 보장              */
  e.respondWith(
    fetch(e.request)
      .then(function(res) {
        if(res && res.ok && res.type !== 'opaque') {
          caches.open(CACHE_NAME).then(function(c){ c.put(e.request, res.clone()); });
        }
        return res;
      })
      .catch(function() {
        /* 오프라인 시 캐시에서 폴백 */
        return caches.match(e.request).then(function(cached) {
          return cached || new Response('오프라인', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});

/* ══ 메시지 핸들러 ══ */
self.addEventListener('message', function(e) {
  if(!e.data) return;
  switch(e.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(function() {
        console.log('[SW] 캐시 초기화 완료:', CACHE_NAME);
      });
      break;
    case 'GET_BUILD_ID':
      if(e.source) e.source.postMessage({ type: 'BUILD_ID', buildId: BUILD_ID });
      break;
  }
});

/* ══ 알림 ══ */
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(ex) {}
  e.waitUntil(self.registration.showNotification(data.title||'KY 재고관리', {
    body: data.body||'새 알림이 있습니다',
    icon: './icons/icon-192.png',
    badge: './icons/icon-96.png',
    tag: data.tag||'ky-alert',
    vibrate: [200,100,200],
    data: { url: data.url||'./' }
  }));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var targetUrl = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true })
      .then(function(list) {
        for(var i=0;i<list.length;i++){
          if(list[i].url.indexOf(targetUrl)!==-1 && 'focus' in list[i]) return list[i].focus();
        }
        return clients.openWindow(targetUrl);
      })
  );
});
