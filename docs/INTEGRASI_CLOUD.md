# Integrasi Cloud KSDAS

KSDAS tetap berjalan tanpa cloud (GitHub Pages memakai IndexedDB, `KSDAS_ITDel.exe` memakai server lokal). Cloud bersifat **opsional**: aktif hanya bila `js/config.js` diubah.

## Arsitektur: satu kontrak, banyak penyedia

Semua penyimpanan memakai kontrak REST yang sama dengan EXE (`/api/state`, `/api/files/{id}`, `/api/audit`, `/api/backup(s)`, `/api/restore`, `/api/stats`, `/api/sim`). Validasi (ID aman, magic byte, batas 25 MB, nama cadangan, checksum cadangan) ada **sekali** di `js/providers/core.js` dan dipakai semua penyedia.

| Penyedia | Cara kerja | Berkas |
|---|---|---|
| Cloudflare Pages + D1 + R2 + KV | Pages Function di `/api/*`. D1 = indeks dan audit, R2 = state, cadangan, berkas, KV = pembatas percobaan login | `functions/api/[[path]].js`, `cloud/cloudflare/*` |
| Supabase Free | Peramban memanggil PostgREST + Storage + Auth. Keamanan = RLS + daftar `ksdas_staff` | `js/providers/cloud.js`, `cloud/supabase/schema.sql` |
| Firebase Spark | Peramban memanggil Firestore REST + Identity Toolkit. Data besar dipotong 250 KB per dokumen | `js/providers/cloud.js`, `cloud/firebase/*` |
| Hugging Face Spaces | Docker Space menjalankan server Node (port 7860), atau Static Space + API di tempat lain | `cloud/node/server.js`, `tools/build-bundle.js space` |
| Glitch / server Node lain | Server Node tanpa dependensi | `cloud/node/server.js` |

