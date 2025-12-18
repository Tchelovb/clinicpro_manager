Write-Host "FIX RLS - Aplicando correcao" -ForegroundColor Cyan

$sqlFile = "c:\Users\marce\OneDrive\Documentos\ClinicPro\sql\fix_master_rls_recursion.sql"
$content = Get-Content $sqlFile -Raw -Encoding UTF8
Set-Clipboard -Value $content

Write-Host "SQL copiado!" -ForegroundColor Green
Write-Host "Abrindo Supabase..." -ForegroundColor Yellow

Start-Process "https://supabase.com/dashboard/project/_/sql/new"

Write-Host ""
Write-Host "PASSOS:" -ForegroundColor Yellow
Write-Host "1. Login: marcelovboass@gmail.com"
Write-Host "2. Selecione projeto ClinicPro"
Write-Host "3. Cole SQL (Ctrl+V)"
Write-Host "4. Clique RUN"
Write-Host ""
Write-Host "Pressione ENTER apos executar..." -ForegroundColor Cyan
Read-Host
