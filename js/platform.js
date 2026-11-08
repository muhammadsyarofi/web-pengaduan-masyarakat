/**
 * Platform — Pengaduan Desa Luwung
 * Satu kode untuk tiga cara pakai:
 *  - Web      : dibuka lewat browser
 *  - Desktop  : dipasang sebagai aplikasi (Chrome/Edge) -> jendela sendiri
 *  - Mobile   : dipasang di layar utama (Android/iOS) + navigasi bawah
 */
(function () {
  'use strict';

  var deferredPrompt = null;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: minimal-ui)').matches ||
           window.navigator.standalone === true;
  }
  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  /* ----- Penanda platform di <html> (untuk CSS) ----- */
  function markPlatform() {
    var root = document.documentElement;
    root.classList.toggle('is-app', isStandalone());
    root.classList.toggle('is-ios', isIOS());
    root.classList.toggle('is-touch', 'ontouchstart' in window || navigator.maxTouchPoints > 0);
  }
  markPlatform();
  window.matchMedia('(display-mode: standalone)').addEventListener &&
    window.matchMedia('(display-mode: standalone)').addEventListener('change', markPlatform);

  /* ----- Service worker ----- */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    navigator.serviceWorker.register('./sw.js').catch(function () {});
  }

  /* ----- Toast ringan (fallback bila LuwungApp belum ada) ----- */
  function toast(msg, type) {
    if (window.LuwungApp && window.LuwungApp.showToast) return window.LuwungApp.showToast(msg, type || 'success');
    alert(msg);
  }

  /* ----- Tombol pasang aplikasi ----- */
  function installHandler(e) {
    if (e) e.preventDefault();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (r) {
        if (r.outcome === 'accepted') toast('Aplikasi sedang dipasang…');
        deferredPrompt = null;
        refreshInstallButtons();
      });
    } else if (isIOS()) {
      toast('Di iPhone/iPad: ketuk tombol Bagikan, lalu pilih "Tambah ke Layar Utama".', 'warning');
    } else {
      toast('Buka menu browser (⋮), lalu pilih "Pasang aplikasi" atau "Tambahkan ke layar utama".', 'warning');
    }
  }

  function buildInstallButtons() {
    if (isStandalone()) return;
    // sidebar
    var side = document.getElementById('appSidebar');
    var userBox = document.getElementById('sidebarUserInfo');
    if (side && userBox && !document.getElementById('btnInstallSide')) {
      var b = document.createElement('button');
      b.type = 'button'; b.id = 'btnInstallSide'; b.className = 'install-btn';
      b.innerHTML = '<span class="ic">📲</span> Pasang Aplikasi';
      b.addEventListener('click', installHandler);
      side.insertBefore(b, userBox);
    }
    // halaman masuk
    var body = document.querySelector('.landing-body');
    if (body && !document.getElementById('btnInstallLanding')) {
      var l = document.createElement('button');
      l.type = 'button'; l.id = 'btnInstallLanding'; l.className = 'btn btn-outline btn-block install-landing';
      l.innerHTML = '📲 Pasang Aplikasi di Perangkat Anda';
      l.addEventListener('click', installHandler);
      body.appendChild(l);
    }
  }
  function refreshInstallButtons() {
    if (isStandalone()) {
      document.querySelectorAll('#btnInstallSide, #btnInstallLanding').forEach(function (el) { el.remove(); });
    }
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    buildInstallButtons();
  });
  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    document.querySelectorAll('#btnInstallSide, #btnInstallLanding').forEach(function (el) { el.remove(); });
    toast('Aplikasi berhasil dipasang!');
  });

  /* ----- Navigasi bawah untuk mobile ----- */
  function buildBottomNav() {
    var nav = document.querySelector('#appSidebar nav');
    if (!nav || document.getElementById('bottomNav')) return;
    var bar = document.createElement('nav');
    bar.id = 'bottomNav'; bar.className = 'bottom-nav'; bar.setAttribute('aria-label', 'Menu cepat');
    var labels = { 'beranda.html': 'Beranda', 'pengaduan.html': 'Adukan', 'lacak.html': 'Status', 'daftar.html': 'Daftar', 'profil.html': 'Profil' };
    nav.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!labels[href]) return;
      var ic = a.querySelector('.ic');
      var item = document.createElement('a');
      item.href = href;
      if (a.classList.contains('active')) { item.className = 'active'; item.setAttribute('aria-current', 'page'); }
      item.innerHTML = '<span class="ic">' + (ic ? ic.textContent : '') + '</span><span class="lb">' + labels[href] + '</span>';
      bar.appendChild(item);
    });
    document.body.appendChild(bar);
    document.body.classList.add('has-bottom-nav');
  }

  /* ----- Tutup sidebar saat pindah ukuran layar / tekan Esc ----- */
  function sidebarHelpers() {
    var sidebar = document.getElementById('appSidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (!sidebar || !overlay) return;
    function close() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 768) close(); });
    sidebar.querySelectorAll('nav a').forEach(function (a) { a.addEventListener('click', close); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    registerSW();
    buildBottomNav();
    sidebarHelpers();
    buildInstallButtons();       // iOS & browser tanpa event: tombol tetap ada sebagai petunjuk
  });
})();
