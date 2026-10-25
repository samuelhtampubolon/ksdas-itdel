#!/usr/bin/env node
/**
 * Pelatih model identifikasi bahasa/aksara KSDAS (langid) -> js/ocr/langid-data.js
 *
 * Rekayasa balik dari franc (Wooorm, MIT) / metode Cavnar & Trenkle (1994): franc menyimpan 300 trigram teratas
 * per bahasa (data.js 100 KB untuk 82 bahasa) dan membandingkan peringkat. Di sini kami menyimpan 1 karakter
 * kuantisasi log-probabilitas per trigram (4 karakter per entri) sehingga dapat memakai penilaian Naive Bayes yang
 * lebih akurat pada teks pendek, hanya untuk bahasa yang relevan bagi KSDAS, ditambah kata fungsi per bahasa.
 *
 * Pemakaian: node tools/langid/train.js <folder udhr/declaration> js/ocr/langid-data.js
 * Sumber: UDHR (paket npm "udhr", MIT) + tools/langid/corpus/*.txt (karangan sendiri).
 */
"use strict";
const fs = require("fs"), path = require("path");
const [UDHR, OUT] = process.argv.slice(2);
if (!UDHR || !OUT) { console.error("Pemakaian: node train.js <udhr/declaration> <keluaran.js>"); process.exit(1); }

// kode KSDAS -> berkas UDHR (tanpa .html) ; aksara untuk pengelompokan
const SPEC = {
  id: "ind", jv: "jav", su: "sun", min: "min", ace: "ace", tl: "tgl", vi: "vie", en: "eng", de: "deu_1996", fr: "fra", es: "spa",
  pt: "por_BR", nl: "nld", it: "ita", tr: "tur", pl: "pol", ro: "ron_2006", sv: "swe", da: "dan", fi: "fin", cs: "ces", hu: "hun",
  ru: "rus", uk: "ukr", bg: "bul", el: "ell_monotonic", ar: "arb", fa: "pes_1", ur: "urd", he: "heb", hi: "hin", bn: "ben", ta: "tam",
  km: "khm", lo: "lao", my: "mya"
};
const EXTRA = { ms: "corpus/ms.txt" };
const TOP = 220;

function clean(s) { return s.toLowerCase().replace(/[!-@ -¿ -⁯　-〿＀-／]+/g, " ").replace(/\s+/g, " ").trim(); }
function htmlText(file) {
  const s = fs.readFileSync(file, "utf8");
  const paras = [...s.matchAll(/<(?:p|h\d)[^>]*>([\s\S]*?)<\/(?:p|h\d)>/g)].map((m) => m[1].replace(/<[^>]+>/g, " "));
  return paras.join(" ").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
}
const texts = {};
for (const [k, f] of Object.entries(SPEC)) {
  const p = path.join(UDHR, f + ".html");
  if (!fs.existsSync(p)) { console.warn("UDHR tidak ada:", f); continue; }
  texts[k] = htmlText(p);
}
for (const [k, f] of Object.entries(EXTRA)) texts[k] = fs.readFileSync(path.join(__dirname, f), "utf8");
// tambahkan korpus domain kecil untuk id/en (nama jabatan, istilah kerja sama) agar penilaian pada naskah lebih tajam
texts.id += " " + fs.readFileSync(path.join(__dirname, "corpus/id-domain.txt"), "utf8");
texts.en += " " + fs.readFileSync(path.join(__dirname, "corpus/en-domain.txt"), "utf8");

function trigramCounts(t) {
  const s = " " + clean(t) + " ", m = new Map();
  for (let i = 0; i + 3 <= s.length; i++) { const g = s.slice(i, i + 3); m.set(g, (m.get(g) || 0) + 1); }
  return m;
}
function words(t) { const m = new Map(); for (const w of clean(t).split(" ")) if (w.length >= 2 && w.length <= 12) m.set(w, (m.get(w) || 0) + 1); return m; }

const B36 = "0123456789abcdefghijklmnopqrstuvwxyz";
const model = { _v: 1, tri: {}, fw: {}, top: TOP };
for (const [lang, text] of Object.entries(texts)) {
  const c = trigramCounts(text); let total = 0; for (const v of c.values()) total += v;
  const top = [...c.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, TOP);
  let enc = "";
  for (const [g, n] of top) {
    const bits = -Math.log2(n / total);               // 3..13
    const q = Math.max(0, Math.min(35, Math.round((bits - 3) * 3)));
    enc += g + B36[q];
  }
  model.tri[lang] = enc;
  const w = words(text); let wt = 0; for (const v of w.values()) wt += v;
  model.fw[lang] = [...w.entries()].filter(([x]) => x.length >= 2).sort((a, b) => b[1] - a[1]).slice(0, 36).map(([x]) => x).join(" ");
}
fs.writeFileSync(OUT, "/* Dibangkitkan oleh tools/langid/train.js. Jangan diedit manual. Sumber: UDHR (MIT) + korpus karangan sendiri. */\n(function (r) { r.KSDASLangidData = " + JSON.stringify(model) + "; })(typeof self !== 'undefined' ? self : this);\n");
console.log("bahasa:", Object.keys(model.tri).length, "ukuran:", (fs.statSync(OUT).size / 1024).toFixed(1), "KB");
