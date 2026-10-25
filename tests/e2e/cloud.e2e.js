// Uji E2E penyimpanan cloud: server Node dari paket dist/node (build-bundle), login, simpan, muat ulang, keluar.
// Jalankan: node tools/build-bundle.js node && node tests/e2e/cloud.e2e.js
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fx = (f) => path.join(__dirname, "..", "..", "sample-data", "uji", f);
const bundle = path.join(__dirname, "..", "..", "dist", "node");
let failed = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) failed++; };
(async () => {
  if (!fs.existsSync(bundle)) { console.log("Jalankan dulu: node tools/build-bundle.js node"); process.exit(2); }
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "ksdas-e2e-"));
  const port = 18300;
  const srv = spawn(process.execPath, [path.join(bundle, "cloud", "node", "server.js")], { env: Object.assign({}, process.env, { PORT: String(port), HOST: "127.0.0.1", KSDAS_DATA_DIR: data, KSDAS_PASSWORD: "sandi-e2e-123", KSDAS_TOKEN_SECRET: "rahasia-e2e-0123456789abcdef" }), stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 800));
  const base = "http://127.0.0.1:" + port + "/";
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("console", (m) => m.type() === "error" && !/401/.test(m.text()) && errs.push(m.text()));
  try {
    await page.goto(base);
    await page.waitForSelector("#login-form");
    ok(/Masuk ke penyimpanan cloud/.test(await page.innerText("main")), "tanpa login, halaman masuk tampil (data tidak termuat)");
    ok((await page.$("#lg-user")) === null, "penyedia rest hanya meminta kata sandi");
    await page.fill("#lg-pass", "salah"); await page.click("#login-form button[type=submit]");
    await page.waitForFunction(() => /Gagal masuk/.test(document.getElementById("lg-err").textContent));
    ok(true, "kata sandi salah ditolak: " + (await page.innerText("#lg-err")));
    await page.fill("#lg-pass", "sandi-e2e-123"); await page.click("#login-form button[type=submit]");
    await page.waitForSelector("aside .mark", { timeout: 15000 });
    ok(true, "login berhasil, aplikasi terbuka");
    ok(!/sandi-e2e/.test(await page.evaluate(() => JSON.stringify(Object.assign({}, sessionStorage, localStorage)))), "kata sandi tidak tersimpan di peramban");

    await page.goto(base + "#entri"); await page.waitForSelector("#files", { state: "attached" });
    await page.setInputFiles("#files", fx("MoU_ITDel_Samosir_2026.docx"));
    await page.waitForSelector('tr:has-text("031/ITDel/MoU/2026")', { timeout: 60000 });
    ok(true, "ekstraksi berjalan dan naskah tercatat");
    await new Promise((r) => setTimeout(r, 1200));
    const stateFile = path.join(data, "state.json");
    ok(fs.existsSync(stateFile) && /031\/ITDel\/MoU\/2026/.test(fs.readFileSync(stateFile, "utf8")), "state tertulis di folder data server");
    ok(fs.existsSync(path.join(data, "files")) && fs.readdirSync(path.join(data, "files")).some((f) => f.endsWith(".bin")), "berkas asli tersimpan di server");

    // muat ulang di konteks BARU (tanpa localStorage): data harus datang dari server setelah login
    const ctx2 = await b.newContext(); const p2 = await ctx2.newPage();
    await p2.goto(base); await p2.waitForSelector("#login-form");
    await p2.fill("#lg-pass", "sandi-e2e-123"); await p2.click("#login-form button[type=submit]");
    await p2.waitForSelector("aside .mark", { timeout: 15000 });
    await p2.goto(base + "#naskah"); await p2.waitForSelector("text=031/ITDel/MoU/2026", { timeout: 15000 });
    ok(true, "perangkat lain memuat data yang sama dari server setelah login");
    await p2.goto(base + "#penyimpanan"); await p2.waitForSelector(".modebanner");
    const banner = await p2.innerText(".modebanner");
    ok(/Cloud:/.test(banner), "halaman Penyimpanan menampilkan mode cloud: " + banner.split("\n")[0]);
    await p2.waitForSelector(".cards .card");
    ok(/1\s*berkas/.test(await p2.innerText(".cards")), "statistik berkas diambil dari server");
    await p2.click("#st-logout"); await p2.waitForSelector("#login-form");
    ok(true, "keluar mengembalikan ke halaman masuk");
    ok(errs.length === 0, "tanpa galat konsol: " + errs.join(" | "));
  } finally { await b.close(); srv.kill(); fs.rmSync(data, { recursive: true, force: true }); }
  console.log(failed ? "\nADA PENGUJIAN GAGAL" : "\nSEMUA PENGUJIAN LULUS");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
