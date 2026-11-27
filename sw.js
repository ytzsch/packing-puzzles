// Offline support: the app shell and puzzle pack are kept on the phone.
// Pages and code are served from the phone and refreshed in the background (new versions show on the next launch).
// Published puzzles (puzzles/) are fetched fresh when online, from the phone when not.
const CACHE = 'pp-__VERSION__';
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'core.js', 'worker.js', 'qrcode.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.png',
  'pack/level-1.json', 'pack/level-2.json', 'pack/level-3.json', 'pack/level-4.json', 'pack/level-5.json', 'puzzles/index.json'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE)
  .then(c => c.addAll(SHELL.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const nav = req.mode === 'navigate', key = nav ? new Request(new URL('index.html', self.registration.scope)) : req;
  if (url.pathname.includes('/puzzles/')) {
    e.respondWith(fetch(req).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone())); return res; })
      .catch(() => caches.match(req, {ignoreSearch: true})));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(key, {ignoreSearch: true});
    const net = fetch(nav ? key : req).then(res => { if (res.ok) c.put(key, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
