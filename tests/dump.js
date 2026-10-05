const { run, pdfjs } = require("./helpers");
(async () => {
  for (const n of process.argv.slice(2)) {
    const { read, res } = await run(n, null, { pdfjsLib: pdfjs });
    console.log("=====", n, "pages:", read.pages.length, "warnings:", read.warnings);
    for (const [k, f] of Object.entries(res.fields)) console.log(k.padEnd(22), String(f.display || f.value).slice(0, 70).padEnd(72), f.level, "p" + f.page, f.method);
    console.log("MISSING:", res.missing.map(m => m.key).join(","));
    console.log("FLAGS:", res.flags.map(f => f.code).join(","));
    if (res.parentSuggestion) console.log("PARENT:", res.parentSuggestion);
  }
})().catch(e => { console.error(e); process.exit(1); });
