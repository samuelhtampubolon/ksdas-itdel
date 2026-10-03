# ==============================================================================
# KSDAS IT DEL - DATA MODELS & VALIDATION SCHEMA (BACKEND)
# Sistem Informasi Kerja Sama & Analitik Data (KSDAS)
# Institut Teknologi Del, Sitoluama, Laguboti, Kabupaten Toba
# Author & Architect: Samuel Hasudungan Tampubolon
# Copyright (c) 2026 Samuel Hasudungan Tampubolon. All rights reserved.
# ==============================================================================

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum
import html
import re

class DocumentType(str, Enum):
    MOU_LOI = "MOU_LOI"
    PKS_MOA = "PKS_MOA"
    IA = "IA"
    PROPOSAL = "PROPOSAL"
    FINAL_REPORT = "FINAL_REPORT"

class DocumentStatus(str, Enum):
    AI_EXTRACTED = "AI_EXTRACTED"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    VALIDATED = "VALIDATED"
    REJECTED = "REJECTED"
    ACTIVE = "ACTIVE"
    EXPIRING = "EXPIRING"
    EXPIRED = "EXPIRED"

class TriDharmaCategory(str, Enum):
    EDUCATION = "EDUCATION"
    RESEARCH = "RESEARCH"
    COMMUNITY_SERVICE = "COMMUNITY_SERVICE"
    INSTITUTIONAL = "INSTITUTIONAL"

class PartnerType(str, Enum):
    INDUSTRY = "INDUSTRY"
    UNIVERSITY = "UNIVERSITY"
    GOVERNMENT = "GOVERNMENT"
    COMMUNITY = "COMMUNITY"
    INTERNATIONAL = "INTERNATIONAL"

# Helper function to sanitize user strings and prevent injection
def sanitize_str(val: Optional[str]) -> Optional[str]:
    if val is None:
        return None
    # Strip dangerous characters and escape HTML entities
    cleaned = html.escape(val.strip())
    return cleaned

