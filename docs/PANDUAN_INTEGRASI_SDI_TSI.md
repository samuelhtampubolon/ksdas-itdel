# Panduan integrasi untuk SDI / TSI / DukTek

Unit Kerja Sama menentukan apa yang dicatat, siapa yang melihat, dan kapan data dianggap lengkap. Tim teknis menentukan di mesin mana itu berjalan.

## Batas yang sudah jelas

Pencatatan resmi nanti lewat API, bukan lewat koneksi langsung staf ke basis data.

Alur staf:

1. Berkas masuk ke penyimpanan internal dan dapat identitas.
2. Formulir metadata terbuka. Sistem mengisi sedikit kolom yang sudah diketahui dari nama berkas dan master mitra.
3. Staf mengisi sisanya.
4. Tabel Excel, CSV, atau salinan dari Sheets/Word dapat dipetakan ke kolom yang sama, lalu sisa yang tidak cocok dilengkapi manual.
5. Menyimpan menulis jejak: siapa, kapan, naskah mana.

Alur dekan dan kaprodi:

- Baca saja, pada lingkup fakultas atau program studi.
- Saring, urutkan, pilih, unduh.
- Analisis dihitung dari baris yang sedang terlihat.

## Pindah dari Sheets, Drive, OneDrive, dan Notion

Tidak ada sambungan tetap ke layanan itu.

1. Staf mengekspor tabel yang sekarang dipakai menjadi CSV atau menyalinnya.
2. Impor sekali ke KSDAS. Sistem melaporkan baris yang masuk, yang duplikat, dan yang kolomnya tidak dikenali.
3. Berkas PDF yang masih di Drive diunggah sebagai lampiran. Metadatanya diisi di formulir, bukan diambil dari isi pindaian.
4. Setelah itu Sheets dan Notion tidak lagi menjadi tempat memperbarui data yang sama.

Laporan impor yang perlu ada di produksi: jumlah masuk, dilewati, duplikat, tidak valid, dan relasi induk yang belum ketemu.

## API yang diharapkan

Awalan `/api/v1/`. Contoh yang cukup untuk versi pertama:

- `POST /documents` menyimpan metadata dan referensi berkas.
- `GET /documents` dengan saringan tahun, mitra, jenis, status, fakultas, prodi.
- `PATCH /documents/{id}` untuk koreksi staf.
- `POST /imports/table` untuk baris hasil unggah CSV.
- `GET /analytics/summary` untuk rekap lingkup pengguna.
- `GET /health` dan `GET /ready` tanpa membocorkan topologi atau rahasia.

Setiap penulisan meminta akun, memeriksa peran dan lingkup data, menolak badan yang tidak sesuai skema, dan menulis jejak.

## Yang sengaja tidak ada

Tidak ada layanan OCR. Tidak ada model bahasa. Tidak ada skor “keyakinan mesin”. Relasi induk disarankan oleh aturan (satu MoU untuk mitra yang sama), lalu manusia yang mengaitkan.

## Keputusan yang masih terbuka

Lihat daftar pada [panduan deployment](PANDUAN_DELIVERY_DEPLOYMENT.md). Selama belum diisi pemilik infrastruktur, field itu tetap TBD.
