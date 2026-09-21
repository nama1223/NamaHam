const CACHE_NAME = 'namaham-cache-v1';

const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './manifest-en.json',
  './NamaHam192.png',
  './NamaHam512.png',
  './NamaHarmony192.png',
  './NamaHarmony512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  // インストール後すぐに新しいService Workerをアクティブにする
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            // 古いキャッシュを削除
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // すぐにコントロールを開始する
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // キャッシュ優先 + バックグラウンド更新 (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        // オフライン時は無視
        console.log('Network fetch failed, serving from cache only.', err);
      });

      // キャッシュがあれば即座に返し、裏でネットワークから取得。なければネットワークを待つ。
      return cachedResponse || fetchPromise;
    })
  );
});
