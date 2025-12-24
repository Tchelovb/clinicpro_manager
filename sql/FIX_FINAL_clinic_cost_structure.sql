-- =====================================================
-- FIX FINAL - BASEADO NO SCHEMA REAL
-- =====================================================
-- Este script corrige apenas o que realmente falta
-- =====================================================

-- 1. Adicionar colunas faltantes em clinic_cost_structure
DO $$ 
BEGIN
    -- Adicionar efficiency_rate (não existe no schema)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinic_cost_structure' 
        AND column_name = 'efficiency_rate'
    ) THEN
        ALTER TABLE clinic_cost_structure 
        ADD COLUMN efficiency_rate DECIMAL(5,2) DEFAULT 0.80;
    END IF;

    -- Adicionar available_minutes_month (não existe no schema)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinic_cost_structure' 
        AND column_name = 'available_minutes_month'
    ) THEN
        ALTER TABLE clinic_cost_structure 
        ADD COLUMN available_minutes_month INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Recriar trigger para usar colunas corretas do schema
CREATE OR REPLACE FUNCTION update_clinic_cost_structure_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Calcular minutos disponíveis por mês usando colunas do schema real
    -- productive_chairs * weekly_hours * 4.33 semanas * 60 min * efficiency_rate
    NEW.available_minutes_month = ROUND(
        COALESCE(NEW.productive_chairs, 1) * 
        COALESCE(NEW.weekly_hours, 40) * 
        4.33 * 60 * 
        COALESCE(NEW.efficiency_rate, 0.80)
    );
    
    -- Recalcular cost_per_minute usando colunas do schema real
    IF NEW.available_minutes_month > 0 THEN
        NEW.cost_per_minute = (
            COALESCE(NEW.fixed_costs_monthly, 0) + 
            COALESCE(NEW.desired_prolabore, 0)
        ) / NEW.available_minutes_month;
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

-- 3. Atualizar registros existentes para recalcular
UPDATE clinic_cost_structure
SET updated_at = NOW()
WHERE clinic_id IS NOT NULL;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 
    clinic_id,
    fixed_costs_monthly,
    desired_prolabore,
    productive_chairs,
    weekly_hours,
    efficiency_rate,
    cost_per_minute,
    available_minutes_month
FROM clinic_cost_structure;
