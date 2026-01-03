-- ============================================
-- FIX: VERIFICAR E CORRIGIR DEFAULTS DAS COLUNAS
-- ============================================

-- 1. VERIFICAR VALORES ATUAIS DO DR. MARCELO
SELECT 
    name,
    is_clinical_provider,
    is_orcamentista,
    is_sales_rep,
    is_crc_agent,
    can_schedule,
    cro,
    specialty,
    commission_percent
FROM users
WHERE email = 'marcelovboass@gmail.com';

-- 2. FORÇAR UPDATE MANUAL PARA GARANTIR QUE OS VALORES ESTÃO CORRETOS
UPDATE users
SET 
    is_clinical_provider = true,
    is_orcamentista = true,
    is_sales_rep = true,
    is_crc_agent = true,
    can_schedule = true,
    cro = '12.299/PR',
    specialty = 'Implantodontia',
    commission_percent = 30
WHERE email = 'marcelovboass@gmail.com';

-- 3. VERIFICAR SE SALVOU
SELECT 
    name,
    is_clinical_provider,
    is_orcamentista,
    is_sales_rep,
    is_crc_agent,
    can_schedule,
    cro,
    specialty,
    commission_percent
FROM users
WHERE email = 'marcelovboass@gmail.com';

-- 4. VERIFICAR SE HÁ TRIGGERS QUE PODEM ESTAR REVERTENDO OS VALORES
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
ORDER BY trigger_name;

-- 5. VERIFICAR DEFAULTS DAS COLUNAS
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN (
    'is_clinical_provider',
    'is_orcamentista',
    'is_sales_rep',
    'is_crc_agent',
    'can_schedule'
)
ORDER BY column_name;

-- 6. SE NECESSÁRIO, ALTERAR OS DEFAULTS PARA NULL (PARA NÃO SOBRESCREVER)
-- DESCOMENTE APENAS SE OS DEFAULTS ESTIVEREM CAUSANDO PROBLEMA:
/*
ALTER TABLE users 
ALTER COLUMN is_clinical_provider SET DEFAULT NULL,
ALTER COLUMN is_orcamentista SET DEFAULT NULL,
ALTER COLUMN is_sales_rep SET DEFAULT NULL;
*/
