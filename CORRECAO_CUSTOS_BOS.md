# 🔧 CORREÇÃO: Salvamento de Custos e Margem BOS

## 📋 Problema Identificado

Ao tentar salvar os custos BOS (Custo Materiais, Custo Profissional, Custo Operacional) no modal "Editar Procedimento", os valores não estavam sendo persistidos no banco de dados.

## 🔍 Causa Raiz

Após análise do schema e do código, identifiquei **3 possíveis causas**:

### 1. **Constraint UNIQUE pode estar faltando**
O código usa `upsert` com `onConflict: 'procedure_id'`, que requer uma constraint UNIQUE:
```typescript
.upsert({...}, { onConflict: 'procedure_id' })
```

### 2. **Coluna `total_cost` pode estar causando conflito**
A coluna `total_cost` deve ser uma **GENERATED COLUMN** (calculada automaticamente), não uma coluna normal que precisa ser inserida.

### 3. **Valores NULL não tratados**
Campos de custo podem estar com valores NULL, causando problemas no cálculo.

## ✅ Solução Implementada

Criei o script **`FIX_PROCEDURE_COSTS_SAVE.sql`** que:

1. ✅ **Verifica e cria** a constraint UNIQUE em `procedure_id`
2. ✅ **Recria a coluna `total_cost`** como GENERATED COLUMN
3. ✅ **Define valores padrão** (0) para todas as colunas de custo
4. ✅ **Atualiza valores NULL** existentes para 0
5. ✅ **Verifica políticas RLS** (já criadas pelo script anterior)
6. ✅ **Executa teste de UPSERT** para validar

## 🚀 Como Executar

### **Passo 1: Execute o Script SQL**
```sql
-- Copie e cole o conteúdo de:
-- sql/FIX_PROCEDURE_COSTS_SAVE.sql
-- no Supabase SQL Editor e execute
```

### **Passo 2: Teste no Sistema**
1. Navegue para **Configurações → Procedimentos**
2. Clique em **Editar** em qualquer procedimento
3. Vá para a aba **"Custos & Margem (BOS)"**
4. Preencha os valores:
   - Custo Materiais: R$ 100,00
   - Custo Profissional: R$ 200,00
   - Custo Operacional: R$ 50,00
5. Clique em **"Salvar Procedimento"**
6. Recarregue a página e verifique se os valores foram salvos

## 📊 Estrutura da Tabela `procedure_costs`

```sql
CREATE TABLE public.procedure_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  procedure_id uuid NOT NULL UNIQUE REFERENCES procedure(id),
  
  -- Custos BOS
  material_cost numeric DEFAULT 0,
  professional_cost numeric DEFAULT 0,
  operational_overhead numeric DEFAULT 0,
  comission_cost numeric DEFAULT 0,
  
  -- Taxas e Impostos
  tax_percent numeric DEFAULT 0,
  card_fee_percent numeric DEFAULT 0,
  
  -- Total Calculado Automaticamente
  total_cost numeric GENERATED ALWAYS AS (
    material_cost + professional_cost + operational_overhead
  ) STORED,
  
  notes text,
  updated_at timestamp with time zone DEFAULT now()
);
```

## 🎯 Cálculo da Margem

A margem é calculada automaticamente no frontend:

```typescript
const totalCost = costs.material_cost + costs.professional_cost + costs.operational_overhead;
const margin = formData.base_price - totalCost;
const marginPercent = formData.base_price > 0 ? (margin / formData.base_price) * 100 : 0;
```

**Exemplo:**
- Preço Base: R$ 800,00
- Custo Total: R$ 350,00 (100 + 200 + 50)
- **Lucro Estimado: R$ 450,00**
- **Margem: 56,25%**
- **Meta BOS: ≥30%** ✅

## 🔐 Políticas RLS

As políticas RLS já foram criadas pelo script `FIX_PROCEDURE_RLS.sql`:
- ✅ Enable read access for authenticated users
- ✅ Enable insert for authenticated users
- ✅ Enable update for authenticated users
- ✅ Enable delete for authenticated users

## 📝 Observações Importantes

1. **Isolamento por Clínica**: Cada custo é vinculado a uma `clinic_id`
2. **Um custo por procedimento**: A constraint UNIQUE em `procedure_id` garante isso
3. **Cálculo Automático**: O `total_cost` é calculado pelo banco de dados
4. **Valores Padrão**: Todos os custos iniciam em 0 se não informados

## 🎨 Interface do Usuário

O modal "Editar Procedimento" tem duas abas:

### **Aba 1: Dados Básicos**
- Nome do Procedimento
- Categoria (Clínica Geral, Ortodontia, HOF)
- Especialidade (Dentística, Cirurgia, etc.)
- Preço Base
- Duração
- Sessões Necessárias

### **Aba 2: Custos & Margem (BOS)** ⭐
- Custo Materiais
- Custo Profissional
- Custo Operacional
- **Simulação de Resultado** (calculada em tempo real):
  - Preço Base
  - (-) Custos Totais
  - **= Lucro Estimado**
  - **Margem: X%**
  - **Meta BOS: ≥30%**

## ✅ Checklist de Validação

Após executar o script, verifique:

- [ ] Script executado sem erros
- [ ] Mensagens de sucesso no console SQL
- [ ] Consegue abrir o modal de edição de procedimento
- [ ] Consegue preencher os custos na aba "Custos & Margem (BOS)"
- [ ] Consegue salvar sem erros
- [ ] Ao reabrir o modal, os custos estão salvos
- [ ] A margem é calculada corretamente
- [ ] O indicador de Meta BOS aparece (verde se ≥30%, vermelho se <30%)

## 🆘 Troubleshooting

### **Erro: "duplicate key value violates unique constraint"**
- **Causa**: Já existe um registro de custo para este procedimento
- **Solução**: O script já trata isso com UPSERT (atualiza ao invés de inserir)

### **Erro: "column 'total_cost' does not exist"**
- **Causa**: A coluna foi removida acidentalmente
- **Solução**: Execute o script `FIX_PROCEDURE_COSTS_SAVE.sql` novamente

### **Erro: "new row violates row-level security policy"**
- **Causa**: Políticas RLS não estão configuradas
- **Solução**: Execute o script `FIX_PROCEDURE_RLS.sql` primeiro

---

**Criado em**: 2025-12-22  
**Autor**: Antigravity AI  
**Versão**: 1.0
