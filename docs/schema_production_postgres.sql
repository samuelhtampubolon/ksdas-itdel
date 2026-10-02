-- ====================================================================
-- KSDAS IT DEL - PRODUCTION POSTGRESQL DATABASE SCHEMA V0.2
-- Sistem Informasi Kerja Sama & Analitik Data (KSDAS)
-- Institut Teknologi Del, Sitoluama, Laguboti, Sumatera Utara
-- Target Engine: PostgreSQL 14+ / 16
-- ====================================================================

BEGIN;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
CREATE TYPE partner_type_enum AS ENUM (
    'Perguruan Tinggi',
    'Sekolah',
    'Pemerintah',
    'BUMN',
    'Swasta/Industri',
    'NGO',
    'Komunitas',
    'Internasional',
    'Lainnya'
);

CREATE TYPE partner_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

CREATE TYPE document_type_enum AS ENUM (
    'MOU_LOI',
    'PKS_MOA',
    'IA',
    'PROPOSAL',
    'FINAL_REPORT',
    'OTHER',
    'UNKNOWN'
);

CREATE TYPE processing_status_enum AS ENUM (
    'UPLOADED',
    'PARSING',
    'EXTRACTED',
    'CLASSIFIED',
    'LINKED',
    'READY_FOR_REVIEW',
    'VALIDATED',
    'FAILED'
);

CREATE TYPE validation_status_enum AS ENUM (
    'PENDING',
    'VALIDATED',
    'REJECTED',
    'CORRECTED'
);

CREATE TYPE agreement_status_enum AS ENUM (
    'DRAFT',
    'ACTIVE',
    'EXPIRING',
    'EXPIRED',
    'TERMINATED',
    'ARCHIVED'
);

CREATE TYPE tri_dharma_code_enum AS ENUM (
    'EDUCATION',
    'RESEARCH_INNOVATION',
    'COMMUNITY_SERVICE',
    'INSTITUTIONAL'
);

CREATE TYPE party_side_enum AS ENUM ('IT_DEL', 'PARTNER');
CREATE TYPE source_type_enum AS ENUM ('AI', 'MANUAL', 'IMPORTED', 'SYSTEM_COMPUTED');
CREATE TYPE evidence_type_enum AS ENUM ('CERTIFICATE', 'PHOTO_ATTENDANCE', 'REPORT_LETTER', 'PUBLICATION', 'OFFICIAL_RECORD');
CREATE TYPE verification_status_enum AS ENUM ('UNVERIFIED', 'VERIFIED', 'REJECTED');

-- ====================================================================
-- 3. ORGANIZATIONAL TABLES
-- ====================================================================

