@echo off
setlocal
cd /d "%~dp0"
echo ===================================================
echo   KOMPILASI KSDAS_ITDel.exe (server penyimpanan lokal)
echo ===================================================

set "CSC=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist "%CSC%" set "CSC=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
if not exist "%CSC%" (
    echo [ERROR] csc.exe (.NET Framework 4.x) tidak ditemukan.
    exit /b 1
)

echo [1/2] Mengemas aset web ke web.zip ...
powershell -NoProfile -ExecutionPolicy Bypass -File tools\make_web_zip.ps1 -Out web.zip
if errorlevel 1 ( echo [GAGAL] Pembuatan web.zip gagal. & exit /b 1 )

echo [2/2] Mengompilasi desktop-app\KSDAS_DesktopApp.cs ...
"%CSC%" /nologo /target:winexe /optimize+ /out:KSDAS_ITDel.exe ^
  /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.Data.dll /r:System.Web.Extensions.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll ^
  /resource:web.zip,web.zip /resource:docs\schema_production_postgres.sql,schema.sql /resource:docs\data_dictionary_local.json,data_dictionary.json ^
  desktop-app\KSDAS_DesktopApp.cs
if errorlevel 1 ( echo [GAGAL] Kompilasi gagal. & exit /b 1 )
del web.zip >nul 2>&1
echo.
echo [SUKSES] KSDAS_ITDel.exe dibuat. Klik ganda untuk menjalankan.
endlocal
