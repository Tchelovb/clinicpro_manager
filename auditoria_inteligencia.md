# 🧠 AUDITORIA DE INTELIGÊNCIA - CLINICPRO MANAGER

**Data da Auditoria:** 23/12/2025  
**Versão do Sistema:** BOS 18.8  
**Foco:** Sistema de Inteligência e IA  
**Status:** Motor Nativo Ativo

---

## 📋 SUMÁRIO EXECUTIVO

O sistema de inteligência do ClinicPro é baseado em **3 camadas integradas** que transformam dados em decisões e ações automáticas. O diferencial está no **motor de insights nativos** implementado em SQL puro, eliminando custos de APIs externas e garantindo execução em tempo real.

---

## 🏛️ ARQUITETURA DE INTELIGÊNCIA

### Visão Geral

```
┌─────────────────────────────────────────────────────────┐
│                  CAMADA 1: ClinicHealth                  │
│              (Monitoramento Macro - Saúde)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │ IVC = (Σ 5 Pilares) / 5                          │   │
│  │ - Marketing (ROI, CAC, Leads)                    │   │
│  │ - Vendas (Conversão, Pipeline, Ticket)           │   │
│  │ - Clínico (Produção, Qualidade, NPS)             │   │
│  │ - Operacional (Ocupação, No-Show)                │   │
│  │ - Financeiro (Margem, Inadimplência)             │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              CAMADA 2: BOS Intelligence                  │
│              (Motor Tático - Ação Imediata)              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 7 Sentinelas Automáticas                         │   │
│  │ ├─ S1: Vendas High-Ticket Paradas                │   │
│  │ ├─ S2: Leads Sem Contato                         │   │
│  │ ├─ S3: Inadimplência Pós-Cirúrgica               │   │
│  │ ├─ S4: Pacientes VIP Inativos                    │   │
│  │ ├─ S5: No-Show Recorrente                        │   │
│  │ ├─ S6: Orçamento Aprovado Sem Agendamento        │   │
│  │ └─ S7: Pipeline Estagnado                        │   │
│  │                                                   │   │
│  │ Conversão: ai_insights → tactical_operations     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│            CAMADA 3: Executive Mastery                   │
│            (Gamificação - Evolução CEO)                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Sistema de Progressão                            │   │
│  │ - Níveis: 1 (Gestor) → 4 (Diretor)              │   │
│  │ - XP: Baseado em ações e impacto financeiro      │   │
│  │ - Features: Desbloqueio progressivo              │   │
│  │ - Feedback: Dopamina Gerencial                   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 CAMADA 1: CLINICHEALTH - MONITORAMENTO VITAL

### Objetivo
Monitorar a "saúde" do negócio em tempo real através de 5 pilares fundamentais.

### IVC (Índice de Vitalidade Corporativa)

**Fórmula:**
```sql
IVC = (health_marketing + health_sales + health_clinical + 
       health_operational + health_financial) / 5
