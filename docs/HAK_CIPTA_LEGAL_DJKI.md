# DOKUMEN PENGAJUAN PENCATATAN HAK CIPTA RESMI (DJKI KEMENKUMHAM RI)
## Ciptaan Program Komputer: Kerja Sama Data & Analytics System (KSDAS) IT Del

**Dasar Hukum:** Undang-Undang Republik Indonesia Nomor 28 Tahun 2014 tentang Hak Cipta  
**Kategori Ciptaan:** Program Komputer (Pasal 40 ayat (1) huruf s UU Hak Cipta)  
**Pencipta & Pemegang Hak Cipta:** Samuel Hasudungan Tampubolon  
**Status Dokumen:** Naskah Spesifikasi Resmi Lampiran Permohonan Pencatatan Ciptaan Elektronik (e-HakCipta DJKI)  

---

## 📌 1. DATA ADMINISTRASI PERMOHONAN PENCATATAN CIPTAAN

| Parameter Permohonan | Rincian Isian Formulir Resmi DJKI Kemenkumham RI |
| :--- | :--- |
| **Judul Ciptaan** | **Kerja Sama Data & Analytics System (KSDAS) Institut Teknologi Del** |
| **Jenis Ciptaan** | **Program Komputer** |
| **Sub-Jenis Ciptaan** | Aplikasi Berbasis Web / Sistem Informasi Terintegrasi (*Web-Based Enterprise Software*) |
| **Nama Lengkap Pencipta** | **Samuel Hasudungan Tampubolon** |
| **Kewarganegaraan** | Indonesia (WNI) |
| **Alamat Korespondensi** | Institut Teknologi Del, Jl. Sisingamangaraja, Sitoluama, Laguboti, Kabupaten Toba, Sumatera Utara, Kode Pos 22381 |
| **Nama Pemegang Hak Cipta** | **Samuel Hasudungan Tampubolon** |
| **Tanggal Pertama Kali Diumumkan** | **3 Oktober 2026** |
| **Tempat Pertama Kali Diumumkan** | **Laguboti, Kabupaten Toba, Provinsi Sumatera Utara, Republik Indonesia** |
| **Tautan Publikasi Pertama Kali** | Repositori GitHub Resmi: `https://github.com/samuelhtampubolon/ksdas-itdel`<br>Tautan Daring Terbuka: `https://samuelhtampubolon.github.io/ksdas-itdel/` |

---

## 📌 2. URAIAN SINGKAT CIPTAAN (DESKRIPSI TEKNIS RESMI)

> **Uraian Singkat Ciptaan untuk Pengisian Sistem e-HakCipta:**  
> *"Kerja Sama Data & Analytics System (KSDAS) Institut Teknologi Del adalah sebuah karya cipta program komputer berupa platform perangkat lunak tata kelola kemitraan strategis, repositori naskah perjanjian hukum, ekstraksi metadata dokumen cerdas, pemantauan masa berlaku otomatis, dan analitik pemetaan instrumen akreditasi perguruan tinggi. Sistem ini mengintegrasikan rantai garis keturunan relasi dokumen secara hierarkis (Mitra &rarr; MoU/LOI &rarr; PKS/MoA &rarr; Implementation Agreement &rarr; Proposal Kegiatan &rarr; Laporan Akhir Pelaksanaan/LPJ) serta menghubungkannya ke pilar Tri Dharma Perguruan Tinggi (Pendidikan, Penelitian, Pengabdian kepada Masyarakat, dan Tata Kelola). Program komputer ini dilengkapi modul pemrosesan tumpukan naskah (Batch Processing), ekstraksi cerdas 26 field metadata dengan persentase keyakinan (Confidence Score) dan kutipan naskah sumber, antarmuka peninjauan manusia berdampingan (Human-in-the-Loop Side-by-Side Validation), generator laporan eksekutif siap cetak, serta parser kueri bahasa alami (Natural Language Query) berbahasa Indonesia."*

