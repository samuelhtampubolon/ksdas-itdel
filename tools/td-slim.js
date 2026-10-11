#!/usr/bin/env node
/**
 * td-slim: memangkas komponen pada berkas Tesseract .traineddata (format TessdataManager).
 *
 * Hasil rekayasa balik (lihat docs/OCR_RISET.md): pada model LSTM "best_int", komponen LSTM_SYSTEM_DAWG
 * (daftar kata bahasa, DAWG) menyumbang 46% (ind) sampai 71% (eng) dari ukuran berkas. LSTM tetap berjalan tanpa
 * komponen itu (Tesseract memeriksa ketersediaan komponen). Nama, nomor, dan gelar pada naskah kerja sama justru
 * sering tidak ada di kamus, sehingga kamus umum sering menyesatkan. Koreksi kata dilakukan oleh leksikon domain
 * kecil (js/ocr/lexicon.js).
 *
 * Pemakaian: node tools/td-slim.js masuk.traineddata[.gz] keluar.traineddata[.gz] [--keep-dawg] [--drop=NAMA,NAMA]
 */
"use strict";
const fs = require("fs"), zlib = require("zlib");
const NAMES = ["LANG_CONFIG", "UNICHARSET", "AMBIGS", "INTTEMP", "PFFMTABLE", "NORMPROTO", "PUNC_DAWG", "SYSTEM_DAWG", "NUMBER_DAWG", "FREQ_DAWG", "FIXED_LENGTH_DAWGS", "CUBE_UNICHARSET", "CUBE_SYSTEM_DAWG", "SHAPE_TABLE", "BIGRAM_DAWG", "UNAMBIG_DAWG", "PARAMS_MODEL", "LSTM", "LSTM_PUNC_DAWG", "LSTM_SYSTEM_DAWG", "LSTM_NUMBER_DAWG", "LSTM_UNICHARSET", "LSTM_RECODER", "VERSION"];

function load(p) { let b = fs.readFileSync(p); if (b[0] === 0x1f && b[1] === 0x8b) b = zlib.gunzipSync(b); return b; }
function parse(b) {
  const n = b.readInt32LE(0);
  const offs = [];
  for (let i = 0; i < n; i++) offs.push(Number(b.readBigInt64LE(4 + 8 * i)));
  const present = offs.map((o, i) => [i, o]).filter((x) => x[1] >= 0).sort((a, b2) => a[1] - b2[1]);
  const comps = new Map();
  present.forEach(([i, o], k) => comps.set(i, b.subarray(o, k + 1 < present.length ? present[k + 1][1] : b.length)));
  return { n, comps };
}
function build(n, comps) {
  const head = 4 + 8 * n;
  const parts = [], offs = new Array(n).fill(-1);
  let pos = head;
  [...comps.keys()].sort((a, b) => a - b).forEach((i) => { offs[i] = pos; parts.push(comps.get(i)); pos += comps.get(i).length; });
  const h = Buffer.alloc(head);
  h.writeInt32LE(n, 0);
  offs.forEach((o, i) => h.writeBigInt64LE(BigInt(o), 4 + 8 * i));
  return Buffer.concat([h, ...parts]);
}
function slim(buf, drop) {
  const { n, comps } = parse(buf);
  drop.forEach((name) => { const i = NAMES.indexOf(name); if (i < 0) throw new Error("Komponen tidak dikenal: " + name); comps.delete(i); });
  return build(n, comps);
}
module.exports = { parse, build, slim, load, NAMES };

if (require.main === module) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const flags = process.argv.slice(2).filter((a) => a.startsWith("--"));
  if (args.length < 2) { console.error("Pemakaian: node tools/td-slim.js masuk keluar [--keep-dawg] [--drop=A,B]"); process.exit(1); }
  let drop = flags.includes("--keep-dawg") ? [] : ["LSTM_SYSTEM_DAWG"];
  const d = flags.find((f) => f.startsWith("--drop=")); if (d) drop = d.slice(7).split(",").filter(Boolean);
  const src = load(args[0]);
  const out = slim(src, drop);
  fs.writeFileSync(args[1], /\.gz$/.test(args[1]) ? zlib.gzipSync(out, { level: 9 }) : out);
  const fmt = (x) => (x / 1048576).toFixed(2) + " MB";
  console.log(`${args[0]}: ${fmt(src.length)} -> ${fmt(out.length)} (dibuang: ${drop.join(", ") || "-"})` + (/\.gz$/.test(args[1]) ? `, gz ${fmt(fs.statSync(args[1]).size)}` : ""));
}
