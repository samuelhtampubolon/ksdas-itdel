/*
 * KSDAS OCR - pra-proses citra ringan (v1.0), tanpa dependensi.
 *
 * Mesin tesseract-wasm yang ringan membuang rutinitas citra bawaan Leptonica, sehingga gambar miring, berbayang,
 * atau berbintik menurun akurasinya. Modul ini mengembalikan kemampuan itu dengan algoritma klasik yang kecil:
 *   - estimasi derau Immerkaer (1996) untuk memilih penyaring,
 *   - normalisasi pencahayaan dan binarisasi Sauvola (2000) dengan citra integral,
 *   - penghapusan bintik (komponen kecil),
 *   - deteksi kemiringan dengan profil proyeksi (Postl 1986; Bloomberg dkk. 1995) dan rotasi bilinear,
 *   - penskalaan menuju tinggi teks yang disukai LSTM Tesseract.
 * Bekerja pada Uint8Array grayscale sehingga dapat dijalankan di peramban maupun Node.js (uji otomatis).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.KSDASPrep = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function toGray(rgba, w, h) {
    var g = new Uint8Array(w * h);
    for (var i = 0, j = 0; i < g.length; i++, j += 4) g[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
    return g;
  }
  function toRGBA(gray, w, h) {
    var out = new Uint8ClampedArray(w * h * 4);
    for (var i = 0, j = 0; i < gray.length; i++, j += 4) { out[j] = out[j + 1] = out[j + 2] = gray[i]; out[j + 3] = 255; }
    return out;
  }

  /** Estimasi simpangan baku derau (Immerkaer 1996). */
  function estimateNoise(g, w, h) {
    var sum = 0, cnt = 0;
    for (var y = 1; y < h - 1; y += 2) {
      for (var x = 1; x < w - 1; x += 2) {
        var i = y * w + x;
        var v = g[i - w - 1] - 2 * g[i - w] + g[i - w + 1] - 2 * g[i - 1] + 4 * g[i] - 2 * g[i + 1] + g[i + w - 1] - 2 * g[i + w] + g[i + w + 1];
        sum += v < 0 ? -v : v; cnt++;
      }
    }
    return cnt ? Math.sqrt(Math.PI / 2) * sum / (6 * cnt) : 0;
  }

  /** Penyaring median 3x3. */
  function median3(g, w, h) {
    var out = new Uint8Array(g.length), win = new Array(9);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var k = 0;
        for (var dy = -1; dy <= 1; dy++) {
          var yy = y + dy; yy = yy < 0 ? 0 : yy >= h ? h - 1 : yy;
          for (var dx = -1; dx <= 1; dx++) { var xx = x + dx; xx = xx < 0 ? 0 : xx >= w ? w - 1 : xx; win[k++] = g[yy * w + xx]; }
        }
        for (var a = 1; a < 9; a++) { var v = win[a], b = a - 1; while (b >= 0 && win[b] > v) { win[b + 1] = win[b]; b--; } win[b + 1] = v; }
        out[y * w + x] = win[4];
      }
    }
    return out;
  }

  /** Gaussian kabur terpisah (sigma kecil) lewat kernel diskret. */
  function gauss(g, w, h, sigma) {
    var r = Math.max(1, Math.ceil(sigma * 2)), k = [], s = 0, i, x, y;
    for (i = -r; i <= r; i++) { var v = Math.exp(-(i * i) / (2 * sigma * sigma)); k.push(v); s += v; }
    for (i = 0; i < k.length; i++) k[i] /= s;
    var tmp = new Float32Array(g.length), out = new Uint8Array(g.length);
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) { var acc = 0; for (i = -r; i <= r; i++) { var xx = x + i; xx = xx < 0 ? 0 : xx >= w ? w - 1 : xx; acc += g[y * w + xx] * k[i + r]; } tmp[y * w + x] = acc; }
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) { var acc2 = 0; for (i = -r; i <= r; i++) { var yy = y + i; yy = yy < 0 ? 0 : yy >= h ? h - 1 : yy; acc2 += tmp[yy * w + x] * k[i + r]; } out[y * w + x] = acc2 + 0.5; }
    return out;
  }

  /** Binarisasi Sauvola dengan citra integral. Teks = 0, latar = 255. */
  function sauvola(g, w, h, win, k) {
    var W1 = w + 1, I = new Float64Array(W1 * (h + 1)), I2 = new Float64Array(W1 * (h + 1)), x, y;
    for (y = 1; y <= h; y++) {
      var rs = 0, rs2 = 0;
      for (x = 1; x <= w; x++) { var v = g[(y - 1) * w + (x - 1)]; rs += v; rs2 += v * v; I[y * W1 + x] = I[(y - 1) * W1 + x] + rs; I2[y * W1 + x] = I2[(y - 1) * W1 + x] + rs2; }
    }
    var half = win >> 1, out = new Uint8Array(g.length), R = 128;
    for (y = 0; y < h; y++) {
      var y0 = Math.max(0, y - half), y1 = Math.min(h - 1, y + half);
      for (x = 0; x < w; x++) {
        var x0 = Math.max(0, x - half), x1 = Math.min(w - 1, x + half), n = (x1 - x0 + 1) * (y1 - y0 + 1);
        var s1 = I[(y1 + 1) * W1 + x1 + 1] - I[y0 * W1 + x1 + 1] - I[(y1 + 1) * W1 + x0] + I[y0 * W1 + x0];
        var s2 = I2[(y1 + 1) * W1 + x1 + 1] - I2[y0 * W1 + x1 + 1] - I2[(y1 + 1) * W1 + x0] + I2[y0 * W1 + x0];
        var m = s1 / n, sd = Math.sqrt(Math.max(0, s2 / n - m * m));
        var t = m * (1 + k * (sd / R - 1));
        out[y * w + x] = g[y * w + x] > t ? 255 : 0;
      }
    }
    return out;
  }

  /** Normalisasi pencahayaan: bagi dengan estimasi latar (rata-rata lokal besar). */
  function flatten(g, w, h, win) {
    var W1 = w + 1, I = new Float64Array(W1 * (h + 1)), x, y;
    for (y = 1; y <= h; y++) { var rs = 0; for (x = 1; x <= w; x++) { rs += g[(y - 1) * w + (x - 1)]; I[y * W1 + x] = I[(y - 1) * W1 + x] + rs; } }
    var half = win >> 1, out = new Uint8Array(g.length);
    for (y = 0; y < h; y++) {
      var y0 = Math.max(0, y - half), y1 = Math.min(h - 1, y + half);
      for (x = 0; x < w; x++) {
        var x0 = Math.max(0, x - half), x1 = Math.min(w - 1, x + half), n = (x1 - x0 + 1) * (y1 - y0 + 1);
        var m = (I[(y1 + 1) * W1 + x1 + 1] - I[y0 * W1 + x1 + 1] - I[(y1 + 1) * W1 + x0] + I[y0 * W1 + x0]) / n;
        var v = m > 8 ? g[y * w + x] * 235 / m : g[y * w + x];
        out[y * w + x] = v > 255 ? 255 : v;
      }
    }
    return out;
  }

  /** Hapus komponen terhubung hitam yang sangat kecil (bintik), 4-ketetanggaan, tanpa rekursi. */
  function despeckle(b, w, h, minArea) {
    var seen = new Uint8Array(b.length), stack = new Int32Array(b.length), removed = 0;
    for (var s = 0; s < b.length; s++) {
      if (b[s] !== 0 || seen[s]) continue;
      var sp = 0, n = 0; stack[sp++] = s; seen[s] = 1;
      var members = [];
      while (sp) {
        var p = stack[--sp]; n++; if (n <= minArea) members.push(p);
        var x = p % w, y = (p / w) | 0;
        if (x > 0 && !seen[p - 1] && b[p - 1] === 0) { seen[p - 1] = 1; stack[sp++] = p - 1; }
        if (x < w - 1 && !seen[p + 1] && b[p + 1] === 0) { seen[p + 1] = 1; stack[sp++] = p + 1; }
        if (y > 0 && !seen[p - w] && b[p - w] === 0) { seen[p - w] = 1; stack[sp++] = p - w; }
        if (y < h - 1 && !seen[p + w] && b[p + w] === 0) { seen[p + w] = 1; stack[sp++] = p + w; }
      }
      if (n < minArea) { for (var m = 0; m < members.length; m++) b[members[m]] = 255; removed++; }
    }
    return removed;
  }

  /** Perkirakan sudut kemiringan (derajat, positif = searah jarum jam) dengan profil proyeksi. */
  function detectSkew(bin, w, h) {
    // kecilkan agar cepat: ambil titik hitam dengan langkah
    var step = Math.max(1, Math.round(Math.max(w, h) / 900)), pts = [];
    for (var y = 0; y < h; y += step) for (var x = 0; x < w; x += step) if (bin[y * w + x] === 0) pts.push(x / step, y / step);
    if (pts.length < 400) return { angle: 0, score: 0 };
    var hh = Math.ceil(h / step) + Math.ceil(w / step) + 4, off = Math.ceil(w / step) * 0.1 + 2;
    function scoreAt(deg) {
      var rad = deg * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad), hist = new Float64Array(hh), i, n = pts.length;
      for (i = 0; i < n; i += 2) { var yy = Math.round(-pts[i] * s + pts[i + 1] * c + off + (w / step) * 0.5 * Math.abs(s)); if (yy >= 0 && yy < hh) hist[yy]++; }
      // jumlah kuadrat selisih antar baris (lebih peka pada garis teks tajam)
      var acc = 0; for (i = 1; i < hh; i++) { var d = hist[i] - hist[i - 1]; acc += d * d; }
      return acc;
    }
    var best = 0, bestS = -1, a;
    for (a = -6; a <= 6.001; a += 0.5) { var sc = scoreAt(a); if (sc > bestS) { bestS = sc; best = a; } }
    var base = scoreAt(0), fine = best;
    for (a = best - 0.5; a <= best + 0.5001; a += 0.1) { var sc2 = scoreAt(a); if (sc2 > bestS) { bestS = sc2; fine = a; } }
    // hanya putar bila perbaikannya meyakinkan
    if (Math.abs(fine) < 0.3 || bestS < base * 1.04) return { angle: 0, score: bestS / (base || 1) };
    return { angle: fine, score: bestS / (base || 1) };
  }

  /** Rotasi bilinear di sekitar pusat, latar putih. angle > 0 memutar isi berlawanan arah jarum jam (mengoreksi kemiringan searah jarum jam). */
  function rotate(g, w, h, deg, fill) {
    var rad = deg * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad), out = new Uint8Array(g.length), cx = w / 2, cy = h / 2;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var dx = x - cx, dy = y - cy;
        var sx = c * dx - s * dy + cx, sy = s * dx + c * dy + cy;
        if (sx < 0 || sy < 0 || sx >= w - 1 || sy >= h - 1) { out[y * w + x] = fill; continue; }
        var x0 = sx | 0, y0 = sy | 0, fx = sx - x0, fy = sy - y0, i = y0 * w + x0;
        out[y * w + x] = (g[i] * (1 - fx) + g[i + 1] * fx) * (1 - fy) + (g[i + w] * (1 - fx) + g[i + w + 1] * fx) * fy + 0.5;
      }
    }
    return out;
  }

  /** Skala bilinear. */
  function resize(g, w, h, nw, nh) {
    var out = new Uint8Array(nw * nh), xr = (w - 1) / Math.max(1, nw - 1), yr = (h - 1) / Math.max(1, nh - 1);
    for (var y = 0; y < nh; y++) {
      var sy = y * yr, y0 = sy | 0, fy = sy - y0, y1 = Math.min(h - 1, y0 + 1);
      for (var x = 0; x < nw; x++) {
        var sx = x * xr, x0 = sx | 0, fx = sx - x0, x1 = Math.min(w - 1, x0 + 1);
        out[y * nw + x] = (g[y0 * w + x0] * (1 - fx) + g[y0 * w + x1] * fx) * (1 - fy) + (g[y1 * w + x0] * (1 - fx) + g[y1 * w + x1] * fx) * fy + 0.5;
      }
    }
    return out;
  }

  /** Estimasi tinggi baris teks (px) dari profil proyeksi horizontal citra biner. */
  function estimateLineHeight(bin, w, h) {
    var rows = new Uint32Array(h), y, x;
    for (y = 0; y < h; y++) { var c = 0; for (x = 0; x < w; x += 2) if (bin[y * w + x] === 0) c++; rows[y] = c; }
    var max = 0; for (y = 0; y < h; y++) if (rows[y] > max) max = rows[y];
    if (!max) return 0;
    var thr = max * 0.12, runs = [], start = -1;
    for (y = 0; y < h; y++) { if (rows[y] > thr) { if (start < 0) start = y; } else if (start >= 0) { runs.push(y - start); start = -1; } }
    if (!runs.length) return 0;
    runs.sort(function (a, b) { return a - b; });
    return runs[runs.length >> 1];
  }

  /** Median panjang goresan hitam horizontal (px) pada citra biner. */
  function strokeWidth(b, w, h) {
    var hist = new Uint32Array(64), total = 0;
    for (var y = 0; y < h; y += 3) {
      var run = 0;
      for (var x = 0; x <= w; x++) {
        if (x < w && b[y * w + x] === 0) run++;
        else if (run) { if (run < 64) { hist[run]++; total++; } run = 0; }
      }
    }
    if (!total) return 0;
    var acc = 0;
    for (var i = 1; i < 64; i++) { acc += hist[i]; if (acc >= total / 2) return i; }
    return 0;
  }
  /** Penebalan bentuk plus (+) satu piksel pada citra biner (teks = 0), memulihkan goresan tipis akibat fotokopi. */
  function thicken(b, w, h) {
    var out = new Uint8Array(b);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      if (b[y * w + x] !== 0) continue;
      if (x > 0) out[y * w + x - 1] = 0; if (x < w - 1) out[y * w + x + 1] = 0;
      if (y > 0) out[(y - 1) * w + x] = 0; if (y < h - 1) out[(y + 1) * w + x] = 0;
    }
    return out;
  }

  /**
   * Jalur utama. opts:
   *   mode: "gray" (bawaan: normalisasi cahaya + skala + luruskan, keluaran skala abu-abu, paling aman untuk LSTM)
   *         "binary" (untuk fotokopi berbintik: median, Sauvola, hapus bintik, penebalan, luruskan)
   *   targetLine, maxWidth, minWidth, deskew, flatten, sauvolaK
   * Mengembalikan { gray, width, height, info }.
   */
  function prepare(rgba, w, h, opts) {
    opts = opts || {};
    var binaryMode = opts.mode === "binary";
    var o = {
      deskew: opts.deskew !== false, flatten: opts.flatten !== false,
      targetLine: opts.targetLine || 30, maxWidth: opts.maxWidth || 3200, minWidth: opts.minWidth || 1000, sauvolaK: opts.sauvolaK || 0.25
    };
    var info = { mode: binaryMode ? "binary" : "gray", steps: [] };
    var g = toGray(rgba, w, h), cw = w, ch = h;

    var noise = estimateNoise(g, cw, ch); info.noise = Math.round(noise * 10) / 10;
    if (binaryMode) { g = median3(g, cw, ch); info.steps.push("median"); }
    else if (noise > 12) { g = gauss(g, cw, ch, 0.8); info.steps.push("gauss"); }
    if (o.flatten) { g = flatten(g, cw, ch, Math.max(31, (Math.min(cw, ch) / 6) | 0)); info.steps.push("flatten"); }

    var bin0 = sauvola(g, cw, ch, 25, o.sauvolaK);
    var lh = estimateLineHeight(bin0, cw, ch); info.lineHeight = lh;
    var scale = 1;
    if (lh > 0) scale = Math.min(2.5, Math.max(0.5, o.targetLine / lh)); else if (cw < o.minWidth) scale = o.minWidth / cw;
    if (cw * scale > o.maxWidth) scale = o.maxWidth / cw;
    if (Math.abs(scale - 1) > 0.15) {
      var nw = Math.round(cw * scale), nh = Math.round(ch * scale);
      g = resize(g, cw, ch, nw, nh); cw = nw; ch = nh; info.steps.push("scale " + scale.toFixed(2));
      bin0 = sauvola(g, cw, ch, Math.max(15, (o.targetLine * 1.2) | 1), o.sauvolaK);
    }
    info.scale = Math.round(scale * 100) / 100;

    if (o.deskew) {
      var sk = detectSkew(bin0, cw, ch); info.skew = Math.round(sk.angle * 100) / 100;
      if (sk.angle !== 0) { g = rotate(g, cw, ch, sk.angle, 255); bin0 = null; info.steps.push("deskew " + sk.angle.toFixed(1)); }
    }
    var out = g;
    if (binaryMode) {
      var bin = bin0 || sauvola(g, cw, ch, Math.max(15, (o.targetLine * 1.2) | 1), o.sauvolaK);
      var minA = Math.max(6, ((o.targetLine / 8) * (o.targetLine / 8)) | 0);
      info.speckles = despeckle(bin, cw, ch, minA); if (info.speckles) info.steps.push("despeckle " + info.speckles);
      info.stroke = strokeWidth(bin, cw, ch);
      out = info.stroke > 0 && info.stroke < 3 ? thicken(bin, cw, ch) : bin;
      info.steps.push(out === bin ? "sauvola" : "sauvola+thicken");
    }
    return { gray: out, width: cw, height: ch, info: info };
  }

  return { prepare: prepare, toGray: toGray, toRGBA: toRGBA, estimateNoise: estimateNoise, sauvola: sauvola, flatten: flatten, detectSkew: detectSkew, rotate: rotate, resize: resize, median3: median3, gauss: gauss, thicken: thicken, strokeWidth: strokeWidth, despeckle: despeckle, estimateLineHeight: estimateLineHeight };
});
