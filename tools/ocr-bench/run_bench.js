#!/usr/bin/env node
// Menjalankan benchmark OCR. Pemakaian:
//   node run_bench.js <serveRoot> <varian.json> <hasil.json> [jumlahPararel]
// serveRoot berisi: repo/ (symlink repositori), bench/ (gambar+manifest.json), models/...
const fs = require("fs"), path = require("path"), http = require("http");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const [root, variantsFile, outFile, par = "3"] = process.argv.slice(2);
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".wasm": "application/wasm", ".png": "image/png", ".json": "application/json", ".gz": "application/octet-stream" };
const server = http.createServer((q, r) => {
  const p = path.join(root, decodeURIComponent(q.url.split("?")[0]));
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream" }); r.end(d); } });
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const variants = JSON.parse(fs.readFileSync(variantsFile, "utf8"));
  let manifest = JSON.parse(fs.readFileSync(path.join(root, "bench", "manifest.json"), "utf8"));
  if (process.env.CONDS) manifest = manifest.filter((m) => process.env.CONDS.split(",").includes(m.cond));
  if (process.env.LANGS) manifest = manifest.filter((m) => process.env.LANGS.split(",").includes(m.lang));
  const browser = await chromium.launch();
  const results = {};
  for (const v of variants) {
    const chunks = Array.from({ length: +par }, () => []);
    manifest.forEach((m, i) => chunks[i % chunks.length].push(m));
    const t0 = Date.now();
    const parts = await Promise.all(chunks.filter((c) => c.length).map(async (items) => {
      const page = await browser.newPage();
      await page.goto(base + "/repo/tools/ocr-bench/bench.html");
      await page.waitForFunction("window.benchReady", null, { timeout: 30000 });
      const res = await page.evaluate(([vv, ii]) => window.runVariant(vv, ii), [v, items]);
      await page.close();
      return res;
    }));
    results[v.name] = { variant: v, init: parts.map((p) => p.init), out: parts.flatMap((p) => p.out), wall: (Date.now() - t0) / 1000 };
    console.log(`${v.name}: ${results[v.name].out.length} gambar, ${results[v.name].wall.toFixed(0)} dtk`);
  }
  fs.writeFileSync(outFile, JSON.stringify(results));
  await browser.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
