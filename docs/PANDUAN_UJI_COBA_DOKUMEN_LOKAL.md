# KSDAS IT DEL &bull; PANDUAN PENGUJIAN LANGSUNG (LIVE EXPERIENCE)
**Cara Mengunggah Dokumen Lokal Sendiri, Menjalankan Analisis Cerdas, dan Mengunduh Laporan Hasil Analisis di GitHub Pages**

---

**Sistem:** Kerja Sama Data & Analytics System (KSDAS)  
**Institusi:** Institut Teknologi Del, Sitoluama, Laguboti, Kabupaten Toba, Sumatera Utara  
**Author & Solution Architect:** Samuel Hasudungan Tampubolon  
**Copyright:** Copyright &copy; 2026 Samuel Hasudungan Tampubolon. All rights reserved.  
**Versi:** 0.3.0  
**URL Demo Live:** [https://samuelhtampubolon.github.io/ksdas-itdel/](https://samuelhtampubolon.github.io/ksdas-itdel/)  
**Target Pengguna:** Asesor Akreditasi, Pimpinan Kampus (Rektor, WR3), Satuan Penjaminan Mutu (SPM), Tim SDI/TSI, dan Reviewer Eksternal.

---

## 🌟 1. FILOSOFI FITUR "LIVE EXPERIENCE"

Untuk membuktikan bahwa KSDAS bukan sekadar tampilan purwarupa statis dengan data buatan (*hardcoded*), platform ini dilengkapi fitur **Live Experience**:
> **Setiap pengguna dapat mengunggah berkas naskah nyata miliknya sendiri dari komputer lokal, mengamati proses ekstraksi teks dan klasifikasi metadata secara real-time, serta mengunduh berkas laporan hasil analisis langsung ke perangkat mereka.**

Alur pengujian nyata:
$$\mathbf{UNGGAH\ (Upload)} \longrightarrow \mathbf{ANALISIS\ CERDAS\ (Analysis)} \longrightarrow \mathbf{UNDUH\ LAPORAN\ (Download)}$$

---

## 🛡️ 2. GARANSI KEAMANAN & PRIVASI DATA (CLIENT-SIDE SANDBOX)

> [!IMPORTANT]
> **Privasi Anda Terjamin 100% (Zero Server Transmission):**
> 1. **Tidak Ada Berkas yang Terkirim ke Server Luar:** Seluruh berkas yang Anda pilih diproses secara eksklusif di dalam **memori peramban Anda (Client-Side RAM)** menggunakan teknologi peramban standar *HTML5 FileReader API*.
> 2. **Pembersihan Otomatis Saat Tab Ditutup:** Berkas dan teks hasil ekstraksi yang Anda uji coba bersifat sementara (*in-memory session*). Saat tab browser ditutup atau direfresh, dokumen lokal Anda **otomatis musnah dan terhapus dari memori**.
> 3. **Aman untuk Menguji Dokumen Rahasia:** Karena tidak ada koneksi keluar yang mengirimkan isi naskah, Anda dapat menguji naskah nyata tanpa risiko kebocoran data (*zero exfiltration*).

---

## 📂 3. FORMAT BERKAS YANG DIDUKUNG

Sistem mendukung pengujian dengan format berkas umum dokumen perjanjian:
- **PDF (`.pdf`):** Naskah MoU, PKS, IA bertanda tangan digital atau hasil scan.
- **Microsoft Word (`.docx`, `.doc`):** Draft perjanjian kerja sama.
- **Teks Biasa (`.txt`, `.md`, `.rtf`):** Naskah teks polos perjanjian (sangat disarankan untuk pengujian instan).

Ukuran berkas maksimum yang diizinkan adalah **25 MB per berkas**.

---

## 🚀 4. PANDUAN LANGKAH DEMI LANGKAH (STEP-BY-STEP DALAM 1 MENIT)

Ikuti 4 langkah mudah berikut pada peramban Anda:

### Langkah 1: Buka Menu Batch Upload
1. Buka tautan resmi KSDAS: [https://samuelhtampubolon.github.io/ksdas-itdel/](https://samuelhtampubolon.github.io/ksdas-itdel/).
2. Pada bilah navigasi kiri (sidebar), klik menu **"Batch Upload AI"** (atau arahkan peramban ke tag `#batch-upload`).

### Langkah 2: Unggah Berkas Nyata dari Komputer Anda
1. Temukan kotak area abu-abu bertuliskan: **"Tarik & Letakkan File Dokumen Lokal di Sini"**.
2. Anda memiliki dua pilihan:
   - **Tarik & Letakkan (*Drag-and-Drop*):** Tarik satu atau beberapa berkas (`.pdf`, `.docx`, atau `.txt`) dari File Explorer komputer Anda dan jatuhkan ke dalam kotak tersebut.
   - **Klik untuk Memilih:** Klik kotak tersebut, dan jendela pemilihan berkas komputer Anda akan terbuka. Pilih berkas yang ingin Anda uji coba.
3. Berkas Anda akan langsung muncul pada daftar antrean dengan status awal: **`QUEUED`**.

### Langkah 3: Jalankan Analisis Cerdas Real-Time
1. Klik tombol biru: **"⚡ Mulai Ekstraksi AI & Deteksi Relasi"**.
2. Amati progress bar bergerak:
   - Sistem membaca teks berkas Anda secara lokal.
   - Mengklasifikasikan jenis naskah (MoU, PKS, IA, Proposal, LPJ).
   - Mengekstrak 26 metadata (Nomor Dokumen, Judul, Mitra, Tri Dharma, Masa Berlaku, Anggaran).
   - Menghitung *AI Confidence Score*.
3. Status antrean berkas Anda akan berubah menjadi: **`EXTRACTED`** dengan lencana warna hijau.

### Langkah 4: Unduh Laporan Hasil Analisis ke Komputer Anda
Setelah analisis selesai, Anda dapat mengunduh berkas laporan hasil analisis:
- **Opsi A (Unduh per Dokumen):** Pada baris berkas Anda di tabel antrean, klik tombol **"📥 Unduh JSON"**.
- **Opsi B (Unduh Rekap Batch):** Klik tombol **"📥 Unduh Laporan Rekapitulasi Analisis (JSON)"** yang muncul di bawah progress bar.
- **Opsi C (Melalui Modal Rincian):** Masuk ke menu *"Repositori Dokumen"*, klik judul naskah yang baru Anda unggah, dan pada jendela modal yang terbuka klik tombol **"📥 Unduh Laporan Analisis Dokumen (JSON)"**.

Periksa folder **Downloads** di komputer Anda: berkas laporan bernama `KSDAS_Analisis_[NomorDokumen].json` telah berhasil diunduh!

---

## 📑 5. CONTOH ISI BERKAS LAPORAN YANG DIUNDUH

Berikut adalah contoh struktur berkas JSON resmi yang diunduh ke komputer Anda:

```json
{
  "institution": "Institut Teknologi Del (IT Del)",
  "system": "Kerja Sama Data & Analytics System (KSDAS)",
  "reportType": "Laporan Hasil Analisis & Ekstraksi Naskah Kemitraan",
  "generatedAt": "2026-10-03T03:50:00.000Z",
  "author": "Samuel Hasudungan Tampubolon",
  "copyright": "Copyright (c) 2026 Samuel Hasudungan Tampubolon. All rights reserved.",
  "documentSummary": {
    "documentNumber": "045/ITDel/PKS-FITE/2026",
    "title": "Perjanjian Kerja Sama Pengembangan Laboratorium AI & Edge Computing",
    "type": "PKS_MOA",
    "status": "AI_EXTRACTED",
    "partnerName": "PT Solusi Teknologi Nusantara",
    "triDharma": "RESEARCH",
    "faculty": "FITE",
    "signedDate": "2026-05-10",
    "effectiveEndDate": "2029-05-10",
    "budget": 350000000.0,
    "aiConfidenceScore": 0.96
  },
  "accreditationMapping": {
    "banPtCriterion": "Kriteria 1 & Kriteria Tri Dharma (C.1.b, C.6, C.7, C.8)",
    "lamInfokomCriterion": "Kriteria C.1.4 (Tata Pamong & Kerjasama)",
    "iku6Target": "Kerja Sama Program Studi dengan Mitra Kelas Dunia"
  },
  "verificationHash": "SHA256:7B8F9A1C2D3E4F5A",
  "privacyNotice": "Dokumen ini dianalisis 100% di memori peramban (Client-Side In-Memory). Tidak ada berkas yang dikirim ke server luar."
}
```

---

## ❓ 6. PERTANYAAN UMUM (FAQ)

**Q: Apakah data naskah asli saya akan tersimpan selamanya di GitHub Pages?**  
*A: Tidak. Sesuai prinsip keamanan data, GitHub Pages hanya melayani antarmuka web statis. Seluruh berkas yang Anda pilih diproses di memori RAM peramban Anda. Ketika tab peramban ditutup, memori tersebut otomatis dikosongkan.*

**Q: Mengapa saya perlu mengunduh laporan analisis?**  
*A: Laporan yang diunduh merupakan bukti nyata bahwa algoritma KSDAS telah berhasil membaca, menstrukturkan, dan memetakan dokumen Anda ke dalam standar instrumen akreditasi BAN-PT, LAM-INFOKOM, dan IKU 6.*

**Q: Bagaimana jika saya ingin data naskah tersimpan permanen di server kampus IT Del?**  
*A: Ketika tim SDI/TSI IT Del menerapkan KSDAS pada server intranet kampus menggunakan `docker-compose.yml`, sistem akan terhubung langsung ke basis data resmi PostgreSQL kampus dan Object Storage MinIO untuk penyimpanan permanen jangka panjang.*

---
*Panduan ini merupakan bagian dari repositori resmi KSDAS IT Del Versi 0.3.0 &bull; Hak Cipta &copy; 2026 Samuel Hasudungan Tampubolon.*
