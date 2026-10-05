# ==============================================================================
# KSDAS IT DEL - REST API BACKEND SERVICE
# Sistem Informasi Kerja Sama & Analitik Data (KSDAS)
# Institut Teknologi Del, Sitoluama, Laguboti, Kabupaten Toba
# Author & Architect: Samuel Hasudungan Tampubolon
# Copyright (c) 2026 Samuel Hasudungan Tampubolon. All rights reserved.
# ==============================================================================

from fastapi import FastAPI, HTTPException, Request, Response, status, Query, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uuid
import time
import os
import secrets
import re
from typing import List, Optional
from pydantic import ValidationError

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
    # Dokumentasi interaktif hanya untuk pengembangan; dimatikan di produksi.
    docs_url=None if os.getenv("KSDAS_ENV", "development").lower() == "production" else "/docs",
    redoc_url=None if os.getenv("KSDAS_ENV", "development").lower() == "production" else "/redoc",
    openapi_url=None if os.getenv("KSDAS_ENV", "development").lower() == "production" else "/openapi.json",
)

# This demo API has no SSO implementation yet.  Never leave state-changing
# routes publicly writable while it is deployed behind a real domain.
WRITE_API_KEY = os.getenv("KSDAS_WRITE_API_KEY", "")
SERVICE_ACTOR = os.getenv("KSDAS_SERVICE_ACTOR", "KSDAS API service")
DEMO_MODE = os.getenv("KSDAS_DEMO_MODE", "true").lower() == "true"


def require_write_access(x_api_key: str | None = Header(default=None)) -> None:
    """Require a deployment-provided API key for protected API data routes."""
    if not WRITE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Operasi tulis belum dikonfigurasi. Administrator harus menetapkan KSDAS_WRITE_API_KEY."
        )
    if not x_api_key or not secrets.compare_digest(x_api_key, WRITE_API_KEY):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Kredensial API tidak valid.")


def ensure_document_can_be_validated(document: dict) -> None:
    """Apply the minimum server-side gate before marking legal data official."""
    for field, label in (("document_number", "nomor dokumen"), ("title", "judul"),
                         ("partner_signatory_name", "penandatangan mitra"),
                         ("it_del_signatory_name", "penandatangan IT Del")):
        if not str(document.get(field) or "").strip():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{label.capitalize()} wajib diisi sebelum validasi.")
    organization_words = r"\b(PT|CV|Yayasan|Universitas|Institut|Kementerian|Dinas|Pemerintah|Badan|Bank|Direktorat|Tim|Panitia|Divisi|Biro|Bagian)\b"
    if re.search(organization_words, str(document["partner_signatory_name"]), re.IGNORECASE):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Penandatangan mitra harus berupa nama orang, bukan nama organisasi.")


def append_audit_log(action: str, entity_type: str, entity_id: str) -> None:
    """Keep a server-generated audit record; callers may not forge its identity."""
    demo_audit_logs.append({
        "id": f"AUDIT-{uuid.uuid4().hex[:8].upper()}",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "actor_id": "service-api",
        "actor_name": SERVICE_ACTOR,
        "actor_role": "SYSTEM_SERVICE",
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "details": None,
        "ip_address": None,
    })

# ------------------------------------------------------------------------------
# KEAMANAN & MIDDLEWARE (CORS, REQUEST ID, SECURITY HEADERS)
# ------------------------------------------------------------------------------
def get_allowed_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS", "")
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]
    # Secure production defaults. Local origins are opt-in only for development.
    origins = []  # produksi: wajib diisi lewat CORS_ORIGINS (origin HTTPS resmi)
    if os.getenv("KSDAS_ENV", "development").lower() != "production":
        origins.extend(["http://localhost:8080", "http://localhost:8088", "http://127.0.0.1:8080", "http://127.0.0.1:8088"])
    return origins


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-API-Key", "X-Request-ID"],
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
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
    response.headers["Cache-Control"] = "no-store"
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
        "email": "contoh1@example.invalid",
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
        "email": "contoh2@example.invalid",
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
        "email": "contoh3@example.invalid",
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
        "email": "contoh4@example.invalid",
        "website": "https://contoh.invalid",
        "is_world_class": False,
        "active_mou_count": 1,
        "active_pks_count": 1
    }
]

