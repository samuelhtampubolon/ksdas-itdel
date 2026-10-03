# KSDAS IT Del — Sistem Informasi Kerja Sama

[![Release](https://img.shields.io/github/v/release/samuelhtampubolon/ksdas-itdel?color=blue&label=Rilis%20Resmi)](https://github.com/samuelhtampubolon/ksdas-itdel/releases/latest)
[![Download EXE](https://img.shields.io/badge/Download-KSDAS__ITDel.exe-success?style=for-the-badge&logo=windows)](https://github.com/samuelhtampubolon/ksdas-itdel/releases/latest/download/KSDAS_ITDel.exe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Live Web Demo](https://img.shields.io/badge/Web%20Portal-Live%20Demo-informational?logo=github)](https://samuelhtampubolon.github.io/ksdas-itdel/)

Sistem Informasi Manajemen Kerja Sama untuk Unit Kerja Sama (UKS) Institut Teknologi Del, Laguboti, Sumatera Utara.

Aplikasi ini menggabungkan **Sistem Informasi Manajemen berbasis data relasional yang kokoh** dengan modul **Ekstraksi Cerdas & OCR Lokal Portabel**. Sistem ini mampu membaca isi naskah dokumen (Word DOCX, DOC, PDF, pindaian gambar/scan, maupun ringkasan teks) untuk mengenali secara presisi nomor naskah, nama penandatangan (membedakan orang asli dan instansi), judul kerja sama, kategori fakultas/prodi, klasifikasi Tri Dharma, masa berlaku, dan nilai anggaran. Hasil deteksi langsung mengisi kolom formulir di layar sebagai usulan awal (*draft suggestions*), di mana **Staf Unit Kerja Sama memiliki kendali penuh untuk memverifikasi, melengkapi detail, dan mengesahkan data sebelum disimpan ke basis data**.

---

## ⬇️ Tautan Unduh Langsung Program Desktop (.EXE)

Aplikasi desktop Windows Forms ini portabel dan standalone (dapat langsung dijalankan di PC/Laptop Windows tanpa perlu menginstal web server atau koneksi internet).

| Berkas Unduhan | Tautan Langsung GitHub | Keterangan |
| :--- | :--- | :--- |
| **`KSDAS_ITDel.exe`** | [⬇️ Unduh Langsung (GitHub Release)](https://github.com/samuelhtampubolon/ksdas-itdel/releases/latest/download/KSDAS_ITDel.exe) <br> *(Tautan Alternatif: [Direct Raw Link](https://github.com/samuelhtampubolon/ksdas-itdel/raw/main/KSDAS_ITDel.exe))* | Program Desktop Standalone Windows (.NET 4.5+ bawaan Windows 10/11) |
| **`KSDAS_ITDel_Windows.zip`** | [📦 Unduh Paket Lengkap (.ZIP)](https://github.com/samuelhtampubolon/ksdas-itdel/releases/latest/download/KSDAS_ITDel_Windows.zip) | Arsip komplit berisi program, installer, dan dokumentasi lengkap |
| **`setup_ksdas_local.bat`** | [⚡ Unduh Skrip Setup Lokal](https://github.com/samuelhtampubolon/ksdas-itdel/raw/main/setup_ksdas_local.bat) | Skrip instalasi otomatis: membangun database lokal & membuat ikon di Desktop |
| **Portal Web Online** | [🌐 Buka Demo Web (GitHub Pages)](https://samuelhtampubolon.github.io/ksdas-itdel/) | Versi web interaktif client-side yang dapat diakses langsung via peramban |

---

## 🗄️ Sistem Basis Data Terstruktur & Terintegrasi Lokal

Saat **`KSDAS_ITDel.exe`** dijalankan atau di-install melalui **`setup_ksdas_local.bat`**, sistem secara otomatis dan instan membangun arsitektur basis data relasional terstruktur di direktori lokal komputer Anda:

```text
ksdas_local_database/
├── tables/
│   ├── naskah_kerjasama.json      <- Data relasional dosir naskah (MoU, PKS, IA)
│   ├── mitra_institusi.json       <- Direktori master mitra kampus & industri
│   ├── fakultas_prodi.json        <- Taksonomi fakultas (FITE, FTI, FB) & program studi
│   ├── audit_trail_log.json       <- Buku log transaksi mutasi sistem (immutable)
│   └── database_manifest.json     <- Manifest integritas & status relasional
├── schema/
│   ├── ksdas_relational_schema.sql <- Skema DDL resmi PostgreSQL 14+ / SQLite 3
│   └── data_dictionary.json        <- Kamus data relasional terstandar
├── dosir_lampiran/                 <- Folder repositori naskah PDF/Word/Scan
└── backups/                        <- Cadangan snapshot berkala basis data
```

### Keunggulan Basis Data Lokal KSDAS:
1. **Otomatis Tanpa Konfigurasi Rumit**: Tidak membutuhkan instalasi server SQL pihak ketiga; langsung siap pakai saat pertama kali dijalankan.
2. **Skema Standar RDBMS SQL**: Berkas DDL `schema/ksdas_relational_schema.sql` telah disiapkan dan kompatibel 100% untuk migrasi langsung ke PostgreSQL produksi TSI/SDI IT Del.
3. **Audit Trail Mutlak**: Setiap kali naskah ditambah, diubah, atau dihapus, log transaksi dicatat secara permanen di `tables/audit_trail_log.json`.
4. **Pencadangan Instan (Snapshot Backup)**: Tombol *"🔄 Cadangkan Basis Data"* di bilah alat aplikasi desktop membuat cadangan terstempel waktu (*timestamped snapshot*) ke dalam folder `backups/`.

---

## 📑 Tautan Panduan & Dokumentasi Lengkap

- 📂 **Panduan Uji Coba Dokumen Sendiri**: [docs/PANDUAN_UJI_COBA_DOKUMEN_LOKAL.md](docs/PANDUAN_UJI_COBA_DOKUMEN_LOKAL.md)
- ⚡ **Panduan Delivery & Deployment**: [docs/PANDUAN_DELIVERY_DEPLOYMENT.md](docs/PANDUAN_DELIVERY_DEPLOYMENT.md)
- 🏛️ **Panduan Integrasi SDI/TSI**: [docs/PANDUAN_INTEGRASI_SDI_TSI.md](docs/PANDUAN_INTEGRASI_SDI_TSI.md)
- 💻 **Panduan Aplikasi Desktop Standalone (.EXE)**: [docs/PANDUAN_APLIKASI_DESKTOP_EXE.md](docs/PANDUAN_APLIKASI_DESKTOP_EXE.md)
- 📖 **Kamus Data Resmi**: [docs/DATA_DICTIONARY.md](docs/DATA_DICTIONARY.md)
- 🔒 **Kebijakan Keamanan & Kedaulatan Data**: [docs/SECURITY.md](docs/SECURITY.md)

---

## Mengapa KSDAS Server Lokal Menggantikan Google Drive, OneDrive, dan Notion?

Saat ini dokumen kerja sama IT Del tersimpan tersebar di Google Drive, Google Sheets, Microsoft OneDrive, dan Notion. Kondisi tersebut tidak ideal karena:
1. **Kedaulatan & Kerahasiaan Dokumen**: Naskah kerja sama memuat hak kekayaan intelektual, klausul non-disclosure (NDA), dan rincian anggaran. Server lokal intranet kampus IT Del menjamin data tersimpan aman di dalam perimeter kampus tanpa risiko kebocoran data (*zero data leakage*).
2. **Ketiadaan Rantai Relasi di Cloud Publik**: Google Drive/Notion hanya menyimpan file tanpa memvalidasi apakah MoU sudah memiliki PKS turunan atau apakah PKS sudah memiliki naskah pelaksanaan (IA).
3. **Pembatasan Wewenang**: Di KSDAS, Dekan dan Kaprodi secara otomatis terisolasi hanya dapat melihat dan mengunduh data fakultas/prodi yang dipimpinnya.
4. **Pemberitahuan Otomatis Masa Berlaku**: KSDAS menghitung sisa hari berlaku dan menandai naskah yang akan berakhir (≤ 180 hari) maupun yang telah kedaluwarsa.

---

## Alur Operasional Utama

### 1. Dari Perspektif Staf Unit Kerja Sama:
- **Unggah Berkas Naskah**: Staf mengunggah dokumen fisik pindaian (Scan/Gambar), berkas Word (`.docx`, `.doc`), PDF, atau teks ringkasan &rarr; tersimpan di basis data sebagai lampiran.
- **Ekstraksi Cerdas & OCR Otomatis**: Sistem secara otomatis membaca naskah dan menjalankan *entity extractor* untuk mendeteksi:
  - Nomor naskah (MoU/PKS/IA),
  - Judul kerja sama (klausul 'TENTANG'),
  - Nama mitra kerja sama (otomatis dicocokkan atau didaftarkan),
  - Nama penandatangan & gelar (membedakan nama orang asli dengan nama instansi/organisasi),
  - Kategori Fakultas (FITE, FTI, FB) dan Program Studi,
  - Klasifikasi Tri Dharma Perguruan Tinggi (Pendidikan, Penelitian, Pengabdian),
  - Masa berlaku (tanggal mulai, berakhir, durasi tahun),
  - Nilai anggaran & lokasi kegiatan.
- **Pengisian Formulir Seketika**: Kolom formulir di layar langsung terisi seketika dengan tanda visual hijau `[Terdeteksi Cerdas]`.
- **Validasi Manual Staf**: Staf meninjau, menyempurnakan, dan melengkapi data yang belum terisi secara manual agar data 100% valid dan terverifikasi sebelum disimpan ke basis data.
- **Pintasan Otomatisasi Staf**: Tombol sampel instan (MoU Pemkab Toba dan PKS Industri) tersedia untuk pengujian cepat 1-klik.
- **Migrasi Data Massal**: Fitur impor tabel untuk memindahkan data dari Google Sheets, OneDrive Excel, atau Notion secara deterministik.

### 2. Dari Perspektif Dekan dan Kaprodi:
- **Tabel & Pencarian Real-Time**: Melihat data naskah sesuai lingkup fakultas/prodi.
- **Filter Multi-Kriteria**: Saring berdasarkan tahun, jenis naskah (MoU, PKS, IA, Proposal, Laporan), dan status (Aktif, Akan Berakhir, Berakhir, Draf).
- **Sort Kolom**: Klik judul kolom untuk mengurutkan data secara dinamis.
- **Seleksi Naskah (Multi-Select Checkbox)**: Pilih satu, beberapa, atau seluruh naskah menggunakan kotak centang.
- **Unduh Dokumen**:
  - **CSV**: Untuk olah data spreadsheet.
  - **Excel (`.xls`)**: Berformat rapi dengan tema resmi IT Del.
  - **Word (`.doc`)**: Dosir resmi ber-Kop Surat Institut Teknologi Del dan tanda tangan Rektor.
- **Generate Analisis Kemitraan**: Menghasilkan analisis statistik sebaran status, jenis naskah, kesenjangan tindak lanjut, dan rekomendasi pimpinan, serta opsi unduh laporan ke Word (`.doc`).

---

## Kompilasi Ulang Aplikasi Desktop

Jika Anda melakukan kustomisasi pada kode C# desktop:
1. Buka Command Prompt di direktori proyek.
2. Jalankan:
   ```cmd
   build_exe.bat
   ```
3. Kompiler C# (`csc.exe` bawaan .NET Framework Windows) akan otomatis mengompilasi `desktop-app/KSDAS_DesktopApp.cs` menjadi executable biner **`KSDAS_ITDel.exe`** dalam hitungan detik tanpa perlu menginstal Visual Studio.

---

## 10 Data Contoh Resmi IT Del

Sistem ini hanya menyertakan tepat 10 naskah contoh terstandar (judul diawali kata "Contoh") dengan mitra resmi seperti Pemkab Toba, Universitas Sumatera Utara (USU), SMK Negeri 1 Laguboti, dan Dinas Pariwisata Sumut. Sistem ini bersih dan bebas dari entitas non-akademik yang tidak relevan.

---

## Lisensi

Proyek ini dilisensikan di bawah lisensi terbuka [MIT License](LICENSE).  
Hak Cipta (c) 2026 Samuel Hasudungan Tampubolon, Institut Teknologi Del.
