-- 1. Garante que existe pelo menos uma clínica (Cria se tabela vazia)
INSERT INTO public.clinics (id, name, code, status)
VALUES ('11111111-1111-1111-1111-111111111111', 'Clínica Principal', 'MAIN', 'ACTIVE')
ON CONFLICT DO NOTHING; 

-- 2. Cria o Paciente Google vinculado à primeira clínica encontrada
INSERT INTO public.patients (id, clinic_id, name, phone, email, is_active)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid, 
  id, 
  'Google Calendar', 
  '00000000000', 
  'google@system.internal', 
  false
FROM public.clinics 
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- 3. Adiciona colunas necessárias na tabela appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS external_source TEXT DEFAULT 'CLINIC';
CREATE INDEX IF NOT EXISTS idx_appointments_external_id ON public.appointments(external_id);
