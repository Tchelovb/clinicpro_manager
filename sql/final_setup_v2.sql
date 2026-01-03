-- Script FINAL para configuração do Google Sync
-- Usando ID da Clínica fornecido: 550e8400-e29b-41d4-a716-446655440000

-- 1. Cria o Paciente "Google Calendar" vinculado à clínica correta
INSERT INTO public.patients (id, clinic_id, name, phone, email, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    '550e8400-e29b-41d4-a716-446655440000', 
    'Google Calendar - Bloqueio', 
    '00000000000', 
    'google@system.internal', 
    false
)
ON CONFLICT (id) DO UPDATE 
SET clinic_id = '550e8400-e29b-41d4-a716-446655440000', is_active = false;

-- 2. Adiciona colunas para rastrear o Sync (se não existirem)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS external_source TEXT DEFAULT 'CLINIC'; 
CREATE INDEX IF NOT EXISTS idx_appointments_external_id ON public.appointments(external_id);
