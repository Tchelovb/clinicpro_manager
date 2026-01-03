-- 1. Adicionar colunas de controle (Executar uma por vez se der erro)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS external_source TEXT DEFAULT 'CLINIC';
CREATE INDEX IF NOT EXISTS idx_appointments_external_id ON public.appointments(external_id);

-- 2. Inserir Paciente Google (Usa o primeiro ID de clínica encontrado)
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
