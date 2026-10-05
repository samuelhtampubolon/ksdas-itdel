@echo off
chcp 65001 >nul
title KSDAS IT Del - Setup lokal
cd /d "%~dp0"
echo =====================================================================
echo   KSDAS IT Del - menyiapkan penyimpanan lokal di komputer ini
echo =====================================================================
if not exist "KSDAS_ITDel.exe" (
  echo KSDAS_ITDel.exe belum ada, mengompilasi dari sumber...
  call build_exe.bat
  if errorlevel 1 exit /b 1
)
echo Membuat pintasan di Desktop...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'KSDAS IT Del.lnk')); $s.TargetPath = '%~dp0KSDAS_ITDel.exe'; $s.WorkingDirectory = '%~dp0'; $s.Save()" >nul 2>&1
echo Menjalankan KSDAS. Folder ksdas_local_database akan dibangun otomatis di samping KSDAS_ITDel.exe.
start "" "%~dp0KSDAS_ITDel.exe"
exit /b 0
