-- ==========================================================
-- 🛠️ SCRIPT DE CORREÇÃO PROFUNDA - PERSISTÊNCIA E TRIGGERS
-- ==========================================================

-- 1. SANITIZAÇÃO DE DADOS (Remove NULLs que podem quebrar o frontend)
UPDATE users SET is_clinical_provider = false WHERE is_clinical_provider IS NULL;
UPDATE users SET is_orcamentista = false WHERE is_orcamentista IS NULL;
UPDATE users SET is_sales_rep = false WHERE is_sales_rep IS NULL;
UPDATE users SET is_crc_agent = false WHERE is_crc_agent IS NULL;
UPDATE users SET can_schedule = true WHERE can_schedule IS NULL; -- Padrão TRUE para agendamento

-- 2. LISTAR E DROPPAR TRIGGERS SUSPEITOS
-- (Verifique o output desta query. Se houver triggers de sincronização users<->professionals, eles podem ser a causa)
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('users', 'professionals');

-- 3. DROPPAR TRIGGERS CONHECIDOS QUE PODEM CAUSAR LOOP (Se existirem)
-- Execute apenas se você identificar triggers como 'sync_user_professional' ou similar
-- DROP TRIGGER IF EXISTS trigger_name ON users;

-- 4. FORÇAR VALORES PARA O USUÁRIO ATUAL (Teste Definitivo)
UPDATE users 
SET 
    is_clinical_provider = true,
    is_orcamentista = true,
    is_sales_rep = true,
    is_crc_agent = true,
    can_schedule = true,
    specialty = 'Implantodontia',
    cro = '12.299/PR'
WHERE email = 'marcelovboass@gmail.com';

-- 5. VERIFICAR O RESULTADO IMEDIATO
SELECT 
    name, 
    is_clinical_provider, 
    is_orcamentista, 
    is_sales_rep, 
    is_crc_agent, 
    can_schedule 
FROM users 
WHERE email = 'marcelovboass@gmail.com';
