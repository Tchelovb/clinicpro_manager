-- Migration: Fix Budget Profitability Trigger Error
-- Date: 2025-12-31
-- Purpose: Remove obsolete trigger that references non-existent total_costs column
-- Error: record "new" has no field "total_costs"

-- 1. Drop the problematic trigger
DROP TRIGGER IF EXISTS check_budget_profitability_trigger ON public.budgets;

-- 2. Drop the function that references the non-existent column
DROP FUNCTION IF EXISTS check_budget_profitability() CASCADE;

-- 3. Create a new, corrected version that calculates margin from budget_items
CREATE OR REPLACE FUNCTION calculate_budget_margin()
RETURNS TRIGGER AS $$
DECLARE
    v_total_costs NUMERIC := 0;
    v_current_margin NUMERIC := 0;
BEGIN
    -- Calculate total costs from budget_items
    SELECT COALESCE(SUM(
        CASE 
            WHEN bi.procedure_id IS NOT NULL THEN
                -- Get procedure cost if available
                COALESCE(pc.total_cost, 0) * bi.quantity
            ELSE 
                0
        END
    ), 0)
    INTO v_total_costs
    FROM budget_items bi
    LEFT JOIN procedure_costs pc ON pc.procedure_id = bi.procedure_id
    WHERE bi.budget_id = NEW.id;

    -- Calculate margin percentage
    IF NEW.total_value > 0 THEN
        v_current_margin := ((NEW.total_value - v_total_costs) / NEW.total_value) * 100;
    ELSE
        v_current_margin := 0;
    END IF;

    -- Update calculated margin
    NEW.calculated_margin_percent := v_current_margin;

    -- Set margin status based on clinic's target
    IF v_current_margin >= 30 THEN
        NEW.margin_status := 'SAFE';
    ELSIF v_current_margin >= 20 THEN
        NEW.margin_status := 'WARNING';
    ELSE
        NEW.margin_status := 'CRITICAL';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create the new trigger
CREATE TRIGGER calculate_budget_margin_trigger
    BEFORE INSERT OR UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION calculate_budget_margin();

-- 5. Log the fix
COMMENT ON FUNCTION calculate_budget_margin() IS 
'Calculates budget margin from budget_items and procedure_costs, replacing obsolete total_costs column reference';
