# Panduan Uji Coba Dokumen Sendiri — KSDAS IT Del

Dokumen ini memandu staf, Dekan, Kaprodi, dan pimpinan dalam menguji coba alur operasional Sistem Informasi Kerja Sama (KSDAS) Institut Teknologi Del, baik pada versi Web (GitHub Pages / Lokal) maupun versi Desktop Standalone (`.EXE`).

> **Pemberitahuan Keamanan**: Demo peramban publik GitHub Pages bersifat publik untuk pengujian alur antarmuka. Jangan mengunggah naskah asli yang memuat data pribadi sensitif atau klausul rahasia ke demo publik. Untuk naskah dinas, gunakan server lokal intranet kampus atau aplikasi desktop portabel (`KSDAS_ITDel.exe`).

---

## 1. Alur Kerja Staf Unit Kerja Sama & Ekstraksi Cerdas (OCR)

Alur operasional staf menggabungkan **Modul Ekstraksi Cerdas & OCR Lokal** untuk membaca berkas fisik pindaian (scan/gambar), Word (`.docx`), PDF, atau berkas ringkasan, yang kemudian **diverifikasi, divalidasi, dan dilengkapi secara manual oleh Staf** untuk memastikan data 100% valid dan presisi.

```
[Unggah Berkas Naskah (Scan/Gambar, PDF, Word .docx, Teks)] 
       ↓ 
[Modul Ekstraksi Cerdas & OCR Berjalan di Klien/Lokal] 
       ↓ 
[Pendeteksian Entitas Naskah Otomatis]:
  ├─ Nomor Dokumen (MoU / PKS / IA IT Del & Mitra)
  ├─ Judul Kerja Sama (ekstraksi kepala naskah & klausul "TENTANG")
  ├─ Penandatangan & Gelar (Pembeda cerdas: orang asli vs nama lembaga)
  ├─ Kategori Fakultas & Program Studi (FITE, FTI, FB, Vokasi)
  ├─ Klasifikasi Tri Dharma (Pendidikan, Penelitian, Pengabdian)
  ├─ Masa Berlaku & Periode (Tanggal Mulai, Berakhir, Durasi Tahun)
  └─ Nilai Anggaran & Lokasi Pelaksanaan
       ↓ 
[Formulir Terisi Otomatis dengan Label Badge: "Terdeteksi Cerdas"] 
       ↓ 
[Tahap Krusial: Verifikasi & Validasi Manual oleh Staf]:
  ├─ Staf meneliti kesesuaian draf isian dengan fisik dokumen
  ├─ Staf melengkapi detail spesifik (pasal, rekening, klausul khusus)
  └─ Staf menetapkan status naskah (Draf / Aktif)
       ↓ 
[Validasi Aturan & Simpan ke Basis Data]
```

### Langkah Pengujian Staf:
1. Masuk ke aplikasi dan pilih peran **Staf Unit Kerja Sama**.
2. Klik menu **Catat**.
3. **Uji Coba Ekstraksi Cerdas & OCR Berkas**:
   - Klik **"📂 Pilih Berkas / Scan..."** untuk memilih berkas naskah Anda sendiri (`.docx`, `.pdf`, `.png`, `.jpg`, `.txt`, `.csv`).
   - Sistem akan memproses berkas, menjalankan pemindaian teks dan ekstraksi pola semantik lokal.
   - *Alternatif Uji Coba Cepat Tanpa Menyiapkan Berkas*: Klik tombol **"⚡ Coba Sampel MoU Pemkab Toba"** atau **"⚡ Coba Sampel PKS FITE"**.
4. **Pemeriksaan Hasil Deteksi Cerdas**:
   - Kotak status ekstraksi menampilkan ringkasan entitas yang berhasil diidentifikasi (Nomor naskah, Judul, Mitra, Penandatangan, Fakultas/Prodi, Tri Dharma, Masa Berlaku, Nilai).
   - Seluruh field formulir yang berhasil dikenali otomatis akan terisi dan ditandai dengan lencana hijau `<span class="badge-detected">Terdeteksi Cerdas</span>`.
5. **Verifikasi dan Penyempurnaan Manual oleh Staf**:
   - Staf membaca naskah dan memeriksa apakah gelar atau jabatan penandatangan sudah sesuai.
   - Staf menambahkan detail pelaksana, catatan ruang lingkup, atau PIC internal jika diperlukan.
   - Fitur otomatisasi ini menghemat 90% waktu ketik, namun **otoritas keabsahan data sepenuhnya berada di tangan Staf Unit Kerja Sama**.
6. **Validasi & Simpan**:
   - Sistem melakukan pengecekan aturan bisnis (tanggal berakhir >= tanggal mulai, kelengkapan field wajib).
   - Status dapat disimpan sebagai **Draf** kapan saja, atau ditandai **Aktif** setelah field wajib lengkap.
   - Klik **"Simpan Naskah"**. Dokumen langsung tersimpan dan tercatat di repositori naskah.

---

## 2. Alur Migrasi Data (Google Sheets, OneDrive, Notion)

Bagi Unit Kerja Sama yang sebelumnya mengelola data di cloud pihak ketiga:

