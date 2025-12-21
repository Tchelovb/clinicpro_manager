-- =====================================================
-- TESTE DE VALIDAÇÃO: MÓDULO ORTODONTIA
-- Execute este script para validar a instalação
-- =====================================================

-- =====================================================
-- 1. VERIFICAR SE AS TABELAS FORAM CRIADAS
-- =====================================================

SELECT 
    'Tabelas Criadas' as verificacao,
    COUNT(*) as total
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'ortho_contracts',
    'ortho_treatment_plans',
    'ortho_appointments',
    'ortho_aligner_stock'
);
-- Esperado: 4

-- =====================================================
-- 2. VERIFICAR SE AS VIEWS FORAM CRIADAS
-- =====================================================

SELECT 
    'Views Criadas' as verificacao,
    COUNT(*) as total
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN (
    'ortho_contracts_aging',
    'ortho_aligner_progress'
);
-- Esperado: 2

-- =====================================================
-- 3. VERIFICAR SE OS TRIGGERS FORAM CRIADOS
-- =====================================================

SELECT 
    'Triggers Criados' as verificacao,
    COUNT(*) as total
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name IN (
    'trg_update_next_aligner_change',
    'trg_check_ortho_payment_status'
);
-- Esperado: 2

-- =====================================================
-- 4. CRIAR DADOS DE TESTE
-- =====================================================

DO $$
DECLARE
    v_clinic_id uuid;
    v_patient_id uuid;
    v_professional_id uuid;
    v_budget_id uuid;
    v_contract_id uuid;
    v_treatment_plan_id uuid;
BEGIN
    -- Buscar clínica existente
    SELECT id INTO v_clinic_id FROM clinics LIMIT 1;
    
    -- Se não existir clínica, criar uma de teste
    IF v_clinic_id IS NULL THEN
        RAISE NOTICE 'Nenhuma clínica encontrada. Criando clínica de teste...';
        
        INSERT INTO clinics (
            name,
            code,
            cnpj,
            phone,
            email,
            status,
            type
        ) VALUES (
            'Clínica Teste Ortodontia',
            'TESTE_ORTHO',
            '00.000.000/0001-00',
            '(11) 0000-0000',
            'teste@ortodontia.com',
            'ACTIVE',
            'DEMO'
        ) RETURNING id INTO v_clinic_id;
        
        RAISE NOTICE 'Clínica de teste criada: %', v_clinic_id;
    ELSE
        RAISE NOTICE 'Usando clínica existente: %', v_clinic_id;
    END IF;
    
    -- Buscar profissional existente
    SELECT id INTO v_professional_id FROM professionals WHERE clinic_id = v_clinic_id LIMIT 1;
    
    -- Se não existir profissional, criar um de teste
    IF v_professional_id IS NULL THEN
        RAISE NOTICE 'Nenhum profissional encontrado. Criando profissional de teste...';
        
        INSERT INTO professionals (
            clinic_id,
            name,
            crc,
            specialty,
            is_active
        ) VALUES (
            v_clinic_id,
            'Dr. Ortodontista Teste',
            'CRO-SP 12345',
            'Ortodontia',
            true
        ) RETURNING id INTO v_professional_id;
        
        RAISE NOTICE 'Profissional de teste criado: %', v_professional_id;
    ELSE
        RAISE NOTICE 'Usando profissional existente: %', v_professional_id;
    END IF;
    
    -- Criar paciente de teste
    INSERT INTO patients (
        clinic_id,
        name,
        phone,
        cpf,
        status
    ) VALUES (
        v_clinic_id,
        'João Silva (Teste Ortodontia)',
        '(11) 99999-9999',
        '333.333.333-33',
        'Em Tratamento'
    ) RETURNING id INTO v_patient_id;
    
    RAISE NOTICE 'Paciente criado: %', v_patient_id;
    
    -- Criar orçamento de teste
    INSERT INTO budgets (
        clinic_id,
        patient_id,
        doctor_id,
        status,
        total_value,
        discount,
        final_value
    ) VALUES (
        v_clinic_id,
        v_patient_id,
        v_professional_id,
        'APPROVED',
        15000.00,
        0,
        15000.00
    ) RETURNING id INTO v_budget_id;
    
    RAISE NOTICE 'Orçamento criado: %', v_budget_id;
    
    -- Criar contrato ortodôntico (Invisalign)
    INSERT INTO ortho_contracts (
        clinic_id,
        patient_id,
        budget_id,
        professional_id,
        contract_type,
        total_value,
        down_payment,
        monthly_payment,
        number_of_months,
        billing_day,
        start_date,
        estimated_end_date,
        status
    ) VALUES (
        v_clinic_id,
        v_patient_id,
        v_budget_id,
        v_professional_id,
        'ALIGNERS',
        15000.00,
        3000.00,  -- Entrada
        500.00,   -- Mensalidade
        24,       -- 24 meses
        10,       -- Dia 10
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '24 months',
        'ACTIVE'
    ) RETURNING id INTO v_contract_id;
    
    RAISE NOTICE 'Contrato ortodôntico criado: %', v_contract_id;
    
    -- Criar plano de tratamento (35 alinhadores)
    INSERT INTO ortho_treatment_plans (
        contract_id,
        total_aligners_upper,
        total_aligners_lower,
        current_aligner_upper,
        current_aligner_lower,
        change_frequency_days,
        current_phase,
        bracket_type,
        treatment_goals
    ) VALUES (
        v_contract_id,
        35,  -- 35 placas superiores
        35,  -- 35 placas inferiores
        0,   -- Ainda não começou
        0,
        14,  -- Troca a cada 14 dias
        'DIAGNOSIS',
        NULL,
        'Corrigir apinhamento anterior, fechar diastema 11-21'
    ) RETURNING id INTO v_treatment_plan_id;
    
    RAISE NOTICE 'Plano de tratamento criado: %', v_treatment_plan_id;
    
    -- Criar estoque de alinhadores (primeiras 5 placas)
    FOR i IN 1..5 LOOP
        INSERT INTO ortho_aligner_stock (
            treatment_plan_id,
            aligner_number,
            arch,
            status,
            ordered_date,
            received_date
        ) VALUES (
            v_treatment_plan_id,
            i,
            'UPPER',
            'RECEIVED',
            CURRENT_DATE - INTERVAL '30 days',
            CURRENT_DATE - INTERVAL '15 days'
        );
        
        INSERT INTO ortho_aligner_stock (
            treatment_plan_id,
            aligner_number,
            arch,
            status,
            ordered_date,
            received_date
        ) VALUES (
            v_treatment_plan_id,
            i,
            'LOWER',
            'RECEIVED',
            CURRENT_DATE - INTERVAL '30 days',
            CURRENT_DATE - INTERVAL '15 days'
        );
    END LOOP;
    
    RAISE NOTICE 'Estoque de alinhadores criado: 10 placas (5 superiores + 5 inferiores)';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TESTE CONCLUÍDO COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Contrato ID: %', v_contract_id;
    RAISE NOTICE 'Paciente: João Silva (Teste Ortodontia)';
    RAISE NOTICE 'Tipo: Invisalign (35 placas)';
    RAISE NOTICE 'Valor: R$ 15.000 (R$ 3.000 entrada + 24x R$ 500)';
    RAISE NOTICE '';
    
