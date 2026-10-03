> **Catatan 3 Oktober 2026.** Naskah di bawah ini dari rancangan sebelumnya. Yang berlaku sekarang tidak memakai AI, ML, atau OCR. Ikuti README serta `PANDUAN_UJI_COBA_DOKUMEN_LOKAL.md`, `PANDUAN_DELIVERY_DEPLOYMENT.md`, dan `PANDUAN_INTEGRASI_SDI_TSI.md`.

# KSDAS IT DEL - HUMAN-CENTERED UI/UX DESIGN SYSTEM & ACCESSIBILITY SPECIFICATION
## Versi 0.3 &bull; Spesifikasi Desain Antarmuka, Pengalaman Pengguna & Faktor Manusia

**Lead Product Designer & UX Engineer:** Samuel Hasudungan Tampubolon  
**Hak Cipta:** Copyright &copy; 2026 Samuel Hasudungan Tampubolon  
**Sasaran:** Unit Kerja Sama, Tim SDI / TSI / DukTek, Satuan Penjaminan Mutu (SPM), dan Pengguna Institusi IT Del  
**Sifat Dokumen:** Panduan Desain Antarmuka & Standar Aksesibilitas Sistem KSDAS IT Del  

---

## 📌 DAFTAR ISI
1. [Tujuan Pengalaman Pengguna (UX Goals)](#1-tujuan-pengalaman-pengguna-ux-goals)
2. [Persona Pengguna Institusi IT Del (8 Persona)](#2-persona-pengguna-institusi-it-del-8-persona)
3. [Arsitektur Informasi Sistem (Information Architecture)](#3-arsitektur-informasi-sistem-information-architecture)
4. [Desain Dasbor Eksekutif (Dashboard UX)](#4-desain-dasbor-eksekutif-dashboard-ux)
5. [Pengalaman Penyaringan Dinamis & Preset Tersimpan (Filter UX)](#5-pengalaman-penyaringan-dinamis--preset-tersimpan-filter-ux)
6. [Pengalaman Tabel Data & Progresifitas Informasi (Table UX)](#6-pengalaman-tabel-data--progresifitas-informasi-table-ux)
7. [Alur Pemrosesan Berkas Tumpukan (Batch Upload 8-Step Flow)](#7-alur-pemrosesan-berkas-tumpukan-batch-upload-8-step-flow)
8. [Antarmuka Validasi Manual Berdampingan (Split-Screen Validation)](#8-antarmuka-validasi-manual-berdampingan-split-screen-validation)
9. [Transparansi Kecerdasan Buatan (Explainable AI Suggestions)](#9-transparansi-kecerdasan-buatan-explainable-ai-suggestions)
10. [Visualisasi Pohon Relasi & Garis Keturunan Dokumen (Relationship UX)](#10-visualisasi-pohon-relasi--garis-keturunan-dokumen-relationship-ux)
11. [Pencegahan Kesalahan Masukan Pengguna (Error Prevention & Guardrails)](#11-pencegahan-kesalahan-masukan-pengguna-error-prevention--guardrails)
12. [Kondisi Data Kosong yang Informatif (Empty States)](#12-kondisi-data-kosong-yang-informatif-empty-states)
13. [Standar Aksesibilitas Web (WCAG 2.1 AA Compliance)](#13-standar-aksesibilitas-web-wcag-21-aa-compliance)
14. [Strategi Tata Letak Responsif Desktop & Ponsel Pintar (Responsive Strategy)](#14-strategi-tata-letak-responsif-desktop--ponsel-pintar-responsive-strategy)
15. [Kepadatan Data & Tipografi (Data Density Modes)](#15-kepadatan-data--tipografi-data-density-modes)
16. [Pencarian Global Terkelompok (Global Search Architecture)](#16-pencarian-global-terkelompok-global-search-architecture)
17. [Kueri Bahasa Alami Transparan (Natural Language Query UX)](#17-kueri-bahasa-alami-transparan-natural-language-query-ux)
18. [Pembangun Analitik Dinamis (Analytics Builder)](#18-pembangun-analitik-dinamis-analytics-builder)
19. [Alur Pembuatan Laporan Resmi (Report Generation Wizard)](#19-alur-pembuatan-laporan-resmi-report-generation-wizard)
20. [Ruang Kerja Audit Mutu Internal & Akreditasi (AMI & Accreditation Workspace)](#20-ruang-kerja-audit-mutu-internal--akreditasi-ami--accreditation-workspace)
21. [Sistem Notifikasi & Peringatan Dini (Notification Engine)](#21-sistem-notifikasi--peringatan-dini-notification-engine)
22. [Standar Penulisan Teks Antarmuka (Microcopy & Tone of Voice)](#22-standar-penulisan-teks-antarmuka-microcopy--tone-of-voice)
23. [Faktor Manusia & Reduksi Beban Administratif (Human Factors Engineering)](#23-faktor-manusia--reduksi-beban-administratif-human-factors-engineering)
24. [Kriteria Penerimaan Kegunaan (Usability Acceptance Criteria)](#24-kriteria-penerimaan-kegunaan-usability-acceptance-criteria)
25. [Ketentuan Keamanan Prototipe (Prototype Privacy Rules)](#25-ketentuan-keamanan-prototipe-prototype-privacy-rules)
26. [Metrik Keberhasilan Desain (Design Success Metrics)](#26-metrik-keberhasilan-desain-design-success-metrics)

---

## 1. TUJUAN PENGALAMAN PENGGUNA (UX GOALS)

Staf Unit Kerja Sama sering bekerja multitasking dalam tempo tinggi: melayani kunjungan tamu mitra industri, mengoordinasikan naskah perjanjian hukum dengan dekan/prodi, menyiapkan berkas akreditasi SPM, serta memantau tindak lanjut kegiatan Tri Dharma.

### 8 Prinsip Utama Desain KSDAS:
1. **Minimum Typing:** Otomatisasi pembacaan dokumen meminimalkan pengetikan manual berulang.
2. **Maximum Useful Information:** Informasi disajikan terstruktur, bukan tumpukan teks mentah.
3. **Progressive Disclosure:** Tampilkan informasi inti terlebih dahulu; rincian teknis diakses sesuai kebutuhan.
4. **Clear Status:** Status dokumen dinyatakan dengan teks eksplisit dan kode warna terstandarisasi.
5. **Low-Friction Validation:** Persetujuan dokumen dapat dilakukan berdampingan hanya dengan 1 klik.
6. **Self-Service Analytics:** SPM, Prodi, dan WR3 dapat menyaring data mandiri tanpa meminta rekap staf.
7. **Transparent AI Suggestions:** Setiap usulan metadata AI mencantumkan skor keyakinan dan kalimat sumber.
8. **Easy Recovery from Errors:** Kesalahan input mudah dikoreksi tanpa kehilangan draf naskah.

---

## 2. PERSONA PENGGUNA INSTITUSI IT DEL (8 PERSONA)

| Persona | Peran Pengguna | Kebutuhan Utama | Aksi Kritis pada KSDAS |
| :--- | :--- | :--- | :--- |
| **A. Staf Unit Kerja Sama** | `ADMIN_STAFF` | Efisiensi input & integrasi data | Batch upload berkas, validasi manual ekstraksi dokumen, menautkan relasi PKS ke MoU, generate laporan. |
| **B. Kepala Biro Kemitraan** | `BUREAU_HEAD` | Pengawasan & akuntabilitas data | Otorisasi akhir status naskah, monitoring kontrak kritis, analisis efektivitas mitra. |
| **C. Wakil Rektor III** | `WR3` | Pengambilan keputusan strategis | Dasbor eksekutif, analisis gap tindak lanjut (*follow-up gap*), peringatan kedaluwarsa naskah. |
| **D. Satuan Penjaminan Mutu**| `QUALITY_REVIEWER`| Pemenuhan standar akreditasi | Pemetaan naskah ke indikator BAN-PT/LAM-INFOKOM, verifikasi bukti fisik (*evidence*). |
| **E. Dekan Fakultas** | `FACULTY_VIEWER` | Capaian kinerja kerja sama fakultas | Filter dokumen fakultas (FITE, FTI, FB), unduh laporan kinerja kemitraan tahunan. |
| **F. Ketua Program Studi** | `PROGRAM_VIEWER` | Rekognisi & bukti luaran MBKM/Magang| Akses bukti implementasi PKS mahasiswa magang/riset prodi masing-masing. |
| **G. Unit Kerja Internal** | `UNIT_VIEWER` | Pelacakan tindak lanjut unit | Memantau naskah kegiatan LPPM, BAAK, CDC, atau SDI. |
| **H. Pimpinan (Rektor/WR1/2)**| `EXECUTIVE_VIEWER`| Ringkasan makro institusi Del | Pemantauan tren kerja sama nasional & internasional tahunan. |

---

## 3. ARSITEKTUR INFORMASI SISTEM (INFORMATION ARCHITECTURE)

Navigasi menu utama dirancang padat, logis, dan tidak berlapis secara berlebihan:

```
KSDAS IT Del (Sidebar Navigation)
├── 1. MENU UTAMA
│   ├── Dashboard                (Ringkasan Eksekutif, KPI, Funnel Implementasi, Peringatan)
│   ├── Repositori Dokumen       (Tabel Multi-Filter, Pencarian Naskah, Rincian Metadata)
│   ├── Batch Upload Dokumen     (Pengunggahan Tumpukan Berkas, Ekstraksi 26 Field, Progress)
│   ├── Validasi Manual          (Workspace Side-by-Side Review, Persetujuan Data Resmi)
│   └── Hierarki & Relasi        (Pohon Relasi Mitra -> MoU -> PKS -> IA -> LPJ, Deteksi Orphan)
├── 2. DATA MASTER & KEMITRAAN
│   ├── Master Mitra             (Direktori Industri, BUMN, Universitas, Pemda, Kontak PIC)
│   └── Aktivitas & Evidence     (Realisasi Tri Dharma, Luaran Terukur, Pengarsipan Bukti)
├── 3. ANALITIK & PENJAMINAN MUTU
│   ├── Analitik Eksekutif       (Tabulasi Silang, Expiry Timeline, Analisis Kesenjangan MoU)
│   ├── Akreditasi & AMI         (Pemetaan Instrumen BAN-PT, LAM-INFOKOM & Verifikasi Bukti)
│   ├── Generator Laporan        (Wizard Pembuatan Laporan Resmi & Paket Bukti Siap Cetak)
│   └── Pencarian Cerdas         (Natural Language Query Copilot Bahasa Indonesia)
└── 4. SISTEM & TATA KELOLA
    ├── Audit Trail              (Log Transaksi Mutlak Sistem & Riwayat Koreksi Staf)
    └── Pengaturan & Cadangan    (Ekspor/Impor JSON, Reset Data Demo, Panduan Handoff)
```

---

## 4. DESAIN DASBOR EKSEKUTIF (DASHBOARD UX)

Dasbor dirancang untuk menjawab 4 pertanyaan mendasar pimpinan dalam 5 detik pertama:
1. **What exists?** &rarr; Berapa total mitra aktif, total MoU, PKS, dan IA yang terdaftar?
2. **What changed?** &rarr; Berapa naskah baru yang masuk bulan ini dan bagaimana tren tahunannya?
3. **What needs attention?** &rarr; Berapa naskah yang mendekati masa kedaluwarsa (<90 hari) dan berapa naskah yatim (*orphan*)?
4. **What evidence exists?** &rarr; Berapa persen dokumen yang telah dilengkapi bukti fisik terverifikasi?

---

## 5. PENGALAMAN PENYARINGAN DINAMIS & PRESET TERSIMPAN (FILTER UX)

### Filter Umum (*Top Bar Filters*):
- **Tahun Pelaksanaan:** `ALL`, `2027`, `2026`, `2025`, `2024`, `2023`.
- **Jenis Naskah:** `MoU / LOI`, `PKS / MoA`, `Implementation Arrangement (IA)`, `Proposal`, `Laporan Akhir`.
- **Status Validasi:** `TEREKSTRAKSI`, `NEEDS_REVIEW`, `VALIDATED`, `REJECTED`.
- **Mitra Strategis:** Dropdown pencarian seluruh mitra terdaftar.
- **Pilar Tri Dharma:** Pendidikan, Penelitian, Pengabdian kepada Masyarakat, Tata Kelola.

### Filter Presets Tersimpan (*One-Click Saved Presets*):
Untuk memangkas navigasi berulang staf, disediakan tombol preset instan:
- 🎯 **"AMI 2026 - FTI"**: Menyaring langsung dokumen tahun 2026, fakultas FTI, status VALIDATED.
- 🔬 **"Riset Aktif 2025-2026"**: Menyaring langsung naskah PKS penelitian aktif.
- ⚠️ **"Kontrak Expiring (<90 Hari)"**: Menyaring naskah yang memerlukan tindakan mitigasi perpanjangan.
- 🛡️ **"Pending Validasi Staf"**: Menyaring naskah baru hasil ekstraksi sistem yang menunggu persetujuan.

---

## 6. PENGALAMAN TABEL DATA & PROGRESIFITAS INFORMASI (TABLE UX)

- **Prinsip *No Overcrowded Table*:** Tabel utama hanya menampilkan kolom esensial (Judul, Nomor, Tipe, Mitra, Masa Berlaku, Status Validasi, Tingkat Akurasi, dan Tombol Aksi).
- **Progresifitas Informasi (*Drawer / Modal Detail*):** Rincian mendalam (komitmen dana, penandatangan kedua pihak, sasaran output/outcome, teks OCR lengkap, dan berkas lampiran) diakses melalui tombol **"Detail"**.
- **Pencegahan Data Terpotong di Mobile:** Wadah tabel membungkus baris data dengan pengguliran horizontal lancar (*smooth momentum*).

---

## 7. ALUR PEMROSESAN BERKAS TUMPUKAN (BATCH UPLOAD 8-STEP FLOW)

Alur pemrosesan berkas banyak dirancang dengan kejelasan status bertingkat:

$$\text{Select Files} \rightarrow \text{Review Queue} \rightarrow \text{Process} \rightarrow \text{AI Suggestions} \rightarrow \text{Fix Low Confidence} \rightarrow \text{Confirm Relations} \rightarrow \text{Validate} \rightarrow \text{Summary}$$

Indikator visual kemajuan pemrosesan:
1. `Uploading`: Berkas dibaca ke memori.
2. `Extracting`: Teks naskah diuraikan.
3. `Classifying`: Pendeteksian jenis naskah (MoU/PKS/IA).
4. `Linking`: Pencarian calon naskah induk.
5. `Needs Review`: Dokumen siap ditinjau staf.
6. `Completed`: Naskah disetujui menjadi data resmi institusi.

---

## 8. ANTARMUKA VALIDASI MANUAL BERDAMPINGAN (SPLIT-SCREEN VALIDATION)

- **Panel Kiri (Salinan Berkas Asli):** Menyajikan teks hasil pemindaian OCR secara utuh untuk verifikasi kebenaran isi perjanjian.
- **Panel Kanan (Formulir Koreksi Metadata):** Menampilkan nilai ekstraksi 26 field yang dapat diedit langsung oleh staf.
- **Aturan Integritas Tanggal:** Sistem secara otomatis memvalidasi bahwa `Tanggal Berakhir` harus sama atau setelah `Tanggal Penandatanganan`.
- **Aksi Satu Ketukan:** Tombol *Approve (Setujui)*, *Correct (Simpan Koreksi)*, *Reject (Tolak)*, dan *Bulk Approve (Setujui Semua Confidence $\ge 90\%$)*.

---

## 9. TRANSPARANSI KECERDASAN BUATAN (EXPLAINABLE AI SUGGESTIONS)

Sistem memegang teguh prinsip etika kecerdasan buatan institusional:
- AI tidak pernah menyimpulkan kepatuhan hukum secara sepihak.
- Setiap field ekstraksi wajib menyertakan:
  - Nilai usulan (*suggested value*);
  - Skor keyakinan persentase (*confidence score*, misal: 95%);
  - Halaman dokumen sumber (*source page*);
  - Kalimat kutipan naskah asli (*source excerpt*).

---

## 10. VISUALISASI POHON RELASI & GARIS KETURUNAN DOKUMEN (RELATIONSHIP UX)

- **Tampilan Pohon Standar (*Hierarchical Tree*):** Hubungan garis keturunan disajikan dalam bentuk percabangan rapi:
  $$\text{Mitra Strategis} \longrightarrow \text{MoU Induk} \longrightarrow \text{PKS Turunan} \longrightarrow \text{IA Pelaksanaan}$$
- **Deteksi Naskah Yatim (*Orphan Detector*):** Naskah PKS atau IA yang nomor induk MoU-nya belum terdaftar akan ditandai dengan badge khusus dan masuk ke antrean **"Tautkan Induk"**.

---

## 11. PENCEGAHAN KESALAHAN MASUKAN PENGGUNA (ERROR PREVENTION & GUARDRAILS)

Sistem mencegah korupsi data sebelum disimpan melalui mekanisme:
1. Validasi rentang tanggal penandatanganan vs tanggal berakhir;
2. Peringatan berkas ganda (*duplicate document number warning*);
3. Pengecekan ketidaksesuaian entitas mitra (*partner mismatch warning*);
4. Penolakan berkas selain format resmi (.pdf, .docx, .doc);
5. Pembatasan ukuran berkas unggahan maksimum 25 MB.

---

## 12. KONDISI DATA KOSONG YANG INFORMATIF (EMPTY STATES)

Jika pencarian atau filter menghasilkan 0 data, sistem tidak menampilkan tabel kosong yang membingungkan:
- Teks Informatif: *"Tidak ada dokumen yang sesuai dengan kriteria filter saat ini."*
- Tombol Aksi: Menyediakan tombol **"Reset Filter"** dan **"Tambah Dokumen Baru"**.

---

## 13. STANDAR AKSESIBILITAS WEB (WCAG 2.1 AA COMPLIANCE)

1. **Kontras Warna Tinggi:** Rasio kontras teks terhadap latar belakang minimal 4.5:1 untuk keterbacaan optimal.
2. **Navigasi Papan Ketik (Keyboard Accessible):** Seluruh tombol dan input dapat diakses menggunakan tombol `Tab`, `Enter`, dan `Escape`.
3. **Status Multimoda:** Status tidak hanya bergantung pada warna, melainkan selalu disertai label teks eksplisit (contoh: *Badge Hijau* selalu memuat tulisan *VALIDATED*).
4. **Fokus Visual:** Elemen input aktif menampilkan outline fokus berwarna biru kontras (`#0077B6`).

---

## 14. STRATEGI TATA LETAK RESPONSIF DESKTOP & PONSEL PINTAR (RESPONSIVE STRATEGY)

- **Desktop (Monitor Lebar):** Dioptimalkan untuk pemrosesan tumpukan (*batch processing*), analisis tabulasi silang, peninjauan *split-screen*, dan ekspor laporan.
- **Ponsel Pintar (Smartphone):** Dioptimalkan untuk peninjauan cepat, penerimaan notifikasi kontrak kedaluwarsa, pencarian naskah, dan pengunduhan salinan dokumen.

---

## 15. KEPADATAN DATA & TIPOGRAFI (DATA DENSITY MODES)

- **Tipografi Terkurasi:**
  - *Plus Jakarta Sans* untuk antarmuka teks, formulir, dan tombol;
  - *Outfit* untuk judul besar institusi dan angka metrik KPI;
  - *JetBrains Mono* untuk nomor registrasi naskah perjanjian dan kode dokumen.
- **Ruang Nafas Ergonomis:** Mengutamakan *progressive disclosure* daripada memperkecil ukuran huruf secara berlebihan.

---

## 16. PENCARIAN GLOBAL TERKELOMPOK (GLOBAL SEARCH ARCHITECTURE)

- Pintasan Papan Ketik: Tekan `Ctrl + K` dari halaman manapun untuk membuka dialog pencarian cepat.
- Pencarian cerdas mencakup: Judul naskah, nomor perjanjian, nama mitra, nama penandatangan, PIC institusi, dan fakultas.

---

## 17. KUERI BAHASA ALAMI TRANSPARAN (NATURAL LANGUAGE QUERY UX)

Pengguna dapat mengetikkan pertanyaan dalam bahasa Indonesia sehari-hari:
- Contoh: *"Tampilkan PKS industri aktif tahun 2026 yang memiliki kegiatan riset."*
- Sistem menampilkan filter yang ditafsirkan secara transparan sebelum dieksekusi, sehingga pengguna dapat mengoreksi parameter filter jika diperlukan.

---

## 18. PEMBANGUN ANALITIK DINAMIS (ANALYTICS BUILDER)

- Grafik batang, grafik tren garis, dan diagram donat Tri Dharma terhubung secara reaktif dengan filter repositori.
- Menggunakan pustaka visualisasi Chart.js yang ringan, bebas dependensi berat, dan dapat dicetak rapi.

---

## 19. ALUR PEMBUATAN LAPORAN RESMI (REPORT GENERATION WIZARD)

Laporan resmi institusi dihasilkan melalui tahapan:
1. Pemilihan Cakupan & Periode;
2. Pemilihan Metrik & Tabel Data;
3. Pratinjau Tampilan Cetak (*Print Preview Layout*);
4. Pencetakan / Simpan ke PDF (*Print to PDF Mode*).

---

## 20. RUANG KERJA AUDIT MUTU INTERNAL & AKREDITASI (AMI & ACCREDITATION WORKSPACE)

- Menampilkan matriks: **Indikator**, **Kebutuhan Data**, **Data Tersedia**, **Bukti Fisik Terverifikasi**, **Status Kesenjangan (*Gap*)**, dan **Catatan Reviewer**.
- Tidak mengasumsikan kepatuhan akreditasi hanya karena sebuah berkas diunggah; bukti fisik wajib diverifikasi oleh Satuan Penjaminan Mutu (SPM).

---

## 21. SISTEM NOTIFIKASI & PERINGATAN DINI (NOTIFICATION ENGINE)

Kategori peringatan:
- 🔴 **Kritis (Critical):** Naskah kedaluwarsa atau kurang dari 30 hari.
- 🟡 **Peringatan (Warning):** Naskah berakhir dalam 31-90 hari atau naskah yatim (*orphan*).
- 🔵 **Informasi (Info):** Berkas baru diunggah dan siap divalidasi.

---

## 22. STANDAR PENULISAN TEKS ANTARMUKA (MICROCOPY & TONE OF VOICE)

- Menggunakan bahasa Indonesia institusional yang santun, lugas, dan tidak menyalahkan pengguna (*constructive feedback*).
- Menghindari pesan error ambigu seperti *"System error"*, digantikan dengan pesan kontekstual seperti *"Tanggal berakhir naskah harus sama atau setelah tanggal penandatanganan."*

---

## 23. FAKTOR MANUSIA & REDUKSI BEBAN ADMINISTRATIF (HUMAN FACTORS ENGINEERING)

KSDAS bertujuan mentransformasikan peran staf Unit Kerja Sama:
- Mengurangi pengetikan berulang, perhitungan manual, dan rekap manual menjelang akreditasi.
- Mengalihkan fokus staf dari pekerjaan juru ketik (*data entry*) menuju peran pengawas mutu kemitraan (*quality control & relationship follow-up*).

---

## 24. KRITERIA PENERIMAAN KEGUNAAN (USABILITY ACCEPTANCE CRITERIA)

| Persona Uji | Skenario Tindakan | Standar Keberhasilan |
| :--- | :--- | :--- |
| **Staf Kerja Sama** | Mengunggah 10 file dan melakukan validasi | Selesai dalam < 3 menit tanpa galat sistem |
| **Pimpinan WR3** | Memeriksa naskah kedaluwarsa di dasbor | Menemukan daftar kontrak kritis dalam 1 klik |
| **Auditor SPM** | Menemukan bukti fisik sertifikasi kompetensi | Bukti ditemukan dan diverifikasi dalam < 30 detik |

---

## 25. KETENTUAN KEAMANAN PROTOTIPE (PROTOTYPE PRIVACY RULES)

- Prototipe hanya menggunakan data simulasi sintetis kampus IT Del.
- Tidak ada data pribadi rahasia (NIK, kontak pribadi) atau klausul rahasia (*NDA*) yang ditampilkan ke publik.

---

## 26. METRIK KEBERHASILAN DESAIN (DESIGN SUCCESS METRICS)

Metrik yang dapat dievaluasi saat *User Acceptance Testing (UAT)*:
- Waktu rata-rata validasi per dokumen;
- Jumlah koreksi manual yang diperlukan;
- Waktu pencarian bukti fisik akreditasi;
- Kecepatan pembuatan laporan eksekutif resmi.
