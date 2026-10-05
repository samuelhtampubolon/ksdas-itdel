# Membuat web.zip (aset web KSDAS) dengan pemisah folder "/" agar terbaca server EXE.
param([string]$Out = "web.zip")
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = Split-Path -Parent $PSScriptRoot
if (Test-Path $Out) { Remove-Item $Out -Force }
$zip = [System.IO.Compression.ZipFile]::Open((Join-Path (Get-Location) $Out), 'Create')
$files = @("index.html") + (Get-ChildItem -Recurse -File (Join-Path $root "css"), (Join-Path $root "js") | ForEach-Object { $_.FullName.Substring($root.Length + 1) }) +
         (Get-ChildItem -File (Join-Path $root "sample-data\uji") | Where-Object { $_.Extension -ne ".py" } | ForEach-Object { $_.FullName.Substring($root.Length + 1) })
foreach ($f in $files) {
  $name = $f.Replace('\', '/')
  [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Join-Path $root $f), $name, [System.IO.Compression.CompressionLevel]::Optimal)
}
$zip.Dispose()
Write-Host "web.zip dibuat: $($files.Count) berkas"
