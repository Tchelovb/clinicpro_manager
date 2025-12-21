# 🚀 GUIA RÁPIDO DE EXECUÇÃO - MIGRATIONS

**Data:** 21/12/2025  
**Status:** ✅ PRONTO PARA EXECUTAR

---

## ⚠️ IMPORTANTE - LEIA ANTES DE EXECUTAR

### Pré-requisitos

1. ✅ **Backup do banco de dados**
2. ✅ **Acesso ao PostgreSQL/Supabase**
3. ✅ **Permissões de superuser**
4. ✅ **Ambiente de desenvolvimento testado**

---

## 🔧 CORREÇÃO APLICADA

### Problema Resolvido
❌ **Erro:** `relation "public.inventory_items" does not exist`

✅ **Solução:** Criada migration `005_inventory_base.sql` que deve ser executada ANTES da `004_ALL_P1_P2_MODULES.sql`

### Nova Ordem de Execução

```
001_appointment_confirmations.sql  (P0)
002_lab_orders.sql                 (P0)
003_patient_recalls.sql            (P0)
005_inventory_base.sql             (P2) ⬅️ NOVA! Executar ANTES da 004
004_ALL_P1_P2_MODULES.sql         (P1/P2)
```

---

## 📋 OPÇÃO 1: EXECUTAR TUDO (Recomendado)

### Via Script Master

```bash
# 1. Navegar até o diretório
cd c:\Users\marce\OneDrive\Documentos\ClinicPro\sql\migrations

# 2. Executar script master (já corrigido)
psql -U postgres -d clinicpro -f RUN_ALL_MIGRATIONS.sql
```

O script master já está atualizado com a ordem correta!

---

## 📋 OPÇÃO 2: VIA SUPABASE DASHBOARD (Recomendado para você)

### ⚠️ IMPORTANTE
O Supabase Dashboard **NÃO suporta** comandos `\echo` e `\i` do psql.  
Execute cada migration **separadamente** no SQL Editor.

### Passo a Passo

1. **Acesse:** Supabase Dashboard → SQL Editor → New Query

2. **Execute na ordem exata:**

#### ✅ Passo 1: Confirmações de Consultas (P0)

1. Abra o arquivo `001_appointment_confirmations.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run**
5. Aguarde mensagem de sucesso

**Verificação:**
```sql
SELECT COUNT(*) FROM appointment_confirmations;
-- Deve retornar 0 (tabela vazia mas criada)
```

---

#### ✅ Passo 2: Gestão Laboratorial (P0)

1. Abra o arquivo `002_lab_orders.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run**
5. Aguarde mensagem de sucesso

**Verificação:**
```sql
SELECT COUNT(*) FROM lab_orders;
-- Deve retornar 0 (tabela vazia mas criada)
```

---

#### ✅ Passo 3: Recalls Estruturados (P0)

1. Abra o arquivo `003_patient_recalls.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run**
5. Aguarde mensagem de sucesso

**Verificação:**
```sql
SELECT COUNT(*) FROM patient_recalls;
-- Deve retornar 0 (tabela vazia mas criada)
```

---

#### ✅ Passo 4: Estoque Base (P2) - **IMPORTANTE!**

⚠️ **Execute ANTES do Passo 5!**

1. Abra o arquivo `005_inventory_base.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run**
5. Aguarde mensagem de sucesso

**Verificação:**
```sql
SELECT COUNT(*) FROM inventory_items;
-- Deve retornar 0 (tabela vazia mas criada)
```

---

#### ✅ Passo 5: Módulos P1 e P2

1. Abra o arquivo `004_ALL_P1_P2_MODULES.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run**
5. Aguarde mensagem de sucesso (pode demorar ~30 segundos)

**Verificação:**
```sql
SELECT COUNT(*) FROM recurring_contracts;
-- Deve retornar 0 (tabela vazia mas criada)
```

---

## 📋 OPÇÃO 3: EXECUTAR MANUALMENTE (Terminal psql)

---

## ✅ VERIFICAÇÃO PÓS-EXECUÇÃO

### 1. Verificar Tabelas Criadas

```sql
SELECT COUNT(*) as total_tabelas
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'appointment_confirmations',
    'lab_orders',
    'patient_recalls',
    'inventory_categories',
    'inventory_items',
    'inventory_movements',
    'medical_alerts',
    'patient_anamnesis',
    'clinical_images',
    'recurring_contracts',
    'dental_charting',
    'medication_library',
    'prescriptions',
    'prescription_items',
    'medical_certificates',
    'procedure_recipes',
    'procedure_recipe_items',
    'procedure_material_usage',
    'professional_monthly_metrics',
    'clinic_kpis'
  );

