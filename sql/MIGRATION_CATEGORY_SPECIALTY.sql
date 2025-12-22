-- =====================================================
-- MIGRATION: Separar CATEGORIA de ESPECIALIDADE
-- =====================================================
-- Objetivo: Criar distinção entre CATEGORIA (Clínica Geral, Ortodontia, HOF)
-- e ESPECIALIDADE (Dentística, Cirurgia, Endodontia, etc.)

-- =====================================================
-- PARTE 1: TABELA PROCEDURE
-- =====================================================

DO $$
BEGIN
    -- 1.1 Adicionar novo campo 'specialty' (especialidade)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'procedure' AND column_name = 'specialty'
    ) THEN
        ALTER TABLE procedure ADD COLUMN specialty TEXT;
        RAISE NOTICE '✅ Campo specialty adicionado';
    END IF;

    -- 1.2 Copiar valores de 'category' para 'specialty'
    UPDATE procedure 
    SET specialty = category 
    WHERE specialty IS NULL;
    RAISE NOTICE '✅ Valores copiados de category para specialty';

    -- 1.3 Criar novo campo 'category_new' com as 3 categorias principais
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'procedure' AND column_name = 'category_new'
    ) THEN
        ALTER TABLE procedure 
        ADD COLUMN category_new TEXT 
        CHECK (category_new IN ('CLINICA_GERAL', 'ORTODONTIA', 'HOF'));
        RAISE NOTICE '✅ Campo category_new criado';
    END IF;

    -- 1.4 Mapear especialidades para categorias
    UPDATE procedure 
    SET category_new = CASE 
        -- Ortodontia
        WHEN specialty = 'Ortodontia' THEN 'ORTODONTIA'
        
        -- HOF (Harmonização Orofacial)
        WHEN specialty = 'Harmonização' THEN 'HOF'
        
        -- Clínica Geral (todas as outras)
        WHEN specialty IN ('Dentística', 'Cirurgia', 'Periodontia', 'Endodontia', 
                           'Implante', 'Prótese', 'Radiologia', 'Outro') 
        THEN 'CLINICA_GERAL'
        
        -- Default para casos não mapeados
        ELSE 'CLINICA_GERAL'
    END
    WHERE category_new IS NULL;
    RAISE NOTICE '✅ Especialidades mapeadas para categorias';

    -- 1.5 Remover coluna antiga 'category'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'procedure' AND column_name = 'category'
    ) THEN
        ALTER TABLE procedure DROP COLUMN category;
        RAISE NOTICE '✅ Coluna category antiga removida';
    END IF;

    -- 1.6 Renomear 'category_new' para 'category'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'procedure' AND column_name = 'category_new'
    ) THEN
        ALTER TABLE procedure RENAME COLUMN category_new TO category;
        RAISE NOTICE '✅ Coluna renomeada para category';
    END IF;

    -- 1.7 Definir valor padrão
    ALTER TABLE procedure 
    ALTER COLUMN category SET DEFAULT 'CLINICA_GERAL';

    -- 1.8 Tornar campo obrigatório
    ALTER TABLE procedure 
    ALTER COLUMN category SET NOT NULL;

    RAISE NOTICE '✅ Tabela procedure atualizada: category (3 valores) + specialty (detalhado)';
END $$;

-- =====================================================
-- PARTE 2: TABELA TREATMENT_ITEMS
-- =====================================================