1. Buka menu **Impor & Migrasi Data Kemitraan**.
2. **Cara Migrasi dari Google Sheets**:
   - Buka Google Sheets naskah kerja sama &rarr; *File* &rarr; *Download* &rarr; *Comma-separated values (.csv)*.
   - Klik tombol **"📂 Pilih berkas Spreadsheet (CSV / TSV / TXT)"** di KSDAS untuk langsung membaca berkas.
   - *Alternatif*: Blok tabel di Google Sheets &rarr; Tekan Ctrl+C &rarr; Tempel di kotak teks KSDAS &rarr; Klik **"Baca tempelan"**.
3. **Cara Migrasi dari Microsoft OneDrive / Office 365**:
   - Buka lembar kerja di OneDrive &rarr; *File* &rarr; *Save As / Export* &rarr; *Download a copy (.csv)* &rarr; Unggah ke KSDAS.
4. **Cara Migrasi dari Notion**:
   - Buka database Notion &rarr; Menu titik tiga (...) &rarr; *Export* &rarr; *Markdown & CSV* &rarr; Masukkan ke KSDAS.
5. Sistem memetakan 28 alias nama kolom Indonesia, mendeteksi mitra yang sudah ada, mencegah duplikasi nomor naskah, dan memasukkan data ke basis data lokal.

---

## 3. Alur Kerja Dekan & Kaprodi

Dekan dan Kaprodi difasilitasi untuk melakukan pemantauan, penyaringan, seleksi, unduhan, dan pelaporan eksekutif:

```
[Search & Filter Naskah] → [Sort Kolom] → [Select Checkbox] → [Download / Generate Analisis]
```

### Langkah Pengujian Dekan / Kaprodi:
1. Ganti peran tampilan menjadi **Dekan FITE**, **Dekan FB**, atau **Kaprodi S1 Informatika**.
2. Buka menu **Naskah**:
   - Data otomatis terfilter sesuai lingkup fakultas/prodi yang berwenang.
3. **Pencarian & Penyaringan (Filter)**:
   - Gunakan kotak **Cari** untuk mencari nomor dokumen, judul, mitra, atau nama PIC.
   - Gunakan dropdown **Tahun** untuk menyaring naskah tahun tertentu.
   - Gunakan dropdown **Jenis** untuk menyaring MoU, PKS, IA, Proposal, atau Laporan.
   - Gunakan dropdown **Status** untuk menyaring naskah *Aktif*, *Akan Berakhir (≤ 180 hari)*, *Berakhir*, atau *Draf*.
4. **Pengurutan (Sort)**:
   - Klik kepala kolom tabel (**Nomor**, **Judul**, **Mitra**, **Status**, atau **Berakhir**) untuk mengurutkan data naik (*ascending*) atau turun (*descending*).
5. **Seleksi Multi-Naskah (Checkboxes)**:
   - Centang kotak di samping nomor naskah untuk memilih satu atau beberapa dokumen tertentu.
   - Centang kotak di header tabel untuk memilih seluruh naskah di layar.
   - Bilah aksi **"X naskah terpilih"** akan muncul otomatis dengan opsi aksi terfokus.
6. **Unduh Naskah (Download)**:
   - **Unduh CSV**: Untuk olah data lanjut di lembar kerja.
   - **Unduh Excel (.xls)**: Tabel berformat rapi dengan warna institusional IT Del, siap dibuka langsung di Microsoft Excel.
   - **Unduh Word (.doc)**: Dosir resmi naskah kerja sama ber-kop surat Yayasan Del - Institut Teknologi Del dan tanda tangan Rektor.
7. **Generate Analisis Kemitraan**:
   - Klik tombol **"Generate Analisis Terpilih"** (atau **"Generate Analisis"** untuk seluruh hasil saringan).
   - Sistem menampilkan rekapitulasi status masa berlaku, sebaran jenis naskah, dan peringatan kesenjangan tindak lanjut (MoU yang belum memiliki PKS turunan, dsb).
   - Klik **"Unduh Laporan Analisis Resmi (.doc)"** untuk mencetak laporan analisis eksekutif siap serah ke Rektorat / SPM.

---

## 4. Alur Kerja Wakil Rektor 3 (WR3)

1. Pilih peran **Wakil Rektor 3**.
2. Di **Beranda**, pantau kartu statistik:
   - Total naskah terlihat
   - Naskah aktif
   - Naskah perlu perhatian (akan berakhir dalam 180 hari atau telah lewat masa berlaku)
   - Kesenjangan tindak lanjut implementasi
3. Buka menu **Relasi** untuk melihat pohon silsilah naskah per mitra (MoU &rarr; PKS &rarr; IA &rarr; Proposal &rarr; Laporan).

---

## 5. Pengujian Versi Desktop Standalone (.EXE)

1. Pada komputer bersistem operasi Windows, buka folder repository.
2. Klik ganda berkas **`KSDAS_ITDel.exe`**.
3. Aplikasi desktop terbuka seketika tanpa memerlukan instalasi Node.js, Python, ataupun koneksi internet.
4. **Fitur Ekstraksi Cerdas & OCR Desktop**:
   - Klik tombol **"🔍 Ekstraksi Cerdas & OCR"** pada toolbar utama untuk memindai berkas naskah lokal.
   - Tinjau hasil ekstraksi pada dialog pratinjau, lalu klik **"Gunakan pada Formulir"**.
   - Periksa dan sesuaikan setiap kolom sebelum menekan **Simpan**.
5. Data tersimpan secara persisten di file **`ksdas_desktop_database.json`** pada folder yang sama.
6. Coba tambahkan naskah baru, tutup aplikasi, dan buka kembali: data yang baru ditambahkan tetap tersimpan rapi di disk lokal komputer.
