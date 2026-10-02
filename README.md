# KSDAS IT DEL &bull; Kerja Sama Data & Analytics System

[![Live Demo on GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://samuelhtampubolon.github.io/ksdas-itdel/)
[![Institut Teknologi Del](https://img.shields.io/badge/Institusi-Institut%20Teknologi%20Del-0B2545?style=for-the-badge)](https://www.del.ac.id)
[![Version](https://img.shields.io/badge/Version-0.2.0%20(PoC)-0077B6?style=for-the-badge)](#)
[![Zero Backend](https://img.shields.io/badge/Architecture-Single%20Page%20App%20(Zero%20Backend)-2A9D8F?style=for-the-badge)](#)

> **Platform Terpadu Manajemen Kemitraan Strategis, Repositori Naskah Perjanjian, Ekstraksi Metadata AI, Pemantauan Masa Berlaku, dan Pemetaan Instrumen Akreditasi Institut Teknologi Del (IT Del), Laguboti, Kabupaten Toba.**

---

## 🌐 Tautan Demo Langsung (Live Prototype)

Aplikasi ini dapat diakses langsung tanpa instalasi melalui GitHub Pages:  
🔗 **[https://samuelhtampubolon.github.io/ksdas-itdel/](https://samuelhtampubolon.github.io/ksdas-itdel/)**

---

## 📌 Latar Belakang & Tujuan Sistem

Unit Kerja Sama Institut Teknologi Del mengelola kemitraan dengan berbagai industri terkemuka (Huawei, Astra International, Microsoft, Bank Mandiri), perguruan tinggi nasional/internasional (ITB, National University of Singapore, UTM), dan pemerintah daerah (Pemkab Toba, Pemprov Sumut). 

Sebelumnya, dokumen kerja sama tersebar dan rekapitulasi data akreditasi SPM/prodi memakan waktu berhari-hari. KSDAS hadir mengubah paradigma operasional:

$$\text{DOCUMENTS} \longrightarrow \text{STRUCTURED DATA} \longrightarrow \text{INFORMATION} \longrightarrow \text{ANALYTICS} \longrightarrow \text{EVIDENCE} \longrightarrow \text{REPORT}$$

---

## 🎯 23 Fitur Wajib yang Telah Diimplementasikan

1. **Role-Based Demo Access:** Simulasi 8 peran institusi (Staff Unit Kerja Sama, Kepala Biro, WR3, Rektor/Dekan, SPM, Fakultas, Prodi, Unit Internal) dengan pengalih instan di header.
2. **Dashboard Eksekutif:** Kartu metrik KPI, bilah peringatan masa berlaku kritis (<90 hari), dan *Implementation Funnel* (Mitra &rarr; MoU &rarr; PKS &rarr; IA &rarr; Laporan).
3. **Master Mitra:** Direktori terstruktur mitra industri swasta, BUMN, perguruan tinggi, pemerintah daerah, dan yayasan.
4. **Repositori Dokumen:** Basis data terpadu naskah perjanjian dengan pencarian kata kunci, penyortiran, dan rincian metadata lengkap.
5. **Batch Upload AI:** Pengunggahan banyak file sekaligus (*multi-select* / *drag-and-drop*) dilengkapi simulator **10 Dokumen Sampel Otentik IT Del**.
6. **Klasifikasi Dokumen Cerdas:** Pendeteksian naskah otomatis ke tipe `MOU_LOI`, `PKS_MOA`, `IA`, `PROPOSAL`, `FINAL_REPORT`.
7. **Ekstraksi Metadata 26 Field:** Penangkapan otomatis nomor dokumen, perihal, penandatangan mitra/IT Del, tanggal berlaku, fakultas, prodi, pilar Tri Dharma, anggaran, luaran (*output*), dan hasil (*outcome*).
8. **Confidence Score & Kutipan Sumber:** Setiap field ekstraksi dilengkapi persentase keyakinan (0-100%), nomor halaman, dan kutipan kalimat naskah asli.
9. **Human-in-the-Loop Validation Workspace:** AI tidak pernah menetapkan data resmi secara sepihak. Antarmuka *side-by-side* membandingkan salinan teks berkas (kiri) dan formulir koreksi metadata (kanan) dengan tombol *Approve*, *Correct*, *Reject*, serta *Bulk Approve*.
10. **Pohon Relasi & Hierarki:** Visualisasi garis keturunan dokumen (`Partner` &rarr; `MoU` &rarr; `PKS` &rarr; `IA` &rarr; `Proposal` &rarr; `Laporan`) dan deteksi dokumen yatim (*orphan agreement*).
11. **Pelacakan Tri Dharma & Aktivitas:** Pemantauan realisasi kegiatan pada bidang Pendidikan, Penelitian & Inovasi, Pengabdian kepada Masyarakat, dan Tata Kelola.
12. **Indikator Output, Outcome & Impact:** Pencatatan luaran terukur (mahasiswa tersertifikasi, riset terpublikasi Scopus, penyerapan kerja lulusan).
13. **Repositori Bukti Fisik (Evidence):** Pengarsipan berkas sertifikat, dokumentasi foto, surat keputusan, dan draf artikel ilmiah dengan verifikasi SPM.
14. **Analitik Mendalam & Tabulasi Silang:** Matriks tabulasi silang (Fakultas vs Tri Dharma), pemantauan masa berlaku (*expiry timeline*), dan analisis naskah pasif (*follow-up gap*).
15. **Penyaringan Dinamis Multidimensi:** Filter instan gabungan berdasarkan tahun, tipe dokumen, status validasi, mitra, fakultas, dan bidang Tri Dharma.
16. **Visualisasi Interaktif:** Integrasi Chart.js untuk grafik tren naskah tahunan, diagram donat Tri Dharma, dan grafik sebaran kategori mitra.
17. **Generator Laporan Resmi:** Pembuatan draf Laporan Eksekutif WR3/Rektor dan Paket Bukti Akreditasi siap cetak (*Print/PDF mode*).
18. **Workspace Akreditasi & AMI Konfigurabel:** Pemetaan otomatis naskah dan bukti ke instrumen BAN-PT (IAPS 4.0 / IAPT 3.0) dan LAM-INFOKOM.
19. **Pusat Pemberitahuan Terpadu:** Notifikasi masa berlaku kritis (<90 hari dan kedaluwarsa), berkas pending validasi, dan dokumen tanpa induk.
20. **Audit Trail (Rekam Jejak Sistem):** Log transaksi mutlak (*immutable-style log*) mencatat setiap pengunggahan, ekstraksi AI, koreksi staf, dan persetujuan data.
21. **Pencarian Cerdas Bahasa Alami (Natural Language Query):** Parser NLP menerjemahkan kueri bahasa Indonesia wajar ke parameter filter repositori.
22. **Ekspor & Impor Cadangan JSON:** Kemampuan pencadangan penuh seluruh basis data browser dan pemulihan berkas cadangan (*one-click backup/restore*).
23. **Reset Database Demo IT Del:** Kemampuan mengembalikan basis data ke kondisi awal (*seed data*) otentik kampus IT Del Sitoluama Laguboti.

---

## 🚀 Panduan Menjalankan Secara Lokal

Repository ini dirancang sebagai **Zero-Build Step Application** (HTML5, Vanilla CSS, Modular JavaScript, dan Chart.js CDN), sehingga dapat dijalankan tanpa memerlukan instalasi Node.js atau proses build yang rumit.

### 1. Kloning Repositori
```bash
git clone https://github.com/samuelhtampubolon/ksdas-itdel.git
cd ksdas-itdel
```

### 2. Jalankan Server Web Lokal Sederhana
Gunakan Python, PHP, atau ekstensi VSCode Live Server:

**Menggunakan Python 3:**
```bash
python -m http.server 8080
```
Buka peramban di `http://localhost:8080`.

**Atau cukup buka file langsung:**
Klik dua kali berkas `index.html` pada File Explorer Windows Anda.

---

## 🧪 Panduan Uji Skenario Demo (Acceptance Criteria)

### Skenario A (Batch Upload 10 File & Validasi Staf):
1. Pilih peran: **Staff Unit Kerja Sama**.
2. Masuk ke menu **Batch Upload AI** (`#batch-upload`).
3. Klik tombol: **"🧪 Muat 10 Dokumen Sampel Demo (Scenario A)"**.
4. Klik tombol: **"⚡ Mulai Ekstraksi AI & Deteksi Relasi"**.
5. Buka **Workspace Validasi Manusia** (`#validation`), pilih dokumen, lalu klik **"Setujui sebagai Data Resmi"** atau klik **"Setujui Sekaligus Confidence Tinggi (≥ 90%)"**.
6. Amati penambahan data pada **Dashboard Eksekutif** (`#dashboard`).

### Skenario B (Filter Dinamis Multidimensi):
1. Buka menu **Repositori Dokumen** (`#repository`).
2. Terapkan filter: **PKS/MoA** + **Penelitian** + **Tahun 2026**.
3. Sistem secara instan menampilkan dokumen PKS Riset AI Astra 2026.

### Skenario C (Pemeriksaan Bukti Mutu oleh SPM):
1. Ubah peran di header ke: **SPM (Satuan Penjaminan Mutu)**.
2. Buka menu **Akreditasi & AMI** (`#accreditation`).
3. Pilih framework **LAM-INFOKOM**, temukan kriteria *C.1.4.a (Sertifikasi Kompetensi)*, dan klik **"Filter Data"** untuk meninjau evidence terkait.

### Skenario D (Dashboard Monitoring oleh WR3):
1. Ubah peran di header ke: **Wakil Rektor III (Kemitraan)**.
2. Buka menu **Dashboard** (`#dashboard`) dan **Analitik Eksekutif** (`#analytics`).
3. Tinjau *Expiry Monitoring Timeline* dan *Follow-up Gap Analysis* untuk mendeteksi naskah yang memerlukan tindakan mitigasi.

---

## 📚 Dokumen Teknis & Spesifikasi Serah Terima (Handoff to SDI/TSI)

Dokumentasi lengkap untuk tim teknis Direktorat SDI / TSI / Duktek tersedia di folder `docs/`:

| Dokumen | Deskripsi |
| :--- | :--- |
| 📄 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Arsitektur modul, diagram alur data, ERD Mermaid, dan batasan REST API produksi |
| 📄 [`docs/SECURITY.md`](docs/SECURITY.md) | Kebijakan keamanan data, kepatuhan UU PDP No. 27/2022, proteksi XSS/CSP, dan panduan mitigasi risiko |
| 📄 [`docs/HANDOFF_SPEC_SDI_TSI.md`](docs/HANDOFF_SPEC_SDI_TSI.md) | Spesifikasi formal serah terima dari Unit Kerja Sama ke tim IT kampus |
| 📄 [`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md) | Kamus data dan tipe kolom untuk migrasi ke basis data PostgreSQL |
| 📄 [`docs/schema_production_postgres.sql`](docs/schema_production_postgres.sql) | Skrip migrasi DDL lengkap PostgreSQL 14/16 untuk produksi |
| 📄 [`docs/AI_PROCESSING_SPEC.md`](docs/AI_PROCESSING_SPEC.md) | Spesifikasi mesin ekstraksi 26 field, confidence score, dan aturan parser NLP |
| 📄 [`docs/DEMO_SCRIPTS.md`](docs/DEMO_SCRIPTS.md) | Panduan langkah per langkah pengujian demo penerimaan |

---

## 🏛️ Tata Kelola & Kepemilikan Sistem (Governance)

Hak Kekayaan Intelektual, kepemilikan kode sumber (*source code*), kepemilikan basis data, serta status ciptaan sistem ditetapkan sepenuhnya sebagai milik institusi **Institut Teknologi Del (IT Del)**. Prototype ini dikembangkan oleh Unit Kerja Sama sebagai bukti konsep dan dasar pengembangan sistem resmi kampus bersama Direktorat SDI / TSI.
