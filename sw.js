/**
 * Service Worker — Platform Pengaduan Desa Luwung
 * Caching offline dasar agar halaman utama dan aset tetap bisa diakses.
 */

const CACHE_NAME = 'luwung-pengaduan-v4';
const ASSETS = [
  './',
  './index.html',
  './beranda.html',
  './pengaduan.html',
  './daftar.html',
  './profil.html',
  './lacak.html',
  './admin.html',
  './css/style.css',
  './js/storage.js',
  './js/app.js',
  './js/admin.js',
  './js/platform.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './images/galeri-halaman.jpg',
  './images/galeri-kantor.jpg',
  './images/galeri-pendopo.jpg',
  './images/galeri-taman.jpg',
  './images/image.png',
  './images/kat-administrasi.svg',
  './images/kat-air.svg',
  './images/kat-bansos.svg',
  './images/kat-infrastruktur.svg',
  './images/kat-keamanan.svg',
  './images/kat-kebersihan.svg',
  './images/kat-kesehatan.svg',
  './images/kat-lainnya.svg',
  './images/kat-pendidikan.svg',
  './images/kat-penerangan.svg',
  './images/langkah-1.svg',
  './images/langkah-2.svg',
  './images/langkah-3.svg'
];

// Install: cache aset inti
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first untuk HTML, cache-first untuk aset statis
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Hanya handle same-origin
  if (url.origin !== location.origin) return;

  // Navigasi (HTML): coba network dulu, fallback cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./beranda.html') || caches.match('./index.html')))
    );
    return;
  }

  // Aset statis: cache-first
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
