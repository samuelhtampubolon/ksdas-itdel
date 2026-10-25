/*
 * KSDAS - Adaptor penyimpanan cloud untuk peramban (v1.0). Tanpa SDK, hanya fetch.
 *
 *  rest      : server yang memenuhi kontrak API KSDAS (Cloudflare Pages Functions, server Node di Glitch /
 *              Hugging Face Space / VPS). Masuk dengan kata sandi, token sesi HMAC disimpan di sessionStorage.
 *  supabase  : PostgREST + Storage + GoTrue (Supabase Free). Keamanan dijaga Row Level Security.
 *  firebase  : Firestore REST + Identity Toolkit (Firebase Spark). Cloud Storage opsional bila bucket tersedia.
 *
 * Kunci yang ditaruh di js/config.js bersifat PUBLIK (anon key Supabase, apiKey Firebase). Keamanan data berasal
 * dari aturan RLS / Firestore rules dan dari login pengguna, bukan dari menyembunyikan kunci. Jangan pernah
 * menaruh service_role key atau kata sandi di berkas ini.
 */
(function (root) {
  "use strict";
  var Core = root.KSDASCore || (typeof require === "function" ? require("./core.js") : null);
  var SS = null; try { SS = root.sessionStorage; } catch (e) { SS = null; }
  function ssGet(k) { try { return SS ? SS.getItem(k) : null; } catch (e) { return null; } }
  function ssSet(k, v) { try { if (SS) { if (v == null) SS.removeItem(k); else SS.setItem(k, v); } } catch (e) { /* abaikan */ } }
  function bad(s, m) { return new Core.ApiError(s, m); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function trimSlash(s) { return String(s || "").replace(/\/+$/, ""); }
  function b64OfU8(u8) { var s = "", CH = 0x8000; for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH)); return btoa(s); }
  function u8OfB64(b) { var s = atob(b), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  function readJson(r) { return r.text().then(function (t) { try { return t ? JSON.parse(t) : null; } catch (e) { return null; } }); }
  function httpErr(r, j, fallback) {
    var m = j && (j.error_description || j.message || (j.error && (j.error.message || j.error)) || j.msg);
    return bad(r.status === 401 || r.status === 403 ? 401 : r.status, String(m || fallback || ("HTTP " + r.status)));
  }

  /* Hasil handle() -> nilai yang dikembalikan api() (JSON) atau Blob (berkas). */
  function unwrap(res, wantBlob) {
    if (res.status >= 400) { var e = new Error((res.json && res.json.error) || ("HTTP " + res.status)); e.status = res.status; throw e; }
    if (res.bytes) return wantBlob ? new Blob([res.bytes], { type: res.mime }) : { bytes: res.bytes };
    return res.json;
  }
  function parseReq(method, path, body, raw) {
    var u = String(path).split("?"), q = {};
    (u[1] || "").split("&").forEach(function (kv) { if (!kv) return; var i = kv.indexOf("="); q[decodeURIComponent(i < 0 ? kv : kv.slice(0, i))] = i < 0 ? "" : decodeURIComponent(kv.slice(i + 1)); });
    var b = body;
    if (body !== undefined && !raw && typeof body !== "string") b = JSON.stringify(body);
    return { method: method, path: u[0], query: q, body: b };
  }

  /* ======================= REST (Cloudflare, Node, Glitch, HF) ======================= */
  function makeRest(cfg) {
    var base = trimSlash(cfg.apiBase || ""), KEY = "ksdas-cloud-token";
    var token = ssGet(KEY) || "";
    function url(p) { return base + "/" + String(p).replace(/^\/+/, ""); }
    function call(method, path, body, raw) {
      var h = { Authorization: "Bearer " + token }, o = { method: method, headers: h, cache: "no-store" };
      if (body !== undefined && !raw) { h["Content-Type"] = "application/json"; o.body = JSON.stringify(body); }
      if (raw) { h["Content-Type"] = "application/octet-stream"; o.body = body; }
      return fetch(url(path), o);
    }
    var P = {
      name: "rest", label: cfg.label || "Server API", needsLogin: true,
      signedIn: function () { return !!token; },
      probe: function () { return fetch(url("api/ping"), { cache: "no-store" }).then(function (r) { return readJson(r); }).then(function (j) { return j && j.app === "KSDAS" ? j : null; }); },
      login: function (c) {
        return fetch(url("api/login"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: c.user || "", password: c.password || "" }), cache: "no-store" })
          .then(function (r) { return readJson(r).then(function (j) { if (!r.ok || !j || !j.token) throw httpErr(r, j, "Kata sandi salah."); token = j.token; ssSet(KEY, token); return { user: j.user || "" }; }); });
      },
      logout: function () { token = ""; ssSet(KEY, null); },
      request: function (method, path, body, raw) {
        return call(method, path, body, raw).then(function (r) {
          return readJson(r).then(function (j) { if (r.status === 401) { token = ""; ssSet(KEY, null); } if (!r.ok) throw httpErr(r, j); return j; });
        });
      },
      getBlob: function (docId) { return call("GET", "api/files/" + encodeURIComponent(docId)).then(function (r) { return r.ok ? r.blob() : null; }); }
    };
    return P;
  }

  /* ======================= Supabase ======================= */
  function makeSupabase(cfg) {
    var base = trimSlash(cfg.url), anon = cfg.anonKey, bucket = cfg.bucket || "ksdas-files", KEY = "ksdas-sb-session";
    var sess = null; try { sess = JSON.parse(ssGet(KEY) || "null"); } catch (e) { sess = null; }
    function saveSess(j) { sess = { access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000 - 30000, email: (j.user && j.user.email) || (sess && sess.email) || "" }; ssSet(KEY, JSON.stringify(sess)); }
    function auth(path, body) {
      return fetch(base + "/auth/v1/" + path, { method: "POST", headers: { apikey: anon, "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function (r) { return readJson(r).then(function (j) { if (!r.ok) throw httpErr(r, j, "Gagal masuk."); return j; }); });
    }
    function fresh() {
      if (!sess) return Promise.reject(bad(401, "Belum masuk."));
      if (Date.now() < sess.exp) return Promise.resolve(sess.access);
      return auth("token?grant_type=refresh_token", { refresh_token: sess.refresh }).then(function (j) { saveSess(j); return sess.access; }).catch(function () { sess = null; ssSet(KEY, null); throw bad(401, "Sesi berakhir. Masuk kembali."); });
    }
    function sb(method, path, opt) {
      opt = opt || {};
      return fresh().then(function (jwt) {
        var h = Object.assign({ apikey: anon, Authorization: "Bearer " + jwt }, opt.headers || {});
        var o = { method: method, headers: h, cache: "no-store" };
        if (opt.json !== undefined) { h["Content-Type"] = "application/json"; o.body = JSON.stringify(opt.json); }
        if (opt.raw !== undefined) o.body = opt.raw;
        return fetch(base + path, o);
      });
    }
    function rows(method, path, opt) {
      return sb(method, path, opt).then(function (r) { return readJson(r).then(function (j) { if (!r.ok) throw httpErr(r, j); return { j: j, r: r }; }); });
    }
    function count(table) {
      return sb("GET", "/rest/v1/" + table + "?select=*&limit=1", { headers: { Prefer: "count=exact", Range: "0-0" } }).then(function (r) {
        var m = /\/(\d+)$/.exec(r.headers.get("content-range") || ""); if (!r.ok) throw httpErr(r, null); return m ? +m[1] : 0;
      });
    }
    var upsert = { Prefer: "resolution=merge-duplicates,return=minimal" };
    var repo = {
      getStateText: function () { return rows("GET", "/rest/v1/ksdas_state?id=eq.main&select=body").then(function (x) { return x.j && x.j[0] ? x.j[0].body : null; }); },
      setStateText: function (t, at) { return rows("POST", "/rest/v1/ksdas_state?on_conflict=id", { headers: upsert, json: [{ id: "main", saved_at: at, body: t }] }); },
      addAudit: function (ev) { return rows("POST", "/rest/v1/ksdas_audit", { headers: { Prefer: "return=minimal" }, json: [ev] }); },
      listAudit: function (n) { return rows("GET", "/rest/v1/ksdas_audit?select=at,actor,action,target,detail&order=id.desc&limit=" + n).then(function (x) { return x.j || []; }); },
      countAudit: function () { return count("ksdas_audit"); },
      putBackup: function (m, t) { return rows("POST", "/rest/v1/ksdas_backups?on_conflict=name", { headers: upsert, json: [Object.assign({}, m, { body: t })] }); },
      getBackup: function (name) {
        return rows("GET", "/rest/v1/ksdas_backups?name=eq." + encodeURIComponent(name) + "&select=name,at,bytes,sha256,documents,partners,body").then(function (x) {
          var b = x.j && x.j[0]; if (!b) return null; var body = b.body; delete b.body; return { meta: b, text: body };
        });
      },
      listBackups: function () { return rows("GET", "/rest/v1/ksdas_backups?select=name,at,bytes,sha256,documents,partners&order=at.desc&limit=100").then(function (x) { return x.j || []; }); },
      putFile: function (id, meta, bytes) {
        var path = id + meta.ext;
        return sb("POST", "/storage/v1/object/" + bucket + "/" + path, { headers: { "x-upsert": "true", "Content-Type": meta.type }, raw: bytes }).then(function (r) {
          return readJson(r).then(function (j) {
            if (!r.ok) throw httpErr(r, j, "Gagal mengunggah ke Storage.");
            return rows("POST", "/rest/v1/ksdas_files?on_conflict=doc_id", { headers: upsert, json: [{ doc_id: id, name: meta.name, type: meta.type, size: meta.size, sha256: meta.sha256, at: meta.at, ext: meta.ext, path: path }] });
          });
        }).then(function () { return { ref: "supabase://" + bucket + "/" + path }; });
      },
      getFile: function (id) {
        return rows("GET", "/rest/v1/ksdas_files?doc_id=eq." + encodeURIComponent(id) + "&select=*").then(function (x) {
          var m = x.j && x.j[0]; if (!m) return null;
          return sb("GET", "/storage/v1/object/authenticated/" + bucket + "/" + m.path).then(function (r) {
            if (!r.ok) return null; return r.arrayBuffer().then(function (b) { return { meta: { docId: m.doc_id, name: m.name, type: m.type, ext: m.ext, size: m.size, sha256: m.sha256, at: m.at }, bytes: new Uint8Array(b) }; });
          });
        });
      },
      deleteFile: function (id) {
        return rows("GET", "/rest/v1/ksdas_files?doc_id=eq." + encodeURIComponent(id) + "&select=path").then(function (x) {
          var m = x.j && x.j[0]; if (!m) return;
          return sb("DELETE", "/storage/v1/object/" + bucket + "/" + m.path).then(function () { return rows("DELETE", "/rest/v1/ksdas_files?doc_id=eq." + encodeURIComponent(id)); });
        });
      },
      listFiles: function () { return rows("GET", "/rest/v1/ksdas_files?select=doc_id,name,size,sha256,at&order=at.desc&limit=1000").then(function (x) { return (x.j || []).map(function (m) { return { docId: m.doc_id, name: m.name, size: m.size, sha256: m.sha256, at: m.at }; }); }); },
      simWrite: function (rowsIn) {
        var out = rowsIn.map(function (r, i) { return { i: i, payload: String(r.payload || "") }; }), jobs = Promise.resolve(), step = 20;
        for (var k = 0; k < out.length; k += step) (function (part) { jobs = jobs.then(function () { return rows("POST", "/rest/v1/ksdas_sim", { headers: { Prefer: "return=minimal" }, json: part }); }); })(out.slice(k, k + step));
        return rows("DELETE", "/rest/v1/ksdas_sim?i=gte.0").then(function () { return jobs; });
      },
      simStat: function () {
        var t = Date.now();
        return rows("GET", "/rest/v1/ksdas_sim?select=payload&limit=5000").then(function (x) { var l = x.j || []; return { rows: l.length, bytes: l.reduce(function (a, r) { return a + r.payload.length; }, 0), readMs: Date.now() - t }; });
      },
      simClear: function () { return rows("DELETE", "/rest/v1/ksdas_sim?i=gte.0"); },
      info: function () { return Promise.resolve({ provider: "supabase", endpoint: base.replace(/^https?:\/\//, "") }); }
    };
    return {
      name: "supabase", label: "Supabase", needsLogin: true,
      signedIn: function () { return !!sess; }, who: function () { return sess ? sess.email : ""; },
      login: function (c) { return auth("token?grant_type=password", { email: c.user, password: c.password }).then(function (j) { saveSess(j); return { user: sess.email }; }); },
      logout: function () { sess = null; ssSet(KEY, null); },
      request: function (m, p, b, raw) { return Core.handle(repo, parseReq(m, p, b, raw), { mode: "cloud", provider: "supabase" }).then(function (r) { return unwrap(r, false); }); },
      getBlob: function (id) { return repo.getFile(id).then(function (f) { return f ? new Blob([f.bytes], { type: f.meta.type }) : null; }); },
      _repo: repo
    };
  }

  /* ======================= Firebase (Firestore REST) ======================= */
  function makeFirebase(cfg) {
    var pid = cfg.projectId, key = cfg.apiKey, bucket = cfg.storageBucket || "", KEY = "ksdas-fb-session";
    var DOCS = "https://firestore.googleapis.com/v1/projects/" + pid + "/databases/(default)/documents";
    var CHUNK = 250000, MAX_FS_FILE = 5 * 1024 * 1024, MAX_SIM_ROWS = 200;
    var sess = null; try { sess = JSON.parse(ssGet(KEY) || "null"); } catch (e) { sess = null; }
    function saveSess(j) { sess = { id: j.idToken || j.id_token, refresh: j.refreshToken || j.refresh_token, exp: Date.now() + (parseInt(j.expiresIn || j.expires_in, 10) || 3600) * 1000 - 30000, email: j.email || (sess && sess.email) || "" }; ssSet(KEY, JSON.stringify(sess)); }
    function fresh() {
      if (!sess) return Promise.reject(bad(401, "Belum masuk."));
      if (Date.now() < sess.exp) return Promise.resolve(sess.id);
      return fetch("https://securetoken.googleapis.com/v1/token?key=" + encodeURIComponent(key), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(sess.refresh) })
        .then(function (r) { return readJson(r).then(function (j) { if (!r.ok) throw httpErr(r, j); saveSess(j); return sess.id; }); })
        .catch(function () { sess = null; ssSet(KEY, null); throw bad(401, "Sesi berakhir. Masuk kembali."); });
    }
    function fs(method, url, json, extraHeaders) {
      return fresh().then(function (jwt) {
        var h = Object.assign({ Authorization: "Bearer " + jwt }, extraHeaders || {}), o = { method: method, headers: h, cache: "no-store" };
        if (json !== undefined) { h["Content-Type"] = "application/json"; o.body = JSON.stringify(json); }
        return fetch(url, o).then(function (r) { return readJson(r).then(function (j) { if (!r.ok && !(r.status === 404 && method === "GET")) throw httpErr(r, j); return { j: j, status: r.status }; }); });
      });
    }
    function sv(s) { return { stringValue: String(s == null ? "" : s) }; }
    function iv(n) { return { integerValue: String(Math.round(n || 0)) }; }
    function fieldsOf(o) { var f = {}; Object.keys(o).forEach(function (k) { f[k] = typeof o[k] === "number" ? iv(o[k]) : sv(o[k]); }); return { fields: f }; }
    function objOf(doc) { var o = {}, f = (doc && doc.fields) || {}; Object.keys(f).forEach(function (k) { o[k] = f[k].integerValue != null ? +f[k].integerValue : f[k].stringValue; }); return o; }
    function putDoc(col, id, o) { return fs("PATCH", DOCS + "/" + col + "/" + encodeURIComponent(id), fieldsOf(o)); }
    function getDoc(col, id) { return fs("GET", DOCS + "/" + col + "/" + encodeURIComponent(id)).then(function (x) { return x.status === 404 ? null : objOf(x.j); }); }
    function delDoc(col, id) { return fs("DELETE", DOCS + "/" + col + "/" + encodeURIComponent(id)).catch(function () { }); }
    function query(sq) { return fs("POST", DOCS + ":runQuery", { structuredQuery: sq }).then(function (x) { return (x.j || []).filter(function (r) { return r.document; }).map(function (r) { return r.document; }); }); }
    function countCol(col) {
      return fs("POST", DOCS + ":runAggregationQuery", { structuredAggregationQuery: { aggregations: [{ alias: "n", count: {} }], structuredQuery: { from: [{ collectionId: col }] } } })
        .then(function (x) { var a = x.j && x.j[0] && x.j[0].result && x.j[0].result.aggregateFields; return a && a.n ? +a.n.integerValue : 0; });
    }
    function writeChunks(col, id, text) {
      var parts = []; for (var i = 0; i < text.length; i += CHUNK) parts.push(text.slice(i, i + CHUNK));
      if (!parts.length) parts.push("");
      var p = Promise.resolve();
      parts.forEach(function (t, i2) { p = p.then(function () { return putDoc(col, id + "_" + i2, { t: t }); }); });
      return p.then(function () { return parts.length; });
    }
    function readChunks(col, id, n) {
      var out = [], p = Promise.resolve();
      for (var i = 0; i < n; i++) (function (k) { p = p.then(function () { return getDoc(col, id + "_" + k).then(function (d) { if (!d) throw bad(500, "Potongan data hilang di Firestore."); out.push(d.t); }); }); })(i);
      return p.then(function () { return out.join(""); });
    }
    function delChunks(col, id, from, to) { var p = Promise.resolve(); for (var i = from; i < to; i++) (function (k) { p = p.then(function () { return delDoc(col, id + "_" + k); }); })(i); return p; }
    function listIds(col, limit) { return query({ from: [{ collectionId: col }], select: { fields: [{ fieldPath: "__name__" }] }, limit: limit || 500 }).then(function (d) { return d.map(function (x) { return x.name; }); }); }
    function commit(writes) { return fs("POST", DOCS + ":commit", { writes: writes }); }
    function metaOfBackup(d) { return { name: d.name, at: d.at, bytes: d.bytes, sha256: d.sha256, documents: d.documents, partners: d.partners }; }

    var repo = {
      getStateText: function () { return getDoc("ksdas_state", "main").then(function (m) { return m && m.n ? readChunks("ksdas_state_chunks", "main", m.n) : null; }); },
      setStateText: function (t, at) {
        return getDoc("ksdas_state", "main").then(function (old) {
          return writeChunks("ksdas_state_chunks", "main", t).then(function (n) {
            return putDoc("ksdas_state", "main", { n: n, savedAt: at }).then(function () { return old && old.n > n ? delChunks("ksdas_state_chunks", "main", n, old.n) : null; });
          });
        });
      },
      addAudit: function (ev) { return fs("POST", DOCS + "/ksdas_audit", fieldsOf(ev)); },
      listAudit: function (n) { return query({ from: [{ collectionId: "ksdas_audit" }], orderBy: [{ field: { fieldPath: "at" }, direction: "DESCENDING" }], limit: n }).then(function (d) { return d.map(objOf); }); },
      countAudit: function () { return countCol("ksdas_audit"); },
      putBackup: function (m, t) { return writeChunks("ksdas_backup_chunks", m.name, t).then(function (n) { return putDoc("ksdas_backups", m.name, Object.assign({}, m, { n: n })); }); },
      getBackup: function (name) { return getDoc("ksdas_backups", name).then(function (d) { return d ? readChunks("ksdas_backup_chunks", name, d.n).then(function (t) { return { meta: metaOfBackup(d), text: t }; }) : null; }); },
      listBackups: function () { return query({ from: [{ collectionId: "ksdas_backups" }], orderBy: [{ field: { fieldPath: "at" }, direction: "DESCENDING" }], limit: 100 }).then(function (d) { return d.map(function (x) { return metaOfBackup(objOf(x)); }); }); },
      putFile: function (id, meta, bytes) {
        var m = Object.assign({}, meta);
        if (bucket) {
          return fresh().then(function (jwt) {
            return fetch("https://firebasestorage.googleapis.com/v0/b/" + encodeURIComponent(bucket) + "/o?name=" + encodeURIComponent("files/" + id + meta.ext), { method: "POST", headers: { Authorization: "Firebase " + jwt, "Content-Type": meta.type }, body: bytes });
          }).then(function (r) { if (!r.ok) throw bad(r.status, "Gagal mengunggah ke Cloud Storage. Cloud Storage memerlukan paket Blaze pada proyek baru."); m.store = "storage"; m.n = 0; return putDoc("ksdas_files", id, m); }).then(function () { return { ref: "firebase://" + bucket + "/files/" + id + meta.ext }; });
        }
        if (bytes.length > MAX_FS_FILE) return Promise.reject(bad(413, "Tanpa Cloud Storage (paket Spark), ukuran berkas dibatasi 5 MB di Firebase."));
        return writeChunks("ksdas_file_chunks", id, b64OfU8(bytes)).then(function (n) { m.store = "firestore"; m.n = n; return putDoc("ksdas_files", id, m); }).then(function () { return { ref: "firestore://ksdas_file_chunks/" + id }; });
      },
      getFile: function (id) {
        return getDoc("ksdas_files", id).then(function (m) {
          if (!m) return null;
          var meta = { docId: id, name: m.name, type: m.type, ext: m.ext, size: m.size, sha256: m.sha256, at: m.at };
          if (m.store === "storage") {
            return fresh().then(function (jwt) { return fetch("https://firebasestorage.googleapis.com/v0/b/" + encodeURIComponent(bucket) + "/o/" + encodeURIComponent("files/" + id + m.ext) + "?alt=media", { headers: { Authorization: "Firebase " + jwt } }); })
              .then(function (r) { return r.ok ? r.arrayBuffer().then(function (b) { return { meta: meta, bytes: new Uint8Array(b) }; }) : null; });
          }
          return readChunks("ksdas_file_chunks", id, m.n).then(function (b64) { return { meta: meta, bytes: u8OfB64(b64) }; });
        });
      },
      deleteFile: function (id) {
        return getDoc("ksdas_files", id).then(function (m) {
          if (!m) return;
          var p = m.store === "firestore" ? delChunks("ksdas_file_chunks", id, 0, m.n) : (m.store === "storage" && bucket ? fresh().then(function (jwt) { return fetch("https://firebasestorage.googleapis.com/v0/b/" + encodeURIComponent(bucket) + "/o/" + encodeURIComponent("files/" + id + m.ext), { method: "DELETE", headers: { Authorization: "Firebase " + jwt } }); }) : Promise.resolve());
          return p.then(function () { return delDoc("ksdas_files", id); });
        });
      },
      listFiles: function () { return query({ from: [{ collectionId: "ksdas_files" }], limit: 1000 }).then(function (d) { return d.map(function (x) { var o = objOf(x); return { docId: x.name.split("/").pop(), name: o.name, size: o.size, sha256: o.sha256, at: o.at }; }); }); },
      simWrite: function (rowsIn) {
        if (rowsIn.length > MAX_SIM_ROWS) return Promise.reject(bad(400, "Simulasi di Firebase dibatasi " + MAX_SIM_ROWS + " rekaman agar kuota harian paket Spark (20.000 tulis) tidak terpakai."));
        var writes = rowsIn.map(function (r, i) { return { update: Object.assign({ name: "projects/" + pid + "/databases/(default)/documents/ksdas_sim/r" + i }, fieldsOf({ i: i, payload: String(r.payload || "") })) }; });
        return repo.simClear().then(function () { return writes.length ? commit(writes) : null; });
      },
      simStat: function () {
        var t = Date.now();
        return query({ from: [{ collectionId: "ksdas_sim" }], limit: MAX_SIM_ROWS }).then(function (d) { return { rows: d.length, bytes: d.reduce(function (a, x) { return a + objOf(x).payload.length; }, 0), readMs: Date.now() - t }; });
      },
      simClear: function () { return listIds("ksdas_sim", 500).then(function (names) { return names.length ? commit(names.map(function (n) { return { delete: n }; })) : null; }); },
      info: function () { return Promise.resolve({ provider: "firebase", endpoint: "firestore/" + pid, storageBucket: bucket || "(tidak dipakai: berkas disimpan di Firestore, maks 5 MB)" }); }
    };
    return {
      name: "firebase", label: "Firebase (Spark)", needsLogin: true,
      signedIn: function () { return !!sess; }, who: function () { return sess ? sess.email : ""; },
      login: function (c) {
        return fetch("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + encodeURIComponent(key), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: c.user, password: c.password, returnSecureToken: true }) })
          .then(function (r) { return readJson(r).then(function (j) { if (!r.ok) throw httpErr(r, j, "Gagal masuk."); saveSess(j); return { user: sess.email }; }); });
      },
      logout: function () { sess = null; ssSet(KEY, null); },
      request: function (m, p, b, raw) { return Core.handle(repo, parseReq(m, p, b, raw), { mode: "cloud", provider: "firebase" }).then(function (r) { return unwrap(r, false); }); },
      getBlob: function (id) { return repo.getFile(id).then(function (f) { return f ? new Blob([f.bytes], { type: f.meta.type }) : null; }); },
      _repo: repo
    };
  }

  /** Membuat penyedia dari KSDAS_CONFIG. Mengembalikan null bila mode lokal/peramban. */
  function create(cfg) {
    cfg = cfg || {};
    switch (cfg.provider) {
      case "supabase": return cfg.supabase && cfg.supabase.url && cfg.supabase.anonKey ? makeSupabase(cfg.supabase) : null;
      case "firebase": return cfg.firebase && cfg.firebase.projectId && cfg.firebase.apiKey ? makeFirebase(cfg.firebase) : null;
      case "rest": case "cloudflare": case "glitch": case "huggingface": case "node":
        return cfg.apiBase !== undefined ? makeRest(Object.assign({}, cfg, { label: { cloudflare: "Cloudflare (Pages + D1 + R2 + KV)", glitch: "Glitch", huggingface: "Hugging Face Spaces", node: "Server Node" }[cfg.provider] })) : null;
    }
    return null;
  }
  root.KSDASCloud = { create: create, makeRest: makeRest, makeSupabase: makeSupabase, makeFirebase: makeFirebase, _parseReq: parseReq };
})(typeof self !== "undefined" ? self : this);
