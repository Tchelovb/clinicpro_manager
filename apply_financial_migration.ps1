# Script para aplicar migracao do Financeiro Fort Knox
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIGRACAO FINANCEIRO - FORT KNOX" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sqlFile = "c:\Users\marce\OneDrive\Documentos\ClinicPro\sql\financial_fort_knox_migration.sql"

if (Test-Path $sqlFile) {
    # Tenta ler com UTF8, se falhar, le padrao
    try {
        $content = Get-Content $sqlFile -Raw -Encoding UTF8 -ErrorAction Stop
    } catch {
        $content = Get-Content $sqlFile -Raw
    }
    
    Set-Clipboard -Value $content
    
    Write-Host "[OK] SQL copiado para area de transferencia!" -ForegroundColor Green
    Write-Host ""
    Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "1. Abrindo Supabase no navegador..." -ForegroundColor White
    Start-Process "https://supabase.com/dashboard/project/_/sql/new"
    Start-Sleep -Seconds 2
    
    Write-Host "2. Cole o SQL (Ctrl+V) no Editor SQL" -ForegroundColor White
    Write-Host "3. Clique em RUN" -ForegroundColor White
    Write-Host ""
    Write-Host "A migracao ira criar:" -ForegroundColor Gray
    Write-Host "  - Tabela: clinic_financial_settings" -ForegroundColor Gray
    Write-Host "  - Novas colunas em cash_registers" -ForegroundColor Gray
    Write-Host "  - Trigger de seguranca financeira" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Pressione ENTER apos executar o SQL no Supabase para concluir" -ForegroundColor Cyan
    Read-Host
    
    Write-Host ""
    Write-Host "[OK] Migracao considerada concluida!" -ForegroundColor Green
}
else {
    Write-Host "[ERRO] Arquivo SQL nao encontrado em: $sqlFile" -ForegroundColor Red
}