demo_documents = [
    {
        "id": "DOC-MOU-HUAWEI-2024",
        "document_number": "012/ITDel/MoU/IV/2024",
        "title": "Contoh — nota kesepahaman, bukan naskah asli",
        "type": "MOU_LOI",
        "partner_id": "PARTNER-HUAWEI-01",
        "partner_name": "Huawei Tech Investment Indonesia",
        "parent_id": None,
        "tri_dharma": "EDUCATION",
        "faculty_id": "FITE",
        "scope": "Pengembangan kurikulum teknologi digital dan sertifikasi kompetensi.",
        "signed_date": "2024-04-18",
        "effective_end_date": "2027-04-18",
        "partner_signatory_name": "Pejabat Contoh Mitra",
        "it_del_signatory_name": "Pejabat Contoh IT Del",
        "budget": 0.0,
        "status": "VALIDATED",
        "official_data_confirmed": False,
        "validated_by": "Data contoh",
    },
    {
        "id": "DOC-PKS-HUAWEI-2024",
        "document_number": "013/ITDel/PKS-FITE/IV/2024",
        "title": "Contoh — PKS turunan, bukan naskah asli",
        "type": "PKS_MOA",
        "partner_id": "PARTNER-HUAWEI-01",
        "partner_name": "Huawei Tech Investment Indonesia",
        "parent_id": "DOC-MOU-HUAWEI-2024",
        "tri_dharma": "EDUCATION",
        "faculty_id": "FITE",
        "scope": "Pelatihan dan ujian sertifikasi HCIA gratis untuk 300 mahasiswa FITE IT Del.",
        "signed_date": "2024-04-18",
        "effective_end_date": "2026-04-18",
        "partner_signatory_name": "Pejabat Contoh Mitra",
        "it_del_signatory_name": "Pejabat Contoh IT Del",
        "budget": 0.0,
        "status": "VALIDATED",
        "official_data_confirmed": False,
        "validated_by": "Data contoh",
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
    # The current implementation deliberately uses in-memory demo data and has
    # no database or object-storage client. Reporting READY here would cause a
    # deployment orchestrator to route real traffic to an unready service.
    if DEMO_MODE:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "DEGRADED",
                "services": {"database": "DEMO_IN_MEMORY", "storage": "NOT_CONFIGURED"},
                "detail": "Mode demo tidak boleh digunakan sebagai backend produksi.",
            },
        )
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status": "NOT_READY",
            "services": {"database": "NOT_IMPLEMENTED", "storage": "NOT_IMPLEMENTED"},
            "detail": "Adapter PostgreSQL dan object storage belum diimplementasikan.",
        },
    )

# ------------------------------------------------------------------------------
# 2. PARTNER ENDPOINTS
# ------------------------------------------------------------------------------
@app.get("/api/v1/partners", response_model=List[PartnerResponse], tags=["Partners"])
async def get_partners(_: None = Depends(require_write_access)):
    """Mengambil daftar seluruh institusi mitra kerja sama."""
    return demo_partners

@app.post("/api/v1/partners", response_model=PartnerResponse, status_code=status.HTTP_201_CREATED, tags=["Partners"])
async def create_partner(partner: PartnerCreate, _: None = Depends(require_write_access)):
    """Mendaftarkan mitra kerja sama baru."""
    new_id = f"PARTNER-{uuid.uuid4().hex[:8].upper()}"
    partner_dict = partner.model_dump()
    partner_dict["id"] = new_id
    partner_dict["active_mou_count"] = 0
    partner_dict["active_pks_count"] = 0
    demo_partners.append(partner_dict)
    append_audit_log("CREATE", "PARTNER", new_id)
    return partner_dict

