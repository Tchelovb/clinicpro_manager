-- ============================================================================
-- BOS 9.2 - CONVERSÃO DE INSIGHTS EM OPERAÇÕES TÁTICAS
-- Versão Simplificada e Testada
-- ============================================================================

-- ============================================================================
-- 1. FUNÇÃO PRINCIPAL: CONVERTER INSIGHTS EM OPERAÇÕES
-- ============================================================================

CREATE OR REPLACE FUNCTION convert_insights_to_operations(p_clinic_id UUID)
RETURNS TABLE (
    operations_created INTEGER,
    total_xp_available INTEGER,
    total_financial_impact NUMERIC
) AS $$
DECLARE
    v_created_count INTEGER := 0;
    v_total_xp INTEGER := 0;
    v_total_impact NUMERIC := 0;
    v_insight RECORD;
    v_operation_type TEXT;
    v_xp_reward INTEGER;
    v_financial_impact NUMERIC;
    v_priority TEXT;
BEGIN
    -- Loop pelos insights que ainda não possuem operação tática vinculada
    FOR v_insight IN 
        SELECT ai.* 
        FROM ai_insights ai
        LEFT JOIN tactical_operations tac ON tac.related_insight_id = ai.id
        WHERE ai.clinic_id = p_clinic_id 
        AND ai.status = 'open'
        AND tac.id IS NULL
        ORDER BY 
            CASE ai.priority
                WHEN 'critico' THEN 1
                WHEN 'high' THEN 2
                WHEN 'medium' THEN 3
                WHEN 'low' THEN 4
                ELSE 5
            END,
            ai.created_at DESC
    LOOP
        -- Determinar tipo de operação baseado no título
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
            -- Default baseado na prioridade
            IF v_insight.priority IN ('critico', 'high') THEN
                v_operation_type := 'rescue_roi';
                v_xp_reward := 500;
            ELSE
                v_operation_type := 'ticket_expansion';
                v_xp_reward := 300;
            END IF;
        END IF;
        
        -- Tentar extrair valor financeiro do explanation
        v_financial_impact := 0;
        BEGIN
            -- Regex para capturar R$ 1.234,56 ou R$ 1234
            v_financial_impact := (
                SELECT COALESCE(
                    REPLACE(REPLACE(
                        (regexp_matches(v_insight.explanation, 'R\$\s*([0-9.]+(?:,[0-9]{2})?)', 'i'))[1],
                        '.', ''
                    ), ',', '.')::NUMERIC,
                    0
                )
            );
        EXCEPTION WHEN OTHERS THEN
            v_financial_impact := 0;
        END;
        
        -- Se não encontrou valor, estimar baseado no tipo
        IF v_financial_impact = 0 THEN
            v_financial_impact := CASE v_operation_type
                WHEN 'ticket_expansion' THEN 15000
                WHEN 'rescue_roi' THEN 5000
                WHEN 'base_protection' THEN 1000
                WHEN 'milestone_conquest' THEN 50000
                ELSE 1000
            END;
        END IF;
        
        -- Ajustar XP baseado no valor financeiro
        IF v_financial_impact >= 20000 THEN
            v_xp_reward := v_xp_reward * 2;
        ELSIF v_financial_impact >= 10000 THEN
            v_xp_reward := FLOOR(v_xp_reward * 1.5);
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
        v_created_count := v_created_count + 1;
        v_total_xp := v_total_xp + v_xp_reward;
        v_total_impact := v_total_impact + v_financial_impact;
        
    END LOOP;
    
    -- Retornar estatísticas
    RETURN QUERY SELECT v_created_count, v_total_xp, v_total_impact;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. FUNÇÃO DE SINCRONIZAÇÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_operations_with_insights(p_clinic_id UUID)
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
-- 3. COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION convert_insights_to_operations IS 'Converte ai_insights em tactical_operations com XP e recompensas calculadas automaticamente';
COMMENT ON FUNCTION sync_operations_with_insights IS 'Sincroniza operações táticas com estado atual dos insights';

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- Para testar, execute:
-- SELECT * FROM convert_insights_to_operations((SELECT clinic_id FROM users WHERE email = 'seu-email@exemplo.com' LIMIT 1));
