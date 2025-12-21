-- =====================================================
-- MOTOR DE INTELIGÊNCIA NATIVA - 9 SENTINELAS CONSOLIDADAS
-- ClinicPro Manager - Intelligence Center 7.0
-- Execute este arquivo COMPLETO no Supabase SQL Editor
-- =====================================================

CREATE OR REPLACE FUNCTION generate_native_insights(p_clinic_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- =====================================================
    -- LIMPEZA INICIAL: Remover insights resolvidos antigos
    -- =====================================================
    DELETE FROM public.ai_insights 
    WHERE clinic_id = p_clinic_id 
      AND status = 'resolved' 
      AND created_at < NOW() - INTERVAL '30 days';

    -- =====================================================
    -- ALERTAS URGENTES (critico/high)
    -- =====================================================

    -- [S1] ORÇAMENTOS HIGH-TICKET PARADOS (>R$ 15k)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category, 
        related_entity_id, action_label, status
    )
    SELECT 
        p_clinic_id, 
        '💰 Orçamento High-Ticket Parado: ' || p.name, 
        'Orçamento de R$ ' || TO_CHAR(b.final_value, 'FM999,999,990.00') || 
        ' parado há ' || (CURRENT_DATE - b.created_at::date) || ' dias.', 
        'critico', 'Vendas', b.id, 'Ver Orçamento', 'open'
    FROM public.budgets b 
    JOIN public.patients p ON b.patient_id = p.id
    WHERE b.clinic_id = p_clinic_id 
      AND b.status = 'DRAFT' 
      AND b.final_value > 15000 
      AND b.created_at < NOW() - INTERVAL '3 days'
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights 
          WHERE related_entity_id = b.id AND status = 'open'
      );

    -- [S2] LEADS SEM CONTATO (>12h)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category, 
        related_entity_id, action_label, status
    )
    SELECT 
        p_clinic_id, 
        '🔥 Lead Quente Sem Contato: ' || l.name, 
        'Lead cadastrado há ' || EXTRACT(HOUR FROM (NOW() - l.created_at)) || ' horas sem interação.', 
        'high', 'Marketing', l.id, 'Chamar no Zap', 'open'
    FROM public.leads l
    WHERE l.clinic_id = p_clinic_id 
      AND l.created_at < NOW() - INTERVAL '12 hours' 
      AND NOT EXISTS (
          SELECT 1 FROM public.lead_interactions li WHERE li.lead_id = l.id
      )
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights 
          WHERE related_entity_id = l.id AND status = 'open'
      );

    -- [S3] INADIMPLÊNCIA (>R$ 500)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category, 
        related_entity_id, action_label, status
    )
    SELECT 
        p_clinic_id, 
        '⚠️ Inadimplência: ' || p.name, 
        'Saldo devedor de R$ ' || TO_CHAR(p.balance_due, 'FM999,999,990.00'), 
        CASE WHEN p.balance_due > 10000 THEN 'critico' ELSE 'high' END,
        'Financeiro', p.id, 'Ver Financeiro', 'open'
    FROM public.patients p
    WHERE p.clinic_id = p_clinic_id 
      AND p.balance_due > 500 
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights 
          WHERE related_entity_id = p.id AND status = 'open' AND category = 'Financeiro'
      );

    -- =====================================================
    -- INSIGHTS ESTRATÉGICOS (medium/low)
    -- =====================================================

    -- [S4] PACIENTES VIP INATIVOS (LTV >R$ 10k, inativo >6 meses)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category, 
        related_entity_id, action_label, status
    )
    SELECT 
        p_clinic_id, 
        '💎 Paciente VIP Inativo: ' || p.name, 
        'LTV de R$ ' || TO_CHAR(p.total_paid, 'FM999,999,990.00') || 
        ', inativo há ' || (CURRENT_DATE - p.updated_at::date) || ' dias.', 
        'medium', 'Retenção', p.id, 'Enviar Campanha VIP', 'open'
    FROM public.patients p
    WHERE p.clinic_id = p_clinic_id 
      AND p.total_paid > 10000 
      AND p.updated_at < NOW() - INTERVAL '6 months'
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights 
          WHERE related_entity_id = p.id AND status = 'open' AND category = 'Retenção'
      );

    -- [S5] CANAL DE MARKETING EM DESTAQUE
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category, 
        action_label, status
    )
    WITH canal_performance AS (
        SELECT 
            source,
            COUNT(*) as total_leads,
            ROUND((COUNT(*) FILTER (WHERE lead_score > 70)::numeric / NULLIF(COUNT(*), 0)) * 100, 1) as taxa_qualificacao
        FROM public.leads
        WHERE clinic_id = p_clinic_id 
          AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY source
        HAVING COUNT(*) >= 5
    ),
    melhor_canal AS (
        SELECT * FROM canal_performance
        ORDER BY taxa_qualificacao DESC, total_leads DESC
        LIMIT 1
    )
    SELECT 
        p_clinic_id, 
        '📊 Canal de Marketing em Destaque: ' || mc.source, 
        'O canal "' || mc.source || '" gerou ' || mc.total_leads || 
        ' leads com ' || mc.taxa_qualificacao || '% de qualificação nos últimos 30 dias.', 
        'low', 'Marketing', 'Ver Análise Completa', 'open'
    FROM melhor_canal mc
    WHERE NOT EXISTS (
        SELECT 1 FROM public.ai_insights 
        WHERE clinic_id = p_clinic_id 
          AND status = 'open' 
          AND category = 'Marketing' 
          AND title LIKE '%Canal de Marketing%'
          AND created_at > NOW() - INTERVAL '7 days'
    );

    -- [S6] TAXA DE CONVERSÃO EM ALTA (>30%)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category, 
        action_label, status
    )
    WITH conversao_atual AS (
        SELECT 
            ROUND((COUNT(*) FILTER (WHERE status = 'APPROVED')::numeric / NULLIF(COUNT(*), 0)) * 100, 1) as taxa_conversao
        FROM public.budgets
        WHERE clinic_id = p_clinic_id 
          AND created_at > NOW() - INTERVAL '30 days'
        HAVING COUNT(*) >= 10
    )
    SELECT 
        p_clinic_id, 
        '📈 Taxa de Conversão em Alta: ' || ca.taxa_conversao || '%', 
        'Sua taxa de conversão atual é de ' || ca.taxa_conversao || '%, acima da média do setor (25%). Continue!', 
        'low', 'Vendas', 'Ver Detalhes', 'open'
    FROM conversao_atual ca
    WHERE ca.taxa_conversao > 30
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights 
          WHERE clinic_id = p_clinic_id 
            AND status = 'open' 
            AND title LIKE '%Taxa de Conversão%'
            AND created_at > NOW() - INTERVAL '7 days'
      );

    -- [S7] TICKET MÉDIO EM CRESCIMENTO (>10%)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category, 
        action_label, status
    )
    WITH ticket_atual AS (
        SELECT ROUND(AVG(final_value), 2) as ticket_medio
        FROM public.budgets
        WHERE clinic_id = p_clinic_id 
          AND status = 'APPROVED' 
          AND created_at > NOW() - INTERVAL '30 days'
        HAVING COUNT(*) >= 5
    ),
    ticket_anterior AS (
        SELECT ROUND(AVG(final_value), 2) as ticket_medio_anterior
        FROM public.budgets
        WHERE clinic_id = p_clinic_id 
          AND status = 'APPROVED' 
          AND created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days'
    )
    SELECT 
        p_clinic_id, 
        '💰 Ticket Médio Cresceu: R$ ' || TO_CHAR(ta.ticket_medio, 'FM999,999,990.00'), 
        'Crescimento de ' || ROUND(((ta.ticket_medio - taa.ticket_medio_anterior) / taa.ticket_medio_anterior) * 100, 1) || 
        '% vs mês anterior. Pacientes aceitando tratamentos mais completos!', 
        'low', 'Financeiro', 'Ver Análise', 'open'
    FROM ticket_atual ta, ticket_anterior taa
    WHERE ta.ticket_medio > taa.ticket_medio_anterior * 1.1
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights 
          WHERE clinic_id = p_clinic_id 
            AND status = 'open' 
            AND title LIKE '%Ticket Médio%'
            AND created_at > NOW() - INTERVAL '7 days'
      );

    -- [S10] OPORTUNIDADE DE UPSELL CIRÚRGICO (HOF → FACE)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category, 
        related_entity_id, action_label, status
    )
    WITH hof_recorrentes AS (
        SELECT 
            p.id, 
            p.name, 
            (MAX(ti.execution_date) - MIN(ti.execution_date)) as dias_relacionamento,
            COUNT(DISTINCT ti.id) as total_procedimentos,
            SUM(ti.total_value) as ltv_hof
        FROM public.patients p 
        JOIN public.treatment_items ti ON ti.patient_id = p.id
        WHERE p.clinic_id = p_clinic_id 
          AND (
              ti.procedure_name ILIKE '%botox%' 
              OR ti.procedure_name ILIKE '%preenchimento%'
              OR ti.procedure_name ILIKE '%toxina%'
          )
          AND ti.execution_date IS NOT NULL
        GROUP BY p.id, p.name
        HAVING COUNT(DISTINCT ti.id) >= 3 
           AND (MAX(ti.execution_date) - MIN(ti.execution_date)) >= 730
    )
    SELECT 
        p_clinic_id, 
        '💎 Oportunidade de Upsell Cirúrgico: ' || hr.name, 
        'Paciente recorrente em HOF há ' || ROUND(hr.dias_relacionamento / 365.0, 1) || ' anos, ' ||
        'com ' || hr.total_procedimentos || ' procedimentos (LTV R$ ' || TO_CHAR(hr.ltv_hof, 'FM999,999,990.00') || '). ' ||
        'Perfil ideal para procedimentos cirúrgicos faciais.', 
        'medium', 'Vendas', hr.id, 'Agendar Consulta Cirúrgica', 'open'
    FROM hof_recorrentes hr
    WHERE NOT EXISTS (
        SELECT 1 FROM public.ai_insights 
        WHERE related_entity_id = hr.id 
          AND status = 'open' 
          AND title LIKE '%Upsell%'
    )
    LIMIT 5;

    -- [S14] PONTO DE EQUILÍBRIO ATINGIDO
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category, 
        action_label, status
    )
    WITH despesas_fixas AS (
        SELECT COALESCE(SUM(amount), 0) as total_despesas
        FROM public.expenses 
        WHERE clinic_id = p_clinic_id 
          AND due_date >= DATE_TRUNC('month', CURRENT_DATE) 
          AND due_date <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')
    ),
    receitas_acumuladas AS (
        SELECT SUM(amount) as total_receitas
        FROM public.transactions 
        WHERE clinic_id = p_clinic_id 
          AND type = 'INCOME'
          AND date >= DATE_TRUNC('month', CURRENT_DATE) 
          AND date <= CURRENT_DATE
    )
    SELECT 
        p_clinic_id, 
        '🎉 Ponto de Equilíbrio Atingido!', 
        'Parabéns! Sua clínica já cobriu todas as despesas do mês (R$ ' || 
        TO_CHAR(df.total_despesas, 'FM999,999,990.00') || '). ' ||
        'Faturamento acumulado: R$ ' || TO_CHAR(ra.total_receitas, 'FM999,999,990.00') || '. ' ||
        'A partir de agora, todo procedimento é lucro real!', 
        'low', 'Financeiro', 'Ver Dashboard Financeiro', 'open'
    FROM receitas_acumuladas ra, despesas_fixas df
    WHERE ra.total_receitas >= df.total_despesas 
      AND df.total_despesas > 0
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights 
          WHERE clinic_id = p_clinic_id 
            AND title LIKE '%Ponto de Equilíbrio%' 
            AND created_at > DATE_TRUNC('month', CURRENT_DATE)
      );

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '✅ Motor de Insights: % novos insights gerados', v_count;
END;
$$;

