#!/usr/bin/env node
/*
 * KSDAS - Server Node tanpa dependensi (Node 18+). Untuk Glitch, Hugging Face Docker Space, VPS, atau lokal.
 *
 * Menyajikan situs statis (allowlist) dan API penyimpanan dengan kontrak yang sama seperti KSDAS_ITDel.exe
 * (js/providers/core.js). Data ditulis ke folder KSDAS_DATA_DIR (bawaan ./ksdas_data).
 *
 * Variabel lingkungan:
 *   KSDAS_PASSWORD        wajib. Kata sandi masuk (jadikan Secret, jangan taruh di kode).
 *   KSDAS_TOKEN_SECRET    disarankan (>= 16 karakter acak). Bila kosong dibuat acak saat start (sesi hilang saat restart).
 *   KSDAS_DATA_DIR        folder data. Pada Hugging Face Space gratis sistem berkas sementara (lihat docs).
 *   KSDAS_ALLOWED_ORIGINS daftar origin yang boleh memanggil API lintas-situs, dipisah koma
 *                         (mis. https://samuelhtampubolon.github.io). Kosong = hanya same-origin.
 *   PORT                  bawaan 7860 (Hugging Face) atau 3000.
 *   KSDAS_SERVE_STATIC    "0" untuk hanya melayani API.
 */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Core = require("../../js/providers/core.js");

const WEB_ROOT = path.resolve(__dirname, "..", "..");
const DATA = path.resolve(process.env.KSDAS_DATA_DIR || path.join(process.cwd(), "ksdas_data"));
const PORT = parseInt(process.env.PORT, 10) || 7860;
const PASSWORD = process.env.KSDAS_PASSWORD || "";
const SECRET = process.env.KSDAS_TOKEN_SECRET || crypto.randomBytes(32).toString("hex");
const ORIGINS = String(process.env.KSDAS_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean);
const SERVE_STATIC = process.env.KSDAS_SERVE_STATIC !== "0";
const STARTED = Date.now();
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".wasm": "application/wasm", ".gz": "application/gzip", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".docx": "application/octet-stream", ".xlsx": "application/octet-stream", ".pdf": "application/pdf" };
const CSP = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' data: blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' https://huggingface.co";

/* ---------------- repositori berbasis berkas ---------------- */
function mk(...p) { fs.mkdirSync(path.join(DATA, ...p), { recursive: true }); }
["", "files", "backups"].forEach((d) => mk(d));
function atomicWrite(file, data) { const tmp = file + "." + process.pid + ".tmp"; fs.writeFileSync(tmp, data); fs.renameSync(tmp, file); }
function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } }
const P = (...p) => path.join(DATA, ...p);

