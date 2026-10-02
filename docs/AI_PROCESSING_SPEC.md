# KSDAS IT DEL - AI Document Processing & Analytics Engine Specification

**Versi:** 0.2.0  
**Tujuan:** Panduan teknis arsitektur pemrosesan naskah kerja sama, ekstraksi metadata, pencarian relasi, penilaian kualitas, dan kueri bahasa alami.

---

## 1. Lingkup Tugas Mesin Pemrosesan

Mesin pemrosesan dokumen KSDAS mengemban 7 tugas komputasi utama:
1. **Klasifikasi Dokumen:** Mengidentifikasi kategori naskah secara otomatis.
2. **Ekstraksi Metadata (26 Field):** Menangkap seluruh parameter naskah perjanjian.
3. **Normalisasi Entitas:** Menghubungkan teks entitas mitra ke data master resmi.
4. **Usulan Relasi (Relationship Suggestion):** Mendeteksi dokumen induk secara cerdas.
5. **Penilaian Kualitas & Flags:** Mengidentifikasi anomali, duplikasi, atau data yang hilang.
6. **Kalkulasi Analitik:** Menghitung konversi *funnel*, tabulasi silang, dan proyeksi kedaluwarsa.
7. **Interpretasi Kueri Bahasa Alami:** Menerjemahkan bahasa manusia ke parameter filter database.

---

## 2. Taksonomi Jenis Dokumen

| Kode Kategori | Nama Resmi Naskah | Karakteristik / Penanda Teks |
| :--- | :--- | :--- |
| `MOU_LOI` | Nota Kesepahaman / Letter of Intent | Dokumen tingkat institusi, penandatangan Rektor, payung umum |
| `PKS_MOA` | Perjanjian Kerja Sama / Memorandum of Agreement | Dokumen tingkat fakultas/unit, memuat pasal hak & kewajiban riil |
| `IA` | Implementation Arrangement | Rencana kerja teknis operasional tingkat program studi |
| `PROPOSAL` | Proposal Usulan Kegiatan | Pengajuan program/hibah sebelum pelaksanaan dimulai |
| `FINAL_REPORT`| Laporan Akhir Pelaksanaan / LPJ | Pertanggungjawaban kegiatan, rekapitulasi nilai dan bukti dana |
| `OTHER` | Dokumen Pendukung | Surat tugas, sertifikat, berita acara |
| `UNKNOWN` | Dokumen Tak Dikenal | Format tidak memenuhi kriteria penanda kerja sama |

---

## 3. Spesifikasi 26 Field Ekstraksi Metadata

Setiap field yang diekstraksi wajib menghasilkan struktur standar berikut:
```json
{
  "value": "Nilai teks atau angka",
  "normalized_value": "Nilai terstandardisasi (ID referensi atau format ISO)",
  "confidence": 0.95,
  "source_page": 1,
  "source_text": "Kutipan kalimat naskah asli sumber ekstraksi",
  "extraction_method": "REGEX_PATTERN | HEURISTIC_PARSER | NLP_INFERENCE | SIGNATORY_RESOLVER"
}
```

### Daftar 26 Field:
1. `document_number` (Nomor surat resmi naskah)
2. `title` (Perihal / Judul perjanjian)
3. `partner` (Nama lembaga mitra)
4. `country` (Negara asal mitra)
5. `partner_signatory_name` (Nama pejabat penandatangan pihak mitra)
6. `partner_signatory_position` (Jabatan penandatangan pihak mitra)
7. `it_del_signatory_name` (Nama pejabat penandatangan pihak IT Del)
8. `it_del_signatory_position` (Jabatan penandatangan pihak IT Del)
9. `signed_date` (Tanggal penandatanganan - format YYYY-MM-DD)
10. `effective_start_date` (Tanggal mulai berlaku efektif)
11. `effective_end_date` (Tanggal berakhir masa berlaku perjanjian)
12. `scope` (Ruang lingkup kerja sama)
13. `faculty` (Fakultas yang menaungi - FITE / FTI / FB)
14. `study_program` (Program studi pelaksana)
15. `internal_unit` (Unit internal pengelola - UKS / LPPM / SDI / SPM)
16. `tri_dharma` (Pilar Tri Dharma: EDUCATION / RESEARCH / COMMUNITY_SERVICE / INSTITUTIONAL)
17. `activity_name` (Nama kegiatan implementasi naskah)
18. `PIC` (Person in Charge penanggung jawab dari IT Del)
19. `location` (Lokasi penyelenggaraan kegiatan)
20. `participant_count` (Estimasi jumlah peserta / penerima manfaat)
21. `budget` (Nilai anggaran kerja sama dalam Rupiah)
22. `funding_source` (Sumber pembiayaan: PARTNER_GRANT / CSR_AND_INTERNAL / INTERNAL_DEL)
23. `expected_output` (Target luaran yang dijanjikan)
24. `expected_outcome` (Hasil yang diharapkan)
25. `actual_output` (Realisasi capaian luaran)
26. `outcome`, `impact`, `follow_up` (Dampak institusional dan rencana tindak lanjut)

