-- =====================================================
-- MIGRATION 008: MÓDULO ORTODONTIA (BOS ORTHO)
-- Baseado em EasyDent Payment Plans + BOS Intelligence
-- Data: 21/12/2024
-- =====================================================

-- =====================================================
-- 1. CONTRATOS ORTODÔNTICOS (Assinatura/Recorrência)
-- =====================================================

-- Tabela principal de contratos ortodônticos
CREATE TABLE IF NOT EXISTS public.ortho_contracts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    clinic_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    budget_id uuid, -- Origem da venda
    professional_id uuid, -- Ortodontista responsável
    
    -- Tipo de Tratamento
    contract_type text NOT NULL CHECK (contract_type IN ('FIXED_BRACES', 'ALIGNERS', 'ORTHOPEDIC', 'LINGUAL', 'CERAMIC')),
    
    -- Financeiro
    total_value numeric NOT NULL CHECK (total_value > 0),
    down_payment numeric DEFAULT 0 CHECK (down_payment >= 0), -- Entrada/Setup
    monthly_payment numeric NOT NULL CHECK (monthly_payment > 0), -- Manutenção
    number_of_months integer NOT NULL CHECK (number_of_months > 0),
    billing_day integer NOT NULL CHECK (billing_day BETWEEN 1 AND 31), -- Dia de vencimento
    
    -- Datas
    start_date date NOT NULL,
    estimated_end_date date,
    actual_end_date date,
    
    -- Status
    status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'COMPLETED', 'CANCELLED')),
    suspension_reason text,
    suspended_at timestamp with time zone,
    
    -- Configurações
    auto_charge boolean DEFAULT false, -- Cobrança automática
    block_scheduling_if_overdue boolean DEFAULT true, -- Bloqueia agenda se inadimplente
    overdue_tolerance_days integer DEFAULT 10, -- Tolerância de atraso
    
    -- Observações
    notes text,
    
    -- Auditoria
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT ortho_contracts_pkey PRIMARY KEY (id),
    CONSTRAINT ortho_contracts_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
    CONSTRAINT ortho_contracts_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
    CONSTRAINT ortho_contracts_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.budgets(id),
    CONSTRAINT ortho_contracts_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
    CONSTRAINT ortho_contracts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ortho_contracts_clinic ON public.ortho_contracts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ortho_contracts_patient ON public.ortho_contracts(patient_id);
CREATE INDEX IF NOT EXISTS idx_ortho_contracts_status ON public.ortho_contracts(status);
CREATE INDEX IF NOT EXISTS idx_ortho_contracts_professional ON public.ortho_contracts(professional_id);

