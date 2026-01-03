-- ============================================
-- FAXINA FINAL: PROCEDURE & PROFESSIONALS
-- ============================================
-- Este script remove TODAS as políticas duplicadas e legadas
-- identificadas no log, deixando apenas as versões otimizadas.
-- ============================================

-- 1. LIMPEZA: Tabela PROCEDURE
-- Remove lixo gerado por tentativas anteriores ou auto-geradores
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON procedure;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON procedure;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON procedure;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON procedure;
DROP POLICY IF EXISTS "RLS_Procedures_All" ON procedure;
DROP POLICY IF EXISTS "clinic_isolation" ON procedure;
DROP POLICY IF EXISTS "temp_permissive" ON procedure;

-- Remove as nossas próprias versões anteriores para garantir recriação limpa
DROP POLICY IF EXISTS "Procedure: manage admin only" ON procedure;
DROP POLICY IF EXISTS "Procedure: read same clinic" ON procedure;


-- 2. LIMPEZA: Tabela PROFESSIONALS
DROP POLICY IF EXISTS "RLS_Professionals_All" ON professionals;
DROP POLICY IF EXISTS "RLS_Professionals_Select" ON professionals;
DROP POLICY IF EXISTS "clinic_isolation" ON professionals;
DROP POLICY IF EXISTS "clinic_isolation_professionals" ON professionals;

-- Remove versões anteriores
DROP POLICY IF EXISTS "Professionals: manage admin only" ON professionals;
DROP POLICY IF EXISTS "Professionals: read same clinic" ON professionals;


-- ============================================
-- 3. RECRIAÇÃO OTIMIZADA (SEGURA)
-- ============================================

-- Função Helper (Garante que existe)
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT clinic_id FROM users WHERE id = auth.uid();
$$;

-- 3.1 Recriar Procedure (Simples e Direta)
ALTER TABLE procedure ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Procedure: read same clinic"
ON procedure FOR SELECT
TO authenticated
USING (clinic_id = get_my_clinic_id());

CREATE POLICY "Procedure: manage admin only"
ON procedure FOR ALL
TO authenticated
USING (
  clinic_id = get_my_clinic_id()
  AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'MASTER'))
);

-- 3.2 Recriar Professionals (Simples e Direta)
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals: read same clinic"
ON professionals FOR SELECT
TO authenticated
USING (clinic_id = get_my_clinic_id());

CREATE POLICY "Professionals: manage admin only"
ON professionals FOR ALL
TO authenticated
USING (
  clinic_id = get_my_clinic_id()
  AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'MASTER'))
);

-- ============================================
-- 4. VERIFICAÇÃO FINAL
-- ============================================
SELECT tablename, policyname, permissive 
FROM pg_policies 
WHERE tablename IN ('procedure', 'professionals')
ORDER BY tablename;