**Catatan Glitch:** Glitch menghentikan hosting aplikasi pada 8 Juli 2025 ([Glitch](https://blog.glitch.com/post/changes-are-coming-to-glitch/), [Slashdot](https://tech.slashdot.org/story/25/05/23/134214)). Penyedia `glitch` tetap ada karena hanya berarti "server Node", tetapi untuk hosting nyata pakai penyedia Node lain (VPS, atau layanan yang menjalankan Node 18+).

## Langkah umum

```bash
node tools/build-bundle.js <target> [opsi]      # target: pages | node | space | space-static | github
node tools/configure.js <penyedia> [opsi]       # mengisi js/config.js dan connect-src CSP
```

`build-bundle` membuat folder `dist/<target>` berisi hanya berkas yang diperlukan. Tambahkan `--ocr-packs ind,deu,jpn` untuk memperkecil ukuran (paket OCR lain dibuang; `ind` selalu ada). Tanpa opsi itu satu paket sekitar 22 MB.

Semua nilai di `js/config.js` bersifat **publik**. `configure.js` menolak kunci `service_role` / `sb_secret_`, URL non-https, dan `apiKey` Firebase yang bentuknya salah.

## Cloudflare (Pages + D1 + R2 + KV)

1. `npm i -g wrangler` lalu `wrangler login`.
2. `wrangler d1 create ksdas`, `wrangler r2 bucket create ksdas-files`, `wrangler kv namespace create RATE`.
3. Salin `cloud/cloudflare/wrangler.toml.example` ke `./wrangler.toml`, isi `database_id` dan `id` KV dari keluaran langkah 2.
4. `wrangler d1 execute ksdas --remote --file=cloud/cloudflare/schema.sql`
5. `node tools/build-bundle.js pages` lalu `wrangler pages deploy dist/pages --project-name ksdas-itdel` (jalankan dari akar repo agar folder `functions/` ikut).
6. `wrangler pages secret put KSDAS_PASSWORD` dan `wrangler pages secret put KSDAS_TOKEN_SECRET` (acak, minimal 16 karakter, mis. `openssl rand -hex 32`). Bila UI dari origin lain (GitHub Pages), set variabel `KSDAS_ALLOWED_ORIGINS` dan jalankan `configure.js cloudflare --api-base https://<proyek>.pages.dev`.

Diuji: seluruh kontrak lewat `tests/cloud.test.js` dengan D1 ditiru `node:sqlite`, R2 dan KV tiruan. **Belum diuji** pada akun Cloudflare sungguhan.

## Supabase Free

1. Buat proyek. Jalankan `cloud/supabase/schema.sql` di SQL Editor.
2. Authentication: matikan pendaftaran mandiri, buat pengguna staf, lalu `insert into public.ksdas_staff (email) values ('nama@del.ac.id');`.
3. `node tools/configure.js supabase --url https://<ref>.supabase.co --anon-key <anon atau publishable>`
4. Terbitkan ke GitHub Pages (`node tools/build-bundle.js github --url ... --anon-key ...`).

Tanpa baris di `ksdas_staff`, semua tabel menolak akses walau seseorang punya kunci anon. Batas paket Free (500 MB basis data, 1 GB penyimpanan, proyek dijeda setelah sekitar seminggu tidak aktif) berasal dari sumber pihak ketiga: **cek halaman harga resmi** sebelum mengandalkannya ([ringkasan](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/)).

## Firebase Spark

1. Buat proyek, aktifkan Firestore (mode produksi) dan Authentication > Email/Password. Matikan pendaftaran bila memungkinkan, buat pengguna staf di Console.
2. Buat dokumen di koleksi `ksdas_staff` dengan **ID dokumen = surel staf**. Tempel `cloud/firebase/firestore.rules` di tab Rules lalu Publish.
3. `node tools/configure.js firebase --api-key AIza... --project-id <id>`
4. **Berkas asli:** Cloud Storage untuk Firebase kini memerlukan paket Blaze ([FAQ resmi](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)). Di Spark, KSDAS menyimpan berkas di Firestore (dipotong, **maksimum 5 MB**) dan simulasi dibatasi 200 rekaman agar kuota tulis harian tidak habis. Bila Anda memakai Blaze, tambahkan `--storage-bucket <proyek>.firebasestorage.app` dan terbitkan `cloud/firebase/storage.rules`.

Diuji dengan Firestore tiruan. **Aturan keamanan (`*.rules`) belum diuji dengan emulator Firebase**; uji di Console (Rules Playground) sebelum dipakai data nyata.

## Hugging Face Spaces

- Docker Space: `node tools/build-bundle.js space`, buat Space bertipe Docker, unggah isi `dist/space` (git push ke repo Space). Atur Secret `KSDAS_PASSWORD`, `KSDAS_TOKEN_SECRET`.
- **Disk Space gratis bersifat sementara** dan hilang saat restart; penyimpanan permanen berbayar ([dokumen HF](https://huggingface.co/docs/hub/spaces-storage)). Untuk data yang harus bertahan, pakai Space hanya sebagai UI statis (`space-static` dengan Supabase/Firebase/Cloudflare sebagai penyimpanan) atau aktifkan penyimpanan persisten.
- Ketersediaan Space gratis yang menjalankan komputasi bergantung jenis akun: periksa.

## Server Node (VPS, dll.)

`node tools/build-bundle.js node`, lalu di server: `KSDAS_PASSWORD=... KSDAS_TOKEN_SECRET=... KSDAS_TRUST_PROXY=1 PORT=3000 npm start`. Taruh di belakang HTTPS (nginx/Caddy). Variabel: lihat kepala `cloud/node/server.js`.

## Keamanan yang diterapkan

- Login kata sandi dengan perbandingan waktu-konstan, token HMAC-SHA256 berumur 8 jam, pembatas 5 percobaan gagal per 10 menit per IP.
- Server menolak start API bila rahasia kosong (503), tidak ada kata sandi bawaan.
- CORS hanya origin yang sama atau yang didaftarkan; berkas statis memakai allowlist; CSP `connect-src` hanya memuat origin penyedia terpilih, tanpa wildcard.
- Kata sandi tidak disimpan di peramban; token sesi hanya di `sessionStorage`.
- Catatan: data naskah kerja sama adalah data institusi. Sebelum dipakai untuk data nyata, keputusan lokasi penyimpanan harus disetujui SDI/TSI (lihat runbook integrasi).

## Hal yang harus Anda lakukan sendiri

Lihat `docs/LANGKAH_MANUAL_PEMILIK.md` bagian "Cloud".
