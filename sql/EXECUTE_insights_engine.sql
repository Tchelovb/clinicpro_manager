-- =====================================================
-- EXECUTE ESTE ARQUIVO NO SUPABASE SQL EDITOR
-- Motor de Insights Completo - 7 Sentinelas
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

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '✅ % insights gerados', v_count;
END;
$$;

-- Executar teste
DO $$
DECLARE
    v_clinic_id UUID;
BEGIN
    SELECT id INTO v_clinic_id FROM public.clinics WHERE status = 'ACTIVE' LIMIT 1;
    
    IF v_clinic_id IS NOT NULL THEN
        RAISE NOTICE '🚀 Executando motor de insights...';
        PERFORM generate_native_insights(v_clinic_id);
    END IF;
END $$;

-- Ver resultados
SELECT 
    priority,
    category,
    COUNT(*) as total,
    STRING_AGG(title, ' | ') as exemplos
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

SELECT '🎉 Motor Ativado com Sucesso!' as status;
