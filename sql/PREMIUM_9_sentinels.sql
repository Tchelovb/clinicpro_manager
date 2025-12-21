-- =====================================================
-- MOTOR DE INSIGHTS PREMIUM - 9 SENTINELAS
-- 3 Urgentes + 6 Estratégicas (incluindo Upsell e Breakeven)
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

    -- SENTINELA 10: Oportunidade de Upsell Cirúrgico (medium) 🆕
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    WITH pacientes_hof_recorrentes AS (
        SELECT 
            p.id as patient_id,
            p.name,
            p.clinic_id,
            COUNT(DISTINCT ti.id) as total_procedimentos_hof,
            MAX(ti.execution_date) as ultimo_procedimento,
            MIN(ti.execution_date) as primeiro_procedimento,
            -- FIXED: Simple date subtraction (DATE - DATE = INTEGER days)
            (MAX(ti.execution_date) - MIN(ti.execution_date)) as dias_relacionamento,
            SUM(ti.total_value) as ltv_hof
        FROM public.patients p
        JOIN public.treatment_items ti ON ti.patient_id = p.id
        WHERE p.clinic_id = p_clinic_id
          AND (
              ti.procedure_name ILIKE '%botox%' 
              OR ti.procedure_name ILIKE '%preenchimento%'
              OR ti.procedure_name ILIKE '%toxina%'
              OR ti.procedure_name ILIKE '%ácido hialurônico%'
          )
          AND ti.execution_date IS NOT NULL
        GROUP BY p.id, p.name, p.clinic_id
        HAVING 
            COUNT(DISTINCT ti.id) >= 3
            -- FIXED: Simple date subtraction
            AND (MAX(ti.execution_date) - MIN(ti.execution_date)) >= 730
            AND MAX(ti.execution_date) > NOW() - INTERVAL '6 months'
    ),
    pacientes_sem_cirurgia AS (
        SELECT phr.*
        FROM pacientes_hof_recorrentes phr
        WHERE NOT EXISTS (
            SELECT 1 FROM public.treatment_items ti2
            WHERE ti2.patient_id = phr.patient_id
            AND (
                ti2.procedure_name ILIKE '%lifting%'
                OR ti2.procedure_name ILIKE '%blefaroplastia%'
                OR ti2.procedure_name ILIKE '%rinoplastia%'
                OR ti2.procedure_name ILIKE '%cervicoplastia%'
                OR ti2.procedure_name ILIKE '%mentoplastia%'
            )
        )
    )
    SELECT
        p_clinic_id,
        '💎 Oportunidade de Upsell Cirúrgico: ' || psc.name,
        'Paciente recorrente em HOF há ' || ROUND(psc.dias_relacionamento / 365.0, 1) || ' anos, ' ||
        'com ' || psc.total_procedimentos_hof || ' procedimentos (LTV R$ ' || 
        TO_CHAR(psc.ltv_hof, 'FM999,999,990.00') || '). ' ||
        'Perfil ideal para procedimentos cirúrgicos.',
        'medium', 'Vendas', psc.patient_id, 'Agendar Consulta Cirúrgica', 'open'
    FROM pacientes_sem_cirurgia psc
    WHERE NOT EXISTS (
        SELECT 1 FROM public.ai_insights ai 
        WHERE ai.related_entity_id = psc.patient_id 
        AND ai.status = 'open' 
        AND ai.title LIKE '%Upsell Cirúrgico%'
        AND ai.created_at > NOW() - INTERVAL '30 days'
    )
    LIMIT 5;

    -- SENTINELA 5: Canal de Marketing em Destaque (low)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    WITH canal_performance AS (
        SELECT 
            clinic_id, source,
            COUNT(*) as total_leads,
            COUNT(*) FILTER (WHERE lead_score > 70) as leads_qualificados,
            ROUND((COUNT(*) FILTER (WHERE lead_score > 70)::numeric / NULLIF(COUNT(*), 0)) * 100, 1) as taxa_qualificacao
        FROM public.leads
        WHERE clinic_id = p_clinic_id AND created_at > NOW() - INTERVAL '30 days'
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
        ' leads com ' || mc.taxa_qualificacao || '% de qualificação. Considere aumentar investimento.',
        'low', 'Marketing', NULL, 'Ver Análise Completa', 'open'
    FROM melhor_canal mc
    WHERE NOT EXISTS (
        SELECT 1 FROM public.ai_insights ai 
        WHERE ai.clinic_id = p_clinic_id AND ai.status = 'open' 
        AND ai.category = 'Marketing' AND ai.title LIKE '%Canal de Marketing%'
        AND ai.created_at > NOW() - INTERVAL '7 days'
    );

    -- SENTINELA 6: Taxa de Conversão em Alta (low)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    WITH conversao_atual AS (
        SELECT clinic_id,
            ROUND((COUNT(*) FILTER (WHERE status = 'APPROVED')::numeric / NULLIF(COUNT(*), 0)) * 100, 1) as taxa_conversao
        FROM public.budgets
        WHERE clinic_id = p_clinic_id AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY clinic_id
        HAVING COUNT(*) >= 10
    )
    SELECT
        p_clinic_id,
        '📈 Taxa de Conversão em Alta: ' || ca.taxa_conversao || '%',
        'Sua taxa de conversão atual é de ' || ca.taxa_conversao || '%, acima da média do setor (25%). Continue!',
        'low', 'Vendas', NULL, 'Ver Detalhes', 'open'
    FROM conversao_atual ca
    WHERE ca.taxa_conversao > 30
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai 
          WHERE ai.clinic_id = p_clinic_id AND ai.status = 'open' 
          AND ai.title LIKE '%Taxa de Conversão%'
          AND ai.created_at > NOW() - INTERVAL '7 days'
      );

    -- SENTINELA 7: Ticket Médio em Crescimento (low)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    WITH ticket_atual AS (
        SELECT clinic_id, ROUND(AVG(final_value), 2) as ticket_medio
        FROM public.budgets
        WHERE clinic_id = p_clinic_id AND status = 'APPROVED' AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY clinic_id
        HAVING COUNT(*) >= 5
    ),
    ticket_anterior AS (
        SELECT clinic_id, ROUND(AVG(final_value), 2) as ticket_medio_anterior
        FROM public.budgets
        WHERE clinic_id = p_clinic_id AND status = 'APPROVED' 
        AND created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days'
        GROUP BY clinic_id
    )
    SELECT
        p_clinic_id,
        '💰 Ticket Médio Cresceu: R$ ' || TO_CHAR(ta.ticket_medio, 'FM999,999,990.00'),
        'Crescimento de ' || ROUND(((ta.ticket_medio - taa.ticket_medio_anterior) / taa.ticket_medio_anterior) * 100, 1) || 
        '% vs mês anterior. Pacientes aceitando tratamentos mais completos!',
        'low', 'Financeiro', NULL, 'Ver Análise', 'open'
    FROM ticket_atual ta
    JOIN ticket_anterior taa ON ta.clinic_id = taa.clinic_id
    WHERE ta.ticket_medio > taa.ticket_medio_anterior * 1.1
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai 
          WHERE ai.clinic_id = p_clinic_id AND ai.status = 'open' 
          AND ai.title LIKE '%Ticket Médio%'
          AND ai.created_at > NOW() - INTERVAL '7 days'
      );

    -- SENTINELA 14: Ponto de Equilíbrio Atingido (low) 🆕
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    WITH mes_atual AS (
        SELECT 
            DATE_TRUNC('month', CURRENT_DATE) as inicio_mes,
            DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day' as fim_mes
    ),
    despesas_fixas_mes AS (
        SELECT COALESCE(SUM(e.amount), 0) as total_despesas
        FROM public.expenses e
        CROSS JOIN mes_atual ma
        WHERE e.clinic_id = p_clinic_id
          AND e.due_date >= ma.inicio_mes
          AND e.due_date <= ma.fim_mes
    ),
    receitas_acumuladas AS (
        SELECT t.date, SUM(t.amount) OVER (ORDER BY t.date) as receita_acumulada
        FROM public.transactions t
        CROSS JOIN mes_atual ma
        WHERE t.clinic_id = p_clinic_id AND t.type = 'INCOME'
          AND t.date >= ma.inicio_mes AND t.date <= CURRENT_DATE
    ),
    ponto_equilibrio AS (
        SELECT ra.date as data_breakeven, ra.receita_acumulada, dfm.total_despesas
        FROM receitas_acumuladas ra
        CROSS JOIN despesas_fixas_mes dfm
        WHERE ra.receita_acumulada >= dfm.total_despesas
        ORDER BY ra.date ASC
        LIMIT 1
    ),
    dias_desde_breakeven AS (
        SELECT pe.*,
            EXTRACT(DAY FROM (CURRENT_DATE - pe.data_breakeven)) as dias_no_lucro,
            EXTRACT(DAY FROM (pe.data_breakeven - DATE_TRUNC('month', CURRENT_DATE))) + 1 as dia_do_mes_breakeven
        FROM ponto_equilibrio pe
    )
    SELECT
        p_clinic_id,
        '🎉 Ponto de Equilíbrio Atingido em ' || dsb.dia_do_mes_breakeven || ' Dias!',
        'Parabéns! Breakeven no dia ' || TO_CHAR(dsb.data_breakeven, 'DD/MM/YYYY') || '. ' ||
        'Faturamento: R$ ' || TO_CHAR(dsb.receita_acumulada, 'FM999,999,990.00') || ' vs ' ||
        'Despesas: R$ ' || TO_CHAR(dsb.total_despesas, 'FM999,999,990.00') || '. ' ||
        CASE 
            WHEN dsb.dias_no_lucro = 0 THEN 'Você entrou no lucro HOJE! 🚀'
            ELSE 'Há ' || dsb.dias_no_lucro || ' dias operando no lucro! 💰'
        END,
        'low', 'Financeiro', NULL, 'Ver Dashboard Financeiro', 'open'
    FROM dias_desde_breakeven dsb
    WHERE NOT EXISTS (
        SELECT 1 FROM public.ai_insights ai 
        WHERE ai.clinic_id = p_clinic_id AND ai.status = 'open' 
        AND ai.title LIKE '%Ponto de Equilíbrio%'
        AND ai.created_at > DATE_TRUNC('month', CURRENT_DATE)
    )
    AND dsb.receita_acumulada >= dsb.total_despesas;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '✅ Motor Premium: % insights gerados', v_count;
END;
$$;

-- Executar teste
DO $$
DECLARE
    v_clinic_id UUID;
BEGIN
    SELECT id INTO v_clinic_id FROM public.clinics WHERE status = 'ACTIVE' LIMIT 1;
    
    IF v_clinic_id IS NOT NULL THEN
        RAISE NOTICE '🚀 Executando motor premium com 9 sentinelas...';
        PERFORM generate_native_insights(v_clinic_id);
    END IF;
END $$;

-- Ver resumo
SELECT 
    '📊 MOTOR PREMIUM ATIVADO' as titulo,
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
    END;

SELECT '🎉 9 Sentinelas Ativas (3 Urgentes + 6 Estratégicas)!' as status;