CREATE TABLE faculties (
    faculty_id VARCHAR(50) PRIMARY KEY,
    faculty_code VARCHAR(20) NOT NULL UNIQUE,
    faculty_name VARCHAR(150) NOT NULL,
    dean_name VARCHAR(150),
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE TABLE study_programs (
    program_id VARCHAR(50) PRIMARY KEY,
    faculty_id VARCHAR(50) NOT NULL REFERENCES faculties(faculty_id) ON DELETE RESTRICT,
    program_code VARCHAR(20) NOT NULL UNIQUE,
    program_name VARCHAR(150) NOT NULL,
    degree_level VARCHAR(10) NOT NULL, -- D3, D4, S1, S2
    head_name VARCHAR(150),
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE TABLE internal_units (
    unit_id VARCHAR(50) PRIMARY KEY,
    unit_code VARCHAR(20) NOT NULL UNIQUE,
    unit_name VARCHAR(150) NOT NULL,
    unit_type VARCHAR(50) NOT NULL, -- ACADEMIC, SUPPORT, RESEARCH, ADMINISTRATION
    parent_unit_id VARCHAR(50) REFERENCES internal_units(unit_id),
    head_name VARCHAR(150),
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE TABLE tri_dharmas (
    tri_dharma_id VARCHAR(50) PRIMARY KEY,
    code tri_dharma_code_enum NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- ====================================================================
-- 4. PARTNERS (MITRA KERJA SAMA)
-- ====================================================================

CREATE TABLE partners (
    partner_id VARCHAR(64) PRIMARY KEY,
    legal_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    partner_type partner_type_enum NOT NULL,
    category VARCHAR(50),
    country VARCHAR(100) NOT NULL DEFAULT 'Indonesia',
    province VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    website VARCHAR(255),
    contact_person VARCHAR(150),
    contact_position VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    status partner_status_enum NOT NULL DEFAULT 'ACTIVE',
    verified_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 5. DOCUMENT REGISTRY (REGISTRI BERKAS FISIK & DOKUMEN)
-- ====================================================================

CREATE TABLE documents (
    document_id VARCHAR(64) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    document_type document_type_enum NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_reference VARCHAR(255) NOT NULL,
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_status processing_status_enum NOT NULL DEFAULT 'UPLOADED',
    validation_status validation_status_enum NOT NULL DEFAULT 'PENDING',
    confidence_score NUMERIC(4,3) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    checksum VARCHAR(64) NOT NULL,
    batch_id VARCHAR(100),
    raw_ocr_text TEXT,
    metadata_json JSONB,
    quality_flags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_validation_status ON documents(validation_status);
CREATE INDEX idx_documents_checksum ON documents(checksum);

-- ====================================================================
-- 6. HIERARCHICAL AGREEMENTS (MOU, PKS, IA, PROPOSAL, FINAL REPORT)
-- ====================================================================

-- 6.1 MOU / LOI
CREATE TABLE mous (
    mou_id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) NOT NULL REFERENCES documents(document_id) ON DELETE RESTRICT,
    partner_id VARCHAR(64) NOT NULL REFERENCES partners(partner_id) ON DELETE RESTRICT,
    document_number VARCHAR(150) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    signed_date DATE NOT NULL,
    effective_start_date DATE NOT NULL,
    effective_end_date DATE NOT NULL,
    scope TEXT,
    country VARCHAR(100) DEFAULT 'Indonesia',
    status agreement_status_enum NOT NULL DEFAULT 'ACTIVE',
    renewal_status VARCHAR(50) DEFAULT 'NOT_REQUESTED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_mou_dates CHECK (effective_end_date >= effective_start_date)
);

-- 6.2 PKS / MOA
CREATE TABLE pks (
    pks_id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) NOT NULL REFERENCES documents(document_id) ON DELETE RESTRICT,
    mou_id VARCHAR(64) REFERENCES mous(mou_id) ON DELETE SET NULL, -- Nullable for orphan detection
    partner_id VARCHAR(64) NOT NULL REFERENCES partners(partner_id) ON DELETE RESTRICT,
    faculty_id VARCHAR(50) REFERENCES faculties(faculty_id),
    study_program_id VARCHAR(50) REFERENCES study_programs(program_id),
    internal_unit_id VARCHAR(50) REFERENCES internal_units(unit_id),
    tri_dharma tri_dharma_code_enum NOT NULL DEFAULT 'EDUCATION',
    document_number VARCHAR(150) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    signed_date DATE NOT NULL,
    effective_start_date DATE NOT NULL,
    effective_end_date DATE NOT NULL,
    scope TEXT,
    budget NUMERIC(15,2) DEFAULT 0,
    funding_source VARCHAR(50),
    status agreement_status_enum NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_pks_dates CHECK (effective_end_date >= effective_start_date)
);

-- 6.3 IMPLEMENTATION ARRANGEMENT (IA)
CREATE TABLE implementation_arrangements (
    ia_id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) NOT NULL REFERENCES documents(document_id) ON DELETE RESTRICT,
    pks_id VARCHAR(64) REFERENCES pks(pks_id) ON DELETE SET NULL,
    document_number VARCHAR(150) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    signed_date DATE NOT NULL,
    implementation_start DATE NOT NULL,
    implementation_end DATE NOT NULL,
    activity_name VARCHAR(255) NOT NULL,
    pic VARCHAR(150),
    budget NUMERIC(15,2) DEFAULT 0,
    funding_source VARCHAR(50),
    location VARCHAR(200),
    status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_ia_dates CHECK (implementation_end >= implementation_start)
);

-- 6.4 PROPOSALS
CREATE TABLE proposals (
    proposal_id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) NOT NULL REFERENCES documents(document_id) ON DELETE RESTRICT,
    ia_id VARCHAR(64) REFERENCES implementation_arrangements(ia_id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    activity_start DATE,
    activity_end DATE,
    location VARCHAR(200),
    participant_count INTEGER DEFAULT 0,
    participant_profile TEXT,
    organizer VARCHAR(150),
    pic VARCHAR(150),
    committee_structure TEXT,
    budget NUMERIC(15,2) DEFAULT 0,
    funding_source VARCHAR(50),
    objectives TEXT,
    expected_outputs TEXT,
    expected_outcomes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6.5 FINAL REPORTS / LPJ
CREATE TABLE final_reports (
    report_id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) NOT NULL REFERENCES documents(document_id) ON DELETE RESTRICT,
    proposal_id VARCHAR(64) REFERENCES proposals(proposal_id) ON DELETE SET NULL,
    report_date DATE NOT NULL,
    actual_participant_count INTEGER DEFAULT 0,
    actual_activity_start DATE,
    actual_activity_end DATE,
    activities_completed TEXT,
    actual_outputs TEXT,
    outcomes TEXT,
    impact_summary TEXT,
    financial_realization NUMERIC(15,2) DEFAULT 0,
    lessons_learned TEXT,
    recommendations TEXT,
    follow_up TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 7. SIGNATORIES & REVIEWS
-- ====================================================================

CREATE TABLE signatories (
    signatory_id VARCHAR(64) PRIMARY KEY,
    entity_type document_type_enum NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    party_side party_side_enum NOT NULL,
    person_name VARCHAR(150) NOT NULL,
    position_title VARCHAR(150) NOT NULL,
    institution_name VARCHAR(200) NOT NULL,
    signature_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    review_id VARCHAR(64) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    reviewer_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    comment TEXT NOT NULL,
    requested_action VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- ====================================================================
-- 8. ACTIVITIES, EVIDENCE & IMPACT TRACKING
-- ====================================================================

CREATE TABLE activities (
    activity_id VARCHAR(64) PRIMARY KEY,
    ia_id VARCHAR(64) REFERENCES implementation_arrangements(ia_id) ON DELETE SET NULL,
    pks_id VARCHAR(64) REFERENCES pks(pks_id) ON DELETE SET NULL,
    activity_name VARCHAR(255) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    tri_dharma tri_dharma_code_enum NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(200),
    pic VARCHAR(150),
    participant_count INTEGER DEFAULT 0,
    budget NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'ONGOING',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evidences (
    evidence_id VARCHAR(64) PRIMARY KEY,
    activity_id VARCHAR(64) REFERENCES activities(activity_id) ON DELETE SET NULL,
    document_id VARCHAR(64) REFERENCES documents(document_id) ON DELETE CASCADE,
    evidence_type evidence_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(50),
    verification_status verification_status_enum NOT NULL DEFAULT 'UNVERIFIED',
    verified_by VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE,
    mapped_criteria TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE outputs (
    output_id VARCHAR(64) PRIMARY KEY,
    activity_id VARCHAR(64) NOT NULL REFERENCES activities(activity_id) ON DELETE CASCADE,
    indicator VARCHAR(255) NOT NULL,
    target_value NUMERIC(10,2),
    actual_value NUMERIC(10,2),
    unit VARCHAR(50),
    measurement_date DATE,
    description TEXT
);

CREATE TABLE outcomes (
    outcome_id VARCHAR(64) PRIMARY KEY,
    activity_id VARCHAR(64) NOT NULL REFERENCES activities(activity_id) ON DELETE CASCADE,
    indicator VARCHAR(255) NOT NULL,
    baseline NUMERIC(10,2),
    target NUMERIC(10,2),
    actual NUMERIC(10,2),
    measurement_method VARCHAR(150),
    measurement_date DATE,
    description TEXT
);

CREATE TABLE impacts (
    impact_id VARCHAR(64) PRIMARY KEY,
    activity_id VARCHAR(64) NOT NULL REFERENCES activities(activity_id) ON DELETE CASCADE,
    impact_domain VARCHAR(50) NOT NULL, -- ACCREDITATION, FINANCIAL, REPUTATION
    indicator VARCHAR(255) NOT NULL,
    baseline NUMERIC(10,2),
    target NUMERIC(10,2),
    actual NUMERIC(10,2),
    measurement_method VARCHAR(150),
    measurement_date DATE,
    description TEXT
);

-- ====================================================================
-- 9. ACCREDITATION (CONFIGURABLE)
-- ====================================================================

CREATE TABLE accreditation_frameworks (
    framework_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    organization VARCHAR(150) NOT NULL,
    version VARCHAR(50) NOT NULL,
    effective_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    description TEXT
);

CREATE TABLE accreditation_indicators (
    indicator_id VARCHAR(50) PRIMARY KEY,
    framework_id VARCHAR(50) NOT NULL REFERENCES accreditation_frameworks(framework_id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    criterion VARCHAR(150) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    required_evidence TEXT,
    data_requirements TEXT,
    target_score NUMERIC(3,2) DEFAULT 4.0
);

CREATE TABLE indicator_mappings (
    mapping_id VARCHAR(64) PRIMARY KEY,
    indicator_id VARCHAR(50) NOT NULL REFERENCES accreditation_indicators(indicator_id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    evidence_id VARCHAR(64) REFERENCES evidences(evidence_id) ON DELETE SET NULL,
    mapping_status VARCHAR(50) DEFAULT 'VERIFIED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 10. NOTIFICATIONS & AUDIT TRAIL
-- ====================================================================

CREATE TABLE notifications (
    notification_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- INFO, WARNING, DANGER
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE audit_logs (
    audit_id VARCHAR(64) PRIMARY KEY,
    actor_user_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    action VARCHAR(50) NOT NULL,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    reason TEXT
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ====================================================================
-- 11. MATERIALIZED / COMPUTED VIEWS FOR REPORTING & ANALYTICS
-- ====================================================================

-- 11.1 Expiry Monitoring View (Computed Expiry Buckets)
CREATE OR REPLACE VIEW v_expiry_monitoring AS
SELECT 
    p.pks_id AS agreement_id,
    'PKS_MOA' AS agreement_type,
    p.document_number,
    p.title,
    prt.legal_name AS partner_name,
    p.effective_end_date,
    (p.effective_end_date - CURRENT_DATE) AS days_to_expiry,
    CASE 
        WHEN (p.effective_end_date - CURRENT_DATE) < 0 THEN 'EXPIRED'
        WHEN (p.effective_end_date - CURRENT_DATE) <= 30 THEN '0_30'
        WHEN (p.effective_end_date - CURRENT_DATE) <= 90 THEN '31_90'
        WHEN (p.effective_end_date - CURRENT_DATE) <= 180 THEN '91_180'
        WHEN (p.effective_end_date - CURRENT_DATE) <= 365 THEN '181_365'
        ELSE 'GT_365'
    END AS expiry_bucket
FROM pks p
JOIN partners prt ON p.partner_id = prt.partner_id
WHERE p.status = 'ACTIVE'
UNION ALL
SELECT 
    m.mou_id AS agreement_id,
    'MOU_LOI' AS agreement_type,
    m.document_number,
    m.title,
    prt.legal_name AS partner_name,
    m.effective_end_date,
    (m.effective_end_date - CURRENT_DATE) AS days_to_expiry,
    CASE 
        WHEN (m.effective_end_date - CURRENT_DATE) < 0 THEN 'EXPIRED'
        WHEN (m.effective_end_date - CURRENT_DATE) <= 30 THEN '0_30'
        WHEN (m.effective_end_date - CURRENT_DATE) <= 90 THEN '31_90'
        WHEN (m.effective_end_date - CURRENT_DATE) <= 180 THEN '91_180'
        WHEN (m.effective_end_date - CURRENT_DATE) <= 365 THEN '181_365'
        ELSE 'GT_365'
    END AS expiry_bucket
FROM mous m
JOIN partners prt ON m.partner_id = prt.partner_id
WHERE m.status = 'ACTIVE';

-- 11.2 Orphan Agreements View
CREATE OR REPLACE VIEW v_orphan_agreements AS
SELECT 
    p.pks_id AS agreement_id,
    'PKS_MOA' AS agreement_type,
    p.document_number,
    p.title,
    prt.legal_name AS partner_name,
    p.signed_date
FROM pks p
JOIN partners prt ON p.partner_id = prt.partner_id
WHERE p.mou_id IS NULL;

COMMIT;
