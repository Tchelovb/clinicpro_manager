-- ============================================================================
-- BOS 9.2 - CONVERSÃO DE AI_INSIGHTS EM OPERAÇÕES TÁTICAS
-- Função que transforma insights em missões executivas com XP e recompensas
-- ============================================================================

-- ============================================================================
-- FUNÇÃO: CONVERTER INSIGHTS EM OPERAÇÕES TÁTICAS
-- ============================================================================

CREATE OR REPLACE FUNCTION convert_insights_to_operations(
    p_clinic_id UUID
)
RETURNS TABLE(
    operations_created INTEGER,
    total_xp_available INTEGER,
    total_financial_impact NUMERIC
) AS $$
DECLARE
    v_insight RECORD;
    v_operation_type TEXT;
    v_xp_reward INTEGER;
    v_financial_impact NUMERIC;
    v_priority TEXT;
    v_operations_count INTEGER := 0;
    v_total_xp INTEGER := 0;
    v_total_impact NUMERIC := 0;
BEGIN
    -- Processar cada insight que ainda não tem operação tática
    FOR v_insight IN 
        SELECT ai.* 
        FROM ai_insights ai
        LEFT JOIN tactical_operations tac ON tac.related_insight_id = ai.id
        WHERE ai.clinic_id = p_clinic_id
        AND ai.status = 'open'
        AND tac.id IS NULL -- Apenas insights sem operação tática
        ORDER BY 
            CASE ai.priority
                WHEN 'critico' THEN 1
                WHEN 'high' THEN 2
                WHEN 'medium' THEN 3
                WHEN 'low' THEN 4
            END,
            ai.created_at DESC
    LOOP
        -- Determinar tipo de operação baseado no título e prioridade
        IF v_insight.title ILIKE '%lead%' OR v_insight.title ILIKE '%contato%' THEN
            v_operation_type := 'rescue_roi';
            v_xp_reward := 500;
        ELSIF v_insight.title ILIKE '%upsell%' OR v_insight.title ILIKE '%cirurgia%' OR v_insight.title ILIKE '%transição%' THEN
            v_operation_type := 'ticket_expansion';
            v_xp_reward := 1000;
        ELSIF v_insight.title ILIKE '%inadimpl%' OR v_insight.title ILIKE '%dívida%' OR v_insight.title ILIKE '%pagamento%' THEN
            v_operation_type := 'base_protection';
            v_xp_reward := 300;
        ELSIF v_insight.title ILIKE '%meta%' OR v_insight.title ILIKE '%milestone%' OR v_insight.title ILIKE '%50k%' THEN
            v_operation_type := 'milestone_conquest';
            v_xp_reward := 2000;
        ELSE
            -- Default: baseado na prioridade
            IF v_insight.priority IN ('critico', 'high') THEN
                v_operation_type := 'rescue_roi';
                v_xp_reward := 500;
            ELSE
                v_operation_type := 'ticket_expansion';
                v_xp_reward := 300;
            END IF;
        END IF;
        
        -- Extrair valor financeiro do explanation (regex para R$ X.XXX,XX)
        v_financial_impact := 0;
        BEGIN
            -- Tentar extrair valor do formato "R$ 1.234,56" ou "R$ 1234"
            v_financial_impact := (
                SELECT COALESCE(
                    (regexp_matches(v_insight.explanation, 'R\$\s*([0-9.]+(?:,[0-9]{2})?)', 'i'))[1]::TEXT,
                    '0'
                )::TEXT
            );
            -- Remover pontos de milhar e substituir vírgula por ponto
            v_financial_impact := REPLACE(REPLACE(v_financial_impact, '.', ''), ',', '.')::NUMERIC;
        EXCEPTION WHEN OTHERS THEN
            v_financial_impact := 0;
        END;
        
        -- Se não encontrou valor, estimar baseado no tipo
        IF v_financial_impact = 0 THEN
            v_financial_impact := CASE v_operation_type
                WHEN 'ticket_expansion' THEN 15000 -- Média cirurgia facial
                WHEN 'rescue_roi' THEN 5000 -- Média orçamento
                WHEN 'base_protection' THEN 1000 -- Média inadimplência
                WHEN 'milestone_conquest' THEN 50000 -- Meta mensal
                ELSE 1000
            END;
        END IF;
        
        -- Ajustar XP baseado no valor financeiro (maior valor = mais XP)
        IF v_financial_impact >= 20000 THEN
            v_xp_reward := v_xp_reward * 2; -- Dobro de XP para high-ticket
        ELSIF v_financial_impact >= 10000 THEN
            v_xp_reward := FLOOR(v_xp_reward * 1.5); -- 50% mais XP
        END IF;
        
        -- Mapear prioridade
        v_priority := CASE v_insight.priority
            WHEN 'critico' THEN 'critical'
            WHEN 'high' THEN 'high'
            WHEN 'medium' THEN 'medium'
            WHEN 'low' THEN 'low'
            ELSE 'medium'
        END;
        
        -- Criar operação tática
        INSERT INTO tactical_operations (
            clinic_id,
            type,
            title,
            description,
            financial_impact,
            xp_reward,
            priority,
            status,
            related_insight_id,
            deadline,
            metadata
        ) VALUES (
            p_clinic_id,
            v_operation_type,
            v_insight.title,
            v_insight.explanation,
            v_financial_impact,
            v_xp_reward,
            v_priority,
            'active',
            v_insight.id,
            -- Deadline: 24h para crítico, 48h para high, 7 dias para outros
            CASE v_priority
                WHEN 'critical' THEN NOW() + INTERVAL '24 hours'
                WHEN 'high' THEN NOW() + INTERVAL '48 hours'
                WHEN 'medium' THEN NOW() + INTERVAL '7 days'
                ELSE NOW() + INTERVAL '14 days'
            END,
            jsonb_build_object(
                'sentinel', v_insight.sentinel,
                'auto_generated', true,
                'conversion_date', NOW()
            )
        );
        
        -- Incrementar contadores
        v_operations_count := v_operations_count + 1;
        v_total_xp := v_total_xp + v_xp_reward;
        v_total_impact := v_total_impact + v_financial_impact;
        
    END LOOP;
    
    -- Retornar estatísticas
    RETURN QUERY SELECT 
        v_operations_count,
        v_total_xp,
        v_total_impact;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: AUTO-CONVERTER NOVOS INSIGHTS
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_convert_insight_to_operation()
RETURNS TRIGGER AS $$
BEGIN
    -- Converter automaticamente quando um novo insight é criado
    PERFORM convert_insights_to_operations(NEW.clinic_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger (se não existir)
DROP TRIGGER IF EXISTS auto_convert_insights ON ai_insights;
CREATE TRIGGER auto_convert_insights
    AFTER INSERT ON ai_insights
    FOR EACH ROW
    EXECUTE FUNCTION trigger_convert_insight_to_operation();

-- ============================================================================
-- FUNÇÃO: SINCRONIZAR OPERAÇÕES COM INSIGHTS
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_operations_with_insights(
    p_clinic_id UUID
)
RETURNS TEXT AS $$
DECLARE
    v_result RECORD;
BEGIN
    -- Converter insights pendentes
    SELECT * INTO v_result FROM convert_insights_to_operations(p_clinic_id);
    
    -- Marcar operações como expiradas se o insight foi resolvido
    UPDATE tactical_operations tac
    SET status = 'expired',
        updated_at = NOW()
    FROM ai_insights ai
    WHERE tac.related_insight_id = ai.id
    AND tac.clinic_id = p_clinic_id
    AND tac.status = 'active'
    AND ai.status != 'open';
    
    RETURN format(
        'Sincronização concluída: %s operações criadas, %s XP disponível, R$ %s em impacto',
        v_result.operations_created,
        v_result.total_xp_available,
        v_result.total_financial_impact
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: OPERAÇÕES COM DETALHES ENRIQUECIDOS
-- ============================================================================

CREATE OR REPLACE VIEW tactical_operations_enriched AS
SELECT 
    tac.*,
    ai.sentinel,
    ai.created_at as insight_created_at,
    
    -- Calcular urgência (tempo até deadline)
    CASE 
        WHEN tac.deadline IS NULL THEN 'no_deadline'
        WHEN tac.deadline < NOW() THEN 'overdue'
        WHEN tac.deadline < NOW() + INTERVAL '24 hours' THEN 'urgent'
        WHEN tac.deadline < NOW() + INTERVAL '48 hours' THEN 'soon'
        ELSE 'normal'
    END as urgency,
    
    -- Tempo restante
    EXTRACT(EPOCH FROM (tac.deadline - NOW())) / 3600 as hours_remaining,
    
    -- Score de prioridade (para ordenação)
    CASE tac.priority
        WHEN 'critical' THEN 4
        WHEN 'high' THEN 3
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 1
    END as priority_score,
    
    -- Potencial de recompensa (XP + Impacto financeiro normalizado)
    tac.xp_reward + (tac.financial_impact / 100) as reward_potential

FROM tactical_operations tac
LEFT JOIN ai_insights ai ON ai.id = tac.related_insight_id
WHERE tac.status = 'active';

-- ============================================================================
-- FUNÇÃO HELPER: OBTER OPERAÇÕES PRIORITÁRIAS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_priority_operations(
    p_clinic_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    id UUID,
    type TEXT,
    title TEXT,
    description TEXT,
    financial_impact NUMERIC,
    xp_reward INTEGER,
    priority TEXT,
    urgency TEXT,
    hours_remaining NUMERIC,
    deadline TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tac.id,
        tac.type,
        tac.title,
        tac.description,
        tac.financial_impact,
        tac.xp_reward,
        tac.priority,
        tac.urgency,
        tac.hours_remaining,
        tac.deadline
    FROM tactical_operations_enriched tac
    WHERE tac.clinic_id = p_clinic_id
    ORDER BY 
        tac.priority_score DESC,
        tac.urgency DESC,
        tac.reward_potential DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION convert_insights_to_operations IS 'Converte ai_insights em tactical_operations com XP e recompensas calculadas';
COMMENT ON FUNCTION sync_operations_with_insights IS 'Sincroniza operações táticas com estado dos insights';
COMMENT ON VIEW tactical_operations_enriched IS 'View enriquecida com urgência, tempo restante e score de prioridade';
COMMENT ON FUNCTION get_priority_operations IS 'Retorna operações ordenadas por prioridade, urgência e potencial de recompensa';

-- ============================================================================
-- EXECUTAR CONVERSÃO INICIAL (OPCIONAL)
-- ============================================================================

-- Para converter insights existentes, execute:
-- SELECT * FROM convert_insights_to_operations('seu-clinic-id-aqui');

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
