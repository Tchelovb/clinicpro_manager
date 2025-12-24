# Script para consolidar arquivos .md do projeto (excluindo node_modules)

$outputFile = "master_reference.md"
$date = Get-Date -Format "dd/MM/yyyy HH:mm:ss"

# Criar arquivo de saída
"# MASTER REFERENCE - CLINICPRO MANAGER" | Out-File -FilePath $outputFile -Encoding UTF8
"**Data de Criacao:** $date" | Add-Content -Path $outputFile -Encoding UTF8
"" | Add-Content -Path $outputFile -Encoding UTF8
"---" | Add-Content -Path $outputFile -Encoding UTF8
"" | Add-Content -Path $outputFile -Encoding UTF8

# Buscar arquivos .md excluindo node_modules
$mdFiles = Get-ChildItem -Path . -Filter *.md -Recurse | Where-Object { 
    $_.FullName -notmatch "node_modules" -and 
    $_.FullName -notmatch "\.git" -and
    $_.Name -ne "master_reference.md" 
}

"**Total de Arquivos:** $($mdFiles.Count)" | Add-Content -Path $outputFile -Encoding UTF8
"" | Add-Content -Path $outputFile -Encoding UTF8

# Processar cada arquivo
$count = 0
foreach ($file in $mdFiles) {
    $count++
    $relativePath = $file.FullName.Replace((Get-Location).Path, "").TrimStart('\')
    
    Write-Host "[$count/$($mdFiles.Count)] $relativePath"
    
    # Adicionar separador
    "" | Add-Content -Path $outputFile -Encoding UTF8
    "---" | Add-Content -Path $outputFile -Encoding UTF8
    "" | Add-Content -Path $outputFile -Encoding UTF8
    "## $relativePath" | Add-Content -Path $outputFile -Encoding UTF8
    "" | Add-Content -Path $outputFile -Encoding UTF8
    
    # Adicionar conteúdo
    try {
        Get-Content -Path $file.FullName -Encoding UTF8 | Add-Content -Path $outputFile -Encoding UTF8
    }
    catch {
        "ERROR: Could not read file" | Add-Content -Path $outputFile -Encoding UTF8
    }
}

Write-Host ""
Write-Host "CONCLUIDO! Arquivo criado: $outputFile"
Write-Host "Total processado: $($mdFiles.Count) arquivos"
