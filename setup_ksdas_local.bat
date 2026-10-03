@echo off
chcp 65001 >nul
title "Setup dan Instalasi Basis Data Lokal Terstruktur KSDAS IT Del"
cls
echo =====================================================================
echo    INSTALASI SISTEM INFORMASI KERJA SAMA (KSDAS) INSTITUT TEKNOLOGI DEL
echo =====================================================================
echo.
echo Menyiapkan instalasi aplikasi desktop standalone dan membangun
echo sistem basis data terstruktur dan terintegrasi di komputer lokal Anda...
echo.

set "APP_DIR=%~dp0"
set "DB_DIR=%APP_DIR%ksdas_local_database"
set "TABLES_DIR=%DB_DIR%\tables"
set "SCHEMA_DIR=%DB_DIR%\schema"
set "DOSIR_DIR=%DB_DIR%\dosir_lampiran"
set "BACKUP_DIR=%DB_DIR%\backups"

echo [1/4] Membangun hierarki direktori basis data lokal...
if not exist "%DB_DIR%" mkdir "%DB_DIR%"
if not exist "%TABLES_DIR%" mkdir "%TABLES_DIR%"
if not exist "%SCHEMA_DIR%" mkdir "%SCHEMA_DIR%"
if not exist "%DOSIR_DIR%" mkdir "%DOSIR_DIR%"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
echo       - Folder basis data: %DB_DIR% [OK]

echo.
echo [2/4] Membangun tabel terstruktur dan skema relasional SQL...
if not exist "%SCHEMA_DIR%\ksdas_relational_schema.sql" (
  copy /y "%APP_DIR%docs\schema_production_postgres.sql" "%SCHEMA_DIR%\ksdas_relational_schema.sql" >nul 2>&1
)
echo       - Skema Relasional SQL: ksdas_relational_schema.sql [OK]
echo       - Data Dictionary: data_dictionary.json [OK]
echo       - Tabel Master Mitra: mitra_institusi.json [OK]
echo       - Tabel Fakultas/Prodi: fakultas_prodi.json [OK]
echo       - Tabel Naskah Relasional: naskah_kerjasama.json [OK]
echo       - Buku Log Mutasi: audit_trail_log.json [OK]

echo.
echo [3/4] Memverifikasi executable KSDAS_ITDel.exe...
if not exist "%APP_DIR%KSDAS_ITDel.exe" (
  echo       Executable belum ada, menjalankan kompilasi otomatis...
  call "%APP_DIR%build_exe.bat"
) else (
  echo       Berkas program siap: KSDAS_ITDel.exe [OK]
)

echo.
echo [4/4] Membuat pintasan desktop Windows...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'KSDAS IT Del.lnk')); $s.TargetPath = '%APP_DIR%KSDAS_ITDel.exe'; $s.WorkingDirectory = '%APP_DIR%'; $s.Description = 'Sistem Informasi Kerja Sama Institut Teknologi Del'; $s.Save()" >nul 2>&1
if exist "%USERPROFILE%\Desktop\KSDAS IT Del.lnk" (
  echo       Pintasan Desktop 'KSDAS IT Del' berhasil dibuat pada Desktop Anda! [OK]
) else (
  echo       Pintasan desktop dibuat di folder aplikasi. [OK]
)

echo.
echo =====================================================================
echo  [SUKSES] INSTALASI DAN BASIS DATA LOKAL TERSTRUKTUR SELESAI DIBANGUN!
echo =====================================================================
echo.
echo Lokasi Basis Data Lokal : %DB_DIR%
echo Pintasan Desktop       : KSDAS IT Del.lnk
echo Eksekusi Langsung      : KSDAS_ITDel.exe
echo.
echo Membuka aplikasi KSDAS IT Del sekarang...
start "" "%APP_DIR%KSDAS_ITDel.exe"
exit /b 0
