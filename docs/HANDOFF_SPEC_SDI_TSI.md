> **Catatan 3 Oktober 2026.** Naskah di bawah ini dari rancangan sebelumnya. Yang berlaku sekarang tidak memakai AI, ML, atau OCR. Ikuti README serta `PANDUAN_UJI_COBA_DOKUMEN_LOKAL.md`, `PANDUAN_DELIVERY_DEPLOYMENT.md`, dan `PANDUAN_INTEGRASI_SDI_TSI.md`.

# KSDAS IT DEL - HANDOFF SPECIFICATION FOR SDI / TSI / DUKTEK

**Dokumen Serah Terima Kebutuhan Sistem & Spesifikasi Prototype**  
**Dari:** Unit Kerja Sama & Kemitraan Institut Teknologi Del  
**Kepada:** Direktorat Sistem & Data Informasi (SDI) / Teknologi & Sistem Informasi (TSI) / Tim Duktek  
**Versi:** 0.2.0  
**Tanggal:** Oktober 2026  

---

## 1. TUJUAN HANDOFF

Unit Kerja Sama menyerahkan prototype ini sebagai:
- **Bukti konsep (Proof of Concept);**
- **Spesifikasi kebutuhan sistem (Software Requirements Specification);**
- **Prototype UI/UX fungsional;**
- **Contoh alur proses bisnis (*business workflow*);**
- **Kamus data (*data dictionary*);**
- **Model relasi antar-entitas;**
- **Kriteria penerimaan pengujian (*acceptance criteria*).**

> [!IMPORTANT]
> Prototype ini bukan sistem produksi final, melainkan acuan fungsional dan antarmuka (*baseline*) agar tim SDI/TSI tidak perlu mendesain ulang dari nol.

---

## 2. YANG SUDAH DITENTUKAN OLEH UNIT KERJA SAMA

### Fokus Bisnis:
Kerja sama, kemitraan strategis, kolaborasi Tri Dharma Perguruan Tinggi.

### Dokumen Utama & Hierarki Standar:
$$\text{Mitra} \longrightarrow \text{MoU / LOI} \longrightarrow \text{PKS / MoA} \longrightarrow \text{IA} \longrightarrow \text{Proposal} \longrightarrow \text{Laporan Akhir / LPJ}$$

### Relasi Multi-Dimensi Dokumen:
Dokumen kerja sama dapat dan wajib memiliki relasi ke:
- Fakultas (FITE, FTI, FB);
- Program Studi (Informatika, SI, TE, MR, TRPL, Bioproses, dll.);
- Unit Kerja Internal (SDI, LPPM, SPM, BAAK, CDC);
- Penanggung Jawab / PIC;
- Pilar Tri Dharma (Pendidikan, Penelitian, Pengabdian kepada Masyarakat, Tata Kelola);
- Aktivitas Riil;
- Capaian Luaran (*Output*);
- Hasil Nyata (*Outcome*);
- Dampak Institusional (*Impact*);
- Berkas Bukti Fisik (*Evidence*).

---

## 3. MASALAH YANG HARUS DISELESAIKAN

Kondisi operasional sebelum KSDAS:
1. Berkas kerja sama tersebar di berbagai unit dan folder komputer staf.
2. Metadata belum terstruktur rapi sehingga menyulitkan pencarian cepat.
3. Staf sering melakukan rekapitulasi data secara manual menjelang akreditasi.
4. Permintaan data kemitraan dari SPM atau prodi memakan waktu berhari-hari.
5. Data sering disajikan dalam format mentah tanpa visualisasi tren.
6. Hubungan antara naskah induk (MoU) dan dokumen turunan (PKS/IA) sulit ditelusuri.
7. Bukti fisik kegiatan (*evidence*) sering hilang atau tidak terarsip bersama naskah.
8. Dokumen yang mendekati masa kedaluwarsa atau MoU tanpa tindak lanjut sulit termonitor.

---

## 4. TARGET SISTEM

KSDAS mengubah alur kerja institusi secara mendasar:
$$\text{DOCUMENTS} \longrightarrow \text{STRUCTURED DATA} \longrightarrow \text{INFORMATION} \longrightarrow \text{ANALYTICS} \longrightarrow \text{EVIDENCE} \longrightarrow \text{REPORT}$$

---

## 5. BATCH PROCESSING

Staf Unit Kerja Sama harus dapat mengunggah berkas dalam jumlah banyak sekaligus (*multi-file upload* / *drag-and-drop*).

Sistem secara otomatis:
- Mendeteksi jenis dokumen secara cerdas;
- Mengekstrak 26 metadata field;
- Mencari pasangan relasi (MoU payung);
- Menetapkan skor keyakinan (*confidence score*);
- Memasukkan ke antrean validasi manual.

*Contoh kombinasi:* 10 file &rarr; 3 MoU, 4 PKS, 1 IA, 1 Proposal, 1 Laporan Akhir.

---

## 6. HUMAN IN THE LOOP

> [!CAUTION]
> AI / otomasi tidak pernah menetapkan data resmi institusi secara sepihak tanpa tinjauan manusia.

