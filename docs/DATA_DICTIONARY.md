# KSDAS IT DEL - DATA DICTIONARY V0.2

**Sistem Informasi Kerja Sama & Analitik Data (KSDAS)**  
**Institut Teknologi Del, Laguboti, Sumatera Utara**  
**Versi:** 0.2.0  
**Status:** Spesifikasi Inti untuk Prototype & Acuan Basis Data Produksi  

---

## TUJUAN DOKUMEN

Dokumen ini mendefinisikan seluruh struktur field, tipe data, enumerasi, dan relasi inti yang diimplementasikan pada prototype KSDAS IT Del dan menjadi rujukan teknis utama bagi Direktorat SDI / TSI saat melakukan migrasi ke basis data relasional produksi kampus (PostgreSQL).

---

## A. PARTNER (MITRA KERJA SAMA)

| Field | Tipe Data | Wajib | Deskripsi & Contoh Nilai |
| :--- | :--- | :---: | :--- |
| `partner_id` | string (UUID/Code) | Ya | ID unik mitra. Contoh: `PRT-0001` atau `PARTNER-001` |
| `legal_name` | string (255) | Ya | Nama resmi berbadan hukum. Contoh: `PT Huawei Tech Investment` |
| `short_name` | string (50) | Tidak | Nama singkat atau singkatan merek. Contoh: `Huawei`, `Astra` |
| `partner_type` | enum | Ya | `Perguruan Tinggi`, `Sekolah`, `Pemerintah`, `BUMN`, `Swasta/Industri`, `NGO`, `Komunitas`, `Internasional`, `Lainnya` |
| `country` | string (100) | Ya | Negara domisili. Contoh: `Indonesia`, `Singapura`, `Malaysia` |
| `province` | string (100) | Tidak | Provinsi kantor/cabang. Contoh: `Sumatera Utara`, `DKI Jakarta` |
| `city` | string (100) | Tidak | Kota kantor/cabang. Contoh: `Balige`, `Jakarta Selatan`, `Bandung` |
| `address` | text | Tidak | Alamat fisik lengkap kantor mitra |
| `website` | URL string | Tidak | Tautan situs web resmi. Contoh: `https://www.huawei.com/id` |
| `contact_person`| string (150) | Tidak | Nama penanggung jawab kemitraan di pihak mitra |
| `contact_position` | string (100) | Tidak | Jabatan penanggung jawab kontak mitra |
| `email` | email string | Tidak | Alamat surat elektronik resmi korespondensi |
| `phone` | string (50) | Tidak | Nomor telepon kantor atau kontak seluler |
| `status` | enum | Ya | `ACTIVE`, `INACTIVE`, `ARCHIVED` |

---

## B. DOCUMENT REGISTRY (REGISTRI BERKAS FISIK & PROSES)

| Field | Tipe Data | Wajib | Deskripsi & Nilai |
| :--- | :--- | :---: | :--- |
| `document_id` | string | Ya | Pengenal berkas unik di sistem. Contoh: `DOC-000001` |
| `filename` | string (255) | Ya | Nama asli berkas lampiran. Contoh: `MOU_Huawei_ITDel_2024.pdf` |
| `document_type` | enum | Ya | `MOU_LOI`, `PKS_MOA`, `IA`, `PROPOSAL`, `FINAL_REPORT`, `OTHER`, `UNKNOWN` |
| `mime_type` | string (100) | Ya | Tipe konten berkas. Contoh: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `file_size` | integer | Ya | Ukuran berkas dalam satuan byte |
| `storage_reference` | string (255) | Ya | Path penyimpanan objek (MinIO / S3 path) |
| `uploaded_by` | user_id string | Ya | ID pengguna yang mengunggah berkas |
| `uploaded_at` | datetime | Ya | Waktu pengunggahan berkas (ISO 8601 UTC) |
| `processing_status` | enum | Ya | `UPLOADED`, `PARSING`, `EXTRACTED`, `CLASSIFIED`, `LINKED`, `READY_FOR_REVIEW`, `VALIDATED`, `FAILED` |
| `validation_status` | enum | Ya | `PENDING`, `VALIDATED`, `REJECTED`, `CORRECTED` |
| `confidence_score` | decimal (0-1) | Ya | Skor keyakinan ekstraksi AI rata-rata (Contoh: `0.96`) |
| `checksum` | string (64) | Ya | Hash SHA-256 berkas untuk integritas dan deteksi duplikasi |

