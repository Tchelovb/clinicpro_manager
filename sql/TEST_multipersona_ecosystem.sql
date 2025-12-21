-- ============================================================================
-- SCRIPT DE TESTE - BOS 12.0 ECOSSISTEMA MULTIPERSONA
-- Execute este script completo no Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PASSO 1: CRIAR ESTRUTURAS
-- ============================================================================

-- Adicionar campos em tactical_operations
ALTER TABLE tactical_operations
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tactical_operations
ADD COLUMN IF NOT EXISTS mission_type text CHECK (mission_type IN ('daily', 'weekly', 'monthly', 'custom'));

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_tactical_operations_assigned ON tactical_operations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tactical_operations_mission_type ON tactical_operations(mission_type);

-- Criar tabela de recompensas
CREATE TABLE IF NOT EXISTS reward_catalog (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('bronze', 'silver', 'gold', 'legendary')),
  xp_cost integer NOT NULL CHECK (xp_cost > 0),
  role_restriction text[],
  stock_limit integer,
  stock_available integer,
  reward_type text NOT NULL CHECK (reward_type IN (
    'voucher', 'time_off', 'bonus', 'recognition', 
    'team_event', 'experience'
  )),
  monetary_value numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  requires_admin_approval boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reward_catalog_clinic ON reward_catalog(clinic_id);
CREATE INDEX IF NOT EXISTS idx_reward_catalog_category ON reward_catalog(category);

-- Criar tabela de resgates
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reward_id uuid REFERENCES reward_catalog(id) ON DELETE CASCADE,
  xp_spent integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'delivered', 'cancelled'
  )),
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_at timestamp,
  approval_notes text,
  delivered_at timestamp,
  delivery_notes text,
  cancelled_at timestamp,
  cancellation_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);

-- ============================================================================
-- PASSO 2: POPULAR RECOMPENSAS PADRÃO
-- ============================================================================

DO $$
DECLARE
  v_clinic_id UUID;
BEGIN
  -- Buscar o clinic_id do usuário logado
  SELECT clinic_id INTO v_clinic_id
  FROM users
  WHERE email = 'admin@clinicpro.com' -- Ajuste para seu email
  LIMIT 1;
  
  IF v_clinic_id IS NULL THEN
    RAISE NOTICE 'Nenhuma clínica encontrada. Ajuste o email no script.';
    RETURN;
  END IF;
  
  -- Limpar recompensas existentes (apenas para teste)
  DELETE FROM reward_catalog WHERE clinic_id = v_clinic_id;
  
  -- Bronze
  INSERT INTO reward_catalog (
    clinic_id, title, description, category, xp_cost,
    reward_type, monetary_value, requires_admin_approval
  ) VALUES
  (v_clinic_id, '☕ Voucher Café Premium', 'Vale para café e lanche em cafeteria parceira', 
   'bronze', 5000, 'voucher', 30, false),
  (v_clinic_id, '🏃 Saída Antecipada', 'Saia 1 hora mais cedo na sexta-feira', 
   'bronze', 5000, 'time_off', 0, true);
  
  -- Prata
  INSERT INTO reward_catalog (
    clinic_id, title, description, category, xp_cost,
    reward_type, monetary_value, requires_admin_approval
  ) VALUES
  (v_clinic_id, '🍽️ Almoço de Equipe', 'Almoço especial para toda a equipe', 
   'silver', 15000, 'team_event', 500, true),
  (v_clinic_id, '🏆 Reconhecimento Público', 'Destaque no mural de conquistas', 
   'silver', 15000, 'recognition', 0, false);
  
  -- Ouro
  INSERT INTO reward_catalog (
    clinic_id, title, description, category, xp_cost,
    reward_type, monetary_value, requires_admin_approval
  ) VALUES
  (v_clinic_id, '💰 Bônus em Dinheiro', 'Bônus de R$ 200 a R$ 500', 
   'gold', 25000, 'bonus', 350, true),
  (v_clinic_id, '🌴 Day-Off Remunerado', 'Um dia de folga extra remunerado', 
   'gold', 25000, 'time_off', 200, true);
  
  -- Lendário
  INSERT INTO reward_catalog (
    clinic_id, title, description, category, xp_cost,
    reward_type, monetary_value, requires_admin_approval
  ) VALUES
  (v_clinic_id, '🎉 Jantar de Gala', 'Jantar especial para celebrar conquistas', 
   'legendary', 50000, 'team_event', 1500, true),
  (v_clinic_id, '✈️ Viagem de Incentivo', 'Viagem de fim de semana para a equipe', 
   'legendary', 50000, 'experience', 3000, true);
  
  RAISE NOTICE '✅ 8 recompensas criadas com sucesso!';
