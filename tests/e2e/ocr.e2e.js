// Uji OCR lokal (Tesseract WASM) pada gambar scan.
const path = require("path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.argv[2] || "http://127.0.0.1:8099/";
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  const external = []; page.on("request", (r) => { if (!r.url().startsWith(base) && !r.url().startsWith("blob:") && !r.url().startsWith("data:")) external.push(r.url()); });
  await page.goto(base + "#entri");
  await page.setInputFiles("#files", path.join(__dirname, "..", "..", "sample-data", "uji", "Scan_MoU_Contoh.png"));
  await page.waitForSelector(".queue tbody tr", { timeout: 120000 });
  const row = await page.innerText(".queue tbody tr");
  console.log(row.replace(/\s+/g, " "));
  const flags = await page.innerText(".review").catch(() => "");
  console.log(flags.slice(0, 600));
  const ok = /015\/ITDel\/MoU\/2026/.test(row);
  console.log(ok ? "PASS OCR membaca nomor dari gambar" : "FAIL OCR");
  console.log("permintaan keluar (harus kosong):", external);
  console.log("galat:", errs);
  await browser.close();
  process.exit(ok && !external.length ? 0 : 1);
})();