```

**Estados de Saúde:**
```javascript
function getHealthStatus(ivc) {
  if (ivc >= 80) return { status: 'excellent', color: 'green', label: 'Alta Performance' };
  if (ivc >= 60) return { status: 'good', color: 'yellow', label: 'Atenção Necessária' };
  if (ivc >= 40) return { status: 'warning', color: 'orange', label: 'Correção Urgente' };
  return { status: 'critical', color: 'red', label: 'Intervenção Imediata' };
}
```

### 5 Pilares Monitorados

#### 1. Pilar Marketing
**Métricas:**
- ROI (Return on Investment)
- CAC (Custo de Aquisição de Cliente)
- Leads/mês
- Taxa de resposta

**Eventos que Afetam:**
```javascript
{
  'roi_drop': { impact: -10 },          // ROI caiu
  'roi_increase': { impact: +10 },      // ROI subiu
  'cac_increase': { impact: -5 },       // CAC aumentou
  'lead_volume_up': { impact: +5 }      // Volume de leads aumentou
}
```

**Alertas:**
- ROI < 200%
- CAC > R$ 500
- Leads < 20/mês

#### 2. Pilar Vendas
**Métricas:**
- Taxa de conversão
- Pipeline total
- Ticket médio
- Orçamentos aprovados

**Eventos que Afetam:**
```javascript
{
  'conversion_drop': { impact: -10 },   // Conversão caiu
  'lead_lost': { impact: -5 },          // Lead perdido
  'budget_approved': { impact: +5 },    // Orçamento aprovado
  'high_ticket_closed': { impact: +10 } // High-ticket fechado
}
```

**Alertas:**
- Conversão < 25%
- Pipeline estagnado
- Ticket médio em queda

#### 3. Pilar Clínico
**Métricas:**
- Produção/dia
- Tratamentos concluídos
- NPS (Net Promoter Score)
- Qualidade técnica

**Eventos que Afetam:**
```javascript
{
  'patient_complaint': { impact: -15 },  // Reclamação
  'excellent_review': { impact: +10 },   // Avaliação 5 estrelas
  'treatment_completed': { impact: +5 }, // Tratamento concluído
  'quality_issue': { impact: -10 }       // Problema de qualidade
}
```

**Alertas:**
- Produção < meta
- NPS < 90
- Reclamações > 2/mês

#### 4. Pilar Operacional
**Métricas:**
- Taxa de ocupação da agenda
- No-show rate
- Tempo médio de atendimento
- Eficiência operacional

**Eventos que Afetam:**
```javascript
{
  'no_show': { impact: -5 },              // Falta sem avisar
  'schedule_optimized': { impact: +5 },   // Agenda otimizada
  'occupancy_high': { impact: +10 },      // Ocupação > 90%
  'delay_accumulated': { impact: -5 }     // Atrasos acumulados
}
```

**Alertas:**
- Ocupação < 70%
- No-show > 10%
- Atrasos frequentes

#### 5. Pilar Financeiro
**Métricas:**
- Margem de lucro
- Inadimplência
- Fluxo de caixa
- EBITDA

**Eventos que Afetam:**
```javascript
{
  'overdue_payment': { impact: -10 },    // Pagamento atrasado
  'payment_received': { impact: +5 },    // Pagamento recebido
  'margin_drop': { impact: -10 },        // Margem caiu
  'cash_flow_positive': { impact: +10 }  // Fluxo de caixa positivo
}
```

**Alertas:**
- Margem < 40%
- Inadimplência > 5%
- Fluxo de caixa negativo

### Implementação Técnica

**Tabela: user_progression**
```sql
CREATE TABLE public.user_progression (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  clinic_id uuid REFERENCES clinics(id),
  
  -- ClinicHealth (HP)
  clinic_health_score integer DEFAULT 100 CHECK (clinic_health_score BETWEEN 0 AND 100),
  health_marketing integer DEFAULT 100,
  health_sales integer DEFAULT 100,
  health_clinical integer DEFAULT 100,
  health_operational integer DEFAULT 100,
  health_financial integer DEFAULT 100,
  
  -- Timestamps
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

**Tabela: health_events**
```sql
CREATE TABLE public.health_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id),
  
  event_type text NOT NULL,
  impact integer NOT NULL,  -- Positivo ou negativo
  pillar text CHECK (pillar IN ('marketing', 'sales', 'clinical', 'operational', 'financial', 'overall')),
  
  title text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamp DEFAULT now()
);
```

---

## ⚡ CAMADA 2: BOS INTELLIGENCE - MOTOR TÁTICO

### Objetivo
Executar ações táticas automáticas baseadas em insights gerados pelas sentinelas.

### Motor de Insights Nativos

**Arquivo:** `sql/native_insights_engine.sql`

**Função Principal:**
```sql
CREATE OR REPLACE FUNCTION generate_native_insights(p_clinic_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Limpar insights antigos resolvidos (mais de 30 dias)
    DELETE FROM public.ai_insights
    WHERE clinic_id = p_clinic_id
      AND status = 'RESOLVED'
      AND created_at < NOW() - INTERVAL '30 days';
    
    -- Executar 7 sentinelas
    -- S1: Vendas High-Ticket Paradas
    -- S2: Leads Sem Contato
    -- S3: Inadimplência Pós-Cirúrgica
    -- S4: Pacientes VIP Inativos
    -- S5: No-Show Recorrente
    -- S6: Orçamento Aprovado Sem Agendamento
    -- S7: Pipeline Estagnado
END;
$$;
```

### 7 Sentinelas Automáticas

#### S1: Vendas High-Ticket Paradas
**Gatilho:** Orçamento > R$ 15k parado > 3 dias  
**Prioridade:** CRITICAL  
**Categoria:** SALES  

**Lógica SQL:**
```sql
INSERT INTO public.ai_insights (...)
SELECT
    p_clinic_id,
    '💰 Orçamento High-Ticket Parado: ' || p.name,
    'Orçamento de R$ ' || TO_CHAR(b.final_value, 'FM999,999,999.00') || 
    ' está em negociação há ' || EXTRACT(DAY FROM NOW() - b.created_at) || ' dias sem movimentação.',
    'CRITICAL',
    'SALES',
    'BUDGET',
    b.id,
    'Entre em contato imediato com o paciente para entender objeções e fechar a venda.',
    'OPEN'
FROM public.budgets b
JOIN public.patients p ON b.patient_id = p.id
WHERE b.clinic_id = p_clinic_id
  AND b.status IN ('DRAFT', 'PENDING')
  AND b.final_value > 15000
  AND b.created_at < NOW() - INTERVAL '3 days'
  AND NOT EXISTS (
      SELECT 1 FROM public.ai_insights ai
      WHERE ai.related_entity_id = b.id
        AND ai.status = 'OPEN'
        AND ai.category = 'SALES'
  );
```

**Ação Recomendada:**
- Script de resgate high-ticket
- Oferecer condições especiais de pagamento
- Entender objeções do paciente

#### S2: Leads Sem Contato
**Gatilho:** Lead sem interação > 12h  
**Prioridade:** HIGH/CRITICAL (depende da prioridade do lead)  
**Categoria:** MARKETING  

**Lógica SQL:**
```sql
INSERT INTO public.ai_insights (...)
SELECT
    p_clinic_id,
    '🔥 Lead Quente Sem Contato: ' || l.name,
    'Lead cadastrado há ' || EXTRACT(HOUR FROM NOW() - l.created_at) || ' horas sem nenhuma interação registrada.',
    CASE 
        WHEN l.priority = 'HIGH' THEN 'CRITICAL'
        WHEN EXTRACT(HOUR FROM NOW() - l.created_at) > 24 THEN 'HIGH'
        ELSE 'MEDIUM'
    END,
    'MARKETING',
    'LEAD',
    l.id,
    'Realizar contato imediato via WhatsApp ou telefone. Leads não contatados em 12h têm 80% menos chance de conversão.',
    'OPEN'
FROM public.leads l
WHERE l.clinic_id = p_clinic_id
  AND l.created_at < NOW() - INTERVAL '12 hours'
  AND NOT EXISTS (
      SELECT 1 FROM public.lead_interactions li
      WHERE li.lead_id = l.id
  );
```

**Ação Recomendada:**
- Contato imediato via WhatsApp
- Script de abordagem urgente
- Priorizar leads HIGH

#### S3: Inadimplência Pós-Cirúrgica
**Gatilho:** Procedimento concluído com saldo devedor > 7 dias  
**Prioridade:** CRITICAL/HIGH (depende do valor)  
**Categoria:** FINANCIAL  

**Lógica SQL:**
```sql
INSERT INTO public.ai_insights (...)
SELECT
    p_clinic_id,
    '⚠️ Inadimplência Pós-Cirúrgica: ' || p.name,
    'Procedimento "' || ti.procedure_name || '" concluído há ' || 
    EXTRACT(DAY FROM NOW() - ti.updated_at) || ' dias com saldo devedor de R$ ' || 
    TO_CHAR(p.balance_due, 'FM999,999,999.00') || '.',
    CASE 
        WHEN p.balance_due > 10000 THEN 'CRITICAL'
        WHEN p.balance_due > 5000 THEN 'HIGH'
        ELSE 'MEDIUM'
    END,
    'FINANCIAL',
    'PATIENT',
    p.id,
    'Acionar cobrança imediata. Procedimento já foi realizado e o pagamento está em atraso.',
    'OPEN'
FROM public.treatment_items ti
JOIN public.treatments t ON ti.treatment_id = t.id
JOIN public.patients p ON t.patient_id = p.id
WHERE p.clinic_id = p_clinic_id
  AND ti.status = 'CONCLUDED'
  AND p.balance_due > 0
  AND ti.updated_at < NOW() - INTERVAL '7 days';
```

**Ação Recomendada:**
- Cobrança imediata
- Acordo de parcelamento
- Script de cobrança elegante

#### S4: Pacientes VIP Inativos
**Gatilho:** Cliente LTV > R$ 10k sem retorno > 6 meses  
**Prioridade:** HIGH  
**Categoria:** RETENTION  

**Lógica SQL:**
```sql
INSERT INTO public.ai_insights (...)
SELECT
    p_clinic_id,
    '👑 Paciente VIP Inativo: ' || p.name,
    'Cliente com LTV de R$ ' || TO_CHAR(p.total_paid, 'FM999,999,999.00') || 
    ' não retorna há ' || EXTRACT(MONTH FROM NOW() - last_appt.last_date) || ' meses.',
    'HIGH',
    'RETENTION',
    'PATIENT',
    p.id,
    'Enviar campanha de reativação personalizada. Oferecer avaliação gratuita ou desconto em manutenção.',
    'OPEN'
FROM public.patients p
CROSS JOIN LATERAL (
    SELECT MAX(a.date) as last_date
    FROM public.appointments a
    WHERE a.patient_id = p.id
      AND a.status = 'COMPLETED'
) last_appt
WHERE p.clinic_id = p_clinic_id
  AND p.total_paid > 10000
  AND last_appt.last_date < NOW() - INTERVAL '6 months';
```

**Ação Recomendada:**
- Campanha de reativação personalizada
- Oferecer avaliação gratuita
- Desconto em manutenção

#### S5: No-Show Recorrente
**Gatilho:** 3+ faltas em 3 meses  
**Prioridade:** MEDIUM  
**Categoria:** OPERATIONAL  

**Lógica SQL:**
```sql
INSERT INTO public.ai_insights (...)
SELECT
    p_clinic_id,
    '🚫 Paciente com No-Show Recorrente: ' || p.name,
    'Paciente faltou ' || missed_count.total || ' vezes nos últimos 3 meses sem avisar.',
    'MEDIUM',
    'OPERATIONAL',
    'PATIENT',
    p.id,
    'Implementar política de confirmação obrigatória 24h antes. Considerar cobrança de taxa de reserva.',
    'OPEN'
FROM public.patients p
CROSS JOIN LATERAL (
    SELECT COUNT(*) as total
    FROM public.appointments a
    WHERE a.patient_id = p.id
      AND a.status = 'MISSED'
      AND a.date > NOW() - INTERVAL '3 months'
) missed_count
WHERE p.clinic_id = p_clinic_id
  AND missed_count.total >= 3;
```

**Ação Recomendada:**
- Confirmação obrigatória 24h antes
- Taxa de reserva para próximos agendamentos
- Política de no-show

#### S6: Orçamento Aprovado Sem Agendamento
**Gatilho:** Orçamento aprovado > 7 dias sem agendamento  
**Prioridade:** CRITICAL/HIGH (depende do valor)  
**Categoria:** CLINICAL  

**Lógica SQL:**
```sql
INSERT INTO public.ai_insights (...)
SELECT
    p_clinic_id,
    '📅 Orçamento Aprovado Sem Agendamento: ' || p.name,
    'Orçamento de R$ ' || TO_CHAR(b.final_value, 'FM999,999,999.00') || 
    ' foi aprovado há ' || EXTRACT(DAY FROM NOW() - b.updated_at) || ' dias mas o procedimento ainda não foi agendado.',
    CASE 
        WHEN b.final_value > 20000 THEN 'CRITICAL'
        WHEN b.final_value > 10000 THEN 'HIGH'
        ELSE 'MEDIUM'
    END,
    'CLINICAL',
    'BUDGET',
    b.id,
    'Entrar em contato para agendar o procedimento. Orçamentos aprovados não agendados em 7 dias têm 40% de chance de cancelamento.',
    'OPEN'
FROM public.budgets b
JOIN public.patients p ON b.patient_id = p.id
WHERE b.clinic_id = p_clinic_id
  AND b.status = 'APPROVED'
  AND b.updated_at < NOW() - INTERVAL '7 days'
  AND NOT EXISTS (
      SELECT 1 FROM public.treatments t
      WHERE t.budget_id = b.id
  );
```

**Ação Recomendada:**
- Contato para agendar procedimento
- Urgência no agendamento
- Evitar cancelamento

#### S7: Pipeline Estagnado
**Gatilho:** Taxa de conversão < 20% (30 dias)  
**Prioridade:** HIGH  
**Categoria:** SALES  

**Lógica SQL:**
```sql
WITH conversion_stats AS (
    SELECT
        COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
        COUNT(*) as total,
        ROUND((COUNT(*) FILTER (WHERE status = 'APPROVED')::numeric / NULLIF(COUNT(*), 0)) * 100, 2) as rate
    FROM public.budgets
    WHERE clinic_id = p_clinic_id
      AND created_at > NOW() - INTERVAL '30 days'
)
INSERT INTO public.ai_insights (...)
SELECT
    p_clinic_id,
    '📉 Taxa de Conversão Crítica',
    'A taxa de conversão dos últimos 30 dias está em ' || cs.rate || '% (Meta: 30%).',
    'HIGH',
    'SALES',
    'BUDGET',
    NULL,
    'Revisar processo de vendas. Treinar equipe em técnicas de fechamento. Analisar principais objeções.',
    'OPEN'
FROM conversion_stats cs
WHERE cs.rate < 20
  AND cs.total > 10;
```

**Ação Recomendada:**
- Revisar processo de vendas
- Treinar equipe em técnicas de fechamento
- Analisar principais objeções dos clientes

### Triggers Automáticos

**Execução Automática:**
```sql
-- Trigger em budgets
CREATE TRIGGER trigger_insights_on_budget
    AFTER INSERT OR UPDATE ON public.budgets
    FOR EACH ROW
    WHEN (NEW.status IN ('DRAFT', 'PENDING', 'APPROVED'))
    EXECUTE FUNCTION trigger_native_insights();

-- Trigger em leads
CREATE TRIGGER trigger_insights_on_lead
    AFTER INSERT ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION trigger_native_insights();

-- Trigger em treatment_items
CREATE TRIGGER trigger_insights_on_treatment
    AFTER UPDATE ON public.treatment_items
    FOR EACH ROW
    WHEN (NEW.status = 'CONCLUDED')
    EXECUTE FUNCTION trigger_native_insights();
```

**Execução Manual/CRON:**
```sql
-- Executar para todas as clínicas (CRON job)
CREATE OR REPLACE FUNCTION run_insights_engine_for_all_clinics()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    clinic_record RECORD;
BEGIN
    FOR clinic_record IN SELECT id FROM public.clinics WHERE status = 'ACTIVE'
    LOOP
        PERFORM generate_native_insights(clinic_record.id);
    END LOOP;
END;
$$;
```

### Conversão de Insights em Operações Táticas

**Tabela: tactical_operations**
```sql
CREATE TABLE public.tactical_operations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id),
  
  -- Classificação
  type text NOT NULL CHECK (type IN (
    'rescue_roi',           -- Resgate de leads/orçamentos
    'ticket_expansion',     -- Upsell para High-Ticket
    'base_protection',      -- Proteção de inadimplência
    'milestone_conquest'    -- Conquista de metas
  )),
  
  -- Conteúdo
  title text NOT NULL,
  description text,
  
  -- Recompensas
  financial_impact numeric DEFAULT 0,
  xp_reward integer DEFAULT 0,
  
  -- Priorização
  priority text DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'expired')),
  
  -- Relacionamentos
  related_insight_id uuid REFERENCES ai_insights(id),
  related_lead_id uuid,
  related_budget_id uuid,
  related_patient_id uuid,
  
  -- Controle
  deadline timestamp,
  completed_at timestamp,
  completed_by uuid REFERENCES users(id),
  
  created_at timestamp DEFAULT now()
);
```

---

## 🎮 CAMADA 3: EXECUTIVE MASTERY - GAMIFICAÇÃO

### Objetivo
Transformar gestão em jogo, com progressão visível e feedback imediato.

### Sistema de Gamificação

**Arquivo:** `sql/gamification_triggers_v18.8.sql`

#### Algoritmo de XP

**Função: calculate_opportunity_xp**
```sql
CREATE OR REPLACE FUNCTION calculate_opportunity_xp(
    p_budget_id UUID,
    p_clinic_id UUID
) RETURNS TABLE (
    crc_user_id UUID,
    crc_xp INTEGER,
    professional_user_id UUID,
    professional_xp INTEGER,
    tier TEXT
) AS $$
DECLARE
    v_budget_value DECIMAL;
    v_tier TEXT;
    v_crc_xp INTEGER := 0;
    v_professional_xp INTEGER := 0;
    v_has_evaluation BOOLEAN := FALSE;
    v_is_recurrence BOOLEAN := FALSE;
BEGIN
    -- Determinar TIER e calcular XP
    IF v_budget_value >= 10000 THEN
        -- 💎 DIAMANTE
        v_tier := 'DIAMOND';
        v_crc_xp := 500;
        v_professional_xp := 200;
        
    ELSIF v_has_evaluation THEN
        -- 🥇 OURO (Avaliação convertida)
        v_tier := 'GOLD';
        v_crc_xp := 250;
        v_professional_xp := 0;
        
    ELSIF v_is_recurrence THEN
        -- 🥈 PRATA (Recorrência)
        v_tier := 'SILVER';
        v_crc_xp := 100;
        v_professional_xp := 0;
        
    ELSE
        -- Orçamento padrão
        v_tier := 'STANDARD';
        v_crc_xp := 50;
        v_professional_xp := 0;
    END IF;
    
    RETURN QUERY SELECT ...;
END;
$$ LANGUAGE plpgsql;
```

**Sistema de Recompensas por Tier:**

| Tier | Condição | CRC XP | Professional XP | Descrição |
|------|----------|--------|-----------------|-----------|
| 💎 DIAMANTE | Orçamento >= R$ 10.000 | +500 | +200 | Closer de Elite - Mestre do High-Ticket |
| 🥇 OURO | Avaliação convertida em orçamento | +250 | 0 | Transformador - Impedimento de Perda |
| 🥈 PRATA | Recorrência (Botox/Ortodontia) | +100 | 0 | Guardião do LTV - Fidelização |
| ✅ PADRÃO | Orçamento aprovado | +50 | 0 | Conversão padrão |

#### Progressão de Níveis

**Função: update_user_progression**
```sql
CREATE OR REPLACE FUNCTION update_user_progression(
    p_user_id UUID,
    p_xp_gained INTEGER,
    p_reason TEXT
) RETURNS VOID AS $$
DECLARE
    v_current_xp INTEGER;
    v_current_level INTEGER;
    v_new_xp INTEGER;
    v_new_level INTEGER;
    v_level_thresholds INTEGER[] := ARRAY[0, 5000, 15000, 30000, 50000];
BEGIN
    -- Calcular novo XP
    v_new_xp := v_current_xp + p_xp_gained;
    
    -- Calcular novo nível
    FOR i IN 1..array_length(v_level_thresholds, 1) LOOP
        IF v_new_xp >= v_level_thresholds[i] THEN
            v_new_level := i;
        END IF;
    END LOOP;
    
    -- Atualizar progressão
    UPDATE user_progression
    SET total_xp = v_new_xp, current_level = v_new_level
    WHERE user_id = p_user_id;
    
    -- Registrar log de XP
    INSERT INTO xp_logs (user_id, xp_amount, reason)
    VALUES (p_user_id, p_xp_gained, p_reason);
    
    -- Se subiu de nível, criar notificação
    IF v_new_level > v_current_level THEN
        INSERT INTO notifications (...)
        VALUES (...);
    END IF;
END;
$$ LANGUAGE plpgsql;
```

**Níveis de Evolução:**

| Nível | Título | XP Necessário | Features Desbloqueadas |
|-------|--------|---------------|------------------------|
| 1 | Gestor de Fluxo | 0 - 5.000 | Dashboard básico, Alertas de inadimplência, Controle de leads |
| 2 | Estrategista High-Ticket | 5.000 - 15.000 | ROI Analysis, Upsell Intelligence, Simulador de Cenários |
| 3 | Arquiteto do Instituto | 15.000 - 30.000 | PIPE Dashboard, Torre de Controle, Automações Avançadas |
| 4 | Diretor Exponencial | 30.000 - 50.000 | All Features, AI Mentorship, Benchmarking |
| 5 | Lenda do Instituto | 50.000+ | Elite - Todas as features + Reconhecimento |

#### Trigger de Gamificação

**Execução Automática ao Aprovar Orçamento:**
```sql
CREATE OR REPLACE FUNCTION trigger_budget_approval_gamification()
RETURNS TRIGGER AS $$
DECLARE
    v_xp_data RECORD;
BEGIN
    -- Só executar quando status mudar para APPROVED
    IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
        
        -- Calcular XP baseado no tier
        FOR v_xp_data IN 
            SELECT * FROM calculate_opportunity_xp(NEW.id, NEW.clinic_id)
        LOOP
            -- Atualizar XP do CRC
            IF v_xp_data.crc_user_id IS NOT NULL AND v_xp_data.crc_xp > 0 THEN
                PERFORM update_user_progression(
                    v_xp_data.crc_user_id,
                    v_xp_data.crc_xp,
                    format('Conversão %s - Orçamento #%s (R$ %s)', ...)
                );
            END IF;

            -- Atualizar XP do Professional
            IF v_xp_data.professional_user_id IS NOT NULL AND v_xp_data.professional_xp > 0 THEN
                PERFORM update_user_progression(
                    v_xp_data.professional_user_id,
                    v_xp_data.professional_xp,
                    format('Avaliação High-Ticket - Orçamento #%s (R$ %s)', ...)
                );
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER budget_approval_gamification
    AFTER INSERT OR UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION trigger_budget_approval_gamification();
```

#### Conquistas Especiais

**Conquista: Mestre do High-Ticket**
```sql
INSERT INTO achievements (
    name,
    description,
    icon,
    rarity,
    xp_reward,
    category
) VALUES (
    'Mestre do High-Ticket',
    'Fechou uma Cervicoplastia ou Lip Lifting (procedimento premium)',
    '💎',
    'LEGENDARY',
    1000,
    'SALES'
);
```

**Condição de Desbloqueio:**
- Aprovar orçamento DIAMOND (>= R$ 10k)
- Procedimento: Cervicoplastia OU Lip Lifting
- Recompensa: +1000 XP adicional

#### Auditoria de XP

**Tabela: xp_logs**
```sql
CREATE TABLE IF NOT EXISTS xp_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    xp_amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Propósito:**
- Transparência total de ganhos de XP
- Debugging de problemas de gamificação
- Auditoria de performance da equipe
- Histórico completo de progressão

---

## 🤖 PERSONA DO BOS

### Identidade

**Nome:** BOS (Business Operating System)  
**Função:** Sócio Estrategista e Arquiteto de Crescimento Exponencial  
**Estilo:** Coach Executivo + CFO + Consultor de Vendas

### Princípios de Comunicação

#### 1. Proatividade Radical
❌ **Passivo:** "Você tem 5 leads sem contato."  
✅ **Proativo:** "Doutor, perdemos altitude. 5 leads quentes (R$ 75k) sem contato há 15h. Manobra: Execute Resgate de ROI. Impacto: +R$ 75k + 2.500 XP."

#### 2. Terminologia Oficial
- "Upsell de Vendas" (nunca "cross-sell")
- "High-Ticket" para procedimentos > R$ 10k
- "Milestone de 50K" (nunca "meta mensal")
- "Operação Tática" (nunca "tarefa")

#### 3. Foco em ROI
- Toda sugestão deve ter impacto mensurável
- Formato: Problema → Ação → Impacto Financeiro

#### 4. Verdade Radical
- Honestidade brutal sobre gaps
- Sem eufemismos

#### 5. Dopamina Gerencial
- Feedback imediato para cada ação
- Celebração de conquistas
- Progressão visível

### System Prompts por Role

**ADMIN (Dr. Marcelo):**
```
Você é o BOS, Sócio Estrategista e CFO Virtual do Dr. Marcelo Vilas Bôas.

IDENTIDADE:
- Função: CFO + Coach Executivo + Consultor de Crescimento
- Estilo: Proativo, direto, focado em ROI e lucro
- Objetivo: Bater o Milestone de R$ 50.000/mês

FOCO ESTRATÉGICO:
- EBITDA e Margem de Lucro
- ROI de Marketing
- Procedimentos High-Ticket (HOF, Cirurgias, Lentes)
- Eficiência da equipe

FORMATO DE RESPOSTA:
1. Diagnóstico Executivo (1 linha)
2. Impacto Financeiro (R$ e %)
3. Ação Estratégica (comando claro)
4. Resultado Esperado (XP + R$)
```

**CRC (Consultora de Vendas):**
```
Você é o BOS, Consultora de Vendas da CRC.

IDENTIDADE:
- Função: Consultora de Vendas + Coach de Conversão
- Estilo: Persuasivo, focado em resultados, celebrador
- Objetivo: Conversão > 35% e Upsell High-Ticket

FOCO COMERCIAL:
- Taxa de conversão
- Valor de orçamentos aprovados
- Upsell HOF → Cirurgia
- Reativação de leads perdidos

FORMATO DE RESPOSTA:
1. Pipeline Quente (oportunidades prioritárias)
2. Missão Comercial (ação imediata)
3. Impacto Financeiro (R$ + XP)
4. Motivação para bater recorde
```

---

## 📊 MÉTRICAS DE INTELIGÊNCIA

### Performance do Motor de Insights

**Métricas Rastreadas:**
- Total de insights gerados
- Insights por categoria (SALES, MARKETING, FINANCIAL, etc.)
- Taxa de conversão de insights em ações
- Tempo médio de resolução
- Impacto financeiro estimado

**Query de Monitoramento:**
```sql
SELECT 
    priority,
    category,
    COUNT(*) as total,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM public.ai_insights
WHERE status = 'OPEN'
GROUP BY priority, category;
```

### Performance da Gamificação

**Métricas Rastreadas:**
- XP médio por usuário
- Taxa de level-up
- Conquistas desbloqueadas
- Operações táticas completadas
- Receita gerada por gamificação

**Query de Monitoramento:**
```sql
SELECT 
    u.name,
    up.current_level,
    up.total_xp,
    up.total_operations_completed,
    up.total_revenue_generated
FROM user_progression up
JOIN users u ON u.id = up.user_id
ORDER BY up.total_xp DESC
LIMIT 10;
```

---

## 🔮 ROADMAP DE INTELIGÊNCIA

### ✅ Implementado (BOS 18.8)
- [x] Motor de Insights Nativos (7 sentinelas)
- [x] Gamificação Ativa (triggers automáticos)
- [x] Sistema de XP por Tier
- [x] Auditoria de XP (xp_logs)
- [x] Conquista "Mestre do High-Ticket"

### 🚧 Em Desenvolvimento
- [ ] Conversão automática de insights em operações táticas
- [ ] Notificações push de insights críticos
- [ ] Dashboard de insights em tempo real
- [ ] Integração com ChatBOS para consulta de insights

### 📋 Planejado (Q1-Q2 2026)
- [ ] Previsão de Churn (AI)
- [ ] Recomendação de Tratamentos (AI)
- [ ] Otimização de Agenda (AI)
- [ ] Benchmarking com mercado
- [ ] Mentoria IA (Nível 4)
- [ ] Simulador de Cenários (Nível 2)
- [ ] PIPE Dashboard (Nível 3)

---

## 🎯 CONCLUSÃO

O sistema de inteligência do ClinicPro é **único no mercado** por combinar:

1. **Motor Nativo em SQL** - Zero custo de API, execução em tempo real
2. **7 Sentinelas Automáticas** - Monitoramento 24/7 sem intervenção humana
3. **Gamificação Integrada** - Transformação de insights em ações através de recompensas
4. **Feedback Imediato** - Dopamina gerencial em cada ação
5. **Progressão Visível** - Sistema de níveis que desbloqueia features

### Diferenciais Competitivos

✅ **Custo Zero de IA** - Motor nativo em SQL  
✅ **Execução em Tempo Real** - Triggers automáticos  
✅ **Gamificação Integrada** - Motivação intrínseca da equipe  
✅ **Foco em ROI** - Toda ação tem impacto mensurável  
✅ **Escalabilidade** - Suporta múltiplas clínicas (MASTER)  

### Próximos Passos Críticos

1. **Integrar ChatBOS com Insights** - Consulta natural de insights
2. **Notificações Push** - Alertas críticos em tempo real
3. **Dashboard de Insights** - Visualização consolidada
4. **Conversão Automática** - Insights → Operações Táticas
5. **AI Forecasting** - Previsão de demanda e churn

---

**Versão da Auditoria:** 1.0  
**Próxima Revisão:** 23/01/2026  
**Responsável:** Dr. Marcelo Vilas Bôas
