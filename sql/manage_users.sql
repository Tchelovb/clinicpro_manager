-- ============================================
-- SCRIPT DE GERENCIAMENTO DE USUÁRIOS
-- ============================================
-- Este script permite adicionar, atualizar e listar usuários
-- diretamente no banco de dados, contornando problemas de rede
-- 
-- Como usar:
-- 1. Acesse o Supabase Studio: https://huturwlbouvucjnwaoze.supabase.co
-- 2. Vá em "SQL Editor"
-- 3. Cole e execute os comandos desejados
-- ============================================

-- ============================================
-- 1. LISTAR TODOS OS USUÁRIOS DA CLÍNICA
-- ============================================
-- Execute este comando para ver todos os usuários cadastrados

SELECT 
    id,
    name,
    email,
    role,
    active,
    phone,
    created_at,
    clinic_id
FROM users
WHERE clinic_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY name ASC;


-- ============================================
-- 2. ADICIONAR NOVO USUÁRIO
-- ============================================
-- Substitua os valores entre aspas pelos dados do novo usuário

-- IMPORTANTE: Primeiro você precisa criar o usuário no Supabase Auth
-- Vá em Authentication > Users > Add User
-- Depois execute este comando para adicionar na tabela users:

INSERT INTO users (
    id,                    -- UUID do usuário criado no Auth
    clinic_id,            -- ID da sua clínica
    name,                 -- Nome completo
    email,                -- Email (mesmo do Auth)
    role,                 -- MASTER, ADMIN, PROFESSIONAL, STAFF
    active,               -- true ou false
    phone,                -- Telefone (opcional)
    created_at
) VALUES (
    'COLE_AQUI_O_UUID_DO_AUTH',                    -- Pegar do Auth após criar
    '550e8400-e29b-41d4-a716-446655440000',       -- Sua clínica
    'Nome do Colaborador',                         -- Nome
    'email@exemplo.com',                           -- Email
    'PROFESSIONAL',                                -- Role: MASTER/ADMIN/PROFESSIONAL/STAFF
    true,                                          -- Ativo
    '11999999999',                                 -- Telefone
    NOW()
);


-- ============================================
-- 3. ATUALIZAR DADOS DE UM USUÁRIO
-- ============================================
-- Substitua o email e os campos que deseja atualizar

UPDATE users
SET 
    name = 'Novo Nome',
    role = 'ADMIN',
    phone = '11988888888',
    active = true
WHERE email = 'email@exemplo.com'
  AND clinic_id = '550e8400-e29b-41d4-a716-446655440000';


-- ============================================
-- 4. DESATIVAR UM USUÁRIO (NÃO DELETA)
-- ============================================
-- Melhor prática: desativar ao invés de deletar

UPDATE users
SET active = false
WHERE email = 'email@exemplo.com'
  AND clinic_id = '550e8400-e29b-41d4-a716-446655440000';


-- ============================================
-- 5. REATIVAR UM USUÁRIO
-- ============================================

UPDATE users
SET active = true
WHERE email = 'email@exemplo.com'
  AND clinic_id = '550e8400-e29b-41d4-a716-446655440000';


-- ============================================
-- 6. ALTERAR ROLE (PERMISSÕES)
-- ============================================
-- Roles disponíveis:
-- - MASTER: Acesso total, pode gerenciar múltiplas clínicas
-- - ADMIN: Administrador da clínica, acesso total
-- - PROFESSIONAL: Dentista/Médico, acesso clínico
-- - STAFF: Equipe (recepção, etc), acesso limitado

UPDATE users
SET role = 'ADMIN'
WHERE email = 'email@exemplo.com'
  AND clinic_id = '550e8400-e29b-41d4-a716-446655440000';


-- ============================================
-- 7. BUSCAR USUÁRIO POR EMAIL
-- ============================================

SELECT 
    id,
    name,
    email,
    role,
    active,
    phone,
    created_at
FROM users
WHERE email = 'email@exemplo.com'
  AND clinic_id = '550e8400-e29b-41d4-a716-446655440000';


-- ============================================
-- 8. LISTAR APENAS USUÁRIOS ATIVOS
-- ============================================

SELECT 
    name,
    email,
    role,
    phone
FROM users
WHERE clinic_id = '550e8400-e29b-41d4-a716-446655440000'
  AND active = true
ORDER BY name ASC;


-- ============================================
-- 9. CONTAR USUÁRIOS POR ROLE
-- ============================================

SELECT 
    role,
    COUNT(*) as total,
    COUNT(CASE WHEN active = true THEN 1 END) as ativos
FROM users
WHERE clinic_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY role
ORDER BY role;


-- ============================================
-- 10. EXEMPLO COMPLETO: ADICIONAR DENTISTA
-- ============================================
-- Passo a passo completo para adicionar um novo dentista

-- PASSO 1: Criar usuário no Supabase Auth
-- Vá em: Authentication > Users > Add User
-- Email: dra.maria@clinica.com
-- Password: (defina uma senha temporária)
-- Copie o UUID gerado

-- PASSO 2: Adicionar na tabela users
INSERT INTO users (
    id,
    clinic_id,
    name,
    email,
    role,
    active,
    phone,
    created_at
) VALUES (
    'UUID_COPIADO_DO_PASSO_1',                    -- Cole aqui o UUID
    '550e8400-e29b-41d4-a716-446655440000',       -- Sua clínica
    'Dra. Maria Silva',                           -- Nome
    'dra.maria@clinica.com',                      -- Email (mesmo do Auth)
    'PROFESSIONAL',                               -- Dentista
    true,                                         -- Ativo
    '11987654321',                                -- Telefone
    NOW()
);

-- PASSO 3: Verificar se foi criado corretamente
SELECT * FROM users 
WHERE email = 'dra.maria@clinica.com';


-- ============================================
-- 11. DELETAR USUÁRIO (USE COM CUIDADO!)
-- ============================================
-- ⚠️ ATENÇÃO: Isso remove permanentemente o usuário
-- Recomendamos usar "desativar" (comando #4) ao invés de deletar

-- DELETE FROM users
-- WHERE email = 'email@exemplo.com'
--   AND clinic_id = '550e8400-e29b-41d4-a716-446655440000';


-- ============================================
-- 12. VERIFICAR INTEGRIDADE DOS DADOS
-- ============================================
-- Lista usuários que podem ter problemas

SELECT 
    id,
    name,
    email,
    role,
    active,
    CASE 
        WHEN name IS NULL OR name = '' THEN 'Nome vazio'
        WHEN email IS NULL OR email = '' THEN 'Email vazio'
        WHEN role NOT IN ('MASTER', 'ADMIN', 'PROFESSIONAL', 'STAFF') THEN 'Role inválida'
        ELSE 'OK'
    END as status
FROM users
WHERE clinic_id = '550e8400-e29b-41d4-a716-446655440000';


-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- 1. SEMPRE crie o usuário primeiro no Supabase Auth antes de adicionar na tabela users
-- 2. O UUID do Auth DEVE ser o mesmo na tabela users
-- 3. O email do Auth DEVE ser o mesmo na tabela users
-- 4. Prefira DESATIVAR usuários ao invés de DELETAR
-- 5. Roles válidas: MASTER, ADMIN, PROFESSIONAL, STAFF
-- 6. clinic_id deve ser sempre '550e8400-e29b-41d4-a716-446655440000' para sua clínica
-- 
-- ============================================
