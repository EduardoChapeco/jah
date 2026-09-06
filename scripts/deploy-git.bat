@echo off
setlocal
cd /d C:\Users\EXCELN~1\DOCUME~1\jah

echo [1/3] Git commit Ciclo 91-92...
git commit -m "feat(ciclo-91-92): erradicacao p2p, seguranca militar tokens zero-transfer, classificados agendados, loja privada senha e viewport corrections"
if %errorlevel% neq 0 (echo FALHA no commit & exit /b 1)
echo OK: commit criado.

echo [2/3] Git pull --rebase origin main...
git pull --rebase origin main

echo [3/3] Git push origin main...
git push origin main
if %errorlevel% neq 0 (echo FALHA no push & exit /b 1)
echo.
echo === GIT CONCLUIDO ===
git log --oneline -3
endlocal
