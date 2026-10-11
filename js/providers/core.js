/*
 * KSDAS - Inti kontrak API penyimpanan (v1.0). Satu kode untuk semua penyedia.
 *
 * Kontrak REST ini identik dengan API server lokal KSDAS_ITDel.exe. Inti ini dipakai oleh:
 *   - peramban (adaptor Supabase dan Firebase memanggil handle() dengan repositori masing-masing),
 *   - Cloudflare Pages Functions (D1 + R2 + KV), dan
 *   - server Node (Glitch, Hugging Face Docker Space, VPS), tanpa dependensi.
 * Repositori hanya menyimpan dan membaca. Semua validasi (ID aman, nama cadangan, ukuran, jenis
 * berkas dengan magic byte, pemotongan audit) ada di sini agar perilakunya sama di mana pun.
 *
 * Antarmuka repositori (semua mengembalikan Promise):
 *   getStateText() -> string|null          setStateText(text, savedAt)
 *   addAudit(ev)   listAudit(limit) -> ev[] terbaru dulu    countAudit() -> number
 *   putBackup(meta, text)  getBackup(name) -> {meta,text}|null  listBackups() -> meta[] terbaru dulu
 *   putFile(id, meta, bytes)  getFile(id) -> {meta,bytes}|null  deleteFile(id)  listFiles() -> meta[]
 *   simWrite(rows) -> {writeMs?}   simStat() -> {rows, bytes, readMs?}   simClear()
 *   info() -> objek tambahan untuk statistik (opsional)
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.KSDASCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var MAX_FILE = 25 * 1024 * 1024;
  var MAX_STATE = 80 * 1024 * 1024;
  var ALLOWED_EXT = [".pdf", ".docx", ".doc", ".xlsx", ".xls", ".csv", ".txt", ".png", ".jpg", ".jpeg", ".bmp", ".webp"];
  var MIME = { ".pdf": "application/pdf", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".doc": "application/msword", ".xls": "application/vnd.ms-excel", ".csv": "text/csv", ".txt": "text/plain", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".bmp": "image/bmp", ".webp": "image/webp" };

  function ApiError(status, message) { this.name = "ApiError"; this.status = status; this.message = message; }
  ApiError.prototype = Object.create(Error.prototype); ApiError.prototype.constructor = ApiError;
  function bad(status, message) { return new ApiError(status, message); }
  function trunc(s, n) { s = s == null ? "" : String(s); return s.length > n ? s.slice(0, n) : s; }
  function nowIso() { return new Date().toISOString(); }
  function toU8(b) { return b instanceof Uint8Array ? b : new Uint8Array(b); }
  function textOf(b) { return typeof b === "string" ? b : new TextDecoder().decode(toU8(b)); }
  function bytesOf(b) { return typeof b === "string" ? new TextEncoder().encode(b) : toU8(b); }

  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }
  function subtle() {
    var c = (typeof crypto !== "undefined" && crypto.subtle) ? crypto : (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle ? globalThis.crypto : null);
    if (!c) { try { var req = typeof module === "object" && module.require; if (req) c = req.call(module, "node:crypto").webcrypto; } catch (e) { /* tidak tersedia */ } }
    if (!c || !c.subtle) throw bad(500, "WebCrypto tidak tersedia.");
    return c;
  }
  function sha256(data) { return subtle().subtle.digest("SHA-256", bytesOf(data)).then(hex); }

  function magicOk(ext, b) {
    function starts(off, sig) { if (b.length < off + sig.length) return false; for (var i = 0; i < sig.length; i++) if (b[i + off] !== sig[i]) return false; return true; }
    switch (ext) {
      case ".pdf": return starts(0, [0x25, 0x50, 0x44, 0x46]);
      case ".docx": case ".xlsx": return starts(0, [0x50, 0x4B, 3, 4]);
      case ".doc": case ".xls": return starts(0, [0xD0, 0xCF, 0x11, 0xE0]);
      case ".png": return starts(0, [0x89, 0x50, 0x4E, 0x47]);
      case ".jpg": case ".jpeg": return starts(0, [0xFF, 0xD8, 0xFF]);
      case ".bmp": return starts(0, [0x42, 0x4D]);
      case ".webp": return starts(0, [0x52, 0x49, 0x46, 0x46]) && starts(8, [0x57, 0x45]);
      case ".txt": case ".csv": for (var i = 0; i < Math.min(b.length, 4000); i++) if (b[i] === 0) return false; return true;
    }
    return false;
  }
  function extOf(name) { var m = /\.[A-Za-z0-9]{1,5}$/.exec(String(name || "")); return m ? m[0].toLowerCase() : ""; }
  function idOk(id) { return typeof id === "string" && /^[A-Za-z0-9_-]{3,48}$/.test(id); }
  function backupNameOk(n) { return typeof n === "string" && /^backup_[0-9_]+$/.test(n); }

  /* ---------------- token sesi (HMAC-SHA256) untuk server berbasis kata sandi ---------------- */
  function b64u(u8) {
    var s = ""; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return (typeof btoa === "function" ? btoa(s) : Buffer.from(s, "binary").toString("base64")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function unb64u(s) {
    s = String(s).replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "=";
    var bin = typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("binary");
    var u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u;
  }
  function hmacKey(secret) { return subtle().subtle.importKey("raw", bytesOf(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]); }
  function signToken(secret, ttlSec, extra) {
    if (!secret || String(secret).length < 16) return Promise.reject(bad(500, "Rahasia token belum diatur (minimal 16 karakter)."));
    var payload = b64u(bytesOf(JSON.stringify(Object.assign({ exp: Math.floor(Date.now() / 1000) + (ttlSec || 28800), iat: Math.floor(Date.now() / 1000) }, extra || {}))));
    return hmacKey(secret).then(function (k) { return subtle().subtle.sign("HMAC", k, bytesOf(payload)); }).then(function (sig) { return payload + "." + b64u(new Uint8Array(sig)); });
  }
  function verifyToken(secret, token) {
    var parts = String(token || "").split(".");
    if (parts.length !== 2 || !secret) return Promise.resolve(null);
    return hmacKey(secret).then(function (k) { return subtle().subtle.verify("HMAC", k, unb64u(parts[1]), bytesOf(parts[0])); }).then(function (ok) {
      if (!ok) return null;
      var p; try { p = JSON.parse(textOf(unb64u(parts[0]))); } catch (e) { return null; }
      return p && p.exp > Math.floor(Date.now() / 1000) ? p : null;
    }).catch(function () { return null; });
  }
  /** Perbandingan waktu-konstan lewat HMAC dari kedua nilai (panjang tidak bocor). */
  function passwordOk(given, expected) {
    if (!expected) return Promise.resolve(false);
    var k = "ksdas-pw-compare";
    return Promise.all([hmacKey(k), hmacKey(k)]).then(function (ks) {
      return Promise.all([subtle().subtle.sign("HMAC", ks[0], bytesOf(String(given == null ? "" : given))), subtle().subtle.sign("HMAC", ks[1], bytesOf(String(expected)))]);
    }).then(function (r) { var a = new Uint8Array(r[0]), b = new Uint8Array(r[1]), d = 0; for (var i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; });
  }

  /* ---------------- penangan permintaan ---------------- */
  function ok(json) { return { status: 200, json: json }; }

  /**
   * handle(repo, req, opts) -> Promise<{status, json | bytes+mime+name}>
   * req: {method, path ("/api/state" atau "api/state"), query: {}, body: string|Uint8Array|null}
   * opts: {mode, provider, version, started}
   */
  function handle(repo, req, opts) {
    opts = opts || {};
    var method = String(req.method || "GET").toUpperCase();
    var path = "/" + String(req.path || "").replace(/^\/+/, "").split("?")[0];
    var q = req.query || {};
    return Promise.resolve().then(function () { return route(repo, method, path, q, req.body, opts); }).catch(function (e) {
      if (e instanceof ApiError) return { status: e.status, json: { error: e.message } };
      return { status: 500, json: { error: "Kesalahan internal penyimpanan: " + trunc(e && e.message || e, 160) } };
    });
  }

  function route(repo, method, path, q, body, opts) {
    if (path === "/api/ping" && method === "GET") return ok({ app: "KSDAS", version: opts.version || "cloud", mode: opts.mode || "cloud", provider: opts.provider || "" });

    if (path === "/api/state") {
      if (method === "GET") return repo.getStateText().then(function (t) { return { status: 200, json: t ? JSON.parse(t) : null }; });
      if (method === "POST") {
        var text = textOf(body || "");
        if (text.length > MAX_STATE) throw bad(413, "Badan permintaan terlalu besar.");
        var j; try { j = JSON.parse(text); } catch (e) { throw bad(400, "State bukan JSON yang valid."); }
        if (!j || !Array.isArray(j.documents) || !Array.isArray(j.partners)) throw bad(400, "Format state tidak valid.");
        return repo.setStateText(text, trunc(j.savedAt || nowIso(), 40)).then(function () { return ok({ ok: true }); });
      }
    }
    if (path === "/api/audit") {
      if (method === "POST") {
        var d; try { d = JSON.parse(textOf(body || "")); } catch (e) { d = null; }
        if (!d || typeof d !== "object") throw bad(400, "Format audit tidak valid.");
        var ev = {}; ["at", "actor", "action", "target", "detail"].forEach(function (k) { ev[k] = trunc(d[k], 500); });
        if (!ev.at) ev.at = nowIso();
        return repo.addAudit(ev).then(function () { return ok({ ok: true }); });
      }
      if (method === "GET") {
        var lim = parseInt(q.limit, 10); if (!(lim > 0)) lim = 50; if (lim > 500) lim = 500;
        return repo.listAudit(lim).then(function (items) { return ok({ items: items }); });
      }
    }
    if (path === "/api/stats" && method === "GET") return stats(repo, opts);
    if (path === "/api/backup" && method === "POST") {
      return repo.getStateText().then(function (t) {
        if (!t) throw bad(409, "Belum ada data untuk dicadangkan.");
        var st = JSON.parse(t);
        var name = "backup_" + nowIso().replace(/[-:T]/g, "").slice(0, 14) + "_" + Math.floor(Math.random() * 1000);
        return sha256(t).then(function (h) {
          var meta = { name: name, at: nowIso(), bytes: bytesOf(t).length, sha256: h, documents: st.documents.length, partners: st.partners.length };
          return repo.putBackup(meta, t).then(function () { return ok({ name: name, bytes: meta.bytes, sha256: h, documents: meta.documents, at: meta.at }); });
        });
      });
    }
    if (path === "/api/backups" && method === "GET") return repo.listBackups().then(function (items) { return ok({ items: items }); });
    if (path === "/api/restore" && method === "POST") {
      var rq; try { rq = JSON.parse(textOf(body || "")); } catch (e) { rq = null; }
      var name = rq && rq.name, dry = !!(rq && rq.dryRun);
      if (!backupNameOk(name)) throw bad(400, "Nama cadangan tidak valid.");
      return repo.getBackup(name).then(function (b) {
        if (!b) throw bad(404, "Cadangan tidak ditemukan.");
        return sha256(b.text).then(function (h) {
          if (h !== b.meta.sha256) throw bad(409, "Pemeriksaan integritas gagal: checksum cadangan tidak cocok.");
          var st = JSON.parse(b.text);
          var after = dry ? Promise.resolve() : repo.setStateText(b.text, trunc(st.savedAt || nowIso(), 40));
          return after.then(function () { return ok({ documents: st.documents, partners: st.partners, memory: st.memory || {}, roleId: st.roleId }); });
        });
      });
    }
    if (path === "/api/sim") {
      if (method === "POST") {
        var s; try { s = JSON.parse(textOf(body || "")); } catch (e) { s = null; }
        if (!s || !Array.isArray(s.rows)) throw bad(400, "Format simulasi tidak valid.");
        if (s.rows.length > 5000) throw bad(400, "Terlalu banyak baris simulasi.");
        var t0 = Date.now();
        return repo.simWrite(s.rows).then(function (w) {
          var writeMs = Date.now() - t0, t1 = Date.now();
          return repo.simStat().then(function (st2) { return ok({ writeMs: writeMs, readMs: st2.readMs != null ? st2.readMs : Date.now() - t1, bytes: st2.bytes, rows: st2.rows }); });
        });
      }
      if (method === "DELETE") return repo.simClear().then(function () { return ok({ ok: true }); });
    }
    if (path.indexOf("/api/files/") === 0) {
      var id; try { id = decodeURIComponent(path.slice("/api/files/".length)); } catch (e) { id = ""; }
      if (!idOk(id)) throw bad(400, "ID berkas tidak valid.");
      if (method === "PUT") {
        var data = bytesOf(body || new Uint8Array(0));
        if (data.length > MAX_FILE) throw bad(413, "Ukuran berkas melebihi 25 MB.");
        var nm = trunc(String(q.name || "berkas").replace(/[\\/\u0000-\u001f]/g, "_"), 200), ext = extOf(nm);
        if (ALLOWED_EXT.indexOf(ext) < 0) throw bad(415, "Jenis berkas tidak didukung.");
        if (!magicOk(ext, data)) throw bad(415, "Isi berkas tidak sesuai ekstensi.");
        return sha256(data).then(function (h) {
          var meta = { docId: id, name: nm, type: MIME[ext] || "application/octet-stream", size: data.length, sha256: h, at: nowIso(), ext: ext };
          return repo.putFile(id, meta, data).then(function (ref) { return ok({ ref: (ref && ref.ref) || ("cloud://files/" + id + ext), sha256: h }); });
        });
      }
      if (method === "GET") return repo.getFile(id).then(function (f) {
        if (!f) throw bad(404, "Berkas tidak ditemukan.");
        return { status: 200, bytes: toU8(f.bytes), mime: f.meta.type || MIME[f.meta.ext] || "application/octet-stream", name: f.meta.name };
      });
      if (method === "DELETE") return repo.deleteFile(id).then(function () { return ok({ ok: true }); });
    }
    throw bad(404, "Endpoint tidak ditemukan.");
  }

  function stats(repo, opts) {
    return Promise.all([repo.getStateText(), repo.listFiles(), repo.countAudit(), repo.listBackups(), repo.info ? repo.info() : Promise.resolve({})]).then(function (r) {
      var stText = r[0], files = r[1] || [], st = null;
      try { st = stText ? JSON.parse(stText) : null; } catch (e) { st = null; }
      var fileBytes = files.reduce(function (a, f) { return a + (f.size || 0); }, 0);
      var docs = st ? st.documents : [], partners = st ? st.partners : [];
      var out = {
        mode: opts.mode || "cloud", provider: opts.provider || "",
        tables: [
          { name: "naskah_kerjasama", rows: docs.length, bytes: bytesOf(JSON.stringify(docs)).length },
          { name: "mitra_institusi", rows: partners.length, bytes: bytesOf(JSON.stringify(partners)).length },
          { name: "lampiran_berkas", rows: files.length, bytes: fileBytes }
        ],
        dbBytes: stText ? bytesOf(stText).length : 0, fileCount: files.length, fileBytes: fileBytes,
        backupCount: r[3].length, auditCount: r[2],
        files: files.map(function (f) { return { docId: f.docId, name: f.name, size: f.size, sha256: f.sha256, at: f.at }; }),
        uptimeSec: opts.started ? Math.round((Date.now() - opts.started) / 1000) : undefined
      };
      Object.keys(r[4] || {}).forEach(function (k) { out[k] = r[4][k]; });
      return ok(out);
    });
  }

  return {
    handle: handle, ApiError: ApiError, sha256: sha256, magicOk: magicOk, extOf: extOf, idOk: idOk, backupNameOk: backupNameOk,
    signToken: signToken, verifyToken: verifyToken, passwordOk: passwordOk, b64u: b64u, unb64u: unb64u,
    MAX_FILE: MAX_FILE, ALLOWED_EXT: ALLOWED_EXT, MIME: MIME, bytesOf: bytesOf, textOf: textOf
  };
});