END $$;

-- ============================================================================
-- PASSO 3: DISTRIBUIR MISSÕES DE TESTE
-- ============================================================================

DO $$
DECLARE
  v_user RECORD;
  v_created_count INTEGER := 0;
BEGIN
  -- Limpar missões semanais antigas (apenas para teste)
  DELETE FROM tactical_operations 
  WHERE mission_type = 'weekly' 
  AND created_at >= NOW() - INTERVAL '7 days';
  
  FOR v_user IN 
    SELECT id, role, clinic_id, name 
    FROM users 
    WHERE active = true
    LIMIT 10 -- Limitar para teste
  LOOP
    -- Criar missões baseadas no role
    IF v_user.role = 'ADMIN' THEN
      INSERT INTO tactical_operations (
        clinic_id, assigned_to, type, title, description,
        xp_reward, priority, deadline, mission_type, status, metadata
      ) VALUES (
        v_user.clinic_id, v_user.id, 'milestone_conquest',
        '🎯 Visão de Águia High-Ticket',
        'Aprovar 2 orçamentos de Reabilitação (Lentes/Implantes/Cirurgia) acima de R$ 15.000',
        2500, 'high', NOW() + INTERVAL '7 days', 'weekly', 'active',
        jsonb_build_object('role', 'admin', 'target_count', 2, 'min_value', 15000)
      );
      v_created_count := v_created_count + 1;
      
    ELSIF v_user.role = 'RECEPTIONIST' THEN
      INSERT INTO tactical_operations (
        clinic_id, assigned_to, type, title, description,
        xp_reward, priority, deadline, mission_type, status, metadata
      ) VALUES (
        v_user.clinic_id, v_user.id, 'rescue_roi',
        '⚡ Sentinela da Velocidade',
        'Responder 100% dos novos leads em menos de 5 minutos',
        1000, 'high', NOW() + INTERVAL '7 days', 'weekly', 'active',
        jsonb_build_object('role', 'secretary', 'target_response_time', 300)
      ),
      (
        v_user.clinic_id, v_user.id, 'base_protection',
        '🛡️ Agenda de Ferro',
        'Manter taxa de confirmação acima de 95% durante toda a semana',
        1500, 'high', NOW() + INTERVAL '7 days', 'weekly', 'active',
        jsonb_build_object('role', 'secretary', 'target_confirmation_rate', 95)
      );
      v_created_count := v_created_count + 2;
      
    ELSIF v_user.role = 'PROFESSIONAL' THEN
      INSERT INTO tactical_operations (
        clinic_id, assigned_to, type, title, description,
        xp_reward, priority, deadline, mission_type, status, metadata
      ) VALUES (
        v_user.clinic_id, v_user.id, 'rescue_roi',
        '💰 Resgate de Ouro',
        'Reativar R$ 15.000 em orçamentos parados há mais de 30 dias',
        2000, 'high', NOW() + INTERVAL '7 days', 'weekly', 'active',
        jsonb_build_object('role', 'crc', 'target_value', 15000)
      ),
      (
        v_user.clinic_id, v_user.id, 'ticket_expansion',
        '💎 Mestre do Upsell',
        'Converter 3 procedimentos de HOF em Reabilitação Oral ou Cirurgia Facial',
        1800, 'high', NOW() + INTERVAL '7 days', 'weekly', 'active',
        jsonb_build_object('role', 'crc', 'target_count', 3)
      );
      v_created_count := v_created_count + 2;
      
    ELSIF v_user.role = 'DENTIST' THEN
      INSERT INTO tactical_operations (
        clinic_id, assigned_to, type, title, description,
        xp_reward, priority, deadline, mission_type, status, metadata
      ) VALUES (
        v_user.clinic_id, v_user.id, 'base_protection',
        '⭐ Excelência Clínica',
        'Concluir 5 tratamentos e registrar 100% das notas clínicas',
        1200, 'high', NOW() + INTERVAL '7 days', 'weekly', 'active',
        jsonb_build_object('role', 'dentist', 'target_treatments', 5)
      ),
      (
        v_user.clinic_id, v_user.id, 'base_protection',
        '🩺 Guardião do Pós-Op',
        'Realizar 100% das chamadas de acompanhamento pós-operatório',
        1000, 'high', NOW() + INTERVAL '7 days', 'weekly', 'active',
        jsonb_build_object('role', 'dentist', 'target_post_ops_percentage', 100)
      );
      v_created_count := v_created_count + 2;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ % missões semanais criadas!', v_created_count;
