// Uji E2E adaptor Supabase dan Firebase di peramban: layanan ditiru lewat page.route, CSP hasil configure.js ikut diuji.
// Jalankan: node tests/e2e/cloud2.e2e.js
const path = require("path");
const fs = require("fs");
const http = require("http");
const { execFileSync } = require("child_process");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { fakeSupabase, fakeFirebase } = require("../helpers-cloud.js");
const ROOT = path.join(__dirname, "..", "..");
const fx = (f) => path.join(ROOT, "sample-data", "uji", f);
let failed = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) failed++; };
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".wasm": "application/wasm", ".gz": "application/gzip" };
function serve(dir) {
  const s = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split("?")[0]); if (p === "/") p = "/index.html"; const f = path.join(dir, p); if (!f.startsWith(dir) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r); });
  return new Promise((res) => s.listen(0, "127.0.0.1", () => res(s)));
}
async function bridge(page, prefix, fake) {
  await page.route(prefix + "**", async (route) => {
    const req = route.request(); const buf = req.postDataBuffer();
    const r = await fake.fetch(req.url(), { method: req.method(), headers: req.headers(), body: buf ? (req.headers()["content-type"] || "").includes("json") || (req.headers()["content-type"] || "").includes("x-www-form") ? buf.toString("utf8") : new Uint8Array(buf) : undefined });
    const body = Buffer.from(await r.arrayBuffer());
    await route.fulfill({ status: r.status, headers: Object.fromEntries([...r.headers.entries()].concat([["access-control-allow-origin", "*"], ["access-control-expose-headers", "content-range"]])), body });
  });
}
async function run(name, args, fake, prefix, user, pass) {
  execFileSync(process.execPath, [path.join(ROOT, "tools", "build-bundle.js"), "github", "--out", path.join(ROOT, "dist", "e2e-" + name)].concat(args), { stdio: "ignore" });
  const srv = await serve(path.join(ROOT, "dist", "e2e-" + name)); const base = "http://127.0.0.1:" + srv.address().port + "/";
  const b = await chromium.launch(); const page = await (await b.newContext()).newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("console", (m) => m.type() === "error" && !/40[014]/.test(m.text()) && errs.push(m.text()));
  await bridge(page, prefix, fake);
  try {
    await page.goto(base); await page.waitForSelector("#login-form");
    ok((await page.$("#lg-user")) !== null, name + ": meminta surel dan kata sandi");
    await page.fill("#lg-user", user); await page.fill("#lg-pass", "salah"); await page.click("#login-form button[type=submit]");
    await page.waitForFunction(() => /Gagal masuk/.test(document.getElementById("lg-err").textContent));
    ok(true, name + ": login salah ditolak");
    await page.fill("#lg-pass", pass); await page.click("#login-form button[type=submit]");
    await page.waitForSelector("aside .mark", { timeout: 20000 }).catch(async (e) => { console.log("ERR", await page.evaluate(() => document.body.innerText.slice(0, 300)), errs.join("|")); throw e; });
    ok(true, name + ": login berhasil");
    await page.goto(base + "#entri"); await page.waitForSelector("#files", { state: "attached" });
    await page.setInputFiles("#files", fx("MoU_ITDel_Samosir_2026.docx"));
    await page.waitForSelector('tr:has-text("031/ITDel/MoU/2026")', { timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));
    ok(true, name + ": naskah tercatat via ekstraksi otomatis");
    await page.goto(base + "#penyimpanan"); await page.waitForSelector(".cards .card", { timeout: 20000 });
    const t = await page.innerText(".modebanner"); ok(/Cloud:/.test(t), name + ": mode cloud tampil");
    ok(/1\s*berkas/.test(await page.innerText(".cards")), name + ": 1 berkas tersimpan di penyedia");
    await page.click("#st-backup"); await page.waitForSelector("text=Cadangan backup_", { timeout: 20000 });
    ok(true, name + ": cadangan dibuat");
    await page.click("#st-drill"); await page.waitForSelector("text=Uji pemulihan LULUS", { timeout: 20000 });
    ok(true, name + ": uji pemulihan lulus");
    ok(errs.length === 0, name + ": tanpa galat konsol/CSP: " + errs.join(" | "));
  } finally { await b.close(); srv.close(); }
}
(async () => {
  const sbBase = "https://abc.supabase.co";
  const anon = "eyJhbGciOiJIUzI1NiJ9." + Buffer.from('{"role":"anon"}').toString("base64url") + ".sig";
  await run("supabase", ["--url", sbBase, "--anon-key", anon], fakeSupabase(sbBase, anon, "staf@del.ac.id", "sandi-uji-123"), sbBase + "/", "staf@del.ac.id", "sandi-uji-123");
  const fb = fakeFirebase("ksdas-uji", "AIzaSyTESTTESTTESTTESTTESTTESTTESTTEST", "staf@del.ac.id", "sandi-uji-123");
  await run("firebase", ["--api-key", "AIzaSyTESTTESTTESTTESTTESTTESTTESTTEST", "--project-id", "ksdas-uji"], fb, /^https:\/\/(identitytoolkit|securetoken|firestore)\.googleapis\.com\/.*/.source ? "https://*.googleapis.com/" : "", "staf@del.ac.id", "sandi-uji-123");
  console.log(failed ? "\nADA PENGUJIAN GAGAL" : "\nSEMUA PENGUJIAN LULUS");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
