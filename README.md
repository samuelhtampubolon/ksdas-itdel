# KSDAS IT Del — Sistem Informasi Kerja Sama

[![Release](https://img.shields.io/github/v/release/samuelhtampubolon/ksdas-itdel?color=blue&label=Rilis%20Resmi)](https://github.com/samuelhtampubolon/ksdas-itdel/releases/latest)
[![Download EXE](https://img.shields.io/badge/Download-KSDAS__ITDel.exe-success?style=for-the-badge&logo=windows)](https://github.com/samuelhtampubolon/ksdas-itdel/releases/latest/download/KSDAS_ITDel.exe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Live Web Demo](https://img.shields.io/badge/Web%20Portal-Live%20Demo-informational?logo=github)](https://samuelhtampubolon.github.io/ksdas-itdel/)

Sistem Informasi Manajemen Kerja Sama untuk Unit Kerja Sama (UKS) Institut Teknologi Del, Laguboti, Sumatera Utara.

Staf mengunggah dokumen (PDF, DOCX, Excel/CSV, atau scan). KSDAS membaca isinya dan **mengisi kolom formulir otomatis sebagai usulan** lengkap dengan tingkat keyakinan, halaman, dan kutipan sumber. Nilai yang tidak tertulis di dokumen dibiarkan kosong (tidak ditebak) dan ditandai "perlu diisi manual". Staf memeriksa, melengkapi, lalu memvalidasi sebelum menjadi data resmi. Semua proses berjalan lokal, tanpa layanan AI eksternal.

- Cara kerja ekstraksi dan batasnya: [docs/EKSTRAKSI_DOKUMEN.md](docs/EKSTRAKSI_DOKUMEN.md)
- Demonstrasi penyimpanan, storage, dan memori: [docs/PENYIMPANAN_DAN_SIMULASI.md](docs/PENYIMPANAN_DAN_SIMULASI.md)
- Langkah manual pemilik repositori: [docs/LANGKAH_MANUAL_PEMILIK.md](docs/LANGKAH_MANUAL_PEMILIK.md)

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

## 🗄️ Penyimpanan Lokal oleh KSDAS_ITDel.exe

Saat dijalankan, EXE langsung membangun folder `ksdas_local_database/` di samping EXE dan menjalankan server lokal yang hanya mendengarkan `127.0.0.1`:

```text
ksdas_local_database/
├── tables/            naskah_kerjasama.json, mitra_institusi.json, lampiran_berkas.json, audit_trail_log.jsonl, database_manifest.json
├── schema/            ksdas_relational_schema.sql (PostgreSQL), data_dictionary.json
├── dosir_lampiran/    berkas asli yang diunggah (nama dibuat server)
└── backups/           cadangan bertanda waktu + manifest SHA-256
```

Versi GitHub Pages memakai IndexedDB di peramban dengan antarmuka yang sama. Menu **Penyimpanan & Memori** pada keduanya menampilkan pemakaian ruang, memori, simulasi tulis/baca, cadangan, dan uji pemulihan.

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
1. **Kedaulatan & Kerahasiaan Dokumen**: Naskah kerja sama memuat hak kekayaan intelektual, klausul non-disclosure (NDA), dan rincian anggaran. Server lokal intranet kampus IT Del menjaga data tetap berada di dalam perimeter kampus (kontrol keamanan lengkap ditentukan SDI/TSI/DukTek).
2. **Ketiadaan Rantai Relasi di Cloud Publik**: Google Drive/Notion hanya menyimpan file tanpa memvalidasi apakah MoU sudah memiliki PKS turunan atau apakah PKS sudah memiliki naskah pelaksanaan (IA).
3. **Pembatasan Wewenang**: Di KSDAS, Dekan dan Kaprodi secara otomatis terisolasi hanya dapat melihat dan mengunduh data fakultas/prodi yang dipimpinnya.
4. **Pemberitahuan Otomatis Masa Berlaku**: KSDAS menghitung sisa hari berlaku dan menandai naskah yang akan berakhir (≤ 180 hari) maupun yang telah kedaluwarsa.

---

## Alur Operasional Utama

### 1. Dari Perspektif Staf Unit Kerja Sama:
- **Unggah Berkas Naskah**: PDF, Word, Excel/CSV, atau scan gambar &rarr; berkas asli tersimpan sebagai lampiran (IndexedDB di web, folder `dosir_lampiran` di EXE).
- **Ekstraksi Cerdas & OCR Otomatis**: Sistem secara otomatis membaca naskah dan menjalankan *entity extractor* untuk mendeteksi:
  - Nomor naskah (MoU/PKS/IA),
  - Judul kerja sama (klausul 'TENTANG'),
  - Nama mitra kerja sama (otomatis dicocokkan atau didaftarkan),
  - Nama penandatangan & gelar (membedakan nama orang asli dengan nama instansi/organisasi),
  - Kategori Fakultas (FITE, FTI, FB) dan Program Studi,
  - Klasifikasi Tri Dharma Perguruan Tinggi (Pendidikan, Penelitian, Pengabdian),
  - Masa berlaku (tanggal mulai, berakhir, durasi tahun),
  - Nilai anggaran & lokasi kegiatan.
- **Pengisian Formulir Otomatis (usulan)**: Kolom formulir terisi dengan penanda keyakinan (Tinggi, Sedang, Rendah), halaman, dan kutipan sumber. Field yang tidak ditemukan dibiarkan kosong.
- **Validasi Staf**: Staf melengkapi yang kosong, memeriksa yang berkeyakinan sedang/rendah, lalu menekan Validasi. Status: Perlu ditinjau, Tervalidasi, Tervalidasi (dikoreksi), Ditolak.
- **Unggah Banyak Berkas**: Sampai 100 berkas sekaligus, diurutkan menurut hirarki MoU, PKS, IA, Proposal, Laporan, relasi induk otomatis dari rujukan nomor.
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

### 3. Dari Satuan Penjaminan Mutu (SPM / SPMI Kemdiktisaintek):
- **Dasbor Siklus PPEPP**: Pemantauan tahapan Penetapan, Pelaksanaan, Evaluasi (AMI), Pengendalian (RTL), dan Peningkatan mutu kerja sama.
- **Audit Mutu Internal (AMI)**: Pendeteksian otomatis kesenjangan relasi naskah (MoU "tidur" / pasif > 180 hari tanpa PKS, PKS tanpa IA/kegiatan, dan naskah kedaluwarsa).
- **Evaluasi Ketercapaian IKU 6 Kemdiktisaintek**: Matriks kemitraan program studi dengan industri/mitra kelas dunia per 4 fakultas dan 9 program studi.
- **Ekspor Lembar Hasil Audit Mutu Internal (LH-AMI)**: Menghasilkan berkas Word resmi ber-Kop Surat Satuan Penjaminan Mutu & Rektorat IT Del dengan rekomendasi tindak lanjut.

---

## 🏛️ Struktur Organisasi & Pejabat Pimpinan IT Del (2025–2026/2029)

KSDAS diselaraskan 100% dengan tata pamong dan pejabat definitif terbaru Institut Teknologi Del:

- **Yayasan Del**:
  - **Pembina**: Jenderal TNI (Purn.) Luhut Binsar Pandjaitan, M.P.A.
  - **Pengurus**: Intan Simanjuntak
- **Rektorat IT Del**:
  - **Rektor**: Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech. *(Periode 2025–2029)*
  - **Wakil Rektor I (Akademik & Kemahasiswaan)**: Good Fried Panggabean, S.T., M.T., Ph.D.
  - **Wakil Rektor II (Perencanaan, Keuangan, & Sumber Daya)**: Rosni Lumbantoruan, Ph.D.
  - **Wakil Rektor III (Kemitraan, Inovasi, & Kewirausahaan)**: Dr. Ellyas Alga Nainggolan, S.TP., M.Sc., Ph.D. *(Pimpinan Pembina Biro Kerja Sama & Capaian IKU 6)*
- **Lembaga & Satuan**:
  - **Satuan Penjaminan Mutu (SPM)**: Penyelenggara SPMI & Auditor Mutu Internal Siklus PPEPP Kemdiktisaintek
  - **Bagian Kerja Sama dan Kemitraan (UKS)**: Unit Pelaksana Pengarsipan Dosir, Ekstraksi Naskah, & LaporKerma
  - **Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)**: Riset Bersama & Hilirisasi PKM Industri
- **4 Fakultas & 9 Program Studi**:
  1. **Fakultas Informatika dan Teknik Elektro (FITE)** — Dekan: Indra Hartarto Tambunan, Ph.D.
     - S1 Informatika (IF)
     - S1 Sistem Informasi (SI)
     - S1 Teknik Elektro (TE)
  2. **Fakultas Teknologi Industri (FTI)** — Dekan: Dr. Fitriani Tupa Ronauli Silalahi, S.Si., M.Si.
     - S1 Manajemen Rekayasa (MR)
     - S1 Teknik Metalurgi (TM)
  3. **Fakultas Bioteknologi (FB)** — Dekan: Dr. Merry Meryam Martgrita, S.Si., M.Si.
     - S1 Teknik Bioproses (BP)
  4. **Fakultas Vokasi (FV)** — Dekan: Riyanthi Angrainy Sianturi, S.Sos., M.Ds.
     - D4 Teknologi Rekayasa Perangkat Lunak (TRPL)
     - D3 Teknologi Informasi (D3TI)
     - D3 Teknologi Komputer (D3TK)

---

## ⚖️ Landasan Regulasi Kemdiktisaintek (SPMI & AMI)

1. **Permendikbudristek No. 53 Tahun 2023** tentang Penjaminan Mutu Pendidikan Tinggi (Standar Nasional Pendidikan Tinggi / SN Dikti).
2. **Siklus PPEPP SPMI**:
   - **Penetapan**: Standar pemilihan mitra bereputasi, format baku dosir, pedoman MoU/PKS/IA.
   - **Pelaksanaan**: Realisasi turunan PKS maksimal 180 hari dari MoU, pelaksanaan kegiatan tridharma.
   - **Evaluasi**: Audit Mutu Internal (AMI) berkala terhadap rantai relasi naskah dan masa berlaku.
   - **Pengendalian**: Penerbitan Rencana Tindak Lanjut (RTL) atas temuan KTS Minor/Mayor.
   - **Peningkatan**: Peningkatan kualitas mitra ke skala dunia/industri terkemuka dan sinkronisasi LaporKerma.
3. **Indikator Kinerja Utama (IKU 6 Kemdiktisaintek)**: Kemitraan Program Studi dengan Mitra Kelas Dunia, Industri Terkemuka, BUMN, atau Lembaga Riset Bereputasi.

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
