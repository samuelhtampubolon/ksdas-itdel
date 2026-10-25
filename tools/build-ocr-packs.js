#!/usr/bin/env node
/**
 * Membangun paket bahasa OCR "lite" + manifest untuk js/ocr/models.
 *
 * Sumber: model Tesseract 4 "best_int" (Apache-2.0) dari paket npm @tesseract.js-data/<kode>.
 *   mkdir src && cd src && for l in ind deu fra; do mkdir $l && (cd $l && npm pack @tesseract.js-data/$l && tar xzf *.tgz); done
 * Pemakaian: node tools/build-ocr-packs.js --src <src> --out js/ocr/models --langs ind,deu,fra [--keep-dawg]
 * Setiap paket dipangkas komponen kamus katanya (td-slim) dan ditulis ulang sebagai .traineddata.gz.
 */
"use strict";
const fs = require("fs"), path = require("path"), zlib = require("zlib"), crypto = require("crypto");
const { slim, load } = require("./td-slim.js");
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i >= 0 ? process.argv[i + 1] : d; };
const src = arg("src"), out = arg("out", "js/ocr/models"), langs = (arg("langs", "ind") || "").split(",").filter(Boolean);
const keep = process.argv.includes("--keep-dawg");
if (!src) { console.error("Pemakaian: node tools/build-ocr-packs.js --src <folder> --out <folder> --langs ind,deu"); process.exit(1); }
const NAMES = { ind: "Indonesia, Inggris, Melayu, Jawa, Sunda (aksara Latin)", deu: "Jerman", fra: "Prancis", spa: "Spanyol", por: "Portugis", ita: "Italia", nld: "Belanda", tur: "Turki", vie: "Vietnam", jpn: "Jepang", kor: "Korea", chi_sim: "Tionghoa sederhana", chi_tra: "Tionghoa tradisional", tha: "Thai", rus: "Rusia", ara: "Arab", hin: "Hindi", msa: "Melayu", eng: "Inggris" };
const VALIDATED = new Set(["ind", "deu", "fra", "spa", "por", "ita", "nld", "tur", "vie", "jpn", "kor", "chi_sim", "tha", "rus", "ara", "hin"]);
fs.mkdirSync(out, { recursive: true });
const manifest = { version: 1, engine: "tesseract-wasm 0.11.0", model: "tessdata best_int, kamus kata dibuang (td-slim)", packs: {} };
for (const l of langs) {
  const cands = [path.join(src, l, "package", "4.0.0_best_int", l + ".traineddata.gz"), path.join(src, l + ".traineddata.gz"), path.join(src, l + ".traineddata")];
  const f = cands.find((c) => fs.existsSync(c));
  if (!f) { console.error("Tidak ditemukan:", l); process.exit(2); }
  const buf = load(f), o = keep ? buf : slim(buf, ["LSTM_SYSTEM_DAWG"]);
  const gz = zlib.gzipSync(o, { level: 9 });
  const file = l + ".traineddata.gz";
  fs.writeFileSync(path.join(out, file), gz);
  manifest.packs[l] = { file, bytes: gz.length, rawBytes: o.length, sha256: crypto.createHash("sha256").update(gz).digest("hex"), name: NAMES[l] || l, validated: VALIDATED.has(l) };
  console.log(l.padEnd(8), (gz.length / 1048576).toFixed(2) + " MB");
}
fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log("total:", (Object.values(manifest.packs).reduce((a, p) => a + p.bytes, 0) / 1048576).toFixed(2), "MB,", langs.length, "paket");
