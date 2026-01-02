-- Fix for crash in Sales Terminal (NULL amount & FK Violation in professional_ledger)
-- This overrides the function created in 20250101_qa_fixes.sql

CREATE OR REPLACE FUNCTION public.fn_calculate_sale_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_commission_rate NUMERIC;
    v_user_doctor_id UUID; -- ID do usuário (tabela users)
    v_professional_id UUID; -- ID do profissional (tabela professionals)
    v_patient_name TEXT;
BEGIN
    -- 1. Busca o ID do Usuário (Médico) vinculado ao orçamento
    SELECT doctor_id INTO v_user_doctor_id FROM public.budgets WHERE id = NEW.budget_id;
    
    -- GUARD CLAUSE: Se não tiver médico vinculado no orçamento, aborta
    IF v_user_doctor_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- 2. Busca o ID do Profissional vinculado a esse Usuário
    -- A tabela professional_ledger espera um ID da tabela 'professionals', não 'users'
    SELECT professional_id INTO v_professional_id FROM public.users WHERE id = v_user_doctor_id;

    -- GUARD CLAUSE: Se o usuário não tiver um perfil de profissional associado, aborta
    IF v_professional_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- 3. Busca o nome do paciente para a descrição
    SELECT name INTO v_patient_name FROM public.patients WHERE id = NEW.patient_id;
    
    -- 4. Busca a % de comissão (Padrão 30% se não configurado)
    -- Usa o ID do Profissional para buscar a regra
    SELECT commission_percent INTO v_commission_rate 
    FROM public.professional_commissions 
    WHERE professional_id = v_professional_id LIMIT 1;

    -- Se não encontrou regra específica, usa o padrão do sistema (30%)
    IF v_commission_rate IS NULL THEN
        v_commission_rate := 30;
    END IF;

    -- 5. Insere o crédito no Ledger do profissional
    INSERT INTO public.professional_ledger (
        clinic_id,
        professional_id, -- Aqui entra o ID da tabela professionals
        amount,
        type,
        entry_type,
        category,
        description,
        reference_id,
        reference_type,
        created_at,
        created_by
    ) VALUES (
        NEW.clinic_id,
        v_professional_id, -- ID correto resolvido
        (COALESCE(NEW.final_value, 0) * (v_commission_rate / 100)),
        'CREDIT',
        'CREDIT',
        'COMMISSION',
        'Comissão Venda #' || UPPER(SUBSTRING(NEW.id::text, 1, 8)) || ' - Paciente: ' || COALESCE(v_patient_name, 'Desconhecido'),
        NEW.id,
        'BUDGET',
        NOW(),
        NEW.created_by
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
