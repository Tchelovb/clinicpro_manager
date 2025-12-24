-- =====================================================
-- FUNÇÃO CORRIGIDA: generate_native_insights
-- Resolvendo o erro de ENUM treatment_status
-- =====================================================

CREATE OR REPLACE FUNCTION generate_native_insights(p_clinic_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- 1. Manutenção: Limpar insights antigos
    DELETE FROM public.ai_insights
    WHERE clinic_id = p_clinic_id
      AND status = 'resolved'
      AND created_at < NOW() - INTERVAL '30 days';

    -- [SENTINELA 1 e 2 permanecem iguais...]

    -- SENTINELA 3: INADIMPLÊNCIA PÓS-CIRÚRGICA (CORRIGIDA)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    SELECT
        p_clinic_id,
        '⚠️ Inadimplência Pós-Cirúrgica: ' || p.name,
        'Procedimento finalizado, mas o paciente possui saldo devedor de R$ ' || TO_CHAR(p.balance_due, 'FM999,999,990.00'),
        CASE WHEN p.balance_due > 10000 THEN 'critico' ELSE 'high' END,
        'Financeiro', p.id,
        'Ver Financeiro', 'open'
    FROM public.treatment_items ti
    JOIN public.budgets b ON ti.budget_id = b.id
    JOIN public.patients p ON b.patient_id = p.id
    WHERE p.clinic_id = p_clinic_id
      -- AJUSTE AQUI: Trocado 'CONCLUDED' por 'COMPLETED'
      AND ti.status = 'COMPLETED' 
      AND p.balance_due > 0
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai 
          WHERE ai.related_entity_id = p.id 
          AND ai.status = 'open' 
          AND ai.category = 'Financeiro'
      );

    GET DIAGNOSTICS v_count = ROW_COUNT;
END;
$$;
