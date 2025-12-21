-- =====================================================
-- ATIVAÇÃO COMPLETA: MOTOR DE INTELIGÊNCIA NATIVA
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PASSO 1: CRIAR VIEWS DO INTELLIGENCE CENTER
-- =====================================================

-- View: Marketing Metrics
CREATE OR REPLACE VIEW view_marketing_metrics AS
WITH origem_counts AS (
    SELECT 
        clinic_id,
        COALESCE(source, 'Não informado') as source_name,
        COUNT(*) as count
    FROM public.leads
    GROUP BY clinic_id, COALESCE(source, 'Não informado')
)
SELECT
    l.clinic_id,
    COUNT(*) as total_leads,
    (
        SELECT json_object_agg(source_name, count)
        FROM origem_counts oc
        WHERE oc.clinic_id = l.clinic_id
    ) as origem_distribution,
    ROUND(
        (COUNT(*) FILTER (WHERE l.lead_score > 70)::numeric / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as taxa_qualificacao,
    COUNT(*) FILTER (WHERE l.priority = 'HIGH') as leads_alta_prioridade,
    COUNT(*) FILTER (WHERE l.priority = 'MEDIUM') as leads_media_prioridade,
    COUNT(*) FILTER (WHERE l.priority = 'LOW') as leads_baixa_prioridade
FROM public.leads l
GROUP BY l.clinic_id;

-- View: Sales Metrics Enhanced
CREATE OR REPLACE VIEW view_sales_metrics AS
SELECT
    b.clinic_id,
    SUM(b.final_value) FILTER (WHERE b.status = 'DRAFT') as valor_pipeline,
    ROUND(AVG(b.final_value) FILTER (WHERE b.status = 'APPROVED'), 2) as ticket_medio,
    SUM(b.final_value) FILTER (WHERE b.status = 'REJECTED') as perda_oportunidade,
    COUNT(*) FILTER (WHERE b.status = 'APPROVED') as orcamentos_aprovados,
    COUNT(*) FILTER (WHERE b.status = 'REJECTED') as orcamentos_rejeitados,
    COUNT(*) FILTER (WHERE b.status = 'DRAFT') as orcamentos_pendentes,
    ROUND(
        (COUNT(*) FILTER (WHERE b.status = 'APPROVED')::numeric / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as taxa_conversao_orcamentos
FROM public.budgets b
GROUP BY b.clinic_id;

-- View: Customer Lifetime Value (LTV)
CREATE OR REPLACE VIEW view_customer_ltv AS
SELECT
    p.clinic_id,
    ROUND(AVG(p.total_paid), 2) as ltv_medio,
    COUNT(DISTINCT p.id) FILTER (
        WHERE (
            SELECT COUNT(*) 
            FROM public.budgets b 
            WHERE b.patient_id = p.id AND b.status = 'APPROVED'
        ) > 1
    ) as pacientes_recorrentes,
    COUNT(DISTINCT p.id) as total_pacientes,
    ROUND(
        (COUNT(DISTINCT p.id) FILTER (
            WHERE (
                SELECT COUNT(*) 
                FROM public.budgets b 
                WHERE b.patient_id = p.id AND b.status = 'APPROVED'
            ) > 1
        )::numeric / NULLIF(COUNT(DISTINCT p.id), 0)) * 100,
        2
    ) as taxa_fidelizacao
FROM public.patients p
GROUP BY p.clinic_id;

-- View: Operational Efficiency Enhanced
CREATE OR REPLACE VIEW view_operational_efficiency AS
SELECT
    a.clinic_id,
    COUNT(*) as total_agendamentos,
    COUNT(*) FILTER (WHERE a.status = 'PENDING') as agendados,
    COUNT(*) FILTER (WHERE a.status = 'CONFIRMED') as confirmados,
    COUNT(*) FILTER (WHERE a.status = 'COMPLETED') as concluidos,
    COUNT(*) FILTER (WHERE a.status = 'CANCELED') as cancelados,
    COUNT(*) FILTER (WHERE a.status = 'MISSED') as faltas,
    ROUND(
        (COUNT(*) FILTER (WHERE a.status = 'MISSED')::numeric / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as taxa_no_show,
    ROUND(
        (COUNT(*) FILTER (WHERE a.status = 'CANCELED')::numeric / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as taxa_cancelamento,
    ROUND(
        (COUNT(*) FILTER (WHERE a.status = 'COMPLETED')::numeric / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as taxa_conclusao
FROM public.appointments a
GROUP BY a.clinic_id;

-- View: Financial Metrics Enhanced
CREATE OR REPLACE VIEW view_financial_metrics_enhanced AS
SELECT
    t.clinic_id,
    SUM(t.amount) FILTER (WHERE t.type = 'INCOME') as faturamento_realizado,
    SUM(t.amount) FILTER (WHERE t.type = 'EXPENSE') as despesas_totais,
    SUM(t.amount) FILTER (WHERE t.type = 'INCOME') - 
    SUM(t.amount) FILTER (WHERE t.type = 'EXPENSE') as resultado_liquido,
    ROUND(
        ((SUM(t.amount) FILTER (WHERE t.type = 'INCOME') - 
          SUM(t.amount) FILTER (WHERE t.type = 'EXPENSE')) / 
         NULLIF(SUM(t.amount) FILTER (WHERE t.type = 'INCOME'), 0)) * 100,
        2
    ) as margem_ebitda
FROM public.transactions t
GROUP BY t.clinic_id;

-- View: Inadimplência
CREATE OR REPLACE VIEW view_receivables AS
SELECT
    p.clinic_id,
    SUM(p.balance_due) as inadimplencia_total,
    COUNT(*) FILTER (WHERE p.balance_due > 0) as pacientes_inadimplentes,
    ROUND(AVG(p.balance_due) FILTER (WHERE p.balance_due > 0), 2) as ticket_medio_inadimplencia,
    SUM(p.total_paid) as total_recebido
FROM public.patients p
GROUP BY p.clinic_id;

-- =====================================================
-- PASSO 2: CRIAR MOTOR DE INSIGHTS NATIVO
-- =====================================================

-- Função Principal
CREATE OR REPLACE FUNCTION generate_native_insights(p_clinic_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Limpar insights antigos resolvidos
    DELETE FROM public.ai_insights
    WHERE clinic_id = p_clinic_id
      AND status = 'RESOLVED'
      AND created_at < NOW() - INTERVAL '30 days';

    -- SENTINELA 1: VENDAS HIGH-TICKET PARADAS
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, recommended_action, status
    )
    SELECT
        p_clinic_id,
        '💰 Orçamento High-Ticket Parado: ' || p.name,
        'Orçamento de R$ ' || TO_CHAR(b.final_value, 'FM999,999,999.00') || 
        ' está em negociação há ' || EXTRACT(DAY FROM NOW() - b.created_at) || ' dias sem movimentação.',
        'CRITICAL', 'SALES', b.id,
        'Entre em contato imediato com o paciente para entender objeções e fechar a venda.',
        'OPEN'
    FROM public.budgets b
    JOIN public.patients p ON b.patient_id = p.id
    WHERE b.clinic_id = p_clinic_id
      AND b.status = 'DRAFT'
      AND b.final_value > 15000
      AND b.created_at < NOW() - INTERVAL '3 days'
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai
          WHERE ai.related_entity_id = b.id AND ai.status = 'OPEN' AND ai.category = 'SALES'
      );

    -- SENTINELA 2: LEADS SEM CONTATO
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, recommended_action, status
    )
    SELECT
        p_clinic_id,
        '🔥 Lead Quente Sem Contato: ' || l.name,
        'Lead cadastrado há ' || EXTRACT(HOUR FROM NOW() - l.created_at) || ' horas sem nenhuma interação.',
        CASE WHEN l.priority = 'HIGH' THEN 'CRITICAL' ELSE 'HIGH' END,
        'MARKETING', l.id,
        'Realizar contato imediato via WhatsApp ou telefone.',
        'OPEN'
    FROM public.leads l
    WHERE l.clinic_id = p_clinic_id
      AND l.created_at < NOW() - INTERVAL '12 hours'
      AND NOT EXISTS (SELECT 1 FROM public.lead_interactions li WHERE li.lead_id = l.id)
      AND NOT EXISTS (SELECT 1 FROM public.ai_insights ai WHERE ai.related_entity_id = l.id AND ai.status = 'OPEN');

    -- SENTINELA 3: INADIMPLÊNCIA PÓS-CIRÚRGICA
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, recommended_action, status
    )
    SELECT
        p_clinic_id,
        '⚠️ Inadimplência Pós-Cirúrgica: ' || p.name,
        'Procedimento concluído com saldo devedor de R$ ' || TO_CHAR(p.balance_due, 'FM999,999,999.00'),
        CASE WHEN p.balance_due > 10000 THEN 'CRITICAL' ELSE 'HIGH' END,
        'FINANCIAL', p.id,
        'Acionar cobrança imediata. Procedimento já foi realizado.',
        'OPEN'
    FROM public.treatment_items ti
    JOIN public.treatments t ON ti.treatment_id = t.id
    JOIN public.patients p ON t.patient_id = p.id
    WHERE p.clinic_id = p_clinic_id
      AND ti.status = 'CONCLUDED'
      AND p.balance_due > 0
      AND ti.updated_at < NOW() - INTERVAL '7 days'
      AND NOT EXISTS (SELECT 1 FROM public.ai_insights ai WHERE ai.related_entity_id = p.id AND ai.status = 'OPEN' AND ai.category = 'FINANCIAL');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Native Insights Engine: % novos insights gerados', v_count;
END;
$$;

-- Função para todas as clínicas
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
    RAISE NOTICE 'Insights Engine executed for all clinics';
END;
$$;

-- =====================================================
-- PASSO 3: CONFIGURAR CRON JOBS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
    'native-insights-hourly',
    '0 * * * *',
    $$SELECT run_insights_engine_for_all_clinics();$$
);

-- =====================================================
-- PASSO 4: EXECUTAR TESTE INICIAL
-- =====================================================

SELECT run_insights_engine_for_all_clinics();

-- Verificar resultados
SELECT 
    priority,
    category,
    COUNT(*) as total
FROM public.ai_insights
WHERE status = 'OPEN'
GROUP BY priority, category
ORDER BY 
    CASE priority
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
    END;

-- =====================================================
-- SUCESSO!
-- =====================================================

SELECT '🎉 Motor de Inteligência Nativa ativado!' as status;
