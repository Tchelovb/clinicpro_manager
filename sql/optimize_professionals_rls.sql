-- ============================================
-- OTIMIZAÇÃO DE RLS: PROFESSIONALS & PROCEDURE
-- ============================================
-- Este script aplica a mesma lógica de "Security Definer" para
-- as tabelas 'professionals' e 'procedure', eliminando joins
-- com a tabela 'users' que podem causar recursão/bloqueios.
-- ============================================

-- 1. Garante que a função helper existe
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT clinic_id FROM users WHERE id = auth.uid();
$$;

-- ============================================
-- 2. TABELA: professionals
-- ============================================

DROP POLICY IF EXISTS "Professionals: read same clinic" ON professionals;
DROP POLICY IF EXISTS "Professionals: manage admin only" ON professionals;

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- Leitura otimizada (Usa função, evita join com users)
CREATE POLICY "Professionals: read same clinic"
ON professionals FOR SELECT
TO authenticated
USING (
  clinic_id = get_my_clinic_id()
);

-- Escrita otimizada (Admin check seguro)
CREATE POLICY "Professionals: manage admin only"
ON professionals FOR ALL
TO authenticated
USING (
  -- Verifica se é da mesma clínica E se usuário é admin
  clinic_id = get_my_clinic_id()
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'MASTER')
  )
);

-- ============================================
-- 3. TABELA: procedure (Singular, correta)
-- ============================================

DROP POLICY IF EXISTS "Procedure: read same clinic" ON procedure;
DROP POLICY IF EXISTS "Procedure: manage admin only" ON procedure;

ALTER TABLE procedure ENABLE ROW LEVEL SECURITY;

-- Leitura otimizada
CREATE POLICY "Procedure: read same clinic"
ON procedure FOR SELECT
TO authenticated
USING (
  clinic_id = get_my_clinic_id()
);

-- Escrita otimizada
CREATE POLICY "Procedure: manage admin only"
ON procedure FOR ALL
TO authenticated
USING (
  clinic_id = get_my_clinic_id()
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'MASTER')
  )
);

-- ============================================
-- 4. VERIFICAÇÃO
-- ============================================
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('professionals', 'procedure');
