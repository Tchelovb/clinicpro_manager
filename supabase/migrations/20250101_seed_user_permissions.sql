-- Seed de Permissões para Usuários Admin/Owner
-- Execute este script para dar permissões completas aos administradores

-- Inserir permissões para todos os usuários ADMIN e OWNER
INSERT INTO user_permissions (
    user_id,
    clinic_id,
    can_approve_budget,
    can_view_financial_margins,
    can_access_pos,
    can_edit_prices,
    can_process_payments
)
SELECT 
    u.id as user_id,
    u.clinic_id,
    true as can_approve_budget,
    true as can_view_financial_margins,
    true as can_access_pos,
    true as can_edit_prices,
    true as can_process_payments
FROM users u
WHERE u.role IN ('ADMIN', 'OWNER')
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up 
    WHERE up.user_id = u.id
)
ON CONFLICT (user_id, clinic_id) 
DO UPDATE SET
    can_approve_budget = true,
    can_view_financial_margins = true,
    can_access_pos = true,
    can_edit_prices = true,
    can_process_payments = true,
    updated_at = NOW();

-- Inserir permissões limitadas para PROFESSIONAL (Dentista Técnico)
INSERT INTO user_permissions (
    user_id,
    clinic_id,
    can_approve_budget,
    can_view_financial_margins,
    can_access_pos,
    can_edit_prices,
    can_process_payments
)
SELECT 
    u.id as user_id,
    u.clinic_id,
    false as can_approve_budget,      -- NÃO pode aprovar
    false as can_view_financial_margins, -- NÃO vê margem
    false as can_access_pos,          -- NÃO acessa POS
    false as can_edit_prices,         -- NÃO edita preços
    false as can_process_payments     -- NÃO processa pagamentos
FROM users u
WHERE u.role = 'PROFESSIONAL'
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up 
    WHERE up.user_id = u.id
)
ON CONFLICT (user_id, clinic_id) 
DO NOTHING; -- Não sobrescreve se já existir

-- Verificar permissões criadas
SELECT 
    u.name,
    u.role,
    up.can_approve_budget,
    up.can_view_financial_margins,
    up.can_access_pos
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
ORDER BY u.role, u.name;
