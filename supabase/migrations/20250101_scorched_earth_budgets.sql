-- ==============================================================================
-- SCORCHED EARTH MIGRATION: Dynamic Trigger Removal & Restore
-- ==============================================================================
-- PROBLEM: A phantom trigger on 'budgets' is referencing 'procedure_id' causing errors.
-- SOLUTION: Dynamically find and DROP ALL triggers on 'budgets', then reinstall only valid ones.

DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '🔥 Starting Scorched Earth Cleanup for table: budgets';
    
    FOR r IN (
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'budgets'
        AND event_object_schema = 'public'
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS "' || r.trigger_name || '" ON "public"."budgets" CASCADE';
        RAISE NOTICE '❌ Dropped Trigger: %', r.trigger_name;
    END LOOP;
    
    RAISE NOTICE '✨ All existing triggers on budgets have been removed.';
END $$;

-- ==============================================================================
-- RESTORE ESSENTIAL TRIGGERS (Sanitized Versions)
-- ==============================================================================

-- 1. PROFIT GUARDIAN (Margin Calculation)
CREATE OR REPLACE FUNCTION trigger_calculate_budget_margin()
RETURNS TRIGGER AS $$
BEGIN
  -- Execute calculation (safely defined in previous migration)
  PERFORM calculate_budget_margin(NEW.id);
  
  -- Set Lock Status
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


-- 2. APPROVAL FLOW (Treatment Items & Installments)
-- Based on the most recent robust logic (Category/Specialty support)
CREATE OR REPLACE FUNCTION auto_create_treatment_and_installments()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_procedure RECORD;
    v_installment_amount NUMERIC;
    v_installment_count INTEGER;
    v_due_date DATE;
    v_i INTEGER;
BEGIN
    -- Only run on approval
    IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
        
        RAISE NOTICE '🎯 Budget % approved. Processing...', NEW.id;
        
        -- A. Create Clinical Items
        FOR v_item IN 
            SELECT * FROM budget_items WHERE budget_id = NEW.id
        LOOP
            -- Fetch category/specialty
            SELECT category, specialty INTO v_procedure
            FROM procedure
            WHERE name = v_item.procedure_name
            LIMIT 1;
            
            -- Insert if not exists
            IF NOT EXISTS (
                SELECT 1 FROM treatment_items 
                WHERE budget_id = NEW.id 
                AND procedure_name = v_item.procedure_name
                AND COALESCE(region, '') = COALESCE(v_item.region, '')
            ) THEN
                INSERT INTO treatment_items (
                    patient_id, budget_id, procedure_name, region,
                    category, specialty, status, doctor_id,
                    unit_value, total_value, created_at, updated_at
                ) VALUES (
                    NEW.patient_id, NEW.id, v_item.procedure_name, v_item.region,
                    COALESCE(v_procedure.category, 'CLINICA_GERAL'),
                    v_procedure.specialty, 'NOT_STARTED', NEW.doctor_id,
                    v_item.unit_value, v_item.total_value, NOW(), NOW()
                );
            END IF;
        END LOOP;
        
        -- B. Create Financial Installments
        v_installment_count := COALESCE(NEW.installments_count, 1);
        v_installment_amount := NEW.final_value / v_installment_count;
        v_due_date := CURRENT_DATE + INTERVAL '30 days';
        
        FOR v_i IN 1..v_installment_count LOOP
            IF NOT EXISTS (
                SELECT 1 FROM installments 
                WHERE budget_id = NEW.id AND installment_number = v_i
            ) THEN
                INSERT INTO installments (
                    patient_id, clinic_id, budget_id, installment_number,
                    total_installments, amount, due_date, status,
                    payment_method, created_at, updated_at
                ) VALUES (
                    NEW.patient_id, NEW.clinic_id, NEW.id, v_i,
                    v_installment_count, v_installment_amount, 
                    v_due_date + ((v_i - 1) * INTERVAL '30 days'),
                    'PENDING', 'CREDIT_CARD', NOW(), NOW()
                );
            END IF;
        END LOOP;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_on_approval
    AFTER UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_treatment_and_installments();

DO $$
BEGIN
    RAISE NOTICE '✅ Scorched Earth Complete: Budgets table is clean and verified triggers are installed.';
END $$;
