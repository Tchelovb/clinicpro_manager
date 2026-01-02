-- COMPREHENSIVE FIX for "record new has no field procedure_id"
-- This script drops and recreates all triggers involved in the sales process
-- to ensure no stale code is referencing non-existent columns.

-- 1. FIX INVENTORY DEDUCTION TRIGGER (Most likely culprit)
DROP TRIGGER IF EXISTS tr_deduct_stock_execution ON public.treatment_items;
DROP FUNCTION IF EXISTS public.fn_deduct_inventory_on_execution();

CREATE OR REPLACE FUNCTION public.fn_deduct_inventory_on_execution()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run if status changed to COMPLETED
    IF (NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED')) THEN
        -- Deduct stock based on recipe
        UPDATE public.inventory_items
        SET 
            current_stock = current_stock - r.quantity_needed,
            updated_at = NOW()
        FROM public.procedure_recipe_items r
        JOIN public.procedure_recipes pr ON r.recipe_id = pr.id
        WHERE pr.procedure_id = (SELECT procedure_id FROM public.budget_items WHERE id = NEW.budget_item_id) -- Correctly resolve procedure_id
          AND public.inventory_items.id = r.inventory_item_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger strictly as AFTER UPDATE (process_sale_transaction does INSERT, so this won't fire)
CREATE TRIGGER tr_deduct_stock_execution
AFTER UPDATE ON public.treatment_items
FOR EACH ROW EXECUTE FUNCTION public.fn_deduct_inventory_on_execution();


-- 2. FIX SALES COMMISSION TRIGGER (Confirmed safe but preventing regression)
DROP TRIGGER IF EXISTS tr_after_sale_commission ON public.sales;
DROP FUNCTION IF EXISTS public.fn_calculate_sale_commission();

CREATE OR REPLACE FUNCTION public.fn_calculate_sale_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_commission_rate NUMERIC;
    v_user_doctor_id UUID;
    v_professional_id UUID;
    v_patient_name TEXT;
BEGIN
    SELECT doctor_id INTO v_user_doctor_id FROM public.budgets WHERE id = NEW.budget_id;
    
    IF v_user_doctor_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT professional_id INTO v_professional_id FROM public.users WHERE id = v_user_doctor_id;

    IF v_professional_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    SELECT name INTO v_patient_name FROM public.patients WHERE id = NEW.patient_id;
    
    SELECT commission_percent INTO v_commission_rate 
    FROM public.professional_commissions 
    WHERE professional_id = v_professional_id LIMIT 1;

    IF v_commission_rate IS NULL THEN
        v_commission_rate := 30;
    END IF;

    INSERT INTO public.professional_ledger (
        clinic_id,
        professional_id,
        amount,
        type,
        entry_type,
        category,
        description,
        reference_id,
        reference_type,
        created_at,
        created_by
    ) VALUES (
        NEW.clinic_id,
        v_professional_id,
        (COALESCE(NEW.final_value, 0) * (v_commission_rate / 100)),
        'CREDIT',
        'CREDIT',
        'COMMISSION',
        'Comissão Venda #' || UPPER(SUBSTRING(NEW.id::text, 1, 8)) || ' - Paciente: ' || COALESCE(v_patient_name, 'Desconhecido'),
        NEW.id,
        'BUDGET',
        NOW(),
        NEW.created_by
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_after_sale_commission
AFTER INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.fn_calculate_sale_commission();


-- 3. FIX BUDGET PROFITABILITY TRIGGER (Another potential culprit)
DROP TRIGGER IF EXISTS calculate_budget_margin_trigger ON public.budgets;
DROP TRIGGER IF EXISTS trigger_budget_margin_check ON public.budgets; -- From 20251226130000
DROP TRIGGER IF EXISTS check_budget_profitability_trigger ON public.budgets; -- From older migrations

DROP FUNCTION IF EXISTS public.calculate_budget_margin();
DROP FUNCTION IF EXISTS public.calculate_budget_margin(uuid); -- Variant with parameter
DROP FUNCTION IF EXISTS public.trigger_calculate_budget_margin(); -- Variant from 20251226130000

CREATE OR REPLACE FUNCTION public.calculate_budget_margin()
RETURNS TRIGGER AS $$
DECLARE
    v_total_costs NUMERIC := 0;
    v_current_margin NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN bi.procedure_id IS NOT NULL THEN
                COALESCE(pc.total_cost, 0) * bi.quantity
            ELSE 
                0
        END
    ), 0)
    INTO v_total_costs
    FROM budget_items bi
    LEFT JOIN procedure_costs pc ON pc.procedure_id = bi.procedure_id
    WHERE bi.budget_id = NEW.id;

    IF NEW.total_value > 0 THEN
        v_current_margin := ((NEW.total_value - v_total_costs) / NEW.total_value) * 100;
    ELSE
        v_current_margin := 0;
    END IF;

    NEW.calculated_margin_percent := v_current_margin;

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

CREATE TRIGGER calculate_budget_margin_trigger
    BEFORE INSERT OR UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_budget_margin();
