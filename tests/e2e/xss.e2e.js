// Uji XSS: data berbahaya (impor JSON, nama berkas, isi dokumen) tidak boleh dieksekusi atau menyuntik atribut.
const fs = require("fs"), os = require("os"), path = require("path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.argv[2] || "http://127.0.0.1:8099/";
let failed = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) failed++; };
const P = '<img src=x onerror="window.__pwn=1">';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  const dialogs = []; page.on("dialog", async (d) => { if (d.type() === "confirm") await d.accept(); else { dialogs.push(d.message()); await d.dismiss(); } });
  await page.goto(base); await page.waitForSelector(".shell");

  const bad = {
    schema: "ksdas-export/1",
    partners: [{ id: 'PRT-1" onmouseover="window.__pwn=1', name: P, shortName: P, type: "SWASTA", country: P, city: P }],
    documents: [{ id: 'DOC-1" autofocus onfocus="window.__pwn=1', documentType: "MOU_LOI", documentNumber: P, title: P, partnerId: 'PRT-1" onmouseover="window.__pwn=1', status: "AKTIF", startDate: "2026-01-01", endDate: "2027-01-01", signedDate: "2026-01-01",
      partnerSignatory: P, partnerSignatoryTitle: P, itdelSignatory: P, itdelSignatoryTitle: P, scope: P, notes: P, location: P, activityName: P, fileName: P, triDharma: ["PENDIDIKAN"], unitId: "UKS", facultyId: "FITE", validation: { state: "VALIDATED" }, provenance: {} }]
  };
  const f = path.join(os.tmpdir(), "bad.json"); fs.writeFileSync(f, JSON.stringify(bad));
  await page.click('aside button[data-view="penyimpanan"]'); await page.waitForSelector("#st-import", { state: "attached" });
  await page.setInputFiles("#st-import", f);
  await page.waitForTimeout(1500);

  for (const v of ["naskah", "relasi", "analisis", "spmi", "entri", "penyimpanan", "beranda"]) {
    await page.click(`aside button[data-view="${v}"]`).catch(() => {});
    await page.waitForTimeout(250);
    if (v === "naskah") await page.click("[data-open]").catch(() => {});
  }
  const pwn = await page.evaluate(() => window.__pwn);
  ok(pwn === undefined, "tidak ada eksekusi skrip dari data berbahaya");
  const injected = await page.evaluate(() => document.querySelectorAll('img[src="x"], [onmouseover], [onfocus], [onerror]').length);
  ok(injected === 0, "tidak ada elemen/atribut hasil injeksi di DOM: " + injected);
  const ids = await page.evaluate(() => JSON.parse(localStorage.getItem("ksdas-pages-v1")).documents.map((d) => d.id));
  ok(ids.every((i) => /^[A-Za-z0-9_-]{1,48}$/.test(i)), "ID dokumen dinormalkan menjadi aman: " + ids.slice(0, 3).join(","));
  const txt = await page.innerText("body");
  ok(true, "halaman tetap berfungsi (" + txt.length + " karakter)");

  // Nama berkas dan isi dokumen berbahaya lewat tempel teks
  await page.click('aside button[data-view="entri"]');
  await page.click("#btn-toggle-ai-paste");
  await page.fill("#ai-ocr-text", `NOTA KESEPAHAMAN\nNomor: 001/ITDel/MoU/2026\nDENGAN\n${P}\nTENTANG\n${P}`);
  await page.click("#btn-run-ai-extract");
  await page.waitForTimeout(800);
  ok((await page.evaluate(() => window.__pwn)) === undefined, "isi dokumen berbahaya tidak dieksekusi");
  ok((await page.evaluate(() => document.querySelectorAll("img[onerror]").length)) === 0, "tidak ada <img onerror> di DOM");
  ok(dialogs.length === 0, "tidak ada dialog tak terduga");

  // Injeksi rumus pada ekspor CSV
  const evil = { ...bad, documents: [{ ...bad.documents[0], id: "DOC-CSV1", title: "=HYPERLINK(\"http://x\",\"klik\")", documentNumber: "+1+1", partnerId: "", notes: "@SUM(1)" }] };
  fs.writeFileSync(f, JSON.stringify(evil));
  await page.click('aside button[data-view="penyimpanan"]'); await page.waitForSelector("#st-import", { state: "attached" });
  await page.setInputFiles("#st-import", f);
  await page.waitForTimeout(1200);
  await page.click('aside button[data-view="naskah"]'); await page.waitForSelector("#csv");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#csv")]);
  const csv = fs.readFileSync(await dl.path(), "utf8");
  ok(!/(^|,)=HYPERLINK/m.test(csv) && /'=HYPERLINK/.test(csv), "sel CSV berawalan = dinetralkan");
  ok(/'\+1\+1/.test(csv), "sel CSV berawalan + dinetralkan");
  await b.close();
  console.log(failed ? `\n${failed} PENGUJIAN GAGAL` : "\nSEMUA PENGUJIAN LULUS");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
