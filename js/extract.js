/*
 * KSDAS IT Del - Mesin Ekstraksi Dokumen (v1.0)
 *
 * Prinsip (mengacu pada blueprint keamanan dan prompt AI/Document Analytics KSDAS):
 *  1. Isi dokumen adalah DATA, bukan instruksi. Tidak ada eval, tidak ada pemanggilan jaringan.
 *  2. Tidak menebak. Field yang tidak ditemukan di dokumen DIBIARKAN KOSONG dan masuk daftar "isi manual".
 *  3. Setiap nilai membawa tingkat keyakinan, halaman sumber, kutipan sumber, dan metode ekstraksi.
 *  4. Hasil hanya berstatus usulan (NEEDS_REVIEW). Staf wajib memvalidasi sebelum menjadi data resmi.
 *
 * Modul ini berjalan di peramban (GitHub Pages dan EXE) dan di Node.js (untuk uji otomatis).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.KSDASExtract = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var LID = (function () {
    try {
      if (typeof KSDASLangid !== "undefined") return KSDASLangid;
      if (typeof module === "object" && module.exports && typeof require === "function") return require("./ocr/langid.js");
    } catch (e) { /* identifikasi bahasa opsional */ }
    return null;
  })();
  var MAX_FILE_BYTES = 25 * 1024 * 1024;
  var MAX_FILES_PER_BATCH = 100;
  var MAX_PDF_PAGES = 40;
  var MAX_OCR_PAGES = 12;
  var LEVEL = { TINGGI: 0.9, SEDANG: 0.65, RENDAH: 0.4 };

  /* ---------------------------------------------------------------- util */
  function clean(s) {
    return String(s == null ? "" : s)
      .replace(/[\u0000-\u0008\u000B\u000E-\u001F\u007F]/g, " ")
      .replace(/[   ]/g, " ")
      .replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
      .replace(/[ \t]+/g, " ").trim();
  }
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, " ").trim();
  }
  function decodeEntities(s) {
    return s.replace(/&#x([0-9a-f]+);/gi, function (_, h) { return String.fromCodePoint(parseInt(h, 16)); })
      .replace(/&#(\d+);/g, function (_, d) { return String.fromCodePoint(parseInt(d, 10)); })
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  }
  function snippet(s, max) {
    s = clean(s).replace(/\s+/g, " ");
    max = max || 160;
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  }
  /** Buang tanda baca akhir, kecuali titik gelar seperti "M.T." atau "S.Kom." */
  function tailClean(v) {
    v = clean(v).replace(/[;,]+$/, "");
    var last = v.split(/\s+/).pop();
    if (/\.$/.test(v) && last.length > 4 && last.slice(0, -1).indexOf(".") < 0) v = v.slice(0, -1);
    return v;
  }
  function pad2(n) { return String(n).padStart(2, "0"); }
  function iso(y, m, d) { return y + "-" + pad2(m) + "-" + pad2(d); }
  function validYMD(y, m, d) {
    if (y < 1990 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;
    var dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }
  function addToDate(isoDate, years, months) {
    var p = isoDate.split("-").map(Number);
    var dt = new Date(Date.UTC(p[0] + years, p[1] - 1 + months, p[2]));
    dt.setUTCDate(dt.getUTCDate() - 1);
    return iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }
  var SMALL_WORDS = { dan: 1, di: 1, ke: 1, untuk: 1, yang: 1, dengan: 1, dari: 1, pada: 1, atau: 1, serta: 1, dalam: 1, of: 1, and: 1, the: 1, for: 1 };
  var KEEP_UPPER = /^(PT|CV|UD|TBK|PERSERO|BUMN|BUMD|IT|II|III|IV|SMA|SMK|SMP|SD|PKS|MOU|LOI|IA|MOA|DKI|RI|TNI|POLRI|UPT|LPPM|SPM|FITE|FTI|FB|FV|UKS|ITDEL|APBN|APBD|S1|S2|S3|D3|D4|MBKM|PKM|IKU|AMI)$/;
  function smartCase(s) {
    s = clean(s);
    var letters = s.replace(/[^A-Za-z]/g, "");
    if (!letters.length) return s;
    var upper = letters.replace(/[^A-Z]/g, "").length / letters.length;
    if (upper < 0.85) return s;
    return s.toLowerCase().split(/(\s+)/).map(function (w, i) {
      if (/^\s+$/.test(w)) return w;
      var bare = w.replace(/[^a-z]/g, "").toUpperCase();
      if (KEEP_UPPER.test(bare)) return w.toUpperCase();
      if (i > 0 && SMALL_WORDS[w]) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join("");
  }

  /* ---------------------------------------------- angka & tanggal Indonesia */
  var UNIT = {
    nol: 0, satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9,
    // Melayu: tiga/empat/lima sama; "sepuluh" ditangani di bawah. Inggris, Jerman, Prancis, Spanyol, Portugis, Belanda (satu sampai sepuluh)
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    ein: 1, eine: 1, zwei: 2, drei: 3, vier: 4, funf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10,
    un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, sept: 7, huit: 8, neuf: 9, dix: 10,
    uno: 1, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
    um: 1, dois: 2, quatro: 4, sete: 7, oito: 8, nove: 9, dez: 10,
    een: 1, twee: 2, drie: 3, vijf: 5, zes: 6, zeven: 7, negen: 9, tien: 10
  };
  function wordsToInt(text) {
    var toks = norm(text).split(" ").filter(Boolean);
    if (!toks.length) return null;
    var total = 0, cur = 0;
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (t in UNIT) cur += UNIT[t];
      else if (t === "sepuluh") cur += 10;
      else if (t === "sebelas") cur += 11;
      else if (t === "seratus") cur += 100;
      else if (t === "seribu") total += 1000;
      else if (t === "belas") cur = (cur || 1) + 10;
      else if (t === "puluh") cur = (cur || 1) * 10;
      else if (t === "ratus") cur = (cur || 1) * 100;
      else if (t === "ribu") { total += (cur || 1) * 1000; cur = 0; }
      else return null;
    }
    return total + cur;
  }
  var MONTHS = {
    januari: 1, pebruari: 2, februari: 2, maret: 3, april: 4, mei: 5, juni: 6, juli: 7, agustus: 8,
    september: 9, oktober: 10, nopember: 11, november: 11, desember: 12,
    january: 1, february: 2, march: 3, may: 5, june: 6, july: 7, august: 8, october: 10, december: 12,
    mac: 3, jun: 6, julai: 7, ogos: 8, disember: 12,
    januar: 1, "m\u00e4rz": 3, marz: 3, mai: 5, dezember: 12,
    janvier: 1, "f\u00e9vrier": 2, fevrier: 2, mars: 3, avril: 4, juin: 6, juillet: 7, "ao\u00fbt": 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, "d\u00e9cembre": 12, decembre: 12,
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
    janeiro: 1, fevereiro: 2, "mar\u00e7o": 3, marco: 3, maio: 5, junho: 6, julho: 7, setembro: 9, outubro: 10, dezembro: 12,
    maart: 3, augustus: 8
  };
  var MONTH_RE = "(" + Object.keys(MONTHS).sort(function (x, y) { return y.length - x.length; }).join("|") + ")";
  var THAI_MONTHS = ["\u0e21\u0e01\u0e23\u0e32\u0e04\u0e21", "\u0e01\u0e38\u0e21\u0e20\u0e32\u0e1e\u0e31\u0e19\u0e18\u0e4c", "\u0e21\u0e35\u0e19\u0e32\u0e04\u0e21", "\u0e40\u0e21\u0e29\u0e32\u0e22\u0e19", "\u0e1e\u0e24\u0e29\u0e20\u0e32\u0e04\u0e21", "\u0e21\u0e34\u0e16\u0e38\u0e19\u0e32\u0e22\u0e19", "\u0e01\u0e23\u0e01\u0e0e\u0e32\u0e04\u0e21", "\u0e2a\u0e34\u0e07\u0e2b\u0e32\u0e04\u0e21", "\u0e01\u0e31\u0e19\u0e22\u0e32\u0e22\u0e19", "\u0e15\u0e38\u0e25\u0e32\u0e04\u0e21", "\u0e1e\u0e24\u0e28\u0e08\u0e34\u0e01\u0e32\u0e22\u0e19", "\u0e18\u0e31\u0e19\u0e27\u0e32\u0e04\u0e21"];

  /** Seragamkan angka non-ASCII dan penulisan tanggal CJK/Korea/Jepang (Reiwa)/Thai (Buddha) menjadi YYYY-MM-DD. */
  function normalizeText(t) {
    t = t.replace(/[\u0660-\u0669]/g, function (c) { return String(c.charCodeAt(0) - 0x0660); })
      .replace(/[\u06F0-\u06F9]/g, function (c) { return String(c.charCodeAt(0) - 0x06F0); })
      .replace(/[\u0966-\u096F]/g, function (c) { return String(c.charCodeAt(0) - 0x0966); });
    t = t.replace(/(\d{4})\s*[\u5e74\ub144]\s*(\d{1,2})\s*[\u6708\uc6d4]\s*(\d{1,2})\s*[\u65e5\uc77c\u53f7\u865f]?/g, function (m, y, mo, d) { return validYMD(+y, +mo, +d) ? iso(+y, +mo, +d) : m; });
    t = t.replace(/\u4ee4\u548c\s*(\d{1,2}|\u5143)\s*\u5e74\s*(\d{1,2})\s*\u6708\s*(\d{1,2})\s*\u65e5/g, function (m, e, mo, d) { var y = 2018 + (e === "\u5143" ? 1 : +e); return validYMD(y, +mo, +d) ? iso(y, +mo, +d) : m; });
    var thRe = new RegExp("(\\d{1,2})\\s*(" + THAI_MONTHS.join("|") + ")\\s*(\\d{4})", "g");
    t = t.replace(thRe, function (m, d, mo, y) { var yy = +y > 2400 ? +y - 543 : +y, mi = THAI_MONTHS.indexOf(mo) + 1; return validYMD(yy, mi, +d) ? iso(yy, mi, +d) : m; });
    return t;
  }

  /** Cari semua tanggal pada satu baris. Mengembalikan [{iso,index,end,raw,numeric}] */
  function findDates(line) {
    var out = [];
    var re = new RegExp("(?<![A-Za-z\\u00C0-\\u024F])" + MONTH_RE + "(?![A-Za-z\\u00C0-\\u024F])", "gi");
    var m;
    while ((m = re.exec(line))) {
      var month = MONTHS[m[1].toLowerCase()];
      var left = line.slice(Math.max(0, m.index - 70), m.index);
      var right = line.slice(m.index + m[0].length, m.index + m[0].length + 60);
      var day = null, dayStart = m.index;
      var l = left.replace(/\s*(?:bulan|de|del|of|the|op|den|der)\s*$/i, " ").replace(/\s+$/, "");
      var lm = l.match(/(\d{1,2})(?:\.|\u00ba|\u00b0|er|st|nd|rd|th)?(?:\s*\([^)]*\))?$/);
      if (lm) { day = parseInt(lm[1], 10); dayStart = m.index - (left.length - left.lastIndexOf(lm[0])); }
      else {
        var wm = l.replace(/\([^)]*\)\s*$/, "").trim().match(/((?:[a-zA-Z]+\s+){0,2}[a-zA-Z]+)$/);
        if (wm) {
          var parts = wm[1].split(/\s+/);
          for (var k = 0; k < parts.length && day === null; k++) {
            var cand = wordsToInt(parts.slice(k).join(" "));
            if (cand !== null && cand >= 1 && cand <= 31) day = cand;
          }
        }
      }
      var year = null, endIdx = m.index + m[0].length;
      var rm = right.match(/^\s*(?:tahun\s+|de\s+|del\s+|of\s+|,\s*)?(\d{4})\b/i);
      var usFmt = day === null ? right.match(/^\s*(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i) : null;  // "March 5, 2026"
      if (usFmt) { day = parseInt(usFmt[1], 10); year = parseInt(usFmt[2], 10); endIdx += usFmt[0].length; }
      else if (rm) { year = parseInt(rm[1], 10); endIdx += rm[0].length; }
      else {
        var rw = day === null ? null : right.replace(/^\s*(?:tahun\s+)?/i, "").match(/^((?:[a-zA-Z]+\s*){1,6})/);
        if (rw) {
          var rt = rw[1].trim().split(/\s+/);
          for (var n = Math.min(rt.length, 6); n >= 2 && year === null; n--) {
            var yv = wordsToInt(rt.slice(0, n).join(" "));
            if (yv !== null && yv >= 1990 && yv <= 2100) { year = yv; endIdx += right.length - right.replace(/^\s*(?:tahun\s+)?/i, "").length; endIdx += rt.slice(0, n).join(" ").length + 1; }
          }
        }
      }
      if (day !== null && year !== null && validYMD(year, month, day)) {
        out.push({ iso: iso(year, month, day), index: dayStart, end: endIdx, raw: line.slice(dayStart, endIdx), numeric: false });
      }
    }
    var covered = out.slice();
    function isCovered(i) {
      for (var c = 0; c < covered.length; c++) if (i >= covered[c].index - 2 && i <= covered[c].end + 14) return true;
      return false;
    }
    var nre = /(?<![\d.\/-])(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})(?![\d])|(?<![\d.\/-])(\d{4})-(\d{2})-(\d{2})(?![\d])/g;
    while ((m = nre.exec(line))) {
      var y, mo, d, ambiguous = false;
      if (m[4]) { y = +m[4]; mo = +m[5]; d = +m[6]; }
      else { d = +m[1]; mo = +m[2]; y = +m[3]; ambiguous = d <= 12 && mo <= 12 && d !== mo; }
      if (!validYMD(y, mo, d) || isCovered(m.index)) continue;
      out.push({ iso: iso(y, mo, d), index: m.index, end: m.index + m[0].length, raw: m[0], numeric: true, ambiguous: ambiguous });
    }
    out.sort(function (a, b) { return a.index - b.index; });
    return out;
  }

  /* --------------------------------------------------------- master data */
  var PROGRAM_DEFS = [
    { id: "TRPL", faculty: "FV", re: "Teknologi\\s+Rekayasa\\s+Perangkat\\s+Lunak|(?<![\\/\\w-])TRPL(?![\\/\\w-])", degree: "D4" },
    { id: "D3TI", faculty: "FV", re: "Teknologi\\s+Informasi(?!\\s+dan)|\\bD3\\s*TI\\b", degree: "D3" },
    { id: "D3TK", faculty: "FV", re: "Teknologi\\s+Komputer|\\bD3\\s*TK\\b", degree: "D3" },
    { id: "SI", faculty: "FITE", re: "Sistem\\s+Informasi", degree: "S1" },
    { id: "TE", faculty: "FITE", re: "Teknik\\s+Elektro", degree: "S1" },
    { id: "IF", faculty: "FITE", re: "Informatika(?!\\s+dan\\s+Teknik)", degree: "S1" },
    { id: "MR", faculty: "FTI", re: "Manajemen\\s+Rekayasa", degree: "S1" },
    { id: "TM", faculty: "FTI", re: "Teknik\\s+Metalurgi|Metalurgi", degree: "S1" },
    { id: "BP", faculty: "FB", re: "Teknik\\s+Bioproses|Bioproses", degree: "S1" }
  ];
  var FACULTY_DEFS = [
    { id: "FITE", re: "Fakultas\\s+Informatika\\s+dan\\s+Teknik\\s+Elektro|(?<![\\/\\w-])FITE(?![\\/\\w-])" },
    { id: "FTI", re: "Fakultas\\s+Teknologi\\s+Industri|(?<![\\/\\w-])FTI(?![\\/\\w-])" },
    { id: "FB", re: "Fakultas\\s+Bioteknologi" },
    { id: "FV", re: "Fakultas\\s+Vokasi" }
  ];
  var JABATAN_KW = "(?:Vice\\s+Chancellor|Chancellor|Managing\\s+Director|Mayor|Governor|Minister|Registrar|Naib\\s+Canselor|Pengarah|Timbalan|Presiden|Direktor|Pr\\u00e4sident|Pr\\u00e9sident|Directeur|Doyen|Recteur|Decano|Presidente|Prof(?:essor)?|Wakil\\s+Rektor|Rektor|Wakil\\s+Dekan|Dekan|Wakil\\s+Bupati|Bupati|Wakil\\s+Wali\\s*kota|Wali\\s*kota|Walikota|Gubernur|Wakil\\s+Gubernur|Direktur|Wakil\\s+Direktur|Kepala|Ketua|Wakil\\s+Ketua|Sekretaris|Bendahara|Presiden|Wakil\\s+Presiden|Manajer|Manager|General\\s+Manager|Pimpinan|Camat|Lurah|Pjs\\.?|Plt\\.?|Pelaksana|Komisaris|Kuasa|Rector|Dean|Director|President|Chairman|Head|CEO|Vice)";
  var COUNTRIES = ["Malaysia", "Singapura", "Singapore", "Jepang", "Japan", "Korea Selatan", "Korea", "Thailand", "Filipina", "Vietnam", "Australia", "Jerman", "Germany", "Belanda", "Netherlands", "Taiwan", "Tiongkok", "China", "India", "Amerika Serikat", "United States", "Inggris", "United Kingdom", "Prancis", "France", "Brunei Darussalam", "Brunei", "Arab Saudi", "Turki"];

  function guessPartnerType(name) {
    var n = " " + norm(name) + " ";
    if (/ (pemerintah|pemkab|pemko|pemprov|kabupaten|kota|provinsi|dinas|kementerian|badan|kantor|sekretariat|dewan|polres|kodim|bappeda|desa|nagori) /.test(n)) return "PEMERINTAH";
    if (/ (universitas|institut|politeknik|sekolah tinggi|stmik|stikes|akademi|university|college|institute) /.test(n)) return "PERGURUAN_TINGGI";
    if (/ (sma|smk|smp|sd|sman|smkn|smpn|madrasah|sekolah|yayasan pendidikan) /.test(n)) return "SEKOLAH";
    if (/ (persero|bumn|perum|bank|pln|pertamina|telkom|inalum) /.test(n)) return "BUMN";
    if (/ (pt|cv|ud|tbk|perseroan|koperasi|co|ltd|inc|corp|company|sdn bhd) /.test(n)) return "SWASTA";
    return "LAINNYA";
  }
  function legalCore(name) {
    return norm(name).replace(/\b(pt|cv|ud|tbk|persero|perum|pemerintah|yayasan)\b/g, " ").replace(/\s+/g, " ").trim();
  }
  function jaccard(a, b) {
    var A = a.split(" ").filter(Boolean), B = b.split(" ").filter(Boolean);
    if (!A.length || !B.length) return 0;
    var inter = A.filter(function (x) { return B.indexOf(x) >= 0; }).length;
    return inter / (A.length + B.length - inter);
  }

  /* ----------------------------------------------------- deteksi berkas */
  function startsWith(bytes, sig) {
    for (var i = 0; i < sig.length; i++) if (bytes[i] !== sig[i]) return false;
    return true;
  }
  /** Validasi ekstensi + magic bytes. Mengembalikan {kind, error}. */
  function detectKind(name, bytes, size) {
    var ext = (String(name).match(/\.([A-Za-z0-9]+)$/) || [])[1];
    ext = ext ? ext.toLowerCase() : "";
    if (size > MAX_FILE_BYTES) return { error: "Ukuran berkas melebihi " + Math.round(MAX_FILE_BYTES / 1048576) + " MB." };
    var isZip = startsWith(bytes, [0x50, 0x4B, 0x03, 0x04]);
    var isOle = startsWith(bytes, [0xD0, 0xCF, 0x11, 0xE0]);
    var isPdf = startsWith(bytes, [0x25, 0x50, 0x44, 0x46]);
    var isPng = startsWith(bytes, [0x89, 0x50, 0x4E, 0x47]);
    var isJpg = startsWith(bytes, [0xFF, 0xD8, 0xFF]);
    var isBmp = startsWith(bytes, [0x42, 0x4D]);
    var isWebp = startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && bytes[8] === 0x57 && bytes[9] === 0x45;
    var map = {
      pdf: [isPdf, "pdf"], docx: [isZip, "docx"], xlsx: [isZip, "xlsx"], xlsm: [isZip, "xlsx"],
      doc: [isOle, "doc"], xls: [isOle, "xls"], png: [isPng, "image"], jpg: [isJpg, "image"], jpeg: [isJpg, "image"],
      bmp: [isBmp, "image"], webp: [isWebp, "image"]
    };
    if (ext in map) {
      if (!map[ext][0]) return { error: "Isi berkas tidak sesuai ekstensi ." + ext + " (magic bytes tidak cocok). Berkas ditolak." };
      return { kind: map[ext][1], ext: ext };
    }
    if (ext === "txt" || ext === "csv" || ext === "tsv" || ext === "md") {
      for (var i = 0; i < Math.min(bytes.length, 4000); i++) if (bytes[i] === 0) return { error: "Berkas teks mengandung data biner. Berkas ditolak." };
      return { kind: ext === "txt" || ext === "md" ? "text" : "csv", ext: ext };
    }
    return { error: "Jenis berkas ." + (ext || "?") + " tidak didukung. Gunakan PDF, DOCX, XLSX, CSV, TXT, atau gambar scan." };
  }

  /* ---------------------------------------------------------- pembaca DOCX */
  function wxmlToText(xml) {
    xml = xml.replace(/<w:tr[ >][\s\S]*?<\/w:tr>/g, function (tr) {
      var cells = [];
      tr.replace(/<w:tc[ >][\s\S]*?<\/w:tc>/g, function (tc) {
        cells.push(tc.replace(/<\/w:p>/g, " ").replace(/<w:tab\/>/g, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
        return "";
      });
      return "<w:p><w:r><w:t>" + cells.join("\t").replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/gi, "&amp;") + "</w:t></w:r></w:p>";
    });
    xml = xml.replace(/<w:br[^>]*w:type="page"[^>]*\/>|<w:lastRenderedPageBreak\/>/g, "\f")
      .replace(/<w:tab\/>/g, "\t").replace(/<w:br\/>|<w:cr\/>/g, "\n")
      .replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, "");
    return decodeEntities(xml);
  }
  function readDocx(zip) {
    var names = Object.keys(zip.files);
    var jobs = [];
    var head = names.filter(function (n) { return /^word\/header\d*\.xml$/i.test(n); });
    var foot = names.filter(function (n) { return /^word\/footer\d*\.xml$/i.test(n); });
    var main = names.filter(function (n) { return /^word\/document\.xml$/i.test(n); })[0];
    if (!main) return Promise.reject(new Error("Struktur DOCX tidak valid (word/document.xml tidak ada)."));
    function get(n) { return zip.files[n].async("string"); }
    return Promise.all([Promise.all(head.map(get)), get(main), Promise.all(foot.map(get))]).then(function (r) {
      var headerText = r[0].map(wxmlToText).join("\n");
      var body = wxmlToText(r[1]);
      var footerText = r[2].map(wxmlToText).join("\n");
      var pages = body.split("\f").map(function (p) { return p.replace(/\n{3,}/g, "\n\n"); });
      if (headerText.trim()) pages[0] = headerText + "\n" + pages[0];
      if (footerText.trim()) pages[pages.length - 1] += "\n" + footerText;
      return pages.filter(function (p, i) { return p.trim() || i === 0; }).map(function (t, i) { return { n: i + 1, text: t, method: "DOCX_XML" }; });
    });
  }

  /* ---------------------------------------------------------- pembaca XLSX */
  var BUILTIN_DATE_FMT = { 14: 1, 15: 1, 16: 1, 17: 1, 18: 1, 19: 1, 20: 1, 21: 1, 22: 1, 45: 1, 46: 1, 47: 1 };
  function colIndex(ref) {
    var l = ref.replace(/[0-9]/g, ""), n = 0;
    for (var i = 0; i < l.length; i++) n = n * 26 + (l.charCodeAt(i) - 64);
    return n - 1;
  }
  function serialToIso(v) {
    var ms = Math.round((v - 25569) * 86400 * 1000);
    var d = new Date(ms);
    return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  function readXlsx(zip) {
    function get(n) { var f = zip.file(n); return f ? f.async("string") : Promise.resolve(""); }
    return Promise.all([get("xl/workbook.xml"), get("xl/_rels/workbook.xml.rels"), get("xl/sharedStrings.xml"), get("xl/styles.xml")]).then(function (r) {
      var wb = r[0], rels = r[1], sst = r[2], styles = r[3];
      var strings = [];
      (sst.match(/<si>[\s\S]*?<\/si>/g) || []).forEach(function (si) {
        strings.push(decodeEntities((si.match(/<t[^>]*>[\s\S]*?<\/t>/g) || []).map(function (t) { return t.replace(/<[^>]+>/g, ""); }).join("")));
      });
      var customDate = {};
      (styles.match(/<numFmt [^>]*>/g) || []).forEach(function (nf) {
        var id = (nf.match(/numFmtId="(\d+)"/) || [])[1], code = (nf.match(/formatCode="([^"]*)"/) || [])[1] || "";
        if (id && /[dmy]/i.test(code.replace(/\[[^\]]*\]|"[^"]*"/g, ""))) customDate[id] = 1;
      });
      var xfIsDate = [];
      var cellXfs = (styles.match(/<cellXfs[\s\S]*?<\/cellXfs>/) || [""])[0];
      (cellXfs.match(/<xf [^>]*>/g) || []).forEach(function (xf) {
        var id = (xf.match(/numFmtId="(\d+)"/) || [])[1];
        xfIsDate.push(!!(id && (BUILTIN_DATE_FMT[id] || customDate[id])));
      });
      var relMap = {};
      (rels.match(/<Relationship [^>]*>/g) || []).forEach(function (x) {
        var id = (x.match(/Id="([^"]+)"/) || [])[1], t = (x.match(/Target="([^"]+)"/) || [])[1];
        if (id && t) relMap[id] = t.replace(/^\//, "").replace(/^(?!xl\/)/, "xl/");
      });
      var sheets = [];
      (wb.match(/<sheet [^>]*>/g) || []).forEach(function (s) {
        var name = decodeEntities((s.match(/name="([^"]*)"/) || [])[1] || "Sheet");
        var rid = (s.match(/r:id="([^"]+)"/) || [])[1];
        if (rid && relMap[rid]) sheets.push({ name: name, path: relMap[rid] });
      });
      return Promise.all(sheets.map(function (sh) {
        return get(sh.path).then(function (xml) {
          var rows = [];
          (xml.match(/<row[ >][\s\S]*?<\/row>/g) || []).forEach(function (rowXml) {
            var row = [];
            (rowXml.match(/<c [^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || []).forEach(function (c) {
              var ref = (c.match(/\br="([A-Z]+\d+)"/) || [])[1];
              if (!ref) return;
              var t = (c.match(/\bt="([^"]+)"/) || [])[1];
              var s = parseInt((c.match(/\bs="(\d+)"/) || [])[1] || "-1", 10);
              var v = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
              var val = "";
              if (t === "s" && v !== undefined) val = strings[parseInt(v, 10)] || "";
              else if (t === "inlineStr") val = decodeEntities((c.match(/<t[^>]*>([\s\S]*?)<\/t>/) || [])[1] || "");
              else if (v !== undefined) {
                val = decodeEntities(v);
                if (!t || t === "n") {
                  var num = parseFloat(val);
                  if (!isNaN(num) && s >= 0 && xfIsDate[s] && num > 20000 && num < 80000) val = serialToIso(num);
                }
              }
              row[colIndex(ref)] = clean(val);
            });
            for (var i = 0; i < row.length; i++) if (row[i] === undefined) row[i] = "";
            if (row.some(function (x) { return x !== ""; })) rows.push(row);
          });
          return { name: sh.name, rows: rows };
        });
      }));
    });
  }

  /* -------------------------------------------------------- pembaca .doc */
  function readLegacyDoc(bytes) {
    var runs = [], cur = "";
    for (var i = 0; i + 1 < bytes.length; i += 2) {
      var c = bytes[i] | (bytes[i + 1] << 8);
      if ((c >= 32 && c < 127) || (c >= 160 && c < 592) || c === 10 || c === 13) cur += c === 13 ? "\n" : String.fromCharCode(c);
      else { if (cur.replace(/\s/g, "").length >= 6) runs.push(cur); cur = ""; }
    }
    if (cur.replace(/\s/g, "").length >= 6) runs.push(cur);
    return runs.join("\n");
  }

  /* ----------------------------------------------------------- pembaca PDF */
  function readPdf(buffer, env, onProgress) {
    var pdfjs = env.pdfjsLib;
    if (!pdfjs) return Promise.reject(new Error("PDF.js tidak tersedia."));
    if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) pdfjs.GlobalWorkerOptions.workerSrc = (env.basePath || "") + "js/pdf.worker.min.js";
    return pdfjs.getDocument({ data: new Uint8Array(buffer.slice ? buffer.slice(0) : buffer), isEvalSupported: false }).promise.then(function (pdf) {
      var total = Math.min(pdf.numPages, MAX_PDF_PAGES);
      var pages = [], ocrBudget = MAX_OCR_PAGES;
      var chain = Promise.resolve();
      for (var i = 1; i <= total; i++) (function (num) {
        chain = chain.then(function () {
          if (onProgress) onProgress("Membaca halaman PDF " + num + " dari " + total, 15 + Math.round(num / total * 45));
          return pdf.getPage(num).then(function (page) {
            return page.getTextContent().then(function (tc) {
              var lines = [], line = "", lastY = null, lastX2 = null;
              tc.items.forEach(function (it) {
                var y = it.transform ? Math.round(it.transform[5]) : 0, x = it.transform ? it.transform[4] : 0;
                if (lastY !== null && Math.abs(y - lastY) > 4) { if (line.trim()) lines.push(line.trim()); line = ""; lastX2 = null; }
                if (line && lastX2 !== null && x - lastX2 > 1.5 && !/\s$/.test(line) && !/^\s/.test(it.str)) line += " ";
                line += it.str;
                lastX2 = x + (it.width || 0);
                lastY = y;
                if (it.hasEOL) { if (line.trim()) lines.push(line.trim()); line = ""; lastX2 = null; lastY = null; }
              });
              if (line.trim()) lines.push(line.trim());
              var text = lines.join("\n");
              if (text.replace(/\s/g, "").length >= 25 || !env.ocr || ocrBudget <= 0) return pages.push({ n: num, text: text, method: "PDF_TEXT" });
              ocrBudget--;
              var viewport = page.getViewport({ scale: 2.2 });
              var canvas = env.document.createElement("canvas");
              canvas.width = viewport.width; canvas.height = viewport.height;
              return page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport }).promise.then(function () {
                return env.ocr(canvas, "Halaman " + num + " (pindaian)", onProgress);
              }).then(function (res) {
                pages.push({ n: num, text: res.text, method: "OCR", ocrConf: res.confidence, lang: res.language, pack: res.pack });
              });
            });
          });
        });
      })(i);
      return chain.then(function () { return pages; });
    });
  }

  /* ----------------------------------------------- pintu masuk pembacaan */
  /**
   * Membaca satu berkas menjadi { kind, pages:[{n,text,method,ocrConf?}], sheets?, warnings[] }.
   * env: { JSZip, pdfjsLib, ocr(imageOrCanvas, label, onProgress)->{text,confidence}, document, basePath }
   */
  function readFile(file, env, onProgress) {
    var warnings = [];
    return file.arrayBuffer().then(function (buffer) {
      var bytes = new Uint8Array(buffer);
      var det = detectKind(file.name, bytes, file.size != null ? file.size : bytes.length);
      if (det.error) return Promise.reject(new Error(det.error));
      var kind = det.kind;
      if (onProgress) onProgress("Membaca " + file.name, 10);
      if (kind === "docx") {
        return env.JSZip.loadAsync(buffer).then(function (zip) {
          if (!zip.file("word/document.xml")) throw new Error("Berkas bukan DOCX yang valid.");
          return readDocx(zip);
        }).then(function (pages) { return { kind: kind, pages: pages, warnings: warnings }; });
      }
      if (kind === "xlsx") {
        return env.JSZip.loadAsync(buffer).then(function (zip) {
          if (!zip.file("xl/workbook.xml")) throw new Error("Berkas bukan XLSX yang valid.");
          return readXlsx(zip);
        }).then(function (sheets) { return { kind: kind, sheets: sheets, pages: sheetsToPages(sheets), warnings: warnings }; });
      }
      if (kind === "pdf") {
        return readPdf(buffer, env, onProgress).then(function (pages) {
          if (!pages.some(function (p) { return p.text.replace(/\s/g, "").length > 10; }))
            warnings.push("PDF tidak berisi teks yang dapat dibaca" + (env.ocr ? " meskipun sudah dipindai OCR." : ". OCR tidak tersedia."));
          var ocrPages = pages.filter(function (p) { return p.method === "OCR"; });
          var ocrInfo = ocrPages.length ? { pack: ocrPages[0].pack, confidence: ocrPages.reduce(function (a, p) { return a + (p.ocrConf || 0); }, 0) / ocrPages.length } : null;
          return { kind: kind, pages: pages, ocr: ocrInfo, warnings: warnings };
        });
      }
      if (kind === "image") {
        if (!env.ocr) return Promise.reject(new Error("OCR tidak tersedia pada lingkungan ini."));
        return env.ocr(file, file.name, onProgress).then(function (res) {
          return { kind: kind, pages: [{ n: 1, text: res.text, method: "OCR", ocrConf: res.confidence, lang: res.language, pack: res.pack }], ocr: { pack: res.pack, confidence: res.confidence }, warnings: warnings };
        });
      }
      if (kind === "doc" || kind === "xls") {
        warnings.push("Format ." + det.ext + " lama dibaca secara terbatas. Simpan ulang sebagai ." + det.ext + "x agar akurat.");
        return { kind: kind, pages: [{ n: 1, text: readLegacyDoc(bytes), method: "LEGACY_OLE", legacy: true }], warnings: warnings };
      }
      var text = new TextDecoder("utf-8").decode(bytes).replace(/^﻿/, "");
      if (kind === "csv") {
        var sheets2 = [{ name: file.name, rows: parseCsv(text) }];
        return { kind: kind, sheets: sheets2, pages: sheetsToPages(sheets2), warnings: warnings };
      }
      return { kind: kind, pages: [{ n: 1, text: text, method: "TEXT" }], warnings: warnings };
    });
  }
  function parseCsv(text) {
    var src = text.replace(/\r\n?/g, "\n");
    var first = src.split("\n")[0] || "";
    var delim = (first.match(/\t/g) || []).length > (first.match(/;/g) || []).length && (first.match(/\t/g) || []).length >= (first.match(/,/g) || []).length ? "\t"
      : (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ";" : ",";
    var rows = [], row = [], cell = "", q = false;
    for (var i = 0; i < src.length; i++) {
      var c = src[i];
      if (q) { if (c === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === delim) { row.push(clean(cell)); cell = ""; }
      else if (c === "\n") { row.push(clean(cell)); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell.length || row.length) { row.push(clean(cell)); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return x !== ""; }); });
  }
  function sheetsToPages(sheets) {
    return sheets.map(function (sh, i) {
      return { n: i + 1, sheet: sh.name, method: "SPREADSHEET", text: sh.rows.map(function (r) {
        return r.length === 2 && r[0] && r[1] ? r[0] + ": " + r[1] : r.join("\t");
      }).join("\n") };
    });
  }

  /* ---------------------------------------------------- registri Excel/CSV */
  var HEADER_ALIASES = {
    "nomor": "documentNumber", "no dokumen": "documentNumber", "nomor dokumen": "documentNumber", "nomor naskah": "documentNumber",
    "jenis": "documentType", "jenis naskah": "documentType", "jenis dokumen": "documentType", "tipe dokumen": "documentType",
    "judul": "title", "judul naskah": "title", "mitra": "partnerName", "nama mitra": "partnerName",
    "jenis mitra": "partnerType", "negara": "country", "kota": "city",
    "tanggal tandatangan": "signedDate", "tanggal tanda tangan": "signedDate", "ditandatangani": "signedDate",
    "tanggal mulai": "startDate", "mulai berlaku": "startDate", "tanggal berakhir": "endDate", "akhir berlaku": "endDate",
    "status": "status", "ruang lingkup": "scope", "lingkup": "scope", "fakultas": "faculty", "program studi": "program", "prodi": "program",
    "unit": "unit", "tri dharma": "tri", "tridharma": "tri", "kegiatan": "activityName", "nama kegiatan": "activityName",
    "pic": "pic", "penanggung jawab": "pic", "penandatangan mitra": "partnerSignatory", "jabatan mitra": "partnerSignatoryTitle",
    "penandatangan it del": "itdelSignatory", "jabatan it del": "itdelSignatoryTitle", "induk": "parentNumber", "nomor induk": "parentNumber",
    "lokasi": "location", "anggaran": "budget", "sumber dana": "fundingSource", "catatan": "notes", "berkas": "fileName", "nama berkas": "fileName"
  };
  /** Mengembalikan {rows:[{values,line,sheet}]} bila ada sheet berbentuk tabel registri (>=3 judul kolom dikenali). */
  function detectRegistry(sheets) {
    var out = [];
    (sheets || []).forEach(function (sh) {
      if (!sh.rows.length) return;
      var keys = sh.rows[0].map(function (h) { return HEADER_ALIASES[norm(h)] || ""; });
      if (keys.filter(Boolean).length < 3 || sh.rows.length < 2) return;
      for (var r = 1; r < sh.rows.length; r++) {
        var values = {};
        sh.rows[r].forEach(function (cell, i) { if (keys[i] && cell) values[keys[i]] = cell; });
        if (Object.keys(values).length) out.push({ values: values, line: r + 1, sheet: sh.name });
      }
    });
    return out.length ? out : null;
  }

  /* ============================================================ kecerdasan lanjutan */
  function lev(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i;
      for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1));
      var t = prev; prev = cur; cur = t;
    }
    return prev[b.length];
  }
  function strSim(a, b) { var m = Math.max(a.length, b.length); return m ? 1 - lev(a, b) / m : 1; }
  var ABBR = {
    pemkab: "pemerintah kabupaten", pemko: "pemerintah kota", pemkot: "pemerintah kota", pemprov: "pemerintah provinsi",
    univ: "universitas", poltek: "politeknik", inst: "institut", dinkes: "dinas kesehatan", disdik: "dinas pendidikan",
    kemenag: "kementerian agama", smkn: "smk negeri", sman: "sma negeri", smpn: "smp negeri", kab: "kabupaten", prov: "provinsi"
  };
  /** Kunci nama mitra: singkatan diperluas, bentuk badan hukum dibuang. */
  function pkey(name) {
    return norm(name).split(" ").map(function (w) { return ABBR[w] || w; }).join(" ")
      .replace(/\b(pt|cv|ud|tbk|persero|perum|yayasan)\b/g, " ").replace(/\s+/g, " ").trim();
  }
  function partnerSim(a, b) {
    var ka = pkey(a), kb = pkey(b);
    if (!ka || !kb) return 0;
    if (ka === kb) return 1;
    return Math.max(jaccard(ka, kb), strSim(ka, kb));
  }

  /** Perbaikan galat OCR yang umum pada angka, tanggal, dan nama bulan. Hanya untuk halaman hasil OCR. */
  var MONTH_NAMES = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
  function repairOcrLine(t) {
    var out = t;
    out = out.replace(/\b[lI1]TDe[lI1]\b/g, "ITDel").replace(/\bN[0O]m[0o]r\b/g, "Nomor");
    out = out.replace(/[0-9A-Za-z\/.\-|]{4,}/g, function (tok) {
      return tok.split("/").map(function (seg) {
        if (!/^[0-9OoIl|SB.\-]+$/.test(seg) || (seg.match(/\d/g) || []).length < 2) return seg;
        return seg.replace(/(?<=[\d.\-])[Oo](?=[\d.\-]|$)|^[Oo](?=\d)/g, "0").replace(/(?<=[\d.\-])[Il|](?=[\d.\-]|$)|^[Il|](?=\d)/g, "1").replace(/(?<=\d)S(?=\d)/g, "5").replace(/(?<=\d)B(?=\d)/g, "8");
      }).join("/");
    });
    var digitFix = function (x) { return x.replace(/[Oo]/g, "0").replace(/[Il|]/g, "1"); };
    out = out.replace(/\b([0-9OoIl]{1,2})\s+([A-Za-z]{4,9})\s+([0-9OoIl]{4})\b/g, function (m, d, w, y) {
      var lw = w.toLowerCase(), month = null;
      if (MONTH_NAMES.indexOf(lw) >= 0) month = w;
      else for (var i = 0; i < MONTH_NAMES.length && !month; i++) if (lw[0] === MONTH_NAMES[i][0] && lev(lw, MONTH_NAMES[i]) <= 1) month = MONTH_NAMES[i].charAt(0).toUpperCase() + MONTH_NAMES[i].slice(1);
      return month ? digitFix(d) + " " + month + " " + digitFix(y) : m;
    });
    return out;
  }

  /** Profil kata kunci topik per program studi, hanya untuk SARAN (tidak mengisi otomatis). */
  var TOPICS = {
    TRPL: ["rekayasa perangkat lunak", "aplikasi", "pemrograman", "software", "pengembangan sistem", "web", "mobile", "devops"],
    IF: ["informatika", "kecerdasan buatan", "machine learning", "data science", "algoritma", "keamanan siber", "komputasi"],
    SI: ["sistem informasi", "erp", "basis data", "bisnis digital", "tata kelola", "analisis bisnis", "enterprise"],
    TE: ["elektro", "elektronika", "listrik", "iot", "embedded", "telekomunikasi", "sensor", "energi"],
    D3TK: ["jaringan komputer", "perangkat keras", "hardware", "infrastruktur jaringan"],
    D3TI: ["teknologi informasi", "administrasi sistem", "help desk"],
    MR: ["manajemen rekayasa", "rantai pasok", "logistik", "manufaktur", "industri", "optimasi", "produksi"],
    TM: ["metalurgi", "logam", "material", "smelter", "pengecoran", "korosi"],
    BP: ["bioproses", "bioteknologi", "fermentasi", "pangan", "mikroba", "enzim", "hayati"]
  };
  function topicSuggest(text) {
    var t = " " + norm(text) + " ", out = [];
    Object.keys(TOPICS).forEach(function (id) {
      var hits = TOPICS[id].filter(function (kw) { return t.indexOf(" " + kw + " ") >= 0; });
      if (hits.length) out.push({ id: id, score: hits.reduce(function (a, kw) { return a + (kw.indexOf(" ") > 0 ? 2 : 1); }, 0), hits: hits });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out;
  }

  var TYPE_NAME = { MOU_LOI: "MoU/LOI", PKS_MOA: "PKS/MoA", IA: "IA", PROPOSAL: "Proposal", LAPORAN: "Laporan" };
  var PARENT_TYPE = { PKS_MOA: "MOU_LOI", IA: "PKS_MOA", PROPOSAL: "IA", LAPORAN: "PROPOSAL" };
  function tokenSet(s) { return norm(s).split(" ").filter(function (w) { return w.length > 3; }); }

  /** Peringkat kandidat induk berdasarkan rujukan nomor, mitra, kemiripan judul, dan rentang tanggal. */
  function rankParents(doc, docs, refs) {
    var want = PARENT_TYPE[doc.documentType];
    if (!want) return [];
    var res = [];
    docs.forEach(function (c) {
      if (c.id === doc.id || c.documentType !== want) return;
      var score = 0, why = [];
      if (refs && refs.some(function (r) { return norm(r) === norm(c.documentNumber); })) { score += 1; why.push("dokumen merujuk nomor " + c.documentNumber); }
      if (doc.partnerId && c.partnerId === doc.partnerId) { score += 0.4; why.push("mitra sama"); }
      var a = tokenSet(doc.title || ""), b = tokenSet(c.title || "");
      if (a.length && b.length) {
        var inter = a.filter(function (w) { return b.indexOf(w) >= 0; }).length, jac = inter / (a.length + b.length - inter);
        if (jac >= 0.2) { score += Math.min(0.3, jac * 0.5); why.push("judul mirip (" + Math.round(jac * 100) + "%)"); }
      }
      if (doc.startDate && c.startDate && c.endDate && doc.startDate >= c.startDate && doc.startDate <= c.endDate) { score += 0.2; why.push("dalam masa berlaku induk"); }
      else if (doc.startDate && c.endDate && doc.startDate > c.endDate) { score -= 0.3; why.push("induk sudah berakhir saat dokumen ini dimulai"); }
      if (doc.facultyId && c.facultyId === doc.facultyId) { score += 0.1; why.push("fakultas sama"); }
      if (score > 0.25) res.push({ id: c.id, number: c.documentNumber, score: Math.round(score * 100) / 100, why: why });
    });
    res.sort(function (a, b) { return b.score - a.score; });
    return res.slice(0, 3).map(function (r, i, arr) {
      var explicit = r.score >= 1;
      var clear = r.score >= 0.7 && (arr.length === 1 || r.score - arr[1].score >= 0.25);
      r.level = explicit ? "TINGGI" : clear ? "SEDANG" : "RENDAH";
      r.reason = r.why.join(", ") + ".";
      return r;
    });
  }

  function fmtIso(d) {
    if (!d) return "";
    var m = d.split("-");
    var names = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return +m[2] + " " + names[+m[1]] + " " + m[0];
  }
  function summarize(f) {
    var type = f.documentType ? TYPE_NAME[f.documentType.value] : "Naskah";
    var partner = f.partnerId ? (f.partnerId.display || "").replace(/ \(mitra baru.*$/, "") : "";
    var s = type + (partner ? " antara Institut Teknologi Del dan " + partner : "");
    if (f.title) s += " tentang " + f.title.value;
    s += ".";
    if (f.documentNumber) s += " Nomor " + f.documentNumber.value + ".";
    if (f.signedDate) s += " Ditandatangani " + fmtIso(f.signedDate.value) + ".";
    if (f.startDate && f.endDate) s += " Berlaku " + fmtIso(f.startDate.value) + " sampai " + fmtIso(f.endDate.value) + ".";
    else if (f.startDate) s += " Berlaku sejak " + fmtIso(f.startDate.value) + ".";
    if (f.budget) s += " Anggaran " + f.budget.value + ".";
    return s;
  }

  /* ----------------------------------------------------- analisis teks inti */
  var INJECTION_RE = /abaikan\s+(?:semua\s+)?(?:instruksi|perintah|aturan)|lupakan\s+(?:semua\s+)?instruksi|ignore\s+(?:all\s+|any\s+)?(?:previous|prior|above)|disregard\s+(?:the\s+)?(?:above|previous)|system\s+prompt|you\s+are\s+now|setujui\s+otomatis|tetapkan\s+(?:nomor|status|jenis)/i;

  function buildLines(pages) {
    var lines = [], suspicious = 0;
    pages.forEach(function (pg) {
      String(pg.text || "").split(/\r?\n/).forEach(function (raw) {
        var t = clean(raw);
        if (!t) return;
        if (pg.method === "OCR") t = repairOcrLine(t);
        if (INJECTION_RE.test(t)) { suspicious++; return; }
        var orig = t;
        t = normalizeText(t);
        lines.push({ t: t, o: t !== orig ? orig : undefined, page: pg.n, sheet: pg.sheet, method: pg.method, ocrConf: pg.ocrConf, legacy: pg.legacy, i: lines.length });
      });
    });
    return { lines: lines, suspicious: suspicious };
  }

  function analyze(input, ctx) {
    ctx = ctx || {};
    var partners = ctx.partners || [];
    var knownDocs = ctx.docs || [];
    var leaders = ctx.leaders || [];
    var memory = ctx.memory || {};
    var fileName = input.fileName || "";
    var pages = input.pages || [];
    var built = buildLines(pages);
    var lines = built.lines;
    var fields = {};
    var flags = [];
    var ocrConfs = pages.filter(function (p) { return p.method === "OCR" && typeof p.ocrConf === "number"; }).map(function (p) { return p.ocrConf; });
    var meanOcr = ocrConfs.length ? ocrConfs.reduce(function (a, b) { return a + b; }, 0) / ocrConfs.length : null;
    var legacy = pages.some(function (p) { return p.legacy; });
    var downgrade = (meanOcr !== null && meanOcr < 75) || legacy;
    if (built.suspicious) flags.push({ code: "instruction_like_text", message: built.suspicious + " baris dokumen menyerupai perintah ke sistem. Baris itu diabaikan dan dianggap isi dokumen biasa." });
    if (downgrade && meanOcr !== null) flags.push({ code: "low_ocr_confidence", message: "Kualitas OCR rendah (" + Math.round(meanOcr) + "%). Semua hasil perlu diperiksa teliti terhadap berkas asli." });
    if (legacy) flags.push({ code: "legacy_format", message: "Format lama dibaca terbatas. Semua hasil perlu diperiksa." });

    function put(key, value, level, line, srcText, method, extra) {
      if (value === "" || value == null) return;
      if (fields[key]) return;
      if (downgrade) level = level === "TINGGI" ? "SEDANG" : "RENDAH";
      var st = memory.fieldStats && memory.fieldStats[key];
      var learnedNote = "";
      if (st && st.n >= 3 && st.corrected / st.n >= 0.5 && level === "TINGGI") { level = "SEDANG"; learnedNote = "Field ini sering dikoreksi staf pada dokumen sebelumnya (" + st.corrected + " dari " + st.n + "). Periksa teliti."; }
      if (line && line.o && srcText === line.t) srcText = line.o;
      var f = {
        value: typeof value === "string" ? clean(value) : value,
        level: level, score: LEVEL[level],
        page: line ? line.page : null, sheet: line ? line.sheet : undefined,
        source: snippet(srcText != null ? srcText : (line ? line.t : ""), 200),
        method: method || (line && line.method === "OCR" ? "OCR+ATURAN" : "ATURAN_TEKS")
      };
      if (extra) for (var k in extra) f[k] = extra[k];
      if (learnedNote) f.note = (f.note ? f.note + " " : "") + learnedNote;
      fields[key] = f;
    }
    function lineText(from, to) { return lines.slice(from, to).map(function (l) { return l.t; }).join("\n"); }
    var head = lines.slice(0, 30);

    /* 0. Lembar isian berlabel ("Label: nilai") dari Excel/CSV atau formulir. Nilai berlabel dianggap paling tegas. */
    var LABEL_KEYS = {
      documentNumber: 1, documentType: 1, title: 1, partnerName: 1, signedDate: 1, startDate: 1, endDate: 1, faculty: 1, program: 1,
      tri: 1, pic: 1, location: 1, budget: 1, fundingSource: 1, activityName: 1, scope: 1, partnerSignatory: 1, partnerSignatoryTitle: 1,
      itdelSignatory: 1, itdelSignatoryTitle: 1
    };
    var labelled = {};
    lines.forEach(function (ln) {
      var m = ln.t.match(/^([A-Za-z][A-Za-z .\/]{1,40}?)\s*[:\uFF1A]\s*(.{1,400})$/);
      if (!m) return;
      var key = HEADER_ALIASES[norm(m[1])];
      if (!key || !LABEL_KEYS[key] || labelled[key]) return;
      labelled[key] = { v: tailClean(m[2]), line: ln };
    });
    function labelDate(k) {
      var l = labelled[k];
      if (!l) return;
      var dd = findDates(l.v)[0];
      if (dd) put(k, dd.iso, dd.ambiguous ? "SEDANG" : "TINGGI", l.line, l.line.t, "LABEL");
    }
    if (labelled.documentNumber && /\d/.test(labelled.documentNumber.v)) put("documentNumber", labelled.documentNumber.v.replace(/\s*\/\s*/g, "/"), "TINGGI", labelled.documentNumber.line, labelled.documentNumber.line.t, "LABEL");
    if (labelled.documentType) {
      var lt = norm(labelled.documentType.v), ltype = /\bmou\b|\bloi\b|kesepahaman/.test(lt) ? "MOU_LOI" : /\bpks\b|\bmoa\b|perjanjian/.test(lt) ? "PKS_MOA" : /\bia\b|implementation|pelaksanaan/.test(lt) ? "IA" : /proposal/.test(lt) ? "PROPOSAL" : /laporan|\blpj\b/.test(lt) ? "LAPORAN" : "";
      if (ltype) put("documentType", ltype, "TINGGI", labelled.documentType.line, labelled.documentType.line.t, "LABEL");
    }
    if (labelled.title) put("title", labelled.title.v, "TINGGI", labelled.title.line, labelled.title.line.t, "LABEL");
    ["signedDate", "startDate", "endDate"].forEach(labelDate);
    ["partnerSignatory", "partnerSignatoryTitle", "itdelSignatory", "itdelSignatoryTitle", "pic", "location", "activityName", "scope", "fundingSource"].forEach(function (k) {
      if (labelled[k]) put(k, labelled[k].v, "TINGGI", labelled[k].line, labelled[k].line.t, "LABEL");
    });
    if (labelled.budget) {
      var bd = labelled.budget.v.replace(/^Rp\.?\s*/i, "").replace(/[.,]\d{2}$/, "").replace(/[^0-9]/g, "");
      if (bd && bd !== "0") put("budget", "Rp " + bd.replace(/\B(?=(\d{3})+(?!\d))/g, "."), "TINGGI", labelled.budget.line, labelled.budget.line.t, "LABEL");
    }
    if (labelled.tri) {
      var tv = [];
      if (/pendidikan|pengajaran/i.test(labelled.tri.v)) tv.push("PENDIDIKAN");
      if (/penelitian|riset|inovasi/i.test(labelled.tri.v)) tv.push("PENELITIAN");
      if (/pengabdian|pkm|masyarakat/i.test(labelled.tri.v)) tv.push("PENGABDIAN");
      if (tv.length) put("triDharma", tv.join("; "), "TINGGI", labelled.tri.line, labelled.tri.line.t, "LABEL");
    }

    /* 1. Jenis naskah */
    var TYPE_PATTERNS = [
      ["MOU_LOI", /NOTA\s+KESEPAHAMAN|MEMORANDUM\s+OF\s+UNDERSTANDING|LETTER\s+OF\s+INTENT|SURAT\s+MINAT|MEMORANDUM\s+PERSEFAHAMAN|NOTA\s+PERSEFAHAMAN|ABSICHTSERKL\u00c4RUNG|PROTOCOLE\s+D['\u2019]ACCORD|M\u00c9MORANDUM\s+D['\u2019]ENTENTE|LETTRE\s+D['\u2019]INTENTION|MEMORANDO\s+DE\s+ENTENDIMIENTO|MEMORANDO\s+DE\s+ENTENDIMENTO|CARTA\s+DE\s+INTENCI[O\u00d3]N|INTENTIEVERKLARING|\u899a\u66f8|\u57fa\u672c\u5408\u610f\u66f8|\u8c05\u89e3\u5907\u5fd8\u5f55|\u8afe\u89e3\u5099\u5fd8\u9304|\u610f\u5411\u4e66|\uc591\ud574\uac01\uc11c|\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e04\u0e27\u0e32\u0e21\u0e40\u0e02\u0e49\u0e32\u0e43\u0e08|\u041c\u0415\u041c\u041e\u0420\u0410\u041d\u0414\u0423\u041c\s+\u041e\s+\u0412\u0417\u0410\u0418\u041c\u041e\u041f\u041e\u041d\u0418\u041c\u0410\u041d\u0418\u0418|\u0645\u0630\u0643\u0631\u0629\s+\u062a\u0641\u0627\u0647\u0645|\bMOU\b|\bLOI\b/i],
      ["PKS_MOA", /PERJANJIAN\s+KERJA\s*SAMA|MEMORANDUM\s+OF\s+AGREEMENT|KESEPAKATAN\s+BERSAMA|COOPERATION\s+AGREEMENT|COLLABORATION\s+AGREEMENT|KOOPERATIONSVERTRAG|KOOPERATIONSVEREINBARUNG|ACCORD\s+DE\s+COOP\u00c9RATION|CONVENTION\s+DE\s+COOP\u00c9RATION|CONVENIO\s+DE\s+COOPERACI[O\u00d3]N|ACUERDO\s+DE\s+COOPERACI[O\u00d3]N|ACORDO\s+DE\s+COOPERA\u00c7\u00c3O|SAMENWERKINGSOVEREENKOMST|\u5354\u529b\u5354\u5b9a|\u5408\u4f5c\u534f\u8bae|\u5408\u4f5c\u5354\u8b70|\ud611\ub825\s*\ud611\uc815|\ud611\uc57d\uc11c|\u0e02\u0e49\u0e2d\u0e15\u0e01\u0e25\u0e07\u0e04\u0e27\u0e32\u0e21\u0e23\u0e48\u0e27\u0e21\u0e21\u0e37\u0e2d|\u0421\u041e\u0413\u041b\u0410\u0428\u0415\u041d\u0418\u0415\s+\u041e\s+\u0421\u041e\u0422\u0420\u0423\u0414\u041d\u0418\u0427\u0415\u0421\u0422\u0412\u0415|\u0627\u062a\u0641\u0627\u0642\u064a\u0629\s+\u062a\u0639\u0627\u0648\u0646|PERJANJIAN\s+KERJASAMA|\bMOA\b|\bPKS\b/i],
      ["IA", /IMPLEMENTATION\s+(?:ARRANGEMENT|AGREEMENT)|PERJANJIAN\s+PELAKSANAAN|NASKAH\s+PELAKSANAAN|RENCANA\s+KERJA\s+PELAKSANAAN|DURCHF\u00dcHRUNGSVEREINBARUNG|ARRANGEMENT\s+D['\u2019]APPLICATION|ACCORD\s+D['\u2019]APPLICATION|\u5b9f\u65bd\u53d6\u6c7a\u3081|\u5b9e\u65bd\u534f\u8bae|\u5b9e\u65bd\u7ec6\u5219|\bIA\b/i],
      ["PROPOSAL", /^PROPOSAL\b|PROPOSAL\s+KEGIATAN|^USULAN\b|^PROPUESTA\b|^PROPOSITION\b|^ANGEBOT\b|^VOORSTEL\b|^\u63d0\u6848\u66f8|^\u7533\u8bf7\u4e66|^\u8ba1\u5212\u4e66|^\uc81c\uc548\uc11c/i],
      ["LAPORAN", /LAPORAN\s+(?:AKHIR|PELAKSANAAN|KEGIATAN)|LAPORAN\s+PERTANGGUNGJAWABAN|\bLPJ\b|^LAPORAN\b|^(?:FINAL|ACTIVITY|PROGRESS)\s+REPORT\b|^LAPORAN\s+AKHIR|^ABSCHLUSSBERICHT\b|^RAPPORT\s+FINAL\b|^INFORME\s+FINAL\b|^RELAT\u00d3RIO\s+FINAL\b|^\u5831\u544a\u66f8|^\u62a5\u544a|^\ubcf4\uace0\uc11c|^\u041e\u0422\u0427\u0415\u0422/i]
    ];
    var typeHit = null;
    for (var hi = 0; hi < head.length && !typeHit; hi++) {
      var best = null;
      TYPE_PATTERNS.forEach(function (tp) {
        var m = head[hi].t.match(tp[1]);
        if (m && (!best || m.index < best.idx)) best = { type: tp[0], idx: m.index, line: head[hi] };
      });
      if (best && (head[hi].t.length < 120 || best.idx < 5)) typeHit = best;
    }
    var typeFromNumber = null;
    /* 2. Nomor naskah */
    var numCands = [];
    var NUMLBL = /(?:^|[\s(\uff08])(?:Nomor|No\.?|Number|Ref\.?|Nombor|Nummer|Num\u00e9ro|N\u00famero|N[\u00b0\u00ba]|\u6587\u66f8\u756a\u53f7|\u6587\u53f7|\u7f16\u53f7|\u7de8\u865f|\u756a\u53f7|\ubb38\uc11c\ubc88\ud638)\s*(?:[A-Za-z ]{0,28}?)\s*[:：]\s*(.+)$/i;
    lines.forEach(function (ln, idx) {
      var m = ln.t.match(NUMLBL);
      var raw = m && m[1];
      if (!raw) {
        if (/^(?:Nomor|No\.?)\s*[:：]?$/i.test(ln.t) && lines[idx + 1]) raw = lines[idx + 1].t;
      }
      if (!raw) return;
      raw = raw.replace(/\s+(?:Tanggal|Lampiran|Perihal|Hal|tgl)\b.*$/i, "").replace(/[.,;]+$/, "");
      var compact = raw.replace(/\s*\/\s*/g, "/").replace(/\s*-\s*/g, "-").trim();
      var token = compact.match(/^([A-Za-z0-9][A-Za-z0-9.\-\/]*(?:\s[A-Za-z0-9.\-\/]+){0,2})/);
      if (!token) return;
      var val = token[1].trim();
      if (!/\d/.test(val) || !/[\/\-]/.test(val) || val.length < 5 || val.length > 70) return;
      if (/^(?:telp|hp|fax|rekening|npwp|nik)/i.test(val)) return;
      numCands.push({ value: val, line: ln, idx: idx });
    });
    var isDel = function (v) { return /ITDEL|IT-DEL|IT\.DEL|\/DEL\/|\bDEL\b/i.test(v); };
    var primary = numCands.filter(function (c) { return isDel(c.value); })[0];
    var primaryLevel = "TINGGI";
    if (!primary && numCands.length) { primary = numCands[0]; primaryLevel = "SEDANG"; flags.push({ code: "partner_number_only", message: "Nomor berformat IT Del tidak ditemukan. Nomor yang terbaca mungkin milik pihak mitra." }); }
    if (!primary) {
      for (var bi = 0; bi < Math.min(lines.length, 30); bi++) {
        var bm = lines[bi].t.match(/\b(\d{1,4}\s*\/\s*[A-Za-z.\-]+(?:\s*\/\s*[A-Za-z0-9.\-]+){1,4})\b/);
        if (bm && /(?:MoU|PKS|IA|MoA|LOI|ITDel)/i.test(bm[1])) { primary = { value: bm[1].replace(/\s+/g, ""), line: lines[bi] }; primaryLevel = "SEDANG"; break; }
      }
    }
    if (primary) {
      put("documentNumber", primary.value, primaryLevel, primary.line, primary.line.t);
      var segs = primary.value.toUpperCase().split("/");
      typeFromNumber = segs.indexOf("MOU") >= 0 || segs.indexOf("LOI") >= 0 ? "MOU_LOI" : segs.indexOf("PKS") >= 0 || segs.indexOf("MOA") >= 0 ? "PKS_MOA" : segs.indexOf("IA") >= 0 ? "IA" : null;
    }
    var otherNums = numCands.filter(function (c) { return primary && c.value !== primary.value; }).map(function (c) { return c.value; });
    var partnerNumber = otherNums[0] || "";

    if (typeHit) {
      var lvl = "TINGGI";
      if (typeFromNumber && typeFromNumber !== typeHit.type && ["MOU_LOI", "PKS_MOA", "IA"].indexOf(typeHit.type) >= 0) {
        lvl = "SEDANG";
        flags.push({ code: "type_conflict", message: "Judul dokumen menunjukkan " + typeHit.type + " tetapi nomor menunjukkan " + typeFromNumber + ". Periksa jenis naskah." });
      }
      put("documentType", typeHit.type, lvl, typeHit.line, typeHit.line.t, "JUDUL_DOKUMEN");
    } else if (typeFromNumber) {
      put("documentType", typeFromNumber, "SEDANG", primary.line, primary.line.t, "SEGMEN_NOMOR");
    } else {
      var fnType = (function () {
        var n = norm(fileName);
        if (/\bmou\b|\bloi\b|nota kesepahaman/.test(n)) return "MOU_LOI";
        if (/\bpks\b|\bmoa\b|perjanjian kerja sama/.test(n)) return "PKS_MOA";
        if (/\bia\b|implementation/.test(n)) return "IA";
        if (/proposal/.test(n)) return "PROPOSAL";
        if (/laporan|\blpj\b|report/.test(n)) return "LAPORAN";
        return "";
      })();
      if (fnType) put("documentType", fnType, "RENDAH", { page: null, t: fileName, method: "FILENAME" }, "Nama berkas: " + fileName, "NAMA_BERKAS");
    }
    var docType = fields.documentType ? fields.documentType.value : "";

    /* 3. Sampul: pihak-pihak, judul */
    var cover = { itdelSide: [], partnerSide: [] };
    var TITLE_MARK = "(?:T\\s?E\\s?N\\s?T\\s?A\\s?N\\s?G|MENGENAI|CONCERNING|REGARDING|SUBJECT|BETREFF(?:END)?|OBJET|CONCERNANT|ASUNTO|ASSUNTO)(?![A-Za-z])|\u5173\u4e8e|\u95dc\u65bc|\u306b\u3064\u3044\u3066";
    var tentangIdx = -1;
    for (var ti = 0; ti < Math.min(lines.length, 40); ti++) {
      if (new RegExp("^(?:" + TITLE_MARK + ")", "i").test(lines[ti].t) || /^(?:Perihal|Hal|Subject|Betreff|Objet|Asunto|Judul|Tajuk|Title|\u4ef6\u540d|\u6807\u9898)\s*[:：]/i.test(lines[ti].t)) { tentangIdx = ti; break; }
    }
    var STOP_TITLE = /^(?:NOMOR|NOMBOR|NO\.?|NUMBER|PADA\s+HARI|HARI\s+INI|ANTARA|BETWEEN|ZWISCHEN|ENTRE|DENGAN|AND|UND|ET|PASAL|ARTICLE|ARTIKEL|BAB|TANGGAL|LAMPIRAN|THIS\s+|NUMMER|NUM[\u00c9E]RO)\b/i;
    var antaraIdx = -1, denganIdx = -1;
    for (var ci = 0; ci < Math.min(lines.length, 40); ci++) {
      if (antaraIdx < 0 && /^(?:ANTARA|BETWEEN|ZWISCHEN|ENTRE)$/i.test(lines[ci].t)) antaraIdx = ci;
      if (denganIdx < 0 && /^(?:DENGAN|DAN|AND|UND|ET|Y)$/i.test(lines[ci].t) && antaraIdx >= 0) denganIdx = ci;
    }
    var coverEnd = tentangIdx >= 0 ? tentangIdx : Math.min(lines.length, 40);
    if (antaraIdx >= 0 && denganIdx > antaraIdx) {
      cover.itdelSide = lines.slice(antaraIdx + 1, denganIdx);
      for (var pi = denganIdx + 1; pi < coverEnd && !STOP_TITLE.test(lines[pi].t); pi++) cover.partnerSide.push(lines[pi]);
    } else {
      var inlineAntara = -1, inlineDengan = -1;
      for (var qi = 0; qi < Math.min(lines.length, 30); qi++) {
        if (inlineAntara < 0 && /^(?:ANTARA|BETWEEN)\s+\S/.test(lines[qi].t)) inlineAntara = qi;
        else if (inlineAntara >= 0 && inlineDengan < 0 && /^(?:DENGAN|DAN|AND)\s+\S/.test(lines[qi].t)) inlineDengan = qi;
      }
      if (inlineAntara >= 0 && inlineDengan > inlineAntara) {
        cover.itdelSide = [{ t: lines[inlineAntara].t.replace(/^(?:ANTARA|BETWEEN)\s+/, ""), page: lines[inlineAntara].page, method: lines[inlineAntara].method, ocrConf: lines[inlineAntara].ocrConf }];
        cover.partnerSide = [{ t: lines[inlineDengan].t.replace(/^(?:DENGAN|DAN|AND)\s+/, ""), page: lines[inlineDengan].page, method: lines[inlineDengan].method, ocrConf: lines[inlineDengan].ocrConf }];
        for (var q2 = inlineDengan + 1; q2 < coverEnd && !STOP_TITLE.test(lines[q2].t) && !new RegExp("^(?:" + TITLE_MARK + ")", "i").test(lines[q2].t) && cover.partnerSide.length < 3; q2++) cover.partnerSide.push(lines[q2]);
      }
      for (var si = 0; si < Math.min(lines.length, 30) && !cover.partnerSide.length; si++) {
        var sm = lines[si].t.match(/\bantara\s+(.+?)\s+(?:dengan|dan)\s+(.+?)(?:\s+tentang\b.*)?$/i);
        if (sm) { cover.itdelSide = [{ t: sm[1], page: lines[si].page, method: lines[si].method }]; cover.partnerSide = [{ t: sm[2], page: lines[si].page, method: lines[si].method }]; break; }
      }
    }
    // Judul
    if (tentangIdx >= 0) {
      var tl = lines[tentangIdx], tparts = [];
      var inline = tl.t.replace(new RegExp("^(?:" + TITLE_MARK + "|Perihal|Hal|Subject|Betreff|Objet|Asunto|Judul|Tajuk|Title|\u4ef6\u540d|\u6807\u9898)\\s*[:：]?\\s*", "i"), "");
      if (inline) tparts.push(inline);
      for (var tj = tentangIdx + 1; tj < lines.length && tparts.length < 5; tj++) {
        if (STOP_TITLE.test(lines[tj].t) || lines[tj].t.length > 160 || /[.:]$/.test(lines[tj].t) && lines[tj].t.length > 90) break;
        tparts.push(lines[tj].t);
      }
      if (tparts.length) put("title", smartCase(tparts.join(" ")), "TINGGI", tl, [tl.t].concat(tparts).join(" / "), "BAGIAN_TENTANG", { raw: tparts.join(" ") });
    }
    if (!fields.title && typeHit) {
      var tp2 = [];
      for (var tk = typeHit.line.i + 1; tk < lines.length && tp2.length < 2; tk++) {
        if (STOP_TITLE.test(lines[tk].t) || /^Nomor/i.test(lines[tk].t) || lines[tk].t.length > 120 || /[.:]$/.test(lines[tk].t) || findDates(lines[tk].t).length || /^[A-Za-z ]{2,30}\s*[:\uFF1A]/.test(lines[tk].t)) break;
        tp2.push(lines[tk].t);
      }
      if (tp2.length) put("title", smartCase(tp2.join(" ")), "SEDANG", lines[typeHit.line.i + 1], tp2.join(" / "), "BARIS_SETELAH_JUDUL");
    }
    var labelTitle = null;
    lines.some(function (l) { var m = l.t.match(/^(?:Judul(?:\s+(?:Kerja\s*sama|Naskah|Dokumen))?)\s*[:：]\s*(.{6,})$/i); if (m) { labelTitle = { v: m[1], l: l }; return true; } return false; });
    if (labelTitle) put("title", smartCase(labelTitle.v), "TINGGI", labelTitle.l, labelTitle.l.t, "LABEL");

    /* 4. Pihak penandatangan */
    var full = lines.map(function (l) { return l.t; }).join("\n");
    var parties = [];
    var markerRe = /(?:selanjutnya\s+(?:disebut|dalam\s+(?:perjanjian|nota\s+kesepahaman)\s+ini\s+disebut)\s+(?:sebagai\s+)?|hereinafter\s+(?:referred\s+to\s+as|called)\s+(?:the\s+)?|dengan\s+ini\s+disebut\s+|\(\s*)["']?\s*(PIHAK\s+(?:PERTAMA|KESATU|KEDUA|KETIGA|I|II)|(?:THE\s+)?(?:FIRST|SECOND|THIRD)\s+PARTY|PARTY\s+(?:A|B|ONE|TWO)|PARTE\s+(?:PRIMERA|SEGUNDA)|PARTIE\s+[12])\b/gi;
    var mk, lastEnd = 0, openIdx = full.search(/yang\s+bertanda\s+tangan|Pada\s+hari\s+ini|pada\s+hari/i);
    if (openIdx < 0) openIdx = 0;
    lastEnd = openIdx;
    var markers = [];
    while ((mk = markerRe.exec(full))) markers.push({ at: mk.index, end: mk.index + mk[0].length, side: mk[1].toUpperCase() });
    markers.forEach(function (m, mi) {
      var start = mi === 0 ? openIdx : markers[mi - 1].end;
      if (start > m.at) start = Math.max(0, m.at - 400);
      parties.push({ side: m.side, block: full.slice(start, m.at), at: m.at });
    });
    function lineAt(offset) {
      var acc = 0;
      for (var li = 0; li < lines.length; li++) { acc += lines[li].t.length + 1; if (offset < acc) return lines[li]; }
      return lines[lines.length - 1] || { t: "", page: 1 };
    }
    function parsePerson(block) {
      var b = block.replace(/\t/g, " ").replace(/\n+/g, " ").replace(/^\s*(?:dan\s+|serta\s+)?/i, "").replace(/^\s*PIHAK\s+(?:PERTAMA|KESATU|KEDUA|KETIGA|I|II)\s*[:\-]\s*/i, "");
      var lab = block.replace(/\t/g, " ");
      var lm = lab.match(/Nama\s*[:：]\s*([^\n]+)/i);
      var jm = lab.match(/Jabatan\s*[:：]\s*([^\n]+)/i);
      if (lm) return { name: clean(lm[1]).replace(/[;,]$/, ""), title: jm ? clean(jm[1]).replace(/[;,]$/, "") : "", how: "LABEL_NAMA_JABATAN" };
      b = b.replace(/^.*?(?:yang\s+bertanda\s+tangan\s+di\s+bawah\s+ini|kami\s+yang\s+bertanda\s+tangan)\s*[:,]?\s*/i, "").replace(/^\s*\d+[.)]\s*/, "");
      var parts = b.split(/\s\d+[.)]\s+/);
      b = parts[parts.length - 1];
      var kw = b.match(new RegExp(",\\s*(?=" + JABATAN_KW + "\\b)|\\s+(?=selaku\\s)|\\s+(?=(?:dalam\\s+hal\\s+ini\\s+)?bertindak\\b)", "i"));
      if (!kw) return null;
      var name = clean(b.slice(0, kw.index)).replace(/^\s*(?:Bapak|Ibu|Sdr\.?|Saudara|Saudari|Tuan|Nyonya)\s+/i, "");
      var rest = b.slice(kw.index + kw[0].length).replace(/^selaku\s+/i, "");
      var jab = clean(rest.split(/,\s*(?:bertindak|berkedudukan|beralamat|dalam\s+hal|yang\s+berkedudukan|selaku|alamat)|\s+bertindak\b|\s+berkedudukan\b|\s+dalam\s+hal\b/i)[0]);
      if (/^bertindak/i.test(jab)) jab = "";
      return { name: name, title: jab.replace(/[;,.]$/, ""), how: "KALIMAT_PIHAK" };
    }
    function isPerson(name) {
      if (!name || name.length < 4 || name.length > 90) return false;
      if (/\b(?:Institut|Universitas|Pemerintah|Kabupaten|Kota|Provinsi|Dinas|Fakultas|PT|CV|Yayasan|Perseroan|Kementerian|Badan|Lembaga|Sekolah)\b/.test(name)) return false;
      var words = name.replace(/,.*$/, "").split(/\s+/).filter(function (w) { return /[A-Za-z]/.test(w); });
      return words.length >= 2 || /^(?:Dr|Prof|Ir|Drs|Dra|H|Hj)\b/.test(name);
    }
    var persons = [];
    var consumedLabel = false;
    // Format tabel/label: pasangan Nama:/Jabatan: berurutan di seluruh dokumen bagian pembuka
    var labelPairs = [];
    for (var pl = 0; pl < Math.min(lines.length, 80); pl++) {
      var nm = lines[pl].t.replace(/\t/g, " ").match(/(?:^|\s)Nama\s*[:：]\s*(.+)$/i);
      if (nm) {
        var pjab = "";
        for (var pj = pl + 1; pj <= pl + 3 && pj < lines.length; pj++) {
          var jm2 = lines[pj].t.replace(/\t/g, " ").match(/(?:^|\s)Jabatan\s*[:：]\s*(.+)$/i);
          if (jm2) { pjab = jm2[1]; break; }
        }
        labelPairs.push({ name: clean(nm[1]).replace(/[;,]+$/, ""), title: clean(pjab).replace(/[;,]+$/, ""), line: lines[pl], how: "LABEL_NAMA_JABATAN" });
      }
    }
    labelPairs.forEach(function (lp) { if (isPerson(lp.name)) persons.push(lp); });
    if (!persons.length) {
      parties.forEach(function (p) {
        var pp = parsePerson(p.block);
        if (pp && isPerson(pp.name)) { pp.line = lineAt(p.at); pp.side = p.side; pp.block = p.block; persons.push(pp); }
      });
    }
    function orgOf(block) {
      var m = block.match(/(?:bertindak\s+(?:untuk\s+dan\s+)?(?:atas\s+nama|selaku\s+kuasa\s+dari|mewakili)|mewakili|untuk\s+dan\s+atas\s+nama|acting\s+(?:for\s+and\s+)?on\s+behalf\s+of|on\s+behalf\s+of|represented\s+by|representing|bertindak\s+bagi\s+pihak)\s+(.+?)(?=,\s*(?:berkedudukan|beralamat|yang|selanjutnya|dalam|berlokasi|having|with|located|whose|hereinafter|domiciled)|\s+selanjutnya\b|\s+hereinafter\b|\s+berkedudukan\b|\s+beralamat\b|\s*\(|$)/is);
      return m ? clean(m[1]).replace(/[.,;]+$/, "") : "";
    }
    var itdelRe = /Institut\s+Teknologi\s+Del|\bIT\s*Del\b|ITDel|\bDel\s+Institute/i;
    var itdelPerson = null, partnerPerson = null, partnerOrgInfo = null;
    persons.forEach(function (p, idx) {
      var ctxText = (p.title || "") + " " + (p.block || "") + " " + (parties[idx] ? parties[idx].block : "");
      var org = orgOf(ctxText.replace(/\n/g, " "));
      p.org = org;
      var del = itdelRe.test(p.title || "") || itdelRe.test(org) || /Pihak\s+Pertama|PIHAK\s+PERTAMA|KESATU|FIRST\s+PARTY|PARTY\s+A\b/i.test(ctxText) && itdelRe.test(ctxText);
      if (del && !itdelPerson) itdelPerson = p; else if (!del && !partnerPerson) partnerPerson = p;
    });
    if (!itdelPerson && !partnerPerson && persons.length === 2) { itdelPerson = persons[0]; partnerPerson = persons[1]; }
    if (!itdelPerson || !partnerPerson) {
      // Blok tanda tangan di akhir dokumen: "Nama, Jabatan"
      lines.slice(-18).forEach(function (ln) {
        if (ln.t.length > 220 || /[:\uFF1A]\s*$/.test(ln.t)) return;
        var pp = parsePerson(ln.t);
        if (!pp || !isPerson(pp.name) || !pp.title) return;
        pp.line = ln; pp.how = "BLOK_TANDA_TANGAN"; pp.org = orgOf(ln.t);
        var del = !!canonicalLeader(pp.name) || (itdelRe.test(pp.title) && !partnerPerson);
        if (del && !itdelPerson) { itdelPerson = pp; persons.push(pp); }
        else if (!del && !partnerPerson && !canonicalLeader(pp.name)) { partnerPerson = pp; persons.push(pp); }
      });
    }
    // Organisasi mitra dari kalimat pihak jika sampul tidak ada
    var partnerNameRaw = "", partnerNameLine = null, partnerNameLevel = "TINGGI", partnerNameMethod = "SAMPUL_DENGAN";
    if (cover.partnerSide.length) {
      partnerNameRaw = cover.partnerSide.map(function (l) { return l.t; }).join(" ");
      partnerNameLine = cover.partnerSide[0];
    } else {
      var cand = persons.filter(function (p) { return p !== itdelPerson && p.org; })[0];
      if (cand) { partnerNameRaw = cand.org; partnerNameLine = cand.line || lines[0]; partnerNameLevel = "SEDANG"; partnerNameMethod = "KALIMAT_PIHAK"; }
      else {
        var oi = full.match(/PIHAK\s+KEDUA[^\n]*?[:\-]\s*([^\n,]{4,80})/i);
        if (oi && !isPerson(clean(oi[1]))) { partnerNameRaw = oi[1]; partnerNameLine = lineAt(oi.index); partnerNameLevel = "RENDAH"; partnerNameMethod = "LABEL_PIHAK_KEDUA"; }
      }
    }
    partnerNameRaw = clean(partnerNameRaw).replace(/^(?:dan|dengan)\s+/i, "").replace(/[,;:]+$/, "").replace(/(?<!\bTbk|\bPT|\bCV|\bUD|\bNo)\.$/, "");
    var partnerDraft = null, partnerMatch = null;
    var partnerAlts = [];
    function resolvePartner(rawName, line, level, method, addrCtx) {
      if (fields.partnerId) return;
      var display = smartCase(rawName);
      var found = null, foundLevel = null, how = null;
      var aliasId = memory.partnerAliases && memory.partnerAliases[norm(display)];
      var byAlias = aliasId ? partners.filter(function (p) { return p.id === aliasId; })[0] : null;
      if (byAlias) { found = byAlias; foundLevel = "TINGGI"; how = "ALIAS_DIPELAJARI"; }
      var scored = partners.map(function (p) {
        var names = [p.name, p.shortName].concat(p.aliases || []).filter(Boolean);
        return { p: p, s: Math.max.apply(null, names.map(function (n) { return partnerSim(display, n); })) };
      }).sort(function (a, b) { return b.s - a.s; });
      if (!found && scored.length) {
        if (scored[0].s >= 0.97) { found = scored[0].p; foundLevel = "TINGGI"; how = "KECOCOKAN_NAMA"; }
        else if (scored[0].s >= 0.82) { found = scored[0].p; foundLevel = "SEDANG"; how = "KEMIRIPAN_NAMA"; }
      }
      scored.filter(function (x) { return x.s >= 0.4 && (!found || x.p.id !== found.id); }).slice(0, 3).forEach(function (x) {
        partnerAlts.push({ value: x.p.id, display: x.p.name, page: line ? line.page : null, source: snippet(rawName, 160), why: "nama mirip (" + Math.round(x.s * 100) + "%)" });
      });
      if (found) {
        put("partnerId", found.id, foundLevel === "TINGGI" ? level : "SEDANG", line, rawName, how === "ALIAS_DIPELAJARI" ? "ALIAS_DIPELAJARI" : method, { display: found.name, raw: rawName, note: how === "ALIAS_DIPELAJARI" ? "Dikenali dari koreksi staf sebelumnya." : (how === "KEMIRIPAN_NAMA" ? "Nama di dokumen berbeda sedikit dari master." : undefined) });
        partnerMatch = found;
        if (foundLevel !== "TINGGI") flags.push({ code: "partner_similar", message: "Nama mitra di dokumen \"" + display + "\" mirip dengan mitra terdaftar \"" + found.name + "\". Pastikan sama." });
        return;
      }
      addrCtx = addrCtx || "";
      var city = (addrCtx.match(/berkedudukan\s+di\s+([A-Z][A-Za-z ]{2,30}?)(?:,|\s+(?:Provinsi|selanjutnya|dalam)|$)/) || [])[1] || "";
      var prov = (addrCtx.match(/Provinsi\s+([A-Z][A-Za-z ]{2,30}?)(?:,|\s+selanjutnya|$)/) || [])[1] || "";
      var country = "";
      COUNTRIES.some(function (c) { if (new RegExp("\\b" + c + "\\b", "i").test(addrCtx + " " + rawName)) { country = c; return true; } return false; });
      if (!country && /\bIndonesia\b|Sumatera|Jawa|Kalimantan|Sulawesi|Papua|Bali|\bJl\.|Kabupaten|Kota\s+[A-Z]|Provinsi/i.test(addrCtx + " " + rawName)) country = "Indonesia";
      partnerDraft = {
        id: "PRT-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
        name: display, shortName: display.length > 28 ? display.slice(0, 26) + "\u2026" : display,
        type: guessPartnerType(display), country: country, city: clean(city), province: clean(prov), draft: true
      };
      put("partnerId", partnerDraft.id, level === "TINGGI" ? "SEDANG" : level, line, rawName, method, { display: display + " (mitra baru, perlu dikonfirmasi)", newPartner: true, raw: rawName });
      flags.push({ code: "new_partner", message: "Mitra \"" + display + "\" belum ada di master. Dibuat sebagai mitra baru berstatus draf. Periksa jenis mitra, negara, dan kota." });
    }
    if (labelled.partnerName) resolvePartner(labelled.partnerName.v, labelled.partnerName.line, "TINGGI", "LABEL", "");
    var partnerAddrCtx = (partnerPerson && (partnerPerson.block || "")) + " " + (parties.filter(function (p) { return /KEDUA|II|SECOND|PARTY\s+(?:B|TWO)|SEGUNDA|PARTIE\s+2/i.test(p.side); })[0] || { block: "" }).block;
    if (!fields.partnerId && partnerNameRaw && (!itdelRe.test(partnerNameRaw) || cover.partnerSide.length)) {
      resolvePartner(partnerNameRaw, partnerNameLine, partnerNameLevel, partnerNameMethod, partnerAddrCtx);
    }
    if (!fields.partnerId) flags.push({ code: "missing_partner", message: "Nama mitra tidak ditemukan pada dokumen." });

    // Penandatangan
    function canonicalLeader(name) {
      var n = norm(name.replace(/,.*$/, "").replace(/\b(?:Dr|Prof|Ir|Drs|Dra)\b\.?/gi, ""));
      var best = null;
      leaders.forEach(function (ld) {
        var ln = norm(ld.name.replace(/,.*$/, "").replace(/\b(?:Dr|Prof|Ir|Drs|Dra)\b\.?/gi, ""));
        if (ln && n && (ln === n || ln.indexOf(n) >= 0 || n.indexOf(ln) >= 0)) best = ld;
      });
      return best;
    }
    if (itdelPerson) {
      var canon = canonicalLeader(itdelPerson.name);
      put("itdelSignatory", canon ? canon.name : itdelPerson.name, itdelPerson.how === "LABEL_NAMA_JABATAN" || canon ? "TINGGI" : "SEDANG", itdelPerson.line, itdelPerson.line ? itdelPerson.line.t : itdelPerson.name, itdelPerson.how, canon ? { note: "Dinormalkan dengan direktori pimpinan IT Del." } : undefined);
      if (itdelPerson.title) put("itdelSignatoryTitle", itdelPerson.title, "TINGGI", itdelPerson.line, itdelPerson.line ? itdelPerson.line.t : itdelPerson.title, itdelPerson.how);
    } else flags.push({ code: "missing_signatory_itdel", message: "Penandatangan IT Del tidak ditemukan pada dokumen. Isi manual." });
    if (partnerPerson) {
      put("partnerSignatory", partnerPerson.name, partnerPerson.how === "LABEL_NAMA_JABATAN" ? "TINGGI" : "SEDANG", partnerPerson.line, partnerPerson.line ? partnerPerson.line.t : partnerPerson.name, partnerPerson.how);
      if (partnerPerson.title) put("partnerSignatoryTitle", partnerPerson.title, "TINGGI", partnerPerson.line, partnerPerson.line ? partnerPerson.line.t : partnerPerson.title, partnerPerson.how);
    } else flags.push({ code: "missing_signatory_partner", message: "Penandatangan pihak mitra tidak ditemukan pada dokumen. Isi manual." });

    /* 5. Tanggal */
    var dated = [];
    lines.forEach(function (ln, idx) {
      findDates(ln.t).forEach(function (d) {
        var before = (idx > 0 ? lines[idx - 1].t.slice(-60) + " " : "") + ln.t.slice(Math.max(0, d.index - 90), d.index);
        var after = ln.t.slice(d.end, d.end + 60);
        dated.push({ d: d, line: ln, idx: idx, before: before, after: after });
      });
    });
    var signed = null, start = null, end = null;
    dated.forEach(function (x) {
      var b = x.before, a = x.after;
      var isEndCtx = /(?:sampai\s+dengan|sampai|hingga|s\.?\s?d\.?|berakhir(?:\s+pada)?|batas\s+akhir|jatuh\s+tempo|until|through|expires?\s+on|ends?\s+on|to|sehingga|bis(?:\s+zum)?|jusqu['\u2019]au|hasta(?:\s+el)?|at\u00e9|tot|\u81f3|\u5230|\uff5e|~|\u307e\u3067|\uae4c\uc9c0)\s*(?:dengan\s+)?(?:tanggal\s*|el\s+|le\s+|den\s+)?$/i.test(b) || /^\s*(?:\u6b62|\u307e\u3067|\uae4c\uc9c0|\u622a\u6b62)/.test(a);
      var isStartCtx = /(?:berlaku\s+(?:sejak|mulai|efektif)|terhitung\s+(?:sejak|mulai)|dimulai(?:\s+pada)?|mulai\s+(?:dari|tanggal|berlaku)|efektif\s+(?:sejak|mulai)|effective\s+(?:from|as\s+of|on)|commenc\w+\s+on|g\u00fcltig\s+ab|ab\s+dem|\u00e0\s+compter\s+du|a\s+partir\s+del|desde\s+el|berkuat\s+kuasa\s+(?:mulai|dari)|starting\s+(?:on|from)|\u81ea|\u4ece|\u5f9e|periode(?:\s+kerja\s+sama)?\s*[:：]?)\s*(?:tanggal\s*)?$/i.test(b) || /^\s*(?:\u8d77|\u304b\u3089|\ubd80\ud130|\u5f00\u59cb|\u958b\u59cb)/.test(a);
      var isSignCtx = /(?:pada\s+hari\s+ini|hari\s+\w+\s+tanggal|ditandatangani\s+(?:pada|di)|ditetapkan\s+(?:pada|di)|(?:is\s+)?made\s+(?:and\s+entered\s+into\s+)?on|entered\s+into\s+on|signed\s+(?:on|at)|dated|unterzeichnet\s+am|fait\s+(?:\u00e0\s+[\w\u00c0-\u00ff'\u2019 -]{1,25},?\s+)?le|sign\u00e9\s+le|firmado\s+(?:en\s+[\w ]{1,20}\s+)?el|dibuat\s+pada|\u7b7e\u7f72\u4e8e|\u7b7e\u8ba2\u4e8e|\u7b7e\u7f72\u65e5\u671f|\u7b7e\u8ba2\u65e5\u671f|\u7c3d\u7f72\u65e5\u671f|\u7c3d\u8a02\u65e5\u671f|\u7de0\u7d50\u65e5|\uccb4\uacb0\uc77c)/i.test(b + " ") || /^(?:hari\s+ini)/i.test(a);
      var nextSame = dated.filter(function (y) { return y.idx === x.idx && y.d.index > x.d.index; })[0];
      var rangeNext = !!nextSame && /^\s*[,)]?\s*(?:sampai\s+dengan|sampai|hingga|s\.?\s?d\.?|-|\u2013|to|until|through)\s*(?:tanggal\s*)?$/i.test(x.line.t.slice(x.d.end, nextSame.d.index));
      if (isEndCtx && !end) end = x;
      else if ((isStartCtx || rangeNext) && !start) start = x;
      else if (isSignCtx && !signed) signed = x;
    });
    if (!signed) {
      // Tempat, tanggal di akhir dokumen: "Laguboti, 20 Januari 2026"
      for (var di = dated.length - 1; di >= 0; di--) {
        var x2 = dated[di];
        if (x2.idx >= lines.length - 25 && /^[A-Z][A-Za-z ]{2,24},\s*$/.test(x2.line.t.slice(0, x2.d.index)) && x2 !== start && x2 !== end) { signed = x2; signed.weak = true; break; }
      }
    }
    function datePut(key, x, level, how) {
      if (!x) return;
      var lv = x.d.ambiguous ? (level === "TINGGI" ? "SEDANG" : "RENDAH") : level;
      put(key, x.d.iso, lv, x.line, x.line.t, how, x.d.ambiguous ? { note: "Format angka tanggal diasumsikan hari/bulan/tahun." } : undefined);
    }
    datePut("signedDate", signed, signed && signed.weak ? "SEDANG" : "TINGGI", signed && signed.weak ? "TEMPAT_TANGGAL_PENUTUP" : "KONTEKS_PEMBUKA");
    datePut("startDate", start, "TINGGI", "KONTEKS_BERLAKU");
    datePut("endDate", end, "TINGGI", "KONTEKS_BERAKHIR");
    if (!fields.startDate && fields.signedDate) {
      var sgLine = lines.filter(function (l) { return /(?:berlaku|efektif|valid|effective|sah|berkuat\s+kuasa|g\u00fcltig|gilt|valable|vigencia|vigente|v\u00e1lido)[^.]{0,60}(?:sejak|terhitung|mulai|from|ab|\u00e0\s+compter|a\s+partir)[^.]{0,40}(?:ditandatangani|penandatanganan|signing|signature|unterzeichnung|signature|firma|assinatura)/i.test(l.t); })[0];
      if (sgLine) put("startDate", fields.signedDate.value, "SEDANG", sgLine, sgLine.t, "BERLAKU_SEJAK_TTD", { note: "Berlaku sejak penandatanganan, sehingga sama dengan tanggal tanda tangan." });
    }
    if (!fields.endDate && fields.startDate) {
      var durLine = null, dur = null;
      lines.some(function (l) {
        var m = l.t.match(/(?:jangka\s+waktu|berlaku\s+(?:selama|untuk)|selama|masa\s+berlaku|tempoh|valid\s+for|period\s+of|term\s+of|gilt\s+f\u00fcr|f\u00fcr|pour\s+une\s+dur\u00e9e\s+de|por\s+un\s+per\u00edodo\s+de|por\s+um\s+per\u00edodo\s+de|durante|vigencia\s+de|validez\s+de|g\u00fcltig\s+f\u00fcr|valable\s+(?:pendant|pour)(?:\s+une\s+dur\u00e9e\s+de)?)[^.0-9a-z\u00e0-\u00ff]*(?:selama\s+)?(\d+|[a-z\u00e0-\u00ff]+(?:\s+[a-z\u00e0-\u00ff]+){0,2})\s*(?:\([^)]*\)\s*)?(tahun|bulan|years?|months?|jahre?n?|monate?n?|ans?|mois|a\u00f1os?|meses|anos|jaar|maanden)(?![a-z])/i);
        if (!m) { var cj = l.t.match(/(\d+|[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341])\s*(?:\u5e74\u95f4|\u5e74\u9593|\u5e74|\ub144)/); if (cj) m = [cj[0], cj[1], "tahun"]; else { cj = l.t.match(/(\d+|[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341])\s*(?:\u4e2a\u6708|\u500b\u6708|\u30f6\u6708|\u304b\u6708|\uac1c\uc6d4)/); if (cj) m = [cj[0], cj[1], "bulan"]; } if (m && /^[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341]$/.test(m[1])) m[1] = String("\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341".indexOf(m[1]) + 1); }
        if (m) m[2] = /^(?:year|jahr|ans?$|a\u00f1o|anos|jaar)/i.test(m[2]) ? "tahun" : /^(?:month|monat|mois|mes|maand)/i.test(m[2]) ? "bulan" : m[2];
        if (m) {
          var n = /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : wordsToInt(m[1]);
          if (!n && !/^\d+$/.test(m[1])) { var toks = m[1].split(/\s+/); for (var qi = toks.length - 1; qi >= 0 && !n; qi--) n = wordsToInt(toks.slice(qi).join(" ")); }
          if (n && n > 0 && n <= 50) { dur = { n: n, unit: m[2].toLowerCase() }; durLine = l; return true; }
        }
        return false;
      });
      if (dur) {
        var computed = dur.unit === "tahun" ? addToDate(fields.startDate.value, dur.n, 0) : addToDate(fields.startDate.value, 0, dur.n);
        put("endDate", computed, "SEDANG", durLine, durLine.t, "HITUNG_DURASI", { note: "Dihitung dari jangka waktu " + dur.n + " " + dur.unit + " sejak tanggal mulai. Periksa terhadap dokumen." });
      }
    }
    if (fields.startDate && fields.endDate && fields.endDate.value < fields.startDate.value) {
      flags.push({ code: "invalid_date_range", message: "Tanggal berakhir lebih awal dari tanggal mulai. Periksa kedua tanggal." });
      fields.endDate.level = "RENDAH"; fields.endDate.score = LEVEL.RENDAH;
    }
    if (!fields.signedDate && !fields.startDate) flags.push({ code: "missing_date", message: "Tanggal penandatanganan dan tanggal mulai tidak ditemukan. Isi manual." });

    /* 6. Fakultas dan program studi */
    function countMentions(defs, prefixRe) {
      var res = {};
      defs.forEach(function (df) {
        var re = new RegExp(prefixRe ? prefixRe(df) : df.re, "gi");
        lines.forEach(function (ln) {
          var m;
          re.lastIndex = 0;
          while ((m = re.exec(ln.t))) {
            if (!res[df.id]) res[df.id] = { n: 0, line: ln, text: m[0] };
            res[df.id].n++;
            if (m[0].length === 0) re.lastIndex++;
          }
        });
      });
      return res;
    }
    var progMentions = countMentions(PROGRAM_DEFS, function (df) {
      return "(?:(?:Program\\s+Studi|Prodi|PS)\\s+(?:(?:S1|D3|D4)\\s+)?|\\b(?:S1|D3|D4)\\s+)(?:" + df.re + ")|\\(" + (df.id === "D3TI" ? "D3\\s*TI" : df.id) + "\\)";
    });
    // Label eksplisit "Program Studi: X" pada formulir/Excel
    var progLabel = null;
    lines.some(function (l) { var m = l.t.match(/^Program\s+Studi\s*[:：]\s*(.+)$/i); if (m) { progLabel = { v: m[1], l: l }; return true; } return false; });
    var progIds = Object.keys(progMentions).sort(function (a, b) { return progMentions[b].n - progMentions[a].n; });
    if (progLabel) {
      var pid = matchProgramText(progLabel.v);
      if (pid) put("programId", pid, "TINGGI", progLabel.l, progLabel.l.t, "LABEL");
    }
    if (!fields.programId && progIds.length) {
      var top = progMentions[progIds[0]], tie = progIds.length > 1 && progMentions[progIds[1]].n === top.n;
      if (!tie) {
        put("programId", progIds[0], progIds.length === 1 && top.n >= 1 ? "TINGGI" : "SEDANG", top.line, top.line.t, "NAMA_PRODI_EKSPLISIT");
        if (progIds.length > 1) flags.push({ code: "multi_program", message: "Beberapa program studi disebut: " + progIds.join(", ") + ". Dipilih yang paling sering muncul (" + progIds[0] + "). Periksa." });
      } else flags.push({ code: "multi_program", message: "Beberapa program studi disebut setara (" + progIds.join(", ") + "). Pilih manual." });
    }
    function matchProgramText(t) {
      var found = null;
      PROGRAM_DEFS.forEach(function (df) { if (!found && new RegExp(df.re, "i").test(t) || (!found && norm(t) === norm(df.id))) found = df.id; });
      return found;
    }
    var facMentions = countMentions(FACULTY_DEFS);
    var facIds = Object.keys(facMentions).sort(function (a, b) { return facMentions[b].n - facMentions[a].n; });
    var coverFac = null;
    cover.itdelSide.forEach(function (l) { FACULTY_DEFS.forEach(function (df) { if (!coverFac && new RegExp(df.re, "i").test(l.t)) coverFac = { id: df.id, line: l }; }); });
    if (coverFac) put("facultyId", coverFac.id, "TINGGI", coverFac.line, coverFac.line.t, "SAMPUL_ANTARA");
    if (!fields.facultyId && fields.programId) {
      var pdef = PROGRAM_DEFS.filter(function (d) { return d.id === fields.programId.value; })[0];
      if (pdef) {
        put("facultyId", pdef.faculty, fields.programId.level === "TINGGI" ? "TINGGI" : "SEDANG", { page: fields.programId.page, t: fields.programId.source }, fields.programId.source, "TURUNAN_PRODI");
        fields.facultyId.page = fields.programId.page;
      }
    }
    if (!fields.facultyId) {
      var fl = null;
      lines.some(function (l) { var m = l.t.match(/^Fakultas\s*[:：]\s*(.+)$/i); if (m) { fl = { v: m[1], l: l }; return true; } return false; });
      if (fl) { FACULTY_DEFS.some(function (df) { if (new RegExp(df.re, "i").test(fl.v) || norm(fl.v) === norm(df.id)) { put("facultyId", df.id, "TINGGI", fl.l, fl.l.t, "LABEL"); return true; } return false; }); }
    }
    if (!fields.facultyId && facIds.length) {
      var topf = facMentions[facIds[0]];
      if (facIds.length === 1 || topf.n > facMentions[facIds[1]].n) put("facultyId", facIds[0], facIds.length === 1 ? "SEDANG" : "RENDAH", topf.line, topf.line.t, "NAMA_FAKULTAS_EKSPLISIT");
    }
    if (fields.facultyId && fields.programId) {
      var pd = PROGRAM_DEFS.filter(function (d) { return d.id === fields.programId.value; })[0];
      if (pd && pd.faculty !== fields.facultyId.value) flags.push({ code: "faculty_program_mismatch", message: "Program studi " + fields.programId.value + " bukan bagian dari fakultas " + fields.facultyId.value + ". Periksa." });
    }

    /* 7. Tri Dharma */
    var scopeStart = -1;
    for (var sc = 0; sc < lines.length; sc++) if (/RUANG\s+LINGKUP/i.test(lines[sc].t) && lines[sc].t.length < 60) { scopeStart = sc; break; }
    var scopeEnd = scopeStart;
    if (scopeStart >= 0) {
      scopeEnd = scopeStart + 1;
      while (scopeEnd < lines.length && scopeEnd < scopeStart + 8 && !/^PASAL\s+\d+/i.test(lines[scopeEnd].t) && !/^BAB\b/i.test(lines[scopeEnd].t)) scopeEnd++;
      var scopeText = lineText(scopeStart + 1, scopeEnd);
      if (scopeText.length > 10) put("scope", snippet(scopeText.replace(/\n/g, " "), 600), "TINGGI", lines[scopeStart + 1], scopeText, "BAGIAN_RUANG_LINGKUP");
    }
    if (!fields.scope) {
      lines.some(function (l) {
        var m = l.t.match(/^Ruang\s+lingkup(?:\s+(?:kerja\s*sama|perjanjian|nota\s+kesepahaman))?\s*(?:ini)?\s*(?:[:：]|meliputi|mencakup|adalah)\s*(.{10,})$/i);
        if (m) { put("scope", snippet(m[1], 600), "TINGGI", l, l.t, "LABEL"); return true; }
        return false;
      });
    }
    if (!fields.scope) {
      lines.some(function (l) {
        var m = l.t.match(/[Rr]uang\s+lingkup[^.]{0,60}?(?:meliputi|mencakup)\s*[:：]?\s*(.{10,})$/);
        if (m) { put("scope", snippet(m[1], 600), "SEDANG", l, l.t, "KALIMAT_RUANG_LINGKUP"); return true; }
        return false;
      });
    }
    var TRI = [
      ["PENDIDIKAN", /pendidikan|pengajaran|pembelajaran|magang|praktik\s+kerja|kerja\s+praktik|kurikulum|dosen\s+tamu|kuliah\s+tamu|pertukaran\s+mahasiswa|beasiswa|\bMBKM\b|studi\s+lanjut/i],
      ["PENELITIAN", /penelitian|riset|research|publikasi|jurnal|paten|inovasi|hilirisasi/i],
      ["PENGABDIAN", /pengabdian|masyarakat|\bPkM\b|desa\s+binaan|pemberdayaan|penyuluhan|pelatihan\s+aparatur|sosialisasi/i]
    ];
    var triHits = [];
    var triPool = scopeStart >= 0 ? lines.slice(scopeStart, scopeEnd) : [];
    if (!triPool.length && fields.scope) triPool = [{ t: fields.scope.value, page: fields.scope.page, method: fields.scope.method }];
    var triFromScope = true;
    if (!triPool.length || !TRI.some(function (t) { return triPool.some(function (l) { return t[1].test(l.t); }); })) { triPool = lines; triFromScope = false; }
    TRI.forEach(function (t) {
      var hit = triPool.filter(function (l) { return t[1].test(l.t); })[0];
      if (hit) triHits.push({ code: t[0], line: hit, text: (hit.t.match(t[1]) || [""])[0] });
    });
    if (triHits.length) {
      put("triDharma", triHits.map(function (h) { return h.code; }).join("; "), triFromScope ? "SEDANG" : "RENDAH", triHits[0].line, triHits.map(function (h) { return "\"" + h.text + "\" (" + h.code + ")"; }).join(", ") + " : " + triHits[0].line.t, "KATA_KUNCI", { note: "Berdasarkan kata kunci. Verifikasi cakupan Tri Dharma." });
    }

    /* 8. Anggaran, sumber dana, lokasi, kegiatan, PIC */
    var budgets = [];
    function fmtMoney(b) { return b.cur === "Rp" ? "Rp " + b.digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : b.cur + " " + b.raw; }
    lines.forEach(function (l, idx) {
      var re = /(Rp\.?|IDR|RM|MYR|USD|US\$|SGD|S\$|EUR|\u20ac|GBP|\u00a3|JPY|\u00a5|\uffe5|CNY|RMB|KRW|\u20a9|THB|\u0e3f|AUD|A\$)\s*([0-9][0-9.,]*)/gi, m;
      while ((m = re.exec(l.t))) {
        var cur = /^rp/i.test(m[1]) || /^idr$/i.test(m[1]) ? "Rp" : m[1].toUpperCase().replace("US$", "USD").replace("S$", "SGD").replace("A$", "AUD").replace("\u20ac", "EUR").replace("\u00a3", "GBP").replace(/[\u00a5\uffe5]/, "JPY").replace("\u20a9", "KRW").replace("\u0e3f", "THB");
        var rawAmt = m[2].replace(/[.,]+$/, "");
        var digits = rawAmt.replace(/[.,]\d{2}$/, "").replace(/[.,]/g, "");
        if (!digits || /^0+$/.test(digits)) continue;
        var ctxw = (idx > 0 ? lines[idx - 1].t.slice(-50) + " " : "") + l.t.slice(Math.max(0, m.index - 100), m.index);
        budgets.push({ digits: digits, raw: rawAmt, cur: cur, line: l, ctx: /(biaya|anggaran|dana|nilai|sebesar|kompensasi|total|senilai|honor|pendanaan|kontribusi|kos|bajet|peruntukan|sebanyak|cost|budget|fee|amount|price|value|contribution|funding|funded|kosten|co\u00fbts?|importe|coste|\u8cbb\u7528|\u91d1\u984d|\u9884\u7b97|\u8d39\u7528|\uc608\uc0b0|\ube44\uc6a9)/i.test(ctxw) });
      }
    });
    var bctx = budgets.filter(function (b) { return b.ctx; });
    if (bctx.length) {
      var bsel = bctx[0];
      put("budget", fmtMoney(bsel), "TINGGI", bsel.line, bsel.line.t, bsel.cur === "Rp" ? "NOMINAL_RUPIAH" : "NOMINAL_" + bsel.cur);
      var distinct = {};
      bctx.forEach(function (b) { distinct[b.digits] = 1; });
      if (Object.keys(distinct).length > 1) flags.push({ code: "multi_budget", message: "Ada lebih dari satu nominal pada dokumen. Dipilih yang pertama. Periksa." });
    } else if (budgets.length) flags.push({ code: "budget_no_context", message: "Ada nominal Rp pada dokumen tanpa konteks anggaran yang jelas. Isi manual bila relevan." });
    lines.some(function (l) {
      var m = l.t.match(/(?:sumber\s+dana|pendanaan)\s*[:：]\s*(.{3,80})$/i);
      var how = "LABEL", lv = "TINGGI";
      if (!m) { m = l.t.match(/(?:dibebankan\s+(?:pada|kepada)|bersumber\s+dari|didanai\s+oleh)\s+([^.;]{3,80})/i); how = "KALIMAT"; lv = "SEDANG"; }
      if (m) { put("fundingSource", clean(m[1]).replace(/[.,;]+$/, ""), lv, l, l.t, how); return true; }
      return false;
    });
    lines.some(function (l) {
      var m = l.t.match(/^(?:Lokasi(?:\s+(?:Kegiatan|Pelaksanaan))?|Tempat\s+(?:Kegiatan|Pelaksanaan))\s*[:：]\s*(.{2,80})$/i);
      if (m) { put("location", tailClean(m[1]), "TINGGI", l, l.t, "LABEL"); return true; }
      return false;
    });
    lines.some(function (l) {
      var m = l.t.match(/^(?:Nama\s+Kegiatan|Judul\s+Kegiatan|Kegiatan)\s*[:：]\s*(.{4,200})$/i);
      if (m) { put("activityName", tailClean(m[1]), "TINGGI", l, l.t, "LABEL"); return true; }
      return false;
    });
    lines.some(function (l) {
      var m = l.t.match(/^(?:Penanggung\s+Jawab|PIC|Person\s+in\s+Charge|Koordinator(?:\s+Kegiatan)?|Ketua\s+Pelaksana)\s*[:：]\s*(.{3,120})$/i);
      if (m) { put("pic", tailClean(m[1]), "TINGGI", l, l.t, "LABEL"); return true; }
      return false;
    });
    if (partnerNumber) put("notes", "Nomor dokumen pihak mitra: " + partnerNumber, "TINGGI", primary ? primary.line : lines[0], "Nomor lain pada dokumen: " + partnerNumber, "NOMOR_KEDUA");

    /* 9. Rujukan induk */
    var refs = [];
    lines.forEach(function (l) {
      var re = /(?:Nomor|No\.?)\s+([0-9][A-Za-z0-9.\-]*(?:\s*\/\s*[A-Za-z0-9.\-]+){2,})/g, m;
      while ((m = re.exec(l.t))) {
        var v = m[1].replace(/\s*\/\s*/g, "/").replace(/[.,;]+$/, "");
        if (!primary || v !== primary.value) refs.push({ value: v, line: l });
      }
    });
    var parentSuggestion = null;
    if (refs.length) {
      refs.some(function (r) {
        var hit = knownDocs.filter(function (d) { return norm(d.documentNumber) === norm(r.value); })[0];
        if (hit) { parentSuggestion = { id: hit.id, number: hit.documentNumber, level: "TINGGI", reason: "Dokumen merujuk nomor " + r.value + ".", page: r.line.page, source: snippet(r.line.t, 200) }; return true; }
        return false;
      });
      if (!parentSuggestion) parentSuggestion = { id: "", number: refs[0].value, level: "RENDAH", reason: "Dokumen merujuk nomor " + refs[0].value + " yang belum ada di basis data. Unggah dokumen induknya.", page: refs[0].line.page, source: snippet(refs[0].line.t, 200), unresolved: true };
    }

    /* ===== kecerdasan lanjutan: silang-periksa, alternatif, saran, ringkasan ===== */
    var suggestions = {};
    var altStore = {};
    function addAlt(key, alt) { (altStore[key] = altStore[key] || []).push(alt); }
    function roleWord(t) { t = t || ""; return /Wakil\s+Rektor/i.test(t) ? "WR" : /Rektor/i.test(t) ? "REKTOR" : /Dekan/i.test(t) ? "DEKAN" : ""; }

    // (a) tahun pada nomor vs tanggal
    if (fields.documentNumber && (fields.signedDate || fields.startDate)) {
      var ym = fields.documentNumber.value.match(/(?:^|\/)(20\d{2})(?:$|[\/.\-])/);
      var rd = (fields.signedDate || fields.startDate).value;
      if (ym && Math.abs(+ym[1] - +rd.slice(0, 4)) >= 1) flags.push({ code: "year_mismatch", message: "Tahun pada nomor dokumen (" + ym[1] + ") berbeda dari tanggal " + (fields.signedDate ? "tanda tangan" : "mulai") + " (" + rd.slice(0, 4) + "). Periksa keduanya." });
    }
    // (b) jabatan penandatangan IT Del vs direktori pimpinan
    if (fields.itdelSignatory && fields.itdelSignatoryTitle && leaders.length) {
      var cl = canonicalLeader(fields.itdelSignatory.value);
      if (cl && roleWord(cl.title) && roleWord(fields.itdelSignatoryTitle.value) && roleWord(cl.title) !== roleWord(fields.itdelSignatoryTitle.value))
        flags.push({ code: "signatory_title_mismatch", message: "Jabatan \"" + fields.itdelSignatoryTitle.value + "\" tidak sesuai direktori pimpinan untuk " + cl.name + " (" + cl.title + "). Periksa nama atau jabatan." });
    }
    // (c) Dekan penandatangan vs fakultas
    if (fields.itdelSignatoryTitle) {
      var dm = fields.itdelSignatoryTitle.value.match(/Dekan\s+(Fakultas\s+[A-Za-z ]+?)(?:\s+(?:Institut|IT\s*Del)|$)/i);
      if (dm) {
        var dfac = FACULTY_DEFS.filter(function (df) { return new RegExp(df.re, "i").test(dm[1]); })[0];
        if (dfac && fields.facultyId && fields.facultyId.value !== dfac.id) flags.push({ code: "faculty_signatory_mismatch", message: "Penandatangan adalah " + fields.itdelSignatoryTitle.value + " tetapi fakultas terisi " + fields.facultyId.value + ". Periksa." });
        if (dfac && !fields.facultyId) addAlt("facultyId", { value: dfac.id, display: dfac.id, page: fields.itdelSignatoryTitle.page, source: fields.itdelSignatoryTitle.source, why: "fakultas dari jabatan penandatangan (Dekan)" });
      }
    }
    // (d) kewajaran masa berlaku
    if (fields.startDate && fields.endDate && fields.endDate.value >= fields.startDate.value) {
      var yrs = (Date.parse(fields.endDate.value) - Date.parse(fields.startDate.value)) / 31557600000;
      if (yrs > 10) flags.push({ code: "long_duration", message: "Masa berlaku " + yrs.toFixed(1) + " tahun, lebih dari 10 tahun. Periksa tanggal." });
    }
    if (fields.signedDate && fields.startDate && Date.parse(fields.signedDate.value) - Date.parse(fields.startDate.value) > 30 * 86400000)
      flags.push({ code: "signed_after_start", message: "Tanggal tanda tangan lebih dari 30 hari setelah tanggal mulai berlaku. Periksa." });
    // (e) kemungkinan duplikat (nomor sama, atau mitra + jenis + tanggal mulai sama, atau judul sangat mirip)
    knownDocs.forEach(function (d) {
      var same = fields.documentNumber && norm(d.documentNumber) === norm(fields.documentNumber.value);
      var pid = fields.partnerId ? fields.partnerId.value : "";
      var ctxSame = pid && d.partnerId === pid && fields.documentType && d.documentType === fields.documentType.value && fields.startDate && d.startDate === fields.startDate.value;
      var titleSame = fields.title && d.title && fields.documentType && d.documentType === fields.documentType.value && strSim(norm(fields.title.value), norm(d.title)) >= 0.85;
      if (same) flags.push({ code: "duplicate_document", message: "Nomor " + d.documentNumber + " sudah dipakai naskah lain (" + d.id + ")." });
      else if (ctxSame || titleSame) flags.push({ code: "possible_duplicate", message: "Mirip dengan naskah " + (d.documentNumber || d.id) + " (" + (ctxSame ? "mitra, jenis, dan tanggal mulai sama" : "judul sangat mirip") + "). Periksa apakah duplikat." });
    });

    // alternatif per field
    numCands.forEach(function (c) { addAlt("documentNumber", { value: c.value, display: c.value, page: c.line.page, source: snippet(c.line.t, 160), why: "nomor lain pada dokumen" }); });
    dated.forEach(function (x) {
      ["signedDate", "startDate", "endDate"].forEach(function (k) { addAlt(k, { value: x.d.iso, display: fmtIso(x.d.iso), page: x.line.page, source: snippet(x.line.t, 160), why: "tanggal lain pada dokumen" }); });
    });
    budgets.forEach(function (b) { addAlt("budget", { value: fmtMoney(b), display: fmtMoney(b), page: b.line.page, source: snippet(b.line.t, 160), why: "nominal lain pada dokumen" }); });
    partnerAlts.forEach(function (a) { addAlt("partnerId", a); });
    Object.keys(progMentions).forEach(function (id) { addAlt("programId", { value: id, display: id, page: progMentions[id].line.page, source: snippet(progMentions[id].line.t, 160), why: "program studi lain yang disebut" }); });
    Object.keys(facMentions).forEach(function (id) { addAlt("facultyId", { value: id, display: id, page: facMentions[id].line.page, source: snippet(facMentions[id].line.t, 160), why: "fakultas lain yang disebut" }); });
    var topics = topicSuggest(lines.map(function (l) { return l.t; }).join("\n"));
    if (!fields.programId) topics.filter(function (t) { return t.score >= 2; }).slice(0, 2).forEach(function (t) { addAlt("programId", { value: t.id, display: t.id, page: null, source: "Kata kunci: " + t.hits.join(", "), why: "saran topik (skor " + t.score + ")" }); });
    if (!fields.facultyId && topics.length && topics[0].score >= 2) {
      var tdef = PROGRAM_DEFS.filter(function (d) { return d.id === topics[0].id; })[0];
      if (tdef) addAlt("facultyId", { value: tdef.faculty, display: tdef.faculty, page: null, source: "Kata kunci: " + topics[0].hits.join(", "), why: "saran topik" });
    }
    Object.keys(altStore).forEach(function (k) {
      var seen = {}, list = [];
      altStore[k].forEach(function (a) {
        if (fields[k] && String(fields[k].value) === String(a.value)) return;
        if (seen[a.value]) return;
        seen[a.value] = 1; list.push(a);
      });
      list = list.slice(0, 4);
      if (!list.length) return;
      if (fields[k]) fields[k].alts = list; else suggestions[k] = list;
    });

    // peringkat induk
    var refList = refs.map(function (r) { return r.value; });
    var parentCandidates = rankParents({
      documentType: fields.documentType ? fields.documentType.value : "", partnerId: partnerMatch ? partnerMatch.id : "",
      title: fields.title ? fields.title.value : "", startDate: fields.startDate ? fields.startDate.value : "", facultyId: fields.facultyId ? fields.facultyId.value : ""
    }, knownDocs, refList);

    /* kualitas */
    var required = ["documentType", "documentNumber", "title", "partnerId", "signedDate", "facultyId", "itdelSignatory", "partnerSignatory"];
    if (docType !== "PROPOSAL" && docType !== "LAPORAN") required.push("startDate", "endDate");
    var FIELD_LABEL = {
      documentType: "Jenis naskah", documentNumber: "Nomor dokumen", title: "Judul", partnerId: "Mitra", signedDate: "Tanggal tanda tangan",
      startDate: "Tanggal mulai", endDate: "Tanggal berakhir", itdelSignatory: "Penandatangan IT Del", partnerSignatory: "Penandatangan mitra",
      facultyId: "Fakultas", programId: "Program studi", triDharma: "Tri Dharma", scope: "Ruang lingkup", budget: "Anggaran", fundingSource: "Sumber dana",
      location: "Lokasi", activityName: "Nama kegiatan", pic: "PIC", partnerSignatoryTitle: "Jabatan penandatangan mitra", itdelSignatoryTitle: "Jabatan penandatangan IT Del"
    };
    var optionalAsk = ["programId", "triDharma", "scope"];
    if (docType === "IA" || docType === "PROPOSAL" || docType === "LAPORAN") optionalAsk.push("activityName", "pic", "location", "budget", "fundingSource");
    var missing = required.concat(optionalAsk).filter(function (k) { return !fields[k]; });
    var low = Object.keys(fields).filter(function (k) { return fields[k].level !== "TINGGI"; });
    if (low.length) flags.push({ code: "low_ai_confidence", message: low.length + " field berkeyakinan sedang atau rendah. Periksa terhadap berkas asli: " + low.map(function (k) { return FIELD_LABEL[k] || k; }).join(", ") + "." });
    var scored = Object.keys(fields).map(function (k) { return fields[k].score; });
    var overall = scored.length ? scored.reduce(function (a, b) { return a + b; }, 0) / scored.length : 0;


    var summary = summarize(fields);
    var nextActions = [];
    missing.forEach(function (k) {
      if (required.indexOf(k) >= 0) nextActions.push({ kind: "isi", key: k, text: "Isi " + (FIELD_LABEL[k] || k) + (suggestions[k] ? " (ada saran, lihat di bawah kolom)" : "") });
    });
    Object.keys(fields).forEach(function (k) {
      if (fields[k].level !== "TINGGI") nextActions.push({ kind: "periksa", key: k, text: "Periksa " + (FIELD_LABEL[k] || k) + (fields[k].page ? " (hlm. " + fields[k].page + ")" : "") });
    });
    if (fields.partnerId && fields.partnerId.newPartner) nextActions.push({ kind: "konfirmasi", key: "partnerId", text: "Konfirmasi mitra baru dan lengkapi jenis, negara, kota" });
    if (PARENT_TYPE[docType] && !(parentSuggestion && parentSuggestion.id) && !(parentCandidates[0] && parentCandidates[0].level !== "RENDAH"))
      nextActions.push({ kind: "relasi", key: "parent", text: "Tautkan ke " + TYPE_NAME[PARENT_TYPE[docType]] + " induk atau unggah dokumen induknya" });
    if (docType === "MOU_LOI" || docType === "PKS_MOA") nextActions.push({ kind: "info", key: "child", text: "Setelah divalidasi, pantau pembuatan " + TYPE_NAME[Object.keys(PARENT_TYPE).filter(function (k) { return PARENT_TYPE[k] === docType; })[0]] + " turunannya" });

    // Bahasa dokumen (aksara + trigram). Hasil OCR yang sudah mengidentifikasi bahasa dipakai bila lebih yakin.
    var langInfo = null;
    if (LID) {
      langInfo = LID.detect(lines.map(function (l) { return l.o || l.t; }).join("\n").slice(0, 8000));
      var ocrPg = pages.filter(function (p) { return p.lang && p.lang.lang && p.lang.lang !== "und"; })[0];
      if (ocrPg && (!langInfo || langInfo.lang === "und" || ocrPg.lang.confidence > langInfo.confidence)) langInfo = ocrPg.lang;
      if (langInfo && ["id", "ms", "en", "und"].indexOf(langInfo.lang) < 0 && lines.length)
        flags.push({ code: "non_id_language", message: "Dokumen tampaknya berbahasa " + LID.name(langInfo.lang) + ". Ekstraksi paling andal untuk nomor, tanggal, anggaran, dan jenis naskah; nama pihak, jabatan, dan judul perlu diperiksa teliti." });
    }

    var patch = {}, provenance = {}, findings = [];
    Object.keys(fields).forEach(function (k) {
      patch[k] = fields[k].value;
      provenance[k] = "EKSTRAKSI";
      findings.push({ key: k, label: FIELD_LABEL[k] || k, value: fields[k].display || fields[k].value, confidence: fields[k].level === "TINGGI" ? "Tinggi" : fields[k].level === "SEDANG" ? "Sedang" : "Rendah" });
    });
    return {
      fields: fields, patch: patch, provenance: provenance, findings: findings, flags: flags,
      missing: missing.map(function (k) { return { key: k, label: FIELD_LABEL[k] || k, required: required.indexOf(k) >= 0 }; }),
      partnerDraft: partnerDraft, partnerMatch: partnerMatch, parentSuggestion: parentSuggestion,
      language: langInfo, summary: summary, nextActions: nextActions, suggestions: suggestions, parentCandidates: parentCandidates, refs: refList,
      overall: overall, pageCount: pages.length, lineCount: lines.length, ocrMean: meanOcr, fieldLabels: FIELD_LABEL
    };
  }

  /* ------------------------------------------ registri Excel -> field per baris */
  function analyzeRegistryRow(row, fileName) {
    var v = row.values, fields = {};
    Object.keys(v).forEach(function (k) {
      fields[k] = { value: v[k], level: "TINGGI", score: LEVEL.TINGGI, page: row.sheet, sheet: row.sheet, source: "Sheet \"" + row.sheet + "\" baris " + row.line, method: "KOLOM_TABEL" };
    });
    return { values: v, fields: fields, line: row.line, sheet: row.sheet, fileName: fileName };
  }

  return {
    MAX_FILE_BYTES: MAX_FILE_BYTES, MAX_FILES_PER_BATCH: MAX_FILES_PER_BATCH, LEVEL: LEVEL,
    HEADER_ALIASES: HEADER_ALIASES,
    detectKind: detectKind, readFile: readFile, analyze: analyze, detectRegistry: detectRegistry, analyzeRegistryRow: analyzeRegistryRow,
    parseCsv: parseCsv, findDates: findDates, wordsToInt: wordsToInt, smartCase: smartCase, guessPartnerType: guessPartnerType, norm: norm,
    normalizeText: normalizeText, rankParents: rankParents, partnerSim: partnerSim, repairOcrLine: repairOcrLine, topicSuggest: topicSuggest, summarize: summarize,
    _readDocx: readDocx, _readXlsx: readXlsx
  };
});
