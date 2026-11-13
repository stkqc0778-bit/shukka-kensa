// 出荷検査記録 Service Worker
// 更新のたびに VERSION の番号を上げる
const VERSION = 'shukka-kensa-v13';
const FILES = ['./', './index.html', './config.js', './zumen.js', './exceljs.min.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== 'shukka-zumen').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // config.js は常に最新を取りに行く（オフライン時だけキャッシュ）
  if (u.pathname.endsWith('/config.js')) {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request)));
    return;
  }
  // 図面画像（zu/）は一度読み込んだら端末に保存（バージョンが変わっても残す）
  if (u.pathname.indexOf('/zu/') >= 0) {
    e.respondWith(caches.open('shukka-zumen').then(c => c.match(e.request).then(r => r || fetch(e.request).then(x => { if (x.ok) c.put(e.request, x.clone()); return x; }))));
    return;
  }
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(r => r || fetch(e.request)));
});
