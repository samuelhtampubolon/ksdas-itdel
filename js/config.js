/*
 * KSDAS - Konfigurasi penyimpanan (PUBLIK; jangan isi rahasia di sini).
 *
 * Bawaan: "browser" (GitHub Pages memakai IndexedDB; KSDAS_ITDel.exe memakai server lokal otomatis).
 * Untuk memakai penyimpanan cloud, jalankan:  node tools/configure.js <penyedia> [opsi]
 * (lihat docs/INTEGRASI_CLOUD.md). Skrip itu mengisi berkas ini dan menyesuaikan connect-src pada CSP index.html.
 *
 *   provider: "browser" | "supabase" | "firebase" | "cloudflare" | "glitch" | "huggingface" | "node"
 *   apiBase : alamat server API untuk cloudflare/glitch/huggingface/node ("" = origin yang sama)
 *   supabase: { url, anonKey }                      anonKey = kunci publik "anon", BUKAN service_role
 *   firebase: { apiKey, projectId, storageBucket }  storageBucket kosong = berkas disimpan di Firestore (maks 5 MB)
 */
window.KSDAS_CONFIG = { provider: "browser" };
