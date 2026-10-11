/*
 * KSDAS OCR engine (v1.0) - pembungkus ringan di atas tesseract-wasm (BSD-2-Clause).
 *
 * Perbedaan dengan tesseract.js yang dipakai sebelumnya (hasil benchmark ada di docs/OCR_RISET.md):
 *   - inti WASM 1,8 MB (bukan 2,9 MB, dan tanpa cadangan non-SIMD 3,9 MB yang dimuat bersamaan),
 *   - model "lite" (komponen kamus kata dibuang, tools/td-slim.js): ind 0,82 MB menggantikan ind+eng 4,0 MB,
 *   - pra-proses sendiri (preprocess.js) untuk gambar miring, berbayang, beresolusi rendah,
 *   - pemilihan bahasa otomatis: OCR awal dengan model ind, identifikasi bahasa (langid.js), lalu model bahasa
 *     yang sesuai bila perlu (paket dimuat malas, hanya saat dibutuhkan),
 *   - keyakinan per kata, deteksi orientasi, dan kandidat terbaik berdasarkan keyakinan.
 * Semua berjalan lokal. Tidak ada permintaan jaringan selain berkas aset milik sendiri.
 */
(function (root) {
  "use strict";
  var BASE = (function () {
    try { var s = document.currentScript && document.currentScript.src; if (s) return s.slice(0, s.lastIndexOf("/") + 1); } catch (e) { /* ignore */ }
    return "js/ocr/";
  })();
  var MODEL_BASE = BASE + "models/";
  var S = { mod: null, client: null, wasm: null, lang: null, manifest: null, queue: Promise.resolve(), cache: {} };
  var NON_SPACE = /[぀-ヿ㐀-鿿가-힯฀-๿]/;

  function enqueue(fn) {
    var run = S.queue.then(fn, fn);
    S.queue = run.then(function () { }, function () { });
    return run;
  }
  function importModule() {
    if (S.mod) return Promise.resolve(S.mod);
    return import(BASE + "tw/lib.js").then(function (m) { S.mod = m; return m; });
  }
  function getClient() {
    if (S.client) return Promise.resolve(S.client);
    return importModule().then(function (m) {
      var file = m.supportsFastBuild() ? "tesseract-core.wasm" : "tesseract-core-fallback.wasm";
      var wasmP = S.wasm ? Promise.resolve(S.wasm) : fetch(BASE + "tw/" + file).then(function (r) {
        if (!r.ok) throw new Error("Berkas mesin OCR tidak ditemukan: " + file);
        return r.arrayBuffer();
      }).then(function (w) { S.wasm = w; return w; });
      return wasmP.then(function (wasm) {
        S.client = new m.OCRClient({ wasmBinary: wasm.slice(0), workerURL: BASE + "tw/tesseract-worker.js" });
        S.lang = null;
        return S.client;
      });
    });
  }
  /** tesseract-wasm hanya menerima satu model per instans mesin, sehingga ganti bahasa = instans baru. */
  function resetClient() {
    var c = S.client; S.client = null; S.lang = null;
    return c ? c.destroy().catch(function () { }) : Promise.resolve();
  }
  function gunzip(buf) {
    if (typeof DecompressionStream === "undefined") throw new Error("Peramban terlalu lama (DecompressionStream tidak tersedia). Perbarui peramban.");
    var ds = new DecompressionStream("gzip");
    return new Response(new Blob([buf]).stream().pipeThrough(ds)).arrayBuffer();
  }
  function manifest() {
    if (S.manifest) return Promise.resolve(S.manifest);
    return fetch(MODEL_BASE + "manifest.json").then(function (r) { return r.ok ? r.json() : { packs: { ind: { file: "ind.traineddata.gz" } } }; })
      .catch(function () { return { packs: { ind: { file: "ind.traineddata.gz" } } }; }).then(function (m) { S.manifest = m; return m; });
  }
  function hasPack(code) { return !!(S.manifest && S.manifest.packs && S.manifest.packs[code]); }
  /** Memuat model bahasa ke mesin (di dalam antrean). Mengembalikan kode paket yang benar-benar dipakai. */
  function useModel(code) {
    return manifest().then(function (m) {
      if (!m.packs[code]) code = "ind";
      if (S.lang === code) return code;
      return (S.lang ? resetClient() : Promise.resolve()).then(getClient).then(function (c) {
        var cached = S.cache[code];
        var p = cached ? Promise.resolve(cached) : fetch(MODEL_BASE + m.packs[code].file).then(function (r) {
          if (!r.ok) throw new Error("Paket bahasa " + code + " tidak ditemukan.");
          return r.arrayBuffer();
        }).then(function (b) { return /\.gz$/.test(m.packs[code].file) ? gunzip(b) : b; }).then(function (b) { S.cache[code] = b; return b; });
        return p.then(function (buf) { return c.loadModel(buf.slice(0)); }).then(function () { S.lang = code; return code; });
      });
    });
  }

  function sourceToImageData(src) {
    var p;
    if (src instanceof Blob) p = createImageBitmap(src);
    else p = Promise.resolve(src);
    return p.then(function (s) {
      var w = s.width || s.naturalWidth, h = s.height || s.naturalHeight;
      var c = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(w, h) : Object.assign(document.createElement("canvas"), { width: w, height: h });
      var ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(s, 0, 0);
      return ctx.getImageData(0, 0, w, h);
    });
  }
  function grayToImageData(gray, w, h) { return new ImageData(root.KSDASPrep.toRGBA(gray, w, h), w, h); }
  function rotateImageData(id, deg) {
    // rotasi kelipatan 90 derajat
    var w = id.width, h = id.height, g = root.KSDASPrep.toGray(id.data, w, h), nw = (deg === 90 || deg === 270) ? h : w, nh = (deg === 90 || deg === 270) ? w : h, out = new Uint8Array(nw * nh), x, y;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      var nx, ny;
      if (deg === 90) { nx = h - 1 - y; ny = x; } else if (deg === 180) { nx = w - 1 - x; ny = h - 1 - y; } else { nx = y; ny = w - 1 - x; }
      out[ny * nw + nx] = g[y * w + x];
    }
    return grayToImageData(out, nw, nh);
  }

  /** Susun teks dari kata berkotak: spasi antarkata, baris baru di akhir baris, tanpa spasi untuk CJK/Thai. */
  function compose(words) {
    var out = "", prev = "";
    words.forEach(function (w) {
      var t = w.text.replace(/\s+$/, "");
      if (!t) return;
      var start = (w.flags & 1) !== 0;
      if (out && !start && !(NON_SPACE.test(prev.slice(-1)) && NON_SPACE.test(t.charAt(0)))) out += " ";
      if (out && start && out.charAt(out.length - 1) !== "\n") out += "\n";
      out += t; prev = t;
    });
    return out;
  }
  function confidenceOf(words) {
    var num = 0, den = 0;
    words.forEach(function (w) { var n = Math.max(1, w.text.trim().length); num += w.confidence * n; den += n; });
    return den ? 100 * num / den : 0;
  }

  /** Satu putaran OCR atas ImageData (model sudah dimuat). */
  function ocrImage(imageData, onProgress) {
    return getClient().then(function (c) {
      return c.loadImage(imageData).then(function () { return c.getTextBoxes("word", function (p) { if (onProgress) onProgress(p); }); })
        .then(function (words) { return c.clearImage().then(function () { return words; }); });
    }).then(function (words) { return { text: compose(words), confidence: confidenceOf(words), words: words }; });
  }

  /**
   * Pengenalan satu gambar dengan kandidat pra-proses dan koreksi orientasi.
   * opts: { pack: kode paket (bawaan ind), onProgress(msg, pct), probe: true (gambar kecil cepat tanpa kandidat tambahan) }
   */
  function recognizeWith(imageData, opts) {
    opts = opts || {};
    var say = opts.onProgress || function () { };
    var info = { candidates: [] };
    function run(id, label) {
      return ocrImage(id, function (p) { say("OCR " + label + " " + Math.round(p * 100) + "%", 20 + Math.round(p * 60)); }).then(function (r) { r.label = label; info.candidates.push({ label: label, confidence: Math.round(r.confidence * 10) / 10, chars: r.text.length }); return r; });
    }
    var prep = root.KSDASPrep.prepare(imageData.data, imageData.width, imageData.height, opts.prep || {});
    info.prep = prep.info;
    var best = null;
    function consider(r) { if (!best || score(r) > score(best)) best = r; return best; }
    function score(r) { return r.confidence * Math.min(1, Math.sqrt(Math.max(1, r.text.replace(/\s/g, "").length) / 40)); }
    return run(grayToImageData(prep.gray, prep.width, prep.height), "pra-proses").then(consider).then(function () {
      if (opts.probe || best.confidence >= 72) return null;
      say("Mencoba kandidat lain karena keyakinan rendah...", 82);
      return run(imageData, "asli").then(consider);
    }).then(function () {
      if (opts.probe || opts.orient === false || best.confidence >= 55) return null;
      return getClient().then(function (c) {
        var g = grayToImageData(prep.gray, prep.width, prep.height);
        return c.loadImage(g).then(function () { return c.getOrientation(); }).then(function (o) { return c.clearImage().then(function () { return o; }); });
      }).then(function (o) {
        info.orientation = o;
        if (!o || !o.rotation || o.confidence < 0.4) return null;
        var rot = ((Math.round(o.rotation / 90) * 90) % 360 + 360) % 360;
        if (!rot) return null;
        say("Gambar tampak terputar " + rot + " derajat, memutar balik...", 86);
        return run(rotateImageData(grayToImageData(prep.gray, prep.width, prep.height), 360 - rot), "putar " + rot).then(consider);
      }).catch(function () { return null; });
    }).then(function () { best.info = info; return best; });
  }

  var LID = function () { return root.KSDASLangid; };
  /** Jumlahkan peluang kandidat bahasa per paket OCR. Mengembalikan [{pack,p}] terurut. */
  function packVotes(lang) {
    var votes = {};
    (lang.candidates || []).forEach(function (c) { var pk = LID().ocrPack(c.lang); votes[pk] = (votes[pk] || 0) + c.p; });
    return Object.keys(votes).map(function (k) { return { pack: k, p: votes[k] }; }).sort(function (a, b) { return b.p - a.p; });
  }

  /**
   * Pengenalan otomatis: ind dulu, identifikasi bahasa, lalu ganti paket bila perlu.
   * session: objek yang dibagikan antarhalaman satu dokumen agar paket terpilih diingat ({pack}).
   * Mengembalikan { text, confidence, words, language:{lang,script,confidence,...}, pack, info }.
   */
  function recognize(source, opts) {
    opts = opts || {};
    var session = opts.session || {};
    var say = opts.onProgress || function () { };
    return enqueue(function () {
      return manifest().then(function () { return sourceToImageData(source); }).then(function (img) {
        var fixed = opts.pack || (session.locked ? session.pack : null);
        var firstPack = fixed || session.pack || "ind";
        return useModel(firstPack).then(function (used) {
          say("OCR (" + used + ")...", 15);
          return recognizeWith(img, { onProgress: opts.onProgress, prep: opts.prep, orient: !!fixed }).then(function (r) {
            var lang = LID() ? LID().detect(r.text) : { lang: "und", confidence: 0 };
            var result = { text: r.text, confidence: r.confidence, words: r.words, language: lang, pack: used, info: r.info };
            if (fixed) return finish(img, result, opts, session);
            var wanted = used;
            if (LID() && lang.lang !== "und") {
              var votes = packVotes(lang).filter(function (v) { return v.pack !== used && hasPack(v.pack); });
              if (votes.length && votes[0].p >= 0.3) wanted = votes[0].pack;
            }
            var step;
            if (wanted !== used && r.confidence >= 40) step = retry(img, wanted, result, opts, session);
            else if (r.confidence < 50 && !opts.noProbe) step = probeScripts(img, used, r.confidence, opts).then(function (best) { return best ? retry(img, best, result, opts, session) : result; });
            else step = Promise.resolve(result);
            return step.then(function (res) { return finish(img, res, opts, session); });
          });
        });
      });
    });
  }
  /** Bila hasil akhir masih lemah: coba koreksi orientasi (90/180/270) dengan paket terpilih. */
  function finish(img, res, opts, session) {
    session.pack = res.pack;
    if (res.confidence >= 45 || opts.noOrient) return Promise.resolve(res);
    return useModel(res.pack).then(function () { return recognizeWith(img, { onProgress: opts.onProgress, prep: opts.prep, orient: true }); }).then(function (r) {
      if (r.confidence > res.confidence + 5) { res.text = r.text; res.confidence = r.confidence; res.words = r.words; res.info = r.info; res.language = LID() ? LID().detect(r.text) : res.language; }
      return res;
    });
  }
  function retry(img, pack, prev, opts, session) {
    var say = opts.onProgress || function () { };
    say("Memakai paket bahasa " + pack + "...", 40);
    return useModel(pack).then(function (used) {
      return recognizeWith(img, { onProgress: opts.onProgress, prep: opts.prep, orient: false }).then(function (r) {
        var lang = LID() ? LID().detect(r.text) : { lang: "und", confidence: 0 };
        if (r.confidence > prev.confidence + 2) {
          var res = { text: r.text, confidence: r.confidence, words: r.words, language: lang, pack: used, info: r.info };
          // aksara Han dipakai bersama oleh Jepang dan Tionghoa: periksa ulang dengan hasil identifikasi bahasa
          var alt = LID() && lang.lang !== "und" ? LID().ocrPack(lang.lang) : used;
          if (alt !== used && hasPack(alt) && lang.confidence >= 0.8 && !opts._second) return retry(img, alt, res, Object.assign({}, opts, { _second: true }), session);
          session.pack = used; return res;
        }
        return useModel(prev.pack).then(function () { session.pack = prev.pack; return prev; });
      });
    });
  }
  /** Potongan kecil berisi beberapa baris teks pertama agar uji bahasa cepat. */
  function firstLinesCrop(img) {
    var w = img.width, h = img.height, P = root.KSDASPrep, g = P.toGray(img.data, w, h), bin = P.sauvola(g, w, h, 25, 0.25);
    var lh = P.estimateLineHeight(bin, w, h) || Math.round(h / 20), y = 0, x, thr = Math.max(3, w * 0.004);
    for (; y < h; y++) { var c = 0; for (x = 0; x < w; x += 2) if (bin[y * w + x] === 0) c++; if (c >= thr) break; }
    var y0 = Math.max(0, y - Math.round(lh * 0.6)), y1 = Math.min(h, y0 + Math.max(140, Math.round(lh * 5.5)));
    if (y1 - y0 < 60) { y0 = 0; y1 = Math.min(h, Math.max(220, Math.round(h * 0.4))); }
    return new ImageData(new Uint8ClampedArray(img.data.buffer.slice(y0 * w * 4, y1 * w * 4)), w, y1 - y0);
  }
  var PROBE_ORDER = ["jpn", "chi_sim", "kor", "rus", "tha", "ara", "hin"];
  var PROBE_BUDGET_MS = 16000;
  function probeScripts(img, current, baseConf, opts) {
    // bagian atas dokumen (tempat judul), dikecilkan agar cepat; tanpa kandidat tambahan
    var crop = firstLinesCrop(img);
    var say = opts.onProgress || function () { };
    var cands = PROBE_ORDER.filter(function (p) { return hasPack(p) && p !== current; });
    var best = null, probes = (opts.probeLog = opts.probeLog || []), t0 = Date.now();
    return cands.reduce(function (chain, p) {
      return chain.then(function () {
        if (best && best.conf >= 60) return null;            // cukup meyakinkan: berhenti lebih awal
        if (Date.now() - t0 > (opts.probeBudgetMs || PROBE_BUDGET_MS)) return null; // batas waktu
        say("Mendeteksi aksara dan bahasa (" + p + ")...", 30);
        return useModel(p).then(function () { return recognizeWith(crop, { probe: true }); }).then(function (r) {
          var chars = r.text.replace(/\s/g, "").length;
          probes.push({ pack: p, conf: Math.round(r.confidence), chars: chars });
          if (chars >= 8 && r.confidence >= Math.max(45, baseConf + 12) && (!best || r.confidence > best.conf)) best = { pack: p, conf: r.confidence };
        });
      });
    }, Promise.resolve()).then(function () { return best ? best.pack : null; });
  }

  root.KSDASOcr = {
    recognize: recognize,
    ready: function () { return manifest().then(getClient).then(function () { return true; }); },
    packs: function () { return manifest().then(function (m) { return Object.keys(m.packs); }); },
    session: function () { return {}; },
    dispose: function () { var c = S.client; S.client = null; S.lang = null; return c ? c.destroy() : Promise.resolve(); },
    _compose: compose, _confidenceOf: confidenceOf, base: BASE
  };
})(typeof self !== "undefined" ? self : this);
