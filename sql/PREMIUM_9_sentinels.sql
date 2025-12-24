CREATE OR REPLACE FUNCTION generate_native_insights(p_clinic_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- 1. Manutenção: Limpar resolvidos antigos
    DELETE FROM public.ai_insights
    WHERE clinic_id = p_clinic_id AND status = 'resolved' AND created_at < NOW() - INTERVAL '30 days';

    -- [SENTINELAS 1, 2, 3, 4, 5, 6, 7 permanecem conforme o padrão...]
    -- (Omitido aqui por brevidade, mas devem estar no seu script final)

    -- =====================================================
    -- SENTINELA 10: Oportunidade de Upsell Cirúrgico (medium)
    -- =====================================================
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    WITH pacientes_hof_recorrentes AS (
        SELECT 
            p.id as patient_id, p.name, p.clinic_id,
            COUNT(DISTINCT ti.id) as total_procedimentos_hof,
            (MAX(ti.execution_date) - MIN(ti.execution_date)) as dias_relacionamento,
            SUM(ti.total_value) as ltv_hof
        FROM public.patients p
        JOIN public.treatment_items ti ON ti.patient_id = p.id
        WHERE p.clinic_id = p_clinic_id
          AND (ti.procedure_name ILIKE '%botox%' OR ti.procedure_name ILIKE '%preenchimento%' OR ti.procedure_name ILIKE '%toxina%')
          AND ti.execution_date IS NOT NULL
        GROUP BY p.id, p.name, p.clinic_id
        HAVING COUNT(DISTINCT ti.id) >= 3 
           AND (MAX(ti.execution_date) - MIN(ti.execution_date)) >= 730
    )
    SELECT
        p_clinic_id,
        '💎 Upsell Cirúrgico: ' || phr.name,
        'Paciente recorrente em HOF há ' || ROUND(phr.dias_relacionamento / 365.0, 1) || ' anos. Perfil ideal para cirurgia facial.',
        'medium', 'Vendas', phr.patient_id, 'Agendar Consulta', 'open'
    FROM pacientes_hof_recorrentes phr
    WHERE NOT EXISTS (SELECT 1 FROM public.ai_insights ai WHERE ai.related_entity_id = phr.patient_id AND ai.status = 'open' AND ai.title LIKE '%Upsell%')
    LIMIT 5;

    -- =====================================================
    -- SENTINELA 14: Ponto de Equilíbrio Atingido (low) - CORRIGIDA
    -- =====================================================
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
        SELECT date, SUM(amount) OVER (ORDER BY date) as acumulado
        FROM public.transactions 
        WHERE clinic_id = p_clinic_id AND type = 'INCOME'
          AND date >= DATE_TRUNC('month', CURRENT_DATE) AND date <= CURRENT_DATE
    ),
    breakeven AS (
        SELECT ra.date as data_be, ra.acumulado, df.total_despesas
        FROM receitas_acumuladas ra, despesas_fixas df
        WHERE ra.acumulado >= df.total_despesas
        ORDER BY ra.date ASC LIMIT 1
    )
    SELECT
        p_clinic_id,
        '🎉 Ponto de Equilíbrio Atingido!',
        'Breakeven atingido em ' || TO_CHAR(data_be, 'DD/MM') || '. Faturamento: R$ ' || TO_CHAR(acumulado, 'FM999,999,990.00') || '. A partir de agora é lucro real!',
        'low', 'Financeiro', 'Ver Dashboard', 'open'
    FROM breakeven
    WHERE NOT EXISTS (SELECT 1 FROM public.ai_insights WHERE clinic_id = p_clinic_id AND title LIKE '%Ponto de Equilíbrio%' AND created_at > DATE_TRUNC('month', CURRENT_DATE));

    GET DIAGNOSTICS v_count = ROW_COUNT;
END;
$$;