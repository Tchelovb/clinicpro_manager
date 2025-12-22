[instruction]
Para ativar a inteligência artificial preditiva da Torre de Controle, siga estes passos simples:

1. Acesse o Supabase (https://supabase.com/dashboard)
2. Selecione seu projeto 'ClinicPro'
3. Vá para área 'SQL Editor' (ícone de terminal na barra esquerda)
4. Clique em 'New Query'
5. Copie e cole TODO o código abaixo e clique em 'RUN':

---

-- =====================================================
-- ATIVAÇÃO COMPLETA: MOTOR DE INTELIGÊNCIA NATIVA
-- =====================================================

-- 1. View: Marketing Metrics
CREATE OR REPLACE VIEW view_marketing_metrics AS
WITH origem_counts AS (
    SELECT 
        clinic_id, COALESCE(source, 'Não informado') as source_name, COUNT(*) as count
    FROM public.leads
    GROUP BY clinic_id, COALESCE(source, 'Não informado')
)
SELECT
    l.clinic_id, COUNT(*) as total_leads,
    (SELECT json_object_agg(source_name, count) FROM origem_counts oc WHERE oc.clinic_id = l.clinic_id) as origem_distribution,
    ROUND((COUNT(*) FILTER (WHERE l.lead_score > 70)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) as taxa_qualificacao,
    COUNT(*) FILTER (WHERE l.priority = 'HIGH') as leads_alta_prioridade
FROM public.leads l GROUP BY l.clinic_id;

-- 2. View: Sales Metrics Enhanced
CREATE OR REPLACE VIEW view_sales_metrics AS
SELECT
    b.clinic_id,
    SUM(b.final_value) FILTER (WHERE b.status = 'DRAFT') as valor_pipeline,
    ROUND(AVG(b.final_value) FILTER (WHERE b.status = 'APPROVED'), 2) as ticket_medio,
    SUM(b.final_value) FILTER (WHERE b.status = 'REJECTED') as perda_oportunidade,
    COUNT(*) FILTER (WHERE b.status = 'APPROVED') as orcamentos_aprovados
FROM public.budgets b GROUP BY b.clinic_id;

-- 3. View: Intelligence 360 (Agregadora)
CREATE OR REPLACE VIEW view_intelligence_360 AS
SELECT
    m.clinic_id,
    m.total_leads, m.origem_distribution, m.taxa_qualificacao,
    s.valor_pipeline, s.ticket_medio, s.orcamentos_aprovados
FROM view_marketing_metrics m
JOIN view_sales_metrics s ON m.clinic_id = s.clinic_id;

-- 4. Função: Motor de Insights
CREATE OR REPLACE FUNCTION generate_native_insights(p_clinic_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM public.ai_insights WHERE clinic_id = p_clinic_id AND status = 'RESOLVED' AND created_at < NOW() - INTERVAL '30 days';

    -- SENTINELA 1: VENDAS HIGH-TICKET PARADAS (>15k, >3 dias)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category, related_entity_id, recommended_action, status
    )
    SELECT
        p_clinic_id,
        '💰 Orçamento High-Ticket Parado: ' || p.name,
        'Orçamento de R$ ' || TO_CHAR(b.final_value, 'FM999,999,999.00') || ' sem movimento há 3 dias.',
        'CRITICAL', 'SALES', b.id,
        'Contato imediato para fechar venda.', 'OPEN'
    FROM public.budgets b
    JOIN public.patients p ON b.patient_id = p.id
    WHERE b.clinic_id = p_clinic_id AND b.status = 'DRAFT' AND b.final_value > 15000 AND b.created_at < NOW() - INTERVAL '3 days'
    AND NOT EXISTS (SELECT 1 FROM public.ai_insights ai WHERE ai.related_entity_id = b.id AND ai.status = 'OPEN');

END;
$$;

-- 5. Executar Motor
SELECT generate_native_insights((SELECT id FROM clinics LIMIT 1));
