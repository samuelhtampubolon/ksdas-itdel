# KSDAS IT DEL &bull; PANDUAN PENGUJIAN LANGSUNG (LIVE EXPERIENCE)
**Cara Mengunggah Dokumen Lokal Sendiri, Menjalankan Ekstraksi Otomatis, Melakukan Validasi Manual, dan Mengunduh Berkas Resmi (Word, Excel, PDF) di GitHub Pages**

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
> **Setiap pengguna dapat mengunggah berkas naskah nyata miliknya sendiri dari komputer lokal, mengamati proses ekstraksi teks dan klasifikasi metadata secara instan, melakukan verifikasi melalui Validasi Manual, serta mengunduh berkas resmi dalam format Word (.doc), Excel (.xls), atau PDF (.pdf) langsung ke perangkat mereka.**

Alur pengujian nyata:
$$\mathbf{UNGGAH\ DOKUMEN} \longrightarrow \mathbf{EKSTRAKSI\ OTOMATIS} \longrightarrow \mathbf{VALIDASI\ MANUAL} \longrightarrow \mathbf{UNDUH\ BERKAS\ RESMI\ (Word/Excel/PDF)}$$

---

## 🛡️ 2. GARANSI KEAMANAN & PRIVASI DATA (CLIENT-SIDE SANDBOX)

> [!IMPORTANT]
> **Privasi Anda Terjamin 100% (Zero Server Transmission):**
> 1. **Tidak Ada Berkas yang Terkirim ke Server Luar:** Seluruh berkas yang Anda pilih diproses secara eksklusif di dalam **memori peramban Anda (Client-Side RAM)** menggunakan teknologi peramban standar *HTML5 FileReader API*.
> 2. **Pembersihan Otomatis Saat Tab Ditutup:** Berkas dan teks hasil ekstraksi yang Anda uji coba bersifat sementara (*in-memory session*). Saat tab browser ditutup atau direfresh, dokumen lokal Anda **otomatis musnah dan terhapus dari memori**.
> 3. **Aman untuk Menguji Dokumen Rahasia:** Karena tidak ada koneksi keluar yang mengirimkan isi naskah, Anda dapat menguji naskah nyata tanpa risiko kebocoran data (*zero exfiltration*).

---

## ⚖️ 3. KEAMANAN DETEKSI IDENTITAS & ZERO-HALUSINASI NAMA

Dalam dokumen hukum dan perjanjian institusi, identitas pejabat penandatangan (*signatories*) memiliki konsekuensi hukum nyata (*legal liability*). KSDAS menerapkan prinsip ketat:
1. **Pengenalan Gelar & Pola Penandatangan:** Sistem mendeteksi nama dan jabatan dari blok tanda tangan ("PIHAK PERTAMA", "PIHAK KEDUA", "Nama:", "Jabatan:") serta memvalidasi gelar akademik resmi Indonesia (`Prof.`, `Dr.`, `Ir.`, `S.T.`, `M.T.`, `Ph.D.`, `S.Kom.`, dll.).
2. **Penyaringan Entitas vs Orang:** Kata korporat dan badan hukum (`PT`, `CV`, `Yayasan`, `Universitas`, `Kementerian`) secara otomatis disaring sehingga tidak pernah salah diidentifikasi sebagai nama orang.
3. **Dilarang Mengarang Nama (Zero Hallucination):** Jika naskah yang diunggah tidak mencantumkan nama penandatangan secara eksplisit, sistem **dilarang menebak secara sembarangan** dan wajib menandainya sebagai `"Perlu Verifikasi Manual"`. Staf verifikator dapat memeriksa lembar tanda tangan fisik/PDF dan mengetikkan nama pejabat yang sah pada Workspace Validasi Manual.

---

## 📂 4. FORMAT BERKAS YANG DIDUKUNG

Sistem mendukung pengujian dengan format berkas umum dokumen perjanjian:
- **PDF (`.pdf`):** Naskah MoU, PKS, IA bertanda tangan digital atau hasil scan.
- **Microsoft Word (`.docx`, `.doc`):** Draft perjanjian kerja sama (teks diekstrak langsung di memori).
- **Teks Biasa (`.txt`, `.md`, `.rtf`):** Naskah teks polos perjanjian (sangat disarankan untuk pengujian instan).

Ukuran berkas maksimum yang diizinkan adalah **25 MB per berkas**.

---

## 🚀 5. PANDUAN LANGKAH DEMI LANGKAH (STEP-BY-STEP)

Ikuti 4 langkah mudah berikut pada peramban Anda:

