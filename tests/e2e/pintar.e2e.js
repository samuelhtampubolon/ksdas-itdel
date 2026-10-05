// Uji E2E fitur cerdas: saran satu klik, ringkasan, langkah berikutnya, pembelajaran dari koreksi staf.
const path = require("path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.argv[2] || "http://127.0.0.1:8099/";
const fx = (f) => path.join(__dirname, "..", "..", "sample-data", "uji", f);
let failed = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) failed++; };
(async () => {
  const b = await chromium.launch();
  const page = await (await b.newContext()).newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await page.goto(base + "#entri"); await page.waitForSelector("#files", { state: "attached" });

  // 1. MoU: ringkasan, langkah berikutnya, saran program
  await page.setInputFiles("#files", fx("MoU_ITDel_Samosir_2026.docx"));
  await page.waitForSelector(".review .summarybox", { timeout: 60000 });
  const sum = await page.innerText(".summarybox");
  ok(/MoU\/LOI antara Institut Teknologi Del dan Pemerintah Kabupaten Samosir/.test(sum) && /Berlaku 20 Januari 2026 sampai 19 Januari 2029/.test(sum), "ringkasan otomatis tampil: " + sum.slice(0, 90));
  const acts = await page.innerText(".actions");
  ok(/Isi Fakultas/.test(acts) && /Konfirmasi mitra baru/.test(acts), "langkah berikutnya: isi fakultas, konfirmasi mitra baru");
  const chips = await page.$$eval('[data-alt-key="programId"]', (e) => e.map((x) => x.dataset.altVal));
  ok(chips.length > 0, "saran program studi (tidak diisi otomatis): " + chips.join(","));
  ok((await page.$eval("select[name=programId]", (e) => e.value)) === "", "program studi tetap kosong sebelum staf memilih");
  await page.click('[data-alt-key="programId"]');
  const progVal = await page.$eval("select[name=programId]", (e) => e.value);
  ok(progVal === chips[0], "satu klik mengisi program studi: " + progVal);

  // 2. PKS: koreksi mitra oleh staf lalu validasi, alias dipelajari
  await page.setInputFiles("#files", fx("PKS_FTI_DanauNusaTeknik_2025.docx"));
  await page.waitForSelector('tr:has-text("044/ITDel/FTI/PKS/2025")', { timeout: 60000 });
  await page.click('tr:has-text("044/ITDel/FTI/PKS/2025") button[data-review]');
  const opts = await page.$$eval("select[name=partnerId] option", (o) => o.map((x) => ({ v: x.value, t: x.textContent })));
  const target = opts.find((o) => o.v && !/baru, konfirmasi/.test(o.t));
  await page.selectOption("select[name=partnerId]", target.v);
  await page.click("#btn-validate");
  await page.waitForSelector("text=divalidasi", { timeout: 10000 });
  ok(true, "PKS divalidasi dengan koreksi mitra ke: " + target.t);

  // 3. IA dengan nama mitra yang sama: harus langsung dikenali dari memori
  await page.setInputFiles("#files", fx("IA_Magang_DanauNusaTeknik_2025.pdf"));
  await page.waitForSelector('tr:has-text("061/ITDel/FTI/IA/2025")', { timeout: 60000 });
  const row = await page.innerText('tr:has-text("061/ITDel/FTI/IA/2025")');
  ok(row.includes(target.t), "IA mengenali mitra hasil koreksi staf (alias dipelajari): " + row.replace(/\s+/g, " ").slice(0, 120));
  await page.click('tr:has-text("061/ITDel/FTI/IA/2025") button[data-review]');
  const note = await page.innerText(".review");
  ok(/Kandidat induk/.test(note) && /044\/ITDel\/FTI\/PKS\/2025/.test(note), "kandidat induk dengan alasan tampil");
  await page.click('aside button[data-view="penyimpanan"]'); await page.waitForSelector(".cards");
  ok(/1\s+alias mitra/.test(await page.innerText(".cards")), "kartu memori ekstraksi menunjukkan 1 alias");
  ok(errs.length === 0, "tanpa galat konsol: " + errs.slice(0, 3).join(" | "));
  await b.close();
  console.log(failed ? `\n${failed} PENGUJIAN GAGAL` : "\nSEMUA PENGUJIAN LULUS");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
