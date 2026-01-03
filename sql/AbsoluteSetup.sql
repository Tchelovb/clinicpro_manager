-- BLINDADO: Script para correção garantida do Backend Google Calendar

DO $$
DECLARE
    v_clinic_id UUID;
    v_patient_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    RAISE NOTICE 'Iniciando Setup Blindado...';

    -- 1. Buscando Clínica Existente (Bypass RLS implicito se for superuser)
    SELECT id INTO v_clinic_id FROM public.clinics LIMIT 1;

    -- 2. Se nao achou, FORÇA a criação de uma clínica
    IF v_clinic_id IS NULL THEN
        RAISE NOTICE 'Nenhuma clínica encontrada. Criando clínica padrão...';
        v_clinic_id := gen_random_uuid();
        
        -- Insere ignorando triggers simples se possível, preenchendo o mínimo
        INSERT INTO public.clinics (id, name, code, status)
        VALUES (v_clinic_id, 'Clínica Principal', 'MAIN-RECOVERY', 'ACTIVE');
    ELSE
        RAISE NOTICE 'Clínica encontrada: %', v_clinic_id;
    END IF;

    -- 3. Inserindo Paciente Google vinculado à clínica encontrada/criada
    -- Removemos qualquer paciente Google antigo mal configurado
    DELETE FROM public.patients WHERE id = v_patient_id;

    INSERT INTO public.patients (id, clinic_id, name, phone, email, is_active)
    VALUES (v_patient_id, v_clinic_id, 'Google Calendar', '00000000000', 'google@system.internal', false);
    
    RAISE NOTICE 'Paciente Google criado com sucesso.';

    -- 4. Criando colunas (se não existirem)
    BEGIN
        ALTER TABLE public.appointments ADD COLUMN external_id TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE public.appointments ADD COLUMN external_source TEXT DEFAULT 'CLINIC';
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    
    CREATE INDEX IF NOT EXISTS idx_appointments_external_id ON public.appointments(external_id);

    RAISE NOTICE 'Setup concluído com sucesso!';
END $$;
