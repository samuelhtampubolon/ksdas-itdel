"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { X, run, pdfjs, seedPartners } = require("./helpers");

const val = (res, k) => (res.fields[k] ? res.fields[k].value : undefined);

test("MoU DOCX: nilai tepat, tanpa tebakan", async () => {
  const { res } = await run("MoU_ITDel_Samosir_2026.docx");
  assert.equal(val(res, "documentType"), "MOU_LOI");
  assert.equal(val(res, "documentNumber"), "031/ITDel/MoU/2026");
  assert.equal(val(res, "title"), "Pengembangan Sistem Informasi Desa dan Pelatihan Sumber Daya Manusia");
  assert.equal(val(res, "signedDate"), "2026-01-20");
  assert.equal(val(res, "startDate"), "2026-01-20");
  assert.equal(val(res, "endDate"), "2029-01-19");
  assert.equal(res.fields.endDate.level, "SEDANG", "tanggal hasil hitung durasi harus ditandai perlu diperiksa");
  assert.equal(val(res, "itdelSignatory"), "Dr. Arnaldo Marulitua Sinaga, S.T., M.InfoTech.");
  assert.equal(val(res, "itdelSignatoryTitle"), "Rektor Institut Teknologi Del");
  assert.equal(val(res, "partnerSignatory"), "Ir. Mangihut Pasaribu, M.Si.");
  assert.equal(val(res, "partnerSignatoryTitle"), "Bupati Samosir");
  assert.ok(res.partnerDraft && res.partnerDraft.name === "Pemerintah Kabupaten Samosir");
  assert.equal(res.partnerDraft.type, "PEMERINTAH");
  assert.equal(res.partnerDraft.country, "Indonesia");
  assert.match(val(res, "notes"), /100\.3\.4\/118\/Tapem\/2026/);
  // Tidak boleh menebak: fakultas, prodi, lokasi, anggaran tidak ada di dokumen
  for (const k of ["facultyId", "programId", "location", "budget", "activityName", "pic"]) assert.equal(res.fields[k], undefined, k + " tidak boleh terisi");
  assert.ok(res.missing.some((m) => m.key === "facultyId"));
  // Setiap field membawa halaman dan kutipan sumber
  for (const [k, f] of Object.entries(res.fields)) { assert.ok(f.source, k + " tanpa sumber"); assert.ok(f.page >= 1, k + " tanpa halaman"); assert.ok(f.method, k); }
});

test("PKS DOCX: tanggal terbilang, mitra terdaftar, rujukan MoU", async () => {
  const { res } = await run("PKS_FTI_DanauNusaTeknik_2025.docx");
  assert.equal(val(res, "documentType"), "PKS_MOA");
  assert.equal(val(res, "documentNumber"), "044/ITDel/FTI/PKS/2025");
  assert.equal(val(res, "signedDate"), "2025-08-18");
  assert.equal(val(res, "startDate"), "2025-08-18");
  assert.equal(val(res, "endDate"), "2027-08-17");
  assert.equal(val(res, "partnerId"), "PRT-DNT");
  assert.equal(val(res, "facultyId"), "FTI");
  assert.equal(val(res, "programId"), "MR");
  assert.equal(val(res, "budget"), "Rp 75.000.000");
  assert.equal(val(res, "itdelSignatory"), "Dr. Fitriani Tupa Ronauli Silalahi, S.Si., M.Si.");
  assert.equal(res.parentSuggestion.number, "012/ITDel/MoU/2024");
  assert.equal(res.parentSuggestion.unresolved, true);
});

test("PKS: rujukan induk ditautkan bila MoU sudah ada di basis data", async () => {
  const docs = [{ id: "DOC-MOU", documentNumber: "012/ITDel/MoU/2024", documentType: "MOU_LOI" }];
  const { res } = await run("PKS_FTI_DanauNusaTeknik_2025.docx", { docs });
  assert.equal(res.parentSuggestion.id, "DOC-MOU");
  assert.equal(res.parentSuggestion.level, "TINGGI");
});

