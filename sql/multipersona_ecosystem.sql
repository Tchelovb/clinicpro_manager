-- ============================================================================
-- BOS 12.0 - ECOSSISTEMA MULTIPERSONA
-- Sistema de Recompensas e Missões por Role
-- ============================================================================

-- ============================================================================
-- 1. ALTERAÇÕES NO SCHEMA EXISTENTE
-- ============================================================================

-- Adicionar campo assigned_to em tactical_operations
ALTER TABLE tactical_operations
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;

-- Adicionar campo mission_type
ALTER TABLE tactical_operations
ADD COLUMN IF NOT EXISTS mission_type text CHECK (mission_type IN ('daily', 'weekly', 'monthly', 'custom'));

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_tactical_operations_assigned ON tactical_operations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tactical_operations_mission_type ON tactical_operations(mission_type);

-- ============================================================================
-- 2. TABELA DE CATÁLOGO DE RECOMPENSAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS reward_catalog (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Identificação
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('bronze', 'silver', 'gold', 'legendary')),
  
  -- Custo e Restrições
  xp_cost integer NOT NULL CHECK (xp_cost > 0),
  role_restriction text[], -- NULL = todos podem resgatar
  stock_limit integer, -- NULL = ilimitado
  stock_available integer,
  
  -- Tipo de Recompensa
  reward_type text NOT NULL CHECK (reward_type IN (
    'voucher', 'time_off', 'bonus', 'recognition', 
    'team_event', 'experience'
  )),
  
  -- Valor Monetário (para controle financeiro)
  monetary_value numeric DEFAULT 0,
  
  -- Status
  is_active boolean DEFAULT true,
  requires_admin_approval boolean DEFAULT true,
  
  -- Metadados
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Índices
CREATE INDEX idx_reward_catalog_clinic ON reward_catalog(clinic_id);
CREATE INDEX idx_reward_catalog_category ON reward_catalog(category);
CREATE INDEX idx_reward_catalog_active ON reward_catalog(is_active);

-- ============================================================================
-- 3. TABELA DE RESGATES DE RECOMPENSAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reward_id uuid REFERENCES reward_catalog(id) ON DELETE CASCADE,
  
  -- Controle
  xp_spent integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'delivered', 'cancelled'
  )),
  
  -- Aprovação
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_at timestamp,
  approval_notes text,
  
  -- Entrega
  delivered_at timestamp,
  delivery_notes text,
  
  -- Cancelamento
  cancelled_at timestamp,
  cancellation_reason text,
  
  -- Metadados
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Índices
CREATE INDEX idx_reward_redemptions_clinic ON reward_redemptions(clinic_id);
CREATE INDEX idx_reward_redemptions_user ON reward_redemptions(user_id);
CREATE INDEX idx_reward_redemptions_status ON reward_redemptions(status);
CREATE INDEX idx_reward_redemptions_created ON reward_redemptions(created_at DESC);

-- ============================================================================
-- 4. FUNÇÃO: RESGATAR RECOMPENSA
-- ============================================================================

CREATE OR REPLACE FUNCTION redeem_reward(
  p_user_id UUID,
  p_reward_id UUID
) RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  redemption_id UUID
) AS $$
DECLARE
  v_user_xp INTEGER;
  v_user_role TEXT;
  v_reward RECORD;
  v_redemption_id UUID;
  v_clinic_id UUID;
