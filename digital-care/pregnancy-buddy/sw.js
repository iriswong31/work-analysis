// 孕期搭子 Service Worker - 支持离线访问和后台通知
const CACHE_NAME = 'pregnancy-buddy-v4';
const URLS_TO_CACHE = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
    );
});
