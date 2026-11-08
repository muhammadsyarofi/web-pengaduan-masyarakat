/**
 * app.js — logika publik + landing login/daftar + shell sidebar
 */
(function () {
  'use strict';

  function showToast(pesan, tipe, durasi) {
    tipe = tipe || 'success';
    durasi = durasi || 3500;
    var container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'toast ' + tipe;
    toast.setAttribute('role', 'alert');
    toast.textContent = pesan;
    container.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity .3s';
      setTimeout(function () { toast.remove(); }, 300);
    }, durasi);
  }

  function formatTanggal(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function formatTanggalPendek(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function badgeStatus(status) {
    var map = {
      'Baru': 'badge-baru', 'Diverifikasi': 'badge-diverifikasi',
      'Diproses': 'badge-diproses', 'Selesai': 'badge-selesai', 'Ditolak': 'badge-ditolak'
    };
    return '<span class="badge ' + (map[status] || '') + '">' + status + '</span>';
  }

  function initTheme() {
    var saved = localStorage.getItem('luwung_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
  }

  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme') || 'light';
    var next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('luwung_theme', next);
    updateThemeIcon(next);
  }

  function updateThemeIcon(theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    });
  }

  function updateOnlineStatus() {
    var bar = document.getElementById('offlineBar');
    if (!bar) return;
    if (!navigator.onLine) {
      bar.classList.add('show');
      bar.textContent = 'Anda sedang offline. Formulir tetap bisa diisi sebagai draf.';
    } else bar.classList.remove('show');
  }

  /* ===== LANDING ===== */
  function initLanding() {
    initTheme();
    var tabLogin = document.getElementById('tabLogin');
    var tabDaftar = document.getElementById('tabDaftar');
    var panelLogin = document.getElementById('panelLogin');
    var panelDaftar = document.getElementById('panelDaftar');

    function showTab(name) {
      var isLogin = name === 'login';
      tabLogin.classList.toggle('active', isLogin);
      tabDaftar.classList.toggle('active', !isLogin);
      panelLogin.classList.toggle('active', isLogin);
      panelDaftar.classList.toggle('active', !isLogin);
      tabLogin.setAttribute('aria-selected', isLogin ? 'true' : 'false');
      tabDaftar.setAttribute('aria-selected', isLogin ? 'false' : 'true');
    }
    tabLogin.addEventListener('click', function () { showTab('login'); });
    tabDaftar.addEventListener('click', function () { showTab('daftar'); });

    document.getElementById('formLoginWarga').addEventListener('submit', function (e) {
      e.preventDefault();
      var u = document.getElementById('loginUsername').value;
      var p = document.getElementById('loginPassword').value;
      if (Storage.loginUser(u, p)) {
        showToast('Login berhasil. Selamat datang!', 'success');
        setTimeout(function () { window.location.href = 'beranda.html'; }, 400);
      } else {
        showToast('Username atau password salah.', 'error');
      }
    });

    document.getElementById('formDaftar').addEventListener('submit', function (e) {
      e.preventDefault();
      var result = Storage.registerUser({
        nama: document.getElementById('regNama').value,
        username: document.getElementById('regUsername').value,
        whatsapp: document.getElementById('regWhatsapp').value,
        rt: document.getElementById('regRt').value,
        rw: document.getElementById('regRw').value,
        dusun: document.getElementById('regDusun').value,
        password: document.getElementById('regPassword').value,
        password2: document.getElementById('regPassword2').value
      });
      if (!result.ok) {
        showToast(result.msg, 'error');
        return;
      }
      showToast('Akun berhasil dibuat. Silakan masuk.', 'success');
      document.getElementById('formDaftar').reset();
      showTab('login');
      document.getElementById('loginUsername').value = result.user.username;
    });
  }

  /* ===== APP SHELL (sidebar kiri) ===== */
  function initAppShell() {
    initTheme();
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', toggleTheme);
    });

    var session = Storage.getUserSession();
    var info = document.getElementById('sidebarUserInfo');
    if (info && session) {
      info.innerHTML = '<strong>' + Storage.sanitize(session.nama) + '</strong><br><span style="opacity:.85">@' +
        Storage.sanitize(session.username) + '</span>';
    }
    var welcome = document.getElementById('welcomeText');
    if (welcome && session) {
      welcome.textContent = 'Halo, ' + session.nama + '. Sampaikan pengaduan Anda kepada Pemerintah Desa Luwung.';
    }

    var sidebar = document.getElementById('appSidebar');
    var overlay = document.getElementById('sidebarOverlay');
    document.getElementById('btnToggleMenu') && document.getElementById('btnToggleMenu').addEventListener('click', function () {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    });
    overlay && overlay.addEventListener('click', function () {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });

    document.getElementById('btnLogoutWarga') && document.getElementById('btnLogoutWarga').addEventListener('click', function (e) {
      e.preventDefault();
      Storage.logoutUser();
      window.location.href = 'index.html';
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    }
  }

  function renderBeranda() {
    var stats = Storage.getStatistik();
    var el;
    if ((el = document.getElementById('statTotal'))) el.textContent = stats.total;
    if ((el = document.getElementById('statBaru'))) el.textContent = stats.baru;
    if ((el = document.getElementById('statProses'))) el.textContent = stats.diproses + stats.diverifikasi;
    if ((el = document.getElementById('statSelesai'))) el.textContent = stats.selesai;
  }

  var fotoFiles = [];

  function initFormPengaduan() {
    var form = document.getElementById('formPengaduan');
    if (!form) return;

    var selectKat = document.getElementById('kategori');
    if (selectKat) {
      var settings = Storage.getSettings();
      selectKat.innerHTML = '<option value="">-- Pilih Kategori --</option>';
      settings.kategori.forEach(function (k) {
        selectKat.innerHTML += '<option value="' + Storage.sanitize(k) + '">' + Storage.sanitize(k) + '</option>';
      });
    }

    var session = Storage.getUserSession();
    if (session) {
      var n = document.getElementById('nama'); if (n) n.value = session.nama || '';
      var w = document.getElementById('whatsapp'); if (w) w.value = session.whatsapp || '';
      var rt = document.getElementById('rt'); if (rt) rt.value = session.rt || '';
      var rw = document.getElementById('rw'); if (rw) rw.value = session.rw || '';
      var du = document.getElementById('dusun'); if (du) du.value = session.dusun || '';
    }

    var draft = Storage.getDraft();
    if (draft && confirm('Ditemukan draf pengaduan. Muat draf tersebut?')) loadDraft(draft);
    else if (draft) Storage.clearDraft();

    var checkAnonim = document.getElementById('anonim');
    var namaGroup = document.getElementById('namaGroup');
    if (checkAnonim && namaGroup) {
      checkAnonim.addEventListener('change', function () {
        var namaInput = document.getElementById('nama');
        if (checkAnonim.checked) {
          namaGroup.style.opacity = '0.5';
          if (namaInput) namaInput.disabled = true;
        } else {
          namaGroup.style.opacity = '1';
          if (namaInput) namaInput.disabled = false;
        }
      });
    }

    var uploadArea = document.getElementById('uploadArea');
    var fileInput = document.getElementById('fotoInput');
    if (uploadArea && fileInput) {
      uploadArea.addEventListener('click', function () { fileInput.click(); });
      uploadArea.addEventListener('dragover', function (e) { e.preventDefault(); uploadArea.classList.add('dragover'); });
      uploadArea.addEventListener('dragleave', function () { uploadArea.classList.remove('dragover'); });
      uploadArea.addEventListener('drop', function (e) {
        e.preventDefault(); uploadArea.classList.remove('dragover'); handleFiles(e.dataTransfer.files);
      });
      fileInput.addEventListener('change', function () { handleFiles(fileInput.files); });
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validateForm()) return;
      var btn = form.querySelector('[type="submit"]');
      var originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="loading"></span> Mengirim...';
      try {
        var data = {
          nama: (document.getElementById('nama') || {}).value || '',
          nik: (document.getElementById('nik') || {}).value || '',
          whatsapp: (document.getElementById('whatsapp') || {}).value || '',
          rt: (document.getElementById('rt') || {}).value || '',
          rw: (document.getElementById('rw') || {}).value || '',
          dusun: (document.getElementById('dusun') || {}).value || '',
          kategori: (document.getElementById('kategori') || {}).value || '',
          judul: (document.getElementById('judul') || {}).value || '',
          isi: (document.getElementById('isi') || {}).value || '',
          lokasi: (document.getElementById('lokasi') || {}).value || '',
          tanggalKejadian: (document.getElementById('tanggalKejadian') || {}).value || '',
          anonim: !!(document.getElementById('anonim') || {}).checked,
          foto: fotoFiles.slice(0, 3)
        };
        if (!navigator.onLine) {
          Storage.saveDraft(data);
          showToast('Offline. Disimpan sebagai draf.', 'warning');
          btn.disabled = false; btn.innerHTML = originalText; return;
        }
        var hasil = Storage.addPengaduan(data);
        Storage.clearDraft();
        showHasilTiket(hasil);
        form.reset(); fotoFiles = []; renderPreviewFotos();
        showToast('Pengaduan berhasil dikirim!', 'success');
        renderBeranda();
      } catch (err) {
        showToast('Gagal mengirim. Coba lagi.', 'error');
      } finally {
        btn.disabled = false; btn.innerHTML = originalText;
      }
    });
  }

  function loadDraft(draft) {
    if (!draft) return;
    ['nama','nik','whatsapp','rt','rw','dusun','kategori','judul','isi','lokasi','tanggalKejadian'].forEach(function (f) {
      var el = document.getElementById(f);
      if (el && draft[f] !== undefined) el.value = draft[f];
    });
    if (draft.anonim) {
      var cb = document.getElementById('anonim');
      if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change')); }
    }
    if (draft.foto && draft.foto.length) { fotoFiles = draft.foto.slice(0, 3); renderPreviewFotos(); }
  }

  async function handleFiles(files) {
    var sisa = 3 - fotoFiles.length;
    if (sisa <= 0) { showToast('Maksimal 3 foto.', 'warning'); return; }
    var arr = Array.from(files).slice(0, sisa);
    for (var i = 0; i < arr.length; i++) {
      var file = arr[i];
      if (!file.type.startsWith('image/')) { showToast('Hanya file gambar.', 'error'); continue; }
      if (file.size > 5 * 1024 * 1024) { showToast('Maks. 5 MB per foto.', 'error'); continue; }
      try { fotoFiles.push(await Storage.compressImage(file)); }
      catch (e) { showToast('Gagal memproses foto.', 'error'); }
    }
    renderPreviewFotos();
  }

  function renderPreviewFotos() {
    var container = document.getElementById('previewFotos');
    if (!container) return;
    container.innerHTML = '';
    fotoFiles.forEach(function (src, i) {
      var div = document.createElement('div');
      div.className = 'preview-item';
      div.innerHTML = '<img src="' + src + '" alt="Foto ' + (i + 1) + '"><button type="button" class="btn-remove" data-idx="' + i + '">×</button>';
      container.appendChild(div);
    });
    container.querySelectorAll('.btn-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        fotoFiles.splice(parseInt(btn.dataset.idx, 10), 1);
        renderPreviewFotos();
      });
    });
  }

  function validateForm() {
    var valid = true;
    var required = [
      { id: 'whatsapp', msg: 'Nomor WhatsApp wajib diisi.' },
      { id: 'kategori', msg: 'Silakan pilih kategori.' },
      { id: 'judul', msg: 'Judul wajib diisi.' },
      { id: 'isi', msg: 'Isi pengaduan wajib diisi.' }
    ];
    required.forEach(function (r) {
      var el = document.getElementById(r.id);
      if (!el) return;
      var group = el.closest('.form-group');
      if (!el.value.trim()) {
        el.classList.add('is-invalid');
        if (group) { group.classList.add('has-error'); var err = group.querySelector('.error-msg'); if (err) err.textContent = r.msg; }
        valid = false;
      } else {
        el.classList.remove('is-invalid');
        if (group) group.classList.remove('has-error');
      }
    });
    if (!valid) showToast('Lengkapi data yang wajib diisi.', 'error');
    return valid;
  }

  function showHasilTiket(hasil) {
    var formSection = document.getElementById('formSection');
    var resultSection = document.getElementById('resultSection');
    if (formSection) formSection.style.display = 'none';
    if (resultSection) {
      resultSection.style.display = 'block';
      var codeEl = document.getElementById('ticketCode');
      if (codeEl) codeEl.textContent = hasil.id;
      resultSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function initCopyTicket() {
    var btn = document.getElementById('btnCopyTicket');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var code = (document.getElementById('ticketCode') || {}).textContent;
      if (!code) return;
      navigator.clipboard.writeText(code).then(function () {
        showToast('Kode tiket disalin!', 'success');
      }).catch(function () { showToast('Salin manual: ' + code, 'warning'); });
    });
  }

  function initLacak() {
    var form = document.getElementById('formLacak');
    if (!form) return;
    var params = new URLSearchParams(window.location.search);
    var kode = params.get('kode');
    if (kode) {
      document.getElementById('kodeTiket').value = kode;
      cariPengaduan(kode);
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var kodeInput = (document.getElementById('kodeTiket') || {}).value.trim();
      if (!kodeInput) { showToast('Masukkan kode tiket.', 'error'); return; }
      cariPengaduan(kodeInput);
    });
  }

  function cariPengaduan(kode) {
    var hasil = Storage.findById(kode);
    var container = document.getElementById('hasilLacak');
    if (!container) return;
    if (!hasil) {
      container.innerHTML = '<div class="empty-state"><p>Pengaduan dengan kode <strong>' +
        Storage.sanitize(kode) + '</strong> tidak ditemukan.</p></div>';
      return;
    }
    var timelineHtml = '';
    (hasil.riwayat || []).forEach(function (r) {
      timelineHtml += '<div class="timeline-item"><div class="timeline-time">' + formatTanggal(r.waktu) +
        '</div><div class="timeline-status">' + Storage.sanitize(r.status) +
        '</div><div class="timeline-catatan">' + Storage.sanitize(r.catatan || '') + '</div></div>';
    });
    container.innerHTML = '<div class="card"><div class="list-item-header"><div><div class="list-item-title">' +
      Storage.sanitize(hasil.judul) + '</div><div class="list-item-meta" style="margin-top:6px;"><span>Kode: <strong>' +
      Storage.sanitize(hasil.id) + '</strong></span></div></div>' + badgeStatus(hasil.status) +
      '</div><p style="margin:12px 0;"><strong>Kategori:</strong> ' + Storage.sanitize(hasil.kategori) +
      '</p><p><strong>Isi:</strong> ' + Storage.sanitize(hasil.isi) + '</p>' +
      (hasil.lokasi ? '<p><strong>Lokasi:</strong> ' + Storage.sanitize(hasil.lokasi) + '</p>' : '') +
      '<h3 style="margin-top:20px;">Riwayat Tanggapan</h3><div class="timeline">' + timelineHtml + '</div></div>';
  }

  function initDaftarPublik() {
    var container = document.getElementById('daftarPublik');
    if (!container) return;
    var filterKat = document.getElementById('filterKategori');
    var filterStatus = document.getElementById('filterStatus');
    if (filterKat) {
      Storage.getSettings().kategori.forEach(function (k) {
        filterKat.innerHTML += '<option value="' + Storage.sanitize(k) + '">' + Storage.sanitize(k) + '</option>';
      });
    }
    function renderList() {
      var list = Storage.getPengaduan();
      var kat = (filterKat && filterKat.value) || '';
      var st = (filterStatus && filterStatus.value) || '';
      if (kat) list = list.filter(function (p) { return p.kategori === kat; });
      if (st) list = list.filter(function (p) { return p.status === st; });
      if (!list.length) {
        container.innerHTML = '<div class="empty-state"><p>Belum ada pengaduan sesuai filter.</p></div>';
        return;
      }
      container.innerHTML = list.map(function (p) {
        return '<div class="list-item"><div class="list-item-header"><div class="list-item-title">' +
          Storage.sanitize(p.judul) + '</div>' + badgeStatus(p.status) +
          '</div><div class="list-item-meta"><span>' + Storage.sanitize(p.kategori) +
          '</span><span>•</span><span>' + formatTanggalPendek(p.tanggalDibuat) + '</span></div></div>';
      }).join('');
    }
    if (filterKat) filterKat.addEventListener('change', renderList);
    if (filterStatus) filterStatus.addEventListener('change', renderList);
    renderList();
  }

  function renderProfil() {
    var settings = Storage.getSettings();
    var el = document.getElementById('profilContent');
    if (!el) return;
    var wa = settings.whatsapp ? 'https://wa.me/' + settings.whatsapp.replace(/\D/g, '') : '#';
    el.innerHTML = '<div class="card"><img class="profil-photo" src="images/image.png" alt="Balai Desa Luwung" loading="lazy">' +
      '<h2 class="card-title">📍 Kantor Desa Luwung</h2>' +
      '<p><strong>Alamat:</strong><br>' + Storage.sanitize(settings.alamatKantor) + '</p>' +
      '<p><strong>Jam Pelayanan:</strong><br>' + Storage.sanitize(settings.jamPelayanan) + '</p>' +
      '<p><strong>Kepala Desa:</strong> ' + Storage.sanitize(settings.namaKepalaDesa) + '</p>' +
      '<a href="' + wa + '" class="btn btn-primary btn-block" target="_blank" rel="noopener" style="margin-top:16px;">💬 Hubungi via WhatsApp</a></div>';
  }

  window.LuwungApp = {
    showToast: showToast,
    toggleTheme: toggleTheme,
    initLanding: initLanding,
    initAppShell: initAppShell,
    renderBeranda: renderBeranda,
    initFormPengaduan: initFormPengaduan,
    initCopyTicket: initCopyTicket,
    initLacak: initLacak,
    initDaftarPublik: initDaftarPublik,
    renderProfil: renderProfil
  };
})();
