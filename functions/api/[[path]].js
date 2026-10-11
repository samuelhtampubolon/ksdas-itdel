/*
 * KSDAS - Cloudflare Pages Function: API penyimpanan di /api/*.
 * Penyimpanan: D1 (indeks, audit, metadata berkas/cadangan), R2 (data state, cadangan, berkas), KV (pembatas login).
 * Kontrak API sama dengan KSDAS_ITDel.exe (js/providers/core.js). Skema D1: cloud/cloudflare/schema.sql.
 *
 * Binding yang dibutuhkan (lihat cloud/cloudflare/wrangler.toml.example): DB (D1), FILES (R2), RATE (KV, opsional tetapi
 * disarankan). Secret: KSDAS_PASSWORD, KSDAS_TOKEN_SECRET. Variabel opsional: KSDAS_ALLOWED_ORIGINS.
 */
import Core from "../../js/providers/core.js";

const J = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
const json = (status, obj, extra) => new Response(JSON.stringify(obj), { status, headers: Object.assign({}, J, extra || {}) });

function makeRepo(env) {
  const DB = env.DB, R2 = env.FILES;
  const all = async (sql, ...b) => (await DB.prepare(sql).bind(...b).all()).results || [];
  const run = (sql, ...b) => DB.prepare(sql).bind(...b).run();
  return {
    async getStateText() { const o = await R2.get("state/main.json"); return o ? await o.text() : null; },
    async setStateText(text) { await R2.put("state/main.json", text, { httpMetadata: { contentType: "application/json" } }); },
    async addAudit(ev) { await run("INSERT INTO audit (at, actor, action, target, detail) VALUES (?, ?, ?, ?, ?)", ev.at, ev.actor, ev.action, ev.target, ev.detail); },
    async listAudit(n) { return all("SELECT at, actor, action, target, detail FROM audit ORDER BY id DESC LIMIT ?", n); },
    async countAudit() { const r = await DB.prepare("SELECT COUNT(*) AS n FROM audit").first(); return r ? r.n : 0; },
    async putBackup(m, text) {
      await R2.put("backups/" + m.name + ".json", text, { httpMetadata: { contentType: "application/json" } });
      await run("INSERT OR REPLACE INTO backups (name, at, bytes, sha256, documents, partners) VALUES (?, ?, ?, ?, ?, ?)", m.name, m.at, m.bytes, m.sha256, m.documents, m.partners);
    },
    async getBackup(name) {
      const rows = await all("SELECT name, at, bytes, sha256, documents, partners FROM backups WHERE name = ?", name);
      if (!rows.length) return null;
      const o = await R2.get("backups/" + name + ".json");
      return o ? { meta: rows[0], text: await o.text() } : null;
    },
    async listBackups() { return all("SELECT name, at, bytes, sha256, documents, partners FROM backups ORDER BY at DESC LIMIT 100"); },
    async putFile(id, m, bytes) {
      await R2.put("files/" + id, bytes, { httpMetadata: { contentType: m.type } });
      await run("INSERT OR REPLACE INTO files (doc_id, name, type, size, sha256, at, ext) VALUES (?, ?, ?, ?, ?, ?, ?)", id, m.name, m.type, m.size, m.sha256, m.at, m.ext);
      return { ref: "r2://files/" + id };
    },
    async getFile(id) {
      const rows = await all("SELECT doc_id, name, type, size, sha256, at, ext FROM files WHERE doc_id = ?", id);
      if (!rows.length) return null;
      const o = await R2.get("files/" + id);
      return o ? { meta: Object.assign({ docId: id }, rows[0]), bytes: new Uint8Array(await o.arrayBuffer()) } : null;
    },
    async deleteFile(id) { await R2.delete("files/" + id); await run("DELETE FROM files WHERE doc_id = ?", id); },
    async listFiles() { return (await all("SELECT doc_id, name, size, sha256, at FROM files ORDER BY at DESC LIMIT 1000")).map((r) => ({ docId: r.doc_id, name: r.name, size: r.size, sha256: r.sha256, at: r.at })); },
    async simWrite(rows) { await R2.put("sim/sim.jsonl", rows.map((r) => JSON.stringify(r)).join("\n") + "\n"); },
    async simStat() { const t = Date.now(), o = await R2.get("sim/sim.jsonl"); const txt = o ? await o.text() : ""; const ls = txt.split("\n").filter(Boolean); return { rows: ls.length, bytes: txt.length, readMs: Date.now() - t }; },
    async simClear() { await R2.delete("sim/sim.jsonl"); },
    async info() { return { provider: "cloudflare", endpoint: "Pages Functions + D1 + R2 + KV" }; }
  };
}

