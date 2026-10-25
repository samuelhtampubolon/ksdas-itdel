// Uji kontrak penyimpanan cloud: satu skenario yang sama dijalankan pada Node server, Cloudflare Pages Function
// (D1 diganti node:sqlite), adaptor Supabase, dan adaptor Firebase (layanan ditiru, tanpa jaringan).
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Core = require("../js/providers/core.js");
const Cloud = require("../js/providers/cloud.js").KSDASCloud;
const { fakeCloudflare, fakeSupabase, fakeFirebase } = require("./helpers-cloud.js");

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 10, 1, 2, 3, 250, 251, 252]);
const STATE = { roleId: "staf", documents: [{ id: "d1", title: "Uji" }], partners: [{ id: "p1", name: "PT Uji" }], memory: {}, savedAt: "2026-01-01T00:00:00.000Z" };

/** call(method, path, body, raw) -> {status, json, bytes} */
async function scenario(call, label) {
  const ok = async (m, p, b, raw) => { const r = await call(m, p, b, raw); assert.equal(r.status, 200, `${label} ${m} ${p}: ${JSON.stringify(r.json)}`); return r; };
  assert.equal((await ok("GET", "api/ping")).json.app, "KSDAS");
  assert.equal((await ok("GET", "api/state")).json, null, "state awal kosong");
  await ok("POST", "api/state", STATE);
  assert.deepEqual((await ok("GET", "api/state")).json.documents, STATE.documents);
  assert.equal((await call("POST", "api/state", { documents: 1 })).status, 400, "state tidak valid ditolak");

  await ok("POST", "api/audit", { at: "2026-01-01T00:00:01.000Z", actor: "Uji", action: "A1", target: "t", detail: "x".repeat(900) });
  await ok("POST", "api/audit", { at: "2026-01-01T00:00:02.000Z", actor: "Uji", action: "A2", target: "t", detail: "d" });
  const au = (await ok("GET", "api/audit?limit=5")).json.items;
  assert.equal(au[0].action, "A2"); assert.equal(au[1].detail.length, 500, "detail audit dipotong 500");

  const b = (await ok("POST", "api/backup", {})).json;
  assert.match(b.name, /^backup_[0-9_]+$/); assert.equal(b.documents, 1);
  assert.ok((await ok("GET", "api/backups")).json.items.some((x) => x.name === b.name));
  const dry = (await ok("POST", "api/restore", { name: b.name, dryRun: true })).json;
  assert.deepEqual(dry.documents, STATE.documents);
  assert.equal((await call("POST", "api/restore", { name: "../x", dryRun: true })).status, 400);
  assert.equal((await call("POST", "api/restore", { name: "backup_999", dryRun: true })).status, 404);

  assert.equal((await call("PUT", "api/files/ab/cd?name=a.pdf", PDF, true)).status, 400, "ID tidak aman ditolak");
  assert.equal((await call("PUT", "api/files/doc_1?name=a.exe", PDF, true)).status, 415);
  assert.equal((await call("PUT", "api/files/doc_1?name=a.pdf", new Uint8Array([1, 2, 3, 4, 5]), true)).status, 415, "magic byte salah ditolak");
  const put = (await ok("PUT", "api/files/doc_1?name=Naskah%20Uji.pdf", PDF, true)).json;
  assert.equal(put.sha256, await Core.sha256(PDF));
  const got = await ok("GET", "api/files/doc_1");
  assert.deepEqual([...got.bytes], [...PDF], "isi berkas identik");
  const st = (await ok("GET", "api/stats")).json;
  assert.equal(st.fileCount, 1); assert.equal(st.files[0].docId, "doc_1"); assert.ok(st.auditCount >= 2); assert.ok(st.backupCount >= 1);
  assert.equal(st.tables[0].rows, 1);
  await ok("DELETE", "api/files/doc_1");
  assert.equal((await call("GET", "api/files/doc_1")).status, 404);

  const rows = Array.from({ length: 5 }, (_, i) => ({ i, payload: "x".repeat(2048) }));
  const sim = (await ok("POST", "api/sim", { rows })).json;
  assert.equal(sim.rows, 5); assert.ok(sim.bytes >= 10240);
  await ok("DELETE", "api/sim");
  assert.equal((await call("GET", "api/nope")).status, 404);
}

