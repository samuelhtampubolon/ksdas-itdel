#!/usr/bin/env bash
# Membangun KSDAS_ITDel.exe di Linux/macOS memakai Mono (mcs). Hasilnya berjalan di Windows .NET Framework 4.x.
# Kebutuhan: mono-mcs, libmono-system-windows-forms4.0-cil, libmono-system-web-extensions4.0-cil, python3
set -euo pipefail
cd "$(dirname "$0")"
OUT=KSDAS_ITDel.exe
TMP=$(mktemp -d)
python3 - "$TMP/web.zip" <<'PY'
import sys, os, zipfile
out = sys.argv[1]
include = ["index.html"]
for base in ("css", "js"):
    for r, _, fs in os.walk(base):
        for f in fs: include.append(os.path.join(r, f))
for f in sorted(os.listdir("sample-data/uji")):
    if not f.endswith(".py"): include.append(os.path.join("sample-data/uji", f))
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for p in include: z.write(p, p.replace(os.sep, "/"))
print("web.zip:", len(include), "berkas,", os.path.getsize(out), "byte")
PY
mcs -nologo -target:winexe -langversion:5 -optimize+ -out:"$OUT" \
  -r:System.Windows.Forms.dll -r:System.Drawing.dll -r:System.Data.dll -r:System.Web.Extensions.dll \
  -r:System.IO.Compression.dll -r:System.IO.Compression.FileSystem.dll \
  -resource:"$TMP/web.zip",web.zip \
  -resource:docs/schema_production_postgres.sql,schema.sql \
  -resource:docs/data_dictionary_local.json,data_dictionary.json \
  desktop-app/KSDAS_DesktopApp.cs
rm -rf "$TMP"
ls -la "$OUT"
