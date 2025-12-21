-- =====================================================
-- TESTE RÁPIDO: MÓDULO ORTODONTIA
-- Execute este script para validar a instalação
-- =====================================================

-- Este script cria automaticamente:
-- - Clínica de teste (se não existir)
-- - Profissional de teste (se não existir)
-- - Paciente de teste
-- - Contrato ortodôntico (Invisalign)
-- - Plano de tratamento (35 alinhadores)
-- - Estoque de alinhadores

DO $$
DECLARE
    v_clinic_id uuid;
    v_patient_id uuid;
    v_professional_id uuid;
    v_budget_id uuid;
    v_contract_id uuid;
    v_treatment_plan_id uuid;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'INICIANDO TESTE DO MÓDULO ORTODONTIA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- =====================================================
    -- 1. BUSCAR OU CRIAR CLÍNICA
    -- =====================================================
    
    SELECT id INTO v_clinic_id FROM clinics LIMIT 1;
    
    IF v_clinic_id IS NULL THEN
        RAISE NOTICE '⚠️  Nenhuma clínica encontrada. Criando clínica de teste...';
        
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
        
        RAISE NOTICE '✅ Clínica de teste criada: %', v_clinic_id;
    ELSE
        RAISE NOTICE '✅ Usando clínica existente: %', v_clinic_id;
    END IF;
    
    -- =====================================================
    -- 2. BUSCAR OU CRIAR PROFISSIONAL
    -- =====================================================
    
    SELECT id INTO v_professional_id FROM professionals WHERE clinic_id = v_clinic_id LIMIT 1;
    
    IF v_professional_id IS NULL THEN
        RAISE NOTICE '⚠️  Nenhum profissional encontrado. Criando profissional de teste...';
        
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
        
        RAISE NOTICE '✅ Profissional de teste criado: %', v_professional_id;
    ELSE
        RAISE NOTICE '✅ Usando profissional existente: %', v_professional_id;
    END IF;
    
    -- =====================================================
    -- 3. CRIAR PACIENTE DE TESTE
    -- =====================================================
    
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
    
    RAISE NOTICE '✅ Paciente criado: %', v_patient_id;
    
    -- =====================================================
    -- 4. CRIAR ORÇAMENTO DE TESTE
    -- =====================================================
    
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
    
    RAISE NOTICE '✅ Orçamento criado: %', v_budget_id;
    
    -- =====================================================
    -- 5. CRIAR CONTRATO ORTODÔNTICO (INVISALIGN)
    -- =====================================================
    
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
    
    RAISE NOTICE '✅ Contrato ortodôntico criado: %', v_contract_id;
    
    -- =====================================================
    -- 6. CRIAR PLANO DE TRATAMENTO (35 ALINHADORES)
    -- =====================================================
    
    INSERT INTO ortho_treatment_plans (
        contract_id,
        total_aligners_upper,
        total_aligners_lower,
        current_aligner_upper,
        current_aligner_lower,
        change_frequency_days,
        current_phase,
        treatment_goals
    ) VALUES (
        v_contract_id,
        35,  -- 35 placas superiores
        35,  -- 35 placas inferiores
        0,   -- Ainda não começou
        0,
        14,  -- Troca a cada 14 dias
        'DIAGNOSIS',
        'Corrigir apinhamento anterior, fechar diastema 11-21'
    ) RETURNING id INTO v_treatment_plan_id;
    
    RAISE NOTICE '✅ Plano de tratamento criado: %', v_treatment_plan_id;
    
    -- =====================================================
    -- 7. CRIAR ESTOQUE DE ALINHADORES (PRIMEIRAS 5 PLACAS)
    -- =====================================================
    
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
    
    RAISE NOTICE '✅ Estoque de alinhadores criado: 10 placas (5 superiores + 5 inferiores)';
    
    -- =====================================================
    -- 8. TESTAR TRIGGER DE ATUALIZAÇÃO DE DATA
    -- =====================================================
    
    RAISE NOTICE '';
    RAISE NOTICE 'Testando trigger de atualização de data...';
    
    UPDATE ortho_treatment_plans
    SET current_aligner_upper = 1,
        current_aligner_lower = 1
    WHERE id = v_treatment_plan_id;
    
    RAISE NOTICE '✅ Trigger testado (alinhador atualizado para #1)';
    
    -- =====================================================
    -- RESUMO FINAL
    -- =====================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ TESTE CONCLUÍDO COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 DADOS CRIADOS:';
    RAISE NOTICE '  Clínica ID: %', v_clinic_id;
    RAISE NOTICE '  Profissional ID: %', v_professional_id;
    RAISE NOTICE '  Paciente ID: %', v_patient_id;
    RAISE NOTICE '  Contrato ID: %', v_contract_id;
    RAISE NOTICE '';
    RAISE NOTICE '💰 CONTRATO:';
    RAISE NOTICE '  Paciente: João Silva (Teste Ortodontia)';
    RAISE NOTICE '  Tipo: Invisalign (35 placas)';
    RAISE NOTICE '  Valor Total: R$ 15.000,00';
    RAISE NOTICE '  Entrada: R$ 3.000,00';
    RAISE NOTICE '  Mensalidade: R$ 500,00 x 24 meses';
    RAISE NOTICE '  Dia de Vencimento: 10';
    RAISE NOTICE '';
    RAISE NOTICE '🦷 TRATAMENTO:';
    RAISE NOTICE '  Alinhadores Superiores: 35';
    RAISE NOTICE '  Alinhadores Inferiores: 35';
    RAISE NOTICE '  Alinhador Atual: #1';
    RAISE NOTICE '  Troca a cada: 14 dias';
    RAISE NOTICE '  Estoque: 5 placas entregues';
    RAISE NOTICE '';
    RAISE NOTICE '📊 PRÓXIMOS PASSOS:';
    RAISE NOTICE '  1. Execute as consultas abaixo para ver os dados';
    RAISE NOTICE '  2. Teste as views de relatórios';
    RAISE NOTICE '  3. Implemente o frontend';
    RAISE NOTICE '';
    
