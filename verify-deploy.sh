#!/bin/bash
# Script de verificação e correção para deploy

echo "🔍 Verificando configuração do projeto..."

# 1. Verificar se .env.local existe
if [ ! -f .env.local ]; then
    echo "⚠️  Arquivo .env.local não encontrado!"
    echo "📝 Criando .env.example..."
    cat > .env.example << EOF
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
EOF
    echo "✅ Arquivo .env.example criado"
    echo "⚠️  Configure suas variáveis de ambiente no Cloudflare Pages!"
else
    echo "✅ Arquivo .env.local encontrado"
fi

# 2. Verificar package.json
echo ""
echo "📦 Verificando package.json..."
if grep -q "\"build\":" package.json; then
    echo "✅ Script de build encontrado"
else
    echo "❌ Script de build não encontrado!"
fi

# 3. Limpar cache e node_modules
echo ""
echo "🧹 Limpando cache..."
rm -rf node_modules
rm -rf dist
rm -rf .vite

# 4. Reinstalar dependências
echo ""
echo "📥 Reinstalando dependências..."
npm install

# 5. Tentar build
echo ""
echo "🏗️  Tentando build..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build concluído com sucesso!"
    echo "📂 Arquivos gerados em: dist/"
    echo ""
    echo "🚀 Próximos passos:"
    echo "1. Configure as variáveis de ambiente no Cloudflare Pages"
    echo "2. Faça push para o GitHub"
    echo "3. O Cloudflare Pages fará deploy automático"
else
    echo ""
    echo "❌ Build falhou!"
    echo "Verifique os erros acima"
fi
