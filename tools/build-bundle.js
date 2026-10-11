#!/usr/bin/env node
/*
 * KSDAS - Membuat paket siap-deploy (hanya berkas yang diperlukan, tanpa EXE/ZIP/tes).
 *
 *   node tools/build-bundle.js <target> [opsi configure.js] [--out <folder>] [--ocr-packs ind,deu,jpn]
 *     --ocr-packs mengurangi ukuran: hanya paket bahasa OCR yang disebut yang disertakan ("ind" selalu ada).
 *
 * Target:
 *   pages        dist/pages  -> situs statis untuk Cloudflare Pages (fungsi API ada di ./functions, deploy dari akar repo)
 *   node         dist/node   -> situs + server Node (Glitch, VPS, Render, dsb.)
 *   space        dist/space  -> Hugging Face Docker Space (Dockerfile + README berisi front matter)
 *   space-static dist/space-static -> Hugging Face static Space (API di tempat lain, wajib --api-base atau Supabase/Firebase)
 *   github       dist/github -> situs statis untuk GitHub Pages / hosting statis apa pun
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { apply } = require("./configure.js");
const ROOT = path.resolve(__dirname, "..");

function copyDir(src, dst, filter) {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (filter && !filter(s)) continue;
    if (e.isDirectory()) { fs.mkdirSync(d, { recursive: true }); copyDir(s, d, filter); } else if (e.isFile()) { fs.mkdirSync(dst, { recursive: true }); fs.copyFileSync(s, d); }
  }
}
function web(out, opts) {
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  fs.copyFileSync(path.join(ROOT, "index.html"), path.join(out, "index.html"));
  copyDir(path.join(ROOT, "css"), path.join(out, "css")); copyDir(path.join(ROOT, "js"), path.join(out, "js"));
  copyDir(path.join(ROOT, "sample-data", "uji"), path.join(out, "sample-data", "uji"), (f) => !f.endsWith(".py"));
}
const DOCKERFILE = `FROM node:20-alpine
ENV NODE_ENV=production PORT=7860 KSDAS_DATA_DIR=/data
RUN mkdir -p /data /app && chown -R node:node /data /app
WORKDIR /app
COPY --chown=node:node . .
USER node
EXPOSE 7860
CMD ["node", "cloud/node/server.js"]
`;
function front(sdk, title) { return `---\ntitle: ${title}\nemoji: 📄\ncolorFrom: blue\ncolorTo: indigo\nsdk: ${sdk}\n${sdk === "docker" ? "app_port: 7860\n" : ""}pinned: false\nlicense: other\n---\n\n# KSDAS IT Del\n\nPrototipe pencatatan dan ekstraksi naskah kerja sama. Kode sumber: https://github.com/samuelhtampubolon/ksdas-itdel\n${sdk === "docker" ? "\nSecret yang wajib diatur di Settings > Variables and secrets: KSDAS_PASSWORD, KSDAS_TOKEN_SECRET.\n" : ""}`; }

function main() {
  const [target, ...rest] = process.argv.slice(2);
  const o = {}; let provider = null;
  const map = { "--url": "url", "--anon-key": "anonKey", "--api-key": "apiKey", "--project-id": "projectId", "--storage-bucket": "storageBucket", "--api-base": "apiBase", "--out": "out", "--provider": "provider", "--ocr-packs": "ocrPacks" };
  for (let i = 0; i < rest.length; i++) { const k = map[rest[i]]; if (!k) throw new Error("Opsi tidak dikenal: " + rest[i]); o[k] = rest[++i]; }
  const out = path.resolve(o.out || path.join(ROOT, "dist", target || "x"));
  const defaults = { pages: "cloudflare", node: "node", space: "huggingface", "space-static": null, github: "browser" };
  if (!(target in defaults)) { console.error("Target: pages, node, space, space-static, github"); process.exit(1); }
  provider = o.provider || (o.url ? "supabase" : o.apiKey ? "firebase" : (target === "space-static" ? (o.apiBase ? "rest" : null) : defaults[target]));
  if (!provider) throw new Error("space-static memerlukan --api-base (server API) atau opsi Supabase/Firebase.");
  web(out, o);
  if (target === "node" || target === "space") {
    fs.mkdirSync(path.join(out, "cloud", "node"), { recursive: true });
    fs.copyFileSync(path.join(ROOT, "cloud", "node", "server.js"), path.join(out, "cloud", "node", "server.js"));
    fs.writeFileSync(path.join(out, "package.json"), JSON.stringify({ name: "ksdas-itdel", version: "1.0.0", private: true, scripts: { start: "node cloud/node/server.js" }, engines: { node: ">=18" } }, null, 2) + "\n");
  }
  if (target === "space") { fs.writeFileSync(path.join(out, "Dockerfile"), DOCKERFILE); fs.writeFileSync(path.join(out, "README.md"), front("docker", "KSDAS IT Del")); }
  if (target === "space-static") fs.writeFileSync(path.join(out, "README.md"), front("static", "KSDAS IT Del"));
  if (target === "pages") fs.writeFileSync(path.join(out, "_headers"), "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n  Strict-Transport-Security: max-age=31536000\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n");
  if (o.ocrPacks) {
    const keep = new Set(["ind"].concat(o.ocrPacks.split(",").map((x) => x.trim()).filter(Boolean)));
    const mdir = path.join(out, "js", "ocr", "models"), mf = path.join(mdir, "manifest.json"), m = JSON.parse(fs.readFileSync(mf, "utf8"));
    for (const k of Object.keys(m.packs)) if (!keep.has(k)) { fs.rmSync(path.join(mdir, m.packs[k].file), { force: true }); delete m.packs[k]; }
    for (const k of keep) if (!m.packs[k]) throw new Error("Paket OCR tidak dikenal: " + k);
    fs.writeFileSync(mf, JSON.stringify(m, null, 1));
  }
  const r = apply(out, provider, o);
  console.log("Paket " + target + " siap di " + path.relative(process.cwd(), out) + " (penyedia: " + r.config.provider + ")");
}
if (require.main === module) { try { main(); } catch (e) { console.error("GALAT: " + e.message); process.exit(1); } }
