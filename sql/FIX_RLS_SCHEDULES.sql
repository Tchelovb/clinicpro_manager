-- ========================================================
-- FIX RLS: PERMITIR GERENCIAMENTO DE PROFESSIONAL_SCHEDULES
-- ========================================================

-- 1. Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Enable read access for all users" ON professional_schedules;
DROP POLICY IF EXISTS "Enable insert for users based on clinic_id" ON professional_schedules;
DROP POLICY IF EXISTS "Enable update for users based on clinic_id" ON professional_schedules;
DROP POLICY IF EXISTS "Enable delete for users based on clinic_id" ON professional_schedules;
DROP POLICY IF EXISTS "Allow full access to clinic members" ON professional_schedules;

-- 2. Habilitar RLS (caso não esteja)
ALTER TABLE professional_schedules ENABLE ROW LEVEL SECURITY;

-- 3. Política de LEITURA (SELECT)
-- Todos da mesma clínica podem ver as agendas
CREATE POLICY "policy_select_schedules"
ON professional_schedules
FOR SELECT
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
);

-- 4. Política de INSERÇÃO (INSERT)
-- Admins, Donos ou o próprio profissional podem criar horários
CREATE POLICY "policy_insert_schedules"
ON professional_schedules
FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
  AND (
    -- É Admin ou Master?
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'MASTER')
    )
    OR
    -- É o próprio profissional?
    professional_id = auth.uid()
  )
);

-- 5. Política de ATUALIZAÇÃO (UPDATE)
CREATE POLICY "policy_update_schedules"
ON professional_schedules
FOR UPDATE
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
  AND (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'MASTER')
    )
    OR
    professional_id = auth.uid()
  )
);

-- 6. Política de EXCLUSÃO (DELETE)
CREATE POLICY "policy_delete_schedules"
ON professional_schedules
FOR DELETE
USING (
  clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  )
  AND (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'MASTER')
    )
    OR
    professional_id = auth.uid()
  )
);

-- 7. NOTIFICAR RECARREGAMENTO
NOTIFY pgrst, 'reload schema';
