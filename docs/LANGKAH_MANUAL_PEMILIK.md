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
