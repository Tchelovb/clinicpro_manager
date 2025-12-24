# Criar indice simples dos arquivos .md

$outputFile = "DOCUMENTACAO_INDEX.md"

# Buscar arquivos
$mdFiles = Get-ChildItem -Path . -Filter *.md -Recurse | Where-Object { 
    $_.FullName -notmatch "node_modules" -and 
    $_.FullName -notmatch "\.git" -and
    $_.Name -ne "DOCUMENTACAO_INDEX.md" -and
    $_.Name -notmatch "master_reference"
} | Sort-Object DirectoryName, Name

# Criar header
@"
# INDICE DE DOCUMENTACAO - CLINICPRO

**Data:** $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")  
**Total:** $($mdFiles.Count) arquivos

---

## ARQUIVOS POR CATEGORIA

"@ | Out-File -FilePath $outputFile -Encoding UTF8

# Agrupar por pasta
$currentDir = ""
foreach ($file in $mdFiles) {
    $dir = Split-Path $file.DirectoryName -Leaf
    $relativePath = $file.FullName.Replace((Get-Location).Path, "").TrimStart('\')
    
    if ($dir -ne $currentDir) {
        $folderName = if ($dir -eq "ClinicPro") { "RAIZ DO PROJETO" } else { $dir.ToUpper() }
        "" | Add-Content -Path $outputFile -Encoding UTF8
        "### $folderName" | Add-Content -Path $outputFile -Encoding UTF8
        "" | Add-Content -Path $outputFile -Encoding UTF8
        $currentDir = $dir
    }
    
    $size = [math]::Round($file.Length / 1KB, 1)
    "- **$($file.Name)** ($size KB) - ``$relativePath``" | Add-Content -Path $outputFile -Encoding UTF8
}

Write-Host "Indice criado: $outputFile"
