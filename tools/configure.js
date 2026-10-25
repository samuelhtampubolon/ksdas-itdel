#!/usr/bin/env node
/*
 * KSDAS - Pengatur penyimpanan cloud. Menulis js/config.js dan menyesuaikan connect-src pada CSP index.html.
 *
 *   node tools/configure.js browser                         (bawaan: IndexedDB / EXE)
 *   node tools/configure.js supabase --url https://xxxx.supabase.co --anon-key <kunci anon/publishable>
 *   node tools/configure.js firebase --api-key <apiKey web> --project-id <id> [--storage-bucket <bucket>]
 *   node tools/configure.js cloudflare|glitch|huggingface|node|rest [--api-base https://host]   (kosong = origin sama)
 *   Opsi umum: --dir <folder web> (bawaan: akar repo)
 *
 * Hanya nilai PUBLIK yang boleh dimasukkan. Kunci service_role / secret ditolak.
 */
"use strict";
const fs = require("fs");
const path = require("path");

function fail(msg) { const e = new Error(msg); e.userError = true; throw e; }
function origin(u, what) {
  let x; try { x = new URL(u); } catch { fail(what + " bukan URL yang valid: " + u); }
  const local = x.hostname === "localhost" || x.hostname === "127.0.0.1";
  if (x.protocol !== "https:" && !(local && x.protocol === "http:")) fail(what + " harus memakai https:// (hanya localhost yang boleh http).");
  return x.origin;
}
function jwtRole(k) { try { return JSON.parse(Buffer.from(k.split(".")[1], "base64url").toString("utf8")).role; } catch { return null; } }

/** Mengembalikan {config, origins} atau melempar galat bermakna. */
function build(provider, o) {
  o = o || {};
  switch (provider) {
    case "browser": return { config: { provider: "browser" }, origins: [] };
    case "supabase": {
      if (!o.url || !o.anonKey) fail("Supabase memerlukan --url dan --anon-key.");
      const key = String(o.anonKey).trim();
      if (/^sb_secret_/.test(key) || jwtRole(key) === "service_role") fail("Kunci service_role / secret DITOLAK. Pakai kunci 'anon' atau 'publishable' saja; kunci rahasia tidak boleh ada di situs.");
      if (!/^sb_publishable_/.test(key) && jwtRole(key) !== "anon") fail("Kunci bukan kunci anon/publishable Supabase yang dikenali.");
      const og = origin(o.url, "--url");
      return { config: { provider: "supabase", supabase: { url: og, anonKey: key, bucket: "ksdas-files" } }, origins: [og] };
    }
    case "firebase": {
      if (!o.apiKey || !o.projectId) fail("Firebase memerlukan --api-key dan --project-id.");
      if (!/^[a-z][a-z0-9-]{4,29}$/.test(o.projectId)) fail("--project-id tidak valid.");
      if (!/^AIza[\w-]{30,}$/.test(o.apiKey)) fail("--api-key bukan apiKey web Firebase (diawali AIza).");
      const fb = { apiKey: o.apiKey, projectId: o.projectId };
      const og = ["https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "https://firestore.googleapis.com"];
      if (o.storageBucket) { if (!/^[a-z0-9._-]+$/.test(o.storageBucket)) fail("--storage-bucket tidak valid."); fb.storageBucket = o.storageBucket; og.push("https://firebasestorage.googleapis.com"); }
      return { config: { provider: "firebase", firebase: fb }, origins: og };
    }
    case "cloudflare": case "glitch": case "huggingface": case "node": case "rest": {
      const base = o.apiBase ? origin(o.apiBase, "--api-base") : "";
      return { config: { provider: provider, apiBase: base }, origins: base ? [base] : [] };
    }
  }
  fail("Penyedia tidak dikenal: " + provider + ". Pilihan: browser, supabase, firebase, cloudflare, glitch, huggingface, node, rest.");
}

function apply(dir, provider, o) {
  const { config, origins } = build(provider, o);
  const cfgFile = path.join(dir, "js", "config.js");
  const head = fs.existsSync(cfgFile) ? fs.readFileSync(cfgFile, "utf8").replace(/window\.KSDAS_CONFIG\s*=[\s\S]*$/, "") : "/* KSDAS: konfigurasi penyimpanan (PUBLIK). Dibuat oleh tools/configure.js */\n";
  fs.writeFileSync(cfgFile, head + "window.KSDAS_CONFIG = " + JSON.stringify(config, null, 2) + ";\n");
  const html = path.join(dir, "index.html");
  let s = fs.readFileSync(html, "utf8");
  const re = /(<meta http-equiv="Content-Security-Policy" content="[^"]*?connect-src )([^;"]*)(;)/;
  if (!re.test(s)) fail("CSP connect-src tidak ditemukan di index.html.");
  s = s.replace(re, (_, a, _old, c) => a + ["'self'", "data:", "blob:"].concat(origins).join(" ") + c);
  fs.writeFileSync(html, s);
  return { config, origins };
}

function parseArgs(argv) {
  const o = {}, map = { "--url": "url", "--anon-key": "anonKey", "--api-key": "apiKey", "--project-id": "projectId", "--storage-bucket": "storageBucket", "--api-base": "apiBase", "--dir": "dir" };
  for (let i = 0; i < argv.length; i++) { const k = map[argv[i]]; if (!k) fail("Opsi tidak dikenal: " + argv[i]); o[k] = argv[++i]; }
  return o;
}
if (require.main === module) {
  try {
    const [provider, ...rest] = process.argv.slice(2);
    if (!provider || provider === "--help") { console.log(fs.readFileSync(__filename, "utf8").split("*/")[0].replace(/^\/\*\n?|^ \* ?/gm, "")); process.exit(provider ? 0 : 1); }
    const o = parseArgs(rest);
    const r = apply(path.resolve(o.dir || path.join(__dirname, "..")), provider, o);
    console.log("OK. Penyedia: " + r.config.provider + ". connect-src ditambah: " + (r.origins.join(" ") || "(tidak ada, origin sama)"));
  } catch (e) { console.error((e.userError ? "GALAT: " : "") + e.message); process.exit(1); }
}
module.exports = { build, apply };
