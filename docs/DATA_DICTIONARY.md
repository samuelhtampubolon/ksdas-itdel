# KSDAS IT DEL - Data Dictionary & Schema Specification

**Versi:** 0.2.0  
**Tujuan:** Rujukan formal skema data untuk tim pengembang backend, database administrator, dan analisis sistem SDI/TSI IT Del.

---

## 1. Entitas `Partner` (Mitra Kerja Sama)

| Field | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(64) | PRIMARY KEY | Pengenal unik mitra (misal: `PARTNER-001`) |
| `name` | VARCHAR(255) | NOT NULL | Nama resmi entitas/perusahaan/universitas mitra |
| `code` | VARCHAR(50) | UNIQUE | Kode singkat identitas mitra (misal: `HUAWEI`, `ASTRA`) |
| `type` | VARCHAR(50) | NOT NULL | Kategori mitra (`INDUSTRY`, `UNIVERSITY`, `GOVERNMENT`, `BUMN`, `NGO`) |
| `category` | VARCHAR(50) | NULL | Sub-klasifikasi (`MULTINATIONAL`, `STATE_UNIVERSITY`, dll.) |
| `country` | VARCHAR(100) | NOT NULL | Negara asal lembaga |
| `city` | VARCHAR(100) | NULL | Kota domisili kantor pusat/cabang |
| `address` | TEXT | NULL | Alamat fisik lengkap |
| `contactPerson` | VARCHAR(150) | NULL | Nama penanggung jawab kontak mitra beserta jabatan |
| `email` | VARCHAR(100) | NULL | Alamat email resmi korespondensi |
| `phone` | VARCHAR(50) | NULL | Nomor telepon resmi kantor/PIC |
| `website` | VARCHAR(200) | NULL | Tautan situs web resmi lembaga |
| `status` | VARCHAR(20) | DEFAULT 'ACTIVE' | Status kemitraan (`ACTIVE`, `INACTIVE`) |
| `verifiedDate` | DATE | NULL | Tanggal verifikasi profil mitra oleh Unit Kerja Sama |

---

## 2. Entitas `Document` (Naskah Perjanjian & Dokumen)

| Field | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(64) | PRIMARY KEY | Pengenal unik naskah (misal: `DOC-MOU-2024-001`) |
| `documentNumber` | VARCHAR(150) | UNIQUE, NOT NULL | Nomor surat resmi yang tertera pada naskah perjanjian |
| `title` | TEXT | NOT NULL | Judul atau perihal naskah kerja sama |
| `type` | VARCHAR(30) | NOT NULL | Jenis dokumen (`MOU_LOI`, `PKS_MOA`, `IA`, `PROPOSAL`, `FINAL_REPORT`) |
| `partnerId` | VARCHAR(64) | FK -> Partner.id | Referensi lembaga mitra |
| `partnerName` | VARCHAR(255) | NOT NULL | Nama mitra tersimpan (*denormalized for query speed*) |
| `parentId` | VARCHAR(64) | FK -> Document.id | ID dokumen induk (misal PKS merujuk ke MoU) |
| `parentNumber` | VARCHAR(150) | NULL | Nomor dokumen induk yang dirujuk |
| `signedDate` | DATE | NOT NULL | Tanggal penandatanganan resmi naskah |
| `effectiveStartDate`| DATE | NOT NULL | Tanggal awal berlakunya hak dan kewajiban |
| `effectiveEndDate` | DATE | NOT NULL | Tanggal berakhirnya masa berlaku kerja sama |
| `partnerSignatoryName` | VARCHAR(150) | NULL | Nama pejabat penandatangan pihak mitra |
| `partnerSignatoryPosition` | VARCHAR(150) | NULL | Jabatan penandatangan pihak mitra |
| `itDelSignatoryName` | VARCHAR(150) | NOT NULL | Nama pejabat penandatangan pihak IT Del |
| `itDelSignatoryPosition` | VARCHAR(150) | NOT NULL | Jabatan penandatangan pihak IT Del (Rektor, Dekan, dll.) |
| `scope` | TEXT | NULL | Uraian pasal ruang lingkup kerja sama |
| `facultyId` | VARCHAR(50) | NULL | Fakultas pembina (`FITE`, `FTI`, `FB`) |
| `studyProgramId` | VARCHAR(50) | NULL | Program studi pelaksana (`PRODI-IF`, `PRODI-MR`, dll.) |
| `internalUnitId` | VARCHAR(50) | NULL | Unit pengelola (`UNIT-KERJASAMA`, `UNIT-LPPM`, dll.) |
| `triDharma` | VARCHAR(50) | NOT NULL | Pilar kegiatan (`EDUCATION`, `RESEARCH`, `COMMUNITY_SERVICE`, `INSTITUTIONAL`) |
| `activityName` | VARCHAR(255) | NULL | Nama kegiatan utama yang dimandatkan naskah |
| `pic` | VARCHAR(150) | NULL | Nama staf / dosen penanggung jawab kegiatan IT Del |
| `location` | VARCHAR(200) | NULL | Lokasi pelaksanaan program kerja sama |
| `participantCount` | INTEGER | DEFAULT 0 | Jumlah mahasiswa / dosen / masyarakat yang terlibat |
| `budget` | DECIMAL(15,2) | DEFAULT 0 | Alokasi nilai dana kerja sama |
| `fundingSource` | VARCHAR(50) | NULL | Sumber dana (`PARTNER_GRANT`, `CSR_AND_INTERNAL`, `INTERNAL_DEL`) |
| `expectedOutput` | TEXT | NULL | Target luaran yang dijanjikan dalam naskah |
| `expectedOutcome` | TEXT | NULL | Target capaian manfaat hasil |
| `actualOutput` | TEXT | NULL | Realisasi luaran fisik yang berhasil dipenuhi |
| `outcome` | TEXT | NULL | Capaian hasil nyata yang dirasakan |
| `impact` | TEXT | NULL | Dampak strategis bagi akreditasi / institusi IT Del |
| `followUp` | TEXT | NULL | Rencana kelanjutan kerja sama berikutnya |
| `status` | VARCHAR(30) | NOT NULL | Status validasi (`AI_EXTRACTED`, `NEEDS_REVIEW`, `VALIDATED`, `CORRECTED`, `REJECTED`) |
| `confidenceScore`| FLOAT | NOT NULL | Skor keyakinan ekstraksi AI (0.00 - 1.00) |
| `qualityFlags` | JSON / ARRAY | NULL | Daftar anomali naskah (`orphan_pks`, `pending_validation`, dll.) |
| `hasEvidence` | BOOLEAN | DEFAULT FALSE | Penanda ketersediaan berkas bukti fisik |
| `evidenceCount` | INTEGER | DEFAULT 0 | Jumlah berkas lampiran pendukung yang terunggah |
| `batchId` | VARCHAR(100) | NULL | Kode batch pengunggahan berkas |
| `officialDataConfirmed` | BOOLEAN | DEFAULT FALSE | Status pengesahan sebagai data resmi institusi |

