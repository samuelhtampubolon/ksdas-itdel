/*
 * KSDAS IT Del - Lapisan Penyimpanan (v1.0)
 *
 * Dua mode dengan antarmuka yang sama:
 *  - "browser"      : IndexedDB di peramban (GitHub Pages). Berkas lampiran, audit, dan cadangan
 *                     disimpan di IndexedDB. Data tidak pernah meninggalkan komputer pengguna.
 *  - "local-server" : KSDAS_ITDel.exe menjalankan server lokal (127.0.0.1) yang menulis ke folder
 *                     ksdas_local_database di disk komputer. Mode terdeteksi otomatis.
 *
 * Catatan: ini adalah penyimpanan PROTOTIPE. Basis data produksi, penyimpanan berkas, dan cadangan
 * resmi ditentukan SDI/TSI/DukTek (lihat docs/RUNBOOK_INTEGRASI_SDI_TSI_V03.md).
 */
(function (root) {
  "use strict";

  var DB_NAME = "ksdas_db", DB_VERSION = 1;
  var STORES = ["state", "files", "audit", "backups", "sim"];
  var MAX_FILE = 25 * 1024 * 1024;
  var db = null, mode = "browser", serverInfo = null, token = "";
  var memBlocks = [];
  var saveTimer = null, pendingState = null, lastSaveInfo = { at: null, ms: null, bytes: 0, ok: null, error: "" };

  function hasIDB() { try { return typeof indexedDB !== "undefined" && !!indexedDB; } catch (e) { return false; } }
  function req2p(r) { return new Promise(function (res, rej) { r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
  function openDb() {
    if (!hasIDB()) return Promise.resolve(null);
    return new Promise(function (resolve) {
      var r;
      try { r = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { return resolve(null); }
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains("state")) d.createObjectStore("state");
        if (!d.objectStoreNames.contains("files")) d.createObjectStore("files");
        if (!d.objectStoreNames.contains("audit")) d.createObjectStore("audit", { keyPath: "seq", autoIncrement: true });
        if (!d.objectStoreNames.contains("backups")) d.createObjectStore("backups");
        if (!d.objectStoreNames.contains("sim")) d.createObjectStore("sim", { autoIncrement: true });
      };
      r.onsuccess = function () { resolve(r.result); };
      r.onerror = function () { resolve(null); };
      r.onblocked = function () { resolve(null); };
    });
  }
  function tx(store, write) { return db.transaction(store, write ? "readwrite" : "readonly").objectStore(store); }
  function txDone(t) { return new Promise(function (res, rej) { t.oncomplete = function () { res(); }; t.onerror = function () { rej(t.error); }; t.onabort = function () { rej(t.error); }; }); }

  function sha256(buf) {
    try {
      if (root.crypto && root.crypto.subtle) {
        return root.crypto.subtle.digest("SHA-256", buf).then(function (h) {
          return Array.prototype.map.call(new Uint8Array(h), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
        });
      }
    } catch (e) { /* jatuh ke FNV */ }
    var a = new Uint8Array(buf), h = 2166136261;
    for (var i = 0; i < a.length; i++) { h ^= a[i]; h = Math.imul(h, 16777619) >>> 0; }
    return Promise.resolve("fnv1a-" + h.toString(16));
  }
  function strBytes(s) { return new Blob([s]).size; }
  function api(method, path, body, raw) {
    var headers = { "X-KSDAS-Token": token };
    var opts = { method: method, headers: headers, cache: "no-store" };
    if (body !== undefined && !raw) { headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
    if (raw) { opts.body = body; headers["Content-Type"] = "application/octet-stream"; }
    return fetch(path, opts).then(function (r) {
      return r.text().then(function (t) {
        var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { /* bukan JSON */ }
        if (!r.ok) throw new Error((j && j.error) || ("HTTP " + r.status));
        return j;
      });
    });
  }
  function withTimeout(p, ms) {
    return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, ms); })]);
  }

  var Store = {
    get mode() { return mode; },
    get serverInfo() { return serverInfo; },
    get lastSave() { return lastSaveInfo; },
    isServer: function () { return mode === "local-server"; },

    init: function () {
      var meta = root.document && root.document.querySelector('meta[name="ksdas-token"]');
      token = meta ? meta.content : "";
      var tryServer = /^https?:$/.test(root.location.protocol) && token && !/\{\{/.test(token)
        ? withTimeout(api("GET", "api/ping"), 1500).then(function (j) { if (j && j.app === "KSDAS") { mode = "local-server"; serverInfo = j; } }).catch(function () { })
        : Promise.resolve();
      return tryServer.then(openDb).then(function (d) { db = d; return Store; });
    },

    /** Memuat state tersimpan: {documents, partners, roleId, savedAt} atau null */
    loadState: function () {
      if (mode === "local-server") return api("GET", "api/state").then(function (j) { return j && j.documents ? j : null; }).catch(function () { return null; });
      if (!db) return Promise.resolve(null);
      return req2p(tx("state").get("main")).catch(function () { return null; }).then(function (v) { return v || null; });
    },

    /** Simpan state (di-debounce). Mengembalikan promise yang selesai setelah tertulis. */
    saveState: function (state, immediate) {
      pendingState = { roleId: state.roleId, documents: state.documents, partners: state.partners, memory: state.memory || {}, savedAt: new Date().toISOString() };
      if (saveTimer) clearTimeout(saveTimer);
      var run = function () {
        var snap = pendingState; pendingState = null; saveTimer = null;
        if (!snap) return Promise.resolve();
        var t0 = performance.now();
        var bytes = strBytes(JSON.stringify(snap));
        var p = mode === "local-server" ? api("POST", "api/state", snap) : (db ? (function () { var t = db.transaction("state", "readwrite"); t.objectStore("state").put(snap, "main"); return txDone(t); })() : Promise.resolve());
        return p.then(function () { lastSaveInfo = { at: snap.savedAt, ms: Math.round((performance.now() - t0) * 10) / 10, bytes: bytes, ok: true, error: "" }; })
          .catch(function (e) { lastSaveInfo = { at: snap.savedAt, ms: null, bytes: bytes, ok: false, error: String(e && e.message || e) }; });
      };
      if (immediate) return run();
      return new Promise(function (resolve) { saveTimer = setTimeout(function () { run().then(resolve); }, 250); });
    },

    putFile: function (docId, file) {
      if (file.size > MAX_FILE) return Promise.reject(new Error("Ukuran berkas melebihi 25 MB."));
      return file.arrayBuffer().then(function (buf) {
        return sha256(buf).then(function (hash) {
          var rec = { docId: docId, name: file.name, type: file.type || "application/octet-stream", size: file.size, sha256: hash, at: new Date().toISOString() };
          if (mode === "local-server") {
            return api("PUT", "api/files/" + encodeURIComponent(docId) + "?name=" + encodeURIComponent(file.name), buf, true).then(function (j) { rec.ref = j.ref; rec.sha256 = j.sha256 || hash; return rec; });
          }
          if (!db) return Object.assign(rec, { ref: "(tidak tersimpan: IndexedDB tidak tersedia)" });
          var t = db.transaction("files", "readwrite");
          t.objectStore("files").put(Object.assign({ blob: new Blob([buf], { type: rec.type }) }, rec), docId);
          return txDone(t).then(function () { rec.ref = "indexeddb://files/" + docId; return rec; });
        });
      });
    },
    getFile: function (docId) {
      if (mode === "local-server") return fetch("api/files/" + encodeURIComponent(docId), { headers: { "X-KSDAS-Token": token } }).then(function (r) { return r.ok ? r.blob() : null; });
      if (!db) return Promise.resolve(null);
      return req2p(tx("files").get(docId)).then(function (v) { return v ? v.blob : null; });
    },
    deleteFile: function (docId) {
      if (mode === "local-server") return api("DELETE", "api/files/" + encodeURIComponent(docId)).catch(function () { });
      if (!db) return Promise.resolve();
      var t = db.transaction("files", "readwrite"); t.objectStore("files").delete(docId); return txDone(t);
    },
    listFiles: function () {
      if (mode === "local-server") return api("GET", "api/stats").then(function (s) { return s.files || []; });
      if (!db) return Promise.resolve([]);
      return req2p(tx("files").getAll()).then(function (all) { return all.map(function (r) { return { docId: r.docId, name: r.name, size: r.size, sha256: r.sha256, at: r.at }; }); });
    },

    audit: function (action, target, detail, actor) {
      var ev = { at: new Date().toISOString(), actor: actor || "Pengguna", action: action, target: target || "", detail: detail || "" };
      if (mode === "local-server") return api("POST", "api/audit", ev).catch(function () { });
      if (!db) return Promise.resolve();
      var t = db.transaction("audit", "readwrite"); t.objectStore("audit").add(ev); return txDone(t).catch(function () { });
    },
    listAudit: function (limit) {
      limit = limit || 50;
      if (mode === "local-server") return api("GET", "api/audit?limit=" + limit).then(function (j) { return j.items || []; }).catch(function () { return []; });
      if (!db) return Promise.resolve([]);
      return req2p(tx("audit").getAll()).then(function (all) { return all.slice(-limit).reverse(); });
    },

    backup: function (state) {
      if (mode === "local-server") return api("POST", "api/backup", {});
      if (!db) return Promise.reject(new Error("IndexedDB tidak tersedia."));
      var name = "backup_" + new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
      var snap = { roleId: state.roleId, documents: state.documents, partners: state.partners, memory: state.memory || {}, savedAt: new Date().toISOString() };
      var json = JSON.stringify(snap);
      return sha256(new TextEncoder().encode(json)).then(function (hash) {
        var t = db.transaction("backups", "readwrite");
        t.objectStore("backups").put({ name: name, at: snap.savedAt, bytes: strBytes(json), sha256: hash, documents: snap.documents.length, partners: snap.partners.length, data: snap }, name);
        return txDone(t).then(function () { return { name: name, bytes: strBytes(json), sha256: hash, documents: snap.documents.length }; });
      });
    },
    listBackups: function () {
      if (mode === "local-server") return api("GET", "api/backups").then(function (j) { return j.items || []; });
      if (!db) return Promise.resolve([]);
      return req2p(tx("backups").getAll()).then(function (all) {
        return all.map(function (b) { return { name: b.name, at: b.at, bytes: b.bytes, sha256: b.sha256, documents: b.documents }; }).reverse();
      });
    },
    restore: function (name, dryRun) {
      if (mode === "local-server") return api("POST", "api/restore", { name: name, dryRun: !!dryRun });
      if (!db) return Promise.reject(new Error("IndexedDB tidak tersedia."));
      return req2p(tx("backups").get(name)).then(function (b) {
        if (!b) throw new Error("Cadangan tidak ditemukan.");
        return sha256(new TextEncoder().encode(JSON.stringify(b.data))).then(function (h) {
          if (h !== b.sha256) throw new Error("Pemeriksaan integritas gagal: checksum cadangan tidak cocok.");
          return b.data;
        });
      });
    },

    /** Statistik penyimpanan + memori untuk halaman Penyimpanan */
    stats: function (state) {
      var out = {
        mode: mode,
        tables: [
          { name: "naskah_kerjasama", rows: state.documents.length, bytes: strBytes(JSON.stringify(state.documents)) },
          { name: "mitra_institusi", rows: state.partners.length, bytes: strBytes(JSON.stringify(state.partners)) }
        ],
        browser: { idb: !!db, secure: !!root.isSecureContext, crypto: !!(root.crypto && root.crypto.subtle) },
        memory: {}
      };
      var jobs = [];
      if (root.navigator && navigator.storage && navigator.storage.estimate) jobs.push(navigator.storage.estimate().then(function (e) { out.browser.quota = e.quota; out.browser.usage = e.usage; }).catch(function () { }));
      if (root.navigator && navigator.storage && navigator.storage.persisted) jobs.push(navigator.storage.persisted().then(function (p) { out.browser.persisted = p; }).catch(function () { }));
      try { var ls = 0; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); ls += (k.length + (localStorage.getItem(k) || "").length) * 2; } out.browser.localStorageBytes = ls; } catch (e) { out.browser.localStorageBytes = null; }
      if (performance && performance.memory) out.memory.jsHeapUsed = performance.memory.usedJSHeapSize, out.memory.jsHeapTotal = performance.memory.totalJSHeapSize, out.memory.jsHeapLimit = performance.memory.jsHeapSizeLimit;
      if (navigator.deviceMemory) out.memory.deviceMemoryGB = navigator.deviceMemory;
      out.memory.simulatedMB = memBlocks.length;
      out.stateBytes = strBytes(JSON.stringify({ documents: state.documents, partners: state.partners }));
      if (db) {
        jobs.push(req2p(tx("files").count()).then(function (n) { out.fileCount = n; }).catch(function () { }));
        jobs.push(req2p(tx("audit").count()).then(function (n) { out.auditCount = n; }).catch(function () { }));
        jobs.push(req2p(tx("backups").count()).then(function (n) { out.backupCount = n; }).catch(function () { }));
        jobs.push(req2p(tx("files").getAll()).then(function (all) { out.fileBytes = all.reduce(function (a, r) { return a + (r.size || 0); }, 0); }).catch(function () { }));
      }
      if (mode === "local-server") jobs.push(api("GET", "api/stats").then(function (s) { out.server = s; }).catch(function (e) { out.serverError = String(e.message || e); }));
      return Promise.all(jobs).then(function () { return out; });
    },
    requestPersist: function () {
      if (root.navigator && navigator.storage && navigator.storage.persist) return navigator.storage.persist();
      return Promise.resolve(false);
    },

    /* --------- Simulasi (demonstrasi). Tidak menyentuh data naskah. --------- */
    simulateIO: function (count, kb) {
      count = Math.max(1, Math.min(5000, count | 0)); kb = Math.max(1, Math.min(256, kb | 0));
      if (count * kb > 65536) return Promise.reject(new Error('Total simulasi dibatasi 64 MB (jumlah x ukuran).'));
      var payload = "x".repeat(kb * 1024);
      var res = { count: count, kb: kb, mode: mode };
      var t0 = performance.now();
      if (mode === "local-server") {
        var rows = [];
        for (var i = 0; i < count; i++) rows.push({ i: i, payload: payload });
        return api("POST", "api/sim", { rows: rows }).then(function (j) {
          res.writeMs = Math.round(performance.now() - t0); res.serverWriteMs = j.writeMs; res.readMs = j.readMs; res.bytes = j.bytes; res.cleaned = false;
          return res;
        });
      }
      if (!db) return Promise.reject(new Error("IndexedDB tidak tersedia."));
      var t = db.transaction("sim", "readwrite"), st = t.objectStore("sim");
      for (var n = 0; n < count; n++) st.add({ i: n, payload: payload, at: Date.now() });
      return txDone(t).then(function () {
        res.writeMs = Math.round(performance.now() - t0);
        var t1 = performance.now();
        return req2p(tx("sim").getAll()).then(function (all) {
          res.readMs = Math.round(performance.now() - t1);
          res.bytes = all.reduce(function (a, r) { return a + r.payload.length; }, 0);
          res.rows = all.length;
          return res;
        });
      });
    },
    clearSim: function () {
      if (mode === "local-server") return api("DELETE", "api/sim").catch(function () { });
      if (!db) return Promise.resolve();
      var t = db.transaction("sim", "readwrite"); t.objectStore("sim").clear(); return txDone(t);
    },
    allocateMemory: function (mb) {
      mb = Math.max(1, Math.min(256, mb | 0));
      for (var i = 0; i < mb; i++) { var b = new Uint8Array(1024 * 1024); b.fill(i % 251 + 1); memBlocks.push(b); }
      return memBlocks.length;
    },
    releaseMemory: function () { memBlocks = []; return 0; },
    hashBuffer: function (buf) { return sha256(buf); },
    hash: function (text) { return sha256(new TextEncoder().encode(text)); },
    api: function (m, p, b) { return api(m, p, b); }
  };
  root.KSDASStore = Store;
})(typeof self !== "undefined" ? self : this);
