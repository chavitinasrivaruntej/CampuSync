@echo off
set "PATH=C:\Program Files\Git\cmd;%SystemRoot%\system32;%SystemRoot%;%PATH%"
if exist "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" (
    "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" %*
) else (
    C:\Windows\System32\cmd.exe /c %*
)