---

## 3. Entitas `Activity` (Aktivitas Riil)

| Field | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(64) | PRIMARY KEY | Pengenal unik kegiatan (misal: `ACT-001`) |
| `documentId` | VARCHAR(64) | FK -> Document.id | Naskah PKS / IA acuan kegiatan |
| `title` | VARCHAR(255) | NOT NULL | Nama kegiatan pelaksanaan kemitraan |
| `triDharma` | VARCHAR(50) | NOT NULL | Klasifikasi Tri Dharma |
| `startDate` | DATE | NOT NULL | Tanggal dimulainya kegiatan |
| `endDate` | DATE | NOT NULL | Tanggal berakhirnya kegiatan |
| `pic` | VARCHAR(150) | NOT NULL | Dosen / staf pelaksana penanggung jawab |
| `participantCount` | INTEGER | DEFAULT 0 | Jumlah peserta terdaftar |
| `budget` | DECIMAL(15,2) | DEFAULT 0 | Anggaran riil yang terserap |
| `status` | VARCHAR(30) | NOT NULL | Status pelaksanaan (`ONGOING`, `COMPLETED`, `CANCELLED`) |

---

## 4. Entitas `Evidence` (Bukti Fisik & Dokumen Pendukung)

| Field | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(64) | PRIMARY KEY | Pengenal bukti fisik (misal: `EVI-001`) |
| `title` | VARCHAR(255) | NOT NULL | Judul berkas bukti fisik |
| `type` | VARCHAR(50) | NOT NULL | Jenis (`CERTIFICATE`, `PHOTO_ATTENDANCE`, `REPORT_LETTER`, `PUBLICATION`) |
| `documentId` | VARCHAR(64) | FK -> Document.id | Naskah kerja sama terkait |
| `activityId` | VARCHAR(64) | FK -> Activity.id | Aktivitas terkait (opsional) |
| `fileUrl` | VARCHAR(255) | NOT NULL | Tautan path / URL berkas di object storage |
| `fileName` | VARCHAR(255) | NOT NULL | Nama asli berkas lampiran |
| `fileSize` | VARCHAR(50) | NULL | Ukuran berkas |
| `uploadedDate` | DATE | NOT NULL | Tanggal unggah |
| `uploadedBy` | VARCHAR(100) | NOT NULL | Nama staf pengunggah |
| `verified` | BOOLEAN | DEFAULT FALSE | Status verifikasi keabsahan bukti oleh SPM/Biro |
| `verifiedBy` | VARCHAR(100) | NULL | Pejabat yang memverifikasi |
| `mappedCriteria`| JSON / ARRAY | NULL | Indikator akreditasi yang didukung bukti ini |

---

## 5. Entitas `AuditLog` (Rekam Jejak Sistem)

| Field | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(64) | PRIMARY KEY | Pengenal log transaksi |
| `timestamp` | TIMESTAMP WITH TZ | NOT NULL | Waktu kejadian pencatatan (ISO 8601) |
| `userRole` | VARCHAR(50) | NOT NULL | Peran pengguna yang melakukan aksi |
| `userName` | VARCHAR(100) | NOT NULL | Nama pengguna / agen sistem pengeksekusi |
| `action` | VARCHAR(50) | NOT NULL | Kode aksi (`DOCUMENT_UPLOADED`, `AI_EXTRACTED`, `STATUS_VALIDATED`, dll.) |
| `documentNumber` | VARCHAR(150) | NULL | Nomor dokumen yang terdampak |
| `details` | TEXT | NOT NULL | Rincian narasi perubahan nilai atau aksi |
