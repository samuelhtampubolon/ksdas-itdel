# ==============================================================================
# KSDAS IT DEL - BACKEND DOCKERFILE
# Container resmi backend REST API KSDAS IT Del
# ==============================================================================

FROM python:3.11-slim

# Menolak pembuatan berkas .pyc dan memastikan log tidak di-buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependensi
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Salin kode program backend
COPY . .

# Buat pengguna non-root demi keamanan
RUN useradd -m ksdasuser && chown -R ksdasuser /app
USER ksdasuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
