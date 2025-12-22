-- =====================================================
-- FIX: Trigger de Aprovação de Orçamento
-- =====================================================
-- Corrige o trigger para incluir category e specialty
-- =====================================================

-- 1. Dropar o trigger e função existentes (com CASCADE)
DROP TRIGGER IF EXISTS auto_create_treatment_and_installments ON budgets;
DROP TRIGGER IF EXISTS trigger_budget_approval ON budgets;
DROP FUNCTION IF EXISTS process_budget_approval() CASCADE;

-- 2. Criar a função corrigida
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
    -- Só processar se o status mudou para APPROVED
    IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
        
        -- Obter patient_id do budget
        v_patient_id := NEW.patient_id;
        
        -- Obter configuração de pagamento
        v_installments_count := COALESCE((NEW.payment_config->>'installments_count')::INTEGER, 1);
        
        -- Criar treatment_items a partir dos budget_items
        FOR v_item IN 
            SELECT 
                bi.procedure_name,
                bi.region,
                bi.unit_value,
                bi.total_value,
                bi.procedure_id
            FROM budget_items bi
            WHERE bi.budget_id = NEW.id
        LOOP
            -- Buscar category e specialty do procedimento
            SELECT 
                COALESCE(p.category, 'CLINICA_GERAL') as category,
                p.specialty
            INTO v_procedure
            FROM procedure p
            WHERE p.id = v_item.procedure_id;
            
            -- Se não encontrou o procedimento, usar valores padrão
            IF v_procedure IS NULL THEN
                v_procedure.category := 'CLINICA_GERAL';
                v_procedure.specialty := NULL;
            END IF;
            
            -- Inserir treatment_item com category e specialty
            INSERT INTO treatment_items (
                id,
                patient_id,
                budget_id,
                procedure_name,
                region,
                status,
                doctor_id,
                unit_value,
                total_value,
                category,
                specialty,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                v_patient_id,
                NEW.id,
                v_item.procedure_name,
                v_item.region,
                'NOT_STARTED',
                NEW.doctor_id,
                v_item.unit_value,
                v_item.total_value,
                v_procedure.category,
                v_procedure.specialty,
                NOW(),
                NOW()
            );
        END LOOP;
        
        -- Criar installments
        v_installment_amount := NEW.final_value / v_installments_count;
        v_due_date := CURRENT_DATE;
        
        FOR i IN 1..v_installments_count LOOP
            INSERT INTO installments (
                id,
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
                gen_random_uuid(),
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
        
        RAISE NOTICE 'Budget % approved: Created % treatment items and % installments', 
            NEW.id, 
            (SELECT COUNT(*) FROM budget_items WHERE budget_id = NEW.id),
            v_installments_count;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar o trigger
CREATE TRIGGER auto_create_treatment_and_installments
    AFTER UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION process_budget_approval();

-- 4. Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Trigger corrigido com sucesso!';
    RAISE NOTICE 'Agora o trigger inclui category e specialty dos procedimentos.';
END $$;
