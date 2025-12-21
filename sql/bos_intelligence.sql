-- ==============================================================================
-- STRATEGIC BOS GENERATION ENGINE (5 PILLARS)
-- Versão: 7.0 (Comercial, Operacional, Financeiro, Marketing, Produção)
-- ==============================================================================

-- 0. Tabela de Insights (Inteligência)
DROP TABLE IF EXISTS public.ai_insights;
CREATE TABLE public.ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID,
    category TEXT NOT NULL, -- 'COMERCIAL', 'FINANCEIRO', 'OPERACIONAL', etc
    title TEXT NOT NULL,
    explanation TEXT,
    priority TEXT CHECK (priority IN ('high', 'medium', 'low', 'critico')),
    action_label TEXT,
    action_type TEXT, -- 'open_whatsapp', 'open_url', 'confirm_appointment'
    related_entity_id UUID,
    status TEXT DEFAULT 'open', -- 'open', 'resolved', 'dismissed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Definição da Função de Geração de Insights
CREATE OR REPLACE FUNCTION generate_bos_insights() 
RETURNS void AS $$
DECLARE
    v_clinic_id uuid;
    v_today date := current_date;
    v_high_ticket_threshold numeric := 15000; -- R$ 15k
    v_stalled_days integer := 3;
    r RECORD;
BEGIN
    -- Assume clinic_id do primeiro usuário admin ou fixo (ajustar conforme tenant)
    SELECT id INTO v_clinic_id FROM public.clinics LIMIT 1;

    -- Limpa insights antigos resolvidos ou expirados (opcional, aqui mantemos histórico limpo se status != 'open')
    -- DELETE FROM public.ai_insights WHERE status = 'resolved' AND created_at < now() - interval '7 days';

    -- ==============================================================================
    -- 🚀 1. PILAR COMERCIAL: ESTAGNAÇÃO HIGH-TICKET
    -- "Dinheiro na Mesa": Orçamentos > 15k parados há > 3 dias.
    -- ==============================================================================
    FOR r IN (
        SELECT 
            b.id::text as id, b.patient_id, p.name as patient_name, b.total_value, b.updated_at
        FROM public.budgets b
        JOIN public.patients p ON b.patient_id = p.id
        WHERE b.status = 'DRAFT' -- Ou 'Em Análise'
          AND b.total_value >= v_high_ticket_threshold
          AND b.updated_at < (now() - (v_stalled_days || ' days')::interval)
          AND NOT EXISTS ( -- Evita duplicatas ativas
              SELECT 1 FROM public.ai_insights ai 
              WHERE ai.related_entity_id = b.id::uuid AND ai.category = 'COMERCIAL' AND ai.status = 'open'
          )
    ) LOOP
        INSERT INTO public.ai_insights (
            clinic_id, category, title, explanation, priority, action_label, action_type, related_entity_id, created_at, status
        ) VALUES (
            v_clinic_id,
            'COMERCIAL',
            'Sinal Vermelho: High-Ticket Estagnado',
            'O paciente ' || r.patient_name || ' tem um orçamento de R$ ' || to_char(r.total_value, 'FM999G999D00') || ' parado sem contato há mais de 3 dias. Risco de esfriamento.',
            'high',
            'Ativar Closer AI (WhatsApp)',
            'open_whatsapp',
            r.id::uuid,
            now(),
            'open'
        );
    END LOOP;

    -- ==============================================================================
    -- 😷 2. PILAR PRODUÇÃO: INADIMPLÊNCIA CLÍNICA
    -- "Trabalhou de Graça?": Tratamento Concluído mas com Saldo Pendente.
    -- ==============================================================================
    FOR r IN (
        SELECT 
            t.id::text as id, t.patient_id, p.name as patient_name, p.phone
        FROM public.treatment_items t -- Assumindo que treatment_items tem status
        JOIN public.patients p ON t.patient_id = p.id
        WHERE t.status::text IN ('Concluído', 'CONCLUDED', 'Completed', 'Finalizado') -- Cast to text to avoid Enum errors
          AND p.balance_due > 0 -- Saldo devedor global do paciente
          AND NOT EXISTS (
              SELECT 1 FROM public.ai_insights ai 
              WHERE ai.related_entity_id = t.id::uuid AND ai.category = 'FINANCEIRO' AND ai.status = 'open'
          )
        LIMIT 5 -- Limita para não spamar
    ) LOOP
        INSERT INTO public.ai_insights (
            clinic_id, category, title, explanation, priority, action_label, action_type, related_entity_id, created_at
        ) VALUES (
            v_clinic_id,
            'FINANCEIRO',
            'Alerta: Procedimento Realizado, Não Pago',
            'O paciente ' || r.patient_name || ' finalizou tratamento mas possui pendência financeira. Risco de inadimplência.',
            'critico',
            'Cobrar Agora',
            'open_financial_record',
            r.id::uuid,
            now()
        );
    END LOOP;

    -- ==============================================================================
    -- 📈 3. PILAR OPERACIONAL: OTIMIZAÇÃO DE CADEIRA (NO-SHOW)
    -- "Cadeira Vazia é Custo": Pacientes agendados para amanhã com risco (sem confirmação ainda ou histórico, simplificado aqui).
    -- ==============================================================================
    -- (Lógica Simplificada: Agendamentos de amanhã ainda pendentes)
    FOR r IN (
        SELECT 
            a.id::text as id, a.patient_id, p.name as patient_name, a.date::time as appt_time
        FROM public.appointments a
        JOIN public.patients p ON a.patient_id = p.id
        WHERE a.date = (v_today + interval '1 day')::date
          AND a.status::text IN ('Pendente', 'PENDING', 'SCHEDULED', 'Agendado') -- Cast to text
          AND NOT EXISTS (
              SELECT 1 FROM public.ai_insights ai 
              WHERE ai.related_entity_id = a.id::uuid AND ai.category = 'OPERACIONAL' AND ai.status = 'open'
          )
    ) LOOP
        INSERT INTO public.ai_insights (
            clinic_id, category, title, explanation, priority, action_label, action_type, related_entity_id, created_at
        ) VALUES (
            v_clinic_id,
            'OPERACIONAL',
            'Risco de No-Show Amanhã',
            'Paciente ' || r.patient_name || ' agendado para amanhã às ' || to_char(r.appt_time, 'HH24:MI') || ' ainda não confirmou.',
            'medium',
            'Confirmar Presença',
            'confirm_appointment',
            r.id::uuid, -- Cast se id for text, assumindo uuid na tabela
            now()
        );
    END LOOP;

END;
$$ LANGUAGE plpgsql;

-- Executa a geração inicial para teste
SELECT generate_bos_insights();
