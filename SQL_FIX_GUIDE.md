# 🔧 GUIA DE CORREÇÃO - EXECUTAR NESTA ORDEM

## ⚠️ Situação Atual

As tabelas já existem parcialmente no banco, mas faltam colunas. Execute os scripts de FIX para adicionar apenas o que falta.

---

## 📋 ORDEM DE EXECUÇÃO

### 1️⃣ Corrigir clinic_cost_structure
```sql
-- Arquivo: sql/FIX_clinic_cost_structure.sql
-- Adiciona: efficiency_rate, num_chairs, hours_per_week, available_minutes_month
-- Recria: Trigger de cálculo automático
```

**Execute no Supabase SQL Editor:**
- Abra `sql/FIX_clinic_cost_structure.sql`
- Copie todo o conteúdo
- Cole no SQL Editor
- Clique em "Run"

### 2️⃣ Corrigir price_tables
```sql
-- Arquivo: sql/FIX_price_tables.sql
-- Adiciona: is_standard
-- Cria: Tabela "Particular" como padrão
```

**Execute no Supabase SQL Editor:**
- Abra `sql/FIX_price_tables.sql`
- Copie todo o conteúdo
- Cole no SQL Editor
- Clique em "Run"

### 3️⃣ Verificar sales_commission_rules
```sql
-- Arquivo: sql/sales_commission_module.sql
-- Já existe! Não precisa executar novamente
```

**Pule este passo** - a tabela já está criada.

---

## ✅ VERIFICAÇÃO

Após executar os FIX, verifique:

```sql
-- 1. Ver estrutura de custos
SELECT 
    clinic_id,
    fixed_costs,
    prolabore,
    num_chairs,
    hours_per_week,
    efficiency_rate,
    cost_per_minute
FROM clinic_cost_structure;

-- 2. Ver tabelas de preços
SELECT 
    name,
    is_standard,
    active
FROM price_tables;

-- 3. Ver comissões
SELECT * FROM sales_commission_rules LIMIT 5;
```

---

## 🎯 RESULTADO ESPERADO

Após executar os FIX:

✅ `clinic_cost_structure` terá todas as colunas  
✅ `cost_per_minute` será calculado automaticamente  
✅ `price_tables` terá coluna `is_standard`  
✅ Tabela "Particular" será criada como padrão  
✅ Sistema funcionará sem erros 406/400  

---

## 🚨 SE DER ERRO

### Erro: "column already exists"
**Solução:** Ignore, é normal. O script verifica antes de adicionar.

### Erro: "trigger already exists"
**Solução:** O script usa `DROP TRIGGER IF EXISTS` antes de criar.

### Erro: "policy already exists"
**Solução:** Ignore, não precisa executar sales_commission_module.sql novamente.

---

## 📊 PRÓXIMO PASSO

Depois de executar os FIX, teste no sistema:

1. Abra Settings → Procedimentos
2. Clique em "Novo Procedimento"
3. Preencha os dados
4. **Não deve ter mais erros 406/400!**

---

**Criado em:** 23/12/2025  
**Status:** ✅ Pronto para execução
