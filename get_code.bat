@echo off
chcp 65001 >nul
cd /d "%~dp0"

:: 出力用フォルダの作成（なければ作る）
if not exist "code_txt" mkdir code_txt

:: PowerShellを使って確実に安全な YYMMDD_HHMM 形式のタイムスタンプを取得
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'yyMMdd_HHmm'"`) do set TIMESTAMP=%%i

set OUTFILE=code_txt\%TIMESTAMP%_all_code.txt

echo 📦 ソースコードを収集中... (%OUTFILE%)
powershell -NoProfile -Command "$files = Get-ChildItem -Recurse -Filter *.ts* | Where-Object { $_.FullName -notmatch 'node_modules|dist|\.git|code_txt' }; foreach($f in $files) { '=== FILE: ' + $f.Name + ' ==='; Get-Content $f.FullName; '' }" > "%OUTFILE%"

echo ✨ 完了しました！ 出力先: %OUTFILE%
pause