END $$;

-- =====================================================
-- 5. CONSULTAR DADOS CRIADOS
-- =====================================================

-- Contratos ativos
SELECT 
    'Contratos Ativos' as tipo,
    oc.id,
    p.name as paciente,
    oc.contract_type,
    oc.total_value,
    oc.monthly_payment,
    oc.status
FROM ortho_contracts oc
JOIN patients p ON p.id = oc.patient_id
WHERE oc.status = 'ACTIVE';

-- Progresso de alinhadores
SELECT 
    'Progresso Alinhadores' as tipo,
    patient_name,
    current_aligner_upper,
    total_aligners_upper,
    progress_upper_percent,
    next_aligner_change_date,
    change_status
FROM ortho_aligner_progress;

-- Estoque de alinhadores
SELECT 
    'Estoque Alinhadores' as tipo,
    aligner_number,
    arch,
    status,
    received_date
FROM ortho_aligner_stock
ORDER BY aligner_number, arch;

-- =====================================================
-- 6. TESTAR TRIGGER DE ATUALIZAÇÃO DE DATA
-- =====================================================

-- Simular troca de alinhador
UPDATE ortho_treatment_plans
SET current_aligner_upper = 1,
    current_aligner_lower = 1
WHERE contract_id IN (
    SELECT id FROM ortho_contracts WHERE status = 'ACTIVE' LIMIT 1
);

-- Verificar se a data foi atualizada automaticamente
SELECT 
    'Trigger Testado' as tipo,
    last_aligner_change_date,
    next_aligner_change_date,
    CASE 
        WHEN next_aligner_change_date = last_aligner_change_date + change_frequency_days 
        THEN '✅ Trigger funcionando!'
        ELSE '❌ Trigger com problema'
    END as resultado
FROM ortho_treatment_plans
WHERE contract_id IN (
    SELECT id FROM ortho_contracts WHERE status = 'ACTIVE' LIMIT 1
);

-- =====================================================
-- 7. LIMPAR DADOS DE TESTE (OPCIONAL)
-- =====================================================

-- Descomente as linhas abaixo se quiser limpar os dados de teste:

-- DELETE FROM ortho_aligner_stock 
-- WHERE treatment_plan_id IN (
--     SELECT id FROM ortho_treatment_plans 
--     WHERE contract_id IN (
--         SELECT id FROM ortho_contracts 
--         WHERE patient_id IN (
--             SELECT id FROM patients WHERE name = 'João Silva (Teste Ortodontia)'
--         )
--     )
-- );

-- DELETE FROM ortho_treatment_plans 
-- WHERE contract_id IN (
--     SELECT id FROM ortho_contracts 
--     WHERE patient_id IN (
--         SELECT id FROM patients WHERE name = 'João Silva (Teste Ortodontia)'
--     )
-- );

-- DELETE FROM ortho_contracts 
-- WHERE patient_id IN (
--     SELECT id FROM patients WHERE name = 'João Silva (Teste Ortodontia)'
-- );

-- DELETE FROM budgets 
-- WHERE patient_id IN (
--     SELECT id FROM patients WHERE name = 'João Silva (Teste Ortodontia)'
-- );

-- DELETE FROM patients WHERE name = 'João Silva (Teste Ortodontia)';

-- =====================================================
-- FIM DO TESTE
-- =====================================================
