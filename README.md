# Platform Pengaduan Masyarakat Desa Luwung

Satu kode untuk **Web, Desktop, dan Mobile**.

## Halaman
| File | Fungsi |
|---|---|
| `index.html` | Masuk / Daftar akun warga |
| `beranda.html` | Beranda (hero, statistik, cara pengaduan, kategori, galeri) |
| `pengaduan.html` | Formulir pengaduan |
| `lacak.html` | Cek status dengan kode tiket |
| `daftar.html` | Daftar pengaduan publik |
| `profil.html` | Profil desa & kontak |
| `admin.html` | Panel perangkat desa (terpisah) |

## Akun demo
- Warga: `warga` / `warga123`
- Admin: `admin` / `luwung2026` (halaman admin.html)

## Menjalankan (Windows)
```
cd folder-yang-berisi-index.html
python -m http.server 8080 --bind 127.0.0.1
```
Buka: http://127.0.0.1:8080  (jangan buka http://[::]:8080)

## Cara pakai di tiap platform
- **Web**: buka di browser apa pun.
- **Desktop (Windows/Mac/Linux)**: buka di Chrome atau Edge, klik tombol **Pasang Aplikasi** di menu kiri
  (atau ikon pasang di address bar). Aplikasi tampil di jendela sendiri dan punya ikon di desktop.
- **Mobile**:
  - Android (Chrome): ketuk **Pasang Aplikasi**, atau menu ⋮ > *Pasang aplikasi*.
  - iPhone/iPad (Safari): ketuk **Bagikan** > *Tambah ke Layar Utama*.
  - Di layar HP menu utama muncul sebagai navigasi di bagian bawah.

## Catatan penting
- Fitur pasang aplikasi dan mode offline hanya jalan lewat **HTTPS** atau `localhost`.
  Saat dipasang di hosting, pastikan alamatnya `https://...`.
- Setelah mengubah file, naikkan angka versi `CACHE_NAME` di `sw.js` supaya perangkat memuat versi baru.
