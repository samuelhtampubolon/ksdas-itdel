# Riset dan Optimasi OCR + Identifikasi Bahasa

## Tujuan
OCR dan identifikasi bahasa yang ringan, jalan di GitHub Pages dan EXE tanpa server, akurat untuk banyak bahasa.

## Yang dibandingkan dan diputuskan
| Kandidat | Catatan | Keputusan |
|---|---|---|
| tesseract.js (dipakai sebelumnya) | inti WASM besar, model per bahasa diunduh dari CDN | diganti |
| **tesseract-wasm 0.11** (Robert Knight, Hypothesis) | build Tesseract/Leptonica ringkas, hanya LSTM, API sederhana, bisa offline | **dipakai** (`js/ocr/tw/`) |
| Model `tessdata_best` | akurat tetapi besar | dipakai sebagai sumber, lalu dilangsingkan |
| Pemindai lain (PaddleOCR/ONNX, EasyOCR) | bobot puluhan MB, pemuatan berat | tidak dipakai |
| franc / CLD3 / fastText lid | franc (MIT) dan metode trigram Cavnar-Trenkle jadi acuan, model fastText terlalu besar | **dibuat ulang ringan** (`js/ocr/langid.js`, 57 KB data) |

## Hasil rekayasa
1. **Model dilangsingkan**: `tools/td-slim.js` membuka format TessdataManager dan membuang komponen kamus (`LSTM_SYSTEM_DAWG` dll.) yang tidak diperlukan pengenalan LSTM, lalu gzip. Ukuran akhir 0,35 sampai 1,45 MB per bahasa (16 paket, total sekitar 15,5 MB; yang dimuat hanya paket yang dibutuhkan).
2. **Prapemrosesan murni JS** (`js/ocr/preprocess.js`): estimasi derau (Immerkaer), penghalusan hanya bila perlu, perataan iluminasi lewat integral image, penskalaan ke tinggi baris sekitar 30 px, koreksi kemiringan (profil proyeksi). Binarisasi Sauvola diuji dan **terbukti menurunkan akurasi** pada LSTM, jadi tidak dipakai secara bawaan.
3. **Beberapa kandidat**: hasil pra-proses vs gambar asli (bila keyakinan < 72), putaran 90/180/270 derajat (bila < 55). Dipilih kandidat berbobot keyakinan kata tertinggi.
4. **Identifikasi aksara + bahasa** (`js/ocr/langid.js`): hitung aksara Unicode, lalu Naive Bayes trigram + kata fungsi + penanda pembeda serumpun (Indonesia/Melayu, Jawa, Sunda, Minang, Tagalog). Teks hasil OCR halaman memilih paket bahasa berikutnya; bila aksara tidak diketahui, sampel baris awal dicoba dengan paket aksara lain (jpn, chi_sim, kor, rus, tha, ara, hin) dengan anggaran waktu 16 detik dan berhenti dini.
5. Satu klien tesseract-wasm hanya memegang satu model, jadi klien dibuat ulang saat bahasa berganti.

## Pengukuran (benchmark sintetis, 83 gambar, 20 bahasa, berbagai font dan kondisi)
Skrip: `tools/ocr-bench/`. Gambar dibuat dari teks UDHR dan templat naskah kerja sama dengan derau, kemiringan, resolusi rendah, JPEG, bayangan, dan fotokopi.

CER total 6,37% (sebelum perbaikan pemilihan paket: 7,35%). Contoh CER per bahasa: es 0,1; it 0,2; tr 0,2; de 0,4; ja 0,6; jv 0,6; ko 1,3; ar 1,5; fr 1,7; th 2,5; zh 3,9; hi 5,4; id 6,6; pt 10,0; ms 12,0; en 16,7; vi 27,0. Rata-rata 5,7 detik per gambar (termasuk probing aksara dan kasus fotokopi yang lambat).

## Keterbatasan (jujur)
- Benchmark **sintetis**, bukan pindaian nyata. Tulisan tangan tidak didukung.
- Kondisi "fotokopi" masih buruk (CER tinggi dan sampai 30 detik) dan menyeret rata-rata bahasa id/ms/en.
- Vietnam: paket `ind` salah memilih karena tanpa diakritik bahasa tak terdeteksi; paket `vie` tidak otomatis terpilih (CER 27%). Pilih bahasa secara manual di antarmuka bila perlu.
- Hasil OCR selalu ditandai keyakinan rendah/sedang dan wajib ditinjau staf.
- Lisensi: tesseract-wasm BSD-2, Tesseract dan Leptonica Apache-2.0/BSD, tessdata_best Apache-2.0, teks uji UDHR domain terbuka.
