const CACHE = 'agriequip-v1';
const ASSETS = [
  '/AgriEquip-/',
  '/AgriEquip-/splash.html',
  '/AgriEquip-/login.html',
  '/AgriEquip-/index.html',
  '/AgriEquip-/css/dashboard.css',
  '/AgriEquip-/css/themes.css',
  '/AgriEquip-/js/firebase.js',
  '/AgriEquip-/js/dashboard.js',
  '/AgriEquip-/js/vip.js',
  '/AgriEquip-/js/wallet.js',
  '/AgriEquip-/js/teffai.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/AgriEquip-/index.html')))
  );
});
