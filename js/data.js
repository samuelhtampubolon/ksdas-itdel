/**
 * ============================================================================
 * KERJA SAMA DATA & ANALYTICS SYSTEM (KSDAS) INSTITUT TEKNOLOGI DEL
 * ============================================================================
 * Judul Ciptaan: KSDAS IT Del - Program Komputer Tata Kelola Kemitraan
 * Pencipta & Pemegang Hak Cipta: Samuel Hasudungan Tampubolon
 * Hak Cipta: © 2026 Samuel Hasudungan Tampubolon. All rights reserved.
 * Institusi: Institut Teknologi Del, Sitoluama, Laguboti, Sumatera Utara
 * Versi: 0.2.0
 * Berkas: js/data.js (Master Seed Data & Initial Synthetic Institutional State)
 * ============================================================================
 */

window.KSDAS_SEED_DATA = {
  version: "0.2.0",
  lastUpdated: "2026-10-03T01:00:00Z",
  institution: {
    name: "Institut Teknologi Del",
    shortName: "IT Del",
    campus: "Sitoluama, Laguboti, Kabupaten Toba, Sumatera Utara",
    website: "https://www.del.ac.id"
  },
  roles: [
    { id: "ADMIN_STAFF", name: "Staff Unit Kerja Sama", level: 1, permissions: ["create", "upload", "edit", "validate", "delete", "master_edit", "export"] },
    { id: "BUREAU_HEAD", name: "Kepala Biro Kemitraan", level: 2, permissions: ["review", "validate", "edit_auth", "monitor", "export", "reports"] },
    { id: "WR3", name: "Wakil Rektor III (Kemitraan)", level: 3, permissions: ["review", "validate", "monitor", "executive_analytics", "export", "reports"] },
    { id: "EXECUTIVE_VIEWER", name: "Rektor / Dekan", level: 4, permissions: ["view", "download", "filter", "reports"] },
    { id: "QUALITY_REVIEWER", name: "SPM (Satuan Penjaminan Mutu)", level: 4, permissions: ["view", "download", "filter", "accreditation_edit", "evidence_verify", "reports"] },
    { id: "FACULTY_VIEWER", name: "Pengelola Fakultas", level: 5, permissions: ["view_faculty", "filter", "download", "add_activity"] },
    { id: "PROGRAM_VIEWER", name: "Pengelola Program Studi", level: 5, permissions: ["view_program", "filter", "download", "add_evidence"] },
    { id: "UNIT_VIEWER", name: "Pengelola Unit Internal", level: 5, permissions: ["view_unit", "filter", "download"] }
  ],
  faculties: [
    { id: "FITE", code: "FITE", name: "Fakultas Informatika dan Teknik Elektro", dean: "Dr. Johannes Harungguan Sianipar, S.T., M.T." },
    { id: "FTI", code: "FTI", name: "Fakultas Teknologi Industri", dean: "Dr. Rizal Sinaga, S.T., M.T." },
    { id: "FB", code: "FB", name: "Fakultas Bioteknologi", dean: "Dr. Merry M. Sibarani, S.Si., M.Si." }
  ],
  studyPrograms: [
    { id: "PRODI-IF", facultyId: "FITE", code: "S1-IF", name: "S1 Informatika", kaprodi: "Yusuf Kurniawan, S.T., M.Sc." },
    { id: "PRODI-SI", facultyId: "FITE", code: "S1-SI", name: "S1 Sistem Informasi", kaprodi: "Tengku M. Khairil, S.Kom., M.Kom." },
    { id: "PRODI-TE", facultyId: "FITE", code: "S1-TE", name: "S1 Teknik Elektro", kaprodi: "Indra H. M. Saragih, S.T., M.T." },
    { id: "PRODI-TRPL", facultyId: "FITE", code: "D4-TRPL", name: "D4 Teknologi Rekayasa Perangkat Lunak", kaprodi: "Ronal M. Panjaitan, S.Kom., M.T." },
    { id: "PRODI-TI", facultyId: "FITE", code: "D3-TI", name: "D3 Teknologi Informasi", kaprodi: "Nenni A. Tampubolon, S.Kom., M.Kom." },
    { id: "PRODI-TK", facultyId: "FITE", code: "D3-TK", name: "D3 Teknologi Komputer", kaprodi: "Albertus S. Silalahi, S.T., M.T." },
    { id: "PRODI-MR", facultyId: "FTI", code: "S1-MR", name: "S1 Manajemen Rekayasa", kaprodi: "Yanti N. Simamora, S.T., M.Sc." },
    { id: "PRODI-MT", facultyId: "FTI", code: "S1-MT", name: "S1 Teknik Metalurgi", kaprodi: "David H. Marpaung, S.T., M.T." },
    { id: "PRODI-BP", facultyId: "FB", code: "S1-BP", name: "S1 Teknik Bioproses", kaprodi: "Maria P. Hutapea, S.Si., M.Biotech." }
  ],
  internalUnits: [
    { id: "UNIT-KERJASAMA", code: "UKS", name: "Unit Kerja Sama & Hubungan Alumni", head: "Humasak T. A. Simanjuntak, S.T., M.ISD." },
    { id: "UNIT-SDI", code: "SDI", name: "Direktorat Sistem & Data Informasi (SDI/TSI)", head: "Gindo P. Sibuea, S.Kom., M.Kom." },
    { id: "UNIT-SPM", code: "SPM", name: "Satuan Penjaminan Mutu", head: "Dr. Arnaldo Sinaga (Ex-officio)" },
    { id: "UNIT-LPPM", code: "LPPM", name: "Lembaga Penelitian dan Pengabdian Masyarakat", head: "Dr. Fitriani Saragih, S.T., M.T." },
    { id: "UNIT-CDC", code: "CDC", name: "Career Development Center & Kemahasiswaan", head: "Monika Siahaan, S.Sos." },
    { id: "UNIT-BAAK", code: "BAAK", name: "Biro Administrasi Akademik & Kemahasiswaan", head: "Binsar Siregar, S.Si." }
  ],
  triDharmaTypes: [
    { id: "EDUCATION", code: "PENDIDIKAN", name: "Pendidikan & Pengajaran", description: "Magang MBKM, Kuliah Tamu, Kurikulum Industri, Beasiswa" },
    { id: "RESEARCH", code: "PENELITIAN", name: "Penelitian, Pengembangan & Inovasi", description: "Joint Research, Publikasi Ilmiah, Hibah Riset Bersama, Paten" },
    { id: "COMMUNITY_SERVICE", code: "PENGMAS", name: "Pengabdian kepada Masyarakat", description: "Digitalisasi Desa Wisata, Pendampingan UMKM Toba, Pelatihan Guru" },
    { id: "INSTITUTIONAL", code: "TATA_KELOLA", name: "Pengembangan Institusi & Fasilitas", description: "Donasi Laboratorium, Infrastruktur Jaringan, Benchmarking" }
  ],
  partners: [
    {
      id: "PARTNER-001",
      name: "PT Huawei Tech Investment",
      code: "HUAWEI",
      type: "INDUSTRY",
      category: "MULTINATIONAL",
      country: "Indonesia / China",
      city: "Jakarta Selatan",
      address: "Wisma Mulia 2 Lt. 28, Jl. Jend. Gatot Subroto No. 42",
      contactPerson: "Budi Santoso, Ph.D. (Director of ICT Talent Ecosystem)",
      email: "budi.santoso@huawei.com",
      phone: "+62 21 5296 3888",
      website: "https://www.huawei.com/id",
      status: "ACTIVE",
      totalAgreements: 3,
      verifiedDate: "2024-01-15",
      notes: "Mitra strategis pendirian Huawei ICT Academy dan Cloud Computing Lab di IT Del."
    },
    {
      id: "PARTNER-002",
      name: "PT Astra International Tbk",
      code: "ASTRA",
      type: "INDUSTRY",
      category: "CONGLOMERATE",
      country: "Indonesia",
      city: "Jakarta Utara",
      address: "Menara Astra, Jl. Jend. Sudirman Kav. 5-6",
      contactPerson: "Ratna Sari Dewi (Head of CSR & Education Support)",
      email: "csr.edu@astra.co.id",
      phone: "+62 21 6522 555",
      website: "https://www.astra.co.id",
      status: "ACTIVE",
      totalAgreements: 4,
      verifiedDate: "2023-08-10",
      notes: "Sponsor beasiswa prestasi, hibah alat lab rekayasa, dan perekrutan lulusan."
    },
    {
      id: "PARTNER-003",
      name: "PT Microsoft Indonesia",
      code: "MICROSOFT",
      type: "INDUSTRY",
      category: "MULTINATIONAL",
      country: "Indonesia / USA",
      city: "Jakarta Pusat",
      address: "Indonesia Stock Exchange Building Tower II, 18th Floor",
      contactPerson: "Dian Astuti (Education Industry Lead)",
      email: "dian.astuti@microsoft.com",
      phone: "+62 21 2551 8100",
      website: "https://www.microsoft.com/id-id",
      status: "ACTIVE",
      totalAgreements: 2,
      verifiedDate: "2025-02-14",
      notes: "Kerja sama AI for Education, Azure Cloud Credits untuk riset mahasiswa, dan sertifikasi Microsoft Certified Associate."
    },
    {
      id: "PARTNER-004",
      name: "PT Bank Mandiri (Persero) Tbk",
      code: "MANDIRI",
      type: "BUMN",
      category: "FINANCIAL_SERVICES",
      country: "Indonesia",
      city: "Jakarta Selatan",
      address: "Plaza Mandiri, Jl. Jend. Gatot Subroto Kav. 36-38",
      contactPerson: "Hendra Wijaya (VP Corporate Secretary / TJSL)",
      email: "tjsl@bankmandiri.co.id",
      phone: "+62 21 526 5045",
      website: "https://www.bankmandiri.co.id",
      status: "ACTIVE",
      totalAgreements: 3,
      verifiedDate: "2024-05-19",
      notes: "Digital banking student ecosystem, program magang bersertifikat, dan renovasi co-working space IT Del."
    },
    {
      id: "PARTNER-005",
      name: "Institut Teknologi Bandung",
      code: "ITB",
      type: "UNIVERSITY",
      category: "STATE_UNIVERSITY",
      country: "Indonesia",
      city: "Bandung",
      address: "Jl. Ganesa No. 10, Coblong",
      contactPerson: "Prof. Ir. Taufiq Hidayat (Direktur Kemitraan)",
      email: "kemitraan@itb.ac.id",
      phone: "+62 22 250 0935",
      website: "https://www.itb.ac.id",
      status: "ACTIVE",
      totalAgreements: 4,
      verifiedDate: "2023-01-20",
      notes: "Program bimbingan riset bersama, pertukaran dosen, dan fast-track program magister."
    },
    {
      id: "PARTNER-006",
      name: "Pemerintah Kabupaten Toba",
      code: "PEMKAB-TOBA",
      type: "GOVERNMENT",
      category: "REGIONAL_GOVERNMENT",
      country: "Indonesia",
      city: "Balige",
      address: "Jl. Sutomo No. 1, Balige, Kabupaten Toba",
      contactPerson: "Sekretaris Daerah Kab. Toba",
      email: "diskominfo@tobakab.go.id",
      phone: "+62 632 21100",
      website: "https://tobakab.go.id",
      status: "ACTIVE",
      totalAgreements: 3,
      verifiedDate: "2024-03-01",
      notes: "Kolaborasi Smart City Toba, sistem informasi pariwisata Danau Toba, dan pelatihan UMKM kriya ulos."
    },
    {
      id: "PARTNER-007",
      name: "National University of Singapore",
      code: "NUS",
      type: "UNIVERSITY",
      category: "INTERNATIONAL",
      country: "Singapura",
      city: "Singapore",
      address: "21 Lower Kent Ridge Rd",
      contactPerson: "Dr. Kevin Tan (Global Relations Officer)",
      email: "gro@nus.edu.sg",
      phone: "+65 6516 6666",
      website: "https://www.nus.edu.sg",
      status: "ACTIVE",
      totalAgreements: 2,
      verifiedDate: "2024-09-12",
      notes: "Pertukaran mahasiswa skala internasional (STEER program) dan workshop riset bioinformatika."
    },
    {
      id: "PARTNER-008",
      name: "Yayasan Inovasi Teknologi Toba Lestari",
      code: "YITTL",
      type: "NGO",
      category: "FOUNDATION",
      country: "Indonesia",
      city: "Laguboti",
      address: "Jl. Pematang Siantar KM 11",
      contactPerson: "Martua Simatupang",
      email: "info@tobalestari.org",
      phone: "+62 632 33120",
      website: "https://tobalestari.org",
      status: "INACTIVE",
      totalAgreements: 1,
      verifiedDate: "2023-04-10",
      notes: "Perlu follow up tindak lanjut pembaruan MoU yang habis masa berlaku akhir 2025."
    }
  ],
  documents: [
    {
      "id": "DOC-2024-MOU-001",
      "documentNumber": "012/ITDel/MoU/IV/2024",
      "title": "Nota Kesepahaman Kolaborasi Pengembangan Kapabilitas Sumber Daya Manusia dan Jaringan Teknologi Informasi",
      "type": "MOU_LOI",
      "partnerId": "PARTNER-001",
      "partnerName": "PT Huawei Tech Investment",
      "parentId": null,
      "parentNumber": null,
      "country": "Indonesia / Tiongkok",
      "partnerSignatoryName": "Guo Hai",
      "partnerSignatoryPosition": "Director of Enterprise Business Group",
      "itDelSignatoryName": "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
      "itDelSignatoryPosition": "Rektor Institut Teknologi Del",
      "signedDate": "2024-04-18",
      "effectiveStartDate": "2024-04-18",
      "effectiveEndDate": "2028-04-17",
      "scope": "Penyelenggaraan Huawei Authorized Information and Network Academy (HAINA), kurikulum sertifikasi industri Routing & Switching, beasiswa talenta digital, dan sertifikasi HCIA.",
      "facultyId": "FITE",
      "faculties": [
        "FITE"
      ],
      "studyProgramId": "PRODI-IF",
      "studyPrograms": [
        "PRODI-IF",
        "PRODI-SI",
        "PRODI-TE"
      ],
      "viceRectors": [
        "WR3",
        "WR1"
      ],
      "internalUnitId": "UNIT-KERJASAMA",
      "internalUnits": [
        "UNIT-KERJASAMA",
        "UNIT-LPPM"
      ],
      "triDharma": "EDUCATION",
      "triDharmaList": [
        "EDUCATION",
        "INSTITUTIONAL"
      ],
      "cooperationLevel": "Internasional",
      "studyProgramRelevance": "Sangat Relevan (Keilmuan Inti)",
      "mbkmSupport": true,
      "mbkmActivityTypes": "Studi Independen Bersertifikat, Magang Industri",
      "dtpsInvolvedCount": 8,
      "pddiktiReported": "Sudah Dilaporkan ke PDDikti",
      "pddiktiNumber": "PDDIKTI/2024/MOU/012",
      "publicationProof": "https://www.del.ac.id/berita/kerjasama-huawei-haina-2024/ & Antara News",
      "followUpStatus": "Sudah Ditindaklanjuti PKS",
      "iaDocType": "PKS Turunan",
      "monevEvidence": "Ada Laporan Monev Tahunan",
      "academicYear": "2024/2025",
      "budget": 850000000,
      "fundingSource": "Mitra Industri & Hibah Peralatan",
      "status": "VALIDATED"
    },
    {
      "id": "DOC-2024-MOU-002",
      "documentNumber": "015/ITDel/MoU/VI/2024",
      "title": "Memorandum of Understanding on Academic Cooperation, Joint Research, and Student Exchange",
      "type": "MOU_LOI",
      "partnerId": "PARTNER-003",
      "partnerName": "Universiti Teknologi Malaysia (UTM)",
      "parentId": null,
      "parentNumber": null,
      "country": "Malaysia",
      "partnerSignatoryName": "Prof. Datuk Ahmad Fauzi Ismail",
      "partnerSignatoryPosition": "Vice-Chancellor UTM",
      "itDelSignatoryName": "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
      "itDelSignatoryPosition": "Rektor Institut Teknologi Del",
      "signedDate": "2024-06-10",
      "effectiveStartDate": "2024-06-10",
      "effectiveEndDate": "2029-06-09",
      "scope": "Pertukaran mahasiswa sarjana informatika, riset bersama kecerdasan komputasi, seminar internasional, dan pembimbingan bersama tugas akhir.",
      "facultyId": "FITE",
      "faculties": [
        "FITE"
      ],
      "studyProgramId": "PRODI-IF",
      "studyPrograms": [
        "PRODI-IF",
        "PRODI-TE"
      ],
      "viceRectors": [
        "WR1",
        "WR3"
      ],
      "internalUnitId": "UNIT-KERJASAMA",
      "internalUnits": [
        "UNIT-KERJASAMA",
        "UNIT-LPPM"
      ],
      "triDharma": "RESEARCH",
      "triDharmaList": [
        "RESEARCH",
        "EDUCATION"
      ],
      "cooperationLevel": "Internasional",
      "studyProgramRelevance": "Sangat Relevan (Keilmuan Inti)",
      "mbkmSupport": true,
      "mbkmActivityTypes": "Pertukaran Mahasiswa Internasional, Kolaborasi Riset",
      "dtpsInvolvedCount": 6,
      "pddiktiReported": "Sudah Dilaporkan ke PDDikti",
      "pddiktiNumber": "PDDIKTI/2024/MOU/015",
      "publicationProof": "https://www.del.ac.id/berita/joint-research-utm-malaysia-2024/",
      "followUpStatus": "Implementasi Kegiatan Aktif",
      "iaDocType": "Implementation Arrangement (IA)",
      "monevEvidence": "Ada Laporan Monev Tahunan",
      "academicYear": "2024/2025",
      "budget": 350000000,
      "fundingSource": "Dana Kerjasama Internasional & LPPM",
      "status": "VALIDATED"
    },
    {
      "id": "DOC-2024-MOA-003",
      "documentNumber": "021/ITDel/PKS/VIII/2024",
      "title": "Perjanjian Kerja Sama Program Beasiswa Ikatan Dinas dan Laboratorium Perbankan Digital Mahasiswa",
      "type": "PKS_MOA",
      "partnerId": "PARTNER-002",
      "partnerName": "PT Bank Mandiri (Persero) Tbk",
      "parentId": null,
      "parentNumber": null,
      "country": "Indonesia",
      "partnerSignatoryName": "Darmawan Junaidi",
      "partnerSignatoryPosition": "Direktur Utama PT Bank Mandiri (Persero) Tbk",
      "itDelSignatoryName": "Humasak Tommy Argo Simanjuntak, S.T., M.ISD.",
      "itDelSignatoryPosition": "Wakil Rektor Bidang Kemitraan & Kemahasiswaan",
      "signedDate": "2024-08-15",
      "effectiveStartDate": "2024-08-15",
      "effectiveEndDate": "2027-08-14",
      "scope": "Penyaluran beasiswa prestasi dan ikatan dinas bagi mahasiswa Sistem Informasi dan Manajemen Rekayasa serta fasilitas hibah perangkat laboratorium digital banking.",
      "facultyId": "FTI",
      "faculties": [
        "FTI",
        "FITE"
      ],
      "studyProgramId": "PRODI-MR",
      "studyPrograms": [
        "PRODI-MR",
        "PRODI-SI",
        "PRODI-IF"
      ],
      "viceRectors": [
        "WR3",
        "WR2"
      ],
      "internalUnitId": "UNIT-KERJASAMA",
      "internalUnits": [
        "UNIT-KERJASAMA",
        "UNIT-CDC"
      ],
      "triDharma": "EDUCATION",
      "triDharmaList": [
        "EDUCATION",
        "INSTITUTIONAL"
      ],
      "cooperationLevel": "Nasional",
      "studyProgramRelevance": "Sangat Relevan (Keilmuan Inti)",
      "mbkmSupport": true,
      "mbkmActivityTypes": "Beasiswa Ikatan Dinas, Magang Industri",
      "dtpsInvolvedCount": 7,
      "pddiktiReported": "Sudah Dilaporkan ke PDDikti",
      "pddiktiNumber": "PDDIKTI/2024/PKS/021",
      "publicationProof": "https://www.del.ac.id/berita/beasiswa-mandiri-digital-talent/ & CNBC Indonesia",
      "followUpStatus": "Sudah Ditindaklanjuti PKS",
      "iaDocType": "Implementation Arrangement (IA)",
      "monevEvidence": "Ada Laporan Monev Tahunan",
      "academicYear": "2024/2025",
      "budget": 650000000,
      "fundingSource": "CSR & Sponsorship PT Bank Mandiri",
      "status": "VALIDATED"
    },
    {
      "id": "DOC-2024-MOA-004",
      "documentNumber": "028/ITDel/PKS/X/2024",
      "title": "Perjanjian Kerja Sama Digitalisasi Promosi Pariwisata dan Sistem Informasi Geografis Budaya Toba",
      "type": "PKS_MOA",
      "partnerId": "PARTNER-004",
      "partnerName": "Pemerintah Provinsi Sumatera Utara",
      "parentId": null,
      "parentNumber": null,
      "country": "Indonesia",
      "partnerSignatoryName": "Dr. Hassanudin",
      "partnerSignatoryPosition": "Penjabat Gubernur Sumatera Utara",
      "itDelSignatoryName": "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
      "itDelSignatoryPosition": "Rektor Institut Teknologi Del",
      "signedDate": "2024-10-05",
      "effectiveStartDate": "2024-10-05",
      "effectiveEndDate": "2027-10-04",
      "scope": "Pengembangan portal informasi kebudayaan Batak, aplikasi peta wisata ramah lingkungan terintegrasi, dan pendampingan desa wisata sekitar Danau Toba.",
      "facultyId": "FITE",
      "faculties": [
        "FITE",
        "FB"
      ],
      "studyProgramId": "PRODI-IF",
      "studyPrograms": [
        "PRODI-IF",
        "PRODI-SI",
        "PRODI-BP"
      ],
      "viceRectors": [
        "WR3",
        "WR1"
      ],
      "internalUnitId": "UNIT-KERJASAMA",
      "internalUnits": [
        "UNIT-KERJASAMA",
        "UNIT-LPPM"
      ],
      "triDharma": "COMMUNITY_SERVICE",
      "triDharmaList": [
        "COMMUNITY_SERVICE",
        "RESEARCH"
      ],
      "cooperationLevel": "Wilayah / Lokal",
      "studyProgramRelevance": "Sangat Relevan (Keilmuan Inti)",
      "mbkmSupport": true,
      "mbkmActivityTypes": "Proyek Membangun Desa, Magang Tematik",
      "dtpsInvolvedCount": 9,
      "pddiktiReported": "Sudah Dilaporkan ke PDDikti",
      "pddiktiNumber": "PDDIKTI/2024/PKS/028",
      "publicationProof": "https://disbudpar.sumutprov.go.id/kerjasama-itdel-danau-toba/",
      "followUpStatus": "Implementasi Kegiatan Aktif",
      "iaDocType": "Implementation Arrangement (IA)",
      "monevEvidence": "Ada Laporan Monev Tahunan",
      "academicYear": "2024/2025",
      "budget": 280000000,
      "fundingSource": "APBD Provinsi Sumatera Utara & IT Del",
      "status": "VALIDATED"
    },
    {
      "id": "DOC-2024-IA-005",
      "documentNumber": "033/ITDel/IA/XI/2024",
      "title": "Implementation Arrangement (IA) Penyelenggaraan Program Magang MBKM Bersertifikat dan Rekrutmen Kampus",
      "type": "IA",
      "partnerId": "PARTNER-005",
      "partnerName": "PT Astra International Tbk",
      "parentId": null,
      "parentNumber": null,
      "country": "Indonesia",
      "partnerSignatoryName": "Hendra Wijaya",
      "partnerSignatoryPosition": "Head of People and Corporate Culture Development",
      "itDelSignatoryName": "Humasak Tommy Argo Simanjuntak, S.T., M.ISD.",
      "itDelSignatoryPosition": "Wakil Rektor Bidang Kemitraan & Kemahasiswaan",
      "signedDate": "2024-11-20",
      "effectiveStartDate": "2024-11-20",
      "effectiveEndDate": "2026-11-19",
      "scope": "Penempatan 25 mahasiswa Manajemen Rekayasa dan Informatika dalam magang MBKM industri otomotif dan rantai pasok selama 6 bulan penuh dengan konversi 20 SKS.",
      "facultyId": "FTI",
      "faculties": [
        "FTI",
        "FITE"
      ],
      "studyProgramId": "PRODI-MR",
      "studyPrograms": [
        "PRODI-MR",
        "PRODI-IF"
      ],
      "viceRectors": [
        "WR3"
      ],
      "internalUnitId": "UNIT-KERJASAMA",
      "internalUnits": [
        "UNIT-KERJASAMA",
        "UNIT-CDC"
      ],
      "triDharma": "EDUCATION",
      "triDharmaList": [
        "EDUCATION"
      ],
      "cooperationLevel": "Nasional",
      "studyProgramRelevance": "Sangat Relevan (Keilmuan Inti)",
      "mbkmSupport": true,
      "mbkmActivityTypes": "Magang Bersertifikat Industri, Konversi 20 SKS",
      "dtpsInvolvedCount": 5,
      "pddiktiReported": "Sudah Dilaporkan ke PDDikti",
      "pddiktiNumber": "PDDIKTI/2024/IA/033",
      "publicationProof": "https://www.del.ac.id/berita/magang-astra-mbkm-2024/",
      "followUpStatus": "Implementasi Kegiatan Aktif",
      "iaDocType": "Implementation Arrangement (IA)",
      "monevEvidence": "Ada Laporan Monev Tahunan",
      "academicYear": "2024/2025",
      "budget": 180000000,
      "fundingSource": "PT Astra International Tbk",
      "status": "VALIDATED"
    },
    {
      "id": "DOC-2025-MOU-006",
      "documentNumber": "005/ITDel/MoU/I/2025",
      "title": "Nota Kesepahaman Sinergi Tri Dharma Perguruan Tinggi dan Tata Kelola Pemerintahan Cerdas Kabupaten Toba",
      "type": "MOU_LOI",
      "partnerId": "PARTNER-006",
      "partnerName": "Pemerintah Kabupaten Toba",
      "parentId": null,
      "parentNumber": null,
      "country": "Indonesia",
      "partnerSignatoryName": "Ir. Poltak Sitorus, M.Sc.",
      "partnerSignatoryPosition": "Bupati Toba",
      "itDelSignatoryName": "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
      "itDelSignatoryPosition": "Rektor Institut Teknologi Del",
      "signedDate": "2025-01-14",
      "effectiveStartDate": "2025-01-14",
      "effectiveEndDate": "2030-01-13",
      "scope": "Kerjasama payung induk pemanfaatan teknologi informasi untuk layanan publik satu pintu, kajian tata ruang wilayah, dan pengabdian masyarakat dosen dan mahasiswa.",
      "facultyId": "FITE",
      "faculties": [
        "FITE",
        "FTI",
        "FB"
      ],
      "studyProgramId": "PRODI-IF",
      "studyPrograms": [
        "PRODI-IF",
        "PRODI-SI",
        "PRODI-MR",
        "PRODI-BP"
      ],
      "viceRectors": [
        "WR3",
        "WR1"
      ],
      "internalUnitId": "UNIT-KERJASAMA",
      "internalUnits": [
        "UNIT-KERJASAMA",
        "UNIT-LPPM"
      ],
      "triDharma": "COMMUNITY_SERVICE",
      "triDharmaList": [
        "COMMUNITY_SERVICE",
        "EDUCATION",
        "RESEARCH"
      ],
      "cooperationLevel": "Wilayah / Lokal",
      "studyProgramRelevance": "Sangat Relevan (Keilmuan Inti)",
      "mbkmSupport": true,
      "mbkmActivityTypes": "Kuliah Kerja Nyata (KKN) Tematik, Proyek Membangun Desa",
      "dtpsInvolvedCount": 12,
      "pddiktiReported": "Sudah Dilaporkan ke PDDikti",
      "pddiktiNumber": "PDDIKTI/2025/MOU/005",
      "publicationProof": "https://tobakab.go.id/sinergi-pemkab-toba-itdel-2025/",
      "followUpStatus": "Sudah Ditindaklanjuti PKS",
      "iaDocType": "PKS Turunan",
      "monevEvidence": "Ada Laporan Monev Tahunan",
      "academicYear": "2024/2025",
      "budget": 420000000,
      "fundingSource": "APBD Pemkab Toba & Swadana Del",
      "status": "VALIDATED"
    },
    {
      "id": "DOC-2025-MOA-007",
      "documentNumber": "014/ITDel/PKS/III/2025",
      "title": "Perjanjian Kerja Sama Riset Bersama Infrastruktur Jaringan Sensor IoT dan Pemantauan Kualitas Air Danau Toba",
      "type": "PKS_MOA",
      "partnerId": "PARTNER-007",
      "partnerName": "PT Telkom Indonesia (Persero) Tbk",
      "parentId": null,
      "parentNumber": null,
      "country": "Indonesia",
      "partnerSignatoryName": "Rian Hidayat",
      "partnerSignatoryPosition": "VP Enterprise & Government Solution",
      "itDelSignatoryName": "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
      "itDelSignatoryPosition": "Rektor Institut Teknologi Del",
      "signedDate": "2025-03-22",
      "effectiveStartDate": "2025-03-22",
      "effectiveEndDate": "2027-03-21",
      "scope": "Pembangunan 5 stasiun telemetry telekomunikasi berbasis sensor nirkabel di sekitar Laguboti dan Balige, publikasi artikel jurnal terakreditasi SINTA 2, dan luaran paten bersama.",
      "facultyId": "FITE",
      "faculties": [
        "FITE"
      ],
      "studyProgramId": "PRODI-TE",
      "studyPrograms": [
        "PRODI-TE",
        "PRODI-IF"
      ],
      "viceRectors": [
        "WR1",
        "WR3"
      ],
      "internalUnitId": "UNIT-LPPM",
      "internalUnits": [
        "UNIT-LPPM",
        "UNIT-KERJASAMA"
      ],
      "triDharma": "RESEARCH",
      "triDharmaList": [
        "RESEARCH"
      ],
      "cooperationLevel": "Nasional",
      "studyProgramRelevance": "Sangat Relevan (Keilmuan Inti)",
      "mbkmSupport": false,
      "mbkmActivityTypes": "Riset Laboratorium Bersama",
      "dtpsInvolvedCount": 7,
      "pddiktiReported": "Sudah Dilaporkan ke PDDikti",
      "pddiktiNumber": "PDDIKTI/2025/PKS/014",
      "publicationProof": "https://www.del.ac.id/lppm/riset-sensor-iot-telkom-2025/",
      "followUpStatus": "Implementasi Kegiatan Aktif",
      "iaDocType": "Implementation Arrangement (IA)",
      "monevEvidence": "Ada Laporan Monev Tahunan",
      "academicYear": "2024/2025",
      "budget": 490000000,
      "fundingSource": "Matching Fund Kedaireka & PT Telkom Indonesia",
      "status": "VALIDATED"
    },
    {
      "id": "DOC-2025-IA-008",
      "documentNumber": "022/ITDel/IA/V/2025",
      "title": "Implementation Arrangement (IA) Pengabdian Masyarakat Pelatihan Pemrograman Berkelanjutan & Literasi Digital",
      "type": "IA",
      "partnerId": "PARTNER-008",
      "partnerName": "SMK Negeri 1 Laguboti",
      "parentId": "DOC-2025-MOU-006",
      "parentNumber": "005/ITDel/MoU/I/2025",
      "country": "Indonesia",
      "partnerSignatoryName": "Drs. Posman Siregar",
      "partnerSignatoryPosition": "Kepala Sekolah SMK Negeri 1 Laguboti",
      "itDelSignatoryName": "Humasak Tommy Argo Simanjuntak, S.T., M.ISD.",
      "itDelSignatoryPosition": "Wakil Rektor Bidang Kemitraan & Kemahasiswaan",
      "signedDate": "2025-05-18",
      "effectiveStartDate": "2025-05-18",
      "effectiveEndDate": "2026-05-17",
      "scope": "Pelatihan pemrograman web, basis data terapan, dan pendampingan sertifikasi kejuruan teknik komputer jaringan bagi 120 siswa kelas XI SMK Negeri 1 Laguboti.",
      "facultyId": "FITE",
      "faculties": [
        "FITE"
      ],
      "studyProgramId": "PRODI-IF",
      "studyPrograms": [
        "PRODI-IF"
      ],
      "viceRectors": [
        "WR3"
      ],
      "internalUnitId": "UNIT-KERJASAMA",
      "internalUnits": [
        "UNIT-KERJASAMA",
        "UNIT-LPPM"
      ],
      "triDharma": "COMMUNITY_SERVICE",
      "triDharmaList": [
        "COMMUNITY_SERVICE"
      ],
      "cooperationLevel": "Wilayah / Lokal",
      "studyProgramRelevance": "Sangat Relevan (Keilmuan Inti)",
      "mbkmSupport": true,
      "mbkmActivityTypes": "Asistensi Mengajar di Satuan Pendidikan",
      "dtpsInvolvedCount": 4,
      "pddiktiReported": "Sudah Dilaporkan ke PDDikti",
      "pddiktiNumber": "PDDIKTI/2025/IA/022",
      "publicationProof": "https://www.del.ac.id/pkm/pelatihan-smk-laguboti-2025/",
      "followUpStatus": "Implementasi Kegiatan Aktif",
      "iaDocType": "Implementation Arrangement (IA)",
      "monevEvidence": "Ada Laporan Monev Tahunan",
      "academicYear": "2024/2025",
      "budget": 35000000,
      "fundingSource": "Dana Pengabdian Internal IT Del",
      "status": "VALIDATED"
    },
    {
      "id": "DOC-2025-MOA-009",
      "documentNumber": "029/ITDel/PKS/VII/2025",
      "title": "Perjanjian Kerja Sama Penelitian Pemanfaatan Biomassa Serat Kayu untuk Bahan Kimia Ramah Lingkungan",
      "type": "PKS_MOA",
      "partnerId": "PARTNER-009",
      "partnerName": "PT Toba Pulp Lestari Tbk",
      "parentId": null,
      "parentNumber": null,
      "country": "Indonesia",
      "partnerSignatoryName": "Hendrik Gunawan",
      "partnerSignatoryPosition": "Head of Environmental Sustainability",
      "itDelSignatoryName": "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
      "itDelSignatoryPosition": "Rektor Institut Teknologi Del",
      "signedDate": "2025-07-25",
      "effectiveStartDate": "2025-07-25",
      "effectiveEndDate": "2028-07-24",
      "scope": "Analisis potensi lignin dan hemiselulosa dari limbah industri sebagai bahan baku bio-plastik biodegradable serta pendanaan peralatan laboratorium bioproses.",
      "facultyId": "FB",
      "faculties": [
        "FB"
      ],
      "studyProgramId": "PRODI-BP",
      "studyPrograms": [
        "PRODI-BP"
      ],
      "viceRectors": [
        "WR1",
        "WR3"
      ],
      "internalUnitId": "UNIT-LPPM",
      "internalUnits": [
        "UNIT-LPPM",
        "UNIT-KERJASAMA"
      ],
      "triDharma": "RESEARCH",
      "triDharmaList": [
        "RESEARCH"
      ],
      "cooperationLevel": "Wilayah / Lokal",
      "studyProgramRelevance": "Sangat Relevan (Keilmuan Inti)",
      "mbkmSupport": true,
      "mbkmActivityTypes": "Magang Riset Industri Bioproses",
      "dtpsInvolvedCount": 5,
      "pddiktiReported": "Sudah Dilaporkan ke PDDikti",
      "pddiktiNumber": "PDDIKTI/2025/PKS/029",
      "publicationProof": "https://www.del.ac.id/riset/kerjasama-tpl-bioproses-2025/",
      "followUpStatus": "Implementasi Kegiatan Aktif",
      "iaDocType": "Implementation Arrangement (IA)",
      "monevEvidence": "Ada Laporan Monev Tahunan",
      "academicYear": "2025/2026",
      "budget": 380000000,
      "fundingSource": "Hibah Riset Industri PT TPL",
      "status": "VALIDATED"
    },
    {
      "id": "DOC-2026-MOU-010",
      "documentNumber": "002/ITDel/MoU/I/2026",
      "title": "Nota Kesepahaman Program Kemitraan Kurikulum Perangkat Lunak Skala Global dan Akselerasi Cloud Computing",
      "type": "MOU_LOI",
      "partnerId": "PARTNER-010",
      "partnerName": "Microsoft Asia Pacific",
      "parentId": null,
      "parentNumber": null,
      "country": "Singapura / Global",
      "partnerSignatoryName": "Budi Santoso, Ph.D.",
      "partnerSignatoryPosition": "Director of Higher Education Engagements Asia Pacific",
      "itDelSignatoryName": "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.",
      "itDelSignatoryPosition": "Rektor Institut Teknologi Del",
      "signedDate": "2026-01-20",
      "effectiveStartDate": "2026-01-20",
      "effectiveEndDate": "2031-01-19",
      "scope": "Akses materi pembelajaran kurikulum cloud computing dan rekayasa perangkat lunak berskala internasional bagi seluruh dosen dan mahasiswa Program Studi S1 Informatika dan Sistem Informasi.",
      "facultyId": "FITE",
      "faculties": [
        "FITE"
      ],
      "studyProgramId": "PRODI-IF",
      "studyPrograms": [
        "PRODI-IF",
        "PRODI-SI"
      ],
      "viceRectors": [
        "WR1",
        "WR3"
      ],
      "internalUnitId": "UNIT-KERJASAMA",
      "internalUnits": [
        "UNIT-KERJASAMA"
      ],
      "triDharma": "EDUCATION",
      "triDharmaList": [
        "EDUCATION",
        "INSTITUTIONAL"
      ],
      "cooperationLevel": "Internasional",
      "studyProgramRelevance": "Sangat Relevan (Keilmuan Inti)",
      "mbkmSupport": true,
      "mbkmActivityTypes": "Studi Independen Bersertifikat Global",
      "dtpsInvolvedCount": 11,
      "pddiktiReported": "Sudah Dilaporkan ke PDDikti",
      "pddiktiNumber": "PDDIKTI/2026/MOU/002",
      "publicationProof": "https://news.microsoft.com/apac/del-cloud-education-2026/",
      "followUpStatus": "Sudah Ditindaklanjuti PKS",
      "iaDocType": "PKS Turunan",
      "monevEvidence": "Ada Laporan Monev Tahunan",
      "academicYear": "2025/2026",
      "budget": 920000000,
      "fundingSource": "Microsoft Education Grant",
      "status": "VALIDATED"
    }
  ],
  activities: [
    {
      id: "ACT-001",
      documentId: "DOC-PKS-2024-002",
      documentNumber: "028/ITDel/PKS/FITE/VI/2024",
      partnerName: "PT Huawei Tech Investment",
      triDharma: "EDUCATION",
      title: "Bootcamp dan Ujian HCIA Datacom 2024",
      startDate: "2024-09-02",
      endDate: "2024-11-30",
      pic: "Ronal M. Panjaitan, S.Kom., M.T.",
      participantCount: 60,
      facultyId: "FITE",
      studyProgramId: "PRODI-IF",
      budget: 45000000,
      status: "COMPLETED",
      outputCount: 1,
      outcomeCount: 1,
      impactScore: "HIGH",
      evidenceIds: ["EVI-001", "EVI-002"]
    },
    {
      id: "ACT-002",
      documentId: "DOC-PKS-2024-007",
      documentNumber: "019/ITDel/PKS/FTI/V/2024",
      partnerName: "PT Astra International Tbk",
      triDharma: "EDUCATION",
      title: "Magang Capstone Project Manufaktur Astra",
      startDate: "2024-06-01",
      endDate: "2024-12-05",
      pic: "Yanti N. Simamora, S.T., M.Sc.",
      participantCount: 15,
      facultyId: "FTI",
      studyProgramId: "PRODI-MR",
      budget: 150000000,
      status: "COMPLETED",
      outputCount: 3,
      outcomeCount: 2,
      impactScore: "VERY_HIGH",
      evidenceIds: ["EVI-003"]
    },
    {
      id: "ACT-003",
      documentId: "DOC-PKS-2026-008",
      documentNumber: "007/ITDel/PKS/FITE/I/2026",
      partnerName: "PT Astra International Tbk",
      triDharma: "RESEARCH",
      title: "Joint Research Machine Vision Otomotif",
      startDate: "2026-01-15",
      endDate: "2026-10-30",
      pic: "Indra H. M. Saragih, S.T., M.T.",
      participantCount: 12,
      facultyId: "FITE",
      studyProgramId: "PRODI-TE",
      budget: 275000000,
      status: "ONGOING",
      outputCount: 2,
      outcomeCount: 1,
      impactScore: "HIGH",
      evidenceIds: ["EVI-004"]
    },
    {
      id: "ACT-004",
      documentId: "DOC-PKS-2024-013",
      documentNumber: "011/ITDel/PKS/LPPM/IV/2024",
      partnerName: "Institut Teknologi Bandung",
      triDharma: "RESEARCH",
      title: "Joint Research Bioteknologi Andaliman ITB-IT Del",
      startDate: "2024-04-10",
      endDate: "2025-12-15",
      pic: "Maria P. Hutapea, S.Si., M.Biotech.",
      participantCount: 14,
      facultyId: "FB",
      studyProgramId: "PRODI-BP",
      budget: 160000000,
      status: "COMPLETED",
      outputCount: 2,
      outcomeCount: 1,
      impactScore: "HIGH",
      evidenceIds: ["EVI-005"]
    },
    {
      id: "ACT-005",
      documentId: "DOC-PKS-2024-015",
      documentNumber: "022/ITDel/PKS/FB/VII/2024",
      partnerName: "Pemerintah Kabupaten Toba",
      triDharma: "COMMUNITY_SERVICE",
      title: "Pengolahan Sampah Pasar Tradisional Balige (TPS3R)",
      startDate: "2024-08-01",
      endDate: "2025-07-01",
      pic: "Maria P. Hutapea, S.Si., M.Biotech.",
      participantCount: 25,
      facultyId: "FB",
      studyProgramId: "PRODI-BP",
      budget: 65000000,
      status: "ONGOING",
      outputCount: 1,
      outcomeCount: 1,
      impactScore: "MEDIUM",
      evidenceIds: ["EVI-006"]
    }
  ],
  evidences: [
    {
      id: "EVI-001",
      title: "Sertifikat HCIA Datacom 54 Mahasiswa Angkatan 2021",
      type: "CERTIFICATE",
      documentId: "DOC-PKS-2024-002",
      documentNumber: "028/ITDel/PKS/FITE/VI/2024",
      activityId: "ACT-001",
      fileUrl: "sample-evidence/Sertifikat_HCIA_ITDel_2024.zip",
      fileName: "Sertifikat_HCIA_ITDel_2024.zip",
      fileSize: "18.2 MB",
      uploadedDate: "2024-12-22",
      uploadedBy: "Ronal M. Panjaitan",
      verified: true,
      verifiedBy: "SPM Unit",
      verifiedDate: "2025-01-05",
      mappedCriteria: ["LAM-INFOKOM C.1.4.a", "BAN-PT C.1.b"]
    },
    {
      id: "EVI-002",
      title: "Foto Dokumentasi dan Absensi Peserta Bootcamp Huawei",
      type: "PHOTO_ATTENDANCE",
      documentId: "DOC-PKS-2024-002",
      documentNumber: "028/ITDel/PKS/FITE/VI/2024",
      activityId: "ACT-001",
      fileUrl: "sample-evidence/Dokumentasi_Bootcamp_Huawei.pdf",
      fileName: "Dokumentasi_Bootcamp_Huawei.pdf",
      fileSize: "4.8 MB",
      uploadedDate: "2024-11-28",
      uploadedBy: "Ronal M. Panjaitan",
      verified: true,
      verifiedBy: "SPM Unit",
      verifiedDate: "2025-01-05",
      mappedCriteria: ["LAM-INFOKOM C.1.4.a"]
    },
    {
      id: "EVI-003",
      title: "Laporan Evaluasi Magang Industri Astra dan Surat Keterangan Penyelesaian",
      type: "REPORT_LETTER",
      documentId: "DOC-PKS-2024-007",
      documentNumber: "019/ITDel/PKS/FTI/V/2024",
      activityId: "ACT-002",
      fileUrl: "sample-evidence/Evaluasi_Magang_Astra_2024.pdf",
      fileName: "Evaluasi_Magang_Astra_2024.pdf",
      fileSize: "3.2 MB",
      uploadedDate: "2024-12-10",
      uploadedBy: "Yanti N. Simamora",
      verified: true,
      verifiedBy: "SPM Unit",
      verifiedDate: "2024-12-15",
      mappedCriteria: ["BAN-PT C.1.b", "LAM-TEKNIK 6.3"]
    },
    {
      id: "EVI-004",
      title: "Draf Publikasi Scopus dan Dataset Citra Cacat Produksi Logam",
      type: "PUBLICATION_DATASET",
      documentId: "DOC-PKS-2026-008",
      documentNumber: "007/ITDel/PKS/FITE/I/2026",
      activityId: "ACT-003",
      fileUrl: "sample-evidence/Draft_Scopus_Astra_ITDel_2026.pdf",
      fileName: "Draft_Scopus_Astra_ITDel_2026.pdf",
      fileSize: "2.9 MB",
      uploadedDate: "2026-02-18",
      uploadedBy: "Indra H. M. Saragih",
      verified: true,
      verifiedBy: "LPPM IT Del",
      verifiedDate: "2026-02-25",
      mappedCriteria: ["BAN-PT C.7.a", "LAM-INFOKOM C.7"]
    },
    {
      id: "EVI-005",
      title: "Publikasi Jurnal Internasional Hasil Isolasi Bakteri Andaliman",
      type: "JOURNAL_ARTICLE",
      documentId: "DOC-PKS-2024-013",
      documentNumber: "011/ITDel/PKS/LPPM/IV/2024",
      activityId: "ACT-004",
      fileUrl: "sample-evidence/Journal_Andaliman_ITB_ITDel.pdf",
      fileName: "Journal_Andaliman_ITB_ITDel.pdf",
      fileSize: "1.5 MB",
      uploadedDate: "2025-03-10",
      uploadedBy: "Maria P. Hutapea",
      verified: true,
      verifiedBy: "LPPM IT Del",
      verifiedDate: "2025-03-20",
      mappedCriteria: ["BAN-PT C.7.a", "BAN-PT C.1.b"]
    },
    {
      id: "EVI-006",
      title: "Berita Acara Uji Coba Bioaktivator dan Rekap Penyaluran Kompos TPS3R",
      type: "OFFICIAL_RECORD",
      documentId: "DOC-PKS-2024-015",
      documentNumber: "022/ITDel/PKS/FB/VII/2024",
      activityId: "ACT-005",
      fileUrl: "sample-evidence/BAST_TPS3R_Balige_2024.pdf",
      fileName: "BAST_TPS3R_Balige_2024.pdf",
      fileSize: "2.1 MB",
      uploadedDate: "2024-10-05",
      uploadedBy: "Maria P. Hutapea",
      verified: true,
      verifiedBy: "SPM Unit",
      verifiedDate: "2024-10-12",
      mappedCriteria: ["BAN-PT C.8.a"]
    }
  ],
  accreditationFrameworks: [
    {
      id: "BAN-PT-IAPS",
      name: "BAN-PT IAPS 4.0 / IAPT 3.0",
      organization: "Badan Akreditasi Nasional Perguruan Tinggi",
      description: "Instrumen Akreditasi Program Studi & Perguruan Tinggi dengan 9 Kriteria Utama.",
      indicators: [
        {
          id: "BANPT-C1-KERJASAMA",
          code: "C.1.b",
          criterion: "Kriteria 1 - Visi, Misi, Tujuan dan Strategi",
          name: "Kerja Sama Tri Dharma Perguruan Tinggi",
          targetScore: 4.0,
          requiredEvidence: "MoU/PKS aktif, bukti pelaksanaan kegiatan, dokumen implementasi dan dampak nyata bagi kemitraan.",
          linkedDocumentCount: 8,
          linkedEvidenceCount: 5,
          complianceStatus: "MET"
        },
        {
          id: "BANPT-C6-PENDIDIKAN",
          code: "C.6.a",
          criterion: "Kriteria 6 - Pendidikan",
          name: "Kurikulum & Keterlibatan Praktisi Industri",
          targetScore: 4.0,
          requiredEvidence: "PKS magang MBKM, SK dosen praktisi tamu industri, silabus terintegrasi sertifikasi kompetensi.",
          linkedDocumentCount: 5,
          linkedEvidenceCount: 3,
          complianceStatus: "MET"
        },
        {
          id: "BANPT-C7-PENELITIAN",
          code: "C.7.a",
          criterion: "Kriteria 7 - Penelitian",
          name: "Penelitian Bersama Mitra Nasional & Internasional",
          targetScore: 3.5,
          requiredEvidence: "PKS riset bersama, laporan kemajuan hibah riset, luaran publikasi atau paten berelasi.",
          linkedDocumentCount: 4,
          linkedEvidenceCount: 2,
          complianceStatus: "MET"
        },
        {
          id: "BANPT-C8-PENGMAS",
          code: "C.8.a",
          criterion: "Kriteria 8 - Pengabdian kepada Masyarakat",
          name: "Pemberdayaan Masyarakat Daerah Lingkar Kampus",
          targetScore: 3.5,
          requiredEvidence: "PKS dengan Pemda/Masyarakat, dokumentasi program TPS3R / digitalisasi desa, sertifikat kepuasan mitra.",
          linkedDocumentCount: 3,
          linkedEvidenceCount: 2,
          complianceStatus: "MET"
        }
      ]
    },
    {
      id: "LAM-INFOKOM",
      name: "LAM-INFOKOM (Informatika & Komputer)",
      organization: "Lembaga Akreditasi Mandiri Informatika dan Komputer",
      description: "Standar Akreditasi Khusus Program Studi Rumpun Ilmu Informatika & Komputer.",
      indicators: [
        {
          id: "LAM-INFO-C14A",
          code: "C.1.4.a",
          criterion: "Kriteria 1 - Tata Pamong & Kerja Sama",
          name: "Kerja Sama Bidang Pendidikan & Sertifikasi Kompetensi",
          targetScore: 4.0,
          requiredEvidence: "PKS Huawei Academy, Microsoft Learn, bukti ujian sertifikasi internasional mahasiswa.",
          linkedDocumentCount: 6,
          linkedEvidenceCount: 4,
          complianceStatus: "MET"
        },
        {
          id: "LAM-INFO-C14B",
          code: "C.1.4.b",
          criterion: "Kriteria 1 - Tata Pamong & Kerja Sama",
          name: "Kerja Sama Internasional Aktif",
          targetScore: 3.5,
          requiredEvidence: "MoU/IA dengan perguruan tinggi luar negeri bereputasi (contoh: NUS STEER program).",
          linkedDocumentCount: 2,
          linkedEvidenceCount: 1,
          complianceStatus: "MET"
        },
        {
          id: "LAM-INFO-C7",
          code: "C.7",
          criterion: "Kriteria 7 - Penelitian & Inovasi Perangkat Lunak",
          name: "Riset Terapan bersama Industri ICT",
          targetScore: 3.5,
          requiredEvidence: "Dokumen proposal dan luaran publikasi riset IoT & Edge sensing.",
          linkedDocumentCount: 2,
          linkedEvidenceCount: 1,
          complianceStatus: "MET"
        }
      ]
    }
  ],
  auditLogs: [
    {
      id: "AUDIT-001",
      timestamp: "2024-04-19T08:12:00Z",
      userRole: "ADMIN_STAFF",
      userName: "Staff Unit Kerja Sama",
      action: "DOCUMENT_UPLOADED",
      documentNumber: "012/ITDel/MoU/IV/2024",
      details: "Dokumen MoU Huawei Tech Investment diunggah via Batch Upload (SEED-BATCH-01)."
    },
    {
      id: "AUDIT-002",
      timestamp: "2024-04-19T08:12:05Z",
      userRole: "SYSTEM_AI",
      userName: "Deterministic Mock AI Engine",
      action: "AI_EXTRACTED",
      documentNumber: "012/ITDel/MoU/IV/2024",
      details: "Ekstraksi 26 metadata field selesai. Skor keyakinan rata-rata: 0.98. Status: AI_EXTRACTED."
    },
    {
      id: "AUDIT-003",
      timestamp: "2024-04-20T10:30:00Z",
      userRole: "ADMIN_STAFF",
      userName: "Staff Unit Kerja Sama",
      action: "STATUS_VALIDATED",
      documentNumber: "012/ITDel/MoU/IV/2024",
      details: "Pemeriksaan manusia selesai. Status disetujui sebagai data resmi: VALIDATED."
    },
    {
      id: "AUDIT-004",
      timestamp: "2024-06-12T14:15:00Z",
      userRole: "ADMIN_STAFF",
      userName: "Staff Unit Kerja Sama",
      action: "RELATIONSHIP_LINKED",
      documentNumber: "028/ITDel/PKS/FITE/VI/2024",
      details: "Dokumen ditautkan ke parent MoU: 012/ITDel/MoU/IV/2024 (PT Huawei Tech Investment)."
    },
    {
      id: "AUDIT-005",
      timestamp: "2025-01-25T11:00:00Z",
      userRole: "BUREAU_HEAD",
      userName: "Kepala Biro Kemitraan",
      action: "EVIDENCE_VERIFIED",
      documentNumber: "028/ITDel/PKS/FITE/VI/2024",
      details: "Verifikasi sertifikat HCIA Datacom (54 mahasiswa) dan LPJ Final selesai diperiksa."
    },
    {
      id: "AUDIT-006",
      timestamp: "2026-01-16T15:30:00Z",
      userRole: "ADMIN_STAFF",
      userName: "Staff Unit Kerja Sama",
      action: "DOCUMENT_VALIDATED",
      documentNumber: "007/ITDel/PKS/FITE/I/2026",
      details: "PKS Riset AI Astra 2026 divalidasi dan dihubungkan ke MoU Induk Astra 2023."
    }
  ]
};