---

## 📌 3. KEBARYAN & FITUR ORISINALITAS PROGRAM (NOVELTY & INNOVATION)

Karya cipta program komputer ini memiliki orisinalitas rancangan arsitektur, algoritma, dan logika fungsional yang membedakannya dari sistem informasi arsip dokumen konvensional:

1. **Model Relasi Dokumen Berjenjang 6 Tingkat (*Hierarchical Document Lineage Model*):**
   Tidak seperti sistem arsip berkas biasa yang memperlakukan berkas sebagai rekaman terpisah (*flat record*), KSDAS mengimplementasikan struktur pohon relasi `Mitra` &rarr; `MoU` &rarr; `PKS` &rarr; `IA` &rarr; `Proposal` &rarr; `Laporan Akhir`, dilengkapi deteksi dokumen yatim (*orphan agreement detection*) dan mekanisme penautan induk otomatis.
2. **Mesin Ekstraksi Metadata 26 Field dengan Transparansi Sumber (*Explainable Extraction Engine*):**
   Setiap luaran ekstraksi naskah menghasilkan nilai terstandarisasi, skor keyakinan (*confidence score* 0.00-1.00), nomor halaman berkas, dan kalimat kutipan teks asli (*source citation*) sehingga keputusan otomasi dapat diaudit secara transparan.
3. **Antarmuka Validasi Manual Berdampingan (*Interactive Side-by-Side Validation Workspace*):**
   Sistem memisahkan status data hasil otomasi (`TEREKSTRAKSI` / `NEEDS_REVIEW`) dan data resmi yang telah disetujui (`VALIDATED` / `TERVALIDASI RESMI`). Antarmuka menyajikan teks naskah pada panel kiri dan formulir verifikasi pada panel kanan secara sinkron.
4. **Matriks Tabulasi Silang Analitik (*Cross-Tabulation Matrix*) & *Follow-up Gap Analysis*:**
   Perhitungan otomatis sebaran naskah kerja sama aktif berdasarkan Fakultas/Unit versus Bidang Tri Dharma, garis waktu kedaluwarsa naskah (*expiry bucket timeline*), dan pendeteksian Nota Kesepahaman (MoU) pasif yang belum ditindaklanjuti dengan PKS.
5. **Konfigurasi Fleksibel Standar Mutu & Akreditasi (*Configurable Accreditation Framework*):**
   Dukungan pemetaan indikator akreditasi nasional (BAN-PT IAPS 4.0 / IAPT 3.0) dan instrumen akreditasi mandiri rumpun informatika (LAM-INFOKOM) tanpa *hard-coding*, sehingga instrumen dapat disesuaikan saat ada pembaruan regulasi kementerian.
6. **Arsitektur Tanpa Kompilasi (*Zero-Build Reactive Single Page Application*):**
   Seluruh antarmuka dibangun menggunakan Vanilla ES6 modular, CSS3 terstandarisasi, dan HTML5 tanpa dependensi build pipeline Node.js yang rapuh, memastikan keandalan tinggi dan portabilitas maksimal.

---

## 📌 4. STRUKTUR ARSITEKTUR KODE SUMBER

Kode sumber ciptaan program komputer KSDAS IT Del tersusun secara sistematis ke dalam modul-modul berikut:

