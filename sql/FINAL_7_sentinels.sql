-- =====================================================
-- MOTOR DE INSIGHTS COMPLETO - 7 SENTINELAS
-- EXECUTE ESTE ARQUIVO NO SUPABASE SQL EDITOR
-- =====================================================

CREATE OR REPLACE FUNCTION generate_native_insights(p_clinic_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Limpar insights resolvidos antigos
    DELETE FROM public.ai_insights
    WHERE clinic_id = p_clinic_id
      AND status = 'resolved'
      AND created_at < NOW() - INTERVAL '30 days';

    -- =====================================================
    -- ALERTAS URGENTES (critico/high)
    -- =====================================================

    -- SENTINELA 1: Orçamentos High-Ticket Parados (critico)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    SELECT
        p_clinic_id,
        '💰 Orçamento High-Ticket Parado: ' || p.name,
        'O orçamento de R$ ' || TO_CHAR(b.final_value, 'FM999,999,990.00') || 
        ' está parado há ' || EXTRACT(DAY FROM NOW() - b.created_at) || ' dias.',
        'critico', 'Vendas', b.id, 'Ver Orçamento', 'open'
    FROM public.budgets b
    JOIN public.patients p ON b.patient_id = p.id
    WHERE b.clinic_id = p_clinic_id
      AND b.status = 'DRAFT' AND b.final_value > 15000
      AND b.created_at < NOW() - INTERVAL '3 days'
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai 
          WHERE ai.related_entity_id = b.id AND ai.status = 'open'
      );

    -- SENTINELA 2: Leads Sem Contato (high)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    SELECT
        p_clinic_id,
        '🔥 Lead Quente Sem Contato: ' || l.name,
        'Lead cadastrado há ' || EXTRACT(HOUR FROM NOW() - l.created_at) || ' horas sem interação.',
        CASE WHEN l.priority = 'HIGH' THEN 'critico' ELSE 'high' END, 
        'Marketing', l.id, 'Chamar no Zap', 'open'
    FROM public.leads l
    WHERE l.clinic_id = p_clinic_id
      AND l.created_at < NOW() - INTERVAL '12 hours'
      AND NOT EXISTS (SELECT 1 FROM public.lead_interactions li WHERE li.lead_id = l.id)
      AND NOT EXISTS (SELECT 1 FROM public.ai_insights ai WHERE ai.related_entity_id = l.id AND ai.status = 'open');

    -- SENTINELA 3: Inadimplência (high)
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
    WHERE p.clinic_id = p_clinic_id AND p.balance_due > 500
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai 
          WHERE ai.related_entity_id = p.id AND ai.status = 'open' AND ai.category = 'Financeiro'
      );

    -- =====================================================
    -- INSIGHTS ESTRATÉGICOS (medium/low)
    -- =====================================================

    -- SENTINELA 4: Pacientes VIP Inativos (medium)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    SELECT
        p_clinic_id,
        '💎 Paciente VIP Inativo: ' || p.name,
        'LTV de R$ ' || TO_CHAR(p.total_paid, 'FM999,999,990.00') || 
        ', inativo há ' || EXTRACT(DAY FROM NOW() - p.updated_at) || ' dias.',
        'medium', 'Retenção', p.id, 'Enviar Campanha VIP', 'open'
    FROM public.patients p
    WHERE p.clinic_id = p_clinic_id
      AND p.total_paid > 10000
      AND p.updated_at < NOW() - INTERVAL '6 months'
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai 
          WHERE ai.related_entity_id = p.id AND ai.status = 'open' AND ai.category = 'Retenção'
      );

    -- SENTINELA 5: Canal de Marketing em Destaque (low)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    WITH canal_performance AS (
        SELECT 
            clinic_id,
            source,
            COUNT(*) as total_leads,
            COUNT(*) FILTER (WHERE lead_score > 70) as leads_qualificados,
            ROUND(
                (COUNT(*) FILTER (WHERE lead_score > 70)::numeric / NULLIF(COUNT(*), 0)) * 100,
                1
            ) as taxa_qualificacao
        FROM public.leads
        WHERE clinic_id = p_clinic_id
          AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY clinic_id, source
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
        ' leads com ' || mc.taxa_qualificacao || '% de qualificação nos últimos 30 dias. ' ||
        'Considere aumentar investimento neste canal.',
        'low', 'Marketing', NULL, 'Ver Análise Completa', 'open'
    FROM melhor_canal mc
    WHERE NOT EXISTS (
        SELECT 1 FROM public.ai_insights ai 
        WHERE ai.clinic_id = p_clinic_id
        AND ai.status = 'open' 
        AND ai.category = 'Marketing'
        AND ai.title LIKE '%Canal de Marketing%'
        AND ai.created_at > NOW() - INTERVAL '7 days'
    );

    -- SENTINELA 6: Taxa de Conversão em Alta (low)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    WITH conversao_atual AS (
        SELECT
            clinic_id,
            COUNT(*) as total_orcamentos,
            COUNT(*) FILTER (WHERE status = 'APPROVED') as aprovados,
            ROUND(
                (COUNT(*) FILTER (WHERE status = 'APPROVED')::numeric / NULLIF(COUNT(*), 0)) * 100,
                1
            ) as taxa_conversao
        FROM public.budgets
        WHERE clinic_id = p_clinic_id
          AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY clinic_id
        HAVING COUNT(*) >= 10
    ),
    conversao_anterior AS (
        SELECT
            clinic_id,
            ROUND(
                (COUNT(*) FILTER (WHERE status = 'APPROVED')::numeric / NULLIF(COUNT(*), 0)) * 100,
                1
            ) as taxa_conversao_anterior
        FROM public.budgets
        WHERE clinic_id = p_clinic_id
          AND created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days'
        GROUP BY clinic_id
    )
    SELECT
        p_clinic_id,
        '📈 Taxa de Conversão em Alta: ' || ca.taxa_conversao || '%',
        'Sua taxa de conversão atual é de ' || ca.taxa_conversao || '%, ' ||
        CASE 
            WHEN caa.taxa_conversao_anterior IS NOT NULL 
            THEN 'um aumento de ' || ROUND(ca.taxa_conversao - caa.taxa_conversao_anterior, 1) || 
                 ' pontos percentuais em relação ao mês anterior (' || caa.taxa_conversao_anterior || '%).'
            ELSE 'acima da média do setor (25%).'
        END ||
        ' Continue com as estratégias atuais!',
        'low', 'Vendas', NULL, 'Ver Detalhes', 'open'
    FROM conversao_atual ca
    LEFT JOIN conversao_anterior caa ON ca.clinic_id = caa.clinic_id
    WHERE ca.taxa_conversao > 30
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai 
          WHERE ai.clinic_id = p_clinic_id
          AND ai.status = 'open' 
          AND ai.title LIKE '%Taxa de Conversão%'
          AND ai.created_at > NOW() - INTERVAL '7 days'
      );

    -- SENTINELA 7: Ticket Médio em Crescimento (low)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    WITH ticket_atual AS (
        SELECT
            clinic_id,
            ROUND(AVG(final_value), 2) as ticket_medio
        FROM public.budgets
        WHERE clinic_id = p_clinic_id
          AND status = 'APPROVED'
          AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY clinic_id
        HAVING COUNT(*) >= 5
    ),
    ticket_anterior AS (
        SELECT
            clinic_id,
            ROUND(AVG(final_value), 2) as ticket_medio_anterior
        FROM public.budgets
        WHERE clinic_id = p_clinic_id
          AND status = 'APPROVED'
          AND created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days'
        GROUP BY clinic_id
    )
    SELECT
        p_clinic_id,
        '💰 Ticket Médio Cresceu: R$ ' || TO_CHAR(ta.ticket_medio, 'FM999,999,990.00'),
        'Seu ticket médio atual é de R$ ' || TO_CHAR(ta.ticket_medio, 'FM999,999,990.00') || ', ' ||
        'um crescimento de ' || 
        ROUND(((ta.ticket_medio - taa.ticket_medio_anterior) / taa.ticket_medio_anterior) * 100, 1) || 
        '% em relação ao mês anterior (R$ ' || TO_CHAR(taa.ticket_medio_anterior, 'FM999,999,990.00') || '). ' ||
        'Pacientes estão aceitando tratamentos mais completos!',
        'low', 'Financeiro', NULL, 'Ver Análise', 'open'
    FROM ticket_atual ta
    JOIN ticket_anterior taa ON ta.clinic_id = taa.clinic_id
    WHERE ta.ticket_medio > taa.ticket_medio_anterior * 1.1
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai 
          WHERE ai.clinic_id = p_clinic_id
          AND ai.status = 'open' 
          AND ai.title LIKE '%Ticket Médio%'
          AND ai.created_at > NOW() - INTERVAL '7 days'
      );

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '✅ Motor de Insights: % insights gerados', v_count;
END;
$$;

