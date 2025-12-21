-- =====================================================
-- GAMIFICAÇÃO ATIVA - TRIGGERS DE XP AUTOMÁTICO
-- Versão: BOS 18.8
-- Data: 20/12/2025
-- =====================================================

-- =====================================================
-- FUNÇÃO: Calcular XP baseado no Radar de Oportunidades
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_opportunity_xp(
    p_budget_id UUID,
    p_clinic_id UUID
) RETURNS TABLE (
    crc_user_id UUID,
    crc_xp INTEGER,
    professional_user_id UUID,
    professional_xp INTEGER,
    tier TEXT
) AS $$
DECLARE
    v_budget_value DECIMAL;
    v_crc_id UUID;
    v_professional_id UUID;
    v_tier TEXT;
    v_crc_xp INTEGER := 0;
    v_professional_xp INTEGER := 0;
    v_has_evaluation BOOLEAN := FALSE;
    v_is_recurrence BOOLEAN := FALSE;
BEGIN
    -- 1. Buscar dados do orçamento
    SELECT 
        b.final_value,
        b.created_by_user_id,
        b.doctor_id
    INTO 
        v_budget_value,
        v_crc_id,
        v_professional_id
    FROM budgets b
    WHERE b.id = p_budget_id;

    -- 2. Verificar se paciente teve avaliação prévia (OURO)
    SELECT EXISTS (
        SELECT 1 
        FROM appointments a
        WHERE a.patient_id = (SELECT patient_id FROM budgets WHERE id = p_budget_id)
        AND a.type IN ('EVALUATION', 'CONSULTA')
        AND a.status = 'COMPLETED'
        AND a.date >= NOW() - INTERVAL '15 days'
    ) INTO v_has_evaluation;

    -- 3. Verificar se é procedimento de recorrência (PRATA)
    SELECT EXISTS (
        SELECT 1
        FROM budget_items bi
        WHERE bi.budget_id = p_budget_id
        AND (
            bi.procedure_name ILIKE '%botox%'
            OR bi.procedure_name ILIKE '%toxina%'
            OR bi.procedure_name ILIKE '%manutenção%'
            OR bi.procedure_name ILIKE '%retorno%'
        )
    ) INTO v_is_recurrence;

    -- 4. Determinar TIER e calcular XP
    IF v_budget_value >= 10000 THEN
        -- 💎 DIAMANTE
        v_tier := 'DIAMOND';
        v_crc_xp := 500;
        v_professional_xp := 200;
        
    ELSIF v_has_evaluation THEN
        -- 🥇 OURO (Avaliação convertida)
        v_tier := 'GOLD';
        v_crc_xp := 250;
        v_professional_xp := 0;
        
    ELSIF v_is_recurrence THEN
        -- 🥈 PRATA (Recorrência)
        v_tier := 'SILVER';
        v_crc_xp := 100;
        v_professional_xp := 0;
        
    ELSE
        -- Orçamento padrão (sem tier específico)
        v_tier := 'STANDARD';
        v_crc_xp := 50;
        v_professional_xp := 0;
    END IF;

    -- 5. Retornar resultado
    RETURN QUERY SELECT 
        v_crc_id,
        v_crc_xp,
        v_professional_id,
        v_professional_xp,
        v_tier;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: Atualizar progressão do usuário
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_progression(
    p_user_id UUID,
    p_xp_gained INTEGER,
    p_reason TEXT
) RETURNS VOID AS $$
DECLARE
    v_current_xp INTEGER;
    v_current_level INTEGER;
    v_new_xp INTEGER;
    v_new_level INTEGER;
    v_level_thresholds INTEGER[] := ARRAY[0, 5000, 15000, 30000, 50000];
