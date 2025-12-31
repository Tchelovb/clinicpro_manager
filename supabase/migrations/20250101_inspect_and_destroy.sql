-- ==============================================================================
-- INSPECT AND DESTROY: The Final Trigger Cleanse
-- ==============================================================================

-- 1. INSPECT: Raise noticeable logs about what exists
DO $$
DECLARE
    r RECORD;
    trigger_list TEXT := '';
BEGIN
    RAISE NOTICE '🔍 SEARCHING FOR TRIGGERS ON budgets...';
    
    FOR r IN (
        SELECT trigger_name, event_manipulation, user_defined_function_schema, user_defined_function_name
        FROM information_schema.triggers
        WHERE event_object_table = 'budgets'
        AND event_object_schema = 'public'
    ) LOOP
        trigger_list := trigger_list || ' | ' || r.trigger_name;
        RAISE NOTICE '⚠️ FOUND TRIGGER: % (Calls: %.%)', r.trigger_name, r.user_defined_function_schema, r.user_defined_function_name;
    END LOOP;
    
    IF trigger_list = '' THEN
        RAISE NOTICE '✅ NO TRIGGERS FOUND ON BUDGETS.';
    ELSE
        RAISE NOTICE '📋 TRIGGER LIST: %', trigger_list;
    END IF;
END $$;

-- 2. DESTROYER: Forcefully drop known offenders and dynamic clean
-- Even if dynamic failed before, we try specific drops first.

DROP TRIGGER IF EXISTS "update_procedure_cost" ON public.budgets CASCADE;
DROP TRIGGER IF EXISTS "update_stock" ON public.budgets CASCADE;
DROP TRIGGER IF EXISTS "calculate_commission" ON public.budgets CASCADE;
DROP TRIGGER IF EXISTS "check_goals_trigger" ON public.budgets CASCADE;
DROP TRIGGER IF EXISTS "update_patient_metrics" ON public.budgets CASCADE;
DROP TRIGGER IF EXISTS "update_metrics_trigger" ON public.budgets CASCADE;
DROP TRIGGER IF EXISTS "check_budget_goals" ON public.budgets CASCADE; -- Common name

-- Dynamic Drop All (Nuclear Option)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'budgets'
        AND event_object_schema = 'public'
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS "' || r.trigger_name || '" ON "public"."budgets" CASCADE';
        RAISE NOTICE '💥 DESTROYED TRIGGER: %', r.trigger_name;
    END LOOP;
END $$;

-- 3. REBIRTH: Reinstate ONLY the 2 essential triggers
-- A. MARGIN CHECK
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
  AFTER INSERT OR UPDATE OF final_value, discount_value
  ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_budget_margin();

-- B. AUTO APPROVAL
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
    IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
        
        -- Create Treatments
        FOR v_item IN SELECT * FROM budget_items WHERE budget_id = NEW.id LOOP
            SELECT category, specialty INTO v_procedure FROM procedure WHERE name = v_item.procedure_name LIMIT 1;
            
            IF NOT EXISTS (SELECT 1 FROM treatment_items WHERE budget_id = NEW.id AND procedure_name = v_item.procedure_name) THEN
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
        
        -- Create Installments
        v_installment_count := COALESCE(NEW.installments_count, 1);
        v_installment_amount := NEW.final_value / v_installment_count;
        v_due_date := CURRENT_DATE + INTERVAL '30 days';
        
        FOR v_i IN 1..v_installment_count LOOP
            IF NOT EXISTS (SELECT 1 FROM installments WHERE budget_id = NEW.id AND installment_number = v_i) THEN
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
    RAISE NOTICE '✅ MISSION COMPLETE: Budgets table sanitized.';
END $$;
