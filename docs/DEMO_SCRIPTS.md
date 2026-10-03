# KSDAS IT DEL - PANDUAN PENGUJIAN PENERIMAAN (DEMO SCRIPTS)

Dokumen ini memandu pengujian fungsional dan demonstrasi langsung KSDAS IT Del sesuai dengan 4 skenario acceptance criteria:

---

## SKENARIO A: BATCH UPLOAD, EKSTRAKSI AI & VALIDASI STAF

**Tujuan:** Menguji pengunggahan berkas sekaligus, klasifikasi otomatis, ekstraksi 26 metadata field, usulan relasi parent, dan persetujuan staf.

### Langkah Pengujian:
1. Pastikan peran di header atas terpilih sebagai: **`Staff Unit Kerja Sama`**.
2. Klik menu **Batch Upload Dokumen** di sidebar kiri (atau rute `#batch-upload`).
3. Klik tombol biru: **"🧪 Muat 10 Dokumen Sampel Demo (Scenario A)"**.
   - Sistem akan memuat antrean 10 berkas simulasi (3 MoU, 4 PKS, 1 IA, 1 Proposal, 1 Laporan Akhir).
4. Klik tombol: **"⚡ Mulai Ekstraksi & Deteksi Relasi"**.
   - Amati bilah progres (*progress bar*) yang berjalan dinamis dan indikator tahapan:
     - Deteksi format berkas & tipe dokumen;
     - Ekstraksi 26 field metadata;
     - Pencarian relasi dokumen induk;
     - Perhitungan tingkat akurasi dan *quality flags*.
   - Dokumen tersimpan dengan status awal: `TEREKSTRAKSI`.
5. Klik tombol: **"Buka Workspace Validasi Manual (10 dokumen) &rarr;"**.
   - Sistem berpindah ke `#validation`.
   - Amati daftar dokumen yang menunggu tinjauan staf.
6. Pada salah satu dokumen berkeyakinan tinggi, klik **"Review & Validasi Side-by-Side"**:
   - Amati tampilan dua panel:
     - **Panel Kiri:** Salinan teks naskah / OCR preview.
     - **Panel Kanan:** 26 metadata field hasil ekstraksi yang dapat dikoreksi.
   - Klik tombol hijau: **"Setujui sebagai Data Resmi (Approve)"**.
7. Untuk mempercepat validasi berkas lain dengan keyakinan di atas 90%, klik tombol:  
   **"Setujui Sekaligus Confidence Tinggi (≥ 90%)"**.
8. Buka menu **Dashboard** (`#dashboard`):
   - Seluruh metrik KPI (Total MoU, Total PKS, Komitmen Anggaran) langsung terbarui secara instan.

---

## SKENARIO B: PENYARINGAN DINAMIS MULTIDIMENSI (DYNAMIC FILTER)

**Tujuan:** Menguji kemampuan sistem menyaring dokumen kerja sama berdasarkan kombinasi kriteria spesifik secara instan.

### Langkah Pengujian:
1. Klik menu **Repositori Dokumen** di sidebar kiri (`#repository`).
2. Masukkan parameter penyaringan berikut pada bilah filter:
   - **Jenis Dokumen:** `PKS / MoA`
   - **Tri Dharma:** `Penelitian`
   - **Tahun:** `2026`
3. Amati perubahan tabel repositori:
   - Dokumen yang tampil adalah:  
     `007/ITDel/PKS/FITE/I/2026 - Perjanjian Kerja Sama Riset Terapan Kecerdasan Buatan untuk Otomasi Pemantauan Industri 2026` (Mitra: PT Astra International Tbk).
4. Klik tombol **"Detail"**:
   - Modal rincian terbuka menampilkan seluruh metadata, luaran yang diharapkan (Model deteksi akurasi >98%), realisasi, dan PIC IT Del.
5. Klik tombol **"Reset Filter"** untuk mengembalikan tampilan ke seluruh data repositori.

---

## SKENARIO C: PEMERIKSAAN BUKTI MUTU OLEH SPM (ACCREDITATION DEMO)

**Tujuan:** Menguji alur penjaminan mutu dan pemetaan naskah kemitraan ke instrumen akreditasi resmi.

### Langkah Pengujian:
1. Ganti peran pengguna di header atas menjadi: **`SPM (Satuan Penjaminan Mutu)`**.
2. Klik menu **Akreditasi & AMI** di sidebar kiri (`#accreditation`).
3. Pada pilihan instrumen akreditasi, pilih: **`LAM-INFOKOM (Informatika & Komputer)`**.
4. Cari indikator:  
   `C.1.4.a - Kerja Sama Bidang Pendidikan & Sertifikasi Kompetensi`.
5. Klik tombol **"Filter Data"** di sebelah kanan indikator:
   - Repositori otomatis terbuka menampilkan dokumen Huawei ICT Academy dan program sertifikasi terkait.
6. Buka menu **Aktivitas & Evidence** (`#activities`):
   - Amati kartu bukti fisik:  
     `Sertifikat HCIA Datacom 54 Mahasiswa Angkatan 2021` dengan label **TERVERIFIKASI**.

---

## SKENARIO D: MONITORING EKSEKUTIF OLEH WAKIL REKTOR 3 (WR3)

**Tujuan:** Menguji ketersediaan informasi strategis, pemantauan masa berlaku, dan pencegahan dokumen pasif.

### Langkah Pengujian:
1. Ganti peran pengguna di header atas menjadi: **`Wakil Rektor III (Kemitraan)`**.
2. Buka menu **Dashboard** (`#dashboard`):
   - Amati banner peringatan: Dokumen kedaluwarsa dan dokumen tanpa induk (*orphan*).
   - Tinjau **Implementation Funnel** yang menggambarkan konversi dari pendaftaran mitra hingga laporan akhir.
3. Klik menu **Analitik Eksekutif** (`#analytics`):
   - Amati tabel **Cross-Tabulation**: Sebaran naskah pada Fakultas Informatika & Elektro (FITE), Fakultas Teknologi Industri (FTI), dan Fakultas Bioteknologi (FB).
   - Tinjau tabel **Expiry Monitoring Timeline**: Dokumen dengan masa berlaku kritis (< 30 hari dan < 90 hari) disorot dengan warna kuning dan merah.
   - Tinjau tabel **Follow-up Gap Analysis**: MoU yang belum memiliki PKS turunan ditandai dengan rekomendasi tindak lanjut proaktif.
4. Klik menu **Generator Laporan** (`#reports`):
   - Pilih preset: **"Laporan Eksekutif Capaian Kemitraan"**.
   - Tinjau draf laporan resmi lengkap dengan lembar pengesahan Rektor dan Kepala Unit Kerja Sama.
   - Klik tombol **"🖨️ Cetak / Unduh PDF"** untuk menguji cetak dokumen berstandar institutional.