---

## 4. Mekanisme Usulan Relasi (Relationship Suggestion)

Mesin AI mencari hubungan hierarki antar-dokumen dengan urutan evaluasi:
1. **Pemeriksaan Referensi Eksplisit:** Mencari frasa naskah seperti *"Merujuk pada Nota Kesepahaman Nomor..."* atau *"Berdasarkan Perjanjian Kerja Sama Nomor..."*.
2. **Pencocokan Entitas Mitra:** Jika referensi nomor tidak ditemukan, mesin mencari dokumen induk dari mitra yang sama yang masih berstatus aktif.
3. **Pemberian Skor Keyakinan Relasi (*relationship_confidence*):**
   - 0.95 - 1.00: Nomor dokumen induk cocok persis dengan naskah yang tersimpan.
   - 0.85 - 0.94: Mitra dan fakultas cocok dengan dokumen induk aktif.
   - < 0.70: Tidak ditemukan dokumen induk yang cocok &rarr; Ditandai sebagai *candidate orphan*.

---

## 5. Indikator Kualitas Dokumen (*Quality Flags*)

Sistem menyematkan *flags* peringatan untuk membantu staf peninjau:
- `missing_partner`: Nama mitra tidak teridentifikasi dengan jelas.
- `duplicate_document`: Nomor dokumen terdeteksi ganda di dalam sistem.
- `missing_signatory`: Pihak penandatangan tidak terdeteksi lengkap.
- `missing_date`: Tanggal penandatanganan naskah kosong.
- `invalid_date_range`: Tanggal berakhir mendahului tanggal mulai berlaku.
- `orphan_pks`: PKS tidak memiliki relasi MoU induk.
- `orphan_ia`: IA tidak memiliki relasi PKS induk.
- `orphan_proposal`: Proposal tidak memiliki relasi IA pelaksana.
- `orphan_report`: Laporan akhir tidak memiliki dokumen proposal acuan.
- `low_ai_confidence`: Rata-rata skor keyakinan ekstraksi berada di bawah 75%.
- `pending_validation`: Dokumen baru diekstrak dan memerlukan verifikasi manusia.
- `missing_evidence`: Dokumen pelaksanaan belum dilengkapi bukti fisik pendukung.

---

## 6. Mesin Kueri Bahasa Alami (Natural Language Query)

Mesin NLP menerima input bahasa Indonesia bebas dan menghasilkan struktur respons terpadu:
```json
{
  "interpreted_intent": "Pencarian naskah PKS aktif bidang riset dengan mitra industri",
  "filters": {
    "document_type": "PKS_MOA",
    "partner_type": "INDUSTRY",
    "status": "ACTIVE",
    "year": 2026,
    "tri_dharma": "RESEARCH"
  },
  "metrics": ["total_agreements", "total_budget"],
  "dimensions": ["faculty", "study_program"],
  "visualization": "TABLE_AND_CHART",
  "confidence": 0.95,
  "clarification_needed": null
}
```

> [!NOTE]
> Pada prototype GitHub Pages, modul ini dijalankan menggunakan parser berbasis aturan (*Rule-Based NLP & Semantic Regex*) yang deterministik, responsif, dan tidak membutuhkan kuota API eksternal. Pada sistem produksi kampus, parser ini dapat diperkaya dengan model LLM institusional.
