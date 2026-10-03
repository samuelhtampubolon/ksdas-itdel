# KSDAS IT Del — Sistem Informasi Kerja Sama

Sistem Informasi Manajemen Kerja Sama untuk Unit Kerja Sama (UKS) Institut Teknologi Del, Laguboti, Sumatera Utara.

Aplikasi ini adalah **Sistem Informasi Manajemen konvensional berbasis aturan deterministik** dan basis data relasional. Aplikasi ini **bukan** pemindai dokumen, dan **sama sekali tidak memakai AI, ML, atau OCR**.

---

## Tautan Resmi & Panduan Utama

- 🌐 **Live Demo GitHub Pages**: [https://samuelhtampubolon.github.io/ksdas-itdel/](https://samuelhtampubolon.github.io/ksdas-itdel/)
- 📂 **Panduan Uji Coba Dokumen Sendiri**: [docs/PANDUAN_UJI_COBA_DOKUMEN_LOKAL.md](docs/PANDUAN_UJI_COBA_DOKUMEN_LOKAL.md)
- ⚡ **Panduan Delivery & Deployment**: [docs/PANDUAN_DELIVERY_DEPLOYMENT.md](docs/PANDUAN_DELIVERY_DEPLOYMENT.md)
- 🏛️ **Panduan Integrasi SDI/TSI**: [docs/PANDUAN_INTEGRASI_SDI_TSI.md](docs/PANDUAN_INTEGRASI_SDI_TSI.md)
- 💻 **Panduan Aplikasi Desktop Standalone (.EXE)**: [docs/PANDUAN_APLIKASI_DESKTOP_EXE.md](docs/PANDUAN_APLIKASI_DESKTOP_EXE.md)

---

## Mengapa KSDAS Server Lokal Menggantikan Google Drive, OneDrive, dan Notion?

Saat ini dokumen kerja sama IT Del tersimpan tersebar di Google Drive, Google Sheets, Microsoft OneDrive, dan Notion. Kondisi tersebut tidak ideal karena:
1. **Kedaulatan & Kerahasiaan Dokumen**: Naskah kerja sama memuat hak kekayaan intelektual, klausul non-disclosure (NDA), dan anggaran. Server lokal intranet kampus IT Del menjamin data tersimpan aman di dalam perimeter kampus.
2. **Ketiadaan Rantai Relasi di Cloud Publik**: Google Drive/Notion hanya menyimpan file tanpa memvalidasi apakah MoU sudah memiliki PKS turunan atau apakah PKS sudah memiliki naskah pelaksanaan (IA).
3. **Pembatasan Wewenang**: Di KSDAS, Dekan dan Kaprodi secara otomatis terisolasi hanya dapat melihat dan mengunduh data fakultas/prodi yang dipimpinnya.
4. **Pemberitahuan Otomatis Masa Berlaku**: KSDAS menghitung sisa hari berlaku dan menandai naskah yang akan berakhir (\u2264 180 hari) maupun yang telah kedaluwarsa.

---

## Alur Operasional Utama

### 1. Dari Perspektif Staf Unit Kerja Sama:
- **Unggah Berkas**: Staf mengunggah dokumen fisik pindaian (PDF) atau dosir digital &rarr; tersimpan di basis data sebagai lampiran.
- **Default Sistem Otomatis**: Formulir terbuka dengan nilai institusional yang sudah diketahui terisi otomatis (Penandatangan IT Del: Rektor Dr. Arnaldo Sinaga; Tanggal mulai: hari ini; Lokasi: Laguboti; Unit: UKS).
- **Pintasan Otomatisasi Staf**: Staf dapat langsung memilih berkas ringkasan (.csv/.txt) atau menempel teks ringkasan &rarr; sistem memetakan puluhan kolom formulir naskah dalam satu klik tanpa ketik manual satu per satu.
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

## Aplikasi Desktop Standalone Windows (`.EXE`)

Untuk demonstrasi penyimpanan data persisten lokal di laptop/PC Windows tanpa memerlukan instalasi server atau internet:
1. Klik ganda berkas **`KSDAS_ITDel.exe`**.
2. Aplikasi desktop Windows Forms portabel akan terbuka langsung.
3. Seluruh penambahan, perubahan, dan penghapusan data tersimpan secara persisten ke berkas **`ksdas_desktop_database.json`** di folder yang sama.
4. Untuk mengompilasi ulang kode sumber C# (`desktop-app/KSDAS_DesktopApp.cs`), cukup jalankan `build_exe.bat`.

---

## 10 Data Contoh Resmi IT Del

Sistem ini hanya menyertakan tepat 10 naskah contoh terstandar (judul diawali kata "Contoh") dengan mitra resmi seperti Pemkab Toba, Universitas Sumatera Utara (USU), SMK Negeri 1 Laguboti, dan Dinas Pariwisata Sumut. Sistem ini bersih dan bebas dari entitas non-akademik yang tidak relevan.