-- =====================================================
-- 2. PLANO DE TRATAMENTO ORTODÔNTICO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ortho_treatment_plans (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    contract_id uuid NOT NULL,
    
    -- Para Alinhadores (Invisalign, etc.)
    total_aligners_upper integer DEFAULT 0 CHECK (total_aligners_upper >= 0),
    total_aligners_lower integer DEFAULT 0 CHECK (total_aligners_lower >= 0),
    current_aligner_upper integer DEFAULT 0 CHECK (current_aligner_upper >= 0),
    current_aligner_lower integer DEFAULT 0 CHECK (current_aligner_lower >= 0),
    change_frequency_days integer DEFAULT 14 CHECK (change_frequency_days > 0), -- Troca a cada X dias
    last_aligner_change_date date,
    next_aligner_change_date date,
    
    -- Para Aparelho Fixo
    installation_date date, -- Data de instalação
    bracket_type text CHECK (bracket_type IN ('METAL', 'CERAMIC', 'SAPPHIRE', 'LINGUAL', 'SELF_LIGATING')),
    
    -- Fase Atual do Tratamento
    current_phase text DEFAULT 'DIAGNOSIS' CHECK (current_phase IN (
        'DIAGNOSIS',        -- Diagnóstico/Planejamento
        'LEVELING',         -- Nivelamento
        'ALIGNMENT',        -- Alinhamento
        'WORKING',          -- Fase de Trabalho
        'SPACE_CLOSURE',    -- Fechamento de Espaços
        'FINISHING',        -- Finalização
        'RETENTION'         -- Contenção
    )),
    phase_started_at date,
    
    -- Objetivos do Tratamento
    treatment_goals text, -- Ex: "Corrigir mordida cruzada, alinhar incisivos"
    
    -- Planejamento de Extrações
    extractions_planned text[], -- Ex: ['14', '24', '34', '44']
    extractions_completed text[],
    
    -- Planejamento de IPR (Desgastes Interproximais)
    ipr_planned jsonb DEFAULT '[]'::jsonb, -- Ex: [{"teeth": "11-21", "amount": "0.5mm", "date": "2024-03-15"}]
    
    -- Attachments (para alinhadores)
    attachments_planned text[], -- Ex: ['11', '21', '31', '41']
    attachments_placed text[],
    
    -- Observações
    notes text,
    
    -- Auditoria
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT ortho_treatment_plans_pkey PRIMARY KEY (id),
    CONSTRAINT ortho_treatment_plans_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.ortho_contracts(id) ON DELETE CASCADE,
    CONSTRAINT ortho_treatment_plans_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ortho_treatment_plans_contract ON public.ortho_treatment_plans(contract_id);

-- =====================================================
-- 3. EVOLUÇÃO CLÍNICA ORTODÔNTICA (Consultas)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ortho_appointments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    appointment_id uuid NOT NULL,
    treatment_plan_id uuid NOT NULL,
    
    -- Tipo de Consulta
    appointment_type text CHECK (appointment_type IN (
        'INSTALLATION',     -- Instalação
        'MAINTENANCE',      -- Manutenção
        'ADJUSTMENT',       -- Ajuste
        'EMERGENCY',        -- Emergência (quebrou)
        'REMOVAL',          -- Remoção
        'RETENTION_CHECK'   -- Controle de contenção
    )),
    
    -- Para Aparelho Fixo - Arcada Superior
    archwire_upper text, -- Ex: "0.14 NiTi", "0.19x0.25 Aço"
    elastics_upper text, -- Ex: "Classe II, 3/16 Médio"
    chain_upper text,    -- Ex: "Canino a Canino"
    
    -- Para Aparelho Fixo - Arcada Inferior
    archwire_lower text,
    elastics_lower text,
    chain_lower text,
    
    -- Para Alinhadores
    aligners_delivered_from integer, -- Ex: Entregou do alinhador 5...
    aligners_delivered_to integer,   -- ...até o alinhador 8
    aligners_stock_given integer,    -- Quantidade de placas entregues
    
    -- Procedimentos Realizados
    ipr_performed boolean DEFAULT false, -- Fez desgaste interproximal?
    ipr_teeth text, -- Ex: "11-21, 0.3mm"
    attachments_placed boolean DEFAULT false,
    attachments_removed boolean DEFAULT false,
    attachments_list text, -- Ex: "11, 21, 31, 41"
    
    -- Ocorrências
    bracket_broken text[], -- Ex: ['11', '21'] - Braquetes quebrados
    bracket_replaced text[], -- Ex: ['11'] - Braquetes recolados
    band_loose text[], -- Ex: ['16'] - Bandas soltas
    wire_broken boolean DEFAULT false,
    
    -- Avaliação do Paciente
    hygiene_score integer CHECK (hygiene_score BETWEEN 1 AND 5), -- 1=Péssima, 5=Excelente
    compliance_score integer CHECK (compliance_score BETWEEN 1 AND 5), -- Usou elástico? Trocou alinhador?
    cooperation_notes text, -- Ex: "Paciente não usou elásticos conforme orientado"
    
    -- Planejamento
    next_visit_plan text, -- Ex: "Trocar para fio 0.18, iniciar elásticos Classe II"
    next_visit_interval_days integer DEFAULT 30, -- Retorno em X dias
    
    -- Cobrança Extra (quebrou, perdeu)
    extra_charge_reason text, -- Ex: "Braquete quebrado por negligência"
    extra_charge_value numeric DEFAULT 0,
    
    -- Observações
    notes text,
    
    -- Fotos
    photos_urls text[], -- URLs das fotos intraorais
    
    -- Auditoria
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT ortho_appointments_pkey PRIMARY KEY (id),
    CONSTRAINT ortho_appointments_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
    CONSTRAINT ortho_appointments_treatment_plan_id_fkey FOREIGN KEY (treatment_plan_id) REFERENCES public.ortho_treatment_plans(id),
    CONSTRAINT ortho_appointments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ortho_appointments_appointment ON public.ortho_appointments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_ortho_appointments_treatment_plan ON public.ortho_appointments(treatment_plan_id);

-- =====================================================
-- 4. ESTOQUE DE ALINHADORES (Controle Logístico)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ortho_aligner_stock (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    treatment_plan_id uuid NOT NULL,
    
    -- Identificação
    aligner_number integer NOT NULL, -- Ex: Alinhador #5
    arch text NOT NULL CHECK (arch IN ('UPPER', 'LOWER')),
    
    -- Status
    status text DEFAULT 'ORDERED' CHECK (status IN (
        'ORDERED',      -- Pedido ao laboratório
        'RECEIVED',     -- Recebido na clínica
        'DELIVERED',    -- Entregue ao paciente
        'IN_USE',       -- Em uso pelo paciente
        'COMPLETED',    -- Concluído (passou para o próximo)
        'LOST',         -- Perdido
        'DAMAGED'       -- Danificado
    )),
    
    -- Datas
    ordered_date date,
    received_date date,
    delivered_date date,
    expected_start_date date, -- Quando deveria começar a usar
    actual_start_date date,   -- Quando realmente começou
    expected_end_date date,   -- Quando deveria trocar
    actual_end_date date,     -- Quando realmente trocou
    
    -- Observações
    notes text,
    
    -- Auditoria
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    CONSTRAINT ortho_aligner_stock_pkey PRIMARY KEY (id),
    CONSTRAINT ortho_aligner_stock_treatment_plan_id_fkey FOREIGN KEY (treatment_plan_id) REFERENCES public.ortho_treatment_plans(id) ON DELETE CASCADE,
    CONSTRAINT ortho_aligner_stock_unique UNIQUE (treatment_plan_id, aligner_number, arch)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ortho_aligner_stock_treatment_plan ON public.ortho_aligner_stock(treatment_plan_id);
CREATE INDEX IF NOT EXISTS idx_ortho_aligner_stock_status ON public.ortho_aligner_stock(status);

-- =====================================================
-- 5. VIEWS PARA RELATÓRIOS
-- =====================================================

-- View: Contratos Ativos com Inadimplência
CREATE OR REPLACE VIEW ortho_contracts_aging AS
SELECT 
    oc.id as contract_id,
    oc.clinic_id,
    p.id as patient_id,
    p.name as patient_name,
    p.phone as patient_phone,
    oc.contract_type,
    oc.monthly_payment,
    oc.billing_day,
    oc.status,
    oc.overdue_tolerance_days,
    
    -- Calcular parcelas vencidas
    (
        SELECT COUNT(*)
        FROM financial_installments fi
        WHERE fi.patient_id = oc.patient_id
        AND fi.description LIKE '%Ortodontia%'
        AND fi.status = 'PENDING'
        AND fi.due_date < CURRENT_DATE
    ) as overdue_installments,
    
    (
        SELECT SUM(fi.amount - fi.amount_paid)
        FROM financial_installments fi
        WHERE fi.patient_id = oc.patient_id
        AND fi.description LIKE '%Ortodontia%'
        AND fi.status = 'PENDING'
        AND fi.due_date < CURRENT_DATE
    ) as overdue_amount,
    
    -- Dias de atraso
    (
        SELECT CURRENT_DATE - MIN(fi.due_date)
        FROM financial_installments fi
        WHERE fi.patient_id = oc.patient_id
        AND fi.description LIKE '%Ortodontia%'
        AND fi.status = 'PENDING'
        AND fi.due_date < CURRENT_DATE
    ) as days_overdue

FROM ortho_contracts oc
JOIN patients p ON p.id = oc.patient_id
WHERE oc.status = 'ACTIVE';

-- View: Progresso de Alinhadores
CREATE OR REPLACE VIEW ortho_aligner_progress AS
SELECT 
    otp.id as treatment_plan_id,
    oc.patient_id,
    p.name as patient_name,
    
    -- Arcada Superior
    otp.current_aligner_upper,
    otp.total_aligners_upper,
    CASE 
        WHEN otp.total_aligners_upper > 0 
        THEN ROUND((otp.current_aligner_upper::numeric / otp.total_aligners_upper) * 100, 1)
        ELSE 0 
    END as progress_upper_percent,
    
    -- Arcada Inferior
    otp.current_aligner_lower,
    otp.total_aligners_lower,
    CASE 
        WHEN otp.total_aligners_lower > 0 
        THEN ROUND((otp.current_aligner_lower::numeric / otp.total_aligners_lower) * 100, 1)
        ELSE 0 
    END as progress_lower_percent,
    
    -- Próxima Troca
    otp.next_aligner_change_date,
    CASE 
        WHEN otp.next_aligner_change_date < CURRENT_DATE THEN 'OVERDUE'
        WHEN otp.next_aligner_change_date = CURRENT_DATE THEN 'TODAY'
        WHEN otp.next_aligner_change_date <= CURRENT_DATE + 3 THEN 'SOON'
        ELSE 'SCHEDULED'
    END as change_status

FROM ortho_treatment_plans otp
JOIN ortho_contracts oc ON oc.id = otp.contract_id
JOIN patients p ON p.id = oc.patient_id
WHERE oc.contract_type = 'ALIGNERS'
AND oc.status = 'ACTIVE';

-- =====================================================
-- 6. TRIGGERS E AUTOMAÇÕES
-- =====================================================

-- Trigger: Atualizar data de próxima troca de alinhador
CREATE OR REPLACE FUNCTION update_next_aligner_change_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_aligner_upper > OLD.current_aligner_upper 
    OR NEW.current_aligner_lower > OLD.current_aligner_lower THEN
        NEW.last_aligner_change_date := CURRENT_DATE;
        NEW.next_aligner_change_date := CURRENT_DATE + NEW.change_frequency_days;
    END IF;
    
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_next_aligner_change
    BEFORE UPDATE OF current_aligner_upper, current_aligner_lower
    ON ortho_treatment_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_next_aligner_change_date();

-- Trigger: Suspender contrato se inadimplente
CREATE OR REPLACE FUNCTION check_ortho_contract_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    overdue_days integer;
    contract_rec RECORD;
BEGIN
    -- Buscar contrato do paciente
    SELECT * INTO contract_rec
    FROM ortho_contracts
    WHERE patient_id = NEW.patient_id
    AND status = 'ACTIVE'
    AND block_scheduling_if_overdue = true
    LIMIT 1;
    
    IF FOUND THEN
        -- Calcular dias de atraso
        SELECT CURRENT_DATE - MIN(fi.due_date) INTO overdue_days
        FROM financial_installments fi
        WHERE fi.patient_id = NEW.patient_id
        AND fi.description LIKE '%Ortodontia%'
        AND fi.status = 'PENDING'
        AND fi.due_date < CURRENT_DATE;
        
        -- Se ultrapassou tolerância, suspender
        IF overdue_days > contract_rec.overdue_tolerance_days THEN
            UPDATE ortho_contracts
            SET status = 'SUSPENDED',
                suspension_reason = 'Inadimplência - ' || overdue_days || ' dias de atraso',
                suspended_at = now()
            WHERE id = contract_rec.id;
            
            RAISE NOTICE 'Contrato ortodôntico suspenso por inadimplência: % dias', overdue_days;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_ortho_payment_status
    AFTER INSERT OR UPDATE ON financial_installments
    FOR EACH ROW
    EXECUTE FUNCTION check_ortho_contract_payment_status();

-- =====================================================
-- 7. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE ortho_contracts IS 'Contratos de ortodontia (modelo de assinatura/recorrência)';
COMMENT ON TABLE ortho_treatment_plans IS 'Planos de tratamento ortodôntico com controle de alinhadores e fases';
COMMENT ON TABLE ortho_appointments IS 'Evolução clínica estruturada de consultas ortodônticas';
COMMENT ON TABLE ortho_aligner_stock IS 'Controle logístico de estoque de alinhadores';

COMMENT ON COLUMN ortho_contracts.down_payment IS 'Valor da entrada/setup pago na adesão';
COMMENT ON COLUMN ortho_contracts.monthly_payment IS 'Valor da mensalidade/manutenção';
COMMENT ON COLUMN ortho_contracts.block_scheduling_if_overdue IS 'Bloqueia agendamento se inadimplente';

COMMENT ON COLUMN ortho_treatment_plans.current_aligner_upper IS 'Alinhador atual em uso (arcada superior)';
COMMENT ON COLUMN ortho_treatment_plans.total_aligners_upper IS 'Total de alinhadores planejados (arcada superior)';

COMMENT ON COLUMN ortho_appointments.hygiene_score IS 'Nota de higiene bucal (1=Péssima, 5=Excelente)';
COMMENT ON COLUMN ortho_appointments.compliance_score IS 'Nota de colaboração (uso de elásticos, troca de alinhadores)';

-- =====================================================
-- FIM DA MIGRATION 008
-- =====================================================
