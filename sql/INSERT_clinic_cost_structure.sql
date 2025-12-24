-- =====================================================
-- INSERIR DADOS INICIAIS - CLINIC_COST_STRUCTURE
-- =====================================================
-- Execute este SQL para popular a tabela com dados iniciais
-- =====================================================

-- Inserir estrutura de custos para a clínica
INSERT INTO clinic_cost_structure (
    clinic_id,
    fixed_costs_monthly,
    desired_prolabore,
    productive_chairs,
    weekly_hours,
    efficiency_rate
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000', -- Seu clinic_id
    10000.00,  -- R$ 10.000 custos fixos mensais
    10000.00,  -- R$ 10.000 pró-labore
    1,         -- 1 cadeira produtiva
    40,        -- 40 horas/semana
    0.80       -- 80% de eficiência
)
ON CONFLICT (clinic_id) DO UPDATE SET
    fixed_costs_monthly = EXCLUDED.fixed_costs_monthly,
    desired_prolabore = EXCLUDED.desired_prolabore,
    productive_chairs = EXCLUDED.productive_chairs,
    weekly_hours = EXCLUDED.weekly_hours,
    efficiency_rate = EXCLUDED.efficiency_rate;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Ver resultado
SELECT 
    clinic_id,
    fixed_costs_monthly,
    desired_prolabore,
    productive_chairs,
    weekly_hours,
    efficiency_rate,
    cost_per_minute,
    available_minutes_month,
    (fixed_costs_monthly + desired_prolabore) as total_monthly_cost
FROM clinic_cost_structure;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- cost_per_minute ≈ R$ 2,08/min
-- available_minutes_month ≈ 9.600 minutos
-- total_monthly_cost = R$ 20.000,00
-- =====================================================