Alur status verifikasi dokumen:
$$\text{AI\_EXTRACTED} \longrightarrow \text{NEEDS\_REVIEW} \longrightarrow \text{VALIDATED / CORRECTED / REJECTED}$$

Data resmi untuk IKU dan akreditasi hanya bersumber dari dokumen berstatus **`VALIDATED`** atau **`CORRECTED`**.

---

## 7. MODEL HAK AKSES & OTORISASI PENGGUNA

| Role Pengguna | Kewenangan Utama di Sistem |
| :--- | :--- |
| **ADMIN_STAFF** (Staf Unit Kerja Sama) | Membuat, mengunggah batch, mengedit, memvalidasi data, mengelola master mitra. |
| **BUREAU_HEAD** (Kepala Biro Kemitraan) | Meninjau, memvalidasi dokumen bernilai strategis, memonitor, mengunduh laporan. |
| **WR3** (Wakil Rektor 3 Bidang Kemitraan) | Meninjau, memonitor indikator capaian, analitik eksekutif, pengesahan laporan. |
| **EXECUTIVE_VIEWER** (Rektor / Dekan) | Melihat data keseluruhan, menyaring filter fakultas, mengunduh rekapitulasi. |
| **QUALITY_REVIEWER** (SPM IT Del) | Mengakses workspace akreditasi, memetakan indikator BAN-PT/LAM, memverifikasi evidence. |
| **FACULTY_VIEWER** (Pengelola Fakultas) | Melihat dan menyaring data dokumen yang berada dalam lingkup fakultas bersangkutan. |
| **PROGRAM_VIEWER** (Pengelola Program Studi) | Melihat dan menyaring data dokumen kerja sama prodi, melihat luaran kegiatan. |
| **UNIT_VIEWER** (Pengelola Unit Internal) | Melihat data kerja sama relevan unit internal (LPPM, SDI, CDC). |

---

## 8. MASTER DATA WAJIB

Sistem menyediakan master data lengkap:
- **Partner (Mitra):** Industri, Kampus, BUMN, Pemerintah, NGO;
- **Faculty:** FITE, FTI, FB;
- **Study Program:** S1 Informatika, S1 SI, S1 TE, D4 TRPL, S1 MR, S1 BP, dll.;
- **Internal Unit:** Unit Kerja Sama, SDI/TSI, SPM, LPPM, CDC, BAAK;
- **Person / Signatory:** Pejabat penandatangan IT Del dan mitra;
- **Tri Dharma:** Pendidikan, Penelitian, Pengabdian kepada Masyarakat, Tata Kelola;
- **Document Type:** MoU/LOI, PKS/MoA, IA, Proposal, Final Report.

---

## 9. FITUR ANALITIK WAJIB

- MoU dan PKS berdasarkan tahun (tren historis & proyeksi);
- Kerja sama berdasarkan negara mitra (nasional vs internasional);
- Kerja sama berdasarkan tipe mitra (industri vs perguruan tinggi vs pemda);
- Sebaran kerja sama per fakultas dan program studi;
- Implementasi pilar Tri Dharma Perguruan Tinggi;
- Capaian *Output*, *Outcome*, dan *Impact*;
- *Expiry monitoring* (Kedaluwarsa, <30 hari, <60 hari, <90 hari, Aktif);
- *Follow-up gap analysis* (MoU pasif tanpa PKS, PKS tanpa aktivitas riil);
- Kelengkapan bukti fisik (*evidence completeness*).

---

## 10. DYNAMIC MULTI-FILTERING

Sistem menyediakan penyaringan dinamis gabungan:
- Tahun pelaksanaan;
- Mitra kerja sama;
- Negara asal mitra;
- Kategori mitra;
- Jenis dokumen;
- Status validasi;
- Fakultas & Program Studi;
- Unit internal pelaksana;
- Pilar Tri Dharma;
- Status ketersediaan berkas fisik (*evidence*).

---

## 11. MODUL PENJAMINAN MUTU & AKREDITASI (AMI)

Sistem memetakan relasi data secara terstruktur:
$$\text{Framework} \longrightarrow \text{Kriteria} \longrightarrow \text{Indikator Mutu} \longrightarrow \text{Data Kerja Sama} \longrightarrow \text{Evidence Fisik}$$

Daftar instrumen terkonfigurasi:
1. **BAN-PT IAPS 4.0 / IAPT 3.0** (Kriteria 1, Kriteria 6, Kriteria 7, Kriteria 8);
2. **LAM-INFOKOM** (Kriteria 1.4.a Sertifikasi Kompetensi, Kriteria 1.4.b Kerjasama Internasional, Kriteria 7 Riset ICT).

---

## 12. KEAMANAN & KEANDALAN PRODUKSI

Spesifikasi wajib untuk implementasi produksi oleh SDI/TSI:
- **Autentikasi:** SSO IT Del terpusat;
- **Otorisasi:** Role-Based Access Control (RBAC);
- **Validasi Berkas:** Validasi MIME-type dan *malware/antivirus scanning* pada saat berkas diunggah;
- **Audit Trail:** Pencatatan setiap aksi modifikasi, validasi, dan ekspor data;
- **Pencadangan:** Mekanisme *automated backup* database berkala;
- **Keandalan:** SLA server dan pemulihan bencana (*disaster recovery*).

