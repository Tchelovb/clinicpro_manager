-- =====================================================
-- AUTO BUDGET APPROVAL: Treatment Items & Installments
-- =====================================================
-- Este trigger cria automaticamente treatment_items e installments
-- quando um orçamento é aprovado (status = 'APPROVED')

-- 1. Função que será executada pelo trigger
CREATE OR REPLACE FUNCTION auto_create_treatment_and_installments()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_installment_amount NUMERIC;
    v_installment_count INTEGER;
    v_due_date DATE;
    v_i INTEGER;
BEGIN
    -- Só executa se o status mudou para APPROVED
    IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
        
        RAISE NOTICE '🎯 Budget approved! Creating treatment items and installments for budget %', NEW.id;
        
        -- ==========================================
        -- PARTE 1: Criar Treatment Items
        -- ==========================================
        FOR v_item IN 
            SELECT * FROM budget_items WHERE budget_id = NEW.id
        LOOP
            -- Verifica se já existe treatment_item para este budget_item
            IF NOT EXISTS (
                SELECT 1 FROM treatment_items 
                WHERE budget_id = NEW.id 
                AND procedure_name = v_item.procedure_name
                AND COALESCE(region, '') = COALESCE(v_item.region, '')
            ) THEN
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
                    NEW.patient_id,
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
                
                RAISE NOTICE '✅ Created treatment_item: % (Region: %)', v_item.procedure_name, v_item.region;
            END IF;
        END LOOP;
        
        -- ==========================================
        -- PARTE 2: Criar Installments (Parcelas)
        -- ==========================================
        
        -- Pega configuração de pagamento
        v_installment_count := COALESCE((NEW.payment_config->>'installments')::INTEGER, 1);
        
        -- Se não tem parcelas configuradas, usa installments_count
        IF v_installment_count IS NULL OR v_installment_count = 0 THEN
            v_installment_count := COALESCE(NEW.installments_count, 1);
        END IF;
        
        -- Calcula valor de cada parcela
        v_installment_amount := NEW.final_value / v_installment_count;
        
        -- Data de vencimento da primeira parcela (30 dias após aprovação)
        v_due_date := CURRENT_DATE + INTERVAL '30 days';
        
        RAISE NOTICE '💰 Creating % installments of R$ % each', v_installment_count, v_installment_amount;
        
        -- Cria as parcelas
        FOR v_i IN 1..v_installment_count LOOP
            -- Verifica se já existe parcela para este número
            IF NOT EXISTS (
                SELECT 1 FROM installments 
                WHERE budget_id = NEW.id 
                AND installment_number = v_i
            ) THEN
                INSERT INTO installments (
                    patient_id,
                    clinic_id,
                    budget_id,
                    installment_number,
                    total_installments,
                    amount,
                    due_date,
                    status,
                    payment_method,
                    created_at,
                    updated_at
                ) VALUES (
                    NEW.patient_id,
                    NEW.clinic_id,
                    NEW.id,
                    v_i,
                    v_installment_count,
                    v_installment_amount,
                    v_due_date + ((v_i - 1) * INTERVAL '30 days'),
                    'PENDING',
                    COALESCE((NEW.payment_config->>'method')::TEXT, 'Cartão'),
                    NOW(),
                    NOW()
                );
                
                RAISE NOTICE '✅ Created installment %/% - Due: % - Amount: R$ %', 
                    v_i, 
                    v_installment_count, 
                    v_due_date + ((v_i - 1) * INTERVAL '30 days'),
                    v_installment_amount;
            END IF;
        END LOOP;
        
        RAISE NOTICE '🎉 Auto-creation completed for budget %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar o trigger
DROP TRIGGER IF EXISTS trigger_auto_create_on_approval ON budgets;

CREATE TRIGGER trigger_auto_create_on_approval
    AFTER UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_treatment_and_installments();

-- 3. Comentário explicativo
COMMENT ON FUNCTION auto_create_treatment_and_installments() IS 
'Cria automaticamente treatment_items e installments quando um orçamento é aprovado';

-- =====================================================
-- TESTE (Opcional - Comentar após testar)
-- =====================================================
-- Para testar, aprove um orçamento existente:
-- UPDATE budgets SET status = 'APPROVED' WHERE id = 'SEU_BUDGET_ID_AQUI';

RAISE NOTICE '✅ Trigger auto_create_treatment_and_installments instalado com sucesso!';
