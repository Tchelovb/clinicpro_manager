-- =====================================================
-- SENTINELAS PREMIUM - UPSELL E PONTO DE EQUILÍBRIO
-- Adicione estas sentinelas à função generate_native_insights()
-- =====================================================

-- =====================================================
-- SENTINELA 10: OPORTUNIDADE DE UPSELL CIRÚRGICO (MEDIUM)
-- =====================================================
-- Identifica pacientes recorrentes em HOF (Botox/Preenchimento)
-- que podem estar prontos para procedimentos cirúrgicos

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
        EXTRACT(DAYS FROM (MAX(ti.execution_date) - MIN(ti.execution_date))) as dias_relacionamento,
        SUM(ti.total_value) as ltv_hof
    FROM public.patients p
    JOIN public.treatment_items ti ON ti.patient_id = p.id
    WHERE p.clinic_id = p_clinic_id
      -- Filtrar apenas procedimentos HOF (Harmonização Orofacial)
      AND (
          ti.procedure_name ILIKE '%botox%' 
          OR ti.procedure_name ILIKE '%preenchimento%'
          OR ti.procedure_name ILIKE '%toxina%'
          OR ti.procedure_name ILIKE '%ácido hialurônico%'
      )
      AND ti.execution_date IS NOT NULL
    GROUP BY p.id, p.name, p.clinic_id
    HAVING 
        -- Paciente recorrente: 3+ procedimentos HOF
        COUNT(DISTINCT ti.id) >= 3
        -- Relacionamento de 2+ anos
        AND EXTRACT(DAYS FROM (MAX(ti.execution_date) - MIN(ti.execution_date))) >= 730
        -- Último procedimento recente (< 6 meses) = paciente ativo
        AND MAX(ti.execution_date) > NOW() - INTERVAL '6 months'
),
pacientes_sem_cirurgia AS (
    SELECT phr.*
    FROM pacientes_hof_recorrentes phr
    WHERE NOT EXISTS (
        -- Verificar se já fez alguma cirurgia facial
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
    'com ' || psc.total_procedimentos_hof || ' procedimentos realizados (LTV R$ ' || 
    TO_CHAR(psc.ltv_hof, 'FM999,999,990.00') || '). ' ||
    'Perfil ideal para apresentar procedimentos cirúrgicos como Lip Lifting, Lifting Temporal ou Blefaroplastia.',
    'medium',
    'Vendas',
    psc.patient_id,
    'Agendar Consulta Cirúrgica',
    'open'
FROM pacientes_sem_cirurgia psc
WHERE NOT EXISTS (
    SELECT 1 FROM public.ai_insights ai 
    WHERE ai.related_entity_id = psc.patient_id 
    AND ai.status = 'open' 
    AND ai.title LIKE '%Upsell Cirúrgico%'
    AND ai.created_at > NOW() - INTERVAL '30 days'  -- Evitar spam mensal
)
LIMIT 5;  -- Máximo 5 oportunidades por execução

-- =====================================================
-- SENTINELA 14: PONTO DE EQUILÍBRIO ATINGIDO (LOW)
-- =====================================================
-- Monitora quando o faturamento do mês cobre todas as despesas
-- e informa o dia exato em que a clínica entrou no lucro

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
    SELECT 
        COALESCE(SUM(e.amount), 0) as total_despesas
    FROM public.expenses e
    CROSS JOIN mes_atual ma
    WHERE e.clinic_id = p_clinic_id
      AND e.due_date >= ma.inicio_mes
      AND e.due_date <= ma.fim_mes
),
receitas_acumuladas AS (
    SELECT 
        t.date,
        SUM(t.amount) OVER (ORDER BY t.date) as receita_acumulada
    FROM public.transactions t
    CROSS JOIN mes_atual ma
    WHERE t.clinic_id = p_clinic_id
      AND t.type = 'INCOME'
      AND t.date >= ma.inicio_mes
      AND t.date <= CURRENT_DATE
),
ponto_equilibrio AS (
    SELECT 
        ra.date as data_breakeven,
        ra.receita_acumulada,
        dfm.total_despesas
    FROM receitas_acumuladas ra
    CROSS JOIN despesas_fixas_mes dfm
    WHERE ra.receita_acumulada >= dfm.total_despesas
    ORDER BY ra.date ASC
    LIMIT 1
),
dias_desde_breakeven AS (
    SELECT 
        pe.*,
        EXTRACT(DAY FROM (CURRENT_DATE - pe.data_breakeven)) as dias_no_lucro,
        EXTRACT(DAY FROM (pe.data_breakeven - DATE_TRUNC('month', CURRENT_DATE))) + 1 as dia_do_mes_breakeven
    FROM ponto_equilibrio pe
)
SELECT
    p_clinic_id,
    '🎉 Ponto de Equilíbrio Atingido em ' || dsb.dia_do_mes_breakeven || ' Dias!',
    'Parabéns! A clínica atingiu o Ponto de Equilíbrio no dia ' || 
    TO_CHAR(dsb.data_breakeven, 'DD/MM/YYYY') || ' (dia ' || dsb.dia_do_mes_breakeven || ' do mês). ' ||
    'Faturamento acumulado: R$ ' || TO_CHAR(dsb.receita_acumulada, 'FM999,999,990.00') || ' vs ' ||
    'Despesas: R$ ' || TO_CHAR(dsb.total_despesas, 'FM999,999,990.00') || '. ' ||
    CASE 
        WHEN dsb.dias_no_lucro = 0 THEN 'Você entrou no lucro HOJE! 🚀'
        WHEN dsb.dias_no_lucro = 1 THEN 'Há 1 dia operando no lucro! 💰'
        ELSE 'Há ' || dsb.dias_no_lucro || ' dias operando no lucro! 💰'
    END,
    'low',
    'Financeiro',
    NULL,
    'Ver Dashboard Financeiro',
    'open'
FROM dias_desde_breakeven dsb
WHERE NOT EXISTS (
    SELECT 1 FROM public.ai_insights ai 
    WHERE ai.clinic_id = p_clinic_id
    AND ai.status = 'open' 
    AND ai.title LIKE '%Ponto de Equilíbrio%'
    AND ai.created_at > DATE_TRUNC('month', CURRENT_DATE)  -- 1 vez por mês
)
-- Só gerar se realmente atingiu o breakeven
AND dsb.receita_acumulada >= dsb.total_despesas;

-- =====================================================
-- COMO ADICIONAR À FUNÇÃO PRINCIPAL
-- =====================================================

/*
Para ativar estas sentinelas, adicione-as à função generate_native_insights()
APÓS a Sentinela 7 e ANTES do GET DIAGNOSTICS:

CREATE OR REPLACE FUNCTION generate_native_insights(p_clinic_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Limpar insights antigos
    DELETE FROM public.ai_insights...
    
    -- SENTINELA 1-7: Já implementadas
    INSERT INTO...
    
    -- ⬇️ ADICIONAR AQUI AS NOVAS SENTINELAS ⬇️
    
    -- SENTINELA 10: Oportunidade de Upsell Cirúrgico (medium)
    INSERT INTO...
    
    -- SENTINELA 14: Ponto de Equilíbrio Atingido (low)
    INSERT INTO...
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
END;
$$;
*/

-- =====================================================
-- TESTE INDIVIDUAL DAS SENTINELAS
-- =====================================================

-- Testar Sentinela 10 (Upsell Cirúrgico)
DO $$
DECLARE
    v_clinic_id UUID;
BEGIN
    SELECT id INTO v_clinic_id FROM public.clinics WHERE status = 'ACTIVE' LIMIT 1;
    
    RAISE NOTICE '🧪 Testando Sentinela 10: Upsell Cirúrgico...';
    
    -- Cole aqui o código da Sentinela 10, substituindo p_clinic_id por v_clinic_id
    
    RAISE NOTICE '✅ Teste concluído!';
END $$;

-- Testar Sentinela 14 (Ponto de Equilíbrio)
DO $$
DECLARE
    v_clinic_id UUID;
BEGIN
    SELECT id INTO v_clinic_id FROM public.clinics WHERE status = 'ACTIVE' LIMIT 1;
    
    RAISE NOTICE '🧪 Testando Sentinela 14: Ponto de Equilíbrio...';
    
    -- Cole aqui o código da Sentinela 14, substituindo p_clinic_id por v_clinic_id
    
    RAISE NOTICE '✅ Teste concluído!';
END $$;

-- Ver insights gerados
SELECT 
    priority,
    category,
    title,
    explanation,
    action_label
FROM public.ai_insights
WHERE status = 'open'
  AND (
      title LIKE '%Upsell Cirúrgico%'
      OR title LIKE '%Ponto de Equilíbrio%'
  )
ORDER BY created_at DESC;

-- =====================================================
-- DOCUMENTAÇÃO DAS SENTINELAS
-- =====================================================

/*
SENTINELA 10: OPORTUNIDADE DE UPSELL CIRÚRGICO
-----------------------------------------------
Prioridade: MEDIUM (Insight Estratégico)
Categoria: Vendas
Gatilho: Paciente com 3+ procedimentos HOF em 2+ anos, sem cirurgia facial
Frequência: Máximo 1 vez por mês por paciente
Limite: 5 oportunidades por execução
Ação Sugerida: "Agendar Consulta Cirúrgica"

Exemplo de Insight:
"💎 Oportunidade de Upsell Cirúrgico: Maria Silva
Paciente recorrente em HOF há 2.5 anos, com 8 procedimentos realizados 
(LTV R$ 12.500,00). Perfil ideal para apresentar procedimentos cirúrgicos 
como Lip Lifting, Lifting Temporal ou Blefaroplastia."

SENTINELA 14: PONTO DE EQUILÍBRIO ATINGIDO
-------------------------------------------
Prioridade: LOW (Insight Positivo)
Categoria: Financeiro
Gatilho: Receita acumulada do mês >= Despesas totais do mês
Frequência: 1 vez por mês
Ação Sugerida: "Ver Dashboard Financeiro"

Exemplo de Insight:
"🎉 Ponto de Equilíbrio Atingido em 18 Dias!
Parabéns! A clínica atingiu o Ponto de Equilíbrio no dia 18/12/2025 
(dia 18 do mês). Faturamento acumulado: R$ 85.000,00 vs Despesas: 
R$ 82.000,00. Há 2 dias operando no lucro! 💰"
*/