const repo = {
  async getStateText() { try { return fs.readFileSync(P("state.json"), "utf8"); } catch { return null; } },
  async setStateText(text) { atomicWrite(P("state.json"), text); },
  async addAudit(ev) {
    const f = P("audit.jsonl");
    try { if (fs.statSync(f).size > 10 * 1024 * 1024) fs.renameSync(f, f + "." + Date.now()); } catch { /* belum ada */ }
    fs.appendFileSync(f, JSON.stringify(ev) + "\n");
  },
  async listAudit(limit) {
    let lines = []; try { lines = fs.readFileSync(P("audit.jsonl"), "utf8").split("\n").filter(Boolean); } catch { /* kosong */ }
    return lines.slice(-limit).reverse().map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  },
  async countAudit() { try { return fs.readFileSync(P("audit.jsonl"), "utf8").split("\n").filter(Boolean).length; } catch { return 0; } },
  async putBackup(meta, text) { atomicWrite(P("backups", meta.name + ".json"), text); atomicWrite(P("backups", meta.name + ".meta.json"), JSON.stringify(meta)); },
  async getBackup(name) {
    const meta = readJson(P("backups", name + ".meta.json"), null);
    if (!meta) return null;
    try { return { meta, text: fs.readFileSync(P("backups", name + ".json"), "utf8") }; } catch { return null; }
  },
  async listBackups() {
    return fs.readdirSync(P("backups")).filter((f) => f.endsWith(".meta.json")).map((f) => readJson(P("backups", f), null)).filter(Boolean).sort((a, b) => (a.at < b.at ? 1 : -1));
  },
  async putFile(id, meta, bytes) { atomicWrite(P("files", id + ".bin"), Buffer.from(bytes)); atomicWrite(P("files", id + ".meta.json"), JSON.stringify(meta)); return { ref: "dosir_lampiran/" + id + meta.ext }; },
  async getFile(id) {
    const meta = readJson(P("files", id + ".meta.json"), null);
    if (!meta) return null;
    try { return { meta, bytes: new Uint8Array(fs.readFileSync(P("files", id + ".bin"))) }; } catch { return null; }
  },
  async deleteFile(id) { for (const s of [".bin", ".meta.json"]) { try { fs.unlinkSync(P("files", id + s)); } catch { /* sudah tidak ada */ } } },
  async listFiles() { return fs.readdirSync(P("files")).filter((f) => f.endsWith(".meta.json")).map((f) => readJson(P("files", f), null)).filter(Boolean); },
  async simWrite(rows) { fs.writeFileSync(P("sim.jsonl"), rows.map((r) => JSON.stringify(r)).join("\n") + "\n"); },
  async simStat() { const t = Date.now(); let n = 0, bytes = 0; try { for (const l of fs.readFileSync(P("sim.jsonl"), "utf8").split("\n")) if (l) { n++; bytes += l.length; } } catch { /* kosong */ } return { rows: n, bytes, readMs: Date.now() - t }; },
  async simClear() { try { fs.unlinkSync(P("sim.jsonl")); } catch { /* sudah bersih */ } },
  async info() { const m = process.memoryUsage(); return { provider: process.env.SPACE_ID ? "huggingface" : "node", endpoint: process.env.SPACE_HOST || "server Node", dbDir: DATA, workingSetBytes: m.rss, gcBytes: m.heapUsed, storageNote: "Sistem berkas server; pada layanan gratis dapat bersifat sementara." }; }
};