---

## C. MOU / LOI (NOTA KESEPAHAMAN INDUK)

| Field | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `mou_id` | string PK | ID unik entitas MoU |
| `document_id` | string FK | Referensi ke berkas naskah di `Document Registry` |
| `partner_id` | string FK | Referensi mitra kerja sama |
| `document_number` | string (150) | Nomor surat perjanjian resmi |
| `title` | text | Perihal / Judul Nota Kesepahaman |
| `signed_date` | date | Tanggal penandatanganan resmi |
| `effective_start_date` | date | Tanggal mulai berlaku kerja sama |
| `effective_end_date` | date | Tanggal berakhir masa berlaku |
| `scope` | text | Ringkasan ruang lingkup kesepahaman bersama |
| `country` | string | Lingkup teritorial kerja sama |
| `status` | enum | `DRAFT`, `ACTIVE`, `EXPIRING`, `EXPIRED`, `TERMINATED`, `ARCHIVED` |
| `renewal_status` | enum | `NOT_REQUESTED`, `IN_DISCUSSION`, `RENEWED`, `ABANDONED` |
| `notes` | text | Catatan khusus Unit Kerja Sama |

---

## D. PKS / MOA (PERJANJIAN KERJA SAMA OPERASIONAL)

| Field | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `pks_id` | string PK | ID unik entitas PKS |
| `document_id` | string FK | Referensi ke `Document Registry` |
| `mou_id` | string FK (Nullable) | Referensi ke MoU induk (null bila *orphan*) |
| `partner_id` | string FK | Referensi mitra |
| `document_number` | string (150) | Nomor surat resmi PKS |
| `title` | text | Judul / Perihal Perjanjian Kerja Sama |
| `signed_date` | date | Tanggal penandatanganan naskah |
| `effective_start_date` | date | Tanggal mulai berlaku |
| `effective_end_date` | date | Tanggal berakhir |
| `scope` | text | Ruang lingkup hak dan kewajiban riil |
| `status` | enum | `DRAFT`, `ACTIVE`, `EXPIRING`, `EXPIRED`, `TERMINATED`, `ARCHIVED` |
| `implementing_unit` | string FK | Fakultas / Unit pelaksana perjanjian |
| `notes` | text | Catatan evaluasi pelaksanaan |

---

## E. IMPLEMENTATION AGREEMENT (IA)

