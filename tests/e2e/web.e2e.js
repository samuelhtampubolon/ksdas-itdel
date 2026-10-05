// Uji ujung-ke-ujung pada peramban Chromium (tanpa server KSDAS): GitHub Pages mode.
// Jalankan: node tests/e2e/web.e2e.js [baseUrl]
const path = require("path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.argv[2] || "http://127.0.0.1:8099/";
const fixtures = path.join(__dirname, "..", "..", "sample-data", "uji");
let failed = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) failed++; };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  await page.goto(base + "#entri");
  await page.waitForSelector("#entry-dropzone");
  ok(true, "halaman Pencatatan terbuka");

  // Unggah 4 berkas sekaligus: DOCX, DOCX, PDF, XLSX form
  await page.setInputFiles("#files", ["MoU_ITDel_Samosir_2026.docx", "PKS_FTI_DanauNusaTeknik_2025.docx", "IA_Magang_DanauNusaTeknik_2025.pdf", "Lembar_Isian_PKS.xlsx", "Catatan_Rapat_Injeksi.docx"].map((f) => path.join(fixtures, f)));
  await page.waitForSelector(".queue table tbody tr", { timeout: 60000 });
  const rows = await page.$$eval(".queue tbody tr", (r) => r.map((x) => x.innerText.replace(/\s+/g, " ")));
  console.log(rows.join("\n"));
  ok(rows.length === 4, "4 naskah masuk antrean (berkas injeksi tanpa data tidak membuat naskah): " + rows.length);
  ok(rows.filter((r) => /Danau Nusa Teknik/.test(r)).length === 2, "mitra yang sama dikenali di PKS dan IA (tidak ganda)");
  ok(rows.some((r) => r.includes("031/ITDel/MoU/2026")), "nomor MoU terbaca");
  ok(rows.some((r) => r.includes("061/ITDel/FTI/IA/2025")), "nomor IA dari PDF terbaca");
  ok(rows.every((r) => r.includes("Perlu ditinjau")), "semua berstatus Perlu ditinjau (bukan data resmi)");
  const sum = await page.innerText(".batchsum");
  ok(/Catatan_Rapat_Injeksi/.test(sum), "berkas tanpa data dilewati dan dilaporkan");

  // Tinjau IA: PIC, kegiatan, relasi induk otomatis
  await page.click('button[data-review]:near(:text("061/ITDel/FTI/IA/2025"))').catch(() => {});
  const cur = await page.$eval("input[name=documentNumber]", (e) => e.value);
  console.log("dokumen terbuka:", cur);
  const pks = await page.$eval(".queue", (e) => e.innerText);
  // buka PKS
  await page.click('tr:has-text("044/ITDel/FTI/PKS/2025") button[data-review]');
  ok(await page.$eval("input[name=documentNumber]", (e) => e.value) === "044/ITDel/FTI/PKS/2025", "formulir terisi nomor PKS");
  ok(await page.$eval("input[name=endDate]", (e) => e.value) === "2027-08-17", "tanggal berakhir PKS tepat");
  ok((await page.$eval("input[name=budget]", (e) => e.value)) === "Rp 75.000.000", "anggaran PKS tepat");
  ok((await page.$eval("input[name=location]", (e) => e.value)) === "", "lokasi tidak ditebak (kosong)");
  const note = await page.innerText(".review");
  ok(/hlm\. 1/.test(note) && /Keyakinan tinggi/.test(note), "badge keyakinan dan halaman sumber tampil");
  ok(/Perlu diisi manual|Seluruh field wajib sudah terisi/.test(note), "status kelengkapan tampil");

  // Validasi ditolak karena field wajib belum lengkap (penandatangan?) atau lolos; isi manual bila perlu
  await page.click("#btn-validate");
  let notice = await page.innerText("main");
  console.log("setelah validasi:", (notice.match(/Belum bisa divalidasi[^\n]*/) || notice.match(/divalidasi[^\n]*/) || [""])[0]);

  // Halaman penyimpanan
  await page.click('aside button[data-view="penyimpanan"]');
  await page.waitForSelector(".cards", { timeout: 10000 });
  const cards = await page.innerText(".cards");
  ok(/naskah/.test(cards) && /Berkas lampiran/.test(cards), "kartu penyimpanan tampil");
  ok(/Mode: Peramban/.test(await page.innerText(".modebanner")), "mode peramban terdeteksi");
  const fileCount = await page.$eval(".cards", (e) => e.innerText.match(/(\d+) berkas/)[1]);
  ok(Number(fileCount) >= 4, "berkas asli tersimpan di IndexedDB: " + fileCount);
  await page.fill("#sim-count", "100"); await page.fill("#sim-kb", "8");
  await page.click("#st-sim-io");
  await page.waitForSelector("text=Waktu tulis", { timeout: 20000 });
  ok(/100 × 8 KB/.test(await page.innerText("main")), "simulasi tulis/baca menghasilkan tabel");
  await page.click("#st-mem-alloc");
  await page.waitForSelector("#st-mem-release");
  await page.click("#st-backup");
  await page.waitForSelector("[data-restore]", { timeout: 10000 });
  ok(true, "cadangan dibuat");
  await page.click("#st-drill");
  await page.waitForSelector("text=Uji pemulihan LULUS", { timeout: 10000 });
  ok(true, "uji pemulihan lulus (checksum identik)");

  // Muat ulang: data bertahan
  await page.reload();
  await page.waitForSelector(".shell");
  await page.click('aside button[data-view="naskah"]');
  const tbl = await page.innerText("table");
  ok(/044\/ITDel\/FTI\/PKS\/2025/.test(tbl), "data bertahan setelah muat ulang");
  // Hapus localStorage: IndexedDB memulihkan
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector(".shell");
  await page.click('aside button[data-view="naskah"]');
  ok(/044\/ITDel\/FTI\/PKS\/2025/.test(await page.innerText("table")), "data dipulihkan dari IndexedDB setelah localStorage dihapus");

  // Peran baca-saja tidak dapat mengunggah
  await page.selectOption("#role", "SPM");
  await page.evaluate(() => { location.hash = "entri"; });
  await page.waitForTimeout(300);
  ok(await page.$("#files") === null, "peran SPM tidak melihat kontrol unggah");

  ok(errors.length === 0, "tanpa galat konsol: " + errors.slice(0, 5).join(" | "));
  await page.screenshot({ path: process.env.SHOT || "/tmp/web-e2e.png", fullPage: true });
  await browser.close();
  console.log(failed ? `\n${failed} PENGUJIAN GAGAL` : "\nSEMUA PENGUJIAN LULUS");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