DO $$
BEGIN
    -- 2.1 Adicionar campo 'category'
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'treatment_items' AND column_name = 'category'
    ) THEN
        ALTER TABLE treatment_items 
        ADD COLUMN category TEXT 
        CHECK (category IN ('CLINICA_GERAL', 'ORTODONTIA', 'HOF'));
        RAISE NOTICE '✅ Campo category adicionado em treatment_items';
    END IF;

    -- 2.2 Adicionar campo 'specialty'
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'treatment_items' AND column_name = 'specialty'
    ) THEN
        ALTER TABLE treatment_items ADD COLUMN specialty TEXT;
        RAISE NOTICE '✅ Campo specialty adicionado em treatment_items';
    END IF;

    -- 2.3 Atualizar treatment_items existentes com base no procedimento
    UPDATE treatment_items ti
    SET 
        category = p.category,
        specialty = p.specialty
    FROM procedure p
    WHERE ti.procedure_name = p.name
    AND ti.category IS NULL;
    RAISE NOTICE '✅ Treatment items atualizados com category e specialty';

    -- 2.4 Definir valor padrão para registros sem match
    UPDATE treatment_items 
    SET category = 'CLINICA_GERAL' 
    WHERE category IS NULL;

    -- 2.5 Tornar campo obrigatório
    ALTER TABLE treatment_items 
    ALTER COLUMN category SET NOT NULL;

    RAISE NOTICE '✅ Tabela treatment_items atualizada com category e specialty';
END $$;

-- =====================================================
-- PARTE 3: ATUALIZAR TRIGGER AUTO_CREATE
-- =====================================================

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
    -- Só executa se o status mudou para APPROVED
    IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
        
        RAISE NOTICE '🎯 Budget approved! Creating treatment items and installments for budget %', NEW.id;
        
        -- ==========================================
        -- PARTE 1: Criar Treatment Items
        -- ==========================================
        FOR v_item IN 
            SELECT * FROM budget_items WHERE budget_id = NEW.id
        LOOP
            -- Buscar dados do procedimento (category e specialty)
            SELECT category, specialty INTO v_procedure
            FROM procedure
            WHERE name = v_item.procedure_name
            LIMIT 1;
            
            -- Verifica se já existe treatment_item
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
                    category,        -- NOVO: Categoria (3 valores)
                    specialty,       -- NOVO: Especialidade (detalhado)
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
                    COALESCE(v_procedure.category, 'CLINICA_GERAL'),  -- Categoria
                    v_procedure.specialty,                             -- Especialidade
                    'NOT_STARTED',
                    NEW.doctor_id,
                    v_item.unit_value,
                    v_item.total_value,
                    NOW(),
                    NOW()
                );
                
                RAISE NOTICE '✅ Created treatment_item: % (Category: %, Specialty: %)', 
                    v_item.procedure_name, 
                    COALESCE(v_procedure.category, 'CLINICA_GERAL'),
                    v_procedure.specialty;
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

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_auto_create_on_approval ON budgets;

CREATE TRIGGER trigger_auto_create_on_approval
    AFTER UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_treatment_and_installments();

-- =====================================================
-- PARTE 4: COMENTÁRIOS EXPLICATIVOS
-- =====================================================

COMMENT ON COLUMN procedure.category IS 'Categoria principal: CLINICA_GERAL, ORTODONTIA, HOF';
COMMENT ON COLUMN procedure.specialty IS 'Especialidade detalhada: Dentística, Cirurgia, Endodontia, etc.';
COMMENT ON COLUMN treatment_items.category IS 'Categoria para distribuição nas abas do perfil do paciente';
COMMENT ON COLUMN treatment_items.specialty IS 'Especialidade do procedimento (detalhamento)';

-- =====================================================
-- RESUMO DA MIGRATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRATION CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 MUDANÇAS APLICADAS:';
    RAISE NOTICE '  1. procedure.category → Agora tem 3 valores: CLINICA_GERAL, ORTODONTIA, HOF';
    RAISE NOTICE '  2. procedure.specialty → Novo campo com especialidades detalhadas';
    RAISE NOTICE '  3. treatment_items.category → Adicionado para filtrar por aba';
    RAISE NOTICE '  4. treatment_items.specialty → Adicionado para detalhamento';
    RAISE NOTICE '  5. Trigger atualizado para salvar category e specialty';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PRÓXIMO PASSO:';
    RAISE NOTICE '  Atualizar PatientDetail.tsx para filtrar por category';
    RAISE NOTICE '';
END $$;
