-- KSDAS: skema D1 (Cloudflare). Jalankan:  wrangler d1 execute ksdas --remote --file=cloud/cloudflare/schema.sql
-- Data state, cadangan, dan berkas disimpan di R2. D1 menyimpan indeks dan audit.
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL, actor TEXT, action TEXT, target TEXT, detail TEXT
);
CREATE INDEX IF NOT EXISTS audit_at ON audit (at);
CREATE TABLE IF NOT EXISTS backups (
  name TEXT PRIMARY KEY, at TEXT NOT NULL, bytes INTEGER, sha256 TEXT, documents INTEGER, partners INTEGER
);
CREATE TABLE IF NOT EXISTS files (
  doc_id TEXT PRIMARY KEY, name TEXT, type TEXT, size INTEGER, sha256 TEXT, at TEXT, ext TEXT
);
