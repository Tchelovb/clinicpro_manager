-- =====================================================
-- TESTE RÁPIDO: Sistema de Recompensas (Versão Simples)
-- =====================================================

-- PASSO 1: Buscar uma clínica existente
SELECT id as clinic_id, name as clinic_name FROM clinics LIMIT 1;

-- PASSO 2: Criar paciente INDICADOR (copie o clinic_id acima)
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
    'COLE-O-CLINIC-ID-AQUI',  -- ⚠️ SUBSTITUA PELO ID REAL
    'Maria Silva (Indicadora)',
    '(11) 98888-8888',
    '111.111.111-11',
    'Em Tratamento',
    0,
    0,
    0
) RETURNING id, name;

-- PASSO 3: Criar paciente INDICADO (copie o ID de Maria acima)
INSERT INTO patients (
    clinic_id,
    name,
    phone,
    cpf,
    status,
    total_approved,
    total_paid,
    balance_due,
    indication_patient_id  -- ⚠️ COLE O ID DE MARIA AQUI
) VALUES (
    'COLE-O-CLINIC-ID-AQUI',  -- ⚠️ MESMO CLINIC_ID
    'João Santos (Indicado)',
    '(11) 97777-7777',
    '222.222.222-22',
    'Em Tratamento',
    1500.00,
    0,
    1500.00,
    'COLE-O-ID-DE-MARIA-AQUI'  -- ⚠️ ID DO INDICADOR
) RETURNING id, name;

-- PASSO 4: Simular pagamento de R$ 600 (copie o ID de João acima)
UPDATE patients 
SET total_paid = 600.00,
    balance_due = 900.00
WHERE id = 'COLE-O-ID-DE-JOAO-AQUI';  -- ⚠️ ID DO INDICADO

-- PASSO 5: Verificar se a recompensa foi gerada
SELECT 
    p.name as indicador,
    rr.reward_type,
    rr.reward_value,
    rr.description,
    rr.status,
    rr.expiry_date
FROM referral_rewards rr
JOIN patients p ON p.id = rr.patient_id
WHERE p.name LIKE '%Maria%'
ORDER BY rr.earned_date DESC;

-- ✅ Se aparecer uma linha com Maria Silva, SUCESSO!
-- Ela deve ter R$ 50,00 de crédito pendente.
