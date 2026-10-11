// Tiruan layanan untuk uji penyedia cloud (tanpa jaringan): D1/R2/KV, PostgREST+Storage (Supabase), Firestore (Firebase).
"use strict";

/* ---- Cloudflare: D1 (memakai node:sqlite), R2, KV ---- */
function fakeCloudflare() {
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(":memory:");
  db.exec(require("fs").readFileSync(require("path").join(__dirname, "..", "cloud", "cloudflare", "schema.sql"), "utf8"));
  const D1 = {
    prepare(sql) {
      let args = [];
      const st = db.prepare(sql);
      const o = {
        bind(...a) { args = a; return o; },
        async run() { const r = st.run(...args); return { success: true, meta: { changes: r.changes } }; },
        async all() { return { results: st.all(...args).map((r) => Object.assign({}, r)) }; },
        async first() { const r = st.get(...args); return r ? Object.assign({}, r) : null; }
      };
      return o;
    }
  };
  const store = new Map();
  const R2 = {
    async put(k, v) { store.set(k, typeof v === "string" ? new TextEncoder().encode(v) : new Uint8Array(v)); },
    async get(k) { const v = store.get(k); return v ? { text: async () => new TextDecoder().decode(v), arrayBuffer: async () => v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) } : null; },
    async delete(k) { store.delete(k); }
  };
  const kv = new Map();
  const KV = { async get(k) { return kv.has(k) ? kv.get(k) : null; }, async put(k, v) { kv.set(k, v); }, async delete(k) { kv.delete(k); } };
  return { DB: D1, FILES: R2, RATE: KV, KSDAS_PASSWORD: "kata-sandi-uji", KSDAS_TOKEN_SECRET: "rahasia-token-uji-1234567890", _r2: store };
}

/* ---- Supabase: PostgREST + Storage + GoTrue ---- */
function fakeSupabase(base, anon, email, password) {
  const tables = {}, pk = { ksdas_state: "id", ksdas_backups: "name", ksdas_files: "doc_id" }, objects = new Map(); let seq = 0;
  const T = (n) => (tables[n] = tables[n] || []);
  const J = (status, obj, h) => new Response(obj == null ? null : JSON.stringify(obj), { status, headers: Object.assign({ "content-type": "application/json" }, h || {}) });
  const valid = new Set();
  async function fetchFn(url, o) {
    o = o || {}; const u = new URL(url), p = u.pathname, h = new Headers(o.headers || {}), method = (o.method || "GET").toUpperCase();
    if (!String(url).startsWith(base)) throw new Error("URL tak terduga: " + url);
    if (p === "/auth/v1/token") {
      const b = JSON.parse(o.body);
      if (u.searchParams.get("grant_type") === "password") {
        if (b.email !== email || b.password !== password) return J(400, { error_description: "Invalid login credentials" });
        const t = "jwt" + (++seq); valid.add(t); return J(200, { access_token: t, refresh_token: "r" + seq, expires_in: 3600, user: { email } });
      }
      const t = "jwt" + (++seq); valid.add(t); return J(200, { access_token: t, refresh_token: "r" + seq, expires_in: 3600 });
    }
    if (h.get("apikey") !== anon || !valid.has((h.get("authorization") || "").replace("Bearer ", ""))) return J(401, { message: "JWT tidak valid" });
    if (p.startsWith("/storage/v1/object/")) {
      const m = /^\/storage\/v1\/object\/(?:authenticated\/)?ksdas-files\/(.+)$/.exec(p); if (!m) return J(404, { message: "bucket" });
      if (method === "POST") { objects.set(m[1], new Uint8Array(o.body)); return J(200, { Key: m[1] }); }
      if (method === "GET") return objects.has(m[1]) ? new Response(objects.get(m[1])) : J(404, { message: "Object not found" });
      if (method === "DELETE") { objects.delete(m[1]); return J(200, {}); }
    }
    const m = /^\/rest\/v1\/(\w+)$/.exec(p); if (!m) return J(404, { message: "?" });
    const name = m[1], rows = T(name);
    const filters = []; let order = null, limit = Infinity, select = null, onConflict = null;
    u.searchParams.forEach((v, k) => {
      if (k === "select") select = v === "*" ? null : v.split(","); else if (k === "order") order = v.split("."); else if (k === "limit") limit = +v; else if (k === "on_conflict") onConflict = v;
      else { const mm = /^(eq|gte)\.(.*)$/.exec(v); filters.push([k, mm[1], mm[2]]); }
    });
    const match = (r) => filters.every(([k, op, v]) => (op === "eq" ? String(r[k]) === v : Number(r[k]) >= Number(v)));
    if (method === "GET") {
      let res = rows.filter(match);
      if (order) res = res.slice().sort((a, b) => (a[order[0]] < b[order[0]] ? -1 : a[order[0]] > b[order[0]] ? 1 : 0) * (order[1] === "desc" ? -1 : 1));
      const total = res.length; res = res.slice(0, limit);
      if (select) res = res.map((r) => Object.fromEntries(select.map((c) => [c, r[c]])));
      const hdr = (h.get("prefer") || "").includes("count") ? { "content-range": total ? "0-0/" + total : "*/0" } : {};
      return J(200, res, hdr);
    }
    if (method === "POST") {
      const items = JSON.parse(o.body);
      for (const it of items) {
        if (onConflict) { const i = rows.findIndex((r) => r[onConflict] === it[onConflict]); if (i >= 0) { rows[i] = Object.assign({}, rows[i], it); continue; } }
        rows.push(name === "ksdas_audit" ? Object.assign({ id: ++seq }, it) : Object.assign({}, it));
      }
      return new Response(null, { status: 201 });
    }
    if (method === "DELETE") { for (let i = rows.length - 1; i >= 0; i--) if (match(rows[i])) rows.splice(i, 1); return new Response(null, { status: 204 }); }
    return J(405, {});
  }
  return { fetch: fetchFn, tables, objects };
}

