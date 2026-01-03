-- ============================================
-- LIMPEZA GERAL DE POLÍTICAS DUPLICADAS
-- ============================================
-- Este script remove todas as políticas redundantes, conflitantes ou recursivas
-- encontradas na tabela 'users' e aplica APENAS as políticas essenciais e otimizadas.
-- ============================================

-- 1. Remover TODAS as políticas duplicadas/lixo identificadas
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can manage clinic users" ON users;
DROP POLICY IF EXISTS "RLS_Users_Select_SameClinic" ON users;
DROP POLICY IF EXISTS "RLS_Users_Update_Self" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can read same clinic users" ON users; -- CAUSADORA DE RECURSÃO
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "clinic_isolation" ON users;
DROP POLICY IF EXISTS "permissao_leitura_perfil_proprio" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users; -- Vamos garantir que essa não atrapalhe (service role já tem bypass nativo, mas se for explicita pode conflitar)

-- Também removemos as do nosso script anterior para recriar limpo
DROP POLICY IF EXISTS "Users: admin manage" ON users;
DROP POLICY IF EXISTS "Users: read own profile" ON users;
DROP POLICY IF EXISTS "Users: read same clinic" ON users;
DROP POLICY IF EXISTS "Users: update own profile" ON users;

-- ============================================
-- 2. RECRIAR OTIMIZADO (SEM RECURSÃO)
-- ============================================

-- Garante que a função helper existe
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT clinic_id FROM users WHERE id = auth.uid();
$$;

-- Política 1: Ler próprio perfil (Simples e Direta)
CREATE POLICY "Users: read own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Política 2: Ler usuários da mesma clínica (Usando função otimizada para evitar recursão)
CREATE POLICY "Users: read same clinic"
ON users FOR SELECT
TO authenticated
USING (clinic_id = get_my_clinic_id());

-- Política 3: Atualizar apenas o próprio perfil
CREATE POLICY "Users: update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Política 4: Admins podem gerenciar usuários da SUA clínica
-- Nota: Aqui também usamos get_my_clinic_id() para evitar subselect recursivo na cláusula EXISTS
CREATE POLICY "Users: admin manage"
ON users FOR ALL
TO authenticated
USING (
  -- O usuário atual é ADMIN/MASTER da MESMA clínica do alvo?
  get_my_clinic_id() = users.clinic_id 
  AND EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid() 
      AND u.role IN ('ADMIN', 'MASTER')
  )
);

-- ============================================
-- 3. VERIFICAÇÃO FINAL
-- ============================================
SELECT policyname, permissive, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- Deve retornar apenas 4 políticas limpas!
