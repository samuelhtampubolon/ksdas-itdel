"use strict";
// Uji ekstraksi multibahasa: jenis, nomor, tanggal (berbagai format), masa berlaku, mata uang, bahasa terdeteksi.
const test = require("node:test");
const assert = require("node:assert/strict");
const { X, seedPartners, leaders } = require("./helpers");
const an = (text) => X.analyze({ pages: [{ n: 1, text, method: "TEKS" }], fileName: "x.txt" }, { partners: seedPartners.slice(), docs: [], leaders });
const v = (r, k) => (r.fields[k] ? r.fields[k].value : undefined);

test("Melayu: memorandum persefahaman, tarikh, tempoh, RM", () => {
  const r = an("MEMORANDUM PERSEFAHAMAN\nANTARA\nINSTITUT TEKNOLOGI DEL\nDAN\nUNIVERSITI TEKNOLOGI MALAYSIA\nNombor: 021/ITDel/MoU/2026\nDibuat pada 5 Mac 2026 di Laguboti.\nPerjanjian ini sah selama 5 (lima) tahun mulai tarikh ditandatangani.\nKos sebanyak RM 50,000 ditanggung oleh pihak kedua.");
  assert.equal(v(r, "documentType"), "MOU_LOI");
  assert.equal(v(r, "documentNumber"), "021/ITDel/MoU/2026");
  assert.equal(v(r, "signedDate"), "2026-03-05");
  assert.equal(v(r, "endDate"), "2031-03-04");
  assert.equal(v(r, "budget"), "RM 50,000");
  assert.equal(r.partnerDraft.name, "Universiti Teknologi Malaysia");
  assert.equal(r.language.lang, "ms");
});

test("Jerman: Kooperationsvereinbarung, Unterzeichnet am, ab dem, drei Jahre, EUR", () => {
  const r = an("KOOPERATIONSVEREINBARUNG\nzwischen\nINSTITUT TEKNOLOGI DEL\nund\nTECHNISCHE UNIVERSITÄT MUSTERSTADT\nNummer: 044/ITDel/PKS/2026\nUnterzeichnet am 5. März 2026 in Laguboti.\nDiese Vereinbarung gilt für drei Jahre ab dem 5. März 2026.\nDie Kosten betragen EUR 12.500,00 und werden vom Partner getragen.");
  assert.equal(v(r, "documentType"), "PKS_MOA");
  assert.equal(v(r, "documentNumber"), "044/ITDel/PKS/2026");
  assert.equal(v(r, "signedDate"), "2026-03-05");
  assert.equal(v(r, "startDate"), "2026-03-05");
  assert.equal(v(r, "endDate"), "2029-03-04");
  assert.equal(v(r, "budget"), "EUR 12.500,00");
  assert.equal(r.language.lang, "de");
});

test("Prancis: accord de coopération, fait à ..., le, à compter du, trois ans", () => {
  const r = an("ACCORD DE COOPÉRATION\nENTRE\nINSTITUT TEKNOLOGI DEL\nET\nUNIVERSITÉ EXEMPLE DE LYON\nNuméro: 051/ITDel/PKS/2026\nFait à Laguboti, le 5 mars 2026.\nLe présent accord est valable pour une durée de trois ans à compter du 5 mars 2026.");
  assert.equal(v(r, "documentType"), "PKS_MOA");
  assert.equal(v(r, "signedDate"), "2026-03-05");
  assert.equal(v(r, "startDate"), "2026-03-05");
  assert.equal(v(r, "endDate"), "2029-03-04");
  assert.equal(r.language.lang, "fr");
});

