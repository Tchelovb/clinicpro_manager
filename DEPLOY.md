# 🚀 ClinicPro - Guia de Deploy

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Cloudflare Pages
- Conta no Supabase
- Git configurado

## 🗄️ Configuração do Banco de Dados

### 1. Execute os Scripts SQL no Supabase (nesta ordem):

```sql
-- 1. Schema principal (se ainda não executado)
sql/schema.sql

-- 2. Migração de Categorias e Especialidades
sql/MIGRATION_CATEGORY_SPECIALTY.sql

-- 3. Correção de RLS para Procedimentos
sql/FIX_PROCEDURE_RLS.sql

-- 4. Correção de Custos de Procedimentos
sql/FIX_PROCEDURE_COSTS_SAVE.sql

-- 5. Trigger de Aprovação de Orçamento
sql/auto_budget_approval.sql
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

## 🏗️ Build do Projeto

```bash
# Instalar dependências
npm install

# Build para produção
npm run build
```

## ☁️ Deploy no Cloudflare Pages

### Opção 1: Via Dashboard do Cloudflare

1. Acesse [Cloudflare Pages](https://pages.cloudflare.com/)
2. Clique em "Create a project"
3. Conecte seu repositório GitHub
4. Configure:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
5. Adicione as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Clique em "Save and Deploy"

### Opção 2: Via Wrangler CLI

```bash
# Instalar Wrangler
npm install -g wrangler

# Login no Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist --project-name=clinicpro
```

## 🔐 Configurações de Segurança

### Supabase RLS (Row Level Security)

Certifique-se de que as políticas RLS estão ativas para:
- ✅ `procedure`
- ✅ `procedure_costs`
- ✅ `patients`
- ✅ `budgets`
- ✅ `treatment_items`
- ✅ `installments`

### Cloudflare

Configure as seguintes regras:
- **HTTPS**: Sempre ativo
- **Minify**: CSS, JS, HTML
- **Auto Minify**: Ativado
- **Brotli**: Ativado

## 📊 Funcionalidades Principais

### ✅ Módulo de Procedimentos
- Cadastro de procedimentos
- Categorização (Clínica Geral, Ortodontia, HOF)
- Especialidades detalhadas
- **Custos BOS** (Materiais, Profissional, Operacional)
- Cálculo automático de margem

### ✅ Gestão de Orçamentos
- Criação e edição de orçamentos
- Aprovação automática
- Geração de tratamentos e parcelas
- Distribuição por categoria

### ✅ Perfil do Paciente
- Abas organizadas por categoria
- Tratamentos distribuídos automaticamente
- Histórico financeiro
- Galeria de imagens

## 🐛 Troubleshooting

### Erro: "Invalid UUID"
- **Causa**: Profile não carregado antes das queries
- **Solução**: Já corrigido em `pages/Settings.tsx`

### Erro: "RLS Policy Violation"
- **Causa**: Políticas RLS muito restritivas
- **Solução**: Execute `sql/FIX_PROCEDURE_RLS.sql`

### Custos BOS não salvam
- **Causa**: Constraint ou coluna gerada incorreta
- **Solução**: Execute `sql/FIX_PROCEDURE_COSTS_SAVE.sql`

### Custos BOS não carregam
- **Causa**: Acesso incorreto ao relacionamento
- **Solução**: Já corrigido em `ProceduresSettings.tsx`

## 📝 Checklist de Deploy

- [ ] Scripts SQL executados no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Build executado sem erros
- [ ] Testes locais realizados
- [ ] Deploy no Cloudflare concluído
- [ ] DNS configurado (se custom domain)
- [ ] HTTPS ativo
- [ ] Teste de login funcionando
- [ ] Teste de criação de procedimento
- [ ] Teste de criação de orçamento
- [ ] Teste de aprovação de orçamento
- [ ] Verificar distribuição de tratamentos

## 🔄 Atualizações Futuras

Para atualizar o sistema:

```bash
# 1. Pull das mudanças
git pull origin main

# 2. Instalar novas dependências (se houver)
npm install

# 3. Build
npm run build

# 4. Deploy
# O Cloudflare Pages fará deploy automático ao fazer push
git push origin main
```

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs do Cloudflare Pages
2. Verifique os logs do Supabase
3. Consulte a documentação do projeto

---

**Versão**: 1.0.0  
**Última atualização**: 2025-12-22  
**Status**: ✅ Pronto para Produção