# ------------------------------------------------------------------------------
# PARTNER MODELS
# ------------------------------------------------------------------------------
class PartnerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Nama resmi institusi mitra")
    type: PartnerType = Field(default=PartnerType.INDUSTRY, description="Kategori mitra")
    country: str = Field(default="Indonesia", max_length=100)
    city: Optional[str] = Field(default=None, max_length=100)
    contact_person: Optional[str] = Field(default=None, max_length=150)
    email: Optional[str] = Field(default=None, max_length=150)
    website: Optional[str] = Field(default=None, max_length=255)
    is_world_class: bool = Field(default=False, description="Kualifikasi Mitra Kelas Dunia IKU 6")

    @field_validator("name", "city", "contact_person")
    @classmethod
    def clean_text(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_str(v)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        value = v.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Email mitra tidak valid.")
        return value

    @field_validator("website")
    @classmethod
    def validate_website(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        value = v.strip()
        if not re.fullmatch(r"https?://[^\s/$.?#][^\s]*", value, re.IGNORECASE):
            raise ValueError("Website harus menggunakan URL http:// atau https:// yang valid.")
        return value

class PartnerCreate(PartnerBase):
    pass

class PartnerResponse(PartnerBase):
    id: str
    active_mou_count: int = 0
    active_pks_count: int = 0
    created_at: Optional[datetime] = None

# ------------------------------------------------------------------------------
# DOCUMENT MODELS
# ------------------------------------------------------------------------------
class DocumentBase(BaseModel):
    document_number: str = Field(..., min_length=3, max_length=100, description="Nomor resmi naskah perjanjian")
    title: str = Field(..., min_length=5, max_length=500, description="Judul lengkap perjanjian")
    type: DocumentType = Field(..., description="Jenis naskah (MOU_LOI, PKS_MOA, IA, dll)")
    partner_id: str = Field(..., description="ID mitra yang bekerja sama")
    partner_name: str = Field(..., description="Nama mitra")
    parent_id: Optional[str] = Field(default=None, description="ID naskah induk (MoU untuk PKS, PKS untuk IA)")
    tri_dharma: TriDharmaCategory = Field(default=TriDharmaCategory.EDUCATION)
    faculty_id: Optional[str] = Field(default="FITE", max_length=50)
    scope: Optional[str] = Field(default=None, description="Ruang lingkup kerja sama")
    signed_date: Optional[date] = Field(default=None, description="Tanggal penandatanganan naskah")
    effective_end_date: Optional[date] = Field(default=None, description="Tanggal masa berlaku berakhir")
    partner_signatory_name: Optional[str] = Field(default=None, max_length=150)
    it_del_signatory_name: Optional[str] = Field(default=None, max_length=150)
    budget: Optional[float] = Field(default=0.0, ge=0.0, description="Alokasi anggaran naskah (Rp)")
    status: DocumentStatus = Field(default=DocumentStatus.NEEDS_REVIEW)
    ai_confidence_score: Optional[float] = Field(default=0.90, ge=0.0, le=1.0)
    extractions: Optional[Dict[str, Any]] = Field(default_factory=dict)

    @field_validator("document_number", "title", "scope", "partner_signatory_name", "it_del_signatory_name")
    @classmethod
    def clean_text(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_str(v)

    # Validasi logika tanggal: effective_end_date harus >= signed_date
    @model_validator(mode="after")
    def validate_date_range(self):
        if self.signed_date and self.effective_end_date:
            if self.effective_end_date < self.signed_date:
                raise ValueError("Tanggal berakhir harus sama atau setelah tanggal penandatanganan/mulai.")
        return self

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    document_number: Optional[str] = None
    title: Optional[str] = None
    partner_name: Optional[str] = None
    scope: Optional[str] = None
    tri_dharma: Optional[TriDharmaCategory] = None
    signed_date: Optional[date] = None
    effective_end_date: Optional[date] = None
    partner_signatory_name: Optional[str] = None
    it_del_signatory_name: Optional[str] = None
    budget: Optional[float] = None
    # Status resmi hanya boleh diubah melalui endpoint validasi yang terlindungi.

    @model_validator(mode="after")
    def validate_date_range(self):
        if self.signed_date and self.effective_end_date:
            if self.effective_end_date < self.signed_date:
                raise ValueError("Tanggal berakhir harus sama atau setelah tanggal penandatanganan/mulai.")
        return self

    @field_validator("document_number", "title", "partner_name", "scope", "partner_signatory_name", "it_del_signatory_name")
    @classmethod
    def clean_text(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_str(v)

    @field_validator("budget")
    @classmethod
    def validate_budget(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Anggaran tidak boleh bernilai negatif.")
        return v

class DocumentResponse(DocumentBase):
    id: str
    official_data_confirmed: bool = False
    validated_by: Optional[str] = None
    validated_date: Optional[datetime] = None
    created_at: Optional[datetime] = None

# ------------------------------------------------------------------------------
# BATCH UPLOAD MODELS
# ------------------------------------------------------------------------------
class BatchUploadItem(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    file_size_bytes: int = Field(..., gt=0, le=25 * 1024 * 1024)
    content_type: str = "application/pdf"

    @field_validator("filename")
    @classmethod
    def validate_filename(cls, v: str) -> str:
        value = v.strip()
        if not value or "/" in value or "\\" in value or "\x00" in value:
            raise ValueError("Nama berkas tidak valid.")
        return value

    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, v: str) -> str:
        allowed = {
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }
        if v not in allowed:
            raise ValueError("Tipe berkas tidak diizinkan.")
        return v

class BatchUploadRequest(BaseModel):
    batch_title: str = Field(default="Batch Upload Naskah Kemitraan", min_length=1, max_length=150)
    files: List[BatchUploadItem] = Field(..., min_length=1, max_length=20)

class BatchUploadResponse(BaseModel):
    batch_id: str
    status: str = "PROCESSING"
    total_files: int
    message: str = "Dokumen berhasil dimasukkan ke antrean pencatatan manual."

# ------------------------------------------------------------------------------
# AUDIT LOG MODELS
# ------------------------------------------------------------------------------
class AuditLogCreate(BaseModel):
    actor_id: str
    actor_name: str
    actor_role: str
    action: str
    entity_type: str
    entity_id: str
    details: Optional[str] = None
    ip_address: Optional[str] = "127.0.0.1"

class AuditLogResponse(AuditLogCreate):
    id: str
    timestamp: datetime
