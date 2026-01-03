DO $$
DECLARE
    v_clinic_id UUID;
    v_patient_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- 1. Tenta encontrar qualquer clínica existente
    SELECT id INTO v_clinic_id FROM public.clinics LIMIT 1;

    -- 2. Se NÃO encontrou, cria uma clínica padrão de emergência
    -- Isso garante que v_clinic_id NUNCA seja nulo na inserção abaixo
    IF v_clinic_id IS NULL THEN
        v_clinic_id := gen_random_uuid();
        INSERT INTO public.clinics (id, name, code, status)
        VALUES (v_clinic_id, 'Clínica Principal', 'MAIN-01', 'ACTIVE');
    END IF;

    -- 3. Cria o Paciente "Google Calendar" vinculado seguramente a essa clínica
    INSERT INTO public.patients (id, clinic_id, name, phone, email, is_active)
    VALUES (v_patient_id, v_clinic_id, 'Google Calendar', '00000000000', 'google@system.internal', false)
    ON CONFLICT (id) DO UPDATE 
    SET clinic_id = v_clinic_id, is_active = false;
    
    -- 4. Adiciona colunas de controle essenciais para o Sync
    BEGIN
        ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS external_id TEXT;
        ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS external_source TEXT DEFAULT 'CLINIC'; 
    EXCEPTION WHEN OTHERS THEN 
        NULL; -- Ignora se já existirem
    END;

    -- 5. Garante o índice
    CREATE INDEX IF NOT EXISTS idx_appointments_external_id ON public.appointments(external_id);
    
END $$;
