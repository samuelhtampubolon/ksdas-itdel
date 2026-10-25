// Membandingkan langid KSDAS dengan franc-min dan franc pada kalimat held-out (tests/fixtures/langid-heldout.json).
// Pemakaian: node tools/langid/bench.mjs <folder node_modules yang berisi franc-min dan franc>
import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module"; import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);
const nm = process.argv[2];
const L = require(path.resolve("js/ocr/langid.js"));
const data = JSON.parse(fs.readFileSync("tests/fixtures/langid-heldout.json", "utf8"));
const imp = async (p) => (await import(pathToFileURL(path.join(nm, p)).href));
const francMin = nm ? (await imp("franc-min/index.js")).franc : null;
const francAll = nm ? (await imp("franc/index.js")).franc : null;
// peta ISO 639-3 (franc) -> KSDAS
const MAP = { ind: "id", zlm: "ms", zsm: "ms", eng: "en", jav: "jv", sun: "su", min: "min", ace: "ace", tgl: "tl", fil: "tl", vie: "vi", deu: "de", fra: "fr", spa: "es", por: "pt", nld: "nl", ita: "it", tur: "tr", pol: "pl", ron: "ro", swe: "sv", dan: "da", fin: "fi", ces: "cs", hun: "hu", rus: "ru", ukr: "uk", bul: "bg", ell: "el", arb: "ar", pes: "fa", urd: "ur", heb: "he", hin: "hi", ben: "bn", tam: "ta", khm: "km", lao: "lo", mya: "my", jpn: "ja", kor: "ko", cmn: "zh", tha: "th" };
const cuts = [["penuh", (s) => s], ["60 huruf", (s) => s.slice(0, 60)], ["30 huruf", (s) => s.slice(0, 30)], ["18 huruf", (s) => s.slice(0, 18)]];
console.log("akurasi per panjang teks (benar/total), hanya 23 bahasa uji");
const tot = {}; 
for (const [cn, f] of cuts) {
  const r = { ksdas: 0, francMin: 0, franc: 0, n: 0 }; const fails = [];
  for (const [lang, sents] of Object.entries(data)) { if (lang[0] === "_") continue; for (const s0 of sents) { const s = f(s0); r.n++;
    if (L.detect(s).lang === lang) r.ksdas++; else fails.push(lang + "->" + L.detect(s).lang);
    if (francMin && (MAP[francMin(s)] || francMin(s)) === lang) r.francMin++;
    if (francAll && (MAP[francAll(s)] || francAll(s)) === lang) r.franc++; } }
  console.log(cn.padEnd(10), `KSDAS ${(100 * r.ksdas / r.n).toFixed(1)}%  franc-min ${francMin ? (100 * r.francMin / r.n).toFixed(1) + "%" : "-"}  franc(all) ${francAll ? (100 * r.franc / r.n).toFixed(1) + "%" : "-"}  (n=${r.n})`, cn === "penuh" || cn === "18 huruf" ? "\n   gagal KSDAS: " + fails.join(" ") : "");
}