-- =====================================================
-- TESTE AUTOMÁTICO
-- =====================================================
DO $$
DECLARE
    v_clinic_id UUID;
BEGIN
    SELECT id INTO v_clinic_id FROM public.clinics WHERE status = 'ACTIVE' LIMIT 1;
    
    IF v_clinic_id IS NOT NULL THEN
        RAISE NOTICE '🚀 Executando motor com 9 sentinelas...';
        PERFORM generate_native_insights(v_clinic_id);
        RAISE NOTICE '✅ Execução concluída!';
    ELSE
        RAISE NOTICE '⚠️ Nenhuma clínica ativa encontrada';
    END IF;
END $$;

-- =====================================================
-- DASHBOARD DE INSIGHTS GERADOS
-- =====================================================
SELECT 
    '📊 RESUMO DE INSIGHTS GERADOS' as titulo,
    priority,
    category,
    COUNT(*) as total
FROM public.ai_insights
WHERE status = 'open'
GROUP BY priority, category
ORDER BY 
    CASE priority
        WHEN 'critico' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    category;

-- Ver detalhes dos últimos insights
SELECT 
    priority,
    category,
    title,
    LEFT(explanation, 100) || '...' as preview,
    action_label,
    TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as criado_em
FROM public.ai_insights
WHERE status = 'open'
ORDER BY 
    CASE priority
        WHEN 'critico' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    created_at DESC
LIMIT 20;

SELECT '🎉 MOTOR DE INTELIGÊNCIA NATIVA ATIVADO COM 9 SENTINELAS!' as status;
