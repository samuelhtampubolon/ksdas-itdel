@echo off
setlocal
echo ===================================================
echo   KOMPILASI STANDALONE DESKTOP APP KSDAS IT DEL (.EXE)
echo ===================================================
echo.

set "CSC=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist "%CSC%" set "CSC=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"

if not exist "%CSC%" (
    echo [ERROR] Microsoft .NET Framework C# Compiler csc.exe tidak ditemukan di sistem ini.
    exit /b 1
)

echo Mengompilasi desktop-app\KSDAS_DesktopApp.cs menjadi KSDAS_ITDel.exe ...
"%CSC%" /target:winexe /out:KSDAS_ITDel.exe /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.Data.dll /r:System.Web.Extensions.dll /r:System.IO.Compression.FileSystem.dll /r:System.IO.Compression.dll desktop-app\KSDAS_DesktopApp.cs

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUKSES] Berkas executable berhasil dibuat: KSDAS_ITDel.exe
    echo Klik ganda KSDAS_ITDel.exe untuk menjalankan aplikasi desktop.
) else (
    echo.
    echo [GAGAL] Kompilasi gagal dengan kode error %ERRORLEVEL%.
)
endlocal
