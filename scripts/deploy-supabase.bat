@echo off
setlocal
cd /d C:\Users\EXCELN~1\DOCUME~1\jah

echo ============================================
echo  SUPABASE MIGRATIONS DEPLOY TO PRODUCTION
echo ============================================

echo [SUP-1] Applying all pending migrations to remote (production)...
npx supabase db push --include-all
if %errorlevel% neq 0 (
    echo FALHA ao aplicar migrations no Supabase remoto.
    echo Verifique se o Supabase CLI esta autenticado: npx supabase login
    exit /b 1
)
echo OK: Migrations aplicadas com sucesso.

echo.
echo [SUP-2] Listing remote migration status...
npx supabase migration list

echo.
echo === SUPABASE DEPLOY CONCLUIDO ===
endlocal
