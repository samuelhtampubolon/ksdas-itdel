"use strict";
// Regresi untuk variasi format naskah (bahasa Inggris, tanpa sampul, laporan, teks acak).
const test = require("node:test");
const assert = require("node:assert/strict");
const { X, seedPartners, leaders } = require("./helpers");
const run = (t, name = "x.txt") => X.analyze({ pages: [{ n: 1, text: t, method: "TEKS" }], fileName: name }, { partners: seedPartners.slice(), docs: [], leaders });
const v = (r, k) => (r.fields[k] ? r.fields[k].value : undefined);

test("MoU bahasa Inggris: mitra, tanggal, durasi dari penandatanganan", () => {
  const r = run(`MEMORANDUM OF UNDERSTANDING\nBETWEEN\nINSTITUT TEKNOLOGI DEL\nAND\nUNIVERSITI TEKNOLOGI MALAYSIA\nNumber: 021/ITDel/MoU/2026\nThis Memorandum is made on 5 March 2026 in Laguboti.\nDr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech., Rector of Institut Teknologi Del.\nProf. Dr. Ahmad Bin Ali, Vice Chancellor of Universiti Teknologi Malaysia, Johor Bahru, Malaysia.\nThe cooperation is valid for 5 (five) years from the date of signing.`);
  assert.equal(v(r, "documentNumber"), "021/ITDel/MoU/2026");
  assert.equal(r.partnerDraft.name, "Universiti Teknologi Malaysia");
  assert.equal(v(r, "signedDate"), "2026-03-05");
  assert.equal(v(r, "endDate"), "2031-03-04");
  assert.equal(r.fields.title, undefined, "judul tidak boleh berisi kata BETWEEN");
});

test("Pihak berlabel tanpa sampul: nama mitra dari 'atas nama', bukan nama orang", () => {
  const r = run(`PERJANJIAN KERJA SAMA\nNomor: 12/ITDel/PKS/2026\nPada hari ini Kamis tanggal 12 Februari 2026 telah dibuat perjanjian antara:\nPIHAK PERTAMA: Dr. Ellyas Alga Nainggolan, S.TP., M.Sc., Ph.D., Wakil Rektor III Institut Teknologi Del.\nPIHAK KEDUA: Budi Santoso, S.E., Direktur CV Maju Jaya, bertindak untuk dan atas nama CV Maju Jaya, berkedudukan di Medan.\nNilai kontrak Rp 1.250.000,00 dan Rp 5.000.000.`);
  assert.equal(r.partnerDraft.name, "CV Maju Jaya");
  assert.equal(v(r, "itdelSignatory"), "Dr. Ellyas Alga Nainggolan, S.TP., M.Sc., Ph.D.");
  assert.equal(v(r, "partnerSignatory"), "Budi Santoso, S.E.");
  assert.equal(v(r, "budget"), "Rp 1.250.000");
  assert.ok(r.flags.some((f) => f.code === "multi_budget"));
});

test("Laporan: rentang tanggal dan judul tidak menyerap kalimat", () => {
  const r = run(`LAPORAN PELAKSANAAN KEGIATAN\nPelatihan Pemrograman Web untuk Guru SMK\nKegiatan dilaksanakan pada 3 Maret 2026 sampai dengan 5 Maret 2026 di Balige.\nLokasi: SMK Negeri 1 Balige\nPenanggung Jawab: Rina Situmorang, S.T., M.T.`);
  assert.equal(v(r, "title"), "Pelatihan Pemrograman Web untuk Guru SMK");
  assert.equal(v(r, "startDate"), "2026-03-03");
  assert.equal(v(r, "endDate"), "2026-03-05");
  assert.equal(v(r, "pic"), "Rina Situmorang, S.T., M.T.");
});

test("Teks bukan naskah kerja sama tidak menghasilkan field apa pun", () => {
  assert.deepEqual(Object.keys(run("Halo ini surat biasa tentang undangan makan siang pada 1 Januari 2026").fields), []);
});

test("Tanggal numerik ambigu ditandai Sedang", () => {
  const r = run("NOTA KESEPAHAMAN\nNomor: 3/ITDel/MoU/2026\nPada hari ini tanggal 03/04/2026");
  assert.equal(v(r, "signedDate"), "2026-04-03");
  assert.equal(r.fields.signedDate.level, "SEDANG");
});
