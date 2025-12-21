-- =====================================================
-- MIGRATION: 007 - SISTEMA DE RECOMPENSAS (REFERRAL)
-- Data: 2024-12-21
-- Descrição: Tabela e automação para recompensas de indicação
-- =====================================================

-- 1. Criar Tabela de Recompensas
CREATE TABLE IF NOT EXISTS public.referral_rewards (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    clinic_id uuid NOT NULL,
    patient_id uuid NOT NULL, -- Quem recebe a recompensa (Indicador)
    referred_patient_id uuid NOT NULL, -- Paciente indicado que gerou a recompensa
    
    reward_type text NOT NULL CHECK (reward_type IN ('CREDIT', 'DISCOUNT', 'GIFT')),
    reward_value numeric(10,2) NOT NULL DEFAULT 0,
    description text,
    
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REDEEMED', 'EXPIRED', 'CANCELED')),
    
    earned_date timestamp with time zone DEFAULT now(),
    redeemed_date timestamp with time zone,
    expiry_date timestamp with time zone,
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),

    CONSTRAINT referral_rewards_pkey PRIMARY KEY (id),
    CONSTRAINT referral_rewards_patient_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
    CONSTRAINT referral_rewards_referred_fkey FOREIGN KEY (referred_patient_id) REFERENCES public.patients(id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_referral_rewards_patient ON public.referral_rewards(patient_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_clinic ON public.referral_rewards(clinic_id);

-- 2. Trigger Function: Gerar Recompensa Automática
-- Dispara quando um pagamento é confirmado (total_paid aumenta) ou status muda para 'Em Tratamento'
CREATE OR REPLACE FUNCTION public.check_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
    referrer_id uuid;
    existing_reward uuid;
    min_value_for_reward numeric := 500.00; -- Valor mínimo gasto pelo indicado para gerar recompensa
    reward_amount numeric := 50.00; -- Valor da recompensa (R$ 50)
BEGIN
    -- Verificar se paciente foi indicado (tem indication_patient_id)
    IF NEW.indication_patient_id IS NOT NULL THEN
        referrer_id := NEW.indication_patient_id;
        
        -- Verificar se atingiu o gatilho (total_paid >= 500)
        -- E se ainda não gerou recompensa para este par (paciente, indicado)
        IF NEW.total_paid >= min_value_for_reward THEN
            
            SELECT id INTO existing_reward 
            FROM public.referral_rewards 
            WHERE patient_id = referrer_id AND referred_patient_id = NEW.id;
            
            IF existing_reward IS NULL THEN
                -- Criar Recompensa!
                INSERT INTO public.referral_rewards (
                    clinic_id,
                    patient_id,
                    referred_patient_id,
                    reward_type,
                    reward_value,
                    description,
                    status,
                    expiry_date
                ) VALUES (
                    NEW.clinic_id,
                    referrer_id,
                    NEW.id,
                    'CREDIT',
                    reward_amount,
                    'Bônus por indicação de ' || NEW.name,
                    'PENDING',
                    now() + interval '90 days' -- Validade 90 dias
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger
DROP TRIGGER IF EXISTS trg_check_referral_reward ON public.patients;
CREATE TRIGGER trg_check_referral_reward
    AFTER UPDATE OF total_paid ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION public.check_referral_reward();

-- 4. View para Saldo de Recompensas
CREATE OR REPLACE VIEW public.patient_rewards_balance AS
SELECT 
    patient_id,
    SUM(reward_value) FILTER (WHERE status = 'PENDING') as pending_balance,
    SUM(reward_value) FILTER (WHERE status = 'REDEEMED') as redeemed_total,
    COUNT(id) as total_rewards_earned
FROM public.referral_rewards
GROUP BY patient_id;