-- Deve retornar: 20 tabelas
```

### 2. Verificar Views Criadas

```sql
SELECT COUNT(*) as total_views
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'pending_confirmations_view',
    'overdue_lab_orders_view',
    'lab_supplier_performance_view',
    'recall_opportunities_view',
    'low_stock_items_view',
    'mrr_dashboard_view',
    'professional_ranking'
  );

-- Deve retornar: 7 views
```

### 3. Testar Triggers

```sql
-- Teste 1: Criar agendamento e verificar confirmação automática
INSERT INTO public.appointments (clinic_id, patient_id, doctor_id, date, duration, type)
VALUES (
  (SELECT id FROM public.clinics LIMIT 1),
  (SELECT id FROM public.patients LIMIT 1),
  (SELECT id FROM public.users WHERE role = 'PROFESSIONAL' LIMIT 1),
  now() + INTERVAL '1 day',
  60,
  'EVALUATION'
);

-- Verificar se confirmação foi criada
SELECT * FROM public.appointment_confirmations 
ORDER BY created_at DESC LIMIT 1;

-- Deve retornar: 1 registro com status 'PENDING'
```

### 4. Testar Estoque

```sql
-- Criar categoria de estoque
INSERT INTO public.inventory_categories (clinic_id, name)
VALUES (
  (SELECT id FROM public.clinics LIMIT 1),
  'Materiais Odontológicos'
);

-- Criar item de estoque
INSERT INTO public.inventory_items (clinic_id, category_id, name, current_stock, minimum_stock, unit_cost)
VALUES (
  (SELECT id FROM public.clinics LIMIT 1),
  (SELECT id FROM public.inventory_categories LIMIT 1),
  'Anestésico Lidocaína',
  5,
  10,
  25.00
);

-- Verificar se alerta de estoque baixo foi criado
SELECT * FROM public.ai_insights 
WHERE category = 'operational' 
  AND title = 'Estoque Baixo'
ORDER BY created_at DESC LIMIT 1;

-- Deve retornar: 1 insight de estoque baixo
```

---

## 🐛 TROUBLESHOOTING

### Erro: "relation already exists"

**Causa:** Tabela já foi criada anteriormente

**Solução:**
```sql
-- Opção 1: Fazer rollback completo (ver README.md)
-- Opção 2: Pular essa migration específica
```

### Erro: "permission denied"

**Causa:** Usuário sem permissões

**Solução:**
```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### Erro: "foreign key constraint"

**Causa:** Tabela referenciada não existe

**Solução:** Verificar se as tabelas base existem:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN ('clinics', 'patients', 'users', 'professionals', 'appointments')
ORDER BY table_name;
```

---

## 📊 RESUMO DAS TABELAS CRIADAS

| # | Tabela | Migration | Prioridade |
|---|--------|-----------|------------|
| 1 | `appointment_confirmations` | 001 | P0 |
| 2 | `lab_orders` | 002 | P0 |
| 3 | `patient_recalls` | 003 | P0 |
| 4 | `inventory_categories` | 005 | P2 |
| 5 | `inventory_items` | 005 | P2 |
| 6 | `inventory_movements` | 005 | P2 |
| 7 | `medical_alerts` | 004 | P1 |
| 8 | `patient_anamnesis` | 004 | P1 |
| 9 | `clinical_images` | 004 | P1 |
| 10 | `recurring_contracts` | 004 | P1 |
| 11 | `dental_charting` | 004 | P1 |
| 12 | `medication_library` | 004 | P2 |
| 13 | `prescriptions` | 004 | P2 |
| 14 | `prescription_items` | 004 | P2 |
| 15 | `medical_certificates` | 004 | P2 |
| 16 | `procedure_recipes` | 004 | P2 |
| 17 | `procedure_recipe_items` | 004 | P2 |
| 18 | `procedure_material_usage` | 004 | P2 |
| 19 | `professional_monthly_metrics` | 004 | P2 |
| 20 | `clinic_kpis` | 004 | P2 |

**Total:** 20 tabelas + 7 views + 10+ triggers

---

## ✅ CHECKLIST FINAL

Antes de executar:
- [ ] Backup do banco criado
- [ ] Ambiente de desenvolvimento testado
- [ ] Permissões verificadas
- [ ] Ordem de execução entendida

Após executar:
- [ ] 20 tabelas criadas
- [ ] 7 views criadas
- [ ] Triggers funcionando
- [ ] Testes básicos passando
- [ ] Sem erros nos logs

---

## 🎯 PRÓXIMO PASSO

Após executar com sucesso:

1. ✅ Atualizar `TODO_REFINAMENTO_EASYDENT.md`
2. ✅ Marcar migrations como concluídas
3. ✅ Iniciar desenvolvimento dos TypeScript types
4. ✅ Implementar services backend

---

**Última Atualização:** 21/12/2025 14:56  
**Status:** ✅ CORRIGIDO E PRONTO PARA EXECUTAR