| Field | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `ia_id` | string PK | ID unik naskah teknis implementasi |
| `document_id` | string FK | Referensi ke `Document Registry` |
| `pks_id` | string FK (Nullable) | Referensi ke PKS induk |
| `document_number` | string (150) | Nomor naskah IA |
| `title` | text | Judul rancangan implementasi teknis |
| `signed_date` | date | Tanggal pengesahan naskah |
| `implementation_start` | date | Tanggal mulai kegiatan teknis |
| `implementation_end` | date | Tanggal selesai kegiatan teknis |
| `activity_name` | string (255) | Nama program / kegiatan riil |
| `pic` | string (150) | Penanggung jawab teknis dari prodi/unit |
| `budget` | decimal (15,2) | Anggaran operasional yang dialokasikan |
| `funding_source` | string (50) | Sumber pembiayaan |
| `location` | string (200) | Tempat pelaksanaan program |
| `status` | enum | `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |

---

## F. PROPOSAL (PROPOSAL KEGIATAN KEMITRAAN)

| Field | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `proposal_id` | string PK | ID unik proposal |
| `document_id` | string FK | Referensi ke `Document Registry` |
| `ia_id` | string FK (Nullable) | Referensi ke IA terkait |
| `title` | text | Judul usulan proposal kegiatan |
| `activity_start` | date | Tanggal rencana awal kegiatan |
| `activity_end` | date | Tanggal rencana akhir kegiatan |
| `location` | string (200) | Lokasi rencana penyelenggaraan |
| `participant_count` | integer | Target jumlah peserta |
| `participant_profile` | text | Profil sasaran peserta (mahasiswa, dosen, masyarakat) |
| `organizer` | string (150) | Lembaga / Himpunan / Unit pengusul |
| `pic` | string (150) | Penanggung jawab usulan |
| `committee_structure` | text | Susunan kepanitiaan pelaksana |
| `budget` | decimal (15,2) | Total usulan anggaran biaya (RAB) |
| `funding_source` | string (50) | Sumber dana yang diajukan |
| `objectives` | text | Tujuan spesifik kegiatan |
| `expected_outputs` | text | Target luaran fisik yang terukur |
| `expected_outcomes` | text | Target capaian manfaat dan kompetensi |

---

## G. FINAL REPORT (LAPORAN AKHIR PELAKSANAAN / LPJ)

| Field | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `report_id` | string PK | ID unik laporan akhir |
| `document_id` | string FK | Referensi ke `Document Registry` |
| `proposal_id` | string FK (Nullable) | Referensi ke proposal acuan |
| `report_date` | date | Tanggal penyerahan / penandatanganan LPJ |
| `actual_participant_count` | integer | Jumlah riil peserta yang hadir/lulus |
| `actual_activity_start` | date | Tanggal riil awal pelaksanaan |
| `actual_activity_end` | date | Tanggal riil akhir pelaksanaan |
| `activities_completed` | text | Ringkasan materi / kegiatan yang tuntas |
| `actual_outputs` | text | Luaran nyata yang dihasilkan (alat, modul, sertifikat) |
| `outcomes` | text | Manfaat hasil yang terbukti tercapai |
| `impact_summary` | text | Dampak institusional bagi IT Del |
| `financial_realization` | decimal (15,2) | Realisasi serapan dana riil |
| `lessons_learned` | text | Evaluasi dan pembelajaran pelaksanaan |
| `recommendations` | text | Rekomendasi perbaikan untuk periode mendatang |
| `follow_up` | text | Rencana tindak lanjut kerja sama lanjutan |

---

## H. SIGNATORY (PIHAK PENANDATANGAN)

| Field | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `signatory_id` | string PK | ID unik penandatangan |
| `entity_type` | enum | `MOU`, `PKS`, `IA`, `PROPOSAL`, `FINAL_REPORT` |
| `entity_id` | string FK | ID dokumen perjanjian terkait |
| `party_side` | enum | `IT_DEL`, `PARTNER` |
| `person_name` | string (150) | Nama lengkap pejabat penandatangan beserta gelar |
| `position_title` | string (150) | Jabatan struktural saat menandatangani |
| `institution_name` | string (200) | Nama institusi / unit penandatangan |
| `signature_date` | date | Tanggal resmi pembubuhan tanda tangan |

---

## I. ORGANIZATIONAL MAPPING (STRUKTUR ORGANISASI KAMPUS)

### Fakultas (`Faculty`):
- `faculty_id` (PK): misal `FITE`, `FTI`, `FB`
- `faculty_code`: Kode singkatan
- `faculty_name`: Nama resmi fakultas
- `status`: `ACTIVE`, `INACTIVE`

### Program Studi (`Study Program`):
- `program_id` (PK): misal `PRODI-IF`, `PRODI-MR`
- `faculty_id` (FK): Merujuk ke `Faculty`
- `program_code`: Kode prodi (misal: `S1-IF`, `D4-TRPL`)
- `program_name`: Nama program studi
- `degree_level`: `D3`, `D4`, `S1`, `S2`
- `status`: `ACTIVE`, `INACTIVE`

### Unit Internal (`Internal Unit`):
- `unit_id` (PK): misal `UNIT-KERJASAMA`, `UNIT-SDI`, `UNIT-SPM`
- `unit_code`: Singkatan unit
- `unit_name`: Nama lengkap direktorat/lembaga
- `unit_type`: `ACADEMIC`, `SUPPORT`, `RESEARCH`, `ADMINISTRATION`
- `parent_unit_id`: Relasi unit atasan jika ada
- `status`: `ACTIVE`, `INACTIVE`

---

## J. ACTIVITY (KEGIATAN KEMITRAAN RIIL)

- `activity_id` (PK): Pengenal unik aktivitas (misal: `ACT-001`)
- `ia_id` (FK): Merujuk ke naskah `IA` atau `PKS`
- `activity_name`: Nama kegiatan (misal: *Bootcamp HCIA Datacom 2024*)
- `activity_type`: `TRAINING`, `INTERNSHIP`, `RESEARCH`, `GUEST_LECTURE`, `COMMUNITY_SERVICE`, `EQUIPMENT_GRANT`
- `start_date` & `end_date`: Waktu pelaksanaan
- `location`: Tempat pelaksanaan
- `pic_id`: Dosen / staf pelaksana penanggung jawab
- `status`: `PLANNED`, `ONGOING`, `COMPLETED`, `CANCELLED`
- `description`: Uraian pelaksanaan kegiatan

---

## K. TRI DHARMA PERGURUAN TINGGI

| Field | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `tri_dharma_id` | string PK | Pengenal bidang Tri Dharma |
| `code` | string | Kode standar: `EDUCATION`, `RESEARCH_INNOVATION`, `COMMUNITY_SERVICE`, `INSTITUTIONAL` |
| `name` | string | Nama pilar: Pendidikan, Riset, Pengmas, Tata Kelola |
| `description` | text | Lingkup cakupan program kerja sama |

---

## L. OUTPUT (LUARAN KEGIATAN)

- `output_id` (PK): ID luaran
- `activity_id` (FK): Kegiatan sumber luaran
- `indicator`: Nama indikator capaian luaran (misal: *Jumlah mahasiswa tersertifikasi*)
- `target_value`: Nilai target kuantitatif yang direncanakan
- `actual_value`: Nilai capaian riil yang terverifikasi
- `unit`: Satuan pengukuran (`orang`, `dokumen`, `purwarupa`, `modul`)
- `measurement_date`: Tanggal verifikasi capaian
- `description`: Rincian luaran fisik

---

## M. OUTCOME (HASIL MANFAAT)

- `outcome_id` (PK): ID outcome
- `activity_id` (FK): Kegiatan terkait
- `indicator`: Parameter manfaat (misal: *Persentase lulusan terserap kerja < 3 bulan*)
- `baseline`: Nilai acuan sebelum kegiatan
- `target`: Target persentase peningkatan
- `actual`: Capaian riil setelah pengukuran
- `measurement_method`: Metode pengukuran (*Tracer study*, survei mitra)
- `measurement_date`: Tanggal pengukuran
- `description`: Narasi analisis capaian

---

## N. IMPACT (DAMPAK STRATEGIS INSTITUSI)

- `impact_id` (PK): ID dampak
- `activity_id` (FK): Kegiatan terkait
- `impact_domain`: Domain dampak (`ACCREDITATION`, `FINANCIAL`, `REPUTATION`, `LOCAL_ECONOMY`)
- `indicator`: Parameter tolok ukur dampak institusi
- `baseline` & `target` & `actual`: Nilai kuantitatif capaian
- `measurement_method`: Instrumen audit / asesmen
- `measurement_date`: Tanggal evaluasi
- `description`: Catatan dampak jangka panjang

---

## O. EVIDENCE (BUKTI DUKUNG FISIK)

| Field | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `evidence_id` | string PK | ID unik berkas bukti fisik (misal: `EVI-001`) |
| `activity_id` | string FK (Nullable) | Aktivitas yang didukung |
| `document_id` | string FK | Naskah perjanjian acuan |
| `evidence_type` | enum | `CERTIFICATE`, `PHOTO_ATTENDANCE`, `REPORT_LETTER`, `PUBLICATION`, `OFFICIAL_RECORD` |
| `title` | string (255) | Judul deskriptif bukti fisik |
| `description` | text | Penjelasan relevansi bukti |
| `date` | date | Tanggal penerbitan bukti |
| `verification_status` | enum | `UNVERIFIED`, `VERIFIED`, `REJECTED` |
| `verified_by` | string | Nama pejabat verifikator (Auditor SPM / Staf) |
| `verified_at` | datetime | Waktu verifikasi keabsahan bukti |

---

## P. REVIEW (TINJAUAN & KOMENTAR VALIDASI)

| Field | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `review_id` | string PK | ID catatan peninjauan |
| `entity_type` | enum | `DOCUMENT`, `EVIDENCE`, `ACTIVITY` |
| `entity_id` | string FK | ID entitas yang ditinjau |
| `reviewer_id` | string FK | ID pengguna peninjau (Staf/Biro/WR3/SPM) |
| `status` | enum | `PENDING`, `APPROVED`, `REVISION_REQUESTED`, `REJECTED` |
| `comment` | text | Catatan evaluasi atau instruksi revisi |
| `requested_action` | string | Tindakan yang harus dilakukan staf pengelola |
| `created_at` | datetime | Waktu pemberian komentar |
| `resolved_at` | datetime | Waktu revisi diselesaikan |

---

## Q. NOTIFICATION (PEMBERITAHUAN SISTEM)

- `notification_id` (PK): ID notifikasi
- `user_id`: Pengguna penerima (atau `ROLE:*` untuk siaran role)
- `type`: `EXPIRY_WARNING`, `PENDING_REVIEW`, `ORPHAN_DETECTED`, `MISSING_EVIDENCE`
- `severity`: `INFO`, `WARNING`, `DANGER`
- `title`: Judul ringkas pemberitahuan
- `message`: Narasi rincian pesan
- `entity_type` & `entity_id`: Tautan ke dokumen/objek terkait
- `created_at`: Waktu terbit notifikasi
- `read_at`: Waktu pengguna membaca notifikasi (null bila belum dibaca)

---

## R. AUDIT LOG (REKAM JEJAK MUTLAK)

- `audit_id` (PK): Pengenal entri log
- `actor_user_id`: ID pengguna atau sistem (`SYSTEM_AI`)
- `timestamp`: Waktu transaksi tercatat
- `entity_type`: Tipe entitas yang diubah
- `entity_id`: ID entitas terkait
- `action`: Kode transaksi (`CREATE`, `UPDATE`, `VALIDATE`, `CORRECT`, `REJECT`, `EXPORT`, `LINK_PARENT`)
- `field_name`: Nama field yang diubah (bila granular)
- `old_value`: Nilai sebelum diubah
- `new_value`: Nilai baru sesudah diubah
- `reason`: Alasan perubahan data

---

## S. ACCREDITATION & INDICATOR MAPPING (INSTRUMEN MUTU)

### Kerangka Akreditasi (`Accreditation Framework`):
- `framework_id` (PK): `BAN-PT-IAPS`, `LAM-INFOKOM`, `LAM-TEKNIK`
- `name`: Nama resmi instrumen akreditasi
- `version`: Versi instrumen (misal: `4.0`, `2024`)
- `effective_date`: Tanggal pemberlakuan instrumen
- `status`: `ACTIVE`, `DEPRECATED`

### Indikator Akreditasi (`Accreditation Indicator`):
- `indicator_id` (PK): misal `LAM-INFO-C14A`
- `framework_id` (FK): Merujuk ke Kerangka Akreditasi
- `code`: Kode kriteria (misal: `C.1.4.a`, `C.1.b`)
- `name`: Nama standar kerja sama
- `description`: Deskripsi pemenuhan mutu
- `required_evidence`: Jenis bukti fisik yang wajib dilampirkan
- `data_requirements`: Syarat parameter data (misal: *Harus mitra industri aktif*)

### Pemetaan Indikator (`Indicator Mapping`):
- `indicator_id` (FK)
- `entity_type`: `DOCUMENT` atau `ACTIVITY`
- `entity_id` (FK)
- `evidence_id` (FK)
- `mapping_status`: `DRAFT`, `VERIFIED`, `REJECTED`
- `notes`: Catatan auditor internal SPM

---

## T. COMPUTED FIELDS (FIELD KALKULASI DINAMIS)

Field berikut dihitung secara otomatis oleh sistem saat runtime dan tidak boleh di-hardcode:

| Computed Field | Logika Perhitungan | Nilai / Format |
| :--- | :--- | :--- |
| `days_to_expiry` | $\lceil (\text{effective\_end\_date} - \text{current\_date}) / 86400 \rceil$ | Integer (negatif jika sudah lewat) |
| `expiry_bucket` | Pengelompokan sisa masa berlaku | `GT_365` (>365 hari)<br>`181_365` (181-365 hari)<br>`91_180` (91-180 hari)<br>`31_90` (31-90 hari)<br>`0_30` (0-30 hari / Kritis)<br>`EXPIRED` ($\le 0$ hari) |
| `has_child_pks` | $\exists \text{ PKS with } \text{mou\_id} = \text{this.id}$ | Boolean (`true` / `false`) |
| `has_child_ia` | $\exists \text{ IA with } \text{pks\_id} = \text{this.id}$ | Boolean (`true` / `false`) |
| `has_proposal` | $\exists \text{ Proposal with } \text{ia\_id} = \text{this.id}$ | Boolean (`true` / `false`) |
| `has_final_report`| $\exists \text{ FinalReport with } \text{proposal\_id} = \text{this.id}$ | Boolean (`true` / `false`) |
| `has_activity` | $\exists \text{ Activity for this agreement}$ | Boolean (`true` / `false`) |
| `has_evidence` | $\exists \text{ Evidence linked to this agreement}$ | Boolean (`true` / `false`) |
| `implementation_status` | Evaluasi alur implementasi riil | `NOT_STARTED` (Belum ada PKS/kegiatan)<br>`IN_PROGRESS` (Kegiatan sedang jalan)<br>`COMPLETED` (LPJ sudah terbit)<br>`UNKNOWN` |

---

## U. DATA QUALITY FLAGS (PENANDA ANOMALI DATA)

Flag kualitas yang disematkan sistem secara otomatis:
- `missing_partner`: Mitra tidak terisi atau keyakinan rendah (<0.7).
- `duplicate_document`: Nomor dokumen terdeteksi ganda di repositori.
- `missing_signatory`: Penandatangan mitra atau IT Del tidak lengkap.
- `missing_date`: Tanggal penandatanganan tidak tertera pada naskah.
- `invalid_date_range`: `effective_end_date` $\le$ `effective_start_date`.
- `orphan_pks`: Naskah PKS tidak memiliki relasi `mou_id`.
- `orphan_ia`: Naskah IA tidak memiliki relasi `pks_id`.
- `orphan_proposal`: Proposal tidak memiliki relasi naskah pelaksana.
- `orphan_report`: Laporan akhir tidak memiliki acuan proposal.
- `low_ai_confidence`: Rata-rata skor keyakinan ekstraksi AI di bawah 0.75.
- `pending_validation`: Naskah baru diekstrak dan belum diverifikasi manusia.
- `missing_evidence`: Perjanjian aktif yang sudah jatuh tempo kegiatan namun belum memiliki bukti fisik terverifikasi.

---

## V. SOURCE & PROVENANCE (PELACAKAN ASAL-USUL DATA)

Setiap nilai field hasil ekstraksi wajib mempertahankan jejak provenance:

| Field Provenance | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `source_type` | enum | `AI`, `MANUAL`, `IMPORTED`, `SYSTEM_COMPUTED` |
| `source_document_id` | string FK | ID berkas asli sumber ekstraksi |
| `source_page` | integer | Nomor halaman pada dokumen asli |
| `source_text` | text | Cuplikan teks asli yang menjadi dasar inferensi |
| `confidence_score` | decimal (0-1) | Skor keyakinan model terhadap nilai tersebut |
| `validated_by` | string | Nama staf / pejabat yang memvalidasi data |
| `validated_at` | datetime | Waktu pengesahan data resmi |

> [!IMPORTANT]
> **Aturan Integritas Provenance:** Ketika staf melakukan koreksi terhadap nilai yang diekstrak oleh AI, metadata sumber (`source_text`, `source_page`, `confidence_score` awal) **TIDAK BOLEH DIHAPUS**. Nilai baru disimpan bersama penanda `source_type: MANUAL` dan pencatatan audit log perubahannya.
