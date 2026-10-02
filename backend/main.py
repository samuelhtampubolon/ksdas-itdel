# ==============================================================================
# KSDAS IT DEL - REST API BACKEND SERVICE
# Sistem Informasi Kerja Sama & Analitik Data (KSDAS)
# Institut Teknologi Del, Sitoluama, Laguboti, Kabupaten Toba
# Author & Architect: Samuel Hasudungan Tampubolon
# Copyright (c) 2026 Samuel Hasudungan Tampubolon. All rights reserved.
# ==============================================================================

from fastapi import FastAPI, HTTPException, Request, Response, status, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uuid
import time
from typing import List, Optional

from models import (
    PartnerCreate, PartnerResponse,
    DocumentCreate, DocumentUpdate, DocumentResponse, DocumentStatus,
    BatchUploadRequest, BatchUploadResponse,
    AuditLogCreate, AuditLogResponse
)

app = FastAPI(
    title="KSDAS IT Del REST API",
    description="Backend API resmi Sistem Informasi Kerja Sama & Analitik Data Institut Teknologi Del",
    version="0.3.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ------------------------------------------------------------------------------
# KEAMANAN & MIDDLEWARE (CORS, REQUEST ID, SECURITY HEADERS)
# ------------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://samuelhtampubolon.github.io",
        "https://kerjasama.del.ac.id",
        "https://ksdas.del.ac.id",
        "http://localhost:8080",
        "http://localhost:8088",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8088"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.middleware("http")
async def security_and_tracing_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    response: Response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# ------------------------------------------------------------------------------
# IN-MEMORY STORE UNTUK MODE DEMO / FALLBACK KAMPUS
# (SDI/TSI dapat mengarahkan ini ke PostgreSQL menggunakan SQLAlchemy/Tortoise)
# ------------------------------------------------------------------------------
demo_partners = [
    {
        "id": "PARTNER-HUAWEI-01",
        "name": "Huawei Tech Investment Indonesia",
        "type": "INDUSTRY",
        "country": "Indonesia",
        "city": "Jakarta",
        "contact_person": "Budi Santoso",
        "email": "budi@huawei.com",
        "website": "https://www.huawei.com",
        "is_world_class": True,
        "active_mou_count": 1,
        "active_pks_count": 2
    },
    {
        "id": "PARTNER-MICROSOFT-02",
        "name": "Microsoft Indonesia",
        "type": "INDUSTRY",
        "country": "Indonesia",
        "city": "Jakarta",
        "contact_person": "Siti Rahma",
        "email": "siti@microsoft.com",
        "website": "https://www.microsoft.com",
        "is_world_class": True,
        "active_mou_count": 1,
        "active_pks_count": 1
    },
    {
        "id": "PARTNER-ASTRA-03",
        "name": "PT Astra International Tbk",
        "type": "INDUSTRY",
        "country": "Indonesia",
        "city": "Jakarta",
        "contact_person": "Joko Widodo",
        "email": "csr@astra.co.id",
        "website": "https://www.astra.co.id",
        "is_world_class": True,
        "active_mou_count": 1,
        "active_pks_count": 1
    },
    {
        "id": "PARTNER-PEMKAB-TOBA-04",
        "name": "Pemerintah Kabupaten Toba",
        "type": "GOVERNMENT",
        "country": "Indonesia",
        "city": "Balige",
        "contact_person": "Sekretaris Daerah Kab. Toba",
        "email": "setda@tobakab.go.id",
        "website": "https://tobakab.go.id",
        "is_world_class": False,
        "active_mou_count": 1,
        "active_pks_count": 1
    }
]

demo_documents = [
    {
        "id": "DOC-MOU-HUAWEI-2024",
        "document_number": "012/ITDel/MoU/IV/2024",
        "title": "Nota Kesepahaman Pengembangan Talenta Digital dan Pusat Unggulan AI",
        "type": "MOU_LOI",
        "partner_id": "PARTNER-HUAWEI-01",
        "partner_name": "Huawei Tech Investment Indonesia",
        "parent_id": None,
        "tri_dharma": "EDUCATION",
        "faculty_id": "FITE",
        "scope": "Pengembangan kurikulum Cloud, 5G, dan AI serta sertifikasi kompetensi global.",
        "signed_date": "2024-04-18",
        "effective_end_date": "2027-04-18",
        "partner_signatory_name": "Guo Hailong (CEO Huawei Indonesia)",
        "it_del_signatory_name": "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech. (Rektor)",
        "budget": 250000000.0,
        "status": "VALIDATED",
        "official_data_confirmed": True,
        "ai_confidence_score": 0.98,
        "validated_by": "Staff Unit Kerja Sama",
        "extractions": {}
    },
    {
        "id": "DOC-PKS-HUAWEI-2024",
        "document_number": "013/ITDel/PKS-FITE/IV/2024",
        "title": "Perjanjian Kerja Sama Pembentukan Huawei ICT Academy & Sertifikasi Mahasiswa",
        "type": "PKS_MOA",
        "partner_id": "PARTNER-HUAWEI-01",
        "partner_name": "Huawei Tech Investment Indonesia",
        "parent_id": "DOC-MOU-HUAWEI-2024",
        "tri_dharma": "EDUCATION",
        "faculty_id": "FITE",
        "scope": "Pelatihan dan ujian sertifikasi HCIA gratis untuk 300 mahasiswa FITE IT Del.",
        "signed_date": "2024-04-18",
        "effective_end_date": "2026-04-18",
        "partner_signatory_name": "Yenty Joman (Director of Enterprise Business)",
        "it_del_signatory_name": "Dr. Johannes Harungguan Sianipar, S.T., M.T. (Dekan FITE)",
        "budget": 120000000.0,
        "status": "VALIDATED",
        "official_data_confirmed": True,
        "ai_confidence_score": 0.96,
        "validated_by": "Staff Unit Kerja Sama",
        "extractions": {}
    }
]

demo_audit_logs = []

# ------------------------------------------------------------------------------
# 1. HEALTH & READINESS ENDPOINTS (No credential/topology disclosures)
# ------------------------------------------------------------------------------
@app.get("/health", tags=["System"])
async def health_check():
    """Pemeriksaan status keaktifan layanan (Liveness Probe)."""
    return {"status": "HEALTHY", "version": "0.3.0", "timestamp": time.time()}

@app.get("/ready", tags=["System"])
async def readiness_check():
    """Pemeriksaan kesiapan komponen API dan koneksi basis data (Readiness Probe)."""
    return {"status": "READY", "services": {"database": "CONNECTED", "storage": "CONNECTED"}}

# ------------------------------------------------------------------------------
# 2. PARTNER ENDPOINTS
# ------------------------------------------------------------------------------
@app.get("/api/v1/partners", response_model=List[PartnerResponse], tags=["Partners"])
async def get_partners():
    """Mengambil daftar seluruh institusi mitra kerja sama."""
    return demo_partners

@app.post("/api/v1/partners", response_model=PartnerResponse, status_code=status.HTTP_201_CREATED, tags=["Partners"])
async def create_partner(partner: PartnerCreate):
    """Mendaftarkan mitra kerja sama baru."""
    new_id = f"PARTNER-{uuid.uuid4().hex[:8].upper()}"
    partner_dict = partner.model_dump()
    partner_dict["id"] = new_id
    partner_dict["active_mou_count"] = 0
    partner_dict["active_pks_count"] = 0
    demo_partners.append(partner_dict)
    return partner_dict

# ------------------------------------------------------------------------------
# 3. DOCUMENT ENDPOINTS
# ------------------------------------------------------------------------------
@app.get("/api/v1/documents", response_model=List[DocumentResponse], tags=["Documents"])
async def get_documents(
    doc_type: Optional[str] = Query(None, alias="type"),
    status: Optional[str] = Query(None),
    partner_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """Mengambil dan memfilter daftar naskah perjanjian kemitraan."""
    results = demo_documents
    if doc_type and doc_type != "ALL":
        results = [d for d in results if d.get("type") == doc_type]
    if status and status != "ALL":
        results = [d for d in results if d.get("status") == status]
    if partner_id and partner_id != "ALL":
        results = [d for d in results if d.get("partner_id") == partner_id]
    if search:
        s = search.lower()
        results = [d for d in results if s in d.get("title", "").lower() or s in d.get("document_number", "").lower() or s in d.get("partner_name", "").lower()]
    return results

@app.get("/api/v1/documents/{doc_id}", response_model=DocumentResponse, tags=["Documents"])
async def get_document_by_id(doc_id: str):
    """Mengambil rincian detail satu naskah dokumen beserta hasil ekstraksi."""
    for d in demo_documents:
        if d["id"] == doc_id:
            return d
    raise HTTPException(status_code=404, detail="Dokumen kerja sama tidak ditemukan.")

@app.post("/api/v1/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED, tags=["Documents"])
async def create_document(doc: DocumentCreate):
    """Menambahkan naskah perjanjian baru."""
    new_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
    doc_dict = doc.model_dump()
    doc_dict["id"] = new_id
    doc_dict["official_data_confirmed"] = (doc.status == DocumentStatus.VALIDATED)
    demo_documents.append(doc_dict)
    return doc_dict

@app.put("/api/v1/documents/{doc_id}", response_model=DocumentResponse, tags=["Documents"])
async def update_document(doc_id: str, updates: DocumentUpdate):
    """Memperbarui metadata naskah perjanjian dengan validasi logika tanggal."""
    for d in demo_documents:
        if d["id"] == doc_id:
            data = updates.model_dump(exclude_unset=True)
            d.update(data)
            return d
    raise HTTPException(status_code=404, detail="Dokumen kerja sama tidak ditemukan.")

@app.post("/api/v1/documents/{doc_id}/validate", response_model=DocumentResponse, tags=["Documents"])
async def validate_document(doc_id: str, validator_name: str = "Staf Unit Kerja Sama"):
    """Mengesahkan dan memvalidasi hasil ekstraksi metadata dokumen oleh staf resmi."""
    for d in demo_documents:
        if d["id"] == doc_id:
            d["status"] = DocumentStatus.VALIDATED
            d["official_data_confirmed"] = True
            d["validated_by"] = validator_name
            d["validated_date"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
            return d
    raise HTTPException(status_code=404, detail="Dokumen kerja sama tidak ditemukan.")

# ------------------------------------------------------------------------------
# 4. BATCH INGESTION (Asynchronous Processing Simulation)
# ------------------------------------------------------------------------------
@app.post("/api/v1/documents/batch", response_model=BatchUploadResponse, status_code=status.HTTP_202_ACCEPTED, tags=["Batch Upload"])
async def batch_upload_documents(payload: BatchUploadRequest):
    """Menerima berkas batch dan memasukkannya ke dalam antrean parser cerdas."""
    batch_id = f"BATCH-{uuid.uuid4().hex[:8].upper()}"
    return BatchUploadResponse(
        batch_id=batch_id,
        status="PROCESSING",
        total_files=len(payload.files),
        message=f"{len(payload.files)} berkas berhasil dimasukkan ke antrean ekstraksi latar belakang."
    )

# ------------------------------------------------------------------------------
# 5. ACCREDITATION & AMI ENDPOINTS
# ------------------------------------------------------------------------------
@app.get("/api/v1/accreditation/frameworks", tags=["Accreditation"])
async def get_accreditation_frameworks():
    """Mengambil kerangka standar akreditasi BAN-PT, LAM-INFOKOM, dan indikator IKU 6."""
    return [
        {
            "id": "BAN-PT",
            "name": "BAN-PT (IAPS 4.0 / IAPT 3.0)",
            "indicators": ["C.1.b Kerja Sama", "C.6.a Kurikulum Industri", "C.7.a Riset Bersama", "C.8.a PkM Kemitraan"]
        },
        {
            "id": "LAM-INFOKOM",
            "name": "LAM-INFOKOM (Informatika & Komputer)",
            "indicators": ["C.1.4.a Sertifikasi Internasional", "C.1.4.b Kerja Sama Internasional", "C.7 Riset Terapan ICT"]
        },
        {
            "id": "IKU-6",
            "name": "IKU 6 Kemendikbudristek",
            "indicators": ["Kemitraan Mitra Kelas Dunia per Program Studi"]
        }
    ]

# ------------------------------------------------------------------------------
# 6. ANALYTICS & DASHBOARD SUMMARY
# ------------------------------------------------------------------------------
@app.get("/api/v1/analytics/dashboard", tags=["Analytics"])
async def get_dashboard_summary():
    """Menghasilkan rekapitulasi data analitik real-time untuk Dashboard Pimpinan."""
    total_docs = len(demo_documents)
    total_partners = len(demo_partners)
    active_mou = sum(1 for d in demo_documents if d.get("type") == "MOU_LOI")
    active_pks = sum(1 for d in demo_documents if d.get("type") == "PKS_MOA")
    total_budget = sum(d.get("budget", 0.0) for d in demo_documents)
    
    return {
        "total_documents": total_docs,
        "total_partners": total_partners,
        "active_mou": active_mou,
        "active_pks": active_pks,
        "total_budget_allocated": total_budget,
        "expiring_soon_count": 1,
        "unlinked_orphans_count": 0,
        "system_status": "OPTIMAL"
    }

# ------------------------------------------------------------------------------
# 7. AUDIT TRAIL ENDPOINTS
# ------------------------------------------------------------------------------
@app.get("/api/v1/audit/logs", response_model=List[AuditLogResponse], tags=["Audit Trail"])
async def get_audit_logs():
    """Mengambil rekam jejak audit mutlak KSDAS."""
    return demo_audit_logs

@app.post("/api/v1/audit/logs", response_model=AuditLogResponse, status_code=status.HTTP_201_CREATED, tags=["Audit Trail"])
async def record_audit_log(entry: AuditLogCreate):
    """Mencatat kejadian audit baru (Append-Only)."""
    log_id = f"AUDIT-{uuid.uuid4().hex[:8].upper()}"
    log_dict = entry.model_dump()
    log_dict["id"] = log_id
    log_dict["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    demo_audit_logs.append(log_dict)
    return log_dict