BEGIN
    -- 1. Buscar progressão atual (ou criar se não existir)
    SELECT total_xp, current_level
    INTO v_current_xp, v_current_level
    FROM user_progression
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        -- Criar registro inicial
        INSERT INTO user_progression (user_id, total_xp, current_level)
        VALUES (p_user_id, 0, 1);
        v_current_xp := 0;
        v_current_level := 1;
    END IF;

    -- 2. Calcular novo XP
    v_new_xp := v_current_xp + p_xp_gained;

    -- 3. Calcular novo nível
    v_new_level := v_current_level;
    FOR i IN 1..array_length(v_level_thresholds, 1) LOOP
        IF v_new_xp >= v_level_thresholds[i] THEN
            v_new_level := i;
        END IF;
    END LOOP;

    -- 4. Atualizar progressão
    UPDATE user_progression
    SET 
        total_xp = v_new_xp,
        current_level = v_new_level,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- 5. Registrar log de XP
    INSERT INTO xp_logs (user_id, xp_amount, reason, created_at)
    VALUES (p_user_id, p_xp_gained, p_reason, NOW());

    -- 6. Se subiu de nível, criar notificação
    IF v_new_level > v_current_level THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            created_at
        ) VALUES (
            p_user_id,
            'LEVEL_UP',
            '🎉 Você subiu de nível!',
            format('Parabéns! Você atingiu o Nível %s com %s XP total!', v_new_level, v_new_xp),
            NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Gamificação ao aprovar orçamento
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_budget_approval_gamification()
RETURNS TRIGGER AS $$
DECLARE
    v_xp_data RECORD;
BEGIN
    -- Só executar quando status mudar para APPROVED
    IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
        
        -- Calcular XP baseado no tier
        FOR v_xp_data IN 
            SELECT * FROM calculate_opportunity_xp(NEW.id, NEW.clinic_id)
        LOOP
            -- Atualizar XP do CRC
            IF v_xp_data.crc_user_id IS NOT NULL AND v_xp_data.crc_xp > 0 THEN
                PERFORM update_user_progression(
                    v_xp_data.crc_user_id,
                    v_xp_data.crc_xp,
                    format('Conversão %s - Orçamento #%s (R$ %s)', 
                        v_xp_data.tier, 
                        NEW.id::TEXT, 
                        NEW.final_value::TEXT
                    )
                );
            END IF;

            -- Atualizar XP do Professional
            IF v_xp_data.professional_user_id IS NOT NULL AND v_xp_data.professional_xp > 0 THEN
                PERFORM update_user_progression(
                    v_xp_data.professional_user_id,
                    v_xp_data.professional_xp,
                    format('Avaliação High-Ticket - Orçamento #%s (R$ %s)', 
                        NEW.id::TEXT, 
                        NEW.final_value::TEXT
                    )
                );
            END IF;

            -- Criar conquista especial para Diamante
            IF v_xp_data.tier = 'DIAMOND' THEN
                -- Verificar se é Cervicoplastia ou Lip Lifting
                IF EXISTS (
                    SELECT 1 FROM budget_items bi
                    WHERE bi.budget_id = NEW.id
                    AND (
                        bi.procedure_name ILIKE '%cervicoplastia%'
                        OR bi.procedure_name ILIKE '%lip lifting%'
                    )
                ) THEN
                    -- Conceder medalha "Mestre do High-Ticket"
                    INSERT INTO user_achievements (user_id, achievement_id, earned_at)
                    SELECT 
                        v_xp_data.crc_user_id,
                        a.id,
                        NOW()
                    FROM achievements a
                    WHERE a.name = 'Mestre do High-Ticket'
                    AND NOT EXISTS (
                        SELECT 1 FROM user_achievements ua
                        WHERE ua.user_id = v_xp_data.crc_user_id
                        AND ua.achievement_id = a.id
                    );
                END IF;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS budget_approval_gamification ON budgets;
CREATE TRIGGER budget_approval_gamification
    AFTER INSERT OR UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION trigger_budget_approval_gamification();

-- =====================================================
-- TABELA: Logs de XP (para auditoria)
-- =====================================================

CREATE TABLE IF NOT EXISTS xp_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_logs_user_id ON xp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_created_at ON xp_logs(created_at DESC);

-- =====================================================
-- CONQUISTA: Mestre do High-Ticket
-- =====================================================

INSERT INTO achievements (
    id,
    name,
    description,
    icon,
    rarity,
    xp_reward,
    category,
    is_active
) VALUES (
    uuid_generate_v4(),
    'Mestre do High-Ticket',
    'Fechou uma Cervicoplastia ou Lip Lifting (procedimento premium)',
    '💎',
    'LEGENDARY',
    1000,
    'SALES',
    true
) ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION calculate_opportunity_xp IS 'Calcula XP baseado no tier do Radar de Oportunidades (Diamante/Ouro/Prata)';
COMMENT ON FUNCTION update_user_progression IS 'Atualiza total_xp, current_level e cria notificações de level up';
COMMENT ON FUNCTION trigger_budget_approval_gamification IS 'Trigger que executa gamificação ao aprovar orçamento';
COMMENT ON TABLE xp_logs IS 'Auditoria de ganhos de XP para transparência e debugging';