test("Core: token HMAC, kata sandi, magic byte", async () => {
  const S = "rahasia-token-uji-1234567890";
  const t = await Core.signToken(S, 60);
  assert.ok(await Core.verifyToken(S, t));
  assert.equal(await Core.verifyToken("rahasia-lain-0987654321xx", t), null);
  assert.equal(await Core.verifyToken(S, t.slice(0, -2) + "xx"), null);
  const expired = await Core.signToken(S, -5);
  assert.equal(await Core.verifyToken(S, expired), null);
  assert.equal(await Core.passwordOk("a", "a"), true);
  assert.equal(await Core.passwordOk("a", "b"), false);
  assert.equal(await Core.passwordOk("", ""), false);
  assert.equal(Core.magicOk(".pdf", PDF), true);
  assert.equal(Core.magicOk(".txt", new Uint8Array([65, 0, 66])), false);
  await assert.rejects(Core.signToken("pendek", 10));
});

test("Node server: kontrak lengkap, login, batas laju, CORS", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ksdas-node-"));
  process.env.KSDAS_DATA_DIR = dir; process.env.KSDAS_PASSWORD = "kata-sandi-uji"; process.env.KSDAS_TOKEN_SECRET = "rahasia-token-uji-1234567890"; process.env.KSDAS_ALLOWED_ORIGINS = "https://contoh.github.io";
  delete require.cache[require.resolve("../cloud/node/server.js")];
  const { server } = require("../cloud/node/server.js");
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    const login = async (pw, extra) => fetch(base + "/api/login", { method: "POST", headers: Object.assign({ "Content-Type": "application/json" }, extra), body: JSON.stringify({ password: pw }) });
    let r = await fetch(base + "/api/state"); assert.equal(r.status, 401, "tanpa token ditolak");
    r = await fetch(base + "/api/state", { headers: { Authorization: "Bearer abc.def" } }); assert.equal(r.status, 401);
    r = await login("salah"); assert.equal(r.status, 401);
    r = await login("kata-sandi-uji"); assert.equal(r.status, 200);
    const token = (await r.json()).token;
    const call = async (m, p, b, raw) => {
      const h = { Authorization: "Bearer " + token }; let body;
      if (b !== undefined) { if (raw) body = b; else { h["Content-Type"] = "application/json"; body = JSON.stringify(b); } }
      const res = await fetch(base + "/" + p, { method: m, headers: h, body });
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json")) return { status: res.status, json: await res.json() };
      return { status: res.status, bytes: new Uint8Array(await res.arrayBuffer()) };
    };
    await scenario(call, "node");
    // CORS
    r = await fetch(base + "/api/ping", { headers: { Origin: "https://jahat.example" } }); assert.equal(r.status, 403);
    r = await fetch(base + "/api/ping", { headers: { Origin: "https://contoh.github.io" } }); assert.equal(r.headers.get("access-control-allow-origin"), "https://contoh.github.io");
    // statis: hanya allowlist
    r = await fetch(base + "/index.html"); assert.equal(r.status, 200); assert.match(r.headers.get("content-security-policy"), /default-src 'self'/);
    for (const bad of ["/KSDAS_ITDel.exe", "/cloud/node/server.js", "/.git/config", "/js/../package.json", "/tests/cloud.test.js"]) { r = await fetch(base + bad); assert.equal(r.status, 404, bad); }
    // batas laju: 5 salah, lalu 429 walau sandi benar
    // X-Forwarded-For palsu tidak boleh menghindari pembatas (tanpa KSDAS_TRUST_PROXY)
    for (let i = 0; i < 5; i++) await login("salah", { "X-Forwarded-For": "9.9.9." + i });
    r = await login("kata-sandi-uji", { "X-Forwarded-For": "8.8.8.8" }); assert.equal(r.status, 429);
  } finally { server.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test("Cloudflare Pages Function (D1 + R2 + KV): kontrak lengkap dan login", async () => {
  const mod = await import("../functions/api/[[path]].js");
  const env = fakeCloudflare();
  const req = (m, p, { body, token, headers } = {}) => new Request("https://ksdas.pages.dev/" + p, { method: m, body, headers: Object.assign(token ? { Authorization: "Bearer " + token } : {}, headers) });
  let r = await mod.onRequest({ request: req("GET", "api/ping"), env }); assert.equal(r.status, 200);
  r = await mod.onRequest({ request: req("GET", "api/state"), env }); assert.equal(r.status, 401);
  r = await mod.onRequest({ request: req("POST", "api/login", { body: JSON.stringify({ password: "salah" }) }), env }); assert.equal(r.status, 401);
  r = await mod.onRequest({ request: req("GET", "api/state"), env: { ...env, KSDAS_PASSWORD: "" } }); assert.equal(r.status, 503, "tanpa rahasia ditolak");
  r = await mod.onRequest({ request: req("POST", "api/login", { body: JSON.stringify({ password: "kata-sandi-uji" }) }), env }); assert.equal(r.status, 200);
  const token = (await r.json()).token;
  const call = async (m, p, b, raw) => {
    const res = await mod.onRequest({ request: req(m, p, { token, body: b === undefined ? undefined : raw ? b : JSON.stringify(b) }), env });
    const ct = res.headers.get("content-type") || "";
    return ct.includes("json") ? { status: res.status, json: await res.json() } : { status: res.status, bytes: new Uint8Array(await res.arrayBuffer()) };
  };
  await scenario(call, "cloudflare");
  assert.ok(env._r2.has("state/main.json"), "state tersimpan di R2");
  r = await mod.onRequest({ request: req("GET", "api/ping", { headers: { Origin: "https://jahat.example" } }), env }); assert.equal(r.status, 403);
  for (let i = 0; i < 5; i++) await mod.onRequest({ request: req("POST", "api/login", { body: JSON.stringify({ password: "x" }), headers: { "CF-Connecting-IP": "1.2.3.4" } }), env });
  r = await mod.onRequest({ request: req("POST", "api/login", { body: JSON.stringify({ password: "kata-sandi-uji" }), headers: { "CF-Connecting-IP": "1.2.3.4" } }), env }); assert.equal(r.status, 429);
});

test("Adaptor Supabase (PostgREST + Storage + GoTrue ditiru): kontrak lengkap", async () => {
  const base = "https://abc.supabase.co", fake = fakeSupabase(base, "anon-key-uji", "staf@del.ac.id", "sandi-uji-123");
  global.fetch = fake.fetch;
  const prov = Cloud.create({ provider: "supabase", supabase: { url: base, anonKey: "anon-key-uji" } });
  assert.equal(prov.signedIn(), false);
  await assert.rejects(prov.request("GET", "api/state"), /Belum masuk/);
  await assert.rejects(prov.login({ user: "staf@del.ac.id", password: "salah" }), /Invalid login/);
  await prov.login({ user: "staf@del.ac.id", password: "sandi-uji-123" });
  assert.equal(prov.signedIn(), true);
  const call = async (m, p, b, raw) => {
    try { const j = await prov.request(m, p, b, raw); return j && j.bytes instanceof Uint8Array ? { status: 200, bytes: j.bytes } : { status: 200, json: j }; }
    catch (e) { return { status: e.status || 500, json: { error: e.message } }; }
  };
  const rawCall = async (m, p, b, raw) => {
    if (m === "GET" && p.startsWith("api/files/")) { const blob = await prov.getBlob(p.split("/").pop()); return blob ? { status: 200, bytes: new Uint8Array(await blob.arrayBuffer()) } : { status: 404, json: {} }; }
    return call(m, p, b, raw);
  };
  await scenario(rawCall, "supabase");
  assert.ok(fake.tables.ksdas_state.length === 1);
});

test("Adaptor Firebase (Firestore REST ditiru): kontrak lengkap + potongan data besar", async () => {
  const fake = fakeFirebase("ksdas-uji", "api-key-uji", "staf@del.ac.id", "sandi-uji-123");
  global.fetch = fake.fetch;
  const prov = Cloud.create({ provider: "firebase", firebase: { projectId: "ksdas-uji", apiKey: "api-key-uji" } });
  await assert.rejects(prov.login({ user: "staf@del.ac.id", password: "salah" }), /INVALID_LOGIN/);
  await prov.login({ user: "staf@del.ac.id", password: "sandi-uji-123" });
  const rawCall = async (m, p, b, raw) => {
    if (m === "GET" && p.startsWith("api/files/")) { const blob = await prov.getBlob(p.split("/").pop()); return blob ? { status: 200, bytes: new Uint8Array(await blob.arrayBuffer()) } : { status: 404, json: {} }; }
    try { const j = await prov.request(m, p, b, raw); return { status: 200, json: j }; } catch (e) { return { status: e.status || 500, json: { error: e.message } }; }
  };
  await scenario(rawCall, "firebase");
  // state besar (> 1 MiB) harus terpotong ke beberapa dokumen Firestore dan pulih utuh
  const big = { roleId: "staf", documents: [{ id: "d", text: "ä".repeat(700000) }], partners: [], memory: {}, savedAt: "2026-02-02T00:00:00.000Z" };
  await prov.request("POST", "api/state", big);
  const chunks = [...fake.docs.keys()].filter((k) => k.startsWith("ksdas_state_chunks/"));
  assert.ok(chunks.length >= 3, "dipotong menjadi beberapa dokumen: " + chunks.length);
  for (const k of chunks) assert.ok(Buffer.byteLength(fake.docs.get(k).t.stringValue) < 1000000, "tiap potongan < 1 MB");
  assert.equal((await prov.request("GET", "api/state")).documents[0].text.length, 700000);
  await prov.request("POST", "api/state", STATE);
  assert.ok([...fake.docs.keys()].filter((k) => k.startsWith("ksdas_state_chunks/")).length < chunks.length, "potongan lama dibersihkan");
  // batas paket Spark
  await assert.rejects(prov.request("PUT", "api/files/doc_big?name=b.pdf", new Uint8Array([0x25, 0x50, 0x44, 0x46, ...new Uint8Array(5.5 * 1024 * 1024)]), true), /5 MB/);
  await assert.rejects(prov.request("POST", "api/sim", { rows: Array.from({ length: 201 }, () => ({ payload: "x" })) }), /dibatasi 200/);
});

test("configure.js: menolak kunci rahasia dan URL tidak aman, menulis CSP dan config", () => {
  const { build, apply } = require("../tools/configure.js");
  const jwt = (role) => "eyJhbGciOiJIUzI1NiJ9." + Buffer.from(JSON.stringify({ role })).toString("base64url") + ".sig";
  assert.throws(() => build("supabase", { url: "https://a.supabase.co", anonKey: jwt("service_role") }), /service_role/);
  assert.throws(() => build("supabase", { url: "https://a.supabase.co", anonKey: "sb_secret_abc" }), /DITOLAK/);
  assert.throws(() => build("supabase", { url: "http://a.contoh.invalid", anonKey: jwt("anon") }), /https/);
  assert.throws(() => build("firebase", { apiKey: "bukan-kunci", projectId: "ksdas-uji" }), /AIza/);
  assert.throws(() => build("rest", { apiBase: "javascript:alert(1)" }), /URL|https/);
  assert.throws(() => build("tidak-ada", {}), /tidak dikenal/);
  assert.equal(build("supabase", { url: "https://a.supabase.co/rest/v1", anonKey: "sb_publishable_xyz" }).origins[0], "https://a.supabase.co");
  assert.deepEqual(build("cloudflare", {}).origins, []);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ksdas-cfg-"));
  fs.mkdirSync(path.join(dir, "js"));
  fs.copyFileSync(path.join(__dirname, "..", "index.html"), path.join(dir, "index.html"));
  fs.copyFileSync(path.join(__dirname, "..", "js", "config.js"), path.join(dir, "js", "config.js"));
  apply(dir, "firebase", { apiKey: "AIzaSyTESTTESTTESTTESTTESTTESTTESTTEST", projectId: "ksdas-uji" });
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  assert.match(html, /connect-src 'self' data: blob: https:\/\/identitytoolkit\.googleapis\.com https:\/\/securetoken\.googleapis\.com https:\/\/firestore\.googleapis\.com;/);
  assert.doesNotMatch(html, /connect-src[^;]*\*/, "tanpa wildcard di connect-src");
  assert.match(fs.readFileSync(path.join(dir, "js", "config.js"), "utf8"), /"provider": "firebase"/);
  apply(dir, "browser", {});
  assert.match(fs.readFileSync(path.join(dir, "index.html"), "utf8"), /connect-src 'self' data: blob:;/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("Repo: config bawaan tetap mode peramban dan tidak ada rahasia di berkas konfigurasi", () => {
  const cfg = fs.readFileSync(path.join(__dirname, "..", "js", "config.js"), "utf8");
  const body = cfg.slice(cfg.indexOf("window.KSDAS_CONFIG"));
  assert.match(body, /provider: "browser"/);
  assert.doesNotMatch(body, /service_role|sb_secret_|password|secret/i);
});
