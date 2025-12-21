-- =====================================================
-- PASSO 2: EXECUTAR E TESTAR O MOTOR DE INSIGHTS
-- =====================================================

-- Testar a função para sua clínica
-- Substitua 'sua-clinic-uuid' pelo UUID real da sua clínica
DO $$
DECLARE
    v_clinic_id UUID;
BEGIN
    -- Pegar o ID da primeira clínica ativa
    SELECT id INTO v_clinic_id FROM public.clinics WHERE status = 'ACTIVE' LIMIT 1;
    
    IF v_clinic_id IS NOT NULL THEN
        RAISE NOTICE 'Executando motor de insights para clinic_id: %', v_clinic_id;
        PERFORM generate_native_insights(v_clinic_id);
        RAISE NOTICE '✅ Motor executado com sucesso!';
    ELSE
        RAISE NOTICE '❌ Nenhuma clínica ativa encontrada';
    END IF;
END $$;

-- Verificar insights gerados
SELECT 
    priority,
    category,
    COUNT(*) as total,
    STRING_AGG(DISTINCT title, ', ') as exemplos
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

-- Ver detalhes dos insights críticos
SELECT 
    title,
    explanation,
    category,
    action_label,
    created_at
FROM public.ai_insights
WHERE status = 'open' 
  AND priority = 'critico'
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- PASSO 3: CRIAR FUNÇÃO PARA TODAS AS CLÍNICAS
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
-- PASSO 4: CONFIGURAR CRON JOB (OPCIONAL)
-- =====================================================

-- Verificar se pg_cron está disponível
SELECT * FROM pg_available_extensions WHERE name = 'pg_cron';

-- Se disponível, criar extensão e agendar
-- Descomente as linhas abaixo se pg_cron estiver disponível:

-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- SELECT cron.schedule(
--     'native-insights-hourly',
--     '0 * * * *',  -- A cada hora
--     $$SELECT run_insights_engine_for_all_clinics();$$
-- );

-- Ver jobs agendados
-- SELECT * FROM cron.job;

-- =====================================================
-- DASHBOARD DE MONITORAMENTO
-- =====================================================

-- Resumo geral de insights
SELECT 
    '📊 DASHBOARD DE INSIGHTS' as titulo,
    COUNT(*) as total_insights,
    COUNT(*) FILTER (WHERE priority = 'critico') as criticos,
    COUNT(*) FILTER (WHERE priority = 'high') as altos,
    COUNT(*) FILTER (WHERE status = 'open') as abertos,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolvidos,
    MIN(created_at) as mais_antigo,
    MAX(created_at) as mais_recente
FROM public.ai_insights;

-- Insights por categoria
SELECT 
    category,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE priority = 'critico') as criticos,
    COUNT(*) FILTER (WHERE priority = 'high') as altos,
    ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600), 1) as idade_media_horas
FROM public.ai_insights
WHERE status = 'open'
GROUP BY category
ORDER BY criticos DESC, altos DESC;

-- =====================================================
-- SUCESSO! 🎉
-- =====================================================

SELECT 
    '🎉 Motor de Inteligência Nativa ATIVADO!' as status,
    'Insights sendo gerados automaticamente' as mensagem,
    COUNT(*) as insights_ativos
FROM public.ai_insights
WHERE status = 'open';
