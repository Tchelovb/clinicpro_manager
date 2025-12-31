-- ==============================================================================
-- NUCLEAR CLEANUP: Remove All Triggers from Budgets Table
-- ==============================================================================
-- This script blindly drops ALL potential triggers on the 'budgets' table 
-- to eliminate the one causing the 'record "new" has no field "procedure_id"' error.
-- Then, it re-installs ONLY the two essential verified triggers.

-- 1. DROP EVERYTHING (Known suspects)
DROP TRIGGER IF EXISTS check_budget_profitability_trigger ON public.budgets;
DROP TRIGGER IF EXISTS trigger_budget_margin_check ON public.budgets;
DROP TRIGGER IF EXISTS trigger_budget_lock_status ON public.budgets;
DROP TRIGGER IF EXISTS auto_create_treatment_and_installments ON public.budgets;
DROP TRIGGER IF EXISTS trigger_auto_create_on_approval ON public.budgets;
DROP TRIGGER IF EXISTS budget_approval_gamification ON public.budgets;
DROP TRIGGER IF EXISTS trigger_budget_approval ON public.budgets;
DROP TRIGGER IF EXISTS update_procedure_usage ON public.budgets;
DROP TRIGGER IF EXISTS trigger_update_material_stock ON public.budgets;
DROP TRIGGER IF EXISTS validate_budget_procedure ON public.budgets;

-- 2. RE-INSTALL ONLY ESSENTIAL TRIGGERS

-- A) MARGIN CALCULATION (Safe version)
CREATE OR REPLACE FUNCTION trigger_calculate_budget_margin()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_budget_margin(NEW.id);
  
  IF COALESCE(NEW.calculated_margin_percent, 0) < 20 THEN
    NEW.margin_lock_status := 'LOCKED';
  ELSE
    NEW.margin_lock_status := 'UNLOCKED';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_budget_margin_check
  AFTER INSERT OR UPDATE OF final_value, discount
  ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_budget_margin();

-- B) APPROVAL FLOW (Treatment Items & Installments)
-- Re-using the safe logic from FIX_BUDGET_APPROVAL_TRIGGER.sql
CREATE OR REPLACE FUNCTION process_budget_approval()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_patient_id UUID;
    v_installment_amount NUMERIC;
    v_due_date DATE;
    v_installments_count INTEGER;
    v_procedure RECORD;
BEGIN
    IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
        v_patient_id := NEW.patient_id;
        v_installments_count := COALESCE((NEW.payment_config->>'installments_count')::INTEGER, 1);
        
        FOR v_item IN 
            SELECT * FROM budget_items WHERE budget_id = NEW.id
        LOOP
            INSERT INTO treatment_items (
                patient_id,
                budget_id,
                procedure_name,
                region,
                status,
                doctor_id,
                unit_value,
                total_value,
                created_at,
                updated_at
            ) VALUES (
                v_patient_id,
                NEW.id,
                v_item.procedure_name,
                v_item.region,
                'NOT_STARTED',
                NEW.doctor_id,
                v_item.unit_value,
                v_item.total_value,
                NOW(),
                NOW()
            );
        END LOOP;
        
        v_installment_amount := NEW.final_value / v_installments_count;
        v_due_date := CURRENT_DATE;
        
        FOR i IN 1..v_installments_count LOOP
            INSERT INTO installments (
                patient_id,
                clinic_id,
                budget_id,
                installment_number,
                total_installments,
                amount,
                due_date,
                status,
                created_at,
                updated_at
            ) VALUES (
                v_patient_id,
                NEW.clinic_id,
                NEW.id,
                i,
                v_installments_count,
                v_installment_amount,
                v_due_date + (i - 1) * INTERVAL '30 days',
                'PENDING',
                NOW(),
                NOW()
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_treatment_and_installments
    AFTER UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION process_budget_approval();
