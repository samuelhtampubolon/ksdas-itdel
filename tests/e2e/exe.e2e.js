// Uji ujung-ke-ujung mode EXE (server lokal): data harus tertulis ke disk dan bertahan antar sesi.
// Jalankan: node tests/e2e/exe.e2e.js <baseUrl> <dbDir> [restartCmd]
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.argv[2] || "http://127.0.0.1:18100/";
const dbDir = process.argv[3] || "/tmp/ksdas_test/db";
const fixtures = path.join(__dirname, "..", "..", "sample-data", "uji");
let failed = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) failed++; };

(async () => {
  const browser = await chromium.launch();
  let ctx = await browser.newContext({ acceptDownloads: true });
  let page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(base + "#entri");
  await page.waitForSelector("#entry-dropzone");

  await page.setInputFiles("#files", ["MoU_ITDel_Samosir_2026.docx", "PKS_FTI_DanauNusaTeknik_2025.docx", "IA_Magang_DanauNusaTeknik_2025.pdf"].map((f) => path.join(fixtures, f)));
  await page.waitForSelector(".queue tbody tr", { timeout: 60000 });
  await page.waitForTimeout(800);

  const tables = path.join(dbDir, "tables");
  const docs = JSON.parse(fs.readFileSync(path.join(tables, "naskah_kerjasama.json"), "utf8"));
  ok(docs.length >= 13, "tabel naskah_kerjasama.json di disk berisi " + docs.length + " naskah (10 contoh + 3 unggahan)");
  ok(docs.some((d) => d.documentNumber === "044/ITDel/FTI/PKS/2025"), "PKS hasil ekstraksi tertulis di disk");
  const pk = docs.find((d) => d.documentNumber === "061/ITDel/FTI/IA/2025");
  ok(pk && pk.parentId, "IA otomatis tertaut ke PKS induk dari rujukan nomor");
  const dos = fs.readdirSync(path.join(dbDir, "dosir_lampiran"));
  ok(dos.length === 3, "3 berkas asli tersimpan di dosir_lampiran: " + dos.join(", "));
  ok(dos.every((f) => /^DOC-[A-Z0-9]+\.(docx|pdf)$/.test(f)), "nama berkas dibuat server (bukan nama asli)");
  const idx = JSON.parse(fs.readFileSync(path.join(tables, "lampiran_berkas.json"), "utf8"));
  ok(idx.length === 3 && idx.every((r) => /^[0-9a-f]{64}$/.test(r.sha256)), "indeks lampiran memuat SHA-256");
  const audit = fs.readFileSync(path.join(tables, "audit_trail_log.jsonl"), "utf8").trim().split("\n");
  ok(audit.some((l) => l.includes('"UPLOAD"')), "audit UPLOAD tercatat: " + audit.length + " baris");

  // Halaman penyimpanan
  await page.click('aside button[data-view="penyimpanan"]');
  await page.waitForSelector(".cards");
  ok(/Mode: Server lokal/.test(await page.innerText(".modebanner")), "mode server lokal terdeteksi");
  const cards = await page.innerText(".cards");
  ok(/Working set/.test(cards) && /Disk komputer/.test(cards), "kartu memori proses dan disk tampil");
  await page.fill("#sim-count", "200"); await page.fill("#sim-kb", "4");
  await page.click("#st-sim-io");
  await page.waitForSelector("text=Waktu tulis", { timeout: 30000 });
  ok(fs.existsSync(path.join(dbDir, "simulasi", "sim.jsonl")), "simulasi menulis berkas nyata ke disk");
  await page.click("#st-backup");
  await page.waitForSelector("[data-restore]", { timeout: 15000 });
  ok(fs.readdirSync(path.join(dbDir, "backups")).length >= 1, "cadangan dibuat di folder backups");
  await page.click("#st-drill");
  await page.waitForSelector("text=Uji pemulihan LULUS", { timeout: 15000 });
  ok(true, "uji pemulihan dari disk lulus (checksum identik)");
  const rawBackup = fs.readdirSync(path.join(dbDir, "backups"))[0];
  ok(fs.existsSync(path.join(dbDir, "backups", rawBackup, "manifest.json")), "manifest SHA-256 cadangan ada");

  // Sesi baru (tanpa localStorage/IndexedDB): data harus dimuat dari disk
  await ctx.close();
  ctx = await browser.newContext();
  page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "#naskah");
  await page.waitForSelector("table");
  const tbl = await page.innerText("table");
  ok(/044\/ITDel\/FTI\/PKS\/2025/.test(tbl) && /061\/ITDel\/FTI\/IA\/2025/.test(tbl), "sesi baru memuat data dari disk");

  // Unduh berkas asli lewat server
  const blobOk = await page.evaluate(async () => {
    const t = document.querySelector('meta[name="ksdas-token"]').content;
    const st = await (await fetch("api/state", { headers: { "X-KSDAS-Token": t } })).json();
    const d = st.documents.find((x) => x.documentNumber === "044/ITDel/FTI/PKS/2025");
    const r = await fetch("api/files/" + d.id, { headers: { "X-KSDAS-Token": t } });
    const b = new Uint8Array(await r.arrayBuffer());
    return r.ok && b[0] === 0x50 && b[1] === 0x4B && r.headers.get("content-disposition").includes("attachment");
  });
  ok(blobOk, "berkas asli dapat diunduh kembali dari server (PK zip, attachment)");

  // Keamanan API
  const sec = await page.evaluate(async () => {
    const t = document.querySelector('meta[name="ksdas-token"]').content;
    const r1 = await fetch("api/state");
    const r2 = await fetch("api/files/..%2f..%2fetc", { headers: { "X-KSDAS-Token": t } });
    const r3 = await fetch("api/files/DOC-TEST1?name=x.exe", { method: "PUT", headers: { "X-KSDAS-Token": t }, body: new Uint8Array([0x4d, 0x5a, 0, 0]) });
    const r4 = await fetch("api/files/DOC-TEST2?name=x.pdf", { method: "PUT", headers: { "X-KSDAS-Token": t }, body: new Uint8Array([1, 2, 3, 4]) });
    const r5 = await fetch("api/restore", { method: "POST", headers: { "X-KSDAS-Token": t }, body: JSON.stringify({ name: "../../x" }) });
    return [r1.status, r2.status, r3.status, r4.status, r5.status];
  });
  ok(sec[0] === 401, "API tanpa token ditolak (401)");
  ok(sec[1] === 400 || sec[1] === 404, "path traversal pada ID berkas ditolak: " + sec[1]);
  ok(sec[2] === 415, "unggah .exe ditolak (415)");
  ok(sec[3] === 415, "ekstensi .pdf dengan isi palsu ditolak (415)");
  ok(sec[4] === 400, "nama cadangan berbahaya ditolak (400)");

  ok(errors.length === 0, "tanpa galat konsol: " + errors.slice(0, 3).join(" | "));
  await page.screenshot({ path: "/tmp/exe-e2e.png", fullPage: true });
  await browser.close();
  console.log(failed ? `\n${failed} PENGUJIAN GAGAL` : "\nSEMUA PENGUJIAN LULUS");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
