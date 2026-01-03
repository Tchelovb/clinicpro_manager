-- ============================================
-- POLÍTICAS RLS PARA TABELA USERS (VERSÃO SEGURA)
-- ============================================
-- Este script cria apenas as políticas que NÃO existem
-- Usa DROP POLICY IF EXISTS para evitar erros de duplicação
-- ============================================

-- ============================================
-- 1. HABILITAR RLS NA TABELA USERS
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;


-- ============================================
-- 2. REMOVER POLÍTICAS ANTIGAS (SE EXISTIREM)
-- ============================================

DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can read same clinic users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage clinic users" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;


-- ============================================
-- 3. CRIAR POLÍTICAS NOVAS
-- ============================================

-- Política 1: Usuário pode ler seu próprio perfil
CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
USING (auth.uid() = id);


-- Política 2: Usuário pode ler outros usuários da mesma clínica
CREATE POLICY "Users can read same clinic users"
ON users
FOR SELECT
USING (
  clinic_id IN (
    SELECT clinic_id 
    FROM users 
    WHERE id = auth.uid()
  )
);


-- Política 3: Usuário pode atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- Política 4: Admin pode gerenciar usuários da clínica
CREATE POLICY "Admins can manage clinic users"
ON users
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'MASTER')
      AND clinic_id = users.clinic_id
  )
);


-- Política 5: Service role tem acesso total
CREATE POLICY "Service role has full access"
ON users
FOR ALL
USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);


-- ============================================
-- 4. VERIFICAR POLÍTICAS CRIADAS
-- ============================================

SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;


-- ============================================
-- 5. TESTAR ACESSO
-- ============================================

SELECT 
    id,
    name,
    email,
    role,
    active
FROM users
LIMIT 5;
