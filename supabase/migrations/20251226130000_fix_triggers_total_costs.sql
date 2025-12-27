-- ==============================================================================
-- FIX: Repair Budget Margin Trigger (Undefined Column total_costs)
-- ==============================================================================
-- This migration fixes the "record 'new' has no field 'total_costs'" error
-- by redefining the margin calculation function with correct column names.

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
  -- Buscar configurações da clínica
  SELECT 
    COALESCE(c.tax_rate_percent, 0),
    COALESCE(c.avg_card_fee, 2.5)
  INTO v_clinic_tax_rate, v_clinic_card_fee
  FROM budgets b
  JOIN clinics c ON c.id = b.clinic_id
  WHERE b.id = p_budget_id;
  
  -- Calcular preço total
  SELECT COALESCE(final_value, 0)
  INTO v_total_price
  FROM budgets
  WHERE id = p_budget_id;
  
  -- Calcular custo total (soma dos custos dos procedimentos)
  -- FIX: Ensure we use the correct column names from procedure_costs
  SELECT COALESCE(SUM(
    COALESCE(pc.total_cost, 0) * bi.quantity
  ), 0)
  INTO v_total_cost
  FROM budget_items bi
  LEFT JOIN procedure p ON p.id = bi.procedure_id
  LEFT JOIN procedure_costs pc ON pc.procedure_id = p.id
  WHERE bi.budget_id = p_budget_id;
  
  -- Calcular margem: (Preço - Custo - Impostos - Taxas) / Preço * 100
  IF v_total_price > 0 THEN
    v_margin_percent := (
      (v_total_price - v_total_cost - (v_total_price * v_clinic_tax_rate / 100) - (v_total_price * v_clinic_card_fee / 100))
      / v_total_price
    ) * 100;
  ELSE
    v_margin_percent := 0;
  END IF;
  
  -- Atualizar budget
  UPDATE budgets
  SET calculated_margin_percent = v_margin_percent
  WHERE id = p_budget_id;
  
  RETURN v_margin_percent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Redefine the Trigger Function to be safe
CREATE OR REPLACE FUNCTION trigger_calculate_budget_margin()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular margem (Just call the function)
  PERFORM calculate_budget_margin(NEW.id);
  
  -- Verificar se precisa bloquear (Protocolo S16)
  -- Use COALESCE to avoid null comparison errors
  IF COALESCE(NEW.calculated_margin_percent, 0) < 20 THEN
    NEW.margin_lock_status := 'LOCKED';
  ELSE
    NEW.margin_lock_status := 'UNLOCKED';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the Trigger
DROP TRIGGER IF EXISTS trigger_budget_margin_check ON budgets;
CREATE TRIGGER trigger_budget_margin_check
  AFTER INSERT OR UPDATE OF final_value, discount
  ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_budget_margin();