function cors(request, env) {
  const o = request.headers.get("Origin");
  if (!o) return {};
  const same = o === new URL(request.url).origin;
  const allowed = String(env.KSDAS_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean);
  if (!same && allowed.indexOf(o) < 0) return null;
  return { "Access-Control-Allow-Origin": o, Vary: "Origin", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Max-Age": "600" };
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url), method = request.method;
  const ch = cors(request, env);
  if (ch === null) return json(403, { error: "Origin tidak diizinkan." });
  if (method === "OPTIONS") return new Response(null, { status: 204, headers: ch });
  const p = url.pathname;
  const base = { mode: "cloud", provider: "cloudflare", started: undefined };

  if (p === "/api/ping" && method === "GET") return json(200, { app: "KSDAS", version: "cloud", mode: "cloud", provider: "cloudflare" }, ch);

  if (!env.KSDAS_PASSWORD || !env.KSDAS_TOKEN_SECRET) return json(503, { error: "Server belum diatur: rahasia KSDAS_PASSWORD / KSDAS_TOKEN_SECRET kosong." }, ch);
  if (!env.DB || !env.FILES) return json(503, { error: "Binding D1 (DB) atau R2 (FILES) belum dipasang." }, ch);

  if (p === "/api/login" && method === "POST") {
    const ip = request.headers.get("CF-Connecting-IP") || "?", key = "fail:" + ip;
    let n = 0;
    if (env.RATE) { n = parseInt((await env.RATE.get(key)) || "0", 10) || 0; if (n >= 5) return json(429, { error: "Terlalu banyak percobaan. Coba lagi dalam 10 menit." }, ch); }
    let j = {}; try { j = await request.json(); } catch { /* kosong */ }
    if (!(await Core.passwordOk(j && j.password, env.KSDAS_PASSWORD))) {
      if (env.RATE) await env.RATE.put(key, String(n + 1), { expirationTtl: 600 });
      return json(401, { error: "Kata sandi salah." }, ch);
    }
    if (env.RATE) await env.RATE.delete(key);
    return json(200, { token: await Core.signToken(env.KSDAS_TOKEN_SECRET, 8 * 3600, { sub: "staf" }), user: "staf" }, ch);
  }

  const m = /^Bearer (.+)$/.exec(request.headers.get("Authorization") || "");
  if (!m || !(await Core.verifyToken(env.KSDAS_TOKEN_SECRET, m[1]))) return json(401, { error: "Belum masuk atau sesi berakhir." }, ch);

  let body = null;
  if (method === "POST" || method === "PUT") {
    const len = parseInt(request.headers.get("Content-Length") || "0", 10);
    if (len > (method === "PUT" ? Core.MAX_FILE + 1024 : 82 * 1024 * 1024)) return json(413, { error: "Badan permintaan terlalu besar." }, ch);
    body = new Uint8Array(await request.arrayBuffer());
  }
  const query = {}; url.searchParams.forEach((v, k) => { query[k] = v; });
  const r = await Core.handle(makeRepo(env), { method, path: p, query, body }, base);
  if (r.bytes) return new Response(r.bytes, { status: r.status, headers: Object.assign({}, J, { "Content-Type": r.mime, "Content-Disposition": "attachment; filename*=UTF-8''" + encodeURIComponent(r.name) }, ch) });
  return json(r.status, r.json, ch);
}