test("Spanyol: convenio, firmado el 5 de marzo de 2026, vigencia de tres años", () => {
  const r = an("CONVENIO DE COOPERACIÓN\nENTRE\nINSTITUT TEKNOLOGI DEL\nY\nUNIVERSIDAD EJEMPLO\nNúmero: 061/ITDel/PKS/2026\nFirmado el 5 de marzo de 2026.\nEl presente convenio tendrá una vigencia de tres años a partir del 5 de marzo de 2026.");
  assert.equal(v(r, "documentType"), "PKS_MOA");
  assert.equal(v(r, "signedDate"), "2026-03-05");
  assert.equal(v(r, "startDate"), "2026-03-05");
  assert.equal(v(r, "endDate"), "2029-03-04");
  assert.equal(r.language.lang, "es");
});

test("Jepang: 覚書, 文書番号, 締結日, から/まで, JPY", () => {
  const r = an("覚書\n文書番号：031/ITDel/MoU/2026\n締結日：2026年3月5日\n有効期間は 2026年3月5日 から 2029年3月4日 まで とする。\n費用は JPY 500,000 とする。");
  assert.equal(v(r, "documentType"), "MOU_LOI");
  assert.equal(v(r, "documentNumber"), "031/ITDel/MoU/2026");
  assert.equal(v(r, "signedDate"), "2026-03-05");
  assert.equal(v(r, "startDate"), "2026-03-05");
  assert.equal(v(r, "endDate"), "2029-03-04");
  assert.equal(v(r, "budget"), "JPY 500,000");
  assert.equal(r.language.lang, "ja");
  assert.match(r.fields.signedDate.source, /2026年3月5日/, "kutipan sumber memakai teks asli, bukan hasil normalisasi");
});

test("Tionghoa: 谅解备忘录, 编号, 签署日期, 起三年内有效", () => {
  const r = an("谅解备忘录\n编号：031/ITDel/MoU/2026\n签署日期：2026年3月5日\n本备忘录自2026年3月5日起三年内有效。");
  assert.equal(v(r, "documentType"), "MOU_LOI");
  assert.equal(v(r, "documentNumber"), "031/ITDel/MoU/2026");
  assert.equal(v(r, "signedDate"), "2026-03-05");
  assert.equal(v(r, "startDate"), "2026-03-05");
  assert.equal(v(r, "endDate"), "2029-03-04");
  assert.equal(r.language.lang, "zh");
});

test("Korea: 양해각서, 문서번호, 체결일, 부터/까지", () => {
  const r = an("양해각서\n문서번호: 031/ITDel/MoU/2026\n체결일: 2026년 3월 5일\n본 협정은 2026년 3월 5일부터 2029년 3월 4일까지 유효하다.");
  assert.equal(v(r, "documentType"), "MOU_LOI");
  assert.equal(v(r, "signedDate"), "2026-03-05");
  assert.equal(v(r, "startDate"), "2026-03-05");
  assert.equal(v(r, "endDate"), "2029-03-04");
  assert.equal(r.language.lang, "ko");
});

test("Angka Arab-Indic, Devanagari, dan tahun Buddha Thai dinormalkan", () => {
  assert.equal(X.normalizeText("٢٠٢٦-٠٣-٠٥"), "2026-03-05");
  assert.equal(X.normalizeText("२०२६"), "2026");
  assert.equal(X.normalizeText("5 มีนาคม 2569"), "2026-03-05");
  assert.equal(X.normalizeText("令和8年3月5日"), "2026-03-05");
});

test("Inggris: format bulan-hari-tahun dan 'on behalf of'", () => {
  const r = an("COOPERATION AGREEMENT\nBETWEEN\nINSTITUT TEKNOLOGI DEL\nAND\nEXAMPLE UNIVERSITY\nNumber: 077/ITDel/PKS/2026\nThis Agreement is made on March 5, 2026 in Laguboti.\nProf. Jane Doe, Vice Chancellor, acting on behalf of Example University, hereinafter referred to as the SECOND PARTY.");
  assert.equal(v(r, "signedDate"), "2026-03-05");
  assert.equal(v(r, "documentType"), "PKS_MOA");
  assert.equal(r.partnerDraft.name, "Example University");
});