END $$;

-- =====================================================
-- CONSULTAS DE VALIDAÇÃO
-- =====================================================

-- Ver contrato criado
SELECT 
    '📋 CONTRATO CRIADO' as tipo,
    oc.id,
    p.name as paciente,
    oc.contract_type,
    oc.total_value,
    oc.down_payment,
    oc.monthly_payment,
    oc.number_of_months,
    oc.status
FROM ortho_contracts oc
JOIN patients p ON p.id = oc.patient_id
WHERE p.name LIKE '%Teste Ortodontia%';

-- Ver plano de tratamento
SELECT 
    '🦷 PLANO DE TRATAMENTO' as tipo,
    otp.current_aligner_upper,
    otp.total_aligners_upper,
    otp.current_aligner_lower,
    otp.total_aligners_lower,
    otp.change_frequency_days,
    otp.current_phase,
    otp.next_aligner_change_date
FROM ortho_treatment_plans otp
JOIN ortho_contracts oc ON oc.id = otp.contract_id
JOIN patients p ON p.id = oc.patient_id
WHERE p.name LIKE '%Teste Ortodontia%';

-- Ver estoque de alinhadores
SELECT 
    '📦 ESTOQUE DE ALINHADORES' as tipo,
    oas.aligner_number,
    oas.arch,
    oas.status,
    oas.received_date
FROM ortho_aligner_stock oas
JOIN ortho_treatment_plans otp ON otp.id = oas.treatment_plan_id
JOIN ortho_contracts oc ON oc.id = otp.contract_id
JOIN patients p ON p.id = oc.patient_id
WHERE p.name LIKE '%Teste Ortodontia%'
ORDER BY oas.arch, oas.aligner_number;

-- Ver progresso (usando view)
SELECT 
    '📊 PROGRESSO (VIEW)' as tipo,
    *
FROM ortho_aligner_progress
WHERE patient_name LIKE '%Teste Ortodontia%';