test("IA PDF: kegiatan, PIC, tanggal pelaksanaan, blok tanda tangan", { skip: !pdfjs }, async () => {
  const { res, read } = await run("IA_Magang_DanauNusaTeknik_2025.pdf", null, { pdfjsLib: pdfjs });
  assert.equal(read.pages.length, 2);
  assert.equal(val(res, "documentType"), "IA");
  assert.equal(val(res, "documentNumber"), "061/ITDel/FTI/IA/2025");
  assert.equal(val(res, "activityName"), "Magang Industri Manajemen Rekayasa Semester Ganjil 2025/2026");
  assert.equal(val(res, "pic"), "Rina Situmorang, S.T., M.T.");
  assert.equal(val(res, "startDate"), "2025-09-01");
  assert.equal(val(res, "endDate"), "2026-02-28");
  assert.equal(val(res, "budget"), "Rp 12.500.000");
  assert.equal(val(res, "location"), "Medan");
  assert.equal(val(res, "partnerId"), "PRT-DNT");
  assert.equal(res.fields.activityName.page, 2, "halaman sumber harus tepat");
  assert.equal(val(res, "itdelSignatory"), "Dr. Fitriani Tupa Ronauli Silalahi, S.Si., M.Si.");
  // nomor dokumen berisi "FTI" tidak boleh dianggap sebagai sebutan fakultas
  assert.equal(res.fields.facultyId.page, 2);
  const docs = [{ id: "DOC-PKS", documentNumber: "044/ITDel/FTI/PKS/2025", documentType: "PKS_MOA" }];
  const again = X.analyze({ pages: read.pages, fileName: "x.pdf" }, { partners: seedPartners, docs });
  assert.equal(again.parentSuggestion.id, "DOC-PKS");
});

test("Teks berisi perintah ke sistem tidak dieksekusi dan tidak mengisi data", async () => {
  const { res } = await run("Catatan_Rapat_Injeksi.docx");
  assert.deepEqual(Object.keys(res.fields), []);
  assert.ok(res.flags.some((f) => f.code === "instruction_like_text"));
});

test("Lembar isian Excel berlabel", async () => {
  const { res } = await run("Lembar_Isian_PKS.xlsx");
  assert.equal(val(res, "documentNumber"), "090/ITDel/PKS/2026");
  assert.equal(val(res, "documentType"), "PKS_MOA");
  assert.equal(val(res, "endDate"), "2029-02-09");
  assert.equal(val(res, "programId"), "IF");
  assert.equal(val(res, "facultyId"), "FITE");
  assert.equal(res.partnerDraft.name, "PT Sinar Data Pratama");
});

test("Excel registri banyak baris dibaca per baris, tanggal serial dan teks", async () => {
  const { read } = await run("Daftar_Kerja_Sama.xlsx");
  const reg = X.detectRegistry(read.sheets);
  assert.equal(reg.length, 2);
  assert.equal(reg[0].values.documentNumber, "007/ITDel/MoU/2024");
  assert.equal(reg[0].values.endDate, "2027-03-04");
  assert.equal(reg[1].values.signedDate, "05/04/2024");
  assert.equal(reg[0].sheet, "Daftar");
});

test("Validasi berkas: ekstensi palsu, ukuran, biner", () => {
  const exe = new Uint8Array([0x4D, 0x5A, 0, 0]);
  assert.match(X.detectKind("surat.pdf", exe, 4).error, /tidak sesuai/);
  assert.match(X.detectKind("malware.exe", exe, 4).error, /tidak didukung/);
  assert.match(X.detectKind("besar.pdf", new Uint8Array([0x25, 0x50, 0x44, 0x46]), 26 * 1048576).error, /Ukuran/);
  assert.equal(X.detectKind("a.pdf", new Uint8Array([0x25, 0x50, 0x44, 0x46]), 10).kind, "pdf");
  assert.equal(X.detectKind("a.docx", new Uint8Array([0x50, 0x4B, 3, 4]), 10).kind, "docx");
});

test("Tanggal Indonesia: terbilang, angka, dan format numerik", () => {
  assert.equal(X.findDates("tanggal delapan belas bulan Agustus tahun dua ribu dua puluh lima")[0].iso, "2025-08-18");
  assert.equal(X.findDates("tanggal 20 (dua puluh) bulan Januari tahun 2026")[0].iso, "2026-01-20");
  assert.equal(X.findDates("pada 5 Mei 2024")[0].iso, "2024-05-05");
  assert.equal(X.findDates("31/12/2025")[0].iso, "2025-12-31");
  assert.equal(X.findDates("2025-02-30").length, 0, "tanggal tidak valid ditolak");
  assert.equal(X.wordsToInt("dua ribu dua puluh enam"), 2026);
});
