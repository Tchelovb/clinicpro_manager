-- =====================================================
-- EXECUTAR ESTE ARQUIVO COMPLETO NO SUPABASE
-- =====================================================

-- 1. REMOVER FUNÇÕES ANTIGAS
DROP FUNCTION IF EXISTS process_budget_approval() CASCADE;
DROP FUNCTION IF EXISTS process_approved_budgets_retroactive() CASCADE;
DROP FUNCTION IF EXISTS update_patient_balance_on_payment() CASCADE;

-- 2. CRIAR TABELA DE PARCELAS (se não existir)
CREATE TABLE IF NOT EXISTS installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
    installment_number INT NOT NULL,
    total_installments INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status TEXT NOT NULL DEFAULT 'PENDING',
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installments_patient ON installments(patient_id);
CREATE INDEX IF NOT EXISTS idx_installments_clinic ON installments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);

-- 3. FUNÇÃO PRINCIPAL: Processar Aprovação de Orçamento
CREATE OR REPLACE FUNCTION process_budget_approval()
RETURNS TRIGGER AS $$
DECLARE
    v_patient_id UUID;
    v_clinic_id UUID;
    v_budget_value DECIMAL(10,2);
    v_installments INT;
    v_installment_value DECIMAL(10,2);
    v_item RECORD;
BEGIN
    IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
        
        v_patient_id := NEW.patient_id;
        v_clinic_id := NEW.clinic_id;
        v_budget_value := NEW.final_value;
        v_installments := COALESCE(NEW.installments_count, 1);
        v_installment_value := v_budget_value / v_installments;
        
        -- CRIAR TRATAMENTOS (treatment_items)
        FOR v_item IN 
            SELECT bi.* FROM budget_items bi WHERE bi.budget_id = NEW.id
        LOOP
            INSERT INTO treatment_items (
                id, patient_id, budget_id, procedure_name, region, status, 
                doctor_id, unit_value, total_value, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), v_patient_id, NEW.id, v_item.procedure_name,
                v_item.region, 'NOT_STARTED', NEW.doctor_id, v_item.unit_value,
                v_item.total_value, NOW(), NOW()
            );
        END LOOP;
        
        -- GERAR PARCELAS
        FOR i IN 1..v_installments LOOP
            INSERT INTO installments (
                id, patient_id, clinic_id, budget_id, installment_number,
                total_installments, amount, due_date, status, payment_method,
                created_at, updated_at
            ) VALUES (
                gen_random_uuid(), v_patient_id, v_clinic_id, NEW.id, i,
                v_installments, v_installment_value, CURRENT_DATE + (i * 30),
                'PENDING', 'CREDIT_CARD', NOW(), NOW()
            );
        END LOOP;
        
        -- ATUALIZAR PACIENTE
        UPDATE patients
        SET 
            total_approved = COALESCE(total_approved, 0) + v_budget_value,
            balance_due = COALESCE(balance_due, 0) + v_budget_value,
            updated_at = NOW()
        WHERE id = v_patient_id;
        
        RAISE NOTICE 'Orçamento % aprovado: % tratamentos e % parcelas criadas', 
            NEW.id, (SELECT COUNT(*) FROM budget_items WHERE budget_id = NEW.id), v_installments;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CRIAR TRIGGER
DROP TRIGGER IF EXISTS trigger_budget_approval ON budgets;
CREATE TRIGGER trigger_budget_approval
    AFTER INSERT OR UPDATE OF status ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION process_budget_approval();

-- 5. FUNÇÃO PARA ATUALIZAR SALDO AO PAGAR
CREATE OR REPLACE FUNCTION update_patient_balance_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'PAID' AND (OLD.status IS NULL OR OLD.status != 'PAID') THEN
        UPDATE patients
        SET 
            total_paid = COALESCE(total_paid, 0) + NEW.amount,
            balance_due = COALESCE(balance_due, 0) - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.patient_id;
        
        NEW.paid_date := CURRENT_DATE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_payment_update ON installments;
CREATE TRIGGER trigger_payment_update
    BEFORE UPDATE OF status ON installments
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_balance_on_payment();

-- 6. FUNÇÃO RETROATIVA
CREATE OR REPLACE FUNCTION process_approved_budgets_retroactive()
RETURNS TABLE(budget_id UUID, treatments_created INT, installments_created INT) AS $$
DECLARE
    v_budget RECORD;
    v_treatments_count INT;
    v_installments_count INT;
BEGIN
    FOR v_budget IN 
        SELECT b.* FROM budgets b
        WHERE b.status = 'APPROVED' 
        AND b.id NOT IN (SELECT DISTINCT i.budget_id FROM installments i WHERE i.budget_id IS NOT NULL)
    LOOP
        DECLARE
            v_patient_id UUID;
            v_clinic_id UUID;
            v_budget_value DECIMAL(10,2);
            v_installments INT;
            v_installment_value DECIMAL(10,2);
            v_item RECORD;
        BEGIN
            v_patient_id := v_budget.patient_id;
            v_clinic_id := v_budget.clinic_id;
            v_budget_value := v_budget.final_value;
            v_installments := COALESCE(v_budget.installments_count, 1);
            v_installment_value := v_budget_value / v_installments;
            
            -- CRIAR TRATAMENTOS
            FOR v_item IN SELECT bi.* FROM budget_items bi WHERE bi.budget_id = v_budget.id
            LOOP
                INSERT INTO treatment_items (
                    id, patient_id, budget_id, procedure_name, region, status,
                    doctor_id, unit_value, total_value, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), v_patient_id, v_budget.id, v_item.procedure_name,
                    v_item.region, 'NOT_STARTED', v_budget.doctor_id, v_item.unit_value,
                    v_item.total_value, NOW(), NOW()
                );
            END LOOP;
            
            -- GERAR PARCELAS
            FOR i IN 1..v_installments LOOP
                INSERT INTO installments (
                    id, patient_id, clinic_id, budget_id, installment_number,
                    total_installments, amount, due_date, status, payment_method,
                    created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), v_patient_id, v_clinic_id, v_budget.id, i,
                    v_installments, v_installment_value, CURRENT_DATE + (i * 30),
                    'PENDING', 'CREDIT_CARD', NOW(), NOW()
                );
            END LOOP;
            
            -- ATUALIZAR PACIENTE
            UPDATE patients
            SET 
                total_approved = COALESCE(total_approved, 0) + v_budget_value,
                balance_due = COALESCE(balance_due, 0) + v_budget_value,
                updated_at = NOW()
            WHERE id = v_patient_id
            AND NOT EXISTS (SELECT 1 FROM installments WHERE installments.budget_id = v_budget.id LIMIT 1);
            
            SELECT COUNT(*) INTO v_treatments_count FROM treatment_items WHERE budget_id = v_budget.id;
            SELECT COUNT(*) INTO v_installments_count FROM installments WHERE installments.budget_id = v_budget.id;
            
            budget_id := v_budget.id;
            treatments_created := v_treatments_count;
            installments_created := v_installments_count;
            
            RETURN NEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AGORA EXECUTE ESTA LINHA PARA PROCESSAR ORÇAMENTOS ANTIGOS:
-- SELECT * FROM process_approved_budgets_retroactive();
-- =====================================================
