# Panduan Aplikasi Desktop Standalone Windows (.EXE) — KSDAS IT Del

Dokumen ini memandu pengoperasian dan pengembangan aplikasi desktop portabel **`KSDAS_ITDel.exe`** untuk demonstrasi penyimpanan data persisten lokal di lingkungan sistem operasi Microsoft Windows.

---

## 1. Ikhtisar Aplikasi

`KSDAS_ITDel.exe` adalah aplikasi desktop native Windows yang dibangun menggunakan C# dan Windows Forms (`.NET Framework 4.0+`). Aplikasi ini dirancang **mandiri (standalone)**:
- Tidak memerlukan instalasi Node.js, Python, atau database eksternal.
- Tidak memerlukan koneksi internet (bekerja 100% luring / offline di perimeter intranet kampus).
- Dilengkapi modul **Ekstraksi Cerdas & OCR Dokumen Lokal** untuk membaca berkas naskah tanpa mengirim data keluar dari komputer.
- Dapat dijalankan langsung dari flashdisk atau folder lokal komputer mana pun.

### Lokasi Berkas Utama:
- **Executable**: `KSDAS_ITDel.exe`
- **Kode Sumber C#**: `desktop-app/KSDAS_DesktopApp.cs`
- **Skrip Kompilasi**: `build_exe.bat`
- **Berkas Basis Data Persisten**: `ksdas_desktop_database.json` (dibuat otomatis di folder yang sama saat aplikasi berjalan).

---

## 2. Cara Menjalankan Aplikasi

1. Buka File Explorer di Windows dan masuk ke direktori repository ini.
2. Klik ganda pada berkas **`KSDAS_ITDel.exe`**.
3. Jendela aplikasi akan terbuka dengan antarmuka bertema institusional Institut Teknologi Del (warna biru dongker `#16324F` dan krem `#F3F0E8`).

---

## 3. Fitur Utama Aplikasi Desktop

### A. Tampilan Repositori Naskah & Penanda Warna Status:
- Menampilkan daftar naskah dengan kolom: Nomor Dokumen, Jenis, Judul Kerja Sama, Mitra, Fakultas/Prodi, Tanggal Mulai, Tanggal Berakhir, dan Status.
- **Pewarnaan Otomatis**:
  - Baris dengan status **Akan Berakhir** (≤ 180 hari) diberi latar belakang kuning muda lembut.
  - Baris dengan status **Berakhir** diberi latar belakang merah muda lembut.

### B. Pencarian & Saringan Cepat:
- Ketik kata kunci pada kotak **Cari Dokumen** untuk menyaring nomor, judul, mitra, atau nama kegiatan secara seketika (*real-time*).
- Pilih jenis naskah dari dropdown (MoU / LOI, PKS / MoA, IA, Proposal, Laporan).
- Pilih status dari dropdown (Aktif, Akan Berakhir, Berakhir, Draf).

### C. Ekstraksi Cerdas & OCR Berkas Dokumen:
- **Akses dari Toolbar Utama**: Klik tombol **"🔍 Ekstraksi Cerdas & OCR"** pada bilah alat atas.
- **Akses dari Dialog Entri**: Klik tombol **"🔍 Ekstraksi Cerdas / OCR Berkas..."** saat sedang menambah naskah baru.
- **Dukungan Berkas**: Menerima file Word (`.docx`), PDF (`.pdf`), teks naskah ringkasan (`.txt`, `.csv`), dan berkas pindaian scan/gambar.
- **Pendeteksian Entitas Otomatis**:
  - Nomor naskah dokumen resmi IT Del dan mitra.
  - Judul kerja sama (diekstraksi dari klausul 'TENTANG' atau naskah kepala).
  - Nama mitra dan penandatangan mitra (algoritma memfilter nama lembaga agar hanya mendeteksi nama orang asli dengan gelar akademik).
  - Klasifikasi Fakultas & Program Studi (FITE, FTI, FB, Vokasi).
  - Klasifikasi Tri Dharma (Pendidikan, Penelitian, Pengabdian).
  - Tanggal mulai, tanggal berakhir, dan durasi tahun.
  - Nilai anggaran dan lokasi pelaksanaan.
- **Jendela Hasil Pratinjau**: Menampilkan teks mentah hasil pembacaan berkas dan ringkasan entitas yang terdeteksi.
- **Gunakan pada Formulir**: Klik tombol *"Gunakan pada Formulir"* untuk langsung memindahkan hasil deteksi ke field entri dokumen.
- **Validasi Manual Staf**: Staf meninjau, menyempurnakan, dan melengkapi data yang belum terisi secara manual sebelum disimpan ke basis data.

### D. Tambah & Ubah Naskah:
- Klik tombol **"+ Tambah Naskah"** untuk membuka dialog pengisian dokumen baru.
- Sistem otomatis mengisikan nilai default: Pejabat IT Del (`Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.`, Rektor IT Del), tanggal hari ini, dan lokasi Laguboti.
- Lengkapi nomor dokumen, judul, nama mitra, tanggal, dan ruang lingkup, lalu klik **Simpan**.
- Untuk mengubah data yang sudah ada, cukup **klik ganda pada baris naskah** di tabel.

### E. Demonstrasi Penyimpanan Data Persisten:
1. Tambahkan sebuah naskah baru atau ubah naskah yang ada.
2. Klik tombol **"💾 Simpan Database"** (data juga tersimpan otomatis saat dialog ditutup).
3. Buka berkas **`ksdas_desktop_database.json`** menggunakan Notepad. Anda akan melihat data baru tersebut telah tertulis secara permanen di disk lokal komputer.
4. Tutup aplikasi `KSDAS_ITDel.exe` lalu buka kembali: data yang baru Anda tambahkan tetap ada dan tidak hilang!

### F. Ekspor ke CSV / Excel:
- Klik tombol **"📊 Ekspor ke CSV"** untuk menyimpan seluruh data naskah saat ini ke berkas `.csv` yang dapat langsung dibuka di Microsoft Excel.

### G. Generate Analisis Kemitraan:
- Klik tombol **"📈 Generate Analisis"**.
- Jendela ringkasan eksekutif akan muncul menampilkan:
  - Jumlah total naskah yang terdaftar.
  - Sebaran status (Aktif, Akan Berakhir dalam 180 hari, Telah Berakhir, Draf).
  - Sebaran per jenis dokumen.
  - Rekomendasi tindak lanjut bagi pimpinan.

### H. Integrasi ke Versi Web:
- Klik tombol **"🌐 Buka Versi Web"** untuk langsung membuka live demo peramban di [https://samuelhtampubolon.github.io/ksdas-itdel/](https://samuelhtampubolon.github.io/ksdas-itdel/).

---

## 4. Cara Mengompilasi Ulang Kode Sumber

Jika Anda melakukan perubahan pada kode sumber `desktop-app/KSDAS_DesktopApp.cs`:

1. Buka Command Prompt (cmd) di direktori ini.
2. Jalankan perintah:
```cmd
build_exe.bat
```
3. Skrip akan secara otomatis memanggil Microsoft .NET C# Compiler (`csc.exe`) bawaan sistem operasi Windows dan menghasilkan berkas executable `KSDAS_ITDel.exe` yang baru dalam hitungan 2 detik.
