# Script para criar um Master Reference organizado e legivel

$outputFile = "MASTER_REFERENCE.md"
$date = Get-Date -Format "dd/MM/yyyy HH:mm:ss"

# Buscar arquivos .md excluindo node_modules e master_reference
$mdFiles = Get-ChildItem -Path . -Filter *.md -Recurse | Where-Object { 
    $_.FullName -notmatch "node_modules" -and 
    $_.FullName -notmatch "\.git" -and
    $_.Name -notmatch "master_reference" -and
    $_.Name -ne "MASTER_REFERENCE.md"
}

# Agrupar por pasta
$grouped = $mdFiles | Group-Object { Split-Path $_.DirectoryName -Leaf }

# Criar arquivo com header
@"
# MASTER REFERENCE - CLINICPRO MANAGER

**Data de Criacao:** $date  
**Total de Arquivos:** $($mdFiles.Count)

---

## INDICE

"@ | Out-File -FilePath $outputFile -Encoding UTF8

# Criar índice
$sectionNumber = 1
foreach ($group in ($grouped | Sort-Object Name)) {
    $folderName = if ($group.Name -eq "ClinicPro") { "Raiz do Projeto" } else { $group.Name }
    "### $sectionNumber. $folderName ($($group.Count) arquivos)" | Add-Content -Path $outputFile -Encoding UTF8
    
    foreach ($file in ($group.Group | Sort-Object Name)) {
        $fileName = $file.Name
        "- [$fileName](#$($fileName.Replace('.md','').Replace(' ','-').ToLower()))" | Add-Content -Path $outputFile -Encoding UTF8
    }
    "" | Add-Content -Path $outputFile -Encoding UTF8
    $sectionNumber++
}

"---" | Add-Content -Path $outputFile -Encoding UTF8
"" | Add-Content -Path $outputFile -Encoding UTF8

# Adicionar conteúdo por seção
$sectionNumber = 1
foreach ($group in ($grouped | Sort-Object Name)) {
    $folderName = if ($group.Name -eq "ClinicPro") { "Raiz do Projeto" } else { $group.Name }
    
    "" | Add-Content -Path $outputFile -Encoding UTF8
    "# $sectionNumber. $folderName" | Add-Content -Path $outputFile -Encoding UTF8
    "" | Add-Content -Path $outputFile -Encoding UTF8
    
    foreach ($file in ($group.Group | Sort-Object Name)) {
        $relativePath = $file.FullName.Replace((Get-Location).Path, "").TrimStart('\')
        
        Write-Host "[$sectionNumber] $relativePath"
        
        "" | Add-Content -Path $outputFile -Encoding UTF8
        "## $($file.Name)" | Add-Content -Path $outputFile -Encoding UTF8
        "" | Add-Content -Path $outputFile -Encoding UTF8
        "**Caminho:** ``$relativePath``" | Add-Content -Path $outputFile -Encoding UTF8
        "" | Add-Content -Path $outputFile -Encoding UTF8
        
        try {
            Get-Content -Path $file.FullName -Encoding UTF8 | Add-Content -Path $outputFile -Encoding UTF8
        }
        catch {
            "ERROR: Nao foi possivel ler o arquivo" | Add-Content -Path $outputFile -Encoding UTF8
        }
        
        "" | Add-Content -Path $outputFile -Encoding UTF8
        "---" | Add-Content -Path $outputFile -Encoding UTF8
    }
    
    $sectionNumber++
}

Write-Host ""
Write-Host "CONCLUIDO! Arquivo criado: $outputFile"
Write-Host "Total processado: $($mdFiles.Count) arquivos"
Write-Host "Tamanho: $((Get-Item $outputFile).Length / 1MB) MB"
