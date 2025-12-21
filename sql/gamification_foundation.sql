-- ============================================================================
-- BOS 8.0 - SISTEMA DE GAMIFICAÇÃO EXECUTIVA
-- Fase 1: Fundação - Tabelas e Funções Base
-- ============================================================================

-- ============================================================================
-- 1. TABELA DE PROGRESSÃO DO USUÁRIO
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_progression (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- Progressão
    current_level INTEGER DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 4),
    total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
    
    -- Saúde da Clínica (IVC - Índice de Vitalidade Corporativa)
    clinic_health_score INTEGER DEFAULT 100 CHECK (clinic_health_score >= 0 AND clinic_health_score <= 100),
    health_marketing INTEGER DEFAULT 100,
    health_sales INTEGER DEFAULT 100,
    health_clinical INTEGER DEFAULT 100,
    health_operational INTEGER DEFAULT 100,
    health_financial INTEGER DEFAULT 100,
    
    -- Streaks e Conquistas
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    achievements JSONB DEFAULT '[]',
    unlocked_features JSONB DEFAULT '["dashboard_basic"]',
    
    -- Estatísticas
    total_operations_completed INTEGER DEFAULT 0,
    total_revenue_generated NUMERIC DEFAULT 0,
    milestone_50k_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Índices
    UNIQUE(user_id, clinic_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_progression_user ON user_progression(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progression_clinic ON user_progression(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_progression_level ON user_progression(current_level);

-- ============================================================================
-- 2. TABELA DE OPERAÇÕES TÁTICAS (QUESTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tactical_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- Tipo e Classificação
    type TEXT NOT NULL CHECK (type IN ('rescue_roi', 'ticket_expansion', 'base_protection', 'milestone_conquest')),
    title TEXT NOT NULL,
    description TEXT,
    
    -- Impacto e Recompensas
    financial_impact NUMERIC DEFAULT 0,
    xp_reward INTEGER DEFAULT 0,
    
    -- Prioridade e Status
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'expired')),
    
    -- Relacionamentos
    related_insight_id UUID REFERENCES ai_insights(id) ON DELETE SET NULL,
    related_lead_id UUID,
    related_budget_id UUID,
    related_patient_id UUID,
    
    -- Deadline e Conclusão
    deadline TIMESTAMP,
    completed_at TIMESTAMP,
    completed_by UUID REFERENCES users(id),
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tactical_operations_clinic ON tactical_operations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_tactical_operations_status ON tactical_operations(status);
CREATE INDEX IF NOT EXISTS idx_tactical_operations_type ON tactical_operations(type);
CREATE INDEX IF NOT EXISTS idx_tactical_operations_priority ON tactical_operations(priority);
CREATE INDEX IF NOT EXISTS idx_tactical_operations_insight ON tactical_operations(related_insight_id);

-- ============================================================================
-- 3. TABELA DE EVENTOS DE SAÚDE
-- ============================================================================

CREATE TABLE IF NOT EXISTS health_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- Tipo e Impacto
    event_type TEXT NOT NULL,
    impact INTEGER NOT NULL, -- Positivo ou negativo (-100 a +100)
    pillar TEXT CHECK (pillar IN ('marketing', 'sales', 'clinical', 'operational', 'financial', 'overall')),
    
    -- Descrição
    title TEXT,
    description TEXT,
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_health_events_clinic ON health_events(clinic_id);
CREATE INDEX IF NOT EXISTS idx_health_events_pillar ON health_events(pillar);
CREATE INDEX IF NOT EXISTS idx_health_events_created ON health_events(created_at DESC);

-- ============================================================================
-- 4. TABELA DE CONQUISTAS (ACHIEVEMENTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT,
    xp_reward INTEGER DEFAULT 0,
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    requirements JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir conquistas padrão
INSERT INTO achievements (code, title, description, icon, category, xp_reward, rarity) VALUES
('first_operation', 'Primeira Missão', 'Complete sua primeira Operação Tática', '🎯', 'operations', 100, 'common'),
('streak_3', 'Combo Iniciante', 'Complete 3 operações em sequência', '🔥', 'streaks', 300, 'common'),
('streak_7', 'Combo Avançado', 'Complete 7 operações em sequência', '🔥', 'streaks', 700, 'rare'),
('milestone_50k', 'Boss Final Derrotado', 'Atinja a meta de R$ 50.000 em um mês', '🏆', 'milestones', 2000, 'epic'),
('level_2', 'Estrategista High-Ticket', 'Alcance o Nível 2', '⭐', 'progression', 500, 'rare'),
('level_3', 'Arquiteto do Instituto', 'Alcance o Nível 3', '⭐⭐', 'progression', 1000, 'epic'),
('level_4', 'Diretor Exponencial', 'Alcance o Nível 4', '⭐⭐⭐', 'progression', 2000, 'legendary'),
('health_100', 'Saúde Perfeita', 'Mantenha IVC em 100% por 7 dias', '💚', 'health', 500, 'rare'),
('revenue_100k', 'Seis Dígitos', 'Fature R$ 100.000 em um mês', '💎', 'revenue', 3000, 'legendary'),
('upsell_master', 'Mestre do Upsell', 'Complete 10 operações de Expansão de Ticket', '💰', 'operations', 1000, 'epic')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 5. FUNÇÃO: CALCULAR XP NECESSÁRIO PARA PRÓXIMO NÍVEL
-- ============================================================================

CREATE OR REPLACE FUNCTION get_xp_for_level(level INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE level
        WHEN 1 THEN 0
        WHEN 2 THEN 5000
        WHEN 3 THEN 15000
        WHEN 4 THEN 30000
        ELSE 999999
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 6. FUNÇÃO: CALCULAR NÍVEL BASEADO EM XP
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    IF xp >= 30000 THEN RETURN 4;
    ELSIF xp >= 15000 THEN RETURN 3;
    ELSIF xp >= 5000 THEN RETURN 2;
    ELSE RETURN 1;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 7. FUNÇÃO: ADICIONAR XP E ATUALIZAR NÍVEL
-- ============================================================================

CREATE OR REPLACE FUNCTION add_xp(
    p_user_id UUID,
    p_clinic_id UUID,
    p_xp_amount INTEGER,
    p_source TEXT DEFAULT 'manual'
)
RETURNS TABLE(
    new_level INTEGER,
    new_total_xp INTEGER,
    level_up BOOLEAN
) AS $$
DECLARE
    v_old_level INTEGER;
    v_new_level INTEGER;
    v_new_xp INTEGER;
    v_level_up BOOLEAN := FALSE;
BEGIN
    -- Buscar progressão atual
    SELECT current_level, total_xp INTO v_old_level, v_new_xp
    FROM user_progression
    WHERE user_id = p_user_id AND clinic_id = p_clinic_id;
    
    -- Se não existe, criar
    IF NOT FOUND THEN
        INSERT INTO user_progression (user_id, clinic_id, total_xp)
        VALUES (p_user_id, p_clinic_id, p_xp_amount)
        RETURNING current_level, total_xp INTO v_old_level, v_new_xp;
    ELSE
        -- Adicionar XP
        v_new_xp := v_new_xp + p_xp_amount;
        
        UPDATE user_progression
        SET total_xp = v_new_xp,
            updated_at = NOW()
        WHERE user_id = p_user_id AND clinic_id = p_clinic_id;
    END IF;
    
    -- Calcular novo nível
    v_new_level := calculate_level_from_xp(v_new_xp);
    
    -- Verificar se subiu de nível
    IF v_new_level > v_old_level THEN
        v_level_up := TRUE;
        
        UPDATE user_progression
        SET current_level = v_new_level,
            updated_at = NOW()
        WHERE user_id = p_user_id AND clinic_id = p_clinic_id;
        
        -- Registrar evento de saúde (level up é positivo)
        INSERT INTO health_events (clinic_id, event_type, impact, pillar, title, description)
        VALUES (
            p_clinic_id,
            'level_up',
            20,
            'overall',
            'Novo Nível Desbloqueado!',
            'Nível ' || v_new_level || ' alcançado'
        );
    END IF;
    
    RETURN QUERY SELECT v_new_level, v_new_xp, v_level_up;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. FUNÇÃO: ATUALIZAR SAÚDE DA CLÍNICA (IVC)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_clinic_health(
    p_clinic_id UUID,
    p_pillar TEXT,
    p_impact INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_new_health INTEGER;
    v_overall_health INTEGER;
BEGIN
    -- Atualizar pilar específico
    IF p_pillar = 'marketing' THEN
        UPDATE user_progression
        SET health_marketing = GREATEST(0, LEAST(100, health_marketing + p_impact))
        WHERE clinic_id = p_clinic_id
        RETURNING health_marketing INTO v_new_health;
    ELSIF p_pillar = 'sales' THEN
        UPDATE user_progression
        SET health_sales = GREATEST(0, LEAST(100, health_sales + p_impact))
        WHERE clinic_id = p_clinic_id
        RETURNING health_sales INTO v_new_health;
    ELSIF p_pillar = 'clinical' THEN
        UPDATE user_progression
        SET health_clinical = GREATEST(0, LEAST(100, health_clinical + p_impact))
        WHERE clinic_id = p_clinic_id
        RETURNING health_clinical INTO v_new_health;
    ELSIF p_pillar = 'operational' THEN
        UPDATE user_progression
        SET health_operational = GREATEST(0, LEAST(100, health_operational + p_impact))
        WHERE clinic_id = p_clinic_id
        RETURNING health_operational INTO v_new_health;
    ELSIF p_pillar = 'financial' THEN
        UPDATE user_progression
        SET health_financial = GREATEST(0, LEAST(100, health_financial + p_impact))
        WHERE clinic_id = p_clinic_id
        RETURNING health_financial INTO v_new_health;
    END IF;
    
    -- Recalcular IVC (média dos 5 pilares)
    UPDATE user_progression
    SET clinic_health_score = (
        health_marketing + health_sales + health_clinical + 
        health_operational + health_financial
    ) / 5
    WHERE clinic_id = p_clinic_id
    RETURNING clinic_health_score INTO v_overall_health;
    
    -- Registrar evento de saúde
    INSERT INTO health_events (clinic_id, event_type, impact, pillar, title)
    VALUES (
        p_clinic_id,
        'health_update',
        p_impact,
        p_pillar,
        'Atualização de Saúde: ' || p_pillar
    );
    
    RETURN v_overall_health;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. FUNÇÃO: COMPLETAR OPERAÇÃO TÁTICA
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_tactical_operation(
    p_operation_id UUID,
    p_user_id UUID
)
RETURNS TABLE(
    xp_earned INTEGER,
    revenue_impact NUMERIC,
    level_up BOOLEAN
) AS $$
DECLARE
    v_operation RECORD;
    v_result RECORD;
BEGIN
    -- Buscar operação
    SELECT * INTO v_operation
    FROM tactical_operations
    WHERE id = p_operation_id AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Operação não encontrada ou já completada';
    END IF;
    
    -- Marcar como completada
    UPDATE tactical_operations
    SET status = 'completed',
        completed_at = NOW(),
        completed_by = p_user_id,
        updated_at = NOW()
    WHERE id = p_operation_id;
    
    -- Adicionar XP
    SELECT * INTO v_result
    FROM add_xp(p_user_id, v_operation.clinic_id, v_operation.xp_reward, 'operation_completed');
    
    -- Atualizar estatísticas
    UPDATE user_progression
    SET total_operations_completed = total_operations_completed + 1,
        total_revenue_generated = total_revenue_generated + COALESCE(v_operation.financial_impact, 0),
        current_streak = current_streak + 1,
        best_streak = GREATEST(best_streak, current_streak + 1),
        updated_at = NOW()
    WHERE user_id = p_user_id AND clinic_id = v_operation.clinic_id;
    
    -- Retornar resultado
    RETURN QUERY SELECT 
        v_operation.xp_reward,
        v_operation.financial_impact,
        v_result.level_up;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. TRIGGER: AUTO-ATUALIZAR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_progression_updated_at
    BEFORE UPDATE ON user_progression
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tactical_operations_updated_at
    BEFORE UPDATE ON tactical_operations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. VIEW: DASHBOARD DE GAMIFICAÇÃO
-- ============================================================================

CREATE OR REPLACE VIEW gamification_dashboard AS
SELECT 
    up.user_id,
    up.clinic_id,
    up.current_level,
    up.total_xp,
    get_xp_for_level(up.current_level + 1) - up.total_xp AS xp_to_next_level,
    up.clinic_health_score,
    up.current_streak,
    up.best_streak,
    up.total_operations_completed,
    up.total_revenue_generated,
    up.milestone_50k_count,
    
    -- Operações ativas
    (SELECT COUNT(*) FROM tactical_operations WHERE clinic_id = up.clinic_id AND status = 'active') AS active_operations,
    
    -- Operações por tipo
    (SELECT COUNT(*) FROM tactical_operations WHERE clinic_id = up.clinic_id AND status = 'active' AND type = 'rescue_roi') AS rescue_roi_count,
    (SELECT COUNT(*) FROM tactical_operations WHERE clinic_id = up.clinic_id AND status = 'active' AND type = 'ticket_expansion') AS ticket_expansion_count,
    (SELECT COUNT(*) FROM tactical_operations WHERE clinic_id = up.clinic_id AND status = 'active' AND type = 'base_protection') AS base_protection_count,
    
    -- Saúde por pilar
    up.health_marketing,
    up.health_sales,
    up.health_clinical,
    up.health_operational,
    up.health_financial,
    
    -- Conquistas
    jsonb_array_length(up.achievements) AS total_achievements,
    jsonb_array_length(up.unlocked_features) AS total_features_unlocked
    
FROM user_progression up;

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE user_progression IS 'Progressão de gamificação do usuário - XP, Nível, Saúde da Clínica';
COMMENT ON TABLE tactical_operations IS 'Operações Táticas (Quests) geradas a partir de ai_insights';
COMMENT ON TABLE health_events IS 'Eventos que afetam a saúde (HP) da clínica';
COMMENT ON TABLE achievements IS 'Conquistas disponíveis no sistema';

COMMENT ON FUNCTION add_xp IS 'Adiciona XP ao usuário e atualiza nível automaticamente';
COMMENT ON FUNCTION update_clinic_health IS 'Atualiza saúde de um pilar específico e recalcula IVC';
COMMENT ON FUNCTION complete_tactical_operation IS 'Marca operação como completa e concede recompensas';

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
