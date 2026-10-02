# KSDAS IT DEL - System Architecture & Engineering Specification

**Sistem Informasi Kerja Sama & Analitik Data (KSDAS)**  
**Institut Teknologi Del (IT Del), Laguboti, Kabupaten Toba**  
**Versi Dokumen:** 0.2.0  
**Target Pembaca:** Direktorat SDI / TSI / Tim Duktek / Unit Kerja Sama  

---

## 1. Ringkasan Eksekutif

KSDAS IT Del dirancang untuk mentransformasikan pengelolaan dokumen kemitraan yang sebelumnya terfragmentasi menjadi satu ekosistem data terpadu:

$$\text{Documents} \longrightarrow \text{Structured Data} \longrightarrow \text{Information} \longrightarrow \text{Analytics} \longrightarrow \text{Evidence} \longrightarrow \text{Accreditation Report}$$

Prototype ini berjalan pada **GitHub Pages** sebagai aplikasi satu halaman (*Single-Page Application / SPA*) tanpa dependensi backend wajib pada fase pembuktian konsep (*Proof-of-Concept*), dengan persistensi lokal `localStorage` serta kapabilitas ekspor/impor JSON penuh.

---

## 2. Arsitektur Komponen & Modul (SPA Prototype)

```mermaid
graph TD
    subgraph UI_Shell ["UI Shell & Presentation Layer"]
        Nav["Sidebar Navigation"]
        Header["Header (Role Switcher, Search Ctrl+K, Notif)"]
        Router["Client Hash Router (#dashboard, #repository, ...)"]
    end

    subgraph Core_Modules ["Core Business Modules"]
        Dash["Dashboard & KPIs"]
        Repo["Document Repository & Multi-filter"]
        Batch["Batch Upload AI Engine"]
        Val["Human-in-the-Loop Validation"]
        Rel["Relationship & Tree Explorer"]
        Part["Master Mitra Directory"]
        Act["Activity & Evidence Management"]
        AnalyticsMod["In-Depth Analytics & Crosstab"]
        Accred["Accreditation Workspace (BAN-PT, LAM)"]
        RepGen["Report Generator (Print/PDF)"]
        NLQ["Natural Language Query Copilot"]
        AuditMod["Audit Trail Log"]
    end

    subgraph Service_Engines ["Service & Logic Engines"]
        Store["KSDASStore (State, Versioning, Subscriptions)"]
        MockAI["KSDASMockAI (Deterministic NLP, 26 Fields, Regex)"]
        AnalyticsEng["KSDASAnalytics (Chart.js, Funnel, Gaps, Expiry)"]
        UIEng["KSDASUI (Modals, Toasts, Formatters)"]
    end

    subgraph Persistence ["Persistence Layer"]
        LocalSt["Browser localStorage (Key: ksdas_itdel_store_v2)"]
        Seed["Window.KSDAS_SEED_DATA (Laguboti Real Context)"]
        JSONIO["JSON Export / Import Backup"]
    end

    Router --> Core_Modules
    Core_Modules --> Service_Engines
    Service_Engines --> Persistence
```

---

## 3. Alur Data (Data Flow Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Staf as Staf Unit Kerja Sama / Pengunggah
    participant UI as Batch Upload UI
    participant AI as Mock AI Engine
    participant Store as Store & LocalStorage
    actor Reviewer as Reviewer / Kepala Biro / WR3
    participant Dashboard as Dashboard & Repositori

    Staf->>UI: Unggah Berkas (PDF/DOCX) atau Muat 10 Dokumen Sampel
    UI->>AI: Kirim Teks Dokumen & Nama Berkas
    AI->>AI: 1. Klasifikasi Jenis (MoU/PKS/IA/Prop/Report)
    AI->>AI: 2. Ekstraksi 26 Metadata Field
    AI->>AI: 3. Normalisasi Mitra & Deteksi Relasi Parent
    AI->>AI: 4. Hitung Skor Confidence & Quality Flags
    AI->>Store: Simpan Dokumen dengan Status = AI_EXTRACTED
    Store->>UI: Tampilkan Antrean Menunggu Validasi (Pusat Notifikasi)
    
    Reviewer->>UI: Buka Workspace Validasi Side-by-Side
    UI->>Reviewer: Tampilkan Teks Asli Berkas (Kiri) vs Form Koreksi (Kanan)
    Reviewer->>Store: Setujui (VALIDATED) / Simpan Koreksi (CORRECTED)
    Store->>Store: Tambahkan Rekam Jejak ke Audit Trail
    Store->>Dashboard: Data Resmi Diperbarui ke Dashboard & Pelaporan Akreditasi