BEGIN
  -- Buscar dados do usuário
  SELECT total_xp, u.role, u.clinic_id
  INTO v_user_xp, v_user_role, v_clinic_id
  FROM user_progression up
  JOIN users u ON u.id = up.user_id
  WHERE up.user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Usuário não encontrado', NULL::UUID;
    RETURN;
  END IF;
  
  -- Buscar recompensa
  SELECT * INTO v_reward
  FROM reward_catalog
  WHERE id = p_reward_id 
  AND clinic_id = v_clinic_id
  AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Recompensa não encontrada ou inativa', NULL::UUID;
    RETURN;
  END IF;
  
  -- Validar XP suficiente
  IF v_user_xp < v_reward.xp_cost THEN
    RETURN QUERY SELECT false, 
      format('XP insuficiente. Você tem %s XP, precisa de %s XP', v_user_xp, v_reward.xp_cost),
      NULL::UUID;
    RETURN;
  END IF;
  
  -- Validar restrição de role
  IF v_reward.role_restriction IS NOT NULL 
     AND NOT (v_user_role = ANY(v_reward.role_restriction)) THEN
    RETURN QUERY SELECT false, 'Esta recompensa não está disponível para sua função', NULL::UUID;
    RETURN;
  END IF;
  
  -- Validar estoque
  IF v_reward.stock_available IS NOT NULL AND v_reward.stock_available <= 0 THEN
    RETURN QUERY SELECT false, 'Recompensa esgotada', NULL::UUID;
    RETURN;
  END IF;
  
  -- Criar resgate
  INSERT INTO reward_redemptions (
    clinic_id, user_id, reward_id, xp_spent, status
  ) VALUES (
    v_clinic_id, p_user_id, p_reward_id, v_reward.xp_cost,
    CASE WHEN v_reward.requires_admin_approval THEN 'pending' ELSE 'approved' END
  ) RETURNING id INTO v_redemption_id;
  
  -- Deduzir XP (XP disponível para troca, não afeta nível)
  -- Nota: O nível é baseado em total_xp histórico, não no XP atual
  UPDATE user_progression
  SET updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Atualizar estoque
  IF v_reward.stock_available IS NOT NULL THEN
    UPDATE reward_catalog
    SET 
      stock_available = stock_available - 1,
      updated_at = NOW()
    WHERE id = p_reward_id;
  END IF;
  
  RETURN QUERY SELECT true, 
    CASE 
      WHEN v_reward.requires_admin_approval 
      THEN 'Resgate solicitado! Aguardando aprovação do gestor.'
      ELSE 'Resgate realizado com sucesso!'
    END,
    v_redemption_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. FUNÇÃO: APROVAR/REJEITAR RESGATE
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_reward_redemption(
  p_redemption_id UUID,
  p_admin_id UUID,
  p_approved BOOLEAN,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_redemption RECORD;
  v_is_admin BOOLEAN;
BEGIN
  -- Verificar se usuário é admin
  SELECT role = 'ADMIN' INTO v_is_admin
  FROM users WHERE id = p_admin_id;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar resgates';
  END IF;
  
  -- Buscar resgate
  SELECT * INTO v_redemption
  FROM reward_redemptions
  WHERE id = p_redemption_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Resgate não encontrado ou já processado';
  END IF;
  
  IF p_approved THEN
    -- Aprovar
    UPDATE reward_redemptions
    SET 
      status = 'approved',
      approved_by = p_admin_id,
      approved_at = NOW(),
      approval_notes = p_notes,
      updated_at = NOW()
    WHERE id = p_redemption_id;
    
    RETURN true;
  ELSE
    -- Rejeitar e devolver XP
    UPDATE reward_redemptions
    SET 
      status = 'cancelled',
      cancelled_at = NOW(),
      cancellation_reason = p_notes,
      updated_at = NOW()
    WHERE id = p_redemption_id;
    
    -- Devolver estoque
    UPDATE reward_catalog rc
    SET stock_available = stock_available + 1
    FROM reward_redemptions rr
    WHERE rc.id = rr.reward_id
    AND rr.id = p_redemption_id
    AND rc.stock_available IS NOT NULL;
    
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. FUNÇÃO: CALCULAR XP POR AÇÃO E ROLE
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_xp_for_action(
  p_user_id UUID,
  p_action_type TEXT,
  p_value NUMERIC DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
  v_role TEXT;
  v_xp INTEGER := 0;
BEGIN
  -- Buscar role do usuário
  SELECT role INTO v_role FROM users WHERE id = p_user_id;
  
  -- Calcular XP baseado em role e ação
  CASE v_role
    WHEN 'ADMIN' THEN
      v_xp := CASE p_action_type
        WHEN 'budget_approved_high_ticket' THEN 1000
        WHEN 'milestone_50k' THEN 5000
        WHEN 'margin_above_45' THEN 2000
        WHEN 'roi_above_300' THEN 1500
        ELSE 0
      END;
      
    WHEN 'RECEPTIONIST' THEN
      v_xp := CASE p_action_type
        WHEN 'lead_response_fast' THEN 50
        WHEN 'agenda_full' THEN 500
        WHEN 'zero_no_shows' THEN 300
        WHEN 'perfect_confirmations' THEN 400
        WHEN 'perfect_week' THEN 1000
        ELSE 0
      END;
      
    WHEN 'PROFESSIONAL' THEN
      v_xp := CASE p_action_type
        WHEN 'budget_converted' THEN 100 -- Por cada R$ 1.000
        WHEN 'budget_high_ticket' THEN 500
        WHEN 'reactivation_success' THEN 800
        WHEN 'upsell_hof_surgery' THEN 1200
        WHEN 'conversion_above_40' THEN 2000
        ELSE 0
      END;
      
    WHEN 'DENTIST' THEN
      v_xp := CASE p_action_type
        WHEN 'treatment_completed' THEN 200
        WHEN 'five_star_review' THEN 150
        WHEN 'perfect_records' THEN 500
        WHEN 'perfect_post_ops' THEN 400
        WHEN 'nps_above_90' THEN 1500
        ELSE 0
      END;
  END CASE;
  
  -- Aplicar multiplicador se houver valor financeiro
  IF p_value >= 20000 THEN
    v_xp := v_xp * 2;
  ELSIF p_value >= 10000 THEN
    v_xp := FLOOR(v_xp * 1.5);
  END IF;
  
  RETURN v_xp;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 7. FUNÇÃO: DISTRIBUIR MISSÕES SEMANAIS
-- ============================================================================

CREATE OR REPLACE FUNCTION distribute_weekly_missions()
RETURNS TABLE (
  missions_created INTEGER,
  users_processed INTEGER
) AS $$
DECLARE
  v_user RECORD;
  v_created_count INTEGER := 0;
  v_user_count INTEGER := 0;
BEGIN
  FOR v_user IN 
    SELECT id, role, clinic_id, name FROM users WHERE active = true
  LOOP
    v_user_count := v_user_count + 1;
    
    -- Criar missões baseadas no role
    IF v_user.role = 'ADMIN' THEN
      -- Missão 1: Visão de Águia High-Ticket
      INSERT INTO tactical_operations (
        clinic_id, assigned_to, type, title, description,
        xp_reward, priority, deadline, mission_type, metadata
      ) VALUES (
        v_user.clinic_id, v_user.id, 'milestone_conquest',
        '🎯 Visão de Águia High-Ticket',
        'Aprovar 2 orçamentos de Reabilitação (Lentes/Implantes/Cirurgia) acima de R$ 15.000',
        2500, 'high', NOW() + INTERVAL '7 days', 'weekly',
        jsonb_build_object(
          'role', 'admin',
          'target_count', 2,
          'min_value', 15000
        )
      );
      v_created_count := v_created_count + 1;
      
    ELSIF v_user.role = 'RECEPTIONIST' THEN
      -- Missão 1: Sentinela da Velocidade
      INSERT INTO tactical_operations (
        clinic_id, assigned_to, type, title, description,
        xp_reward, priority, deadline, mission_type, metadata
      ) VALUES (
        v_user.clinic_id, v_user.id, 'rescue_roi',
        '⚡ Sentinela da Velocidade',
        'Responder 100% dos novos leads em menos de 5 minutos',
        1000, 'high', NOW() + INTERVAL '7 days', 'weekly',
        jsonb_build_object(
          'role', 'secretary',
          'target_response_time', 300,
          'target_percentage', 100
        )
      );
      
      -- Missão 2: Agenda de Ferro
      INSERT INTO tactical_operations (
        clinic_id, assigned_to, type, title, description,
        xp_reward, priority, deadline, mission_type, metadata
      ) VALUES (
        v_user.clinic_id, v_user.id, 'base_protection',
        '🛡️ Agenda de Ferro',
        'Manter taxa de confirmação acima de 95% durante toda a semana',
        1500, 'high', NOW() + INTERVAL '7 days', 'weekly',
        jsonb_build_object(
          'role', 'secretary',
          'target_confirmation_rate', 95
        )
      );
      v_created_count := v_created_count + 2;
      
    ELSIF v_user.role = 'PROFESSIONAL' THEN
      -- Missão 1: Resgate de Ouro
      INSERT INTO tactical_operations (
        clinic_id, assigned_to, type, title, description,
        xp_reward, priority, deadline, mission_type, metadata
      ) VALUES (
        v_user.clinic_id, v_user.id, 'rescue_roi',
        '💰 Resgate de Ouro',
        'Reativar R$ 15.000 em orçamentos parados há mais de 30 dias',
        2000, 'high', NOW() + INTERVAL '7 days', 'weekly',
        jsonb_build_object(
          'role', 'crc',
          'target_value', 15000,
          'min_days_stopped', 30
        )
      );
      
      -- Missão 2: Mestre do Upsell
      INSERT INTO tactical_operations (
        clinic_id, assigned_to, type, title, description,
        xp_reward, priority, deadline, mission_type, metadata
      ) VALUES (
        v_user.clinic_id, v_user.id, 'ticket_expansion',
        '💎 Mestre do Upsell',
        'Converter 3 procedimentos de HOF em Reabilitação Oral ou Cirurgia Facial',
        1800, 'high', NOW() + INTERVAL '7 days', 'weekly',
        jsonb_build_object(
          'role', 'crc',
          'target_count', 3,
          'from_category', 'HOF',
          'to_category', ['Reabilitação', 'Cirurgia']
        )
      );
      v_created_count := v_created_count + 2;
      
    ELSIF v_user.role = 'DENTIST' THEN
      -- Missão 1: Excelência Clínica
      INSERT INTO tactical_operations (
        clinic_id, assigned_to, type, title, description,
        xp_reward, priority, deadline, mission_type, metadata
      ) VALUES (
        v_user.clinic_id, v_user.id, 'base_protection',
        '⭐ Excelência Clínica',
        'Concluir 5 tratamentos e registrar 100% das notas clínicas',
        1200, 'high', NOW() + INTERVAL '7 days', 'weekly',
        jsonb_build_object(
          'role', 'dentist',
          'target_treatments', 5,
          'target_records_percentage', 100
        )
      );
      
      -- Missão 2: Guardião do Pós-Op
      INSERT INTO tactical_operations (
        clinic_id, assigned_to, type, title, description,
        xp_reward, priority, deadline, mission_type, metadata
      ) VALUES (
        v_user.clinic_id, v_user.id, 'base_protection',
        '🩺 Guardião do Pós-Op',
        'Realizar 100% das chamadas de acompanhamento pós-operatório',
        1000, 'high', NOW() + INTERVAL '7 days', 'weekly',
        jsonb_build_object(
          'role', 'dentist',
          'target_post_ops_percentage', 100
        )
      );
      v_created_count := v_created_count + 2;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_created_count, v_user_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. VIEW: PAINEL DE LIDERANÇA
-- ============================================================================

CREATE OR REPLACE VIEW leaderboard_weekly AS
SELECT 
  u.id as user_id,
  u.name,
  u.role,
  u.clinic_id,
  up.current_level,
  up.total_xp,
  
  -- XP ganho esta semana
  COALESCE(SUM(tac.xp_reward) FILTER (
    WHERE tac.status = 'completed' 
    AND tac.completed_at >= date_trunc('week', NOW())
  ), 0) as xp_this_week,
  
  -- Missões completadas esta semana
  COUNT(tac.id) FILTER (
    WHERE tac.status = 'completed' 
    AND tac.completed_at >= date_trunc('week', NOW())
  ) as missions_completed_this_week,
  
  -- Missões ativas
  COUNT(tac.id) FILTER (
    WHERE tac.status = 'active'
  ) as active_missions,
  
  -- Receita gerada esta semana
  COALESCE(SUM(tac.financial_impact) FILTER (
    WHERE tac.status = 'completed' 
    AND tac.completed_at >= date_trunc('week', NOW())
  ), 0) as revenue_this_week,
  
  -- Ranking
  RANK() OVER (
    PARTITION BY u.clinic_id, u.role
    ORDER BY SUM(tac.xp_reward) FILTER (
      WHERE tac.status = 'completed' 
      AND tac.completed_at >= date_trunc('week', NOW())
    ) DESC NULLS LAST
  ) as rank_in_role

FROM users u
JOIN user_progression up ON up.user_id = u.id
LEFT JOIN tactical_operations tac ON tac.assigned_to = u.id
WHERE u.active = true
GROUP BY u.id, u.name, u.role, u.clinic_id, up.current_level, up.total_xp;

-- ============================================================================
-- 9. POPULAR CATÁLOGO DE RECOMPENSAS PADRÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION seed_default_rewards(p_clinic_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Bronze
  INSERT INTO reward_catalog (
    clinic_id, title, description, category, xp_cost,
    reward_type, monetary_value, requires_admin_approval
  ) VALUES
  (p_clinic_id, '☕ Voucher Café Premium', 'Vale para café e lanche em cafeteria parceira', 
   'bronze', 5000, 'voucher', 30, false),
  (p_clinic_id, '🏃 Saída Antecipada', 'Saia 1 hora mais cedo na sexta-feira', 
   'bronze', 5000, 'time_off', 0, true);
  v_count := v_count + 2;
  
  -- Prata
  INSERT INTO reward_catalog (
    clinic_id, title, description, category, xp_cost,
    reward_type, monetary_value, requires_admin_approval
  ) VALUES
  (p_clinic_id, '🍽️ Almoço de Equipe', 'Almoço especial para toda a equipe', 
   'silver', 15000, 'team_event', 500, true),
  (p_clinic_id, '🏆 Reconhecimento Público', 'Destaque no mural de conquistas', 
   'silver', 15000, 'recognition', 0, false);
  v_count := v_count + 2;
  
  -- Ouro
  INSERT INTO reward_catalog (
    clinic_id, title, description, category, xp_cost,
    reward_type, monetary_value, requires_admin_approval
  ) VALUES
  (p_clinic_id, '💰 Bônus em Dinheiro', 'Bônus de R$ 200 a R$ 500', 
   'gold', 25000, 'bonus', 350, true),
  (p_clinic_id, '🌴 Day-Off Remunerado', 'Um dia de folga extra remunerado', 
   'gold', 25000, 'time_off', 200, true);
  v_count := v_count + 2;
  
  -- Lendário
  INSERT INTO reward_catalog (
    clinic_id, title, description, category, xp_cost,
    reward_type, monetary_value, requires_admin_approval
  ) VALUES
  (p_clinic_id, '🎉 Jantar de Gala', 'Jantar especial para celebrar conquistas', 
   'legendary', 50000, 'team_event', 1500, true),
  (p_clinic_id, '✈️ Viagem de Incentivo', 'Viagem de fim de semana para a equipe', 
   'legendary', 50000, 'experience', 3000, true);
  v_count := v_count + 2;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE reward_catalog IS 'Catálogo de recompensas disponíveis para resgate com XP';
COMMENT ON TABLE reward_redemptions IS 'Histórico de resgates de recompensas pelos usuários';
COMMENT ON FUNCTION redeem_reward IS 'Permite usuário resgatar uma recompensa usando XP acumulado';
COMMENT ON FUNCTION approve_reward_redemption IS 'Permite admin aprovar ou rejeitar resgate de recompensa';
COMMENT ON FUNCTION calculate_xp_for_action IS 'Calcula XP baseado na ação e role do usuário';
COMMENT ON FUNCTION distribute_weekly_missions IS 'Distribui missões semanais automaticamente para todos os usuários ativos';
COMMENT ON VIEW leaderboard_weekly IS 'Painel de liderança semanal por role';

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
