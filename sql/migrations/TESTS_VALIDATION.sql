-- =====================================================
-- SCRIPT DE TESTE: Sistema de Recompensas e Alertas
-- =====================================================

-- ========================================
-- TESTE 1: Criar Alerta Médico Crítico
-- ========================================

-- Primeiro, vamos buscar um paciente existente
DO $$
DECLARE
    v_patient_id uuid;
    v_patient_name text;
BEGIN
    -- Buscar o primeiro paciente ativo
    SELECT id, name INTO v_patient_id, v_patient_name
    FROM patients
    WHERE clinic_id IS NOT NULL
    LIMIT 1;

    IF v_patient_id IS NULL THEN
        RAISE NOTICE 'Nenhum paciente encontrado. Crie um paciente primeiro.';
    ELSE
        RAISE NOTICE 'Criando alerta para paciente: % (ID: %)', v_patient_name, v_patient_id;
        
        -- Criar alerta médico crítico
        INSERT INTO medical_alerts (
            patient_id,
            alert_type,
            description,
            severity,
            is_critical,
            is_active
        ) VALUES (
            v_patient_id,
            'ALLERGY',
            'Alergia severa a Penicilina - RISCO DE CHOQUE ANAFILÁTICO',
            'CRITICAL',
            true,
            true
        );

        RAISE NOTICE 'Alerta crítico criado com sucesso!';
        RAISE NOTICE 'Agora abra o prontuário do paciente % para ver o popup.', v_patient_name;
    END IF;
END $$;

-- ========================================
-- TESTE 2: Sistema de Recompensas
-- ========================================

-- Criar dois pacientes de teste (Indicador e Indicado)
DO $$
DECLARE
    v_clinic_id uuid;
    v_indicador_id uuid;
    v_indicado_id uuid;
    rec RECORD;  -- Variável para o loop
BEGIN
    -- Buscar uma clínica existente
    SELECT id INTO v_clinic_id FROM clinics LIMIT 1;

    IF v_clinic_id IS NULL THEN
        RAISE NOTICE 'Nenhuma clínica encontrada. Execute as migrations básicas primeiro.';
        RETURN;
    END IF;

    -- Criar paciente INDICADOR (Maria Silva)
    INSERT INTO patients (
        clinic_id,
        name,
        phone,
        cpf,
        status,
        total_approved,
        total_paid,
        balance_due
    ) VALUES (
        v_clinic_id,
        'Maria Silva (Indicadora)',
        '(11) 98888-8888',
        '111.111.111-11',
        'Em Tratamento',
        0,
        0,
        0
    ) RETURNING id INTO v_indicador_id;

    RAISE NOTICE 'Paciente INDICADOR criado: Maria Silva (ID: %)', v_indicador_id;

    -- Criar paciente INDICADO (João Santos)
    INSERT INTO patients (
        clinic_id,
        name,
        phone,
        cpf,
        status,
        total_approved,
        total_paid,
        balance_due,
        indication_patient_id  -- VINCULA AO INDICADOR
    ) VALUES (
        v_clinic_id,
        'João Santos (Indicado por Maria)',
        '(11) 97777-7777',
        '222.222.222-22',
        'Em Tratamento',
        1500.00,  -- Aprovou R$ 1.500
        0,        -- Ainda não pagou
        1500.00,
        v_indicador_id  -- INDICADO POR MARIA
    ) RETURNING id INTO v_indicado_id;

    RAISE NOTICE 'Paciente INDICADO criado: João Santos (ID: %)', v_indicado_id;
    RAISE NOTICE 'João foi indicado por Maria!';

    -- Simular pagamento de R$ 600 (acima do mínimo de R$ 500)
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SIMULANDO PAGAMENTO DE R$ 600,00...';
    RAISE NOTICE '========================================';
    
    UPDATE patients 
    SET total_paid = 600.00,
        balance_due = 900.00
    WHERE id = v_indicado_id;

    RAISE NOTICE 'Pagamento registrado!';
    RAISE NOTICE '';

    -- Verificar se a recompensa foi gerada automaticamente
    RAISE NOTICE 'Verificando recompensas geradas...';
    
    PERFORM * FROM referral_rewards 
    WHERE patient_id = v_indicador_id 
    AND referred_patient_id = v_indicado_id;

    IF FOUND THEN
        RAISE NOTICE '✅ SUCESSO! Recompensa automática gerada para Maria Silva!';
        RAISE NOTICE '';
        RAISE NOTICE 'Detalhes da recompensa:';
        
        -- Mostrar detalhes
        FOR rec IN 
            SELECT 
                reward_type,
                reward_value,
                status,
                earned_date,
                expiry_date,
                description
            FROM referral_rewards 
            WHERE patient_id = v_indicador_id 
            AND referred_patient_id = v_indicado_id
        LOOP
            RAISE NOTICE '  Tipo: %', rec.reward_type;
            RAISE NOTICE '  Valor: R$ %', rec.reward_value;
            RAISE NOTICE '  Status: %', rec.status;
            RAISE NOTICE '  Descrição: %', rec.description;
            RAISE NOTICE '  Validade: %', rec.expiry_date;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ ERRO: Recompensa não foi gerada automaticamente!';
        RAISE NOTICE 'Verifique se a trigger foi criada corretamente.';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TESTE CONCLUÍDO';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Acesse /dashboard/indicacoes para ver Maria no leaderboard!';

END $$;

-- ========================================
-- CONSULTAS ÚTEIS
-- ========================================

-- Ver todos os alertas críticos
SELECT 
    p.name as paciente,
    ma.alert_type,
    ma.description,
    ma.severity
FROM medical_alerts ma
JOIN patients p ON p.id = ma.patient_id
WHERE ma.is_critical = true AND ma.is_active = true;

-- Ver todas as recompensas pendentes
SELECT 
    p.name as indicador,
    rr.reward_value as credito,
    rr.description,
    rr.status,
    rr.expiry_date as validade
FROM referral_rewards rr
JOIN patients p ON p.id = rr.patient_id
WHERE rr.status = 'PENDING'
ORDER BY rr.earned_date DESC;

-- Ver saldo de recompensas por paciente
SELECT 
    p.name,
    prb.pending_balance as creditos_disponiveis,
    prb.redeemed_total as total_resgatado,
    prb.total_rewards_earned as qtd_recompensas
FROM patient_rewards_balance prb
JOIN patients p ON p.id = prb.patient_id
ORDER BY prb.pending_balance DESC;
