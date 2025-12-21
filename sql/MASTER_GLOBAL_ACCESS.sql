-- ============================================
-- LIBERAÇÃO DE ACESSO GLOBAL PARA MASTER
-- BOS v23.0 - Credencial FBI
-- ============================================

-- 1. LIBERAR ACESSO A PACIENTES PARA MASTER
-- O Master precisa ver TODOS os pacientes de TODAS as clínicas

DROP POLICY IF EXISTS "Enable read access for MASTER users" ON patients;

CREATE POLICY "Enable read access for MASTER users"
ON patients
FOR SELECT
USING (
  -- Permite se o usuário for MASTER
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'MASTER'
  )
  OR
  -- OU se for da mesma clínica (regra normal)
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);

-- 2. LIBERAR ACESSO A TRANSAÇÕES FINANCEIRAS PARA MASTER
-- O Master precisa ver TODAS as transações de TODAS as clínicas

DROP POLICY IF EXISTS "Enable read access for MASTER users" ON transactions;

CREATE POLICY "Enable read access for MASTER users"
ON transactions
FOR SELECT
USING (
  -- Permite se o usuário for MASTER
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'MASTER'
  )
  OR
  -- OU se for da mesma clínica (regra normal)
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);

-- 3. LIBERAR ACESSO A CLÍNICAS PARA MASTER
-- O Master precisa ver TODAS as clínicas

DROP POLICY IF EXISTS "Enable read access for MASTER users" ON clinics;

CREATE POLICY "Enable read access for MASTER users"
ON clinics
FOR SELECT
USING (
  -- Permite se o usuário for MASTER (vê todas)
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'MASTER'
  )
  OR
  -- OU se for da mesma clínica (regra normal)
  id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);

-- 4. LIBERAR ACESSO A USER_PROGRESSION PARA MASTER
-- O Master precisa ver o XP de TODOS os usuários

DROP POLICY IF EXISTS "Enable read access for MASTER users" ON user_progression;

CREATE POLICY "Enable read access for MASTER users"
ON user_progression
FOR SELECT
USING (
  -- Permite se o usuário for MASTER
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'MASTER'
  )
  OR
  -- OU se for o próprio usuário
  user_id = auth.uid()
);

-- 5. VERIFICAÇÃO
-- Confirmar que as policies foram criadas

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE policyname LIKE '%MASTER%'
ORDER BY tablename, policyname;

-- ============================================
-- RESULTADO ESPERADO:
-- - Master pode ver TODOS os pacientes
-- - Master pode ver TODAS as transações
-- - Master pode ver TODAS as clínicas
-- - Master pode ver TODO o XP da equipe
-- ============================================
