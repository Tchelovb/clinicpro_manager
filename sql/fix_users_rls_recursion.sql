-- ============================================
-- CORREÇÃO DE RECURSÃO INFINITA NO RLS (USERS)
-- ============================================
-- Este script resolve o erro "net::ERR_CONNECTION_RESET" causado por
-- recursão infinita na política RLS da tabela users.
-- 
-- Problema: A política checava a tabela users para validar acesso à... tabela users.
-- Solução: Usar uma função SECURITY DEFINER para buscar o ID da clínica.
-- ============================================

-- 1. Criar função segura para obter ID da clínica do usuário atual
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER -- Executa com privilégios de criador (bypassa RLS)
SET search_path = public -- Segurança contra search_path injection
STABLE -- Otimização: resultado consistente na transação
AS $$
  SELECT clinic_id FROM users WHERE id = auth.uid();
$$;

-- 2. Recriar política da tabela users usando a função
DROP POLICY IF EXISTS "Users: read same clinic" ON users;

CREATE POLICY "Users: read same clinic"
ON users
FOR SELECT
TO authenticated
USING (
  clinic_id = get_my_clinic_id()
);

-- 3. Melhorar também a política de leitura do próprio perfil para garantir
DROP POLICY IF EXISTS "Users: read own profile" ON users;

CREATE POLICY "Users: read own profile"
ON users
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- 4. Verificar se funcionou
SELECT policyname, qual, permissive 
FROM pg_policies 
WHERE tablename = 'users';

-- 5. Teste de performance (deve ser instantâneo agora)
-- EXPLAIN ANALYZE SELECT * FROM users;
