# Panduan Delivery & Deployment — KSDAS IT Del

Dokumen ini memetakan opsi pengiriman (*delivery*) dan pemasangan (*deployment*) Sistem Informasi Kerja Sama (KSDAS) Institut Teknologi Del untuk pemangku kepentingan akademik dan teknis.

---

## 1. Perbandingan Tiga Bentuk Pengiriman

| Modalitas | Target Pengguna | Karakteristik Teknis | Penyimpanan Data | Status |
| --- | --- | --- | --- | --- |
| **1. Web Demo GitHub Pages** | Pimpinan, Dekan, Kaprodi, Staf | Web SPA statis di peramban, tanpa build runtime | LocalStorage peramban (sementara) | **Tersedia (Live Demo)** |
| **2. Standalone Desktop `.EXE`** | Staf UKS, Presentasi Laptop/PC Offline | Windows Forms native C# portabel (`KSDAS_ITDel.exe`) | Persisten JSON lokal (`ksdas_desktop_database.json`) | **Tersedia (Siap Pakai)** |
| **3. Server Lokal Kampus (On-Premise)** | Seluruh sivitas akademika IT Del | Web Intranet LAN IT Del, PostgreSQL, File Vault | Basis data relasional terenkripsi di server kampus | **Target Implementasi Produksi** |

---

## 2. Mengapa Server Lokal Lebih Ideal Dibanding Cloud Pihak Ketiga?

Penggunaan Google Drive, OneDrive, Google Sheets, Microsoft 365, dan Notion saat ini menimbulkan kelemahan struktural bagi Institut Teknologi Del:

1. **Kedaulatan & Keamanan Data Naskah Dinas**:
   - Naskah kerja sama memuat hak kekayaan intelektual, klausul kerahasiaan (*NDA*), anggaran hibah, dan identitas pejabat mitra.
   - Menyimpan dosir di server lokal kampus IT Del (Sitoluama, Laguboti) menjamin kepatuhan regulasi institusional dan mencegah kebocoran data ke server luar negeri.
2. **Keterikatan Relasi Dokumen (*Single Source of Truth*)**:
   - Google Drive dan OneDrive hanya menyimpan file statis tanpa validasi hierarki.
   - KSDAS memastikan MoU memiliki turunan PKS, PKS memiliki turunan IA, dan proposal memiliki laporan pelaksanaan.
3. **Pembatasan Hak Akses (*Role-Based Access Control*)**:
   - Pada folder Google Drive atau spreadsheet bersama, tautan mudah tersebar luas ke pihak yang tidak berhak.
   - Di KSDAS, Dekan dan Kaprodi terkunci otomatis hanya dapat melihat portofolio naskah fakultas/prodi yang dipimpinnya.
4. **Pemberitahuan Otomatis Masa Berlaku**:
   - Lembar kerja biasa tidak memberikan peringatan sistemik saat naskah mendekati 180 hari sebelum kedaluwarsa.
   - KSDAS secara otomatis mendeteksi status *Akan Berakhir* dan *Berakhir* untuk segera ditindaklanjuti staf dan WR3.

---

## 3. Menjalankan Demo & Aplikasi Saat Ini

### A. Live Demo Web (GitHub Pages)
- URL: [https://samuelhtampubolon.github.io/ksdas-itdel/](https://samuelhtampubolon.github.io/ksdas-itdel/)
- Tidak memerlukan server khusus. Diperbarui otomatis dari cabang `main`.

### B. Menjalankan Server Web Lokal Sederhana
Jika ingin menjalankan antarmuka web di jaringan lokal / laptop:
```bash
python -m http.server 8080
```
Buka peramban pada alamat `http://localhost:8080`.

### C. Menjalankan Aplikasi Desktop Standalone (`.EXE`)
- Berkas executable: `KSDAS_ITDel.exe`
- Klik ganda pada sistem operasi Windows.
- Jika ingin mengompilasi ulang kode sumber C# di komputer Windows lain:
```cmd
build_exe.bat
```
Script tersebut menggunakan compiler native `csc.exe` bawaan Windows .NET Framework tanpa memerlukan dependensi pihak ketiga.

---

## 4. Panduan Deployment Server Kampus (SDI / TSI / DukTek)

Untuk pemasangan resmi di pusat data kampus IT Del:

1. **Jaringan & Topologi**:
   - Dianjurkan berjalan di zona Intranet IT Del (hanya dapat diakses melalui jaringan kabel kampus, Wi-Fi sivitas akademika, atau VPN IT Del).
2. **Basis Data**:
   - Menggunakan PostgreSQL lokal kampus dengan skema relasional yang telah disediakan pada `docs/schema_production_postgres.sql`.
3. **Penyimpanan Berkas Lampiran**:
   - Berkas lampiran naskah (PDF/Word) disimpan di direktori terproteksi (di luar *web root*) dengan penamaan berbasis UUID acak agar tidak dapat diakses tanpa autentikasi.
4. **Autentikasi Institusional**:
   - Disambungkan ke direktori akun IT Del (LDAP / SSO Kampus).
5. **Jejak Audit**:
   - Setiap mutasi data naskah (buat, ubah, hapus, unduh) dicatat otomatis ke tabel `audit_logs` bersama identitas staf dan alamat IP.

---

## 5. Yang Dipastikan Ditiadakan (Clean & Safe)

- **Bebas AI, ML, dan OCR**: Seluruh pencatatan dan ekstraksi berbasis aturan deterministik (*rule-based automation*), kamus alias header kolom, dan pengisian manual staf.
- **Bebas Entitas Non-Mitra**: Seluruh entitas dan referensi naskah yang tidak relevan telah ditiadakan dari repository.
- **Tepat 10 Contoh Naskah**: Hanya menyertakan 10 naskah contoh terstandar untuk demonstrasi fungsional.
