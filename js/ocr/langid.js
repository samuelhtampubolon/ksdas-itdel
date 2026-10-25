/*
 * KSDAS - Identifikasi bahasa dan aksara ringan (v1.0). Tanpa dependensi, ~6 KB kode + ~55 KB data.
 *
 * Langkah: (1) hitung aksara Unicode (Latin, Cyrillic, Arab, Han, Kana, Hangul, Thai, dst.) sehingga bahasa
 * beraksara tunggal langsung ditentukan; (2) untuk aksara yang dipakai banyak bahasa, hitung skor Naive Bayes
 * dari profil trigram (220 trigram teratas per bahasa, dikuantisasi) ditambah kata fungsi dan penanda khusus
 * (mis. pembeda Indonesia vs Melayu). Metode trigram berasal dari Cavnar & Trenkle (1994) dan implementasi
 * terbuka franc (MIT). Data dilatih ulang lewat tools/langid/train.js.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./langid-data.js").KSDASLangidData);
  else root.KSDASLangid = factory(root.KSDASLangidData);
})(typeof self !== "undefined" ? self : this, function (DATA) {
  "use strict";
  var B36 = "0123456789abcdefghijklmnopqrstuvwxyz";

  var SCRIPTS = [
    ["Latin", /[A-Za-zÀ-ɏḀ-ỿ]/g],
    ["Cyrillic", /[Ѐ-ӿ]/g],
    ["Greek", /[Ͱ-Ͽἀ-῿]/g],
    ["Arabic", /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/g],
    ["Hebrew", /[֐-׿]/g],
    ["Devanagari", /[ऀ-ॿ]/g],
    ["Bengali", /[ঀ-৿]/g],
    ["Tamil", /[஀-௿]/g],
    ["Thai", /[฀-๿]/g],
    ["Lao", /[຀-໿]/g],
    ["Khmer", /[ក-៿]/g],
    ["Myanmar", /[က-႟]/g],
    ["Hangul", /[가-힯ᄀ-ᇿ㄰-㆏]/g],
    ["Kana", /[぀-ヿㇰ-ㇿ]/g],
    ["Han", /[㐀-䶿一-鿿豈-﫿]/g]
  ];
  var SINGLE = { Greek: "el", Hebrew: "he", Devanagari: "hi", Bengali: "bn", Tamil: "ta", Thai: "th", Lao: "lo", Khmer: "km", Myanmar: "my", Hangul: "ko" };
  var MULTI = {
    Latin: ["id", "ms", "en", "jv", "su", "min", "ace", "tl", "vi", "de", "fr", "es", "pt", "nl", "it", "tr", "pl", "ro", "sv", "da", "fi", "cs", "hu"],
    Cyrillic: ["ru", "uk", "bg"],
    Arabic: ["ar", "fa", "ur"]
  };
  /** Penanda leksikal khusus (kata yang membedakan bahasa serumpun). Bobot dalam bit. */
  var MARKERS = {
    id: "tanggal tentang dari universitas fakultas penelitian pemerintah kegiatan mahasiswa karena bisa kantor perusahaan setelah senin rabu jumat sabtu minggu silakan sehingga merupakan sebagaimana apabila bahwa yaitu belah",
    ms: "tarikh mengenai daripada universiti fakulti penyelidikan kerajaan aktiviti pelajar kerjasama kerana boleh pejabat syarikat selepas isnin rabu jumaat sabtu ahad sila hendaklah sekiranya ialah kedua-dua naib canselor",
    sv: "och att inte är ett från av ska jag också eller",
    da: "og ikke er af skal fra jeg også eller kan blive",
    jv: "lan saka kanggo ora iki sing dening utawa sawise bakal nalika kudu",
    su: "jeung ti keur teu ieu anu ku atawa saatos bakal dina kudu",
    en: "the of and to in is shall be for with that this are by",
    tl: "ang ng mga sa na ay at ito para kasunduang",
    min: "jo nan dek ndak iko kok untuak"
  };
  var TOPLAT = null;

  function prepModel() {
    if (TOPLAT) return;
    TOPLAT = {};
    Object.keys(DATA.tri).forEach(function (lang) {
      var s = DATA.tri[lang], map = Object.create(null), maxq = 0;
      for (var i = 0; i + 4 <= s.length; i += 4) {
        var q = B36.indexOf(s.charAt(i + 3));
        map[s.substr(i, 3)] = q; if (q > maxq) maxq = q;
      }
      var fw = Object.create(null);
      (DATA.fw[lang] || "").split(" ").forEach(function (w) { if (w) fw[w] = 1; });
      TOPLAT[lang] = { map: map, floor: maxq + 4, fw: fw };
    });
    Object.keys(MARKERS).forEach(function (lang) {
      if (!TOPLAT[lang]) return;
      TOPLAT[lang].mk = Object.create(null);
      MARKERS[lang].split(" ").forEach(function (w) { TOPLAT[lang].mk[w] = 1; });
    });
  }
  function clean(s) { return s.toLowerCase().replace(/[!-@ -¿ -⁯　-〿＀-／]+/g, " ").replace(/\s+/g, " ").trim(); }
  function bits(q) { return q / 3 + 3; }

  function scriptCounts(text) {
    var counts = {}, total = 0;
    SCRIPTS.forEach(function (sc) { var m = text.match(sc[1]); counts[sc[0]] = m ? m.length : 0; total += counts[sc[0]]; });
    return { counts: counts, total: total };
  }

  function scoreLatinLike(text, langs) {
    prepModel();
    var s = " " + clean(text) + " ", grams = Object.create(null), n = 0, i, words = s.trim().split(" ");
    for (i = 0; i + 3 <= s.length; i++) { var g = s.substr(i, 3); grams[g] = (grams[g] || 0) + 1; n++; }
    if (!n) return [];
    var out = langs.map(function (l) {
      var m = TOPLAT[l]; if (!m) return { lang: l, score: -Infinity };
      var sc = 0;
      for (var g2 in grams) { var q = m.map[g2]; sc -= grams[g2] * (q === undefined ? bits(m.floor) : bits(q)); }
      sc /= n; // bit per trigram (negatif; lebih besar = lebih cocok)
      var fwHit = 0, mkHit = 0;
      words.forEach(function (w) { if (m.fw[w]) fwHit++; if (m.mk && m.mk[w]) mkHit++; });
      sc += (fwHit * 0.9 + mkHit * 3.0) / Math.max(4, words.length);
      return { lang: l, score: sc };
    });
    out.sort(function (a, b) { return b.score - a.score; });
    // softmax terhadap selisih skor, suhu 0.35 bit per trigram
    var top = out[0].score, z = 0;
    out.forEach(function (o) { o.p = Math.exp((o.score - top) / 0.35); z += o.p; });
    out.forEach(function (o) { o.p = o.p / z; });
    return out;
  }

  /** detect(text) -> { lang, script, confidence, candidates, mixed, letters, scripts } */
  function detect(text) {
    text = String(text || "");
    var sc = scriptCounts(text);
    var letters = sc.total;
    if (letters < 3) return { lang: "und", script: "", confidence: 0, candidates: [], mixed: false, letters: letters, scripts: {} };
    var shares = {};
    Object.keys(sc.counts).forEach(function (k) { if (sc.counts[k]) shares[k] = sc.counts[k] / letters; });
    var script = Object.keys(shares).sort(function (a, b) { return shares[b] - shares[a]; })[0];
    var mixed = Object.keys(shares).filter(function (k) { return shares[k] >= 0.2; }).length > 1;
    var res = { script: script, letters: letters, scripts: shares, mixed: mixed };

    // Han + Kana + Hangul
    if (script === "Han" || script === "Kana") {
      var kana = sc.counts.Kana, han = sc.counts.Han;
      var isJa = kana >= 0.04 * (kana + han) && kana >= 2;
      var trad = "們這個時說與為來會對點開關學國體機術業經濟貿"; var simp = "们这个时说与为来会对点开关学国体机术业经济贸";
      var tc = 0, scn = 0; for (var i = 0; i < text.length; i++) { if (trad.indexOf(text.charAt(i)) >= 0) tc++; if (simp.indexOf(text.charAt(i)) >= 0) scn++; }
      res.lang = isJa ? "ja" : "zh"; res.variant = isJa ? undefined : (tc > scn ? "Hant" : "Hans");
      res.script = isJa ? "Kana+Han" : "Han";
      res.confidence = letters >= 8 ? 0.97 : 0.8; res.candidates = [{ lang: res.lang, p: res.confidence }];
      return res;
    }
    if (SINGLE[script]) {
      res.lang = SINGLE[script]; res.confidence = Math.min(0.99, 0.6 + shares[script] * 0.4); res.candidates = [{ lang: res.lang, p: res.confidence }];
      return res;
    }
    var langs = MULTI[script];
    if (!langs) { res.lang = "und"; res.confidence = 0; res.candidates = []; return res; }
    if (letters < 12) { var sc0 = scoreLatinLike(text, langs); res.lang = sc0.length ? sc0[0].lang : "und"; res.confidence = Math.min(0.5, sc0.length ? sc0[0].p : 0); res.candidates = sc0.slice(0, 3).map(function (o) { return { lang: o.lang, p: Math.round(o.p * 1000) / 1000 }; }); res.short = true; return res; }
    var scored = scoreLatinLike(text, langs);
    res.lang = scored[0].lang; res.confidence = Math.round(scored[0].p * 1000) / 1000;
    res.candidates = scored.slice(0, 3).map(function (o) { return { lang: o.lang, p: Math.round(o.p * 1000) / 1000 }; });
    return res;
  }

  /** Kode paket OCR (traineddata) untuk bahasa hasil deteksi. Bahasa serumpun Latin memakai paket "ind" yang ringan. */
  var OCR_PACK = {
    id: "ind", ms: "ind", en: "ind", jv: "ind", su: "ind", min: "ind", ace: "ind", tl: "ind",
    de: "deu", fr: "fra", es: "spa", pt: "por", nl: "nld", it: "ita", tr: "tur", vi: "vie",
    ja: "jpn", ko: "kor", zh: "chi_sim", th: "tha", ru: "rus", uk: "rus", bg: "rus", ar: "ara", hi: "hin"
  };
  var NAMES = { id: "Indonesia", ms: "Melayu", en: "Inggris", jv: "Jawa", su: "Sunda", min: "Minangkabau", ace: "Aceh", tl: "Tagalog", vi: "Vietnam", de: "Jerman", fr: "Prancis", es: "Spanyol", pt: "Portugis", nl: "Belanda", it: "Italia", tr: "Turki", pl: "Polandia", ro: "Rumania", sv: "Swedia", da: "Denmark", fi: "Finlandia", cs: "Ceko", hu: "Hungaria", ru: "Rusia", uk: "Ukraina", bg: "Bulgaria", el: "Yunani", ar: "Arab", fa: "Persia", ur: "Urdu", he: "Ibrani", hi: "Hindi", bn: "Bengali", ta: "Tamil", km: "Khmer", lo: "Lao", my: "Myanmar", ja: "Jepang", ko: "Korea", zh: "Tionghoa", th: "Thai", und: "Tidak diketahui" };

  return { detect: detect, ocrPack: function (lang) { return OCR_PACK[lang] || "ind"; }, name: function (lang) { return NAMES[lang] || lang; }, OCR_PACK: OCR_PACK, NAMES: NAMES };
});