-- =====================================================
-- EXECUTAR TESTE COMPLETO
-- =====================================================

DO $$
DECLARE
    v_clinic_id UUID;
BEGIN
    SELECT id INTO v_clinic_id FROM public.clinics WHERE status = 'ACTIVE' LIMIT 1;
    
    IF v_clinic_id IS NOT NULL THEN
        RAISE NOTICE '🚀 Executando motor completo com 7 sentinelas...';
        PERFORM generate_native_insights(v_clinic_id);
        RAISE NOTICE '✅ Execução concluída!';
    END IF;
END $$;

-- =====================================================
-- VER RESUMO DE INSIGHTS GERADOS
-- =====================================================

SELECT 
    '📊 RESUMO DE INSIGHTS' as titulo,
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

-- =====================================================
-- VER DETALHES DOS INSIGHTS ESTRATÉGICOS
-- =====================================================

SELECT 
    priority,
    category,
    title,
    explanation,
    action_label,
    TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as criado_em
FROM public.ai_insights
WHERE status = 'open'
  AND priority IN ('medium', 'low')
ORDER BY 
    CASE priority
        WHEN 'medium' THEN 1
        WHEN 'low' THEN 2
    END,
    created_at DESC
LIMIT 10;

-- =====================================================
-- VER DETALHES DOS ALERTAS URGENTES
-- =====================================================

SELECT 
    priority,
    category,
    title,
    explanation,
    action_label,
    TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as criado_em
FROM public.ai_insights
WHERE status = 'open'
  AND priority IN ('critico', 'high')
ORDER BY 
    CASE priority
        WHEN 'critico' THEN 1
        WHEN 'high' THEN 2
    END,
    created_at DESC
LIMIT 10;

-- =====================================================
-- SUCESSO!
-- =====================================================

SELECT 
    '🎉 MOTOR DE INSIGHTS COMPLETO ATIVADO!' as status,
    '7 Sentinelas SQL Monitorando 24/7' as mensagem,
    COUNT(*) FILTER (WHERE priority IN ('critico', 'high')) as alertas_urgentes,
    COUNT(*) FILTER (WHERE priority IN ('medium', 'low')) as insights_estrategicos,
    COUNT(*) as total_insights
FROM public.ai_insights
WHERE status = 'open';
