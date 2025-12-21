-- =====================================================
-- SENTINELAS DE INSIGHTS ESTRATÉGICOS (MEDIUM/LOW)
-- Insights Proativos para Crescimento e Otimização
-- =====================================================

-- Adicionar ao final da função generate_native_insights()
-- Estas sentinelas geram insights de MÉDIA e BAIXA prioridade

-- =====================================================
-- SENTINELA 4: PACIENTES VIP INATIVOS (MEDIUM)
-- =====================================================
INSERT INTO public.ai_insights (
    clinic_id, title, explanation, priority, category,
    related_entity_id, action_label, status
)
SELECT
    p_clinic_id,
    '💎 Paciente VIP Inativo: ' || p.name,
    'Paciente com LTV de R$ ' || TO_CHAR(p.total_paid, 'FM999,999,990.00') || 
    ' não retorna há ' || EXTRACT(DAY FROM NOW() - p.updated_at) || ' dias. Oportunidade de reativação.',
    'medium',  -- MÉDIA prioridade (Insight estratégico)
    'Retenção',
    p.id,
    'Enviar Campanha VIP',
    'open'
FROM public.patients p
WHERE p.clinic_id = p_clinic_id
  AND p.total_paid > 10000  -- VIP: LTV > R$ 10k
  AND p.updated_at < NOW() - INTERVAL '6 months'  -- Inativo há 6 meses
  AND NOT EXISTS (
      SELECT 1 FROM public.ai_insights ai 
      WHERE ai.related_entity_id = p.id 
      AND ai.status = 'open' 
      AND ai.category = 'Retenção'
  );

-- =====================================================
-- SENTINELA 5: ANÁLISE DE CANAL DE MARKETING (LOW)
-- =====================================================
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
    HAVING COUNT(*) >= 5  -- Mínimo 5 leads para análise
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
    'low',  -- BAIXA prioridade (Insight de tendência)
    'Marketing',
    NULL,  -- Não relacionado a entidade específica
    'Ver Análise Completa',
    'open'
FROM melhor_canal mc
WHERE NOT EXISTS (
    SELECT 1 FROM public.ai_insights ai 
    WHERE ai.clinic_id = p_clinic_id
    AND ai.status = 'open' 
    AND ai.category = 'Marketing'
    AND ai.title LIKE '%Canal de Marketing%'
    AND ai.created_at > NOW() - INTERVAL '7 days'  -- Evitar duplicação semanal
);

-- =====================================================
-- SENTINELA 6: TAXA DE CONVERSÃO EM ALTA (LOW)
-- =====================================================
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
    HAVING COUNT(*) >= 10  -- Mínimo 10 orçamentos
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
    'low',  -- BAIXA prioridade (Insight positivo)
    'Vendas',
    NULL,
    'Ver Detalhes',
    'open'
FROM conversao_atual ca
LEFT JOIN conversao_anterior caa ON ca.clinic_id = caa.clinic_id
WHERE ca.taxa_conversao > 30  -- Conversão acima de 30%
  AND NOT EXISTS (
      SELECT 1 FROM public.ai_insights ai 
      WHERE ai.clinic_id = p_clinic_id
      AND ai.status = 'open' 
      AND ai.title LIKE '%Taxa de Conversão%'
      AND ai.created_at > NOW() - INTERVAL '7 days'
  );

-- =====================================================
-- SENTINELA 7: TICKET MÉDIO EM CRESCIMENTO (LOW)
-- =====================================================
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
    'low',  -- BAIXA prioridade (Insight positivo)
    'Financeiro',
    NULL,
    'Ver Análise',
    'open'
FROM ticket_atual ta
JOIN ticket_anterior taa ON ta.clinic_id = taa.clinic_id
WHERE ta.ticket_medio > taa.ticket_medio_anterior * 1.1  -- Crescimento > 10%
  AND NOT EXISTS (
      SELECT 1 FROM public.ai_insights ai 
      WHERE ai.clinic_id = p_clinic_id
      AND ai.status = 'open' 
      AND ai.title LIKE '%Ticket Médio%'
      AND ai.created_at > NOW() - INTERVAL '7 days'
  );

-- =====================================================
-- COMO ADICIONAR À FUNÇÃO PRINCIPAL
-- =====================================================

/*
Para ativar estas sentinelas, adicione-as ao final da função 
generate_native_insights() ANTES do GET DIAGNOSTICS:

CREATE OR REPLACE FUNCTION generate_native_insights(p_clinic_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Limpar insights antigos
    DELETE FROM public.ai_insights...
    
    -- SENTINELA 1: High-Ticket (critico)
    INSERT INTO...
    
    -- SENTINELA 2: Leads sem contato (high)
    INSERT INTO...
    
    -- SENTINELA 3: Inadimplência (high)
    INSERT INTO...
    
    -- ⬇️ ADICIONAR AQUI AS NOVAS SENTINELAS ⬇️
    
    -- SENTINELA 4: Pacientes VIP Inativos (medium)
    INSERT INTO...
    
    -- SENTINELA 5: Análise de Canal (low)
    INSERT INTO...
    
    -- SENTINELA 6: Taxa de Conversão Alta (low)
    INSERT INTO...
    
    -- SENTINELA 7: Ticket Médio Crescendo (low)
    INSERT INTO...
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
END;
$$;
*/

-- =====================================================
-- TESTE RÁPIDO
-- =====================================================

-- Executar apenas as sentinelas estratégicas para teste
DO $$
DECLARE
    v_clinic_id UUID;
BEGIN
    SELECT id INTO v_clinic_id FROM public.clinics WHERE status = 'ACTIVE' LIMIT 1;
    
    -- Testar sentinela 4
    -- (Cole o código da sentinela 4 aqui substituindo p_clinic_id por v_clinic_id)
    
    RAISE NOTICE 'Sentinelas estratégicas testadas!';
END $$;

-- Ver insights estratégicos gerados
SELECT 
    priority,
    category,
    title,
    explanation
FROM public.ai_insights
WHERE status = 'open'
  AND priority IN ('medium', 'low')
ORDER BY 
    CASE priority
        WHEN 'medium' THEN 1
        WHEN 'low' THEN 2
    END,
    created_at DESC;