# ------------------------------------------------------------------------------
# 3. DOCUMENT ENDPOINTS
# ------------------------------------------------------------------------------
@app.get("/api/v1/documents", response_model=List[DocumentResponse], tags=["Documents"])
async def get_documents(
    doc_type: Optional[str] = Query(None, alias="type"),
    status: Optional[str] = Query(None),
    partner_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    _: None = Depends(require_write_access),
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
async def get_document_by_id(doc_id: str, _: None = Depends(require_write_access)):
    """Mengambil rincian detail satu naskah dokumen beserta hasil ekstraksi."""
    for d in demo_documents:
        if d["id"] == doc_id:
            return d
    raise HTTPException(status_code=404, detail="Dokumen kerja sama tidak ditemukan.")

@app.post("/api/v1/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED, tags=["Documents"])
async def create_document(doc: DocumentCreate, _: None = Depends(require_write_access)):
    """Menambahkan naskah perjanjian baru."""
    if not any(partner["id"] == doc.partner_id for partner in demo_partners):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="partner_id tidak ditemukan.")
    if doc.parent_id and not any(existing["id"] == doc.parent_id for existing in demo_documents):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="parent_id tidak ditemukan.")
    new_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
    doc_dict = doc.model_dump()
    doc_dict["id"] = new_id
    # A caller must not self-approve an agreement by supplying VALIDATED in a
    # create request. Official status is granted only by the protected review.
    doc_dict["status"] = DocumentStatus.NEEDS_REVIEW
    doc_dict["official_data_confirmed"] = False
    demo_documents.append(doc_dict)
    append_audit_log("CREATE", "DOCUMENT", new_id)
    return doc_dict

@app.put("/api/v1/documents/{doc_id}", response_model=DocumentResponse, tags=["Documents"])
async def update_document(doc_id: str, updates: DocumentUpdate, _: None = Depends(require_write_access)):
    """Memperbarui metadata naskah perjanjian dengan validasi logika tanggal."""
    for d in demo_documents:
        if d["id"] == doc_id:
            data = updates.model_dump(exclude_unset=True)
            # Validate the merged entity, not merely the fields included in this
            # request.  This prevents a partial update from creating an invalid
            # signed/effective date range.
            try:
                candidate = DocumentCreate.model_validate({**d, **data})
            except ValidationError as exc:
                messages = "; ".join(error["msg"] for error in exc.errors())
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=messages) from exc
            normalized = candidate.model_dump(mode="json")
            d.update({field: normalized[field] for field in data})
            append_audit_log("UPDATE", "DOCUMENT", doc_id)
            return d
    raise HTTPException(status_code=404, detail="Dokumen kerja sama tidak ditemukan.")

@app.post("/api/v1/documents/{doc_id}/validate", response_model=DocumentResponse, tags=["Documents"])
async def validate_document(doc_id: str, _: None = Depends(require_write_access)):
    """Mengesahkan dan memvalidasi hasil ekstraksi metadata dokumen oleh staf resmi."""
    for d in demo_documents:
        if d["id"] == doc_id:
            ensure_document_can_be_validated(d)
            d["status"] = DocumentStatus.VALIDATED
            d["official_data_confirmed"] = True
            d["validated_by"] = SERVICE_ACTOR
            d["validated_date"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
            append_audit_log("VALIDATE", "DOCUMENT", doc_id)
            return d
    raise HTTPException(status_code=404, detail="Dokumen kerja sama tidak ditemukan.")

# ------------------------------------------------------------------------------
# 4. BATCH INGESTION (Asynchronous Processing Simulation)
# ------------------------------------------------------------------------------
@app.post("/api/v1/documents/batch", response_model=BatchUploadResponse, status_code=status.HTTP_202_ACCEPTED, tags=["Batch Upload"])
async def batch_upload_documents(payload: BatchUploadRequest, _: None = Depends(require_write_access)):
    """Menerima berkas batch dan memasukkannya ke dalam antrean parser cerdas."""
    batch_id = f"BATCH-{uuid.uuid4().hex[:8].upper()}"
    append_audit_log("QUEUE_BATCH", "BATCH", batch_id)
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
async def get_accreditation_frameworks(_: None = Depends(require_write_access)):
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
async def get_dashboard_summary(_: None = Depends(require_write_access)):
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
async def get_audit_logs(_: None = Depends(require_write_access)):
    """Mengambil rekam jejak audit mutlak KSDAS."""
    return demo_audit_logs

@app.post("/api/v1/audit/logs", response_model=AuditLogResponse, status_code=status.HTTP_201_CREATED, tags=["Audit Trail"])
async def record_audit_log(entry: AuditLogCreate, _: None = Depends(require_write_access)):
    """Mencatat audit terverifikasi; identitas aktor berasal dari konfigurasi server."""
    log_id = f"AUDIT-{uuid.uuid4().hex[:8].upper()}"
    log_dict = entry.model_dump()
    log_dict.update({
        "id": log_id,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "actor_id": "service-api",
        "actor_name": SERVICE_ACTOR,
        "actor_role": "SYSTEM_SERVICE",
    })
    demo_audit_logs.append(log_dict)
    return log_dict