```
ksdas-itdel/
├── index.html                   (Lapisan Presentasi Utama & Struktur DOM 13 Tampilan Modul)
├── css/
│   ├── variables.css            (Token Desain, Palet Warna Institusi IT Del, Tipografi)
│   ├── main.css                 (Tata Letak Shell, Navigasi Sidebar, dan Header Responsif)
│   ├── components.css           (Komponen Antarmuka: KPI Cards, Tabel, Modal, Toasts, Badges)
│   └── views.css                (Gaya Khusus: Batch Dropzone, Validasi Side-by-Side, Pohon Relasi)
├── js/
│   ├── app.js                   (Orkestrator Antarmuka, Event Listeners, dan Alur Kerja Logika)
│   ├── store.js                 (State Management Reaktif, Adapter Backend API, dan Ekspor Cadangan)
│   ├── router.js                (Client-Side Hash Router dengan Auto-Close Drawer Responsif)
│   ├── mock-ai.js               (Mesin Ekstraksi Metadata 26 Field, Heuristik Regex, dan NLP Parser)
│   ├── components.js            (Library Komponen UI, Sanitasi XSS HTML, dan Format Mata Uang)
│   ├── data.js                  (Basis Data Simulasi Sintetis Awal 30 Naskah & 8 Mitra IT Del)
│   └── analytics.js             (Mesin Penghitungan Analitik, Matriks Silang, dan Visualisasi Chart.js)
├── sample-data/
│   ├── batch_upload_samples.json (10 Berkas Naskah Sampel Uji Skenario Akseptansi)
│   └── ksdas_export_sample.json  (Struktur Skema Cadangan JSON Standar)
└── docs/
    ├── schema_production_postgres.sql (Skrip DDL Resmi Basis Data PostgreSQL 18 Tabel)
    ├── ARCHITECTURE.md          (Spesifikasi Arsitektur Perangkat Lunak)
    ├── SECURITY.md              (Kebijakan Keamanan Data & Kepatuhan UU PDP)
    ├── HANDOFF_SPEC_SDI_TSI.md  (Dokumen Serah Terima Kebutuhan Sistem Resmi)
    ├── DATA_DICTIONARY.md       (Kamus Data Lengkap Sesuai Bab A-V)
    └── PANDUAN_INTEGRASI_SDI_TSI.md (Panduan Implementasi Server Kampus)
```

---

## 📌 5. PERNYATAAN HUBUNGAN INSTITUSIONAL & LISENSI

1. **Hak Cipta Moral & Ekonomi Pencipta:**
   Hak moral dan hak cipta orisinal atas rancangan program, logika algoritma, spesifikasi arsitektur, dan kode sumber prototipe KSDAS IT Del dimiliki sepenuhnya oleh **Samuel Hasudungan Tampubolon** (`Copyright © 2026 Samuel Hasudungan Tampubolon`).
2. **Penyelarasan untuk Institut Teknologi Del:**
   Karya cipta ini dirancang dan diselaraskan secara spesifik untuk memecahkan kebutuhan tata kelola kemitraan kampus **Institut Teknologi Del (IT Del)**, Sitoluama, Laguboti, Kabupaten Toba, Sumatera Utara.
3. **Hak Operasional & Basis Data Produksi Kampus:**
   Implementasi operasional di server kampus, integrasi dengan akun Single Sign-On (SSO) IT Del, serta seluruh data naskah resmi kerja sama kampus diatur berdasarkan kebijakan dan ketentuan resmi pimpinan Institut Teknologi Del bersama Direktorat SDI / TSI / DukTek IT Del.
4. **Lisensi Kode Sumber:**
   Kode sumber prototipe dilisensikan di bawah ketentuan [MIT License](../LICENSE).

---

## 📌 6. PERNYATAAN KEASLIAN KARYA (DECLARATION OF ORIGINALITY)

> *Dengan ini saya, **Samuel Hasudungan Tampubolon**, menyatakan bahwa ciptaan program komputer berjudul **"Kerja Sama Data & Analytics System (KSDAS) Institut Teknologi Del"** adalah benar-benar karya cipta orisinal yang saya rancang dan kembangkan secara mandiri, tidak meniru atau menjiplak karya cipta pihak lain tanpa izin, dan bebas dari sengketa hukum atau klaim hak kekayaan intelektual pihak ketiga manapun.*

Laguboti, Kabupaten Toba, 3 Oktober 2026  
**Pencipta & Pemegang Hak Cipta,**

*(Tanda Tangan Elektronik / Bermeterai)*

**Samuel Hasudungan Tampubolon**