/* ---------------- keamanan ---------------- */
const fails = new Map();
function limited(ip) { const r = fails.get(ip); return r && r.n >= 5 && Date.now() - r.t < 10 * 60 * 1000; }
function noteFail(ip) { const r = fails.get(ip); if (!r || Date.now() - r.t > 10 * 60 * 1000) fails.set(ip, { n: 1, t: Date.now() }); else r.n++; if (fails.size > 5000) fails.clear(); }
function clientIp(req) { return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "?"; }
function baseHeaders(extra) { return Object.assign({ "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "Cache-Control": "no-store", "Cross-Origin-Opener-Policy": "same-origin" }, extra || {}); }
function corsHeaders(req) {
  const o = req.headers.origin;
  if (!o) return {};
  const same = o === (req.headers["x-forwarded-proto"] || "http") + "://" + req.headers.host || o === "https://" + req.headers.host || o === "http://" + req.headers.host;
  if (same || ORIGINS.indexOf(o) >= 0) return { "Access-Control-Allow-Origin": o, Vary: "Origin", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Max-Age": "600" };
  return null;
}
function readBody(req, max) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on("data", (c) => { n += c.length; if (n > max) { reject(new Core.ApiError(413, "Badan permintaan terlalu besar.")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
function send(res, status, headers, body) { res.writeHead(status, headers); res.end(body); }
function sendJson(res, status, obj, extra) { send(res, status, baseHeaders(Object.assign({ "Content-Type": "application/json; charset=utf-8" }, extra)), JSON.stringify(obj)); }

async function api(req, res, url) {
  const cors = corsHeaders(req);
  if (cors === null) return sendJson(res, 403, { error: "Origin tidak diizinkan." });
  if (req.method === "OPTIONS") return send(res, 204, baseHeaders(cors), "");
  const p = url.pathname;
  if (p === "/api/ping" && req.method === "GET") {
    const r = await Core.handle(repo, { method: "GET", path: p }, { mode: "cloud", provider: process.env.SPACE_ID ? "huggingface" : "node" });
    return sendJson(res, r.status, r.json, cors);
  }
  if (p === "/api/login" && req.method === "POST") {
    const ip = clientIp(req);
    if (limited(ip)) return sendJson(res, 429, { error: "Terlalu banyak percobaan. Coba lagi dalam 10 menit." }, cors);
    if (!PASSWORD) return sendJson(res, 503, { error: "Server belum diatur: KSDAS_PASSWORD kosong." }, cors);
    let j = {}; try { j = JSON.parse((await readBody(req, 4096)).toString("utf8")); } catch { /* kosong */ }
    if (!(await Core.passwordOk(j.password, PASSWORD))) { noteFail(ip); return sendJson(res, 401, { error: "Kata sandi salah." }, cors); }
    fails.delete(ip);
    return sendJson(res, 200, { token: await Core.signToken(SECRET, 8 * 3600, { sub: "staf" }), user: "staf" }, cors);
  }
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || "");
  if (!m || !(await Core.verifyToken(SECRET, m[1]))) return sendJson(res, 401, { error: "Belum masuk atau sesi berakhir." }, cors);
  const body = ["POST", "PUT"].indexOf(req.method) >= 0 ? await readBody(req, req.method === "PUT" ? Core.MAX_FILE + 1024 : 82 * 1024 * 1024) : null;
  const query = {}; url.searchParams.forEach((v, k) => { query[k] = v; });
  const r = await Core.handle(repo, { method: req.method, path: p, query, body }, { mode: "cloud", provider: process.env.SPACE_ID ? "huggingface" : "node", started: STARTED });
  if (r.bytes) {
    return send(res, r.status, baseHeaders(Object.assign({ "Content-Type": r.mime, "Content-Disposition": "attachment; filename*=UTF-8''" + encodeURIComponent(r.name) }, cors)), Buffer.from(r.bytes));
  }
  return sendJson(res, r.status, r.json, cors);
}

/* ---------------- situs statis (allowlist seperti nginx.conf) ---------------- */
const STATIC_OK = /^\/(index\.html|css\/[\w.\-]+|js\/[\w.\-\/]+|sample-data\/uji\/[\w.\-]+)$/;
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname); if (p === "/") p = "/index.html";
  if (!STATIC_OK.test(p) || p.includes("..")) return sendJson(res, 404, { error: "Tidak ditemukan." });
  const file = path.join(WEB_ROOT, p);
  if (!file.startsWith(WEB_ROOT + path.sep)) return sendJson(res, 404, { error: "Tidak ditemukan." });
  fs.readFile(file, (err, buf) => {
    if (err) return sendJson(res, 404, { error: "Tidak ditemukan." });
    const ext = path.extname(file).toLowerCase();
    const h = baseHeaders({ "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600" });
    if (ext === ".html") h["Content-Security-Policy"] = CSP.replace("connect-src 'self'", "connect-src 'self'");
    send(res, 200, h, buf);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  (url.pathname.startsWith("/api/") ? api(req, res, url) : (SERVE_STATIC && (req.method === "GET" || req.method === "HEAD") ? Promise.resolve(serveStatic(req, res, url)) : Promise.resolve(sendJson(res, 404, { error: "Tidak ditemukan." }))))
    .catch((e) => { if (!res.headersSent) sendJson(res, e && e.status || 500, { error: e instanceof Core.ApiError ? e.message : "Kesalahan internal." }); else res.end(); });
});
server.requestTimeout = 120000;
if (require.main === module) {
  if (!PASSWORD) console.warn("PERINGATAN: KSDAS_PASSWORD belum diatur. Login akan ditolak sampai variabel itu diisi.");
  server.listen(PORT, process.env.HOST || "0.0.0.0", () => console.log("KSDAS server siap di port " + PORT + ", data: " + DATA));
}
module.exports = { server, repo, DATA };