---

## 13. SPESIFIKASI PENYIMPANAN DATA

- **Tahap Prototype:** Browser `localStorage` + JSON Import/Export Cadangan Lengkap.
- **Tahap Produksi:** Database Relasional Institusional (PostgreSQL) + Object Storage (MinIO / S3).

---

## 14. INTEGRASI SISTEM PRODUKSI

Integrasi yang diharapkan pada fase produksi resmi:
1. **SSO IT Del** (Single Sign-On akun civitas);
2. **Database Kampus Terpadu**;
3. **Penyimpanan Berkas Terpusat**;
4. **API Gateway Sistem Informasi Akademik**;
5. **Layanan Notifikasi Email / WhatsApp Gateway** (peringatan kontrak berakhir);
6. **Layanan AI / OCR Server Kampus**.

---

## 15. SKENARIO PENGUJIAN PENERIMAAN (ACCEPTANCE DEMO)

### Skenario A (Batch Processing & Validasi Staf):
1. Pengguna masuk sebagai Staf Unit Kerja Sama.
2. Membuka menu **Batch Upload Dokumen**.
3. Menekan tombol simulasi "Muat 10 Dokumen Sampel Demo" atau menarik berkas nyata.
4. Sistem memproses klasifikasi, ekstraksi 26 field, dan pencarian relasi induk.
5. Staf meninjau pada **Workspace Validasi Manual** dan menyetujui dokumen.
6. Data otomatis bertambah dan tercermin pada **Dashboard Eksekutif**.

### Skenario B (Penyaringan Dinamis Multidimensi):
1. Pengguna memilih filter gabungan: **Industri** + **Penelitian** + **Tahun 2026**.
2. Tabel repositori menyaring instan dan menampilkan naskah relevan (misal: PKS Astra Machine Vision).

### Skenario C (Pemeriksaan Bukti Akreditasi oleh SPM):
1. Pengguna memilih peran **SPM (Satuan Penjaminan Mutu)**.
2. Membuka menu **Akreditasi & AMI**.
3. Memilih indikator *LAM-INFOKOM C.1.4.a (Sertifikasi Kompetensi)*.
4. Sistem menampilkan dokumen naskah pendukung dan bukti sertifikat mahasiswa.

### Skenario D (Dashboard Pimpinan oleh Wakil Rektor 3):
1. Pengguna memilih peran **WR3**.
2. Membuka menu **Dashboard Eksekutif** dan **Analitik Eksekutif**.
3. Melihat peringatan dokumen kritis yang akan kedaluwarsa dalam 90 hari.
4. Meninjau analisis kesenjangan (*follow-up gaps*).

---

## 16. KELUARAN YANG DIMINTA DARI TIM TEKNIS (SDI / TSI)

- Arsitektur backend produksi (Container / Microservices);
- Skema database relasional resmi (DDL PostgreSQL);
- Spesifikasi REST API produksi;
- Modul integrasi SSO IT Del;
- Infrastruktur penyimpanan berkas aman;
- Skrip deployment CI/CD ke server institusi;
- Kebijakan pencadangan dan pemantauan sistem.

---

## 17. KELUARAN YANG TIDAK PERLU DIBUAT ULANG OLEH TIM TEKNIS

- Alur proses bisnis kemitraan;
- Model hierarki dokumen (MoU &rarr; PKS &rarr; IA &rarr; Proposal &rarr; LPJ);
- Konsep antarmuka visual (UI/UX);
- Desain tata letak dasbor dan tabel analitik;
- Struktur kamus data;
- Kriteria penerimaan fungsional.

---

## 18. TATA KELOLA & KEPEMILIKAN ASET (GOVERNANCE)

- **Hak Cipta Desain & Prototype:** **Copyright &copy; 2026 Samuel Hasudungan Tampubolon**. Hak cipta atas konsep sistem, arsitektur, algoritma ekstraksi cerdas, dan prototipe kode sumber dilindungi atas nama **Samuel Hasudungan Tampubolon**.
- **Penyelarasan Institusional:** Dikembangkan untuk kepentingan tata kelola kemitraan dan akreditasi **Institut Teknologi Del (IT Del)**.
- **Produksi & Operasional Kampus:** Kepemilikan basis data produksi resmi kampus, data naskah resmi, infrastruktur server, dan deployment sistem operasional diatur berdasarkan kebijakan resmi pimpinan Institut Teknologi Del bersama Direktorat SDI / TSI / Duktek.

---

## 19. PRINSIP KERJA SAMA AKHIR

> **Unit Kerja Sama menentukan:** WHAT + WHY + WORKFLOW  
> **Tim Teknis (SDI/TSI) menentukan:** HOW + INFRASTRUCTURE + DEPLOYMENT  
> **KSDAS IT Del adalah jembatan sinergis di antara keduanya.**
