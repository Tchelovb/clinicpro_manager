-- Migration: Approve Budget and Generate Financials RPC
-- Date: 2026-01-01
-- Description: Creates a function to atomically approve a budget, create a sale, generate treatment items, and launch financials.

CREATE OR REPLACE FUNCTION public.approve_budget_and_generate_financials(
    p_budget_id UUID,
    p_patient_id UUID,
    p_status TEXT, -- 'APPROVED'
    p_payment_method TEXT,
    p_installments INTEGER,
    p_entry_value NUMERIC,
    p_first_due_date DATE,
    p_discount_percent NUMERIC,
    p_items JSONB -- Array of items to become treatment_items
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sale_id UUID;
    v_total_value NUMERIC;
    v_final_value NUMERIC;
    v_discount_value NUMERIC;
    v_item JSONB;
    v_installment_amount NUMERIC;
    v_current_due_date DATE;
    v_i INTEGER;
    v_clinic_id UUID;
    v_user_id UUID;
BEGIN
    -- Get Clinic ID and User ID (current session)
    v_user_id := auth.uid();
    SELECT clinic_id INTO v_clinic_id FROM public.users WHERE id = v_user_id;

    -- Calculate Totals from Budget (Security Check can be added here)
    SELECT total_value INTO v_total_value FROM public.budgets WHERE id = p_budget_id;
    
    v_discount_value := (v_total_value * p_discount_percent) / 100;
    v_final_value := v_total_value - v_discount_value;

    -- 1. Create Sale Record
    INSERT INTO public.sales (
        clinic_id,
        patient_id,
        budget_id,
        total_value,
        discount_value,
        final_value,
        created_by,
        payment_method,
        installments_count,
        status
    ) VALUES (
        v_clinic_id,
        p_patient_id,
        p_budget_id,
        v_total_value,
        v_discount_value,
        v_final_value,
        v_user_id,
        p_payment_method,
        p_installments,
        'COMPLETED'
    ) RETURNING id INTO v_sale_id;

    -- 2. Update Budget Status
    UPDATE public.budgets
    SET 
        status = 'APPROVED',
        chosen_payment_method = p_payment_method,
        chosen_installments = p_installments,
        discount_value = v_discount_value,
        final_value = v_final_value,
        first_due_date = p_first_due_date
    WHERE id = p_budget_id;

    -- 3. Create Treatment Items (Loop through p_items)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.treatment_items (
            clinic_id,
            patient_id,
            budget_id,
            procedure_name,
            region,
            face, -- If exists in item
            unit_value,
            total_value,
            status,
            category,
            sales_transaction_id, -- Link to Sale (using transaction_id column reuse or add sale_id to table if needed, reusing sales_transaction_id as placeholder or adding sale_id column. Note: schema has sales_transaction_id)
            budget_item_id -- Link back to budget item
        ) VALUES (
            v_clinic_id,
            p_patient_id,
            p_budget_id,
            v_item->>'name', -- Assuming item has name/procedure_name
            v_item->>'region',
            v_item->>'face',
            (v_item->>'unit_value')::numeric,
            (v_item->>'unit_value')::numeric, -- Quantity 1 assumption from 'Item Explosion'
            'NOT_STARTED',
            'CLINICA_GERAL', -- Default, can be improved
            NULL, -- Transaction ID linking (optional)
            (v_item->>'id')::uuid -- Link to original budget item
        );

        -- Mark Budget Item as Sold
        UPDATE public.budget_items
        SET is_sold = true, sold_at = now(), sale_id = v_sale_id
        WHERE id = (v_item->>'id')::uuid;
    END LOOP;

    -- 4. Generate Financials
    -- A. Entry Payment (Entrada) - Creates a Settled Transaction
    IF p_entry_value > 0 THEN
        INSERT INTO public.transactions (
            clinic_id,
            description,
            amount,
            type,
            category,
            date,
            payment_method,
            payment_status,
            sale_id,
            net_amount
        ) VALUES (
            v_clinic_id,
            'Entrada - Orçamento #' || substring(p_budget_id::text, 1, 8),
            p_entry_value,
            'INCOME',
            'Vendas',
            CURRENT_DATE,
            p_payment_method, -- Logic for entry method could be different, assuming same for simplicity or 'DINHEIRO'/'PIX' usually
            'Settled',
            v_sale_id,
            p_entry_value -- Deduct fees if applicable
        );
    END IF;

    -- B. Installments (Parcelas)
    IF p_installments > 0 THEN
        v_installment_amount := (v_final_value - p_entry_value) / p_installments;
        v_current_due_date := p_first_due_date;

        FOR v_i IN 1..p_installments LOOP
            INSERT INTO public.financial_installments (
                clinic_id,
                patient_id,
                description,
                due_date,
                amount,
                status,
                payment_method,
                installment_number,
                total_installments
            ) VALUES (
                v_clinic_id,
                p_patient_id,
                'Parcela ' || v_i || '/' || p_installments || ' - Orçamento #' || substring(p_budget_id::text, 1, 8),
                v_current_due_date,
                v_installment_amount,
                'PENDING',
                p_payment_method,
                v_i,
                p_installments
            );
            
            -- Increment Month (basic logic, date-fns in JS is better but SQL interval works)
            v_current_due_date := v_current_due_date + INTERVAL '1 month';
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'sale_id', v_sale_id,
        'message', 'Venda realizada com sucesso'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao processar venda: %', SQLERRM;
END;
$$;
