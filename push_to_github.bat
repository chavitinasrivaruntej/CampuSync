@echo off
set "PATH=C:\Program Files\Git\cmd;%SystemRoot%\system32;%SystemRoot%;%PATH%"
echo Starting Git Push to https://github.com/chavitinasrivaruntej/CampuSync...
cd /d "%~dp0"

if "%GITHUB_TOKEN%"=="" (
    set /p GITHUB_TOKEN="Enter your GitHub Personal Access Token (PAT): "
)

git init
git add .
git commit -m "Update CampuSync codebase"
git branch -M main
git remote add origin https://%GITHUB_TOKEN%@github.com/chavitinasrivaruntej/CampuSync.git 2>NUL
git remote set-url origin https://%GITHUB_TOKEN%@github.com/chavitinasrivaruntej/CampuSync.git

echo Pushing to GitHub...
git push -u origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Standard push failed. Attempting force push...
    git push -u origin main --force
)

echo.
echo Operation finished!
pause
