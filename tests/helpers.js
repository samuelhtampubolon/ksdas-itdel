"use strict";
// Utilitas uji: memuat fixture dan menjalankan pembaca + ekstraksi tanpa peramban.
const fs = require("fs");
const path = require("path");
const JSZip = require("../js/jszip.min.js");
const X = require("../js/extract.js");

const root = path.join(__dirname, "..");
const seedPartners = [
  { id: "PRT-TOBA", name: "Pemerintah Kabupaten Toba", shortName: "Pemkab Toba", type: "PEMERINTAH" },
  { id: "PRT-DNT", name: "PT Danau Nusa Teknik", shortName: "Danau Nusa", type: "SWASTA" }
];
const leaders = [
  { name: "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.", title: "Rektor Institut Teknologi Del" },
  { name: "Dr. Fitriani Tupa Ronauli Silalahi, S.Si., M.Si.", title: "Dekan Fakultas Teknologi Industri" }
];

async function pdfEnv() {
  try {
    const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");
    return pdfjs;
  } catch (_) { return null; }
}

async function readFixture(name, extraEnv) {
  const p = path.join(root, "sample-data", "uji", name);
  const buf = fs.readFileSync(p);
  const file = new File([buf], name);
  const env = Object.assign({ JSZip }, extraEnv || {});
  return X.readFile(file, env);
}
async function run(name, ctx, extraEnv) {
  const r = await readFixture(name, extraEnv);
  const res = X.analyze({ pages: r.pages, fileName: name }, Object.assign({ partners: seedPartners.slice(), docs: [], leaders }, ctx || {}));
  return { read: r, res };
}
module.exports = { X, JSZip, run, readFixture, seedPartners, leaders, root, pdfEnv };
module.exports.pdfjs = (() => { try { const p = require("../js/pdf.min.js"); p.GlobalWorkerOptions.workerSrc = require("path").join(__dirname, "..", "js", "pdf.worker.min.js"); return p; } catch (e) { return null; } })();
