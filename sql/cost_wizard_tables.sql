-- =====================================================
-- COST WIZARD - ESTRUTURA DE CUSTOS DA CLÍNICA
-- =====================================================
-- Este arquivo cria a tabela clinic_cost_structure
-- necessária para o Profit Engine calcular margem de lucro
-- =====================================================

-- Tabela: clinic_cost_structure
-- Armazena a estrutura de custos calculada da clínica
CREATE TABLE IF NOT EXISTS clinic_cost_structure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    
    -- Custos Fixos Mensais
    fixed_costs DECIMAL(10,2) DEFAULT 0,          -- Aluguel, contas, etc
    prolabore DECIMAL(10,2) DEFAULT 0,            -- Pró-labore do dono
    
    -- Estrutura Operacional
    num_chairs INTEGER DEFAULT 1,                  -- Número de cadeiras
    hours_per_week DECIMAL(5,2) DEFAULT 40,       -- Horas de trabalho por semana
    efficiency_rate DECIMAL(5,2) DEFAULT 0.80,    -- Taxa de eficiência (0-1)
    
    -- Custos Calculados (gerados automaticamente)
    total_monthly_cost DECIMAL(10,2) DEFAULT 0,   -- Custo total mensal
    available_minutes_month INTEGER DEFAULT 0,     -- Minutos disponíveis por mês
    cost_per_minute DECIMAL(10,4) DEFAULT 0,      -- Custo por minuto (CHAVE!)
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(clinic_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clinic_cost_structure_clinic 
    ON clinic_cost_structure(clinic_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_clinic_cost_structure_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Calcular valores automaticamente
    NEW.total_monthly_cost = NEW.fixed_costs + NEW.prolabore;
    
    -- Calcular minutos disponíveis por mês
    -- (horas/semana * 4.33 semanas * 60 minutos * eficiência * num_chairs)
    NEW.available_minutes_month = ROUND(
        NEW.hours_per_week * 4.33 * 60 * NEW.efficiency_rate * NEW.num_chairs
    );
    
    -- Calcular custo por minuto
    IF NEW.available_minutes_month > 0 THEN
        NEW.cost_per_minute = NEW.total_monthly_cost / NEW.available_minutes_month;
    ELSE
        NEW.cost_per_minute = 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_clinic_cost_structure ON clinic_cost_structure;
CREATE TRIGGER trigger_update_clinic_cost_structure
    BEFORE INSERT OR UPDATE ON clinic_cost_structure
    FOR EACH ROW
    EXECUTE FUNCTION update_clinic_cost_structure_timestamp();

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL - COMENTADO)
-- =====================================================
-- Descomente para inserir dados de exemplo

/*
-- Inserir estrutura de custos padrão para uma clínica
INSERT INTO clinic_cost_structure (
    clinic_id,
    fixed_costs,
    prolabore,
    num_chairs,
    hours_per_week,
    efficiency_rate
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000', -- Substitua pelo ID da sua clínica
    10000.00,  -- R$ 10.000 de custos fixos
    10000.00,  -- R$ 10.000 de pró-labore
    1,         -- 1 cadeira
    40,        -- 40 horas/semana
    0.80       -- 80% de eficiência
)
ON CONFLICT (clinic_id) DO UPDATE SET
    fixed_costs = EXCLUDED.fixed_costs,
    prolabore = EXCLUDED.prolabore,
    num_chairs = EXCLUDED.num_chairs,
    hours_per_week = EXCLUDED.hours_per_week,
    efficiency_rate = EXCLUDED.efficiency_rate;
*/

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE clinic_cost_structure IS 'Estrutura de custos da clínica para cálculo de margem de lucro';
COMMENT ON COLUMN clinic_cost_structure.cost_per_minute IS 'Custo operacional por minuto - usado no Profit Engine';
COMMENT ON COLUMN clinic_cost_structure.efficiency_rate IS 'Taxa de eficiência (0.0 a 1.0) - quanto do tempo é produtivo';
COMMENT ON COLUMN clinic_cost_structure.available_minutes_month IS 'Minutos disponíveis por mês considerando eficiência';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Para verificar se a tabela foi criada:
-- SELECT * FROM clinic_cost_structure;

-- Para verificar o custo por minuto calculado:
-- SELECT clinic_id, cost_per_minute, total_monthly_cost, available_minutes_month 
-- FROM clinic_cost_structure;
