/**
 * storage.js — penyimpanan localStorage Platform Pengaduan Desa Luwung
 * Termasuk akun warga (demo client-side, bukan keamanan produksi).
 */

const Storage = (function () {
  const KEY_PENGADUAN = 'luwung_pengaduan';
  const KEY_SETTINGS = 'luwung_settings';
  const KEY_ADMIN = 'luwung_admin_session';
  const KEY_USER = 'luwung_user_session';
  const KEY_USERS = 'luwung_users';
  const KEY_COUNTER = 'luwung_ticket_counter';

  const DEMO_ADMIN = { username: 'admin', password: 'luwung2026' };

  const DEFAULT_SETTINGS = {
    namaKepalaDesa: 'Kepala Desa Luwung',
    namaDesa: 'Desa Luwung',
    kecamatan: 'Kecamatan Mundu',
    kabupaten: 'Kabupaten Cirebon',
    provinsi: 'Provinsi Jawa Barat',
    alamatKantor: 'Jl. Raya Luwung No. XX, Desa Luwung, Kec. Mundu, Kab. Cirebon',
    jamPelayanan: 'Senin - Jumat: 08.00 - 15.00 WIB',
    telepon: '08XX-XXXX-XXXX',
    whatsapp: '628XXXXXXXXXX',
    email: 'desaluwung@example.com',
    kategori: [
      'Infrastruktur (jalan, jembatan, drainase)',
      'Kebersihan & Sampah',
      'Penerangan Jalan',
      'Air Bersih & Irigasi',
      'Keamanan & Ketertiban',
      'Pelayanan Administrasi',
      'Bantuan Sosial',
      'Kesehatan',
      'Pendidikan',
      'Lainnya'
    ]
  };

  const SEED_DATA = [
    {
      id: 'LWG-20261015-0001', nama: 'Budi Santoso', nik: '', whatsapp: '081234567890',
      rt: '01', rw: '02', dusun: 'Blok A', kategori: 'Infrastruktur (jalan, jembatan, drainase)',
      judul: 'Jalan rusak di depan balai RT 01',
      isi: 'Jalan di depan balai RT 01 sangat berlubang dan berlumpur saat hujan. Mohon diperbaiki agar warga aman melintas.',
      lokasi: 'Depan Balai RT 01 RW 02, Blok A', tanggalKejadian: '2026-10-10', anonim: false, foto: [],
      status: 'Selesai', tanggalDibuat: '2026-10-15T08:30:00.000Z',
      riwayat: [
        { status: 'Baru', waktu: '2026-10-15T08:30:00.000Z', catatan: 'Pengaduan diterima sistem' },
        { status: 'Diverifikasi', waktu: '2026-10-15T10:00:00.000Z', catatan: 'Data lengkap, dilanjutkan ke proses' },
        { status: 'Diproses', waktu: '2026-10-16T09:00:00.000Z', catatan: 'Tim lapangan sedang meninjau lokasi' },
        { status: 'Selesai', waktu: '2026-10-20T14:00:00.000Z', catatan: 'Jalan sudah diperbaiki dengan pengaspalan ringan.' }
      ]
    },
    {
      id: 'LWG-20261020-0002', nama: 'Anonim', nik: '', whatsapp: '081298765432',
      rt: '03', rw: '01', dusun: 'Blok C', kategori: 'Kebersihan & Sampah',
      judul: 'Tumpukan sampah di selokan',
      isi: 'Ada tumpukan sampah yang menyumbat selokan di dekat pos ronda. Bau tidak sedap dan berpotensi banjir.',
      lokasi: 'Selokan dekat Pos Ronda RT 03', tanggalKejadian: '2026-10-18', anonim: true, foto: [],
      status: 'Diproses', tanggalDibuat: '2026-10-20T11:15:00.000Z',
      riwayat: [
        { status: 'Baru', waktu: '2026-10-20T11:15:00.000Z', catatan: 'Pengaduan diterima sistem' },
        { status: 'Diverifikasi', waktu: '2026-10-20T13:00:00.000Z', catatan: 'Sudah diverifikasi' },
        { status: 'Diproses', waktu: '2026-10-21T08:30:00.000Z', catatan: 'Petugas kebersihan dijadwalkan membersihkan minggu ini' }
      ]
    },
    {
      id: 'LWG-20261025-0003', nama: 'Siti Aminah', nik: '3209xxxxxxxxxxxx', whatsapp: '081345678901',
      rt: '02', rw: '03', dusun: 'Blok B', kategori: 'Penerangan Jalan',
      judul: 'Lampu jalan mati di gang utama',
      isi: 'Lampu penerangan jalan di gang utama Blok B sudah mati lebih dari 2 minggu. Malam hari sangat gelap dan rawan.',
      lokasi: 'Gang utama Blok B, RT 02 RW 03', tanggalKejadian: '2026-10-10', anonim: false, foto: [],
      status: 'Diverifikasi', tanggalDibuat: '2026-10-25T09:45:00.000Z',
      riwayat: [
        { status: 'Baru', waktu: '2026-10-25T09:45:00.000Z', catatan: 'Pengaduan diterima sistem' },
        { status: 'Diverifikasi', waktu: '2026-10-25T14:20:00.000Z', catatan: 'Lokasi sudah dikonfirmasi' }
      ]
    },
    {
      id: 'LWG-20261101-0004', nama: 'Ahmad Fauzi', nik: '', whatsapp: '081456789012',
      rt: '04', rw: '02', dusun: 'Blok D', kategori: 'Air Bersih & Irigasi',
      judul: 'Saluran irigasi tersumbat',
      isi: 'Saluran irigasi sawah di Blok D tersumbat sedimen dan sampah.',
      lokasi: 'Saluran irigasi Blok D', tanggalKejadian: '2026-10-28', anonim: false, foto: [],
      status: 'Baru', tanggalDibuat: '2026-11-01T07:20:00.000Z',
      riwayat: [{ status: 'Baru', waktu: '2026-11-01T07:20:00.000Z', catatan: 'Pengaduan diterima sistem' }]
    },
    {
      id: 'LWG-20261105-0005', nama: 'Anonim', nik: '', whatsapp: '081567890123',
      rt: '01', rw: '01', dusun: 'Blok A', kategori: 'Keamanan & Ketertiban',
      judul: 'Lampu ronda mati dan pos kosong',
      isi: 'Pos ronda di ujung jalan sering kosong pada malam hari dan lampunya mati.',
      lokasi: 'Pos ronda ujung jalan Blok A', tanggalKejadian: '2026-11-03', anonim: true, foto: [],
      status: 'Baru', tanggalDibuat: '2026-11-05T16:00:00.000Z',
      riwayat: [{ status: 'Baru', waktu: '2026-11-05T16:00:00.000Z', catatan: 'Pengaduan diterima sistem' }]
    }
  ];

  function sanitize(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const result = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === 'string') result[key] = sanitize(obj[key]);
        else if (typeof obj[key] === 'object') result[key] = sanitizeObject(obj[key]);
        else result[key] = obj[key];
      }
    }
    return result;
  }

  function getUsers() {
    try {
      const raw = localStorage.getItem(KEY_USERS);
      if (!raw) {
        const seed = [{
          id: 'u1', nama: 'Warga Demo', username: 'warga', password: 'warga123',
          whatsapp: '081234567890', rt: '01', rw: '01', dusun: 'Blok A', dibuat: new Date().toISOString()
        }];
        localStorage.setItem(KEY_USERS, JSON.stringify(seed));
        return seed;
      }
      return JSON.parse(raw);
    } catch (e) { return []; }
  }

  function saveUsers(list) { localStorage.setItem(KEY_USERS, JSON.stringify(list)); }

  function registerUser(data) {
    const users = getUsers();
    const username = (data.username || '').trim().toLowerCase();
    if (!username || username.length < 3) return { ok: false, msg: 'Username minimal 3 karakter.' };
    if (!data.password || data.password.length < 6) return { ok: false, msg: 'Password minimal 6 karakter.' };
    if (data.password !== data.password2) return { ok: false, msg: 'Konfirmasi password tidak sama.' };
    if (users.some(u => u.username === username)) return { ok: false, msg: 'Username sudah digunakan.' };
    if (!data.nama || !data.nama.trim()) return { ok: false, msg: 'Nama lengkap wajib diisi.' };
    if (!data.whatsapp || data.whatsapp.replace(/\D/g, '').length < 10) return { ok: false, msg: 'Nomor WhatsApp tidak valid.' };
    const user = {
      id: 'u' + Date.now(), nama: data.nama.trim(), username, password: data.password,
      whatsapp: data.whatsapp.trim(), rt: data.rt || '', rw: data.rw || '', dusun: data.dusun || '',
      dibuat: new Date().toISOString()
    };
    users.push(user); saveUsers(users);
    return { ok: true, user };
  }

  function loginUser(username, password) {
    const users = getUsers();
    const u = users.find(x => x.username === (username || '').trim().toLowerCase() && x.password === password);
    if (!u) return false;
    sessionStorage.setItem(KEY_USER, JSON.stringify({
      loggedIn: true, id: u.id, nama: u.nama, username: u.username,
      whatsapp: u.whatsapp, rt: u.rt, rw: u.rw, dusun: u.dusun, waktu: new Date().toISOString()
    }));
    return true;
  }

  function logoutUser() { sessionStorage.removeItem(KEY_USER); }

  function getUserSession() {
    try {
      const raw = sessionStorage.getItem(KEY_USER);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return s.loggedIn ? s : null;
    } catch (e) { return null; }
  }

  function isUserLoggedIn() { return !!getUserSession(); }

  function requireUserOrRedirect() {
    if (!isUserLoggedIn()) { window.location.href = 'index.html'; return false; }
    return true;
  }

  function getPengaduan() {
    try {
      const raw = localStorage.getItem(KEY_PENGADUAN);
      if (!raw) {
        localStorage.setItem(KEY_PENGADUAN, JSON.stringify(SEED_DATA));
        localStorage.setItem(KEY_COUNTER, '5');
        return SEED_DATA;
      }
      return JSON.parse(raw);
    } catch (e) { return []; }
  }

  function savePengaduan(data) {
    try { localStorage.setItem(KEY_PENGADUAN, JSON.stringify(data)); return true; }
    catch (e) { return false; }
  }

  function getSettings() {
    try {
      const raw = localStorage.getItem(KEY_SETTINGS);
      if (!raw) {
        localStorage.setItem(KEY_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        return { ...DEFAULT_SETTINGS };
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) { return { ...DEFAULT_SETTINGS }; }
  }

  function saveSettings(settings) {
    try { localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings)); return true; }
    catch (e) { return false; }
  }

  function generateTicketId() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    let counter = parseInt(localStorage.getItem(KEY_COUNTER) || '0', 10) + 1;
    localStorage.setItem(KEY_COUNTER, String(counter));
    return `LWG-${y}${m}${d}-${String(counter).padStart(4, '0')}`;
  }

  function addPengaduan(data) {
    const list = getPengaduan();
    const ticketId = generateTicketId();
    const now = new Date().toISOString();
    const session = getUserSession();
    const baru = sanitizeObject({
      id: ticketId,
      nama: data.anonim ? 'Anonim' : (data.nama || (session && session.nama) || 'Anonim'),
      nik: data.nik || '',
      whatsapp: data.whatsapp || (session && session.whatsapp) || '',
      rt: data.rt || (session && session.rt) || '',
      rw: data.rw || (session && session.rw) || '',
      dusun: data.dusun || (session && session.dusun) || '',
      kategori: data.kategori || 'Lainnya',
      judul: data.judul || '', isi: data.isi || '', lokasi: data.lokasi || '',
      tanggalKejadian: data.tanggalKejadian || '', anonim: !!data.anonim, foto: data.foto || [],
      userId: session ? session.id : '', status: 'Baru', tanggalDibuat: now,
      riwayat: [{ status: 'Baru', waktu: now, catatan: 'Pengaduan diterima sistem' }]
    });
    list.unshift(baru); savePengaduan(list); return baru;
  }

  function findById(id) {
    return getPengaduan().find(p => p.id.toUpperCase() === String(id).toUpperCase()) || null;
  }

  function updateStatus(id, statusBaru, catatan) {
    const list = getPengaduan();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    list[idx].status = statusBaru;
    list[idx].riwayat.push({ status: statusBaru, waktu: now, catatan: catatan || `Status diubah menjadi ${statusBaru}` });
    savePengaduan(list); return list[idx];
  }

  function getStatistik() {
    const list = getPengaduan();
    return {
      total: list.length,
      baru: list.filter(p => p.status === 'Baru').length,
      diverifikasi: list.filter(p => p.status === 'Diverifikasi').length,
      diproses: list.filter(p => p.status === 'Diproses').length,
      selesai: list.filter(p => p.status === 'Selesai').length,
      ditolak: list.filter(p => p.status === 'Ditolak').length
    };
  }

  function getStatistikKategori() {
    const map = {};
    getPengaduan().forEach(p => { map[p.kategori] = (map[p.kategori] || 0) + 1; });
    return map;
  }

  function loginAdmin(username, password) {
    if (username === DEMO_ADMIN.username && password === DEMO_ADMIN.password) {
      sessionStorage.setItem(KEY_ADMIN, JSON.stringify({ loggedIn: true, username, waktu: new Date().toISOString() }));
      return true;
    }
    return false;
  }

  function logoutAdmin() { sessionStorage.removeItem(KEY_ADMIN); }

  function isAdminLoggedIn() {
    try {
      const raw = sessionStorage.getItem(KEY_ADMIN);
      if (!raw) return false;
      return !!JSON.parse(raw).loggedIn;
    } catch (e) { return false; }
  }

  function exportJSON() {
    return {
      pengaduan: getPengaduan(), settings: getSettings(),
      users: getUsers().map(u => ({ ...u, password: '***' })),
      counter: localStorage.getItem(KEY_COUNTER) || '0', exportDate: new Date().toISOString()
    };
  }

  function importJSON(data) {
    try {
      if (data.pengaduan) localStorage.setItem(KEY_PENGADUAN, JSON.stringify(data.pengaduan));
      if (data.settings) localStorage.setItem(KEY_SETTINGS, JSON.stringify(data.settings));
      if (data.counter) localStorage.setItem(KEY_COUNTER, String(data.counter));
      return true;
    } catch (e) { return false; }
  }

  function compressImage(file, maxWidth, quality) {
    maxWidth = maxWidth || 800; quality = quality || 0.7;
    return new Promise(function (resolve, reject) {
      if (!file || !file.type.startsWith('image/')) { reject(new Error('Bukan file gambar')); return; }
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          const canvas = document.createElement('canvas');
          let width = img.width, height = img.height;
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = function () { reject(new Error('Gagal memuat gambar')); };
        img.src = e.target.result;
      };
      reader.onerror = function () { reject(new Error('Gagal membaca file')); };
      reader.readAsDataURL(file);
    });
  }

  function saveDraft(draft) {
    try { localStorage.setItem('luwung_draft', JSON.stringify(draft)); return true; } catch (e) { return false; }
  }
  function getDraft() {
    try { const raw = localStorage.getItem('luwung_draft'); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function clearDraft() { localStorage.removeItem('luwung_draft'); }

  return {
    getPengaduan, savePengaduan, addPengaduan, findById, updateStatus,
    getStatistik, getStatistikKategori, getSettings, saveSettings,
    loginAdmin, logoutAdmin, isAdminLoggedIn,
    registerUser, loginUser, logoutUser, getUserSession, isUserLoggedIn, requireUserOrRedirect,
    exportJSON, importJSON, compressImage, saveDraft, getDraft, clearDraft, sanitize, DEMO_ADMIN
  };
})();
