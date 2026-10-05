# Panduan KSDAS_ITDel.exe (v1.0)

`KSDAS_ITDel.exe` membangun sistem penyimpanan di komputer lokal dan membuka antarmuka KSDAS (sama dengan versi GitHub Pages) di peramban. Tidak perlu menginstal Node, Python, atau basis data. Tidak perlu internet. Butuh Windows 10/11 (.NET Framework 4.x bawaan) dan peramban (Edge/Chrome/Firefox).

## Cara pakai
1. Unduh `KSDAS_ITDel.exe`, letakkan di folder yang dapat ditulis (mis. `D:\KSDAS`), klik ganda.
2. Jendela status terbuka dan peramban otomatis menuju `http://127.0.0.1:17877/`.
3. Saat pertama kali, EXE langsung membangun `ksdas_local_database\` di samping EXE: `tables`, `schema`, `dosir_lampiran`, `backups`. Catatan pembuatannya tampil di jendela status.
4. Unggah dokumen di menu **Catat**. Data, berkas asli, dan audit tertulis ke disk. Buka menu **Penyimpanan & Memori** untuk melihat pemakaian disk, memori proses, simulasi tulis/baca, cadangan, dan uji pemulihan.
5. Menutup jendela menanyakan: Ya (keluar), Tidak (sembunyikan ke baki sistem), Batal.

Data tidak berpindah ke komputer lain. Untuk memindahkan, salin seluruh folder `ksdas_local_database`, atau gunakan Ekspor JSON.

## Jendela status
Alamat aplikasi, tombol Buka Aplikasi, Buka Folder Basis Data, Cadangkan Sekarang, jumlah berkas lampiran, cadangan, catatan audit, memori proses (working set, heap terkelola), sisa disk, dan log aktivitas.

## Argumen baris perintah
`--headless` (tanpa jendela), `--no-browser`, `--port 17877`, `--data-dir D:\data\ksdas`.

## Membangun ulang
- Windows: `build_exe.bat` (memakai `csc.exe` bawaan Windows).
- Linux/macOS: `./build_exe.sh` (Mono `mcs`).
Aset web (folder `css`, `js`, `index.html`, `sample-data\uji`) dan skema SQL dikemas ke dalam EXE. Jika ada folder `web\` di samping EXE, folder itu dipakai (untuk pengembangan).

## Keamanan
Server hanya di `127.0.0.1`, memakai token sesi, cek Host/Origin, validasi berkas (ekstensi, magic bytes, 25 MB), nama berkas dibuat server. Detail: `PENYIMPANAN_DAN_SIMULASI.md`.

## Pemecahan masalah
- *Windows SmartScreen/antivirus memperingatkan*: EXE belum ditandatangani. Pilih More info > Run anyway, atau minta SDI/TSI menandatangani.
- *Port sibuk*: EXE mencoba port 17877 sampai 17886 otomatis.
- *Folder tidak dapat ditulis*: data dipindah ke `%LocalAppData%\KSDAS_ITDel\ksdas_local_database`.
- *Peramban tidak terbuka*: buka alamat pada jendela status secara manual.
