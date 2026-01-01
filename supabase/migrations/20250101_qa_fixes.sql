-- ==========================================
-- 1. AUTOMAÇÃO DE COMISSÕES (Livro Razão)
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_calculate_sale_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_commission_rate NUMERIC;
    v_doctor_id UUID;
    v_patient_name TEXT;
BEGIN
    -- Busca o doutor vinculado ao orçamento da venda
    SELECT doctor_id INTO v_doctor_id FROM public.budgets WHERE id = NEW.budget_id;
    
    -- Busca o nome do paciente para a descrição do lançamento
    SELECT name INTO v_patient_name FROM public.patients WHERE id = NEW.patient_id;
    
    -- Busca a % de comissão (Padrão 30% se não configurado)
    SELECT COALESCE(commission_percent, 30) INTO v_commission_rate 
    FROM public.professional_commissions 
    WHERE professional_id = v_doctor_id LIMIT 1;

    -- Insere o crédito no Ledger do profissional
    INSERT INTO public.professional_ledger (
        clinic_id,
        professional_id,
        amount,
        type,
        category,
        description,
        reference_id,
        reference_type,
        created_at
    ) VALUES (
        NEW.clinic_id,
        v_doctor_id,
        (NEW.final_value * (v_commission_rate / 100)),
        'CREDIT',
        'COMMISSION',
        'Comissão Venda #' || UPPER(SUBSTRING(NEW.id::text, 1, 8)) || ' - Paciente: ' || v_patient_name,
        NEW.id,
        'BUDGET',
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_after_sale_commission ON public.sales;
CREATE TRIGGER tr_after_sale_commission
AFTER INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.fn_calculate_sale_commission();

-- ==========================================
-- 2. BAIXA AUTOMÁTICA DE ESTOQUE
-- ==========================================
CREATE OR REPLACE FUNCTION public.fn_deduct_inventory_on_execution()
RETURNS TRIGGER AS $$
BEGIN
    -- Só age se o status mudou de qualquer coisa para 'COMPLETED'
    IF (NEW.status::text = 'COMPLETED' AND OLD.status::text != 'COMPLETED') THEN
        
        -- Deduz os itens baseados na 'receita' (recipe) do procedimento
        UPDATE public.inventory_items
        SET 
            current_stock = current_stock - r.quantity_needed,
            updated_at = NOW()
        FROM public.procedure_recipe_items r
        JOIN public.procedure_recipes pr ON r.recipe_id = pr.id
        WHERE pr.procedure_id = NEW.budget_item_id -- Vincula ao procedimento executado
          AND public.inventory_items.id = r.inventory_item_id;
          
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_deduct_stock_execution ON public.treatment_items;
CREATE TRIGGER tr_deduct_stock_execution
AFTER UPDATE ON public.treatment_items
FOR EACH ROW EXECUTE FUNCTION public.fn_deduct_inventory_on_execution();
