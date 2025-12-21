# 📦 Migrations - Refinamento EasyDent

**Criado em:** 21/12/2025  
**Total de Módulos:** 16  
**Impacto Estimado:** +R$ 124.500/mês (+83% faturamento)

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Arquivos](#estrutura-de-arquivos)
3. [Como Executar](#como-executar)
4. [Módulos Implementados](#módulos-implementados)
5. [Verificação e Testes](#verificação-e-testes)
6. [Rollback](#rollback)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este diretório contém todas as migrations SQL necessárias para implementar o **Refinamento EasyDent** no ClinicPro. As migrations foram organizadas em 3 fases baseadas em prioridade e impacto.

### Fases de Implementação

| Fase | Prioridade | Módulos | Impacto | Prazo |
|------|------------|---------|---------|-------|
| **Fase 1** | P0 - Crítico | 3 | +R$ 45.000/mês | 30 dias |
| **Fase 2** | P1 - Alta | 6 | +R$ 47.000/mês | 60 dias |
| **Fase 3** | P2 - Média | 7 | +R$ 32.500/mês | 90 dias |

---

## 📁 Estrutura de Arquivos

```
sql/migrations/
├── README.md                           # Este arquivo
├── GUIA_RAPIDO.md                      # Guia rápido de execução
├── RUN_ALL_MIGRATIONS.sql              # Script master (executa tudo)
│
├── 001_appointment_confirmations.sql   # P0 - Confirmações de Consultas
├── 002_lab_orders.sql                  # P0 - Gestão Laboratorial
├── 003_patient_recalls.sql             # P0 - Recalls Estruturados
├── 005_inventory_base.sql              # P2 - Estoque Base (EXECUTAR ANTES DA 004!)
│
└── 004_ALL_P1_P2_MODULES.sql          # P1/P2 - Todos os outros módulos
```

**⚠️ IMPORTANTE:** A migration `005_inventory_base.sql` deve ser executada ANTES da `004_ALL_P1_P2_MODULES.sql` pois a 004 depende das tabelas de estoque.

---

## 🚀 Como Executar

### Opção 1: Executar Tudo de Uma Vez (Recomendado para DEV)

```bash
# No terminal PostgreSQL (psql)
cd sql/migrations
psql -U postgres -d clinicpro -f RUN_ALL_MIGRATIONS.sql
```

### Opção 2: Executar Fase por Fase (Recomendado para PRODUÇÃO)

```bash
# Fase 1 - P0 (Crítico)
psql -U postgres -d clinicpro -f 001_appointment_confirmations.sql
psql -U postgres -d clinicpro -f 002_lab_orders.sql
psql -U postgres -d clinicpro -f 003_patient_recalls.sql

# Aguardar testes e validação...

# Fase 2 e 3 - P1/P2
psql -U postgres -d clinicpro -f 004_ALL_P1_P2_MODULES.sql
```

### Opção 3: Via Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo de cada arquivo
4. Execute um por vez
5. Verifique os resultados

---

## 📊 Módulos Implementados

### 🔴 Fase 1: P0 - Crítico

#### 1. Confirmação Automática de Consultas
**Arquivo:** `001_appointment_confirmations.sql`  
**Impacto:** +R$ 7.500/mês  
**Tabelas:**
- `appointment_confirmations`

**Views:**
- `pending_confirmations_view`

**Triggers:**
- `auto_create_appointment_confirmation()` - Cria confirmação ao criar agendamento
- `sync_appointment_status_on_confirmation()` - Sincroniza status

**Funcionalidades:**
- ✅ Rastreamento de lembretes (24h e 2h antes)
- ✅ Status de confirmação (PENDING, CONFIRMED, CANCELLED)
- ✅ Integração com WhatsApp/SMS/Email
- ✅ Dashboard de confirmações pendentes

---

#### 2. Gestão Laboratorial
**Arquivo:** `002_lab_orders.sql`  
**Impacto:** +R$ 15.000/mês  
**Tabelas:**
- `lab_orders`

**Views:**
- `overdue_lab_orders_view` - Pedidos atrasados
- `lab_supplier_performance_view` - Ranking de laboratórios

**Triggers:**
- `create_insight_on_lab_delay()` - Cria insight de IA quando atrasa

**Funcionalidades:**
- ✅ Rastreamento completo de pedidos
- ✅ Alertas automáticos de atraso
- ✅ Ranking de laboratórios por performance
- ✅ Controle de qualidade e correções

---

#### 3. Recalls Estruturados
**Arquivo:** `003_patient_recalls.sql`  
**Impacto:** +R$ 22.500/mês  
**Tabelas:**
- `patient_recalls`

**Views:**
- `recall_opportunities_view` - Integração com Radar de Oportunidades

**Triggers:**
- `auto_create_recall_after_procedure()` - Cria recall automático após procedimento
- `auto_update_recall_priority()` - Calcula prioridade automaticamente

**Funcionalidades:**
- ✅ 10 tipos de recalls (Botox, Ortodontia, Implante, etc)
- ✅ Priorização inteligente (0-100)
- ✅ Integração com Radar de Oportunidades (Camada Prata)
- ✅ Criação automática após procedimentos

---

### 🟡 Fase 2 e 3: P1/P2

**Arquivo:** `004_ALL_P1_P2_MODULES.sql`  
**Impacto:** +R$ 79.500/mês

#### Módulos Incluídos:

4. **Responsável Financeiro e Alertas Médicos** (P1)
   - Campos em `patients` para responsável
   - Tabela `medical_alerts`

5. **Anamnese Digital Estruturada** (P1)
   - Tabela `patient_anamnesis`
   - Campos estruturados para contraindicações

6. **Imagens Clínicas** (P1)
   - Tabela `clinical_images`
   - Suporte a antes/depois

7. **Contratos Recorrentes** (P1)
   - Tabela `recurring_contracts`
   - View `mrr_dashboard_view`

8. **Odontograma Visual** (P1)
   - Tabela `dental_charting`

9. **Prescrições Eletrônicas** (P2)
   - Tabelas: `medication_library`, `prescriptions`, `prescription_items`, `medical_certificates`

10. **Estoque Integrado** (P2)
    - Tabelas: `procedure_recipes`, `procedure_recipe_items`, `procedure_material_usage`

11. **Produtividade Profissional** (P2)
    - Tabela `professional_monthly_metrics`
    - View `professional_ranking`

12. **KPIs Históricos** (P2)
    - Tabela `clinic_kpis`

---

## ✅ Verificação e Testes

### Após Executar as Migrations

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%appointment_confirmation%'
     OR table_name LIKE '%lab_order%'
     OR table_name LIKE '%recall%'
ORDER BY table_name;

-- Verificar views criadas
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar triggers criados
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Testar criação de confirmação automática
INSERT INTO public.appointments (clinic_id, patient_id, doctor_id, date, duration, type)
VALUES (
  'YOUR_CLINIC_ID',
  'YOUR_PATIENT_ID',
  'YOUR_DOCTOR_ID',
  now() + INTERVAL '1 day',
  60,
  'EVALUATION'
);

-- Verificar se confirmação foi criada
SELECT * FROM public.appointment_confirmations 
ORDER BY created_at DESC LIMIT 1;
```

---

## 🔄 Rollback

### Reverter Todas as Migrations

```sql
-- ATENÇÃO: Isso irá DELETAR todas as tabelas e dados!
-- Execute apenas se necessário!

DROP TABLE IF EXISTS public.appointment_confirmations CASCADE;
DROP TABLE IF EXISTS public.lab_orders CASCADE;
DROP TABLE IF EXISTS public.patient_recalls CASCADE;
DROP TABLE IF EXISTS public.medical_alerts CASCADE;
DROP TABLE IF EXISTS public.patient_anamnesis CASCADE;
DROP TABLE IF EXISTS public.clinical_images CASCADE;
DROP TABLE IF EXISTS public.recurring_contracts CASCADE;
DROP TABLE IF EXISTS public.dental_charting CASCADE;
DROP TABLE IF EXISTS public.medication_library CASCADE;
DROP TABLE IF EXISTS public.prescriptions CASCADE;
DROP TABLE IF EXISTS public.prescription_items CASCADE;
DROP TABLE IF EXISTS public.medical_certificates CASCADE;
DROP TABLE IF EXISTS public.procedure_recipes CASCADE;
DROP TABLE IF EXISTS public.procedure_recipe_items CASCADE;
DROP TABLE IF EXISTS public.procedure_material_usage CASCADE;
DROP TABLE IF EXISTS public.professional_monthly_metrics CASCADE;
DROP TABLE IF EXISTS public.clinic_kpis CASCADE;

-- Remover colunas adicionadas em patients
ALTER TABLE public.patients 
DROP COLUMN IF EXISTS responsible_party_id,
DROP COLUMN IF EXISTS relationship_type,
DROP COLUMN IF EXISTS profile_photo_url,
DROP COLUMN IF EXISTS document_photo_front_url,
DROP COLUMN IF EXISTS document_photo_back_url;

-- Remover views
DROP VIEW IF EXISTS pending_confirmations_view CASCADE;
DROP VIEW IF EXISTS overdue_lab_orders_view CASCADE;
DROP VIEW IF EXISTS lab_supplier_performance_view CASCADE;
DROP VIEW IF EXISTS recall_opportunities_view CASCADE;
DROP VIEW IF EXISTS mrr_dashboard_view CASCADE;
DROP VIEW IF EXISTS professional_ranking CASCADE;

-- Remover funções
DROP FUNCTION IF EXISTS calculate_recall_priority CASCADE;
DROP FUNCTION IF EXISTS get_lab_order_delay_status CASCADE;
DROP FUNCTION IF EXISTS auto_create_appointment_confirmation CASCADE;
DROP FUNCTION IF EXISTS sync_appointment_status_on_confirmation CASCADE;
DROP FUNCTION IF EXISTS create_insight_on_lab_delay CASCADE;
DROP FUNCTION IF EXISTS auto_create_recall_after_procedure CASCADE;
DROP FUNCTION IF EXISTS auto_update_recall_priority CASCADE;
DROP FUNCTION IF EXISTS auto_update_recall_status_to_overdue CASCADE;
DROP FUNCTION IF EXISTS update_appointment_confirmation_timestamp CASCADE;
DROP FUNCTION IF EXISTS update_lab_order_timestamp CASCADE;
DROP FUNCTION IF EXISTS update_recall_timestamp CASCADE;
```

---

## 🐛 Troubleshooting

### Erro: "relation already exists"

**Solução:** A tabela já existe. Você pode:
1. Fazer rollback e executar novamente
2. Ou pular essa migration específica

### Erro: "foreign key constraint"

**Solução:** Certifique-se de que as tabelas referenciadas existem:
- `clinics`
- `patients`
- `users`
- `professionals`
- `appointments`
- `treatment_items`
- `budgets`

### Erro: "permission denied"

**Solução:** Certifique-se de estar executando como superuser ou com permissões adequadas:

```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### Erro: "syntax error"

**Solução:** Verifique a versão do PostgreSQL. Estas migrations foram testadas em PostgreSQL 14+.

---

## 📞 Suporte

**Dúvidas ou Problemas?**

1. Verifique o arquivo `TODO_REFINAMENTO_EASYDENT.md`
2. Consulte o arquivo `REFINAMENTO.md` para detalhes técnicos
3. Revise os logs de execução

---

## 📝 Changelog

### 21/12/2025
- ✅ Criação inicial de todas as migrations
- ✅ Implementação dos módulos P0 (Críticos)
- ✅ Implementação dos módulos P1 e P2
- ✅ Criação de views e triggers automáticos
- ✅ Documentação completa

---

**Última Atualização:** 21/12/2025  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para Execução
