-- Script para associar usuário existente à clínica
-- Execute APÓS o usuário se cadastrar via SignUp

-- 1. Substitua 'USER_ID_AQUI' pelo ID real do usuário (de auth.users)
-- Encontre o ID executando: SELECT id, email FROM auth.users;

-- 2. Inserir na tabela users
INSERT INTO users (id, clinic_id, email, name, role)
VALUES (
  'USER_ID_AQUI', -- Cole o ID do auth.users aqui
  '550e8400-e29b-41d4-a716-446655440000', -- ID da clínica existente
  'teste@clinicpro.com',
  'Usuário Teste',
  'ADMIN'
);

-- 3. Atualizar metadata no auth.users
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}')::jsonb || '{"clinic_id": "550e8400-e29b-41d4-a716-446655440000"}'::jsonb
WHERE id = 'USER_ID_AQUI';

-- Após executar, o usuário poderá criar pacientes.