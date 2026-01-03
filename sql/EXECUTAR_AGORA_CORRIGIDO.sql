-- SCRIPT CORRIGIDO COM ID DA CLÍNICA HARDCODED (550e8400-e29b-41d4-a716-446655440000)
-- Execute este script para destravar a sincronização do Google Calendar

BEGIN;

-- 1. Garante que a clínica existe
INSERT INTO public.clinics (id, name, code, status)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Clínica Dr. Marcelo', 'MAIN', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 2. Cria o Paciente para Bloqueios do Google
INSERT INTO public.patients (id, clinic_id, name, phone, email, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440000', 
  'Google Calendar',
  '00000000000',
  'google@system.internal',
  false
)
ON CONFLICT (id) DO UPDATE 
SET clinic_id = '550e8400-e29b-41d4-a716-446655440000', is_active = false;

-- 3. Adiciona colunas para controle externo
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS external_source TEXT DEFAULT 'CLINIC'; 
CREATE INDEX IF NOT EXISTS idx_appointments_external_id ON public.appointments(external_id);

COMMIT;
