"use strict";
// Pemeriksaan keamanan statis: tautan tidak aman, sumber luar, pola berbahaya, rahasia, konfigurasi server.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const tracked = execSync("git ls-files", { cwd: root }).toString().split("\n").filter((f) => f && fs.existsSync(path.join(root, f)));
const VENDOR = /^js\/(jszip|pdf|pdf\.worker|tesseract)\.min\.js$|^js\/ocr\//;
const BINARY = /\.(exe|zip|docx|xlsx|pdf|png|gz|sha256)$/i;
const textFiles = tracked.filter((f) => !VENDOR.test(f) && !BINARY.test(f) && f !== "tests/security.test.js");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

test("Tidak ada tautan http:// non-loopback", () => {
  const ok = /ksdas-api|ksdas-storage|127\.0\.0\.1|localhost|w3\.org|schemas\.|purl\.org|openxmlformats|microsoft\.com\/office|xmlns|http:\/\/ atau https:\/\/|contoh\.invalid/;
  const bad = [];
  for (const f of textFiles) read(f).split("\n").forEach((l, i) => { if (/http:\/\//.test(l) && !ok.test(l)) bad.push(`${f}:${i + 1}: ${l.trim().slice(0, 100)}`); });
  assert.deepEqual(bad, []);
});

test("Tidak memuat sumber dari CDN, font, atau lencana pihak ketiga", () => {
  const re = /cdn\.jsdelivr|unpkg\.com|cdnjs|googleapis\.com|gstatic\.com|shields\.io|googletagmanager|google-analytics|facebook\.net/i;
  const bad = textFiles.filter((f) => re.test(read(f)));
  assert.deepEqual(bad, []);
});

test("Kode aplikasi bebas pola berbahaya (eval, inline handler, document.write)", () => {
  for (const f of ["js/ksdas.js", "js/extract.js", "js/storage.js"]) {
    const s = read(f);
    assert.doesNotMatch(s, /\beval\(|new Function\(|document\.write\(|insertAdjacentHTML|javascript:/, f);
    assert.doesNotMatch(s, /\son(click|error|load|mouseover|focus)\s*=\s*["'`]/i, f + " inline handler");
  }
  const html = read("index.html");
  assert.match(html, /Content-Security-Policy/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i, "tidak boleh ada skrip inline");
  assert.doesNotMatch(html, /script-src[^;"]*'unsafe-inline'/);
  assert.match(html, /object-src 'none'/);
});

test("Tidak ada rahasia atau kunci privat di repositori", () => {
  const re = /AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}|xox[bp]-[A-Za-z0-9-]{10,}|BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY|sk-[A-Za-z0-9]{32,}/;
  assert.deepEqual(textFiles.filter((f) => re.test(read(f))), []);
  assert.deepEqual(tracked.filter((f) => /(^|\/)\.env($|\.)(?!example)|\.pem$|\.key$|id_rsa|\.pfx$|\.p12$/.test(f)), []);
  const env = read(".env.example");
  for (const m of env.matchAll(/^(APP_SECRET|DB_PASSWORD|S3_SECRET_KEY|SSO_CLIENT_SECRET|SMTP_PASS)=(.*)$/gm)) assert.match(m[2], /^<.*>$/, m[1] + " harus placeholder");
});

test("Data runtime dan rahasia diabaikan git", () => {
  const gi = read(".gitignore");
  assert.match(gi, /^\.env$/m);
  assert.match(gi, /ksdas_local_database\//);
  assert.deepEqual(tracked.filter((f) => f.startsWith("ksdas_local_database/")), []);
});

test("nginx: allowlist berkas, header keamanan, tanpa sumber luar", () => {
  const n = read("nginx.conf");
  assert.match(n, /server_tokens off/);
  assert.match(n, /location \/ \{ return 404; \}/);
  assert.match(n, /Content-Security-Policy/);
  assert.doesNotMatch(n, /'unsafe-inline' https|https:\/\/cdn|connect-src 'self' https:/);
  assert.doesNotMatch(n, /X-XSS-Protection/);
  const c = read("docker-compose.yml");
  assert.doesNotMatch(c, /\.\/:\/usr\/share\/nginx\/html/, "seluruh repositori tidak boleh dipasang sebagai root web");
  assert.doesNotMatch(c, /"(?!127\.0\.0\.1)[^"]*:(5432|9000|9001):\d+"/, "port db/storage tidak boleh dipublikasikan");
  assert.doesNotMatch(c, /127\.0\.0\.1:(5432|9000|9001)/);
});

test("Server EXE: loopback, token waktu-konstan, header keamanan, validasi berkas", () => {
  const cs = read("desktop-app/KSDAS_DesktopApp.cs");
  assert.match(cs, /http:\/\/127\.0\.0\.1:/);
  assert.doesNotMatch(cs, /http:\/\/\+:|http:\/\/\*:|0\.0\.0\.0/);
  for (const h of ["X-Content-Type-Options", "Content-Security-Policy", "Cross-Origin-Resource-Policy", "Permissions-Policy"]) assert.match(cs, new RegExp(h));
  assert.match(cs, /TokenOk\(/);
  assert.match(cs, /MagicOk\(/);
  assert.match(cs, /Path\.GetFileName/);
});

test("Backend: dokumentasi mati di produksi, CORS tanpa wildcard, tanpa kredensial CORS", () => {
  const b = read("backend/main.py");
  assert.match(b, /docs_url=None if/);
  assert.doesNotMatch(b, /allow_headers=\["\*"\]/);
  assert.match(b, /allow_credentials=False/);
  assert.doesNotMatch(b, /@(huawei|microsoft|astra)\./);
});

test("Workflow CI memakai hak minimal", () => {
  assert.match(read(".github/workflows/ci.yml"), /permissions:\s*\n\s+contents: read/);
});

test("Checksum EXE cocok dengan berkas", () => {
  const crypto = require("crypto");
  const sum = fs.readFileSync(path.join(root, "KSDAS_ITDel.exe.sha256"), "utf8").split(/\s+/)[0];
  const actual = crypto.createHash("sha256").update(fs.readFileSync(path.join(root, "KSDAS_ITDel.exe"))).digest("hex");
  assert.equal(sum, actual);
});
