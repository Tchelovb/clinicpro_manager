-- ==============================================================================
-- FINAL REPAIR: Budget Margin Trigger (Remove total_costs dependency)
-- ==============================================================================
-- This script ensures no trigger on the 'budgets' table tries to access 
-- a non-existent 'total_costs' column.

-- 1. Redefine the calculation function safely
CREATE OR REPLACE FUNCTION calculate_budget_margin(
  p_budget_id UUID
) RETURNS NUMERIC AS $$
DECLARE
  v_total_price NUMERIC;
  v_total_cost NUMERIC;
  v_margin_percent NUMERIC;
  v_clinic_tax_rate NUMERIC;
  v_clinic_card_fee NUMERIC;
BEGIN
  -- Get clinic settings
  SELECT 
    COALESCE(c.tax_rate_percent, 0),
    COALESCE(c.avg_card_fee, 2.5)
  INTO v_clinic_tax_rate, v_clinic_card_fee
  FROM budgets b
  JOIN clinics c ON c.id = b.clinic_id
  WHERE b.id = p_budget_id;
  
  -- Get final value
  SELECT COALESCE(final_value, 0)
  INTO v_total_price
  FROM budgets
  WHERE id = p_budget_id;
  
  -- Calculate total costs from budget_items
  SELECT COALESCE(SUM(
    COALESCE(pc.total_cost, 0) * bi.quantity
  ), 0)
  INTO v_total_cost
  FROM budget_items bi
  LEFT JOIN procedure p ON p.id = bi.procedure_id
  LEFT JOIN procedure_costs pc ON pc.procedure_id = p.id
  WHERE bi.budget_id = p_budget_id;
  
  -- Calculate margin
  IF v_total_price > 0 THEN
    v_margin_percent := (
      (v_total_price - v_total_cost - (v_total_price * v_clinic_tax_rate / 100) - (v_total_price * v_clinic_card_fee / 100))
      / v_total_price
    ) * 100;
  ELSE
    v_margin_percent := 0;
  END IF;
  
  -- Update budget
  UPDATE budgets
  SET calculated_margin_percent = v_margin_percent
  WHERE id = p_budget_id;
  
  RETURN v_margin_percent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Redefine the trigger function (CRITICAL: Do not use NEW.total_costs)
CREATE OR REPLACE FUNCTION trigger_calculate_budget_margin()
RETURNS TRIGGER AS $$
BEGIN
  -- Perform calculation using the safe function
  PERFORM calculate_budget_margin(NEW.id);
  
  -- Set lock status based on margin
  -- We fetch it back or calculate locally if possible, but simplest is to check after update
  -- Wait, for AFTER triggers, NEW is read-only in some contexts? 
  -- This is meant to be an AFTER trigger so we should use a different approach for lock status
  -- Or handle lock status INSIDE calculate_budget_margin or in a separate BEFORE trigger.
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Cleanup existing triggers
DROP TRIGGER IF EXISTS trigger_budget_margin_check ON budgets;

-- 4. Create fresh safe trigger
CREATE TRIGGER trigger_budget_margin_check
  AFTER INSERT OR UPDATE OF final_value, discount
  ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_budget_margin();

-- 5. Additional check: margin_lock_status update
CREATE OR REPLACE FUNCTION trigger_budget_lock_check()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(NEW.calculated_margin_percent, 0) < 20 THEN
    NEW.margin_lock_status := 'LOCKED';
  ELSE
    NEW.margin_lock_status := 'UNLOCKED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_budget_lock_status ON budgets;
CREATE TRIGGER trigger_budget_lock_status
  BEFORE INSERT OR UPDATE OF calculated_margin_percent
  ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_budget_lock_check();
