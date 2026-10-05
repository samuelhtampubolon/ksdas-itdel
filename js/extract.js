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
  var UNIT = { nol: 0, satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9 };
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
    january: 1, february: 2, march: 3, may: 5, june: 6, july: 7, august: 8, october: 10, december: 12
  };
  var MONTH_RE = "(Januari|Pebruari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|Nopember|November|Desember|January|February|March|May|June|July|August|October|December)";

  /** Cari semua tanggal pada satu baris. Mengembalikan [{iso,index,end,raw,numeric}] */
  function findDates(line) {
    var out = [];
    var re = new RegExp("\\b" + MONTH_RE + "\\b", "gi");
    var m;
    while ((m = re.exec(line))) {
      var month = MONTHS[m[1].toLowerCase()];
      var left = line.slice(Math.max(0, m.index - 70), m.index);
      var right = line.slice(m.index + m[0].length, m.index + m[0].length + 60);
      var day = null, dayStart = m.index;
      var l = left.replace(/\s*bulan\s*$/i, " ").replace(/\s+$/, "");
      var lm = l.match(/(\d{1,2})(?:\s*\([^)]*\))?$/);
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
      var rm = right.match(/^\s*(?:tahun\s+)?(\d{4})\b/i);
      if (rm) { year = parseInt(rm[1], 10); endIdx += rm[0].length; }
      else {
        var rw = right.replace(/^\s*(?:tahun\s+)?/i, "").match(/^((?:[a-zA-Z]+\s*){1,6})/);
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
  var JABATAN_KW = "(?:Wakil\\s+Rektor|Rektor|Wakil\\s+Dekan|Dekan|Wakil\\s+Bupati|Bupati|Wakil\\s+Wali\\s*kota|Wali\\s*kota|Walikota|Gubernur|Wakil\\s+Gubernur|Direktur|Wakil\\s+Direktur|Kepala|Ketua|Wakil\\s+Ketua|Sekretaris|Bendahara|Presiden|Wakil\\s+Presiden|Manajer|Manager|General\\s+Manager|Pimpinan|Camat|Lurah|Pjs\\.?|Plt\\.?|Pelaksana|Komisaris|Kuasa|Rector|Dean|Director|President|Chairman|Head|CEO|Vice)";
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
                pages.push({ n: num, text: res.text, method: "OCR", ocrConf: res.confidence });
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
          return { kind: kind, pages: pages, warnings: warnings };
        });
      }
      if (kind === "image") {
        if (!env.ocr) return Promise.reject(new Error("OCR tidak tersedia pada lingkungan ini."));
        return env.ocr(file, file.name, onProgress).then(function (res) {
          return { kind: kind, pages: [{ n: 1, text: res.text, method: "OCR", ocrConf: res.confidence }], warnings: warnings };
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

  /* ----------------------------------------------------- analisis teks inti */
  var INJECTION_RE = /abaikan\s+(?:semua\s+)?(?:instruksi|perintah|aturan)|lupakan\s+(?:semua\s+)?instruksi|ignore\s+(?:all\s+|any\s+)?(?:previous|prior|above)|disregard\s+(?:the\s+)?(?:above|previous)|system\s+prompt|you\s+are\s+now|setujui\s+otomatis|tetapkan\s+(?:nomor|status|jenis)/i;

  function buildLines(pages) {
    var lines = [], suspicious = 0;
    pages.forEach(function (pg) {
      String(pg.text || "").split(/\r?\n/).forEach(function (raw) {
        var t = clean(raw);
        if (!t) return;
        if (INJECTION_RE.test(t)) { suspicious++; return; }
        lines.push({ t: t, page: pg.n, sheet: pg.sheet, method: pg.method, ocrConf: pg.ocrConf, legacy: pg.legacy, i: lines.length });
      });
    });
    return { lines: lines, suspicious: suspicious };
  }

  function analyze(input, ctx) {
    ctx = ctx || {};
    var partners = ctx.partners || [];
    var knownDocs = ctx.docs || [];
    var leaders = ctx.leaders || [];
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
      var f = {
        value: typeof value === "string" ? clean(value) : value,
        level: level, score: LEVEL[level],
        page: line ? line.page : null, sheet: line ? line.sheet : undefined,
        source: snippet(srcText != null ? srcText : (line ? line.t : ""), 200),
        method: method || (line && line.method === "OCR" ? "OCR+ATURAN" : "ATURAN_TEKS")
      };
      if (extra) for (var k in extra) f[k] = extra[k];
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
      ["MOU_LOI", /NOTA\s+KESEPAHAMAN|MEMORANDUM\s+OF\s+UNDERSTANDING|LETTER\s+OF\s+INTENT|SURAT\s+MINAT|\bMOU\b|\bLOI\b/i],
      ["PKS_MOA", /PERJANJIAN\s+KERJA\s*SAMA|MEMORANDUM\s+OF\s+AGREEMENT|KESEPAKATAN\s+BERSAMA|\bMOA\b|\bPKS\b/i],
      ["IA", /IMPLEMENTATION\s+(?:ARRANGEMENT|AGREEMENT)|PERJANJIAN\s+PELAKSANAAN|NASKAH\s+PELAKSANAAN|RENCANA\s+KERJA\s+PELAKSANAAN|\bIA\b/i],
      ["PROPOSAL", /^PROPOSAL\b|PROPOSAL\s+KEGIATAN/i],
      ["LAPORAN", /LAPORAN\s+(?:AKHIR|PELAKSANAAN|KEGIATAN)|LAPORAN\s+PERTANGGUNGJAWABAN|\bLPJ\b|^LAPORAN\b/i]
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
    var NUMLBL = /(?:^|[\s(])(?:Nomor|No\.?|Number|Ref\.?)\s*(?:[A-Za-z ]{0,28}?)\s*[:：]\s*(.+)$/i;
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
    var tentangIdx = -1;
    for (var ti = 0; ti < Math.min(lines.length, 40); ti++) {
      if (/^T\s?E\s?N\s?T\s?A\s?N\s?G\b/i.test(lines[ti].t) || /^(?:Perihal|Hal)\s*[:：]/i.test(lines[ti].t)) { tentangIdx = ti; break; }
    }
    var STOP_TITLE = /^(?:NOMOR|NO\.?|PADA\s+HARI|HARI\s+INI|ANTARA|DENGAN|PASAL|BAB|TANGGAL|LAMPIRAN)\b/i;
    var antaraIdx = -1, denganIdx = -1;
    for (var ci = 0; ci < Math.min(lines.length, 40); ci++) {
      if (antaraIdx < 0 && /^ANTARA$/i.test(lines[ci].t)) antaraIdx = ci;
      if (denganIdx < 0 && /^(?:DENGAN|DAN)$/i.test(lines[ci].t) && antaraIdx >= 0) denganIdx = ci;
    }
    var coverEnd = tentangIdx >= 0 ? tentangIdx : Math.min(lines.length, 40);
    if (antaraIdx >= 0 && denganIdx > antaraIdx) {
      cover.itdelSide = lines.slice(antaraIdx + 1, denganIdx);
      for (var pi = denganIdx + 1; pi < coverEnd && !STOP_TITLE.test(lines[pi].t); pi++) cover.partnerSide.push(lines[pi]);
    } else {
      var inlineAntara = -1, inlineDengan = -1;
      for (var qi = 0; qi < Math.min(lines.length, 30); qi++) {
        if (inlineAntara < 0 && /^ANTARA\s+\S/.test(lines[qi].t)) inlineAntara = qi;
        else if (inlineAntara >= 0 && inlineDengan < 0 && /^(?:DENGAN|DAN)\s+\S/.test(lines[qi].t)) inlineDengan = qi;
      }
      if (inlineAntara >= 0 && inlineDengan > inlineAntara) {
        cover.itdelSide = [{ t: lines[inlineAntara].t.replace(/^ANTARA\s+/, ""), page: lines[inlineAntara].page, method: lines[inlineAntara].method, ocrConf: lines[inlineAntara].ocrConf }];
        cover.partnerSide = [{ t: lines[inlineDengan].t.replace(/^(?:DENGAN|DAN)\s+/, ""), page: lines[inlineDengan].page, method: lines[inlineDengan].method, ocrConf: lines[inlineDengan].ocrConf }];
        for (var q2 = inlineDengan + 1; q2 < coverEnd && !STOP_TITLE.test(lines[q2].t) && !/^T\s?E\s?N\s?T\s?A\s?N\s?G/i.test(lines[q2].t) && cover.partnerSide.length < 3; q2++) cover.partnerSide.push(lines[q2]);
      }
      for (var si = 0; si < Math.min(lines.length, 30) && !cover.partnerSide.length; si++) {
        var sm = lines[si].t.match(/\bantara\s+(.+?)\s+(?:dengan|dan)\s+(.+?)(?:\s+tentang\b.*)?$/i);
        if (sm) { cover.itdelSide = [{ t: sm[1], page: lines[si].page, method: lines[si].method }]; cover.partnerSide = [{ t: sm[2], page: lines[si].page, method: lines[si].method }]; break; }
      }
    }
    // Judul
    if (tentangIdx >= 0) {
      var tl = lines[tentangIdx], tparts = [];
      var inline = tl.t.replace(/^(?:T\s?E\s?N\s?T\s?A\s?N\s?G|Perihal|Hal)\s*[:：]?\s*/i, "");
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
        if (STOP_TITLE.test(lines[tk].t) || /^Nomor/i.test(lines[tk].t) || lines[tk].t.length > 120) break;
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
    var markerRe = /(?:selanjutnya\s+(?:disebut|dalam\s+(?:perjanjian|nota\s+kesepahaman)\s+ini\s+disebut)\s+(?:sebagai\s+)?|\(\s*)["']?\s*(PIHAK\s+(?:PERTAMA|KESATU|KEDUA|KETIGA|I|II))\b/gi;
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
      var b = block.replace(/\t/g, " ").replace(/\n+/g, " ").replace(/^\s*(?:dan\s+|serta\s+)?/i, "");
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
      var m = block.match(/(?:bertindak\s+(?:untuk\s+dan\s+)?(?:atas\s+nama|selaku\s+kuasa\s+dari|mewakili)|mewakili|untuk\s+dan\s+atas\s+nama)\s+(.+?)(?=,\s*(?:berkedudukan|beralamat|yang|selanjutnya|dalam|berlokasi)|\s+selanjutnya\b|\s+berkedudukan\b|\s+beralamat\b|\s*\(|$)/is);
      return m ? clean(m[1]).replace(/[.,;]+$/, "") : "";
    }
    var itdelRe = /Institut\s+Teknologi\s+Del|\bIT\s*Del\b|ITDel|\bDel\s+Institute/i;
    var itdelPerson = null, partnerPerson = null, partnerOrgInfo = null;
    persons.forEach(function (p, idx) {
      var ctxText = (p.title || "") + " " + (p.block || "") + " " + (parties[idx] ? parties[idx].block : "");
      var org = orgOf(ctxText.replace(/\n/g, " "));
      p.org = org;
      var del = itdelRe.test(p.title || "") || itdelRe.test(org) || /Pihak\s+Pertama|PIHAK\s+PERTAMA|KESATU/.test(ctxText) && itdelRe.test(ctxText);
      if (del && !itdelPerson) itdelPerson = p; else if (!del && !partnerPerson) partnerPerson = p;
    });
    if (!itdelPerson && !partnerPerson && persons.length === 2) { itdelPerson = persons[0]; partnerPerson = persons[1]; }
    if (!itdelPerson || !partnerPerson) {
      // Blok tanda tangan di akhir dokumen: "Nama, Jabatan"
      lines.slice(-18).forEach(function (ln) {
        if (ln.t.length > 220 || /[:\uFF1A]\s*$/.test(ln.t)) return;
        var pp = parsePerson(ln.t);
        if (!pp || !isPerson(pp.name) || !pp.title) return;
        pp.line = ln; pp.how = "BLOK_TANDA_TANGAN"; pp.org = "";
        var del = !!canonicalLeader(pp.name) || (itdelRe.test(pp.title) && !partnerPerson);
        if (del && !itdelPerson) itdelPerson = pp;
        else if (!del && !partnerPerson && !canonicalLeader(pp.name)) partnerPerson = pp;
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
        if (oi) { partnerNameRaw = oi[1]; partnerNameLine = lineAt(oi.index); partnerNameLevel = "RENDAH"; partnerNameMethod = "LABEL_PIHAK_KEDUA"; }
      }
    }
    partnerNameRaw = clean(partnerNameRaw).replace(/^(?:dan|dengan)\s+/i, "").replace(/[,;:]+$/, "").replace(/(?<!\bTbk|\bPT|\bCV|\bUD|\bNo)\.$/, "");
    var partnerDraft = null, partnerMatch = null;
    function resolvePartner(rawName, line, level, method, addrCtx) {
      if (fields.partnerId) return;
      var display = smartCase(rawName);
      var key = norm(display), core = legalCore(display);
      var found = null, foundLevel = null;
      partners.forEach(function (p) {
        if (found && foundLevel === "TINGGI") return;
        if (norm(p.name) === key || (p.shortName && norm(p.shortName) === key)) { found = p; foundLevel = "TINGGI"; }
        else if (core.length >= 4 && (legalCore(p.name) === core)) { found = p; foundLevel = "TINGGI"; }
        else if (!found && jaccard(legalCore(p.name), core) >= 0.75) { found = p; foundLevel = "SEDANG"; }
      });
      if (found) {
        put("partnerId", found.id, foundLevel === "TINGGI" ? level : "SEDANG", line, rawName, method, { display: found.name });
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
      put("partnerId", partnerDraft.id, level === "TINGGI" ? "SEDANG" : level, line, rawName, method, { display: display + " (mitra baru, perlu dikonfirmasi)", newPartner: true });
      flags.push({ code: "new_partner", message: "Mitra \"" + display + "\" belum ada di master. Dibuat sebagai mitra baru berstatus draf. Periksa jenis mitra, negara, dan kota." });
    }
    if (labelled.partnerName) resolvePartner(labelled.partnerName.v, labelled.partnerName.line, "TINGGI", "LABEL", "");
    var partnerAddrCtx = (partnerPerson && (partnerPerson.block || "")) + " " + (parties.filter(function (p) { return /KEDUA|II/.test(p.side); })[0] || { block: "" }).block;
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
      var isEndCtx = /(?:sampai\s+dengan|sampai|hingga|s\.?\s?d\.?|berakhir(?:\s+pada)?|batas\s+akhir|jatuh\s+tempo)\s*(?:dengan\s+)?(?:tanggal\s*)?$/i.test(b);
      var isStartCtx = /(?:berlaku\s+(?:sejak|mulai|efektif)|terhitung\s+(?:sejak|mulai)|dimulai(?:\s+pada)?|mulai\s+(?:dari|tanggal|berlaku)|efektif\s+(?:sejak|mulai)|periode(?:\s+kerja\s+sama)?\s*[:：]?)\s*(?:tanggal\s*)?$/i.test(b);
      var isSignCtx = /(?:pada\s+hari\s+ini|hari\s+\w+\s+tanggal|ditandatangani\s+(?:pada|di)|ditetapkan\s+(?:pada|di))/i.test(b + " ") || /^(?:hari\s+ini)/i.test(a);
      var rangeNext = /^\s*(?:\)|,)?\s*(?:sampai\s+dengan|sampai|hingga|s\.?\s?d\.?|-|–)\s*(?:tanggal\s*)?$/i.test(a.replace(/\s*(?:tanggal)?\s*$/i, "")) && dated.some(function (y) { return y.idx === x.idx && y.d.index > x.d.index; });
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
      var sgLine = lines.filter(function (l) { return /(?:berlaku|efektif)[^.]{0,60}(?:sejak|terhitung|mulai)[^.]{0,40}(?:ditandatangani|penandatanganan)/i.test(l.t); })[0];
      if (sgLine) put("startDate", fields.signedDate.value, "SEDANG", sgLine, sgLine.t, "BERLAKU_SEJAK_TTD", { note: "Berlaku sejak penandatanganan, sehingga sama dengan tanggal tanda tangan." });
    }
    if (!fields.endDate && fields.startDate) {
      var durLine = null, dur = null;
      lines.some(function (l) {
        var m = l.t.match(/(?:jangka\s+waktu|berlaku\s+(?:selama|untuk)|selama|masa\s+berlaku)[^.0-9a-z]*(?:selama\s+)?(\d+|[a-z]+(?:\s+[a-z]+){0,2})\s*(?:\([^)]*\)\s*)?(tahun|bulan)\b/i);
        if (m) {
          var n = /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : wordsToInt(m[1]);
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
    lines.forEach(function (l, idx) {
      var re = /Rp\.?\s*([0-9][0-9.,]*)/gi, m;
      while ((m = re.exec(l.t))) {
        var digits = m[1].replace(/[.,]\d{2}$/, "").replace(/[.,]/g, "");
        if (!digits || digits === "0") continue;
        var ctxw = (idx > 0 ? lines[idx - 1].t.slice(-50) + " " : "") + l.t.slice(Math.max(0, m.index - 100), m.index);
        budgets.push({ digits: digits, line: l, ctx: /(biaya|anggaran|dana|nilai|sebesar|kompensasi|total|senilai|honor|pendanaan|kontribusi)/i.test(ctxw) });
      }
    });
    var bctx = budgets.filter(function (b) { return b.ctx; });
    if (bctx.length) {
      var bsel = bctx[0];
      put("budget", "Rp " + bsel.digits.replace(/\B(?=(\d{3})+(?!\d))/g, "."), "TINGGI", bsel.line, bsel.line.t, "NOMINAL_RUPIAH");
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

    /* kualitas */
    var required = ["documentType", "documentNumber", "title", "partnerId", "signedDate", "itdelSignatory", "partnerSignatory"];
    if (docType !== "PROPOSAL" && docType !== "LAPORAN") required.push("startDate", "endDate");
    var FIELD_LABEL = {
      documentType: "Jenis naskah", documentNumber: "Nomor dokumen", title: "Judul", partnerId: "Mitra", signedDate: "Tanggal tanda tangan",
      startDate: "Tanggal mulai", endDate: "Tanggal berakhir", itdelSignatory: "Penandatangan IT Del", partnerSignatory: "Penandatangan mitra",
      facultyId: "Fakultas", programId: "Program studi", triDharma: "Tri Dharma", scope: "Ruang lingkup", budget: "Anggaran", fundingSource: "Sumber dana",
      location: "Lokasi", activityName: "Nama kegiatan", pic: "PIC", partnerSignatoryTitle: "Jabatan penandatangan mitra", itdelSignatoryTitle: "Jabatan penandatangan IT Del"
    };
    var optionalAsk = ["facultyId", "programId", "triDharma", "scope"];
    if (docType === "IA" || docType === "PROPOSAL" || docType === "LAPORAN") optionalAsk.push("activityName", "pic", "location", "budget", "fundingSource");
    var missing = required.concat(optionalAsk).filter(function (k) { return !fields[k]; });
    var low = Object.keys(fields).filter(function (k) { return fields[k].level !== "TINGGI"; });
    if (low.length) flags.push({ code: "low_ai_confidence", message: low.length + " field berkeyakinan sedang atau rendah. Periksa terhadap berkas asli: " + low.map(function (k) { return FIELD_LABEL[k] || k; }).join(", ") + "." });
    var scored = Object.keys(fields).map(function (k) { return fields[k].score; });
    var overall = scored.length ? scored.reduce(function (a, b) { return a + b; }, 0) / scored.length : 0;

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
    _readDocx: readDocx, _readXlsx: readXlsx
  };
});
