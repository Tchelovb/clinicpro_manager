#!/bin/bash
# Script para encontrar elementos sem dark mode

echo "🔍 Procurando por elementos sem dark mode..."
echo ""

# Procurar por bg-white sem dark:bg-
echo "=== Elementos com bg-white sem dark: ==="
grep -rn "bg-white" --include="*.tsx" --include="*.ts" . | grep -v "dark:bg-" | grep -v "node_modules" | head -20

echo ""
echo "=== Elementos com bg-gray-50 sem dark: ==="
grep -rn "bg-gray-50" --include="*.tsx" --include="*.ts" . | grep -v "dark:bg-" | grep -v "node_modules" | head -20

echo ""
echo "=== Elementos com text-gray-900 sem dark: ==="
grep -rn "text-gray-900" --include="*.tsx" --include="*.ts" . | grep -v "dark:text-" | grep -v "node_modules" | head -20

echo ""
echo "=== Elementos com border-gray-200 sem dark: ==="
grep -rn "border-gray-200" --include="*.tsx" --include="*.ts" . | grep -v "dark:border-" | grep -v "node_modules" | head -20

echo ""
echo "✅ Busca concluída!"
