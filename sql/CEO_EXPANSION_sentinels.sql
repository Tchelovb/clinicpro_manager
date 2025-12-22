-- =====================================================
-- EXPANSÃO CEO - GESTÃO GLOBAL 360º
-- Atualiza o motor nativo com 3 novas Sentinelas de Gestão
-- =====================================================

CREATE OR REPLACE FUNCTION generate_native_insights(p_clinic_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
    v_clinic_avg_ticket NUMERIC;
BEGIN
    -- 1. Limpeza de rotina
    DELETE FROM public.ai_insights
    WHERE clinic_id = p_clinic_id
      AND status = 'OPEN' -- Apenas limpa abertos antigos para recriar/atualizar
      AND created_at < NOW() - INTERVAL '7 days'; 
      -- Mantemos histórico resolvido por mais tempo em outra regra, aqui limpamos stale open insights

    -- =====================================================
    -- 1. SENTINELA DE RECORRÊNCIA (CLÍNICO/RETENÇÃO)
    -- Gatilho: Pacientes de Profilaxia/Orto atrasados há +30 dias do ideal (6 meses)
    -- =====================================================
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    SELECT
        p_clinic_id,
        '🦷 Recorrência em Atraso: ' || p.name,
        'Paciente realizou última Profilaxia/Manutenção há 7 meses. Risco de abandonar tratamento.',
        'medium', 'Clinical', p.id,
        'Ver Lista de Recall', 'OPEN'
    FROM public.patients p
    JOIN public.treatment_items ti ON ti.patient_id = p.id
    WHERE p.clinic_id = p_clinic_id
      AND (ti.procedure_name ILIKE '%Profilaxia%' OR ti.procedure_name ILIKE '%Limpeza%' OR ti.procedure_name ILIKE '%Manutenção%')
      AND ti.execution_date < NOW() - INTERVAL '7 months'
      AND NOT EXISTS (
          SELECT 1 FROM public.appointments a 
          WHERE a.patient_id = p.id AND a.date > ti.execution_date
      )
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai 
          WHERE ai.related_entity_id = p.id AND ai.status = 'OPEN' AND ai.category = 'Clinical'
      )
    LIMIT 10; -- Limitar para não floodar

    -- =====================================================
    -- 2. SENTINELA DE EFICIÊNCIA OPERACIONAL (OCUPAÇÃO)
    -- Gatilho: Menos de 5 agendamentos para amanhã (Ocupação Crítica)
    -- =====================================================
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    SELECT
        p_clinic_id,
        '⚠️ Agenda Ociosa Amanhã',
        'Apenas ' || COUNT(*) || ' agendamentos confirmados para amanhã. Capacidade ociosa detectada.',
        'high', 'Operational', NULL,
        'Ver Agenda', 'OPEN'
    FROM public.appointments
    WHERE clinic_id = p_clinic_id
      AND date >= CURRENT_DATE + INTERVAL '1 day'
      AND date < CURRENT_DATE + INTERVAL '2 days'
      AND status != 'CANCELED'
    HAVING COUNT(*) < 5
    AND NOT EXISTS (
        SELECT 1 FROM public.ai_insights ai 
        WHERE ai.clinic_id = p_clinic_id 
        AND ai.title LIKE '%Agenda Ociosa%' 
        AND ai.created_at > NOW() - INTERVAL '12 hours'
    );

    -- =====================================================
    -- 3. SENTINELA DE PERFORMANCE (GESTÃO/RH)
    -- Gatilho: Doutor com Ticket Médio 20% abaixo da média da clínica
    -- =====================================================
    
    -- Calcular média da clínica
    SELECT AVG(total_value) INTO v_clinic_avg_ticket
    FROM public.budgets
    WHERE clinic_id = p_clinic_id AND status = 'APPROVED' AND created_at > NOW() - INTERVAL '90 days';

    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    SELECT
        p_clinic_id,
        '📉 Alerta de Performance: Dr(a). ' || u.name,
        'Ticket Médio de R$ ' || TO_CHAR(AVG(b.final_value), 'FM999,999.00') || 
        ' está 20% abaixo da média da clínica (R$ ' || TO_CHAR(v_clinic_avg_ticket, 'FM999,999.00') || ').',
        'high', 'Management', u.id,
        'Auditar Produção', 'OPEN'
    FROM public.budgets b
    JOIN public.users u ON b.doctor_id = u.id
    WHERE b.clinic_id = p_clinic_id
      AND b.status = 'APPROVED'
      AND b.created_at > NOW() - INTERVAL '90 days'
    GROUP BY u.id, u.name
    HAVING AVG(b.final_value) < (v_clinic_avg_ticket * 0.8)
    AND NOT EXISTS (
        SELECT 1 FROM public.ai_insights ai 
        WHERE ai.related_entity_id = u.id 
        AND ai.category = 'Management'
        AND ai.status = 'OPEN'
    );

    -- =====================================================
    -- RE-INSERIR AS SENTINELAS ORIGINAIS (CRÍTICAS) PARA MANTER O ECOSSISTEMA COMPLETO
    -- (Versão simplificada das anteriores para garantir cobertura total neste script único)
    -- =====================================================

    -- 4. Orçamentos High-Ticket (Originais)
    INSERT INTO public.ai_insights (clinic_id, title, explanation, priority, category, related_entity_id, action_label, status)
    SELECT p_clinic_id, '💰 Orçamento High-Ticket Parado: ' || p.name, 
           'Valor: R$ ' || TO_CHAR(b.final_value, 'FM999,999.00') || '. Parado há ' || EXTRACT(DAY FROM NOW() - b.created_at) || ' dias.',
           'critico', 'Sales', b.id, 'Ver Pipeline', 'OPEN'
    FROM public.budgets b JOIN public.patients p ON b.patient_id = p.id
    WHERE b.clinic_id = p_clinic_id AND b.status = 'DRAFT' AND b.final_value > 15000 AND b.created_at < NOW() - INTERVAL '3 days'
    AND NOT EXISTS (SELECT 1 FROM public.ai_insights ai WHERE ai.related_entity_id = b.id AND ai.category='Sales' AND ai.status='OPEN');

    -- Notificação de execução
    RAISE NOTICE 'CEO Expansion Engine executed.';
END;
$$;

-- Executar atualização imediata
SELECT run_insights_engine_for_all_clinics();
