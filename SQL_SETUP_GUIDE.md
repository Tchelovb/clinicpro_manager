# 🗄️ SCRIPTS SQL NECESSÁRIOS PARA O PROFIT ENGINE

## 📋 Arquivos Criados

### 1. `sql/cost_wizard_tables.sql` ✅
**Cria:** `clinic_cost_structure`

**O que faz:**
- Armazena custos fixos e pró-labore
- Calcula automaticamente o **custo por minuto**
- Usado pelo Profit Engine para análise de margem

**Campos Principais:**
- `fixed_costs` - Custos fixos mensais (aluguel, contas)
- `prolabore` - Pró-labore do dono
- `num_chairs` - Número de cadeiras
- `hours_per_week` - Horas de trabalho
- `efficiency_rate` - Taxa de eficiência (0-1)
- `cost_per_minute` - **Calculado automaticamente via trigger**

### 2. `sql/price_tables_schema.sql` ✅
**Cria:** `price_tables` e `price_table_items`

**O que faz:**
- Permite múltiplas tabelas de preço (Particular, Convênio, Parceiros)
- Cada procedimento pode ter preço diferente em cada tabela
- Uma tabela é marcada como padrão

**Tabelas:**
- `price_tables` - Lista de tabelas (Particular, Convênio, etc)
- `price_table_items` - Preços específicos por procedimento

### 3. `sql/sales_commission_module.sql` ✅ (Já existe)
**Cria:** `sales_commission_rules`

**O que faz:**
- Regras de comissão de vendas
- Usado no BudgetSheet para calcular comissão do vendedor

---

## 🚀 COMO EXECUTAR

### Ordem de Execução:

```sql
-- 1. Estrutura de Custos (PRIMEIRO)
\i sql/cost_wizard_tables.sql

-- 2. Tabelas de Preços
\i sql/price_tables_schema.sql

-- 3. Comissões de Vendas
\i sql/sales_commission_module.sql
```

### Ou no Supabase SQL Editor:

1. Abra cada arquivo
2. Copie o conteúdo
3. Cole no SQL Editor do Supabase
4. Execute

---

## 📊 DADOS DE EXEMPLO

Após executar os SQLs, insira dados de exemplo:

```sql
-- Inserir estrutura de custos
INSERT INTO clinic_cost_structure (
    clinic_id,
    fixed_costs,
    prolabore,
    num_chairs,
    hours_per_week,
    efficiency_rate
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000', -- SEU CLINIC_ID
    10000.00,  -- R$ 10.000 custos fixos
    10000.00,  -- R$ 10.000 pró-labore
    1,         -- 1 cadeira
    40,        -- 40h/semana
    0.80       -- 80% eficiência
);

-- Resultado: cost_per_minute ≈ R$ 2,08/min
-- Cálculo: 20.000 / (40h * 4.33 * 60min * 0.8 * 1) = R$ 2,08

-- Criar tabela de preços padrão
INSERT INTO price_tables (clinic_id, name, is_standard, active)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Particular',
    TRUE,
    TRUE
);
```

---

## ✅ VERIFICAÇÃO

Após executar, verifique:

```sql
-- Ver estrutura de custos
SELECT 
    clinic_id,
    fixed_costs,
    prolabore,
    cost_per_minute,
    available_minutes_month
FROM clinic_cost_structure;

-- Ver tabelas de preços
SELECT * FROM price_tables;

-- Ver regras de comissão
SELECT * FROM sales_commission_rules;
```

---

## 🎯 IMPACTO NO SISTEMA

Com essas tabelas criadas:

✅ **ProcedureSheet** funcionará sem erros  
✅ **Profit Engine** calculará margem corretamente  
✅ **BudgetSheet** mostrará análise de lucro  
✅ **Comissões** serão calculadas automaticamente  

---

## 🔧 TROUBLESHOOTING

### Erro: "relation does not exist"
- Execute os SQLs na ordem correta
- Verifique se a tabela `clinic` existe

### Erro: "uuid_generate_v4 does not exist"
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Erro: "column clinic_id does not exist"
- Substitua `'550e8400-e29b-41d4-a716-446655440000'` pelo ID real da sua clínica
- Consulte: `SELECT id FROM clinic LIMIT 1;`

---

**Criado em:** 23/12/2025  
**Status:** ✅ Pronto para execução
