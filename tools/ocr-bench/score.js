#!/usr/bin/env node
// Menghitung CER/WER dari hasil benchmark. Pemakaian: node score.js <manifest.json> <hasil.json> [kelompok: lang|cond|kind]
const fs = require("fs");
const [mf, rf, by = "lang", only = ""] = process.argv.slice(2);
const ONLY = only ? new Set(only.split(",")) : null;
const manifest = JSON.parse(fs.readFileSync(mf, "utf8")); const res = JSON.parse(fs.readFileSync(rf, "utf8"));
function lev(a, b) { const m = a.length, n = b.length; if (!m) return n; if (!n) return m; let p = Array.from({ length: n + 1 }, (_, j) => j), c = new Array(n + 1); for (let i = 1; i <= m; i++) { c[0] = i; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); [p, c] = [c, p]; } return p[n]; }
const norm = (s, nospace) => { s = s.normalize("NFC").replace(/\s+/g, " ").trim(); return nospace ? s.replace(/ /g, "") : s; };
const CJK = new Set(["ja", "ko", "zh", "th"]);
const byFile = Object.fromEntries(manifest.map((m) => [m.file, m]));
const names = Object.keys(res);
const groups = {};
for (const n of names) for (const o of res[n].out) {
  const m = byFile[o.file]; if (ONLY && !ONLY.has(m.lang)) continue; const ns = CJK.has(m.lang);
  const t = norm(m.truth, ns), h = norm(o.text, ns);
  const ce = lev(t, h), we = lev(t.split(" "), h.split(" "));
  const key = by === "lang" ? m.lang : by === "cond" ? m.cond : m.kind;
  const g = ((groups[key] ||= {})[n] ||= { ce: 0, cn: 0, we: 0, wn: 0, ms: 0, k: 0 });
  g.ce += ce; g.cn += t.length; g.we += we; g.wn += ns ? 1e9 : t.split(" ").length; g.ms += o.ms; g.k++;
}
const keys = Object.keys(groups).sort();
console.log("kelompok=" + by + "  (CER% / WER%)");
console.log("".padEnd(10) + names.map((n) => n.padEnd(22)).join(""));
const tot = {};
for (const k of keys) {
  let line = k.padEnd(10);
  for (const n of names) { const g = groups[k][n]; if (!g) { line += "-".padEnd(22); continue; } line += `${(100 * g.ce / g.cn).toFixed(1)} / ${g.wn > 1e8 ? "-" : (100 * g.we / g.wn).toFixed(1)}`.padEnd(22); const t = (tot[n] ||= { ce: 0, cn: 0, ms: 0, k: 0 }); t.ce += g.ce; t.cn += g.cn; t.ms += g.ms; t.k += g.k; }
  console.log(line);
}
console.log("TOTAL CER ".padEnd(10) + names.map((n) => `${(100 * tot[n].ce / tot[n].cn).toFixed(2)}%`.padEnd(22)).join(""));
console.log("ms/gambar ".padEnd(10) + names.map((n) => `${(tot[n].ms / tot[n].k).toFixed(0)}`.padEnd(22)).join(""));
