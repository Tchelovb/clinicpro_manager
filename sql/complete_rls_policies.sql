-- ============================================
-- POLÍTICAS RLS COMPLETAS - SISTEMA CLINICPRO
-- ============================================
-- Políticas de segurança para TODAS as tabelas principais
-- Baseado no schema real do banco de dados
-- 
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- ============================================

-- ============================================
-- 1. TABELA: users
-- ============================================

DROP POLICY IF EXISTS "Users: read own profile" ON users;
DROP POLICY IF EXISTS "Users: read same clinic" ON users;
DROP POLICY IF EXISTS "Users: update own profile" ON users;
DROP POLICY IF EXISTS "Users: admin manage" ON users;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users: read own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users: read same clinic"
ON users FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users: update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users: admin manage"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'MASTER')
      AND clinic_id = users.clinic_id
  )
);


-- ============================================
-- 2. TABELA: patients
-- ============================================

DROP POLICY IF EXISTS "Patients: read same clinic" ON patients;
DROP POLICY IF EXISTS "Patients: insert same clinic" ON patients;
DROP POLICY IF EXISTS "Patients: update same clinic" ON patients;
DROP POLICY IF EXISTS "Patients: delete admin only" ON patients;

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients: read same clinic"
ON patients FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Patients: insert same clinic"
ON patients FOR INSERT
TO authenticated
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Patients: update same clinic"
ON patients FOR UPDATE
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Patients: delete admin only"
ON patients FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'MASTER')
      AND clinic_id = patients.clinic_id
  )
);


-- ============================================
-- 3. TABELA: appointments
-- ============================================

DROP POLICY IF EXISTS "Appointments: read same clinic" ON appointments;
DROP POLICY IF EXISTS "Appointments: manage same clinic" ON appointments;

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Appointments: read same clinic"
ON appointments FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Appointments: manage same clinic"
ON appointments FOR ALL
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);


-- ============================================
-- 4. TABELA: budgets
-- ============================================

DROP POLICY IF EXISTS "Budgets: read same clinic" ON budgets;
DROP POLICY IF EXISTS "Budgets: manage same clinic" ON budgets;

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Budgets: read same clinic"
ON budgets FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Budgets: manage same clinic"
ON budgets FOR ALL
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);


-- ============================================
-- 5. TABELA: leads (CRM)
-- ============================================

DROP POLICY IF EXISTS "Leads: read same clinic" ON leads;
DROP POLICY IF EXISTS "Leads: manage same clinic" ON leads;

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leads: read same clinic"
ON leads FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Leads: manage same clinic"
ON leads FOR ALL
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
)
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);


-- ============================================
-- 6. TABELA: transactions (Financeiro)
-- ============================================

DROP POLICY IF EXISTS "Transactions: read same clinic" ON transactions;
DROP POLICY IF EXISTS "Transactions: insert same clinic" ON transactions;
DROP POLICY IF EXISTS "Transactions: update admin only" ON transactions;
DROP POLICY IF EXISTS "Transactions: delete admin only" ON transactions;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transactions: read same clinic"
ON transactions FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Transactions: insert same clinic"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Transactions: update admin only"
ON transactions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'MASTER')
      AND clinic_id = transactions.clinic_id
  )
);

CREATE POLICY "Transactions: delete admin only"
ON transactions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'MASTER')
      AND clinic_id = transactions.clinic_id
  )
);


-- ============================================
-- 7. TABELA: procedure (CORRIGIDO - singular)
-- ============================================

DROP POLICY IF EXISTS "Procedure: read same clinic" ON procedure;
DROP POLICY IF EXISTS "Procedure: manage admin only" ON procedure;

ALTER TABLE procedure ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Procedure: read same clinic"
ON procedure FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Procedure: manage admin only"
ON procedure FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'MASTER')
      AND clinic_id = procedure.clinic_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'MASTER')
      AND clinic_id = procedure.clinic_id
  )
);


-- ============================================
-- 8. TABELA: professionals
-- ============================================

DROP POLICY IF EXISTS "Professionals: read same clinic" ON professionals;
DROP POLICY IF EXISTS "Professionals: manage admin only" ON professionals;

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals: read same clinic"
ON professionals FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Professionals: manage admin only"
ON professionals FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'MASTER')
      AND clinic_id = professionals.clinic_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'MASTER')
      AND clinic_id = professionals.clinic_id
  )
);


-- ============================================
-- 9. VERIFICAR TODAS AS POLÍTICAS
-- ============================================

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'patients', 'appointments', 'budgets', 'leads', 'transactions', 'procedure', 'professionals')
ORDER BY tablename, policyname;


-- ============================================
-- 10. TESTAR ACESSO
-- ============================================

-- Teste 1: Ler usuários
SELECT id, name, email, role FROM users LIMIT 3;

-- Teste 2: Ler pacientes
SELECT id, name, phone FROM patients LIMIT 3;

-- Teste 3: Ler agendamentos
SELECT id, patient_id, date FROM appointments LIMIT 3;

-- Teste 4: Ler orçamentos
SELECT id, patient_id, total_value FROM budgets LIMIT 3;

-- Teste 5: Ler procedimentos
SELECT id, name, base_price FROM procedure LIMIT 3;


-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- 1. Todas as tabelas agora têm RLS ativado
-- 2. Usuários só veem dados da própria clínica
-- 3. ADMIN/MASTER têm permissões extras
-- 4. Service role bypassa RLS (Edge Functions)
-- 5. Sempre teste após aplicar políticas
-- 
-- CORREÇÕES APLICADAS:
-- - Tabela "procedures" corrigida para "procedure" (singular)
-- - Adicionada tabela "professionals"
-- - Políticas ajustadas ao schema real
-- 
-- ORDEM DE EXECUÇÃO:
-- 1. Execute este script completo no SQL Editor
-- 2. Execute o comando de verificação (#9)
-- 3. Execute os testes (#10)
-- 4. Recarregue a aplicação (F5)
-- 5. Teste todas as páginas
-- 
-- ============================================
