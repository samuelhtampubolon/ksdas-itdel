# KSDAS IT Del

Sistem informasi pencatatan kerja sama untuk Unit Kerja Sama Institut Teknologi Del.

Prototipe ini menunjukkan alur kerja. Ia **bukan** server produksi, **bukan** pemindai dokumen, dan **tidak** memakai AI, ML, atau OCR.

Demo: [https://samuelhtampubolon.github.io/ksdas-itdel/](https://samuelhtampubolon.github.io/ksdas-itdel/)

- [Panduan uji coba dokumen sendiri](docs/PANDUAN_UJI_COBA_DOKUMEN_LOKAL.md)
- [Panduan delivery dan deployment](docs/PANDUAN_DELIVERY_DEPLOYMENT.md)
- [Panduan integrasi SDI/TSI](docs/PANDUAN_INTEGRASI_SDI_TSI.md)

## Mengapa bukan Google Sheets, Drive, OneDrive, atau Notion

Berkas kerja sama yang tersebar di akun pribadi tidak punya nomor induk yang konsisten, tidak menghitung masa berlaku, dan tidak membatasi dekan atau kaprodi pada fakultas atau prodi mereka. KSDAS dimaksudkan sebagai pengganti pencatatan itu di server kampus. Alat awan itu tidak disambungkan. Data dipindahkan sekali, lalu diperbarui di KSDAS.

## Yang dilakukan staf

1. Unggah berkas. Berkas tercatat sebagai lampiran. Isi PDF tidak dibaca.
2. Formulir terbuka. Sistem mengisi jenis, nomor, atau mitra hanya bila nama berkas sudah cocok dengan aturan atau master mitra.
3. Staf mengisi kolom yang masih kosong dan menyimpan.
4. Jika datanya sudah berupa tabel di Sheets, Excel, atau Word, salin tabel itu lalu tempel di menu Impor. Kolom yang dikenali terisi. Sisanya dilengkapi manual.

## Yang dilakukan dekan dan kaprodi

Mereka tidak mengubah master. Mereka mencari, menyaring, mengurutkan, dan mengunduh data pada fakultas atau program studi sendiri, lalu membuat analisis dari tampilan itu.

## Yang dihitung otomatis

- Masa berlaku dan status akan berakhir atau sudah berakhir.
- Duplikat nomor dokumen.
- Kesenjangan tindak lanjut, misalnya MoU yang masih berjalan belum punya PKS.
- Saran satu induk, hanya bila ada tepat satu kandidat. Staf yang menekan “Pakai saran”.
- Rekap dari saringan yang sedang aktif.

Angka itu adalah hitungan data, bukan penilaian mutu institusi.

## Data contoh

Ada sepuluh naskah contoh. Semuanya diberi judul “Contoh” dan bukan arsip yang pernah ditandatangani. Jangan mengunggah naskah rahasia ke demo publik ini.

## Menjalankan demo

Buka tautan di atas, atau dari salinan repo:

```bash
python -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Produksi

Basis data, penyimpanan berkas, SSO, nama host, dan mode jaringan (hanya LAN, VPN, atau internet) diputuskan SDI/TSI/DukTek. Repo ini tidak mengarang nilai itu. Skema awal ada di `docs/schema_production_postgres.sql`. API contoh ada di `backend/`, masih menyimpan data di memori sampai disambungkan ke basis data kampus.
