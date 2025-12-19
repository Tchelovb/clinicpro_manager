-- EMERGENCY FIX: Relaxar RLS temporariamente para debug
-- Execute este SQL AGORA para permitir criação de orçamentos

-- Desabilitar RLS temporariamente para teste
ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;

-- Ou, se quiser manter RLS ativa, usar policy mais permissiva:
DROP POLICY IF EXISTS "Users can create budgets for their clinic" ON budgets;
CREATE POLICY "Users can create budgets for their clinic" 
ON budgets FOR INSERT 
WITH CHECK (true); -- TEMPORÁRIO: permite todos inserts

-- Verificar se dados estão sendo salvos
SELECT id, patient_id, clinic_id, status, total_value, created_at 
FROM public.budgets 
ORDER BY created_at DESC 
LIMIT 5;
