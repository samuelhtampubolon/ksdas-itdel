# Ekstraksi Dokumen KSDAS (v1.0)

Staf mengunggah dokumen, KSDAS membaca isinya dan mengisi kolom formulir sebagai **usulan**. Staf memeriksa, melengkapi yang kosong, lalu memvalidasi. Kode: `js/extract.js`. Uji: `tests/extract.test.js`.

## Format yang dibaca
| Format | Cara baca | Catatan |
|---|---|---|
| DOCX | XML Word (paragraf, tabel, header, footer, pemisah halaman) | Paling akurat |
| PDF berteks | PDF.js per halaman | Nomor halaman sumber tercatat |
| PDF hasil scan dan gambar (PNG/JPG/BMP/WEBP) | OCR Tesseract (bahasa Indonesia + Inggris) berjalan lokal | Kualitas OCR rendah menurunkan keyakinan semua field |
| XLSX / CSV | Tabel registri (banyak baris, satu naskah per baris) atau lembar isian "Label: nilai" | Tanggal serial Excel dikonversi |
| DOC / XLS lama | Pembacaan terbatas | Disarankan simpan ulang sebagai DOCX/XLSX |
| TXT / tempel teks | Teks langsung | |

## Aturan akurasi
1. **Tidak menebak.** Field yang tidak tertulis di dokumen dibiarkan kosong dan masuk daftar "Perlu diisi manual". Tidak ada lagi nilai bawaan seperti tanggal hari ini, Rektor, FITE, atau masa berlaku 3 tahun.
2. Setiap field membawa **keyakinan** (Tinggi, Sedang, Rendah), **halaman**, **kutipan sumber**, dan **metode**. Tampil di bawah setiap kolom.
3. Nilai hasil hitung (misalnya tanggal berakhir dari "jangka waktu 3 tahun") ditandai **Sedang** dengan catatan cara menghitungnya.
4. Hasil berstatus `NEEDS_REVIEW`. Menjadi data resmi hanya setelah staf menekan **Validasi dan aktifkan**. Bila staf mengubah nilai hasil ekstraksi, status menjadi `CORRECTED`, nilai awal tetap tersimpan pada `extraction.fields`.
5. Berkas ditolak bila ekstensi tidak sesuai isi (magic bytes), lebih dari 25 MB, atau lebih dari 100 berkas per kelompok. Berkas identik (SHA-256) tidak diproses dua kali.
6. Isi dokumen adalah **data, bukan perintah**. Baris yang menyerupai perintah ("abaikan instruksi...") diabaikan dan dilaporkan. Tidak ada `eval`, tidak ada layanan luar, semua string di UI di-escape.

## Yang diekstraksi
Jenis naskah, nomor (nomor IT Del diutamakan, nomor mitra masuk Catatan), judul, mitra (dicocokkan dengan master, bila tidak ada dibuat sebagai mitra baru berstatus draf), penandatangan dan jabatan kedua pihak (dinormalkan dengan direktori pimpinan IT Del), tanggal tanda tangan, mulai, berakhir (angka, terbilang, dan format numerik), ruang lingkup, fakultas, program studi (hanya dari nama eksplisit), Tri Dharma (kata kunci), anggaran, sumber dana, lokasi, nama kegiatan, PIC, serta rujukan nomor induk untuk relasi MoU, PKS, IA, Proposal, Laporan.

## Kualitas dan batas
Ekstraksi berbasis aturan, bukan model AI, sehingga hasilnya dapat ditelusuri dan diuji. Format dokumen yang sangat berbeda dari pola umum naskah kerja sama Indonesia dapat menghasilkan field kosong atau berkeyakinan rendah. Itu perilaku yang diinginkan: lebih baik kosong daripada salah. Tambahkan contoh dokumen nyata (setelah dianonimkan) ke `sample-data/uji` dan uji di `tests/extract.test.js` untuk memperluas aturan.