END $$;

-- ============================================================================
-- PASSO 4: VERIFICAR RESULTADOS
-- ============================================================================

-- Ver recompensas criadas
SELECT 
  category,
  title,
  xp_cost,
  reward_type,
  monetary_value,
  requires_admin_approval
FROM reward_catalog
ORDER BY 
  CASE category
    WHEN 'bronze' THEN 1
    WHEN 'silver' THEN 2
    WHEN 'gold' THEN 3
    WHEN 'legendary' THEN 4
  END,
  xp_cost;

-- Ver missões criadas por role
SELECT 
  u.name as usuario,
  u.role,
  tac.title as missao,
  tac.xp_reward as xp,
  tac.priority as prioridade,
  tac.deadline as prazo
FROM tactical_operations tac
JOIN users u ON u.id = tac.assigned_to
WHERE tac.mission_type = 'weekly'
AND tac.status = 'active'
ORDER BY u.role, tac.xp_reward DESC;

-- Ver estatísticas
SELECT 
  u.role,
  COUNT(DISTINCT u.id) as usuarios,
  COUNT(tac.id) as missoes_criadas,
  SUM(tac.xp_reward) as xp_total_disponivel
FROM users u
LEFT JOIN tactical_operations tac ON tac.assigned_to = u.id AND tac.mission_type = 'weekly'
WHERE u.active = true
GROUP BY u.role
ORDER BY u.role;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================

/*
RECOMPENSAS CRIADAS:
- 2 Bronze (5.000 XP cada)
- 2 Prata (15.000 XP cada)
- 2 Ouro (25.000 XP cada)
- 2 Lendário (50.000 XP cada)

MISSÕES CRIADAS (por role):
- ADMIN: 1 missão (2.500 XP)
- RECEPTIONIST: 2 missões (2.500 XP total)
- MANAGER: 2 missões (3.800 XP total)
- DENTIST: 2 missões (2.200 XP total)

PRÓXIMO PASSO:
- Acessar o frontend e ver as missões no Intelligence Gateway
- Completar uma missão para ganhar XP
- Resgatar uma recompensa quando atingir o XP necessário
*/

-- ============================================================================
-- COMANDOS ÚTEIS
-- ============================================================================

-- Ver todas as recompensas disponíveis
-- SELECT * FROM reward_catalog WHERE is_active = true;

-- Ver minhas missões ativas
-- SELECT * FROM tactical_operations 
-- WHERE assigned_to = 'seu-user-id' AND status = 'active';

-- Resgatar uma recompensa (exemplo)
-- SELECT * FROM redeem_reward('seu-user-id', 'reward-id');

-- Ver painel de liderança
-- SELECT * FROM leaderboard_weekly WHERE clinic_id = 'seu-clinic-id';
