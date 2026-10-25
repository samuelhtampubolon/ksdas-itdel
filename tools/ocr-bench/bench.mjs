// Halaman uji OCR: menjalankan satu varian mesin/model/pra-proses atas daftar gambar. Dipanggil oleh run_bench.js.
import { OCRClient, supportsFastBuild } from "/repo/js/ocr/tw/lib.js";

async function fetchModel(url) {
  const r = await fetch(url);
  const buf = await r.arrayBuffer();
  if (!url.endsWith(".gz")) return buf;
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([buf]).stream().pipeThrough(ds);
  return await new Response(stream).arrayBuffer();
}
async function twEngine(modelUrls) {
  const wasm = await (await fetch("/repo/js/ocr/tw/" + (supportsFastBuild() ? "tesseract-core.wasm" : "tesseract-core-fallback.wasm"))).arrayBuffer();
  const client = new OCRClient({ wasmBinary: wasm, workerURL: "/repo/js/ocr/tw/tesseract-worker.js" });
  await client.loadModel(await fetchModel(modelUrls[0]));
  return {
    async ocr(bitmap) { await client.loadImage(bitmap); const t = await client.getText(); await client.clearImage(); return t; },
    async close() { await client.destroy(); }
  };
}
async function tjsEngine(langs) {
  if (typeof Tesseract === "undefined") throw new Error("tesseract.js tidak dimuat (aset lama dihapus)");
  const w = await Tesseract.createWorker(langs, 1, { workerPath: "/repo/js/ocr/worker.min.js", corePath: "/repo/js/ocr/", langPath: "/models/tjs", gzip: true });
  return { async ocr(bitmap, blob) { const r = await w.recognize(blob); return r.data.text; }, async close() { await w.terminate(); } };
}
const PREP = {
  none: null,
  gray2x(img) { return img; }
};
async function ksdasEngine(v) {
  return {
    async ocr(bitmap, blob) { const r = await KSDASOcr.recognize(blob, { session: {}, pack: v.pack }); window.__last = { lang: r.language && r.language.lang, pack: r.pack, conf: r.confidence }; return r.text; },
    async close() { await KSDASOcr.dispose(); }
  };
}
window.runVariant = async function (variant, items) {
  const t0 = performance.now();
  const eng = variant.engine === "ksdas" ? await ksdasEngine(variant) : variant.engine === "tjs" ? await tjsEngine(variant.langs) : await twEngine(variant.models);
  const init = performance.now() - t0;
  const out = [];
  for (const it of items) {
    const resp = await fetch("/bench/" + it.file);
    const blob = await resp.blob();
    let bmp = await createImageBitmap(blob);
    if (variant.prep && window.KSPrep) bmp = await window.KSPrep.run(bmp, variant.prep);
    const s = performance.now();
    let text = "";
    try { text = await eng.ocr(bmp, blob); } catch (e) { text = "[ERR] " + e.message; }
    out.push({ file: it.file, text, ms: performance.now() - s, meta: window.__last || null });
  }
  await eng.close();
  return { init, out };
};
window.benchReady = true;
