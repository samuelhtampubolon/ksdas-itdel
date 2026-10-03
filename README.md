# KSDAS IT Del — Sistem Informasi Kerja Sama

Sistem Informasi Manajemen Kerja Sama untuk Unit Kerja Sama (UKS) Institut Teknologi Del, Laguboti, Sumatera Utara.

Aplikasi ini menggabungkan **Sistem Informasi Manajemen berbasis data relasional yang kokoh** dengan modul **Ekstraksi Cerdas & OCR Lokal Portabel**. Sistem ini mampu membaca isi naskah dokumen (Word, PDF, pindaian/gambar scan, maupun ringkasan teks) untuk mengenali secara presisi nomor naskah, nama penandatangan (membedakan orang asli dan instansi), judul kerja sama, kategori fakultas/prodi, klasifikasi Tri Dharma, masa berlaku, dan nilai anggaran. Hasil deteksi disajikan sebagai usulan awal (*draft suggestions*), di mana **Staf Unit Kerja Sama memiliki kendali penuh untuk memverifikasi, melengkapi detail, dan mengesahkan data sebelum disimpan ke basis data**.

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
- **Unggah Berkas Naskah**: Staf mengunggah dokumen fisik pindaian (Scan/Gambar), berkas Word (`.docx`), PDF, atau berkas ringkasan &rarr; tersimpan di basis data sebagai lampiran.
- **Ekstraksi Cerdas & OCR Otomatis**: Sistem secara otomatis mengekstraksi teks dari berkas/gambar scan dan menjalankan *smart entity recognition* untuk mendeteksi:
  - Nomor naskah (MoU/PKS/IA),
  - Judul kerja sama (klausul 'TENTANG'),
  - Nama penandatangan & gelar (membedakan nama orang asli dengan nama instansi/organisasi),
  - Kategori Fakultas (FITE, FTI, FB, Vokasi) dan Program Studi,
  - Klasifikasi Tri Dharma Perguruan Tinggi (Pendidikan, Penelitian, Pengabdian),
  - Masa berlaku (tanggal mulai, berakhir, durasi tahun),
  - Nilai anggaran & lokasi kegiatan.
- **Badge Visual Usulan Cerdas**: Kolom yang terdeteksi ditandai dengan badge `[Terdeteksi Cerdas]` sebagai usulan awal.
- **Validasi Manual Staf**: Staf meninjau, menyempurnakan, dan melengkapi data yang belum terisi secara manual agar data 100% valid dan terverifikasi sebelum disimpan ke basis data.
- **Pintasan Otomatisasi Staf**: Staf juga dapat langsung memilih berkas ringkasan (.csv/.txt) atau menempel teks ringkasan untuk pengisian instan.
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
3. **Fitur Ekstraksi Cerdas & OCR Desktop**:
   - Tombol **"🔍 Ekstraksi Cerdas & OCR"** pada bilah alat (*toolbar*) memungkinkan staf memindai berkas Word/PDF/Teks/Scan langsung dari komputer.
   - Hasil ekstraksi menampilkan jendela dialog deteksi entitas (Nomor, Judul, Mitra, Penandatangan, Fakultas/Prodi, Tri Dharma, Nilai, Durasi).
   - Tombol **"Gunakan pada Formulir"** mengisikan hasil deteksi ke form entri, di mana staf dapat memeriksa dan memverifikasi data sebelum disimpan.
4. Seluruh penambahan, perubahan, dan penghapusan data tersimpan secara persisten ke berkas **`ksdas_desktop_database.json`** di folder yang sama.
5. Untuk mengompilasi ulang kode sumber C# (`desktop-app/KSDAS_DesktopApp.cs`), cukup jalankan `build_exe.bat`.

---

## 10 Data Contoh Resmi IT Del

Sistem ini hanya menyertakan tepat 10 naskah contoh terstandar (judul diawali kata "Contoh") dengan mitra resmi seperti Pemkab Toba, Universitas Sumatera Utara (USU), SMK Negeri 1 Laguboti, dan Dinas Pariwisata Sumut. Sistem ini bersih dan bebas dari entitas non-akademik yang tidak relevan.
