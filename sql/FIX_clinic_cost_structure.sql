-- =====================================================
-- FIX: CLINIC_COST_STRUCTURE - ADICIONAR COLUNAS FALTANTES
-- =====================================================
-- Este script adiciona apenas as colunas que estão faltando
-- sem quebrar se a tabela já existir
-- =====================================================

-- Adicionar coluna efficiency_rate se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinic_cost_structure' 
        AND column_name = 'efficiency_rate'
    ) THEN
        ALTER TABLE clinic_cost_structure 
        ADD COLUMN efficiency_rate DECIMAL(5,2) DEFAULT 0.80;
    END IF;
END $$;

-- Adicionar coluna num_chairs se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinic_cost_structure' 
        AND column_name = 'num_chairs'
    ) THEN
        ALTER TABLE clinic_cost_structure 
        ADD COLUMN num_chairs INTEGER DEFAULT 1;
    END IF;
END $$;

-- Adicionar coluna hours_per_week se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinic_cost_structure' 
        AND column_name = 'hours_per_week'
    ) THEN
        ALTER TABLE clinic_cost_structure 
        ADD COLUMN hours_per_week DECIMAL(5,2) DEFAULT 40;
    END IF;
END $$;

-- Adicionar coluna available_minutes_month se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinic_cost_structure' 
        AND column_name = 'available_minutes_month'
    ) THEN
        ALTER TABLE clinic_cost_structure 
        ADD COLUMN available_minutes_month INTEGER DEFAULT 0;
    END IF;
END $$;

-- Recriar trigger para cálculo automático
CREATE OR REPLACE FUNCTION update_clinic_cost_structure_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Calcular valores automaticamente
    NEW.total_monthly_cost = COALESCE(NEW.fixed_costs, 0) + COALESCE(NEW.prolabore, 0);
    
    -- Calcular minutos disponíveis por mês
    -- (horas/semana * 4.33 semanas * 60 minutos * eficiência * num_chairs)
    NEW.available_minutes_month = ROUND(
        COALESCE(NEW.hours_per_week, 40) * 4.33 * 60 * 
        COALESCE(NEW.efficiency_rate, 0.80) * 
        COALESCE(NEW.num_chairs, 1)
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

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_update_clinic_cost_structure ON clinic_cost_structure;
CREATE TRIGGER trigger_update_clinic_cost_structure
    BEFORE INSERT OR UPDATE ON clinic_cost_structure
    FOR EACH ROW
    EXECUTE FUNCTION update_clinic_cost_structure_timestamp();

-- =====================================================
-- ATUALIZAR REGISTROS EXISTENTES
-- =====================================================

-- Atualizar registros existentes para recalcular valores
UPDATE clinic_cost_structure
SET updated_at = NOW()
WHERE clinic_id IS NOT NULL;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 
    clinic_id,
    fixed_costs,
    prolabore,
    num_chairs,
    hours_per_week,
    efficiency_rate,
    cost_per_minute,
    available_minutes_month
FROM clinic_cost_structure;
