# KSDAS IT DEL &bull; REST API BACKEND SERVICE

**Sistem Informasi Kerja Sama & Analitik Data (KSDAS)**  
**Institut Teknologi Del, Sitoluama, Laguboti, Kabupaten Toba, Sumatera Utara**  
**Author & Solution Architect:** Samuel Hasudungan Tampubolon  
**Copyright:** Copyright &copy; 2026 Samuel Hasudungan Tampubolon. All rights reserved.  
**Versi:** 0.3.0  
**Framework:** FastAPI (Python 3.11+) + Pydantic v2  

---

## 📌 Ringkasan Layanan

Direktori `backend/` menyediakan implementasi resmi REST API microservice untuk sistem KSDAS IT Del. Layanan ini menghubungkan antarmuka web, pemrosesan ekstraksi cerdas, basis data relasional PostgreSQL kampus, dan penyimpanan berkas MinIO S3.

### Fitur Utama Backend:
1. **API Versioning:** Menggunakan prefix `/api/v1/` terstandarisasi.
2. **Validasi Skema & Sanitasi:** Didukung oleh Pydantic v2 dengan pembersihan karakter XSS (`html.escape`) dan validasi logika rentang tanggal (`effective_end_date >= signed_date`).
3. **Health & Readiness Checks:** Endpoint `/health` dan `/ready` tanpa membocorkan kredensial atau topologi internal jaringan.
4. **Keamanan Bawaan:** CORS terkonfigurasi, request ID tracing (`X-Request-ID`), dan HTTP security headers (`nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`).
5. **Audit Logging Mutlak:** Endpoint pencatatan aktivitas pengguna ke tabel `audit_logs` persisten.

---

## 🚀 Panduan Menjalankan Layanan

> **Keamanan deployment:** seluruh endpoint data `/api/v1/*` memerlukan header
> `X-API-Key`. Sebelum menjalankan production, isi `KSDAS_WRITE_API_KEY` dengan
> nilai acak minimal 32 karakter melalui secret manager / environment deployment.
> Jangan menggunakan nilai contoh dari `.env.example`, dan jangan kirim API key
> tersebut ke browser atau menyimpannya di repository. Integrasikan SSO kampus
> sebelum frontend production diberi akses tulis langsung.

> **Batasan implementasi saat ini:** API masih memakai data in-memory dan belum
> memiliki adapter PostgreSQL/MinIO. Karena itu `/ready` sengaja mengembalikan
> `503` pada seluruh mode. Jangan gunakan kontainer ini sebagai layanan produksi
> atau mengandalkan `depends_on` sebagai bukti bahwa data persisten tersedia.

### Opsi A: Menjalankan Secara Lokal (Python Virtual Environment)

```bash
# 1. Masuk ke direktori backend
cd backend

# 2. Buat dan aktifkan virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 3. Pasang dependensi
pip install -r requirements.txt

# 4. Jalankan server API (Hot Reload aktif)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Setelah berjalan, dokumentasi interaktif API dapat diakses di:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc UI:** `http://localhost:8000/redoc`

---

### Opsi B: Menjalankan Menggunakan Docker Compose (Direkomendasikan untuk Kampus)

Layanan backend ini telah terintegrasi di dalam [`../docker-compose.yml`](../docker-compose.yml):

```bash
# Dari root repositori:
docker compose up -d --build
```

---

## 📑 Daftar Endpoint Utama

| Method | Endpoint | Fungsi |
| :---: | :--- | :--- |
| `GET` | `/health` | Pemeriksaan status liveness layanan |
| `GET` | `/ready` | Pemeriksaan kesiapan database & storage |
| `GET` | `/api/v1/partners` | Daftar institusi mitra kerja sama |
| `POST` | `/api/v1/partners` | Mendaftarkan institusi mitra baru |
| `GET` | `/api/v1/documents` | Repositori naskah kerja sama (dengan filter) |
| `GET` | `/api/v1/documents/{id}` | Rincian detail metadata dan ekstraksi naskah |
| `POST` | `/api/v1/documents` | Menambahkan naskah perjanjian baru |
| `PUT` | `/api/v1/documents/{id}` | Memperbarui metadata naskah |
| `POST` | `/api/v1/documents/{id}/validate` | Pengesahan validasi data naskah oleh staf |
| `POST` | `/api/v1/documents/batch` | Ingesti berkas batch ke antrean parser |
| `GET` | `/api/v1/accreditation/frameworks` | Instrumen akreditasi BAN-PT & LAM-INFOKOM |
| `GET` | `/api/v1/analytics/dashboard` | Agregat analitik untuk dashboard pimpinan |
| `GET` | `/api/v1/audit/logs` | Riwayat audit trail mutlak |