/* ---- Firebase: Identity Toolkit + Firestore REST ---- */
function fakeFirebase(pid, apiKey, email, password) {
  const DOCS = "https://firestore.googleapis.com/v1/projects/" + pid + "/databases/(default)/documents";
  const docs = new Map(), valid = new Set(); let seq = 0, writes = 0;
  const J = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
  const full = (path) => "projects/" + pid + "/databases/(default)/documents/" + path;
  async function fetchFn(url, o) {
    o = o || {}; const method = (o.method || "GET").toUpperCase(), h = new Headers(o.headers || {}); url = String(url);
    if (url.startsWith("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")) {
      const b = JSON.parse(o.body);
      if (!url.includes("key=" + apiKey) || b.email !== email || b.password !== password) return J(400, { error: { message: "INVALID_LOGIN_CREDENTIALS" } });
      const t = "id" + (++seq); valid.add(t); return J(200, { idToken: t, refreshToken: "rf", expiresIn: "3600", email });
    }
    if (url.startsWith("https://securetoken.googleapis.com/")) { const t = "id" + (++seq); valid.add(t); return J(200, { id_token: t, refresh_token: "rf", expires_in: "3600" }); }
    if (!url.startsWith(DOCS)) throw new Error("URL tak terduga: " + url);
    if (!valid.has((h.get("authorization") || "").replace("Bearer ", ""))) return J(401, { error: { message: "Missing or insufficient permissions." } });
    const rest = url.slice(DOCS.length);
    const direct = (col) => [...docs.keys()].filter((k) => k.startsWith(col + "/") && !k.slice(col.length + 1).includes("/"));
    if (rest === ":runQuery") {
      const sq = JSON.parse(o.body).structuredQuery, col = sq.from[0].collectionId; let names = direct(col);
      let list = names.map((k) => ({ name: full(k), fields: docs.get(k) }));
      if (sq.orderBy) { const f = sq.orderBy[0].field.fieldPath, dir = sq.orderBy[0].direction === "DESCENDING" ? -1 : 1; list.sort((a, b) => ((a.fields[f] ? a.fields[f].stringValue : "") < (b.fields[f] ? b.fields[f].stringValue : "") ? -1 : 1) * dir); }
      if (sq.limit) list = list.slice(0, sq.limit);
      return J(200, list.length ? list.map((d) => ({ document: d })) : [{ readTime: "x" }]);
    }
    if (rest === ":runAggregationQuery") { const col = JSON.parse(o.body).structuredAggregationQuery.structuredQuery.from[0].collectionId; return J(200, [{ result: { aggregateFields: { n: { integerValue: String(direct(col).length) } } } }]); }
    if (rest === ":commit") {
      for (const w of JSON.parse(o.body).writes) { writes++; if (w.update) docs.set(w.update.name.split("/documents/")[1], w.update.fields); else if (w.delete) docs.delete(w.delete.split("/documents/")[1]); }
      return J(200, { writeResults: [] });
    }
    const p = decodeURIComponent(rest.replace(/^\//, ""));
    if (method === "GET") return docs.has(p) ? J(200, { name: full(p), fields: docs.get(p) }) : J(404, { error: { message: "NOT_FOUND" } });
    if (method === "PATCH") { writes++; docs.set(p, JSON.parse(o.body).fields); return J(200, {}); }
    if (method === "DELETE") { docs.delete(p); return J(200, {}); }
    if (method === "POST") { writes++; const id = "auto" + (++seq); docs.set(p + "/" + id, JSON.parse(o.body).fields); return J(200, {}); }
    return J(405, {});
  }
  return { fetch: fetchFn, docs, get writes() { return writes; } };
}
module.exports = { fakeCloudflare, fakeSupabase, fakeFirebase };
