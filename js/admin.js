/**
 * admin.js
 * Logika halaman admin / perangkat desa
 * CATATAN: Login ini hanya demo client-side. BUKAN keamanan produksi!
 */

(function () {
  'use strict';

  const PER_PAGE = 10;
  let currentPage = 1;
  let currentFilters = { q: '', kategori: '', status: '', rt: '' };
  let sortField = 'tanggalDibuat';
  let sortDir = 'desc';

  function showToast(pesan, tipe = 'success') {
    if (window.LuwungApp && window.LuwungApp.showToast) {
      window.LuwungApp.showToast(pesan, tipe);
    } else {
      alert(pesan);
    }
  }

  function formatTanggal(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function badgeStatus(status) {
    const map = {
      'Baru': 'badge-baru',
      'Diverifikasi': 'badge-diverifikasi',
      'Diproses': 'badge-diproses',
      'Selesai': 'badge-selesai',
      'Ditolak': 'badge-ditolak'
    };
    return `<span class="badge ${map[status] || ''}">${status}</span>`;
  }

  // ========== LOGIN ==========
  function initLogin() {
    const form = document.getElementById('formLogin');
    if (!form) return;

    // Jika sudah login, redirect
    if (Storage.isAdminLoggedIn()) {
      window.location.href = 'admin.html#dashboard';
      return;
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const user = document.getElementById('username')?.value.trim();
      const pass = document.getElementById('password')?.value;

      if (Storage.loginAdmin(user, pass)) {
        showToast('Login berhasil!', 'success');
        setTimeout(() => {
          window.location.href = 'admin.html#dashboard';
          location.reload();
        }, 500);
      } else {
        showToast('Username atau password salah.', 'error');
      }
    });
  }

  // ========== GUARD ==========
  function requireLogin() {
    if (!Storage.isAdminLoggedIn()) {
      document.getElementById('adminApp')?.classList.add('hidden');
      document.getElementById('loginSection')?.classList.remove('hidden');
      initLogin();
      return false;
    }
    document.getElementById('loginSection')?.classList.add('hidden');
    document.getElementById('adminApp')?.classList.remove('hidden');
    return true;
  }

  // ========== NAVIGASI ==========
  function initNav() {
    const links = document.querySelectorAll('[data-section]');
    links.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const section = link.dataset.section;
        showSection(section);
        // Tutup sidebar mobile
        document.getElementById('adminSidebar')?.classList.remove('open');
        document.getElementById('sidebarOverlay')?.classList.remove('show');
      });
    });

    // Toggle sidebar
    document.getElementById('btnToggleSidebar')?.addEventListener('click', () => {
      document.getElementById('adminSidebar')?.classList.toggle('open');
      document.getElementById('sidebarOverlay')?.classList.toggle('show');
    });
    document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
      document.getElementById('adminSidebar')?.classList.remove('open');
      document.getElementById('sidebarOverlay')?.classList.remove('show');
    });

    // Logout
    document.getElementById('btnLogout')?.addEventListener('click', () => {
      Storage.logoutAdmin();
      window.location.reload();
    });

    // Hash routing sederhana
    window.addEventListener('hashchange', () => {
      const hash = location.hash.replace('#', '') || 'dashboard';
      showSection(hash);
    });
    const initial = location.hash.replace('#', '') || 'dashboard';
    showSection(initial);
  }

  function showSection(name) {
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    const target = document.getElementById('section-' + name);
    if (target) target.style.display = 'block';

    document.querySelectorAll('[data-section]').forEach(a => {
      a.classList.toggle('active', a.dataset.section === name);
    });

    // Update title
    const titles = {
      dashboard: 'Dashboard',
      pengaduan: 'Daftar Pengaduan',
      pengaturan: 'Pengaturan',
      backup: 'Backup & Restore'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[name] || 'Admin';

    if (name === 'dashboard') renderDashboard();
    if (name === 'pengaduan') renderTabel();
    if (name === 'pengaturan') renderPengaturan();
  }

  // ========== DASHBOARD ==========
  function renderDashboard() {
    const stats = Storage.getStatistik();
    const el = document.getElementById('dashStats');
    if (el) {
      el.innerHTML = `
        <div class="stat-card"><div class="stat-number">${stats.total}</div><div class="stat-label">Total</div></div>
        <div class="stat-card baru"><div class="stat-number">${stats.baru}</div><div class="stat-label">Baru</div></div>
        <div class="stat-card diproses"><div class="stat-number">${stats.diverifikasi + stats.diproses}</div><div class="stat-label">Diproses</div></div>
        <div class="stat-card selesai"><div class="stat-number">${stats.selesai}</div><div class="stat-label">Selesai</div></div>
      `;
    }

    // Grafik status (canvas sederhana)
    drawStatusChart(stats);
    drawKategoriChart();

    // Pengaduan terbaru
    const list = Storage.getPengaduan().slice(0, 5);
    const recent = document.getElementById('pengaduanTerbaru');
    if (recent) {
      if (list.length === 0) {
        recent.innerHTML = '<p class="empty-state">Belum ada pengaduan.</p>';
      } else {
        recent.innerHTML = list.map(p => `
          <div class="list-item" style="cursor:pointer;" data-id="${p.id}">
            <div class="list-item-header">
              <div class="list-item-title">${Storage.sanitize(p.judul)}</div>
              ${badgeStatus(p.status)}
            </div>
            <div class="list-item-meta">
              <span>${Storage.sanitize(p.kategori)}</span>
              <span>•</span>
              <span>${formatTanggal(p.tanggalDibuat)}</span>
            </div>
          </div>
        `).join('');
        recent.querySelectorAll('[data-id]').forEach(item => {
          item.addEventListener('click', () => openDetail(item.dataset.id));
        });
      }
    }
  }

  function drawStatusChart(stats) {
    const canvas = document.getElementById('chartStatus');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 300;
    const h = canvas.height = 200;
    ctx.clearRect(0, 0, w, h);

    const data = [
      { label: 'Baru', value: stats.baru, color: '#1565c0' },
      { label: 'Diverifikasi', value: stats.diverifikasi, color: '#ef6c00' },
      { label: 'Diproses', value: stats.diproses, color: '#f9a825' },
      { label: 'Selesai', value: stats.selesai, color: '#2e7d32' },
      { label: 'Ditolak', value: stats.ditolak, color: '#c62828' }
    ].filter(d => d.value > 0);

    if (data.length === 0) {
      ctx.fillStyle = '#999';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Belum ada data', w / 2, h / 2);
      return;
    }

    const total = data.reduce((s, d) => s + d.value, 0);
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 30;
    let start = -Math.PI / 2;

    data.forEach(d => {
      const angle = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.closePath();
      ctx.fillStyle = d.color;
      ctx.fill();
      start += angle;
    });

    // Legend
    let lx = 10, ly = h - 10;
    ctx.font = '11px sans-serif';
    data.forEach(d => {
      ctx.fillStyle = d.color;
      ctx.fillRect(lx, ly - 8, 12, 12);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--teks') || '#333';
      ctx.fillText(`${d.label} (${d.value})`, lx + 16, ly);
      lx += ctx.measureText(`${d.label} (${d.value})`).width + 30;
      if (lx > w - 80) { lx = 10; ly -= 16; }
    });
  }

  function drawKategoriChart() {
    const canvas = document.getElementById('chartKategori');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const map = Storage.getStatistikKategori();
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const w = canvas.width = canvas.parentElement.clientWidth || 300;
    const h = canvas.height = 220;
    ctx.clearRect(0, 0, w, h);

    if (entries.length === 0) {
      ctx.fillStyle = '#999';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Belum ada data', w / 2, h / 2);
      return;
    }

    const max = Math.max(...entries.map(e => e[1]));
    const barH = 24;
    const gap = 10;
    const left = 120;
    const barMaxW = w - left - 40;

    entries.forEach((e, i) => {
      const y = 20 + i * (barH + gap);
      const bw = (e[1] / max) * barMaxW;
      // Label
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--teks') || '#333';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      const label = e[0].length > 18 ? e[0].slice(0, 16) + '…' : e[0];
      ctx.fillText(label, left - 8, y + barH / 2 + 4);
      // Bar
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(left, y, bw, barH);
      // Value
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      if (bw > 20) {
        ctx.fillText(String(e[1]), left + 6, y + barH / 2 + 4);
      } else {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--teks') || '#333';
        ctx.fillText(String(e[1]), left + bw + 6, y + barH / 2 + 4);
      }
    });
  }

  // ========== TABEL PENGADUAN ==========
  function renderTabel() {
    let list = Storage.getPengaduan();

    // Filter
    if (currentFilters.q) {
      const q = currentFilters.q.toLowerCase();
      list = list.filter(p =>
        p.id.toLowerCase().includes(q) ||
        p.judul.toLowerCase().includes(q) ||
        (p.nama && p.nama.toLowerCase().includes(q)) ||
        (p.dusun && p.dusun.toLowerCase().includes(q))
      );
    }
    if (currentFilters.kategori) list = list.filter(p => p.kategori === currentFilters.kategori);
    if (currentFilters.status) list = list.filter(p => p.status === currentFilters.status);
    if (currentFilters.rt) list = list.filter(p => p.rt === currentFilters.rt);

    // Sort
    list.sort((a, b) => {
      let va = a[sortField] || '';
      let vb = b[sortField] || '';
      if (sortField === 'tanggalDibuat') {
        va = new Date(va).getTime();
        vb = new Date(vb).getTime();
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * PER_PAGE;
    const pageData = list.slice(start, start + PER_PAGE);

    const tbody = document.getElementById('tabelBody');
    if (!tbody) return;

    if (pageData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;">Tidak ada data.</td></tr>`;
    } else {
      tbody.innerHTML = pageData.map(p => `
        <tr>
          <td><code>${Storage.sanitize(p.id)}</code></td>
          <td>${Storage.sanitize(p.judul)}</td>
          <td>${Storage.sanitize(p.kategori).slice(0, 25)}${p.kategori.length > 25 ? '…' : ''}</td>
          <td>${badgeStatus(p.status)}</td>
          <td>RT ${Storage.sanitize(p.rt)}/${Storage.sanitize(p.rw)}</td>
          <td>${formatTanggal(p.tanggalDibuat)}</td>
          <td>
            <button class="btn btn-sm btn-primary" data-detail="${p.id}">Detail</button>
          </td>
        </tr>
      `).join('');
      tbody.querySelectorAll('[data-detail]').forEach(btn => {
        btn.addEventListener('click', () => openDetail(btn.dataset.detail));
      });
    }

    // Pagination
    const pag = document.getElementById('pagination');
    if (pag) {
      let html = '';
      for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
      }
      pag.innerHTML = html;
      pag.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
          currentPage = parseInt(btn.dataset.page, 10);
          renderTabel();
        });
      });
    }

    // Info
    const info = document.getElementById('tabelInfo');
    if (info) info.textContent = `Menampilkan ${start + 1}–${Math.min(start + PER_PAGE, total)} dari ${total} pengaduan`;
  }

  function initFilterTabel() {
    const q = document.getElementById('filterQ');
    const kat = document.getElementById('filterKatAdmin');
    const st = document.getElementById('filterStatusAdmin');
    const rt = document.getElementById('filterRT');

    // Isi kategori
    if (kat) {
      const settings = Storage.getSettings();
      settings.kategori.forEach(k => {
        kat.innerHTML += `<option value="${Storage.sanitize(k)}">${Storage.sanitize(k)}</option>`;
      });
    }

    const apply = () => {
      currentFilters.q = q?.value.trim() || '';
      currentFilters.kategori = kat?.value || '';
      currentFilters.status = st?.value || '';
      currentFilters.rt = rt?.value.trim() || '';
      currentPage = 1;
      renderTabel();
    };

    q?.addEventListener('input', debounce(apply, 300));
    kat?.addEventListener('change', apply);
    st?.addEventListener('change', apply);
    rt?.addEventListener('input', debounce(apply, 300));
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  // ========== DETAIL & UPDATE ==========
  function openDetail(id) {
    const p = Storage.findById(id);
    if (!p) {
      showToast('Pengaduan tidak ditemukan.', 'error');
      return;
    }

    const modal = document.getElementById('modalDetail');
    const body = document.getElementById('modalBody');
    if (!modal || !body) return;

    let fotoHtml = '';
    if (p.foto && p.foto.length) {
      fotoHtml = '<div class="foto-grid">' +
        p.foto.map((f, i) => `<img src="${f}" alt="Bukti ${i + 1}" onclick="window.open(this.src)">`).join('') +
        '</div>';
    }

    let timelineHtml = (p.riwayat || []).map(r => `
      <div class="timeline-item">
        <div class="timeline-time">${formatTanggal(r.waktu)}</div>
        <div class="timeline-status">${Storage.sanitize(r.status)}</div>
        <div class="timeline-catatan">${Storage.sanitize(r.catatan || '')}</div>
      </div>
    `).join('');

    body.innerHTML = `
      <p><strong>Kode:</strong> ${Storage.sanitize(p.id)}</p>
      <p><strong>Status:</strong> ${badgeStatus(p.status)}</p>
      <p><strong>Judul:</strong> ${Storage.sanitize(p.judul)}</p>
      <p><strong>Kategori:</strong> ${Storage.sanitize(p.kategori)}</p>
      <p><strong>Isi:</strong><br>${Storage.sanitize(p.isi)}</p>
      <p><strong>Lokasi:</strong> ${Storage.sanitize(p.lokasi || '-')}</p>
      <p><strong>Tanggal Kejadian:</strong> ${Storage.sanitize(p.tanggalKejadian || '-')}</p>
      <hr style="margin:16px 0;border:none;border-top:1px solid var(--border);">
      <p><strong>Pelapor:</strong> ${p.anonim ? 'Anonim' : Storage.sanitize(p.nama)}</p>
      <p><strong>NIK:</strong> ${Storage.sanitize(p.nik || '-')}</p>
      <p><strong>WhatsApp:</strong> ${Storage.sanitize(p.whatsapp || '-')}</p>
      <p><strong>RT/RW:</strong> ${Storage.sanitize(p.rt)}/${Storage.sanitize(p.rw)} — ${Storage.sanitize(p.dusun || '')}</p>
      <p><strong>Dikirim:</strong> ${formatTanggal(p.tanggalDibuat)}</p>
      ${fotoHtml ? '<h4 style="margin-top:12px;">Foto Bukti</h4>' + fotoHtml : ''}
      <h4 style="margin-top:16px;">Riwayat</h4>
      <div class="timeline">${timelineHtml}</div>
      <hr style="margin:16px 0;border:none;border-top:1px solid var(--border);">
      <div class="form-group">
        <label for="ubahStatus">Ubah Status</label>
        <select id="ubahStatus" class="form-control">
          <option value="Baru" ${p.status === 'Baru' ? 'selected' : ''}>Baru</option>
          <option value="Diverifikasi" ${p.status === 'Diverifikasi' ? 'selected' : ''}>Diverifikasi</option>
          <option value="Diproses" ${p.status === 'Diproses' ? 'selected' : ''}>Diproses</option>
          <option value="Selesai" ${p.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
          <option value="Ditolak" ${p.status === 'Ditolak' ? 'selected' : ''}>Ditolak</option>
        </select>
      </div>
      <div class="form-group">
        <label for="catatanStatus">Catatan / Tanggapan</label>
        <textarea id="catatanStatus" class="form-control" rows="3" placeholder="Tulis tanggapan untuk warga..."></textarea>
      </div>
    `;

    modal.classList.add('show');
    modal.dataset.id = id;

    document.getElementById('btnSimpanStatus')?.addEventListener('click', simpanStatus, { once: true });
  }

  function simpanStatus() {
    const modal = document.getElementById('modalDetail');
    const id = modal?.dataset.id;
    if (!id) return;
    const status = document.getElementById('ubahStatus')?.value;
    const catatan = document.getElementById('catatanStatus')?.value.trim();

    if (!status) return;
    Storage.updateStatus(id, status, catatan || `Status diubah menjadi ${status}`);
    showToast('Status berhasil diperbarui.', 'success');
    closeModal();
    renderTabel();
    renderDashboard();
  }

  function closeModal() {
    document.getElementById('modalDetail')?.classList.remove('show');
  }

  // ========== EKSPOR CSV ==========
  function exportCSV() {
    const list = Storage.getPengaduan();
    const headers = ['ID', 'Tanggal', 'Nama', 'Anonim', 'WhatsApp', 'RT', 'RW', 'Dusun', 'Kategori', 'Judul', 'Isi', 'Lokasi', 'Status'];
    const rows = list.map(p => [
      p.id,
      p.tanggalDibuat,
      p.nama,
      p.anonim ? 'Ya' : 'Tidak',
      p.whatsapp,
      p.rt,
      p.rw,
      p.dusun,
      p.kategori,
      `"${(p.judul || '').replace(/"/g, '""')}"`,
      `"${(p.isi || '').replace(/"/g, '""')}"`,
      p.lokasi,
      p.status
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pengaduan-luwung-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV berhasil diunduh.', 'success');
  }

  // ========== BACKUP / RESTORE ==========
  function initBackup() {
    document.getElementById('btnExportJSON')?.addEventListener('click', () => {
      const data = Storage.exportJSON();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-luwung-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup JSON berhasil diunduh.', 'success');
    });

    document.getElementById('btnImportJSON')?.addEventListener('click', () => {
      document.getElementById('importFile')?.click();
    });

    document.getElementById('importFile')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          if (confirm('Import akan menimpa data saat ini. Lanjutkan?')) {
            if (Storage.importJSON(data)) {
              showToast('Data berhasil diimpor.', 'success');
              renderDashboard();
              renderTabel();
            } else {
              showToast('Gagal mengimpor data.', 'error');
            }
          }
        } catch (err) {
          showToast('File JSON tidak valid.', 'error');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('btnPrint')?.addEventListener('click', () => {
      window.print();
    });
  }

  // ========== PENGATURAN ==========
  function renderPengaturan() {
    const s = Storage.getSettings();
    const fields = ['namaKepalaDesa', 'alamatKantor', 'jamPelayanan', 'telepon', 'whatsapp', 'email'];
    fields.forEach(f => {
      const el = document.getElementById('set_' + f);
      if (el) el.value = s[f] || '';
    });

    const katList = document.getElementById('daftarKategori');
    if (katList) {
      katList.innerHTML = (s.kategori || []).map((k, i) => `
        <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
          <input type="text" class="form-control" value="${Storage.sanitize(k)}" data-kat-idx="${i}">
          <button type="button" class="btn btn-sm btn-danger" data-hapus-kat="${i}">Hapus</button>
        </div>
      `).join('');
      katList.querySelectorAll('[data-hapus-kat]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.hapusKat, 10);
          s.kategori.splice(idx, 1);
          Storage.saveSettings(s);
          renderPengaturan();
        });
      });
    }
  }

  function initPengaturan() {
    document.getElementById('formPengaturan')?.addEventListener('submit', e => {
      e.preventDefault();
      const s = Storage.getSettings();
      s.namaKepalaDesa = document.getElementById('set_namaKepalaDesa')?.value.trim() || '';
      s.alamatKantor = document.getElementById('set_alamatKantor')?.value.trim() || '';
      s.jamPelayanan = document.getElementById('set_jamPelayanan')?.value.trim() || '';
      s.telepon = document.getElementById('set_telepon')?.value.trim() || '';
      s.whatsapp = document.getElementById('set_whatsapp')?.value.trim() || '';
      s.email = document.getElementById('set_email')?.value.trim() || '';

      // Ambil kategori dari input
      const inputs = document.querySelectorAll('[data-kat-idx]');
      s.kategori = Array.from(inputs).map(i => i.value.trim()).filter(Boolean);

      Storage.saveSettings(s);
      showToast('Pengaturan disimpan.', 'success');
    });

    document.getElementById('btnTambahKategori')?.addEventListener('click', () => {
      const s = Storage.getSettings();
      s.kategori.push('Kategori Baru');
      Storage.saveSettings(s);
      renderPengaturan();
    });
  }

  // ========== INIT ==========
  document.addEventListener('DOMContentLoaded', () => {
    // Theme
    const saved = localStorage.getItem('luwung_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);

    if (!requireLogin()) return;

    initNav();
    initFilterTabel();
    initBackup();
    initPengaturan();

    document.getElementById('btnExportCSV')?.addEventListener('click', exportCSV);
    document.getElementById('btnCloseModal')?.addEventListener('click', closeModal);
    document.getElementById('modalDetail')?.addEventListener('click', e => {
      if (e.target.id === 'modalDetail') closeModal();
    });

    // Theme toggle
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('luwung_theme', next);
        btn.textContent = next === 'dark' ? '☀️' : '🌙';
      });
    });
  });
})();
