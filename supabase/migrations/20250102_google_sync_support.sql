-- Migration para suportar sincronização reversa do Google Calendar
-- 1. Colunas de controle externo em appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS external_source TEXT DEFAULT 'CLINIC';

CREATE INDEX IF NOT EXISTS idx_appointments_external_id ON public.appointments(external_id);

-- 2. Paciente 'Sistema' para Google Calendar
DO $$
DECLARE
    v_clinic_id UUID;
    v_patient_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    SELECT id INTO v_clinic_id FROM clinics LIMIT 1;
    
    IF v_clinic_id IS NOT NULL THEN
        INSERT INTO public.patients (id, clinic_id, name, phone, email, is_active)
        VALUES (v_patient_id, v_clinic_id, 'Google Calendar', '00000000000', 'google@system.internal', false)
        ON CONFLICT (id) DO UPDATE 
        SET name = 'Google Calendar', is_active = false;
    END IF;
END $$;
