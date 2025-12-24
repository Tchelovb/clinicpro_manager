-- =====================================================
-- PROFESSIONAL FEES & PAYMENT TRACKING (FINAL FIX V3)
-- =====================================================

-- 1. UNIFY TABLE STRUCTURE
-- Add ENUM type for fee_type if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fee_type_enum') THEN
        CREATE TYPE fee_type_enum AS ENUM ('FIXED', 'PERCENTAGE');
    END IF;
END $$;

-- Add fee_type column (ENUM) if missing
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_procedure_fees' AND column_name = 'fee_type') THEN
    ALTER TABLE public.professional_procedure_fees ADD COLUMN fee_type fee_type_enum DEFAULT 'FIXED' NOT NULL;
END IF;

-- Add fee_value column if missing and migrate old data
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_procedure_fees' AND column_name = 'fee_value') THEN
    ALTER TABLE public.professional_procedure_fees ADD COLUMN fee_value NUMERIC(10,2) DEFAULT 0;
    -- Migrate from fixed_fee_amount if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_procedure_fees' AND column_name = 'fixed_fee_amount') THEN
        UPDATE public.professional_procedure_fees
        SET fee_value = fixed_fee_amount
        WHERE fee_value = 0 AND fixed_fee_amount > 0;
    END IF;
END IF;

-- Drop deprecated column fixed_fee_amount if it exists
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_procedure_fees' AND column_name = 'fixed_fee_amount') THEN
    ALTER TABLE public.professional_procedure_fees DROP COLUMN fixed_fee_amount;
END IF;

-- Ensure unique constraint on professional_id + procedure_id
IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'professional_procedure_fees_prof_proc_key') THEN
    ALTER TABLE public.professional_procedure_fees ADD CONSTRAINT professional_procedure_fees_prof_proc_key UNIQUE(professional_id, procedure_id);
END IF;

-- 2. PAYMENT CONTROL PER TREATMENT ITEM
ALTER TABLE public.treatment_items
ADD COLUMN IF NOT EXISTS professional_payment_id UUID REFERENCES public.commission_payments(id),
ADD COLUMN IF NOT EXISTS professional_payment_status TEXT DEFAULT 'PENDING' CHECK (professional_payment_status IN ('PENDING', 'PROCESSING', 'PAID'));

-- Index for pending payments
CREATE INDEX IF NOT EXISTS idx_treatment_items_payment_status 
ON public.treatment_items(professional_payment_status) 
WHERE professional_payment_status = 'PENDING';

-- 3. VIEW FOR PENDING PROFESSIONAL PRODUCTION
CREATE OR REPLACE VIEW public.view_professional_production_pending AS
SELECT 
    ti.id AS item_id,
    b.clinic_id,
    ti.budget_id,
    b.patient_id,
    p.name AS patient_name,
    ti.procedure_name,
    COALESCE(proc.id, ti.id) AS procedure_id,
    COALESCE(ti.doctor_id, u.id) AS professional_id,
    COALESCE(prof_real.name, u.name, 'Profissional') AS professional_name,
    COALESCE(ti.execution_date, ti.created_at) AS production_date,
    1 AS quantity,
    ti.total_value AS total_charged,
    -- Commission calculation based on fee_type/value
    COALESCE(
        CASE 
            WHEN ppf.fee_type = 'FIXED' THEN ppf.fee_value 
            WHEN ppf.fee_type = 'PERCENTAGE' THEN (ti.total_value * ppf.fee_value / 100)
        END,
        proc.commission_base_value,
        0
    ) AS unit_commission_value,
    (COALESCE(
        CASE 
            WHEN ppf.fee_type = 'FIXED' THEN ppf.fee_value 
            WHEN ppf.fee_type = 'PERCENTAGE' THEN (ti.total_value * ppf.fee_value / 100)
        END,
        proc.commission_base_value,
        0
    )) AS total_commission_value
FROM public.treatment_items ti
JOIN public.budgets b ON ti.budget_id = b.id
JOIN public.patients p ON b.patient_id = p.id
LEFT JOIN public.procedure proc ON ti.procedure_name = proc.name AND proc.clinic_id = b.clinic_id
LEFT JOIN public.users u ON ti.doctor_id = u.id
LEFT JOIN public.professionals prof_real ON u.professional_id = prof_real.id
LEFT JOIN public.professional_procedure_fees ppf ON proc.id = ppf.procedure_id AND prof_real.id = ppf.professional_id
WHERE 
    ti.status = 'COMPLETED' 
    AND ti.professional_payment_status = 'PENDING' 
    AND ti.execution_date IS NOT NULL;
