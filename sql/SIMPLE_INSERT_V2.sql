-- PASSO 1: Limpe o editor e cole APENAS este código.
-- NÃO existe bloco DO $$ aqui, apenas comandos diretos.

-- Cria a clínica (se não existir)
INSERT INTO public.clinics (id, name, code, status)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Minha Clínica', 'MAIN', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Cria o Paciente Google vinculado a ela
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

-- Adiciona colunas para o sync
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS external_source TEXT DEFAULT 'CLINIC';
CREATE INDEX IF NOT EXISTS idx_appointments_external_id ON public.appointments(external_id);
