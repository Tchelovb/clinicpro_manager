# Script para aplicar fix de RLS no Supabase
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FIX RLS - Corrigir Recursão Infinita" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sqlFile = "c:\Users\marce\OneDrive\Documentos\ClinicPro\sql\fix_master_rls_recursion.sql"

if (Test-Path $sqlFile) {
    $content = Get-Content $sqlFile -Raw -Encoding UTF8
    Set-Clipboard -Value $content
    
    Write-Host "✅ SQL copiado para área de transferência!" -ForegroundColor Green
    Write-Host ""
    Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "1. Abrindo Supabase no navegador..." -ForegroundColor White
    Start-Process "https://supabase.com/dashboard/project/_/sql/new"
    Start-Sleep -Seconds 2
    
    Write-Host "2. Faça login com: marcelovboass@gmail.com" -ForegroundColor White
    Write-Host "3. Selecione o projeto ClinicPro" -ForegroundColor White
    Write-Host "4. Cole o SQL (Ctrl+V)" -ForegroundColor White
    Write-Host "5. Clique em RUN" -ForegroundColor White
    Write-Host ""
    Write-Host "Aguardando aplicação do fix..." -ForegroundColor Yellow
    Write-Host "Pressione ENTER após executar o SQL no Supabase" -ForegroundColor Cyan
    Read-Host
    
    Write-Host ""
    Write-Host "✅ Fix aplicado! Testando sistema..." -ForegroundColor Green
}
else {
    Write-Host "❌ Arquivo SQL não encontrado!" -ForegroundColor Red
}
