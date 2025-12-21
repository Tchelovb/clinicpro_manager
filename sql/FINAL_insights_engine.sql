-- =====================================================
-- MOTOR DE INSIGHTS NATIVO - VERSÃO FINAL CORRIGIDA
-- Todas as 3 Sentinelas + Teste
-- =====================================================

CREATE OR REPLACE FUNCTION generate_native_insights(p_clinic_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- 1. Manutenção: Limpar insights resolvidos antigos
    DELETE FROM public.ai_insights
    WHERE clinic_id = p_clinic_id
      AND status = 'resolved'
      AND created_at < NOW() - INTERVAL '30 days';

    -- SENTINELA 1: VENDAS HIGH-TICKET PARADAS (> R$ 15k)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    SELECT
        p_clinic_id,
        '💰 Orçamento High-Ticket Parado: ' || p.name,
        'O orçamento de R$ ' || TO_CHAR(b.final_value, 'FM999,999,990.00') || 
        ' está parado há ' || EXTRACT(DAY FROM NOW() - b.created_at) || ' dias. Sugestão: Entender objeções e fechar.',
        'critico', 'Vendas', b.id,
        'Ver Orçamento', 'open'
    FROM public.budgets b
    JOIN public.patients p ON b.patient_id = p.id
    WHERE b.clinic_id = p_clinic_id
      AND b.status = 'DRAFT'
      AND b.final_value > 15000
      AND b.created_at < NOW() - INTERVAL '3 days'
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai 
          WHERE ai.related_entity_id = b.id AND ai.status = 'open'
      );

    -- SENTINELA 2: LEADS SEM CONTATO (> 12h)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    SELECT
        p_clinic_id,
        '🔥 Lead Quente Sem Contato: ' || l.name,
        'Lead cadastrado há ' || EXTRACT(HOUR FROM NOW() - l.created_at) || ' horas sem nenhuma interação registrada.',
        CASE WHEN l.priority = 'HIGH' THEN 'critico' ELSE 'high' END, 
        'Marketing', l.id,
        'Chamar no Zap', 'open'
    FROM public.leads l
    WHERE l.clinic_id = p_clinic_id
      AND l.created_at < NOW() - INTERVAL '12 hours'
      AND NOT EXISTS (SELECT 1 FROM public.lead_interactions li WHERE li.lead_id = l.id)
      AND NOT EXISTS (SELECT 1 FROM public.ai_insights ai WHERE ai.related_entity_id = l.id AND ai.status = 'open');

    -- SENTINELA 3: INADIMPLÊNCIA (Pacientes com saldo devedor)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category,
        related_entity_id, action_label, status
    )
    SELECT
        p_clinic_id,
        '⚠️ Inadimplência: ' || p.name,
        'Paciente possui saldo devedor de R$ ' || TO_CHAR(p.balance_due, 'FM999,999,990.00') || '. Acionar cobrança.',
        CASE WHEN p.balance_due > 10000 THEN 'critico' ELSE 'high' END,
        'Financeiro', p.id,
        'Ver Financeiro', 'open'
    FROM public.patients p
    WHERE p.clinic_id = p_clinic_id
      AND p.balance_due > 500  -- Apenas valores significativos
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai 
          WHERE ai.related_entity_id = p.id AND ai.status = 'open' AND ai.category = 'Financeiro'
      );

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '✅ Motor de Insights: % novos insights gerados para clinic_id %', v_count, p_clinic_id;
END;
$$;

-- =====================================================
-- TESTE IMEDIATO
-- =====================================================

DO $$
DECLARE
    v_clinic_id UUID;
BEGIN
    -- Pegar primeira clínica ativa
    SELECT id INTO v_clinic_id FROM public.clinics WHERE status = 'ACTIVE' LIMIT 1;
    
    IF v_clinic_id IS NOT NULL THEN
        RAISE NOTICE '🚀 Executando motor de insights para clinic_id: %', v_clinic_id;
        PERFORM generate_native_insights(v_clinic_id);
        RAISE NOTICE '✅ Motor executado com sucesso!';
    ELSE
        RAISE WARNING '❌ Nenhuma clínica ativa encontrada';
    END IF;
END $$;

-- =====================================================
-- VER INSIGHTS GERADOS
-- =====================================================

SELECT 
    '📊 INSIGHTS GERADOS' as titulo,
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

-- Ver detalhes dos insights
SELECT 
    priority,
    category,
    title,
    explanation,
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

-- =====================================================
-- FUNÇÃO PARA TODAS AS CLÍNICAS
-- =====================================================

CREATE OR REPLACE FUNCTION run_insights_engine_for_all_clinics()
RETURNS TABLE(clinic_name TEXT, insights_gerados INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    clinic_record RECORD;
    v_before INTEGER;
    v_after INTEGER;
BEGIN
    FOR clinic_record IN 
        SELECT id, name FROM public.clinics WHERE status = 'ACTIVE'
    LOOP
        -- Contar insights antes
        SELECT COUNT(*) INTO v_before 
        FROM public.ai_insights 
        WHERE clinic_id = clinic_record.id AND status = 'open';
        
        -- Executar motor
        PERFORM generate_native_insights(clinic_record.id);
        
        -- Contar insights depois
        SELECT COUNT(*) INTO v_after 
        FROM public.ai_insights 
        WHERE clinic_id = clinic_record.id AND status = 'open';
        
        -- Retornar resultado
        clinic_name := clinic_record.name;
        insights_gerados := v_after - v_before;
        RETURN NEXT;
    END LOOP;
END;
$$;

-- Testar função de todas as clínicas
SELECT * FROM run_insights_engine_for_all_clinics();

-- =====================================================
-- SUCESSO! 🎉
-- =====================================================

SELECT 
    '🎉 MOTOR DE INTELIGÊNCIA NATIVA ATIVADO!' as status,
    COUNT(*) FILTER (WHERE status = 'open') as insights_ativos,
    COUNT(*) FILTER (WHERE priority = 'critico') as criticos,
    COUNT(*) FILTER (WHERE priority = 'high') as altos
FROM public.ai_insights;
