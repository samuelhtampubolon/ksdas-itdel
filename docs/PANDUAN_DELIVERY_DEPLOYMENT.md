# Panduan delivery dan deployment

Ada dua barang yang berbeda. Jangan dicampur.

| Barang | Untuk apa | Bukan |
| --- | --- | --- |
| GitHub Pages | Demo alur kepada staf dan pimpinan | Basis data kampus |
| Server kampus | Pencatatan resmi, berkas, dan akun | Akun Google atau Notion |

## Demo Pages

Repo ini statis. Halaman utama memuat `index.html`, `css/ksdas.css`, dan `js/ksdas.js`. Tidak ada build. Setelah perubahan masuk ke cabang `main`, Pages memperbarui sendiri bila sumbernya adalah cabang `main` folder root.

Periksa di pengaturan repo: Settings, Pages, Branch `main`, folder `/ (root)`.

## Server kampus, nanti

Nilai berikut **belum ditetapkan** dan tidak boleh diisi dari prototipe:

1. Nama host dan DNS.
2. Sertifikat TLS dan siapa yang memperpanjangnya.
3. Mesin atau kontainer, dan sistem operasi.
4. Produk basis data.
5. Tempat menyimpan berkas, di luar folder web yang bisa dijalankan.
6. SSO kampus, bila ada.
7. Mode akses: hanya LAN, LAN ditambah VPN, internet, atau campuran.
8. Cadangan, target pemulihan, dan siapa yang menguji restore.
9. Pemantauan.

`docker-compose.yml` hanya contoh susunan: proksi, API, basis data, dan penyimpanan berkas di jaringan yang tidak terbuka dari internet. API pada `backend/` masih menyimpan data di memori. Jangan menganggapnya produksi hanya karena berkas compose ada.

## Yang tidak dipakai

Tidak ada kunci API model bahasa. Tidak ada OCR. Tidak ada rahasia di berkas frontend. Variabel seperti URL basis data dan penerbit SSO diisi di server, tidak di peramban.

## Sebelum dianggap siap pakai

- UAT unggah, impor tabel, saringan dekan, dan unduh.
- Uji hak akses: prodi tidak melihat data prodi lain.
- Uji cadangan dengan mengembalikan data, bukan hanya melihat bahwa berkas cadangan terbentuk.
- Rencana kembali ke versi sebelumnya bila rilis gagal.
