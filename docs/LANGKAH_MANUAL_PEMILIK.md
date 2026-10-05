# Yang Perlu Dilakukan Secara Manual

1. **Gabungkan perubahan ke `main`** (buat dan merge Pull Request dari branch `claude/zen-darwin-w6po3f`). GitHub Pages dan tautan unduh `.../raw/main/KSDAS_ITDel.exe` hanya menampilkan versi baru setelah ada di `main`.
2. **Pastikan GitHub Pages aktif**: Settings > Pages > Source: Deploy from a branch > `main` / root. Tunggu 1 sampai 2 menit lalu buka `https://samuelhtampubolon.github.io/ksdas-itdel/`. Tekan Ctrl+F5 agar cache lama hilang.
3. **Uji EXE di Windows** (belum pernah dijalankan di Windows asli oleh pengembang): unduh `KSDAS_ITDel.exe`, klik ganda. Bila Windows SmartScreen memperingatkan karena EXE belum ditandatangani, pilih More info > Run anyway. Peramban terbuka otomatis ke `http://127.0.0.1:17877/`. Folder `ksdas_local_database` muncul di samping EXE. Jika folder tidak dapat ditulis (misalnya Program Files), data dipindah ke `%LocalAppData%\KSDAS_ITDel`.
4. **Tanda tangani EXE (opsional)** dengan sertifikat code signing institusi agar tidak diperingatkan SmartScreen dan antivirus. Beritahu SDI/TSI bila antivirus kampus memblokir.
5. **Uji dengan dokumen asli** yang sudah disetujui untuk dipakai (jangan mengunggah dokumen rahasia ke GitHub). Catat field yang salah atau kosong, anonimkan dokumennya, lalu serahkan agar aturan ekstraksi diperbaiki dan dijadikan uji otomatis.
6. **Tetapkan aturan validasi**: siapa yang berhak memvalidasi, apakah perlu dua pemeriksa, dan klasifikasi data (publik, internal, terbatas) sesuai kebijakan institusi.
7. **Putuskan lingkup produksi bersama SDI/TSI/DukTek** (daftar 14 keputusan terbuka di Runbook): server, basis data, penyimpanan berkas, SSO, mode akses LAN/VPN/Internet, cadangan, retensi. Jangan mengisi nilai tersebut tanpa persetujuan mereka.
8. **Kepemilikan dan lisensi**: README memuat lisensi MIT dan data penulis. Pastikan sesuai kebijakan HAKI IT Del sebelum dipublikasikan (lihat `HAK_CIPTA_LEGAL_DJKI.md`).
9. **Verifikasi data referensi** di `js/ksdas.js` (nama pimpinan 2025-2029, dekan, program studi). Perbarui bila ada pergantian pejabat.
10. **Aktifkan CI** (opsional): workflow `.github/workflows/ci.yml` menjalankan uji dan membangun EXE di GitHub Actions. Aktifkan Actions pada repositori bila belum.

## Tambahan setelah pemeriksaan keamanan
11. **Aktifkan perlindungan GitHub** (Settings > Code security): Secret scanning + Push protection, Dependabot alerts, dan Private vulnerability reporting (dirujuk `SECURITY.md`). Aktifkan branch protection untuk `main` (wajib PR dan CI hijau).
12. **Putar (rotate) kredensial bila pernah dipakai di tempat lain.** Pemindaian saya tidak menemukan rahasia di repositori maupun riwayat git, tetapi saya tidak dapat melihat sistem di luar repositori ini.
13. **Verifikasi EXE sebelum dibagikan**: cocokkan SHA-256 dengan `KSDAS_ITDel.exe.sha256`. Untuk distribusi resmi, unggah EXE sebagai asset GitHub Release (bukan hanya berkas di repo) dan minta SDI menandatanganinya.
14. **Perbarui pustaka vendor berkala** (pdf.js 3.11.174 punya CVE-2024-4367 yang dimitigasi dengan `isEvalSupported:false`; pembaruan ke seri 4.x memerlukan pengujian ulang).
15. **Data contoh fiktif**: nama mitra, nomor, dan URL pada data contoh bukan data sebenarnya. Pastikan tidak ada dokumen asli IT Del yang ikut ter-commit. Folder `ksdas_local_database/` sudah diabaikan git.
16. **Jangan mengunggah dokumen rahasia** ke GitHub, Issues, atau PR. Jika terlanjur, hapus dan hubungi saya untuk membersihkan riwayat (butuh force-push yang harus Anda setujui).
17. **Produksi (SDI/TSI/DukTek)**: TLS resmi + HSTS, SSO, RBAC di server, basis data privat, pemindaian malware, backup, dan pemantauan. Prototipe ini tidak menggantikan itu.