### Langkah 1: Buka Menu Batch Upload Dokumen
1. Buka tautan resmi KSDAS: [https://samuelhtampubolon.github.io/ksdas-itdel/](https://samuelhtampubolon.github.io/ksdas-itdel/).
2. Pada bilah navigasi kiri (sidebar), klik menu **"Batch Upload Dokumen"** (atau arahkan peramban ke tag `#batch-upload`).

### Langkah 2: Unggah Berkas Nyata dari Komputer Anda
1. Temukan kotak area upload bertuliskan: **"Tarik & Letakkan File Dokumen Lokal di Sini"**.
2. Anda memiliki dua pilihan:
   - **Tarik & Letakkan (*Drag-and-Drop*):** Tarik satu atau beberapa berkas (`.pdf`, `.docx`, atau `.txt`) dari File Explorer komputer Anda dan jatuhkan ke dalam kotak tersebut.
   - **Klik untuk Memilih:** Klik kotak tersebut, dan jendela pemilihan berkas komputer Anda akan terbuka. Pilih berkas yang ingin Anda uji coba.
   - *Alternatif Demo Cepat:* Klik tombol **"🧪 Muat 10 Dokumen Sampel Demo"** untuk menguji antrean berkas siap pakai.
3. Berkas Anda akan langsung muncul pada daftar antrean dengan status awal: **`QUEUED`**.

### Langkah 3: Jalankan Ekstraksi & Deteksi Relasi
1. Klik tombol biru: **"⚡ Mulai Ekstraksi & Deteksi Relasi"**.
2. Amati progress bar bergerak:
   - Sistem membaca teks berkas Anda secara lokal.
   - Mengklasifikasikan jenis naskah (MoU, PKS, IA, Proposal, LPJ).
   - Mengekstrak 26 metadata (Nomor Dokumen, Judul, Mitra, Tri Dharma, Penandatangan, Masa Berlaku, Anggaran).
   - Menghitung **Tingkat Akurasi**.
3. Status antrean berkas Anda akan berubah menjadi: **`TEREKSTRAKSI`** dengan lencana warna hijau.

### Langkah 4: Validasi Manual & Unduh Berkas Resmi
Setelah analisis selesai, Anda dapat langsung mengunduh luaran resmi atau membukanya di Workspace Validasi Manual:
1. **Pilihan Unduhan Dokumen Tunggal:**
   - Klik tombol **📘 Word** pada baris dokumen untuk mengunduh Dosir Resmi IT Del (`.doc`).
   - Klik tombol **📗 Excel** untuk mengunduh Spreadsheet 26 Field Metadata (`.xls`).
   - Klik tombol **📕 PDF** untuk memicu dialog cetak / Simpan sebagai PDF (`.pdf`).
2. **Pilihan Unduhan Rekapitulasi Batch:**
   - Klik tombol **"📥 Unduh Rekap (Excel / Word)"** untuk mengunduh matriks seluruh berkas yang telah diproses.
3. **Penyelarasan ke Data Resmi Institusi:**
   - Klik tombol **"🛡️ Validasi Manual"** untuk meninjau naskah berdampingan dengan teks asli, mengoreksi data bila diperlukan, dan menetapkan status sebagai data resmi institusi.

---

## 📑 6. CIRI FORMAT BERKAS RESMI YANG DIUNDUH

1. **Microsoft Word (`.doc`):**
   - Dilengkapi **Kop Surat Resmi IT Del** (Yayasan Del & Institut Teknologi Del).
   - Memuat nomor naskah, judul, status validasi, dan ruang lingkup.
   - Tabel 26 metadata terverifikasi bergaris rapi.
   - Kotak tanda tangan para pihak (Pihak Pertama: IT Del, Pihak Kedua: Mitra).
   - Catatan integritas hak cipta & stempel waktu verifikasi.
2. **Microsoft Excel (`.xls`):**
   - Header institusional resmi IT Del.
   - Ringkasan naskah dan tabel kolom 26 field dengan tingkat akurasi dan metode deteksi.
   - Format rekapitulasi batch menyediakan kolom lengkap nomor, mitra, masa berlaku, anggaran, dan pemetaan kriteria akreditasi (BAN-PT, LAM-INFOKOM, IKU-6).
3. **Cetak / Simpan PDF (`.pdf`):**
   - Tampilan lembar verifikasi akreditasi SPM/AMI berstandar cetak A4.
   - Siap dilampirkan langsung sebagai bukti fisik (evidence) akreditasi program studi.

---

## ❓ 7. PERTANYAAN UMUM (FAQ)

**Q: Apakah data naskah asli saya akan tersimpan selamanya di GitHub Pages?**  
*A: Tidak. Sesuai prinsip keamanan data, GitHub Pages hanya melayani antarmuka web statis. Seluruh berkas yang Anda pilih diproses di memori RAM peramban Anda. Ketika tab peramban ditutup, memori tersebut otomatis dikosongkan.*

**Q: Mengapa unduhan menggunakan format Word, Excel, dan PDF (bukan JSON mentah)?**  
*A: Karena pimpinan universitas, auditor SPM/AMI, dan asesor BAN-PT / LAM-INFOKOM memerlukan berkas resmi siap cetak dan siap olah yang dapat dibuka secara native di Microsoft Office dan pembaca PDF tanpa alat teknis khusus.*

**Q: Bagaimana jika saya ingin data naskah tersimpan permanen di server kampus IT Del?**  
*A: Ketika tim SDI/TSI IT Del menerapkan KSDAS pada server intranet kampus menggunakan `docker-compose.yml`, sistem akan terhubung langsung ke basis data resmi PostgreSQL kampus dan Object Storage MinIO untuk penyimpanan permanen jangka panjang.*

---
*Panduan ini merupakan bagian dari repositori resmi KSDAS IT Del Versi 0.3.0 &bull; Hak Cipta &copy; 2026 Samuel Hasudungan Tampubolon.*
