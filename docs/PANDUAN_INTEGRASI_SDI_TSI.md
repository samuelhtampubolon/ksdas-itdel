# Panduan Integrasi Sistem untuk SDI / TSI / DukTek IT Del

Dokumen teknis ini ditujukan bagi Direktorat / Unit Pengelola Sistem Informasi dan Teknologi (SDI / TSI / DukTek) Institut Teknologi Del untuk integrasi, migrasi data, dan pengoperasian KSDAS di lingkungan server lokal kampus.

---

## 1. Pemisahan Tanggung Jawab

| Entitas | Peran & Tanggung Jawab |
| --- | --- |
| **Unit Kerja Sama (UKS)** | Menentukan kamus data naskah, siklus hidup dokumen, validasi klausul, dan verifikasi kelengkapan dosir fisik/digital. |
| **Pimpinan (WR3, Dekan, Kaprodi)** | Memantau masa berlaku, mengevaluasi ketercapaian Tri Dharma, menindaklanjuti perpanjangan kemitraan, dan memanfaatkan laporan analisis. |
| **SDI / TSI / DukTek** | Menyediakan infrastruktur server lokal (on-premise), sistem operasi, basis data PostgreSQL, proteksi jaringan, SSO kampus, dan cadangan (*backup*). |

---

## 2. Strategi Migrasi Data dari Google Sheets, OneDrive, dan Notion

Saat ini informasi kerja sama tersebar di Google Sheets, Google Drive, Microsoft OneDrive, dan Notion. Strategi migrasi yang diimplementasikan adalah **migrasi satu arah terstruktur ke server lokal KSDAS**:

```
[Google Sheets / OneDrive / Notion]
         │ (Ekspor CSV / Salin Range Tabel)
         ▼
[Modul Impor & Migrasi Tabel KSDAS]
         │ (Deterministic Field Mapping - 28 Alias Kolom)
         ▼
[Validasi Duplikasi Nomor & Konsistensi Tanggal]
         ▼
[Basis Data Server Lokal IT Del (PostgreSQL / JSON Persisten)]
```

### Mekanisme Pemetaan Kolom Deterministik:
Sistem menggunakan kamus `HEADER_ALIASES` untuk mengenali kolom Indonesia umum dari spreadsheet:
- **Nomor Naskah**: `nomor`, `no dokumen`, `nomor dokumen`, `nomor naskah`
- **Jenis**: `jenis`, `jenis naskah`, `tipe dokumen` (dipetakan ke enum `MOU_LOI`, `PKS_MOA`, `IA`, `PROPOSAL`, `LAPORAN`)
- **Judul**: `judul`, `judul naskah`
- **Mitra**: `mitra`, `nama mitra`, `jenis mitra`, `kota`, `negara`
- **Masa Berlaku**: `tanggal mulai`, `mulai berlaku`, `tanggal berakhir`, `akhir berlaku`
- **Struktur Akademik**: `fakultas`, `program studi`, `prodi`, `unit`, `tri dharma`
- **Operasional**: `pic`, `penanggung jawab`, `kegiatan`, `penandatangan mitra`, `penandatangan it del`

Setelah proses migrasi massal selesai:
- **Google Sheets dan Notion dinonaktifkan** sebagai media pembaruan data naskah.
- Seluruh pembaruan harian dilakukan langsung di KSDAS server lokal kampus.

---

## 3. Alur Operasional Sistem

### A. Alur Staf Unit Kerja Sama:
1. **Unggah Berkas**: Dokumen fisik yang dipindai (PDF) atau dosir digital diunggah sebagai lampiran dan memperoleh identitas unik (`DOC-XXXXXX`).
2. **Default Sistem Otomatis**: Formulir metadata terbuka dengan nilai-nilai institusional yang sudah terisi otomatis (Penandatangan IT Del: Dr. Arnaldo Sinaga, Rektor IT Del; Tanggal mulai: hari ini; Lokasi: Laguboti; Unit: UKS).
3. **Pintasan Otomatisasi Staf**: Staf dapat memilih berkas ringkasan (.csv/.txt) atau menempel teks ringkasan untuk mengisikan puluhan field formulir naskah dalam satu klik.
4. **Kelengkapan Manual**: Staf melengkapi sisa data yang spesifik (nomor klausul, anggaran, PIC khusus).
5. **Validasi Tanggal & Duplikasi**: Sistem secara ketat menolak tanggal berakhir yang mendahului tanggal mulai dan nomor naskah ganda.

### B. Alur Dekan & Kaprodi:
1. **Otorisasi Lingkup (RBAC)**: Tampilan terisolasi hanya pada naskah yang melibatkan fakultas atau program studi bersangkutan (misal FITE atau S1 Informatika).
2. **Pencarian Real-Time**: Pencarian teks bebas pada nomor, judul, mitra, dan nama kegiatan.
3. **Saringan Multi-Parameter**: Filter tahun, jenis naskah, dan status masa berlaku.
4. **Seleksi Multi-Naskah**: Fitur checkbox master dan checkbox per baris untuk memilih naskah secara selektif.
5. **Ekspor Multi-Format**:
   - **CSV**: Kompatibel dengan spreadsheet.
   - **Excel (`.xls`)**: Berformat tabel rapi berdesain institusional IT Del.
   - **Word (`.doc`)**: Format dosir naskah ber-Kop Surat resmi Yayasan Del - Institut Teknologi Del.
6. **Laporan Analisis Eksekutif**: Menghasilkan resume status, jenis naskah, kesenjangan tindak lanjut, dan rekomendasi pimpinan siap cetak/unduh ke Word.

---

## 4. Spesifikasi Antarmuka API Backend (`/api/v1/`)

Rekomendasi endpoint untuk backend produksi di server kampus:

```http
POST   /api/v1/documents           # Menyimpan naskah baru & referensi lampiran
GET    /api/v1/documents           # Mengambil daftar naskah (filter: tahun, mitra, status, fakultas, prodi)
GET    /api/v1/documents/{id}      # Mengambil rincian naskah lengkap
PATCH  /api/v1/documents/{id}      # Memperbarui metadata naskah oleh staf
POST   /api/v1/documents/autofill  # Memetakan data dari file ringkasan Excel/Word
POST   /api/v1/imports/spreadsheet # Impor massal baris tabel dari ekspor Google Sheets/Notion
GET    /api/v1/analytics/summary   # Menghasilkan rekap statistik & kesenjangan relasi
GET    /api/v1/health              # Pemantauan ketersediaan layanan
```

Setiap endpoint mutasi data wajib memverifikasi token sesi pengguna, hak akses berbasis peran, dan mencatat jejak ke tabel `audit_logs`.

---

## 5. Kepastian Sistem (Zero AI/ML/OCR & Zero TPL)

- Sistem ini murni **Sistem Informasi Manajemen konvensional berbasis aturan deterministik** dan basis data relasional.
- Tidak ada panggilan ke API LLM pihak ketiga atau engine OCR eksternal.
- Tidak ada data naskah institusi yang dikirim ke penyedia awan luar.
- Bebas total dari entitas yang tidak relevan dengan tridharma akademik IT Del.
