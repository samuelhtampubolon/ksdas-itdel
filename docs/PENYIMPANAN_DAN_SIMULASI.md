# Penyimpanan, Storage, dan Memori (v1.0)

Menu **Penyimpanan & Memori** mendemonstrasikan cara KSDAS menyimpan dan memantau data. Dua mode memakai antarmuka yang sama (`js/storage.js`).

| | GitHub Pages (web) | KSDAS_ITDel.exe |
|---|---|---|
| Data naskah dan mitra | IndexedDB + cache localStorage | File JSON di `ksdas_local_database\tables` |
| Berkas asli | IndexedDB (Blob) | `ksdas_local_database\dosir_lampiran` (nama dibuat server) |
| Audit | IndexedDB | `tables\audit_trail_log.jsonl` |
| Cadangan | IndexedDB + manifest SHA-256 | `backups\backup_*` + `manifest.json` SHA-256 |
| Bertahan bila peramban dibersihkan | Tidak | Ya |
| Memori | Heap JS peramban | Working set dan heap proses server, ruang disk |

## Yang dapat didemonstrasikan di menu ini
1. Kuota, pemakaian, dan status persisten penyimpanan peramban.
2. Jumlah baris dan ukuran tiap tabel; di EXE juga lokasi file dan isi folder basis data.
3. **Simulasi tulis dan baca**: menulis N rekaman uji, membaca kembali, mengukur milidetik dan MB/detik.
4. **Simulasi memori**: mengalokasikan blok RAM untuk menunjukkan beda memori kerja dan penyimpanan.
5. **Cadangan, uji pemulihan (tanpa mengubah data), pemulihan, ekspor/impor JSON bercheck-sum**.
6. Catatan audit terbaru (unggah, validasi, tolak, tautkan, cadangan, impor, ekspor, unduh berkas).

## Keamanan server lokal (EXE)
- Hanya mendengarkan `127.0.0.1` dan `localhost`; tidak terbuka ke jaringan.
- Setiap permintaan API wajib token acak per sesi (disisipkan ke halaman yang dilayani), cek Host (anti DNS rebinding) dan Origin.
- Unggahan: ekstensi allowlist, cek magic bytes, maks 25 MB, nama file dibuat server, SHA-256 dicatat, diunduh sebagai `attachment`.
- Penulisan tabel atomik (file sementara lalu ganti), pemulihan memverifikasi SHA-256 manifest.

## Batas prototipe
Ini bukan basis data produksi. Mesin basis data, penyimpanan berkas, cadangan, SSO, dan jaringan produksi ditentukan SDI/TSI/DukTek (lihat `RUNBOOK_INTEGRASI_SDI_TSI_V03.md`). Skema target PostgreSQL ada di `schema_production_postgres.sql`.
