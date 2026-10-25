"use strict";
// Uji kecerdasan lanjutan: kemiripan mitra, alias dipelajari, perbaikan OCR, silang-periksa, saran, peringkat induk.
const test = require("node:test");
const assert = require("node:assert/strict");
const { X, run, leaders } = require("./helpers");
const partners = [
  { id: "PRT-TOBA", name: "Pemerintah Kabupaten Toba", shortName: "Pemkab Toba", type: "PEMERINTAH" },
  { id: "PRT-DNT", name: "PT Danau Nusa Teknik", shortName: "Danau Nusa", type: "SWASTA" },
  { id: "PRT-KMF", name: "Dinas Komunikasi dan Informatika Provinsi Sumatera Utara", shortName: "Diskominfo Sumut", type: "PEMERINTAH" }
];
const an = (text, ctx = {}) => X.analyze({ pages: [{ n: 1, text, method: ctx.method || "TEKS" }], fileName: "x.txt" }, Object.assign({ partners: partners.map((p) => ({ ...p })), docs: [], leaders }, ctx));
const v = (r, k) => (r.fields[k] ? r.fields[k].value : undefined);

const MOU = (partnerLine, extra = "") => `NOTA KESEPAHAMAN\nANTARA\nINSTITUT TEKNOLOGI DEL\nDENGAN\n${partnerLine}\nTENTANG\nPENGEMBANGAN SISTEM INFORMASI DESA\nNomor: 031/ITDel/MoU/2026\nPada hari ini Selasa tanggal 20 Januari 2026, bertempat di Laguboti:\n1. Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech., Rektor Institut Teknologi Del, bertindak untuk dan atas nama Institut Teknologi Del, selanjutnya disebut PIHAK PERTAMA.\n2. Ir. Poltak Sitorus, M.Si., Bupati Toba, bertindak untuk dan atas nama ${partnerLine}, selanjutnya disebut PIHAK KEDUA.\n${extra}`;

test("Kemiripan nama mitra: singkatan diperluas (Pemkab = Pemerintah Kabupaten)", () => {
  const r = an(MOU("PEMKAB TOBA"));
  assert.equal(v(r, "partnerId"), "PRT-TOBA");
  assert.equal(r.partnerDraft, null);
  assert.ok(X.partnerSim("Univ. Sumatera Utara", "Universitas Sumatera Utara") >= 0.97);
});

test("Salah ketik kecil pada nama mitra tetap dikenali tetapi ditandai Sedang", () => {
  const r = an(MOU("PT DANAU NUSA TEKNIKK"));
  assert.equal(v(r, "partnerId"), "PRT-DNT");
  assert.equal(r.fields.partnerId.level, "SEDANG");
  assert.ok(r.flags.some((f) => f.code === "partner_similar"));
});

test("Alias yang dipelajari dari koreksi staf dikenali Tinggi", () => {
  const raw = "DISKOMINFO PROVINSI SUMUT";
  const without = an(MOU(raw));
  assert.ok(without.partnerDraft || without.fields.partnerId.level !== "TINGGI", "tanpa memori tidak Tinggi");
  const mem = { partnerAliases: { [X.norm(X.smartCase(raw))]: "PRT-KMF" } };
  const r = an(MOU(raw), { memory: mem });
  assert.equal(v(r, "partnerId"), "PRT-KMF");
  assert.equal(r.fields.partnerId.level, "TINGGI");
  assert.equal(r.fields.partnerId.method, "ALIAS_DIPELAJARI");
});

test("Mitra mirip yang tidak yakin muncul sebagai alternatif untuk satu klik", () => {
  const r = an(MOU("PT DANAU TEKNIK BARU SEJAHTERA"));
  const alts = (r.fields.partnerId.alts || []);
  assert.ok(alts.some((a) => a.value === "PRT-DNT"), "PT Danau Nusa Teknik ditawarkan sebagai alternatif");
});

test("Perbaikan galat OCR pada nomor, tahun, dan bulan", () => {
  assert.equal(X.repairOcrLine("Nomor: O14/ITDeI/MoU/2O26"), "Nomor: 014/ITDel/MoU/2026");
  assert.equal(X.repairOcrLine("tanggal 20 Januarl 2026"), "tanggal 20 Januari 2026");
  assert.equal(X.repairOcrLine("Julia Simanjuntak"), "Julia Simanjuntak", "nama orang tidak diubah");
  const r = an("NOTA KESEPAHAMAN\nNomor: O14/lTDel/MoU/2O26\nPada hari ini tanggal 2O Januarl 2026", { method: "OCR" });
  assert.equal(v(r, "documentNumber"), "014/ITDel/MoU/2026");
  assert.equal(v(r, "signedDate"), "2026-01-20");
});