```

---

## 4. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    PARTNER ||--o{ DOCUMENT : "memiliki"
    DOCUMENT ||--o{ DOCUMENT : "memiliki turunan (parentId)"
    DOCUMENT ||--o{ ACTIVITY : "menghasilkan"
    ACTIVITY ||--o{ EVIDENCE : "didukung oleh"
    FACULTY ||--o{ STUDY_PROGRAM : "membawahi"
    STUDY_PROGRAM ||--o{ DOCUMENT : "pelaksana"
    INTERNAL_UNIT ||--o{ DOCUMENT : "pengelola"
    ACCREDITATION_FRAMEWORK ||--o{ ACCREDITATION_INDICATOR : "memiliki"
    ACCREDITATION_INDICATOR ||--o{ EVIDENCE : "memetakan"
    USER_ROLE ||--o{ AUDIT_LOG : "mencatat aksi"

    PARTNER {
        string id PK
        string name
        string code
        string type "INDUSTRY|UNIVERSITY|GOVERNMENT|BUMN|NGO"
        string country
        string city
        string contactPerson
        string email
        string status "ACTIVE|INACTIVE"
    }

    DOCUMENT {
        string id PK
        string documentNumber UK
        string title
        string type "MOU_LOI|PKS_MOA|IA|PROPOSAL|FINAL_REPORT|OTHER"
        string partnerId FK
        string parentId FK "Ref to Parent Document"
        string signedDate
        string effectiveStartDate
        string effectiveEndDate
        string partnerSignatoryName
        string itDelSignatoryName
        string facultyId FK
        string studyProgramId FK
        string internalUnitId FK
        string triDharma "EDUCATION|RESEARCH|COMMUNITY_SERVICE|INSTITUTIONAL"
        decimal budget
        string status "AI_EXTRACTED|NEEDS_REVIEW|VALIDATED|CORRECTED|REJECTED"
        float confidenceScore
        string qualityFlags
        boolean officialDataConfirmed
    }

    ACTIVITY {
        string id PK
        string documentId FK
        string title
        string triDharma
        date startDate
        date endDate
        string pic
        int participantCount
        decimal budget
        string status "ONGOING|COMPLETED"
    }

    EVIDENCE {
        string id PK
        string title
        string type "CERTIFICATE|PHOTO_ATTENDANCE|REPORT_LETTER|PUBLICATION"
        string documentId FK
        string activityId FK
        string fileUrl
        boolean verified
        string verifiedBy
        string mappedCriteria
    }

    ACCREDITATION_INDICATOR {
        string id PK
        string frameworkId FK
        string code
        string criterion
        string name
        string requiredEvidence
        string complianceStatus "MET|PARTIALLY_MET|NOT_MET"
    }

    AUDIT_LOG {
        string id PK
        datetime timestamp
        string userRole
        string action
        string documentNumber
        string details
    }
```

---

## 5. Batasan Antarmuka Produksi (API Boundary for Production)

Ketika SDI/TSI memindahkan aplikasi ini ke server produksi institusi IT Del, antarmuka REST API berikut direkomendasikan untuk menggantikan `KSDASStore`:

| Endpoint | Metode | Peran Otorisasi | Keterangan |
| :--- | :---: | :---: | :--- |
| `/api/v1/auth/sso/login` | POST | Publik | Autentikasi terintegrasi SSO IT Del |
| `/api/v1/documents` | GET | Semua Role | Pengambilan daftar dokumen dengan pagination & query params |
| `/api/v1/documents` | POST | Staff, Biro, WR3 | Pembuatan dokumen baru atau penyimpanan manual |
| `/api/v1/documents/{id}` | GET | Semua Role | Rincian metadata dan salinan bukti dokumen |
| `/api/v1/documents/{id}/validate` | PUT | Staff, Biro, WR3 | Persetujuan validasi manusia (AI_EXTRACTED &rarr; VALIDATED) |
| `/api/v1/documents/batch-upload` | POST | Staff | Unggah multipart file berkas ke MinIO/S3 + antrean worker |
| `/api/v1/ai/extract` | POST | Worker/Service | Service backend OCR (Tesseract / Gemini Document AI) |
| `/api/v1/partners` | GET, POST, PUT | Staff, Viewer | Pengelolaan data master mitra kerja sama |
| `/api/v1/analytics/kpis` | GET | Semua Role | Agregasi KPI eksekutif teroptimasi database |
| `/api/v1/accreditation/mapping`| GET, POST | SPM, Staff | Pemetaan indikator akreditasi ke evidence |
| `/api/v1/audit-trail` | GET | Biro, WR3, Auditor | Pengambilan rekam jejak sistem |

---

## 6. Rencana Transisi Menuju Produksi (SDI / TSI Roadmap)

1. **Database:** Migrasi skema JSON ke tabel relasional **PostgreSQL 16** dengan indexing pada `document_number`, `partner_id`, dan `status`.
2. **Penyimpanan Berkas:** Ganti referensi file simulasi dengan penyimpanan objek privat **MinIO / AWS S3** dengan presigned URLs dan antivirus scanning.
3. **Autentikasi:** Integrasikan sistem masuk tunggal (SSO) IT Del berbasis **OAuth2 / OpenID Connect**.
4. **Ekstraksi AI Produksi:** Gunakan service microservice Python FastAPI yang menggabungkan OCR (Tesseract / PDFPlumber) dan LLM API terotorisasi institusi (Vertex AI / Google Gemini) untuk ekstraksi dokumen naskah asli berbahasa Indonesia.
5. **Hosting:** Deploy frontend containerized (Nginx) di jaringan intranet kampus Del.
