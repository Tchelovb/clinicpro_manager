-- CORREÇÃO DE PERMISSÕES (RLS) PARA TABELA PATIENTS

-- Habilita RLS (segurança por linha)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas (para evitar conflitos)
DROP POLICY IF EXISTS "Users can view patients from their clinic" ON public.patients;
DROP POLICY IF EXISTS "Users can insert patients for their clinic" ON public.patients;
DROP POLICY IF EXISTS "Users can update patients from their clinic" ON public.patients;
DROP POLICY IF EXISTS "Users can delete patients from their clinic" ON public.patients;

-- Política de LEITURA (SELECT)
-- Usuário pode ver pacientes cuja clinic_id seja igual à sua clinic_id na tabela users
CREATE POLICY "Users can view patients from their clinic"
ON public.patients FOR SELECT
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.users WHERE id = auth.uid()
  )
);

-- Política de INSERÇÃO (INSERT)
-- Usuário pode criar pacientes apenas para sua clínica
CREATE POLICY "Users can insert patients for their clinic"
ON public.patients FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM public.users WHERE id = auth.uid()
  )
);

-- Política de ATUALIZAÇÃO (UPDATE)
CREATE POLICY "Users can update patients from their clinic"
ON public.patients FOR UPDATE
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.users WHERE id = auth.uid()
  )
);

-- Política de EXCLUSÃO (DELETE)
CREATE POLICY "Users can delete patients from their clinic"
ON public.patients FOR DELETE
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.users WHERE id = auth.uid()
  )
);

-- Verifica se existem pacientes órfãos (sem clinic_id) e atribui à clínica do admin (opcional, apenas para debug)
-- UPDATE public.patients SET clinic_id = (SELECT id FROM public.clinics LIMIT 1) WHERE clinic_id IS NULL;