test("Silang-periksa: tahun nomor, jabatan, Dekan vs fakultas, masa berlaku", () => {
  const r1 = an(MOU("PEMKAB TOBA").replace("031/ITDel/MoU/2026", "031/ITDel/MoU/2024"));
  assert.ok(r1.flags.some((f) => f.code === "year_mismatch"));
  const r2 = an(`PERJANJIAN KERJA SAMA\nNomor: 1/ITDel/PKS/2026\nPada hari ini tanggal 1 Januari 2026\nDr. Fitriani Tupa Ronauli Silalahi, S.Si., M.Si., Dekan Fakultas Teknologi Industri Institut Teknologi Del, bertindak untuk dan atas nama Institut Teknologi Del, selanjutnya disebut PIHAK PERTAMA.\nRuang lingkup meliputi kegiatan di Fakultas Bioteknologi dengan Program Studi S1 Teknik Bioproses.\nBerlaku sejak tanggal 1 Januari 2026 sampai dengan tanggal 1 Januari 2040.`);
  assert.ok(r2.flags.some((f) => f.code === "faculty_signatory_mismatch"), "Dekan FTI tetapi fakultas FB");
  assert.ok(r2.flags.some((f) => f.code === "long_duration"));
  const r3 = an(MOU("PEMKAB TOBA").replace("Rektor Institut Teknologi Del", "Dekan Fakultas Vokasi"));
  assert.ok(r3.flags.some((f) => f.code === "signatory_title_mismatch"));
});

test("Saran topik untuk program studi tidak mengisi otomatis", () => {
  const r = an(MOU("PEMKAB TOBA", "Ruang lingkup meliputi pengembangan aplikasi web, pemrograman, dan sistem informasi desa."));
  assert.equal(r.fields.programId, undefined, "tidak diisi otomatis");
  const sug = (r.suggestions.programId || []).map((a) => a.value);
  assert.ok(sug.includes("TRPL") || sug.includes("SI"), "saran: " + sug.join(","));
});

test("Peringkat induk: rujukan nomor, mitra sama, kemiripan judul, rentang tanggal", () => {
  const docs = [
    { id: "M1", documentType: "MOU_LOI", documentNumber: "012/ITDel/MoU/2024", partnerId: "PRT-DNT", title: "Kerja sama magang dan rantai pasok", startDate: "2024-01-01", endDate: "2027-01-01" },
    { id: "M2", documentType: "MOU_LOI", documentNumber: "077/ITDel/MoU/2023", partnerId: "PRT-DNT", title: "Kerja sama beasiswa", startDate: "2020-01-01", endDate: "2023-01-01" }
  ];
  const doc = { id: "P1", documentType: "PKS_MOA", partnerId: "PRT-DNT", title: "Program magang mahasiswa dan optimasi rantai pasok", startDate: "2025-08-18" };
  const r = X.rankParents(doc, docs, []);
  assert.equal(r[0].id, "M1");
  assert.ok(r[0].why.some((w) => /mitra sama/.test(w)) && r[0].why.some((w) => /judul mirip/.test(w)));
  const explicit = X.rankParents(doc, docs, ["012/ITDel/MoU/2024"]);
  assert.equal(explicit[0].level, "TINGGI");
  assert.ok(!r.some((x) => x.id === "M2" && x.level !== "RENDAH"), "induk yang sudah berakhir tidak diunggulkan");
});

test("Ringkasan dan daftar tindakan berikutnya", async () => {
  const { res } = await run("PKS_FTI_DanauNusaTeknik_2025.docx");
  assert.match(res.summary, /^PKS\/MoA antara Institut Teknologi Del dan PT Danau Nusa Teknik tentang Program Magang/);
  assert.match(res.summary, /Berlaku 18 Agustus 2025 sampai 17 Agustus 2027/);
  assert.match(res.summary, /Anggaran Rp 75\.000\.000/);
  assert.ok(res.nextActions.some((a) => a.kind === "relasi"), "perlu menautkan MoU induk");
  const empty = an(MOU("PEMKAB TOBA"));
  assert.ok(empty.nextActions.some((a) => a.kind === "isi" && a.key === "endDate") || empty.fields.endDate);
});

test("Dugaan duplikat: mitra, jenis, tanggal mulai sama", () => {
  const docs = [{ id: "D1", documentNumber: "999/X", documentType: "MOU_LOI", partnerId: "PRT-TOBA", startDate: "2026-01-20", title: "Lain" }];
  const r = an(MOU("PEMKAB TOBA", "Berlaku sejak tanggal 20 Januari 2026."), { docs });
  assert.ok(r.flags.some((f) => f.code === "possible_duplicate"));
});

test("Field yang sering dikoreksi staf diturunkan keyakinannya", () => {
  const mem = { fieldStats: { documentNumber: { n: 4, corrected: 3 } } };
  const r = an(MOU("PEMKAB TOBA"), { memory: mem });
  assert.equal(r.fields.documentNumber.level, "SEDANG");
  assert.match(r.fields.documentNumber.note, /sering dikoreksi/);
});

test("Alternatif tanggal ditawarkan bila ada beberapa tanggal pada dokumen", () => {
  const r = an(MOU("PEMKAB TOBA", "Ditetapkan di Laguboti pada 25 Februari 2026.\nBerlaku sejak tanggal 1 Maret 2026."));
  const alts = (r.fields.signedDate.alts || []).map((a) => a.value);
  assert.ok(alts.includes("2026-03-01") || alts.includes("2026-02-25"));
});
