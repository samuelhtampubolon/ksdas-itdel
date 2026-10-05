# Kebijakan Keamanan

KSDAS IT Del adalah prototipe. Dokumen rinci: [docs/SECURITY.md](docs/SECURITY.md), [docs/SECURITY_THREAT_MODEL_V03.md](docs/SECURITY_THREAT_MODEL_V03.md).

## Melaporkan kerentanan
Jangan membuka issue publik untuk kerentanan. Gunakan **GitHub > Security > Report a vulnerability** pada repositori ini, atau hubungi pemilik repositori secara privat. Kontak resmi institusi: TBD (ditetapkan SDI/TSI).

## Prinsip yang diterapkan
- Seluruh pemrosesan dokumen berjalan lokal. Tidak ada pustaka atau font yang dimuat dari CDN. Tidak ada telemetri.
- Isi dokumen dianggap data, bukan perintah. Semua teks yang ditampilkan di-escape. CSP melarang skrip inline dan sumber luar.
- Berkas unggahan divalidasi (ekstensi, magic bytes, ukuran). Server EXE hanya mendengarkan 127.0.0.1 dengan token sesi.
- Tidak ada rahasia di repositori. `.env` dan `ksdas_local_database/` diabaikan git.

## Verifikasi unduhan EXE
Bandingkan SHA-256 berkas yang diunduh dengan `KSDAS_ITDel.exe.sha256` di repositori:
`certutil -hashfile KSDAS_ITDel.exe SHA256` (Windows) atau `sha256sum KSDAS_ITDel.exe` (Linux). EXE belum ditandatangani digital.
